import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, ArrowRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const Home = () => {
  // ---------- BASIC USER INFO ----------
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const aadhar_no = localStorage.getItem("aadhar_no");
    if (!aadhar_no) return;

    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5010/api/beneficiary/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aadhar_no }),
        });

        const data = await res.json();
        if (data.success) {
          setFullName(data.beneficiary.full_name);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  // ---------- CREDIT MODEL STATES ----------
  // creditScore is 0–100 (coming from backend model)
  const [creditScore, setCreditScore] = useState(null);
  const [safeLoanAmount, setSafeLoanAmount] = useState(null);
  const [estimatedIncome, setEstimatedIncome] = useState(null);
  const [hasModelValues, setHasModelValues] = useState(false);
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const DUMMY_SAFE_LOAN = 150000;     // ₹1,50,000
  const DUMMY_INCOME = 25000;        // ₹25,000 per month


  // ---------- APPLICATIONS (for dynamic cards) ----------
  const [applications, setApplications] = useState([]);

  // ---------- CASTE / ELIGIBILITY STATUS ----------
  const [userStatus, setUserStatus] = useState(null);

  // Helper: currency formatter
  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  // ---------- FETCH APPLICATIONS (MODEL OUTPUTS + CARDS) ----------
  const fetchApplications = async (aadhaarNumber) => {
    try {
      setIsLoadingScore(true);
      const res = await fetch(
        `http://localhost:5010/api/applications/${aadhaarNumber}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.applications)) {
        setApplications(data.applications);

        const latestApp = data.applications[0]; // adjust sorting if needed

        if (latestApp) {
          // TODO: adjust field names as per your backend response
          const scoreFromBackend =
            typeof latestApp.composite_score === "number"
              ? latestApp.composite_score
              : typeof latestApp.credit_score === "number"
              ? latestApp.credit_score
              : null;

          const safeAmountFromBackend =
            typeof latestApp.safe_loan_amount === "number"
              ? latestApp.safe_loan_amount
              : null;

          const estimatedIncomeFromBackend =
            typeof latestApp.estimated_income === "number"
              ? latestApp.estimated_income
              : null;

          setCreditScore(scoreFromBackend);
          setSafeLoanAmount(safeAmountFromBackend);
          setEstimatedIncome(estimatedIncomeFromBackend);

          // If all three are present, treat as "model generated"
          if (
            scoreFromBackend !== null &&
            safeAmountFromBackend !== null &&
            estimatedIncomeFromBackend !== null
          ) {
            setHasModelValues(true);
          } else {
            setHasModelValues(false);
          }
        } else {
          // No applications
          setCreditScore(null);
          setSafeLoanAmount(null);
          setEstimatedIncome(null);
          setHasModelValues(false);
        }
      } else {
        // No success or no applications
        setApplications([]);
        setCreditScore(null);
        setSafeLoanAmount(null);
        setEstimatedIncome(null);
        setHasModelValues(false);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      setApplications([]);
      setCreditScore(null);
      setSafeLoanAmount(null);
      setEstimatedIncome(null);
      setHasModelValues(false);
    } finally {
      setIsLoadingScore(false);
    }
  };

  // Fetch caste verification status + applications on mount
  useEffect(() => {
    const aadhaarNumber = localStorage.getItem("aadhar_no");
    if (!aadhaarNumber) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `http://localhost:5010/api/eligible-beneficiary/${aadhaarNumber}`
        );
        const data = await res.json();

        if (data.success) {
          setUserStatus(data); // data has eligibility_status, verified, etc.
        } else {
          setUserStatus(null);
        }
      } catch (error) {
        console.error("Error fetching caste verification:", error);
      }
    };

    fetchStatus();
    fetchApplications(aadhaarNumber);
  }, []);

  // ---------- CIBIL CONVERSION & RISK LABEL ----------
  // If creditScore is null (no model yet), treat it as 0 so CIBIL becomes 300 (baseline)
  const normalized = Math.min(100, Math.max(0, creditScore ?? 0));
  const cibilScore = Math.round(329 + (normalized / 100) * 600); // 300–900

  // Needle angle for semi-circle (-90° to +90°)
  const progress = (cibilScore - 300) / 600; // 0–1
  const minAngle = -85;
  const maxAngle = 85;
  const angle = minAngle + progress * (maxAngle - minAngle);

  // Risk band label
  let riskLabel = "High Risk";
  if (!hasModelValues) {
    riskLabel = "Not Generated Yet";
  } else {
    if (cibilScore >= 550 && cibilScore < 650) riskLabel = "Moderate Risk";
    if (cibilScore >= 650 && cibilScore < 750) riskLabel = "Low Risk";
    if (cibilScore >= 750) riskLabel = "Very Low Risk";
  }

  // ---------- PROFILE COMPLETION ----------
  const profileCompletion = userStatus?.verified ? 100 : 75;

  // ---------- UPDATE SCORE HANDLER ----------
  // Only re-fetch from DB, do NOT recalculate model here
  const handleUpdateScore = () => {
    const aadhaarNumber = localStorage.getItem("aadhar_no");
    if (!aadhaarNumber) return;
    fetchApplications(aadhaarNumber);
  };

  // ---------- STATUS META FOR APPLICATION CARDS ----------
  const getStatusMeta = (status) => {
    const upper = (status || "").toUpperCase();

    if (upper === "APPROVED") {
      return {
        label: "Approved",
        badgeClass: "bg-success text-white",
        progress: 100,
      };
    }
    if (upper === "REJECTED" || upper === "DECLINED") {
      return {
        label: "Rejected",
        badgeClass: "bg-red-500 text-white",
        progress: 100,
      };
    }
    return {
      label: "Under Review",
      badgeClass: "bg-accent/10 text-accent border-accent",
      progress: 65,
      outline: true,
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Split applications into valid & invalid (missing ID or status)
  const validApplications = applications.filter(
    (app) => app.loan_application_id && app.status
  );
  const hasInvalidApplications =
    applications.length > 0 && validApplications.length !== applications.length;

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Welcome back, {fullName || "User"}
        </h1>
        <p className="text-muted-foreground">
          Your credit score and application overview
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* ---------------- CREDIT SCORE CARD ---------------- */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Credit Score</CardTitle>
                <CardDescription>
                  AI-powered composite creditworthiness assessment
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary"
              >
                {riskLabel}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* CIBIL-style TRUE Semicircle Gauge */}
            <div className="flex flex-col items-center">
              {/* Outer Semicircle */}
              <div className="relative w-48 h-24 overflow-hidden">
                <div
                  className="absolute w-48 h-48 rounded-full"
                  style={{
                    background:
                      "conic-gradient(#ef4444 0deg, #f97316 90deg, #eab308 180deg, #22c55e 270deg, #22c55e 360deg)",
                    top: "0",
                    left: "0",
                  }}
                ></div>

                {/* White masking for inner ring */}
                <div className="absolute w-40 h-40 rounded-full bg-white top-4 left-4"></div>

                {/* Needle */}
                <div
                  className="absolute w-1 bg-blue-600 h-20 origin-bottom"
                  style={{
                    left: "50%",
                    bottom: "-2px",
                    transform: `translateX(-50%) rotate(${angle}deg)`,
                  }}
                ></div>

                {/* Needle base circle */}
                <div className="absolute w-4 h-4 bg-blue-600 rounded-full left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2"></div>
              </div>

              {/* Score range labels */}
              <div className="mt-2 flex justify-between w-48 text-xs text-muted-foreground px-1">
                <span>300</span>
                <span>900</span>
              </div>

              {/* Score text */}
              <div className="mt-3 text-center">
                <div className="text-4xl font-bold text-primary">
                  {cibilScore}
                </div>
                <div className="text-xs text-muted-foreground">out of 900</div>
                {!hasModelValues && (
                  <p className="mt-1 text-[11px] text-muted-foreground italic">
                    Score will be generated once your first assessment is
                    completed.
                  </p>
                )}
              </div>
            </div>

            {/* Safe Loan Amount & Estimated Income */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Safe Loan Amount
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {Number.isFinite(safeLoanAmount) && hasModelValues ? (
                    currencyFormatter.format(safeLoanAmount)
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      Not generated yet
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {hasModelValues
                    ? "Indicative maximum amount you can safely borrow based on your current score."
                    : "We’ll calculate this once your credit model is generated."}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Estimated Income
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {Number.isFinite(estimatedIncome) && hasModelValues ? (
                    currencyFormatter.format(estimatedIncome)
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      Not generated yet
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {hasModelValues
                    ? "Income estimate used in this creditworthiness assessment."
                    : "Will be inferred from your applications and documents."}
                </p>
              </div>
            </div>

            {/* Info box */}
            <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">
                    Refresh Your Score
                  </p>
                  <p className="text-muted-foreground">
                    Update latest income and repayment details to recalculate
                    your score and safe loan amount.
                  </p>
                </div>
              </div>
            </div>

            {/* Update Score button – only re-fetches from DB */}
            <Button
              className="w-full"
              onClick={handleUpdateScore}
              disabled={isLoadingScore}
            >
              {isLoadingScore ? "Updating..." : "Update Score"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* ---------------- PROFILE & APPLICATION STATUS CARD ---------------- */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Your Status</CardTitle>
            <CardDescription>
              Profile completion and loan application tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Completion / Caste Verification */}
            <div
              className={`p-4 bg-primary/5 rounded-lg border border-primary/10 ${
                userStatus ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm flex-1">
                  <p className="font-medium mb-1">
                    Caste Verification {userStatus ? 100 : profileCompletion}%
                  </p>

                  <p className="text-muted-foreground text-xs mb-2">
                    {userStatus
                      ? "Your caste certificate is already verified"
                      : "Complete caste verification to proceed"}
                  </p>
                </div>

                {userStatus && (
                  <Badge className="bg-green-500 text-white">Verified</Badge>
                )}
              </div>

              <Progress
                value={userStatus ? 100 : profileCompletion}
                className="h-2"
              />

              {/* Button Logic */}
              {userStatus ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full mt-3"
                  disabled
                >
                  Caste Verified
                </Button>
              ) : (
                <Link to="/dashboard/profile">
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Caste Verification
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Apply for Loan Button */}
            {userStatus?.eligibility_status ? (
              <Link to="/dashboard/benefits">
                <Button className="w-full mt-3 bg-primary text-white hover:bg-primary/90">
                  Apply for Loan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      className="w-full mt-3 bg-gray-300 text-gray-600 cursor-not-allowed"
                      disabled
                    >
                      Apply for Loan
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-primary text-white">
                  Please complete caste verification to apply
                </TooltipContent>
              </Tooltip>
            )}

            {/* ---------- DYNAMIC LOAN APPLICATION CARDS ---------- */}
            {applications.length === 0 ? (
              <div className="p-4 rounded-lg border bg-card text-sm text-muted-foreground">
                You don&apos;t have any loan applications yet.
              </div>
            ) : (
              <>
                {validApplications.map((app) => {
                  const meta = getStatusMeta(app.status);
                  const displayAmountRaw =
                    app.loan_amount_approved ?? app.loan_amount_applied;
                  const displayAmountNumber = displayAmountRaw
                    ? Number(displayAmountRaw)
                    : null;
                  const displayAmount = displayAmountNumber
                    ? currencyFormatter.format(displayAmountNumber)
                    : "—";

                  return (
                    <div
                      key={app.loan_application_id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">
                            {app.scheme || "Loan Application"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Applied on {formatDate(app.applied_on)}
                          </p>
                        </div>

                        <Badge
                          className={
                            meta.outline ? `border ${meta.badgeClass}` : meta.badgeClass
                          }
                          variant={meta.outline ? "outline" : "default"}
                        >
                          {meta.label}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-muted-foreground">
                          Application ID: {app.loan_application_id}
                        </span>
                        <span className="font-medium">
                          Loan Amount Applied : {displayAmount}
                        </span>
                      </div>

                      <Progress value={meta.progress} className="h-2" />
                    </div>
                  );
                })}

                {hasInvalidApplications && (
                  <div className="p-4 rounded-lg border bg-card text-xs text-muted-foreground">
                   You haven't applied for any loan yet.
                  </div>
                )}
              </>
            )}

            <Link to="/dashboard/track">
              <Button variant="outline" className="w-full">
                View All Applications
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
