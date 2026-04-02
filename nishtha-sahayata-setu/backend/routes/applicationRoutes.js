const express = require("express");
const supabase = require("../supabaseClient.js");

const router = express.Router();

/* ============================================================
   Generate Unique Loan Application ID (4 letters + 6 digits)
=============================================================== */
function generateLoanApplicationId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let prefix = "";

  for (let i = 0; i < 4; i++) {
    prefix += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  const numericPart = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");

  return prefix + numericPart;
}

async function generateUniqueLoanApplicationId() {
  const MAX_ATTEMPTS = 10;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const candidate = generateLoanApplicationId();

    const { data } = await supabase
      .from("track_application")
      .select("loan_application_id")
      .eq("loan_application_id", candidate)
      .maybeSingle();

    if (!data) return candidate; // Unique
  }

  throw new Error("Unable to generate a unique loan_application_id");
}

/* ============================================================
   GET existing applications by Aadhaar
=============================================================== */
router.get("/applications/:aadhar_no", async (req, res) => {
  const { aadhar_no } = req.params;

  if (!aadhar_no || aadhar_no.length !== 12) {
    return res.status(400).json({
      success: false,
      message: "Aadhaar Number must be 12 digits",
    });
  }

  try {
    const { data, error } = await supabase
      .from("track_application")
      .select("*")
      .eq("aadhar_no", aadhar_no)
      .order("applied_on", { ascending: false });

    if (error)
      return res.status(500).json({ success: false, message: "Database error" });

    if (!data || data.length === 0)
      return res.status(404).json({
        success: false,
        message: "No applications found",
      });

    return res.json({ success: true, applications: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   CREATE NEW APPLICATION — INSERT INTO ALL TABLES
=============================================================== */
router.post("/applications/apply", async (req, res) => {
  const { aadhar_no, scheme } = req.body;

  if (!aadhar_no || !scheme) {
    return res.status(400).json({
      success: false,
      message: "aadhar_no and scheme are required",
    });
  }

  if (String(aadhar_no).length !== 12) {
    return res.status(400).json({
      success: false,
      message: "Aadhaar must be exactly 12 digits",
    });
  }

  try {
    const loan_application_id = await generateUniqueLoanApplicationId();

    /* -----------------------------
       1️⃣ Insert → track_application
    ------------------------------ */
    const { data: trackApp, error: trackErr } = await supabase
      .from("track_application")
      .insert([
        {
          loan_application_id,
          aadhar_no,
          scheme,
          status: null,
          final_accept_by_user: null,
        },
      ])
      .select()
      .single();

    if (trackErr) {
      console.error("❌ track_application error:", trackErr);
      return res.status(500).json({
        success: false,
        message: "Failed to create main application",
      });
    }

    /* -----------------------------
   Insert → income_asset
------------------------------ */
const { error: incomeErr } = await supabase
  .from("income_asset")
  .insert([
    {
      loan_application_id,
      aadhar_no,
      primary_income_source: "NA",     // required field, cannot be null
      monthly_income: null,
      annual_income: null,
      asset_count: 0,
      estimated_asset_value: null
    }
  ]);

if (incomeErr) {
  console.error("❌ income_asset error:", incomeErr);
}


    /* -----------------------------
       2️⃣ Insert → apply_for_loan
    ------------------------------ */
    const { error: applyErr } = await supabase
      .from("apply_for_loan")
      .insert([{ loan_application_id, aadhaar_no: aadhar_no }]);

    if (applyErr) console.error("❌ apply_for_loan:", applyErr);

    /* -----------------------------
       3️⃣ Insert → loan_applications
    ------------------------------ */
    const { error: loanErr } = await supabase
      .from("loan_applications")
      .insert([{ loan_application_id, aadhaar_no: aadhar_no }]);

    if (loanErr) console.error("❌ loan_applications:", loanErr);

    /* -----------------------------
       4️⃣ Insert → beneficiary_status
    ------------------------------ */
    const { error: benErr } = await supabase
      .from("beneficiary_status")
      .insert([
        {
          loan_application_id,
          aadhaar_no: aadhar_no,
          mgnrega: false,
          pm_ujjwala_yojana: false,
          pm_jay: false,
          enrolled_in_pension_scheme: false,
        },
      ]);

    if (benErr) console.error("❌ beneficiary_status:", benErr);

    /* -----------------------------
       5️⃣ Insert → expenses_and_comodities
       NOTE: column name is aadhar_no
    ------------------------------ */
    const { error: expErr } = await supabase
      .from("expenses_and_comodities")
      .insert([{ loan_application_id, aadhar_no }]);

    if (expErr) console.error("❌ expenses_and_comodities:", expErr);

    /* -----------------------------
       6️⃣ Insert → bank_details
       Requires NOT NULL fields, so insert placeholders
    ------------------------------ */
    const { error: bankErr } = await supabase.from("bank_details").insert([
      {
        loan_application_id,
        aadhaar_no: aadhar_no,
        account_holder_name: "NA",
        bank_name: "NA",
        account_no: "0",
        ifsc_code: "NA000000000",
        branch_name: "NA",
        upi_id: "NA",
      },
    ]);

    if (bankErr) console.error("❌ bank_details:", bankErr);

    /* -----------------------------
       SUCCESS RESPONSE
    ------------------------------ */
    return res.status(201).json({
      success: true,
      message: "Application created successfully",
      application: trackApp,
    });
  } catch (err) {
    console.error("🔥 INTERNAL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ============================================================
   Accept / Reject Offer
=============================================================== */
router.post("/applications/offer-decision", async (req, res) => {
  const { loan_application_id, decision } = req.body;

  if (!loan_application_id || !decision) {
    return res.status(400).json({
      success: false,
      message: "loan_application_id and decision required",
    });
  }

  const normalized = decision.toLowerCase().trim();
  const finalAccept = normalized === "accepted" ? true : normalized === "rejected" ? false : null;

  if (finalAccept === null) {
    return res.status(400).json({
      success: false,
      message: "decision must be Accepted or Rejected",
    });
  }

  try {
    const { data: existing } = await supabase
      .from("track_application")
      .select("status, final_accept_by_user")
      .eq("loan_application_id", loan_application_id)
      .maybeSingle();

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (existing.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Only approved applications can be accepted/rejected",
      });
    }

    if (existing.final_accept_by_user !== null) {
      return res.status(409).json({
        success: false,
        message: "Decision already submitted",
      });
    }

    const { data, error } = await supabase
      .from("track_application")
      .update({ final_accept_by_user: finalAccept })
      .eq("loan_application_id", loan_application_id)
      .select();

    if (error)
      return res.status(500).json({
        success: false,
        message: "Database update error",
      });

    return res.json({
      success: true,
      message: `Offer ${finalAccept ? "Accepted" : "Rejected"} successfully`,
      updated: data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
