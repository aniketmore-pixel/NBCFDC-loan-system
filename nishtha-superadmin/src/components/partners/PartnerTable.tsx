import { ChannelPartner } from "@/lib/mock-data";
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
import { Eye, Edit, Power, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PartnerTableProps {
  partners: ChannelPartner[];
  onView: (partner: ChannelPartner) => void;
  onEdit: (partner: ChannelPartner) => void;
  onToggleStatus: (partner: ChannelPartner) => void;
}

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

export function PartnerTable({ partners, onView, onEdit, onToggleStatus }: PartnerTableProps) {
  if (partners.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border p-12 text-center">
        <p className="text-muted-foreground">No channel partners found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
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
            {partners.map((partner) => (
              <TableRow key={partner.id} className="group">
                <TableCell className="font-medium max-w-[200px]">
                  <span className="truncate block">{partner.name}</span>
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {partner.id}
                </TableCell>
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
                <TableCell className="text-right font-medium">
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
                      <DropdownMenuItem onClick={() => onView(partner)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(partner)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onToggleStatus(partner)}>
                        <Power className="mr-2 h-4 w-4" />
                        {partner.status === "Active" ? "Deactivate" : "Activate"}
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
