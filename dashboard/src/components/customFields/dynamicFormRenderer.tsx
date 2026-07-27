import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/services/axios';
import { SlidersHorizontal, Plus, Trash2, Edit2, Check, X, MoveUp, MoveDown, Layers, FileText, CheckCircle2 } from 'lucide-react';
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
];

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  fields,
  values,
  onChange,
  errors = {},
  afterFieldPosition
}) => {
  // Filter active & form visible fields
  // Use !== false so that undefined/null from API still shows the field (opt-out, not opt-in)
  const filteredFields = fields
    .filter(f => f.isActive !== false && f.showInForm !== false)
    .filter(f => afterFieldPosition ? f.afterField === afterFieldPosition : true)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  if (!filteredFields.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {filteredFields.map((field) => {
        const value = values[field.key] ?? field.defaultValue ?? (field.type === 'checkbox' || field.type === 'switch' ? false : field.type === 'multiselect' ? [] : '');
        const error = errors[field.key];
        const isFullWidth = ['textarea', 'file', 'image', 'multiselect'].includes(field.type);

        return (
          <div key={field.id} className={`flex flex-col gap-1.5 ${isFullWidth ? 'md:col-span-2' : ''}`}>
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
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
                className={`h-9 text-xs ${error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 ring-2 ring-red-500/20' : ''}`}
              />
            )}

            {field.type === 'textarea' && (
              <Textarea
                placeholder={field.placeholder || ''}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                rows={3}
                aria-invalid={Boolean(error)}
                className={`text-xs ${error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 ring-2 ring-red-500/20' : ''}`}
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
                className={`h-9 text-xs ${error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 ring-2 ring-red-500/20' : ''}`}
              />
            )}

            {field.type === 'email' && (
              <Input
                type="email"
                placeholder={field.placeholder || 'example@domain.com'}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={`h-9 text-xs ${error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 ring-2 ring-red-500/20' : ''}`}
              />
            )}

            {field.type === 'phone' && (
              <Input
                type="tel"
                placeholder={field.placeholder || '+91 9876543210'}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={`h-9 text-xs ${error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 ring-2 ring-red-500/20' : ''}`}
              />
            )}

            {field.type === 'url' && (
              <Input
                type="url"
                placeholder={field.placeholder || 'https://...'}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={`h-9 text-xs ${error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 ring-2 ring-red-500/20' : ''}`}
              />
            )}

            {field.type === 'date' && (
              <Input
                type="date"
                value={value ? String(value).split('T')[0] : ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={`h-9 text-xs ${error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 ring-2 ring-red-500/20' : ''}`}
              />
            )}

            {field.type === 'datetime' && (
              <Input
                type="datetime-local"
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={`h-9 text-xs ${error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 ring-2 ring-red-500/20' : ''}`}
              />
            )}

            {field.type === 'time' && (
              <Input
                type="time"
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                aria-invalid={Boolean(error)}
                className={`h-9 text-xs ${error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 ring-2 ring-red-500/20' : ''}`}
              />
            )}

            {field.type === 'checkbox' && (
              <div className={`flex items-center gap-2 mt-1 p-1 rounded-md ${error ? 'ring-2 ring-red-500/40 border border-red-500' : ''}`}>
                <Checkbox
                  checked={Boolean(value)}
                  onCheckedChange={(checked) => onChange(field.key, checked)}
                  className={error ? 'border-red-500 aria-invalid:border-red-500' : ''}
                />
                <span className="text-xs text-foreground font-medium">{field.placeholder || 'Enable'}</span>
              </div>
            )}

            {field.type === 'switch' && (
              <div className={`flex items-center gap-3 mt-1 p-1 rounded-md ${error ? 'ring-2 ring-red-500/40 border border-red-500' : ''}`}>
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
                className={`h-9 px-3 rounded-lg border bg-background text-foreground text-xs outline-none transition-colors ${
                  error ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20' : 'border-border focus:border-primary'
                }`}
              >
                <option value="">{field.placeholder || '-- Select Option --'}</option>
                {field.options?.map((opt, i) => (
                  <option key={i} value={typeof opt === 'string' ? opt : opt.value}>
                    {typeof opt === 'string' ? opt : opt.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'radio' && (
              <div className={`flex flex-wrap gap-4 mt-1 p-1.5 rounded-lg border ${error ? 'border-red-500 ring-2 ring-red-500/20' : 'border-transparent'}`}>
                {field.options?.map((opt, i) => {
                  const val = typeof opt === 'string' ? opt : opt.value;
                  const lbl = typeof opt === 'string' ? opt : opt.label;
                  return (
                    <label key={i} className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                      <input
                        type="radio"
                        name={`cf_${field.key}`}
                        value={val}
                        checked={value === val}
                        onChange={() => onChange(field.key, val)}
                        className="text-primary focus:ring-primary"
                      />
                      <span>{lbl}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {field.type === 'multiselect' && (
              <div className={`flex flex-wrap gap-2 p-2 border rounded-lg bg-background min-h-10 ${error ? 'border-red-500 ring-2 ring-red-500/20' : 'border-border'}`}>
                {field.options?.map((opt, i) => {
                  const val = typeof opt === 'string' ? opt : opt.value;
                  const lbl = typeof opt === 'string' ? opt : opt.label;
                  const selectedArray = Array.isArray(value) ? value : String(value).split(',').map(s => s.trim()).filter(Boolean);
                  const isChecked = selectedArray.includes(val);

                  const toggleSelection = () => {
                    const next = isChecked ? selectedArray.filter(s => s !== val) : [...selectedArray, val];
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
                      {isChecked ? '✓ ' : '+ '}{lbl}
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
                  className={`h-9 text-xs ${error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30 ring-2 ring-red-500/20' : ''}`}
                />
                {value && <span className="text-xs font-medium text-emerald-600 truncate max-w-40">Attached: {value}</span>}
              </div>
            )}

            {error && <span className="text-[11px] text-red-600 font-semibold">{error}</span>}
          </div>
        );
      })}
    </div>
  );
};
