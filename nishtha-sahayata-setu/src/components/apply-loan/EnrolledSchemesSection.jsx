import { useEffect } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const EnrolledSchemesSection = ({ form }) => {

  // -------------------------
  //  USE EFFECT → FETCH DATA
  useEffect(() => {
    const loan_application_id = localStorage.getItem("loan_application_id");
    const aadhaar_no = localStorage.getItem("aadhar_no");

    if (!loan_application_id || !aadhaar_no) {
      alert("local storage pronle44");
      return;
    };

    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:5010/api/enrolled_scheme`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ loan_application_id, aadhaar_no }),
        });

        const data = await res.json();
        console.log("Fetched:", data);

        if (res.ok && data.status) {
          form.reset({
            enrolledMgnrega: data.status.mgnrega ? "Yes" : "No",
            enrolledPmUjjwala: data.status.pm_ujjwala_yojana ? "Yes" : "No",
            enrolledPmJay: data.status.pm_jay ? "Yes" : "No",
            enrolledPensionScheme: data.status.enrolled_in_pension_scheme ? "Yes" : "No",
          });
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
  }, [form]);


  // -------------------------
  //   SUBMIT HANDLER (PUT)
  // -------------------------
  const onSubmit = async (data) => {
    const loan_application_id = localStorage.getItem("loan_application_id");
    const aadhaar_no = localStorage.getItem("aadhar_no");

    if (!loan_application_id || !aadhaar_no) {
      alert("Loan Application ID or Aadhaar not found");
      return;
    }

    const payload = {
      loan_application_id,
      aadhaar_no,
      mgnrega: data.enrolledMgnrega === "Yes",
      pm_ujjwala_yojana: data.enrolledPmUjjwala === "Yes",
      pm_jay: data.enrolledPmJay === "Yes",
      enrolled_in_pension_scheme: data.enrolledPensionScheme === "Yes",
    };

    const response = await fetch("http://localhost:5010/api/beneficiary/status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();
    console.log(resData);

    if (response.ok) {
      alert("Updated Successfully!");
    } else {
      alert("Update Failed!");
    }
  };

  // -------------------------
  //   JSX FORM FIELDS
  // -------------------------
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* MGNREGA */}
        <FormField
          control={form.control}
          name="enrolledMgnrega"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enrolled in MGNREGA *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Yes / No" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* PM Ujjwala */}
        <FormField
          control={form.control}
          name="enrolledPmUjjwala"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enrolled in PM Ujjwala Yojana *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Yes / No" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* PM-JAY */}
        <FormField
          control={form.control}
          name="enrolledPmJay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enrolled in PM-JAY *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Yes / No" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pension Scheme */}
        <FormField
          control={form.control}
          name="enrolledPensionScheme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enrolled in Pension Scheme *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Yes / No" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Save Enrolled Schemes
        </Button>
      </form>
    </Form>
  );
};
