import { useState } from "react";

import { Plus, Settings, Truck, ArrowLeft } from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Input,
} from "@/components/ui/input";

import DynamicTable from "@/components/dynamic/DynamicTable";

import DynamicForm from "@/components/dynamic/DynamicForm";

import DynamicFieldManager from "@/components/dynamic/DynamicFieldManager";

import useDynamicModule from "@/hooks/useDynamicModule";
import VendorTracking from "./vendorTracking";

import {
  DynamicRecord,
} from "@/types/dynamic";
export default function InventoryPage() {
  const {
    module,

    fields,

    records,

    loading,

    search,

    setSearch,

    createRecord,

    updateRecord,

    deleteRecord,

    loadFields,

} = useDynamicModule({

    moduleKey: "inventory",

});
const [mainView, setMainView] =
    useState<"inventory" | "tracking">("inventory");
const [formOpen, setFormOpen] =
    useState(false);

const [fieldManagerOpen,
setFieldManagerOpen] =
    useState(false);

const [editing,
setEditing] =
useState<DynamicRecord | null>(null);

const [values,
setValues] =
useState<Record<string, any>>({});
const openCreate = () => {

    setEditing(null);

    const obj:
    Record<string, any> = {};

    fields.forEach(field => {

        obj[field.fieldName] =
            field.defaultValue ?? "";

    });

    setValues(obj);

    setFormOpen(true);

};
const openEdit = (
record: DynamicRecord
) => {

    setEditing(record);

    setValues(
        record.values || {}
    );

    setFormOpen(true);

};

const removeRecord =
async (
record: DynamicRecord
) => {

    if (
        !confirm(
            "Delete record?"
        )
    )
        return;

    await deleteRecord(
        record.id
    );

};
const saveRecord =
async () => {

    if (editing) {

        await updateRecord(
            editing.id,
            values
        );

    }

    else {

        await createRecord(
            values
        );

    }

    setFormOpen(false);

};
return (
  <div className="space-y-6 p-6">

    {/* Header */}

    <div className="flex items-center justify-between">

      <div>

        <h1 className="text-3xl font-bold">
          Inventory
        </h1>

        <p className="text-muted-foreground">
          Dynamic Inventory Management
        </p>

      </div>

<div className="flex gap-2">

        <Button
          variant="outline"
          onClick={() =>
            setMainView("tracking")
          }
        >
          <Truck className="w-4 h-4 mr-2" />
          Vendor Tracking
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            setFieldManagerOpen(true)
          }
        >
          <Settings className="w-4 h-4 mr-2" />
          Manage Fields
        </Button>

        <Button
          onClick={openCreate}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>

      </div>

    </div>

    {mainView === "inventory" ? (
      <>
    {/* Search */}

    <Input
      placeholder="Search..."
      value={search}
      onChange={(e) =>
        setSearch(e.target.value)
      }
    />

    {/* Table */}

    <DynamicTable
  fields={fields}
  records={records}
  loading={loading}
  onStock={() => {
    setMainView("tracking");
  }}
  onEdit={openEdit}
  onDelete={removeRecord}
/>
      </>
    ) : (
      <>
    <Button
      variant="outline"
      onClick={() =>
        setMainView("inventory")
      }
      className="gap-2"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Inventory
    </Button>

    <VendorTracking />
      </>
    )}
    {/* Add / Edit Dialog */}

    <Dialog
      open={formOpen}
      onOpenChange={setFormOpen}
    >
      <DialogContent className="max-w-4xl">

        <DialogHeader>

          <DialogTitle>

            {editing
              ? "Edit Record"
              : "Add Record"}

          </DialogTitle>

        </DialogHeader>

        <DynamicForm
          fields={fields}
          values={values}
          loading={loading}
          onChange={(
            field,
            value
          ) =>
            setValues((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onSubmit={saveRecord}
          onCancel={() =>
            setFormOpen(false)
          }
        />

      </DialogContent>

    </Dialog>

{/* Field Manager */}

    <Dialog
      open={fieldManagerOpen}
      onOpenChange={
        setFieldManagerOpen
      }
    >
      <DialogContent className="max-w-6xl">

        <DialogHeader>

          <DialogTitle>

            Manage Fields

          </DialogTitle>

        </DialogHeader>

        {module && (
          <DynamicFieldManager
            moduleId={module.id}
            fields={fields}
            onRefresh={loadFields}
          />
        )}

      </DialogContent>

    </Dialog>

  </div>
)
}