import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PartnerFilters } from "@/components/partners/PartnerFilters";
import { PartnerTable } from "@/components/partners/PartnerTable";
import { PartnerDetailDialog } from "@/components/partners/PartnerDetailDialog";
import { PartnerFormDialog } from "@/components/partners/PartnerFormDialog";
import { StatusEditDialog } from "@/components/partners/StatusEditDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { channelPartners as initialPartners, ChannelPartner, PartnerStatus } from "@/lib/mock-data";

export default function ChannelPartners() {
  const [partners, setPartners] = useState<ChannelPartner[]>(initialPartners);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState<ChannelPartner | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<ChannelPartner | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusEditPartner, setStatusEditPartner] = useState<ChannelPartner | null>(null);

  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const matchesSearch =
        searchQuery === "" ||
        partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.state.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesState = stateFilter === "all" || partner.state === stateFilter;
      const matchesType = typeFilter === "all" || partner.type === typeFilter;
      const matchesStatus = statusFilter === "all" || partner.status === statusFilter;

      return matchesSearch && matchesState && matchesType && matchesStatus;
    });
  }, [partners, searchQuery, stateFilter, typeFilter, statusFilter]);

  const handleView = (partner: ChannelPartner) => {
    setSelectedPartner(partner);
    setDetailDialogOpen(true);
  };

  const handleEdit = (partner: ChannelPartner) => {
    setEditingPartner(partner);
    setFormDialogOpen(true);
  };

  const handleToggleStatus = (partner: ChannelPartner) => {
    setStatusEditPartner(partner);
    setStatusDialogOpen(true);
  };

  const handleAddPartner = () => {
    setEditingPartner(null);
    setFormDialogOpen(true);
  };

  const handleSavePartner = (partnerData: Partial<ChannelPartner>) => {
    if (editingPartner) {
      // Update existing partner
      setPartners((prev) =>
        prev.map((p) =>
          p.id === editingPartner.id ? { ...p, ...partnerData } as ChannelPartner : p
        )
      );
    } else {
      // Add new partner
      setPartners((prev) => [...prev, partnerData as ChannelPartner]);
    }
  };

  const handleStatusChange = (partnerId: string, newStatus: PartnerStatus) => {
    setPartners((prev) =>
      prev.map((p) => (p.id === partnerId ? { ...p, status: newStatus } : p))
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Channel Partners</h1>
            <p className="text-muted-foreground">
              Manage and monitor your network of channel partners.
            </p>
          </div>
          <Button onClick={handleAddPartner} className="gradient-accent text-accent-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Add Channel Partner
          </Button>
        </div>

        {/* Filters */}
        <PartnerFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          stateFilter={stateFilter}
          onStateChange={setStateFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredPartners.length} of {partners.length} partners
        </p>

        {/* Table */}
        <PartnerTable
          partners={filteredPartners}
          onView={handleView}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
        />

        {/* Detail Dialog */}
        <PartnerDetailDialog
          partner={selectedPartner}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />

        {/* Add/Edit Form Dialog */}
        <PartnerFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          partner={editingPartner}
          onSave={handleSavePartner}
        />

        {/* Status Edit Dialog */}
        <StatusEditDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          partner={statusEditPartner}
          onSave={handleStatusChange}
        />
      </div>
    </AdminLayout>
  );
}
