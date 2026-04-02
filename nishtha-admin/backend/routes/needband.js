const axios = require("axios");
const express = require("express");
const router = express.Router();
function mapToNeedBandModel(input) {
    const rationCard = input.ration_card || {};
    const beneficiaryStatus = input.beneficiary_status || {};
    const incomeAsset = input.income_asset || {};
    const electricityBill = input.electricity_bill || {};
    const expensesCommodities = input.expenses_and_comodities || {};
    const waterBill = input.water_bill || {};

    // Extract values with safe defaults
    let householdSize = rationCard.household_size || 0;
    let dependentsCnt = rationCard.dependents_cnt || 0;
    let earnersCnt = rationCard.earners_cnt || 1; // must be >=1

    // Constraint: earnersCnt must be >= 1
    if (earnersCnt < 1) earnersCnt = 1;

    // Constraint: householdSize must be > earnersCnt
    if (householdSize <= earnersCnt) {
        householdSize = earnersCnt + 1;
    }

    // Dependency ratio = dependents / earners
    const dependencyRatio = dependentsCnt >= 0
        ? Number((dependentsCnt / earnersCnt).toFixed(2))
        : 0;

    const rationCardCategory = rationCard.ration_card_category || "UNKNOWN";

    // Government schemes
    const hasAnyScheme =
        beneficiaryStatus.mgnrega ||
        beneficiaryStatus.pm_ujjwala_yojana ||
        beneficiaryStatus.pm_jay ||
        beneficiaryStatus.enrolled_in_pension_scheme;

    const govtSchemeEligibility = hasAnyScheme ? "YES" : "NO";

    const mgnregaFlag = beneficiaryStatus.mgnrega ? "YES" : "NO";
    const ujjwalaFlag = beneficiaryStatus.pm_ujjwala_yojana ? "YES" : "NO";
    const pmjayFlag = beneficiaryStatus.pm_jay ? "YES" : "NO";
    const pensionFlag = beneficiaryStatus.enrolled_in_pension_scheme ? "YES" : "NO";

    // Assets & Income
    const assetCount = incomeAsset.asset_count || 0;
    const assetValueEstimate = incomeAsset.estimated_asset_value || 0;
    const householdIncome = incomeAsset.monthly_income || 0;

    // Electricity
    const avgBill = electricityBill.elec_avg_bill_amt_3m || 0;
    const avgMonthlyElectricityUnits = avgBill > 0 ? Math.floor(avgBill / 7) : 0;

    // Mobile recharge
    const avgMobileRecharge =
        expensesCommodities.user_provider_avg_recharge_amount ||
        expensesCommodities.api_provider_avg_recharge_amount ||
        0;

    // Water
    const avgMonthlyWaterBill = waterBill.water_outstanding_amt_current || 0;

    // LPG
    const lpgRefills3Month =
        expensesCommodities.user_refills_in_last_3m ||
        expensesCommodities.provider_refills_in_last_3m ||
        0;

    const avgMonthlyGasRefillCost =
        expensesCommodities.user_average_refill_cost ||
        expensesCommodities.provider_average_refill_cost ||
        0;

    const lpgAvgRefillInterval =
        expensesCommodities.user_average_refill_interval_days ||
        expensesCommodities.provider_average_refill_interval_days ||
        0;

    // ------------------------------
    // SECC — ONLY 1 SHOULD BE 1
    // ------------------------------
    const seccArray = [
        rationCardCategory === "BPL",                    // D1
        earnersCnt === 1 && dependentsCnt > 0,           // D2
        !beneficiaryStatus.mgnrega,                      // D3
        assetCount === 0,                                // D4
        avgMobileRecharge < 100,                         // D5
        avgBill < 500,                                   // D6
        dependencyRatio > 0.5                            // D7
    ];

    // Select exactly ONE highest-priority SECC indicator
    let chosenIndex = seccArray.findIndex(v => v === true);
    if (chosenIndex === -1) chosenIndex = 0; // fallback

    const secc = [0, 0, 0, 0, 0, 0, 0];
    secc[chosenIndex] = 1;

    return {
        household_size: householdSize,
        household_dependents_count: dependentsCnt,
        earners_cnt: earnersCnt,
        dependency_ratio: dependencyRatio,
        ration_card_category: rationCardCategory,

        govt_scheme_eligibility_flag: govtSchemeEligibility,
        enrolled_mgnrega_flag: mgnregaFlag,
        enrolled_ujjwala_flag: ujjwalaFlag,
        enrolled_pmjay_flag: pmjayFlag,
        enrolled_pension_flag: pensionFlag,

        asset_count: assetCount,
        asset_value_estimate: assetValueEstimate,
        household_income_self_declared: householdIncome,

        avg_monthly_electricity_units: avgMonthlyElectricityUnits,
        avg_mobile_recharge_amount: avgMobileRecharge,
        avg_monthly_water_bill: avgMonthlyWaterBill,

        avg_monthly_gas_refill_cost: avgMonthlyGasRefillCost,
        lpg_refills_3month: lpgRefills3Month,
        lpg_avg_refill_interval_days: lpgAvgRefillInterval,

        secc_D1: secc[0],
        secc_D2: secc[1],
        secc_D3: secc[2],
        secc_D4: secc[3],
        secc_D5: secc[4],
        secc_D6: secc[5],
        secc_D7: secc[6]
    };
}

