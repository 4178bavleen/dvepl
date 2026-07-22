import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Building2, Search, Plus, Trash2, Edit, Eye, Clock, FileText, X, Check, Copy, Trash, Maximize2, Minimize2, Save, Sparkles, AlertCircle
} from 'lucide-react';
import { GenericTable, sortableHeader } from '@/components/tables/GenericTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'react-hot-toast';
import { crmApi } from '@/services/modules';
import '@/styles/vendors.css';

// Interfaces
interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstNumber: string;
  address: string;
  notes: string;
  createdAt: string;
}

interface POItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  hsnCode: string;
  catNo: string;
  rate: number;
  discountPercent: number;
  net: number;
  total: number;
  [key: string]: any; // Custom fields
}

interface PORevision {
  id: string;
  vendorId: string;
  poNumber: string;
  poDate: string;
  poStatus: string;
  paymentTerms: string;
  materialStatus: string;
  advance: number;
  remarks: string;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  termsAndConditions: string;
  lineItems: POItem[];
  companyDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
    iso: string;
    signatory: string;
    division: string;
  };
  createdAt: string;
  revisionNo: number;
  customColumns?: string[];
}

const DEFAULT_COMPANY_DETAILS = {
  name: 'D.V. Electromatic Pvt. Ltd.',
  address: 'F-003, Industrial Growth Centre, Phase-III, Sector 5, Gurugram, HR',
  phone: '+91 92572-17609',
  email: 'procurement@dvepl.com',
  gstin: '03AABCD4308A1ZL',
  iso: 'AN ISO 9001:2008 CERTIFIED CO.',
  signatory: 'Gabrial Deora (Procurement Head)',
  division: 'Industrial Procurement Division'
};

const DEFAULT_TERMS = `1. Payment: 30 days net from the date of receipt and approval.
2. Goods must be accompanied by GST invoice and delivery challan.
3. All items are subject to inspection and test at our warehouse.
4. Warranty: Minimum 12 months from the date of commissioning.
5. Subject to Gurugram jurisdiction only.`;

