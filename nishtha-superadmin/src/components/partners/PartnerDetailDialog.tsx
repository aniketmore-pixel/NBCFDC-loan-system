import { ChannelPartner } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface PartnerDetailDialogProps {
  partner: ChannelPartner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCurrency(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)} Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)} L`;
  }
  return `₹${value.toLocaleString()}`;
}

function getStatusVariant(status: ChannelPartner["status"]) {
  switch (status) {
    case "Active":
      return "success";
    case "Inactive":
      return "danger";
    case "Under Review":
      return "warning";
    default:
      return "secondary";
  }
}

const riskData = [
  { name: "Low Risk", value: 65, fill: "hsl(var(--chart-5))" },
  { name: "Medium Risk", value: 25, fill: "hsl(var(--chart-3))" },
  { name: "High Risk", value: 10, fill: "hsl(var(--chart-4))" },
];

export function PartnerDetailDialog({
  partner,
  open,
  onOpenChange,
}: PartnerDetailDialogProps) {
  if (!partner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{partner.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {partner.id} • {partner.type}
              </p>
            </div>
            <Badge variant={getStatusVariant(partner.status)} className="ml-4">
              {partner.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Beneficiaries</span>
              </div>
              <p className="text-lg font-semibold">
                {partner.totalBeneficiaries.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Wallet className="h-4 w-4" />
                <span className="text-xs">Disbursed</span>
              </div>
              <p className="text-lg font-semibold">
                {formatCurrency(partner.amountDisbursed)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Avg Score</span>
              </div>
              <p className="text-lg font-semibold">{partner.avgScore}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">NPA Rate</span>
              </div>
              <p className="text-lg font-semibold">{partner.npaRate}%</p>
            </div>
          </div>

          <Separator />

          {/* Risk Distribution & Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Risk Distribution</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Contact Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{partner.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{partner.phone}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{partner.address}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Registered:{" "}
                    {new Date(partner.registeredDate).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Performance Overview */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Performance Overview</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg border border-border">
                <p className="text-2xl font-bold text-accent">
                  {partner.activeLoans.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Active Loans</p>
              </div>
              <div className="text-center p-3 rounded-lg border border-border">
                <p className="text-2xl font-bold text-success">
                  {Math.round(partner.totalBeneficiaries * 0.85).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Repaying On Time</p>
              </div>
              <div className="text-center p-3 rounded-lg border border-border">
                <p className="text-2xl font-bold text-warning">
                  {Math.round(partner.totalBeneficiaries * 0.12).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Delayed</p>
              </div>
              <div className="text-center p-3 rounded-lg border border-border">
                <p className="text-2xl font-bold text-destructive">
                  {Math.round(partner.totalBeneficiaries * 0.03).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Defaulted</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
