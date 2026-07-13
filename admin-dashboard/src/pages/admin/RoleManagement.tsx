import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/shared/Modal";
import { useNavigate } from 'react-router-dom';
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ShieldCheck,
  Users as UsersIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getRoles,
  getPermissions,
  createRole,
  updateRole,
  deleteRole,
  //   updateRolePermissions,
  type RoleDTO,
  type PermissionDTO,
} from "@/api/role";

export default function RoleManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  const [isManagePermissionsModalOpen, setIsManagePermissionsModalOpen] =
    useState(false);

  const [selectedRoleForPermissions, setSelectedRoleForPermissions] =
    useState<RoleDTO | null>(null);

  const [permissionDraft, setPermissionDraft] = useState<string[]>([]);

  const [selectedRole, setSelectedRole] = useState<RoleDTO | null>(null);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    permissionIds: string[];
  }>({ name: "", description: "", permissionIds: [] });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await getRoles();
      console.log("roles coming from role managemnt", response);
      setRoles(response.data.data);
    } catch (error) {
      console.log(error);
      toast({
        title: "Failed to load roles",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await getPermissions();

      console.log("permissions", response.data.data);

      setPermissions(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const filteredRoles = useMemo(
    () =>
      roles.filter(
        (role) =>
          role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          role.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [roles, searchQuery],
  );

  const openManagePermissionsModal = (role: RoleDTO) => {
    // setSelectedRoleForPermissions(role);

    setPermissionDraft(role.permissions.map((p) => p.id));

    setIsManagePermissionsModalOpen(true);
  };
  const resetForm = () =>
    setForm({ name: "", description: "", permissionIds: [] });

  const togglePermission = (
    id: string,
    list: string[],
    setList: (ids: string[]) => void,
  ) => {
    setList(list.includes(id) ? list.filter((p) => p !== id) : [...list, id]);
  };

  // ---------- Create ----------
  const handleAddRole = async () => {
    try {
      await createRole({
        name: form.name,
        description: form.description,
        permissionIds: form.permissionIds,
      });
      toast({
        title: "Role created",
        description: `${form.name} has been added successfully.`,
      });
      setIsAddModalOpen(false);
      resetForm();
      fetchRoles();
    } catch (error) {
      console.log(error);
      toast({
        title: "Couldn't create role",
        description: "Please check the details and try again.",
        variant: "destructive",
      });
    }
  };

  // ---------- Edit ----------
  const openEditModal = (role: RoleDTO) => {
    setSelectedRole(role);
    setForm({
      name: role.name,
      description: role.description ?? "",
      permissionIds: role.permissions.map((p) => p.id),
    });
    setIsEditModalOpen(true);
  };

  const handleEditRole = async () => {
    if (!selectedRole) return;
    try {
      await updateRole(selectedRole.id, {
        name: form.name,
        description: form.description,
        permissionIds: form.permissionIds,
      });
      toast({
        title: "Role updated",
        description: `${form.name}'s details have been updated.`,
      });
      setIsEditModalOpen(false);
      fetchRoles();
    } catch (error) {
      console.log(error);
      toast({
        title: "Couldn't update role",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // ---------- Delete ----------
  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    try {
      await deleteRole(selectedRole.id);
      toast({
        title: "Role deleted",
        description: `${selectedRole.name} has been removed.`,
        variant: "destructive",
      });
      setIsDeleteModalOpen(false);
      fetchRoles();
    } catch (error) {
      console.log(error);
      toast({
        title: "Couldn't delete role",
        description:
          "This role may still be assigned to users. Reassign them first.",
        variant: "destructive",
      });
    }
  };

  // ---------- Permissions-only modal ----------
  const openPermissionsModal = (role: RoleDTO) => {
    setSelectedRole(role);
    setPermissionDraft(role.permissions.map((p) => p.id));
    setIsPermissionsModalOpen(true);
  };
  const handleSavePermissions = async () => {
    if (!selectedRoleForPermissions) return;

    try {
      setSavingPermissions(true);

      await updateRole(selectedRoleForPermissions.id, {
        name: selectedRoleForPermissions.name,
        description: selectedRoleForPermissions.description,
        permissionIds: permissionDraft,
      });

      toast({
        title: "Permissions Updated",
        description: "Role permissions updated successfully.",
      });

      setIsManagePermissionsModalOpen(false);

      fetchRoles();
    } catch (error) {
      console.log(error);

      toast({
        title: "Failed",
        description: "Couldn't update permissions.",
        variant: "destructive",
      });
    } finally {
      setSavingPermissions(false);
    }
  };
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Role Management
            </h1>
            <p className="text-muted-foreground">
              Create roles and control what each one can access
            </p>
          </div>
          <div className="flex flex-row gap-2">
            <Button onClick={() => navigate("/admin/permissions")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Permission Management
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Total Roles</p>
            <p className="text-2xl font-bold">{roles.length}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              Permissions Available
            </p>
            <p className="text-2xl font-bold">{permissions.length}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              Users Covered by These Roles
            </p>
            <p className="text-2xl font-bold">
              {roles.reduce((sum, r) => sum + (r.usersCount ?? 0), 0)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    No roles found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <p className="font-medium">{role.name}</p>
                      {role.description && (
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {role.permissions.slice(0, 3).map((p) => (
                          <Badge key={p.id} variant="secondary">
                            {p.code}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => openManagePermissionsModal(role)}
                          >
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                        {role.permissions.length === 0 && (
                          <span className="text-sm text-muted-foreground">
                            No permissions assigned
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <UsersIcon className="h-3.5 w-3.5" />
                        {role.usersCount ?? 0}
                      </div>
                    </TableCell>

                    <TableCell>
                      {new Date(role.createdAt).toLocaleDateString()}
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
                            onClick={() => openPermissionsModal(role)}
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            View / Edit Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(role)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedRole(role);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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

        {/* Add Role Modal */}
        <Modal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          title="Add New Role"
        >
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Support Agent"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="What is this role for?"
              />
            </div>
            <PermissionPicker
              permissions={permissions}
              selected={form.permissionIds}
              onToggle={(id) =>
                togglePermission(id, form.permissionIds, (ids) =>
                  setForm({ ...form, permissionIds: ids }),
                )
              }
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddRole} disabled={!form.name}>
                Add Role
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Role Modal */}
        <Modal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          title="Edit Role"
        >
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <PermissionPicker
              permissions={permissions}
              selected={form.permissionIds}
              onToggle={(id) =>
                togglePermission(id, form.permissionIds, (ids) =>
                  setForm({ ...form, permissionIds: ids }),
                )
              }
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              {/* <Button onClick={handleEditRole} disabled={!form.name}>
                Save Changes
              </Button> */}
            </div>
          </div>
        </Modal>

        {/* Dedicated Permissions Modal (quick view/edit from the table) */}
        <Modal
          open={isPermissionsModalOpen}
          onOpenChange={setIsPermissionsModalOpen}
          title={
            selectedRole ? `Permissions — ${selectedRole.name}` : "Permissions"
          }
        >
          <div className="space-y-4">
            <PermissionPicker
              permissions={permissions}
              selected={permissionDraft}
              onToggle={(id) =>
                togglePermission(id, permissionDraft, setPermissionDraft)
              }
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsPermissionsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                // onClick={handleSavePermissions}
                disabled={savingPermissions}
              >
                {savingPermissions ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          title="Delete Role"
        >
          <div className="space-y-4">
            <p>
              Are you sure you want to delete{" "}
              <strong>{selectedRole?.name}</strong>? Users currently assigned
              this role will lose the permissions it grants. This action cannot
              be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              {/* <Button variant="destructive" onClick={handleDeleteRole}>
                Delete
              </Button> */}
            </div>
          </div>
        </Modal>
        <Modal
          open={isManagePermissionsModalOpen}
          onOpenChange={setIsManagePermissionsModalOpen}
          title={`Manage Permissions ${
            selectedRoleForPermissions
              ? `- ${selectedRoleForPermissions.name}`
              : ""
          }`}
        >
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="font-medium">{selectedRoleForPermissions?.name}</p>

              <p className="text-sm text-muted-foreground">
                {selectedRoleForPermissions?.description ||
                  "No description available."}
              </p>
            </div>

            <PermissionPicker
              permissions={permissions}
              selected={permissionDraft}
              onToggle={(id) =>
                togglePermission(id, permissionDraft, setPermissionDraft)
              }
            />

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Selected Permissions</span>

              <Badge variant="secondary">{permissionDraft.length}</Badge>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsManagePermissionsModalOpen(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSavePermissions}
                disabled={savingPermissions}
              >
                {savingPermissions ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

// Reusable grouped-checkbox picker for assigning permissions to a role.
function PermissionPicker({
  permissions,
  selected,
  onToggle,
}: {
  permissions: any[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (!permissions.length) {
    return (
      <p className="text-sm text-muted-foreground">No permissions available.</p>
    );
  }

  return (
    <div>
      <Label>Permissions</Label>

      <div className="mt-2 max-h-72 overflow-y-auto rounded-md border p-3">
        <div className="grid grid-cols-2 gap-3">
          {permissions.map((perm) => (
            <label
              key={perm.id}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                checked={selected.includes(perm.id)}
                onCheckedChange={() => onToggle(perm.id)}
              />

              <div>
                <p className="font-medium">{perm.code}</p>
                <p className="text-xs text-muted-foreground">
                  {perm.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
