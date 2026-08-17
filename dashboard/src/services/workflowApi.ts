import { apiClient as api } from "./api";

export type WorkflowStage =
  | "ORDER_CONFIRMED"
  | "PO_READY"
  | "DRAWING_ASSIGNED"
  | "DRAWING_SENT"
  | "REVISION_REQUIRED"
  | "DRAWING_APPROVED"
  | "PO_PLACED"
  | "INVENTORY_FOLLOW_UP"
  | "PRODUCTION_FOLLOW_UP";

export interface WorkflowOrder {
  id: string;
  dveplCode: string;

  caNo: string | null;
  partyName: string | null;
  grandTotal: number;

  status: string;
  workflowStage: WorkflowStage;

  nextAction: string | null;
  dueDate: string | null;
  workflowUpdatedAt: string;

  lastEvent: {
    id: string;
    stage: WorkflowStage;
    title: string;
    description: string | null;
    createdAt: string;
  } | null;
}

export interface WorkflowOrdersResponse {
  success: boolean;
  data: WorkflowOrder[];
  count: number;
}

export interface WorkflowEvent {
  id: string;
  salesOrderId: string;
  stage: WorkflowStage;
  title: string;
  description: string | null;
  performedById: string | null;
  createdAt: string;
}

export interface OrderTrackerResponse {
  success: boolean;
  data: {
    orderId: string;
    workflowStage: WorkflowStage;
    nextAction: string | null;
    dueDate: string | null;
    workflowUpdatedAt: string;
    timeline: WorkflowEvent[];
  };
}

class WorkflowApi {
  getOrders(params?: {
    stage?: WorkflowStage;
    search?: string;
  }) {
    return api.get<WorkflowOrdersResponse>("/workflow/orders", {
      params,
    });
  }

  getOrderTracker(orderId: string) {
    return api.get<OrderTrackerResponse>(
      `/workflow/order/${orderId}/tracker`,
    );
  }
  updateOrderWorkflowStage(
    orderId: string,
    stage: string,
    data?: {
      nextAction?: string | null;
      dueDate?: string | null;
      description?: string | null;
    },
  ) {
    return api.patch(`/workflow/order/${orderId}/stage`, {
      stage,
      ...data,
    });
  }

  updateStage(
    orderId: string,
    data: {
      stage: WorkflowStage;
      nextAction?: string | null;
      dueDate?: string | null;
      description?: string | null;
    },
  ) {
    return api.patch(`/workflow/order/${orderId}/stage`, data);
  }
}

export default new WorkflowApi();
