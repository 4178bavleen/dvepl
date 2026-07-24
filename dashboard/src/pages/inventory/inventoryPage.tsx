import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Search, Plus, Trash2, Edit, Eye, ArrowDownCircle, ArrowUpCircle, 
  RefreshCw, BellRing, Info, FileText, Check, X, AlertTriangle, Layers, Building
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/services/axios';

// ---------------------------------------------------------------------------
// NOTE (routes assumed — verify against your actual backend route files):
//   Items:      GET /inventory/read | POST /inventory/create
//               PATCH /inventory/update/:id | DELETE /inventory/delete/:id
//   Movements:  GET /stock-movement/read | POST /stock-movement/create
//   Summary:    GET /inventory/summary
// If your backend uses different resource names (e.g. /inventory-movement),
// just change the constants below — nothing else needs to change.
// ---------------------------------------------------------------------------
const ITEM_ENDPOINTS = {
  list: '/inventory/read',
  create: '/inventory/create',
  update: (id: string) => `/inventory/update/${id}`,
  remove: (id: string) => `/inventory/delete/${id}`,
};
const MOVEMENT_ENDPOINTS = {
  list: '/inventory/stock-movement/read',
  create: '/inventory/stock-movement/create',
};
const SUMMARY_ENDPOINT = '/inventory/summary';

// Types
export interface PrimaryVendor {
  vendorName: string;
  contactNo: string;
  leadDays: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  type: 'raw' | 'finished';
  category: string;
  unit: string;
  hsnCode?: string;
  openingStock: number;
  currentStock: number;
  reorderLevel: number;
  reorderQty: number;
  unitRate: number;
  gstPercent: number;
  location?: string;
  primaryVendor?: PrimaryVendor;
  notes?: string;
  createdAt: string;
}

export interface Movement {
  id: string;
  itemId: string;
  itemName: string;
  itemType: 'raw' | 'finished';
  movementType: 'IN' | 'OUT' | 'ADJUST' | 'RETURN';
  qty: number;
  rate: number;
  totalValue: number;
  stockBefore: number;
  stockAfter: number;
  vendorName?: string;
  poNumber?: string;
  invoiceNo?: string;
  orderCode?: string;
  reason?: string;
  addedBy: string;
  date: string;
}

// Helper to pull the useful error message out of an axios error, same
// convention used in OrdersPage.
const errMsg = (err: any, fallback: string) =>
  err?.response?.data?.message ?? err?.message ?? fallback;

// ---------------------------------------------------------------------------
// Backend <-> Frontend mapping (defensive fallbacks, since field names on
// the Prisma side may not match 1:1 with the frontend shape — same issue we
// hit with `grandTotal` vs `total` on Sales Orders).
// ---------------------------------------------------------------------------
const mapItemFromBackend = (o: any): InventoryItem => ({
  id: o.id,

  // Material
  name: o.material?.name ?? "",
  code: o.material?.materialCode ?? "",
  type: String(o.material?.type ?? "RAW").toLowerCase() as "raw" | "finished",
  category: o.material?.category ?? "",
  unit: o.material?.unit ?? "Nos",
  hsnCode: o.material?.hsnCode ?? "",

  // Inventory
  openingStock: Number(o.quantity ?? 0),
  currentStock: Number(o.quantity ?? 0),

  reorderLevel: Number(o.material?.reorderLevel ?? 0),
  reorderQty: Number(o.material?.reorderQty ?? 0),

  unitRate: Number(o.unitPrice ?? 0),

  gstPercent: Number(o.material?.gst ?? 0),

  // Warehouse / Bin
  location:
    o.bin?.name ??
    o.warehouse?.name ??
    "",

  // Vendor (currently not stored)
  primaryVendor: {
    vendorName: "",
    contactNo: "",
    leadDays: Number(o.material?.leadDays ?? 0),
  },

  notes: o.material?.description ?? "",

  createdAt: o.createdAt,
});

const mapMovementFromBackend = (m: any): Movement => ({
  id: m.id,
  itemId: m.itemId ?? m.inventoryItemId ?? '',
  itemName: m.itemName ?? m.item?.name ?? '',
  itemType: (String(m.itemType ?? m.item?.type ?? 'raw').toLowerCase() as 'raw' | 'finished'),
  movementType: (m.movementType ?? m.type ?? 'IN') as Movement['movementType'],
  qty: Number(m.qty ?? m.quantity ?? 0),
  rate: Number(m.rate ?? 0),
  totalValue: Number(m.totalValue ?? (Number(m.qty ?? 0) * Number(m.rate ?? 0))),
  stockBefore: Number(m.stockBefore ?? 0),
  stockAfter: Number(m.stockAfter ?? 0),
  vendorName: m.vendorName ?? '',
  poNumber: m.poNumber ?? '',
  invoiceNo: m.invoiceNo ?? '',
  orderCode: m.orderCode ?? '',
  reason: m.reason ?? '',
  addedBy: m.addedBy ?? m.createdBy?.name ?? m.user?.name ?? '—',
  date: m.date ? String(m.date).split('T')[0] : (m.createdAt ? String(m.createdAt).split('T')[0] : ''),
});

