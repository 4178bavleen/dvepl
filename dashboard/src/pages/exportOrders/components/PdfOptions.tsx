import { Checkbox } from "@/components/ui/checkbox";
import type { PdfOpts } from "../ExportOrdersPage";

interface Props {
  options: PdfOpts;
  setOptions: (o: PdfOpts) => void;
}

const OPTION_LABELS: { key: keyof PdfOpts; label: string }[] = [
  { key: "companyHeader", label: "Company Header" },
  { key: "companyFooter", label: "Company Footer" },
  { key: "pageNumbers", label: "Page Numbers" },
  { key: "includeDrawings", label: "Include Drawings" },
  { key: "landscapeMode", label: "Landscape Mode" },
  { key: "alternateRows", label: "Alternate Rows" },
];

export default function PdfOptions({ options, setOptions }: Props) {
  const toggle = (key: keyof PdfOpts) =>
    setOptions({ ...options, [key]: !options[key] });

  return (
    <div className="rounded-lg border bg-background">
      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-semibold">PDF Options</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 p-6">
        {OPTION_LABELS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <Checkbox checked={options[key]} onCheckedChange={() => toggle(key)} />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}