async function generateNeedBand(supabase, loanId) {
    try {
        // Fetch merged loan structure from your API
        const allDataResponse = await axios.get(
            `http://localhost:3000/loan/${loanId}`
        );

        const fullInput = allDataResponse.data;
        console.log("Full Input Data:", fullInput);

        // Map to Need Band ML Model Input
        const modelInput = mapToNeedBandModel(fullInput);
        console.log("Need Band Model Input:", modelInput);

        // Hit ML API for Need Band Prediction
        const mlResponse = await axios.post("http://127.0.0.1:8002/predict", {
            household_size: modelInput.household_size,
            household_dependents_count: modelInput.household_dependents_count,
            earners_cnt: modelInput.earners_cnt,
            dependency_ratio: modelInput.dependency_ratio,
            ration_card_category: modelInput.ration_card_category,
            govt_scheme_eligibility_flag: modelInput.govt_scheme_eligibility_flag,
            enrolled_mgnrega_flag: modelInput.enrolled_mgnrega_flag,
            enrolled_ujjwala_flag: modelInput.enrolled_ujjwala_flag,
            enrolled_pmjay_flag: modelInput.enrolled_pmjay_flag,
            enrolled_pension_flag: modelInput.enrolled_pension_flag,
            asset_count: modelInput.asset_count,
            asset_value_estimate: modelInput.asset_value_estimate,
            household_income_self_declared: modelInput.household_income_self_declared,
            avg_monthly_electricity_units: modelInput.avg_monthly_electricity_units,
            avg_mobile_recharge_amount: modelInput.avg_mobile_recharge_amount,
            avg_monthly_water_bill: modelInput.avg_monthly_water_bill,
            avg_monthly_gas_refill_cost: modelInput.avg_monthly_gas_refill_cost,
            lpg_refills_3month: modelInput.lpg_refills_3month,
            lpg_avg_refill_interval_days: modelInput.lpg_avg_refill_interval_days,
            secc_D1: modelInput.secc_D1,
            secc_D2: modelInput.secc_D2,
            secc_D3: modelInput.secc_D3,
            secc_D4: modelInput.secc_D4,
            secc_D5: modelInput.secc_D5,
            secc_D6: modelInput.secc_D6,
            secc_D7: modelInput.secc_D7
        });

        return {
            need_band: mlResponse.data?.prediction || "UNKNOWN",
            modelInput,
        };
    } catch (err) {
        console.error("NEED BAND ERROR:", err.response?.data || err.message);
        return { error: "Failed to generate need band" };
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

        const result = await generateNeedBand(supabase, loanId);

        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        return res.json({
            success: true,
            need_band: result.need_band,
            score: result.score,
            model_input: result.modelInput,
        });

    } catch (err) {
        console.error("NEED BAND ROUTER ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;