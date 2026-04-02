import { topPerformingPartners, bottomPerformingPartners } from "@/lib/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PerformingPartnersTableProps {
  type: "top" | "bottom";
}

export function PerformingPartnersTable({ type }: PerformingPartnersTableProps) {
  const data = type === "top" ? topPerformingPartners : bottomPerformingPartners;
  const isTop = type === "top";

  return (
    <div className="rounded-xl bg-card border border-border p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        {isTop ? (
          <TrendingUp className="h-5 w-5 text-success" />
        ) : (
          <TrendingDown className="h-5 w-5 text-destructive" />
        )}
        <h3 className="text-lg font-semibold text-foreground">
          {isTop ? "Top" : "Bottom"} Performing Partners
        </h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Partner Name</TableHead>
            <TableHead className="text-right">NPA Rate</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right">Disbursement</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((partner, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{partner.name}</TableCell>
              <TableCell className="text-right">
                <Badge variant={isTop ? "success" : "danger"}>
                  {partner.npaRate}%
                </Badge>
              </TableCell>
              <TableCell className="text-right">{partner.score}</TableCell>
              <TableCell className="text-right">₹{partner.disbursement}Cr</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
