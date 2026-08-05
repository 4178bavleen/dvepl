import { apiClient as api } from "./api";

export interface CreateModuleDto {
  moduleName: string;
  moduleKey: string;
}

export interface CreateFieldDto {
  moduleId: string;

  fieldName: string;
  label: string;

  type:
    | "TEXT"
    | "NUMBER"
    | "TEXTAREA"
    | "SELECT"
    | "DATE"
    | "EMAIL"
    | "PHONE"
    | "CHECKBOX";

  required?: boolean;

  visible?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  table?: boolean;

  placeholder?: string | null;
  defaultValue?: any;

  options?: any;

  orderNo?: number;
}

class DynamicApi {
  // Modules
  getModules() {
    return api.get("/dynamic/module");
  }

  createModule(data: CreateModuleDto) {
    return api.post("/dynamic/module", data);
  }

  updateModule(id: string, data: Partial<CreateModuleDto>) {
    return api.put(`/dynamic/module/${id}`, data);
  }

  deleteModule(id: string) {
    return api.delete(`/dynamic/module/${id}`);
  }

  // Fields
  getFields(moduleKey: string) {
    return api.get(`/dynamic/field?moduleKey=${moduleKey}`);
  }

  createField(data: CreateFieldDto) {
    return api.post("/dynamic/field", data);
  }

  updateField(id: string, data: Partial<CreateFieldDto>) {
    return api.put(`/dynamic/field/${id}`, data);
  }

  deleteField(id: string) {
    return api.delete(`/dynamic/field/${id}`);
  }

  // Schema
  getSchema(moduleKey: string) {
    return api.get(`/dynamic/schema/${moduleKey}`);
  }

  // Records
  getRecords(moduleKey: string) {
    return api.get(`/dynamic/record/${moduleKey}`);
  }

  getRecord(id: string) {
    return api.get(`/dynamic/record/id/${id}`);
  }

  createRecord(moduleKey: string, values: Record<string, any>) {
    return api.post(`/dynamic/record/${moduleKey}`, {
      values,
    });
  }

  updateRecord(id: string, values: Record<string, any>) {
    return api.put(`/dynamic/record/${id}`, {
      values,
    });
  }

  deleteRecord(id: string) {
    return api.delete(`/dynamic/record/${id}`);
  }
}

export default new DynamicApi();