// routes/Bank_Details_Route.js
const express = require("express");
const supabase = require("../supabaseClient.js");

const router = express.Router();

/**
 * 📥 Get saved Bank Details for aadhar_no + loan_application_id
 *    - Both come from frontend (localStorage)
 *    - NOTE: table column is "aadhaar_no" (double 'a'), but frontend uses "aadhar_no"
 */
router.get("/bank-details", async (req, res) => {
  const { aadhar_no, loan_application_id } = req.query;

  console.log("🔵 [GET] /bank-details", { aadhar_no, loan_application_id });

  if (!aadhar_no || !loan_application_id) {
    return res.status(400).json({
      success: false,
      message: "aadhar_no and loan_application_id are required",
    });
  }

  try {
    const { data, error } = await supabase
      .from("bank_details")
      .select(
        "loan_application_id, aadhaar_no, account_holder_name, bank_name, account_no, ifsc_code, branch_name, upi_id"
      )
      .eq("aadhaar_no", aadhar_no) // 👈 DB column name is aadhaar_no
      .eq("loan_application_id", loan_application_id)
      .maybeSingle();

    console.log("🟣 Supabase bank_details GET Response:");
    console.log("➡️ Data:", data);
    console.log("➡️ Error:", error);

    if (error) {
      console.error("🔥 Supabase Error (bank_details get):", error);
      return res.status(500).json({
        success: false,
        message: "Database error while fetching bank details",
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No bank details found for this loan/application.",
      });
    }

    return res.json({
      success: true,
      record: data,
    });
  } catch (err) {
    console.error("🔥 INTERNAL ERROR fetching bank details:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * 🧾 Save / Update Bank Details
 *  - Uses loan_application_id + aadhar_no from frontend (localStorage)
 *  - Upserts into bank_details (loan_application_id + aadhaar_no)
 */
router.post("/bank-details", async (req, res) => {
  console.log("🔵 [POST] /bank-details", req.body);

  const {
    aadhar_no, // from frontend
    loan_application_id,
    accountHolderName,
    bankName,
    accountNumber,
    ifscCode,
    branchName,
    upiId,
  } = req.body;

  if (
    !aadhar_no ||
    !loan_application_id ||
    !accountHolderName ||
    !bankName ||
    !accountNumber ||
    !ifscCode
  ) {
    return res.status(400).json({
      success: false,
      message:
        "aadhar_no, loan_application_id, accountHolderName, bankName, accountNumber, ifscCode are required",
    });
  }

  try {
    console.log("🟡 Upserting into bank_details...");

    const { data, error } = await supabase
      .from("bank_details")
      .upsert(
        [
          {
            loan_application_id,
            aadhaar_no: aadhar_no, // 👈 map frontend aadhar_no -> DB aadhaar_no
            account_holder_name: accountHolderName,
            bank_name: bankName,
            account_no: accountNumber,
            ifsc_code: ifscCode,
            branch_name: branchName || null,
            upi_id: upiId || null,
          },
        ],
        {
          onConflict: "loan_application_id,aadhaar_no",
        }
      )
      .select()
      .single();

    console.log("🟣 Supabase bank_details upsert Response:");
    console.log("➡️ Data:", data);
    console.log("➡️ Error:", error);

    if (error) {
      console.error("🔥 Supabase Error (bank_details upsert):", error);
      return res.status(500).json({
        success: false,
        message: "Failed to save bank details",
      });
    }

    console.log("✅ Bank details saved:", data);

    return res.status(200).json({
      success: true,
      message: "Bank details saved successfully",
      loan_application_id,
      record: data,
    });
  } catch (err) {
    console.error("🔥 INTERNAL ERROR saving bank details:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
