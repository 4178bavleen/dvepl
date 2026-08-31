import { Card, CardContent } from "@/components/ui/card";
import { FileText, Package, IndianRupee, ClipboardList } from "lucide-react";
import type { ExportOrder } from "@/types/exportOrders";

interface Props {
  selectedOrders: ExportOrder[];
  drawings: any[];
  selectedDrawingIds: string[];
}

export default function SelectedOrdersCard({ selectedOrders, selectedDrawingIds }: Props) {
  const totalQuantity = selectedOrders.reduce((acc, o) => {
    const qty = (o.items ?? []).reduce(
      (s: number, item: any) => s + (Number(item.quantity) || 0),
      0,
    );
    return acc + qty;
  }, 0);

  const totalValue = selectedOrders.reduce(
    (acc, o) => acc + Number(o.grandTotal ?? 0),
    0,
  );

  if (selectedOrders.length === 0) return null;

  const stats = [
    {
      label: "Orders",
      value: String(selectedOrders.length),
      icon: ClipboardList,
    },
    { label: "Quantity", value: String(totalQuantity), icon: Package },
    {
      label: "Value",
      value: `₹${totalValue.toLocaleString("en-IN")}`,
      icon: IndianRupee,
    },
    {
      label: "Drawings",
      value: String(selectedDrawingIds.length),
      icon: FileText,
    },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-lg border px-4 py-3"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-bold truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
