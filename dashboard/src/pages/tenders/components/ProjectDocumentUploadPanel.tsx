import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  FileText,
  ExternalLink,
  CheckCircle2,
  Settings,
  Eye,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { apiClient } from "@/services/axios";
import { SalesOrderAttachment } from "../orderShared";
import { useERPStore } from "@/store/erpStore";
import {
  DocumentCategoryDef,
  INITIAL_DOCUMENT_CATEGORIES,
  ORDER_DOCUMENTS_CHANGED_EVENT,
  getOrderDocumentCategories,
  normalizeCategoryName,
} from "./orderDocumentsConfig";

export {
  type DocumentCategoryDef,
  INITIAL_DOCUMENT_CATEGORIES,
};


// ============================================================
// PROPS
// ============================================================

interface ProjectDocumentUploadPanelProps {
  attachments?: SalesOrderAttachment[];
  immediate?: boolean;
  orderId?: string | null;
  disabled?: boolean;
  uploading?: boolean;
  isAdmin?: boolean;
  onPendingChange?: (pending: Array<{ category: string; file: File }>) => void;
  onUploaded?: () => void;
  onDeleted?: (attachmentId: string) => void;
  onMandatoryFulfilledChange?: (fulfilled: boolean) => void;
  onOpenManageDocs?: () => void;
}

interface PendingDoc {
  key: string;
  category: string;
  file: File | null;
}

function formatBytes(bytes: number, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function buildFileUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = apiClient.defaults.baseURL?.replace(/\/admin$/, "") || "";
  return `${base}${url}`;
}

