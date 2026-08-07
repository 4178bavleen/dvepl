/* ==========================================
 * Dynamic ERP Engine Types
 * ========================================== */

export type DynamicFieldType =
  | "TEXT"
  | "NUMBER"
  | "TEXTAREA"
  | "SELECT"
  | "DATE"
  | "EMAIL"
  | "PHONE"
  | "CHECKBOX";

export interface DynamicModule {
  id: string;
  moduleKey: string;
  moduleName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DynamicField {
  id: string;

  moduleId: string;

  fieldName: string;

  label: string;

  type: DynamicFieldType;

  required: boolean;

  visible: boolean;

  searchable: boolean;

  filterable: boolean;

  table: boolean;

  placeholder?: string | null;

  defaultValue?: any;

  options?: string[] | null;

  orderNo: number;
}


export interface DynamicRecord {
  id: string;
  moduleId: string;

  values: Record<string, any>;

  inventory: {
    id: string;
    companyId: string;
    materialId: string;
    quantity: string;
    reservedQty: string;
    damagedQty: string;
    scrapQty: string;
    transitQty: string;
    stockType: string;
    unitPrice: string;
    location?: string | null;
    binId?: string | null;
    batchNo?: string | null;
    serialNo?: string | null;
    barcode?: string | null;
    qrCode?: string | null;
    expiryDate?: string | null;
  } | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface DynamicFormProps {
  fields: DynamicField[];

  values: Record<string, any>;

  loading?: boolean;

  onChange: (
    fieldName: string,
    value: any
  ) => void;

  onSubmit: () => void;

  onCancel: () => void;
}

export interface DynamicTableProps {
  fields: DynamicField[];

  records: DynamicRecord[];

  loading?: boolean;

  onEdit: (
    record: DynamicRecord
  ) => void;

  onDelete: (
    record: DynamicRecord
  ) => void;
  onStock: (record: DynamicRecord) => void;
}

export interface DynamicFieldManagerProps {
  moduleId: string;

  fields: DynamicField[];

  onRefresh: () => Promise<void>;
}