import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Loader2,
  Calendar as CalendarIcon,
  Search,
  Check,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { apiClient } from "@/services/axios";
import { securityApi, crmApi } from "@/services/modules";
import workflowApi from "@/services/workflowApi";
import { toast } from "react-hot-toast";
import { useERPStore } from "@/store/erpStore";

import {
  ProjectDocumentUploadPanel,
  MANDATORY_CATEGORIES,
} from "./ProjectDocumentUploadPanel";
import { SalesOrderAttachment } from "../orderShared";

// ============================================================
// TYPES
// ============================================================

interface OrderItemForm {
  itemCode: string;
  description: string;
  unit: string;
  quantity: string;
  rate: string;
  gstPercentage: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface StageRow {
  key: string;
  name: string;
  department: string;
}

interface CustomerOption {
  id: string;
  name: string;
  firmName?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  contacts?: Array<{
    name?: string;
    phone?: string;
    email?: string;
    isPrimary?: boolean;
  }>;
}

interface AddOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string | null;
  orderTakenById?: string | null;
  editingOrder?: {
    id: string;
    dveplCode?: string;
    partyName?: string;
    caNo?: string | null;
    name?: string;
    mobile?: string;
    email_id?: string;
    name_of_work?: string;
    department_name?: string;
    section_name?: string;
    division_name?: string;
    subdivision?: string;
    state_name?: string | null;
    tenderID?: string;
    reference_code?: string;
    status?: string;
    remarks?: string;
    poDate?: string;
    deliveryMonthTarget?: string;
    orderConfirmDate?: string;
    drawingConcernedPerson?: string;
    inspectionField?: string;
    attachments?: SalesOrderAttachment[];
  } | null;
  onSuccess: () => void;
}

const EMPTY_ITEM: OrderItemForm = {
  itemCode: "",
  description: "",
  unit: "Nos",
  quantity: "1",
  rate: "0",
  gstPercentage: "18",
};

// Default fallback workflow stages with department labels
const DEFAULT_STAGE_ROWS: StageRow[] = [
  {
    key: "UPLOAD_CUSTOMER_ORDER_DETAILS",
    name: "Upload Customer Order Details For Accounts",
    department: "Costing",
  },
  {
    key: "UPLOAD_PO_VENDOR",
    name: "Upload Purchase Order (PO) for Vendor",
    department: "Accounts",
  },
  {
    key: "UPLOAD_DRAWINGS",
    name: "Upload Drawings",
    department: "Design",
  },
  {
    key: "UPLOAD_APPROVED_DRAWINGS",
    name: "Upload Customer Approved Drawings",
    department: "Design",
  },
  {
    key: "TEST_STAGE",
    name: "test stage",
    department: "Costing",
  },
];

