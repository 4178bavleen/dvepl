import { apiClient as api } from "./api";

export type WorkflowStage = string;

export interface WorkflowTemplateStep {
  id: string;
  key: string;
  name: string;
  color: string | null;
  position: number;
  isFinal: boolean;
  isActive: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string | null;
  steps: WorkflowTemplateStep[];
}

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

export interface WorkflowTemplateResponse {
  success: boolean;
  data: WorkflowTemplate;
}

export interface WorkflowTemplateUpdateInput {
  name?: string;
  description?: string | null;
  steps: {
    key?: string;
    name: string;
    color?: string | null;
    isFinal?: boolean;
    isActive?: boolean;
  }[];
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

  getTemplate() {
    return api.get<WorkflowTemplateResponse>("/workflow/template");
  }

  updateTemplate(data: WorkflowTemplateUpdateInput) {
    return api.put<WorkflowTemplateResponse>("/workflow/template", data);
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