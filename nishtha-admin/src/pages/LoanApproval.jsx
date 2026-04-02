// src/pages/LoanApproval.jsx
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import ScoreBreakdownDialog from "../components/ScoreBreakdownDialog";
import ReviewApplicationDialog from "../components/ReviewApplicationDialog";

// Helper: Convert text → number safely
const parseAmount = (val) => {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const n = parseInt(String(val).replace(/[^\d]/g, ""), 10);
  return isNaN(n) ? 0 : n;
};

// Generate frontend AI scoring only if backend doesn't send it
const getAiScoring = (row) => {
  const amount = parseAmount(row.loan_amount_applied);
  const tenure = row.tenure_applied || 0;

  const normalizedAmount = Math.min(amount / 200000, 1);
  const normalizedTenure = Math.min(tenure / 60, 1);

  const needScore = 0.6 + 0.3 * (1 - normalizedAmount);
  const riskScore = 0.25 + 0.5 * normalizedAmount;
  const fraudProbability = 0.02 + 0.05 * normalizedAmount;

  const final =
    0.7 * (1 - riskScore) + 0.3 * needScore - fraudProbability;

  const finalEligibilityScore = Math.max(0.3, Math.min(0.95, final));

  let band =
    finalEligibilityScore >= 0.8
      ? "Low Risk - High Need"
      : finalEligibilityScore >= 0.6
      ? "Medium Risk - High Need"
      : finalEligibilityScore >= 0.45
      ? "High Risk - Medium Need"
      : "High Risk - Low Need";

  return {
    creditScore: Math.round(750 - normalizedAmount * 150),
    riskScore,
    fraudProbability,
    needScore,
    estimatedIncome: 30000 + tenure * 500,
    estimatedSafeLoan: amount + 20000,
    bandClassification: band,
    finalEligibilityScore,
  };
};

const LoanApproval = () => {
  const { toast } = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [scoreBreakdown, setScoreBreakdown] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScheme, setSelectedScheme] = useState("all");
  const [selectedRiskBand, setSelectedRiskBand] = useState("all");

  // Fetch ONLY PENDING applications from backend
  useEffect(() => {
    const fetchPending = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          "http://localhost:3000/loan/loan-approval/pending"
        );

        if (!res.ok) {
          throw new Error("API returned status " + res.status);
        }

        const apiData = await res.json();
        console.log("🔵 API Response:", apiData);

        if (!apiData.success || !Array.isArray(apiData.applications)) {
          throw new Error("Invalid backend response");
        }

        const enriched = apiData.applications.map((row) => {
          const amount = parseAmount(row.amount);

          // Use backend-calculated scores if available
          const ai = row.finalEligibilityScore
            ? {
                creditScore: row.creditScore,
                riskScore: row.riskScore,
                fraudProbability: row.fraudProbability,
                needScore: row.needScore,
                estimatedIncome: row.estimatedIncome,
                estimatedSafeLoan: row.estimatedSafeLoan,
                bandClassification: row.bandClassification,
                finalEligibilityScore: row.finalEligibilityScore,
              }
            : getAiScoring(row);

          return {
            id: row.id,
            scheme: row.scheme || "N/A",
            beneficiary:
              row.beneficiary ||
              `Beneficiary (${row.aadhar_no?.slice(-4) || "XXXX"})`,
            amount,
            tenure: row.tenure || 0,
            aadhar_no: row.aadhar_no,
            status: row.status || "PENDING",
            applicationDate: row.applicationDate,

            ...ai,
          };
        });

        setApplications(enriched);
      } catch (err) {
        console.error("❌ Fetch error:", err);
        toast({
          title: "Error fetching applications",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, [toast]);

  const handleApprove = (app) => {
    toast({
      title: "Loan Approved",
      description: `Application ${app.id} approved.`,
    });
  };

  const handleReject = (app) => {
    toast({
      title: "Loan Rejected",
      description: `Application ${app.id} rejected.`,
      variant: "destructive",
    });
  };

  const getScoreBadge = (score) => {
    if (score >= 0.8) return "success";
    if (score >= 0.6) return "secondary";
    if (score >= 0.4) return "warning";
    return "destructive";
  };

  const uniqueSchemes = useMemo(() => {
    return [...new Set(applications.map((app) => app.scheme))];
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const term = searchTerm.toLowerCase();

      const matchSearch =
        app.id.toLowerCase().includes(term) ||
        app.beneficiary.toLowerCase().includes(term) ||
        (app.scheme || "").toLowerCase().includes(term);

      const matchScheme =
        selectedScheme === "all" || app.scheme === selectedScheme;

      const matchRisk =
        selectedRiskBand === "all" ||
        (selectedRiskBand === "low" &&
          app.bandClassification.includes("Low Risk")) ||
        (selectedRiskBand === "medium" &&
          app.bandClassification.includes("Medium Risk")) ||
        (selectedRiskBand === "high" &&
          app.bandClassification.includes("High Risk"));

      return matchSearch && matchScheme && matchRisk;
    });
  }, [applications, searchTerm, selectedScheme, selectedRiskBand]);

  return (
    <AdminLayout>
      <div className="p-8">
        <Card className="shadow border h-[80vh]">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">
              Pending Applications
            </CardTitle>

            {/* Filters */}
            <div className="flex gap-4 mt-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search application ID, scheme, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Scheme Filter */}
              <Select
                value={selectedScheme}
                onValueChange={setSelectedScheme}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Scheme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schemes</SelectItem>
                  {uniqueSchemes.map((scheme) => (
                    <SelectItem key={scheme} value={scheme}>
                      {scheme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Risk Filter */}
              <Select
                value={selectedRiskBand}
                onValueChange={setSelectedRiskBand}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Count */}
            <p className="text-sm text-muted-foreground mt-2">
              {loading
                ? "Loading..."
                : `Showing ${filteredApplications.length} of ${applications.length} applications`}
            </p>
          </CardHeader>

          <CardContent className="overflow-auto h-[50vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-white shadow">
                <TableRow>
                  <TableHead>Application ID</TableHead>
                  <TableHead>Scheme</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Tenure</TableHead>
                  <TableHead>Approval %</TableHead>
                  <TableHead>Band</TableHead>
                  <TableHead className="text-center">Preview</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {!loading &&
                  filteredApplications.map((app) => (
                    <TableRow key={app.id} className="hover:bg-gray-50">
                      <TableCell>{app.id}</TableCell>
                      <TableCell>{app.scheme}</TableCell>
                      <TableCell>
                        ₹{app.amount.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>{app.tenure} months</TableCell>

                      <TableCell>
                        <button
                          onClick={() => setScoreBreakdown(app)}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
                        >
                          {(app.finalEligibilityScore * 100).toFixed(1)}%
                        </button>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full ${
                            app.bandClassification.includes("Low Risk")
                              ? "bg-green-100 text-green-700"
                              : app.bandClassification.includes("Medium Risk")
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {app.bandClassification}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <button
                          onClick={() => setSelectedApplication(app)}
                          className="p-2 rounded-full hover:bg-gray-200"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ScoreBreakdownDialog
        scoreBreakdown={scoreBreakdown}
        onClose={() => setScoreBreakdown(null)}
      />

      <ReviewApplicationDialog
        selectedApplication={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        handleApprove={handleApprove}
        handleReject={handleReject}
        getScoreBadge={getScoreBadge}
      />
    </AdminLayout>
  );
};

export default LoanApproval;
