// src/pages/ApplyLoan.jsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Icons
import {
  Home as HomeIcon,
  Wallet,
  FileText,
  CreditCard,
  DollarSign,
} from "lucide-react";

// ✅ Section Components
import { ProfileSidebar } from "@/components/apply-loan/ProfileSidebar";
import { IncomeSection } from "@/components/apply-loan/IncomeSection";
import { BankSection } from "@/components/apply-loan/BankSection";
import { ExpensesSection } from "@/components/apply-loan/ExpensesSection";
import { RationSection } from "@/components/apply-loan/RationSection";
import { EnrolledSchemesSection } from "@/components/apply-loan/EnrolledSchemesSection";
import { LoanSection } from "@/components/apply-loan/LoanSection";

const cn = (...classes) => classes.filter(Boolean).join(" ");
const useToast = () => ({
  toast: ({ title, description }) => {
    alert(`${title}\n${description}`);
  },
});

/* ---------------------- ZOD SCHEMAS ---------------------- */

const incomeDetailsSchema = z.object({
  employmentType: z.enum(["Self-employed", "Salaried", "Labour", "Unemployed"]),
  primaryIncomeSource: z.string().min(2, "This field is required"),
  monthlyIncome: z.string().min(1, "Monthly income is required"),
  secondaryIncome: z.string().optional(),
  householdMembers: z.string().optional(),
  annualIncome: z.string().optional(),
  assetCount: z.any().optional(),
  assetEstimatedValue: z
    .string()
    .min(1, "Estimated asset value is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Enter a valid non-negative amount",
    }),
});

const bankDetailsSchema = z
  .object({
    accountHolderName: z.string().min(2, "Account holder name is required"),
    bankName: z.string().min(2, "Bank name is required"),
    accountNumber: z.string().min(9, "Invalid account number"),
    confirmAccountNumber: z.string().min(9, "Invalid account number"),
    ifscCode: z.string().length(11, "IFSC code must be 11 characters"),
    branchName: z.string().optional(),
    upiId: z.string().optional(),
    consent: z.boolean().refine((val) => val === true, "You must give consent"),
  })
  .refine((data) => data.accountNumber === data.confirmAccountNumber, {
    message: "Account numbers don't match",
    path: ["confirmAccountNumber"],
  });

const expensesSchema = z.object({
  monthlyHouseholdExpenses: z.string().optional(),
  monthlyBusinessExpenses: z.string().optional(),
  monthlyLoanRepayments: z.string().optional(),
  electricityBill: z.string().optional(),
  mobileRecharge: z.string().optional(),
  otherUtilities: z.string().optional(),
  commodities: z.array(z.string()).optional(),
  remarks: z.string().optional(),
});

const loanApplicationSchema = z.object({
  loanAmount: z.string().min(1, "Loan amount is required"),
  desiredTenure: z.string().min(1, "Desired tenure is required"),
  purpose: z.string().min(10, "Please provide purpose (minimum 10 characters)"),
});




const enrolledSchemesSchema = z.object({
  enrolledMgnrega: z.enum(["Yes", "No"], {
    required_error: "Please select an option",
  }),
  enrolledPmUjjwala: z.enum(["Yes", "No"], {
    required_error: "Please select an option",
  }),
  enrolledPmJay: z.enum(["Yes", "No"], {
    required_error: "Please select an option",
  }),
  enrolledPensionScheme: z.enum(["Yes", "No"], {
    required_error: "Please select an option",
  }),
});

/* ---------------------- SIDEBAR SECTIONS ---------------------- */

export const profileSections = [
  {
    id: "income",
    title: "Income & Asset Details",
    icon: Wallet,
    completed: false,
  },
  { id: "bank", title: "Bank Details", icon: CreditCard, completed: false },
  {
    id: "expenses",
    title: "Expenses & Commodities",
    icon: HomeIcon,
    completed: false,
  },
  {
    id: "House Hold and Ration Card Detail",
    title: "House Hold and Ration Card Detail",
    icon: FileText,
    completed: false,
  },
  {
    id: "schemes",
    title: "Enrolled Schemes",
    icon: FileText,
    completed: false,
  },
  { id: "loan", title: "Apply for Loan", icon: DollarSign, completed: false },
];

