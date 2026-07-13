import {  useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/shared/Modal";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Mail,
  Download,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { getUsers } from "@/api/user";
interface Role {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  lastActive?: string;
  roles: Role[];
}

const roleStyles = {
  admin:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  user: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  moderator:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

const statusStyles = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: "admin" | "user" | "moderator";
    plan: string;
  }>({ name: "", email: "", role: "user", plan: "Starter" });
  const { toast } = useToast();
  useEffect(() => {
    fetchUsers();
  }, []);
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await getUsers();
      console.log(response);

      setUsers(response.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  // const filteredUsers = users.filter(
  //   (user) =>
  //     user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     user.email.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  const handleAddUser = () => {
    const user: User = {
      id: Date.now(),
      ...newUser,
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
      lastActive: "Never",
    };
    setUsers([...users, user]);
    setIsAddModalOpen(false);
    setNewUser({ name: "", email: "", role: "user", plan: "Starter" });
    toast({
      title: "User created",
      description: `${user.name} has been added successfully.`,
    });
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    setUsers(users.map((u) => (u.id === selectedUser.id ? selectedUser : u)));
    setIsEditModalOpen(false);
    toast({
      title: "User updated",
      description: `${selectedUser.name}'s details have been updated.`,
    });
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    setUsers(users.filter((u) => u.id !== selectedUser.id));
    setIsDeleteModalOpen(false);
    toast({
      title: "User deleted",
      description: `${selectedUser.name} has been removed.`,
      variant: "destructive",
    });
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === "active" ? "suspended" : "active";
    setUsers(
      users.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)),
    );
    toast({
      title: newStatus === "active" ? "User activated" : "User suspended",
      description: `${user.name} has been ${newStatus}.`,
    });
  };

  const handleSendEmail = (user: User) => {
    toast({
      title: "Email sent",
      description: `A notification has been sent to ${user.email}.`,
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage all platform users and their permissions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "Exported",
                  description: "User data exported successfully.",
                })
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">
              users.filter((u) => u.isActive)
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Suspended</p>
            <p className="text-2xl font-bold text-red-600">
             users.filter((u) => !u.isActive)
            </p>
          </div>
         
        </div> */}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No Users Found
                  </TableCell>
                </TableRow>
              ) : (
               users.map((user) => (
  <TableRow key={user.id}>
    <TableCell>
      <div>
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-muted-foreground">
          {user.email}
        </p>
      </div>
    </TableCell>

    {/* Roles */}
    <TableCell>
      <div className="flex flex-wrap gap-2">
        {user.roles.map((role) => (
          <Badge
            key={role.id}
            variant="secondary"
          >
            {role.name}
          </Badge>
        ))}
      </div>
    </TableCell>

    {/* Status */}
    <TableCell>
      <Badge
        className={
          user.isActive
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }
      >
        {user.isActive ? "Active" : "Inactive"}
      </Badge>
    </TableCell>

    {/* Created */}
    <TableCell>
      {new Date(user.createdAt).toLocaleDateString()}
    </TableCell>

    {/* Last Active */}
    <TableCell>
      {user.lastActive || "-"}
    </TableCell>

    {/* Permissions */}
    <TableCell>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          navigate(`/admin/users/${user.id}/permissions`)
        }
      >
        Permissions
      </Button>
    </TableCell>

    {/* Actions */}
    <TableCell className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setSelectedUser(user);
              setIsEditModalOpen(true);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleSendEmail(user)}
          >
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleToggleStatus(user)}
          >
            {user.isActive ? (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-destructive"
            onClick={() => {
              setSelectedUser(user);
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

        {/* Add User Modal */}
        <Modal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          title="Add New User"
        >
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                placeholder="Enter name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(v) =>
                  setNewUser({
                    ...newUser,
                    role: v as "admin" | "user" | "moderator",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan</Label>
              <Select
                value={newUser.plan}
                onValueChange={(v) => setNewUser({ ...newUser, plan: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={!newUser.name || !newUser.email}
              >
                Add User
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          title="Edit User"
        >
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={selectedUser.name}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={selectedUser.roles}
                  onValueChange={(v: "admin" | "user" | "moderator") =>
                    setSelectedUser({ ...selectedUser, roles: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditUser}>Save Changes</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          title="Delete User"
        >
          <div className="space-y-4">
            <p>
              Are you sure you want to delete{" "}
              <strong>{selectedUser?.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
