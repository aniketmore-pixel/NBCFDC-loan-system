// backend/routes/loanApprovalRoute.js
const express = require("express");
const supabase = require("../supabaseClient.js");

const router = express.Router();

/* ============================================================
   Helper — Convert string/text → number safely
=============================================================== */
function toNumber(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;

  const num = parseFloat(String(value).replace(/[^\d.-]/g, ""));
  return isNaN(num) ? 0 : num;
}

/* ============================================================
   Helper — AI Scoring Model (for PENDING / REJECTED list)
=============================================================== */
function computeAIScoring(app) {
  const amount = toNumber(app.loan_amount_applied);
  const tenure = app.tenure_applied || 0;

  const normalizedAmount = Math.min(amount / 200000, 1);
  const normalizedTenure = Math.min(tenure / 60, 1);

  const needScore = 0.6 + 0.3 * (1 - normalizedAmount);
  const riskScore = 0.25 + 0.5 * normalizedAmount;
  const fraudProbability = 0.02 + 0.05 * normalizedAmount;
  const creditScore = Math.round(750 - normalizedAmount * 150);

  const finalScore =
    0.7 * (1 - riskScore) +
    0.3 * needScore -
    fraudProbability;

  const finalEligibilityScore = Math.max(0.3, Math.min(0.95, finalScore));

  let bandClassification = "Medium Risk - Medium Need";
  if (finalEligibilityScore >= 0.8)
    bandClassification = "Low Risk - High Need";
  else if (finalEligibilityScore >= 0.6)
    bandClassification = "Medium Risk - High Need";
  else if (finalEligibilityScore >= 0.45)
    bandClassification = "High Risk - Medium Need";
  else bandClassification = "High Risk - Low Need";

  return {
    creditScore,
    riskScore: Number(riskScore.toFixed(2)),
    fraudProbability: Number(fraudProbability.toFixed(2)),
    needScore: Number(needScore.toFixed(2)),
    estimatedIncome: 30000 + tenure * 500,
    estimatedSafeLoan: amount + 20000,
    bandClassification,
    finalEligibilityScore: Number(finalEligibilityScore.toFixed(2)),
  };
}

/* ============================================================
   Helper — AI Scoring for APPROVED loans (loan_history)
   Uses: loan_amount_sanctioned + loan_tenure_months
=============================================================== */
function computeAIScoringFromHistory(row) {
  const amount = toNumber(row.loan_amount_sanctioned);
  const tenure = row.loan_tenure_months || 0;

  const normalizedAmount = Math.min(amount / 200000, 1);
  const normalizedTenure = Math.min(tenure / 60, 1);

  const needScore = 0.6 + 0.3 * (1 - normalizedAmount);
  const riskScore = 0.25 + 0.5 * normalizedAmount;
  const fraudProbability = 0.02 + 0.05 * normalizedAmount;
  const creditScore = Math.round(750 - normalizedAmount * 150);

  const finalScore =
    0.7 * (1 - riskScore) +
    0.3 * needScore -
    fraudProbability;

  const finalEligibilityScore = Math.max(0.3, Math.min(0.95, finalScore));

  let bandClassification = "Medium Risk - Medium Need";
  if (finalEligibilityScore >= 0.8)
    bandClassification = "Low Risk - High Need";
  else if (finalEligibilityScore >= 0.6)
    bandClassification = "Medium Risk - High Need";
  else if (finalEligibilityScore >= 0.45)
    bandClassification = "High Risk - Medium Need";
  else bandClassification = "High Risk - Low Need";

  return {
    creditScore,
    riskScore: Number(riskScore.toFixed(2)),
    fraudProbability: Number(fraudProbability.toFixed(2)),
    needScore: Number(needScore.toFixed(2)),
    estimatedIncome: 30000 + tenure * 500,
    estimatedSafeLoan: amount + 20000,
    bandClassification,
    finalEligibilityScore: Number(finalEligibilityScore.toFixed(2)),
  };
}

/* ============================================================
   Helper — EMI Calculation
   P = principal, R = annual interest rate (%), N = months
=============================================================== */
function calculateEmi(principal, annualRate, months) {
  const P = toNumber(principal);
  const N = Number(months);
  const r = Number(annualRate) / 12 / 100; // monthly rate

  if (!P || !N || !r) return 0;

  const power = Math.pow(r + 1, N);
  const emi = (P * r * power) / (power - 1);
  return Math.round(emi);
}

