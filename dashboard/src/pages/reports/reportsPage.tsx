import React, { useState, useEffect, useMemo } from "react";
import { 
  FileSpreadsheet, 
  Calendar, 
  User, 
  DollarSign, 
  Truck, 
  Layers, 
  Loader2, 
  FileText, 
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { reportsApi } from "@/services/modules";
import { apiClient } from "@/services/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Types
interface ReportTab {
  id: string;
  name: string;
  roles: string[];
  icon: any;
}

const reportTabs: ReportTab[] = [
  { id: "customer", name: "Customer-wise", roles: ["admin", "sales", "accounts"], icon: User },
  { id: "datewise", name: "Date-wise", roles: ["admin", "sales", "accounts"], icon: Calendar },
  { id: "salesperson", name: "Salesperson-wise", roles: ["admin", "sales"], icon: User },
  { id: "finance", name: "Finance", roles: ["admin", "accounts"], icon: DollarSign },
  { id: "procurement", name: "Procurement", roles: ["admin", "procurement"], icon: Layers },
  { id: "delivery", name: "Delivery", roles: ["admin", "sales", "project", "production"], icon: Truck }
];

export default function ReportsPage() {
  const [userRole, setUserRole] = useState<string>("admin");
  const [currentReport, setCurrentReport] = useState<string>("customer");
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Report Results States
  const [reportRan, setReportRan] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    revenue: 0,
    completed: 0,
    pending: 0
  });

  // Fetch active user profile
  useEffect(() => {
    const initPage = async () => {
      setIsLoading(true);
      try {
        const profileRes = await apiClient.get("/auth/profile").catch(() => null);
        if (profileRes?.data?.success) {
          const role = profileRes.data.data?.role?.name?.toLowerCase() || "admin";
          setUserRole(role);
        }
      } catch (err: any) {
        toast.error("Failed to load initial reports configuration.");
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
  }, []);

  // Filter tabs based on role
  const visibleTabs = useMemo(() => {
    return reportTabs.filter(tab => tab.roles.includes(userRole));
  }, [userRole]);

  // Set the first visible tab active when role changes
  useEffect(() => {
    if (visibleTabs.length > 0) {
      setCurrentReport(visibleTabs[0].id);
    }
  }, [visibleTabs]);

  // Format Currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      style: "currency",
      currency: "INR"
    });
  };

  const formatShortCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    }
    return formatCurrency(amount);
  };

  // Run Report Logic (Delegated to Backend API)
  const handleRunReport = async () => {
    setIsRunning(true);
    try {
      const res = await reportsApi.getReport(
        currentReport, 
        fromDate || undefined, 
        toDate || undefined
      );

      if (res && res.success) {
        setSummaryStats(res.summary);
        setReportData(res.data || []);
        setReportRan(true);
        toast.success(res.message || "Report updated successfully from server.");
      } else {
        toast.error(res?.message || "Failed to process report.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error computing report calculations.");
    } finally {
      setIsRunning(false);
    }
  };

  // Export PDF Logic
  const handleExportPDF = () => {
    if (reportData.length === 0) {
      toast.error("No report data available to export. Run a report first.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" }) as any;
    const title = reportTabs.find(t => t.id === currentReport)?.name || "Report";

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title + " Report", 14, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Generated At: " + new Date().toLocaleString("en-IN"), 14, 20);

    const headers = getTableHeaders();
    const rows = getTableRows();

    autoTable(doc, {
      startY: 26,
      head: [headers],
      body: rows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [244, 250, 248] },
      margin: { left: 14, right: 14 }
    });

    doc.save(title.replace(/\s+/g, "_") + "_Report.pdf");
    toast.success("PDF exported successfully.");
  };

  // Helpers for table mappings
  const getTableHeaders = (): string[] => {
    switch (currentReport) {
      case "customer":
        return ["#", "Customer", "Orders Count", "Pending", "Completed", "Revenue"];
      case "datewise":
        return ["#", "Date", "Orders Count", "Revenue"];
      case "salesperson":
        return ["#", "Salesperson", "Orders Count", "Completed", "Revenue"];
      case "finance":
        return ["#", "DVEPL Code", "Customer", "Items", "Total", "Paid Amount", "Balance", "Status"];
      case "procurement":
        return ["#", "DVEPL Code", "Customer", "Order Place To", "PO Number", "Material Status", "PO Date"];
      case "delivery":
        return ["#", "DVEPL Code", "Customer", "Item", "Order Date", "Delivery Target", "Complete Date", "Status"];
      default:
        return [];
    }
  };

  const getTableRows = (): any[][] => {
    return reportData.map((r, i) => {
      switch (currentReport) {
        case "customer":
          return [i + 1, r.name, r.count, r.pending, r.completed, formatCurrency(r.revenue)];
        case "datewise":
          return [i + 1, r.date, r.count, formatCurrency(r.revenue)];
        case "salesperson":
          return [i + 1, r.name, r.count, r.completed, formatCurrency(r.revenue)];
        case "finance":
          return [
            i + 1,
            r.dveplCode,
            r.customerName,
            r.items,
            formatCurrency(r.total),
            formatCurrency(r.paid),
            formatCurrency(r.balance),
            r.status
          ];
        case "procurement":
          return [i + 1, r.dveplCode, r.customerName, r.orderPlaceTo, r.poNumber, r.materialStatus, r.poDate];
        case "delivery":
          return [i + 1, r.dveplCode, r.customerName, r.item, r.orderDate, r.deliveryTarget, r.completeDate, r.status];
        default:
          return [];
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 bg-background overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileSpreadsheet className="size-6 text-primary" /> Reports & Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate, review, and export business summaries, delivery performance, and finance analytics.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 p-2 bg-muted/40 border rounded-xl">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentReport(tab.id);
                setReportRan(false);
                setReportData([]);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "bg-background border text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Icon className="size-3.5" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="h-9 text-xs w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="h-9 text-xs w-40"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleRunReport}
              disabled={isRunning || isLoading}
              size="sm"
              className="h-9 text-xs font-semibold gap-1.5"
            >
              {isRunning ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <TrendingUp className="size-3.5" />
              )}
              Run Report
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              disabled={!reportRan || reportData.length === 0}
              size="sm"
              className="h-9 text-xs font-semibold gap-1.5 border-teal-200 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20"
            >
              <FileText className="size-3.5" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats Row */}
      {reportRan && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-2xl border bg-card p-5 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Orders</p>
              <h3 className="text-xl font-bold text-foreground mt-1">{summaryStats.total}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Matched date range</p>
            </div>
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="size-5" />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Matched Revenue</p>
              <h3 className="text-xl font-bold text-foreground mt-1">{formatShortCurrency(summaryStats.revenue)}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Grand total amount</p>
            </div>
            <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-600">
              <DollarSign className="size-5" />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Completed</p>
              <h3 className="text-xl font-bold text-foreground mt-1 text-emerald-600 dark:text-emerald-400">{summaryStats.completed}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Successful orders</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Pending</p>
              <h3 className="text-xl font-bold text-foreground mt-1 text-amber-500">{summaryStats.pending}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Orders in-progress</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle className="size-5" />
            </div>
          </div>
        </div>
      )}

      {/* Reports Table Wrapper */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-sm font-bold text-foreground">
            {reportTabs.find(t => t.id === currentReport)?.name} Report Details
          </h3>
          <span className="text-xs text-muted-foreground">
            {reportData.length} records found
          </span>
        </div>

        <div className="relative overflow-x-auto border rounded-xl bg-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/80 text-xs font-semibold text-muted-foreground">
                {getTableHeaders().map((h, i) => (
                  <th key={i} className={`py-3 px-4 ${h.includes("Revenue") || h.includes("Total") || h.includes("Amount") || h.includes("Balance") ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading dynamic report data...
                  </td>
                </tr>
              ) : !reportRan ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-muted-foreground">
                    Select a report type, adjust filters, and click <strong className="text-foreground">Run Report</strong> to view details.
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-muted-foreground">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                getTableRows().map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/20 transition-colors text-xs">
                    {row.map((cell, cIdx) => {
                      const headerName = getTableHeaders()[cIdx];
                      const isNumeric = headerName.includes("Revenue") || headerName.includes("Total") || headerName.includes("Amount") || headerName.includes("Balance");

                      return (
                        <td
                          key={cIdx}
                          className={`py-3.5 px-4 text-foreground ${
                            isNumeric
                              ? "text-right font-semibold text-teal-600 dark:text-teal-400 font-mono"
                              : ""
                          }`}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
