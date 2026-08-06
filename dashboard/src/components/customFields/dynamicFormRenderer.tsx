import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/services/axios';
import '@/styles/vendors.css';

export interface CustomFieldOption {
  id?: string;
  label: string;
  value: string;
  displayOrder?: number;
}

export interface CustomField {
  id: string;
  module: string;
  name: string;
  key: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  displayOrder: number;
  showInForm: boolean;
  showInTable: boolean;
  isActive: boolean;
  afterField?: string;
  options?: CustomFieldOption[];
}

export interface DynamicFormRendererProps {
  fields: CustomField[];
  values: Record<string, any>;
  onChange: (key: string, val: any) => void;
  errors?: Record<string, string>;
  afterFieldPosition?: string; // If filtering fields assigned after a specific position
}

// Support all required field types
export const SUPPORTED_FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date Time' },
  { value: 'time', label: 'Time' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'switch', label: 'Switch' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi Select' },
  { value: 'radio', label: 'Radio' },
  { value: 'file', label: 'File Upload' },
  { value: 'image', label: 'Image Upload' },
  { value: 'vendor', label: 'Vendor Select' },
];

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  fields,
  values,
  onChange,
  errors = {},
  afterFieldPosition
}) => {
  const [vendors, setVendors] = useState<{ id: string; vendorName: string }[]>([]);

  useEffect(() => {
    const hasVendorField = fields.some(f => f.type === 'vendor');
    if (hasVendorField && vendors.length === 0) {
      apiClient.get('/vendor/read').then(res => {
        const raw = res.data?.data ?? res.data ?? [];
        const mapped = (Array.isArray(raw) ? raw : []).map((v: any) => ({
          id: v.id,
          vendorName: v.vendorName ?? v.name ?? '',
        }));
        setVendors(mapped);
      }).catch(err => console.error("Error loading vendors in dynamic form", err));
    }
  }, [fields, vendors.length]);

  // Filter active & form visible fields
  const filteredFields = fields
    .filter(f => f.isActive && f.showInForm)
    .filter(f => afterFieldPosition ? f.afterField === afterFieldPosition : true)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  if (!filteredFields.length) return null;

  return (
    <>
      {filteredFields.map((field) => {
        const value = values[field.key] ?? field.defaultValue ?? (field.type === 'checkbox' || field.type === 'switch' ? false : field.type === 'multiselect' ? [] : '');
        const error = errors[field.key];
        const isFullWidth = ['textarea', 'file', 'image', 'multiselect'].includes(field.type);

        const rawOptions = field.options;
        const optionsList: { label: string; value: string }[] = [];
        if (typeof rawOptions === 'string') {
          (rawOptions as string).split(',').forEach((s) => {
            const val = s.trim();
            if (val) {
              optionsList.push({ label: val, value: val });
            }
          });
        } else if (Array.isArray(rawOptions)) {
          rawOptions.forEach((opt: any) => {
            if (typeof opt === 'string') {
              optionsList.push({ label: opt, value: opt });
            } else if (opt && typeof opt === 'object') {
              optionsList.push({
                label: opt.label || opt.value || '',
                value: opt.value || opt.label || '',
              });
            }
          });
        }

        let inputClassName = "h-9 text-xs";
        let selectClassName = "h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none transition-colors w-full";
        let checkboxWrapperClassName = "flex items-center gap-2 mt-1 p-1 rounded-md";
        let switchWrapperClassName = "flex items-center gap-3 mt-1 p-1 rounded-md";
        let radioWrapperClassName = "flex flex-wrap gap-4 mt-1 p-1.5 rounded-lg border border-transparent";
        let multiselectWrapperClassName = "flex flex-wrap gap-2 p-2 border rounded-lg bg-background min-h-10 border-border";
        let textareaClassName = "text-xs";
        let labelClassName = "text-xs font-semibold text-foreground flex items-center justify-between";

        if (field.module === 'order') {
          labelClassName = "text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-between";
          inputClassName = "h-10 bg-muted/40 text-sm";
          selectClassName = "h-10 px-3 rounded-md border border-input bg-muted/40 text-foreground text-sm outline-none transition-colors w-full";
          textareaClassName = "bg-muted/40 text-sm";
        } else if (field.module === 'task') {
          labelClassName = "text-xs font-semibold text-muted-foreground flex items-center justify-between";
          inputClassName = "h-9 text-xs";
          selectClassName = "h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs outline-none transition-colors w-full";
          textareaClassName = "text-xs";
        } else if (field.module === 'vendor') {
          labelClassName = "text-xs font-semibold text-foreground flex items-center justify-between";
          inputClassName = "h-9 text-sm";
          selectClassName = "h-9 px-3 rounded-lg border border-border bg-background text-foreground text-sm outline-none transition-colors w-full";
          textareaClassName = "text-sm";
        }

        if (error) {
          inputClassName += " border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 ring-2 ring-red-500/20";
          selectClassName += " border-red-500 focus:border-red-500 ring-2 ring-red-500/20";
          textareaClassName += " border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 ring-2 ring-red-500/20";
          checkboxWrapperClassName += " ring-2 ring-red-500/40 border border-red-500";
          switchWrapperClassName += " ring-2 ring-red-500/40 border border-red-500";
          radioWrapperClassName = radioWrapperClassName.replace("border-transparent", "border-red-500 ring-2 ring-red-500/20");
          multiselectWrapperClassName = multiselectWrapperClassName.replace("border-border", "border-red-500 ring-2 ring-red-500/20");
        } else {
          selectClassName += " border-border focus:border-primary";
        }

        return (
          <div key={field.id} className={`flex flex-col gap-1.5 ${isFullWidth ? 'sm:col-span-2' : ''}`}>
            <Label className={labelClassName}>
              <span>
                {field.name} {field.required && <span className="text-destructive">*</span>}
              </span>
              {field.helpText && <span className="text-[10px] text-muted-foreground font-normal">{field.helpText}</span>}
            </Label>

            {/* Field Type Specific Controls */}
            {field.type === 'text' && (
              <Input
                type="text"
                placeholder={field.placeholder || ''}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={inputClassName}
              />
            )}

            {field.type === 'textarea' && (
              <Textarea
                placeholder={field.placeholder || ''}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                rows={3}
                aria-invalid={Boolean(error)}
                className={textareaClassName}
              />
            )}

            {(field.type === 'number' || field.type === 'decimal') && (
              <Input
                type="number"
                step={field.type === 'decimal' ? '0.01' : '1'}
                placeholder={field.placeholder || ''}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={inputClassName}
              />
            )}

            {field.type === 'email' && (
              <Input
                type="email"
                placeholder={field.placeholder || 'example@domain.com'}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={inputClassName}
              />
            )}

            {field.type === 'phone' && (
              <Input
                type="tel"
                placeholder={field.placeholder || '+91 9876543210'}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={inputClassName}
              />
            )}

            {field.type === 'url' && (
              <Input
                type="url"
                placeholder={field.placeholder || 'https://...'}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={inputClassName}
              />
            )}

            {field.type === 'date' && (
              <Input
                type="date"
                value={value ? String(value).split('T')[0] : ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={inputClassName}
              />
            )}

            {field.type === 'datetime' && (
              <Input
                type="datetime-local"
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={inputClassName}
              />
            )}

            {field.type === 'time' && (
              <Input
                type="time"
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={inputClassName}
              />
            )}

            {field.type === 'checkbox' && (
              <div className={checkboxWrapperClassName}>
                <Checkbox
                  checked={Boolean(value)}
                  onCheckedChange={(checked) => onChange(field.key, checked)}
                  className={error ? 'border-red-500 aria-invalid:border-red-500' : ''}
                />
                <span className="text-xs text-foreground font-medium">{field.placeholder || 'Enable'}</span>
              </div>
            )}

            {field.type === 'switch' && (
              <div className={switchWrapperClassName}>
                <button
                  type="button"
                  onClick={() => onChange(field.key, !value)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                    error ? 'border-red-500 ring-2 ring-red-500/30' : 'border-transparent'
                  } ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      value ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs text-foreground font-medium">{value ? 'Active / Enabled' : 'Disabled'}</span>
              </div>
            )}

             {field.type === 'dropdown' && (
              <select
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={selectClassName}
              >
                <option value="">{field.placeholder || '-- Select Option --'}</option>
                {optionsList.map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'vendor' && (
              <select
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={selectClassName}
              >
                <option value="">{field.placeholder || '-- Select Vendor --'}</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendorName}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'radio' && (
              <div className={radioWrapperClassName}>
                {optionsList.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                    <input
                      type="radio"
                      name={`cf_${field.key}`}
                      value={opt.value}
                      checked={value === opt.value}
                      onChange={() => onChange(field.key, opt.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {field.type === 'multiselect' && (
              <div className={multiselectWrapperClassName}>
                {optionsList.map((opt, i) => {
                  const selectedArray = Array.isArray(value) ? value : String(value).split(',').map(s => s.trim()).filter(Boolean);
                  const isChecked = selectedArray.includes(opt.value);

                  const toggleSelection = () => {
                    const next = isChecked ? selectedArray.filter(s => s !== opt.value) : [...selectedArray, opt.value];
                    onChange(field.key, next);
                  };

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={toggleSelection}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                        isChecked
                          ? 'bg-primary text-white border-primary'
                          : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}{opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {(field.type === 'file' || field.type === 'image') && (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept={field.type === 'image' ? 'image/*' : '*'}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Save filename or path
                      onChange(field.key, file.name);
                    }
                  }}
                  aria-invalid={Boolean(error)}
                  className={inputClassName}
                />
                {value && <span className="text-xs font-medium text-emerald-600 truncate max-w-40">Attached: {value}</span>}
              </div>
            )}

            {error && <span className="text-[11px] text-red-600 font-semibold">{error}</span>}
          </div>
        );
      })}
    </>
  );
};
