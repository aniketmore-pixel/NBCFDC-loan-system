// backend/utils/compareStats.js

const supabase = require("../supabaseClient");

async function compareStats(computed, supabaseData, elecAccountNo, loanApplicationId, aadharNo) {
  console.log("🔍 [compareStats] Starting comparison...");
  console.log("📌 Computed Stats:", computed);
  console.log("📌 Supabase Stats:", supabaseData);

  if (!supabaseData) {
    console.log("❌ [compareStats] No Supabase data found.");
    return { match: false, reason: "No data found in Supabase" };
  }

  const keysToCompare = [
    "elec_total_bills",
    "elec_total_bill_amt_3m",
    "elec_avg_bill_amt_3m",
    "elec_on_time_bills_3m",
    "elec_late_bills_3m",
    "elec_total_delay_days_3m",
    "elec_max_delay_days_3m",
    "elec_outstanding_amount_current",
    "sudden_drop_index",
  ];

  const differences = {};

  keysToCompare.forEach((key) => {
    const comp = computed[key];
    const stored = supabaseData[key];

    console.log(`➡️ Comparing key: "${key}" | Computed: ${comp} | Stored: ${stored}`);

    if (comp !== stored) {
      differences[key] = { computed: comp, stored };
    }
  });

  const mismatchCount = Object.keys(differences).length;
  console.log(`📌 Total mismatches: ${mismatchCount}`);

  const flag = mismatchCount > 3 ? 1 : 0;
  console.log(`🚩 Updating flag for ${elecAccountNo}: ${flag}`);

  const { error } = await supabase
    .from("electricity_bill")
    .update({ flag })
    .eq("elec_account_no", elecAccountNo);

  if (error) {
    console.error("❌ Supabase update error:", error);
  }

  // Update elec_account_no in expenses_and_comodities table
  const { error: expError } = await supabase
    .from("expenses_and_comodities")
    .update({ elec_account_no: elecAccountNo })
    .eq("loan_application_id", loanApplicationId)
    .eq("aadhar_no", aadharNo);

  if (expError) {
    console.error("❌ Supabase update error (expenses_and_comodities):", expError);
  } else {
    console.log(`✅ Updated elec_account_no for loan_application_id: ${loanApplicationId}, aadhar_no: ${aadharNo}`);
  }

  return {
    match: mismatchCount === 0,
    differences,
    flag,
  };
}

module.exports = { compareStats };
