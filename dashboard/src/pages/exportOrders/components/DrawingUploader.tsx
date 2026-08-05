import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DrawingUploader() {
  return (
    <div className="rounded-lg border bg-background">

      <div className="border-b px-5 py-4">
        <h2 className="font-semibold text-lg">
          Upload Drawings
        </h2>
      </div>

      <div className="p-6">

        <div className="border-2 border-dashed rounded-lg p-12 text-center">

          <UploadCloud
            size={50}
            className="mx-auto mb-4 text-muted-foreground"
          />

          <h3 className="font-semibold">
            Drag & Drop Drawings
          </h3>

          <p className="text-sm text-muted-foreground mt-2">
            PNG, JPG, WEBP or PDF
          </p>

          <Button className="mt-5">
            Choose Files
          </Button>

        </div>

      </div>

    </div>
  );
}