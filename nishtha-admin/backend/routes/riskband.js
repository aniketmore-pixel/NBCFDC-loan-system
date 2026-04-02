const axios = require("axios");
const express = require("express");
const router = express.Router();


function mapToModel(input, previousLoans = []) {
    const appliedDate = new Date(input.track_application.applied_on || new Date());
    const today = new Date();

    // Calculate repayments
    const diffMonths =
        (today.getFullYear() - appliedDate.getFullYear()) * 12 +
        (today.getMonth() - appliedDate.getMonth());
    const repayments_made = diffMonths > 0 ? diffMonths : 0;

    const loanAmountSanctioned = Number(input.track_application.loan_amount_applied) || Math.floor(Math.random() * 50000) + 10000;
    const loanAmountDisbursed = Number(input.track_application.loan_amount_approved) || Math.floor(Math.random() * loanAmountSanctioned);

    const emi = input.apply_for_loan?.emi_amount || Math.floor(loanAmountDisbursed / (input.track_application.tenure_applied || 12));
    const totalAmountRepaid = emi * repayments_made;

    const previousLoansCount = previousLoans.length;
    const repeatBorrowerFlag = previousLoansCount > 0 ? 1 : 0;

    // Electricity and Water derived
    const totalBills =
        (input.electricity_bill?.elec_total_bills || Math.floor(Math.random() * 3) + 1) +
        (input.water_bill?.water_total_bills_3m || Math.floor(Math.random() * 3) + 1);

    const onTimeBills =
        (input.electricity_bill?.elec_on_time_bills_3m || Math.floor(Math.random() * 3)) +
        (input.water_bill?.water_on_time_bills_3m || Math.floor(Math.random() * 3));

    const utilOnTimeRatio = totalBills > 0 ? (onTimeBills / totalBills) : 0;

    const avgDelay =
        ((input.electricity_bill?.elec_total_delay_days_3m || Math.floor(Math.random() * 5)) +
            (input.water_bill?.water_total_delay_days_3m || Math.floor(Math.random() * 5))) / 2;

    const maxDelay = Math.max(
        input.electricity_bill?.elec_max_delay_days_3m || Math.floor(Math.random() * 5),
        input.water_bill?.water_max_delay_days_3m || Math.floor(Math.random() * 5)
    );

    const outstanding =
        (input.electricity_bill?.elec_outstanding_amount_current || Math.floor(Math.random() * 500)) +
        (input.water_bill?.water_outstanding_amt_current || Math.floor(Math.random() * 1000));

    return {
        loan_amount_sanctioned: loanAmountSanctioned,
        loan_amount_disbursed: loanAmountDisbursed,
        loan_tenure_months: input.track_application.tenure_approved || (input.track_application.tenure_applied || Math.floor(Math.random() * 60) + 12),
        interest_rate: input.apply_for_loan?.interest_rate || (Math.random() * 5 + 10).toFixed(2), // 10-15%
        emi_amount: emi,
        repayments_made,
        total_amount_repaid: totalAmountRepaid,

        dpd_days: Math.floor(Math.random() * 6), // 0-5
        default_flag: Math.round(Math.random()),  // 0 or 1
        npa_status: Math.round(Math.random()),    // 0 or 1

        repeat_borrower_flag: repeatBorrowerFlag,
        previous_loans_count: previousLoansCount,
        previous_defaults_count: Math.floor(Math.random() * 3),

        loan_utilization_match_flag: input.apply_for_loan?.purpose_of_loan ? 1 : 0,
        cashflow_seasonality_score: Math.floor(Math.random() * 6), // 0-5
        inventory_purchase_ratio: Math.random().toFixed(2),        // 0.00 - 1.00
        business_monthly_revenue: input.income_asset?.monthly_income || Math.floor(Math.random() * 50000) + 5000,
        business_operational_years: Math.floor(Math.random() * 10) + 1,

        util_on_time_ratio: utilOnTimeRatio,
        util_avg_delay_days: avgDelay,
        util_max_delay_days: maxDelay,
        util_total_outstanding_12m: outstanding,
        util_any_outstanding_flag: outstanding > 0 ? 1 : 0
    };
}


async function generateRiskBand(supabase, loanId) {
    try {
        // 1️⃣ Get Aadhaar using loanId
        const { data: aadharRow } = await supabase
            .from("track_application")
            .select("aadhar_no")
            .eq("loan_application_id", loanId)
            .single();

        if (!aadharRow) return { error: "Aadhaar not found" };
        const aadhar = aadharRow.aadhar_no;

        // 2️⃣ Fetch Previous Loans
        const { data: previousLoans } = await supabase
            .from("track_application")
            .select("*")
            .eq("aadhar_no", aadhar);

        // 3️⃣ Fetch merged loan structure from your API itself
        const allDataResponse = await axios.get(
            `http://localhost:3000/loan/${loanId}`
        );

        const fullInput = allDataResponse.data;
        console.log(fullInput);

        // 4️⃣ Map to ML Model Input
        const modelInput = mapToModel(fullInput, previousLoans || []);
        console.log(modelInput);

        // 5️⃣ Hit ML API in SAME ORDER
        const mlResponse = await axios.post("http://127.0.0.1:8001/predict", {
            loan_amount_sanctioned: modelInput.loan_amount_sanctioned,
            loan_amount_disbursed: modelInput.loan_amount_disbursed,
            loan_tenure_months: modelInput.loan_tenure_months,
            interest_rate: modelInput.interest_rate,
            emi_amount: modelInput.emi_amount,
            repayments_made: modelInput.repayments_made,
            total_amount_repaid: modelInput.total_amount_repaid,
            dpd_days: modelInput.dpd_days,
            default_flag: modelInput.default_flag,
            npa_status: modelInput.npa_status,
            repeat_borrower_flag: modelInput.repeat_borrower_flag,
            previous_loans_count: modelInput.previous_loans_count,
            previous_defaults_count: modelInput.previous_defaults_count,
            loan_utilization_match_flag: modelInput.loan_utilization_match_flag,
            cashflow_seasonality_score: modelInput.cashflow_seasonality_score,
            inventory_purchase_ratio: modelInput.inventory_purchase_ratio,
            business_monthly_revenue: modelInput.business_monthly_revenue,
            business_operational_years: modelInput.business_operational_years,
            util_on_time_ratio: modelInput.util_on_time_ratio,
            util_avg_delay_days: modelInput.util_avg_delay_days,
            util_max_delay_days: modelInput.util_max_delay_days,
            util_total_outstanding_12m: modelInput.util_total_outstanding_12m,
            util_any_outstanding_flag: modelInput.util_any_outstanding_flag,
        });

        return {
            risk_band: mlResponse.data?.risk_label || "UNKNOWN",
            score: mlResponse.data?.probability || null,
            class_index: mlResponse.data?.class_index || null,
            modelInput,
        };

    } catch (err) {
        console.error("RISK BAND ERROR:", err);
        return { error: "Failed to generate risk band" };
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

        const result = await generateRiskBand(supabase, loanId);

        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        return res.json({
            success: true,
            risk_band: result.risk_band,
            score: result.score,
            model_input: result.modelInput,
        });

    } catch (err) {
        console.error("RISK BAND ROUTER ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