// Normalize strings for matching categories
function normalizeCategory(cat: string) {
  return cat.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ============================================================
// PANEL COMPONENT
// ============================================================

export function ProjectDocumentUploadPanel({
  attachments = [],
  immediate = false,
  orderId,
  disabled = false,
  uploading = false,
  isAdmin = false,
  onPendingChange,
  onUploaded,
  onDeleted,
  onMandatoryFulfilledChange,
  onOpenManageDocs,
}: ProjectDocumentUploadPanelProps) {
  const store = useERPStore();
  const [categories, setCategories] = useState<DocumentCategoryDef[]>(() =>
    getOrderDocumentCategories(store.settings)
  );
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [busyCategory, setBusyCategory] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Preview modal state
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    url: string;
    isBlob?: boolean;
    mimeType?: string;
  } | null>(null);

  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  // Clean up object URLs when preview closes or changes
  useEffect(() => {
    return () => {
      if (previewDoc?.isBlob && previewDoc?.url) {
        URL.revokeObjectURL(previewDoc.url);
      }
    };
  }, [previewDoc]);

  const handlePreview = (doc: { title: string; url: string; isBlob?: boolean; mimeType?: string }) => {
    setPreviewDoc(doc);
  };

  const handleClosePreview = () => {
    if (previewDoc?.isBlob && previewDoc?.url) {
      URL.revokeObjectURL(previewDoc.url);
    }
    setPreviewDoc(null);
  };

  // Synchronize when store.settings changes or when global document config updates
  React.useEffect(() => {
    const configured = getOrderDocumentCategories(store.settings);
    setCategories(configured);
  }, [store.settings]);

  React.useEffect(() => {
    const handleCategorySync = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setCategories(e.detail);
      }
    };
    window.addEventListener(ORDER_DOCUMENTS_CHANGED_EVENT, handleCategorySync);
    return () => {
      window.removeEventListener(ORDER_DOCUMENTS_CHANGED_EVENT, handleCategorySync);
    };
  }, []);

  const attachmentsByCategory = useMemo(() => {
    const map: Record<string, SalesOrderAttachment[]> = {};
    attachments.forEach((att) => {
      const key = att.category || "Uncategorized";
      if (!map[key]) map[key] = [];
      map[key].push(att);
    });
    return map;
  }, [attachments]);

  // Check if a category has an attachment or pending file
  const getCategoryFileStatus = (categoryName: string) => {
    const norm = normalizeCategory(categoryName);
    
    // Check existing server attachments
    const attachedKey = Object.keys(attachmentsByCategory).find(
      (k) => normalizeCategory(k) === norm || k === categoryName
    );
    const existingList = attachedKey ? attachmentsByCategory[attachedKey] || [] : [];
    
    // Check pending local files
    const pendingDoc = pendingDocs.find(
      (doc) => normalizeCategory(doc.category) === norm && doc.file
    );

    return {
      hasFile: existingList.length > 0 || Boolean(pendingDoc?.file),
      existingList,
      pendingFile: pendingDoc?.file || null,
    };
  };

  // Report pending changes and mandatory status based on active categories
  const reportPending = (next: PendingDoc[], currentCats = categories) => {
    setPendingDocs(next);
    const validPending = next
      .filter((doc) => doc.file)
      .map((doc) => ({ category: doc.category, file: doc.file as File }));
    onPendingChange?.(validPending);

    // Evaluate mandatory categories dynamically
    const mandatoryCategories = currentCats.filter((c) => c.isMandatory);
    const allMandatoryFulfilled = mandatoryCategories.every((mand) => {
      const mandNorm = normalizeCategory(mand.name);
      const hasPending = next.some(
        (doc) => normalizeCategory(doc.category) === mandNorm && doc.file
      );
      const hasExisting = attachments.some(
        (att) => normalizeCategory(att.category || "") === mandNorm
      );
      return hasPending || hasExisting;
    });

    onMandatoryFulfilledChange?.(allMandatoryFulfilled);
  };

  // Re-check fulfillment when categories or attachments change
  React.useEffect(() => {
    reportPending(pendingDocs, categories);
  }, [categories, attachments]);

  const handleFileSelected = (category: string, file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error(`File "${file.name}" exceeds the 50 MB limit.`);
      return;
    }

    if (immediate && orderId) {
      void uploadImmediate(category, file);
    } else {
      const norm = normalizeCategory(category);
      const existingIdx = pendingDocs.findIndex(
        (doc) => normalizeCategory(doc.category) === norm
      );

      let next: PendingDoc[];
      if (existingIdx >= 0) {
        next = pendingDocs.map((doc, idx) =>
          idx === existingIdx ? { ...doc, category, file } : doc
        );
      } else {
        next = [
          ...pendingDocs,
          { key: `${category}-${Date.now()}`, category, file },
        ];
      }
      reportPending(next);
    }
  };

  const uploadImmediate = async (category: string, file: File) => {
    if (!orderId) {
      toast.error("Order context is missing. Cannot upload document.");
      return;
    }

    setBusyCategory(category);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await apiClient.post("/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fileUrl = uploadRes.data?.data?.fileUrl;
      if (!fileUrl) throw new Error("Upload did not return a file URL.");

      await apiClient.post(`/order/attachment/${orderId}`, {
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type || null,
        category,
      });

      toast.success(`${category} uploaded successfully.`);
      onUploaded?.();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ?? error?.message ?? "Upload failed."
      );
    } finally {
      setBusyCategory(null);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    setDeletingId(attachmentId);
    try {
      const res = await apiClient.delete(`/order/attachment/${attachmentId}`);
      if (res.data?.success) {
        toast.success("Document removed.");
        onDeleted?.(attachmentId);
      } else {
        toast.error(res.data?.message ?? "Unable to remove document.");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ?? "Failed to remove document."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const clearPendingFile = (category: string) => {
    const norm = normalizeCategory(category);
    const next = pendingDocs.filter(
      (doc) => normalizeCategory(doc.category) !== norm
    );
    reportPending(next);
  };

  const addCustomCategory = () => {
    const val = customCategory.trim();
    if (!val) return;
    if (categories.some((c) => c.name.toLowerCase() === val.toLowerCase())) {
      toast.error("This document category already exists.");
      return;
    }

    setCategories((prev) => [...prev, { name: val, isMandatory: false }]);
    setCustomCategory("");
    setIsAddingCategory(false);
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
          PROJECT DOCUMENT UPLOAD
        </h3>
        {onOpenManageDocs && (
          <button
            type="button"
            onClick={onOpenManageDocs}
            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configure document categories company-wide"
          >
            <Settings className="size-3" />
            Manage Documents
          </button>
        )}
      </div>

      {/* Document List Table */}
      <div className="border-t border-b border-neutral-200/80 dark:border-neutral-800 divide-y divide-neutral-200/80 dark:divide-neutral-800">
        {categories.map((cat, index) => {
          const { hasFile, existingList, pendingFile } = getCategoryFileStatus(
            cat.name
          );
          const isBusy = busyCategory === cat.name;

          return (
            <div
              key={`${cat.name}-${index}`}
              className="py-2.5 flex items-center justify-between gap-4 text-xs transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30"
            >
              {/* Category Name */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {cat.isMandatory && (
                  <span className="text-red-500 font-bold text-sm leading-none">
                    *
                  </span>
                )}
                <span
                  className={`font-medium ${
                    cat.isMandatory
                      ? "text-neutral-800 dark:text-neutral-100 font-semibold"
                      : "text-neutral-700 dark:text-neutral-300"
                  } truncate`}
                >
                  {cat.name}
                </span>
              </div>

              {/* Upload Action / Uploaded File Status */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Existing Server Attachments */}
                {existingList.map((att) => {
                  const fullUrl = buildFileUrl(att.fileUrl);
                  return (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-md px-2.5 py-1 text-[11px]"
                    >
                      <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                      <span
                        className="font-medium text-emerald-900 dark:text-emerald-200 max-w-[140px] sm:max-w-[180px] truncate"
                        title={att.fileName}
                      >
                        {att.fileName}
                      </span>
                      {att.fileSize ? (
                        <span className="text-neutral-400 text-[10px]">
                          ({formatBytes(att.fileSize)})
                        </span>
                      ) : null}

                      {/* View / Preview button for existing attachment */}
                      {fullUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            handlePreview({
                              title: att.fileName,
                              url: fullUrl,
                              isBlob: false,
                              mimeType: att.mimeType || undefined,
                            })
                          }
                          className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 px-1.5 py-0.5 rounded hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors"
                          title="View / preview document"
                        >
                          <Eye className="size-3 shrink-0" />
                          <span className="font-semibold text-[10px]">View</span>
                        </button>
                      )}

                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteAttachment(att.id)}
                          disabled={deletingId === att.id}
                          className="text-neutral-400 hover:text-red-500 ml-0.5 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Remove file"
                        >
                          {deletingId === att.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Trash2 className="size-3" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Pending Local File */}
                {pendingFile && (
                  <div className="flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-md px-2.5 py-1 text-[11px]">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span
                      className="font-medium text-emerald-900 dark:text-emerald-200 max-w-[140px] sm:max-w-[180px] truncate"
                      title={pendingFile.name}
                    >
                      {pendingFile.name}
                    </span>
                    <span className="text-neutral-400 text-[10px]">
                      ({formatBytes(pendingFile.size)})
                    </span>

                    {/* View / Preview button for pending local file */}
                    <button
                      type="button"
                      onClick={() => {
                        const blobUrl = URL.createObjectURL(pendingFile);
                        handlePreview({
                          title: pendingFile.name,
                          url: blobUrl,
                          isBlob: true,
                          mimeType: pendingFile.type || undefined,
                        });
                      }}
                      className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 px-1.5 py-0.5 rounded hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors"
                      title="View / preview document"
                    >
                      <Eye className="size-3 shrink-0" />
                      <span className="font-semibold text-[10px]">View</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => clearPendingFile(cat.name)}
                      className="text-neutral-400 hover:text-red-500 ml-0.5 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Clear file"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                )}

                {/* Upload Trigger Button */}
                {!hasFile && (
                  <button
                    type="button"
                    disabled={disabled || uploading || isBusy}
                    onClick={() => fileInputs.current[cat.name]?.click()}
                    className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold text-xs hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isBusy ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" /> Uploading...
                      </span>
                    ) : (
                      "Upload"
                    )}
                  </button>
                )}

                {/* Hidden File Input */}
                <input
                  ref={(el) => {
                    fileInputs.current[cat.name] = el;
                  }}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelected(cat.name, file);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Mandatory Help Note at Bottom */}
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal leading-relaxed pt-1">
        Red * = mandatory (shown first) — all mandatory documents must be uploaded before you can save this order. Max file size: 50 MB per file.
      </p>

      {/* Document Preview Dialog */}
      {previewDoc && (
        <Dialog open={Boolean(previewDoc)} onOpenChange={(open) => !open && handleClosePreview()}>
          <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 flex flex-col overflow-hidden">
            <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0 shrink-0">
              <div className="flex items-center gap-2 overflow-hidden mr-4">
                <FileText className="size-5 text-emerald-600 shrink-0" />
                <DialogTitle className="text-sm font-semibold truncate" title={previewDoc.title}>
                  {previewDoc.title}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2 shrink-0 pr-6">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Open in Tab</span>
                </a>
                <a
                  href={previewDoc.url}
                  download={previewDoc.title}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  <Download className="size-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </DialogHeader>

            <div className="flex-1 bg-neutral-100 dark:bg-neutral-900 p-2 overflow-hidden flex items-center justify-center">
              {previewDoc.title.toLowerCase().endsWith(".pdf") ||
              previewDoc.mimeType === "application/pdf" ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-full rounded border-0 bg-white dark:bg-neutral-950"
                  title={previewDoc.title}
                />
              ) : /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(previewDoc.title) ||
                previewDoc.mimeType?.startsWith("image/") ? (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.title}
                    className="max-w-full max-h-full object-contain rounded shadow"
                  />
                </div>
              ) : (
                <div className="text-center p-8 bg-white dark:bg-neutral-800 rounded-lg shadow-sm max-w-md">
                  <FileText className="size-16 text-neutral-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                    {previewDoc.title}
                  </p>
                  <p className="text-xs text-neutral-500 mb-4">
                    Inline preview is not available for this file type.
                  </p>
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
                  >
                    <ExternalLink className="size-3.5" />
                    Open or Download File
                  </a>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default ProjectDocumentUploadPanel;
