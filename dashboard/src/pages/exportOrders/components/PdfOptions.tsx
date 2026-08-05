import { Checkbox } from "@/components/ui/checkbox";

export default function PdfOptions() {
  return (
    <div className="rounded-lg border bg-background">

      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-semibold">
          PDF Options
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 p-6">

        <label className="flex items-center gap-3">
          <Checkbox />
          Company Header
        </label>

        <label className="flex items-center gap-3">
          <Checkbox />
          Company Footer
        </label>

        <label className="flex items-center gap-3">
          <Checkbox />
          Page Numbers
        </label>

        <label className="flex items-center gap-3">
          <Checkbox />
          Include Drawings
        </label>

        <label className="flex items-center gap-3">
          <Checkbox />
          Landscape Mode
        </label>

        <label className="flex items-center gap-3">
          <Checkbox />
          Alternate Rows
        </label>

      </div>

    </div>
  );
}