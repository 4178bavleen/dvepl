import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  VisibilityState,
  RowSelectionState
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  SlidersHorizontal,
  ArrowUpDown,
  Loader2
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useERPStore } from '@/store/erpStore';
import { translations } from '@/constants/translations';
import { cn } from '@/utils/helpers';

// =========================================================
// STYLED PRESENTATIONAL TABLE COMPONENTS
// =========================================================

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-x-auto" data-slot="table-container">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  )
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

// =========================================================
// MAIN GENERIC TABLE COMPONENT
// =========================================================

interface GenericTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  onView?: (row: TData) => void;
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  bulkActions?: (selectedRows: TData[]) => React.ReactNode;
  isLoading?: boolean;
}

export function GenericTable<TData extends { id: string }>({
  columns,
  data,
  onView,
  onEdit,
  onDelete,
  bulkActions,
  isLoading = false
}: GenericTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const store = useERPStore();

  const t = (key: string) => {
    return key;
  };

  // Append selection checkbox column if bulk actions exist
  const tableColumns = React.useMemo(() => {
    const cols = columns.map(col => {
      if (typeof col.header === 'string') {
        return {
          ...col,
          header: t(col.header)
        };
      }
      return col;
    });
    
    if (bulkActions) {
      cols.unshift({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={(table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'mixed')) as any}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      });
    }

    // Append action column if handlers exist
    if (onView || onEdit || onDelete) {
      cols.push({
        id: 'actions',
        header: t('Actions'),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-1.5 justify-center">
              {onView && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(item);
                  }}
                  className="h-8 px-2.5 hover:bg-primary/10 hover:text-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">{t('Overview')}</span>
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  className="h-8 px-2.5 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">{t('Edit')}</span>
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  className="h-8 px-2.5 hover:bg-destructive/10 text-destructive hover:bg-destructive/15 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">{t('Delete')}</span>
                </Button>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      });
    }

    return cols;
  }, [columns, onView, onEdit, onDelete, bulkActions, store.language]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && bulkActions && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-medium transition-all duration-300">
              <span>{selectedRows.length} selected</span>
              <div className="h-4 w-px bg-primary/20 mx-1" />
              {bulkActions(selectedRows)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Column Visibility Selector */}
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsColumnsOpen(!isColumnsOpen)}
              className="h-8 gap-2 border border-border text-xs px-3 py-1.5 flex items-center justify-center rounded-md hover:bg-muted transition-colors font-medium cursor-pointer outline-none bg-card text-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{t('Columns')}</span>
            </Button>
            {isColumnsOpen && (
              <>
                {/* Overlay to close on click outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsColumnsOpen(false)}
                />
                <div className="absolute right-0 top-9.5 z-50 w-[180px] bg-popover border border-border shadow-md rounded-lg p-2.5 space-y-1.5 text-popover-foreground">
                  <div className="px-1 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t('Toggle Columns')}
                  </div>
                  <div className="h-px bg-border my-1" />
                  <div className="max-h-[220px] overflow-y-auto space-y-0.5">
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => {
                        return (
                          <div
                            key={column.id}
                            onClick={() => column.toggleVisibility(!column.getIsVisible())}
                            className="flex items-center justify-between text-xs py-1.5 px-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                          >
                            <span className="capitalize">{t(column.id)}</span>
                            <Checkbox checked={column.getIsVisible()} className="h-3.5 w-3.5" />
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actual Data Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      className={cn(
                        "text-xs font-semibold py-3.5 px-4 text-muted-foreground whitespace-nowrap",
                        header.id === 'actions' && "text-center"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-48 text-center py-12">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-primary size-8" />
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold animate-pulse">Loading Records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/30 border-b border-border/40 transition-colors duration-150"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id} 
                      className={cn(
                        "py-3.5 px-4 text-sm font-normal align-middle",
                        cell.column.id === 'actions' && "text-center"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Empty State
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-32 text-center text-muted-foreground text-xs py-8">
                  No records found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      {!isLoading && data.length > 0 && (
        <div className="flex items-center justify-between py-1">
          <div className="text-xs text-muted-foreground font-normal">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              data.length
            )}{' '}
            of {data.length} records
          </div>
          <div className="flex items-center gap-2">
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="text-xs bg-card border border-border text-foreground px-2 py-1.5 rounded-md outline-none"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to render sortable column header easily
export function sortableHeader(title: string) {
  return ({ column }: { column: any }) => {
    const store = useERPStore();
    const t = (key: string) => {
      return key;
    };
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4 hover:bg-transparent hover:text-foreground text-muted-foreground font-semibold flex gap-1.5 items-center justify-start text-xs p-1"
      >
        <span>{t(title)}</span>
        <ArrowUpDown className="h-3 w-3" />
      </Button>
    );
  };
}
