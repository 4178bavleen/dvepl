import type { Prisma } from "@prisma/client";

type AssignmentLike = {
  userId: string;
  stage?: string | null;
};

/**
 * Determines whether a user can work on an order that currently sits at
 * `orderStage`. Stage-wise rule:
 *  - Admin always has access.
 *  - A user assigned with `stage === null` (whole order / all stages) has access.
 *  - A user assigned to the exact `orderStage` has access.
 */
export function canWorkOnOrderStage(
  assignments: AssignmentLike[] | undefined | null,
  orderStage: string | null | undefined,
  userId: string | null | undefined,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  if (!userId || !orderStage) return false;

  return (assignments ?? []).some(
    (assignment) =>
      assignment.userId === userId &&
      (assignment.stage === null ||
        assignment.stage === undefined ||
        assignment.stage === orderStage),
  );
}

export function isAdminUser(admin: any): boolean {
  return Boolean(
    Array.isArray(admin?.roles) &&
      admin.roles.some((roleName: string) =>
        String(roleName).toLowerCase().includes("admin"),
      ),
  );
}

export type SalesOrderWithAssignments = {
  id: string;
  workflowStage?: string | null;
  assignments?: Array<{
    userId: string;
    stage?: string | null;
  }> | null;
};

const assignmentSelect = {
  userId: true,
  stage: true,
} satisfies Prisma.SalesOrderAssignmentSelect;

export async function fetchOrderWithAssignments(
  prisma: Prisma.TransactionClient,
  salesOrderId: string,
  where?: Prisma.SalesOrderWhereInput,
): Promise<SalesOrderWithAssignments | null> {
  return prisma.salesOrder.findFirst({
    where: { id: salesOrderId, ...(where ?? {}) },
    select: {
      id: true,
      workflowStage: true,
      assignments: {
        select: assignmentSelect,
      },
    },
  });
}