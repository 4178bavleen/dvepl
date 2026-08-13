import { useCallback } from "react";
import { useERPStore } from "@/store/erpStore";
import type { SalesOrderAssignment } from "@/types/exportOrders";

type AssignableOrder = { assignments?: SalesOrderAssignment[] } | null | undefined;

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
    target?.role?.toLowerCase?.().includes("admin") ||
    target?.name?.toLowerCase?.().includes("admin")
  );
}

/**
 * Assigned user (or admin) => WORK ACCESS.
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
  return (order.assignments || []).some(
    (assignment) => assignment.userId === userId
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
