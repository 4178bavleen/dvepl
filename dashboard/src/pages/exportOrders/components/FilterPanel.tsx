import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Filters } from "../ExportOrdersPage";

interface Props {
  filters: Filters;
  setFilters: (f: Filters) => void;
  onSearch: () => void;
}

export default function FilterPanel({ filters, setFilters, onSearch }: Props) {
  const set = (key: keyof Filters) => (value: string) =>
    setFilters({ ...filters, [key]: value });

  const handleClear = () =>
    setFilters({
      soNo: "",
      customer: "",
      status: "all",
      assignedEngineer: "",
      startDate: "",
      endDate: "",
    });

  const hasActive =
    filters.soNo ||
    filters.customer ||
    (filters.status && filters.status !== "all") ||
    filters.assignedEngineer ||
    filters.startDate ||
    filters.endDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Orders</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <Input
            placeholder="Sales Order No"
            value={filters.soNo}
            onChange={(e) => set("soNo")(e.target.value)}
          />

          <Input
            placeholder="Customer"
            value={filters.customer}
            onChange={(e) => set("customer")(e.target.value)}
          />

          <Select value={filters.status} onValueChange={(val) => set("status")(val ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Assigned Engineer"
            value={filters.assignedEngineer}
            onChange={(e) => set("assignedEngineer")(e.target.value)}
          />

          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => set("startDate")(e.target.value)}
          />

          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => set("endDate")(e.target.value)}
          />
        </div>

        <div className="flex justify-end mt-6 gap-3">
          {hasActive && (
            <Button variant="outline" className="gap-2" onClick={handleClear}>
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
          <Button className="gap-2" onClick={onSearch}>
            <Search className="w-4 h-4" />
            Preview Orders
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}