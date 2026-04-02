// src/components/apply-loan/ExpensesSection.jsx
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Clock, CheckCircle2, Shield, Link as LinkIcon, Zap } from "lucide-react";

export const ExpensesSection = ({
  form,
  onSubmit,
  uploadedBills,
  setUploadedBills,
  handleVerifyElectricityBills,
  billApiConnected,
  handleBillApiConnect,
  mobileDetails,
  setMobileDetails,
  verifyMobileDetails,
  lpgDetails,
  setLpgDetails,
  lpgPdfFile,
  setLpgPdfFile,
  handleVerifyLpg,
}) => {

  const loanApplicationId = localStorage.getItem("loanApplicationId");

  return (


    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="upload">Upload Bills</TabsTrigger>
                {/* <TabsTrigger value="api">Connect via API</TabsTrigger> */}
              </TabsList>

              {/* UPLOAD TAB */}
              <TabsContent value="upload" className="space-y-4">
                <div className="rounded-lg space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Upload your recent utility bills for verification.
                    This helps improve your credit score accuracy.
                  </p>

                  {/* Electricity Bills */}
                  <div className="space-y-3">
                    <Label>Electricity Bills (Max 3 PDFs)</Label>

                    <Input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files || []);
                        const totalAllowed =
                          3 - uploadedBills.electricity.length;

                        const validFiles = newFiles.slice(0, totalAllowed);

                        setUploadedBills((prev) => ({
                          ...prev,
                          electricity: [
                            ...prev.electricity,
                            ...validFiles.map((f) => ({
                              files: [f],
                              verifying: false,
                              verified: false,
                            })),
                          ],
                        }));
                      }}
                      disabled={uploadedBills.electricity.length >= 3}
                    />

                    {uploadedBills.electricity.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {uploadedBills.electricity.map((bill, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-3 bg-background rounded-lg border"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />

                            <span className="text-sm flex-1">
                              {bill.files[0]?.name}
                            </span>

                            {bill.verifying ? (
                              <div className="flex items-center gap-2 text-primary">
                                <Clock className="h-4 w-4 animate-spin" />
                                <span className="text-xs">Verifying...</span>
                              </div>
                            ) : bill.verified ? (
                              <div className="flex items-center gap-1 text-success">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-medium">
                                  Verified
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Pending
                              </span>
                            )}

                            <button
                              type="button"
                              className="text-red-500 text-xs font-medium"
                              onClick={() => {
                                setUploadedBills((prev) => ({
                                  ...prev,
                                  electricity: prev.electricity.filter(
                                    (_, i) => i !== idx
                                  ),
                                }));
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        ))}

                        {!uploadedBills.electricity.every((b) => b.verified) && (
                          <Button
                            type="button"
                            size="sm"
                            className="mt-2"
                            disabled={uploadedBills.electricity.some(
                              (b) => b.verifying
                            )}
                            onClick={() => handleVerifyElectricityBills((loanApplicationId))}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Verify All Electricity Bills
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mobile Details */}
                  <div className="space-y-3">
                    <Label>Mobile Recharge Details</Label>

                    <div className="space-y-1">
                      <Label className="text-sm">
                        Average Recharge Amount (₹)
                      </Label>
                      <Input
                        type="number"
                        placeholder="Enter average monthly recharge amount"
                        value={mobileDetails.mobile_recharge_amt_avg}
                        onChange={(e) =>
                          setMobileDetails({
                            ...mobileDetails,
                            mobile_recharge_amt_avg: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm">
                        Recharge Frequency (per month)
                      </Label>
                      <Input
                        type="number"
                        placeholder="How many recharges per month?"
                        value={mobileDetails.mobile_recharge_freq_pm}
                        onChange={(e) =>
                          setMobileDetails({
                            ...mobileDetails,
                            mobile_recharge_freq_pm: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm">Provider</Label>
                      <Input
                        type="text"
                        placeholder="Jio / Airtel / VI / BSNL"
                        value={mobileDetails.provider}
                        onChange={(e) =>
                          setMobileDetails({
                            ...mobileDetails,
                            provider: e.target.value,
                          })
                        }
                      />
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={verifyMobileDetails}
                      disabled={mobileDetails.verifying}
                      className="mt-2"
                    >
                      {mobileDetails.verifying ? (
                        <div className="flex items-center gap-2 text-primary">
                          <Clock className="h-4 w-4 animate-spin" />
                          <span className="text-xs">Verifying...</span>
                        </div>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Verify Mobile Details
                        </>
                      )}
                    </Button>

                    {mobileDetails.verified && (
                      <div className="flex items-center gap-1 text-success mt-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Verified</span>
                      </div>
                    )}
                  </div>

                  {/* LPG Section */}
                  <div className="space-y-3">
                    <Label>LPG Bill Details</Label>

                    <Input
                      type="text"
                      placeholder="Enter LPG Consumer Number"
                      value={lpgDetails.consumer_no}
                      onChange={(e) =>
                        setLpgDetails((prev) => ({
                          ...prev,
                          consumer_no: e.target.value,
                        }))
                      }
                    />

                    <Input
                      type="number"
                      placeholder="Refills in last 3 months"
                      value={lpgDetails.lpg_refills_3m}
                      onChange={(e) =>
                        setLpgDetails((prev) => ({
                          ...prev,
                          lpg_refills_3m: e.target.value,
                        }))
                      }
                    />

                    <Input
                      type="number"
                      placeholder="Average Refill Cost"
                      value={lpgDetails.lpg_avg_cost}
                      onChange={(e) =>
                        setLpgDetails((prev) => ({
                          ...prev,
                          lpg_avg_cost: e.target.value,
                        }))
                      }
                    />

                    <Input
                      type="number"
                      placeholder="Average Refill Interval (days)"
                      value={lpgDetails.lpg_avg_refill_interval_days}
                      onChange={(e) =>
                        setLpgDetails((prev) => ({
                          ...prev,
                          lpg_avg_refill_interval_days: e.target.value,
                        }))
                      }
                    />

                    <Label>LPG Bill PDF (Optional)</Label>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setLpgPdfFile(e.target.files?.[0] || null)
                      }
                    />

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleVerifyLpg}
                      disabled={lpgDetails.verifying}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {lpgDetails.verifying ? "Verifying..." : "Verify LPG Details"}
                    </Button>

                    {lpgDetails.verified !== null && (
                      <div className="text-sm mt-2">
                        {lpgDetails.verified ? (
                          <span className="text-success font-medium">
                            <CheckCircle2 className="inline w-4 h-4" /> LPG Details
                            Verified
                          </span>
                        ) : (
                          <span className="text-destructive font-medium">
                            <Shield className="inline w-4 h-4" /> Suspicious Data
                            Detected!
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* API TAB */}
              <TabsContent value="api" className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
                  <div className="flex items-start gap-3">
                    <LinkIcon className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-primary mb-1">
                        Connect Your Accounts
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Give us secure access to automatically fetch your bill
                        payment history. This is faster and more accurate than
                        manual uploads.
                      </p>
                    </div>
                  </div>

                  {billApiConnected ? (
                    <div className="p-4 bg-success/10 border border-success rounded-lg">
                      <div className="flex items-center gap-2 text-success mb-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-semibold">
                          Connected Successfully
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        We're now able to fetch your bill payment data automatically.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3"
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 p-3 rounded-md border">
                        <Checkbox id="api-consent" />
                        <div className="space-y-1 leading-none">
                          <label
                            htmlFor="api-consent"
                            className="text-sm font-medium cursor-pointer"
                          >
                            I authorize secure access to my utility bill accounts
                          </label>
                          <p className="text-xs text-muted-foreground">
                            Your data is encrypted and will only be used for credit
                            assessment
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleBillApiConnect}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Connect Electricity Provider
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleBillApiConnect}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Connect Mobile Operator
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Remarks */}
          {/* <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any additional information" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Save Expense Details
          </Button> */}
        </form>
      </Form>
    </div>
  );
};
