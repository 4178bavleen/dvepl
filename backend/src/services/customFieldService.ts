import { PrismaClient } from "@prisma/client";

export interface CustomFieldOptionInput {
  id?: string;
  label: string;
  value?: string;
  displayOrder?: number;
}

export interface CustomFieldInput {
  module: string;
  name: string;
  key: string;
  type: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  displayOrder?: number;
  showInForm?: boolean;
  showInTable?: boolean;
  isActive?: boolean;
  afterField?: string;
  options?: (string | CustomFieldOptionInput)[];
}

export class CustomFieldService {
  constructor(private prisma: PrismaClient) {}

  // 1. Create Custom Field definition
  async createField(data: CustomFieldInput) {
    const { options, ...fieldData } = data;
    
    // Format options array
    const optionsCreate = options ? options.map((opt, index) => {
      if (typeof opt === 'string') {
        const val = opt.trim();
        return { label: val, value: val, displayOrder: index };
      }
      return {
        label: opt.label,
        value: opt.value || opt.label,
        displayOrder: opt.displayOrder ?? index
      };
    }) : [];

    return this.prisma.customField.create({
      data: {
        module: fieldData.module.toLowerCase(),
        name: fieldData.name,
        key: fieldData.key,
        type: fieldData.type,
        required: fieldData.required ?? false,
        defaultValue: fieldData.defaultValue || null,
        placeholder: fieldData.placeholder || null,
        helpText: fieldData.helpText || null,
        displayOrder: fieldData.displayOrder ?? 0,
        showInForm: fieldData.showInForm ?? true,
        showInTable: fieldData.showInTable ?? true,
        isActive: fieldData.isActive ?? true,
        afterField: fieldData.afterField || null,
        options: {
          create: optionsCreate
        }
      },
      include: {
        options: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });
  }

  // 2. Update Custom Field definition
  async updateField(id: string, data: Partial<CustomFieldInput>) {
    const { options, ...fieldData } = data;

    // Build update object
    const updateData: any = {};
    if (fieldData.name !== undefined) updateData.name = fieldData.name;
    if (fieldData.key !== undefined) updateData.key = fieldData.key;
    if (fieldData.type !== undefined) updateData.type = fieldData.type;
    if (fieldData.required !== undefined) updateData.required = fieldData.required;
    if (fieldData.defaultValue !== undefined) updateData.defaultValue = fieldData.defaultValue;
    if (fieldData.placeholder !== undefined) updateData.placeholder = fieldData.placeholder;
    if (fieldData.helpText !== undefined) updateData.helpText = fieldData.helpText;
    if (fieldData.displayOrder !== undefined) updateData.displayOrder = fieldData.displayOrder;
    if (fieldData.showInForm !== undefined) updateData.showInForm = fieldData.showInForm;
    if (fieldData.showInTable !== undefined) updateData.showInTable = fieldData.showInTable;
    if (fieldData.isActive !== undefined) updateData.isActive = fieldData.isActive;
    if (fieldData.afterField !== undefined) updateData.afterField = fieldData.afterField;
    if (fieldData.module !== undefined) updateData.module = fieldData.module.toLowerCase();

    // If options are provided, recreate options list
    if (options !== undefined) {
      await this.prisma.customFieldOption.deleteMany({
        where: { customFieldId: id }
      });
      const optionsCreate = options.map((opt, index) => {
        if (typeof opt === 'string') {
          const val = opt.trim();
          return { label: val, value: val, displayOrder: index };
        }
        return {
          label: opt.label,
          value: opt.value || opt.label,
          displayOrder: opt.displayOrder ?? index
        };
      });
      updateData.options = { create: optionsCreate };
    }

    return this.prisma.customField.update({
      where: { id },
      data: updateData,
      include: {
        options: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });
  }

  // 3. Toggle enable/disable
  async toggleActive(id: string, isActive: boolean) {
    return this.prisma.customField.update({
      where: { id },
      data: { isActive }
    });
  }

  // 4. Soft Delete Custom Field
  async deleteField(id: string) {
    return this.prisma.customField.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  // 5. Fetch Custom Fields by Module
  async getFieldsByModule(module: string, activeOnly = false) {
    return this.prisma.customField.findMany({
      where: {
        module: module.toLowerCase(),
        deletedAt: null,
        ...(activeOnly ? { isActive: true } : {})
      },
      include: {
        options: {
          orderBy: { displayOrder: 'asc' }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });
  }

  // 6. Get Field by ID
  async getFieldById(id: string) {
    return this.prisma.customField.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });
  }

  // ==========================================
  // EAV VALUES STORAGE & RETRIEVAL SERVICE
  // ==========================================

  // Map raw javascript input value to typed EAV database fields based on CustomField type
  private formatValueForType(type: string, value: any) {
    const formatted: {
      stringValue?: string | null;
      textValue?: string | null;
      numberValue?: number | null;
      booleanValue?: boolean | null;
      dateValue?: Date | null;
      jsonValue?: string | null;
    } = {
      stringValue: null,
      textValue: null,
      numberValue: null,
      booleanValue: null,
      dateValue: null,
      jsonValue: null
    };

    if (value === null || value === undefined || value === "") {
      return formatted;
    }

    const t = type.toLowerCase();

    if (t === "textarea") {
      formatted.textValue = String(value);
      formatted.stringValue = String(value).slice(0, 255);
    } else if (t === "number" || t === "decimal") {
      const num = Number(value);
      if (!isNaN(num)) {
        formatted.numberValue = num;
        formatted.stringValue = String(num);
      }
    } else if (t === "checkbox" || t === "switch") {
      const bool = Boolean(value === true || value === "true" || value === 1 || value === "1");
      formatted.booleanValue = bool;
      formatted.stringValue = bool ? "true" : "false";
    } else if (t === "date" || t === "datetime" || t === "time") {
      if (value instanceof Date) {
        formatted.dateValue = value;
        formatted.stringValue = value.toISOString();
      } else {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          formatted.dateValue = d;
          formatted.stringValue = d.toISOString();
        } else {
          formatted.stringValue = String(value);
        }
      }
    } else if (t === "multiselect" || Array.isArray(value)) {
      const arr = Array.isArray(value) ? value : String(value).split(",").map(s => s.trim());
      formatted.jsonValue = JSON.stringify(arr);
      formatted.stringValue = arr.join(", ");
    } else {
      // text, email, phone, url, dropdown, radio, file, image
      formatted.stringValue = String(value);
    }

    return formatted;
  }

  // Extract typed EAV database fields back to Javascript value
  private extractTypedValue(type: string, rec: any) {
    if (!rec) return null;
    const t = type.toLowerCase();

    if (t === "textarea") return rec.textValue ?? rec.stringValue ?? null;
    if (t === "number" || t === "decimal") return rec.numberValue !== null ? Number(rec.numberValue) : null;
    if (t === "checkbox" || t === "switch") return rec.booleanValue ?? (rec.stringValue === "true");
    if (t === "date" || t === "datetime" || t === "time") {
      return rec.dateValue ? rec.dateValue.toISOString() : rec.stringValue ?? null;
    }
    if (t === "multiselect") {
      if (rec.jsonValue) {
        try { return JSON.parse(rec.jsonValue); } catch { return []; }
      }
      return rec.stringValue ? rec.stringValue.split(",").map((s: string) => s.trim()) : [];
    }
    return rec.stringValue ?? null;
  }

  // Validate custom field input values against definitions
  validateCustomFields(fields: any[], values: Record<string, any>) {
    const errors: Record<string, string> = {};

    for (const field of fields) {
      if (!field.isActive) continue;

      const val = values[field.key];
      const isEmpty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);

      // 1. Required check
      if (field.required && isEmpty) {
        errors[field.key] = `${field.name} is required.`;
        continue;
      }

      if (isEmpty) continue;

      // 2. Type specific validations
      const t = field.type.toLowerCase();
      if (t === "email") {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim());
        if (!isEmail) errors[field.key] = `Invalid email address.`;
      } else if (t === "number" || t === "decimal") {
        if (isNaN(Number(val))) errors[field.key] = `Must be a valid number.`;
      } else if (t === "phone") {
        const isPhone = /^[0-9+\-\s()]{7,15}$/.test(String(val).trim());
        if (!isPhone) errors[field.key] = `Invalid phone number format.`;
      } else if (t === "url") {
        try {
          new URL(String(val));
        } catch {
          errors[field.key] = `Invalid URL format.`;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Save or update custom field values for an entity record (Vendor ID, Order ID, Task ID)
  async saveValues(module: string, entityId: string, customFieldValues: Record<string, any>) {
    if (!entityId || !customFieldValues || typeof customFieldValues !== "object") return;

    const fields = await this.getFieldsByModule(module, true);
    const fieldMap = new Map(fields.map(f => [f.key, f]));

    const savePromises: Promise<any>[] = [];

    for (const [key, value] of Object.entries(customFieldValues)) {
      const field = fieldMap.get(key);
      if (!field) continue;

      const typedData = this.formatValueForType(field.type, value);

      savePromises.push(
        this.prisma.customFieldValue.upsert({
          where: {
            customFieldId_entityId: {
              customFieldId: field.id,
              entityId
            }
          },
          create: {
            customFieldId: field.id,
            entityId,
            ...typedData
          },
          update: {
            ...typedData
          }
        })
      );
    }

    await Promise.all(savePromises);
  }

  // Retrieve custom field values formatted as key-value pairs for an entity record
  async getValuesForEntity(module: string, entityId: string) {
    const fields = await this.getFieldsByModule(module);
    if (!fields.length) return {};

    const fieldIds = fields.map(f => f.id);
    const storedValues = await this.prisma.customFieldValue.findMany({
      where: {
        entityId,
        customFieldId: { in: fieldIds }
      }
    });

    const valueMap = new Map(storedValues.map(v => [v.customFieldId, v]));
    const result: Record<string, any> = {};

    for (const field of fields) {
      const stored = valueMap.get(field.id);
      if (stored) {
        result[field.key] = this.extractTypedValue(field.type, stored);
      } else {
        result[field.key] = field.defaultValue ?? null;
      }
    }

    return result;
  }

  // Batch retrieve values for multiple entities (for table rendering efficiency)
  async getValuesForEntities(module: string, entityIds: string[]) {
    if (!entityIds.length) return {};

    const fields = await this.getFieldsByModule(module);
    if (!fields.length) return {};

    const fieldIds = fields.map(f => f.id);
    const storedValues = await this.prisma.customFieldValue.findMany({
      where: {
        entityId: { in: entityIds },
        customFieldId: { in: fieldIds }
      }
    });

    const fieldMap = new Map(fields.map(f => [f.id, f]));
    
    // EntityId -> { fieldKey: value }
    const resultMap: Record<string, Record<string, any>> = {};

    entityIds.forEach(id => { resultMap[id] = {}; });

    storedValues.forEach(v => {
      const field = fieldMap.get(v.customFieldId);
      if (field && resultMap[v.entityId]) {
        resultMap[v.entityId][field.key] = this.extractTypedValue(field.type, v);
      }
    });

    return resultMap;
  }
}
