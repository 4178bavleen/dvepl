import { useState, useRef } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { exportOrdersApi } from "@/services/modules";
import toast from "react-hot-toast";
import type { ExportOrder } from "@/types/exportOrders";

interface Props {
  selectedOrderIds: string[];
  selectedOrders: ExportOrder[];
  availableOrders: ExportOrder[];
  onSuccess: () => void;
}

const DRAWING_TYPES = [
  "SLD", "GA_DRAWING", "WIRING_DIAGRAM", "LAYOUT", "CAD", "PDF", "OTHER",
];

export default function DrawingUploader({ selectedOrderIds, selectedOrders, availableOrders, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [salesOrderId, setSalesOrderId] = useState("");
  const [drawingNo, setDrawingNo] = useState("");
  const [title, setTitle] = useState("");
  const [drawingType, setDrawingType] = useState("SLD");

  const openDialog = async (file: File) => {
    setPendingFile(file);
    // Pre-select first selected order, or first available order
    setSalesOrderId(selectedOrderIds[0] ?? "");
    setTitle(file.name.replace(/\.[^/.]+$/, ""));
    setDrawingType("SLD");
    // Auto-fetch next drawing number
    try {
      const res = await exportOrdersApi.nextDrawingNo();
      setDrawingNo(res?.data ?? "");
    } catch {
      setDrawingNo("");
    }
    setDialogOpen(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) openDialog(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) openDialog(file);
  };

  const handleSubmit = async () => {
    if (!pendingFile || !salesOrderId || !drawingNo || !title) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setUploading(true);
    try {
      const uploadRes = await exportOrdersApi.uploadDrawingFile(pendingFile);
      const fileUrl = uploadRes.data.fileUrl;
      if (!fileUrl) throw new Error("Upload did not return a file URL.");

      await exportOrdersApi.createDrawing({
        salesOrderId,
        drawingNo,
        title,
        drawingType,
        fileUrl,
        fileName: pendingFile.name,
        fileSize: pendingFile.size,
        mimeType: pendingFile.type,
      });

      toast.success("Drawing uploaded and attached.");
      setDialogOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err.message ?? "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-background">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold text-lg">Upload Drawings</h2>
        </div>

        <div className="p-6">
          <div
            className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/30 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <UploadCloud size={50} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold">Drag &amp; Drop Drawings</h3>
            <p className="text-sm text-muted-foreground mt-2">PNG, JPG, WEBP or PDF</p>
            {selectedOrderIds.length === 0 && (
              <p className="text-xs text-yellow-600 mt-2">
                Select at least one order first to attach drawings.
              </p>
            )}
            <Button
              className="mt-5"
              type="button"
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
            >
              Choose Files
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Attach Drawing to Sales Order</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            {/* Sales Order selector — shows dveplCode */}
            <div className="flex flex-col gap-1">
              <Label>Sales Order *</Label>
              <Select value={salesOrderId} onValueChange={(val) => setSalesOrderId(val ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                    {availableOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.dveplCode} — {o.partyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label>Drawing No *</Label>
              <Input
                placeholder="e.g. DWG-001"
                value={drawingNo}
                onChange={(e) => setDrawingNo(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Title *</Label>
              <Input
                placeholder="Drawing title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Drawing Type</Label>
              <Select value={drawingType} onValueChange={(val) => setDrawingType(val ?? "SLD")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DRAWING_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {pendingFile && (
              <p className="text-xs text-muted-foreground">
                File: {pendingFile.name} ({(pendingFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={uploading} className="gap-2">
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Uploading…" : "Upload & Attach"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
