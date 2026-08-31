import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import toast from "react-hot-toast";
import {
  type RevisionAwareDrawing,
  getCurrentRevision,
  buildFileUrl,
} from "./constants";
import StatusPill from "./StatusPill";

interface Props {
  drawing: RevisionAwareDrawing;
  open: boolean;
  onClose: () => void;
}

export default function RevisionHistoryModal({ drawing, open, onClose }: Props) {
  const revisions = [...(drawing.revisions ?? [])].sort(
    (a, b) => b.revisionNo - a.revisionNo,
  );
  const currentRevNo = getCurrentRevision(drawing)?.revisionNo;

  const handleView = (fileUrl: string) => {
    const url = buildFileUrl(fileUrl);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      toast.error("This revision does not have an attached file.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div>
            <DialogTitle>Revision History</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {drawing.drawingNo} &middot; {drawing.title}
            </p>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-3 py-2">
          {revisions.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No revision history available.
            </div>
          ) : (
            revisions.map((rev) => {
              const revStatus = rev.status ?? "DRAFT";
              const isCurrent = rev.revisionNo === currentRevNo;

              return (
                <div
                  key={rev.id}
                  className={`rounded-xl border p-4 ${
                    isCurrent
                      ? "border-primary/30 bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">R{rev.revisionNo}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            CURRENT
                          </span>
                        )}
                        <StatusPill status={revStatus} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {rev.fileName}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(rev.fileUrl)}
                      className="gap-1.5 flex-shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[10px]">
                    <div>
                      <p className="text-muted-foreground">Created By</p>
                      <p className="font-semibold mt-0.5">
                        {rev.createdBy?.name ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-semibold mt-0.5">
                        {rev.createdAt
                          ? new Date(rev.createdAt).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Approved</p>
                      <p className="font-semibold mt-0.5">
                        {rev.approvedAt
                          ? new Date(rev.approvedAt).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rejected</p>
                      <p className="font-semibold mt-0.5">
                        {rev.rejectedAt
                          ? new Date(rev.rejectedAt).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {rev.changes && (
                    <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Changes
                      </p>
                      <p className="text-xs mt-1 whitespace-pre-wrap">{rev.changes}</p>
                    </div>
                  )}

                  {rev.rejectionReason && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                        Rejection Reason
                      </p>
                      <p className="text-xs text-red-700 mt-1 whitespace-pre-wrap">
                        {rev.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
