const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// POST /api/lpg/verify
router.post("/verify", async (req, res) => {
  try {
    console.log("\n=================== LPG VERIFY HIT ===================");
    console.log("📥 Incoming body:", req.body);

    const {
      loan_application_id,
      aadhar_no,
      consumer_no,
      lpg_refills_3m,
      lpg_avg_cost,
      lpg_avg_refill_interval_days,
    } = req.body;

    console.log("📝 Parsed Data:", {
      loan_application_id,
      aadhar_no,
      consumer_no,
      lpg_refills_3m,
      lpg_avg_cost,
      lpg_avg_refill_interval_days,
    });

    if (!loan_application_id || !aadhar_no) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        msg: "loan_application_id and aadhar_no are required",
      });
    }

    // 1. Fetch row by consumer_no
    console.log("\n🔍 Fetching LPG Bill for consumer_no:", consumer_no);
    const { data: stored, error } = await supabase
      .from("lpg_bill")
      .select("*")
      .eq("consumer_no", consumer_no)
      .single();

    console.log("📤 Supabase Returned:", { stored, error });

    // If consumer_no not found
    if (stored.aadhar_no !== aadhar_no) {
      console.log("❌ Aadhaar mismatch detected.");
      console.log("   Provided aadhar_no:", aadhar_no);
      console.log("   Provider aadhar_no:", stored.aadhar_no);
      console.log("➡️ Skipping expenses_and_commodities update because mismatch.");
    
      const { error: flagErr } = await supabase
        .from("lpg_bill")
        .update({ flag: 1 })
        .eq("consumer_no", consumer_no);
    
      if (flagErr) console.log("❌ Failed to update LPG bill flag:", flagErr);
      else console.log("✅ LPG bill flag updated to 1");
    
      return res.json({
        success: true,
        match: false,
        flag: 1,
      });
    }
    
    // 2. Check mapping
    console.log("\n🔄 Verifying Aadhaar mapping...");
    if (stored.aadhar_no !== aadhar_no) {
      console.log("❌ Aadhaar mismatch → marking flag = 1");
      await supabase
        .from("lpg_bill")
        .update({ flag: 1 })
        .eq("consumer_no", consumer_no);

      return res.json({
        success: true,
        match: false,
        flag: 1,
      });
    }

    // 3. Matching logic
    console.log("\n📊 Comparing values:");
    console.log("Provider:", stored);
    console.log("User:", {
      lpg_refills_3m,
      lpg_avg_cost,
      lpg_avg_refill_interval_days,
    });

    const refillDiff = Math.abs(stored.lpg_refills_3m - Number(lpg_refills_3m));
    const costDiff = Math.abs(
      Number(stored.lpg_avg_cost) - Number(lpg_avg_cost)
    );
    const intervalDiff = Math.abs(
      stored.lpg_avg_refill_interval_days -
        Number(lpg_avg_refill_interval_days)
    );

    console.log("Differences:", { refillDiff, costDiff, intervalDiff });

    const isMatch =
      refillDiff <= 1 && costDiff <= 150 && intervalDiff <= 10;

    console.log("🔎 Match result:", isMatch);

    const newFlag = isMatch ? 0 : 1;

    console.log("\n📝 Updating LPG Bill flag to:", newFlag);
    await supabase
      .from("lpg_bill")
      .update({ flag: newFlag })
      .eq("consumer_no", consumer_no);

    // 4. Updating expenses_and_comodities
    const updateData = {
      user_lpg_consumer_no: consumer_no,
      user_refills_in_last_3m: Number(lpg_refills_3m),
      user_average_refill_cost: Number(lpg_avg_cost),
      user_average_refill_interval_days: Number(
        lpg_avg_refill_interval_days
      ),
      provider_lpg_consumer_no: stored?.consumer_no || null,
      provider_refills_in_last_3m: stored?.lpg_refills_3m || null,
      provider_average_refill_cost: stored?.lpg_avg_cost || null,
      provider_average_refill_interval_days:
        stored?.lpg_avg_refill_interval_days || null,
    };

    console.log("\n=================================");
    console.log("📌 Updating expenses_and_comodities");
    console.log("➡️ Where loan_application_id =", String(loan_application_id).trim());
    console.log("➡️ And aadhar_no =", String(aadhar_no).trim());
    console.log("➡️ Update data:", updateData);
    console.log("=================================\n");

    const {
      data: expData,
      error: expError,
      status,
      statusText,
    } = await supabase
      .from("expenses_and_comodities")
      .update(updateData)
      .eq("loan_application_id", String(loan_application_id).trim())
      .eq("aadhar_no", String(aadhar_no).trim())
      .select();

    console.log("📤 Supabase Update Response:", {
      expData,
      expError,
      status,
      statusText,
    });

    if (expError) {
      console.error("❌ SUPABASE UPDATE ERROR:", expError);
    }

    if (!expData || expData.length === 0) {
      console.warn("⚠️ NO ROWS WERE UPDATED! CHECK PRIMARY KEYS.");
    } else {
      console.log("✅ expenses_and_comodities updated successfully");
    }

    return res.json({
      success: true,
      match: isMatch,
      flag: newFlag,
    });
  } catch (err) {
    console.error("\n💥 UNHANDLED SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error during LPG verification",
    });
  }
});

module.exports = router;
