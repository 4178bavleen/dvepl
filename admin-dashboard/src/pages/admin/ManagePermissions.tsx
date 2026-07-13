// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { AdminLayout } from "@/components/layouts/AdminLayout";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Modal } from "@/components/shared/Modal";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Search,
//   Plus,
//   MoreHorizontal,
//   Edit,
//   Trash2,
//   ArrowLeft,
//   ShieldAlert,
// } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import {
//   getPermissionGroups,
//   flattenPermissionGroups,
//   createPermission,
//   updatePermission,
//   deletePermission,
//   type PermissionDTO,
//   type PermissionGroupDTO,
// } from "@/api/permission";

// const NO_GROUP = "__none__";

// export default function ManagePermissions() {
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   const [groups, setGroups] = useState<PermissionGroupDTO[]>([]);
//   const [permissions, setPermissions] = useState<PermissionDTO[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");

//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [selectedPermission, setSelectedPermission] =
//     useState<PermissionDTO | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [deleteBlocked, setDeleteBlocked] = useState<{
//     assignedToRoles: number;
//     assignedToUsers: number;
//   } | null>(null);

//   const [form, setForm] = useState<{
//     code: string;
//     description: string;
//     groupId: string;
//   }>({ code: "", description: "", groupId: NO_GROUP });

//   useEffect(() => {
//     fetchPermissions();
//   }, []);

//   const fetchPermissions = async () => {
//     try {
//       setLoading(true);
//       const response = await getPermissionGroups();
//       const data: PermissionGroupDTO[] = response.data.data;
//       setGroups(data);
//       setPermissions(flattenPermissionGroups(data));
//     } catch (error) {
//       console.log(error);
//       toast({
//         title: "Failed to load permissions",
//         description: "Please try again in a moment.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredPermissions = useMemo(
//     () =>
//       permissions.filter(
//         (p) =>
//           p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           p.groupName?.toLowerCase().includes(searchQuery.toLowerCase()),
//       ),
//     [permissions, searchQuery],
//   );

//   const resetForm = () =>
//     setForm({ code: "", description: "", groupId: NO_GROUP });

//   // ---------- Create ----------
//   const handleAddPermission = async () => {
//     try {
//       setSaving(true);
//       await createPermission({
//         code: form.code.trim().toLowerCase(),
//         description: form.description || undefined,
//         groupId: form.groupId === NO_GROUP ? null : form.groupId,
//       });
//       toast({
//         title: "Permission created",
//         description: `${form.code} has been added to the catalog.`,
//       });
//       setIsAddModalOpen(false);
//       resetForm();
//       fetchPermissions();
//     } catch (error: any) {
//       console.log(error);
//       toast({
//         title: "Couldn't create permission",
//         description:
//           error?.response?.data?.message ??
//           "That code may already exist. Please check and try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ---------- Edit ----------
//   const openEditModal = (permission: PermissionDTO) => {
//     setSelectedPermission(permission);
//     setForm({
//       code: permission.code,
//       description: permission.description ?? "",
//       groupId: permission.groupId ?? NO_GROUP,
//     });
//     setIsEditModalOpen(true);
//   };

//   const handleEditPermission = async () => {
//     if (!selectedPermission) return;
//     try {
//       setSaving(true);
//       await updatePermission(selectedPermission.id, {
//         code: form.code.trim().toLowerCase(),
//         description: form.description || undefined,
//         groupId: form.groupId === NO_GROUP ? null : form.groupId,
//       });
//       toast({
//         title: "Permission updated",
//         description: `${form.code} has been updated.`,
//       });
//       setIsEditModalOpen(false);
//       fetchPermissions();
//     } catch (error: any) {
//       console.log(error);
//       toast({
//         title: "Couldn't update permission",
//         description: error?.response?.data?.message ?? "Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ---------- Delete ----------
//   const openDeleteModal = (permission: PermissionDTO) => {
//     setSelectedPermission(permission);
//     setDeleteBlocked(null);
//     setIsDeleteModalOpen(true);
//   };

