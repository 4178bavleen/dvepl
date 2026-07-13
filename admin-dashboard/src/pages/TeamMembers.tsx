import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/shared/Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Shield,
  Users,
  UserCheck,
  Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'agent' | 'viewer';
  status: 'active' | 'invited' | 'inactive';
  avatar?: string;
  lastActive: string;
  assignedChats: number;
  resolvedToday: number;
  joinedAt: string;
}

const initialMembers: TeamMember[] = [
  { id: 1, name: 'John Doe', email: 'john@company.com', role: 'owner', status: 'active', lastActive: 'Online now', assignedChats: 0, resolvedToday: 0, joinedAt: '2024-01-01' },
  { id: 2, name: 'Sarah Wilson', email: 'sarah@company.com', role: 'admin', status: 'active', lastActive: '5 mins ago', assignedChats: 12, resolvedToday: 8, joinedAt: '2024-01-15' },
  { id: 3, name: 'Mike Johnson', email: 'mike@company.com', role: 'agent', status: 'active', lastActive: '2 hours ago', assignedChats: 24, resolvedToday: 15, joinedAt: '2024-02-01' },
  { id: 4, name: 'Emily Chen', email: 'emily@company.com', role: 'agent', status: 'active', lastActive: '1 hour ago', assignedChats: 18, resolvedToday: 12, joinedAt: '2024-02-10' },
  { id: 5, name: 'Tom Brown', email: 'tom@company.com', role: 'agent', status: 'invited', lastActive: 'Never', assignedChats: 0, resolvedToday: 0, joinedAt: '2024-03-01' },
  { id: 6, name: 'Lisa Park', email: 'lisa@company.com', role: 'viewer', status: 'inactive', lastActive: '2 weeks ago', assignedChats: 0, resolvedToday: 0, joinedAt: '2024-01-20' },
];

const roleStyles = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  agent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const statusStyles = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  invited: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const rolePermissions = {
  owner: ['Full access', 'Billing', 'Team management', 'All features'],
  admin: ['Team management', 'Settings', 'Analytics', 'All chats'],
  agent: ['Assigned chats', 'Contacts', 'Broadcasts'],
  viewer: ['View analytics', 'View chats (read-only)'],
};

export default function TeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'agent' | 'viewer'>('agent');
  const { toast } = useToast();

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = () => {
    const newMember: TeamMember = {
      id: Date.now(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'invited',
      lastActive: 'Never',
      assignedChats: 0,
      resolvedToday: 0,
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setMembers([...members, newMember]);
    setIsInviteModalOpen(false);
    setInviteEmail('');
    toast({ title: 'Invitation sent', description: `An invitation has been sent to ${inviteEmail}.` });
  };

  const handleUpdateRole = () => {
    if (!selectedMember) return;
    setMembers(members.map((m) => (m.id === selectedMember.id ? selectedMember : m)));
    setIsEditModalOpen(false);
    toast({ title: 'Role updated', description: `${selectedMember.name}'s role has been updated.` });
  };

  const handleRemove = () => {
    if (!selectedMember) return;
    setMembers(members.filter((m) => m.id !== selectedMember.id));
    setIsDeleteModalOpen(false);
    toast({ title: 'Member removed', description: `${selectedMember.name} has been removed from the team.`, variant: 'destructive' });
  };

  const handleResendInvite = (member: TeamMember) => {
    toast({ title: 'Invitation resent', description: `A new invitation has been sent to ${member.email}.` });
  };

  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === 'active').length,
    agents: members.filter((m) => m.role === 'agent').length,
    pendingInvites: members.filter((m) => m.status === 'invited').length,
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header />
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Team Members</h1>
              <p className="text-muted-foreground">Manage your team and their permissions</p>
            </div>
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.agents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Invites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingInvites}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Chats</TableHead>
                  <TableHead>Resolved Today</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${roleStyles[member.role]} cursor-pointer`}
                        onClick={() => { setSelectedMember(member); setIsRoleModalOpen(true); }}
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusStyles[member.status]}>{member.status}</Badge>
                    </TableCell>
                    <TableCell>{member.assignedChats}</TableCell>
                    <TableCell>{member.resolvedToday}</TableCell>
                    <TableCell className="text-muted-foreground">{member.lastActive}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsEditModalOpen(true); }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Role
                          </DropdownMenuItem>
                          {member.status === 'invited' && (
                            <DropdownMenuItem onClick={() => handleResendInvite(member)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Resend Invite
                            </DropdownMenuItem>
                          )}
                          {member.role !== 'owner' && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { setSelectedMember(member); setIsDeleteModalOpen(true); }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Invite Modal */}
          <Modal open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen} title="Invite Team Member">
            <div className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v: 'admin' | 'agent' | 'viewer') => setInviteRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Permissions:</p>
                  <ul className="text-sm text-muted-foreground">
                    {rolePermissions[inviteRole].map((perm, i) => (
                      <li key={i}>• {perm}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
                <Button onClick={handleInvite} disabled={!inviteEmail}>Send Invitation</Button>
              </div>
            </div>
          </Modal>

          {/* Edit Role Modal */}
          <Modal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} title="Edit Member Role">
            {selectedMember && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Avatar>
                    <AvatarFallback>{selectedMember.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedMember.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                  </div>
                </div>
                <div>
                  <Label>Role</Label>
                  <Select
                    value={selectedMember.role}
                    onValueChange={(v: 'admin' | 'agent' | 'viewer') => setSelectedMember({ ...selectedMember, role: v })}
                    disabled={selectedMember.role === 'owner'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdateRole}>Update Role</Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Role Info Modal */}
          <Modal open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen} title="Role Permissions">
            {selectedMember && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={roleStyles[selectedMember.role]}>{selectedMember.role}</Badge>
                  <span className="font-medium">{selectedMember.name}</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Permissions:</p>
                  <ul className="space-y-1">
                    {rolePermissions[selectedMember.role].map((perm, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        {perm}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setIsRoleModalOpen(false)}>Close</Button>
              </div>
            )}
          </Modal>

          {/* Delete Modal */}
          <Modal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} title="Remove Team Member">
            <div className="space-y-4">
              <p>Are you sure you want to remove <strong>{selectedMember?.name}</strong> from the team?</p>
              <p className="text-sm text-muted-foreground">They will lose access to all conversations and data.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleRemove}>Remove Member</Button>
              </div>
            </div>
          </Modal>
        </div>
      </main>
    </div>
  );
}
