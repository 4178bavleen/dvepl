import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Network,
  Building2,
  Users,
  UsersRound,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

import { getDepartmentById , getDepartments ,createDepartment ,updateDepartment ,deleteDepartment} from "@/api/department";
// import { getDepartments } from "@/api/department";
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from "@/api/branch";
import { employeeApi } from "@/api/employee";
import { getTeams, createTeam, updateTeam, deleteTeam } from "@/api/team";
import {
  Company,
  Department,
  Branch,
  Employee,
  Team,
  CreateDepartmentPayload,
  CreateBranchPayload,
  CreateEmployeePayload,
  CreateTeamPayload,
} from "@/types/company";

export default function OrganizationDetail() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  const [org, setOrg] = useState<Company | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    setLoadingOrg(true);
    getDepartments(orgId)
      .then(setOrg)
      .catch(() => toast.error("Failed to load organization"))
      .finally(() => setLoadingOrg(false));
  }, [orgId]);

  if (!orgId) return null;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/organizations")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {loadingOrg ? "Loading..." : org?.name}
            </h1>
            <p className="text-muted-foreground">
              Departments, branches, teams and employees
            </p>
          </div>
          {org && (
            <Badge className="ml-2" variant="outline">
              {org.status}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="departments" className="w-full">
          <TabsList>
            <TabsTrigger value="departments" className="gap-2">
              <Network className="h-4 w-4" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="branches" className="gap-2">
              <Building2 className="h-4 w-4" />
              Branches
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <UsersRound className="h-4 w-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="employees" className="gap-2">
              <Users className="h-4 w-4" />
              Employees
            </TabsTrigger>
          </TabsList>

          <TabsContent value="departments" className="mt-4">
            <DepartmentsTab orgId={orgId} />
          </TabsContent>
          <TabsContent value="branches" className="mt-4">
            <BranchesTab orgId={orgId} />
          </TabsContent>
          <TabsContent value="teams" className="mt-4">
            <TeamsTab orgId={orgId} departments={[]} branches={[]} />
          </TabsContent>
          <TabsContent value="employees" className="mt-4">
            <EmployeesTab orgId={orgId} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

/* ---------------------------------------------------------------------- */
/* Departments                                                             */
/* ---------------------------------------------------------------------- */

function DepartmentsTab({ orgId }: { orgId: string }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<CreateDepartmentPayload>({
    name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      setDepartments(await departmentApi.list(orgId));
    } catch {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({ name: dept.name, description: dept.description || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Department name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const updated = await departmentApi.update(orgId, editing.id, form);
        setDepartments((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d)),
        );
        toast.success("Department updated");
      } else {
        const created = await departmentApi.create(orgId, form);
        setDepartments((prev) => [created, ...prev]);
        toast.success("Department created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await departmentApi.delete(orgId, deleteTarget.id);
      setDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      toast.success("Department deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete department");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Departments</CardTitle>
          <CardDescription>
            Functional units within the organization
          </CardDescription>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingRow label="Loading departments..." />
        ) : departments.length === 0 ? (
          <EmptyRow icon={Network} label="No departments yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Head</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dept.description || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {dept.headName || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {dept.employeeCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      onEdit={() => openEdit(dept)}
                      onDelete={() => setDeleteTarget(dept)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Department" : "New Department"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update department details."
                : "Add a new department to this organization."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Engineering"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={!!deleteTarget}
        name={deleteTarget?.name}
        entity="department"
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Card>
  );
}

/* ---------------------------------------------------------------------- */
/* Branches                                                                */
/* ---------------------------------------------------------------------- */

const emptyBranchForm: CreateBranchPayload = {
  name: "",
  code: "",
  address: "",
  city: "",
  state: "",
  country: "",
  phone: "",
  isHeadOffice: false,
};

function BranchesTab({ orgId }: { orgId: string }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState<CreateBranchPayload>(emptyBranchForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      setBranches(await getBranches(orgId));
    } catch {
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyBranchForm);
    setDialogOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setForm({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      state: branch.state || "",
      country: branch.country,
      phone: branch.phone || "",
      isHeadOffice: branch.isHeadOffice,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (
      !form.name.trim() ||
      !form.code.trim() ||
      !form.city.trim() ||
      !form.country.trim()
    ) {
      toast.error("Name, code, city and country are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateBranch(orgId, editing.id, form);
        setBranches((prev) =>
          prev.map((b) => (b.id === updated.id ? updated : b)),
        );
        toast.success("Branch updated");
      } else {
        const created = await createBranch(orgId, form);
        setBranches((prev) => [created, ...prev]);
        toast.success("Branch created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save branch");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBranch(orgId, deleteTarget.id);
      setBranches((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast.success("Branch deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete branch");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Branches</CardTitle>
          <CardDescription>
            Physical office locations for this organization
          </CardDescription>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Branch
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingRow label="Loading branches..." />
        ) : branches.length === 0 ? (
          <EmptyRow icon={Building2} label="No branches yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Head Office</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {branch.code}
                  </TableCell>
                  <TableCell className="text-sm">
                    {branch.city}
                    {branch.state ? `, ${branch.state}` : ""}, {branch.country}
                  </TableCell>
                  <TableCell className="text-sm">
                    {branch.employeeCount}
                  </TableCell>
                  <TableCell>
                    {branch.isHeadOffice && <Badge variant="outline">HQ</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      onEdit={() => openEdit(branch)}
                      onDelete={() => setDeleteTarget(branch)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Branch" : "New Branch"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update branch details."
                : "Add a new branch location for this organization."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ludhiana Branch"
                />
              </div>
              <div className="grid gap-2">
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="LDH-01"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>City *</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Country *</Label>
                <Input
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <input
                  id="isHeadOffice"
                  type="checkbox"
                  checked={form.isHeadOffice}
                  onChange={(e) =>
                    setForm({ ...form, isHeadOffice: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="isHeadOffice" className="cursor-pointer">
                  Mark as head office
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={!!deleteTarget}
        name={deleteTarget?.name}
        entity="branch"
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Card>
  );
}

/* ---------------------------------------------------------------------- */
/* Teams                                                                   */
/* ---------------------------------------------------------------------- */

function TeamsTab({
  orgId,
}: {
  orgId: string;
  departments: Department[];
  branches: Branch[];
}) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [form, setForm] = useState<CreateTeamPayload>({
    name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      setTeams(await getTeams(orgId));
    } catch {
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (team: Team) => {
    setEditing(team);
    setForm({ name: team.name, description: team.description || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Team name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateTeam(orgId, editing.id, form);
        setTeams((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t)),
        );
        toast.success("Team updated");
      } else {
        const created = await createTeam(orgId, form);
        setTeams((prev) => [created, ...prev]);
        toast.success("Team created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save team");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTeam(orgId, deleteTarget.id);
      setTeams((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success("Team deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete team");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            Cross-functional or department-level teams
          </CardDescription>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Team
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingRow label="Loading teams..." />
        ) : teams.length === 0 ? (
          <EmptyRow icon={UsersRound} label="No teams yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {team.description || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {team.leadName || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{team.memberCount}</TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      onEdit={() => openEdit(team)}
                      onDelete={() => setDeleteTarget(team)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Team" : "New Team"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update team details."
                : "Create a new team within this organization."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Platform Team"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={!!deleteTarget}
        name={deleteTarget?.name}
        entity="team"
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Card>
  );
}

/* ---------------------------------------------------------------------- */
/* Employees                                                                */
/* ---------------------------------------------------------------------- */

const emptyEmployeeForm: CreateEmployeePayload = {
  name: "",
  email: "",
  phone: "",
  designation: "",
  status: "active",
};

function EmployeesTab({ orgId }: { orgId: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<CreateEmployeePayload>(emptyEmployeeForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      setEmployees(await employeeApi.list(orgId));
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyEmployeeForm);
    setDialogOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setForm({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      designation: employee.designation || "",
      status: employee.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const updated = await employeeApi.update(orgId, editing.id, form);
        setEmployees((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e)),
        );
        toast.success("Employee updated");
      } else {
        const created = await employeeApi.create(orgId, form);
        setEmployees((prev) => [created, ...prev]);
        toast.success("Employee added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save employee");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await employeeApi.delete(orgId, deleteTarget.id);
      setEmployees((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast.success("Employee removed");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to remove employee");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Employees</CardTitle>
          <CardDescription>
            People across all departments and branches
          </CardDescription>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingRow label="Loading employees..." />
        ) : employees.length === 0 ? (
          <EmptyRow icon={Users} label="No employees yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {emp.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {emp.designation || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {emp.phone || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        emp.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }
                    >
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      onEdit={() => openEdit(emp)}
                      onDelete={() => setDeleteTarget(emp)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Employee" : "Add Employee"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update employee details."
                : "Add a new employee to this organization."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Designation</Label>
                <Input
                  value={form.designation}
                  onChange={(e) =>
                    setForm({ ...form, designation: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value: "active" | "inactive") =>
                  setForm({ ...form, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save changes" : "Add employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={!!deleteTarget}
        name={deleteTarget?.name}
        entity="employee"
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Card>
  );
}

/* ---------------------------------------------------------------------- */
/* Shared small components                                                 */
/* ---------------------------------------------------------------------- */

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
      <Loader2 className="h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}

function EmptyRow({
  icon: Icon,
  label,
}: {
  icon: typeof Network;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function DeleteConfirm({
  open,
  name,
  entity,
  deleting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  name?: string;
  entity: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entity}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{name}</strong>. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
