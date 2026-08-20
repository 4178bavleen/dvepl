import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import {
  Search,
  Users,
  X,
  Loader2,
  UserCheck,
  AlertCircle,
  Layers,
  LayoutGrid,
} from "lucide-react";
import { securityApi, salesOrderApi } from "@/services/modules";
import workflowApi from "@/services/workflowApi";
import { toast } from "react-hot-toast";

export interface SalesOrderAssignment {
  id?: string;
  salesOrderId?: string;
  userId: string;
  stage?: string | null;
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
  initialStageKey?: string | null;
  onSuccess: () => void;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  isActive?: boolean;
}

interface StageOption {
  key: string;
  name: string;
  color?: string | null;
}

export const ALL_STAGES_KEY = "__all_stages__";

export function SalesOrderAssignModal({
  open,
  onOpenChange,
  order,
  initialStageKey,
  onSuccess,
}: SalesOrderAssignModalProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userFetchError, setUserFetchError] = useState<string | null>(null);
  const [stages, setStages] = useState<StageOption[]>([]);
  const [isLoadingStages, setIsLoadingStages] = useState(false);
  const [activeStageKey, setActiveStageKey] = useState<string>(ALL_STAGES_KEY);
  const [stageAssignments, setStageAssignments] = useState<
    Record<string, string[]>
  >({});
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
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
  }, []);

  const fetchStages = useCallback(async () => {
    setIsLoadingStages(true);
    try {
      const response = await workflowApi.getTemplate();
      if (response.data.success) {
        const steps = (response.data.data.steps || [])
          .filter((s) => s.isActive)
          .sort((a, b) => a.position - b.position)
          .map((s) => ({
            key: s.key,
            name: s.name,
            color: s.color,
          }));
        setStages(steps);
      }
    } catch (err) {
      console.error("Failed to load workflow stages:", err);
      setStages([]);
    } finally {
      setIsLoadingStages(false);
    }
  }, []);

  // Fetch users + stages when modal opens
  useEffect(() => {
    if (open) {
      void fetchUsers();
      void fetchStages();
      setSearch("");
      setValidationError(null);
      setActiveStageKey(initialStageKey ?? ALL_STAGES_KEY);
    }
  }, [open, fetchUsers, fetchStages, initialStageKey]);

  // Sync initial assignments grouped by stage
  useEffect(() => {
    if (open && order) {
      const grouped: Record<string, string[]> = {};
      (order.assignments || []).forEach((a) => {
        const key = a.stage ? a.stage : ALL_STAGES_KEY;
        if (!grouped[key]) grouped[key] = [];
        if (!grouped[key].includes(a.userId)) grouped[key].push(a.userId);
      });
      setStageAssignments(grouped);
    }
  }, [open, order]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [users, search]);

  const currentStageUsers = useMemo(
    () => stageAssignments[activeStageKey] ?? [],
    [stageAssignments, activeStageKey],
  );

  const toggleUserSelection = (userId: string) => {
    setValidationError(null);
    setStageAssignments((prev) => {
      const current = prev[activeStageKey] ?? [];
      const next = current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId];
      return { ...prev, [activeStageKey]: next };
    });
  };

  const selectAllFiltered = () => {
    setValidationError(null);
    const filteredIds = filteredUsers.map((u) => u.id);
    setStageAssignments((prev) => ({
      ...prev,
      [activeStageKey]: Array.from(
        new Set([...(prev[activeStageKey] ?? []), ...filteredIds]),
      ),
    }));
  };

  const clearAllSelection = () => {
    setValidationError(null);
    setStageAssignments((prev) => ({
      ...prev,
      [activeStageKey]: [],
    }));
  };

  const totalAssignedUsers = useMemo(
    () => Array.from(new Set(Object.values(stageAssignments).flat())).length,
    [stageAssignments],
  );

  const handleSave = async () => {
    if (!order) return;

    if (totalAssignedUsers === 0) {
      setValidationError("At least one user must be assigned to the order.");
      toast.error("At least one user must be assigned.");
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const assignments = Object.entries(stageAssignments)
        .filter(([, userIds]) => userIds.length > 0)
        .map(([stageKey, userIds]) => ({
          stage: stageKey === ALL_STAGES_KEY ? null : stageKey,
          userIds,
        }));

      const res = await salesOrderApi.salesOrders.assign(order.id, {
        assignments,
      });
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
    return currentStageUsers
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
  }, [currentStageUsers, users, order]);

  const stageTabs = useMemo(() => {
    return [
      { key: ALL_STAGES_KEY, name: "All Stages" },
      ...stages.map((s) => ({ key: s.key, name: s.name })),
    ];
  }, [stages]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
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
                to team members{" "}
                <span className="font-semibold text-foreground">
                  per workflow stage
                </span>
                .
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

          {/* Stage Tabs */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="size-3.5 text-muted-foreground" />
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assign by Stage
              </label>
            </div>

            {isLoadingStages ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                Loading workflow stages...
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {stageTabs.map((tab) => {
                  const count = (stageAssignments[tab.key] ?? []).length;
                  const isActive = activeStageKey === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveStageKey(tab.key)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card text-muted-foreground border-border hover:bg-muted/60"
                      }`}
                    >
                      {tab.key === ALL_STAGES_KEY ? (
                        <LayoutGrid className="size-3" />
                      ) : null}
                      {tab.name}
                      {count > 0 && (
                        <span
                          className={`inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold ${
                            isActive
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {activeStageKey !== ALL_STAGES_KEY && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Users assigned here can work on this order only while it is at
                the{" "}
                <span className="font-semibold text-foreground">
                  {stages.find((s) => s.key === activeStageKey)?.name ??
                    activeStageKey}
                </span>{" "}
                stage.
              </p>
            )}
            {activeStageKey === ALL_STAGES_KEY && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Users assigned to All Stages can work on the order at every
                stage.
              </p>
            )}
          </div>

          {/* Selected Users Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assigned Users ({currentStageUsers.length}) · Total{" "}
                {totalAssignedUsers}
              </label>
              {currentStageUsers.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllSelection}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-rose-500 transition-colors"
                >
                  Clear This Stage
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
                No users assigned for this selection. Select users from the list
                below.
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
                const isSelected = currentStageUsers.includes(u.id);
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