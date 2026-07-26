import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import { 
  Wrench, Plus, Trash2, Edit, Check, X, ArrowUp, ArrowDown, Settings, Layers 
} from 'lucide-react';
import { CustomField, SUPPORTED_FIELD_TYPES } from '@/components/customFields/dynamicFormRenderer';
import { ConfirmDialog } from '@/components/shared/confirmDialog';

export default function CustomFieldsPage() {
  const [activeModule, setActiveModule] = useState<'order' | 'task' | 'vendor'>('order');
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State for creating/editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [type, setType] = useState('text');
  const [required, setRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [helpText, setHelpText] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [showInForm, setShowInForm] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<{ id: string; label: string } | null>(null);
  const [showInTable, setShowInTable] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [afterField, setAfterField] = useState('');
  const [optionsStr, setOptionsStr] = useState('');

  // Options manager for dropdown/radio/multiselect
  const hasOptions = ['dropdown', 'multiselect', 'radio'].includes(type);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/custom-fields?module=${activeModule}`);
      setFields(res.data || []);
    } catch (err: any) {
      toast.error('Failed to load custom fields');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
    resetForm();
  }, [activeModule]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setKey('');
    setType('text');
    setRequired(false);
    setDefaultValue('');
    setPlaceholder('');
    setHelpText('');
    setDisplayOrder(fields.length);
    setShowInForm(true);
    setShowInTable(true);
    setIsActive(true);
    setAfterField('');
    setOptionsStr('');
  };

  const handleEditField = (field: CustomField) => {
    setEditingId(field.id);
    setName(field.name);
    setKey(field.key);
    setType(field.type);
    setRequired(field.required);
    setDefaultValue(field.defaultValue || '');
    setPlaceholder(field.placeholder || '');
    setHelpText(field.helpText || '');
    setDisplayOrder(field.displayOrder);
    setShowInForm(field.showInForm);
    setShowInTable(field.showInTable);
    setIsActive(field.isActive);
    setAfterField(field.afterField || '');
    setOptionsStr(field.options ? field.options.map(o => typeof o === 'string' ? o : o.label).join(', ') : '');
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Field Label / Name is required');
      return;
    }
    if (activeModule === 'order' && !afterField) {
      toast.error('Please select an Add After position for Order fields');
      return;
    }

    const computedKey = key.trim() || name.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');

    setSaving(true);
    try {
      const payload = {
        module: activeModule,
        name: name.trim(),
        key: computedKey,
        type,
        required,
        defaultValue,
        placeholder,
        helpText,
        displayOrder: Number(displayOrder) || 0,
        showInForm,
        showInTable,
        isActive,
        afterField: afterField || undefined,
        options: hasOptions ? optionsStr : undefined
      };

      if (editingId) {
        await apiClient.put(`/custom-fields/${editingId}`, payload);
        toast.success(`Custom field "${name}" updated successfully`);
      } else {
        await apiClient.post('/custom-fields', payload);
        toast.success(`Custom field "${name}" created successfully`);
      }

      await fetchFields();
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save custom field');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, label: string) => {
    setFieldToDelete({ id, label });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteField = async () => {
    if (!fieldToDelete) return;
    try {
      await apiClient.delete(`/custom-fields/${fieldToDelete.id}`);
      toast.success(`Field "${fieldToDelete.label}" deleted successfully.`);
      fetchFields();
    } catch (err: any) {
      toast.error('Failed to delete field. Please try again.');
    } finally {
      setFieldToDelete(null);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/custom-fields/${id}/toggle`, { isActive: !currentStatus });
      toast.success(`Field status updated`);
      fetchFields();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  return (
    <>
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Top Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
            🔧
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Custom Fields Manager</h1>
            <p className="text-xs text-muted-foreground">Configure dynamic EAV fields for Orders, Tasks, and Vendors</p>
          </div>
        </div>
      </div>

      {/* Module Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveModule('order')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeModule === 'order'
              ? 'bg-primary text-white shadow-md'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border'
          }`}
        >
          🛒 Orders
        </button>
        <button
          onClick={() => setActiveModule('task')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeModule === 'task'
              ? 'bg-primary text-white shadow-md'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border'
          }`}
        >
          ✅ Tasks
        </button>
        <button
          onClick={() => setActiveModule('vendor')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeModule === 'vendor'
              ? 'bg-primary text-white shadow-md'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border'
          }`}
        >
          🏢 Vendors
        </button>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
        <div className="border-b pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
              {editingId ? '✏️ Edit Custom Field' : '➕ Add New Custom Field'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {activeModule === 'order' && 'Extra field for Orders — select position where to add it.'}
              {activeModule === 'task' && 'Extra field that will appear in every Task form & table.'}
              {activeModule === 'vendor' && 'Extra field that will appear in every Vendor profile.'}
            </p>
          </div>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={resetForm} className="text-xs">
              Cancel Edit
            </Button>
          )}
        </div>

        <form onSubmit={handleSaveField} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Field Label / Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Inspection Date"
                className="h-9 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Field Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-9 px-3 border border-border bg-background text-foreground rounded-lg text-xs outline-none focus:border-primary"
              >
                {SUPPORTED_FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Options for dropdown, radio, multiselect */}
          {hasOptions && (
            <div className="flex flex-col gap-1.5 bg-muted/20 p-3 rounded-xl border border-border/80">
              <Label className="text-xs font-semibold text-primary">Options (Comma Separated) *</Label>
              <Input
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder="Option A, Option B, Option C"
                className="h-9 text-xs bg-background"
              />
            </div>
          )}

          {/* Position Selector for Form Field Placement */}
          <div className="flex flex-col gap-1.5 bg-primary/5 p-3 rounded-xl border border-primary/20">
            <Label className="text-xs font-semibold text-primary">📍 Add After Field *</Label>
            <select
              value={afterField}
              onChange={(e) => setAfterField(e.target.value)}
              className="h-9 px-3 border border-border bg-background text-foreground rounded-lg text-xs outline-none focus:border-primary"
            >
              <option value="">— Select Position (Default: At the End) —</option>

              {activeModule === 'order' && (
                <>
                  <optgroup label="Assignment & Status">
                    <option value="companyCode">DVEPL Code</option>
                    <option value="orderStatus">Status</option>
                    <option value="orderTakenBy">Order Taken By</option>
                    <option value="assignedTo">Assigned To</option>
                  </optgroup>
                  <optgroup label="Order Information">
                    <option value="customerName">Party Name</option>
                    <option value="caNo">CA No</option>
                    <option value="contact">Contact Details (Phone / Email)</option>
                    <option value="orderTakenDate">Order Confirm Date</option>
                    <option value="deliveryTarget">Delivery Month Target</option>
                    <option value="poDate">PO Date</option>
                    <option value="concernedPeople">Concerned Persons</option>
                  </optgroup>
                  <optgroup label="Drawing Details">
                    <option value="drawingConcernedPerson">Drawing Concerned Person</option>
                    <option value="drawingApprovedDate">Drawing Approved Date</option>
                    <option value="drawingStatus">Drawing Status</option>
                    <option value="drawingRemarks">Drawing Remarks</option>
                  </optgroup>
                  <optgroup label="Item & Pricing">
                    <option value="itemCount">Items</option>
                    <option value="total">Total Amount (₹)</option>
                  </optgroup>
                </>
              )}

              {activeModule === 'vendor' && (
                <>
                  <optgroup label="Vendor Standard Fields">
                    <option value="name">Vendor Name</option>
                    <option value="category">Category</option>
                    <option value="contactPerson">Contact Person</option>
                    <option value="phone font">Phone</option>
                    <option value="email">Email</option>
                    <option value="gstNumber">GST Number</option>
                    <option value="address">Address</option>
                    <option value="notes">Notes</option>
                  </optgroup>
                </>
              )}

              {activeModule === 'task' && (
                <>
                  <optgroup label="Task Standard Fields">
                    <option value="title">Task Title</option>
                    <option value="description">Description</option>
                    <option value="priority">Priority</option>
                    <option value="dueDate">Due Date</option>
                    <option value="status">Status</option>
                    <option value="assignedUsers">Assigned To</option>
                  </optgroup>
                </>
              )}

              {/* Render existing custom fields in this module */}
              {fields.length > 0 && (
                <optgroup label="Existing Custom Fields">
                  {fields.map((f) => (
                    <option key={f.id} value={`custom_${f.key}`}>
                      {f.name} ({f.key})
                    </option>
                  ))}
                </optgroup>
              )}

              <option value="end">— At the End —</option>
            </select>
          </div>

          {/* Extra Configurations */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Placeholder</Label>
              <Input
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="Enter placeholder..."
                className="h-8 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Default Value</Label>
              <Input
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="Default value..."
                className="h-8 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Help Text</Label>
              <Input
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
                placeholder="Tooltip/help text..."
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2 border-t border-border">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <Checkbox checked={required} onCheckedChange={(val) => setRequired(Boolean(val))} />
              <span>Required Field</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <Checkbox checked={showInForm} onCheckedChange={(val) => setShowInForm(Boolean(val))} />
              <span>Show in Form</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <Checkbox checked={showInTable} onCheckedChange={(val) => setShowInTable(Boolean(val))} />
              <span>Show in Table Column</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <Checkbox checked={isActive} onCheckedChange={(val) => setIsActive(Boolean(val))} />
              <span>Active Status</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              Reset
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="bg-primary text-white font-semibold">
              {saving ? 'Saving...' : editingId ? 'Update Field' : '+ Add Custom Field'}
            </Button>
          </div>
        </form>
      </div>

      {/* List Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            📋 Existing Custom Fields ({fields.length})
          </h2>
          <span className="text-xs text-muted-foreground uppercase font-semibold">Module: {activeModule}</span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-muted-foreground">Loading custom fields...</div>
        ) : fields.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No custom fields configured for {activeModule} module.
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((cf) => (
              <div
                key={cf.id}
                className="flex items-center justify-between p-3 border border-border rounded-xl bg-background hover:shadow-xs transition-all gap-4"
              >
                <div className="flex items-center gap-3 flex-wrap flex-1">
                  <span className="font-bold text-xs text-foreground">{cf.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase">
                    {cf.type}
                  </span>
                  {cf.afterField && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      📍 After: {cf.afterField}
                    </span>
                  )}
                  {cf.required && <span className="text-[10px] font-semibold text-rose-500">* Required</span>}
                  {cf.options && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                      Opts: {typeof cf.options === 'string' ? cf.options : cf.options.map(o => typeof o === 'string' ? o : o.label).join(', ')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(cf.id, cf.isActive)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                      cf.isActive
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {cf.isActive ? 'Active' : 'Disabled'}
                  </button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditField(cf)}>
                    <Edit className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cf.id, cf.name)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Move Field to Recycle Bin?"
        description={`The field "${fieldToDelete?.label}" will be moved to the Recycle Bin. Stored EAV data stays intact and the field can be restored later.`}
        confirmText="Move to Bin"
        onConfirm={confirmDeleteField}
      />
    </>
  );
}
