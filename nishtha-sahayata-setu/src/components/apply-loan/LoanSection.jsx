// src/components/apply-loan/LoanSection.jsx
import { useEffect, useState } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";

export const LoanSection = ({
  form,
  onSubmit,
  LOAN_THRESHOLD,
  loanAmount,
  setLoanAmount,
  showExpensesForLoan,
  selectedSchemeName,
  loanApplicationId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔹 Prefill loan details from backend (for refresh / View Application)
  useEffect(() => {
    const aadhar_no =
      typeof window !== "undefined"
        ? window.localStorage.getItem("aadhar_no")
        : null;

    const loanIdFromPropOrLS =
      loanApplicationId ||
      (typeof window !== "undefined"
        ? window.localStorage.getItem("loan_application_id")
        : null);

    console.log("📌 LoanSection prefill -> using IDs:", {
      aadhar_no,
      loan_application_id: loanIdFromPropOrLS,
    });

    if (!aadhar_no || !loanIdFromPropOrLS) {
      console.log(
        "ℹ️ No aadhar_no or loan_application_id. Skipping loan_details prefill."
      );
      return;
    }

    const fetchLoanDetails = async () => {
      try {
        console.log("🔵 Fetching existing loan_details for form prefill...");
        const url = `http://localhost:5010/api/loan-details?aadhar_no=${encodeURIComponent(
          aadhar_no
        )}&loan_application_id=${encodeURIComponent(loanIdFromPropOrLS)}`;

        const res = await fetch(url);
        const data = await res.json();

        console.log("🟣 Existing loan_details API response:", data);

        if (res.ok && data.success && data.record) {
          const record = data.record;
          const currentValues = form.getValues();

          const loanAmountStr =
            record.desired_loan_amount !== null &&
            record.desired_loan_amount !== undefined
              ? String(record.desired_loan_amount)
              : "";

          const desiredTenureStr =
            record.desired_tenure !== null &&
            record.desired_tenure !== undefined
              ? String(record.desired_tenure)
              : "";

          form.reset({
            ...currentValues,
            loanAmount: loanAmountStr,
            desiredTenure: desiredTenureStr,
            purpose: record.purpose_of_loan || "",
          });

          const parsedAmount = parseFloat(loanAmountStr) || 0;
          setLoanAmount(parsedAmount);

          console.log("✅ Loan form prefilled from backend");
        } else {
          console.log(
            "ℹ️ No existing loan_details record found for this loan/application."
          );
        }
      } catch (err) {
        console.error("🔥 Failed to fetch existing loan_details:", err);
      }
    };

    fetchLoanDetails();
  }, [form, setLoanAmount, loanApplicationId]);

  // 🔹 Submit: save loan details to backend, then call parent onSubmit
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const aadhar_no =
        typeof window !== "undefined"
          ? window.localStorage.getItem("aadhar_no")
          : null;

      const loan_application_id =
        loanApplicationId ||
        (typeof window !== "undefined"
          ? window.localStorage.getItem("loan_application_id")
          : null);

      console.log("📌 LoanSection submit -> IDs:", {
        aadhar_no,
        loan_application_id,
      });

      if (!aadhar_no || !loan_application_id) {
        console.error(
          "❌ Missing aadhar_no or loan_application_id in LoanSection"
        );
      }

      const payload = {
        aadhar_no,
        loan_application_id,
        loanAmount: values.loanAmount,
        desiredTenure: values.desiredTenure,
        purpose: values.purpose,
      };

      console.log("🔵 Sending payload to /api/loan-details:", payload);

      const res = await fetch("http://localhost:5010/api/loan-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("🟣 Loan Details API response:", data);

      if (res.ok && data.success) {
        console.log("✅ Loan details saved successfully on backend");
        if (onSubmit) onSubmit(values);
      } else {
        console.error("❌ Error from /api/loan-details:", data);
        if (onSubmit) onSubmit(values);
      }
    } catch (err) {
      console.error("🔥 Failed to save loan details:", err);
      if (onSubmit) onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
          <p className="text-sm font-medium text-primary mb-2">
            💰 Loan Eligibility Calculator
          </p>
          <p className="text-xs text-muted-foreground">
            {selectedSchemeName
              ? `You’re applying under the "${selectedSchemeName}" scheme. Enter your desired loan amount and purpose. For amounts above ₹1 Lakh, we’ll ask for a bit more detail about your expenses.`
              : "Enter your desired loan amount and purpose. For amounts above ₹1 Lakh, additional expense details will be required."}
          </p>
        </div>

        <FormField
          control={form.control}
          name="loanAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Desired Loan Amount (₹) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter amount (e.g., 50100)"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    const amount = parseFloat(e.target.value) || 0;
                    setLoanAmount(amount);
                  }}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                {loanAmount > LOAN_THRESHOLD ? (
                  <span className="text-accent font-medium">
                    ⚠️ Amount above ₹{(LOAN_THRESHOLD / 1000).toFixed(0)}K -
                    Additional details required
                  </span>
                ) : (
                  <span className="text-success font-medium">
                    ✓ Amount within basic eligibility
                  </span>
                )}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="desiredTenure"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Desired Tenure (in months) *</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 12, 24, 36" {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Choose the repayment duration you are comfortable with.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose of Loan *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe how you will use this loan (e.g., business expansion, medical expenses, education)"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showExpensesForLoan && loanAmount > LOAN_THRESHOLD && (
          <div className="space-y-6 p-6 border-2 border-accent rounded-lg bg-accent/5">
            <div className="flex items-center gap-2 text-accent">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">
                Additional Financial Information Required
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Household Expenses (₹) *</Label>
                <Input type="number" placeholder="e.g., 15010" required />
              </div>
              <div className="space-y-2">
                <Label>Monthly Business Expenses (₹)</Label>
                <Input type="number" placeholder="e.g., 10000" />
              </div>
              <div className="space-y-2">
                <Label>Existing Loan Repayments (₹/month)</Label>
                <Input type="number" placeholder="e.g., 5010" />
              </div>
              <div className="space-y-2">
                <Label>Electricity Bill (₹/month)</Label>
                <Input type="number" placeholder="e.g., 1200" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Commodities Owned</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "TV",
                  "Refrigerator",
                  "Washing Machine",
                  "Two-Wheeler",
                  "Four-Wheeler",
                  "Tractor",
                ].map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox id={`loan-${item}`} />
                    <label
                      htmlFor={`loan-${item}`}
                      className="text-sm cursor-pointer"
                    >
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 Tip: Make sure all previous profile sections are completed for
            faster loan approval, especially when applying under a specific
            scheme like{" "}
            {selectedSchemeName
              ? `"${selectedSchemeName}".`
              : "NBCFDC concessional schemes."}
          </p>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Submitting Loan Application..." : "Submit Loan Application"}
        </Button>
      </form>
    </Form>
  );
};
