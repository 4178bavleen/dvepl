export type FieldType =
  | "text"
  | "number"
  | "email"
  | "password"
  | "textarea"
  | "select"
  | "checkbox"
  | "date";

export interface CrudField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;

  options?: {
    label: string;
    value: string;
  }[];
}