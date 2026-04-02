const express = require("express");
const router = express.Router();

const supabase = require("../supabaseClient");

router.post("/:aadhar_no", async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { aadhar_no } = req.body;

    if (!aadhar_no) {
      return res.status(400).json({
        success: false,
        error: "aadhar_no is required",
      });
    }

    console.log("\n==============================");
    console.log("[BENEFICIARY GET] Request Received");
    console.log("Aadhaar:", aadhar_no);
    console.log("==============================");

    // -------------------------------
    // 1️⃣ Fetch basic beneficiary data
    // -------------------------------
    const { data: benData, error: benErr } = await supabase
      .from("beneficiary")
      .select(`
        full_name,
        age,
        gender,
        phone_no,
        address,
        income_yearly,
        state,
        district,
        occupation,
        registration_date
      `)
      .eq("aadhar_no", aadhar_no.trim())
      .single();

    console.log("\n[BENEFICIARY GET] Supabase Beneficiary Response:");
    console.log("Error:", benErr);
    console.log("Data Returned:", benData);

    if (benErr || !benData) {
      console.error("[BENEFICIARY GET] Beneficiary Not Found");
      return res.status(404).json({
        success: false,
        error: "Beneficiary not found",
      });
    }

    // ----------------------------------
    // 2️⃣ Fetch region from eligibility table
    // ----------------------------------
    const { data: regionData, error: regionErr } = await supabase
      .from("eligible_beneficiary")
      .select("region")
      .eq("aadhar_no", aadhar_no.trim())
      .maybeSingle();

    console.log("\n[BENEFICIARY GET] Supabase Region Response:");
    console.log("Error:", regionErr);
    console.log("Data Returned:", regionData);

    // If region not found log it
    if (!regionData || !regionData.region) {
      console.log("[BENEFICIARY GET] Region NOT FOUND for this Aadhaar");
    } else {
      console.log("[BENEFICIARY GET] Region Found:", regionData.region);
    }

    // ----------------------------------
    // 3️⃣ Merge both results cleanly
    // ----------------------------------
    const finalResponse = {
      ...benData,
      region: regionData?.region || null, // null if not found
    };

    console.log("\n[BENEFICIARY GET] FINAL RESPONSE SENT TO CLIENT:");
    console.log(finalResponse);
    console.log("==============================================\n");

    res.json({
      success: true,
      beneficiary: finalResponse,
    });

  } catch (err) {
    console.error("[BENEFICIARY GET] Server Error:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.put("/status", async (req, res) => {
  try {
    const {
      loan_application_id,
      aadhaar_no,
      mgnrega,
      pm_ujjwala_yojana,
      pm_jay,
      enrolled_in_pension_scheme,
    } = req.body;

    // Update using Supabase
    const { data, error } = await supabase
      .from("beneficiary_status")
      .update({
        mgnrega,
        pm_ujjwala_yojana,
        pm_jay,
        enrolled_in_pension_scheme,
      })
      .eq("loan_application_id", loan_application_id)
      .eq("aadhaar_no", aadhaar_no)
      .select()
      .maybeSingle(); // ensures it returns exactly one row

    if (error) {
      console.log("Supabase Error:", error);
      return res.status(500).json({ message: "Supabase error", error });
    }

    if (!data) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({
      message: "Beneficiary status updated successfully",
      data,
    });

  } catch (error) {
    console.log("Server Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
