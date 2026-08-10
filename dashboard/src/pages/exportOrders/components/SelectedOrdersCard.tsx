import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import type { EngineeringDrawing, ExportOrder } from "@/types/exportOrders";

interface Props {
  selectedOrders: ExportOrder[];
  drawings: EngineeringDrawing[];
  selectedDrawingIds: string[];
}

export default function SelectedOrdersCard({ selectedOrders, drawings, selectedDrawingIds }: Props) {
  const totalQuantity = selectedOrders.reduce((acc, o) => {
    const qty = (o.items ?? []).reduce(
      (s: number, item: any) => s + (Number(item.quantity) || 0),
      0
    );
    return acc + qty;
  }, 0);

  const totalValue = selectedOrders.reduce(
    (acc, o) => acc + Number(o.grandTotal ?? 0),
    0
  );

  const drawingsCount = selectedDrawingIds.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Orders</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Orders</p>
            <p className="text-3xl font-bold">{selectedOrders.length}</p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Quantity</p>
            <p className="text-3xl font-bold">{totalQuantity}</p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Value</p>
            <p className="text-3xl font-bold">
              ₹{totalValue.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Drawings</p>
            <p className="text-3xl font-bold">{drawingsCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
