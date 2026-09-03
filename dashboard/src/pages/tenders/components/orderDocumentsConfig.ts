import { useERPStore } from "@/store/erpStore";
import { securityApi } from "@/services/modules";

export interface DocumentCategoryDef {
  id?: string;
  name: string;
  isMandatory: boolean;
  description?: string;
}

export const INITIAL_DOCUMENT_CATEGORIES: DocumentCategoryDef[] = [
  {
    name: "BOM / BOQ/Tender",
    isMandatory: true,
    description: "Bill of Materials, BOQ sheet or tender specification copy",
  },
  {
    name: "Customer PO Copy or DVEPL Final Offer",
    isMandatory: true,
    description: "Official customer purchase order or signed final offer copy",
  },
  {
    name: "Rough Drawings Copy",
    isMandatory: true,
    description: "Preliminary or rough drawings provided by customer/sales",
  },
  {
    name: "Miscellaneous Document",
    isMandatory: false,
    description: "Any supporting technical notes, emails, or specifications",
  },
  {
    name: "PO Copy",
    isMandatory: false,
    description: "Purchase order copy",
  },
  {
    name: "Tender Copy",
    isMandatory: false,
    description: "Complete tender document copy",
  },
];

export const ORDER_DOCUMENTS_STORAGE_KEY = "dvepl_order_documents";
export const ORDER_DOCUMENTS_CHANGED_EVENT = "dvepl_order_documents_changed";

/**
 * Normalizes category names for insensitive comparison
 */
export function normalizeCategoryName(name: string): string {
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Retrieves the current configured order document categories
 * Checks store.settings first, then localStorage, then fallback to defaults.
 */
export function getOrderDocumentCategories(settings?: any): DocumentCategoryDef[] {
  if (
    settings?.orderDocuments &&
    Array.isArray(settings.orderDocuments) &&
    settings.orderDocuments.length > 0
  ) {
    return settings.orderDocuments;
  }

  try {
    const local = localStorage.getItem(ORDER_DOCUMENTS_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse order documents from localStorage:", e);
  }

  return INITIAL_DOCUMENT_CATEGORIES;
}

/**
 * Directly fetch latest document categories from backend database and sync store/storage
 */
export async function fetchOrderDocumentCategories(): Promise<DocumentCategoryDef[]> {
  try {
    const data = await securityApi.settings.read();
    if (data?.orderDocuments && Array.isArray(data.orderDocuments) && data.orderDocuments.length > 0) {
      try {
        localStorage.setItem(ORDER_DOCUMENTS_STORAGE_KEY, JSON.stringify(data.orderDocuments));
      } catch {}
      useERPStore.setState((prev) => ({
        settings: { ...prev.settings, ...data },
      }));
      window.dispatchEvent(
        new CustomEvent(ORDER_DOCUMENTS_CHANGED_EVENT, { detail: data.orderDocuments })
      );
      return data.orderDocuments;
    }
  } catch (e) {
    console.error("Failed to fetch order document categories from backend:", e);
  }
  return getOrderDocumentCategories(useERPStore.getState().settings);
}

/**
 * Persists document categories to backend company settings & localStorage,
 * and notifies all active listeners in the application.
 */
export async function saveOrderDocumentCategories(
  categories: DocumentCategoryDef[],
  updateSettingsFn?: (payload: any) => Promise<void>
): Promise<void> {
  // 1. Save to localStorage for instant local update
  try {
    localStorage.setItem(
      ORDER_DOCUMENTS_STORAGE_KEY,
      JSON.stringify(categories)
    );
  } catch (e) {
    console.error("Failed to save order documents to localStorage:", e);
  }

  // 2. Save to database settings via updateSettingsFn or directly via securityApi
  try {
    if (updateSettingsFn) {
      await updateSettingsFn({ orderDocuments: categories });
    } else {
      await securityApi.settings.update({ orderDocuments: categories });
    }
    useERPStore.setState((prev) => ({
      settings: { ...prev.settings, orderDocuments: categories },
    }));
  } catch (e) {
    console.error("Failed to update backend document categories:", e);
    throw e;
  }

  // 3. Dispatch global event for instant UI sync across open components
  window.dispatchEvent(
    new CustomEvent(ORDER_DOCUMENTS_CHANGED_EVENT, { detail: categories })
  );
}
