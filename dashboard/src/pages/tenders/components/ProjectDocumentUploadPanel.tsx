import React, { useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  FileText,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { apiClient } from "@/services/axios";
import { SalesOrderAttachment } from "../orderShared";

// ============================================================
// DOCUMENT CATEGORIES DEFINITION (matching Screenshot 3)
// ============================================================

export interface DocumentCategoryDef {
  name: string;
  isMandatory: boolean;
}

export const INITIAL_DOCUMENT_CATEGORIES: DocumentCategoryDef[] = [
  { name: "BOM / BOQ/Tender", isMandatory: true },
  { name: "Customer PO Copy or DVEPL Final Offer", isMandatory: true },
  { name: "Rough Drawings Copy", isMandatory: true },
  { name: "Miscellaneous Document", isMandatory: false },
  { name: "PO Copy", isMandatory: false },
  { name: "Tender Copy", isMandatory: false },
];

export const MANDATORY_CATEGORIES = [
  "BOM / BOQ/Tender",
  "Customer PO Copy or DVEPL Final Offer",
  "Rough Drawings Copy",
];

// ============================================================
// PROPS
// ============================================================

interface ProjectDocumentUploadPanelProps {
  attachments?: SalesOrderAttachment[];
  immediate?: boolean;
  orderId?: string | null;
  disabled?: boolean;
  uploading?: boolean;
  onPendingChange?: (pending: Array<{ category: string; file: File }>) => void;
  onUploaded?: () => void;
  onDeleted?: (attachmentId: string) => void;
  onMandatoryFulfilledChange?: (fulfilled: boolean) => void;
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
  onPendingChange,
  onUploaded,
  onDeleted,
  onMandatoryFulfilledChange,
}: ProjectDocumentUploadPanelProps) {
  const [categories, setCategories] = useState<DocumentCategoryDef[]>(
    INITIAL_DOCUMENT_CATEGORIES
  );
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [busyCategory, setBusyCategory] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

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

  // Report pending changes and mandatory status
  const reportPending = (next: PendingDoc[]) => {
    setPendingDocs(next);
    const validPending = next
      .filter((doc) => doc.file)
      .map((doc) => ({ category: doc.category, file: doc.file as File }));
    onPendingChange?.(validPending);

    // Evaluate mandatory categories
    const allMandatoryFulfilled = MANDATORY_CATEGORIES.every((mand) => {
      const mandNorm = normalizeCategory(mand);
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
                      className="flex items-center gap-2 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-md px-2.5 py-1 text-[11px]"
                    >
                      <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                      <span
                        className="font-medium text-emerald-900 dark:text-emerald-200 max-w-[150px] sm:max-w-[200px] truncate"
                        title={att.fileName}
                      >
                        {att.fileName}
                      </span>
                      {att.fileSize ? (
                        <span className="text-neutral-400 text-[10px]">
                          ({formatBytes(att.fileSize)})
                        </span>
                      ) : null}
                      {fullUrl && (
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:text-emerald-900 ml-1"
                          title="View document"
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteAttachment(att.id)}
                          disabled={deletingId === att.id}
                          className="text-neutral-400 hover:text-red-500 ml-1 transition-colors"
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
                  <div className="flex items-center gap-2 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-md px-2.5 py-1 text-[11px]">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span
                      className="font-medium text-emerald-900 dark:text-emerald-200 max-w-[150px] sm:max-w-[200px] truncate"
                      title={pendingFile.name}
                    >
                      {pendingFile.name}
                    </span>
                    <span className="text-neutral-400 text-[10px]">
                      ({formatBytes(pendingFile.size)})
                    </span>
                    <button
                      type="button"
                      onClick={() => clearPendingFile(cat.name)}
                      className="text-neutral-400 hover:text-red-500 ml-1 transition-colors"
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

      {/* Add More Document Link / Inline Input */}
      <div className="pt-1">
        {isAddingCategory ? (
          <div className="flex items-center gap-2 max-w-md">
            <Input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomCategory();
                } else if (e.key === "Escape") {
                  setIsAddingCategory(false);
                }
              }}
              placeholder="Enter document name..."
              className="h-8 text-xs rounded-lg"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              onClick={addCustomCategory}
              className="h-8 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-3"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingCategory(false)}
              className="h-8 text-xs rounded-lg"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingCategory(true)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            Add more Document
          </button>
        )}
      </div>

      {/* Mandatory Help Note at Bottom */}
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal leading-relaxed pt-1">
        Red * = mandatory (shown first) — all mandatory documents must be uploaded before you can save this order. Max file size: 50 MB per file.
      </p>
    </div>
  );
}

export default ProjectDocumentUploadPanel;
