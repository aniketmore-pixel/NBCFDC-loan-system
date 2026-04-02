// src/pages/LoanTracking.jsx
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const mockLoans = [
  { id: "LN001", beneficiary: "Rajesh Kumar", amount: 50000, disbursedDate: "2025-08-15", riskBand: "Low", status: "Active", repaymentProgress: 65 },
  { id: "LN002", beneficiary: "Priya Sharma", amount: 75000, disbursedDate: "2025-07-20", riskBand: "Medium", status: "Active", repaymentProgress: 45 },
  { id: "LN003", beneficiary: "Amit Patel", amount: 100000, disbursedDate: "2025-06-10", riskBand: "Low", status: "Active", repaymentProgress: 80 },
  { id: "LN004", beneficiary: "Sunita Reddy", amount: 40000, disbursedDate: "2025-05-01", riskBand: "Medium", status: "Completed", repaymentProgress: 100 },
  { id: "LN005", beneficiary: "Meera Desai", amount: 30000, disbursedDate: "2025-04-15", riskBand: "Low", status: "Completed", repaymentProgress: 100 },
];

const LoanTracking = () => {
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLoans = mockLoans.filter(loan => 
    statusFilter === "all" || loan.status.toLowerCase() === statusFilter
  );

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "Active": return "default";
      case "Completed": return "default";
      case "Defaulted": return "destructive";
      default: return "secondary";
    }
  };

  const getRiskBadgeVariant = (risk) => {
    switch (risk) {
      case "Low": return "default";
      case "Medium": return "secondary";
      case "High": return "destructive";
      default: return "default";
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Loan Tracking</h1>
          <p className="text-muted-foreground mt-2">Monitor all loans and their repayment status</p>
        </div>

        <Card className="shadow-card mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Loans</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="defaulted">Defaulted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>All Loans ({filteredLoans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Disbursed Date</TableHead>
                  <TableHead>Risk Band</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Repayment Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.id}</TableCell>
                    <TableCell>{loan.beneficiary}</TableCell>
                    <TableCell>₹{loan.amount.toLocaleString()}</TableCell>
                    <TableCell>{loan.disbursedDate}</TableCell>
                    <TableCell>
                      <Badge variant={getRiskBadgeVariant(loan.riskBand)}>
                        {loan.riskBand}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(loan.status)}>
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-success" 
                            style={{ width: `${loan.repaymentProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{loan.repaymentProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default LoanTracking;
