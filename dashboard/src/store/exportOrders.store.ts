import { create } from "zustand";
import { exportOrdersApi } from "@/services/modules";
import type {
  EngineeringDrawing,
  ExportOrder,
  ExportOrderFilters,
} from "@/types/exportOrders";

interface ExportOrdersStore {
  orders: ExportOrder[];
  availableOrders: ExportOrder[];
  drawings: EngineeringDrawing[];
  isOrdersLoading: boolean;
  isDrawingsLoading: boolean;
  error: string | null;
  fetchOrders: (filters?: ExportOrderFilters) => Promise<void>;
  fetchAvailableOrders: () => Promise<void>;
  fetchDrawings: (orderIds: string[]) => Promise<void>;
  updateDrawingStatus: (id: string, status: string, rejectionReason?: string | null) => Promise<void>;
}

export const useExportOrdersStore = create<ExportOrdersStore>((set) => ({
  orders: [],
  availableOrders: [],
  drawings: [],
  isOrdersLoading: false,
  isDrawingsLoading: false,
  error: null,

  fetchOrders: async (filters) => {
    set({ isOrdersLoading: true, error: null });
    try {
      const response = await exportOrdersApi.listOrders(filters);
      set({ orders: response.data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load orders." });
      throw error;
    } finally {
      set({ isOrdersLoading: false });
    }
  },

  fetchAvailableOrders: async () => {
    try {
      const response = await exportOrdersApi.listOrders();
      set({ availableOrders: response.data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load available orders." });
      throw error;
    }
  },

  fetchDrawings: async (orderIds) => {
    if (orderIds.length === 0) {
      set({ drawings: [], isDrawingsLoading: false });
      return;
    }

    set({ isDrawingsLoading: true, error: null });
    try {
      const response = await exportOrdersApi.listDrawings(orderIds);
      set({ drawings: response.data });
    } catch (error) {
      console.error("Failed to fetch drawings:", error);
      set({ error: error instanceof Error ? error.message : "Failed to load drawings." });
      // Do not throw — keep whatever drawings we already have in state
    } finally {
      set({ isDrawingsLoading: false });
    }
  },

  updateDrawingStatus: async (id, status, rejectionReason) => {
    const response = await exportOrdersApi.updateDrawingStatus(id, status, rejectionReason);
    set((state) => ({
      drawings: state.drawings.map((drawing) =>
        drawing.id === id ? { ...drawing, ...response.data } : drawing,
      ),
    }));
  },
}));
