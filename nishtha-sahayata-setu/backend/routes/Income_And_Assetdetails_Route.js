// routes/Income_And_Assetdetails_Route.js
const express = require("express");
const supabase = require("../supabaseClient.js");

const router = express.Router();

/**
 * 📌 Get Occupation from eligible_beneficiary by Aadhaar
 */
router.get("/income-asset/occupation/:aadhar_no", async (req, res) => {
  const { aadhar_no } = req.params;

  console.log("🔵 [GET] /income-asset/occupation/", aadhar_no);

  if (!aadhar_no) {
    return res.status(400).json({
      success: false,
      message: "Aadhaar number is required",
    });
  }

  try {
    console.log("🟡 Querying Supabase for occupation...");

    const { data, error } = await supabase
      .from("eligible_beneficiary")
      .select("occupation, aadhar_no")
      .eq("aadhar_no", aadhar_no)
      .maybeSingle();

    console.log("🟣 Supabase Occupation Response:");
    console.log("➡️ Data:", data);
    console.log("➡️ Error:", error);

    if (error) {
      console.error("🔥 Supabase Error (occupation):", error);
      return res.status(500).json({
        success: false,
        message: "Database error while fetching occupation",
      });
    }

    if (!data || !data.occupation) {
      console.log("⚠️ No occupation found for Aadhaar:", aadhar_no);
      return res.status(404).json({
        success: false,
        message: "No occupation found for this Aadhaar number.",
      });
    }

    console.log("✅ Occupation fetched successfully:", data.occupation);

    return res.json({
      success: true,
      occupation: data.occupation,
    });
  } catch (err) {
    console.error("🔥 INTERNAL ERROR fetching occupation:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * 📥 Get saved Income & Asset Details for aadhar_no + loan_application_id
 */
router.get("/income-asset", async (req, res) => {
  const { aadhar_no, loan_application_id } = req.query;

  console.log("🔵 [GET] /income-asset", { aadhar_no, loan_application_id });

  if (!aadhar_no || !loan_application_id) {
    return res.status(400).json({
      success: false,
      message: "aadhar_no and loan_application_id are required",
    });
  }

  try {
    const { data, error } = await supabase
      .from("income_asset")
      .select(
        "primary_income_source, monthly_income, annual_income, asset_count, estimated_asset_value, loan_application_id, aadhar_no"
      )
      .eq("aadhar_no", aadhar_no)
      .eq("loan_application_id", loan_application_id)
      .maybeSingle();

    console.log("🟣 Supabase income_asset GET Response:");
    console.log("➡️ Data:", data);
    console.log("➡️ Error:", error);

    if (error) {
      console.error("🔥 Supabase Error (income_asset get):", error);
      return res.status(500).json({
        success: false,
        message: "Database error while fetching income & asset details",
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No income & asset details found for this loan/application.",
      });
    }

    return res.json({
      success: true,
      record: data,
    });
  } catch (err) {
    console.error("🔥 INTERNAL ERROR fetching income & asset details:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * 🧾 Save / Update Income & Asset Details
 *  ❗ loan_application_id is REQUIRED – no more "latest application" fallback
 */
router.post("/income-asset", async (req, res) => {
  console.log("🔵 [POST] /income-asset", req.body);

  const {
    aadhar_no,
    loan_application_id,        // MUST come from frontend/localStorage
    primaryIncomeSource,
    monthlyIncome,
    annualIncome,
    assetCount,
    estimatedAssetValue,
  } = req.body;

  if (!aadhar_no || !loan_application_id || !primaryIncomeSource) {
    return res.status(400).json({
      success: false,
      message:
        "aadhar_no, loan_application_id and primaryIncomeSource are required",
    });
  }

  try {
    console.log("✅ Using loan_application_id:", loan_application_id);

    // Parse numeric values safely
    const monthlyIncomeNum =
      monthlyIncome !== undefined &&
      monthlyIncome !== null &&
      monthlyIncome !== ""
        ? Number(monthlyIncome)
        : null;

    const annualIncomeNum =
      annualIncome !== undefined &&
      annualIncome !== null &&
      annualIncome !== ""
        ? Number(annualIncome)
        : null;

    const assetCountNum =
      assetCount !== undefined && assetCount !== null && assetCount !== ""
        ? Number(assetCount)
        : 0;

    const estimatedAssetValueNum =
      estimatedAssetValue !== undefined &&
      estimatedAssetValue !== null &&
      estimatedAssetValue !== ""
        ? Number(estimatedAssetValue)
        : null;

    console.log("🟡 Upserting into income_asset...");

    const { data, error } = await supabase
      .from("income_asset")
      .upsert(
        [
          {
            loan_application_id,
            aadhar_no,
            primary_income_source: primaryIncomeSource,
            monthly_income: monthlyIncomeNum,
            annual_income: annualIncomeNum,
            asset_count: assetCountNum,
            estimated_asset_value: estimatedAssetValueNum,
          },
        ],
        {
          onConflict: "loan_application_id,aadhar_no",
        }
      )
      .select()
      .single();

    console.log("🟣 Supabase income_asset upsert Response:");
    console.log("➡️ Data:", data);
    console.log("➡️ Error:", error);

    if (error) {
      console.error("🔥 Supabase Error (income_asset upsert):", error);
      return res.status(500).json({
        success: false,
        message: "Failed to save income & asset details",
      });
    }

    console.log("✅ Income & Asset details saved:", data);

    return res.status(200).json({
      success: true,
      message: "Income & asset details saved successfully",
      loan_application_id,
      record: data,
    });
  } catch (err) {
    console.error("🔥 INTERNAL ERROR saving income & asset details:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
