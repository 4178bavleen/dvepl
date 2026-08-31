import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { exportOrdersApi } from "@/services/modules";
import toast from "react-hot-toast";
import type { EngineeringDrawing } from "@/types/exportOrders";

interface Props {
  drawing: EngineeringDrawing;
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

export default function RevisionUploadModal({ drawing, open, onClose, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [changes, setChanges] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const latestRevisionNo = Math.max(
    0,
    ...(drawing.revisions?.map((r) => r.revisionNo ?? 0) ?? []),
  );
  const nextLabel = `R${latestRevisionNo + 1}`;

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select the revised drawing file.");
      return;
    }
    setIsUploading(true);
    try {
      const uploadRes = await exportOrdersApi.uploadDrawingFile(file);
      const fileUrl = uploadRes.data.fileUrl;
      if (!fileUrl) throw new Error("Upload did not return a file URL.");

      const result = await exportOrdersApi.createDrawingRevision({
        drawingId: drawing.id,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || null,
        changes: changes.trim() || null,
      });

      const revNo = result?.data?.revisionNo ?? result?.data?.currentRevision?.revisionNo;
      toast.success(
        revNo !== undefined
          ? `Revision R${revNo} uploaded successfully.`
          : "Drawing revision uploaded successfully.",
      );
      setFile(null);
      setChanges("");
      onUploaded();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to upload drawing revision.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setChanges("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div>
            <DialogTitle>Upload Drawing Revision</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {drawing.drawingNo} &middot; {drawing.title}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
              Previous Drawing Rejected
            </p>
            <p className="text-xs text-red-700 mt-1">
              {drawing.rejectionReason || "Revision required."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Revised Drawing File *
            </Label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={isUploading}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground hover:file:opacity-90 disabled:opacity-50"
            />
            {file && (
              <p className="text-[10px] text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Changes in This Revision
            </Label>
            <textarea
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              placeholder="Describe what was changed in this revision..."
              rows={3}
              disabled={isUploading}
              className="w-full p-3 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none resize-none disabled:opacity-50"
            />
          </div>

          <p className="text-[10px] text-muted-foreground">
            This will create {nextLabel} automatically. The previous revision remains in history.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file || isUploading} className="gap-2">
            {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isUploading ? "Uploading…" : `Upload ${nextLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
