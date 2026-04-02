import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Upload, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLUMNS = [
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

function createEmptyRow() {
  const row = { id: Date.now() + Math.random() };
  COLUMNS.forEach((col) => (row[col] = ""));
  return row;
}

// Optional: nicer labels (so header looks clean)
const LABELS = {
  loan_id: "Loan ID",
  payment_timestamp: "Payment Timestamp",
  loan_amount_sanctioned: "Sanctioned Amount",
  loan_amount_disbursed: "Disbursed Amount",
  loan_tenure_months: "Tenure (months)",
  interest_rate: "Interest Rate (%)",
  emi_amount: "EMI Amount",
  repayments_made: "Repayments Made",
  total_amount_repaid: "Total Repaid",
  last_payment_date: "Last Payment Date",
  dpd_days: "DPD (days)",
  default_flag: "Default Flag (0/1)",
  npa_status: "NPA Status (0/1)",
  repeat_borrower_flag: "Repeat Borrower (0/1)",
  previous_loans_count: "Prev Loans Count",
  previous_defaults_count: "Prev Defaults",
  aadhar_no: "Aadhaar No",
};

function getInputType(field) {
  if (field.includes("timestamp")) return "datetime-local";
  if (field.includes("date")) return "date";
  if (
    field.includes("flag") ||
    field.includes("count") ||
    field.includes("months") ||
    field.includes("dpd") ||
    field.includes("repayments")
  )
    return "number";
  if (field.includes("amount") || field.includes("rate")) return "number";
  return "text";
}

function isRowEmpty(row) {
  return COLUMNS.every((col) => {
    const v = row[col];
    return v === "" || v === null || v === undefined;
  });
}

export default function UploadData() {
  const [rows, setRows] = useState([createEmptyRow()]);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualMessage, setManualMessage] = useState("");

  const [file, setFile] = useState(null);
  const [fileStatus, setFileStatus] = useState("idle"); // idle | uploading | success | error
  const [fileMessage, setFileMessage] = useState("");

  const handleChange = (rowId, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const handleRemoveRow = (id) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
    setFileStatus("idle");
    setFileMessage("");
  };

  // ✅ Save manual rows to backend
  const handleSaveManualRows = async () => {
    try {
      setManualSaving(true);
      setManualMessage("");

      // Remove fully empty rows before sending
      const payloadRows = rows
        .filter((r) => !isRowEmpty(r))
        .map(({ id, ...rest }) => rest); // remove local id

      if (payloadRows.length === 0) {
        setManualMessage("⚠️ Please fill at least one row before saving.");
        setManualSaving(false);
        return;
      }

      const resp = await fetch("http://localhost:3000/api/loan-history/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows: payloadRows }),
      });

      const data = await resp.json();

      if (!resp.ok || !data.success) {
        throw new Error(data.message || "Failed to save loan history records.");
      }

      setManualMessage(
        `✅ Saved ${data.insertedCount || payloadRows.length} record(s) successfully.`
      );

      // Optional: reset form after save
      setRows([createEmptyRow()]);
    } catch (err) {
      console.error("Error saving manual rows:", err);
      setManualMessage(
        `❌ Failed to save manual records: ${err.message || "Unknown error"}`
      );
    } finally {
      setManualSaving(false);
    }
  };

  // ✅ Upload CSV/XLSX file to backend
  const handleUploadFile = async () => {
    if (!file) {
      setFileStatus("error");
      setFileMessage("Please select a CSV or Excel file first.");
      return;
    }

    try {
      setFileStatus("uploading");
      setFileMessage("");

      const formData = new FormData();
      formData.append("file", file);

      const resp = await fetch("http://localhost:3000/api/loan-history/upload", {
        method: "POST",
        body: formData,
      });

      const data = await resp.json();

      if (!resp.ok || !data.success) {
        throw new Error(
          data.message || "Failed to upload and process the file."
        );
      }

      setFileStatus("success");
      setFileMessage(
        `✅ File uploaded. Inserted ${data.insertedCount || 0} record(s).`
      );
      setFile(null);
    } catch (err) {
      console.error("Error uploading file:", err);
      setFileStatus("error");
      setFileMessage(
        `❌ Upload failed: ${err.message || "Unknown error occurred."}`
      );
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Loan History Upload</h1>

        {/* ✅ MANUAL ENTRY AS CARDS */}
        <div className="bg-white border rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
            <div>
              <h2 className="text-sm font-semibold">Manual Entry</h2>
              <p className="text-xs text-muted-foreground">
                Add or edit loan history records. All columns are visible inside
                each card.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={handleAddRow}>
                <Plus className="h-4 w-4 mr-1" /> Add Row
              </Button>

              <Button
                size="sm"
                onClick={handleSaveManualRows}
                disabled={manualSaving}
              >
                <Save className="h-4 w-4 mr-1" />
                {manualSaving ? "Saving..." : "Save All Rows"}
              </Button>
            </div>
          </div>

          {manualMessage && (
            <p className="text-xs mb-3 text-muted-foreground">
              {manualMessage}
            </p>
          )}

          {/* Scroll vertically, not horizontally */}
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {rows.map((row, idx) => (
              <div
                key={row.id}
                className="border rounded-lg p-3 bg-muted/30 relative"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Loan #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(row.id)}
                    className="text-red-500 text-xs flex items-center gap-1 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>

                {/* Grid of all fields */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {COLUMNS.map((field) => (
                    <div key={field} className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground">
                        {LABELS[field] || field}
                      </label>
                      <input
                        type={getInputType(field)}
                        value={row[field]}
                        onChange={(e) =>
                          handleChange(row.id, field, e.target.value)
                        }
                        className="w-full border rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-[1px] focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ FILE UPLOAD */}
        <div className="bg-white border rounded-xl shadow-sm p-4 max-w-lg">
          <h2 className="text-sm font-semibold mb-2">Upload Bulk Dataset</h2>
          <p className="text-xs text-muted-foreground mb-2">
            Upload a CSV or Excel file with headers matching{" "}
            <code className="text-[10px] px-1 rounded bg-muted">
              {COLUMNS.join(", ")}
            </code>
          </p>

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="w-full border rounded px-3 py-2 text-sm bg-muted"
          />

          {file && (
            <p className="text-xs text-green-600 mt-1">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          )}

          <Button
            onClick={handleUploadFile}
            disabled={fileStatus === "uploading"}
            className="w-full mt-3"
          >
            <Upload className="h-4 w-4 mr-2" />
            {fileStatus === "uploading" ? "Uploading..." : "Upload File"}
          </Button>

          {fileMessage && (
            <p
              className={`text-xs text-center mt-2 ${
                fileStatus === "success"
                  ? "text-green-600"
                  : fileStatus === "error"
                  ? "text-red-600"
                  : "text-muted-foreground"
              }`}
            >
              {fileMessage}
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
