// src/components/ApproveFormDialog.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// EMI helper (same logic as backend)
const calculateEmi = (principal, annualRate, months) => {
  const P = Number(principal) || 0;
  const N = Number(months) || 0;
  const r = (Number(annualRate) || 0) / 12 / 100;

  if (!P || !N || !r) return 0;

  const power = Math.pow(1 + r, N);
  const emi = (P * r * power) / (power - 1);
  return Math.round(emi);
};

const ApproveFormDialog = ({ open, onClose, application, onApproved }) => {
  const { toast } = useToast();

  const modelSuggestedAmount = useMemo(() => {
    // Prefer model estimatedSafeLoan; fallback to applied amount
    if (!application) return 0;
    if (application.estimatedSafeLoan) return application.estimatedSafeLoan;
    return application.amount || 0;
  }, [application]);

  const [sanctionedAmount, setSanctionedAmount] = useState("");
  const [tenureApproved, setTenureApproved] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Initialize defaults when dialog opens
  useEffect(() => {
    if (open && application) {
      setSanctionedAmount(modelSuggestedAmount);
      setTenureApproved(application.tenure || 24);
      setInterestRate(application.interest_rate || 4);
    }
  }, [open, application, modelSuggestedAmount]);

  const emi = useMemo(
    () => calculateEmi(sanctionedAmount, interestRate, tenureApproved),
    [sanctionedAmount, interestRate, tenureApproved]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!application) return;

    try {
      setSubmitting(true);

      const res = await fetch(
        "http://localhost:3000/api/loan-approval/approve",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loan_application_id: application.id,
            aadhar_no: application.aadhar_no,
            sanctionedAmount,
            tenureApproved,
            interestRate,
            modelSuggestedAmount,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Approval failed");
      }

      toast({
        title: "Loan Approved",
        description: `Application ${application.id} approved successfully. EMI ~ ₹${emi.toLocaleString(
          "en-IN"
        )}`,
      });

      if (onApproved) {
        onApproved({
          ...application,
          status: "APPROVED",
          sanctionedAmount,
          tenureApproved,
          interestRate,
          emi,
        });
      }

      onClose();
    } catch (err) {
      console.error("❌ Approve error:", err);
      toast({
        title: "Approval failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Approve Loan</DialogTitle>
          <DialogDescription>
            Application ID: {application?.id} — fill sanction details below.
          </DialogDescription>
        </DialogHeader>

        {application && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Model Suggested Amount (read-only) */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Model Suggested Loan Amount
              </label>
              <Input
                readOnly
                value={`₹${(modelSuggestedAmount || 0).toLocaleString("en-IN")}`}
              />
            </div>

            {/* Sanctioned Amount */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Loan Sanctioned Amount
              </label>
              <Input
                type="number"
                min={0}
                required
                value={sanctionedAmount}
                onChange={(e) => setSanctionedAmount(e.target.value)}
              />
            </div>

            {/* Tenure Approved */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Tenure Approved (months)</label>
              <Input
                type="number"
                min={1}
                required
                value={tenureApproved}
                onChange={(e) => setTenureApproved(e.target.value)}
              />
            </div>

            {/* Interest Rate */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Interest Rate (% per annum)</label>
              <Input
                type="number"
                step="0.1"
                min={0}
                required
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>

            {/* EMI (auto) */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Estimated EMI (auto calculated)
              </label>
              <Input
                readOnly
                value={
                  emi
                    ? `₹${emi.toLocaleString("en-IN")} / month`
                    : "Enter amount, tenure & interest rate"
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Approving..." : "Confirm Approval"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApproveFormDialog;
