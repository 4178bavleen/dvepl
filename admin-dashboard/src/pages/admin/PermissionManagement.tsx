import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/shared/Modal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, ShieldCheck, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  getPermissionGroups,
  getPermissions,
  flattenPermissionGroups,
  createPermission,
  updatePermission,
  deletePermission,
  type PermissionDTO,
  type PermissionGroupDTO,
} from "@/api/permission";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PermissionManagement() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);

  const [groups, setGroups] = useState<PermissionGroupDTO[]>([]);
  const [permissions, setPermissions] = useState<PermissionDTO[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");

  const [selectedPermission, setSelectedPermission] =
    useState<PermissionDTO | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: "",
    description: "",
    groupId: "",
  });

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
     const response = await getPermissions();

const permissionGroups = response.data.data;

setGroups(permissionGroups);
setPermissions(flattenPermissionGroups(permissionGroups));
    } catch (error) {
      console.error(error);

      toast({
        title: "Failed to load permissions",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      code: "",
      description: "",
      groupId: "",
    });
  };

  const openEditModal = (permission: PermissionDTO) => {
    setSelectedPermission(permission);

    setForm({
      code: permission.code,
      description: permission.description || "",
      groupId: permission.groupId || "",
    });

    setIsEditModalOpen(true);
  };

  const filteredPermissions = useMemo(() => {
    return permissions.filter((permission) => {
      const matchesSearch =
        permission.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        permission.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesGroup =
        selectedGroup === "ALL" || permission.groupId === selectedGroup;

      return matchesSearch && matchesGroup;
    });
  }, [permissions, searchQuery, selectedGroup]);

  const handleCreatePermission = async () => {
    try {
      setSaving(true);

      await createPermission({
        code: form.code,
        description: form.description,
        groupId: form.groupId || null,
      });

      toast({
        title: "Permission Created",
        description: `${form.code} created successfully.`,
      });

      resetForm();

      setIsAddModalOpen(false);

      fetchPermissions();
    } catch (error) {
      console.log(error);

      toast({
        title: "Failed",
        description: "Couldn't create permission.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePermission = async () => {
    if (!selectedPermission) return;

    try {
      setSaving(true);

      await updatePermission(selectedPermission.id, {
        code: form.code,
        description: form.description,
        groupId: form.groupId || null,
      });

      toast({
        title: "Permission Updated",
        description: "Changes saved successfully.",
      });

      setIsEditModalOpen(false);

      fetchPermissions();
    } catch (error) {
      console.log(error);

      toast({
        title: "Failed",
        description: "Couldn't update permission.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePermission = async () => {
    if (!selectedPermission) return;

    try {
      setSaving(true);

      await deletePermission(selectedPermission.id);

      toast({
        title: "Permission Deleted",
        description: `${selectedPermission.code} deleted successfully.`,
      });

      setIsDeleteModalOpen(false);

      fetchPermissions();
    } catch (error) {
      console.log(error);

      toast({
        title: "Failed",
        description: "Couldn't delete permission.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              Permission Management
            </h1>

            <p className="text-muted-foreground mt-1">
              Create, edit and manage all permissions available in the system.
            </p>
          </div>

          <Button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Permission
          </Button>
        </div>

        {/* Dashboard Cards */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total Permissions</p>

            <p className="text-3xl font-bold mt-2">{permissions.length}</p>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm text-muted-foreground">Permission Groups</p>

            <p className="text-3xl font-bold mt-2">{groups.length}</p>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm text-muted-foreground">Custom Permissions</p>

            <p className="text-3xl font-bold mt-2">
              {
                permissions.filter(
                  (p) =>
                    !p.code.startsWith("SYSTEM.") &&
                    !p.code.startsWith("AUTH."),
                ).length
              }
            </p>
          </div>
        </div>

        {/* Search + Filter */}

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              className="pl-10"
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="ALL">All Groups</option>

            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {/* Result Summary */}

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing
            <Badge variant="secondary" className="mx-2">
              {filteredPermissions.length}
            </Badge>
            permissions
          </div>

          {selectedGroup !== "ALL" && (
            <Badge variant="outline">
              {groups.find((g) => g.id === selectedGroup)?.name}
            </Badge>
          )}
        </div>

        {/* Table Container */}

        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    Loading permissions...
                  </TableCell>
                </TableRow>
              ) : filteredPermissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldCheck className="h-8 w-8 text-muted-foreground" />

                      <p className="font-medium">No permissions found</p>

                      <p className="text-sm text-muted-foreground">
                        Try changing the search or create a new permission.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{permission.code}</span>

                        <span className="text-xs text-muted-foreground">
                          {permission.id}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {permission.groupName || "Ungrouped"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {permission.description ? (
                        <span className="text-sm">
                          {permission.description}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant={
                          permission.code.startsWith("SYSTEM.")
                            ? "secondary"
                            : "default"
                        }
                      >
                        {permission.code.startsWith("SYSTEM.")
                          ? "System"
                          : "Custom"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditModal(permission)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Permission
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedPermission(permission);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Permission
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {/* ---------------- Add Permission Modal ---------------- */}

      <Modal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Add Permission"
      >
        <div className="space-y-4">
          <div>
            <Label>Permission Code</Label>

            <Input
              placeholder="USER.CREATE"
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code: e.target.value.toUpperCase(),
                })
              }
            />

            <p className="mt-1 text-xs text-muted-foreground">
              Example: USER.CREATE, ROLE.UPDATE
            </p>
          </div>

          <div>
            <Label>Permission Group</Label>

            <select
              className="w-full h-10 rounded-md border bg-background px-3"
              value={form.groupId}
              onChange={(e) =>
                setForm({
                  ...form,
                  groupId: e.target.value,
                })
              }
            >
              <option value="">Select Group</option>

              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Description</Label>

            <Textarea
              rows={4}
              placeholder="Create User"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsAddModalOpen(false);
              }}
            >
              Cancel
            </Button>

            <Button
              disabled={!form.code || !form.groupId || saving}
              onClick={handleCreatePermission}
            >
              {saving ? "Creating..." : "Create Permission"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---------------- Edit Permission Modal ---------------- */}

      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Edit Permission"
      >
        <div className="space-y-4">
          <div>
            <Label>Permission Code</Label>

            <Input
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code: e.target.value.toUpperCase(),
                })
              }
            />
          </div>

          <div>
            <Label>Permission Group</Label>

            <select
              className="w-full h-10 rounded-md border bg-background px-3"
              value={form.groupId}
              onChange={(e) =>
                setForm({
                  ...form,
                  groupId: e.target.value,
                })
              }
            >
              <option value="">Select Group</option>

              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Description</Label>

            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>

            <Button
              disabled={!form.code || !form.groupId || saving}
              onClick={handleUpdatePermission}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---------------- Delete Confirmation ---------------- */}

      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Permission"
      >
        <div className="space-y-5">
          <p>
            Are you sure you want to delete
            <strong> {selectedPermission?.code}</strong>?
          </p>

          <p className="text-sm text-muted-foreground">
            This permission will be removed from every role that currently uses
            it.
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              disabled={saving}
              onClick={handleDeletePermission}
            >
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
