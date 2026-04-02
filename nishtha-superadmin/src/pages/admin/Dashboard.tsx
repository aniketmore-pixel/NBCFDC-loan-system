import { AdminLayout } from "@/components/layout/AdminLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { RiskBandChart } from "@/components/dashboard/RiskBandChart";
import { DisbursementTrendChart } from "@/components/dashboard/DisbursementTrendChart";
import { StateWiseChart } from "@/components/dashboard/StateWiseChart";
import { PerformingPartnersTable } from "@/components/dashboard/PerformingPartnersTable";
import { PartnerPortfolioTable } from "@/components/dashboard/PartnerPortfolioTable";
import { kpiData } from "@/lib/mock-data";
import {
  Users,
  IndianRupee,
  Wallet,
  AlertTriangle,
  Target,
  UserCheck,
} from "lucide-react";

function formatCurrency(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)} Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)} L`;
  }
  return `₹${value.toLocaleString()}`;
}

export default function Dashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your channel partner network.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard
            title="Total Channel Partners"
            value={kpiData.totalChannelPartners}
            icon={<Users className="h-6 w-6" />}
            trend={{ value: 12, isPositive: true }}
          />
          <KPICard
            title="Amount Disbursed"
            value={formatCurrency(kpiData.amountDisbursed)}
            icon={<IndianRupee className="h-6 w-6" />}
            trend={{ value: 8.5, isPositive: true }}
          />
          <KPICard
            title="Active Loans"
            value={kpiData.activeLoans.toLocaleString()}
            icon={<Wallet className="h-6 w-6" />}
            trend={{ value: 15, isPositive: true }}
          />
          <KPICard
            title="NPA Rate"
            value={`${kpiData.npaRate}%`}
            icon={<AlertTriangle className="h-6 w-6" />}
            trend={{ value: 0.2, isPositive: false }}
          />
          <KPICard
            title="Avg Composite Score"
            value={kpiData.avgCompositeScore}
            icon={<Target className="h-6 w-6" />}
            trend={{ value: 3, isPositive: true }}
          />
          <KPICard
            title="Auto-Eligible Beneficiaries"
            value={kpiData.autoEligibleBeneficiaries.toLocaleString()}
            icon={<UserCheck className="h-6 w-6" />}
            trend={{ value: 18, isPositive: true }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskBandChart />
          <DisbursementTrendChart />
        </div>

        {/* State-wise and Performance Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <StateWiseChart />
          <PerformingPartnersTable type="top" />
          <PerformingPartnersTable type="bottom" />
        </div>

        {/* Partner Portfolio Table */}
        <PartnerPortfolioTable />
      </div>
    </AdminLayout>
  );
}
