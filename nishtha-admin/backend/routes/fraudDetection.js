const axios = require("axios");
const express = require("express");
const router = express.Router();

function mapToFraudModel(input) {
    // Geo-location mismatch: Check if state/district are consistent
    const geoLocationMismatchFlag =
        (!input.beneficiary?.state || !input.beneficiary?.district) ? 1 : 0;

    // Sudden consumption drop: Check electricity bill flag
    const suddenConsumptionDropFlag =
        input.electricity_bill?.flag === 1 ? 1 : 0;

    // Electricity mismatch: Compare user input vs actual bill data
    const electricityMismatchFlag =
        (input.expenses_and_comodities?.elec_account_no &&
            input.electricity_bill?.elec_account_no &&
            input.expenses_and_comodities.elec_account_no !== input.electricity_bill.elec_account_no) ? 1 : 0;

    // Recharge mismatch: Compare user-provided vs API provider data
    const rechargeMismatchFlag =
        (input.expenses_and_comodities?.user_provider_avg_recharge_amount &&
            input.expenses_and_comodities?.api_provider_avg_recharge_amount &&
            Math.abs(input.expenses_and_comodities.user_provider_avg_recharge_amount -
                input.expenses_and_comodities.api_provider_avg_recharge_amount) > 500) ? 1 : 0;

    // Household data mismatch: Check if household size matches earners + dependents
    const householdDataMismatchFlag =
        (input.ration_card?.household_size !==
            (input.ration_card?.earners_cnt || 0) + (input.ration_card?.dependents_cnt || 0)) ? 1 : 0;

    // Ration category mismatch: Check income vs ration card category
    const rationCategoryMismatch =
        (input.ration_card?.ration_card_category === "APL" &&
            input.income_asset?.annual_income < 100000) ? 1 :
            (input.ration_card?.ration_card_category === "BPL" &&
                input.income_asset?.annual_income > 200000) ? 1 : 0;

    // Bill manipulation: Check for unusual patterns
    const billManipulationFlag =
        (input.electricity_bill?.elec_total_bills < 2 ||
            input.water_bill?.water_total_bills_3m < 2) ? 1 : 0;

    // Unusual submission time: Check if application timing is suspicious
    const appliedDate = new Date(input.track_application?.applied_on || new Date());
    const hour = appliedDate.getHours();
    const unusualSubmissionTimeFlag = (hour >= 0 && hour <= 5) ? 1 : 0;

    // Field edits: Count missing or null critical fields
    const criticalFields = [
        input.beneficiary?.full_name,
        input.beneficiary?.phone_no,
        input.beneficiary?.address,
        input.bank_details?.account_no,
        input.bank_details?.ifsc_code,
        input.ration_card?.ration_card_no
    ];
    const fieldEdits = criticalFields.filter(field => !field || field === "NA" || field === "0").length;

    // Form completion time: Estimate based on data completeness (placeholder)
    const formCompletionTime = 0; // Would need actual tracking

    // Mobile number linked accounts: Check for potential multiple accounts
    const mobileNumberLinkedAccounts = 0; // Would need database query

    // Aadhaar linked accounts
    const aadhaarLinkedAccounts = 0; // Would need database query

    // Electricity disconnection flag
    const elecAnyDisconnectionFlag =
        input.electricity_bill?.elec_outstanding_amount_current > 1000 ? 1 : 0;

    // Outstanding amounts
    const elecOutstandingAmountCurrent =
        input.electricity_bill?.elec_outstanding_amount_current || 0;

    // Total delay days
    const elecTotalDelayDays12m =
        (input.electricity_bill?.elec_total_delay_days_3m || 0) * 4; // Extrapolate to 12 months

    // On-time bills
    const elecOnTimeBills12m =
        (input.electricity_bill?.elec_on_time_bills_3m || 0) * 4;

    // Utility outstanding flag
    const utilAnyOutstandingFlag =
        (elecOutstandingAmountCurrent > 0 ||
            (input.water_bill?.water_outstanding_amt_current || 0) > 0) ? 1 : 0;

    // Total utility outstanding
    const utilTotalOutstanding12m =
        elecOutstandingAmountCurrent + (input.water_bill?.water_outstanding_amt_current || 0);

    // Utility on-time ratio
    const totalBills =
        (input.electricity_bill?.elec_total_bills || 0) +
        (input.water_bill?.water_total_bills_3m || 0);
    const onTimeBills =
        (input.electricity_bill?.elec_on_time_bills_3m || 0) +
        (input.water_bill?.water_on_time_bills_3m || 0);
    const utilOnTimeRatio = totalBills > 0 ? (onTimeBills / totalBills) : 0;

    // Data completeness score
    const allFields = [
        input.beneficiary?.full_name,
        input.beneficiary?.phone_no,
        input.beneficiary?.address,
        input.bank_details?.account_no,
        input.ration_card?.ration_card_no,
        input.income_asset?.monthly_income,
        input.electricity_bill?.elec_account_no,
        input.water_bill?.water_total_bills_3m
    ];
    const completedFields = allFields.filter(field =>
        field && field !== "NA" && field !== "0" && field !== null
    ).length;
    const dataCompletenessScore = (completedFields / allFields.length) * 100;

    return {
        geo_location_mismatch_flag: geoLocationMismatchFlag,
        sudden_consumption_drop_flag: suddenConsumptionDropFlag,
        electricity_mismatch_flag: electricityMismatchFlag,
        recharge_mismatch_flag: rechargeMismatchFlag,
        household_data_mismatch_flag: householdDataMismatchFlag,
        ration_category_mismatch: rationCategoryMismatch,
        bill_manipulation_flag: billManipulationFlag,
        unusual_submission_time_flag: unusualSubmissionTimeFlag,
        field_edits: fieldEdits,
        form_completion_time: formCompletionTime,
        mobile_number_linked_accounts: mobileNumberLinkedAccounts,
        aadhaar_linked_accounts: aadhaarLinkedAccounts,
        elec_any_disconnection_flag: elecAnyDisconnectionFlag,
        elec_outstanding_amount_current: elecOutstandingAmountCurrent,
        elec_total_delay_days_12m: elecTotalDelayDays12m,
        elec_on_time_bills_12m: elecOnTimeBills12m,
        util_any_outstanding_flag: utilAnyOutstandingFlag,
        util_total_outstanding_12m: utilTotalOutstanding12m,
        util_on_time_ratio: parseFloat(utilOnTimeRatio.toFixed(2)),
        data_completeness_score: parseFloat(dataCompletenessScore.toFixed(2))
    };
}