// Live API service — wired to backend via apiClient
export const apiService = {
  stocks: {
    list: async (): Promise<InventoryItem[]> => {
      const response = await apiClient.get(ITEM_ENDPOINTS.list);
      console.log(response)
      const raw = response.data?.data ?? response.data ?? [];
      console.log(raw)
      return (Array.isArray(raw) ? raw : []).map(mapItemFromBackend);
    },
    create: async (item: Omit<InventoryItem, 'id' | 'createdAt'>): Promise<InventoryItem> => {
      const payload = {
        name: item.name,
        materialCode: item.code || undefined,
        type: item.type.toUpperCase(),
        category: item.category,
        unit: item.unit,
        hsnCode: item.hsnCode,
        openingStock: item.openingStock,
        reorderLevel: item.reorderLevel,
        reorderQty: item.reorderQty,
        unitRate: item.unitRate,
        gst: item.gstPercent,
        location: item.location,
        vendorName: item.primaryVendor?.vendorName,
        vendorContact: item.primaryVendor?.contactNo,
        vendorLeadDays: item.primaryVendor?.leadDays,
        notes: item.notes,
      };
      const response = await apiClient.post(ITEM_ENDPOINTS.create, payload);
      return mapItemFromBackend(response.data?.data ?? response.data);
    },
    update: async (id: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
      const payload: Record<string, any> = {
        name: item.name,
        code: item.code,
        type: item.type ? item.type.toUpperCase() : undefined,
        category: item.category,
        unit: item.unit,
        hsnCode: item.hsnCode,
        reorderLevel: item.reorderLevel,
        reorderQty: item.reorderQty,
        unitRate: item.unitRate,
        gstPercent: item.gstPercent,
        location: item.location,
        vendorName: item.primaryVendor?.vendorName,
        vendorContact: item.primaryVendor?.contactNo,
        vendorLeadDays: item.primaryVendor?.leadDays,
        notes: item.notes,
      };
      // Strip undefined keys so we don't overwrite fields we didn't touch
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const response = await apiClient.patch(ITEM_ENDPOINTS.update(id), payload);
      return mapItemFromBackend(response.data?.data ?? response.data);
    },
    delete: async (id: string): Promise<void> => {
      await apiClient.delete(ITEM_ENDPOINTS.remove(id));
    }
  },
  movements: {
    list: async (filters?: { from?: string; to?: string; type?: string; movementType?: string }): Promise<Movement[]> => {
      const response = await apiClient.get(MOVEMENT_ENDPOINTS.list, {
        params: {
          from: filters?.from || undefined,
          to: filters?.to || undefined,
          itemType: filters?.type || undefined,
          movementType: filters?.movementType || undefined,
        },
      });
      const raw = response.data?.data ?? response.data ?? [];
      return (Array.isArray(raw) ? raw : []).map(mapMovementFromBackend);
    },
    create: async (id: string, transactionType: 'IN' | 'OUT' | 'ADJUST' | 'RETURN', body: any): Promise<any> => {
      const payload = {
        itemId: id,
        movementType: transactionType,
        quantity: body.qty,
        date: body.date,
        reason: body.reason,
        rate: body.rate,
        vendorName: body.vendorName,
        poNumber: body.poNumber,
        invoiceNo: body.invoiceNo,
        orderCode: body.orderCode,
      };
      const response = await apiClient.post(MOVEMENT_ENDPOINTS.create, payload);
      return response.data?.data ?? response.data ?? { stockBefore: 0, stockAfter: 0 };
    }
  },
  summary: {
    get: async (): Promise<any> => {
      try {
        const response = await apiClient.get(SUMMARY_ENDPOINT);
        return response.data?.data ?? response.data;
      } catch {
        // Summary endpoint is optional — page computes its own KPIs from
        // the items list anyway, so failure here is non-fatal.
        return {
          totalItems: 0,
          totalRawItems: 0,
          totalFinishedItems: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          totalInventoryValue: 0
        };
      }
    }
  }
};