//   const handleDeletePermission = async (force = false) => {
//     if (!selectedPermission) return;
//     try {
//       setSaving(true);
//       await deletePermission(selectedPermission.id, force);
//       toast({
//         title: "Permission deleted",
//         description: `${selectedPermission.code} has been removed.`,
//         variant: "destructive",
//       });
//       setIsDeleteModalOpen(false);
//       setDeleteBlocked(null);
//       fetchPermissions();
//     } catch (error: any) {
//       console.log(error);
//       const conflict = error?.response?.data;
//       if (error?.response?.status === 409 && conflict?.data) {
//         // In use elsewhere — offer the force option instead of a dead end.
//         setDeleteBlocked(conflict.data);
//       } else {
//         toast({
//           title: "Couldn't delete permission",
//           description: conflict?.message ?? "Please try again.",
//           variant: "destructive",
//         });
//       }
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <AdminLayout>
//       <div className="p-6 space-y-6">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div>
//             <Button
//               variant="ghost"
//               size="sm"
//               className="mb-2 -ml-2 text-muted-foreground"
//               onClick={() => navigate("/admin/roles")}
//             >
//               <ArrowLeft className="h-4 w-4 mr-1" />
//               Back to Roles
//             </Button>
//             <h1 className="text-3xl font-bold text-foreground">
//               Manage Permissions
//             </h1>
//             <p className="text-muted-foreground">
//               The full catalog of permissions that can be assigned to roles
//             </p>
//           </div>
//           <Button
//             onClick={() => {
//               resetForm();
//               setIsAddModalOpen(true);
//             }}
//           >
//             <Plus className="h-4 w-4 mr-2" />
//             Add Permission
//           </Button>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           <div className="bg-card p-4 rounded-lg border">
//             <p className="text-sm text-muted-foreground">Total Permissions</p>
//             <p className="text-2xl font-bold">{permissions.length}</p>
//           </div>
//           <div className="bg-card p-4 rounded-lg border">
//             <p className="text-sm text-muted-foreground">Groups</p>
//             <p className="text-2xl font-bold">{groups.length}</p>
//           </div>
//         </div>

//         {/* Search */}
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input
//             placeholder="Search permissions..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="pl-10 max-w-sm"
//           />
//         </div>

//         {/* Table */}
//         <div className="bg-card rounded-lg border overflow-hidden">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Code</TableHead>
//                 <TableHead>Description</TableHead>
//                 <TableHead>Group</TableHead>
//                 <TableHead className="text-right">Actions</TableHead>
//               </TableRow>
//             </TableHeader>

