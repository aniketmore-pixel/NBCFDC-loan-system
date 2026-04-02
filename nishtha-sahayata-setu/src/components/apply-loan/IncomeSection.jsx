// src/components/apply-loan/IncomeSection.jsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export const IncomeSection = ({
  form,
  onSubmit,
  selectedSchemeName,
  loanApplicationId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔹 Auto-fetch occupation from eligible_beneficiary using Aadhaar
  useEffect(() => {
    const aadharNo =
      typeof window !== "undefined"
        ? window.localStorage.getItem("aadhar_no")
        : null;

    console.log("📌 IncomeSection -> aadhar_no from localStorage:", aadharNo);

    if (!aadharNo) {
      console.warn(
        "⚠️ No aadhar_no found in localStorage. Occupation cannot be fetched."
      );
      return;
    }

    const fetchOccupation = async () => {
      try {
        console.log(
          "🔵 Calling /api/income-asset/occupation/",
          encodeURIComponent(aadharNo)
        );

        const res = await fetch(
          `http://localhost:5010/api/income-asset/occupation/${encodeURIComponent(
            aadharNo
          )}`
        );
        const data = await res.json();

        console.log("🟣 Occupation API response:", data);

        if (res.ok && data.success && data.occupation) {
          const occ = String(data.occupation).trim();
          form.setValue("employmentType", occ, {
            shouldDirty: true,
            shouldValidate: true,
          });
          console.log("✅ employmentType set in form:", occ);
        } else {
          console.error(
            "❌ Occupation API error or no occupation returned:",
            data
          );
        }
      } catch (err) {
        console.error("🔥 Failed to fetch occupation:", err);
      }
    };

    fetchOccupation();
  }, [form]);

  // 🔹 Prefill Income & Asset form from backend (for refresh / View Application)
  useEffect(() => {
    const aadharNo =
      typeof window !== "undefined"
        ? window.localStorage.getItem("aadhar_no")
        : null;

    const loanIdFromPropOrLS =
      loanApplicationId ||
      (typeof window !== "undefined"
        ? window.localStorage.getItem("loan_application_id")
        : null);

    console.log("📌 IncomeSection prefill -> using loan_application_id:", {
      fromProp: loanApplicationId,
      final: loanIdFromPropOrLS,
    });

    if (!aadharNo || !loanIdFromPropOrLS) {
      console.log(
        "ℹ️ No aadhar_no or loan_application_id. Skipping income_asset prefill."
      );
      return;
    }

    const fetchIncomeAsset = async () => {
      try {
        console.log(
          "🔵 Fetching existing income_asset data for form prefill..."
        );
        const url = `http://localhost:5010/api/income-asset?aadhar_no=${encodeURIComponent(
          aadharNo
        )}&loan_application_id=${encodeURIComponent(loanIdFromPropOrLS)}`;

        const res = await fetch(url);
        const data = await res.json();

        console.log("🟣 Existing income_asset API response:", data);

        if (res.ok && data.success && data.record) {
          const record = data.record;

          const currentValues = form.getValues();

          form.reset({
            ...currentValues,
            primaryIncomeSource: record.primary_income_source || "",
            monthlyIncome:
              record.monthly_income !== null &&
              record.monthly_income !== undefined
                ? String(record.monthly_income)
                : "",
            annualIncome:
              record.annual_income !== null &&
              record.annual_income !== undefined
                ? String(record.annual_income)
                : "",
            assetCount:
              record.asset_count !== null && record.asset_count !== undefined
                ? record.asset_count
                : 0,
            assetEstimatedValue:
              record.estimated_asset_value !== null &&
              record.estimated_asset_value !== undefined
                ? String(record.estimated_asset_value)
                : "",
          });

          console.log("✅ Income & Asset form prefilled from backend");
        } else {
          console.log(
            "ℹ️ No existing income_asset record found for this loan/application."
          );
        }
      } catch (err) {
        console.error("🔥 Failed to fetch existing income_asset:", err);
      }
    };

    fetchIncomeAsset();
  }, [form, loanApplicationId]);

  // 🔹 Submit: send to backend with the correct loan_application_id
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

      console.log("📌 IncomeSection submit -> IDs:", {
        aadhar_no,
        loan_application_id,
      });

      if (!aadhar_no || !loan_application_id) {
        console.error(
          "❌ Missing aadhar_no or loan_application_id in IncomeSection"
        );
      }

      const payload = {
        aadhar_no,
        loan_application_id,
        primaryIncomeSource: values.primaryIncomeSource,
        monthlyIncome: values.monthlyIncome,
        annualIncome: values.annualIncome,
        assetCount: values.assetCount,
        estimatedAssetValue: values.assetEstimatedValue,
      };

      console.log("🔵 Sending payload to /api/income-asset:", payload);

      const res = await fetch("http://localhost:5010/api/income-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("🟣 Income & Asset API response:", data);

      if (res.ok && data.success) {
        console.log("✅ Income & Asset details saved successfully");

        if (onSubmit) {
          onSubmit(values);
        }
      } else {
        console.error("❌ Error from /api/income-asset:", data);
        if (onSubmit) {
          onSubmit(values);
        }
      }
    } catch (err) {
      console.error("🔥 Failed to save income & asset details:", err);
      if (onSubmit) {
        onSubmit(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Occupation */}
        <FormField
          control={form.control}
          name="employmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Occupation *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Fetching occupation from records..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Self-employed">Self-employed</SelectItem>
                  <SelectItem value="Salaried">Salaried</SelectItem>
                  <SelectItem value="Labour">Labour</SelectItem>
                  <SelectItem value="Unemployed">Unemployed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                This occupation is auto-fetched from your eligibility records
                and cannot be edited here.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Primary Income Source */}
        <FormField
          control={form.control}
          name="primaryIncomeSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Income Source *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Small Business, Daily Wage"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Monthly & Annual Income */}
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="monthlyIncome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Income (₹) *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter amount" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="annualIncome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Income (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter annual income"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Asset Count & Value */}
        <div className="grid md:grid-cols-2 gap-4 items-end">
          <FormField
            control={form.control}
            name="assetCount"
            render={({ field }) => {
              const value = Number(field.value) || 0;

              const handleChange = (newVal) => {
                if (newVal < 0) newVal = 0;
                field.onChange(newVal);
              };

              return (
                <FormItem>
                  <FormLabel>Asset Count</FormLabel>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleChange(value - 1)}
                      disabled={isSubmitting}
                    >
                      -
                    </Button>

                    <div className="min-w-[3rem] text-center text-sm font-medium">
                      {value}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleChange(value + 1)}
                      disabled={isSubmitting}
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total count of significant assets (e.g., land, shop,
                    vehicle, etc.).
                  </p>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="assetEstimatedValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Asset Value (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Total estimated value"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  Approximate total market value of all your assets.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tip */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 Tip: Providing accurate Income & Asset Details helps improve your
            credit score accuracy and loan eligibility, especially for
            scheme-based loans like{" "}
            {selectedSchemeName ? `"${selectedSchemeName}"` : "NBCFDC schemes"}.
          </p>
        </div>

        {/* Upload Income Proof */}
        <div className="space-y-2">
          <Label>Upload Income Proof (Optional)</Label>
          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            Upload payslip, sale receipt, or income certificate
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving Income & Asset Details...
            </span>
          ) : (
            "Save Income & Asset Details"
          )}
        </Button>
      </form>
    </Form>
  );
};
