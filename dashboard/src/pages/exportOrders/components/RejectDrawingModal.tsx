import { useState } from "react";
import { XCircle, Loader2 } from "lucide-react";
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
  onRejected: () => void;
}

export default function RejectDrawingModal({ drawing, open, onClose, onRejected }: Props) {
  const [reason, setReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    setIsRejecting(true);
    try {
      await exportOrdersApi.updateDrawingStatus(drawing.id, "REJECTED", reason.trim());
      toast.success("Drawing rejected.");
      setReason("");
      onRejected();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Rejection failed.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleClose = () => {
    if (!isRejecting) {
      setReason("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div>
            <DialogTitle>Reject Drawing</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {drawing.drawingNo} ({drawing.title})
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Rejection Reason *
            </Label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this drawing needs to be revised..."
              rows={4}
              disabled={isRejecting}
              className="w-full p-3 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none resize-none disabled:opacity-50"
            />
            <p className="text-[10px] text-muted-foreground">
              The assigned engineer will see this reason and can revise/resubmit the drawing.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isRejecting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isRejecting}
            className="gap-2"
          >
            {isRejecting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRejecting ? "Rejecting…" : <><XCircle className="h-4 w-4" /> Reject Drawing</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
