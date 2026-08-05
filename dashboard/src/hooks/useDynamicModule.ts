import { useCallback, useEffect, useMemo, useState } from "react";
import dynamicApi from "@/services/dynamicApi";
import {
  DynamicField,
  DynamicModule,
  DynamicRecord,
} from "@/types/dynamic";

interface UseDynamicModuleProps {
  moduleKey: string;
}

export default function useDynamicModule({
  moduleKey,
}: UseDynamicModuleProps) {
  const [loading, setLoading] = useState(false);

  const [module, setModule] =
    useState<DynamicModule | null>(null);

  const [fields, setFields] = useState<
    DynamicField[]
  >([]);

  const [records, setRecords] = useState<
    DynamicRecord[]
  >([]);

  const [search, setSearch] = useState("");

  const loadModule = useCallback(async () => {
    const res = await dynamicApi.getModules();

    const found = res.data.data.find(
      (m: DynamicModule) =>
        m.moduleKey === moduleKey
    );

    if (!found)
      throw new Error(
        `${moduleKey} module not found`
      );

    setModule(found);
  }, [moduleKey]);

  const loadFields = useCallback(async () => {
    const res =
      await dynamicApi.getFields(moduleKey);

    const sorted = [...res.data.data].sort(
      (a, b) => a.orderNo - b.orderNo
    );

    setFields(sorted);
  }, [moduleKey]);

  const loadRecords = useCallback(async () => {
    const res =
      await dynamicApi.getRecords(moduleKey);

    setRecords(res.data.data);
  }, [moduleKey]);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      await Promise.all([
        loadModule(),
        loadFields(),
        loadRecords(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [
    loadModule,
    loadFields,
    loadRecords,
  ]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createRecord = async (
    values: Record<string, any>
  ) => {
    await dynamicApi.createRecord(
      moduleKey,
      values
    );

    await loadRecords();
  };

  const updateRecord = async (
    id: string,
    values: Record<string, any>
  ) => {
    await dynamicApi.updateRecord(
      id,
      values
    );

    await loadRecords();
  };

  const deleteRecord = async (
    id: string
  ) => {
    await dynamicApi.deleteRecord(id);

    await loadRecords();
  };

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;

    return records.filter((record) => {
      return Object.values(
        record.values || {}
      )
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
    });
  }, [records, search]);

  return {
    loading,

    module,

    fields,

    records: filteredRecords,

    search,

    setSearch,

    refresh,

    loadFields,

    loadRecords,

    createRecord,

    updateRecord,

    deleteRecord,
  };
}