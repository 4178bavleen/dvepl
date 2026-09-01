import React, { useState } from "react";
import { X, Shield, Lock, Unlock, Users, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SharedOrderFile } from "../types";

interface ManageAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: SharedOrderFile | null;
  onUpdateAccess: (fileId: string, isBlocked: boolean, allowedRoles: string[]) => void;
}

const AVAILABLE_ROLES = [
  { id: "admin", label: "Administrators & Super Admins" },
  { id: "accounts", label: "Accounts & Billing Team" },
  { id: "sales", label: "Sales & Tenders Team" },
  { id: "production", label: "Production & Engineering" },
  { id: "procurement", label: "Purchase & Procurement" },
  { id: "quality", label: "Quality Assurance (QC)" },
];

export const ManageAccessModal: React.FC<ManageAccessModalProps> = ({
  isOpen,
  onClose,
  file,
  onUpdateAccess,
}) => {
  if (!isOpen || !file) return null;

  const [isBlocked, setIsBlocked] = useState(file.isBlocked);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    file.allowedRoles || ["admin", "accounts"]
  );

  const toggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleSave = () => {
    onUpdateAccess(file.id, isBlocked, selectedRoles);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-card text-card-foreground rounded-2xl shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <Shield className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-card-foreground">
                Manage File Access
              </h3>
              <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">
                {file.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Box */}
          <div className={`p-4 rounded-xl border ${
            isBlocked
              ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {isBlocked ? (
                  <Lock className="size-4 text-rose-500 shrink-0 mt-0.5" />
                ) : (
                  <Unlock className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold">
                    {isBlocked ? "Access is Currently Restricted (Blocked)" : "File Access is Active"}
                  </h4>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {isBlocked
                      ? "Only authorized roles selected below can view or download this document."
                      : "All users in this order workspace have standard read permissions."}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant={isBlocked ? "destructive" : "outline"}
                className="text-xs h-7 px-2.5 rounded-lg shadow-xs"
                onClick={() => setIsBlocked(!isBlocked)}
              >
                {isBlocked ? "Unblock File" : "Block File"}
              </Button>
            </div>
          </div>

          {/* Role Permissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="size-3.5 text-primary" />
                Permitted Roles & Departments
              </label>
              <span className="text-[10px] text-muted-foreground">
                Admin controls
              </span>
            </div>

            <div className="space-y-2 border border-border rounded-xl p-3 bg-muted/20">
              {AVAILABLE_ROLES.map((role) => {
                const checked = selectedRoles.includes(role.id);
                return (
                  <label
                    key={role.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-card transition-colors cursor-pointer border border-transparent hover:border-border"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleRole(role.id)}
                    />
                    <span className="text-xs font-medium text-foreground">
                      {role.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              Files uploaded in other tabs are protected. Costing sheet team members will only see files permitted by the Business Owner or Admin.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/40">
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
            type="button"
            size="sm"
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 rounded-xl"
          >
            <Check className="size-3.5" />
            Save Access Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
