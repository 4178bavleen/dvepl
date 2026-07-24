import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import * as z from "zod";
import {
  Plus,
  Search,
  Loader2,
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle2,
  Trash2,
  Upload,
  RefreshCw,
  X,
  Users,
  MessageSquare,
  Mail,
  SlidersHorizontal,
  FileText,
  Info,
  Sparkles,
  Save,
  ChevronDown,
} from "lucide-react";
import { GenericTable, sortableHeader } from "@/components/tables/genericTable";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useERPStore } from "@/store/erpStore";
import { useCRMStore } from "@/store/crmStore";
import { toast } from "react-hot-toast";
import { hrmsApi } from "@/services/modules";
import { apiClient } from "@/services/axios";
import { SalesOrder } from "@/types/erp";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface LineItemRow {
  id: string;
  itemNo: string;
  qty: number;
  amount: number; // base price per unit
  gstPercent: number;
  unitTotal: number; // AUTO = Amount + GST
  totalAmount: number; // AUTO = Total x Qty
}

const ALL_COLUMN_KEYS = [
  { id: "companyCode", label: "DVEPL CODE" },
  { id: "orderTakenBy", label: "ORDER TAKEN BY" },
  { id: "assignedTo", label: "ASSIGNED TO" },
  { id: "customerName", label: "PARTY NAME" },
  { id: "caNo", label: "CA NO" },
  { id: "concernedPeople", label: "CONCERNED PERSONS" },
  { id: "contact", label: "CONTACT" },
  { id: "orderTakenDate", label: "CONFIRM DATE" },
  { id: "deliveryTarget", label: "DELIVERY TARGET" },
  { id: "poDate", label: "PO DATE" },
  { id: "drawingConcernedPerson", label: "DRAWING PERSON" },
  { id: "drawingApprovedDate", label: "DRAWING DATE" },
  { id: "drawingStatus", label: "DRAWING STATUS" },
  { id: "drawingRemarks", label: "DRAWING REMARKS" },
  { id: "itemCount", label: "ITEMS" },
  { id: "total", label: "TOTAL AMT (₹)" },
  { id: "status", label: "STATUS" },
] as const;

type ColumnKey = (typeof ALL_COLUMN_KEYS)[number]["id"];

const orderSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  companyCode: z.string().min(1, "DVEPL Code is required"),
  customerName: z.string().min(1, "Party Name is required"),
  caNo: z.string().optional(),
  contact: z.string().optional(),
  orderTakenDate: z.string().optional(),
  deliveryTarget: z.string().optional(),
  poDate: z.string().optional(),
  orderTakenById: z.string().optional(),
  drawingConcernedPerson: z.string().optional(),
  drawingApprovedDate: z.string().optional(),
  drawingStatus: z.string().optional(),
  drawingRemarks: z.string().optional(),
  status: z.string().default("pending"),
});

const EMPTY_ARRAY: SalesOrder[] = [];

const emptyLineItem = (id: string): LineItemRow => ({
  id,
  itemNo: "",
  qty: 1,
  amount: 0,
  gstPercent: 18,
  unitTotal: 0,
  totalAmount: 0,
});

