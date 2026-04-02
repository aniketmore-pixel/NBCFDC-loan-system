const express = require("express");
const multer = require("multer");

const { extractElectricityBills } = require("../utils/extractElectricityBills.js");
const { computeStats } = require("../utils/computeStats.js");
const { getElectricityStats } = require("../utils/fetchElectricityStats.js");
const { compareStats } = require("../utils/compareStats.js");

const router = express.Router();
const upload = multer();

router.post("/verify/electricity", upload.array("bills"), async (req, res) => {
  try {
    console.log("Files received:", req.files);

    const { loan_application_id, aadhar_no } = req.body;

    console.log("Loan ID:", loan_application_id);
    console.log("Aadhar:", aadhar_no);

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ ok: false, error: "No files uploaded" });
    }

    // Extract bill info
    const extractedBills = await extractElectricityBills(files);
    console.log("Extracted bills:", extractedBills);

    if (!extractedBills || extractedBills.length === 0) {
      return res.status(500).json({ ok: false, error: "Failed to extract bills" });
    }

    // Compute stats from uploaded bills
    const computedStats = computeStats(extractedBills);

    // Fetch stats stored in Supabase
    const elecAccountNo = extractedBills[0].elec_account_no; // assuming all belong to same account
    console.log("Resolved elecAccountNo:", elecAccountNo);
    
    const storedStats = await getElectricityStats(elecAccountNo);

    // Compare both
    const comparison = compareStats(computedStats, storedStats, elecAccountNo, loan_application_id, aadhar_no);

    return res.json({
      ok: true,
      verifiedBills: extractedBills.map(() => true),
      bills: extractedBills,
      computedStats,
      storedStats,
      comparison
    });

  } catch (err) {
    console.error("Electricity Verification Error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
