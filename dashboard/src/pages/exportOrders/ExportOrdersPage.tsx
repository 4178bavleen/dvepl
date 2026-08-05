import { Card, CardContent } from "@/components/ui/card";

import SelectedOrdersCard from "./components/SelectedOrdersCard";
import ExportToolbar from "./components/ExportToolbar";
import FilterPanel from "./components/FilterPanel";
import OrdersTable from "./components/OrdersTable";
import PdfPreview from "./components/PdfPreview";
import DrawingUploader from "./components/DrawingUploader";
import DrawingLibrary from "./components/DrawingLibrary";
import PdfOptions from "./components/PdfOptions";

export default function ExportOrdersPage() {
  return (
    <div className="flex flex-col gap-6 p-6">

      <ExportToolbar />

      <FilterPanel />

      <div className="grid grid-cols-12 gap-6">

        <Card className="col-span-8">
          <CardContent className="p-5">
            <OrdersTable />
          </CardContent>
        </Card>

        <Card className="col-span-4">
          <CardContent className="p-5">
            <PdfPreview />
          </CardContent>
        </Card>

      </div>
      <SelectedOrdersCard />

      <Card>
        <CardContent className="p-5">
          <DrawingUploader />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <DrawingLibrary />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <PdfOptions />
        </CardContent>
      </Card>

    </div>
  );
}