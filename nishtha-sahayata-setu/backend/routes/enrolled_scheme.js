const express = require("express");
const router = express.Router();

const supabase = require("../supabaseClient");

router.post("/enrolled_scheme", async (req, res) => {
    try {
        const { loan_application_id, aadhaar_no } = req.body;

        // validate input
        if (!loan_application_id || !aadhaar_no) {
            return res.status(400).json({
                success: false,
                error: "loan_application_id and aadhaar_no are required",
            });
        }

        console.log("\n[BENEFICIARY STATUS POST] Request Received");
        console.log("Loan Application ID:", loan_application_id);
        console.log("Aadhaar:", aadhaar_no);

        const supabase = req.app.locals.supabase;

        const { data, error } = await supabase
            .from("beneficiary_status")
            .select("*")
            .eq("loan_application_id", loan_application_id)
            .eq("aadhaar_no", aadhaar_no)
            .maybeSingle();

        console.log("\n[Supabase Response]:", { error, data });

        if (error) {
            return res.status(500).json({ success: false, error: "Supabase error", supabase: error });
        }

        if (!data) {
            return res.status(404).json({ success: false, error: "Beneficiary status not found" });
        }

        res.json({ success: true, status: data });

    } catch (err) {
        console.error("[BENEFICIARY STATUS POST] Server Error:", err);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});


module.exports = router;
