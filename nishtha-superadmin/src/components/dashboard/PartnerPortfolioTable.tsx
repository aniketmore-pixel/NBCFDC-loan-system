import { channelPartners, ChannelPartner } from "@/lib/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

function formatCurrency(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
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

function getNPAVariant(npaRate: number) {
  if (npaRate <= 2) return "success";
  if (npaRate <= 5) return "warning";
  return "danger";
}

export function PartnerPortfolioTable() {
  return (
    <div className="rounded-xl bg-card border border-border p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Channel Partner Portfolio
        </h3>
        <Link to="/admin/channel-partners">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner Name</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="text-right">Beneficiaries</TableHead>
              <TableHead className="text-right">Active Loans</TableHead>
              <TableHead className="text-right">Disbursed</TableHead>
              <TableHead className="text-right">Avg Score</TableHead>
              <TableHead className="text-right">NPA Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channelPartners.slice(0, 5).map((partner) => (
              <TableRow key={partner.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {partner.name}
                </TableCell>
                <TableCell className="text-muted-foreground">{partner.id}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{partner.type}</Badge>
                </TableCell>
                <TableCell>{partner.state}</TableCell>
                <TableCell className="text-right">
                  {partner.totalBeneficiaries.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {partner.activeLoans.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(partner.amountDisbursed)}
                </TableCell>
                <TableCell className="text-right">{partner.avgScore}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={getNPAVariant(partner.npaRate)}>
                    {partner.npaRate}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(partner.status)}>
                    {partner.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
