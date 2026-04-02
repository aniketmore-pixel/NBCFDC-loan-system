// backend/utils/fetchSupabaseStats.js
const supabase = require('../supabaseClient');

async function getElectricityStats(elec_account_no) {
  console.log("🔍 [fetchSupabaseStats] Fetching stats for account:", elec_account_no);

  const { data, error } = await supabase
    .from('electricity_bill')  // replace if needed
    .select('*')
    .eq('elec_account_no', elec_account_no)
    .limit(1)
    .single();

  if (error) {
    console.error("❌ [fetchSupabaseStats] Supabase fetch error:", error);
    return null;
  }

  console.log("✅ [fetchSupabaseStats] Data received from Supabase:", data);
  return data;
}

module.exports = { getElectricityStats };
