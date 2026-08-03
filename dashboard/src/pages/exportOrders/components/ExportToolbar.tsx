import { FileText, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";

export default function ExportToolbar() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-5">

        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">
              Export Orders
            </h1>
          </div>

          <p className="text-muted-foreground mt-1">
            Generate professional PDF reports with drawings.
          </p>
        </div>

        <div className="flex items-center gap-3">

          <div className="rounded-lg border px-4 py-2 text-center min-w-[110px]">
            <p className="text-xs text-muted-foreground">
              Selected Orders
            </p>

            <p className="text-2xl font-bold">
              0
            </p>
          </div>

          <div className="rounded-lg border px-4 py-2 text-center min-w-[120px]">
            <p className="text-xs text-muted-foreground">
              Drawings
            </p>

            <p className="text-2xl font-bold">
              0
            </p>
          </div>

          <Button
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>

          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Generate PDF
          </Button>

        </div>

      </CardContent>
    </Card>
  );
}