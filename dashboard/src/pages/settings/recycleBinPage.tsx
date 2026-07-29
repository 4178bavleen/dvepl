import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArchiveRestore,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiClient } from '@/services/axios';
import { useERPStore } from '@/store/erpStore';

export interface RecycleBinItem {
  id: string;
  module: string;
  moduleLabel?: string;
  name: string;
  deletedBy: string;
  deletedAt: string;
  originalData?: any;
}

interface RecycleBinModule {
  module: string;
  label: string;
}

export function RecycleBinPage() {
  const store = useERPStore();
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [modules, setModules] = useState<RecycleBinModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'restore' | 'delete' | 'empty' | 'bulkRestore' | 'bulkDelete'>('delete');
  const [targetItem, setTargetItem] = useState<RecycleBinItem | null>(null);

  // Fetch soft-deleted records from backend Recycle Bin API
  const fetchRecycleBin = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/recycle-bin/list');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      const availableModules = Array.isArray(res.data?.modules) ? res.data.modules : [];
      const formatted: RecycleBinItem[] = list.map((item: any) => ({
        id: item.id,
        module: item.module,
        moduleLabel: item.moduleLabel,
        name: item.name,
        deletedBy: item.deletedBy || 'Admin',
        deletedAt: item.deletedAt ? new Date(item.deletedAt).toLocaleString() : new Date().toLocaleString(),
      }));
      setModules(availableModules);
      setItems(formatted);
    } catch (err: any) {
      console.error('Failed to load recycle bin records', err);
      toast.error('Failed to fetch recycle bin items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecycleBin();
  }, []);

  // Filtered dataset
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.module.toLowerCase().includes(q) ||
        item.deletedBy.toLowerCase().includes(q);

      const matchesModule = moduleFilter === 'all' || item.module === moduleFilter;

      return matchesSearch && matchesModule;
    });
  }, [items, searchQuery, moduleFilter]);

  // Paginated dataset
  const totalPages = Math.ceil(filteredItems.length / rowsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, currentPage, rowsPerPage]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedItems.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  // Restore single item via backend API
  const performRestore = async (item: RecycleBinItem) => {
    try {
      await apiClient.post(`/recycle-bin/restore/${item.module}/${item.id}`);
      toast.success(`Restored "${item.name}" successfully`);
      fetchRecycleBin();
    } catch (err: any) {
      toast.error(`Failed to restore ${item.name}`);
    }
  };

  // Permanent Delete single item via backend API
  const performPermanentDelete = async (item: RecycleBinItem) => {
    try {
      await apiClient.delete(`/recycle-bin/permanent-delete/${item.module}/${item.id}`);
      toast.success(`Permanently deleted "${item.name}"`);
      fetchRecycleBin();
    } catch (err: any) {
      toast.error(`Failed to delete ${item.name}`);
    }
  };

  // Bulk actions
  const handleBulkRestore = async () => {
    const selectedItems = items.filter((i) => selectedIds.includes(i.id));
    for (const item of selectedItems) {
      await performRestore(item);
    }
    setSelectedIds([]);
    setConfirmModalOpen(false);
  };

  const handleBulkPermanentDelete = async () => {
    const selectedItems = items.filter((i) => selectedIds.includes(i.id));
    for (const item of selectedItems) {
      await performPermanentDelete(item);
    }
    setSelectedIds([]);
    setConfirmModalOpen(false);
  };

  const handleEmptyBin = async () => {
    for (const item of items) {
      await performPermanentDelete(item);
    }
    setSelectedIds([]);
    setConfirmModalOpen(false);
  };

  const handleConfirmAction = () => {
    if (modalAction === 'restore' && targetItem) {
      performRestore(targetItem);
    } else if (modalAction === 'delete' && targetItem) {
      performPermanentDelete(targetItem);
    } else if (modalAction === 'bulkRestore') {
      handleBulkRestore();
    } else if (modalAction === 'bulkDelete') {
      handleBulkPermanentDelete();
    } else if (modalAction === 'empty') {
      handleEmptyBin();
    }
    setConfirmModalOpen(false);
  };

  const getModuleBadge = (module: string, moduleLabel?: string) => {
    const label = moduleLabel || modules.find((item) => item.module === module)?.label || module;

    return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{label}</span>;
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Trash2 className="h-7 w-7 text-rose-600" /> Recycle Bin
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Deleted items from all modules. Restore soft-deleted items or permanently remove them.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecycleBin}
            disabled={loading}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-2xs"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={items.length === 0}
            onClick={() => {
              setModalAction('empty');
              setConfirmModalOpen(true);
            }}
            className="h-9 px-4 text-xs font-bold rounded-xl shadow-2xs"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Empty Recycle Bin
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search deleted records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">MODULE:</span>
              <Select value={moduleFilter} onValueChange={(val) => setModuleFilter(val || 'all')}>
                <SelectTrigger className="w-40 h-9 text-xs rounded-xl border-slate-200">
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules.map((item) => (
                    <SelectItem key={item.module} value={item.module}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Bulk Actions Floating Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl shadow-2xs text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <span>{selectedIds.length} item(s) selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-100 rounded-lg"
                onClick={() => {
                  setModalAction('bulkRestore');
                  setConfirmModalOpen(true);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Restore Selected
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 text-xs font-bold rounded-lg"
                onClick={() => {
                  setModalAction('bulkDelete');
                  setConfirmModalOpen(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Permanently
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-slate-600 hover:bg-slate-200/50 rounded-lg"
                onClick={() => setSelectedIds([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/90 text-slate-800 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedItems.length > 0 && selectedIds.length === paginatedItems.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3">MODULE</th>
                <th className="py-3.5 px-3">NAME / TITLE</th>
                <th className="py-3.5 px-3">DELETED BY</th>
                <th className="py-3.5 px-3">DELETED AT</th>
                <th className="py-3.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Loading recycle bin records...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Recycle bin is empty. No deleted records found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/90 transition-all duration-150 ${isChecked ? 'bg-emerald-50/30' : ''}`}>
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                          className="rounded border-slate-300 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-3">{getModuleBadge(item.module, item.moduleLabel)}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900 max-w-sm truncate" title={item.name}>
                        {item.name}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700">{item.deletedBy}</td>
                      <td className="py-3.5 px-3 font-mono text-slate-500 text-[11px]">{item.deletedAt}</td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg px-2.5"
                            onClick={() => {
                              setTargetItem(item);
                              setModalAction('restore');
                              setConfirmModalOpen(true);
                            }}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg px-2.5"
                            onClick={() => {
                              setTargetItem(item);
                              setModalAction('delete');
                              setConfirmModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select value={String(rowsPerPage)} onValueChange={(val) => setRowsPerPage(Number(val))}>
              <SelectTrigger className="w-16 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Showing {filteredItems.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, filteredItems.length)} of {filteredItems.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {modalAction === 'restore' || modalAction === 'bulkRestore'
                ? 'Confirm Restoration'
                : modalAction === 'empty'
                ? 'Empty Recycle Bin'
                : 'Confirm Permanent Deletion'}
            </DialogTitle>
            <p className="text-xs text-slate-600 leading-relaxed">
              {modalAction === 'restore'
                ? `Are you sure you want to restore "${targetItem?.name}" back to active module records?`
                : modalAction === 'bulkRestore'
                ? `Are you sure you want to restore ${selectedIds.length} selected items back to active module records?`
                : modalAction === 'delete'
                ? `Are you sure you want to permanently delete "${targetItem?.name}"? This action CANNOT be undone.`
                : modalAction === 'bulkDelete'
                ? `Are you sure you want to permanently delete ${selectedIds.length} selected items? This action CANNOT be undone.`
                : 'Are you sure you want to permanently empty the entire Recycle Bin? All deleted items will be lost forever.'}
            </p>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setConfirmModalOpen(false)} className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-200">
              Cancel
            </Button>
            <Button
              size="sm"
              variant={modalAction.toLowerCase().includes('restore') ? 'default' : 'destructive'}
              onClick={handleConfirmAction}
              className={`h-9 px-5 text-xs font-bold rounded-xl shadow-xs ${
                modalAction.toLowerCase().includes('restore') ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
              }`}
            >
              {modalAction.toLowerCase().includes('restore') ? 'Restore Item(s)' : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RecycleBinPage;
