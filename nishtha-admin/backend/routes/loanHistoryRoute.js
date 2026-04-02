// backend/routes/loanHistoryRoute.js
const express = require("express");
const supabase = require("../supabaseClient.js");
const multer = require("multer");
const { parse } = require("csv-parse/sync");
const xlsx = require("xlsx");

const router = express.Router();

// Multer: keep file in memory
const upload = multer({ storage: multer.memoryStorage() });

/* ============================================================
   Columns in loan_history table (for mapping & validation)
=============================================================== */
const LOAN_HISTORY_COLUMNS = [
  "loan_id",
  "payment_timestamp",
  "loan_amount_sanctioned",
  "loan_amount_disbursed",
  "loan_tenure_months",
  "interest_rate",
  "emi_amount",
  "repayments_made",
  "total_amount_repaid",
  "last_payment_date",
  "dpd_days",
  "default_flag",
  "npa_status",
  "repeat_borrower_flag",
  "previous_loans_count",
  "previous_defaults_count",
  "aadhar_no",
];

/* ============================================================
   Helpers
=============================================================== */
function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;

  const num = parseFloat(String(value).replace(/[^\d.-]/g, ""));
  return isNaN(num) ? null : num;
}

function toInteger(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Math.trunc(value);

  const num = parseInt(String(value).replace(/[^\d-]/g, ""), 10);
  return isNaN(num) ? null : num;
}

/**
 * Check if a row from frontend is completely empty
 * (all fields "" or null).
 */
function isRowEmpty(row) {
  return LOAN_HISTORY_COLUMNS.every((col) => {
    const v = row[col];
    return v === "" || v === null || v === undefined;
  });
}

/**
 * Transform a raw row (from frontend OR CSV/XLSX) into a
 * clean object ready to insert into loan_history.
 *
 * NOTE: Assumes headers/keys match column names in table.
 */
function mapToLoanHistoryRow(raw) {
  const row = {};

  // Required text fields
  row.loan_id = raw.loan_id ? String(raw.loan_id).trim() : null;
  row.aadhar_no = raw.aadhar_no ? String(raw.aadhar_no).trim() : null;

  // Required timestamp
  // Frontend sends e.g. "2025-12-09T10:30"
  // We pass it as-is and let Postgres interpret.
  row.payment_timestamp = raw.payment_timestamp || null;

  // Numeric fields
  row.loan_amount_sanctioned = toNumber(raw.loan_amount_sanctioned);
  row.loan_amount_disbursed = toNumber(raw.loan_amount_disbursed);
  row.loan_tenure_months = toInteger(raw.loan_tenure_months);
  row.interest_rate = toNumber(raw.interest_rate);
  row.emi_amount = toNumber(raw.emi_amount);
  row.repayments_made = toInteger(raw.repayments_made);
  row.total_amount_repaid = toNumber(raw.total_amount_repaid);

  // last_payment_date: can be null
  row.last_payment_date = raw.last_payment_date || null;

  // Integers with defaults
  row.dpd_days = toInteger(raw.dpd_days);
  if (row.dpd_days === null) row.dpd_days = 0;

  row.default_flag = toInteger(raw.default_flag);
  row.npa_status = toInteger(raw.npa_status);
  row.repeat_borrower_flag = toInteger(raw.repeat_borrower_flag);

  row.previous_loans_count = toInteger(raw.previous_loans_count);
  if (row.previous_loans_count === null) row.previous_loans_count = 0;

  row.previous_defaults_count = toInteger(raw.previous_defaults_count);
  if (row.previous_defaults_count === null) row.previous_defaults_count = 0;

  return row;
}

/* ============================================================
   ✅ POST /loan-history/manual
   Body: { rows: [...] }  (rows from React form)
=============================================================== */
router.post("/loan-history/manual", async (req, res) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No rows provided",
      });
    }

    // Remove fully empty rows
    const nonEmptyRows = rows.filter((r) => !isRowEmpty(r));

    if (nonEmptyRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All rows are empty. Please fill at least one row.",
      });
    }

    // Map & basic validation
    const mapped = nonEmptyRows.map(mapToLoanHistoryRow);

    // Optional quick check: ensure required fields present
    for (const r of mapped) {
      if (!r.loan_id || !r.payment_timestamp || !r.aadhar_no) {
        return res.status(400).json({
          success: false,
          message:
            "Each row must have loan_id, payment_timestamp, and aadhar_no.",
        });
      }
    }

    const { data, error } = await supabase
      .from("loan_history")
      .insert(mapped)
      .select();

    if (error) {
      console.error("❌ Supabase Insert Error (manual):", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to insert manual loan history rows.",
      });
    }

    return res.json({
      success: true,
      message: "Loan history records added successfully.",
      insertedCount: data ? data.length : 0,
      rows: data,
    });
  } catch (err) {
    console.error("🔥 /loan-history/manual ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

/* ============================================================
   ✅ POST /loan-history/upload
   - Accepts CSV or XLSX file
   - Field name: "file"
   - Headers must match loan_history columns
=============================================================== */
router.post(
  "/loan-history/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const { originalname, buffer } = req.file;
      const lower = originalname.toLowerCase();

      let rawRows = [];

      if (lower.endsWith(".csv")) {
        rawRows = parse(buffer.toString("utf-8"), {
          columns: true, // use header row as keys
          skip_empty_lines: true,
          trim: true,
        });
      } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const workbook = xlsx.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rawRows = xlsx.utils.sheet_to_json(sheet, {
          defval: "", // empty cells -> ""
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Unsupported file type. Please upload CSV or XLSX.",
        });
      }

      if (!rawRows || rawRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Uploaded file is empty or has no data.",
        });
      }

      // Filter out fully empty rows
      const nonEmptyRaw = rawRows.filter((raw) => !isRowEmpty(raw));
      if (nonEmptyRaw.length === 0) {
        return res.status(400).json({
          success: false,
          message: "All rows in file are empty.",
        });
      }

      // Map & validate
      const mapped = nonEmptyRaw.map(mapToLoanHistoryRow);

      for (const r of mapped) {
        if (!r.loan_id || !r.payment_timestamp || !r.aadhar_no) {
          return res.status(400).json({
            success: false,
            message:
              "Each row in file must have loan_id, payment_timestamp, and aadhar_no.",
          });
        }
      }

      const { data, error } = await supabase
        .from("loan_history")
        .insert(mapped)
        .select();

      if (error) {
        console.error("❌ Supabase Insert Error (upload):", error);
        return res.status(500).json({
          success: false,
          message:
            error.message ||
            "Failed to insert loan history rows from uploaded file.",
        });
      }

      return res.json({
        success: true,
        message: "File processed and loan history records inserted.",
        insertedCount: data ? data.length : 0,
        rows: data,
      });
    } catch (err) {
      console.error("🔥 /loan-history/upload ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error while processing file.",
      });
    }
  }
);

module.exports = router;
