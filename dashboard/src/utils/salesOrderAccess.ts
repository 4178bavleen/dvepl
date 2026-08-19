import { useCallback } from "react";
import { useERPStore } from "@/store/erpStore";
import type { SalesOrderAssignment } from "@/types/exportOrders";

type AssignableOrder = {
  assignments?: SalesOrderAssignment[];
  workflowStage?: string | null;
} | null | undefined;

export function getCurrentUserId(): string {
  return useERPStore.getState().currentUserId;
}

export function getCurrentUser(): any {
  const state = useERPStore.getState();
  return state.users.find((u: any) => u.id === state.currentUserId) ?? null;
}

export function isAdminUser(user?: any): boolean {
  const target = user ?? getCurrentUser();
  return Boolean(
    target?.role?.toLowerCase?.().includes("admin")
  );
}

/**
 * Assigned user (or admin) => WORK ACCESS.
 * Stage-wise rule:
 *  - Admin always has access.
 *  - A user assigned to the whole order (stage === null/undefined) has access.
 *  - A user assigned to the exact stage the order is currently at has access.
 *  - If the order has no stage set, any assignment grants access (legacy behavior).
 * Everyone else => VIEW-ONLY.
 */
export function canWorkOnOrder(
  order: AssignableOrder,
  currentUserId?: string,
  isAdmin?: boolean,
): boolean {
  const userId = currentUserId ?? getCurrentUserId();
  if (!order || !userId) return false;
  if (isAdmin ?? isAdminUser()) return true;

  const orderStage = order.workflowStage;

  return (order.assignments || []).some(
    (assignment) =>
      assignment.userId === userId &&
      (!orderStage ||
        assignment.stage === null ||
        assignment.stage === undefined ||
        assignment.stage === orderStage),
  );
}

export function useSalesOrderAccess() {
  const currentUserId = useERPStore((state) => state.currentUserId);
  const users = useERPStore((state) => state.users);
  const currentUser = users.find((u: any) => u.id === currentUserId);
  const isAdmin = isAdminUser(currentUser);

  const canWork = useCallback(
    (order: AssignableOrder) => canWorkOnOrder(order, currentUserId, isAdmin),
    [currentUserId, isAdmin]
  );

  return { canWorkOnOrder: canWork, isAdmin, currentUserId };
}