// Helper to format Date -> YYYY-MM-DD
function toDateInputFormat(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Add days to date
function addDays(dateStr: string, days: number): string {
  if (!dateStr || isNaN(days)) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return toDateInputFormat(d);
}

// Format date for display: "Oct 24, 2026"
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================================
// MODAL COMPONENT
// ============================================================

export function AddOrderModal({
  open,
  onOpenChange,
  companyId,
  orderTakenById: propOrderTakenById,
  editingOrder,
  onSuccess,
}: AddOrderModalProps) {
  const store = useERPStore();

  // ------------------------------------------------------------
  // FORM STATE
  // ------------------------------------------------------------
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const [dveplCode, setDveplCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [emailId, setEmailId] = useState("");

  const [billingAddress, setBillingAddress] = useState("");
  const [isBillingChanged, setIsBillingChanged] = useState(false);

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState("");

  const [orderDate, setOrderDate] = useState(() =>
    toDateInputFormat(new Date())
  );
  const [commitmentType, setCommitmentType] = useState<"fixed" | "days">(
    "fixed"
  );
  const [commitmentDate, setCommitmentDate] = useState("");
  const [commitmentDays, setCommitmentDays] = useState("");

  const [customerPoNo, setCustomerPoNo] = useState("");
  const [totalPanels, setTotalPanels] = useState("");
  const [advance, setAdvance] = useState("");
  const [projectReference, setProjectReference] = useState("");

  const [orderTakenById, setOrderTakenById] = useState<string | null>(null);

  // Workflow Stages & Responsibility assignments
  const [stageRows, setStageRows] = useState<StageRow[]>(DEFAULT_STAGE_ROWS);
  const [stageAssignments, setStageAssignments] = useState<
    Record<string, string>
  >({});

  // Line items (Order Detail Tabs)
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [items, setItems] = useState<OrderItemForm[]>([{ ...EMPTY_ITEM }]);

  // Document upload state
  const [pendingDocuments, setPendingDocuments] = useState<
    Array<{ category: string; file: File }>
  >([]);
  const [allMandatoryDocsUploaded, setAllMandatoryDocsUploaded] = useState(false);

  // Data fetching state
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ------------------------------------------------------------
  // RESET FORM
  // ------------------------------------------------------------
  const resetForm = () => {
    setSelectedCustomerId(null);
    setCustomerSearchQuery("");
    setIsCustomerDropdownOpen(false);

    setDveplCode("");
    setCompanyName("");
    setContactPerson("");
    setMobileNo("");
    setEmailId("");

    setBillingAddress("");
    setIsBillingChanged(false);

    setSameAsBilling(true);
    setShippingAddress("");

    setOrderDate(toDateInputFormat(new Date()));
    setCommitmentType("fixed");
    setCommitmentDate("");
    setCommitmentDays("");

    setCustomerPoNo("");
    setTotalPanels("");
    setAdvance("");
    setProjectReference("");

    setOrderTakenById(propOrderTakenById || null);
    setStageAssignments({});

    setIsOrderDetailOpen(false);
    setItems([{ ...EMPTY_ITEM }]);
    setPendingDocuments([]);
    setAllMandatoryDocsUploaded(false);
  };

  // ------------------------------------------------------------
  // LOAD CUSTOMERS, TEAM MEMBERS & WORKFLOW TEMPLATE
  // ------------------------------------------------------------
  useEffect(() => {
    if (!open) return;

    // 1. Fetch Customers
    (async () => {
      try {
        const res = await crmApi.customers.list();
        const list = Array.isArray(res) ? res : (res as any)?.data || [];
        setCustomers(list);
      } catch (err) {
        console.error("Failed to load customers:", err);
      }
    })();

    // 2. Fetch Team Members
    (async () => {
      try {
        const res = await securityApi.users.list();
        const list: UserOption[] = Array.isArray(res)
          ? res
          : (res as any)?.data || [];
        const activeUsers = list.filter(
          (u: any) =>
            u.isActive !== false &&
            u.name?.toLowerCase() !== "admin" &&
            u.email?.toLowerCase() !== "admin@dvepl.com"
        );
        setTeamMembers(activeUsers.length > 0 ? activeUsers : (store.users as any) || []);
      } catch (err) {
        console.error("Failed to load users:", err);
        if (store.users?.length) {
          setTeamMembers(store.users as any);
        }
      }
    })();

    // 3. Fetch Workflow Template Steps
    (async () => {
      try {
        const res = await workflowApi.getTemplate();
        if (res.data?.success && res.data?.data?.steps) {
          const steps = res.data.data.steps
            .filter((s) => s.isActive)
            .sort((a, b) => a.position - b.position);

          if (steps.length > 0) {
            const mapped: StageRow[] = steps.map((s) => {
              // Guess department from step name or fallback
              let dept = "Costing";
              const nameLower = s.name.toLowerCase();
              if (nameLower.includes("account") || nameLower.includes("po")) {
                dept = "Accounts";
              } else if (nameLower.includes("draw") || nameLower.includes("design")) {
                dept = "Design";
              } else if (nameLower.includes("purchase") || nameLower.includes("vendor")) {
                dept = "Accounts";
              } else if (nameLower.includes("production")) {
                dept = "Production";
              } else if (nameLower.includes("inventory")) {
                dept = "Inventory";
              }
              return {
                key: s.key,
                name: s.name,
                department: dept,
              };
            });
            setStageRows(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load workflow template:", err);
      }
    })();
  }, [open, store.users]);

  // ------------------------------------------------------------
  // HANDLE PREFILL ON EDIT
  // ------------------------------------------------------------
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!editingOrder?.id) return;
      try {
        const res = await apiClient.get(`/order/read/${editingOrder.id}`);
        if (res.data?.success && res.data?.data) {
          const order = res.data.data;

          setDveplCode(order.dveplCode || "");
          setCompanyName(order.partyName || "");
          setCustomerPoNo(order.caNo || "");

          const parts = (order.contactDetails || "").split(" | ");
          setContactPerson(parts[0] || "");
          setMobileNo(parts[1] || "");
          setEmailId(parts[2] || "");

          if (order.poDate) {
            setOrderDate(new Date(order.poDate).toISOString().slice(0, 10));
          }
          if (order.deliveryMonthTarget) {
            setCommitmentType("fixed");
            setCommitmentDate(new Date(order.deliveryMonthTarget).toISOString().slice(0, 10));
          }
          setTotalPanels(order.inspectionField || "");

          if (order.remarks) {
            const lines = order.remarks.split("\n");
            lines.forEach((line: string) => {
              if (line.startsWith("Project Reference: ")) {
                setProjectReference(line.replace("Project Reference: ", ""));
              } else if (line.startsWith("Advance: ")) {
                setAdvance(line.replace("Advance: ", ""));
              } else if (line.startsWith("Billing Address: ")) {
                setBillingAddress(line.replace("Billing Address: ", ""));
                setIsBillingChanged(true);
              } else if (line.startsWith("Shipping Address: ")) {
                setShippingAddress(line.replace("Shipping Address: ", ""));
                setSameAsBilling(false);
              }
            });
          }

          if (order.items && order.items.length > 0) {
            setItems(
              order.items.map((item: any) => ({
                itemCode: item.itemCode || "",
                description: item.description || "",
                unit: item.unit || "Nos",
                quantity: String(item.quantity ?? "1"),
                rate: String(item.unitPrice ?? item.rate ?? "0"),
                gstPercentage: String(item.gstPercentage ?? "18"),
              }))
            );
          } else {
            setItems([{ ...EMPTY_ITEM }]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch order details:", err);
        toast.error("Failed to load full order details.");
      }
    };

    if (!open) return;

    if (editingOrder) {
      setDveplCode(editingOrder.dveplCode || "");
      setCompanyName(editingOrder.partyName || (editingOrder as any).firm_name || "");
      setContactPerson(editingOrder.name || "");
      setMobileNo(editingOrder.mobile || "");
      setEmailId(editingOrder.email_id || "");
      setCustomerPoNo(editingOrder.caNo || "");
      setProjectReference(editingOrder.reference_code || "");
      setTotalPanels(editingOrder.inspectionField || "");
      if (editingOrder.poDate) {
        setOrderDate(editingOrder.poDate.slice(0, 10));
      }
      if (editingOrder.deliveryMonthTarget) {
        setCommitmentDate(editingOrder.deliveryMonthTarget.slice(0, 10));
      }
      void fetchOrderDetails();
    } else {
      setOrderTakenById(propOrderTakenById || null);
    }
  }, [open, editingOrder, propOrderTakenById]);

  // Close customer dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ------------------------------------------------------------
  // CUSTOMER AUTO-COMPLETE FILTER & SELECTION
  // ------------------------------------------------------------
  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers
      .filter((c) => {
        const nameMatch = c.name?.toLowerCase().includes(q);
        const firmMatch = c.firmName?.toLowerCase().includes(q);
        const contactMatch = c.contacts?.some(
          (cp) =>
            cp.name?.toLowerCase().includes(q) ||
            cp.phone?.includes(q) ||
            cp.email?.toLowerCase().includes(q)
        );
        return nameMatch || firmMatch || contactMatch;
      })
      .slice(0, 10);
  }, [customers, customerSearchQuery]);

  const handleSelectCustomer = (customer: CustomerOption) => {
    setSelectedCustomerId(customer.id);
    setCustomerSearchQuery(customer.firmName || customer.name || "");
    setIsCustomerDropdownOpen(false);

    setCompanyName(customer.firmName || customer.name || "");

    const primaryContact =
      customer.contacts?.find((cp) => cp.isPrimary) ||
      customer.contacts?.[0];

    if (primaryContact) {
      if (primaryContact.name) setContactPerson(primaryContact.name);
      if (primaryContact.phone) setMobileNo(primaryContact.phone);
      if (primaryContact.email) setEmailId(primaryContact.email);
    }

    if (customer.billingAddress) {
      setBillingAddress(customer.billingAddress);
    }
    if (customer.shippingAddress) {
      setShippingAddress(customer.shippingAddress);
      setSameAsBilling(false);
    } else {
      setSameAsBilling(true);
    }
    setIsBillingChanged(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId(null);
    setCustomerSearchQuery("");
    setCompanyName("");
    setContactPerson("");
    setMobileNo("");
    setEmailId("");
    setBillingAddress("");
    setIsBillingChanged(false);
  };

  // ------------------------------------------------------------
  // COMMITMENT DATE CALCULATION
  // ------------------------------------------------------------
  const calculatedCommitmentDate = useMemo(() => {
    if (commitmentType === "fixed") {
      return commitmentDate;
    }
    const days = parseInt(commitmentDays, 10);
    if (!orderDate || isNaN(days) || days <= 0) return "";
    return addDays(orderDate, days);
  }, [commitmentType, commitmentDate, commitmentDays, orderDate]);

  // ------------------------------------------------------------
  // STAGE ASSIGNMENT HANDLER & LABELS
  // ------------------------------------------------------------
  const handleStageAssignmentChange = (stageKey: string, userId: string) => {
    setStageAssignments((prev) => ({
      ...prev,
      [stageKey]: userId === "__none__" ? "" : userId,
    }));
  };

  const selectedOrderTakenByLabel = useMemo(() => {
    if (!orderTakenById || orderTakenById === "__none__") return "";
    const member = teamMembers.find((m) => m.id === orderTakenById);
    return member
      ? `${member.name}${member.email ? ` (${member.email})` : ""}`
      : "";
  }, [orderTakenById, teamMembers]);

  const getStageAssigneeLabel = (stageKey: string) => {
    const userId = stageAssignments[stageKey];
    if (!userId || userId === "__none__") return "";
    const member = teamMembers.find((m) => m.id === userId);
    return member ? member.name : "";
  };

  // ------------------------------------------------------------
  // LINE ITEM MANAGEMENT
  // ------------------------------------------------------------
  const updateItem = (
    index: number,
    key: keyof OrderItemForm,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [{ ...EMPTY_ITEM }] : next;
    });
  };

  // ------------------------------------------------------------
  // REMARKS BUILDER
  // ------------------------------------------------------------
  const buildRemarks = () => {
    const lines: string[] = [];
    if (projectReference.trim()) {
      lines.push(`Project Reference: ${projectReference.trim()}`);
    }
    if (advance.trim()) {
      lines.push(`Advance: ${advance.trim()}`);
    }
    if (totalPanels.trim()) {
      lines.push(`Total Panels/Units: ${totalPanels.trim()}`);
    }
    if (billingAddress.trim()) {
      lines.push(`Billing Address: ${billingAddress.trim()}`);
    }
    if (!sameAsBilling && shippingAddress.trim()) {
      lines.push(`Shipping Address: ${shippingAddress.trim()}`);
    }
    if (commitmentType === "days" && commitmentDays.trim()) {
      lines.push(
        `Commitment: ${commitmentDays.trim()} Days (Target: ${calculatedCommitmentDate})`
      );
    }
    return lines.join("\n");
  };

  // ------------------------------------------------------------
  // SUBMIT & PROCEED HANDLER
  // ------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingOrder && !companyId) {
      toast.error("Company context is missing. Cannot create order.");
      return;
    }

    if (!dveplCode.trim()) {
      toast.error("DVEPL Ref Code is required.");
      return;
    }

    if (!companyName.trim()) {
      toast.error("Company Name is required.");
      return;
    }

    if (commitmentType === "fixed" && !commitmentDate) {
      toast.error("Date of Commitment is required.");
      return;
    }
    if (commitmentType === "days" && !commitmentDays.trim()) {
      toast.error("Number of Commitment Days is required.");
      return;
    }

    if (!advance.trim()) {
      toast.error("Advance amount/terms is required.");
      return;
    }

    if (!projectReference.trim()) {
      toast.error("Project Reference is required.");
      return;
    }

    // Check mandatory documents for new orders
    if (!editingOrder && !allMandatoryDocsUploaded) {
      const missing = MANDATORY_CATEGORIES.filter((mand) => {
        const mandNorm = mand.toLowerCase().replace(/[^a-z0-9]/g, "");
        return !pendingDocuments.some(
          (doc) =>
            doc.category.toLowerCase().replace(/[^a-z0-9]/g, "") === mandNorm
        );
      });

      if (missing.length > 0) {
        toast.error(
          `Please upload mandatory document(s): ${missing.join(", ")}`
        );
        return;
      }
    }

    const contactParts = [contactPerson, mobileNo, emailId]
      .map((v) => v.trim())
      .filter(Boolean);
    const contactDetails =
      contactParts.length > 0 ? contactParts.join(" | ") : null;

    const validItems = items
      .filter((item) => item.itemCode.trim() || item.description.trim())
      .map((item) => ({
        itemCode: item.itemCode.trim() || "ITEM-1",
        description: item.description.trim() || "Order Item",
        unit: item.unit.trim() || "Nos",
        quantity: Number(item.quantity) || 1,
        rate: Number(item.rate) || 0,
        gstPercentage: Number(item.gstPercentage) || 18,
        remarks: null,
      }));

    const finalItems =
      validItems.length > 0
        ? validItems
        : [
            {
              itemCode: dveplCode.trim(),
              description: `Sales Order for ${companyName.trim()}`,
              unit: "Nos",
              quantity: 1,
              rate: 0,
              gstPercentage: 18,
              remarks: null,
            },
          ];

    const payload = {
      ...(editingOrder
        ? {}
        : { companyId, orderTakenById: orderTakenById || null }),
      customerId: selectedCustomerId || null,
      dveplCode: dveplCode.trim(),
      status: editingOrder?.status || "PENDING",
      partyName: companyName.trim(),
      caNo: customerPoNo.trim() || null,
      contactDetails,
      poDate: orderDate || null,
      orderConfirmDate: orderDate || null,
      deliveryMonthTarget: calculatedCommitmentDate || null,
      inspectionField: totalPanels.trim() || null,
      sendNotification: true,
      remarks: buildRemarks() || null,
      items: finalItems,
    };

    setIsSubmitting(true);
    try {
      // 1. Create or Update Sales Order
      const response = editingOrder
        ? await apiClient.patch(`/order/update/${editingOrder.id}`, payload)
        : await apiClient.post("/order/create", payload);

      if (!response.data?.success) {
        toast.error(
          response.data?.message ??
            (editingOrder
              ? "Unable to update order."
              : "Unable to create order.")
        );
        return;
      }

      const orderId = editingOrder
        ? editingOrder.id
        : response.data?.data?.id;

      // 2. Upload and Attach Pending Documents
      if (orderId && pendingDocuments.length > 0) {
        await Promise.all(
          pendingDocuments.map(async ({ category, file }) => {
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await apiClient.post("/upload/", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            const fileUrl = uploadRes.data?.data?.fileUrl;
            if (!fileUrl) {
              throw new Error("Upload did not return a file URL.");
            }
            await apiClient.post(`/order/attachment/${orderId}`, {
              fileName: file.name,
              fileUrl,
              fileSize: file.size,
              mimeType: file.type || null,
              category,
            });
          })
        );
      }

      // 3. Save Stage Responsibilities (Assignments)
      const stageAssignmentsPayload = Object.entries(stageAssignments)
        .filter(([_, userId]) => Boolean(userId) && userId !== "__none__")
        .map(([stage, userId]) => ({
          stage,
          userIds: [userId],
        }));

      if (orderId && stageAssignmentsPayload.length > 0) {
        try {
          await apiClient.put(`/order/assign/${orderId}`, {
            assignments: stageAssignmentsPayload,
          });
        } catch (assignErr) {
          console.error("Failed to assign stages:", assignErr);
        }
      }

      toast.success(
        editingOrder
          ? "Order updated successfully!"
          : "Order created successfully!"
      );
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ??
          (editingOrder
            ? "Failed to update order. Please try again."
            : "Failed to create order. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && !isSubmitting) {
      resetForm();
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="
          w-[calc(100%-2rem)]
          sm:max-w-4xl
          lg:max-w-5xl
          xl:max-w-6xl
          max-h-[92vh]
          overflow-hidden
          p-0
          gap-0
          rounded-2xl
          border
          border-neutral-200
          dark:border-neutral-800
          bg-white
          dark:bg-neutral-950
          shadow-2xl
        "
      >
        {/* ========================================================
            MODAL HEADER (Matching Screenshot 1)
            ======================================================== */}
        <DialogHeader className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
              {editingOrder ? "Edit Order" : "Start New Order"}
            </DialogTitle>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
              Step 1 — capture customer & order details. Documents can be attached below.
            </p>
          </div>
        </DialogHeader>

        {/* ========================================================
            MODAL SCROLLABLE BODY
            ======================================================== */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto max-h-[calc(92vh-140px)] px-6 py-6 space-y-6 scrollbar-thin text-neutral-800 dark:text-neutral-200"
        >
          {/* ======================================================
              ROW 1: EXISTING CUSTOMER & DVEPL REF CODE
              ====================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Existing Customer Combobox */}
            <div className="lg:col-span-8 space-y-1 relative" ref={customerDropdownRef}>
              <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase block">
                EXISTING CUSTOMER
              </label>
              <div className="relative">
                <Input
                  value={customerSearchQuery}
                  onChange={(e) => {
                    setCustomerSearchQuery(e.target.value);
                    setIsCustomerDropdownOpen(true);
                    if (!e.target.value) {
                      setSelectedCustomerId(null);
                    }
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  placeholder="Search by company/firm or contact person name..."
                  className={`h-10 text-xs rounded-lg transition-all pr-8 ${
                    selectedCustomerId
                      ? "border-emerald-600 ring-1 ring-emerald-600 font-medium"
                      : "border-neutral-300 dark:border-neutral-700 focus:border-emerald-600 focus:ring-emerald-500"
                  }`}
                />
                {selectedCustomerId ? (
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    title="Clear selected customer"
                  >
                    <X className="size-4" />
                  </button>
                ) : (
                  <Search className="size-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
              </div>

              {/* Autocomplete Dropdown Menu */}
              {isCustomerDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-xs text-neutral-500 text-center">
                      No matching customers found.
                    </div>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const isSelected = selectedCustomerId === cust.id;
                      const contact = cust.contacts?.[0];
                      return (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectCustomer(cust)}
                          className={`p-2.5 text-xs hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected ? "bg-emerald-50 dark:bg-emerald-950/50" : ""
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                              {cust.firmName || cust.name}
                            </p>
                            {contact && (
                              <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                                {contact.name || "Contact"}
                                {contact.phone ? ` · ${contact.phone}` : ""}
                                {contact.email ? ` · ${contact.email}` : ""}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="size-4 text-emerald-600 shrink-0 ml-2" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* DVEPL Ref Code */}
            <div className="lg:col-span-4 space-y-1">
              <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase block">
                <span className="text-red-500 font-bold">*</span> DVEPL REF CODE
              </label>
              <Input
                value={dveplCode}
                onChange={(e) => setDveplCode(e.target.value)}
                placeholder="e.g. SO-2026-0001"
                className="h-10 text-xs rounded-lg border-neutral-300 dark:border-neutral-700 focus:border-emerald-600 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* ======================================================
              ROW 2: COMPANY NAME, CONTACT PERSON, MOBILE NO, EMAIL ID
              ====================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase block">
                <span className="text-red-500 font-bold">*</span> COMPANY NAME
              </label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company/Firm name"
                className="h-10 text-xs rounded-lg border-neutral-300 dark:border-neutral-700 focus:border-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase block">
                CONTACT PERSON
              </label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Contact person name"
                className="h-10 text-xs rounded-lg border-neutral-300 dark:border-neutral-700 focus:border-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase block">
                MOBILE NO
              </label>
              <Input
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                placeholder="Mobile number"
                className="h-10 text-xs rounded-lg border-neutral-300 dark:border-neutral-700 focus:border-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase block">
                EMAIL ID
              </label>
              <Input
                type="email"
                value={emailId}
                onChange={(e) => setEmailId(e.target.value)}
                placeholder="Email address"
                className="h-10 text-xs rounded-lg border-neutral-300 dark:border-neutral-700 focus:border-emerald-600 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* ======================================================
              ROW 3: BILLING ADDRESS
              ====================================================== */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase block">
              BILLING ADDRESS
            </label>
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 bg-neutral-50/50 dark:bg-neutral-900/30">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-neutral-600 dark:text-neutral-400">
                  {billingAddress && !isBillingChanged
                    ? `Inherited: ${billingAddress}`
                    : "Inherited from the selected customer — nothing to fill in unless it's changed"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsBillingChanged(!isBillingChanged)}
                  className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold text-xs hover:underline cursor-pointer shrink-0"
                >
                  {isBillingChanged
                    ? "Hide Billing Address"
                    : "Any change in Billing Address?"}
                </button>
              </div>

              {isBillingChanged && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <Textarea
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="Enter updated billing address..."
                    rows={2}
                    className="text-xs rounded-lg border-neutral-300 dark:border-neutral-700"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ======================================================
              ROW 4: SHIPPING ADDRESS
              ====================================================== */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase block">
              SHIPPING ADDRESS
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <Checkbox
                checked={sameAsBilling}
                onCheckedChange={(val) => setSameAsBilling(Boolean(val))}
              />
              <span>Same as Billing Address</span>
            </label>

            {!sameAsBilling && (
              <div className="pt-1">
                <Textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter specific shipping / site delivery address..."
                  rows={2}
                  className="text-xs rounded-lg border-neutral-300 dark:border-neutral-700"
                />
              </div>
            )}
          </div>

          {/* ======================================================
              ROW 5: DATE OF ORDER, DATE OF COMMITMENT, CUSTOMER PO NO
              ====================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date of Order */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase block">
                DATE OF ORDER
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="h-10 text-xs rounded-lg border-neutral-300 dark:border-neutral-700"
                />
              </div>
            </div>

            {/* Date of Commitment with Toggle */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase">
                  <span className="text-red-500 font-bold">*</span> DATE OF COMMITMENT
                </label>
                <div className="inline-flex rounded-md p-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCommitmentType("fixed")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-sm transition-all ${
                      commitmentType === "fixed"
                        ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs"
                        : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600"
                    }`}
                  >
                    Fixed
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommitmentType("days")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-sm transition-all ${
                      commitmentType === "days"
                        ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs"
                        : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600"
                    }`}
                  >
                    Days
                  </button>
                </div>
              </div>

              {commitmentType === "fixed" ? (
                <Input
                  type="date"
                  value={commitmentDate}
                  onChange={(e) => setCommitmentDate(e.target.value)}
                  className="h-10 text-xs rounded-lg border-neutral-300 dark:border-neutral-700"
                />
              ) : (
                <div className="space-y-1">
                  <Input
                    type="number"
                    min="1"
                    value={commitmentDays}
                    onChange={(e) => setCommitmentDays(e.target.value)}
                    placeholder="e.g. 30 (days from order date)"
                    className="h-10 text-xs rounded-lg border-neutral-300 dark:border-neutral-700"
                  />
                  {calculatedCommitmentDate && (
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Target Delivery Date: {formatDateDisplay(calculatedCommitmentDate)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Customer PO No */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase block">
                CUSTOMER PO NO
              </label>
              <Input
                value={customerPoNo}
                onChange={(e) => setCustomerPoNo(e.target.value)}
                placeholder="e.g. CWEAFJ-48/2025"
                className="h-10 text-xs rounded-lg border-neutral-300 dark:border-neutral-700"
              />
            </div>
          </div>

          {/* ======================================================
              ROW 6: TOTAL PANELS/UNITS, ADVANCE, PROJECT REFERENCE
              ====================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase block">
                TOTAL PANELS / UNITS
              </label>
              <Input
                value={totalPanels}
                onChange={(e) => setTotalPanels(e.target.value)}
                placeholder="No. of physical panels in this job (not item qty) — enables units-clear"
                className="h-10 text-xs rounded-lg border-neutral-300 dark:border-neutral-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase block">
                <span className="text-red-500 font-bold">*</span> ADVANCE
              </label>
              <Input
                value={advance}
                onChange={(e) => setAdvance(e.target.value)}
                placeholder="e.g. 20% or ₹50,000"
                className="h-10 text-xs rounded-lg border-neutral-300 dark:border-neutral-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase block">
                <span className="text-red-500 font-bold">*</span> PROJECT REFERENCE
              </label>
              <Input
                value={projectReference}
                onChange={(e) => setProjectReference(e.target.value)}
                placeholder="e.g. MES-AF-UDHAMPUR"
                className="h-10 text-xs rounded-lg border-neutral-300 dark:border-neutral-700"
              />
            </div>
          </div>

          {/* ======================================================
              ROW 7: ORDER TAKEN BY / CONCERNED PERSON
              ====================================================== */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase block">
              ORDER TAKEN BY / CONCERNED PERSON
            </label>
            <Select
              value={orderTakenById || "__none__"}
              onValueChange={(val) =>
                setOrderTakenById(val === "__none__" ? null : val)
              }
            >
              <SelectTrigger className="h-10 rounded-lg border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-normal">
                <SelectValue placeholder="Select team member">
                  {selectedOrderTakenByLabel || undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select team member</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} {member.email ? `(${member.email})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ======================================================
              SECTION: * JOB RESPONSIBILITY — WHO HANDLES EACH STAGE
              ====================================================== */}
          <div className="space-y-2 pt-2">
            <div>
              <h3 className="text-[11px] font-bold tracking-wider text-neutral-800 dark:text-neutral-200 uppercase">
                <span className="text-red-500 font-bold">*</span> JOB RESPONSIBILITY — WHO HANDLES EACH STAGE
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal leading-relaxed mt-0.5">
                Pick who's responsible for each stage that varies per order. Stages with a Fixed Responsible Person (set on the Workflow Template) are auto-assigned and not asked here. Changing this later needs Admin, Manager or HR.
              </p>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg divide-y divide-neutral-200 dark:divide-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
              {stageRows.map((stage) => {
                const assignedVal = stageAssignments[stage.key] || "__none__";
                const stageLabel = getStageAssigneeLabel(stage.key);
                return (
                  <div
                    key={stage.key}
                    className="p-3 flex items-center justify-between gap-4 text-xs hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {stage.name}
                      </span>
                      <span className="text-neutral-400">·</span>
                      <span className="text-neutral-500 font-medium">
                        {stage.department}
                      </span>
                    </div>

                    <div className="w-56 shrink-0">
                      <Select
                        value={assignedVal}
                        onValueChange={(val) =>
                          handleStageAssignmentChange(stage.key, val ?? "")
                        }
                      >
                        <SelectTrigger className="h-8 text-xs rounded-lg border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 font-normal">
                          <SelectValue placeholder="Who's responsible?">
                            {stageLabel || undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            Who's responsible?
                          </SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================
              SECTION: ORDER DETAIL TABS
              ====================================================== */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold tracking-wider text-neutral-700 dark:text-neutral-300 uppercase">
                ORDER DETAIL TABS
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsOrderDetailOpen(!isOrderDetailOpen);
                  if (!isOrderDetailOpen && items.length === 0) {
                    addItem();
                  }
                }}
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="size-3.5" />
                {isOrderDetailOpen ? "Hide details" : "+ Add detail"}
              </button>
            </div>

            {isOrderDetailOpen && (
              <div className="space-y-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Line Items ({items.length})
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="h-7 text-xs rounded-lg gap-1"
                  >
                    <Plus className="size-3" /> Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Item #{index + 1}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                        <div className="lg:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold uppercase text-neutral-500">
                            Item Code
                          </label>
                          <Input
                            value={item.itemCode}
                            onChange={(e) =>
                              updateItem(index, "itemCode", e.target.value)
                            }
                            placeholder="e.g. TR-1001"
                            className="h-8 text-xs rounded-lg"
                          />
                        </div>

                        <div className="lg:col-span-4 space-y-1">
                          <label className="text-[10px] font-bold uppercase text-neutral-500">
                            Description
                          </label>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateItem(index, "description", e.target.value)
                            }
                            placeholder="Description of the panel or item"
                            className="h-8 text-xs rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-neutral-500">
                            Unit
                          </label>
                          <Input
                            value={item.unit}
                            onChange={(e) =>
                              updateItem(index, "unit", e.target.value)
                            }
                            className="h-8 text-xs rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-neutral-500">
                            Quantity
                          </label>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", e.target.value)
                            }
                            className="h-8 text-xs rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-neutral-500">
                            Rate
                          </label>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={item.rate}
                            onChange={(e) =>
                              updateItem(index, "rate", e.target.value)
                            }
                            className="h-8 text-xs rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-neutral-500">
                            GST %
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={item.gstPercentage}
                            onChange={(e) =>
                              updateItem(index, "gstPercentage", e.target.value)
                            }
                            className="h-8 text-xs rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================
              SECTION: PROJECT DOCUMENT UPLOAD (Matching Screenshot 3)
              ====================================================== */}
          <div className="pt-2">
            <ProjectDocumentUploadPanel
              attachments={editingOrder?.attachments || []}
              immediate={Boolean(editingOrder)}
              orderId={editingOrder?.id || null}
              disabled={isSubmitting}
              uploading={isSubmitting}
              onPendingChange={setPendingDocuments}
              onUploaded={onSuccess}
              onMandatoryFulfilledChange={setAllMandatoryDocsUploaded}
            />
          </div>

          {/* ======================================================
              FOOTER ACTION: SAVE & PROCEED (Matching Screenshot 1-3)
              ====================================================== */}
          <div className="pt-6 pb-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="
                h-10
                px-8
                rounded-xl
                font-bold
                text-sm
                text-white
                bg-[#15803d]
                hover:bg-[#166534]
                dark:bg-emerald-600
                dark:hover:bg-emerald-700
                shadow-sm
                transition-all
                disabled:opacity-60
              "
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save & Proceed"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddOrderModal;
