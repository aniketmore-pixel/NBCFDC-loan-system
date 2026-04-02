import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

// ---------- Helpers ----------

const mapBackendStatus = (status) => {
  if (!status) return "Under Review";
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "PENDING":
      return "Pending";
    case "MANUAL_REVIEW":
      return "Manual Review";
    default:
      return "Under Review";
  }
};

const formatAppliedDate = (isoString) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  if (isNaN(date)) return "N/A";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatINR = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return value;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

const getStatusBadgeClasses = (status) => {
  switch (status) {
    case "Approved":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Rejected":
      return "bg-red-100 text-red-700 border border-red-200";
    case "Under Review":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Manual Review":
      return "bg-purple-100 text-purple-700 border border-purple-200";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusIcon = (status) => {
  if (status === "Approved") {
    return <CheckCircle2 className="h-3 w-3 mr-1" />;
  }
  if (status === "Rejected") {
    return <XCircle className="h-3 w-3 mr-1" />;
  }
  if (status === "Under Review") {
    return <Clock className="h-3 w-3 mr-1" />;
  }
  if (status === "Manual Review") return <AlertCircle className="h-3 w-3 mr-1" />; // NEW
  return null;
};

const getStatusProgress = (status) => {
  if (status === "Approved") return 100;
  if (status === "Rejected") return 100;
  if (status === "Under Review") return 60;
  if (status === "Manual Review") return 50;
  return 30;
};

// ---------- MAIN COMPONENT ----------

const TrackApplication = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // popup state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    applicationId: null,
    decision: null, // "Accepted" | "Rejected"
  });
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState("");

  // ---------- Fetch applications ----------
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const aadharNo = localStorage.getItem("aadhar_no");

        if (!aadharNo) {
          setError("Aadhaar number not found in browser. Please login again.");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `http://localhost:5010/api/applications/${aadharNo}`
        );

        // If 404 or error, try to parse message
        if (!res.ok) {
          const text = await res.text();
          console.error("Applications fetch error response:", text);
          setError("Failed to fetch applications.");
          setLoading(false);
          return;
        }

        const data = await res.json();

        if (!data.success) {
          setError("Failed to fetch applications.");
          setLoading(false);
          return;
        }

        // Filter out entries where loan_application_id or status is null
        const normalized = data.applications
          .filter(
            (app) =>
              app.loan_application_id !== null &&
              app.loan_application_id !== undefined &&
              app.status !== null &&
              app.status !== undefined
          )
          .map((app) => {
            const uiStatus = mapBackendStatus(app.status);
            const loanAmountApplied = formatINR(app.loan_amount_applied);
            const loanAmountApproved = app.loan_amount_approved
              ? formatINR(app.loan_amount_approved)
              : null;

            return {
              id: app.loan_application_id || "N/A",
              appliedDate: formatAppliedDate(app.applied_on),
              schemeName: app.scheme || "N/A",

              status: uiStatus,
              offerStatus:
                app.final_accept_by_user === true
                  ? "Accepted"
                  : app.final_accept_by_user === false
                  ? "Rejected"
                  : null,

              loanAmountApplied: loanAmountApplied || "N/A",
              tenureApplied: app.tenure_applied
                ? `${app.tenure_applied} months`
                : "N/A",
              loanAmountApproved,
              tenureApproved: app.tenure_approved
                ? `${app.tenure_approved} months`
                : null,

              physicalInterventionRequired:
                app.physical_intervention_required || false,
              physicalInterventionNote: app.physical_intervention_note || "",
              rejectionReason: app.rejection_reason || "",
              raw: app,
            };
          });

        setApplications(normalized);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Something went wrong while fetching applications.");
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // ---------- Open popup ----------
  const openConfirmDialog = (applicationId, decision) => {
    setDecisionError("");
    setConfirmChecked(false);
    setConfirmDialog({
      open: true,
      applicationId,
      decision, // "Accepted" or "Rejected"
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      applicationId: null,
      decision: null,
    });
    setConfirmChecked(false);
    setSubmittingDecision(false);
    setDecisionError("");
  };

  // ---------- Handle actual POST to backend ----------
  const handleConfirmDecision = async () => {
    if (!confirmDialog.applicationId || !confirmDialog.decision) return;
    setSubmittingDecision(true);
    setDecisionError("");

    try {
      const res = await fetch(
        "http://localhost:5010/api/applications/offer-decision",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loan_application_id: confirmDialog.applicationId,
            decision: confirmDialog.decision, // "Accepted" | "Rejected"
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Offer decision error response:", text);
        throw new Error("Failed to submit decision");
      }

      const data = await res.json();
      console.log("Offer decision saved:", data);

      // Update UI
      setApplications((prev) =>
        prev.map((app) =>
          app.id === confirmDialog.applicationId
            ? { ...app, offerStatus: confirmDialog.decision }
            : app
        )
      );

      closeConfirmDialog();
    } catch (err) {
      console.error(err);
      setDecisionError("Something went wrong while submitting your decision.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  // ---------- RENDER ----------

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Track Your Loan Applications
        </h1>
        <p className="text-muted-foreground">
          View the status of your applications, approved amounts and final
          offers.
        </p>
      </div>

      {loading && (
        <p className="text-muted-foreground text-sm">Loading applications…</p>
      )}

      {!loading && error && (
        <p className="text-red-600 text-sm font-medium">{error}</p>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="p-4 bg-muted rounded-lg text-center">
          <p className="text-muted-foreground text-sm">
            <strong>You haven&apos;t applied for any scheme yet.</strong>
            <br />
            Please apply for a scheme to begin your loan process.
          </p>
          <Button
            className="mt-3"
            size="sm"
            onClick={() => {
              window.location.href = "http://localhost:8080/dashboard/benefits";
            }}
          >
            Apply for a Scheme
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {!loading &&
          !error &&
          applications.map((app) => {
            const progressValue = getStatusProgress(app.status);

            return (
              <Card key={app.id} className="shadow-card">
                <CardHeader className="border-b pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Loan Application
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Loan ID:{" "}
                        <span className="font-medium text-foreground">
                          {app.id}
                        </span>{" "}
                        • Applied on {app.appliedDate}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground mt-1">
                        Scheme Applied:{" "}
                        <span className="font-medium text-foreground">
                          {app.schemeName}
                        </span>
                      </p>
                    </div>

                    <div className="text-right space-y-2">
                      <Badge className={getStatusBadgeClasses(app.status)}>
                        {getStatusIcon(app.status)}
                        {app.status}
                      </Badge>

                      <div className="text-sm">
                        <p className="text-xs text-muted-foreground">
                          Loan Amount Applied
                        </p>
                        <p className="font-semibold text-primary">
                          {app.loanAmountApplied}
                        </p>
                      </div>

                      {app.loanAmountApproved && (
                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground">
                            Loan Amount Approved
                          </p>
                          <p className="font-semibold text-emerald-600">
                            {app.loanAmountApproved}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Progress value={progressValue} className="h-2" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {app.status === "Approved" &&
                        "Your application has been approved. Please review and accept the final offer."}
                      {app.status === "Rejected" &&
                        "Your application has been rejected. See below for details."}
                      {app.status === "Under Review" &&
                        "Your application is being evaluated by the admin team."}
                      {app.status === "Manual Review" && 
  "Your application requires manual review. The admin team may contact you for additional information."}

                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5 pt-4">
                  {/* Core Details */}
                  <div className="grid gap-4 md:grid-cols-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Loan Amount Applied
                      </p>
                      <p className="font-medium">{app.loanAmountApplied}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Tenure Applied
                      </p>
                      <p className="font-medium">{app.tenureApplied}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Scheme Applied
                      </p>
                      <p className="font-medium">{app.schemeName}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Loan Amount Approved
                      </p>
                      <p className="font-medium">
                        {app.loanAmountApproved || (
                          <span className="text-muted-foreground">
                            Not decided
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Tenure Approved
                      </p>
                      <p className="font-medium">
                        {app.tenureApproved || (
                          <span className="text-muted-foreground">
                            Not decided
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Final Offer Status
                      </p>
                      <p className="font-medium flex items-center gap-1">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        {app.offerStatus
                          ? app.offerStatus === "Accepted"
                            ? "Offer Accepted"
                            : "Offer Rejected"
                          : app.status === "Approved"
                          ? "Action Pending from You"
                          : "Not Applicable"}
                      </p>
                    </div>
                  </div>

                  {/* Physical Intervention Block (future) */}
                  {app.physicalInterventionRequired && (
                    <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 flex gap-3 items-start">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 mb-1">
                          Physical Verification Required
                        </p>
                        <p className="text-amber-800/90">
                          {app.physicalInterventionNote ||
                            "A field officer will visit for physical verification as part of the assessment process."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason (future) */}
                  {app.status === "Rejected" && app.rejectionReason && (
                    <div className="p-3 rounded-lg border border-red-200 bg-red-50 flex gap-3 items-start">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-red-800 mb-1">
                          Reason for Rejection
                        </p>
                        <p className="text-red-800/90">{app.rejectionReason}</p>
                      </div>
                    </div>
                  )}

                  {/* Final Offer Actions (only if Approved) */}
                  {app.status === "Approved" && (
                    <div className="flex flex-col gap-2 border-t pt-4 mt-2">
                      <p className="text-sm font-medium">
                        Final Offer Confirmation
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Please review the approved loan amount and tenure. Once
                        you accept, the loan will be processed for disbursement.
                      </p>

                      <div className="flex flex-wrap gap-3 mt-2">
                        <Button
                          size="sm"
                          className="border-none"
                          disabled={
                            app.offerStatus === "Accepted" ||
                            app.offerStatus === "Rejected"
                          } // disable if any decision
                          onClick={() => openConfirmDialog(app.id, "Accepted")}
                        >
                          {app.offerStatus === "Accepted"
                            ? "Offer Accepted"
                            : "Accept Offer"}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            app.offerStatus === "Rejected" ||
                            app.offerStatus === "Accepted"
                          } // disable if any decision
                          onClick={() => openConfirmDialog(app.id, "Rejected")}
                        >
                          {app.offerStatus === "Rejected"
                            ? "Offer Rejected"
                            : "Reject Offer"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* ---------- Confirmation Dialog ---------- */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) closeConfirmDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.decision === "Accepted"
                ? "Confirm Acceptance"
                : "Confirm Rejection"}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                You are about to{" "}
                  <span className="font-semibold">
                    {confirmDialog.decision === "Accepted"
                      ? "ACCEPT"
                      : "REJECT"}
                  </span>{" "}
                the final loan offer for application ID{" "}
                <span className="font-mono">
                  {confirmDialog.applicationId}
                </span>
                .
              </p>
              <p>
                This action may affect your loan disbursement and future
                eligibility. Please confirm that you understand this.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-2 mt-2">
            <Checkbox
              id="confirm-checkbox"
              checked={confirmChecked}
              onCheckedChange={(val) => setConfirmChecked(!!val)}
            />
            <label
              htmlFor="confirm-checkbox"
              className="text-sm leading-tight text-muted-foreground cursor-pointer"
            >
              I have reviewed the offer details and I understand the impact of
              this decision.
            </label>
          </div>

          {decisionError && (
            <p className="text-xs text-red-600 mt-2">{decisionError}</p>
          )}

          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={closeConfirmDialog}
              disabled={submittingDecision}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDecision}
              disabled={!confirmChecked || submittingDecision}
            >
              {submittingDecision
                ? "Submitting..."
                : confirmDialog.decision === "Accepted"
                ? "Confirm Accept"
                : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackApplication;