//             <TableBody>
//               {loading ? (
//                 <TableRow>
//                   <TableCell colSpan={4} className="text-center py-6">
//                     Loading...
//                   </TableCell>
//                 </TableRow>
//               ) : filteredPermissions.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={4} className="text-center py-6">
//                     No permissions found
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 filteredPermissions.map((permission) => (
//                   <TableRow key={permission.id}>
//                     <TableCell>
//                       <span className="font-mono text-sm">
//                         {permission.code}
//                       </span>
//                     </TableCell>
//                     <TableCell className="text-sm text-muted-foreground">
//                       {permission.description || "—"}
//                     </TableCell>
//                     <TableCell>
//                       {permission.groupName ? (
//                         <Badge variant="secondary">
//                           {permission.groupName}
//                         </Badge>
//                       ) : (
//                         <span className="text-sm text-muted-foreground">
//                           Ungrouped
//                         </span>
//                       )}
//                     </TableCell>
//                     <TableCell className="text-right">
//                       <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                           <Button variant="ghost" size="icon">
//                             <MoreHorizontal className="h-4 w-4" />
//                           </Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end">
//                           <DropdownMenuItem
//                             onClick={() => openEditModal(permission)}
//                           >
//                             <Edit className="mr-2 h-4 w-4" />
//                             Edit
//                           </DropdownMenuItem>
//                           <DropdownMenuItem
//                             className="text-destructive"
//                             onClick={() => openDeleteModal(permission)}
//                           >
//                             <Trash2 className="mr-2 h-4 w-4" />
//                             Delete
//                           </DropdownMenuItem>
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </div>

//         {/* Add Permission Modal */}
//         <Modal
//           open={isAddModalOpen}
//           onOpenChange={setIsAddModalOpen}
//           title="Add New Permission"
//         >
//           <div className="space-y-4">
//             <div>
//               <Label>Code</Label>
//               <Input
//                 value={form.code}
//                 onChange={(e) => setForm({ ...form, code: e.target.value })}
//                 placeholder="e.g. tender.approve"
//                 className="font-mono"
//               />
//               <p className="text-xs text-muted-foreground mt-1">
//                 Lowercase, dot-separated convention (module.action).
//               </p>
//             </div>
//             <div>
//               <Label>Description</Label>
//               <Textarea
//                 value={form.description}
//                 onChange={(e) =>
//                   setForm({ ...form, description: e.target.value })
//                 }
//                 placeholder="What does this permission allow?"
//               />
//             </div>
//             <div>
//               <Label>Group</Label>
//               <Select
//                 value={form.groupId}
//                 onValueChange={(v) => setForm({ ...form, groupId: v })}
//               >
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value={NO_GROUP}>No group</SelectItem>
//                   {groups.map((group) => (
//                     <SelectItem key={group.id} value={group.id}>
//                       {group.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="flex gap-2 justify-end">
//               <Button
//                 variant="outline"
//                 onClick={() => setIsAddModalOpen(false)}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleAddPermission}
//                 disabled={!form.code || saving}
//               >
//                 {saving ? "Adding..." : "Add Permission"}
//               </Button>
//             </div>
//           </div>
//         </Modal>

//         {/* Edit Permission Modal */}
//         <Modal
//           open={isEditModalOpen}
//           onOpenChange={setIsEditModalOpen}
//           title="Edit Permission"
//         >
//           <div className="space-y-4">
//             <div>
//               <Label>Code</Label>
//               <Input
//                 value={form.code}
//                 onChange={(e) => setForm({ ...form, code: e.target.value })}
//                 className="font-mono"
//               />
//             </div>
//             <div>
//               <Label>Description</Label>
//               <Textarea
//                 value={form.description}
//                 onChange={(e) =>
//                   setForm({ ...form, description: e.target.value })
//                 }
//               />
//             </div>
//             <div>
//               <Label>Group</Label>
//               <Select
//                 value={form.groupId}
//                 onValueChange={(v) => setForm({ ...form, groupId: v })}
//               >
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value={NO_GROUP}>No group</SelectItem>
//                   {groups.map((group) => (
//                     <SelectItem key={group.id} value={group.id}>
//                       {group.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="flex gap-2 justify-end">
//               <Button
//                 variant="outline"
//                 onClick={() => setIsEditModalOpen(false)}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleEditPermission}
//                 disabled={!form.code || saving}
//               >
//                 {saving ? "Saving..." : "Save Changes"}
//               </Button>
//             </div>
//           </div>
//         </Modal>

//         {/* Delete Confirmation Modal */}
//         <Modal
//           open={isDeleteModalOpen}
//           onOpenChange={(open) => {
//             setIsDeleteModalOpen(open);
//             if (!open) setDeleteBlocked(null);
//           }}
//           title="Delete Permission"
//         >
//           <div className="space-y-4">
//             {!deleteBlocked ? (
//               <p>
//                 Are you sure you want to delete{" "}
//                 <strong className="font-mono">
//                   {selectedPermission?.code}
//                 </strong>
//                 ? This action cannot be undone.
//               </p>
//             ) : (
//               <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
//                 <div className="flex items-center gap-2 text-destructive font-medium">
//                   <ShieldAlert className="h-4 w-4" />
//                   This permission is still in use
//                 </div>
//                 <p className="text-sm text-muted-foreground">
//                   Assigned to {deleteBlocked.assignedToRoles} role(s) and{" "}
//                   {deleteBlocked.assignedToUsers} user override(s). Deleting it
//                   will remove it from all of them.
//                 </p>
//               </div>
//             )}
//             <div className="flex gap-2 justify-end">
//               <Button
//                 variant="outline"
//                 onClick={() => setIsDeleteModalOpen(false)}
//               >
//                 Cancel
//               </Button>
//               {!deleteBlocked ? (
//                 <Button
//                   variant="destructive"
//                   onClick={() => handleDeletePermission(false)}
//                   disabled={saving}
//                 >
//                   {saving ? "Deleting..." : "Delete"}
//                 </Button>
//               ) : (
//                 <Button
//                   variant="destructive"
//                   onClick={() => handleDeletePermission(true)}
//                   disabled={saving}
//                 >
//                   {saving ? "Removing..." : "Remove Everywhere & Delete"}
//                 </Button>
//               )}
//             </div>
//           </div>
//         </Modal>
//       </div>
//     </AdminLayout>
//   );
// }