async function generateFraudScore(supabase, loanId) {
    try {
        // 1️⃣ Get Aadhaar using loanId
        const { data: aadharRow } = await supabase
            .from("track_application")
            .select("aadhar_no")
            .eq("loan_application_id", loanId)
            .single();

        if (!aadharRow) return { error: "Aadhaar not found" };
        const aadhar = aadharRow.aadhar_no;

        // 2️⃣ Count linked accounts for this phone and Aadhaar
        const { data: phoneRow } = await supabase
            .from("beneficiary")
            .select("phone_no")
            .eq("aadhar_no", aadhar)
            .single();

        let mobileLinkedCount = 0;
        let aadhaarLinkedCount = 0;

        if (phoneRow?.phone_no) {
            const { data: phoneAccounts } = await supabase
                .from("beneficiary")
                .select("aadhar_no")
                .eq("phone_no", phoneRow.phone_no);
            mobileLinkedCount = phoneAccounts?.length || 0;
        }

        const { data: aadhaarAccounts } = await supabase
            .from("beneficiary")
            .select("aadhar_no")
            .eq("aadhar_no", aadhar);
        aadhaarLinkedCount = aadhaarAccounts?.length || 0;

        // 3️⃣ Fetch merged loan structure
        const allDataResponse = await axios.get(
            `http://localhost:3000/loan/${loanId}`
        );

        const fullInput = allDataResponse.data;
        console.log("Full Input:", fullInput);

        // 4️⃣ Map to Fraud Detection Model Input
        const modelInput = mapToFraudModel(fullInput);

        // Update with database counts
        modelInput.mobile_number_linked_accounts = mobileLinkedCount;
        modelInput.aadhaar_linked_accounts = aadhaarLinkedCount;

        console.log("Fraud Model Input:", modelInput);

        // 5️⃣ Hit ML Fraud Detection API
        const mlResponse = await axios.post("http://127.0.0.1:8003/predict", modelInput);

        return {
            fraud_label: mlResponse.data?.risk_level || "UNKNOWN",   // because API sends "risk_level"
            fraud_score: mlResponse.data?.fraud_probability || null, // numeric score
            fraud_class: null,                                       // API does not send this
            modelInput,
        };

    } catch (err) {
        console.error("FRAUD DETECTION ERROR:", err.message);
        return { error: "Failed to generate fraud score" };
    }
}

router.get("/:loanId", async (req, res) => {
    try {
        const { loanId } = req.params;

        if (!loanId) {
            return res.status(400).json({ error: "loanId is required" });
        }

        // supabase instance passed from index.js
        const supabase = req.app.locals.supabase;

        const result = await generateFraudScore(supabase, loanId);

        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        return res.json({
            success: true,
            fraud_label: result.fraud_label,
            fraud_score: result.fraud_score,
            fraud_class: result.fraud_class,
            model_input: result.modelInput,
        });

    } catch (err) {
        console.error("FRAUD DETECTION ROUTER ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;