/* ------------------------- MAIN COMPONENT ------------------------- */

const ApplyLoan = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // Toast state for mobile verification
  const [mobileToast, setMobileToast] = useState({
    show: false,
    title: "",
    description: "",
    type: "", // "success" or "error"
  });


  const rawSchemeQuery = searchParams.get("scheme");
  const decodedScheme = rawSchemeQuery
    ? decodeURIComponent(rawSchemeQuery)
    : null;
  const cleanedSchemeName = decodedScheme
    ? decodedScheme.replace(/–/g, " ").replace(/-/g, " ")
    : null;

  // 🔹 Loan ID passed from Benefits (View Application)
  const applicationIdFromQuery = searchParams.get("applicationId");

  const selectedSchemeName = cleanedSchemeName;

  const pageTitle = selectedSchemeName
    ? `Complete Your Profile for ${selectedSchemeName} 🚀`
    : "Complete Your Profile 🚀";

  const [selectedSection, setSelectedSection] = useState("income");

  // ✅ Single source of truth for ACTIVE loan_application_id
  const [currentLoanApplicationId, setCurrentLoanApplicationId] = useState(() => {
    if (applicationIdFromQuery) return applicationIdFromQuery;
    if (typeof window !== "undefined") {
      const ls = window.localStorage.getItem("loan_application_id");
      return ls || "";
    }
    return "";
  });

  // Keep localStorage in sync when coming from Benefits (View / Apply)
  useEffect(() => {
    if (!applicationIdFromQuery) return;

    console.log(
      "🔵 ApplyLoan: syncing loan_application_id from URL:",
      applicationIdFromQuery
    );

    setCurrentLoanApplicationId(applicationIdFromQuery);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("loan_application_id", applicationIdFromQuery);
    }
  }, [applicationIdFromQuery]);

  // ✅ Persist completed sections across refresh
  const [completedSections, setCompletedSections] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("applyLoanCompletedSections");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse completedSections from localStorage", e);
      return [];
    }
  });

  const { toast } = useToast();

  // Aadhaar / Digilocker / API state
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [digilockerConnected, setDigilockerConnected] = useState(false);
  const [billApiConnected, setBillApiConnected] = useState(false);
  const [verifyingAadhaar, setVerifyingAadhaar] = useState(false);

  // Ration state
  const [rationFetched, setRationFetched] = useState(false);
  const [fetchingRation, setFetchingRation] = useState(false);
  const [rationNumber, setRationNumber] = useState("");
  const [rationError, setRationError] = useState("");

  const [rationDetails, setRationDetails] = useState({
    householdSize: "",
    dependentCount: "",
    earnersCount: "",
    dependencyRatio: "",
    rationCategory: "",
  });

  const [seccFetched, setSeccFetched] = useState(false);
  const [fetchingSECC, setFetchingSECC] = useState(false);
  const [seccDetails, setSeccDetails] = useState({
    category: "",
    score: "",
  });

  // Expenses: bills, LPG, mobile
  const [uploadedBills, setUploadedBills] = useState({
    electricity: [],
    mobile: [],
    other: [],
  });

  const [lpgDetails, setLpgDetails] = useState({
    consumer_no: "",
    lpg_refills_3m: "",
    lpg_avg_cost: "",
    lpg_avg_refill_interval_days: "",
    verifying: false,
    verified: null,
  });

  const [lpgPdfFile, setLpgPdfFile] = useState(null);

  const [mobileDetails, setMobileDetails] = useState({
    mobile_recharge_amt_avg: "",
    mobile_recharge_freq_pm: "",
    provider: "",
    verifying: false,
    verified: false,
    flag: null,
  });

  // Documents
  const [uploadedDocuments, setUploadedDocuments] = useState({
    caste: { file: null, verified: false, verifying: false },
    aadhaar: { file: null, verified: false, verifying: false },
    pan: { file: null, verified: false, verifying: false },
    address: { file: null, verified: false, verifying: false },
    business: { file: null, verified: false, verifying: false },
    signature: { file: null, verified: false, verifying: false },
    selfie: { file: null, verified: false, verifying: false },
  });

  // Loan state
  const [loanAmount, setLoanAmount] = useState(0);
  const [showExpensesForLoan, setShowExpensesForLoan] = useState(false);
  const LOAN_THRESHOLD = 100000;

  /* ---------------------- REACT-HOOK-FORM INSTANCES ---------------------- */

  const incomeForm = useForm({
    resolver: zodResolver(incomeDetailsSchema),
    defaultValues: {
      employmentType: "Self-employed",
      assetCount: 0,
      assetEstimatedValue: "",
    },
  });

  const bankForm = useForm({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      consent: false,
    },
  });

  const expensesForm = useForm({
    resolver: zodResolver(expensesSchema),
    defaultValues: {
      commodities: [],
    },
  });

  const loanForm = useForm({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      loanAmount: "",
      desiredTenure: "",
      purpose: "",
    },
  });

  const enrolledSchemesForm = useForm({
    resolver: zodResolver(enrolledSchemesSchema),
    defaultValues: {
      enrolledMgnrega: "",
      enrolledPmUjjwala: "",
      enrolledPmJay: "",
      enrolledPensionScheme: "",
    },
  });

  /* ---------------------- HANDLERS ---------------------- */

  const markSectionCompleted = (id) => {
    setCompletedSections((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "applyLoanCompletedSections",
          JSON.stringify(updated)
        );
      }
      return updated;
    });
  };

  const { toast: _t } = useToast();

  const onIncomeSubmit = (data) => {
    console.log("Income Income & Asset Details:", data);
    markSectionCompleted("income");
    toast({
      title: "Income & Asset Details Saved",
      description: "Your income information has been saved successfully.",
      variant: "success",
    });
  };

  const onBankSubmit = (data) => {
    console.log("Bank Details:", data);
    markSectionCompleted("bank");
    toast({
      title: "Bank Details Saved",
      description: "Your bank information has been saved successfully.",
      variant: "success",
    });
  };

  const onExpensesSubmit = (data) => {
    console.log("Expenses Details:", data);
    markSectionCompleted("expenses");
    toast({
      title: "Expenses Details Saved",
      description: "Your expense information has been saved successfully.",
      variant: "success",
    });
  };

  const onEnrolledSchemesSubmit = (values) => {
    console.log("Enrolled schemes data:", values);
    markSectionCompleted("schemes");
    toast({
      title: "Enrolled Schemes Saved",
      description: "Your enrolled schemes information has been saved.",
      variant: "success",
    });
  };

  const onLoanSubmit = (data) => {
    console.log("Loan Application:", data);

    const amount = parseFloat(data.loanAmount);
    const tenure = parseInt(data.desiredTenure, 10) || 0;

    if (amount > LOAN_THRESHOLD && !showExpensesForLoan) {
      setLoanAmount(amount);
      setShowExpensesForLoan(true);
      toast({
        title: "Additional Information Required",
        description: `For loans above ₹${(LOAN_THRESHOLD / 1000).toFixed(
          0
        )}K, please fill expenses & commodities details below.`,
        variant: "default",
      });
      return;
    }

    markSectionCompleted("loan");

    toast({
      title: "Loan Application Submitted",
      description: `Your loan application for ₹${amount.toLocaleString(
        "en-IN"
      )} over ${tenure ? `${tenure} months` : "your selected tenure"
        } has been submitted for review. Processing will begin shortly.`,
      variant: "success",
    });
  };

  const handleBillApiConnect = () => {
    setTimeout(() => {
      setBillApiConnected(true);
      toast({
        title: "API Connected Successfully",
        description: "Your bill payment accounts have been linked.",
        variant: "success",
      });
    }, 1500);
  };

  const handleVerifyElectricityBills = async () => {
    const loanApplicationId = localStorage.getItem("loan_application_id");
    const aadharNo = localStorage.getItem("aadhar_no");

    setUploadedBills((prev) => ({
      ...prev,
      electricity: prev.electricity.map((b) => ({ ...b, verifying: true })),
    }));

    const formData = new FormData();
    uploadedBills.electricity.forEach((bill) => {
      formData.append("bills", bill.files[0]);
    });

    formData.append("loan_application_id", loanApplicationId);
    formData.append("aadhar_no", aadharNo);

    try {
      const res = await fetch("http://localhost:5010/api/verify/electricity", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setUploadedBills((prev) => ({
        ...prev,
        electricity: prev.electricity.map((b, idx) => ({
          ...b,
          verifying: false,
          verified: data.verifiedBills[idx],
        })),
      }));
    } catch (err) {
      console.error("Verification failed", err);
      setUploadedBills((prev) => ({
        ...prev,
        electricity: prev.electricity.map((b) => ({
          ...b,
          verifying: false,
          verified: false,
        })),
      }));
    }
  };

  const verifyMobileDetails = async () => {
    try {
      setMobileDetails((prev) => ({ ...prev, verifying: true }));

      const aadhar_no =
        typeof window !== "undefined"
          ? localStorage.getItem("aadhar_no")
          : null;

      const res = await fetch("http://localhost:5010/api/mobile/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhar_no,
          loan_application_id, // <-- pass loan ID
          mobile_recharge_amt_avg: mobileDetails.mobile_recharge_amt_avg,
          mobile_recharge_freq_pm: mobileDetails.mobile_recharge_freq_pm,
          provider: mobileDetails.provider,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.msg || "Verification failed");
      }

      setMobileDetails((prev) => ({
        ...prev,
        verifying: false,
        verified: data.match,
        flag: data.flag,
      }));

      setUploadedBills((prev) => ({
        ...prev,
        mobile: prev.mobile.map((bill) => ({
          ...bill,
          verifying: false,
          verified: data.match,
        })),
      }));

      toast({
        title: data.match ? "Mobile Bill Verified ✔️" : "Suspicious Data ❗",
        description: data.match
          ? "All mobile details matched your records."
          : "Mismatch found. Flag has been set to suspicious.",
        variant: data.match ? "success" : "destructive",
      });
      

    } catch (err) {
      console.error(err);
      setMobileDetails((prev) => ({ ...prev, verifying: false }));

      setMobileToast({
        show: true,
        title: "Verification Error",
        description: "Unable to verify mobile data.",
        type: "error",
      });
    }
  };


  // const handleVerifyLpg = async () => {
  //   try {
  //     const aadhar_no = localStorage.getItem("aadhar_no");
  //     const loan_application_id = localStorage.getItem("loan_application_id");

  //     if (!aadhar_no) {
  //       toast({
  //         title: "Aadhaar Missing",
  //         description: "Aadhaar not found in localStorage.",
  //         variant: "destructive",
  //       });
  //       return;
  //     }

  //     if (!loan_application_id) {
  //       toast({
  //         title: "Loan Application ID Missing",
  //         description: "Loan application ID not found in localStorage.",
  //         variant: "destructive",
  //       });
  //       return;
  //     }

  //     setLpgDetails((prev) => ({ ...prev, verifying: true }));

  //     const res = await fetch("http://localhost:5010/api/lpg/verify", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         aadhar_no,
  //         loan_application_id,
  //         consumer_no: lpgDetails.consumer_no,
  //         lpg_refills_3m: lpgDetails.lpg_refills_3m,
  //         lpg_avg_cost: lpgDetails.lpg_avg_cost,
  //         lpg_avg_refill_interval_days:
  //           lpgDetails.lpg_avg_refill_interval_days,
  //       }),
  //     });

  //     const data = await res.json();

  //     setLpgDetails((prev) => ({
  //       ...prev,
  //       verifying: false,
  //       verified: data.match,
  //     }));

  //     toast({
  //       title: data.match ? "LPG Bill Verified" : "Suspicious LPG Data",
  //       description: data.match
  //         ? "Your LPG details match our records."
  //         : "Mismatch found. Flag has been updated.",
  //       variant: data.match ? "success" : "destructive",
  //     });
  //   } catch (error) {
  //     console.error(error);

  //     setLpgDetails((prev) => ({ ...prev, verifying: false }));

  //     toast({
  //       title: "Verification Error",
  //       description: "Unable to verify LPG data.",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const handleVerifyLpg = async () => {
    try {
      const aadhar_no =
        typeof window !== "undefined"
          ? localStorage.getItem("aadhar_no")
          : null;

      if (!aadhar_no) {
        toast({
          title: "Aadhaar Missing",
          description: "Aadhaar not found in localStorage.",
          variant: "destructive",
        });
        return;
      }
  
      if (!loan_application_id) {
        toast({
          title: "Loan Application ID Missing",
          description: "Loan Application ID not found in localStorage.",
          variant: "destructive",
        });
        return;
      }
  
      setLpgDetails((prev) => ({ ...prev, verifying: true }));
  
      const res = await fetch("http://localhost:5010/api/lpg/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhar_no,
          loan_application_id,
          consumer_no: String(lpgDetails.consumer_no).trim(),
          lpg_refills_3m: Number(lpgDetails.lpg_refills_3m),
          lpg_avg_cost: Number(lpgDetails.lpg_avg_cost),
          lpg_avg_refill_interval_days: Number(
            lpgDetails.lpg_avg_refill_interval_days
          ),
        }),
      });
  
      const data = await res.json();
  
      setLpgDetails((prev) => ({
        ...prev,
        verifying: false,
        verified: data.match,
      }));
  
      toast({
        title: data.match ? "LPG Bill Verified" : "Suspicious LPG Data",
        description: data.match
          ? "Your LPG details match our records."
          : "Mismatch found. Flag has been updated.",
        variant: data.match ? "success" : "destructive",
      });
    } catch (error) {
      console.error(error);
      setLpgDetails((prev) => ({ ...prev, verifying: false }));
  
      toast({
        title: "Verification Error",
        description: "Unable to verify LPG data.",
        variant: "destructive",
      });
    }
  };

  const handleFetchRationDetails = async () => {
    try {
      setFetchingRation(true);
      setRationError("");

      const res = await fetch(
        `http://localhost:5010/api/ration/${rationNumber}`
      );
      const data = await res.json();

      if (!data.success) {
        setRationError(data.message || "Failed to fetch details.");
        setFetchingRation(false);
        return;
      }

      setRationDetails(data.rationDetails);
      setSeccDetails(data.seccDetails || { category: "", score: "" });
      setRationFetched(true);
      setSeccFetched(!!data.seccDetails);
      setFetchingRation(false);
    } catch (err) {
      console.error(err);
      setRationError("Failed to fetch details.");
      setFetchingRation(false);
    }
  };

  const completedCount = completedSections.length;
  const progressPercentage = (completedCount / profileSections.length) * 100;

  console.log("📌 ApplyLoan: using loan_application_id =", currentLoanApplicationId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pt-20">
      {/* PAGE HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-1">{pageTitle}</h1>
        <p className="text-muted-foreground">
          {selectedSchemeName
            ? `You’re applying under the "${selectedSchemeName}" scheme. Please complete all sections to help us assess your eligibility smoothly.`
            : "Fill all sections to maximize your credit score and loan eligibility."}
        </p>

        {selectedSchemeName && (
          <p className="mt-2 text-sm text-primary/80">
            Selected Scheme:{" "}
            <span className="font-semibold">{selectedSchemeName}</span>
          </p>
        )}
      </div>

      {/* PROGRESS CARD
      <Card className="shadow-lg mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile Completeness</span>
            <span className="text-sm font-bold text-primary">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3 bg-gray-200" />
        </CardContent>
      </Card> */}

      {/* LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8">
        {/* SIDEBAR */}
        <ProfileSidebar
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
          completedSections={completedSections}
        />

        {/* MAIN CARD */}
        <Card className="shadow-lg min-h-[500px]">
          <CardHeader className="border-b">
            <CardTitle>
              {profileSections.find((s) => s.id === selectedSection)?.title}
            </CardTitle>
            <CardDescription>
              Complete this section to improve your loan eligibility.
            </CardDescription>
          </CardHeader>

          <CardContent className="py-6 max-h-[calc(600px)] overflow-y-auto">
            {/* INCOME SECTION */}
            {selectedSection === "income" && (
              <IncomeSection
                form={incomeForm}
                onSubmit={onIncomeSubmit}
                selectedSchemeName={selectedSchemeName}
                loanApplicationId={currentLoanApplicationId}
              />
            )}

            {/* BANK SECTION */}
            {selectedSection === "bank" && (
              <BankSection
                form={bankForm}
                onSubmit={onBankSubmit}
                loanApplicationId={currentLoanApplicationId}
              />
            )}

            {/* EXPENSES & COMMODITIES */}
            {selectedSection === "expenses" && (
              <ExpensesSection
                form={expensesForm}
                onSubmit={onExpensesSubmit}
                uploadedBills={uploadedBills}
                setUploadedBills={setUploadedBills}
                handleVerifyElectricityBills={handleVerifyElectricityBills}
                billApiConnected={billApiConnected}
                handleBillApiConnect={handleBillApiConnect}
                mobileDetails={mobileDetails}
                setMobileDetails={setMobileDetails}
                verifyMobileDetails={verifyMobileDetails}
                lpgDetails={lpgDetails}
                setLpgDetails={setLpgDetails}
                lpgPdfFile={lpgPdfFile}
                setLpgPdfFile={setLpgPdfFile}
                handleVerifyLpg={handleVerifyLpg}
              />
            )}

            {/* RATION CARD SECTION */}
            {selectedSection === "House Hold and Ration Card Detail" && (
              <RationSection
                rationFetched={rationFetched}
                rationDetails={rationDetails}
                digilockerConnected={digilockerConnected}
                seccFetched={seccFetched}
                seccDetails={seccDetails}
                fetchingSECC={fetchingSECC}
                fetchingRation={fetchingRation}
                rationNumber={rationNumber}
                setRationNumber={setRationNumber}
                rationError={rationError}
                handleFetchRationDetails={handleFetchRationDetails}
              />
            )}

            {/* ENROLLED SCHEMES */}
            {selectedSection === "schemes" && (
              <EnrolledSchemesSection
                form={enrolledSchemesForm}
                onSubmit={onEnrolledSchemesSubmit}
              />
            )}

            {/* LOAN SECTION */}
            {selectedSection === "loan" && (
              <LoanSection
                form={loanForm}
                onSubmit={onLoanSubmit}
                LOAN_THRESHOLD={LOAN_THRESHOLD}
                loanAmount={loanAmount}
                setLoanAmount={setLoanAmount}
                showExpensesForLoan={showExpensesForLoan}
                selectedSchemeName={selectedSchemeName}
                loanApplicationId={currentLoanApplicationId}
              />
            )}
          </CardContent>
        </Card>

        
      </div>

      
    </div>
  );
};

export default ApplyLoan;
