// src/pages/Reports.jsx
import AdminLayout from "@/components/AdminLayout";
import StatCard from "@/components/StatCard";
import { Download, TrendingUp, DollarSign, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Reports = () => {
  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-2">View comprehensive loan and beneficiary statistics</p>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Disbursed"
            value="₹2.4Cr"
            icon={DollarSign}
            trend="This fiscal year"
          />
          <StatCard
            title="Active Beneficiaries"
            value="847"
            icon={Users}
            trend="+18% from last year"
          />
          <StatCard
            title="Avg. Credit Score"
            value="685"
            icon={TrendingUp}
            trend="+12 points improvement"
            variant="success"
          />
          <StatCard
            title="Default Rate"
            value="2.3%"
            icon={AlertTriangle}
            trend="Below target of 3%"
            variant="success"
          />
        </div>

        {/* Monthly Trends */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle>Monthly Loan Disbursement Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {[45, 52, 48, 65, 58, 72, 68, 75, 82, 78, 85, 90].map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-primary rounded-t-md transition-all hover:opacity-80"
                    style={{ height: `${value}%` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Loan Approval Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Approved</span>
                <span className="font-bold text-success">842 (78%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pending Review</span>
                <span className="font-bold text-warning">38 (4%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Rejected</span>
                <span className="font-bold text-destructive">195 (18%)</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Applications</span>
                  <span className="font-bold">1,075</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Repayment Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">On-time Payments</span>
                <span className="font-bold text-success">92.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Late Payments</span>
                <span className="font-bold text-warning">5.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Defaults</span>
                <span className="font-bold text-destructive">2.3%</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Recovery Rate</span>
                  <span className="font-bold">97.7%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Reports;
