import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChannelPartner, PartnerType, PartnerStatus, states, partnerTypes, partnerStatuses } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";

interface PartnerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: ChannelPartner | null;
  onSave: (partner: Partial<ChannelPartner>) => void;
}

export function PartnerFormDialog({ open, onOpenChange, partner, onSave }: PartnerFormDialogProps) {
  const isEditing = !!partner;

  const [formData, setFormData] = useState({
    name: "",
    type: "SCA" as PartnerType,
    state: "",
    email: "",
    phone: "",
    address: "",
    status: "Active" as PartnerStatus,
  });

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name,
        type: partner.type,
        state: partner.state,
        email: partner.email,
        phone: partner.phone,
        address: partner.address,
        status: partner.status,
      });
    } else {
      setFormData({
        name: "",
        type: "SCA",
        state: "",
        email: "",
        phone: "",
        address: "",
        status: "Active",
      });
    }
  }, [partner, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.state || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    onSave({
      ...formData,
      id: partner?.id || `CP${String(Date.now()).slice(-3)}`,
      totalBeneficiaries: partner?.totalBeneficiaries || 0,
      activeLoans: partner?.activeLoans || 0,
      amountDisbursed: partner?.amountDisbursed || 0,
      avgScore: partner?.avgScore || 0,
      npaRate: partner?.npaRate || 0,
      registeredDate: partner?.registeredDate || new Date().toISOString().split("T")[0],
    });

    toast({
      title: isEditing ? "Partner Updated" : "Partner Added",
      description: `${formData.name} has been ${isEditing ? "updated" : "added"} successfully`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Channel Partner" : "Add New Channel Partner"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Partner Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter partner name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Partner Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: PartnerType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {partnerTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => setFormData({ ...formData, state: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: PartnerStatus) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {partnerStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@partner.gov.in"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 XX XXXX XXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter full address"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-accent text-accent-foreground">
              {isEditing ? "Save Changes" : "Add Partner"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
