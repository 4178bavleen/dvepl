import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Pencil,
  Eye,
  Users,
  Plus,
  Trash2,
  Printer,
  Save,
  FileText,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Modals
import { CustomerMasterEditModal } from "./components/CustomerMasterEditModal";
import { ManageAccessModal } from "./components/ManageAccessModal";
import { FilePreviewModal } from "./components/FilePreviewModal";
import { DeliveryNoteModal } from "./components/DeliveryNoteModal";

// Types
import {
  PanelItem,
  SharedOrderFile,
  AccountSectionFile,
  CustomerMasterDetails,
  AccountCostingData,
} from "./types";

const DEFAULT_SHARED_FILES: SharedOrderFile[] = [
  {
    id: "shared-1",
    name: "Redesigned about pages.pdf",
    uploader: "Business Owner",
    uploadTime: "31 Aug, 10:49 am",
    location: "stored in this Order's Documents",
    size: "2.4 MB",
    isBlocked: true,
    allowedRoles: ["admin", "accounts"],
  },
  {
    id: "shared-2",
    name: "Redesigned about pages.pdf",
    uploader: "Business Owner",
    uploadTime: "31 Aug, 10:49 am",
    location: "stored in this Order's Documents",
    size: "2.4 MB",
    isBlocked: true,
    allowedRoles: ["admin", "accounts"],
  },
  {
    id: "shared-3",
    name: "Redesigned about pages.pdf",
    uploader: "Business Owner",
    uploadTime: "31 Aug, 10:49 am",
    location: "stored in this Order's Documents",
    size: "2.4 MB",
    isBlocked: true,
    allowedRoles: ["admin", "accounts"],
  },
];

const DEFAULT_CUSTOMER_DETAILS: CustomerMasterDetails = {
  companyName: "gk enterprises",
  contactPerson: "—",
  dveplRefCode: "123456",
  dateOfOrder: "2026-08-31",
  dateOfCommitment: "2026-10-15",
  projectRef: "1234",
  gstNumber: "—",
  billingAddress: "—",
  specialNotes: "—",
};

const DEFAULT_ITEMS: PanelItem[] = [
  {
    id: "item-1",
    panelName: "",
    qty: 1,
    price: 0,
    total: 0,
  },
];

