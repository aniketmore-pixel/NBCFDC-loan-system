// src/components/ReviewApplicationDialog.jsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ApproveFormDialog from "./ApproveFormDialog";

const ReviewApplicationDialog = ({
  selectedApplication,
  onClose,
  onStatusChange, // (id, newStatus) => void
}) => {
  const { toast } = useToast();
  const [openApproveForm, setOpenApproveForm] = useState(false);

  // Backend data
  const [loanDetails, setLoanDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // Format date helper
  const formatDate = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch full backend details when popup opens
  useEffect(() => {
    if (!selectedApplication) {
      setLoanDetails(null);
      setDetailsError("");
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoadingDetails(true);
        setDetailsError("");

        const res = await fetch(
          `http://localhost:3000/loan/${selectedApplication.id}`
        );

        if (!res.ok) {
          throw new Error(`API Error ${res.status}`);
        }

        const data = await res.json();
        console.log("🔵 [ReviewDialog] Full loan details:", data);
        setLoanDetails(data);
      } catch (err) {
        console.error("❌ [ReviewDialog] Error fetching loan details:", err);
        setDetailsError(
          err.message || "Something went wrong while loading application data."
        );
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedApplication]);

  const loanApp = loanDetails?.loan_application || {};
  const beneficiary = loanDetails?.beneficiary || {};
  const track = loanDetails?.track_application || {};
  const bank = loanDetails?.bank_details || {};
  const income = loanDetails?.income_asset || {};
  const expenses = loanDetails?.expenses_and_comodities || {};
  const benStatus = loanDetails?.beneficiary_status || {};

  // ✅ Handle Reject
  const handleRejectClick = async () => {
    if (!selectedApplication) return;
    const confirmed = window.confirm(
      `Are you sure you want to REJECT Application ${selectedApplication.id}?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        "http://localhost:3000/api/loan-approval/reject",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loan_application_id: selectedApplication.id,
            aadhar_no: selectedApplication.aadhar_no,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to reject application");
      }

      toast({
        title: "Application Rejected",
        description: `Application ${selectedApplication.id} has been rejected.`,
        variant: "destructive",
      });

      if (onStatusChange) {
        onStatusChange(selectedApplication.id, "REJECTED");
      }

      onClose();
    } catch (err) {
      console.error("❌ Reject error:", err);
      toast({
        title: "Reject failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // ✅ Handle Manual Review
  const handleManualReviewClick = async () => {
    if (!selectedApplication) return;
    const confirmed = window.confirm(
      `Mark Application ${selectedApplication.id} for MANUAL REVIEW?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        "http://localhost:3000/api/loan-approval/manual-review",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loan_application_id: selectedApplication.id,
            aadhar_no: selectedApplication.aadhar_no,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update application");
      }

      toast({
        title: "Sent for Manual Review",
        description: `Application ${selectedApplication.id} is marked as MANUAL_REVIEW.`,
      });

      if (onStatusChange) {
        onStatusChange(selectedApplication.id, "MANUAL_REVIEW");
      }

      onClose();
    } catch (err) {
      console.error("❌ Manual review error:", err);
      toast({
        title: "Manual review update failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // When approve form completes successfully
  const handleApproved = (updatedApp) => {
    if (onStatusChange) {
      onStatusChange(updatedApp.id, "APPROVED");
    }
  };

  return (
    <>
      <Dialog open={!!selectedApplication} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan Application Summary</DialogTitle>
            <DialogDescription>
              Application ID: {selectedApplication?.id}
            </DialogDescription>
          </DialogHeader>

          {/* BASIC INFO FROM LIST PAGE */}
          {selectedApplication && (
            <div className="mb-4 space-y-1 border-b pb-3">
              <p>
                <strong>Beneficiary (AI label):</strong>{" "}
                {selectedApplication.beneficiary}
              </p>
              <p>
                <strong>Scheme:</strong> {selectedApplication.scheme}
              </p>
              <p>
                <strong>Loan Amount Applied:</strong> ₹
                {selectedApplication.amount?.toLocaleString("en-IN")}
              </p>
              <p>
                <strong>Credit Score (AI):</strong>{" "}
                {selectedApplication.creditScore}
              </p>
              <p>
                <strong>Band:</strong>{" "}
                {selectedApplication.bandClassification}
              </p>
            </div>
          )}

          {/* LOADING / ERROR */}
          {loadingDetails && (
            <p className="text-sm text-muted-foreground">
              Fetching full application details...
            </p>
          )}

          {detailsError && (
            <p className="text-sm text-red-600 mb-2">{detailsError}</p>
          )}

          {/* FULL STRUCTURED BACKEND DATA */}
          {loanDetails && !loadingDetails && !detailsError && (
            <div className="space-y-6">
              {/* Loan Details */}
              <section className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Loan Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <p>
                    <span className="font-medium">Loan Application ID:</span>{" "}
                    {selectedApplication?.id}
                  </p>
                  <p>
                    <span className="font-medium">Scheme:</span>{" "}
                    {track.scheme || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Applied On:</span>{" "}
                    {formatDate(track.applied_on)}
                  </p>
                  <p>
                    <span className="font-medium">Loan Amount Applied:</span>{" "}
                    {track.loan_amount_applied || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Tenure Applied:</span>{" "}
                    {track.tenure_applied
                      ? `${track.tenure_applied} months`
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {track.status || "PENDING"}
                  </p>
                  <p>
                    <span className="font-medium">Interest Rate:</span>{" "}
                    {track.interest_rate
                      ? `${track.interest_rate}%`
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">EMI Amount (approx):</span>{" "}
                    {track.emi_amount
                      ? `₹${track.emi_amount.toLocaleString("en-IN")}`
                      : "N/A"}
                  </p>
                </div>
              </section>

              {/* Beneficiary Profile */}
              <section className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Beneficiary Profile</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {beneficiary.full_name || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Father / Spouse:</span>{" "}
                    {beneficiary.father_name ||
                      beneficiary.spouse_name ||
                      "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Gender:</span>{" "}
                    {beneficiary.gender || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Caste Category:</span>{" "}
                    {beneficiary.caste_category || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Mobile:</span>{" "}
                    {beneficiary.mobile_number || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {beneficiary.email || "N/A"}
                  </p>
                  <p className="col-span-2">
                    <span className="font-medium">Address:</span>{" "}
                    {beneficiary.address_line_1 ||
                    beneficiary.address_line_2 ||
                    beneficiary.district ||
                    beneficiary.state
                      ? `${beneficiary.address_line_1 || ""} ${
                          beneficiary.address_line_2 || ""
                        } ${beneficiary.district || ""} ${
                          beneficiary.state || ""
                        } ${beneficiary.pincode || ""}`
                      : "N/A"}
                  </p>
                </div>
              </section>

              {/* Income & Assets */}
              <section className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Income & Assets</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <p>
                    <span className="font-medium">
                      Primary Income Source:
                    </span>{" "}
                    {income.primary_income_source || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Monthly Income:</span>{" "}
                    {income.monthly_income
                      ? `₹${income.monthly_income.toLocaleString("en-IN")}`
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Annual Income:</span>{" "}
                    {income.annual_income
                      ? `₹${income.annual_income.toLocaleString("en-IN")}`
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Asset Count:</span>{" "}
                    {income.asset_count ?? "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">
                      Estimated Asset Value:
                    </span>{" "}
                    {income.estimated_asset_value
                      ? `₹${income.estimated_asset_value.toLocaleString(
                          "en-IN"
                        )}`
                      : "N/A"}
                  </p>
                </div>
              </section>

              {/* Bank Details */}
              <section className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Bank Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <p>
                    <span className="font-medium">Account Holder:</span>{" "}
                    {bank.account_holder_name || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Bank Name:</span>{" "}
                    {bank.bank_name || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Account No:</span>{" "}
                    {bank.account_no || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">IFSC:</span>{" "}
                    {bank.ifsc_code || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Branch:</span>{" "}
                    {bank.branch_name || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">UPI ID:</span>{" "}
                    {bank.upi_id || "N/A"}
                  </p>
                </div>
              </section>

              {/* Expenses */}
              <section className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Expenses Snapshot</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm mt-2">
                  <p>
                    <span className="font-medium">Monthly Household:</span>{" "}
                    {expenses.monthly_household_expense
                      ? `₹${expenses.monthly_household_expense.toLocaleString(
                          "en-IN"
                        )}`
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Business Expense:</span>{" "}
                    {expenses.monthly_business_expense
                      ? `₹${expenses.monthly_business_expense.toLocaleString(
                          "en-IN"
                        )}`
                      : "N/A"}
                  </p>
                </div>
              </section>

              {/* Govt Schemes */}
              <section className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">
                  Government Scheme Coverage
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <p>
                    <span className="font-medium">MGNREGA:</span>{" "}
                    {benStatus.mgnrega ? "Yes" : "No"}
                  </p>
                  <p>
                    <span className="font-medium">
                      PM Ujjwala Yojana:
                    </span>{" "}
                    {benStatus.pm_ujjwala_yojana ? "Yes" : "No"}
                  </p>
                  <p>
                    <span className="font-medium">PMJAY:</span>{" "}
                    {benStatus.pm_jay ? "Yes" : "No"}
                  </p>
                  <p>
                    <span className="font-medium">
                      Pension Scheme Enrolled:
                    </span>{" "}
                    {benStatus.enrolled_in_pension_scheme ? "Yes" : "No"}
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* ACTION BUTTONS */}
          {selectedApplication && (
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setOpenApproveForm(true)}>Approve</Button>
              <Button variant="destructive" onClick={handleRejectClick}>
                Reject
              </Button>
              <Button variant="outline" onClick={handleManualReviewClick}>
                Manual Review
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SECOND POPUP for approval form */}
      <ApproveFormDialog
        open={openApproveForm}
        onClose={() => setOpenApproveForm(false)}
        application={selectedApplication}
        onApproved={handleApproved}
      />
    </>
  );
};

export default ReviewApplicationDialog;