export function OrdersPage() {
  const localOrders = useERPStore(
    (state) => ((state as any).salesOrders as SalesOrder[]) ?? EMPTY_ARRAY,
  );
  const addRecord = useERPStore((state) => state.addRecord);
  const updateRecord = useERPStore((state) => state.updateRecord);
  const deleteRecord = useERPStore((state) => state.deleteRecord);

  // Column Visibility State - Defaulting all to visible
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      ALL_COLUMN_KEYS.forEach((col) => {
        initial[col.id] = true;
      });
      return initial;
    },
  );

  // States
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterUser, setFilterUser] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date-newest");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<SalesOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Form Fields
  const [formValues, setFormValues] = useState<Record<string, any>>({
    companyId: "",
    companyCode: "",
    customerName: "",
    caNo: "",
    contact: "",
    orderTakenDate: "",
    deliveryTarget: "",
    poDate: "",
    orderTakenById: "",
    drawingConcernedPerson: "",
    drawingApprovedDate: "",
    drawingStatus: "",
    drawingRemarks: "",
    status: "pending",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [concernedPeople, setConcernedPeople] = useState<string[]>([]);
  const [cpInput, setCpInput] = useState("");
  const [sendWaNotif, setSendWaNotif] = useState(true);
  const [sendEmailNotif, setSendEmailNotif] = useState(true);

  // Line Items State
  const [lineItems, setLineItems] = useState<LineItemRow[]>([
    emptyLineItem("1"),
  ]);

  // Bulk Upload States & Methods
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewResult, setPreviewResult] = useState<any>(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.get("/order/download-template", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "sales_orders_bulk_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      toast.error("Failed to download template.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
      setPreviewResult(null);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const previewResponse = await apiClient.post("/order/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (previewResponse.data && previewResponse.data.success) {
        const preview = previewResponse.data.data;
        setPreviewResult(preview);

        if (preview.invalidRows > 0) {
          toast.error(`Found ${preview.invalidRows} invalid orders. Please review.`);
        } else {
          const uploadResponse = await apiClient.post("/order/bulk-upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          if (uploadResponse.data && uploadResponse.data.success) {
            toast.success("Bulk upload processed successfully!");
            await loadOrders();
            setIsBulkModalOpen(false);
            setSelectedFile(null);
            setPreviewResult(null);
          }
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Bulk upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // Options Data
  const [users, setUsers] = useState<
    Array<{ id: string; userId?: string; name: string }>
  >([]);

  const orders = useCRMStore((state) => state.salesOrders || EMPTY_ARRAY);
  const setSalesOrders = useCRMStore((state) => state.setSalesOrders);

  // Load backend orders
  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/order/read");
      if (response.data && response.data.success) {
        const mapped = (response.data.data || []).map((o: any) => ({
          id: o.id,
          orderNo: o.dveplCode,
          companyCode: o.dveplCode,
          customerName: o.partyName,
          companyId: o.companyId || "",
          status: o.status ? o.status.toLowerCase().replace("_", "-") : "pending",
          caNo: o.caNo || "",
          contact: o.contactDetails || "",
          orderTakenDate: o.orderConfirmDate
            ? o.orderConfirmDate.split("T")[0]
            : "",
          deliveryTarget: o.deliveryMonthTarget || "",
          poDate: o.poDate ? o.poDate.split("T")[0] : "",
          orderTakenById: o.orderTakenById || "",
          orderTakenByName: o.orderTakenBy?.name || "",
          assignedUserIds: (o.assignments || [])
            .map((a: any) => a.userId)
            .filter(Boolean),
          drawingConcernedPerson: o.drawingConcernedPerson || "",
          drawingApprovedDate: o.drawingApprovedDate
            ? o.drawingApprovedDate.split("T")[0]
            : "",
          drawingStatus: o.drawingStatus === "IN_PROGRESS"
            ? "In Process"
            : o.drawingStatus
            ? o.drawingStatus.charAt(0) + o.drawingStatus.slice(1).toLowerCase()
            : "Pending",
          drawingRemarks: o.drawingRemarks || "",
          concernedPeople: o.concernedPersons || [],
          // FIX: backend returns the order total as `grandTotal`
          // (Prisma field), not `total` / `totalAmount`. Reading the
          // wrong key here silently fell back to 0 every time.
          total: o.grandTotal ?? o.total ?? o.totalAmount ?? 0,
          subtotal: o.subtotal ?? 0,
          gstTotal: o.gstTotal ?? 0,
          lineItems: (o.items || []).map((item: any) => {
            const qty = Number(item.quantity || 0);
            const amount = Number(item.rate ?? item.unitPrice ?? 0);
            const gstPercent = Number(item.gstPercentage || 0);
            const unitTotal = amount + amount * (gstPercent / 100);
            return {
              id: item.id || item._id || Date.now().toString(),
              itemNo: item.itemCode || item.description || "",
              qty,
              amount,
              gstPercent,
              unitTotal,
              totalAmount: unitTotal * qty,
            };
          }),
        }));
        setSalesOrders(mapped);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to load orders.");
    } finally {
      setIsLoading(false);
    }
  }, [setSalesOrders]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Load Companies & Users/Employees
  useEffect(() => {
    apiClient
      .get("/company/read/")
      .then((res: any) => {
        if (res.data && res.data.success) {
          setCompanies(res.data.data || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load companies:", err);
        toast.error("Unable to load companies.");
      });

    hrmsApi.employees
      .list()
      .then((items: any[]) =>
        setUsers(
          items.map((i) => ({
            id: i.id, // ✅ Employee ID
            userId: i.userId || "", // ✅ User ID
            name: `${i.firstName ?? ""} ${i.lastName ?? ""}`.trim() || i.name,
          })),
        ),
      )
      .catch((err) => {
        console.error("Failed to load employees:", err);
        toast.error("Unable to load users.");
      });
  }, []);

  // Column Picker helper
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllColumns = (val: boolean) => {
    const updated: Record<string, boolean> = {};
    ALL_COLUMN_KEYS.forEach((col) => {
      updated[col.id] = val;
    });
    setVisibleColumns(updated);
  };

  // Assigned To multi-select helper
  const toggleAssignedUser = (userId: string) => {
    setAssignedUserIds((prev) => {
      const next = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];

      return next;
    });
  };

  const assignedUserLabel = useMemo(() => {
    if (assignedUserIds.length === 0) return "— Add user —";
    if (assignedUserIds.length === 1) {
      return (
        users.find((u) => u.userId === assignedUserIds[0])?.name ||
        "1 user selected"
      );
    }
    return `${assignedUserIds.length} users selected`;
  }, [assignedUserIds, users]);

  // Line Item Calculations
  const updateLineItem = (id: string, field: keyof LineItemRow, val: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        const qty = Number(updated.qty || 0);
        const amount = Number(updated.amount || 0);
        const gst = Number(updated.gstPercent || 0);
        const unitTotal = amount + amount * (gst / 100);
        updated.unitTotal = unitTotal;
        updated.totalAmount = unitTotal * qty;
        return updated;
      }),
    );
  };

  const addLineItemRow = () => {
    setLineItems((prev) => [...prev, emptyLineItem(Date.now().toString())]);
  };

  const deleteLineItemRow = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let gstTotal = 0;
    let grandTotal = 0;
    lineItems.forEach((item) => {
      const qty = Number(item.qty || 0);
      const amount = Number(item.amount || 0);
      const gst = amount * qty * (Number(item.gstPercent || 0) / 100);
      subtotal += amount * qty;
      gstTotal += gst;
      grandTotal += item.totalAmount;
    });
    return { subtotal, gstTotal, grandTotal };
  }, [lineItems]);

  // Concerned Persons Handlers
  const handleAddCP = () => {
    if (!cpInput.trim()) return;
    setConcernedPeople((prev) => [...prev, cpInput.trim()]);
    setCpInput("");
  };

  const handleRemoveCP = (index: number) => {
    setConcernedPeople((prev) => prev.filter((_, i) => i !== index));
  };

  // Filtered and Sorted Orders
  const processedOrders = useMemo(() => {
    let list = [...orders];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item: any) =>
          (item.companyCode ?? item.orderNo ?? "").toLowerCase().includes(q) ||
          (item.customerName ?? item.customer?.name ?? "")
            .toLowerCase()
            .includes(q) ||
          (item.caNo ?? "").toLowerCase().includes(q) ||
          (item.contact ?? "").toLowerCase().includes(q) ||
          (item.deliveryTarget ?? "").toLowerCase().includes(q) ||
          (item.drawingConcernedPerson ?? "").toLowerCase().includes(q) ||
          (item.drawingStatus ?? "").toLowerCase().includes(q) ||
          (item.drawingRemarks ?? "").toLowerCase().includes(q) ||
          (item.status ?? "").toLowerCase().includes(q) ||
          (Array.isArray(item.concernedPeople) &&
            item.concernedPeople.some((cp: string) =>
              cp.toLowerCase().includes(q),
            )) ||
          (Array.isArray(item.lineItems) &&
            item.lineItems.some((li: any) =>
              (li.itemNo || "").toLowerCase().includes(q),
            )),
      );
    }

    if (filterStatus) {
      list = list.filter(
        (item: any) =>
          (item.status || "pending").toLowerCase() ===
          filterStatus.toLowerCase(),
      );
    }

    if (filterUser) {
      list = list.filter(
        (item: any) =>
          item.orderTakenById === filterUser ||
          (Array.isArray(item.assignedUserIds) &&
            item.assignedUserIds.includes(filterUser)),
      );
    }

    if (sortBy === "date-newest") {
      list.sort(
        (a: any, b: any) =>
          new Date(b.createdAt || b.orderTakenDate || 0).getTime() -
          new Date(a.createdAt || a.orderTakenDate || 0).getTime(),
      );
    } else if (sortBy === "date-oldest") {
      list.sort(
        (a: any, b: any) =>
          new Date(a.createdAt || a.orderTakenDate || 0).getTime() -
          new Date(b.createdAt || b.orderTakenDate || 0).getTime(),
      );
    } else if (sortBy === "customer-asc") {
      list.sort((a: any, b: any) =>
        String(a.customerName || "").localeCompare(
          String(b.customerName || ""),
        ),
      );
    }

    return list;
  }, [orders, search, filterStatus, filterUser, sortBy]);

  // Stats
  const revenueTotal = useMemo(
    () =>
      orders.reduce(
        (sum, item: any) =>
          sum + Number(item.total ?? item.grandTotal ?? item.totalAmount ?? 0),
        0,
      ),
    [orders],
  );
  const pendingCount = useMemo(
    () =>
      orders.filter(
        (o: any) => (o.status || "pending").toLowerCase() === "pending",
      ).length,
    [orders],
  );
  const inProgressCount = useMemo(
    () =>
      orders.filter(
        (o: any) => (o.status || "").toLowerCase() === "in-progress",
      ).length,
    [orders],
  );
  const completedCount = useMemo(
    () =>
      orders.filter((o: any) => (o.status || "").toLowerCase() === "completed")
        .length,
    [orders],
  );

  // Form submit
  const openCreate = () => {
    setEditingOrder(null);
    setFormValues({
      companyId: "",
      companyCode: "",
      customerName: "",
      caNo: "",
      contact: "",
      orderTakenDate: new Date().toISOString().split("T")[0],
      deliveryTarget: "",
      poDate: "",
      orderTakenById: "",
      drawingConcernedPerson: "",
      drawingApprovedDate: "",
      drawingStatus: "Pending",
      drawingRemarks: "",
      status: "pending",
    });
    setAssignedUserIds([]);
    setConcernedPeople([]);
    setLineItems([emptyLineItem("1")]);
    setSendWaNotif(true);
    setSendEmailNotif(true);
    setErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (order: SalesOrder) => {
    const o = order as any;
    setEditingOrder(order);
    setFormValues({
      companyId: o.companyId || "",
      companyCode: o.companyCode || o.orderNo || "",
      customerName: o.customerName || o.customer?.name || "",
      caNo: o.caNo || "",
      contact: o.contact || "",
      orderTakenDate: o.orderTakenDate
        ? new Date(o.orderTakenDate).toISOString().split("T")[0]
        : "",
      deliveryTarget: o.deliveryTarget || "",
      poDate: o.poDate ? new Date(o.poDate).toISOString().split("T")[0] : "",
      orderTakenById: o.orderTakenById || "",
      drawingConcernedPerson: o.drawingConcernedPerson || "",
      drawingApprovedDate: o.drawingApprovedDate
        ? new Date(o.drawingApprovedDate).toISOString().split("T")[0]
        : "",
      drawingStatus: o.drawingStatus || "Pending",
      drawingRemarks: o.drawingRemarks || "",
      status: o.status || "pending",
    });
    setAssignedUserIds(o.assignedUserIds || []);
    setConcernedPeople(o.concernedPeople || []);
    if (Array.isArray(o.lineItems) && o.lineItems.length > 0) {
      setLineItems(o.lineItems);
    } else {
      const amount = Number(o.total || 0);
      setLineItems([
        {
          id: "1",
          itemNo: "Default Item",
          qty: 1,
          amount,
          gstPercent: 18,
          unitTotal: amount * 1.18,
          totalAmount: amount * 1.18,
        },
      ]);
    }
    setSendWaNotif(true);
    setSendEmailNotif(true);
    setErrors({});
    setIsFormOpen(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = orderSchema.safeParse(formValues);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        errs[String(issue.path[0])] = issue.message;
      });
      setErrors(errs);
      return;
    }

    let mappedDrawingStatus = "PENDING";
    const ds = (formValues.drawingStatus || "").toUpperCase();
    if (
      ds === "IN PROCESS" ||
      ds === "IN_PROCESS" ||
      ds === "IN PROGRESS" ||
      ds === "IN_PROGRESS"
    ) {
      mappedDrawingStatus = "IN_PROGRESS";
    } else if (ds === "APPROVED") {
      mappedDrawingStatus = "APPROVED";
    } else if (ds === "REJECTED") {
      mappedDrawingStatus = "REJECTED";
    }

    const payload = {
      companyId: formValues.companyId,
      dveplCode: formValues.companyCode,
      status: (formValues.status || "PENDING").toUpperCase().replace("-", "_"),
      orderTakenById: formValues.orderTakenById || null,
      assignedToIds: assignedUserIds,
      partyName: formValues.customerName,
      caNo: formValues.caNo || null,
      contactDetails: formValues.contact || null,
      orderConfirmDate: formValues.orderTakenDate || null,
      deliveryMonthTarget: formValues.deliveryTarget || null,
      poDate: formValues.poDate || null,
      concernedPersons: concernedPeople,
      drawingConcernedPerson: formValues.drawingConcernedPerson || null,
      drawingApprovedDate: formValues.drawingApprovedDate || null,
      drawingStatus: mappedDrawingStatus,
      drawingRemarks: formValues.drawingRemarks || null,
      sendNotification: sendWaNotif || sendEmailNotif,
      notifyWhatsApp: sendWaNotif,
      notifyEmail: sendEmailNotif,
      remarks: "",
      items: lineItems.map((item, idx) => ({
        itemCode: item.itemNo || `ITEM-${idx + 1}`,
        description: item.itemNo || "No description",
        unit: "Nos",
        quantity: Number(item.qty || 0),
        rate: Number(item.amount || 0),
        gstPercentage: Number(item.gstPercent || 0),
        remarks: "",
      })),
    };

    setIsSubmitting(true);
    try {
      if (editingOrder) {
        await apiClient.patch(`/order/update/${editingOrder.id}`, payload);
      } else {
        await apiClient.post("/order/create", payload);
      }
      await loadOrders();
      setIsFormOpen(false);
      toast.success(
        `Order ${editingOrder ? "updated" : "created"} successfully.`,
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to save order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (order: SalesOrder) => {
    if (!window.confirm("Delete this order?")) return;
    setIsLoading(true);
    try {
      await apiClient.delete(`/order/delete/${order.id}`);
      await loadOrders();
      toast.success("Order deleted.");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to delete order.");
    } finally {
      setIsLoading(false);
    }
  };

  // Full customizable columns list for Generic Table
  const tableColumns = useMemo<ColumnDef<SalesOrder>[]>(() => {
    const allDefs: Record<string, ColumnDef<SalesOrder>> = {
      companyCode: {
        accessorKey: "companyCode",
        header: sortableHeader("DVEPL CODE"),
        cell: ({ row }) => {
          const item = row.original as any;
          return (
            <span className="font-semibold text-foreground">
              {item.companyCode || item.orderNo}
            </span>
          );
        },
      },
      orderTakenBy: {
        accessorKey: "orderTakenById",
        header: "ORDER TAKEN BY",
        cell: ({ row }) => {
          const item = row.original as any;
          const u = users.find((usr) => usr.userId === item.orderTakenById);
          return u?.name || item.orderTakenBy || "—";
        },
      },
      assignedTo: {
        accessorKey: "assignedUserIds",
        header: "ASSIGNED TO",
        cell: ({ row }) => {
          const item = row.original as any;
          const ids: string[] = item.assignedUserIds || [];
          if (ids.length === 0) return "—";
          const names = ids
            .map(
              (id) =>
                users.find((u) => u.userId === id || u.id === id)?.name || id,
            )
            .join(", ");
          return (
            <span className="truncate max-w-[150px] inline-block" title={names}>
              {names}
            </span>
          );
        },
      },
      customerName: {
        accessorKey: "customerName",
        header: "PARTY NAME",
        cell: ({ row }) => {
          const item = row.original as any;
          return item.customerName || item.customer?.name || "—";
        },
      },
      caNo: {
        accessorKey: "caNo",
        header: "CA NO",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      concernedPeople: {
        accessorKey: "concernedPeople",
        header: "CONCERNED PERSONS",
        cell: ({ getValue }) => {
          const arr = getValue() as string[];
          return Array.isArray(arr) && arr.length > 0 ? arr.join(", ") : "—";
        },
      },
      contact: {
        accessorKey: "contact",
        header: "CONTACT",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      orderTakenDate: {
        accessorKey: "orderTakenDate",
        header: "CONFIRM DATE",
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return val ? new Date(val).toLocaleDateString("en-IN") : "—";
        },
      },
      deliveryTarget: {
        accessorKey: "deliveryTarget",
        header: "DELIVERY TARGET",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      poDate: {
        accessorKey: "poDate",
        header: "PO DATE",
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return val ? new Date(val).toLocaleDateString("en-IN") : "—";
        },
      },
      drawingConcernedPerson: {
        accessorKey: "drawingConcernedPerson",
        header: "DRAWING PERSON",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      drawingApprovedDate: {
        accessorKey: "drawingApprovedDate",
        header: "DRAWING DATE",
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return val ? new Date(val).toLocaleDateString("en-IN") : "—";
        },
      },
      drawingStatus: {
        accessorKey: "drawingStatus",
        header: "DRAWING STATUS",
        cell: ({ getValue }) => {
          const val = (getValue() as string) || "Pending";
          const badge: Record<string, string> = {
            Approved:
              "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
            Rejected: "bg-rose-500/15 text-rose-500 border-rose-500/20",
            "In Process": "bg-amber-500/15 text-amber-500 border-amber-500/20",
            Pending: "bg-slate-500/15 text-slate-500 border-slate-500/20",
          };
          return (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge[val] || ""}`}
            >
              {val}
            </span>
          );
        },
      },
      drawingRemarks: {
        accessorKey: "drawingRemarks",
        header: "DRAWING REMARKS",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      itemCount: {
        accessorKey: "lineItems",
        header: "ITEMS",
        cell: ({ row }) => {
          const item = row.original as any;
          const items = item.lineItems || [];
          return (
            <span className="font-semibold">{items.length || 1} item(s)</span>
          );
        },
      },
      total: {
        accessorKey: "total",
        header: "TOTAL AMT (₹)",
        cell: ({ row }) => {
          const item = row.original as any;
          // FIX: fall back to `grandTotal` (the actual backend field)
          // in addition to `total` / `totalAmount`.
          const val = Number(item.total ?? item.grandTotal ?? item.totalAmount ?? 0);
          return (
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              ₹{val.toLocaleString("en-IN")}
            </span>
          );
        },
      },
      status: {
        accessorKey: "status",
        header: "STATUS",
        cell: ({ getValue }) => {
          const st = String(getValue() || "pending").toLowerCase();
          const badges: Record<string, string> = {
            pending: "bg-amber-500/15 text-amber-500 border-amber-500/20",
            "in-progress": "bg-blue-500/15 text-blue-500 border-blue-500/20",
            completed:
              "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
            "on-hold": "bg-rose-500/15 text-rose-500 border-rose-500/20",
          };
          return (
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${badges[st] || "bg-muted text-muted-foreground"}`}
            >
              {st}
            </span>
          );
        },
      },
    };

    return ALL_COLUMN_KEYS.filter((col) => visibleColumns[col.id]).map(
      (col) => allDefs[col.id],
    );
  }, [visibleColumns, users]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage client orders, multi-item line pricing, and assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsBulkModalOpen(true)}
            className="gap-2"
          >
            <Upload className="size-4" /> Bulk Upload
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" /> Add Order
          </Button>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-emerald-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-emerald-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Revenue
            </p>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            ₹{revenueTotal.toLocaleString("en-IN")}
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            DVEPL Gross Value
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-blue-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-blue-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Orders
            </p>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <ShoppingCart className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {orders.length}
          </p>
          <div className="mt-2 text-xs font-medium text-amber-500 flex items-center gap-1">
            <Clock className="size-3" /> {pendingCount} pending confirmation
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-amber-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-amber-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              In Progress
            </p>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
              <Clock className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {inProgressCount}
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            Active manufacturing / engineering
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-emerald-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-emerald-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Completed Orders
            </p>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {completedCount}
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            Dispatched & cleared
          </div>
        </div>
      </div>

      {/* Toolbar Filters & Column Customizer */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border rounded-xl p-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] border border-input rounded-md px-3 bg-background focus-within:ring-1 focus-within:ring-primary">
          <Search className="size-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, codes, party name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-none shadow-none focus-visible:ring-0 px-0"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5 h-8" />
              }
            >
              <SlidersHorizontal className="size-3.5" /> Fields
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs">Show / Hide Columns</span>
                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    className="text-primary hover:underline font-semibold"
                    onClick={() => setAllColumns(true)}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className="text-muted-foreground hover:underline font-semibold"
                    onClick={() => setAllColumns(false)}
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {ALL_COLUMN_KEYS.map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={visibleColumns[col.id]}
                      onCheckedChange={() => toggleColumn(col.id)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-muted-foreground">STATUS:</span>
            <Select
              value={filterStatus}
              onValueChange={(val) => setFilterStatus(val ?? "")}
            >
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="All Orders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-muted-foreground">SORT:</span>
            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val ?? "date-newest")}
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-newest">Date Newest</SelectItem>
                <SelectItem value="date-oldest">Date Oldest</SelectItem>
                <SelectItem value="customer-asc">Customer A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => void loadOrders()}
            title="Refresh"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <GenericTable
        columns={tableColumns}
        data={processedOrders}
        onView={setViewingOrder}
        onEdit={openEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        showColumnVisibility={false}
      />

      {/* Add / Edit Order Modal - matches provided UI mockup */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen} modal={false}>
        <DialogContent
          showCloseButton={false}
          className="p-0 flex flex-col gap-0 shadow-2xl w-[95vw] sm:w-full sm:max-w-2xl max-h-[90vh] rounded-xl overflow-hidden"
        >
          <DialogTitle className="sr-only">
            {editingOrder ? "Edit Order" : "Add New Order"}
          </DialogTitle>
          <div className="flex items-center justify-between border-b p-5 shrink-0">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              {editingOrder ? "Edit Order" : "Add New Order"}
            </h2>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <form
            onSubmit={submitForm}
            className="flex-1 flex flex-col overflow-hidden bg-background"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-7">
              {/* Assignment */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-emerald-600/30 pb-1.5">
                  <Users className="size-3.5 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Assignment
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Company *
                    </Label>
                    <Select
                      value={formValues.companyId}
                      onValueChange={(val) =>
                        setFormValues({ ...formValues, companyId: val })
                      }
                    >
                      <SelectTrigger className="h-10 bg-muted/40">
                        <SelectValue placeholder="Select Company..." />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.companyId && (
                      <p className="text-xs text-destructive mt-0.5">
                        {errors.companyId}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      DVEPL Code *
                    </Label>
                    <Input
                      value={formValues.companyCode}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          companyCode: e.target.value,
                        })
                      }
                      placeholder="DVEPL-2026-001"
                      className="h-10 bg-muted/40"
                    />
                    {errors.companyCode && (
                      <p className="text-xs text-destructive mt-0.5">
                        {errors.companyCode}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Status
                    </Label>
                    <Select
                      value={formValues.status}
                      onValueChange={(val) =>
                        setFormValues({ ...formValues, status: val })
                      }
                    >
                      <SelectTrigger className="h-10 bg-muted/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Order Taken By
                    </Label>
                    <Select
                      value={formValues.orderTakenById}
                      onValueChange={(val) =>
                        setFormValues({ ...formValues, orderTakenById: val })
                      }
                    >
                      <SelectTrigger className="h-10 bg-muted/40">
                        <SelectValue placeholder="— Select user —" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter((u) => u.userId)
                          .map((u) => (
                            <SelectItem key={u.id} value={u.userId!}>
                              {u.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Assigned To (Multi-Select)
                    </Label>
                    <Popover>
                      <PopoverTrigger
                        render={
                          <button
                            type="button"
                            className="h-10 w-full bg-muted/40 border border-input rounded-md px-3 flex items-center justify-between text-sm text-left"
                          />
                        }
                      >
                        <span className="truncate">{assignedUserLabel}</span>
                        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="w-64 p-2 space-y-1 max-h-64 overflow-y-auto"
                      >
                        {users
                          .filter((u) => u.userId)
                          .map((u) => (
                            <label
                              key={u.id}
                              className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:bg-muted/50 p-1.5 rounded"
                            >
                              <Checkbox
                                checked={assignedUserIds.includes(u.userId!)}
                                onCheckedChange={() =>
                                  toggleAssignedUser(u.userId!)
                                }
                              />
                              <span>{u.name}</span>
                            </label>
                          ))}
                        {users.filter((u) => u.userId).length === 0 && (
                          <p className="text-xs text-muted-foreground p-1.5">
                            No users found.
                          </p>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </section>

              {/* Order Information */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-emerald-600/30 pb-1.5">
                  <Info className="size-3.5 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Order Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Party Name
                    </Label>
                    <Input
                      value={formValues.customerName}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          customerName: e.target.value,
                        })
                      }
                      placeholder="e.g. Havells India Ltd"
                      className="h-10 bg-muted/40"
                    />
                    {errors.customerName && (
                      <p className="text-xs text-destructive mt-0.5">
                        {errors.customerName}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      CA No
                    </Label>
                    <Input
                      value={formValues.caNo}
                      onChange={(e) =>
                        setFormValues({ ...formValues, caNo: e.target.value })
                      }
                      placeholder="CA-88902"
                      className="h-10 bg-muted/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Contact Details
                    </Label>
                    <Input
                      value={formValues.contact}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          contact: e.target.value,
                        })
                      }
                      placeholder="Email or phone"
                      className="h-10 bg-muted/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Order Confirm Date
                    </Label>
                    <Input
                      type="date"
                      value={formValues.orderTakenDate}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          orderTakenDate: e.target.value,
                        })
                      }
                      className="h-10 bg-muted/40 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Delivery Month Target
                    </Label>
                    <Input
                      placeholder="e.g. June 2026"
                      value={formValues.deliveryTarget}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          deliveryTarget: e.target.value,
                        })
                      }
                      className="h-10 bg-muted/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      PO Date
                    </Label>
                    <Input
                      type="date"
                      value={formValues.poDate}
                      onChange={(e) =>
                        setFormValues({ ...formValues, poDate: e.target.value })
                      }
                      className="h-10 bg-muted/40 text-sm"
                    />
                  </div>
                </div>

                {/* Concerned Persons tag input */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Concerned Persons (type + Enter to add multiple)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type name and press Add..."
                      value={cpInput}
                      onChange={(e) => setCpInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCP();
                        }
                      }}
                      className="h-10 bg-muted/40 text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handleAddCP}
                      variant="secondary"
                      size="sm"
                      className="h-10 px-3"
                    >
                      + Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {concernedPeople.map((cp, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors duration-150"
                      >
                        {cp}
                        <X
                          className="size-3 cursor-pointer text-primary hover:text-destructive"
                          onClick={() => handleRemoveCP(idx)}
                        />
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              {/* Drawing */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-emerald-600/30 pb-1.5">
                  <FileText className="size-3.5 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Drawing
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Drawing Concerned Person
                    </Label>
                    <Input
                      value={formValues.drawingConcernedPerson}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          drawingConcernedPerson: e.target.value,
                        })
                      }
                      placeholder="Lead Engineer"
                      className="h-10 bg-muted/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Drawing Approved Date
                    </Label>
                    <Input
                      type="date"
                      value={formValues.drawingApprovedDate}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          drawingApprovedDate: e.target.value,
                        })
                      }
                      className="h-10 bg-muted/40 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Drawing Status
                    </Label>
                    <Select
                      value={formValues.drawingStatus}
                      onValueChange={(val) =>
                        setFormValues({ ...formValues, drawingStatus: val })
                      }
                    >
                      <SelectTrigger className="h-10 bg-muted/40">
                        <SelectValue placeholder="— Select —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Process">In Process</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Drawing Remarks
                    </Label>
                    <Input
                      value={formValues.drawingRemarks}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          drawingRemarks: e.target.value,
                        })
                      }
                      placeholder="Revisions or sign-off notes"
                      className="h-10 bg-muted/40"
                    />
                  </div>
                </div>
              </section>

              {/* Item & Pricing */}
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-600/30 pb-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                      Item & Pricing
                    </h3>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={addLineItemRow}
                    className="gap-1 h-7 text-xs font-semibold text-primary hover:text-primary"
                  >
                    <Plus className="size-3.5" /> Add Row
                  </Button>
                </div>

                <div className="border border-border rounded-lg overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 text-muted-foreground font-bold uppercase border-b">
                      <tr>
                        <th className="p-2.5 text-left w-28">Item No *</th>
                        <th className="p-2.5 text-right w-16">Quantity</th>
                        <th className="p-2.5 text-right w-28">Amount (₹)</th>
                        <th className="p-2.5 text-right w-20">GST (%)</th>
                        <th className="p-2.5 text-right w-28">Total (₹)</th>
                        <th className="p-2.5 text-right w-32">
                          Total Amount (₹)
                        </th>
                        <th className="p-2.5 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {lineItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-muted/30 transition-colors duration-150"
                        >
                          <td className="p-1">
                            <Input
                              value={item.itemNo}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  "itemNo",
                                  e.target.value,
                                )
                              }
                              placeholder="Item No"
                              className="h-8 text-xs bg-transparent border-border/60 focus-visible:border-primary"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              value={item.qty}
                              onChange={(e) =>
                                updateLineItem(item.id, "qty", e.target.value)
                              }
                              className="h-8 text-xs text-right bg-transparent border-border/60 focus-visible:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              value={item.amount === 0 ? "" : item.amount}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  "amount",
                                  e.target.value,
                                )
                              }
                              placeholder="0"
                              className="h-8 text-xs text-right bg-transparent border-border/60 focus-visible:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              value={item.gstPercent}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  "gstPercent",
                                  e.target.value,
                                )
                              }
                              className="h-8 text-xs text-right bg-transparent border-border/60 focus-visible:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="p-2.5 text-right font-semibold text-foreground">
                            ₹
                            {item.unitTotal.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            ₹
                            {item.totalAmount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-1 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteLineItemRow(item.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Total (₹) auto = Amount + GST · Total Amount (₹) auto = Total
                  × Qty
                </p>

                <div className="bg-muted/30 rounded-lg border border-border p-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground">
                      ₹{totals.subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total GST Value</span>
                    <span className="font-semibold text-foreground">
                      ₹{totals.gstTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-primary pt-1 border-t border-border">
                    <span>Grand Total Payable</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ₹{totals.grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="border-t p-4 px-6 flex flex-wrap items-center justify-between gap-3 bg-background shrink-0">
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <label
                  className={`flex items-center gap-1.5 cursor-pointer select-none rounded-full border px-2.5 py-1 transition-colors ${sendWaNotif ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600" : "border-border text-muted-foreground"}`}
                >
                  <Checkbox
                    checked={sendWaNotif}
                    onCheckedChange={(val) => setSendWaNotif(Boolean(val))}
                    className="size-3.5"
                  />
                  <MessageSquare className="size-3.5" /> WhatsApp
                </label>
                <label
                  className={`flex items-center gap-1.5 cursor-pointer select-none rounded-full border px-2.5 py-1 transition-colors ${sendEmailNotif ? "bg-blue-500/10 border-blue-500/40 text-blue-600" : "border-border text-muted-foreground"}`}
                >
                  <Checkbox
                    checked={sendEmailNotif}
                    onCheckedChange={(val) => setSendEmailNotif(Boolean(val))}
                    className="size-3.5"
                  />
                  <Mail className="size-3.5" /> Email
                </label>
                <span className="text-muted-foreground font-medium">
                  Notify assigned user on save
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 text-xs font-semibold px-4 bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin size-4" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save Order
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <Sheet open={isBulkModalOpen} onOpenChange={(open) => {
        setIsBulkModalOpen(open);
        if (!open) {
          setSelectedFile(null);
          setPreviewResult(null);
        }
      }}>
        <SheetContent side="right" className="max-w-md p-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Bulk Upload Orders (.xlsx / .xls)</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-6">
            <p className="text-xs text-muted-foreground">
              Upload an Excel file containing DVEPL code, party name,
              item details, qty, rate, and GST.
            </p>
            
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                1. DOWNLOAD REFERENCE TEMPLATE
              </Label>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="w-full gap-2">
                <FileText className="size-4 text-primary" /> Download Sample Excel Template
              </Button>
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
              <Label className="text-xs font-semibold text-muted-foreground">
                2. SELECT DATA FILE
              </Label>
              <Input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="h-10 text-xs" />
            </div>

            {previewResult && (
              <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                <h4 className="text-xs font-bold text-foreground">Validation Summary</h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="border rounded p-2">
                    <p className="font-semibold text-muted-foreground">Total</p>
                    <p className="text-base font-bold text-foreground">{previewResult.totalRows}</p>
                  </div>
                  <div className="border rounded p-2 bg-emerald-500/5 border-emerald-500/10">
                    <p className="font-semibold text-emerald-600">Valid</p>
                    <p className="text-base font-bold text-emerald-600">{previewResult.validRows}</p>
                  </div>
                  <div className="border rounded p-2 bg-rose-500/5 border-rose-500/10">
                    <p className="font-semibold text-rose-600">Errors</p>
                    <p className="text-base font-bold text-rose-600">{previewResult.invalidRows}</p>
                  </div>
                </div>

                {previewResult.invalidRows > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {previewResult.rows
                      .filter((r: any) => !r.isValid)
                      .map((r: any, idx: number) => (
                        <div key={idx} className="text-[11px] text-rose-500 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                          <span className="font-semibold">{r.dveplCode}</span>: {r.errors.join(", ")}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            <Button 
              className="w-full gap-2" 
              onClick={handleUploadAndProcess}
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Upload className="size-4" /> Upload & Process
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* View Details Drawer */}
      <Sheet
        open={Boolean(viewingOrder)}
        onOpenChange={(open) => !open && setViewingOrder(null)}
      >
        <SheetContent side="right" className="max-w-lg p-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Order Summary</SheetTitle>
          </SheetHeader>

          {viewingOrder && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-lg font-bold text-foreground">
                  {(viewingOrder as any).companyCode || viewingOrder.orderNo}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-primary/10 text-primary uppercase">
                  {viewingOrder.status || "pending"}
                </span>
              </div>

              <section className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-muted-foreground">
                  Party & Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Party Name:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {(viewingOrder as any).customerName || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CA No:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {(viewingOrder as any).caNo || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Delivery Target:
                    </span>{" "}
                    <p className="font-semibold text-foreground">
                      {(viewingOrder as any).deliveryTarget || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contact:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {(viewingOrder as any).contact || "—"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-2 border-t pt-3">
                <h4 className="text-xs font-bold uppercase text-muted-foreground">
                  Line Items Summary
                </h4>
                <div className="text-sm font-bold text-emerald-600">
                  Total Order Value: ₹
                  {Number(
                    (viewingOrder as any).total ??
                      (viewingOrder as any).grandTotal ??
                      (viewingOrder as any).totalAmount ??
                      0,
                  ).toLocaleString("en-IN")}
                </div>
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default OrdersPage;