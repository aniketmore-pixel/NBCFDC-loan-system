// src/components/apply-loan/BankSection.jsx
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const BankSection = ({ form, onSubmit, loanApplicationId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔹 Prefill bank details from backend (for refresh / View Application)
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

    console.log("📌 BankSection prefill -> using IDs:", {
      aadhar_no,
      loan_application_id: loanIdFromPropOrLS,
    });

    if (!aadhar_no || !loanIdFromPropOrLS) {
      console.log(
        "ℹ️ No aadhar_no or loan_application_id. Skipping bank_details prefill."
      );
      return;
    }

    const fetchBank = async () => {
      try {
        console.log("🔵 Fetching existing bank_details for form prefill...");
        const url = `http://localhost:5010/api/bank-details?aadhar_no=${encodeURIComponent(
          aadhar_no
        )}&loan_application_id=${encodeURIComponent(loanIdFromPropOrLS)}`;

        const res = await fetch(url);
        const data = await res.json();

        console.log("🟣 Existing bank_details API response:", data);

        if (res.ok && data.success && data.record) {
          const record = data.record;
          const currentValues = form.getValues();

          form.reset({
            ...currentValues,
            accountHolderName: record.account_holder_name || "",
            bankName: record.bank_name || "",
            accountNumber: record.account_no || "",
            confirmAccountNumber: record.account_no || "",
            ifscCode: record.ifsc_code || "",
            branchName: record.branch_name || "",
            upiId: record.upi_id || "",
            consent: true, // assume previously consented if data exists
          });

          console.log("✅ Bank form prefilled from backend");
        } else {
          console.log(
            "ℹ️ No existing bank_details record found for this loan/application."
          );
        }
      } catch (err) {
        console.error("🔥 Failed to fetch existing bank_details:", err);
      }
    };

    fetchBank();
  }, [form, loanApplicationId]);

  // 🔹 Submit: save to backend + then call parent onSubmit
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

      console.log("📌 BankSection submit -> IDs:", {
        aadhar_no,
        loan_application_id,
      });

      if (!aadhar_no || !loan_application_id) {
        console.error(
          "❌ Missing aadhar_no or loan_application_id in BankSection"
        );
      }

      const payload = {
        aadhar_no,
        loan_application_id,
        accountHolderName: values.accountHolderName,
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        ifscCode: values.ifscCode,
        branchName: values.branchName,
        upiId: values.upiId,
      };

      console.log("🔵 Sending payload to /api/bank-details:", payload);

      const res = await fetch("http://localhost:5010/api/bank-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("🟣 Bank Details API response:", data);

      if (res.ok && data.success) {
        console.log("✅ Bank details saved successfully");
        if (onSubmit) onSubmit(values);
      } else {
        console.error("❌ Error from /api/bank-details:", data);
        if (onSubmit) onSubmit(values);
      }
    } catch (err) {
      console.error("🔥 Failed to save bank details:", err);
      if (onSubmit) onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="accountHolderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Holder Name *</FormLabel>
              <FormControl>
                <Input placeholder="Must match Aadhaar name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bankName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter bank name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter account number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmAccountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Account Number *</FormLabel>
                <FormControl>
                  <Input placeholder="Re-enter account number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ifscCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IFSC Code *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter 11-character IFSC"
                    maxLength={11}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="branchName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter branch name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="upiId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UPI ID (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="yourname@upi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>Passbook Copy / Bank Statement (Optional)</Label>
          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" />
        </div>

        {/* Consent */}
        <FormField
          control={form.control}
          name="consent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="consent-checkbox"
                  />
                </div>
              </FormControl>

              <div className="space-y-1 leading-none">
                <FormLabel>
                  I authorize NBCFDC to verify my bank details *
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving Bank Details..." : "Save Bank Details"}
        </Button>
      </form>
    </Form>
  );
};
