import { getActiveWorkflowTemplate } from "../routes/admin/workflow/template";

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

  // Load the active template so we resolve stage keys to names
  const template = await getActiveWorkflowTemplate(prisma);
  const steps = (template?.steps ?? []) as any[];
  const stepByKey = new Map<string, any>(
    steps.map((s) => [s.key, s]),
  );
  const titleFor = (key: string): string =>
    stepByKey.get(key)?.name ?? key.replace(/_/g, " ");

  // poStatus can be "Ready", "Placed", "Needs Revision", "Pending", "Ordered", "Partially Received", "Received", "Cancelled", "APPROVED", "SENT", "PARTIAL_RECEIVED", "COMPLETED", "CANCELLED", "DRAFT"
  let targetStage: string | null = null;
  if (poStatus === "Ready" || poStatus === "APPROVED") {
    targetStage = "PO_READY";
  } else if (poStatus === "Placed" || poStatus === "Ordered" || poStatus === "SENT") {
    targetStage = "PO_PLACED";
  } else if (
    poStatus === "Needs Revision" ||
    poStatus === "NeedsRevision" ||
    poStatus === "REVISION_REQUIRED"
  ) {
    targetStage = "REVISION_REQUIRED";
  } else if (poStatus === "Pending" || poStatus === "Cancelled" || poStatus === "CANCELLED" || poStatus === "DRAFT") {
    targetStage = "ORDER_CONFIRMED";
  } else if (
    poStatus === "Partially Received" ||
    poStatus === "PARTIAL_RECEIVED" ||
    poStatus === "Received" ||
    poStatus === "COMPLETED"
  ) {
    targetStage = "INVENTORY_FOLLOW_UP";
  }

  // If the mapped key no longer exists in the active template, fall back to
  // the first active step rather than writing an invalid key.
  if (targetStage && !stepByKey.has(targetStage)) {
    const firstActive = (template?.steps ?? []).find(
      (s: any) => s.isActive,
    );
    if (firstActive) targetStage = firstActive.key;
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

    await tx.workflowEvent.create({
      data: {
        salesOrderId: salesOrder.id,
        stage: targetStage,
        title: titleFor(targetStage),
        performedById: userId,
      },
    });
  });
}