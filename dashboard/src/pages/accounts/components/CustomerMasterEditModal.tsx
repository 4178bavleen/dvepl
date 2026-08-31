import React, { useState, useEffect } from "react";
import { X, Building2, User, Hash, Calendar, FileText, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomerMasterDetails } from "../types";

interface CustomerMasterEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: CustomerMasterDetails;
  onSave: (data: CustomerMasterDetails) => void;
}

export const CustomerMasterEditModal: React.FC<CustomerMasterEditModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
}) => {
  const [formData, setFormData] = useState<CustomerMasterDetails>(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-card text-card-foreground rounded-2xl shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div>
            <h3 className="text-base font-bold text-card-foreground">
              Edit Company Details & Customer Master
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update billing, GST, and project reference information
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Company Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="e.g. gk enterprises"
                  className="pl-9 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Contact Person
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={formData.contactPerson === "—" ? "" : formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  placeholder="Name of contact person"
                  className="pl-9 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* DVEPL Ref Code */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                DVEPL Ref Code
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={formData.dveplRefCode}
                  onChange={(e) =>
                    setFormData({ ...formData, dveplRefCode: e.target.value })
                  }
                  placeholder="e.g. 123456"
                  className="pl-9 text-xs font-mono rounded-xl"
                />
              </div>
            </div>

            {/* Project Ref */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Project Ref
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={formData.projectRef}
                  onChange={(e) =>
                    setFormData({ ...formData, projectRef: e.target.value })
                  }
                  placeholder="e.g. 1234"
                  className="pl-9 text-xs font-mono rounded-xl"
                />
              </div>
            </div>

            {/* Date of Order */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Date of Order
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={formData.dateOfOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfOrder: e.target.value })
                  }
                  className="pl-9 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Date of Commitment */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Date of Commitment
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={formData.dateOfCommitment}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfCommitment: e.target.value })
                  }
                  className="pl-9 text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
              Customer Master Records
            </h4>
            
            {/* GST Number */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                GST Number
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={formData.gstNumber === "—" ? "" : formData.gstNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, gstNumber: e.target.value })
                  }
                  placeholder="e.g. 24AAACG1234A1Z5"
                  className="pl-9 text-xs uppercase font-mono rounded-xl"
                />
              </div>
            </div>

            {/* Billing Address */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Billing Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Textarea
                  value={formData.billingAddress === "—" ? "" : formData.billingAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, billingAddress: e.target.value })
                  }
                  placeholder="Complete billing address for invoicing..."
                  rows={2}
                  className="pl-9 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Special Notes (Customer Master) */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Special Notes (Customer Master)
              </label>
              <Textarea
                value={formData.specialNotes === "—" ? "" : formData.specialNotes}
                onChange={(e) =>
                  setFormData({ ...formData, specialNotes: e.target.value })
                }
                placeholder="Any special remarks or instructions for this customer..."
                rows={2}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 rounded-xl"
            >
              <Check className="size-3.5" />
              Save Details
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
