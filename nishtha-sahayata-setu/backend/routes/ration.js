const express = require("express");
const supabase = require("../supabaseClient.js");

const router = express.Router();

router.get("/ration/:rationNumber", async (req, res) => {
    const { rationNumber } = req.params;

    console.log("🔵 Incoming Request -> /ration/", rationNumber);

    if (!rationNumber) {
        console.log("❌ Error: rationNumber missing");
    } else {
        console.log("📌 Received rationNumber:", rationNumber);
        console.log("📌 Length:", rationNumber.length);
    }

    if (!rationNumber || rationNumber.length !== 12) {
        return res.status(400).json({
            success: false,
            message: "Ration Card Number must be exactly 12 digits.",
        });
    }

    try {
        // DEBUG: Get all ration_card_no values to see actual stored format
        const debug = await supabase
            .from("ration_card")
            .select("ration_card_no")
            .limit(20);

        console.log("🔍 DEBUG STORED ration_card_no:", debug.data);

        console.log("🟡 Querying Supabase...");

        const { data, error } = await supabase
            .from("ration_card")
            .select(`
                household_size,
                dependents_cnt,
                earners_cnt,
                dependency_ratio,
                ration_card_category
            `)
            .like("ration_card_no", `%${rationNumber.trim()}%`)
            .maybeSingle();

        console.log("🟣 Supabase Response:");
        console.log("➡️ Data:", data);
        console.log("➡️ Error:", error);

        if (error) {
            console.log("🔥 Supabase Error Occurred:", error);
        }

        if (!data) {
            console.log("⚠️ No data found for ration card:", rationNumber);
            return res.status(404).json({
                success: false,
                message: "Ration Card not found.",
            });
        }

        console.log("✅ Successfully fetched ration details.");

        res.json({
            success: true,
            rationDetails: {
                householdSize: data.household_size,
                dependentCount: data.dependents_cnt,
                earnersCount: data.earners_cnt,
                dependencyRatio: data.dependency_ratio,
                rationCategory: data.ration_card_category,
            },
            seccDetails: {
                category: data.secc_category,
                score: data.secc_score,
            },
        });

    } catch (err) {
        console.error("🔥 INTERNAL ERROR fetching ration details:", err);

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

router.post("/ration/update", async (req, res) => {
    const { loan_application_id, aadhaar_no, ration_card_number } = req.body;

    if (!loan_application_id || !aadhaar_no || !ration_card_number) {
        return res.status(400).json({ message: "Missing fields" });
    }

    try {
        // 🔥 Update only ration_card_number using composite primary key
        const { data, error } = await supabase
            .from("loan_applications")
            .update({ ration_card_number })
            .eq("loan_application_id", loan_application_id)
            .eq("aadhaar_no", aadhaar_no)
            .select();

        // Supabase error handling
        if (error) {
            console.error("Supabase update error:", error);
            return res.status(500).json({ message: "Update failed", error });
        }

        // No row updated (composite key not found)
        if (!data || data.length === 0) {
            return res.status(404).json({ message: "Loan application not found" });
        }

        return res.status(200).json({
            message: "Ration card updated successfully",
            data: data[0],
        });

    } catch (err) {
        console.error("Unexpected error updating ration:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/ration/get", async (req, res) => {
    const { loan_application_id, aadhaar_no } = req.body;

    try {
        const { data, error } = await supabase
            .from("loan_applications")
            .select("ration_card_number")
            .eq("loan_application_id", loan_application_id)
            .eq("aadhaar_no", aadhaar_no)
            .single();

        if (error) {
            return res.status(404).json({ message: "Not found" });
        }

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});



module.exports = router;
