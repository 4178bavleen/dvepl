import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Calendar, 
  CreditCard,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { financePaymentApi } from "@/services/modules";

interface FinanceOrder {
  id: string;
  dveplCode: string;
  customerName: string;
  vendorName: string;
  orderDate: string;
  totalAmount: number;
  received: number;
  balance: number;
  status: "pending" | "in-progress" | "completed" | "on-hold";
  paymentCount: number;
}

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<FinanceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterVendor, setFilterVendor] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load orders from API
  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await financePaymentApi.getOrders({ limit: 500 });
      if (res && res.success) {
        setOrders(res.data || []);
      } else {
        toast.error(res?.message || "Failed to load finance orders.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error loading finance data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Reset to page 1 whenever filters/pageSize change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterPayment, filterVendor, pageSize]);

  // Derive Dynamic Vendors list
  const vendorsList = useMemo(() => {
    return Array.from(new Set(orders.map((o) => o.vendorName).filter(Boolean)));
  }, [orders]);

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.dveplCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus ? o.status === filterStatus : true;
      const matchesVendor = filterVendor ? o.vendorName === filterVendor : true;
      let matchesPayment = true;
      if (filterPayment === "unpaid") matchesPayment = o.received === 0;
      else if (filterPayment === "partial") matchesPayment = o.received > 0 && o.balance > 0;
      else if (filterPayment === "paid") matchesPayment = o.balance === 0;
      return matchesSearch && matchesStatus && matchesVendor && matchesPayment;
    });
  }, [orders, searchQuery, filterStatus, filterVendor, filterPayment]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Summary Stats (always across all orders)
  const stats = useMemo(() => {
    let revenue = 0, received = 0, outstanding = 0, overdueCount = 0;
    orders.forEach((o) => {
      revenue += o.totalAmount;
      received += o.received;
      outstanding += o.balance;
      if (o.status === "completed" && o.balance > 0) overdueCount++;
    });
    return { revenue, received, outstanding, overdueCount };
  }, [orders]);

  const formatCurrency = (val: number) =>
    val.toLocaleString("en-IN", { maximumFractionDigits: 0, style: "currency", currency: "INR" });

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 bg-background overflow-y-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">💰 Finance Manager</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor client billing values, payment history, and collection statistics.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadOrders} className="h-9 text-xs gap-1.5">
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl border bg-card p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Revenue</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{formatCurrency(stats.revenue)}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">All orders combined</p>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary"><DollarSign className="size-5" /></div>
        </div>
        <div className="rounded-2xl border bg-card p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Received</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(stats.received)}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Payments collected</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="size-5" /></div>
        </div>
        <div className="rounded-2xl border bg-card p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Outstanding</p>
            <h3 className="text-xl font-bold text-rose-500 mt-1">{formatCurrency(stats.outstanding)}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Balance remaining</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600"><AlertTriangle className="size-5" /></div>
        </div>
        <div className="rounded-2xl border bg-card p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Overdue (Completed)</p>
            <h3 className="text-xl font-bold text-amber-500 mt-1">{stats.overdueCount}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Completed but unpaid</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500"><Calendar className="size-5" /></div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="rounded-xl border bg-card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold text-muted-foreground">Search:</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input type="text" placeholder="Customer / DVEPL Code..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-9 text-xs w-48" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold text-muted-foreground">Status:</Label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-2.5 border rounded-lg text-xs bg-background text-foreground outline-none">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold text-muted-foreground">Payment:</Label>
          <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}
            className="h-9 px-2.5 border rounded-lg text-xs bg-background text-foreground outline-none">
            <option value="">All Payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Fully Paid</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold text-muted-foreground">Vendor:</Label>
          <select value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)}
            className="h-9 px-2.5 border rounded-lg text-xs bg-background text-foreground outline-none">
            <option value="">All Vendors</option>
            {vendorsList.map((v) => (<option key={v} value={v}>{v}</option>))}
          </select>
        </div>
      </div>

      {/* Finance Table */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-sm font-bold text-foreground">Order-wise Finance Details</h3>
        </div>
        <div className="relative overflow-x-auto border rounded-xl bg-card">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border/80 text-xs font-semibold text-muted-foreground">
                <th className="py-3 px-4 text-center">#</th>
                <th className="py-3 px-4">DVEPL Code</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Received</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="size-4 animate-spin inline mr-2" /> Loading finance data...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted-foreground">
                    No matching finance orders found.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((ord, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const percentCollected = ord.totalAmount > 0 ? (ord.received / ord.totalAmount) * 100 : 0;
                  const isFullyPaid = ord.balance === 0;
                  return (
                    <tr key={ord.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 text-center text-muted-foreground font-medium">{globalIdx}</td>
                      <td className="py-3.5 px-4 font-semibold text-primary">{ord.dveplCode}</td>
                      <td className="py-3.5 px-4 font-medium">{ord.customerName}</td>
                      <td className="py-3.5 px-4 text-muted-foreground">{ord.vendorName}</td>
                      <td className="py-3.5 px-4">{ord.orderDate}</td>
                      <td className="py-3.5 px-4 text-right font-semibold font-mono">{formatCurrency(ord.totalAmount)}</td>
                      <td className="py-3.5 px-4 text-right font-semibold font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(ord.received)}</td>
                      <td className={`py-3.5 px-4 text-right font-semibold font-mono ${isFullyPaid ? "text-emerald-500" : "text-rose-500"}`}>
                        {isFullyPaid
                          ? <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded">Paid</span>
                          : formatCurrency(ord.balance)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden border">
                            <div className={`h-full rounded-full transition-all ${isFullyPaid ? "bg-emerald-500" : "bg-primary"}`}
                              style={{ width: `${percentCollected}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-muted-foreground">{percentCollected.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          ord.status === "completed" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : ord.status === "in-progress" ? "bg-primary/10 text-primary"
                            : ord.status === "on-hold" ? "bg-amber-500/10 text-amber-600"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {ord.status.replace("-", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Button variant="outline" size="sm"
                          onClick={() => navigate(`/finance/history/${ord.id}`)}
                          className="h-7 text-[10px] font-bold gap-1 px-2 hover:bg-primary hover:text-white">
                          <CreditCard className="size-3" /> Payments
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls — same pattern as other pages */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="text-xs bg-card border border-border text-foreground px-2 py-1.5 rounded-md outline-none"
              >
                {[5, 10, 20].map((size) => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
