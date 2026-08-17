import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Users, X, Loader2, UserCheck, AlertCircle } from "lucide-react";
import { securityApi, salesOrderApi } from "@/services/modules";
import { toast } from "react-hot-toast";

export interface SalesOrderAssignment {
  id?: string;
  salesOrderId?: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface SalesOrderAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    tender_no?: string;
    firm_name?: string;
    dveplCode?: string;
    assignments?: SalesOrderAssignment[];
  } | null;
  onSuccess: () => void;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  isActive?: boolean;
}

export function SalesOrderAssignModal({
  open,
  onOpenChange,
  order,
  onSuccess,
}: SalesOrderAssignModalProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userFetchError, setUserFetchError] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch users when modal opens
  useEffect(() => {
    if (open) {
      void fetchUsers();
      setSearch("");
      setValidationError(null);
    }
  }, [open]);

  // Sync initial assigned user IDs when order changes or modal opens
  useEffect(() => {
    if (open && order) {
      const existingUserIds = (order.assignments || []).map((a) => a.userId).filter(Boolean);
      setSelectedUserIds(existingUserIds);
    }
  }, [open, order]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setUserFetchError(null);
    try {
      const response = await securityApi.users.list();
      const userList: UserOption[] = Array.isArray(response)
        ? response
        : (response as any)?.data || [];

      const activeUsers = userList.filter(
        (u) =>
          u.isActive !== false &&
          u.name?.toLowerCase() !== "admin" &&
          u.email?.toLowerCase() !== "admin@dvepl.com"
      );
      setUsers(activeUsers);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to load eligible users.";
      setUserFetchError(msg);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [users, search]);

  const toggleUserSelection = (userId: string) => {
    setValidationError(null);
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllFiltered = () => {
    setValidationError(null);
    const filteredIds = filteredUsers.map((u) => u.id);
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const clearAllSelection = () => {
    setValidationError(null);
    setSelectedUserIds([]);
  };

  const handleSave = async () => {
    if (!order) return;

    if (selectedUserIds.length === 0) {
      setValidationError("At least one user must be assigned to the order.");
      toast.error("At least one user must be assigned.");
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const res = await salesOrderApi.salesOrders.assign(order.id, selectedUserIds);
      if (res?.success !== false) {
        toast.success("Sales Order assigned successfully.");
        onSuccess();
        onOpenChange(false);
      } else {
        const msg = res?.message || "Failed to assign sales order.";
        setValidationError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to assign sales order.";
      setValidationError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedUsers = useMemo(() => {
    return selectedUserIds
      .map((id) => {
        const found = users.find((u) => u.id === id);
        if (found) return found;
        const existingAssign = order?.assignments?.find((a) => a.userId === id);
        return {
          id,
          name: existingAssign?.user?.name || id,
          email: existingAssign?.user?.email || "",
        };
      })
      .filter(Boolean);
  }, [selectedUserIds, users, order]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Users className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Assign Sales Order
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Assign order{" "}
                <span className="font-semibold text-foreground">
                  {order?.tender_no || order?.dveplCode || "Tender"}
                </span>{" "}
                to one or multiple team members.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Validation Alert */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold">
              <AlertCircle className="size-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* User Fetch Error */}
          {userFetchError && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs">
              <span>{userFetchError}</span>
              <Button variant="ghost" size="sm" onClick={() => void fetchUsers()} className="h-6 text-xs px-2">
                Retry
              </Button>
            </div>
          )}

          {/* Selected Users Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assigned Users ({selectedUserIds.length})
              </label>
              {selectedUserIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllSelection}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-rose-500 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {selectedUsers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-muted/20 min-h-11 max-h-28 overflow-y-auto">
                {selectedUsers.map((u) => (
                  <Badge
                    key={u.id}
                    variant="secondary"
                    className="gap-1 px-2.5 py-1 text-xs font-medium bg-background border shadow-2xs hover:bg-muted/80 transition-colors"
                  >
                    <span>{u.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleUserSelection(u.id)}
                      className="text-muted-foreground hover:text-rose-500 rounded-full transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
                No users assigned yet. Select users from the list below.
              </div>
            )}
          </div>

          {/* User Search & Select All */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Users
              </label>
              {filteredUsers.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Select All Filtered
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search user by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* User Checklist */}
          <div className="rounded-lg border bg-card divide-y max-h-56 overflow-y-auto">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
                <Loader2 className="size-4 animate-spin text-primary" />
                Loading eligible users...
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/40 transition-colors ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleUserSelection(u.id)}
                      />
                      <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {u.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30 bg-primary/10 gap-1 shrink-0">
                        <UserCheck className="size-3" />
                        Selected
                      </Badge>
                    )}
                  </label>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {search ? `No users matching "${search}"` : "No eligible users available"}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3 border-t bg-muted/20 flex flex-row justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-9 text-xs font-semibold"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || isLoadingUsers}
            className="h-9 text-xs font-semibold gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <UserCheck className="size-3.5" />
                Save Assignments
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
