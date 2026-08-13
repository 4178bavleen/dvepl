import { WorkflowStage } from "@prisma/client";

export async function syncSalesOrderWorkflowFromPo(
  prisma: any,
  referenceCode: string | null | undefined,
  poStatus: string | null | undefined,
  userId: string | null
) {
  if (!referenceCode || !poStatus) return;

  // 1. Find the SalesOrder by referenceCode (dveplCode)
  let salesOrder = await prisma.salesOrder.findUnique({
    where: { dveplCode: referenceCode.trim() },
  });

  // Fallback: If not found by dveplCode, try searching for the referenceCode inside the remarks field
  if (!salesOrder) {
    salesOrder = await prisma.salesOrder.findFirst({
      where: {
        remarks: {
          contains: referenceCode.trim(),
        },
      },
    });
  }

  if (!salesOrder) return;

  // poStatus can be "Ready", "Placed", "Needs Revision", "Pending", "Ordered", "Partially Received", "Received", "Cancelled", "APPROVED", "SENT", "PARTIAL_RECEIVED", "COMPLETED", "CANCELLED", "DRAFT"
  let targetStage: WorkflowStage | null = null;
  if (poStatus === "Ready" || poStatus === "APPROVED") {
    targetStage = WorkflowStage.PO_READY;
  } else if (poStatus === "Placed" || poStatus === "Ordered" || poStatus === "SENT") {
    targetStage = WorkflowStage.PO_PLACED;
  } else if (
    poStatus === "Needs Revision" ||
    poStatus === "NeedsRevision" ||
    poStatus === "REVISION_REQUIRED"
  ) {
    targetStage = WorkflowStage.REVISION_REQUIRED;
  } else if (poStatus === "Pending" || poStatus === "Cancelled" || poStatus === "CANCELLED" || poStatus === "DRAFT") {
    targetStage = WorkflowStage.ORDER_CONFIRMED;
  } else if (
    poStatus === "Partially Received" ||
    poStatus === "PARTIAL_RECEIVED" ||
    poStatus === "Received" ||
    poStatus === "COMPLETED"
  ) {
    targetStage = WorkflowStage.INVENTORY_FOLLOW_UP;
  }

  if (!targetStage || salesOrder.workflowStage === targetStage) return;

  // 3. Update the SalesOrder and create the WorkflowEvent in a transaction
  await prisma.$transaction(async (tx: any) => {
    await tx.salesOrder.update({
      where: { id: salesOrder.id },
      data: {
        workflowStage: targetStage,
        workflowUpdatedAt: new Date(),
      },
    });

    const getWorkflowStageTitle = (stage: WorkflowStage): string => {
      const titles: Record<WorkflowStage, string> = {
        ORDER_CONFIRMED: "Order Confirmed",
        PO_READY: "PO Ready",
        DRAWING_ASSIGNED: "Drawing Assigned",
        DRAWING_SENT: "Drawing Sent",
        REVISION_REQUIRED: "Revision Required",
        DRAWING_APPROVED: "Drawing Approved",
        PO_PLACED: "PO Placed",
        INVENTORY_FOLLOW_UP: "Inventory Follow-up",
        PRODUCTION_FOLLOW_UP: "Production Follow-up",
      };
      return titles[stage];
    };

    await tx.workflowEvent.create({
      data: {
        salesOrderId: salesOrder.id,
        stage: targetStage,
        title: getWorkflowStageTitle(targetStage),
        performedById: userId,
      },
    });
  });
}
