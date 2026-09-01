import React from "react";
import { X, FileText, Download, Calendar, User, HardDrive, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    name: string;
    uploader?: string;
    uploadTime?: string;
    size?: string;
    fileUrl?: string;
  } | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
}) => {
  if (!isOpen || !file) return null;

  const handleDownload = () => {
    if (file.fileUrl) {
      window.open(file.fileUrl, "_blank");
    } else {
      const element = document.createElement("a");
      const sampleBlob = new Blob([`Content of ${file.name}`], { type: "application/pdf" });
      element.href = URL.createObjectURL(sampleBlob);
      element.download = file.name;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-card text-card-foreground rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FileText className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-card-foreground">
                {file.name}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Document Preview & Details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Metadata chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/30 rounded-xl text-xs text-muted-foreground border border-border">
            {file.uploader && (
              <div className="flex items-center gap-2">
                <User className="size-3.5 text-primary" />
                <span>Uploaded by: <strong className="text-foreground">{file.uploader}</strong></span>
              </div>
            )}
            {file.uploadTime && (
              <div className="flex items-center gap-2">
                <Calendar className="size-3.5 text-primary" />
                <span>Date: <strong className="text-foreground">{file.uploadTime}</strong></span>
              </div>
            )}
            {file.size && (
              <div className="flex items-center gap-2">
                <HardDrive className="size-3.5 text-primary" />
                <span>Size: <strong className="text-foreground">{file.size}</strong></span>
              </div>
            )}
          </div>

          {/* Preview Box */}
          <div className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center bg-muted/10 min-h-[260px]">
            <FileText className="size-16 text-primary/60 mb-3" />
            <h4 className="text-sm font-semibold text-foreground mb-1">
              {file.name}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mb-4">
              Stored securely in Order Documents. You can view or download the attached document below.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleDownload}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 rounded-xl"
              >
                <Download className="size-3.5" />
                Download Document
              </Button>
              {file.fileUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(file.fileUrl, "_blank")}
                  className="text-xs gap-1.5 rounded-xl border-border hover:bg-muted"
                >
                  <ExternalLink className="size-3.5" />
                  Open in New Tab
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-border bg-muted/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs rounded-xl"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
