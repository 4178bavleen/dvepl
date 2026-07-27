import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { apiClient } from '@/services/axios';
import { CustomField } from '@/components/customFields/dynamicFormRenderer';

export function useDynamicCustomFields(module: string) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/custom-fields?module=${module}`);
      setFields(res.data || []);
    } catch (err) {
      console.error(`Failed to load custom fields for ${module}`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (module) {
      void fetchFields();
    }
  }, [module]);

  // Dynamic table columns generation
  const tableCustomColumns = useMemo<ColumnDef<any, any>[]>(() => {
    return (fields
      .filter((f) => f.isActive && f.showInTable)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((f) => ({
        id: `cf_${f.key}`,
        accessorKey: `customFields.${f.key}`,
        header: f.name,
        cell: ({ row }: { row: any }) => {
          const val = row.original?.customFields?.[f.key];
          if (val === undefined || val === null || val === '') return '—';
          if (typeof val === 'boolean') return val ? 'Yes' : 'No';
          if (Array.isArray(val)) return val.join(', ');
          return String(val);
        },
      })) as unknown) as ColumnDef<any, any>[];
  }, [fields]);

  return {
    fields,
    loading,
    refetch: fetchFields,
    tableCustomColumns,
  };
}

export function validateCustomFields(
  fields: CustomField[],
  values: Record<string, any>
): Record<string, string> {
  const errors: Record<string, string> = {};
  fields.forEach((field) => {
    if (field.isActive && field.showInForm && field.required) {
      const val = values[field.key];
      const isBlank =
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0) ||
        (field.type === 'checkbox' && val === false);

      if (isBlank) {
        errors[field.key] = `${field.name} is required`;
      }
    }
  });
  return errors;
}
