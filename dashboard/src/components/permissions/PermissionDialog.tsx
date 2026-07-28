import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Shield,
  LayoutGrid,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Download,
} from "lucide-react";
import { PermissionRow } from "./../permissions/permissionRow";
import { PERMISSION_MODULES } from "../../configs/permissionConfig";
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: any;
}

const pages = [
  "Dashboard",
  "CRM",
  "HRMS",
  "Inventory",
  "Purchase",
  "Sales",
  "Finance",
  "Reports",
  "Settings",
  "Vendors",
  "Customers",
  "Employees",
];

const modules = [
  {
    name: "Inventory",
    actions: ["View", "Create", "Edit", "Delete", "Export"],
    fields: [
      "Item Name",
      "Code",
      "Category",
      "Unit",
      "GST",
      "Rate",
      "Vendor",
      "Stock",
    ],
  },
  {
    name: "CRM",
    actions: ["View", "Create", "Edit", "Delete"],
    fields: ["Customer Name", "Phone", "Email", "GST Number", "Address"],
  },
];

export function PermissionsDialog({ open, onOpenChange, user }: Props) {
  const [pagePermissions, setPagePermissions] = useState<string[]>([]);
  const [actionPermissions, setActionPermissions] = useState<
    Record<string, string[]>
  >({});
  const [fieldPermissions, setFieldPermissions] = useState<
    Record<
      string,
      Record<
        string,
        {
          visible: boolean;
          editable: boolean;
          required: boolean;
        }
      >
    >
  >({});

  useEffect(() => {
    if (!open) return;

    setPagePermissions([
      "Dashboard",
      "CRM",
      "Inventory",
      "Purchase",
      "Vendors",
    ]);

    setActionPermissions({
      Inventory: ["View", "Create", "Edit"],
      CRM: ["View", "Create"],
    });

    setFieldPermissions({
      Inventory: {
        "Item Name": {
          visible: true,
          editable: true,
          required: true,
        },
        Code: {
          visible: true,
          editable: false,
          required: true,
        },
        GST: {
          visible: true,
          editable: false,
          required: false,
        },
      },

      CRM: {
        "Customer Name": {
          visible: true,
          editable: true,
          required: true,
        },
        Phone: {
          visible: true,
          editable: false,
          required: false,
        },
      },
    });
  }, [open]);

  const togglePage = (page: string) => {
    setPagePermissions((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page],
    );
  };

  const applyPreset = (type: "full" | "view" | "none") => {
    if (type === "none") {
      setPagePermissions([]);
      return;
    }

    if (type === "full") {
      setPagePermissions(pages);
      return;
    }

    if (type === "view") {
      setPagePermissions(pages);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        {/* Header */}

        <div className="border-b bg-muted/30 px-8 py-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Manage User Permissions
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">{user?.name}</p>

              <p className="text-muted-foreground text-sm">
                Configure module, page and field level permissions.
              </p>
            </div>

            <Badge className="px-4 py-2">{pagePermissions.length} Pages</Badge>
          </div>
        </div>

        {/* Body */}

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Quick Presets */}

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Quick Presets</h3>

              <div className="flex gap-3">
                <Button variant="default" onClick={() => applyPreset("full")}>
                  Full Access
                </Button>

                <Button variant="secondary" onClick={() => applyPreset("view")}>
                  View Only
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => applyPreset("none")}
                >
                  No Access
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Page Access */}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <LayoutGrid className="w-5 h-5" />

                <h3 className="font-semibold text-lg">Page Access</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {pages.map((page) => (
                  <div
                    key={page}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Checkbox
                      checked={pagePermissions.includes(page)}
                      onCheckedChange={() => togglePage(page)}
                    />

                    <span className="text-sm font-medium">{page}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Module Permission Section */}

          {/* Module Permission Section */}

          <Accordion type="multiple" className="space-y-4">
            {modules.map((module) => (
              <AccordionItem
                key={module.name}
                value={module.name}
                className="border rounded-xl"
              >
                <AccordionTrigger className="px-6">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{module.name}</span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 pb-6">
                  {/* Module Actions */}

                  <div className="mb-8">
                    <h4 className="font-semibold mb-4">Module Permissions</h4>

                    <div className="grid grid-cols-5 gap-4">
                      {module.actions.map((action) => {
                        const checked =
                          actionPermissions[module.name]?.includes(action);

                        return (
                          <div
                            key={action}
                            className="border rounded-lg p-4 flex flex-col items-center gap-2"
                          >
                            {action === "View" && (
                              <Eye className="h-5 w-5 text-blue-600" />
                            )}

                            {action === "Create" && (
                              <Plus className="h-5 w-5 text-green-600" />
                            )}

                            {action === "Edit" && (
                              <Pencil className="h-5 w-5 text-orange-600" />
                            )}

                            {action === "Delete" && (
                              <Trash2 className="h-5 w-5 text-red-600" />
                            )}

                            {action === "Export" && (
                              <Download className="h-5 w-5 text-purple-600" />
                            )}

                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                setActionPermissions((prev) => {
                                  const current = prev[module.name] || [];

                                  return {
                                    ...prev,
                                    [module.name]: value
                                      ? [...current, action]
                                      : current.filter((a) => a !== action),
                                  };
                                });
                              }}
                            />

                            <span className="text-sm">{action}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Footer */}

        <div className="border-t bg-muted/20 px-8 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button>Save Permissions</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