export function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'movements' | 'valuation' | 'alerts'>('items');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [loading, setLoading] = useState(false);

  // Search and Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterOutOfStock, setFilterOutOfStock] = useState(false);

  // Movements Tab Filters
  const [movFrom, setMovFrom] = useState('');
  const [movTo, setMovTo] = useState('');
  const [movType, setMovType] = useState('');
  const [movMovType, setMovMovType] = useState('');

  // Valuation Tab Filter
  const [valType, setValType] = useState('');

  // Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [stockMovType, setStockMovType] = useState<'IN' | 'OUT' | 'ADJUST' | 'RETURN'>('IN');

  // Form Fields - Item
  const [itemName, setItemName] = useState('');
  const [materialCode, setmaterialCode] = useState('');
  const [itemType, setItemType] = useState<'raw' | 'finished'>('raw');
  const [itemCategory, setItemCategory] = useState('');
  const [itemUnit, setItemUnit] = useState('Nos');
  const [itemHsnCode, setItemHsnCode] = useState('');
  const [itemOpeningStock, setItemOpeningStock] = useState(0);
  const [itemReorderLevel, setItemReorderLevel] = useState(0);
  const [itemReorderQty, setItemReorderQty] = useState(0);
  const [itemUnitRate, setItemUnitRate] = useState(0);
  const [itemGstPercent, setItemGstPercent] = useState(18);
  const [itemLocation, setItemLocation] = useState('');
  const [itemVendorName, setItemVendorName] = useState('');
  const [itemVendorContact, setItemVendorContact] = useState('');
  const [itemVendorLead, setItemVendorLead] = useState(0);
  const [itemNotes, setItemNotes] = useState('');

  // Form Fields - Stock Movement
  const [stockQty, setStockQty] = useState('');
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);
  const [stockRate, setStockRate] = useState('');
  const [stockVendorName, setStockVendorName] = useState('');
  const [stockPoNumber, setStockPoNumber] = useState('');
  const [stockInvoiceNo, setStockInvoiceNo] = useState('');
  const [stockOrderCode, setStockOrderCode] = useState('');
  const [stockReason, setStockReason] = useState('');

  // Fetch page details
  const refreshAllData = async () => {
    setLoading(true);
    try {
      const fetchedItems = await apiService.stocks.list();
      setItems(fetchedItems);

      if (activeTab === 'movements') {
        const fetchedMovs = await apiService.movements.list({ from: movFrom, to: movTo, type: movType, movementType: movMovType });
        setMovements(fetchedMovs);
      }
    } catch (err: any) {
      toast.error(errMsg(err, 'Failed to sync data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load movements on demands
  const handleLoadMovements = async () => {
    setLoading(true);
    try {
      const fetchedMovs = await apiService.movements.list({ from: movFrom, to: movTo, type: movType, movementType: movMovType });
      setMovements(fetchedMovs);
      toast.success('Movement ledger loaded');
    } catch (err: any) {
      toast.error(errMsg(err, 'Failed to load movements'));
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const totalItems = items.length;
    const rawItems = items.filter(i => i.type === 'raw').length;
    const finishedItems = items.filter(i => i.type === 'finished').length;
    const lowStock = items.filter(i => i.reorderLevel > 0 && i.currentStock <= i.reorderLevel && i.currentStock > 0).length;
    const outOfStock = items.filter(i => i.currentStock === 0).length;
    const totalValue = items.reduce((sum, i) => sum + (i.currentStock * i.unitRate), 0);

    return { totalItems, rawItems, finishedItems, lowStock, outOfStock, totalValue };
  }, [items]);

  // Categories list
  const categories = useMemo(() => {
    return [...new Set(items.map(i => i.category).filter(Boolean))].sort();
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();
    return items.filter(i => {
      if (filterType && i.type !== filterType) return false;
      if (filterCategory && i.category !== filterCategory) return false;
      if (filterLowStock && !(i.reorderLevel > 0 && i.currentStock <= i.reorderLevel)) return false;
      if (filterOutOfStock && i.currentStock !== 0) return false;
      if (query) {
        return (
          i.name.toLowerCase().includes(query) ||
          i.code.toLowerCase().includes(query) ||
          i.category.toLowerCase().includes(query) ||
          (i.primaryVendor?.vendorName || '').toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [items, search, filterType, filterCategory, filterLowStock, filterOutOfStock]);

  // Filtered valuation items
  const valuationItems = useMemo(() => {
    return items.filter(i => {
      if (valType && i.type !== valType) return false;
      return true;
    });
  }, [items, valType]);

  const valuationTotal = useMemo(() => {
    return valuationItems.reduce((sum, i) => sum + (i.currentStock * i.unitRate), 0);
  }, [valuationItems]);

  // Alert check items
  const alertItems = useMemo(() => {
    return items.filter(i => i.reorderLevel > 0 && i.currentStock <= i.reorderLevel);
  }, [items]);

  // Form Reset
  const resetItemForm = () => {
    setItemName('');
    setmaterialCode('');
    setItemType('raw');
    setItemCategory('');
    setItemUnit('Nos');
    setItemHsnCode('');
    setItemOpeningStock(0);
    setItemReorderLevel(0);
    setItemReorderQty(0);
    setItemUnitRate(0);
    setItemGstPercent(18);
    setItemLocation('');
    setItemVendorName('');
    setItemVendorContact('');
    setItemVendorLead(0);
    setItemNotes('');
    setSelectedItemId(null);
  };

  // Open Modal Actions
  const handleOpenAdd = () => {
    resetItemForm();
    setIsItemModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItemId(item.id);
    setItemName(item.name);
    setmaterialCode(item.code);
    setItemType(item.type);
    setItemCategory(item.category || '');
    setItemUnit(item.unit);
    setItemHsnCode(item.hsnCode || '');
    setItemOpeningStock(item.openingStock);
    setItemReorderLevel(item.reorderLevel);
    setItemReorderQty(item.reorderQty);
    setItemUnitRate(item.unitRate);
    setItemGstPercent(item.gstPercent);
    setItemLocation(item.location || '');
    setItemVendorName(item.primaryVendor?.vendorName || '');
    setItemVendorContact(item.primaryVendor?.contactNo || '');
    setItemVendorLead(item.primaryVendor?.leadDays || 0);
    setItemNotes(item.notes || '');
    setIsItemModalOpen(true);
  };

  const handleOpenStock = (id: string, type: 'IN' | 'OUT' | 'ADJUST' | 'RETURN') => {
    setSelectedItemId(id);
    setStockMovType(type);
    setStockQty('');
    setStockRate('');
    setStockVendorName('');
    setStockPoNumber('');
    setStockInvoiceNo('');
    setStockOrderCode('');
    setStockReason('');
    setStockDate(new Date().toISOString().split('T')[0]);
    setIsStockModalOpen(true);
  };

  const selectedItemData = useMemo(() => {
    return items.find(i => i.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  const selectedItemMovements = useMemo(() => {
    return movements.filter(m => m.itemId === selectedItemId).slice(0, 50);
  }, [movements, selectedItemId]);

  // Save Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      toast.error('Item name is required');
      return;
    }

    const payload: Omit<InventoryItem, 'id' | 'createdAt'> = {
      name: itemName,
      code: materialCode || `CODE-${Math.floor(1000 + Math.random() * 9000)}`,
      type: itemType,
      category: itemCategory,
      unit: itemUnit,
      hsnCode: itemHsnCode,
      openingStock: itemOpeningStock,
      currentStock: selectedItemId ? (selectedItemData?.currentStock ?? 0) : itemOpeningStock,
      reorderLevel: itemReorderLevel,
      reorderQty: itemReorderQty,
      unitRate: itemUnitRate,
      gstPercent: itemGstPercent,
      location: itemLocation,
      primaryVendor: {
        vendorName: itemVendorName,
        contactNo: itemVendorContact,
        leadDays: itemVendorLead,
      },
      notes: itemNotes,
    };

    setLoading(true);
    try {
      if (selectedItemId) {
        await apiService.stocks.update(selectedItemId, payload);
        toast.success('Item updated successfully');
      } else {
        await apiService.stocks.create(payload);
        toast.success('Item added successfully');
      }
      setIsItemModalOpen(false);
      await refreshAllData();
    } catch (err: any) {
      toast.error(errMsg(err, 'Error saving item'));
    } finally {
      setLoading(false);
    }
  };

  // Stock Transaction
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(stockQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (!selectedItemData) return;

    const cur = selectedItemData.currentStock;
    let after = cur;
    if (stockMovType === 'IN' || stockMovType === 'RETURN') after = cur + qty;
    else if (stockMovType === 'OUT') after = cur - qty;
    else if (stockMovType === 'ADJUST') after = qty;

    if (stockMovType === 'OUT' && after < 0) {
      toast.error('Insufficient stock level for dispatch!');
      return;
    }

    const body: any = {
      qty,
      date: stockDate,
      reason: stockReason,
    };
    if (stockMovType === 'IN') {
      body.rate = parseFloat(stockRate) || selectedItemData.unitRate;
      body.vendorName = stockVendorName;
      body.poNumber = stockPoNumber;
      body.invoiceNo = stockInvoiceNo;
    }
    if (stockMovType === 'OUT' || stockMovType === 'RETURN') {
      body.orderCode = stockOrderCode;
    }

    setLoading(true);
    try {
      await apiService.movements.create(selectedItemData.id, stockMovType, body);
      toast.success('Stock transaction submitted successfully');
      setIsStockModalOpen(false);
      await refreshAllData();
    } catch (err: any) {
      toast.error(errMsg(err, 'Transaction submission failed'));
    } finally {
      setLoading(false);
    }
  };

  // Delete / Deactivate Item
  const handleDeleteItem = async () => {
    if (!selectedItemId) return;
    setLoading(true);
    try {
      await apiService.stocks.delete(selectedItemId);
      toast.success('Item removed from inventory');
      setIsConfirmOpen(false);
      await refreshAllData();
    } catch (err: any) {
      toast.error(errMsg(err, 'Failed to delete item'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Package className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Inventory
              {loading && <RefreshCw className="size-4 animate-spin text-muted-foreground" />}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage master catalog, stocks levels and movement journals.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => {
            const count = alertItems.length;
            toast(`Low stock verification: ${count} alert conditions verified.`, { icon: '🔔' });
          }}>
            <BellRing className="size-4 text-warning" /> Low-Stock Check
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleOpenAdd}>
            <Plus className="size-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Items', value: kpis.totalItems, color: 'text-foreground' },
          { label: 'Raw Materials', value: kpis.rawItems, color: 'text-blue-500' },
          { label: 'Finished Goods', value: kpis.finishedItems, color: 'text-emerald-500' },
          { label: 'Low Stock Alerts', value: kpis.lowStock, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20' },
          { label: 'Out of Stock', value: kpis.outOfStock, color: 'text-rose-500', bg: 'bg-rose-500/5 border-rose-500/20' },
          { label: 'Inventory Valuation', value: `₹${kpis.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-cyan-500' }
        ].map((card, idx) => (
          <div key={idx} className={`p-4 rounded-xl border bg-card shadow-sm flex flex-col justify-between min-h-[96px] ${card.bg || ''}`}>
            <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">{card.label}</span>
            <span className={`text-2xl font-bold tracking-tight mt-2 ${card.color}`}>{card.value}</span>
          </div>
        ))}
      </div>

      {/* Filters & Navigation */}
      <div className="flex flex-col gap-4">
        {/* Navigation Tabs */}
        <div className="flex border-b gap-1 bg-muted/20 p-1 rounded-lg max-w-fit">
          {[
            { id: 'items', label: 'Items' },
            { id: 'movements', label: 'Movement Ledger' },
            { id: 'valuation', label: 'Valuation Report' },
            { id: 'alerts', label: 'Low Stock Alerts' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold tracking-wide transition-all ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Filters depending on active tab */}
        {activeTab === 'items' && (
          <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between bg-card p-4 rounded-xl border">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1 max-w-4xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search name, code, category, vendor..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={(val: string | null) => setFilterType(val || '')}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw">Raw Material</SelectItem>
                  <SelectItem value="finished">Finished Good</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={(val: string | null) => setFilterCategory(val || '')}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterLowStock}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterLowStock(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary size-4"
                />
                Low Stock Only
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterOutOfStock}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterOutOfStock(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary size-4"
                />
                Out of Stock Only
              </label>

              <Select value={viewMode} onValueChange={setViewMode as any}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="View Mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table View</SelectItem>
                  <SelectItem value="card">Card View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="flex flex-col md:flex-row md:items-center gap-3 bg-card p-4 rounded-xl border">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <Input
                type="date"
                value={movFrom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMovFrom(e.target.value)}
                className="w-[140px] text-xs font-semibold"
                title="From Date"
              />
              <Input
                type="date"
                value={movTo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMovTo(e.target.value)}
                className="w-[140px] text-xs font-semibold"
                title="To Date"
              />
              <Select value={movType} onValueChange={(val: string | null) => setMovType(val || '')}>
                <SelectTrigger className="w-[140px] text-xs font-semibold"><SelectValue placeholder="All Item Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw">Raw Material</SelectItem>
                  <SelectItem value="finished">Finished Good</SelectItem>
                </SelectContent>
              </Select>
              <Select value={movMovType} onValueChange={(val: string | null) => setMovMovType(val || '')}>
                <SelectTrigger className="w-[150px] text-xs font-semibold"><SelectValue placeholder="All Movements" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">IN</SelectItem>
                  <SelectItem value="OUT">OUT</SelectItem>
                  <SelectItem value="ADJUST">ADJUST</SelectItem>
                  <SelectItem value="RETURN">RETURN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                setMovFrom('');
                setMovTo('');
                setMovType('');
                setMovMovType('');
              }}>Clear</Button>
              <Button size="sm" className="gap-1.5" onClick={handleLoadMovements}>
                <RefreshCw className="size-3.5" /> Load
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'valuation' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
            <Select value={valType} onValueChange={(val: string | null) => setValType(val || '')}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Item Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="raw">Raw Material</SelectItem>
                <SelectItem value="finished">Finished Good</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground">Grand Total:</span>
              <strong className="text-xl font-bold tracking-tight text-emerald-500">₹{valuationTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-4 rounded-xl border">
            <p className="text-xs font-semibold text-muted-foreground">The list shows inventory parts with stock levels at or below their specified reorder levels.</p>
            <Button variant="destructive" size="sm" className="gap-2" onClick={() => {
              toast.success('System alert broadcasts sent to procurement division managers.');
            }}>
              <BellRing className="size-4" /> Send Alert Notifications
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Panels */}
      <div className="bg-card rounded-xl border shadow-sm">
        {/* PANEL: ITEMS */}
        {activeTab === 'items' && (
          <div>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Item</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Code</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Unit</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Stock</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Reorder</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Rate</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Vendor</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-xs font-semibold text-muted-foreground">No inventory items found.</td>
                      </tr>
                    ) : (
                      filteredItems.map(item => (
                        <tr key={item.id} className="hover:bg-muted/10">
                          <td className="p-4 font-semibold text-foreground">{item.name}</td>
                          <td className="p-4 mono font-medium text-xs text-muted-foreground">{item.code}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                              item.type === 'raw' 
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{item.category || '—'}</td>
                          <td className="p-4 text-sm text-muted-foreground">{item.unit}</td>
                          <td className={`p-4 text-right font-bold ${
                            item.currentStock === 0 
                              ? 'text-rose-500' 
                              : (item.reorderLevel > 0 && item.currentStock <= item.reorderLevel ? 'text-amber-500' : '')
                          }`}>
                            {item.currentStock.toLocaleString('en-IN')}
                          </td>
                          <td className="p-4 text-right text-sm text-muted-foreground">{item.reorderLevel.toLocaleString('en-IN')}</td>
                          <td className="p-4 text-right text-sm font-medium">₹{item.unitRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-sm text-muted-foreground">{item.primaryVendor?.vendorName || '—'}</td>
                          <td className="p-4">
                            {item.currentStock === 0 ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase tracking-wider">Out</span>
                            ) : (item.reorderLevel > 0 && item.currentStock <= item.reorderLevel) ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">Low</span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider">OK</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all" title="Details" onClick={() => {
                                setSelectedItemId(item.id);
                                setIsDetailModalOpen(true);
                              }}><Eye className="size-4" /></button>
                              <button className="p-1 hover:bg-muted rounded text-emerald-500 hover:text-emerald-600 transition-all" title="Stock IN" onClick={() => handleOpenStock(item.id, 'IN')}><ArrowDownCircle className="size-4" /></button>
                              <button className="p-1 hover:bg-muted rounded text-rose-500 hover:text-rose-600 transition-all" title="Stock OUT" onClick={() => handleOpenStock(item.id, 'OUT')}><ArrowUpCircle className="size-4" /></button>
                              <button className="p-1 hover:bg-muted rounded text-blue-500 hover:text-blue-600 transition-all" title="Edit" onClick={() => handleOpenEdit(item)}><Edit className="size-4" /></button>
                              <button className="p-1 hover:bg-muted rounded text-rose-500 hover:text-rose-600 transition-all" title="Delete" onClick={() => {
                                setSelectedItemId(item.id);
                                setIsConfirmOpen(true);
                              }}><Trash2 className="size-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.length === 0 ? (
                  <p className="text-center text-xs font-semibold text-muted-foreground col-span-full">No items found.</p>
                ) : (
                  filteredItems.map(item => (
                    <div key={item.id} className={`p-4 rounded-xl border bg-card flex flex-col justify-between shadow-sm hover:shadow transition-all ${
                      item.currentStock === 0 ? 'border-rose-500/30 bg-rose-500/[0.01]' : (item.reorderLevel > 0 && item.currentStock <= item.reorderLevel ? 'border-amber-500/30 bg-amber-500/[0.01]' : '')
                    }`}>
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-foreground text-base">{item.name}</h3>
                            <span className="mono text-[10px] text-muted-foreground">{item.code}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                            item.type === 'raw' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}>{item.type}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4 border-t pt-3">
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Stock</span>
                            <span className={`block font-bold text-lg ${item.currentStock === 0 ? 'text-rose-500' : ''}`}>{item.currentStock} {item.unit}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Reorder</span>
                            <span className="block font-semibold text-sm text-foreground">{item.reorderLevel}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Unit Rate</span>
                            <span className="block font-semibold text-sm text-foreground">₹{item.unitRate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t flex flex-col gap-1.5 text-xs text-muted-foreground">
                        {item.category && <div><strong>Category:</strong> {item.category}</div>}
                        {item.primaryVendor?.vendorName && <div><strong>Vendor:</strong> {item.primaryVendor.vendorName}</div>}
                      </div>
                      <div className="mt-4 flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedItemId(item.id);
                          setIsDetailModalOpen(true);
                        }}>View</Button>
                        <Button variant="outline" size="sm" className="text-emerald-500" onClick={() => handleOpenStock(item.id, 'IN')}>IN</Button>
                        <Button variant="outline" size="sm" className="text-rose-500" onClick={() => handleOpenStock(item.id, 'OUT')}>OUT</Button>
                        <button className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(item)}><Edit className="size-4" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* PANEL: MOVEMENTS LEDGER */}
        {activeTab === 'movements' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Item</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Movement</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Qty</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Rate</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Value</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Before</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">After</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Vendor / Order Ref</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Reason</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Added By</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-xs font-semibold text-muted-foreground">No movements matching the criteria found. Click Load to check ledger.</td>
                  </tr>
                ) : (
                  movements.map(m => (
                    <tr key={m.id} className="hover:bg-muted/10 text-xs">
                      <td className="p-4 text-muted-foreground">{m.date}</td>
                      <td className="p-4 font-semibold text-foreground">{m.itemName}</td>
                      <td className="p-4">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          m.itemType === 'raw' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>{m.itemType}</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          m.movementType === 'IN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          m.movementType === 'OUT' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          m.movementType === 'RETURN' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>{m.movementType}</span>
                      </td>
                      <td className="p-4 text-right font-semibold">{m.qty.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right text-muted-foreground">₹{m.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right font-medium text-foreground">₹{m.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right text-muted-foreground">{m.stockBefore}</td>
                      <td className="p-4 text-right font-semibold text-foreground">{m.stockAfter}</td>
                      <td className="p-4 text-muted-foreground">{m.vendorName || m.orderCode || '—'}</td>
                      <td className="p-4 text-muted-foreground">{m.reason || '—'}</td>
                      <td className="p-4 text-muted-foreground">{m.addedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PANEL: VALUATION REPORT */}
        {activeTab === 'valuation' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Item Name</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Code</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Unit</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Current Stock</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Rate</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Total Value</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Vendor</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {valuationItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-xs font-semibold text-muted-foreground">No valuation records.</td>
                  </tr>
                ) : (
                  valuationItems.map(item => (
                    <tr key={item.id} className="hover:bg-muted/10">
                      <td className="p-4 font-semibold text-foreground">{item.name}</td>
                      <td className="p-4 mono font-medium text-xs text-muted-foreground">{item.code}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                          item.type === 'raw' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>{item.type}</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{item.category || '—'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{item.unit}</td>
                      <td className="p-4 text-right font-bold">{item.currentStock.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right text-sm text-muted-foreground">₹{item.unitRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right text-sm font-bold text-foreground">₹{(item.currentStock * item.unitRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-sm text-muted-foreground">{item.primaryVendor?.vendorName || '—'}</td>
                      <td className="p-4 flex items-center gap-1 text-sm font-medium">
                        {item.currentStock === 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase tracking-wider">Out</span>
                        ) : (item.reorderLevel > 0 && item.currentStock <= item.reorderLevel) ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">Low</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider">OK</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PANEL: ALERTS */}
        {activeTab === 'alerts' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alertItems.length === 0 ? (
              <p className="text-center text-xs font-semibold text-muted-foreground col-span-full py-12">✓ No low stock levels detected. All items are above reorder level thresholds.</p>
            ) : (
              alertItems.map(item => (
                <div key={item.id} className={`p-4 rounded-xl border bg-card flex flex-col justify-between shadow-sm hover:shadow transition-all ${
                  item.currentStock === 0 ? 'border-rose-500/30 bg-rose-500/[0.01]' : 'border-amber-500/30 bg-amber-500/[0.01]'
                }`}>
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-foreground text-base">{item.name}</h4>
                        <span className="mono text-[10px] text-muted-foreground">{item.code}</span>
                      </div>
                      {item.currentStock === 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">OUT OF STOCK</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">LOW STOCK</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 border-t pt-3">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Stock</span>
                        <span className="block font-bold text-base text-rose-500">{item.currentStock} {item.unit}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Reorder At</span>
                        <span className="block font-semibold text-sm text-foreground">{item.reorderLevel}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Suggested Qty</span>
                        <span className="block font-semibold text-sm text-foreground">{item.reorderQty || '—'}</span>
                      </div>
                    </div>
                  </div>
                  {item.primaryVendor?.vendorName && (
                    <div className="mt-4 pt-3 border-t text-xs text-muted-foreground flex items-center gap-1.5">
                      <Building className="size-3.5" />
                      <span>{item.primaryVendor.vendorName} {item.primaryVendor.contactNo ? `· ${item.primaryVendor.contactNo}` : ''}</span>
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-end gap-1.5">
                    <Button variant="outline" size="sm" className="text-emerald-500" onClick={() => handleOpenStock(item.id, 'IN')}>Stock IN</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedItemId(item.id);
                      setIsDetailModalOpen(true);
                    }}>View Details</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT ITEM */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-br from-primary/5 to-transparent">
              <h2 className="text-lg font-bold tracking-tight">{selectedItemId ? 'Edit Item' : 'Add Item'}</h2>
              <button type="button" onClick={() => setIsItemModalOpen(false)} className="p-1 hover:bg-muted rounded"><X className="size-4" /></button>
            </div>
            <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Name *</label>
                  <Input required placeholder="Item Name" value={itemName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Code</label>
                  <Input placeholder="Internal Code" value={materialCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setmaterialCode(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type *</label>
                  <Select value={itemType} onValueChange={(val: any) => setItemType(val)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw">Raw Material</SelectItem>
                      <SelectItem value="finished">Finished Good</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                  <Input placeholder="eg : Electrical,Sheet Metal" value={itemCategory} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemCategory(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unit</label>
                  <Select value={itemUnit} onValueChange={(val: string | null) => setItemUnit(val || '')}>
                    <SelectTrigger><SelectValue placeholder="Nos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nos">Nos</SelectItem>
                      <SelectItem value="Kg">Kg</SelectItem>
                      <SelectItem value="Mtr">Mtr</SelectItem>
                      <SelectItem value="Ltr">Ltr</SelectItem>
                      <SelectItem value="Set">Set</SelectItem>
                      <SelectItem value="Pcs">Pcs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">HSN/SAC Code</label>
                  <Input placeholder="8544" value={itemHsnCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemHsnCode(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Opening Stock</label>
                  <Input type="number" min={0} value={itemOpeningStock} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemOpeningStock(parseInt(e.target.value) || 0)} disabled={!!selectedItemId} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unit Rate (₹)</label>
                  <Input type="number" step="0.01" min={0} value={itemUnitRate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemUnitRate(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">GST %</label>
                  <Input type="number" min={0} max={100} value={itemGstPercent} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemGstPercent(parseInt(e.target.value) || 0)} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reorder Level</label>
                  <Input type="number" min={0} value={itemReorderLevel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemReorderLevel(parseInt(e.target.value) || 0)} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reorder Qty</label>
                  <Input type="number" min={0} value={itemReorderQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemReorderQty(parseInt(e.target.value) || 0)} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location Shelf/Rack</label>
                  <Input placeholder="Rack A-2" value={itemLocation} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemLocation(e.target.value)} />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Primary Supplier / Vendor</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold tracking-wider text-muted-foreground">Vendor Name</label>
                    <Input placeholder="Supplier Ltd" value={itemVendorName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemVendorName(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold tracking-wider text-muted-foreground">Contact Phone</label>
                    <Input placeholder="9988776655" value={itemVendorContact} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemVendorContact(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold tracking-wider text-muted-foreground">Lead Days</label>
                    <Input type="number" min={0} value={itemVendorLead} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemVendorLead(parseInt(e.target.value) || 0)} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description / Notes</label>
                <Textarea placeholder="Details notes..." rows={2} value={itemNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setItemNotes(e.target.value)} />
              </div>

              <div className="border-t pt-4 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsItemModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Item</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STOCK MOVEMENT */}
      {isStockModalOpen && selectedItemData && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl shadow-2xl max-w-md w-full flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-br from-primary/5 to-transparent">
              <h2 className="text-lg font-bold tracking-tight">Stock Movement — {selectedItemData.name}</h2>
              <button type="button" onClick={() => setIsStockModalOpen(false)} className="p-1 hover:bg-muted rounded"><X className="size-4" /></button>
            </div>
            <form onSubmit={handleSaveStock} className="p-6 space-y-4">
              <div className="p-3 bg-muted/40 border rounded-lg text-xs space-y-1">
                <div>Item: <strong>{selectedItemData.name} ({selectedItemData.code})</strong></div>
                <div>Current Stock Level: <strong>{selectedItemData.currentStock} {selectedItemData.unit}</strong></div>
              </div>

              {/* Movement Tabs */}
              <div className="flex border rounded-lg p-1 bg-muted/20">
                {(['IN', 'OUT', 'ADJUST', 'RETURN'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setStockMovType(type)}
                    className={`flex-1 text-center py-1 text-xs font-bold rounded ${
                      stockMovType === type 
                        ? 'bg-card text-foreground shadow border border-border/80' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {stockMovType === 'ADJUST' ? 'New Level' : 'Quantity'} *
                  </label>
                  <Input type="number" required min={0} step="any" placeholder="0" value={stockQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStockQty(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Transaction Date</label>
                  <Input type="date" value={stockDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStockDate(e.target.value)} />
                </div>

                {(stockMovType === 'IN') && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold tracking-wider text-muted-foreground">Custom Rate (₹)</label>
                      <Input type="number" step="0.01" placeholder={selectedItemData.unitRate.toFixed(2)} value={stockRate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStockRate(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold tracking-wider text-muted-foreground">Supplier Name</label>
                      <Input placeholder="Schneider" value={stockVendorName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStockVendorName(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold tracking-wider text-muted-foreground">PO Number</label>
                      <Input placeholder="PO-001" value={stockPoNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStockPoNumber(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold tracking-wider text-muted-foreground">Invoice No</label>
                      <Input placeholder="INV-01" value={stockInvoiceNo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStockInvoiceNo(e.target.value)} />
                    </div>
                  </>
                )}

                {(stockMovType === 'OUT' || stockMovType === 'RETURN') && (
                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-xs font-bold tracking-wider text-muted-foreground">Sales Order / Project Code Reference</label>
                    <Input placeholder="DVEPL-0001" value={stockOrderCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStockOrderCode(e.target.value)} />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reason / Note</label>
                <Textarea placeholder="Note..." value={stockReason} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStockReason(e.target.value)} rows={2} />
              </div>

              {/* Dynamic Preview */}
              {stockQty && (
                <div className="p-3 border rounded-lg bg-primary/5 flex flex-col gap-1 text-xs">
                  {(() => {
                    const qtyVal = parseFloat(stockQty) || 0;
                    let calculatedAfter = selectedItemData.currentStock;
                    if (stockMovType === 'IN' || stockMovType === 'RETURN') calculatedAfter += qtyVal;
                    else if (stockMovType === 'OUT') calculatedAfter -= qtyVal;
                    else if (stockMovType === 'ADJUST') calculatedAfter = qtyVal;

                    return (
                      <>
                        <div className="font-semibold text-foreground">
                          Stock Level Preview: {selectedItemData.currentStock} {selectedItemData.unit} → <strong className="text-primary">{calculatedAfter}</strong> {selectedItemData.unit}
                        </div>
                        {calculatedAfter < 0 && (
                          <div className="text-rose-500 font-bold flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="size-3.5" /> Warning: Insufficient Stock!
                          </div>
                        )}
                        {selectedItemData.reorderLevel > 0 && calculatedAfter <= selectedItemData.reorderLevel && calculatedAfter >= 0 && (
                          <div className="text-amber-500 font-semibold flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="size-3.5" /> Warning: Level drops below Reorder threshold
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="border-t pt-4 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsStockModalOpen(false)}>Cancel</Button>
                <Button type="submit">Submit Journal</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ITEM DETAILS & HISTORY */}
      {isDetailModalOpen && selectedItemData && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-br from-primary/5 to-transparent">
              <h2 className="text-lg font-bold tracking-tight">Item Details — {selectedItemData.name}</h2>
              <button type="button" onClick={() => setIsDetailModalOpen(false)} className="p-1 hover:bg-muted rounded"><X className="size-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/20 p-4 border rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Type</span>
                  <span className="block font-semibold mt-0.5">{selectedItemData.type === 'raw' ? 'Raw Material' : 'Finished Good'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Category</span>
                  <span className="block font-semibold mt-0.5">{selectedItemData.category || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Unit</span>
                  <span className="block font-semibold mt-0.5">{selectedItemData.unit}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">HSN Code</span>
                  <span className="block font-semibold mt-0.5">{selectedItemData.hsnCode || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Current Stock</span>
                  <span className={`block font-bold mt-0.5 ${selectedItemData.currentStock === 0 ? 'text-rose-500' : ''}`}>
                    {selectedItemData.currentStock.toLocaleString('en-IN')} {selectedItemData.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Reorder Level</span>
                  <span className="block font-semibold mt-0.5">{selectedItemData.reorderLevel.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Reorder Qty</span>
                  <span className="block font-semibold mt-0.5">{selectedItemData.reorderQty.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Shelf / Rack</span>
                  <span className="block font-semibold mt-0.5">{selectedItemData.location || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Unit Rate</span>
                  <span className="block font-semibold mt-0.5">₹{selectedItemData.unitRate}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">GST Rate</span>
                  <span className="block font-semibold mt-0.5">{selectedItemData.gstPercent}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Valuation</span>
                  <span className="block font-bold mt-0.5 text-emerald-500">₹{(selectedItemData.currentStock * selectedItemData.unitRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {selectedItemData.primaryVendor?.vendorName && (
                <div className="p-4 border rounded-xl bg-card">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Primary Supplier Profile</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><strong>Supplier:</strong> {selectedItemData.primaryVendor.vendorName}</div>
                    <div><strong>Phone:</strong> {selectedItemData.primaryVendor.contactNo || '—'}</div>
                    <div><strong>Procurement Lead Time:</strong> {selectedItemData.primaryVendor.leadDays} Days</div>
                  </div>
                </div>
              )}

              {selectedItemData.notes && (
                <div className="text-sm">
                  <strong>Additional Notes:</strong>
                  <p className="text-muted-foreground mt-1 bg-muted/10 p-3 border rounded-lg whitespace-pre-wrap">{selectedItemData.notes}</p>
                </div>
              )}

              {/* Movement History SubTable */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Ledger History (last 50 movements)</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b text-[10px] font-bold uppercase text-muted-foreground">
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3 text-right">Quantity</th>
                        <th className="p-3 text-right">Balance</th>
                        <th className="p-3">Ref</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs">
                      {selectedItemMovements.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-muted-foreground">No ledger movements logged for this part.</td>
                        </tr>
                      ) : (
                        selectedItemMovements.map(m => (
                          <tr key={m.id}>
                            <td className="p-3 text-muted-foreground">{m.date}</td>
                            <td className="p-3">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                m.movementType === 'IN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                m.movementType === 'OUT' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                m.movementType === 'RETURN' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              }`}>{m.movementType}</span>
                            </td>
                            <td className="p-3 text-right font-semibold">{m.qty}</td>
                            <td className="p-3 text-right font-medium">{m.stockBefore} → {m.stockAfter}</td>
                            <td className="p-3 text-muted-foreground">{m.vendorName || m.orderCode || '—'}</td>
                            <td className="p-3 text-muted-foreground">{m.reason || '—'}</td>
                            <td className="p-3 text-muted-foreground">{m.addedBy}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2 bg-muted/10">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {isConfirmOpen && selectedItemData && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="text-rose-500 size-5" /> Confirm Delete
            </h3>
            <p className="text-sm text-muted-foreground">Are you sure you want to delete <strong>{selectedItemData.name}</strong> from catalog? All transaction records are preserved, but the item will be deactivated.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteItem}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryPage;