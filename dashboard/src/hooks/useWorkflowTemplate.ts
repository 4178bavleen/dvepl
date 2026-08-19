import { useEffect, useState } from "react";
import workflowApi, {
  WorkflowTemplateStep,
} from "@/services/workflowApi";

export interface WorkflowStageMeta {
  key: string;
  name: string;
  color: string;
  isFinal: boolean;
}

export const DEFAULT_WORKFLOW_STAGES: WorkflowStageMeta[] = [
  { key: "ORDER_CONFIRMED", name: "Order Confirmed", color: "#3b82f6", isFinal: false },
  { key: "PO_READY", name: "PO Ready", color: "#8b5cf6", isFinal: false },
  { key: "DRAWING_ASSIGNED", name: "Drawing Assigned", color: "#a855f7", isFinal: false },
  { key: "DRAWING_SENT", name: "Drawing Sent", color: "#6366f1", isFinal: false },
  { key: "REVISION_REQUIRED", name: "Revision Required", color: "#f97316", isFinal: false },
  { key: "DRAWING_APPROVED", name: "Drawing Approved", color: "#22c55e", isFinal: false },
  { key: "PO_PLACED", name: "PO Placed", color: "#10b981", isFinal: false },
  { key: "INVENTORY_FOLLOW_UP", name: "Inventory Follow-up", color: "#f59e0b", isFinal: false },
  { key: "PRODUCTION_FOLLOW_UP", name: "Production Follow-up", color: "#06b6d4", isFinal: true },
];

function toMeta(step: WorkflowTemplateStep): WorkflowStageMeta {
  return {
    key: step.key,
    name: step.name,
    color: step.color || "#64748b",
    isFinal: step.isFinal,
  };
}

export function useWorkflowTemplate() {
  const [stages, setStages] = useState<WorkflowStageMeta[]>(DEFAULT_WORKFLOW_STAGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await workflowApi.getTemplate();
        if (!cancelled && response.data.success) {
          const steps = (response.data.data.steps || [])
            .filter((s) => s.isActive)
            .sort((a, b) => a.position - b.position)
            .map(toMeta);
          if (steps.length > 0) setStages(steps);
        }
      } catch (error) {
        console.error("Failed to load workflow template:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stages, loading };
}