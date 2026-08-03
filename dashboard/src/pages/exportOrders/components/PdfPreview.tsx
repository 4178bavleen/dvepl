import { FileText } from "lucide-react";

export default function PdfPreview() {
  return (
    <div className="rounded-lg border bg-background h-full">

      <div className="border-b px-5 py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <FileText size={18} />
          PDF Preview
        </h2>
      </div>

      <div className="p-5">

        <div className="aspect-[210/297] rounded-md border bg-white shadow-sm p-6">

          <div className="border-b pb-4 mb-4">
            <h1 className="text-xl font-bold">
              DV Electromatic Pvt. Ltd.
            </h1>

            <p className="text-xs text-gray-500">
              Export Report Preview
            </p>
          </div>

          <div className="space-y-3">

            <div className="h-4 rounded bg-gray-200" />

            <div className="h-4 rounded bg-gray-200 w-5/6" />

            <div className="h-4 rounded bg-gray-200 w-3/4" />

          </div>

          <div className="mt-8 border rounded p-4">

            <p className="font-medium">
              Orders Preview
            </p>

            <p className="text-sm text-muted-foreground">
              Selected orders will appear here.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}