export function AccountsPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const orderCode = id ? (id.startsWith("ORD-") ? id : `ORD-2026-${id.padStart(5, "0")}`) : "ORD-2026-00265";
  const storageKey = `dvepl_accounts_costing_${orderCode}`;

  // State
  const [customerDetails, setCustomerDetails] = useState<CustomerMasterDetails>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customerDetails) return parsed.customerDetails;
      }
    } catch {}
    return DEFAULT_CUSTOMER_DETAILS;
  });

  const [sharedFiles, setSharedFiles] = useState<SharedOrderFile[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sharedFiles) return parsed.sharedFiles;
      }
    } catch {}
    return DEFAULT_SHARED_FILES;
  });

  const [accountFiles, setAccountFiles] = useState<AccountSectionFile[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.accountFiles) return parsed.accountFiles;
      }
    } catch {}
    return [];
  });

  const [items, setItems] = useState<PanelItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items && parsed.items.length > 0) return parsed.items;
      }
    } catch {}
    return DEFAULT_ITEMS;
  });

  const [taxPercent, setTaxPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.taxPercent === "number") return parsed.taxPercent;
      }
    } catch {}
    return 18;
  });

  const [lessAdvance, setLessAdvance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.lessAdvance === "number") return parsed.lessAdvance;
      }
    } catch {}
    return 0;
  });

  const [specialNote, setSpecialNote] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.specialNote === "string") return parsed.specialNote;
      }
    } catch {}
    return "";
  });

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedFileForAccess, setSelectedFileForAccess] = useState<SharedOrderFile | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    name: string;
    uploader?: string;
    uploadTime?: string;
    size?: string;
    fileUrl?: string;
  } | null>(null);
  const [isDeliveryNoteOpen, setIsDeliveryNoteOpen] = useState(false);

  // Calculations
  const calculatedValues = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const taxAmount = (subtotal * (Number(taxPercent) || 0)) / 100;
    const totalAmount = Math.max(0, subtotal + taxAmount - (Number(lessAdvance) || 0));
    return {
      subtotal,
      taxAmount,
      totalAmount,
    };
  }, [items, taxPercent, lessAdvance]);

  // Handlers for Items
  const handleItemChange = (
    id: string,
    field: "panelName" | "qty" | "price",
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "qty" || field === "price") {
          const qty = field === "qty" ? Number(value) || 0 : item.qty;
          const price = field === "price" ? Number(value) || 0 : item.price;
          updated.total = qty * price;
        }
        return updated;
      })
    );
  };

  const handleAddRow = () => {
    const newId = `item-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        id: newId,
        panelName: "",
        qty: 1,
        price: 0,
        total: 0,
      },
    ]);
  };

  const handleDeleteRow = (itemId: string) => {
    if (items.length <= 1) {
      setItems([
        {
          id: `item-${Date.now()}`,
          panelName: "",
          qty: 1,
          price: 0,
          total: 0,
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Handlers for Account Section File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: AccountSectionFile[] = Array.from(files).map((file) => {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
      const now = new Date();
      const timeStr = `${now.getDate()} ${now.toLocaleString("default", { month: "short" })}, ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

      return {
        id: `acc-file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size: `${sizeInMb} MB`,
        uploadTime: timeStr,
        file,
        fileUrl: URL.createObjectURL(file),
      };
    });

    setAccountFiles((prev) => [...prev, ...newFiles]);
    toast.success(`${files.length} file(s) added successfully`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteAccountFile = (fileId: string) => {
    setAccountFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.success("File removed");
  };

  // Save Costing Handler
  const handleSaveCosting = () => {
    const payload: AccountCostingData = {
      orderId: id || "ORD-2026-00265",
      orderCode,
      customerDetails,
      sharedFiles,
      accountFiles,
      items,
      taxPercent,
      lessAdvance,
      specialNote,
      lastSavedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
      toast.success("Costing & account details saved successfully!");
    } catch (e) {
      toast.error("Failed to save costing locally.");
    }
  };

  // Manage Access update handler
  const handleUpdateAccess = (fileId: string, isBlocked: boolean, allowedRoles: string[]) => {
    setSharedFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, isBlocked, allowedRoles } : f))
    );
    toast.success(`Access updated for file.`);
  };

  const costingData: AccountCostingData = {
    orderId: id || "ORD-2026-00265",
    orderCode,
    customerDetails,
    sharedFiles,
    accountFiles,
    items,
    taxPercent,
    lessAdvance,
    specialNote,
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 font-sans">
      {/* Main Page Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Navigation & Header Section */}
        <div>
          {/* Back to Order Link */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-colors mb-2 group cursor-pointer"
          >
            <ChevronLeft className="size-4 group-hover:-translate-x-0.5 transition-transform text-foreground" />
            <span>Back to order</span>
          </button>

          {/* Order Code */}
          <div className="text-sm md:text-base font-bold font-mono tracking-wider text-primary uppercase">
            {orderCode}
          </div>

          {/* Account Section Heading & Subtitle */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mt-0.5">
            Account Section
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 font-normal">
            Costing & quotation sheet — for the customer, separate from internal purchase orders.
          </p>
        </div>

        {/* Card 1: Order Metadata Summary Grid */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-4 gap-x-6">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Company Name</p>
              <p className="text-xs font-semibold text-card-foreground line-clamp-1">
                {customerDetails.companyName || "gk enterprises"}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Contact Person</p>
              <p className="text-xs font-medium text-card-foreground">
                {customerDetails.contactPerson || "—"}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">DVEPL Ref Code</p>
              <p className="text-xs font-mono font-bold text-card-foreground">
                {customerDetails.dveplRefCode || "123456"}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Date of Order</p>
              <p className="text-xs font-medium text-card-foreground">
                {customerDetails.dateOfOrder || "2026-08-31"}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Date of Commitment</p>
              <p className="text-xs font-medium text-card-foreground">
                {customerDetails.dateOfCommitment || "2026-10-15"}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Project Ref</p>
              <p className="text-xs font-mono font-bold text-card-foreground">
                {customerDetails.projectRef || "1234"}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Company Details (Customer Master) */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm md:text-base font-semibold text-card-foreground">
              Company Details (Customer Master)
            </h2>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <Pencil className="size-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">GST Number</p>
              <p className="text-xs font-medium text-card-foreground">
                {customerDetails.gstNumber || "—"}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Billing Address</p>
              <p className="text-xs font-medium text-card-foreground whitespace-pre-line">
                {customerDetails.billingAddress || "—"}
              </p>
            </div>

            <div className="md:col-span-2 pt-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Special Notes (Customer Master)</p>
              <p className="text-xs font-medium text-card-foreground">
                {customerDetails.specialNotes || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Files from New Order / Other Tabs */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Files from New Order / Other Tabs — view only, admin decides who can open each file
          </h3>

          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden shadow-xs">
            {sharedFiles.map((file) => (
              <div
                key={file.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
              >
                {/* Left Side: Icon, Name, Metadata */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <Eye className="size-4 text-primary shrink-0" />
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPreviewFile(file)}
                      className="text-xs sm:text-sm font-semibold text-primary hover:underline text-left cursor-pointer"
                    >
                      {file.name}
                    </button>
                    <span className="text-xs text-muted-foreground font-normal">
                      · uploaded by {file.uploader} · {file.uploadTime} · {file.location}
                    </span>
                  </div>
                </div>

                {/* Right Side: Manage Access Button */}
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedFileForAccess(file)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Users className="size-3.5" />
                    <span>Manage Access {file.isBlocked ? "(Blocked)" : "(Allowed)"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Files Added On This Account Section */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Files Added On This Account Section — view, upload or delete freely
          </h3>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            {accountFiles.length === 0 ? (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  No files added on this sheet yet.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Add More Files</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                  {accountFiles.map((file) => (
                    <div
                      key={file.id}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="size-4 text-primary shrink-0" />
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="text-xs font-semibold text-primary hover:underline truncate"
                        >
                          {file.name}
                        </button>
                        <span className="text-[11px] text-muted-foreground">
                          ({file.size} · {file.uploadTime})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-muted"
                          title="Preview"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAccountFile(file.id)}
                          className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10"
                          title="Delete file"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>Add More Files</span>
                  </button>
                </div>
              </div>
            )}

            {/* Hidden native file picker */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />
          </div>
          <p className="text-[11px] text-muted-foreground/80 mt-1.5">
            Max file size: 50 MB per file.
          </p>
        </div>

        {/* Section 5: Details As per Project (Table) */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Details As per Project
          </h3>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-3 w-12 text-center border-r border-border">#</th>
                    <th className="py-3 px-4 border-r border-border">Panel Name</th>
                    <th className="py-3 px-3 w-28 text-center border-r border-border">Qty</th>
                    <th className="py-3 px-3 w-36 text-center border-r border-border">Price</th>
                    <th className="py-3 px-4 w-36 text-center border-r border-border sm:border-r-0">Total</th>
                    <th className="py-3 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-muted/30 group">
                      {/* # Number */}
                      <td className="py-2.5 px-3 text-center border-r border-border text-xs text-muted-foreground font-medium">
                        {index + 1}
                      </td>

                      {/* Panel Name */}
                      <td className="py-1 px-3 border-r border-border">
                        <input
                          type="text"
                          value={item.panelName}
                          onChange={(e) => handleItemChange(item.id, "panelName", e.target.value)}
                          placeholder="S.No or Name of Panel"
                          className="w-full py-1.5 text-xs text-foreground placeholder:text-muted-foreground bg-transparent border-0 focus:outline-hidden focus:ring-0"
                        />
                      </td>

                      {/* Qty */}
                      <td className="py-1 px-2 border-r border-border">
                        <input
                          type="number"
                          min="0"
                          value={item.qty}
                          onChange={(e) => handleItemChange(item.id, "qty", e.target.value)}
                          className="w-full py-1.5 text-xs text-center text-foreground bg-transparent border-0 focus:outline-hidden focus:ring-0"
                        />
                      </td>

                      {/* Price */}
                      <td className="py-1 px-2 border-r border-border">
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => handleItemChange(item.id, "price", e.target.value)}
                          className="w-full py-1.5 text-xs text-center text-foreground bg-transparent border-0 focus:outline-hidden focus:ring-0 font-mono"
                        />
                      </td>

                      {/* Total */}
                      <td className="py-2.5 px-4 text-center border-r border-border sm:border-r-0 text-xs text-foreground font-mono font-semibold">
                        {Number(item.total).toLocaleString("en-IN")}
                      </td>

                      {/* Action Delete */}
                      <td className="py-1 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(item.id)}
                          className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          title="Remove row"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Row Button */}
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors mt-2 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add row</span>
          </button>
        </div>

        {/* Calculations / Summary Card (Right aligned below Table) */}
        <div className="flex justify-end">
          <div className="w-full sm:w-80 bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            {/* Value (Subtotal) */}
            <div className="flex items-center justify-between border-b border-border">
              <div className="py-2.5 px-4 text-xs font-medium text-muted-foreground border-r border-border flex-1 bg-muted/20">
                Value
              </div>
              <div className="py-2.5 px-4 text-xs font-bold text-card-foreground w-32 text-right font-mono">
                {calculatedValues.subtotal.toLocaleString("en-IN")}
              </div>
            </div>

            {/* Tax % */}
            <div className="flex items-center justify-between border-b border-border">
              <div className="py-2 px-4 text-xs font-medium text-muted-foreground border-r border-border flex-1 flex items-center justify-between bg-muted/20">
                <span>Tax %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value) || 0)}
                  className="w-12 py-0.5 px-1 text-xs text-center border border-input rounded-md bg-background focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>
              <div className="py-2.5 px-4 text-xs font-bold text-card-foreground w-32 text-right font-mono">
                {calculatedValues.taxAmount.toLocaleString("en-IN")}
              </div>
            </div>

            {/* Less Advance */}
            <div className="flex items-center justify-between border-b border-border">
              <div className="py-2 px-4 text-xs font-medium text-muted-foreground border-r border-border flex-1 bg-muted/20">
                Less Advance
              </div>
              <div className="py-2 px-4 text-xs font-bold text-card-foreground w-32 text-right flex items-center justify-end gap-1">
                <span className="text-muted-foreground">+</span>
                <input
                  type="number"
                  min="0"
                  value={lessAdvance}
                  onChange={(e) => setLessAdvance(Number(e.target.value) || 0)}
                  className="w-20 py-0.5 px-1 text-xs text-right border border-input rounded-md bg-background focus:ring-1 focus:ring-primary focus:outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Total Amount */}
            <div className="flex items-center justify-between bg-primary/10">
              <div className="py-3 px-4 text-xs font-bold text-card-foreground border-r border-border flex-1">
                Total Amount
              </div>
              <div className="py-3 px-4 text-sm font-extrabold text-primary w-32 text-right font-mono">
                {calculatedValues.totalAmount.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Special Note */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Special Note (visible on this Account Section)
          </h3>
          <Textarea
            value={specialNote}
            onChange={(e) => setSpecialNote(e.target.value)}
            placeholder="Any special instruction, discount note, or remark for this order's costing..."
            rows={3}
            className="w-full bg-card border border-border rounded-xl p-3 text-xs text-card-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary shadow-xs"
          />
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {/* Delivery Note Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDeliveryNoteOpen(true)}
            className="h-9 px-4 text-xs font-semibold border-sky-500 text-sky-500 hover:bg-sky-500/10 bg-card rounded-xl gap-2 shadow-xs"
          >
            <Printer className="size-4" />
            <span>Delivery Note</span>
          </Button>

          {/* Save Costing Button */}
          <Button
            type="button"
            onClick={handleSaveCosting}
            className="h-9 px-5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2 shadow-xs transition-all"
          >
            <Save className="size-4" />
            <span>Save Costing</span>
          </Button>
        </div>
      </main>

      {/* Modals */}
      <CustomerMasterEditModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        initialData={customerDetails}
        onSave={(data) => {
          setCustomerDetails(data);
          toast.success("Customer master details updated");
        }}
      />

      <ManageAccessModal
        isOpen={Boolean(selectedFileForAccess)}
        onClose={() => setSelectedFileForAccess(null)}
        file={selectedFileForAccess}
        onUpdateAccess={handleUpdateAccess}
      />

      <FilePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />

      <DeliveryNoteModal
        isOpen={isDeliveryNoteOpen}
        onClose={() => setIsDeliveryNoteOpen(false)}
        data={costingData}
        calculatedValues={calculatedValues}
      />
    </div>
  );
}

export default AccountsPage;
