import { ImageIcon, CheckCircle2, FileText, ThumbsUp, ThumbsDown } from "lucide-react";
import { apiClient } from "@/services/axios";
import toast from "react-hot-toast";
import { useState } from "react";

interface Props {
  drawings: any[];
  selectedDrawingIds: string[];
  setSelectedDrawingIds: (ids: string[]) => void;
  onStatusChanged?: () => void;
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? "";

function buildFileUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("http")) return rawUrl;
  return `${BASE_URL}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
}

export default function DrawingLibrary({
  drawings,
  selectedDrawingIds,
  setSelectedDrawingIds,
  onStatusChanged,
}: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelectedDrawingIds(
      selectedDrawingIds.includes(id)
        ? selectedDrawingIds.filter((x) => x !== id)
        : [...selectedDrawingIds, id]
    );

  const openFile = (url: string) => window.open(buildFileUrl(url), "_blank");

  const changeStatus = async (e: React.MouseEvent, drawing: any, newStatus: string) => {
    e.stopPropagation();
    setUpdatingId(drawing.id);
    try {
      await apiClient.put(`/engineering-drawing/update/${drawing.id}`, { status: newStatus });
      toast.success(`Drawing marked as ${newStatus.toLowerCase()}.`);
      onStatusChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Status update failed.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-lg border bg-background">
      <div className="border-b px-5 py-4 flex justify-between">
        <h2 className="font-semibold text-lg">Drawing Library</h2>
        <span className="text-sm text-muted-foreground">
          {drawings.length} Drawing{drawings.length !== 1 ? "s" : ""}
          {selectedDrawingIds.length > 0 && ` · ${selectedDrawingIds.length} selected`}
        </span>
      </div>

      {drawings.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground text-sm">
          No drawings linked to selected orders yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 p-5">
          {drawings.map((d) => {
            const isSelected = selectedDrawingIds.includes(d.id);
            const isImage = IMAGE_TYPES.includes(d.mimeType ?? "");
            const isPdf = d.mimeType === "application/pdf" || d.fileName?.endsWith(".pdf");
            const fileUrl = buildFileUrl(d.fileUrl);
            const isUpdating = updatingId === d.id;

            const statusBadgeColor =
              d.status === "APPROVED"
                ? "bg-green-100 text-green-700"
                : d.status === "REJECTED"
                ? "bg-red-100 text-red-600"
                : "bg-yellow-100 text-yellow-700";

            return (
              <div
                key={d.id}
                onClick={() => toggle(d.id)}
                className={`border rounded-lg overflow-hidden cursor-pointer transition-all group ${
                  isSelected ? "ring-2 ring-primary border-primary" : "hover:shadow-md"
                }`}
              >
                {/* Thumbnail */}
                <div
                  className="h-36 bg-muted flex items-center justify-center relative"
                  onDoubleClick={(e) => { e.stopPropagation(); openFile(d.fileUrl); }}
                >
                  {isSelected && (
                    <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-primary z-10" />
                  )}

                  {/* Status badge */}
                  <span className={`absolute top-2 left-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusBadgeColor}`}>
                    {d.status}
                  </span>

                  {isImage && fileUrl ? (
                    <img
                      src={fileUrl}
                      alt={d.title}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : isPdf ? (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <FileText size={40} />
                      <span className="text-[10px]">PDF</span>
                    </div>
                  ) : (
                    <ImageIcon size={40} className="text-muted-foreground" />
                  )}

                  {/* Approve / Reject buttons — appear on hover */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 p-1.5 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      disabled={isUpdating || d.status === "APPROVED"}
                      onClick={(e) => changeStatus(e, d, "APPROVED")}
                      className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-green-600 text-white disabled:opacity-40 hover:bg-green-700 transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      Approve
                    </button>
                    <button
                      disabled={isUpdating || d.status === "REJECTED"}
                      onClick={(e) => changeStatus(e, d, "REJECTED")}
                      className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-red-600 text-white disabled:opacity-40 hover:bg-red-700 transition-colors"
                    >
                      <ThumbsDown className="w-3 h-3" />
                      Reject
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-medium truncate text-xs">{d.drawingNo}</p>
                  <p className="truncate text-xs text-muted-foreground">{d.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{d.drawingType}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}