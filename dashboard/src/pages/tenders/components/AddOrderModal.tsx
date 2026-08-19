import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Loader2, FilePlus2, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { apiClient } from "@/services/axios";
import { toast } from "react-hot-toast";

import { ProjectDocumentUploadPanel } from "./ProjectDocumentUploadPanel";
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
    attachments?: SalesOrderAttachment[];
  } | null;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On Hold" },
];

const DRAWING_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "IN_PROGRESS", label: "In Progress" },
];

const EMPTY_ITEM: OrderItemForm = {
  itemCode: "",
  description: "",
  unit: "Nos",
  quantity: "1",
  rate: "0",
  gstPercentage: "18",
};

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-muted-foreground">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ============================================================
// MODAL
// ============================================================

export function AddOrderModal({
  open,
  onOpenChange,
  companyId,
  orderTakenById,
  editingOrder,
  onSuccess,
}: AddOrderModalProps) {
  const [status, setStatus] = useState("PENDING");
  const [dveplCode, setDveplCode] = useState("");
  const [partyName, setPartyName] = useState("");
  const [caNo, setCaNo] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [workName, setWorkName] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [division, setDivision] = useState("");
  const [subDivision, setSubDivision] = useState("");
  const [location, setLocation] = useState("");
  const [tenderId, setTenderId] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [orderConfirmDate, setOrderConfirmDate] = useState("");
  const [deliveryMonthTarget, setDeliveryMonthTarget] = useState("");
  const [poDate, setPoDate] = useState("");
  const [drawingConcernedPerson, setDrawingConcernedPerson] = useState("");
  const [drawingApprovedDate, setDrawingApprovedDate] = useState("");
  const [drawingStatus, setDrawingStatus] = useState("");
  const [drawingRemarks, setDrawingRemarks] = useState("");
  const [inspectionField, setInspectionField] = useState("");
  const [remarks, setRemarks] = useState("");
  const [sendNotification, setSendNotification] = useState(true);

  const [items, setItems] = useState<OrderItemForm[]>([{ ...EMPTY_ITEM }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingDocuments, setPendingDocuments] = useState<
    Array<{ category: string; file: File }>
  >([]);

  const resetForm = () => {
    setStatus("PENDING");
    setDveplCode("");
    setPartyName("");
    setCaNo("");
    setContactPerson("");
    setMobile("");
    setEmail("");
    setWorkName("");
    setDepartment("");
    setSection("");
    setDivision("");
    setSubDivision("");
    setLocation("");
    setTenderId("");
    setReferenceCode("");
    setOrderConfirmDate("");
    setDeliveryMonthTarget("");
    setPoDate("");
    setDrawingConcernedPerson("");
    setDrawingApprovedDate("");
    setDrawingStatus("");
    setDrawingRemarks("");
    setInspectionField("");
    setRemarks("");
    setSendNotification(true);
    setItems([{ ...EMPTY_ITEM }]);
    setPendingDocuments([]);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && !isSubmitting) {
      resetForm();
    }
    onOpenChange(next);
  };

  // Prefill the form when editing an existing order
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!editingOrder?.id) return;
      try {
        const res = await apiClient.get(`/order/read/${editingOrder.id}`);
        if (res.data?.success && res.data?.data) {
          const order = res.data.data;

          setDveplCode(order.dveplCode || "");
          setPartyName(order.partyName || "");
          setCaNo(order.caNo || "");

          const parts = (order.contactDetails || "").split(" | ");
          setContactPerson(parts[0] || "");
          setMobile(parts[1] || "");
          setEmail(parts[2] || "");

          setOrderConfirmDate(
            order.orderConfirmDate
              ? new Date(order.orderConfirmDate).toISOString().slice(0, 10)
              : ""
          );
          setDeliveryMonthTarget(order.deliveryMonthTarget || "");
          setPoDate(
            order.poDate ? new Date(order.poDate).toISOString().slice(0, 10) : ""
          );
          setDrawingConcernedPerson(order.drawingConcernedPerson || "");
          setDrawingApprovedDate(
            order.drawingApprovedDate
              ? new Date(order.drawingApprovedDate).toISOString().slice(0, 10)
              : ""
          );
          setDrawingStatus(order.drawingStatus || "");
          setDrawingRemarks(order.drawingRemarks || "");
          setInspectionField(order.inspectionField || "");
          setRemarks(order.remarks || "");
          setSendNotification(order.sendNotification ?? true);

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

    if (open && editingOrder) {
      setDveplCode(editingOrder.dveplCode || "");
      setPartyName(editingOrder.partyName || (editingOrder as any).firm_name || "");
      setCaNo(editingOrder.caNo || (editingOrder as any).tender_no || "");
      setContactPerson(editingOrder.name || "");
      setMobile(editingOrder.mobile || "");
      setEmail(editingOrder.email_id || "");
      setWorkName(editingOrder.name_of_work || "");
      setDepartment(editingOrder.department_name || "");
      setSection(editingOrder.section_name || "");
      setDivision(editingOrder.division_name || "");
      setSubDivision(editingOrder.subdivision || "");
      setLocation(editingOrder.state_name || "");
      setTenderId(editingOrder.tenderID || "");
      setReferenceCode(editingOrder.reference_code || "");
      setStatus(editingOrder.status || (editingOrder as any).remark || "PENDING");

      void fetchOrderDetails();
    } else {
      resetForm();
    }
  }, [open, editingOrder]);

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

  const buildRemarks = () => {
    if (remarks.trim()) return remarks.trim();

    const lines: string[] = [];
    if (workName.trim()) lines.push(`Work: ${workName.trim()}`);
    if (department.trim()) lines.push(`Department: ${department.trim()}`);
    if (section.trim()) lines.push(`Section: ${section.trim()}`);
    if (division.trim()) lines.push(`Division: ${division.trim()}`);
    if (subDivision.trim())
      lines.push(`Sub Division: ${subDivision.trim()}`);
    if (location.trim()) lines.push(`Location: ${location.trim()}`);
    if (tenderId.trim()) lines.push(`Tender ID: ${tenderId.trim()}`);
    if (referenceCode.trim())
      lines.push(`Reference Code: ${referenceCode.trim()}`);
    return lines.join("\n");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingOrder && !companyId) {
      toast.error("Company context is missing. Cannot create order.");
      return;
    }

    const contactParts = [contactPerson, mobile, email]
      .map((v) => v.trim())
      .filter(Boolean);
    const contactDetails =
      contactParts.length > 0 ? contactParts.join(" | ") : null;

    const payload = {
      ...(editingOrder ? {} : { companyId, orderTakenById: orderTakenById || null }),
      dveplCode: dveplCode.trim(),
      status,
      partyName: partyName.trim(),
      caNo: caNo.trim() || null,
      contactDetails,
      orderConfirmDate: orderConfirmDate || null,
      deliveryMonthTarget: deliveryMonthTarget.trim() || null,
      poDate: poDate || null,
      drawingConcernedPerson: drawingConcernedPerson.trim() || null,
      drawingApprovedDate: drawingApprovedDate || null,
      drawingStatus: drawingStatus || null,
      drawingRemarks: drawingRemarks.trim() || null,
      inspectionField: inspectionField.trim() || null,
      sendNotification,
      remarks: buildRemarks() || null,
      items: items.map((item) => ({
        itemCode: item.itemCode.trim(),
        description: item.description.trim(),
        unit: item.unit.trim(),
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
        gstPercentage: Number(item.gstPercentage) || 0,
        remarks: null,
      })),
    };

    if (!editingOrder && !payload.dveplCode) {
      toast.error("DVEPL Code is required.");
      return;
    }
    if (!payload.partyName) {
      toast.error("Party name is required.");
      return;
    }
    if (
      payload.items.some(
        (item) =>
          !item.itemCode || !item.description || !item.unit || item.quantity <= 0
      )
    ) {
      toast.error(
        "Each item needs a valid item code, description, unit, and positive quantity."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = editingOrder
        ? await apiClient.patch(`/order/update/${editingOrder.id}`, payload)
        : await apiClient.post("/order/create", payload);
      if (response.data?.success) {
        const orderId = editingOrder
          ? editingOrder.id
          : response.data?.data?.id;

        if (!editingOrder && orderId && pendingDocuments.length > 0) {
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
            }),
          );
        }

        toast.success(editingOrder ? "Order updated successfully!" : "Order created successfully!");
        resetForm();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(
          response.data?.message ?? (editingOrder ? "Unable to update order." : "Unable to create order.")
        );
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ??
          (editingOrder ? "Failed to update order. Please try again." : "Failed to create order. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = useMemo(
    () =>
      (Boolean(editingOrder) || Boolean(companyId)) &&
      Boolean(dveplCode.trim()) &&
      Boolean(partyName.trim()) &&
      items.length > 0,
    [editingOrder, companyId, dveplCode, partyName, items]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="
          w-[calc(100%-2rem)]
          sm:max-w-3xl
          lg:max-w-5xl
          max-h-[90vh]
          overflow-hidden
          p-0
          gap-0
          rounded-2xl
          border
          border-border/80
          bg-background/98
          backdrop-blur-md
          shadow-2xl
        "
      >
        <DialogHeader className="px-6 py-5 border-b bg-muted/30">
          <div className="flex items-center justify-between gap-4 pr-8">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {editingOrder ? "Edit Order" : "Add Order Manually"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs font-medium text-muted-foreground">
                {editingOrder
                  ? `Update the sales order ${editingOrder.dveplCode || ""} and its details.`
                  : "Create a new sales order without syncing from the portal."}
              </DialogDescription>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/15">
              {editingOrder ? <PenLine className="size-5" /> : <FilePlus2 className="size-5" />}
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto max-h-[calc(90vh-150px)] px-6 py-6 scrollbar-thin"
        >
          <div className="space-y-7">
            {/* ==================================================
                ORDER IDENTIFICATION
                ================================================== */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-4.5 w-1 rounded-full bg-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Order Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="DVEPL Code" required>
                  <Input
                    value={dveplCode}
                    onChange={(e) => setDveplCode(e.target.value)}
                    placeholder="e.g. SO-2026-0001"
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="Status" required>
                  <Select
                    value={status}
                    onValueChange={(val) => setStatus(val ?? "PENDING")}
                  >
                    <SelectTrigger className="h-9 rounded-xl border-muted-foreground/15 bg-background font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Party / Firm Name" required>
                  <Input
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    placeholder="e.g. Vijay Kumar Gupta and Co"
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="CA / Tender Number">
                  <Input
                    value={caNo}
                    onChange={(e) => setCaNo(e.target.value)}
                    placeholder="e.g. CWEAFJ-48/2025"
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="Reference Code">
                  <Input
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    placeholder="e.g. REF-20260302-08197"
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="Tender ID">
                  <Input
                    value={tenderId}
                    onChange={(e) => setTenderId(e.target.value)}
                    placeholder="e.g. 2026_MES_751133_1"
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="Name of Work">
                  <Textarea
                    value={workName}
                    onChange={(e) => setWorkName(e.target.value)}
                    placeholder="Description of the work / project"
                    className="text-xs"
                    rows={2}
                  />
                </Field>

                <Field label="Inspection Field">
                  <Input
                    value={inspectionField}
                    onChange={(e) => setInspectionField(e.target.value)}
                    placeholder="e.g. Site / Factory"
                    className="h-9 text-xs"
                  />
                </Field>
              </div>
            </section>

            {/* ==================================================
                CONTACT
                ================================================== */}
            <section className="border-t pt-7">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-4.5 w-1 rounded-full bg-blue-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Contact Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Contact Person">
                  <Input
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Sh Puneet Gupta"
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="Mobile">
                  <Input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 7889873300"
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. contact@firm.com"
                    className="h-9 text-xs"
                  />
                </Field>
              </div>
            </section>

            {/* ==================================================
                JURISDICTION
                ================================================== */}
            <section className="border-t pt-7">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-4.5 w-1 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Jurisdiction
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Department">
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. MES"
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="Section">
                  <Input
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. CE (AF) Udhampur"
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="Division">
                  <Input
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    placeholder="e.g. CWE (AF) Jammu"
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="Sub Division">
                  <Input
                    value={subDivision}
                    onChange={(e) => setSubDivision(e.target.value)}
                    placeholder="e.g. GE AF Udhampur"
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="Location">
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Udhampur, Jammu and Kashmir"
                    className="h-9 text-xs"
                  />
                </Field>
              </div>
            </section>

            {/* ==================================================
                SCHEDULE & DRAWING
                ================================================== */}
            <section className="border-t pt-7">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-4.5 w-1 rounded-full bg-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Schedule & Drawing
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Order Confirm Date">
                  <Input
                    type="date"
                    value={orderConfirmDate}
                    onChange={(e) => setOrderConfirmDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="Delivery Month Target">
                  <Input
                    value={deliveryMonthTarget}
                    onChange={(e) => setDeliveryMonthTarget(e.target.value)}
                    placeholder="e.g. March 2027"
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="PO Date">
                  <Input
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="Drawing Concerned Person">
                  <Input
                    value={drawingConcernedPerson}
                    onChange={(e) => setDrawingConcernedPerson(e.target.value)}
                    placeholder="Name of concerned person"
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="Drawing Approved Date">
                  <Input
                    type="date"
                    value={drawingApprovedDate}
                    onChange={(e) => setDrawingApprovedDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </Field>

                <Field label="Drawing Status">
                  <Select
                    value={drawingStatus}
                    onValueChange={(val) => setDrawingStatus(val ?? "")}
                  >
                    <SelectTrigger className="h-9 rounded-xl border-muted-foreground/15 bg-background font-semibold">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {DRAWING_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Drawing Remarks">
                  <Input
                    value={drawingRemarks}
                    onChange={(e) => setDrawingRemarks(e.target.value)}
                    placeholder="Remarks about drawings"
                    className="h-9 text-xs"
                  />
                </Field>
              </div>
            </section>

            {/* ==================================================
                LINE ITEMS
                ================================================== */}
            <section className="border-t pt-7">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-4.5 w-1 rounded-full bg-violet-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Line Items
                  </h3>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="gap-1 h-8 text-xs font-bold rounded-xl"
                >
                  <Plus className="size-3.5" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-border/80 bg-muted/10 p-4 shadow-3xs"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Item {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="size-7 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5"
                        title="Remove Item"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                      <div className="lg:col-span-2">
                        <Field label="Item Code">
                          <Input
                            value={item.itemCode}
                            onChange={(e) =>
                              updateItem(index, "itemCode", e.target.value)
                            }
                            placeholder="e.g. TR-1001"
                            className="h-9 text-xs"
                          />
                        </Field>
                      </div>

                      <div className="lg:col-span-4">
                        <Field label="Description">
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateItem(index, "description", e.target.value)
                            }
                            placeholder="Item description"
                            className="h-9 text-xs"
                          />
                        </Field>
                      </div>

                      <Field label="Unit">
                        <Input
                          value={item.unit}
                          onChange={(e) =>
                            updateItem(index, "unit", e.target.value)
                          }
                          className="h-9 text-xs"
                        />
                      </Field>

                      <Field label="Qty">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", e.target.value)
                          }
                          className="h-9 text-xs"
                        />
                      </Field>

                      <Field label="Rate">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={item.rate}
                          onChange={(e) =>
                            updateItem(index, "rate", e.target.value)
                          }
                          className="h-9 text-xs"
                        />
                      </Field>

                      <Field label="GST %">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={item.gstPercentage}
                          onChange={(e) =>
                            updateItem(index, "gstPercentage", e.target.value)
                          }
                          className="h-9 text-xs"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ==================================================
                REMARKS & NOTIFICATION
                ================================================== */}
            <section className="border-t pt-7">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-4.5 w-1 rounded-full bg-rose-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Remarks & Notification
                </h3>
              </div>

              <div className="space-y-4">
                <Field label="Remarks (optional)">
                  <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="If left blank, remarks will be auto-built from the form fields above."
                    className="text-xs"
                    rows={3}
                  />
                </Field>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={sendNotification}
                    onCheckedChange={(val) =>
                      setSendNotification(Boolean(val))
                    }
                  />
                  <span className="text-xs font-semibold text-muted-foreground">
                    Send notification on creation
                  </span>
                </label>
              </div>
            </section>

            {/* ==================================================
                PROJECT DOCUMENT UPLOAD
                ================================================== */}
            <section className="border-t pt-7">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-4.5 w-1 rounded-full bg-cyan-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Project Documents
                </h3>
              </div>

              <ProjectDocumentUploadPanel
                attachments={editingOrder?.attachments || []}
                immediate={Boolean(editingOrder)}
                orderId={editingOrder?.id || null}
                disabled={isSubmitting}
                uploading={isSubmitting}
                onPendingChange={setPendingDocuments}
                onUploaded={onSuccess}
              />
              {!editingOrder && pendingDocuments.length > 0 && (
                <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                  {pendingDocuments.length} document
                  {pendingDocuments.length === 1 ? "" : "s"} will be attached
                  after the order is created.
                </p>
              )}
            </section>
          </div>

          {/* ==================================================
              ACTIONS
              ================================================== */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="h-9 rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit || isSubmitting}
              className="h-9 rounded-xl text-xs font-bold gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {editingOrder ? "Saving..." : "Creating..."}
                </>
              ) : (
                <>
                  {editingOrder ? (
                    <PenLine className="size-3.5" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  {editingOrder ? "Save Changes" : "Create Order"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddOrderModal;
