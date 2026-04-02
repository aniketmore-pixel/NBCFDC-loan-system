const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// POST /api/mobile/verify
router.post("/verify", async (req, res) => {
  try {
    const {
      loan_application_id,
      aadhar_no,
      mobile_recharge_amt_avg,
      mobile_recharge_freq_pm,
      provider
    } = req.body;

    if (!loan_application_id) {
      return res.status(400).json({ success: false, msg: "Missing loan_application_id" });
    }

    // Step 1: Fetch stored record
    const { data: stored, error } = await supabase
      .from("mobile_bill")
      .select("*")
      .eq("aadhar_no", aadhar_no)
      .single();

    if (error || !stored) {
      return res.status(404).json({
        success: false,
        msg: "No mobile bill data found for this Aadhaar"
      });
    }

    // Step 2: Compare values
    const isMatch =
      Number(stored.mobile_recharge_amt_avg) === Number(mobile_recharge_amt_avg) &&
      Number(stored.mobile_recharge_freq_pm) === Number(mobile_recharge_freq_pm) &&
      stored.provider.toLowerCase() === provider.toLowerCase();

    const newFlag = isMatch ? 0 : 1;

    // Step 3: Update flag
    await supabase
      .from("mobile_bill")
      .update({ flag: newFlag })
      .eq("aadhar_no", aadhar_no);

    // Step 4: Update expenses_and_comodities table
    const { error: updateError } = await supabase
      .from("expenses_and_comodities")
      .update({
        user_provider_avg_recharge_amount: mobile_recharge_amt_avg,
        user_provider_avg_recharge_frequency: mobile_recharge_freq_pm,
        user_provider_name: provider,
        api_provider_avg_recharge_amount: stored.mobile_recharge_amt_avg,
        api_provider_avg_recharge_frequency: stored.mobile_recharge_freq_pm,
        api_provider_name: stored.provider,
      })
      .eq("loan_application_id", loan_application_id)
      .eq("aadhar_no", aadhar_no);

    if (updateError) {
      console.error("Error updating expenses_and_comodities:", updateError);
    }

    return res.json({
      success: true,
      match: isMatch,
      flag: newFlag,
    });

  } catch (err) {
    console.error("Error verifying mobile:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error during mobile verification"
    });
  }
});

module.exports = router;
