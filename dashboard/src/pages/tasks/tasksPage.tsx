import React, { useState, useEffect, useMemo } from "react";
import { 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Calendar, 
  User, 
  X,
  Loader2,
  Info
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { hrmsApi } from "@/services/modules";

// Definitions
interface Task {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  status: "pending" | "in-progress" | "completed";
  assignedUsers: Array<{ id: string; name: string }>;
  notifEnabled: boolean;
  notifType: "automatic" | "manual";
  notifDays: number;
  notifUnit: "days" | "hours";
  notifFrequency: "once" | "daily" | "every-12h";
  createdAt: string;
}

// ==========================================
// API ADAPTERS (EASILY REPLACE WITH AXIOS/FETCH LATER)
// ==========================================
export const apiService = {
  tasks: {
    list: async (): Promise<Task[]> => {
      return hrmsApi.tasks.list() as unknown as Task[];
    },
    create: async (task: any): Promise<any> => {
      return hrmsApi.tasks.create(task);
    },
    update: async (id: string, task: any): Promise<any> => {
      return hrmsApi.tasks.update!(id, task);
    },
    delete: async (id: string): Promise<void> => {
      return hrmsApi.tasks.remove!(id);
    },
    updateNotification: async (id: string, config: any): Promise<any> => {
      return hrmsApi.tasks.updateNotification(id, config);
    },
    sendReminders: async (): Promise<any> => {
      return hrmsApi.tasks.sendReminders();
    }
  },
  employees: {
    list: async (): Promise<Array<{ id: string; name: string }>> => {
      const employees = await hrmsApi.employees.list();
      return employees.map((emp: any) => ({
        id: emp.userId || emp.id,
        name: emp.user?.name || `${emp.firstName} ${emp.lastName}`
      }));
    }
  }
};

export default function TasksPage() {
  // Empty Database States (Mock data removed)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState("");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [sortBy, setSortBy] = useState("due-soonest");

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    priority: "medium" as "high" | "medium" | "low",
    dueDate: "",
    status: "pending" as "pending" | "in-progress" | "completed",
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Notification Modal States
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifTaskId, setNotifTaskId] = useState<string | null>(null);
  const [notifValues, setNotifValues] = useState({
    enabled: true,
    type: "automatic" as "automatic" | "manual",
    days: 1,
    unit: "days" as "days" | "hours",
    frequency: "once" as "once" | "daily" | "every-12h"
  });

  // Load Data on mount (Initializes empty arrays, simulating fetch)
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tList, uList] = await Promise.all([
        apiService.tasks.list(),
        apiService.employees.list()
      ]);
      setTasks(tList);
      setUsers(uList);
      setLastRefreshTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load tasks data from server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const tList = await apiService.tasks.list();
      setTasks(tList);
      toast.success("Tasks list reloaded.");
      setLastRefreshTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to refresh tasks.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Create or Update Task in state
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.title.trim()) {
      toast.error("Task title is required.");
      return;
    }
    if (!formValues.dueDate) {
      toast.error("Due date is required.");
      return;
    }

    try {
      const payload = {
        ...formValues,
        assignedUserIds: selectedUserIds
      };

      if (editingTask) {
        await apiService.tasks.update(editingTask.id, payload);
        toast.success("Task updated successfully.");
      } else {
        await apiService.tasks.create(payload);
        toast.success("Task created successfully.");
      }
      loadData();
      setIsFormOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save task.");
    }
  };

  // Delete Task in state
  const handleDeleteTask = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await apiService.tasks.delete(id);
      toast.success("Task deleted successfully.");
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete task.");
    }
  };

  // Trigger Overdue Reminders
  const handleSendOverdueReminders = async () => {
    setIsSendingReminders(true);
    try {
      const res = await apiService.tasks.sendReminders();
      toast.success(res.message || "Overdue notifications dispatched via WhatsApp & Email.");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to trigger overdue reminders.");
    } finally {
      setIsSendingReminders(false);
    }
  };

  // Save Notification Settings in state
  const handleSaveNotifSettings = async () => {
    if (!notifTaskId) return;

    try {
      const payload = {
        notifEnabled: notifValues.enabled,
        notifType: notifValues.type,
        notifDays: notifValues.days,
        notifUnit: notifValues.unit,
        notifFrequency: notifValues.frequency
      };

      await apiService.tasks.updateNotification(notifTaskId, payload);
      toast.success("Notification settings saved.");
      loadData();
      setIsNotifOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save notification settings.");
    }
  };

  // Helper: Open Edit Modal
  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormValues({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status
    });
    setSelectedUserIds(task.assignedUsers.map((u) => u.id));
    setIsFormOpen(true);
  };

  // Helper: Open Notification Settings Modal
  const openNotifSettings = (task: Task) => {
    setNotifTaskId(task.id);
    setNotifValues({
      enabled: task.notifEnabled,
      type: task.notifType,
      days: task.notifDays,
      unit: task.notifUnit,
      frequency: task.notifFrequency
    });
    setIsNotifOpen(true);
  };

  const resetForm = () => {
    setEditingTask(null);
    setFormValues({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      status: "pending"
    });
    setSelectedUserIds([]);
  };

  // Statistics Calculation
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const overdue = tasks.filter(
      (t) => t.status !== "completed" && t.dueDate < today
    ).length;

    return { total, pending, inProgress, completed, overdue };
  }, [tasks]);

  // Filtering and Sorting logic
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.assignedUsers.some((u) => u.name.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (filterStatus) {
      result = result.filter((t) => t.status === filterStatus);
    }

    // Priority filter
    if (filterPriority) {
      result = result.filter((t) => t.priority === filterPriority);
    }

    // Assignee filter
    if (filterUser) {
      result = result.filter((t) => t.assignedUsers.some((u) => u.id === filterUser));
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "due-soonest") {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === "due-latest") {
        return b.dueDate.localeCompare(a.dueDate);
      }
      if (sortBy === "created-newest") {
        return b.createdAt.localeCompare(a.createdAt);
      }
      if (sortBy === "priority-high") {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return 0;
    });

    return result;
  }, [tasks, searchQuery, filterStatus, filterPriority, filterUser, sortBy]);

  // Preview notification text dynamically
  const notifPreviewText = useMemo(() => {
    if (!notifValues.enabled) return "Reminders disabled.";
    if (notifValues.type === "manual") return "Only sent when triggered manually.";
    
    const freqLabel = {
      once: "once only",
      daily: "daily until completed",
      "every-12h": "every 12 hours until completed"
    }[notifValues.frequency];

    return `Reminder will be sent ${notifValues.days} ${notifValues.unit} before due date, ${freqLabel}.`;
  }, [notifValues]);

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 bg-background overflow-y-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckSquare className="size-6 text-primary" /> Task Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize tasks, assign to team members, and configure custom automated reminders.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Card */}
        <div className="rounded-2xl border bg-card p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Total Tasks</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{String(stats.total).padStart(2, "0")}</h3>
            <p className="text-xs text-muted-foreground mt-1">{stats.pending} pending</p>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <CheckSquare className="size-6" />
          </div>
        </div>

        {/* In Progress Card */}
        <div className="rounded-2xl border bg-card p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">In Progress</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{String(stats.inProgress).padStart(2, "0")}</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{stats.inProgress} active</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="size-6" />
          </div>
        </div>

        {/* Completed Card */}
        <div className="rounded-2xl border bg-card p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Completed</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{String(stats.completed).padStart(2, "0")}</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">All time</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>
        </div>

        {/* Overdue Card */}
        <div className="rounded-2xl border bg-card p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Overdue</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{String(stats.overdue).padStart(2, "0")}</h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Past due date</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="size-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Filters & Table */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, details, team..."
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 border border-border bg-background text-foreground rounded-lg text-xs outline-none focus:border-primary"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="h-9 px-3 border border-border bg-background text-foreground rounded-lg text-xs outline-none focus:border-primary"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="h-9 px-3 border border-border bg-background text-foreground rounded-lg text-xs outline-none focus:border-primary"
            >
              <option value="">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 px-3 border border-border bg-background text-foreground rounded-lg text-xs outline-none focus:border-primary"
            >
              <option value="due-soonest">Due Date (Soonest)</option>
              <option value="due-latest">Due Date (Latest)</option>
              <option value="priority-high">Priority (High first)</option>
              <option value="created-newest">Created Newest</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {lastRefreshTime && (
              <span className="text-[10px] text-muted-foreground mr-1">
                Refreshed: {lastRefreshTime}
              </span>
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh Data"
            >
              <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSendOverdueReminders}
              disabled={isSendingReminders}
              className="h-9 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold gap-1.5"
            >
              {isSendingReminders ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Bell className="size-3.5" />
              )}
              Send Overdue Reminders
            </Button>

            <Button
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
              size="sm"
              className="h-9 text-xs font-semibold gap-1.5"
            >
              <Plus className="size-4" /> Add Task
            </Button>
          </div>
        </div>

        {/* Table View */}
        <div className="relative overflow-x-auto border rounded-xl bg-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/80 text-xs font-semibold text-muted-foreground">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Task Info</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 w-28 text-center">Priority</th>
                <th className="py-3 px-4 w-36">Due Date</th>
                <th className="py-3 px-4 w-32">Status</th>
                <th className="py-3 px-4 w-32 text-center">Reminders</th>
                <th className="py-3 px-4 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading tasks data...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                    No tasks found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task, idx) => {
                  const isOverdue =
                    task.status !== "completed" &&
                    task.dueDate < new Date().toISOString().split("T")[0];

                  return (
                    <tr key={task.id} className="hover:bg-muted/20 transition-colors text-sm">
                      <td className="py-3.5 px-4 text-center text-muted-foreground font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="font-semibold text-foreground leading-relaxed">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {task.assignedUsers.length === 0 ? (
                            <span className="text-muted-foreground text-xs italic">Unassigned</span>
                          ) : (
                            task.assignedUsers.map((u) => (
                              <span
                                key={u.id}
                                className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold transition-all hover:scale-105"
                              >
                                <User className="size-3 text-indigo-500/70" /> {u.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            task.priority === "high"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : task.priority === "medium"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 font-medium ${
                            isOverdue ? "text-rose-500 font-bold" : "text-foreground"
                          }`}
                        >
                          <Calendar className="size-3.5" />
                          {task.dueDate}
                          {isOverdue && <span className="text-[10px] uppercase tracking-wider px-1 bg-rose-500/10 rounded">Overdue</span>}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 font-semibold ${
                            task.status === "completed"
                              ? "text-emerald-500"
                              : task.status === "in-progress"
                              ? "text-amber-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {task.status === "completed" ? (
                            <CheckCircle2 className="size-3.5" />
                          ) : task.status === "in-progress" ? (
                            <Clock className="size-3.5" />
                          ) : (
                            <Clock className="size-3.5" />
                          )}
                          {task.status === "completed"
                            ? "Completed"
                            : task.status === "in-progress"
                            ? "In Progress"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[11px] font-semibold ${
                            task.notifEnabled ? "text-emerald-600" : "text-muted-foreground"
                          }`}
                        >
                          {task.notifEnabled ? "🔔 Enabled" : "🔕 Disabled"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8.5 w-8.5 text-muted-foreground hover:text-foreground border border-transparent hover:border-border hover:bg-muted/50 transition-all"
                            onClick={() => openEdit(task)}
                            title="Edit Task"
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8.5 w-8.5 text-muted-foreground hover:text-primary border border-transparent hover:border-border hover:bg-muted/50 transition-all"
                            onClick={() => openNotifSettings(task)}
                            title="Notification Settings"
                          >
                            <Settings className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8.5 w-8.5 text-muted-foreground hover:text-rose-500 border border-transparent hover:border-rose-500/10 hover:bg-rose-500/5 transition-all"
                            onClick={() => handleDeleteTask(task.id)}
                            title="Delete Task"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL: ADD / EDIT */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {editingTask ? "Edit Task Details" : "Add New Task"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTask} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground">Task Title *</Label>
              <Input
                value={formValues.title}
                onChange={(e) => setFormValues((v) => ({ ...v, title: e.target.value }))}
                placeholder="e.g., Follow up on drawings approval"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground">Description</Label>
              <textarea
                value={formValues.description}
                onChange={(e) => setFormValues((v) => ({ ...v, description: e.target.value }))}
                placeholder="Details or comments..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">Priority</Label>
                <select
                  value={formValues.priority}
                  onChange={(e) =>
                    setFormValues((v) => ({ ...v, priority: e.target.value as any }))
                  }
                  className="w-full h-9 px-3 border border-border bg-background text-foreground rounded-lg text-xs outline-none focus:border-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">Due Date *</Label>
                <Input
                  type="date"
                  value={formValues.dueDate}
                  onChange={(e) => setFormValues((v) => ({ ...v, dueDate: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">Status</Label>
                <select
                  value={formValues.status}
                  onChange={(e) => setFormValues((v) => ({ ...v, status: e.target.value as any }))}
                  className="w-full h-9 px-3 border border-border bg-background text-foreground rounded-lg text-xs outline-none focus:border-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label className="text-xs font-semibold text-muted-foreground">Assigned To</Label>
              <div className="flex flex-wrap gap-1.5 p-2 border rounded-lg bg-muted/20 min-h-12">
                {selectedUserIds.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground self-center px-1">Select users below...</span>
                ) : (
                  users
                    .filter((u) => selectedUserIds.includes(u.id))
                    .map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      >
                        {u.name}
                        <X
                          className="size-3 cursor-pointer hover:text-destructive"
                          onClick={() =>
                            setSelectedUserIds((ids) => ids.filter((id) => id !== u.id))
                          }
                        />
                      </span>
                    ))
                )}
              </div>

              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !selectedUserIds.includes(val)) {
                    setSelectedUserIds((prev) => [...prev, val]);
                  }
                }}
                className="w-full h-9 px-3 border border-border bg-background text-foreground rounded-lg text-xs outline-none focus:border-primary"
              >
                <option value="">+ Add user ...</option>
                {users
                  .filter((u) => !selectedUserIds.includes(u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsFormOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-9 text-xs font-semibold">
                Save Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* NOTIFICATION SETTINGS MODAL */}
      <Dialog open={isNotifOpen} onOpenChange={setIsNotifOpen}>
        <DialogContent className="max-w-md p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              🔔 Notification Reminders
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Enable switch */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="notif-enabled"
                checked={notifValues.enabled}
                onChange={(e) => setNotifValues((v) => ({ ...v, enabled: e.target.checked }))}
                className="size-4 mt-0.5 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <Label htmlFor="notif-enabled" className="text-xs font-bold text-foreground">
                  Enable automated notifications for this task
                </Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Sends automated notifications to assigned users on schedules.
                </p>
              </div>
            </div>

            {notifValues.enabled && (
              <div className="space-y-4 border-t pt-4">
                {/* Notification Type radio */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">Notification Mode</Label>
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="notif-type"
                        value="automatic"
                        checked={notifValues.type === "automatic"}
                        onChange={() => setNotifValues((v) => ({ ...v, type: "automatic" }))}
                      />
                      <span>🤖 Automatic Schedule</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="notif-type"
                        value="manual"
                        checked={notifValues.type === "manual"}
                        onChange={() => setNotifValues((v) => ({ ...v, type: "manual" }))}
                      />
                      <span>👤 Manual Actions Only</span>
                    </label>
                  </div>
                </div>

                {/* Timing input */}
                {notifValues.type === "automatic" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Schedule Offset
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={notifValues.days}
                          onChange={(e) =>
                            setNotifValues((v) => ({ ...v, days: Math.max(0, Number(e.target.value)) }))
                          }
                          className="w-16 h-8 text-xs text-center"
                        />
                        <select
                          value={notifValues.unit}
                          onChange={(e) =>
                            setNotifValues((v) => ({ ...v, unit: e.target.value as any }))
                          }
                          className="h-8 px-2 border border-border bg-background text-foreground rounded-lg text-xs outline-none"
                        >
                          <option value="days">days</option>
                          <option value="hours">hours</option>
                        </select>
                        <span className="text-[11px] text-muted-foreground">before the due date</span>
                      </div>
                    </div>

                    {/* Frequency */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-muted-foreground">Frequency</Label>
                      <select
                        value={notifValues.frequency}
                        onChange={(e) =>
                          setNotifValues((v) => ({ ...v, frequency: e.target.value as any }))
                        }
                        className="w-full h-8 px-3 border border-border bg-background text-foreground rounded-lg text-xs outline-none"
                      >
                        <option value="once">Once only</option>
                        <option value="daily">Daily until completed</option>
                        <option value="every-12h">Every 12 hours</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Preview block */}
                <div className="flex items-start gap-2.5 bg-muted/40 p-3 rounded-lg border">
                  <Info className="size-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-[11px]">
                    <span className="font-bold text-foreground">Preview Schedule:</span>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">{notifPreviewText}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNotifOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNotifSettings}
                size="sm"
                className="h-8 text-xs font-semibold"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
