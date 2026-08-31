import { FileText, ImageIcon } from "lucide-react";
import { IMAGE_TYPES } from "./constants";

interface Props {
  mimeType?: string;
  fileName?: string;
  fileUrl: string;
}

export default function DrawingThumbnail({ mimeType, fileName, fileUrl }: Props) {
  const isImage = IMAGE_TYPES.includes(mimeType ?? "");
  const isPdf =
    mimeType === "application/pdf" || fileName?.endsWith(".pdf");

  if (isImage && fileUrl) {
    return (
      <img
        src={fileUrl}
        alt=""
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  if (isPdf) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
          <FileText className="w-6 h-6 text-red-500" />
        </div>
        <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase">
          PDF
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
      <ImageIcon className="w-10 h-10" />
    </div>
  );
}
