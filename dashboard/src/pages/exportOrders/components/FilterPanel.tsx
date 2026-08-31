import { Search, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import type { Filters } from "../ExportOrdersPage";

interface Props {
  filters: Filters;
  setFilters: (f: Filters) => void;
  onSearch: () => void;
  open: boolean;
  setOpen: (o: boolean) => void;
}

export default function FilterPanel({ filters, setFilters, onSearch, open, setOpen }: Props) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
      setOpen(false);
    }
  };

  const handleSearch = () => {
    onSearch();
    setOpen(false);
  };

  const hasActive =
    filters.soNo ||
    filters.customer ||
    (filters.status && filters.status !== "all") ||
    filters.assignedEngineer ||
    filters.startDate ||
    filters.endDate;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <SheetTitle>Filter Orders</SheetTitle>
          </div>
          <SheetDescription>
            Narrow down the sales orders by number, customer, status, or date.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Sales Order No
            </label>
            <Input
              placeholder="e.g. SO-00123"
              value={filters.soNo}
              onChange={(e) => set("soNo")(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Customer
            </label>
            <Input
              placeholder="Customer name"
              value={filters.customer}
              onChange={(e) => set("customer")(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <Select
              value={filters.status}
              onValueChange={(val) => set("status")(val ?? "all")}
            >
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
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Assigned Engineer
            </label>
            <Input
              placeholder="Engineer name"
              value={filters.assignedEngineer}
              onChange={(e) => set("assignedEngineer")(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => set("startDate")(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                End Date
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => set("endDate")(e.target.value)}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="border-t pt-4">
          {hasActive && (
            <Button variant="outline" className="gap-2" onClick={handleClear}>
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
          <Button className="gap-2" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Preview Orders
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