/* ============================================================
   ✅ GET Approved Applications For Admin Panel
   Source: loan_history (APPROVED loans)
   👉 1 row per loan_id (latest payment_timestamp)
=============================================================== */
router.get("/loan-approval/approved", async (req, res) => {
  try {
    // 1️⃣ Fetch all loan_history rows ordered by latest payment
    const { data, error } = await supabase
      .from("loan_history")
      .select(
        `loan_id,
         payment_timestamp,
         loan_amount_sanctioned,
         loan_amount_disbursed,
         loan_tenure_months,
         interest_rate,
         emi_amount,
         aadhar_no`
      )
      .order("payment_timestamp", { ascending: false });

    if (error) {
      console.error("❌ Supabase Fetch Error (APPROVED from loan_history):", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch approved applications",
      });
    }

    // 2️⃣ Deduplicate -> keep latest row per loan_id
    const latestByLoan = {};
    (data || []).forEach((row) => {
      if (!latestByLoan[row.loan_id]) {
        latestByLoan[row.loan_id] = row;
      }
    });

    const deduped = Object.values(latestByLoan);

    // 3️⃣ Fetch scheme information from track_application
    const loanIds = deduped.map((r) => r.loan_id);
    let schemeMap = {};

    if (loanIds.length > 0) {
      const { data: trackRows, error: trackErr } = await supabase
        .from("track_application")
        .select("loan_application_id, scheme")
        .in("loan_application_id", loanIds);

      if (trackErr) {
        console.error("⚠️ Supabase track_application Error (for schemes):", trackErr);
      } else {
        schemeMap = (trackRows || []).reduce((acc, row) => {
          acc[row.loan_application_id] = row.scheme || "Not Provided";
          return acc;
        }, {});
      }
    }

    // 4️⃣ Format for frontend
    const formatted = deduped.map((row) => {
      const ai = computeAIScoringFromHistory(row);
      const scheme = schemeMap[row.loan_id] || "Not Provided";

      return {
        id: row.loan_id,
        scheme,
        beneficiary: `Beneficiary (${String(row.aadhar_no).slice(-4)})`,
        amount: toNumber(row.loan_amount_sanctioned),
        tenure: row.loan_tenure_months || 0,
        status: "APPROVED",
        applicationDate: row.payment_timestamp,
        aadhar_no: row.aadhar_no,
        interest_rate: row.interest_rate,
        emi_amount: row.emi_amount,

        ...ai, // bandClassification, finalEligibilityScore, etc.
      };
    });

    return res.json({
      success: true,
      applications: formatted,
    });
  } catch (err) {
    console.error("🔥 APPROVED INTERNAL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* ============================================================
   GET Pending Applications For Admin Panel
   👉 ONLY status = 'PENDING'
=============================================================== */
router.get("/loan-approval/pending", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("track_application")
      .select(
        `loan_application_id,
         applied_on,
         loan_amount_applied,
         scheme,
         tenure_applied,
         status,
         aadhar_no,
         interest_rate,
         emi_amount`
      )
      .eq("status", "PENDING") // 🔴 ONLY AND ONLY PENDING
      .order("applied_on", { ascending: false });

    if (error) {
      console.error("❌ Supabase Fetch Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch applications",
      });
    }

    const formatted = (data || []).map((row) => {
      const ai = computeAIScoring(row);

      return {
        id: row.loan_application_id,
        scheme: row.scheme || "Not Provided",
        beneficiary: `Beneficiary (${String(row.aadhar_no).slice(-4)})`,
        amount: toNumber(row.loan_amount_applied),
        tenure: row.tenure_applied || 0,
        status: row.status || "PENDING",
        applicationDate: row.applied_on,
        aadhar_no: row.aadhar_no,
        interest_rate: row.interest_rate,
        emi_amount: row.emi_amount,

        ...ai,
      };
    });

    return res.json({
      success: true,
      applications: formatted,
    });
  } catch (err) {
    console.error("🔥 INTERNAL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* ============================================================
   GET Rejected Applications For Admin Panel
   👉 ONLY status = 'REJECTED'
=============================================================== */
router.get("/loan-approval/rejected", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("track_application")
      .select(
        `loan_application_id,
         applied_on,
         loan_amount_applied,
         scheme,
         tenure_applied,
         status,
         aadhar_no,
         interest_rate,
         emi_amount`
      )
      .eq("status", "REJECTED") // 🔴 ONLY REJECTED APPLICATIONS
      .order("applied_on", { ascending: false });

    if (error) {
      console.error("❌ Supabase Fetch Error (REJECTED):", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch rejected applications",
      });
    }

    const formatted = (data || []).map((row) => {
      const ai = computeAIScoring(row); // 👈 same helper as pending

      return {
        id: row.loan_application_id,
        scheme: row.scheme || "Not Provided",
        beneficiary: `Beneficiary (${String(row.aadhar_no).slice(-4)})`,
        amount: toNumber(row.loan_amount_applied),
        tenure: row.tenure_applied || 0,
        status: row.status || "REJECTED",
        applicationDate: row.applied_on,
        aadhar_no: row.aadhar_no,
        interest_rate: row.interest_rate,
        emi_amount: row.emi_amount,

        ...ai, // includes finalEligibilityScore, bandClassification, etc.
      };
    });

    return res.json({
      success: true,
      applications: formatted,
    });
  } catch (err) {
    console.error("🔥 INTERNAL ERROR (REJECTED):", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* ============================================================
   APPROVE Application
   body: { loan_application_id, aadhar_no, sanctionedAmount,
           tenureApproved, interestRate, modelSuggestedAmount? }
=============================================================== */
router.post("/loan-approval/approve", async (req, res) => {
  const {
    loan_application_id,
    aadhar_no,
    sanctionedAmount,
    tenureApproved,
    interestRate,
    modelSuggestedAmount,
  } = req.body;

  if (
    !loan_application_id ||
    !aadhar_no ||
    !sanctionedAmount ||
    !tenureApproved ||
    !interestRate
  ) {
    return res.status(400).json({
      success: false,
      message:
        "loan_application_id, aadhar_no, sanctionedAmount, tenureApproved and interestRate are required",
    });
  }

  try {
    const emi = calculateEmi(sanctionedAmount, interestRate, tenureApproved);

    const { data, error } = await supabase
      .from("track_application")
      .update({
        status: "APPROVED",
        loan_amount_approved: String(sanctionedAmount),
        tenure_approved: tenureApproved,
        interest_rate: interestRate,
        emi_amount: emi,
        // model_suggested_amount: modelSuggestedAmount  // when column available
      })
      .eq("loan_application_id", loan_application_id)
      .eq("aadhar_no", aadhar_no)
      .select()
      .maybeSingle();

    if (error) {
      console.error("❌ APPROVE update error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to approve application",
      });
    }

    return res.json({
      success: true,
      message: "Application approved successfully",
      emi,
      updated: data,
    });
  } catch (err) {
    console.error("🔥 APPROVE INTERNAL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ============================================================
   REJECT Application
   body: { loan_application_id, aadhar_no, reason? }
=============================================================== */
router.post("/loan-approval/reject", async (req, res) => {
  const { loan_application_id, aadhar_no, reason } = req.body;

  if (!loan_application_id || !aadhar_no) {
    return res.status(400).json({
      success: false,
      message: "loan_application_id and aadhar_no are required",
    });
  }

  try {
    const { data, error } = await supabase
      .from("track_application")
      .update({
        status: "REJECTED",
        // rejection_reason: reason   // create column if you want to store it
      })
      .eq("loan_application_id", loan_application_id)
      .eq("aadhar_no", aadhar_no)
      .select()
      .maybeSingle();

    if (error) {
      console.error("❌ REJECT update error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to reject application",
      });
    }

    return res.json({
      success: true,
      message: "Application rejected successfully",
      updated: data,
    });
  } catch (err) {
    console.error("🔥 REJECT INTERNAL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ============================================================
   MANUAL REVIEW / MANUAL INTERVENTION
   body: { loan_application_id, aadhar_no, note? }
=============================================================== */
router.post("/loan-approval/manual-review", async (req, res) => {
  const { loan_application_id, aadhar_no, note } = req.body;

  if (!loan_application_id || !aadhar_no) {
    return res.status(400).json({
      success: false,
      message: "loan_application_id and aadhar_no are required",
    });
  }

  try {
    const { data, error } = await supabase
      .from("track_application")
      .update({
        status: "MANUAL_REVIEW",
        // manual_review_note: note   // when you add column
      })
      .eq("loan_application_id", loan_application_id)
      .eq("aadhar_no", aadhar_no)
      .select()
      .maybeSingle();

    if (error) {
      console.error("❌ MANUAL REVIEW update error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to mark application for manual review",
      });
    }

    return res.json({
      success: true,
      message: "Application sent for manual review",
      updated: data,
    });
  } catch (err) {
    console.error("🔥 MANUAL REVIEW INTERNAL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
