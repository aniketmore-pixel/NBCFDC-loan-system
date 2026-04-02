import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChannelPartner, PartnerStatus, partnerStatuses } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";

interface StatusEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: ChannelPartner | null;
  onSave: (partnerId: string, newStatus: PartnerStatus) => void;
}

export function StatusEditDialog({ open, onOpenChange, partner, onSave }: StatusEditDialogProps) {
  const [status, setStatus] = useState<PartnerStatus>(partner?.status || "Active");

  const handleSave = () => {
    if (partner) {
      onSave(partner.id, status);
      toast({
        title: "Status Updated",
        description: `${partner.name} status changed to ${status}`,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Partner Status</DialogTitle>
          <DialogDescription>
            Change the status for {partner?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Status</Label>
            <p className="text-sm text-muted-foreground">{partner?.status}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-status">New Status</Label>
            <Select
              value={status}
              onValueChange={(value: PartnerStatus) => setStatus(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {partnerStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gradient-accent text-accent-foreground">
            Update Status
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
