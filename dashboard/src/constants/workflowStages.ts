export const WORKFLOW_STAGES = [
  {
    value: "ORDER_CONFIRMED",
    label: "Order Confirmed",
  },
  {
    value: "PO_READY",
    label: "PO Ready",
  },
  {
    value: "DRAWING_ASSIGNED",
    label: "Drawing Assigned",
  },
  {
    value: "DRAWING_SENT",
    label: "Drawing Sent",
  },
  {
    value: "REVISION_REQUIRED",
    label: "Revision Required",
  },
  {
    value: "DRAWING_APPROVED",
    label: "Drawing Approved",
  },
  {
    value: "PO_PLACED",
    label: "PO Placed",
  },
  {
    value: "INVENTORY_FOLLOW_UP",
    label: "Inventory Follow-up",
  },
  {
    value: "PRODUCTION_FOLLOW_UP",
    label: "Production Follow-up",
  },
] as const;

export type WorkflowStage =
  (typeof WORKFLOW_STAGES)[number]["value"];