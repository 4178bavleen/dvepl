import {
  PenLine,
  Send,
  CheckCircle2,
  Clock,
  PlayCircle,
  PauseCircle,
  XCircle,
} from "lucide-react";
import type { EngineeringDrawing } from "@/types/exportOrders";

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export const STATUS_CONFIG: Record<
  string,
  { label: string; icon: any; dot: string; pill: string; rowBg: string }
> = {
  DRAFT: {
    label: "Draft",
    icon: PenLine,
    dot: "bg-gray-400",
    pill: "bg-gray-50 text-gray-600 border border-gray-200",
    rowBg: "",
  },
  SUBMITTED: {
    label: "Submitted",
    icon: Send,
    dot: "bg-blue-500",
    pill: "bg-blue-50 text-blue-700 border border-blue-200",
    rowBg: "bg-blue-50/20",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    rowBg: "bg-emerald-50/20",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-700 border border-amber-200",
    rowBg: "",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: PlayCircle,
    dot: "bg-blue-500",
    pill: "bg-blue-50 text-blue-700 border border-blue-200",
    rowBg: "bg-blue-50/20",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    rowBg: "bg-emerald-50/20",
  },
  ON_HOLD: {
    label: "On Hold",
    icon: PauseCircle,
    dot: "bg-gray-400",
    pill: "bg-gray-100 text-gray-600 border border-gray-200",
    rowBg: "bg-gray-50/40",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    dot: "bg-red-500",
    pill: "bg-red-50 text-red-600 border border-red-200",
    rowBg: "bg-red-50/20",
  },
};

export type DrawingStatus = keyof typeof STATUS_CONFIG;

export interface WorkflowAction {
  status: DrawingStatus;
  label: string;
  hoverBg: string;
  textColor: string;
  icon?: any;
  requiresReason?: boolean;
}

export const WORKFLOW_ACTIONS: Record<string, WorkflowAction[]> = {
  DRAFT: [
    {
      status: "SUBMITTED",
      label: "Submit for Review",
      hoverBg: "hover:bg-blue-50",
      textColor: "text-blue-700",
      icon: Send,
    },
  ],
  REJECTED: [
    {
      status: "DRAFT",
      label: "Revise (back to Draft)",
      hoverBg: "hover:bg-gray-50",
      textColor: "text-gray-600",
      icon: PenLine,
    },
    {
      status: "SUBMITTED",
      label: "Resubmit for Review",
      hoverBg: "hover:bg-blue-50",
      textColor: "text-blue-700",
      icon: Send,
    },
  ],
  SUBMITTED: [
    {
      status: "APPROVED",
      label: "Approve",
      hoverBg: "hover:bg-emerald-50",
      textColor: "text-emerald-700",
      icon: CheckCircle2,
    },
    {
      status: "REJECTED",
      label: "Reject…",
      hoverBg: "hover:bg-red-50",
      textColor: "text-red-600",
      icon: XCircle,
      requiresReason: true,
    },
  ],
  APPROVED: [],
};

const LEGACY_ACTIONS: WorkflowAction[] = [
  {
    status: "SUBMITTED",
    label: "Submit for Review",
    hoverBg: "hover:bg-blue-50",
    textColor: "text-blue-700",
    icon: Send,
  },
  {
    status: "APPROVED",
    label: "Approve",
    hoverBg: "hover:bg-emerald-50",
    textColor: "text-emerald-700",
    icon: CheckCircle2,
  },
  {
    status: "PENDING",
    label: "Pending",
    hoverBg: "hover:bg-amber-50",
    textColor: "text-amber-700",
  },
  {
    status: "IN_PROGRESS",
    label: "In Progress",
    hoverBg: "hover:bg-blue-50",
    textColor: "text-blue-700",
  },
  {
    status: "COMPLETED",
    label: "Completed",
    hoverBg: "hover:bg-emerald-50",
    textColor: "text-emerald-700",
  },
  {
    status: "ON_HOLD",
    label: "On Hold",
    hoverBg: "hover:bg-gray-50",
    textColor: "text-gray-600",
  },
  {
    status: "REJECTED",
    label: "Rejected",
    hoverBg: "hover:bg-red-50",
    textColor: "text-red-600",
  },
];

export function getStatusActions(status: string): WorkflowAction[] {
  if (Object.hasOwn(WORKFLOW_ACTIONS, status)) {
    return WORKFLOW_ACTIONS[status] ?? [];
  }
  return LEGACY_ACTIONS;
}

export const TYPE_LABELS: Record<string, string> = {
  SLD: "SLD",
  GA_DRAWING: "G.A.",
  WIRING_DIAGRAM: "Wiring",
  LAYOUT: "Layout",
  CAD: "CAD",
  PDF: "PDF",
};

export const DRAWING_TYPES = [
  "SLD",
  "GA_DRAWING",
  "WIRING_DIAGRAM",
  "LAYOUT",
  "CAD",
  "PDF",
];

// ── Drawing helpers ──────────────────────────────────────────────────────────

export interface DrawingRevisionView {
  id: string;
  revisionNo: number;
  fileUrl: string;
  fileName: string;
  fileSize?: number | null;
  mimeType?: string | null;
  status?: string;
  changes?: string | null;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { id: string; name: string } | null;
  approvedBy?: { id: string; name: string } | null;
  rejectedBy?: { id: string; name: string } | null;
}

export type RevisionAwareDrawing = EngineeringDrawing & {
  revisions?: DrawingRevisionView[];
  currentRevision?: DrawingRevisionView | null;
};

export function toRevisionAware(
  drawing: EngineeringDrawing,
): RevisionAwareDrawing {
  return drawing as RevisionAwareDrawing;
}

export function getCurrentRevision(drawing: EngineeringDrawing) {
  const rev = toRevisionAware(drawing);
  return rev.currentRevision ?? rev.revisions?.[0] ?? null;
}

export function getRevisionFileUrl(drawing: EngineeringDrawing): string {
  return getCurrentRevision(drawing)?.fileUrl || drawing.fileUrl;
}

export function buildFileUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  try {
    return new URL(
      rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`,
      API_BASE_URL,
    ).toString();
  } catch {
    return rawUrl;
  }
}

export function parseContactDetails(details?: string) {
  if (!details) return { name: "", phone: "", email: "" };
  const parts = details.split("|").map((p) => p.trim());
  if (parts.length >= 3) {
    return { name: parts[0], phone: parts[1], email: parts[2] };
  }
  let email = "";
  let phone = "";
  const name = parts[0] || "";
  for (const part of parts) {
    if (part.includes("@")) {
      email = part;
    } else if (/^[+\d\s-]{10,20}$/.test(part)) {
      phone = part;
    }
  }
  return { name, phone, email };
}

export function orderForDrawing(
  drawing: EngineeringDrawing,
  orders: any[],
): any | undefined {
  const salesOrderId = drawing.project?.salesOrderId;
  return salesOrderId
    ? orders.find((o: any) => o.id === salesOrderId)
    : undefined;
}