// ==========================================
// API ADAPTERS (EASILY REPLACE WITH AXIOS/FETCH LATER)
// ==========================================
export const apiService = {
  vendors: {
    list: async (): Promise<Vendor[]> => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const saved = localStorage.getItem('dvepl_vendors');
      return saved ? JSON.parse(saved) : [];
    },
    create: async (vendor: Omit<Vendor, 'id' | 'createdAt'>): Promise<Vendor> => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const saved = localStorage.getItem('dvepl_vendors');
      const list: Vendor[] = saved ? JSON.parse(saved) : [];
      const newVendor: Vendor = {
        ...vendor,
        id: `v-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      list.unshift(newVendor);
      localStorage.setItem('dvepl_vendors', JSON.stringify(list));
      return newVendor;
    },
    update: async (id: string, vendor: Partial<Vendor>): Promise<Vendor> => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const saved = localStorage.getItem('dvepl_vendors');
      const list: Vendor[] = saved ? JSON.parse(saved) : [];
      let updatedVendor: Vendor | null = null;
      const updatedList = list.map(v => {
        if (v.id === id) {
          updatedVendor = { ...v, ...vendor };
          return updatedVendor;
        }
        return v;
      });
      localStorage.setItem('dvepl_vendors', JSON.stringify(updatedList));
      if (!updatedVendor) throw new Error('Vendor not found');
      return updatedVendor;
    },
    delete: async (id: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const saved = localStorage.getItem('dvepl_vendors');
      const list: Vendor[] = saved ? JSON.parse(saved) : [];
      const filtered = list.filter(v => v.id !== id);
      localStorage.setItem('dvepl_vendors', JSON.stringify(filtered));
    }
  },
  revisions: {
    list: async (): Promise<PORevision[]> => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const saved = localStorage.getItem('dvepl_po_revisions');
      return saved ? JSON.parse(saved) : [];
    },
    create: async (revision: PORevision): Promise<PORevision> => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const saved = localStorage.getItem('dvepl_po_revisions');
      const list: PORevision[] = saved ? JSON.parse(saved) : [];
      list.unshift(revision);
      localStorage.setItem('dvepl_po_revisions', JSON.stringify(list));
      return revision;
    },
    delete: async (id: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const saved = localStorage.getItem('dvepl_po_revisions');
      const list: PORevision[] = saved ? JSON.parse(saved) : [];
      const filtered = list.filter(r => r.id !== id);
      localStorage.setItem('dvepl_po_revisions', JSON.stringify(filtered));
    }
  }
};

export function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [revisions, setRevisions] = useState<PORevision[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [vList, rList] = await Promise.all([
        apiService.vendors.list(),
        apiService.revisions.list()
      ]);
      setVendors(vList);
      setRevisions(rList);
    } catch (err: any) {
      toast.error('Failed to sync data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // UI States
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Revisions Modal States
  const [selectedVendorForRevisions, setSelectedVendorForRevisions] = useState<Vendor | null>(null);

  // Data Entry PO States
  const [activePoVendor, setActivePoVendor] = useState<Vendor | null>(null);
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [deMaximized, setDeMaximized] = useState(false);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [newColName, setNewColName] = useState('');
  const [isAddingCol, setIsAddingCol] = useState(false);

  // Vendor Form Fields
  const [vName, setVName] = useState('');
  const [vCategory, setVCategory] = useState('');
  const [vContact, setVContact] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vGst, setVGst] = useState('');
  const [vAddress, setVAddress] = useState('');
  const [vNotes, setVNotes] = useState('');

  // PO Form Fields
  const [companyDetails, setCompanyDetails] = useState(DEFAULT_COMPANY_DETAILS);
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [poStatus, setPoStatus] = useState('Pending');
  const [paymentTerms, setPaymentTerms] = useState('30 days net');
  const [materialStatus, setMaterialStatus] = useState('Pending');
  const [advance, setAdvance] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [cgstPercent, setCgstPercent] = useState(9);
  const [sgstPercent, setSgstPercent] = useState(9);
  const [igstPercent, setIgstPercent] = useState(0);
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);

  // Filter vendors
  const filteredVendors = useMemo(() => {
    if (!search) return vendors;
    const query = search.toLowerCase();
    return vendors.filter(v =>
      v.name.toLowerCase().includes(query) ||
      v.category.toLowerCase().includes(query) ||
      v.gstNumber.toLowerCase().includes(query) ||
      v.contactPerson.toLowerCase().includes(query)
    );
  }, [vendors, search]);

  // Column definitions for GenericTable
  const tableColumns = useMemo<ColumnDef<Vendor>[]>(() => [
    {
      accessorKey: 'name',
      header: sortableHeader('Vendor Name'),
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ getValue }) => (getValue() as string) || '—',
    },
    {
      accessorKey: 'contactPerson',
      header: 'Contact Person',
      cell: ({ getValue }) => (getValue() as string) || '—',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ getValue }) => (getValue() as string) || '—',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (getValue() as string) || '—',
    },
    {
      accessorKey: 'gstNumber',
      header: 'GSTIN',
      cell: ({ getValue }) => (getValue() as string) || '—',
    },
    {
      id: 'revisions',
      header: 'Revision History',
      cell: ({ row }) => {
        const vendor = row.original;
        const count = revisions.filter(r => r.vendorId === vendor.id).length;
        return (
          <button
            onClick={() => setSelectedVendorForRevisions(vendor)}
            className="bg-[#f3f0ff] hover:bg-[#e8e3ff] text-[#5b33b5] border border-[#cbbff5] px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150"
          >
            📋 Revisions ({count})
          </button>
        );
      }
    },
    {
      id: 'dataEntry',
      header: 'Data Entry',
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <button
            onClick={() => openNewDataEntry(vendor)}
            className="bg-[#e6f4ea] hover:bg-[#d2ebd9] text-[#137333] border border-[#a8d8b2] px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150"
          >
            ＋ PO Entry
          </button>
        );
      }
    }
  ], [revisions]);

  // Form operations
  const resetVendorForm = () => {
    setEditingVendor(null);
    setVName('');
    setVCategory('');
    setVContact('');
    setVPhone('');
    setVEmail('');
    setVGst('');
    setVAddress('');
    setVNotes('');
    setIsFormOpen(false);
  };

  const openEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVName(vendor.name);
    setVCategory(vendor.category);
    setVContact(vendor.contactPerson);
    setVPhone(vendor.phone);
    setVEmail(vendor.email);
    setVGst(vendor.gstNumber);
    setVAddress(vendor.address);
    setVNotes(vendor.notes);
    setIsFormOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim()) {
      toast.error('Vendor name is required');
      return;
    }

    try {
      if (editingVendor) {
        await apiService.vendors.update(editingVendor.id, {
          name: vName,
          category: vCategory,
          contactPerson: vContact,
          phone: vPhone,
          email: vEmail,
          gstNumber: vGst,
          address: vAddress,
          notes: vNotes
        });
        toast.success('Vendor updated successfully');
      } else {
        await apiService.vendors.create({
          name: vName,
          category: vCategory,
          contactPerson: vContact,
          phone: vPhone,
          email: vEmail,
          gstNumber: vGst,
          address: vAddress,
          notes: vNotes
        });
        toast.success('New vendor registered successfully');
      }
      const list = await apiService.vendors.list();
      setVendors(list);
      resetVendorForm();
    } catch (err: any) {
      toast.error('Failed to save vendor');
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vendor? All PO revisions will be deleted.')) {
      try {
        await apiService.vendors.delete(id);
        const list = await apiService.vendors.list();
        setVendors(list);
        
        const savedRev = localStorage.getItem('dvepl_po_revisions');
        if (savedRev) {
          const revList: PORevision[] = JSON.parse(savedRev);
          const filtered = revList.filter(r => r.vendorId !== id);
          localStorage.setItem('dvepl_po_revisions', JSON.stringify(filtered));
          setRevisions(filtered);
        }
        toast.success('Vendor deleted');
      } catch (err: any) {
        toast.error('Failed to delete vendor');
      }
    }
  };

  // Revisions details
  const vendorRevisions = useMemo(() => {
    if (!selectedVendorForRevisions) return [];
    return revisions
      .filter(r => r.vendorId === selectedVendorForRevisions.id)
      .sort((a, b) => b.revisionNo - a.revisionNo);
  }, [revisions, selectedVendorForRevisions]);

  const revisionStats = useMemo(() => {
    const list = vendorRevisions;
    const totalSpent = list.reduce((sum, r) => sum + r.grandTotal, 0);
    const poCount = new Set(list.map(r => r.poNumber)).size;
    return { poCount, totalSpent, revisionCount: list.length };
  }, [vendorRevisions]);

  // PO Calculations
  const totals = useMemo(() => {
    const subtotal = poItems.reduce((sum, item) => sum + item.total, 0);
    const cgstAmt = (subtotal * cgstPercent) / 100;
    const sgstAmt = (subtotal * sgstPercent) / 100;
    const igstAmt = (subtotal * igstPercent) / 100;
    const grandTotal = subtotal + cgstAmt + sgstAmt + igstAmt;
    const balance = grandTotal - advance;

    return { subtotal, cgstAmt, sgstAmt, igstAmt, grandTotal, balance };
  }, [poItems, cgstPercent, sgstPercent, igstPercent, advance]);

  // Line item helpers
  const handleAddPoRow = () => {
    const newItem: POItem = {
      id: `row-${Date.now()}`,
      description: '',
      qty: 1,
      unit: 'Nos',
      hsnCode: '',
      catNo: '',
      rate: 0,
      discountPercent: 0,
      net: 0,
      total: 0
    };
    customColumns.forEach(c => { newItem[c] = ''; });
    setPoItems(prev => [...prev, newItem]);
  };

  const handleDuplicateLastRow = () => {
    if (poItems.length === 0) {
      toast.error('No items to duplicate. Add a row first.');
      return;
    }
    const last = poItems[poItems.length - 1];
    const duplicated: POItem = {
      ...last,
      id: `row-${Date.now()}`,
    };
    setPoItems(prev => [...prev, duplicated]);
    toast.success('Last row duplicated');
  };

  const handleClearAllRows = () => {
    if (window.confirm('Clear all line items?')) {
      setPoItems([]);
    }
  };

  const updatePoItemField = (id: string, field: string, val: any) => {
    setPoItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };

      if (field === 'qty' || field === 'rate' || field === 'discountPercent') {
        const qty = Number(updated.qty) || 0;
        const rate = Number(updated.rate) || 0;
        const disc = Number(updated.discountPercent) || 0;
        const net = rate * (1 - disc / 100);
        updated.net = net;
        updated.total = qty * net;
      }
      return updated;
    }));
  };

  const handleDeletePoRow = (id: string) => {
    setPoItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddCustomColumn = () => {
    if (!newColName.trim()) {
      toast.error('Column name is required');
      return;
    }
    const safeName = newColName.trim();
    if (customColumns.includes(safeName)) {
      toast.error('Column already exists');
      return;
    }
    setCustomColumns(prev => [...prev, safeName]);
    setPoItems(prev => prev.map(item => ({ ...item, [safeName]: '' })));
    setNewColName('');
    setIsAddingCol(false);
    toast.success(`Column "${safeName}" added`);
  };

  const handleRemoveCustomColumn = (colName: string) => {
    if (window.confirm(`Are you sure you want to remove column "${colName}"?`)) {
      setCustomColumns(prev => prev.filter(c => c !== colName));
      setPoItems(prev => prev.map(item => {
        const updated = { ...item };
        delete updated[colName];
        return updated;
      }));
      toast.success(`Column "${colName}" removed`);
    }
  };

  // Save revision
  const handleSavePoRevision = async () => {
    if (!activePoVendor) return;
    if (!poNumber.trim()) {
      toast.error('PO Number is required');
      return;
    }

    const nextRevisionNo = revisions
      .filter(r => r.vendorId === activePoVendor.id && r.poNumber === poNumber)
      .length + 1;

    const newRevision: PORevision = {
      id: `rev-${Date.now()}`,
      vendorId: activePoVendor.id,
      poNumber,
      poDate,
      poStatus,
      paymentTerms,
      materialStatus,
      advance,
      remarks,
      cgstPercent,
      sgstPercent,
      igstPercent,
      subtotal: totals.subtotal,
      cgstAmount: totals.cgstAmt,
      sgstAmount: totals.sgstAmt,
      igstAmount: totals.igstAmt,
      grandTotal: totals.grandTotal,
      termsAndConditions: terms,
      lineItems: poItems,
      companyDetails,
      createdAt: new Date().toISOString(),
      revisionNo: nextRevisionNo,
      customColumns: [...customColumns]
    };

    try {
      await apiService.revisions.create(newRevision);
      const list = await apiService.revisions.list();
      setRevisions(list);
      setSelectedRevisionId(newRevision.id);
      toast.success(`Revision v${newRevision.revisionNo} saved successfully`);
    } catch (err: any) {
      toast.error('Failed to save PO revision');
    }
  };

  // Load selected revision
  const loadRevision = (rev: PORevision) => {
    setPoNumber(rev.poNumber);
    setPoDate(rev.poDate);
    setPoStatus(rev.poStatus);
    setPaymentTerms(rev.paymentTerms);
    setMaterialStatus(rev.materialStatus);
    setAdvance(rev.advance);
    setRemarks(rev.remarks);
    setCgstPercent(rev.cgstPercent);
    setSgstPercent(rev.sgstPercent);
    setIgstPercent(rev.igstPercent);
    setTerms(rev.termsAndConditions);
    setPoItems(rev.lineItems);
    setCompanyDetails(rev.companyDetails);
    setSelectedRevisionId(rev.id);
    setCustomColumns(rev.customColumns || []);
    toast.success(`Loaded PO details from revision v${rev.revisionNo}`);
  };

  const openNewDataEntry = (vendor: Vendor) => {
    setActivePoVendor(vendor);
    setPoNumber(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setPoDate(new Date().toISOString().split('T')[0]);
    setPoStatus('Pending');
    setPaymentTerms('30 days net');
    setMaterialStatus('Pending');
    setAdvance(0);
    setRemarks('');
    setCgstPercent(9);
    setSgstPercent(9);
    setIgstPercent(0);
    setTerms(DEFAULT_TERMS);
    setPoItems([]);
    setCompanyDetails(DEFAULT_COMPANY_DETAILS);
    setSelectedRevisionId(null);
    setIsDataEntryOpen(true);
  };

  const deleteRevision = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this revision permanently?')) {
      try {
        await apiService.revisions.delete(id);
        const list = await apiService.revisions.list();
        setRevisions(list);
        if (selectedRevisionId === id) {
          setSelectedRevisionId(null);
        }
        toast.success('Revision deleted');
      } catch (err: any) {
        toast.error('Failed to delete revision');
      }
    }
  };

  const triggerExport = (format: string) => {
    if (!activePoVendor) return;

    if (format === 'pdf') {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc) {
        toast.error('Unable to create offscreen document print context.');
        return;
      }
      
      const customColsTh = customColumns.map(c => `<th>${c}</th>`).join('');
      
      const itemsHtml = poItems.map((item, idx) => {
        const customColsTd = customColumns.map(c => `<td>${item[c] || '—'}</td>`).join('');
        return `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td>${item.description || '—'}</td>
            <td style="text-align: center;">${item.qty}</td>
            <td style="text-align: center;">${item.unit}</td>
            <td>${item.hsnCode || '—'}</td>
            <td>${item.catNo || '—'}</td>
            ${customColsTd}
            <td style="text-align: right;">₹${(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td style="text-align: center;">${item.discountPercent}%</td>
            <td style="text-align: right; font-weight: bold;">₹${(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
        `;
      }).join('');
      
      doc.write(`
        <html>
          <head>
            <title>Purchase Order - ${poNumber}</title>
            <style>
              @page { size: A4; margin: 8mm; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; color: #1f2937; line-height: 1.3; font-size: 11px; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 10px; }
              .company-name { font-size: 18px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin: 0 0 4px 0; }
              .company-address { font-size: 10.5px; color: #4b5563; margin: 0 0 2px 0; max-width: 380px; }
              .po-title { font-size: 22px; font-weight: 900; color: #111827; margin: 0 0 6px 0; text-align: right; }
              .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
              .meta-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #2563eb; margin: 0 0 4px 0; letter-spacing: 0.5px; }
              .meta-body { font-size: 11px; margin: 0; color: #1f2937; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10.5px; }
              th { background-color: #f3f4f6; color: #374151; text-transform: uppercase; font-size: 9px; font-weight: 700; border: 1px solid #e5e7eb; padding: 6px 4px; text-align: left; }
              td { border: 1px solid #e5e7eb; padding: 6px 4px; }
              .totals-box { margin-top: 15px; float: right; width: 280px; font-size: 11px; }
              .totals-row { display: flex; justify-content: space-between; padding: 4px 0; color: #4b5563; }
              .grand-total { font-weight: 800; border-top: 1.5px double #111827; padding-top: 6px; font-size: 13px; color: #111827; }
              .terms-box { float: left; width: calc(100% - 310px); margin-top: 15px; font-size: 10px; color: #4b5563; }
              .sig-section { margin-top: 70px; display: flex; justify-content: space-between; clear: both; page-break-inside: avoid; }
              .sig-box { border-top: 1px solid #111827; padding-top: 6px; text-align: center; width: 180px; font-size: 11px; }
              .sig-title { font-weight: 700; color: #111827; margin: 0; }
              .sig-desc { font-size: 9px; color: #4b5563; margin: 1px 0 0 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h2 class="company-name">${companyDetails.name}</h2>
                <p class="company-address">${companyDetails.address}</p>
                <p class="company-address">Phone: ${companyDetails.phone} | Email: ${companyDetails.email}</p>
                <p class="company-address">GSTIN: ${companyDetails.gstin} | ${companyDetails.iso}</p>
                <p class="company-address">Dept: ${companyDetails.division}</p>
              </div>
              <div style="text-align: right;">
                <h1 class="po-title">PURCHASE ORDER</h1>
                <p style="margin: 0; font-size: 12px;"><strong>PO Number:</strong> ${poNumber}</p>
                <p style="margin: 2px 0 0 0; font-size: 12px;"><strong>Date:</strong> ${poDate}</p>
                <p style="margin: 2px 0 0 0; font-size: 12px;"><strong>Status:</strong> ${poStatus}</p>
              </div>
            </div>
            
            <div class="meta-grid">
              <div>
                <h3 class="meta-title">Order Placed To (Vendor):</h3>
                <div class="meta-body">
                  <p style="margin: 0 0 2px 0; font-weight: bold; font-size: 12px;">${activePoVendor.name}</p>
                  <p style="margin: 0 0 2px 0;">Category: ${activePoVendor.category}</p>
                  <p style="margin: 0 0 2px 0;">Phone: ${activePoVendor.phone} | Email: ${activePoVendor.email}</p>
                  <p style="margin: 0 0 2px 0;">GSTIN: ${activePoVendor.gstNumber}</p>
                </div>
              </div>
              <div>
                <h3 class="meta-title">Delivery & Shipping Terms:</h3>
                <div class="meta-body">
                  <p style="margin: 0 0 2px 0;"><strong>Material Status:</strong> ${materialStatus}</p>
                  <p style="margin: 0 0 2px 0;"><strong>Payment Terms:</strong> ${paymentTerms}</p>
                  <p style="margin: 0 0 2px 0;"><strong>Remarks:</strong> ${remarks || 'None'}</p>
                </div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th style="width: 35px; text-align: center;">S.No.</th>
                  <th>Item Description</th>
                  <th style="width: 45px; text-align: center;">Qty</th>
                  <th style="width: 55px; text-align: center;">Unit</th>
                  <th style="width: 75px;">HSN Code</th>
                  <th style="width: 75px;">CAT No.</th>
                  ${customColsTh}
                  <th style="width: 85px; text-align: right;">Rate</th>
                  <th style="width: 55px; text-align: center;">Dis (%)</th>
                  <th style="width: 95px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                ${poItems.length === 0 ? '<tr><td colspan="10" style="text-align: center; padding: 15px; color: #6b7280;">No items added to this purchase order.</td></tr>' : ''}
              </tbody>
            </table>
            
            <div class="terms-box">
              <h4 style="margin: 0 0 2px 0; color: #1f2937; font-size: 11px; text-transform: uppercase;">Terms & Conditions:</h4>
              <p style="margin: 0; white-space: pre-wrap; font-size: 9.5px; line-height: 1.2;">${terms}</p>
            </div>

            <div class="totals-box">
              <div class="totals-row"><span>Subtotal:</span> <span>₹${totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row"><span>CGST (${cgstPercent}%):</span> <span>₹${totals.cgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row"><span>SGST (${sgstPercent}%):</span> <span>₹${totals.sgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row"><span>IGST (${igstPercent}%):</span> <span>₹${totals.igstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row grand-total"><span>Grand Total:</span> <span>₹${totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row"><span>Advance Paid:</span> <span>₹${advance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row" style="font-weight: 700; color: #111827; border-top: 1px solid #e5e7eb; padding-top: 4px;"><span>Balance Due:</span> <span>₹${totals.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
            </div>
            
            <div class="sig-section">
              <div class="sig-box" style="border: none; text-align: left;">
                <p class="sig-desc">Prepared By: DVEPL Team</p>
              </div>
              <div class="sig-box">
                <p class="sig-title">${companyDetails.signatory}</p>
                <p class="sig-desc">Authorized Signatory</p>
              </div>
            </div>
          </body>
        </html>
      `);
      doc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
      }, 500);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      const dynamicHeight = 520 + (poItems.length * 32) + 260;
      canvas.height = Math.max(800, dynamicHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) { toast.error('Unable to create canvas context.'); return; }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1e3a8a'; ctx.font = 'bold 22px sans-serif'; ctx.fillText(companyDetails.name, 40, 60);
      ctx.fillStyle = '#4b5563'; ctx.font = '13px sans-serif';
      ctx.fillText(companyDetails.address, 40, 85);
      ctx.fillText(`Phone: ${companyDetails.phone} | Email: ${companyDetails.email}`, 40, 105);
      ctx.fillText(`GSTIN: ${companyDetails.gstin} | ${companyDetails.iso}`, 40, 125);
      ctx.fillStyle = '#111827'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('PURCHASE ORDER', 620, 60);
      ctx.font = '14px sans-serif'; ctx.fillText(`PO Number: ${poNumber}`, 620, 95); ctx.fillText(`Date: ${poDate}`, 620, 120);
      ctx.strokeStyle = '#111827'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(40, 150); ctx.lineTo(960, 150); ctx.stroke();
      ctx.fillStyle = '#2563eb'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('ORDER PLACED TO (VENDOR):', 40, 180); ctx.fillText('DELIVERY & SHIPPING TERMS:', 500, 180);
      ctx.fillStyle = '#111827'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(activePoVendor.name, 40, 205);
      ctx.font = '13px sans-serif'; ctx.fillText(`Category: ${activePoVendor.category}`, 40, 225); ctx.fillText(`Phone: ${activePoVendor.phone} | Email: ${activePoVendor.email}`, 40, 245); ctx.fillText(`GSTIN: ${activePoVendor.gstNumber}`, 40, 265);
      ctx.fillText(`Material Status: ${materialStatus}`, 500, 205); ctx.fillText(`Payment Terms: ${paymentTerms}`, 500, 225); ctx.fillText(`Remarks: ${remarks || 'None'}`, 500, 245);
      let y = 300; ctx.fillStyle = '#f3f4f6'; ctx.fillRect(40, y, 920, 32); ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.strokeRect(40, y, 920, 32);
      ctx.fillStyle = '#374151'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('S.No.', 50, y + 20); ctx.fillText('Item Description', 100, y + 20); ctx.fillText('Qty', 440, y + 20); ctx.fillText('Unit', 500, y + 20); ctx.fillText('HSN Code', 560, y + 20); ctx.fillText('CAT No.', 650, y + 20); ctx.fillText('Rate', 740, y + 20); ctx.fillText('Total', 880, y + 20);
      ctx.fillStyle = '#1f2937'; ctx.font = '13px sans-serif';
      poItems.forEach((item, idx) => { y += 32; ctx.strokeRect(40, y, 920, 32); ctx.fillText(String(idx + 1), 50, y + 20); ctx.fillText(item.description || '—', 100, y + 20); ctx.fillText(String(item.qty), 440, y + 20); ctx.fillText(item.unit || 'PCS', 500, y + 20); ctx.fillText(item.hsnCode || '—', 560, y + 20); ctx.fillText(item.catNo || '—', 650, y + 20); ctx.fillText(`₹${item.rate.toFixed(2)}`, 740, y + 20); ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#1e4620'; ctx.fillText(`₹${item.total.toFixed(2)}`, 880, y + 20); ctx.fillStyle = '#1f2937'; ctx.font = '13px sans-serif'; });
      y += 50; const rightX = 640; ctx.font = '13px sans-serif'; ctx.fillStyle = '#4b5563'; ctx.fillText('Subtotal:', rightX, y); ctx.fillStyle = '#111827'; ctx.fillText(`₹${totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 860, y);
      y += 24; ctx.fillStyle = '#4b5563'; ctx.fillText(`CGST (${cgstPercent}%):`, rightX, y); ctx.fillStyle = '#111827'; ctx.fillText(`₹${totals.cgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 860, y);
      y += 24; ctx.fillStyle = '#4b5563'; ctx.fillText(`SGST (${sgstPercent}%):`, rightX, y); ctx.fillStyle = '#111827'; ctx.fillText(`₹${totals.sgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 860, y);
      y += 24; ctx.fillStyle = '#4b5563'; ctx.fillText(`IGST (${igstPercent}%):`, rightX, y); ctx.fillStyle = '#111827'; ctx.fillText(`₹${totals.igstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 860, y);
      y += 12; ctx.strokeStyle = '#111827'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(rightX, y); ctx.lineTo(960, y); ctx.stroke();
      y += 20; ctx.fillStyle = '#111827'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('Grand Total:', rightX, y); ctx.fillStyle = '#1e4620'; ctx.fillText(`₹${totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 860, y);
      y += 24; ctx.font = '13px sans-serif'; ctx.fillStyle = '#4b5563'; ctx.fillText('Advance Paid:', rightX, y); ctx.fillStyle = '#111827'; ctx.fillText(`₹${advance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 860, y);
      y += 24; ctx.fillStyle = '#111827'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('Balance Due:', rightX, y); ctx.fillStyle = '#1e4620'; ctx.fillText(`₹${totals.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 860, y);
      ctx.fillStyle = '#1f2937'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('TERMS & CONDITIONS:', 40, y - 100); ctx.fillStyle = '#4b5563'; ctx.font = '11px sans-serif'; const termLines = terms.split('\n'); let termY = y - 80; termLines.forEach(line => { ctx.fillText(line, 40, termY); termY += 16; });
      y += 80; ctx.strokeStyle = '#111827'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(680, y); ctx.lineTo(920, y); ctx.stroke();
      y += 20; ctx.fillStyle = '#111827'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(companyDetails.signatory, 700, y); ctx.font = '11px sans-serif'; ctx.fillStyle = '#4b5563'; ctx.fillText('Authorized Signatory', 700, y + 16);
      const downloadAnchor = document.createElement('a'); downloadAnchor.setAttribute("href", canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95)); downloadAnchor.setAttribute("download", `${poNumber}.${format}`); document.body.appendChild(downloadAnchor); downloadAnchor.click(); downloadAnchor.remove();
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
            🏭
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
            <p className="mt-1 text-xs text-muted-foreground">{vendors.length} registered vendors</p>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2 bg-primary text-white font-semibold">
          + Add Vendor
        </Button>
      </div>

      {/* ── Add/Edit Vendor Form Section ── */}
      {isFormOpen && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 max-w-4xl animate-in fade-in-50 duration-200">
          <div className="border-b pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h2>
              <p className="text-xs text-muted-foreground">Enter vendor company details, GST, and contact info</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetVendorForm}>
              <X className="size-4" />
            </Button>
          </div>

          <form onSubmit={handleSaveVendor} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Vendor / Company Name *</Label>
              <Input
                value={vName}
                onChange={e => setVName(e.target.value)}
                placeholder="e.g. Acme Pvt. Ltd."
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Category</Label>
              <Input
                value={vCategory}
                onChange={e => setVCategory(e.target.value)}
                placeholder="e.g. Electrical, Mechanical"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Contact Person</Label>
              <Input
                value={vContact}
                onChange={e => setVContact(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Phone</Label>
              <Input
                value={vPhone}
                onChange={e => setVPhone(e.target.value)}
                placeholder="9876543210"
                maxLength={12}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Email</Label>
              <Input
                type="email"
                value={vEmail}
                onChange={e => setVEmail(e.target.value)}
                placeholder="vendor@company.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">GST Number</Label>
              <Input
                value={vGst}
                onChange={e => setVGst(e.target.value)}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Address</Label>
              <Input
                value={vAddress}
                onChange={e => setVAddress(e.target.value)}
                placeholder="Full address"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Notes</Label>
              <Textarea
                value={vNotes}
                onChange={e => setVNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={resetVendorForm}>Cancel</Button>
              <Button type="submit" className="bg-primary text-white">Save Vendor</Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search Bar ── */}
      <div className="flex items-center gap-2 max-w-md border rounded-xl px-3 bg-card shadow-xs focus-within:ring-1 focus-within:ring-primary">
        <Search className="size-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors by name, category, GST..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 border-none shadow-none focus-visible:ring-0 px-0"
        />
      </div>

      {/* ── Vendor Table ── */}
      <GenericTable
        columns={tableColumns}
        data={filteredVendors}
        onEdit={openEditVendor}
        onDelete={(row) => handleDeleteVendor(row.id)}
        showColumnVisibility={false}
      />

      {/* ── REVISIONS PANEL MODAL ── */}
      {selectedVendorForRevisions && (
        <div className="rev-panel-overlay" onClick={() => setSelectedVendorForRevisions(null)}>
          <div className="rev-panel" onClick={(e) => e.stopPropagation()}>

            <div className="rev-panel-header">
              <h3>📋 Revision History</h3>
              <button className="de-close-btn" onClick={() => setSelectedVendorForRevisions(null)}>✕</button>
            </div>

            {/* Vendor info */}
            <div className="rev-vinfo">
              <div className="rev-vinfo-name">{selectedVendorForRevisions.name}</div>
              <div className="rev-vinfo-sub">
                {selectedVendorForRevisions.category} &bull; GSTIN: {selectedVendorForRevisions.gstNumber}
              </div>
            </div>

            {/* Summary */}
            <div className="rev-summary">
              <div className="rev-sum-card">
                <div className="rev-sum-label">Total POs</div>
                <div className="rev-sum-val">{revisionStats.poCount}</div>
              </div>
              <div className="rev-sum-card">
                <div className="rev-sum-label">Total Spent</div>
                <div className="rev-sum-val green">₹{revisionStats.totalSpent.toLocaleString('en-IN')}</div>
              </div>
              <div className="rev-sum-card">
                <div className="rev-sum-label">Revisions</div>
                <div className="rev-sum-val" style={{ color: 'var(--primary, #3b82f6)' }}>{revisionStats.revisionCount}</div>
              </div>
            </div>

            {/* Revision list */}
            <div className="rev-panel-body">
              {vendorRevisions.map((rev) => (
                <div key={rev.id} className="rev-row">
                  <div className="rev-badge">
                    <span className="rev-badge-lbl">REV</span>
                    <span className="rev-badge-val">{rev.revisionNo}</span>
                  </div>
                  <div className="rev-info">
                    <div className="rev-label-row">
                      <span className="rev-name">{rev.poNumber}</span>
                      {rev.revisionNo === vendorRevisions[0].revisionNo ? (
                        <span className="rev-latest-badge">LATEST</span>
                      ) : (
                        <span className="rev-saved-badge">SAVED REVISION</span>
                      )}
                    </div>
                    <div className="rev-meta">
                      <span>Date: {rev.poDate}</span>
                      <span>Items: {rev.lineItems.length}</span>
                      <span>Status: {rev.poStatus}</span>
                    </div>
                    <div className="rev-amount">
                      ₹{rev.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="rev-actions">
                    <button
                      className="btn-rev-load"
                      onClick={() => {
                        loadRevision(rev);
                        setActivePoVendor(selectedVendorForRevisions);
                        setIsDataEntryOpen(true);
                        setSelectedVendorForRevisions(null);
                      }}
                    >
                      Load
                    </button>
                    <button
                      className="btn-rev-del"
                      onClick={(e) => deleteRevision(rev.id, e)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {vendorRevisions.length === 0 && (
                <div className="rev-empty">
                  <div className="rev-empty-icon">📂</div>
                  <span>No revisions found. Create a PO data entry revision first.</span>
                </div>
              )}
            </div>

            <div className="rev-panel-footer">
              <Button variant="outline" onClick={() => setSelectedVendorForRevisions(null)}>Close</Button>
              <button
                className="bg-primary text-white font-semibold hover:bg-primary/95 px-4 py-2 rounded-lg text-xs"
                onClick={() => {
                  openNewDataEntry(selectedVendorForRevisions);
                  setSelectedVendorForRevisions(null);
                }}
              >
                + New Data Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DATA ENTRY MODAL ── */}
      {isDataEntryOpen && activePoVendor && (
        <div className="de-overlay" style={deMaximized ? { padding: 0 } : undefined}>

                  <div 
                    className={`de-modal ${deMaximized ? 'rounded-none' : ''}`}
                    style={deMaximized ? { width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh' } : undefined}
                  >

                    {/* Restore bar if maximized */}
                    {deMaximized && (
                      <div className="de-restore-bar">
                        <span>⛶ Table Maximized — <strong id="de-restore-vendor-name">{activePoVendor.name}</strong></span>
                        <button className="de-restore-btn" onClick={() => setDeMaximized(false)}>✕ Restore</button>
                      </div>
                    )}

                    {/* de-header */}
                    <div className="de-header">
                      <div className="de-header-left">
                        <div className="de-header-icon">📋</div>
                        <div>
                          <div className="de-header-title">Data Entry — Purchase Order</div>
                          <div className="de-header-sub">Vendor: <strong className="de-vendor-accent">{activePoVendor.name}</strong></div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="de-status-pill">Draft</span>
                        <button className="de-close-btn" onClick={() => setIsDataEntryOpen(false)}>✕</button>
                      </div>
                    </div>

                    {/* de-steps */}
                    <div className="de-steps">
                      <div className="de-step done"><span className="de-step-dot done-dot">✓</span><span>Vendor Saved</span></div>
                      <div className="de-step-line done-line"></div>
                      <div className="de-step active"><span className="de-step-dot active-dot">2</span><span>Data Entry</span></div>
                      <div className="de-step-line"></div>
                      <div className="de-step inactive"><span className="de-step-dot inactive-dot">3</span><span>Export</span></div>
                    </div>

                    {/* de-revision-bar */}
                    <div className="de-revision-bar">
                      <span className="de-rev-label">📁 REVISIONS:</span>
                      <div className="de-rev-pills">
                        {revisions.filter(r => r.vendorId === activePoVendor.id && r.poNumber === poNumber).map((rev) => (
                          <span
                            key={rev.id}
                            onClick={() => loadRevision(rev)}
                            className={`de-rev-pill ${selectedRevisionId === rev.id ? 'active' : ''}`}
                          >
                            R{rev.revisionNo}
                          </span>
                        ))}
                        {revisions.filter(r => r.vendorId === activePoVendor.id && r.poNumber === poNumber).length === 0 && (
                          <span className="de-rev-pill">R1</span>
                        )}
                      </div>
                      <button
                        className="btn-view-all"
                        style={{ marginLeft: 'auto' }}
                        onClick={() => {
                          setSelectedVendorForRevisions(activePoVendor);
                          setIsDataEntryOpen(false);
                        }}
                      >
                        📄 View All
                      </button>
                    </div>

                    {/* Form body */}
                    <div className="flex-1 overflow-y-auto">

                      {/* de-company-section */}
                      <div className="de-company-section">
                        <div className="de-company-section-title">🏢 OUR COMPANY DETAILS (FOR PO HEADER)</div>
                        <div className="de-company-grid">
                          <div className="de-po-field">
                            <label>Company Name</label>
                            <input type="text" value={companyDetails.name} onChange={e => setCompanyDetails({ ...companyDetails, name: e.target.value })} placeholder="e.g. D.V. Electromatic Pvt. Ltd." />
                          </div>
                          <div className="de-po-field">
                            <label>Company Address</label>
                            <input type="text" value={companyDetails.address} onChange={e => setCompanyDetails({ ...companyDetails, address: e.target.value })} placeholder="F-003, Industrial Growth Centre…" />
                          </div>
                          <div className="de-po-field">
                            <label>Company Phone</label>
                            <input type="text" value={companyDetails.phone} onChange={e => setCompanyDetails({ ...companyDetails, phone: e.target.value })} placeholder="+91 92572-17609" />
                          </div>
                          <div className="de-po-field">
                            <label>Company Email</label>
                            <input type="text" value={companyDetails.email} onChange={e => setCompanyDetails({ ...companyDetails, email: e.target.value })} placeholder="office@dvepl.com" />
                          </div>
                          <div className="de-po-field">
                            <label>Company GSTIN</label>
                            <input type="text" value={companyDetails.gstin} onChange={e => setCompanyDetails({ ...companyDetails, gstin: e.target.value })} placeholder="03AABCD4308A1ZL" />
                          </div>
                          <div className="de-po-field">
                            <label>ISO / Certification</label>
                            <input type="text" value={companyDetails.iso} onChange={e => setCompanyDetails({ ...companyDetails, iso: e.target.value })} placeholder="AN ISO 9001:2008 CERTIFIED CO." />
                          </div>
                          <div className="de-po-field">
                            <label>Authorized Signatory</label>
                            <input type="text" value={companyDetails.signatory} onChange={e => setCompanyDetails({ ...companyDetails, signatory: e.target.value })} placeholder="Name of signatory" />
                          </div>
                          <div className="de-po-field">
                            <label>Division / Dept</label>
                            <input type="text" value={companyDetails.division} onChange={e => setCompanyDetails({ ...companyDetails, division: e.target.value })} placeholder="Industrial Division" />
                          </div>
                        </div>
                      </div>

                      {/* de-po-header */}
                      <div className="de-po-header">
                        <div className="de-po-field">
                          <label>Order Place To</label>
                          <input type="text" value={activePoVendor.name} disabled style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div className="de-po-field">
                          <label>PO Number</label>
                          <input type="text" value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="e.g. PO-2025-001" />
                        </div>
                        <div className="de-po-field">
                          <label>PO Date</label>
                          <input type="date" value={poDate} onChange={e => setPoDate(e.target.value)} />
                        </div>
                        <div className="de-po-field">
                          <label>PO Status</label>
                          <select value={poStatus} onChange={e => setPoStatus(e.target.value)}>
                            <option value="Pending">Pending</option>
                            <option value="Ordered">Ordered</option>
                            <option value="Partially Received">Partially Received</option>
                            <option value="Received">Received</option>
                          </select>
                        </div>
                        <div className="de-po-field">
                          <label>Payment Terms</label>
                          <input type="text" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. 30 days net / 50% Advance" />
                        </div>
                        <div className="de-po-field">
                          <label>Material Status</label>
                          <select value={materialStatus} onChange={e => setMaterialStatus(e.target.value)}>
                            <option value="Pending">Pending</option>
                            <option value="Ordered">Ordered</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Received">Received</option>
                            <option value="Ready for Dispatch">Ready for Dispatch</option>
                          </select>
                        </div>
                        <div className="de-po-field">
                          <label>Advance (₹)</label>
                          <input type="number" value={advance} onChange={e => setAdvance(Number(e.target.value) || 0)} placeholder="0.00" />
                        </div>
                        <div className="de-po-field">
                          <label>Remarks</label>
                          <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any remarks…" />
                        </div>
                      </div>

                      {/* de-tax-section */}
                      <div className="de-tax-section">
                        <span className="de-tax-label">📊 TAX:</span>
                        <div className="de-tax-field">
                          <label>CGST %</label>
                          <input type="number" value={cgstPercent} onChange={e => setCgstPercent(Number(e.target.value) || 0)} />
                        </div>
                        <div className="de-tax-field">
                          <label>SGST %</label>
                          <input type="number" value={sgstPercent} onChange={e => setSgstPercent(Number(e.target.value) || 0)} />
                        </div>
                        <div className="de-tax-field">
                          <label>IGST %</label>
                          <input type="number" value={igstPercent} onChange={e => setIgstPercent(Number(e.target.value) || 0)} />
                        </div>
                        <div className="de-fin-sep"></div>
                        <div className="de-fin-item"><span>Subtotal:</span> <strong>₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
                        <div className="de-fin-sep"></div>
                        <div className="de-fin-item"><span>CGST:</span> <strong>₹{totals.cgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
                        <div className="de-fin-item"><span>SGST:</span> <strong>₹{totals.sgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
                        <div className="de-fin-item"><span>IGST:</span> <strong>₹{totals.igstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
                        <div className="de-fin-sep"></div>
                        <div className="de-fin-item"><span>Grand Total:</span> <strong style={{ color: '#1e4620', fontSize: '15px' }}>₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
                      </div>

                      {/* de-terms-section */}
                      <div className="de-terms-section">
                        <div className="de-terms-title">📜 TERMS &amp; CONDITIONS (SHOWN ON PO)</div>
                        <textarea className="de-terms-textarea" value={terms} onChange={e => setTerms(e.target.value)} placeholder="Terms..."></textarea>
                      </div>

                      {/* de-toolbar */}
                      <div className="de-toolbar">
                        <span className="de-toolbar-label">LINE ITEMS</span>
                        <button className="de-tbtn" onClick={handleAddPoRow}>➕ Add Row</button>
                        <button className="de-tbtn" onClick={handleDuplicateLastRow}>📋 Duplicate Last</button>
                        <div className="de-tbtn-sep"></div>

                        {isAddingCol ? (
                          <div className="flex items-center gap-1 bg-white border border-border p-1 rounded-md shadow-sm">
                            <input
                              placeholder="Col Name..."
                              value={newColName}
                              onChange={e => setNewColName(e.target.value)}
                              style={{ fontSize: '13px', width: '120px', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '6px' }}
                            />
                            <button className="de-tbtn bg-primary text-white" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleAddCustomColumn}>Add</button>
                            <button className="de-tbtn" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setIsAddingCol(false)}>✕</button>
                          </div>
                        ) : (
                          <button className="de-tbtn" onClick={() => setIsAddingCol(true)}>➕ Add Column</button>
                        )}

                        <div className="de-tbtn-sep"></div>
                        <button className="de-tbtn de-tbtn-danger" onClick={handleClearAllRows}>🗑️ Clear All</button>
                        <div style={{ flex: 1 }}></div>
                        <span className="de-row-count">{poItems.length} items</span>
                        <div className="de-tbtn-sep"></div>
                        <button className="de-tbtn de-maximize-btn" onClick={() => setDeMaximized(!deMaximized)}>⛶ Maximize</button>
                      </div>

                      {/* de-table-wrap */}
                      <div className="de-table-wrap">
                        <table className="de-table">
                          <thead>
                            <tr>
                              <th className="th-sno">S.No.</th>
                              <th className="th-desc">Item Description</th>
                              <th className="th-qty">Qty</th>
                              <th className="th-unit">Unit</th>
                              <th className="th-hsn">HSN Code</th>
                              <th className="th-catno">CAT No.</th>
                              {customColumns.map(c => (
                                <th key={c} style={{ minWidth: '100px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                    <span>{c}</span>
                                    <button 
                                      onClick={() => handleRemoveCustomColumn(c)} 
                                      style={{ color: '#ef4444', fontStyle: 'normal', cursor: 'pointer', border: 'none', background: 'none', fontSize: '12px', fontWeight: 'bold' }}
                                      title={`Remove column ${c}`}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </th>
                              ))}
                              <th className="th-rate">Rate (₹)</th>
                              <th className="th-dis">DIS (%)</th>
                              <th className="th-net">Net (₹)</th>
                              <th className="th-total">Total (₹)</th>
                              <th className="th-del"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {poItems.map((item, idx) => (
                              <tr key={item.id}>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                                <td><input type="text" value={item.description} onChange={e => updatePoItemField(item.id, 'description', e.target.value)} placeholder="Item description..." /></td>
                                <td><input type="number" value={item.qty} onChange={e => updatePoItemField(item.id, 'qty', Number(e.target.value) || 0)} /></td>
                                <td><input type="text" value={item.unit} onChange={e => updatePoItemField(item.id, 'unit', e.target.value)} placeholder="PCS" /></td>
                                <td><input type="text" value={item.hsnCode} onChange={e => updatePoItemField(item.id, 'hsnCode', e.target.value)} placeholder="HSN" /></td>
                                <td><input type="text" value={item.catNo} onChange={e => updatePoItemField(item.id, 'catNo', e.target.value)} placeholder="CAT no." /></td>
                                {customColumns.map(c => (
                                  <td key={c}>
                                    <input type="text" value={item[c] || ''} onChange={e => updatePoItemField(item.id, c, e.target.value)} />
                                  </td>
                                ))}
                                <td><input type="number" value={item.rate} onChange={e => updatePoItemField(item.id, 'rate', Number(e.target.value) || 0)} /></td>
                                <td><input type="number" value={item.discountPercent} onChange={e => updatePoItemField(item.id, 'discountPercent', Number(e.target.value) || 0)} /></td>
                                <td className="td-net">₹{(item.net || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="td-total">₹{(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <button className="btn-row-del" onClick={() => handleDeletePoRow(item.id)}>🗑️</button>
                                </td>
                              </tr>
                            ))}
                            {poItems.length === 0 && (
                              <tr>
                                <td colSpan={12 + customColumns.length} style={{ padding: '24px', textAlign: 'center', color: 'var(--text2)' }}>
                                  No items added. Click "+ Add Row" to begin.
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="de-tfoot-row">
                              <td colSpan={2} className="tfoot-label">Total items: <span id="de-total-items">{poItems.length}</span></td>
                              <td className="tfoot-qty" id="de-total-qty">{poItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)}</td>
                              <td colSpan={5 + customColumns.length} className="tfoot-grand-label">Grand Total (excl. tax):</td>
                              <td className="tfoot-grand" colSpan={3} id="de-grand-total">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                    </div>

                    {/* de-finance-bar */}
                    <div className="de-finance-bar">
                      <div className="de-fin-item"><span>Total Amount:</span> <strong id="de-total-amt">₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
                      <div className="de-fin-sep"></div>
                      <div className="de-fin-item"><span>Advance:</span> <strong id="de-adv-display" className="de-fin-adv">₹{advance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
                      <div className="de-fin-sep"></div>
                      <div className="de-fin-item"><span>Balance:</span> <strong id="de-bal-display" className="de-fin-bal">₹{totals.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
                    </div>

                    {/* de-footer */}
                    <div className="de-footer">
                      <div className="de-export-section">
                        <div className="de-export-label">EXPORT AS:</div>
                        <div className="de-export-btns">
                          <button className="de-exp-btn" onClick={() => triggerExport('pdf')}><span className="de-exp-icon">📕</span><span className="de-exp-name">PDF</span><span className="de-exp-ext">.pdf</span></button>
                          <button className="de-exp-btn" onClick={() => triggerExport('png')}><span className="de-exp-icon">🖼️</span><span className="de-exp-name">PNG</span><span className="de-exp-ext">.png</span></button>
                          <button className="de-exp-btn" onClick={() => triggerExport('jpeg')}><span className="de-exp-icon">📷</span><span className="de-exp-name">JPEG</span><span className="de-exp-ext">.jpeg</span></button>
                        </div>
                      </div>
                      <div className="de-footer-actions">
                        <button className="de-tbtn" style={{ padding: '10px 18px', fontSize: '13.5px' }} onClick={() => toast.success('Skipped')}>⏭️ Skip</button>
                        <button className="de-tbtn" style={{ padding: '10px 18px', fontSize: '13.5px' }} onClick={() => setIsDataEntryOpen(false)}>Cancel</button>
                        <button className="btn-save-rev" onClick={handleSavePoRevision}>💾 Save Revision</button>
                        <button className="btn-export-pdf" onClick={() => triggerExport('pdf')}>📘 Export PDF</button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
            );
}

            export default VendorsPage;
