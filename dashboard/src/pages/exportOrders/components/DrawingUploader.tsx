import { useState, useRef, useMemo } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { exportOrdersApi } from "@/services/modules";
import toast from "react-hot-toast";
import type {
  ExportOrder,
  EngineeringDrawing,
} from "@/types/exportOrders";
import { useSalesOrderAccess } from "@/utils/salesOrderAccess";
import { DRAWING_TYPES } from "./constants";

interface Props {
  selectedOrderIds: string[];
  selectedOrders: ExportOrder[];
  availableOrders: ExportOrder[];
  onSuccess: () => void;
  revisionDrawing?: EngineeringDrawing | null;
}

export default function DrawingUploader({
  selectedOrderIds,
  selectedOrders,
  availableOrders,
  onSuccess,
  revisionDrawing = null,
}: Props) {
  const { canWorkOnOrder } = useSalesOrderAccess();

  const fileRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [salesOrderId, setSalesOrderId] = useState("");
  const [drawingNo, setDrawingNo] = useState("");
  const [title, setTitle] = useState("");
  const [drawingType, setDrawingType] = useState("SLD");
  const [changes, setChanges] = useState("");

  const isRevisionMode = Boolean(revisionDrawing);

  const combinedOrders = useMemo(() => {
    const list = [...selectedOrders];

    availableOrders.forEach((order) => {
      if (!list.some((existing) => existing.id === order.id)) {
        list.push(order);
      }
    });

    return list;
  }, [selectedOrders, availableOrders]);

  const workableOrders = useMemo(() => {
    return combinedOrders.filter((order) => canWorkOnOrder(order));
  }, [combinedOrders, canWorkOnOrder]);

  const canAttach = useMemo(() => {
    if (selectedOrders.length === 0) return true;

    return selectedOrders.every((order) => canWorkOnOrder(order));
  }, [selectedOrders, canWorkOnOrder]);

  const selectedOrderLabel = useMemo(() => {
    if (!salesOrderId) return undefined;

    const selected = combinedOrders.find(
      (order) => order.id === salesOrderId,
    );

    return selected
      ? `${selected.dveplCode} — ${selected.partyName}`
      : undefined;
  }, [salesOrderId, combinedOrders]);

  const latestRevisionNo = useMemo(() => {
    if (!revisionDrawing?.revisions?.length) return 0;

    return Math.max(
      ...revisionDrawing.revisions.map(
        (revision) => revision.revisionNo ?? 0,
      ),
    );
  }, [revisionDrawing]);

  const nextRevisionLabel = `R${latestRevisionNo + 1}`;

  const openDialog = async (file: File) => {
    if (!isRevisionMode) {
      if (selectedOrderIds.length > 0 && !canAttach) {
        toast.error(
          "View-only: you can only upload drawings to orders assigned to you.",
        );
        return;
      }
    }

    if (isRevisionMode && revisionDrawing) {
      const salesOrderIdFromDrawing =
        revisionDrawing.project?.salesOrderId ?? "";

      if (!salesOrderIdFromDrawing) {
        toast.error("Unable to determine the Sales Order for this drawing.");
        return;
      }

      const targetOrder = combinedOrders.find(
        (order) => order.id === salesOrderIdFromDrawing,
      );

      if (!targetOrder || !canWorkOnOrder(targetOrder)) {
        toast.error(
          "View-only: you can only upload revisions to orders assigned to you.",
        );
        return;
      }

      setSalesOrderId(salesOrderIdFromDrawing);
      setDrawingNo(revisionDrawing.drawingNo);
      setTitle(revisionDrawing.title);
      setDrawingType(revisionDrawing.drawingType || "SLD");
      setChanges("");
    } else {
      setSalesOrderId(selectedOrderIds[0] ?? "");
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
      setDrawingType("SLD");
      setChanges("");

      try {
        const res = await exportOrdersApi.nextDrawingNo();
        setDrawingNo(res?.data ?? "");
      } catch {
        setDrawingNo("");
      }
    }

    setPendingFile(file);
    setDialogOpen(true);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();

    const file = event.dataTransfer.files[0];

    if (file) {
      void openDialog(file);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      void openDialog(file);
    }
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setPendingFile(null);
    setChanges("");

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!pendingFile || !salesOrderId || !drawingNo || !title) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const targetOrder = combinedOrders.find(
      (order) => order.id === salesOrderId,
    );

    if (!targetOrder || !canWorkOnOrder(targetOrder)) {
      toast.error(
        "View-only: you can only upload drawings to orders assigned to you.",
      );
      return;
    }

    setUploading(true);

    try {
      const uploadRes =
        await exportOrdersApi.uploadDrawingFile(pendingFile);

      const fileUrl = uploadRes.data.fileUrl;

      if (!fileUrl) {
        throw new Error("Upload did not return a file URL.");
      }

      if (isRevisionMode && revisionDrawing) {
        await exportOrdersApi.createDrawingRevision({
          drawingId: revisionDrawing.id,
          fileUrl,
          fileName: pendingFile.name,
          fileSize: pendingFile.size,
          mimeType: pendingFile.type,
          changes: changes.trim() || null,
        });

        toast.success(`${nextRevisionLabel} uploaded successfully.`);
      } else {
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
      }

      resetDialog();
      onSuccess();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
          error?.message ??
          "Upload failed.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-background">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold">
            {isRevisionMode ? "Upload Revised Drawing" : "Upload Drawings"}
          </h2>

          {isRevisionMode && revisionDrawing && (
            <p className="mt-1 text-sm text-muted-foreground">
              Uploading {nextRevisionLabel} for {revisionDrawing.drawingNo}
            </p>
          )}
        </div>

        <div className="p-6">
          <div
            className="cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors hover:bg-muted/30"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <UploadCloud
              size={50}
              className="mx-auto mb-4 text-muted-foreground"
            />

            <h3 className="font-semibold">
              {isRevisionMode
                ? `Upload ${nextRevisionLabel}`
                : "Drag & Drop Drawings"}
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              PNG, JPG, WEBP or PDF
            </p>

            {!isRevisionMode && selectedOrderIds.length === 0 && (
              <p className="mt-2 text-xs text-yellow-600">
                Select at least one order first to attach drawings.
              </p>
            )}

            {!isRevisionMode &&
              selectedOrderIds.length > 0 &&
              !canAttach && (
                <p className="mt-2 text-xs text-yellow-600">
                  View-only: you can only upload drawings to orders assigned
                  to you.
                </p>
              )}

            <Button
              className="mt-5"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                fileRef.current?.click();
              }}
            >
              Choose File
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
            <DialogTitle>
              {isRevisionMode
                ? `Upload ${nextRevisionLabel}`
                : "Attach Drawing to Sales Order"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1">
              <Label>Sales Order *</Label>

              <Select
                value={salesOrderId}
                onValueChange={(value) =>
                  setSalesOrderId(value ?? "")
                }
                disabled={isRevisionMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select order">
                    {selectedOrderLabel}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  {workableOrders.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No orders assigned to you.
                    </div>
                  )}

                  {workableOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.dveplCode} — {order.partyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label>Drawing No *</Label>

              <Input
                value={drawingNo}
                onChange={(event) => setDrawingNo(event.target.value)}
                disabled={isRevisionMode}
                placeholder="e.g. DWG-001"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Title *</Label>

              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Drawing title"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Drawing Type</Label>

              <Select
                value={drawingType}
                onValueChange={(value) =>
                  setDrawingType(value ?? "SLD")
                }
                disabled={isRevisionMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {DRAWING_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isRevisionMode && revisionDrawing && (
              <>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs font-medium">
                    Previous Revision
                  </p>

                  <p className="mt-1 text-sm">
                    R{latestRevisionNo}
                    {" • "}
                    {revisionDrawing.status}
                  </p>

                  {revisionDrawing.rejectionReason && (
                    <p className="mt-2 text-xs text-destructive">
                      Rejection reason:{" "}
                      {revisionDrawing.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <Label>Changes in this Revision</Label>

                  <Input
                    placeholder="Describe what was changed"
                    value={changes}
                    onChange={(event) =>
                      setChanges(event.target.value)
                    }
                  />
                </div>
              </>
            )}

            {pendingFile && (
              <p className="text-xs text-muted-foreground">
                File: {pendingFile.name} (
                {(pendingFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetDialog}
              disabled={uploading}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={uploading}
              className="gap-2"
            >
              {uploading && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {uploading
                ? "Uploading…"
                : isRevisionMode
                  ? `Upload ${nextRevisionLabel}`
                  : "Upload & Attach"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}