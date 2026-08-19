import React, { useMemo, useRef, useState } from "react";
import {
  UploadCloud,
  Plus,
  Trash2,
  Loader2,
  FileText,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { apiClient } from "@/services/axios";
import { SalesOrderAttachment } from "../orderShared";

// ============================================================
// DEFAULT DOCUMENT CATEGORIES (matching the requested upload flow)
// ============================================================

export const DEFAULT_DOCUMENT_CATEGORIES = [
  "Project Document Upload (BOM / BOQ/Tender)",
  "Customer PO Copy or DVEPL Final Offer",
  "Rough Drawings Copy",
  "Miscellaneous Document",
  "PO Copy",
  "Tender Copy",
];

// ============================================================
// PROPS
// ============================================================

interface ProjectDocumentUploadPanelProps {
  attachments?: SalesOrderAttachment[];
  // When true (immediate mode), the file is uploaded + attached to the
  // order immediately upon selection. When false (deferred mode), the file
  // is buffered and reported through onPendingChange for the parent to
  // attach after the order is created/updated.
  immediate?: boolean;
  orderId?: string | null;
  disabled?: boolean;
  uploading?: boolean;
  onPendingChange?: (pending: Array<{ category: string; file: File }>) => void;
  onUploaded?: () => void;
  onDeleted?: (attachmentId: string) => void;
}

interface PendingDoc {
  key: string;
  category: string;
  file: File | null;
}

function buildFileUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = apiClient.defaults.baseURL?.replace(/\/admin$/, "") || "";
  return `${base}${url}`;
}

// ============================================================
// PANEL
// ============================================================

export function ProjectDocumentUploadPanel({
  attachments = [],
  immediate = true,
  orderId,
  disabled = false,
  uploading = false,
  onPendingChange,
  onUploaded,
  onDeleted,
}: ProjectDocumentUploadPanelProps) {
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [busyCategory, setBusyCategory] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const categories = useMemo(
    () => [...DEFAULT_DOCUMENT_CATEGORIES, ...extraCategories],
    [extraCategories],
  );

  const attachmentsByCategory = useMemo(() => {
    const map: Record<string, SalesOrderAttachment[]> = {};
    attachments.forEach((att) => {
      const key = att.category || "Uncategorized";
      if (!map[key]) map[key] = [];
      map[key].push(att);
    });
    return map;
  }, [attachments]);

  const reportPending = (next: PendingDoc[]) => {
    setPendingDocs(next);
    onPendingChange?.(
      next
        .filter((doc) => doc.file)
        .map((doc) => ({ category: doc.category, file: doc.file as File })),
    );
  };

  const handleFileSelected = (category: string, file: File) => {
    if (immediate) {
      void uploadImmediate(category, file);
    } else {
      const existing = pendingDocs.find((doc) => doc.category === category);
      if (existing) {
        reportPending(
          pendingDocs.map((doc) =>
            doc.category === category ? { ...doc, file } : doc,
          ),
        );
      } else {
        reportPending([
          ...pendingDocs,
          { key: `${category}-${Date.now()}`, category, file },
        ]);
      }
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

      toast.success("Document uploaded successfully.");
      onUploaded?.();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ?? error?.message ?? "Upload failed.",
      );
    } finally {
      setBusyCategory(null);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    setDeletingId(attachmentId);
    try {
      const res = await apiClient.delete(
        `/order/attachment/${attachmentId}`,
      );
      if (res.data?.success) {
        toast.success("Document removed.");
        onDeleted?.(attachmentId);
      } else {
        toast.error(res.data?.message ?? "Unable to remove document.");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ?? "Failed to remove document.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const addExtraCategory = () => {
    const value = customCategory.trim();
    if (!value) {
      toast.error("Enter a document category name.");
      return;
    }
    setExtraCategories((prev) => [...prev, value]);
    setCustomCategory("");
  };

  const removeExtraCategory = (category: string) => {
    setExtraCategories((prev) => prev.filter((c) => c !== category));
    fileInputs.current[category] = null;
  };

  const renderAttachmentList = (category: string) => {
    const list = attachmentsByCategory[category] || [];
    if (list.length === 0) return null;

    return (
      <div className="mt-2 space-y-1.5">
        {list.map((att) => {
          const fullUrl = buildFileUrl(att.fileUrl);
          return (
            <div
              key={att.id}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border/70 bg-background shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="size-4 text-primary shrink-0" />
                <span
                  className="text-xs font-bold text-foreground truncate"
                  title={att.fileName}
                >
                  {att.fileName}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {fullUrl && (
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center size-7 rounded-lg border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Open Document"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(att.id)}
                    disabled={deletingId === att.id}
                    className="inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 transition-colors"
                    title="Remove Document"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/80 bg-muted/10 p-4 shadow-3xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/15">
              <UploadCloud className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Project Document Upload
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                Attach BOM/BOQ, tender, PO copies and rough drawings for this order.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {categories.map((category, index) => {
            const existing = (attachmentsByCategory[category] || []).length;
            const pending = pendingDocs.find(
              (doc) => doc.category === category,
            );

            return (
              <div
                key={`${category}-${index}`}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-border/70 bg-background shadow-2xs flex-wrap"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {category}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    {existing > 0
                      ? `${existing} attached`
                      : "Not attached yet"}
                    {pending?.file ? " · ready to attach" : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {pending?.file ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[140px]">
                        {pending.file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          reportPending(
                            pendingDocs.map((doc) =>
                              doc.category === category
                                ? { ...doc, file: null }
                                : doc,
                            ),
                          );
                        }}
                        className="size-7 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5"
                        title="Clear file"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={disabled || uploading}
                      onClick={() => fileInputs.current[category]?.click()}
                      className="h-8 text-xs font-bold rounded-xl gap-1.5"
                    >
                      {busyCategory === category ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <UploadCloud className="size-3.5" />
                      )}
                      {busyCategory === category ? "Uploading..." : "Upload"}
                    </Button>
                  )}
                  <input
                    ref={(el) => {
                      fileInputs.current[category] = el;
                    }}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelected(category, file);
                      e.target.value = "";
                    }}
                  />
                </div>

                {renderAttachmentList(category)}
              </div>
            );
          })}

          {/* "+ Add more Document" */}
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addExtraCategory();
                }
              }}
              placeholder="Enter a custom document category..."
              className="h-9 flex-1 min-w-[200px] text-xs rounded-xl"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addExtraCategory}
              className="h-9 gap-1.5 text-xs font-bold rounded-xl"
            >
              <Plus className="size-3.5" />
              Add more Document
            </Button>
          </div>

          {extraCategories.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {extraCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-bold text-primary"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => removeExtraCategory(cat)}
                    className="hover:text-rose-500 transition-colors"
                    title="Remove category"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDocumentUploadPanel;
