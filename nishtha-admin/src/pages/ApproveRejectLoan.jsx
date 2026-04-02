// src/pages/ApproveRejectLoan.jsx
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ScoreBreakdownDialog from "../components/ScoreBreakdownDialog";
import ReviewApplicationDialog from "../components/ReviewApplicationDialog";

// 👉 change this if your backend URL changes
const API_BASE = "http://localhost:3000";

const ApproveRejectLoan = () => {
  const { toast } = useToast();

  // 🔹 Data from backend
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [rejectedApplications, setRejectedApplications] = useState([]);

  const [loadingApproved, setLoadingApproved] = useState(false);
  const [loadingRejected, setLoadingRejected] = useState(false);

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [scoreBreakdown, setScoreBreakdown] = useState(null);

  // Filter states for Approved
  const [approvedSearch, setApprovedSearch] = useState("");
  const [approvedScheme, setApprovedScheme] = useState("all");
  const [approvedRiskBand, setApprovedRiskBand] = useState("all");

  // Filter states for Rejected
  const [rejectedSearch, setRejectedSearch] = useState("");
  const [rejectedScheme, setRejectedScheme] = useState("all");
  const [rejectedRiskBand, setRejectedRiskBand] = useState("all");

  /* =============================
     API CALLS
  ============================== */
  const fetchApprovedApplications = async () => {
    try {
      setLoadingApproved(true);

      const res = await fetch(`${API_BASE}/loan/loan-approval/approved`);
      if (!res.ok) {
        const text = await res.text();
        console.error("Approved API not OK, raw response:", text);
        throw new Error("Non-200 response from approved API");
      }

      const json = await res.json();

      if (!json.success) {
        toast({
          title: "Failed to load approved applications",
          description: json.message || "Something went wrong.",
          variant: "destructive",
        });
        return;
      }

      setApprovedApplications(json.applications || []);
    } catch (err) {
      console.error("Error fetching approved applications:", err);
      toast({
        title: "Error",
        description: "Unable to fetch approved applications.",
        variant: "destructive",
      });
    } finally {
      setLoadingApproved(false);
    }
  };

  const fetchRejectedApplications = async () => {
    try {
      setLoadingRejected(true);

      const res = await fetch(`${API_BASE}/loan/loan-approval/rejected`);
      if (!res.ok) {
        const text = await res.text();
        console.error("Rejected API not OK, raw response:", text);
        throw new Error("Non-200 response from rejected API");
      }

      const json = await res.json();

      if (!json.success) {
        toast({
          title: "Failed to load rejected applications",
          description: json.message || "Something went wrong.",
          variant: "destructive",
        });
        return;
      }

      setRejectedApplications(json.applications || []);
    } catch (err) {
      console.error("Error fetching rejected applications:", err);
      toast({
        title: "Error",
        description: "Unable to fetch rejected applications.",
        variant: "destructive",
      });
    } finally {
      setLoadingRejected(false);
    }
  };

  useEffect(() => {
    fetchApprovedApplications();
    fetchRejectedApplications();
  }, []);

  /* =============================
     APPROVE / REJECT HANDLERS
  ============================== */
  const handleApprove = async (application) => {
    try {
      /*
      await fetch(`${API_BASE}/loan/loan-approval/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_application_id: application.id,
          aadhar_no: application.aadhar_no,
          sanctionedAmount: application.amount,
          tenureApproved: application.tenure,
          interestRate: application.interest_rate,
        }),
      });
      */

      toast({
        title: "Application Approved",
        description: `Application ${application.id} has been marked as APPROVED.`,
      });

      fetchApprovedApplications();
      fetchRejectedApplications();
    } catch (err) {
      console.error("Approve error:", err);
      toast({
        title: "Error",
        description: "Failed to approve application.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (application) => {
    try {
      /*
      await fetch(`${API_BASE}/loan/loan-approval/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_application_id: application.id,
          aadhar_no: application.aadhar_no,
        }),
      });
      */

      toast({
        title: "Application Rejected",
        description: `Application ${application.id} has been marked as REJECTED.`,
        variant: "destructive",
      });

      fetchApprovedApplications();
      fetchRejectedApplications();
    } catch (err) {
      console.error("Reject error:", err);
      toast({
        title: "Error",
        description: "Failed to reject application.",
        variant: "destructive",
      });
    }
  };

  /* =============================
     FILTER UTILITIES
  ============================== */

  const uniqueSchemes = [
    ...new Set(
      [...approvedApplications, ...rejectedApplications]
        .map((app) => app.scheme)
        .filter(Boolean)
    ),
  ];

  const filterApplications = (
    data,
    searchTerm,
    selectedScheme,
    selectedRiskBand
  ) => {
    return data.filter((app) => {
      const matchesSearch =
        app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.beneficiary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.scheme.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesScheme =
        selectedScheme === "all" || app.scheme === selectedScheme;

      const matchesRiskBand =
        selectedRiskBand === "all" ||
        (selectedRiskBand === "low" &&
          app.bandClassification?.includes("Low Risk")) ||
        (selectedRiskBand === "medium" &&
          app.bandClassification?.includes("Medium Risk")) ||
        (selectedRiskBand === "high" &&
          app.bandClassification?.includes("High Risk"));

      return matchesSearch && matchesScheme && matchesRiskBand;
    });
  };

  /* =============================
     TABLE RENDERER
  ============================== */
  const renderTable = (
    label,
    data,
    loading,
    searchTerm,
    setSearchTerm,
    selectedScheme,
    setSelectedScheme,
    selectedRiskBand,
    setSelectedRiskBand
  ) => {
    const filteredData = filterApplications(
      data,
      searchTerm,
      selectedScheme,
      selectedRiskBand
    );

    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{label}</CardTitle>

          {/* Filter Controls */}
          <div className="flex gap-4 mt-4 flex-col md:flex-row">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by ID, beneficiary, or scheme..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Scheme Filter */}
            <Select value={selectedScheme} onValueChange={setSelectedScheme}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filter by Scheme" />
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

            {/* Risk Band Filter */}
            <Select
              value={selectedRiskBand}
              onValueChange={setSelectedRiskBand}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Bands</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Counter */}
          <div className="text-sm text-muted-foreground mt-2">
            {loading
              ? "Loading applications..."
              : `Showing ${filteredData.length} of ${data.length} applications`}
          </div>
        </CardHeader>

        <CardContent>
          <div className="border rounded-md">
            {/* FIXED HEADER */}
            <Table className="w-full border-collapse">
              <TableHeader className="sticky top-0 bg-white z-20 shadow-md">
                <TableRow>
                  <TableHead className="w-[100px]">Application ID</TableHead>
                  <TableHead className="w-[200px]">Scheme</TableHead>
                  <TableHead className="w-[200px]">Loan Amount</TableHead>
                  <TableHead className="w-[150px]">Tenure</TableHead>
                  <TableHead className="w-[200px]">Approval %</TableHead>
                  <TableHead>Band Classification</TableHead>
                </TableRow>
              </TableHeader>
            </Table>

            {/* SCROLLABLE BODY */}
            <div className="max-h-72 overflow-y-auto">
              <Table className="w-full border-collapse">
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-gray-500 py-4"
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-gray-500 py-4"
                      >
                        No applications found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <span className="px-2 py-1 text-xs bg-gray-100 rounded-md w-[50px]">
                            {app.id}
                          </span>
                        </TableCell>
                        <TableCell className="w-[200px]">
                          {app.scheme}
                        </TableCell>
                        <TableCell className="w-[180px]">
                          ₹{Number(app.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="w-[150px]">
                          {app.tenure} months
                        </TableCell>

                        <TableCell className="w-[160px]">
                          <div
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm cursor-pointer hover:bg-blue-100"
                            onClick={() => setScoreBreakdown(app)}
                          >
                            {app.finalEligibilityScore
                              ? `${(app.finalEligibilityScore * 100).toFixed(
                                  1
                                )}%`
                              : "N/A"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              app.bandClassification?.includes("Low Risk")
                                ? "bg-green-100 text-green-700"
                                : app.bandClassification?.includes("Medium Risk")
                                ? "bg-orange-100 text-orange-700"
                                : app.bandClassification?.includes("High Risk")
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {app.bandClassification || "Not Classified"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {renderTable(
          "Approved Applications",
          approvedApplications,
          loadingApproved,
          approvedSearch,
          setApprovedSearch,
          approvedScheme,
          setApprovedScheme,
          approvedRiskBand,
          setApprovedRiskBand
        )}

        {renderTable(
          "Rejected Applications",
          rejectedApplications,
          loadingRejected,
          rejectedSearch,
          setRejectedSearch,
          rejectedScheme,
          setRejectedScheme,
          rejectedRiskBand,
          setRejectedRiskBand
        )}
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
      />
    </AdminLayout>
  );
};

export default ApproveRejectLoan;
