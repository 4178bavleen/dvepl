import React, { useState, useEffect } from "react";
import { 
  Bell, 
  AlertTriangle,
  CheckCircle, 
  Mail, 
  FileText, 
  Users, 
  Save, 
  Plus, 
  Trash2, 
  Eye, 
  Play,  
  X, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  MessageSquare 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { notificationApi } from "@/services/notification";
import { hrmsApi } from "@/services/modules";

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"logs" | "events" | "smtp">("logs");
  const [loading, setLoading] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logsPagination, setLogsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [logsFilter, setLogsFilter] = useState({
    search: "",
    channel: "",
    status: "",
  });
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Events, Templates & Recipients state
  const [events, setEvents] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Modal forms state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateForm, setTemplateForm] = useState({
    eventId: "",
    channel: "EMAIL" as "EMAIL" | "WHATSAPP",
    subject: "",
    content: "",
  });

  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [recipientForm, setRecipientForm] = useState({
    eventId: "",
    type: "EMPLOYEE" as "EMPLOYEE" | "CUSTOM",
    employeeId: "",
    email: "",
    phone: "",
  });

  // SMTP Settings state
  const [smtpConfig, setSmtpConfig] = useState({
    emailEnabled: false,
    whatsappEnabled: false,
    smtpHost: "",
    smtpPort: 465,
    smtpUsername: "",
    smtpPassword: "",
    smtpFromName: "",
    smtpFromEmail: "",
  });
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");

  // Fetch all logs
  const fetchLogs = async (page = 1) => {
    try {
      const response = await notificationApi.logs.list({
        page,
        limit: logsPagination.limit,
        search: logsFilter.search || undefined,
        channel: logsFilter.channel || undefined,
        status: logsFilter.status || undefined,
      });

      if (response && response.success) {
        setLogs(response.data);
        setLogsPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error("Failed to load notification logs: " + (error.message || ""));
    }
  };

  // Fetch Events, Templates, and Recipients
  const fetchRulesData = async () => {
    setLoading(true);
    try {
      const [eventsList, templatesList, recipientsList, employeesList] = await Promise.all([
        notificationApi.events.list(),
        notificationApi.templates.list(),
        notificationApi.recipients.list(),
        hrmsApi.employees.list().catch(() => []),
      ]);

      setEvents(eventsList || []);
      setTemplates(templatesList || []);
      setRecipients(recipientsList || []);
      setEmployees(employeesList || []);
    } catch (error: any) {
      toast.error("Failed to load rules & templates: " + (error.message || ""));
    } finally {
      setLoading(false);
    }
  };

  // Fetch SMTP configuration
  const fetchSmtpConfig = async () => {
    setLoading(true);
    try {
      const config = await notificationApi.configuration.read();
      if (config) {
        setSmtpConfig({
          emailEnabled: config.emailEnabled || false,
          whatsappEnabled: config.whatsappEnabled || false,
          smtpHost: config.smtpHost || "",
          smtpPort: config.smtpPort || 465,
          smtpUsername: config.smtpUsername || "",
          smtpPassword: "", // Security: do not prefill password
          smtpFromName: config.smtpFromName || "",
          smtpFromEmail: config.smtpFromEmail || "",
        });
      }
    } catch (error: any) {
      toast.error("Failed to load SMTP configuration: " + (error.message || ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs(1);
    } else if (activeTab === "events") {
      fetchRulesData();
    } else if (activeTab === "smtp") {
      fetchSmtpConfig();
    }
  }, [activeTab]);

  // Toggle dynamic features on event level
  const handleToggleEventSetting = async (event: any, field: "isActive" | "emailEnabled" | "whatsappEnabled") => {
    try {
      const updatedValue = !event[field];
      await notificationApi.events.update(event.id, {
        [field]: updatedValue,
      });
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, [field]: updatedValue } : e));
      toast.success(`${event.name} updated successfully.`);
    } catch (error: any) {
      toast.error("Failed to update event setting: " + (error.message || ""));
    }
  };

  // Save/Update template
  const handleSaveTemplate = async () => {
    if (!templateForm.content) {
      toast.error("Template content is required.");
      return;
    }
    if (templateForm.channel === "EMAIL" && !templateForm.subject) {
      toast.error("Subject line is required for emails.");
      return;
    }

    try {
      if (editingTemplate) {
        await notificationApi.templates.update(editingTemplate.id, {
          subject: templateForm.subject || null,
          content: templateForm.content,
        });
        toast.success("Template updated successfully.");
      } else {
        await notificationApi.templates.create({
          eventId: templateForm.eventId,
          channel: templateForm.channel,
          subject: templateForm.subject || null,
          content: templateForm.content,
        });
        toast.success("Template created successfully.");
      }
      setShowTemplateModal(false);
      const updatedTemplates = await notificationApi.templates.list();
      setTemplates(updatedTemplates);
    } catch (error: any) {
      toast.error("Failed to save template: " + (error.message || ""));
    }
  };

  // Add Recipient subscriber
  const handleAddRecipient = async () => {
    if (recipientForm.type === "EMPLOYEE" && !recipientForm.employeeId) {
      toast.error("Please select an employee.");
      return;
    }
    if (recipientForm.type === "CUSTOM") {
      if (!recipientForm.email && !recipientForm.phone) {
        toast.error("Please enter either an email address or a phone number.");
        return;
      }
    }

    try {
      await notificationApi.recipients.create({
        eventId: recipientForm.eventId,
        employeeId: recipientForm.type === "EMPLOYEE" ? recipientForm.employeeId : undefined,
        email: recipientForm.type === "CUSTOM" && recipientForm.email ? recipientForm.email : undefined,
        phone: recipientForm.type === "CUSTOM" && recipientForm.phone ? recipientForm.phone : undefined,
      });
      toast.success("Recipient subscribed successfully.");
      setShowRecipientModal(false);
      const updatedRecipients = await notificationApi.recipients.list();
      setRecipients(updatedRecipients);
    } catch (error: any) {
      toast.error("Failed to add recipient: " + (error.message || ""));
    }
  };

  // Remove Recipient
  const handleRemoveRecipient = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this subscriber?")) return;
    try {
      await notificationApi.recipients.remove(id);
      toast.success("Recipient removed successfully.");
      setRecipients(prev => prev.filter(r => r.id !== id));
    } catch (error: any) {
      toast.error("Failed to remove recipient: " + (error.message || ""));
    }
  };

  // Save SMTP Settings
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        emailEnabled: smtpConfig.emailEnabled,
        whatsappEnabled: smtpConfig.whatsappEnabled,
        smtpHost: smtpConfig.smtpHost,
        smtpPort: Number(smtpConfig.smtpPort),
        smtpUsername: smtpConfig.smtpUsername,
        smtpFromName: smtpConfig.smtpFromName,
        smtpFromEmail: smtpConfig.smtpFromEmail,
      };

      if (smtpConfig.smtpPassword) {
        payload.smtpPassword = smtpConfig.smtpPassword;
      }

      await notificationApi.configuration.update(payload);
      toast.success("Notification configuration updated successfully.");
    } catch (error: any) {
      toast.error("Failed to update SMTP settings: " + (error.message || ""));
    }
  };

  // Dispatch Test Email
  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error("Please enter a test email address.");
      return;
    }
    setTestingSmtp(true);
    try {
      await notificationApi.test.sendEmail(testEmailAddress);
      toast.success("Test email dispatched successfully! Please check your inbox.");
      setShowTestModal(false);
    } catch (error: any) {
      toast.error("SMTP Test failed: " + (error.message || ""));
    } finally {
      setTestingSmtp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
            System Settings & Controls
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
            Notification Management Center
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-2">
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-2.5 px-4 text-sm font-semibold transition-all relative ${
            activeTab === "logs"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Logs & History
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`pb-2.5 px-4 text-sm font-semibold transition-all relative ${
            activeTab === "events"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Rules & Templates
        </button>
        <button
          onClick={() => setActiveTab("smtp")}
          className={`pb-2.5 px-4 text-sm font-semibold transition-all relative ${
            activeTab === "smtp"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          SMTP Setup
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        
        {/* LOGS TAB */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Search logs (recipient, code)..."
                  value={logsFilter.search}
                  onChange={(e) => setLogsFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary w-64"
                />
                <select
                  value={logsFilter.channel}
                  onChange={(e) => setLogsFilter(prev => ({ ...prev, channel: e.target.value }))}
                  className="px-2 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                >
                  <option value="">All Channels</option>
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
                <select
                  value={logsFilter.status}
                  onChange={(e) => setLogsFilter(prev => ({ ...prev, status: e.target.value }))}
                  className="px-2 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="SENT">Sent</option>
                  <option value="FAILED">Failed</option>
                  <option value="PENDING">Pending</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => fetchLogs(1)} className="h-8 text-xs flex gap-1">
                  <RefreshCw className="h-3 w-3" /> Refresh
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-muted/40 uppercase tracking-wider text-[10px] text-muted-foreground font-bold">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Event Code</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No notification logs found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">{log.eventCode}</td>
                        <td className="px-4 py-3">{log.recipient}</td>
                        <td className="px-4 py-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            log.channel === "EMAIL" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                          }`}>
                            {log.channel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            log.status === "SENT" ? "text-green-700 bg-green-50" : 
                            log.status === "FAILED" ? "text-red-700 bg-red-50" : "text-yellow-700 bg-yellow-50"
                          }`}>
                            {log.status === "SENT" ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)} className="h-7 px-2 text-[10px]">
                            <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logsPagination.pages > 1 && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground">
                  Showing page {logsPagination.page} of {logsPagination.pages} ({logsPagination.total} total logs)
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logsPagination.page <= 1}
                    onClick={() => fetchLogs(logsPagination.page - 1)}
                    className="h-8 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logsPagination.page >= logsPagination.pages}
                    onClick={() => fetchLogs(logsPagination.page + 1)}
                    className="h-8 text-xs"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RULES & TEMPLATES TAB */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Define the triggers, dynamic Handlebars message templates, and automated subscribers for system events.
            </p>

            {loading ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Loading rules configuration...
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => {
                  const eventTemplates = templates.filter(t => t.eventId === event.id);
                  const eventRecipients = recipients.filter(r => r.eventId === event.id);
                  const isExpanded = expandedEventId === event.id;

                  return (
                    <div key={event.id} className="border border-border rounded-xl overflow-hidden bg-muted/5">
                      {/* Event row header */}
                      <div 
                        onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                        className="p-4 flex flex-wrap justify-between items-center gap-4 hover:bg-muted/10 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Bell className={`h-5 w-5 ${event.isActive ? "text-primary" : "text-muted-foreground"}`} />
                          <div>
                            <h3 className="font-semibold text-sm text-foreground">{event.name}</h3>
                            <span className="text-[10px] font-mono text-muted-foreground">{event.code}</span>
                          </div>
                        </div>

                        {/* Status switches (Stop propagation to prevent toggle expanding row) */}
                        <div className="flex gap-4 items-center text-xs" onClick={(e) => e.stopPropagation()}>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={event.isActive}
                              onChange={() => handleToggleEventSetting(event, "isActive")}
                              className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                            />
                            <span className="font-semibold">Event Active</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={event.emailEnabled}
                              onChange={() => handleToggleEventSetting(event, "emailEnabled")}
                              className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                            />
                            <span className="font-semibold">Email</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={event.whatsappEnabled}
                              onChange={() => handleToggleEventSetting(event, "whatsappEnabled")}
                              className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                            />
                            <span className="font-semibold">WhatsApp</span>
                          </label>
                        </div>
                      </div>

                      {/* Expand workspace */}
                      {isExpanded && (
                        <div className="border-t border-border p-4 bg-card grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                          
                          {/* Left column: Templates */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-bold flex items-center gap-1">
                                <FileText className="h-4 w-4 text-primary" /> Dynamic Templates
                              </h4>
                              <div className="flex gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    setEditingTemplate(null);
                                    setTemplateForm({ eventId: event.id, channel: "EMAIL", subject: "", content: "" });
                                    setShowTemplateModal(true);
                                  }} 
                                  className="h-7 text-[10px]"
                                >
                                  <Plus className="h-3 w-3 mr-0.5" /> Add Email Temp
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    setEditingTemplate(null);
                                    setTemplateForm({ eventId: event.id, channel: "WHATSAPP", subject: "", content: "" });
                                    setShowTemplateModal(true);
                                  }} 
                                  className="h-7 text-[10px]"
                                >
                                  <Plus className="h-3 w-3 mr-0.5" /> Add WhatsApp Temp
                                </Button>
                              </div>
                            </div>

                            {eventTemplates.length === 0 ? (
                              <p className="text-muted-foreground italic text-center py-4 bg-muted/10 rounded-lg">
                                No templates defined for this event yet.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {eventTemplates.map(template => (
                                  <div key={template.id} className="border border-border/80 rounded-lg p-3 space-y-2 bg-muted/5">
                                    <div className="flex justify-between items-center">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        template.channel === "EMAIL" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                      }`}>
                                        {template.channel} TEMPLATE
                                      </span>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setEditingTemplate(template);
                                            setTemplateForm({
                                              eventId: event.id,
                                              channel: template.channel,
                                              subject: template.subject || "",
                                              content: template.content,
                                            });
                                            setShowTemplateModal(true);
                                          }}
                                          className="h-6 px-1.5 text-[9px]"
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={async () => {
                                            if (!confirm("Delete template?")) return;
                                            await notificationApi.templates.remove(template.id);
                                            setTemplates(prev => prev.filter(t => t.id !== template.id));
                                            toast.success("Template deleted.");
                                          }}
                                          className="h-6 px-1.5 text-[9px] text-destructive hover:bg-destructive/5"
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </div>

                                    {template.channel === "EMAIL" && (
                                      <div className="bg-muted/20 p-1.5 rounded text-[11px]">
                                        <strong>Subject:</strong> {template.subject}
                                      </div>
                                    )}
                                    <div className="whitespace-pre-wrap font-mono text-[10px] bg-muted/40 p-2 rounded max-h-36 overflow-y-auto">
                                      {template.content}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Right column: Subscribers / Recipients */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-bold flex items-center gap-1">
                                <Users className="h-4 w-4 text-primary" /> Subscriber Recipients
                              </h4>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setRecipientForm({ eventId: event.id, type: "EMPLOYEE", employeeId: "", email: "", phone: "" });
                                  setShowRecipientModal(true);
                                }} 
                                className="h-7 text-[10px]"
                              >
                                <Plus className="h-3 w-3 mr-0.5" /> Add Subscriber
                              </Button>
                            </div>

                            {eventRecipients.length === 0 ? (
                              <p className="text-muted-foreground italic text-center py-4 bg-muted/10 rounded-lg">
                                No subscribers linked to this trigger.
                              </p>
                            ) : (
                              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                                {eventRecipients.map(recipient => {
                                  let name = "Custom Subscriber";
                                  let contact = "";
                                  if (recipient.employee) {
                                    name = `${recipient.employee.firstName} ${recipient.employee.lastName}`;
                                    contact = [recipient.employee.email, recipient.employee.phone].filter(Boolean).join(" | ");
                                  } else {
                                    contact = [recipient.email, recipient.phone].filter(Boolean).join(" | ");
                                  }

                                  return (
                                    <div key={recipient.id} className="p-2.5 flex justify-between items-center hover:bg-muted/10">
                                      <div>
                                        <p className="font-semibold">{name}</p>
                                        <p className="text-[10px] text-muted-foreground">{contact}</p>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveRecipient(recipient.id)}
                                        className="h-6 w-6 p-0 text-destructive hover:bg-destructive/5"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SMTP SETUP TAB */}
        {activeTab === "smtp" && (
          <form onSubmit={handleSaveSmtp} className="space-y-6 max-w-2xl text-xs">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Mail className="h-4.5 w-4.5 text-primary" />
              <span>Email & Gateway SMTP Settings</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  SMTP Host *
                </label>
                <input
                  type="text"
                  required
                  value={smtpConfig.smtpHost}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  SMTP Port *
                </label>
                <input
                  type="number"
                  required
                  value={smtpConfig.smtpPort}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtpPort: Number(e.target.value) }))}
                  placeholder="465"
                  className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  SMTP Username *
                </label>
                <input
                  type="text"
                  required
                  value={smtpConfig.smtpUsername}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtpUsername: e.target.value }))}
                  placeholder="username@domain.com"
                  className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  SMTP Password (Leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={smtpConfig.smtpPassword}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtpPassword: e.target.value }))}
                  placeholder="••••••••••••••"
                  className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Sender From Name *
                </label>
                <input
                  type="text"
                  required
                  value={smtpConfig.smtpFromName}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtpFromName: e.target.value }))}
                  placeholder="DVEPL ERP notifications"
                  className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Sender Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={smtpConfig.smtpFromEmail}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtpFromEmail: e.target.value }))}
                  placeholder="no-reply@domain.com"
                  className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-border pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowTestModal(true)}
                className="h-9 text-xs flex gap-1.5"
              >
                <Play className="h-4 w-4" /> Send Test Email
              </Button>

              <Button type="submit" className="h-9 text-xs flex gap-1.5">
                <Save className="h-4 w-4" /> Save Settings
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* VIEW LOG DETAILS MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-lg text-xs">
            <div className="flex justify-between items-center border-b border-border pb-2.5">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                <span>Log Details for #{selectedLog.id.slice(-6)}</span>
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-muted-foreground block uppercase text-[10px]">Event Code</span>
                <span className="font-medium text-foreground">{selectedLog.eventCode}</span>
              </div>
              <div>
                <span className="font-bold text-muted-foreground block uppercase text-[10px]">Timestamp</span>
                <span className="font-medium text-foreground">{new Date(selectedLog.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="font-bold text-muted-foreground block uppercase text-[10px]">Recipient</span>
                <span className="font-medium text-foreground">{selectedLog.recipient}</span>
              </div>
              <div>
                <span className="font-bold text-muted-foreground block uppercase text-[10px]">Channel</span>
                <span className="font-medium text-foreground">{selectedLog.channel}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-muted-foreground block uppercase text-[10px]">Subject</span>
              <div className="p-2 border border-border bg-muted/10 rounded-lg mt-1 font-semibold">
                {selectedLog.subject || "(No Subject)"}
              </div>
            </div>

            <div>
              <span className="font-bold text-muted-foreground block uppercase text-[10px]">Rendered Message</span>
              <div className="p-2.5 border border-border bg-muted/40 rounded-lg mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-[10.5px]">
                {selectedLog.message}
              </div>
            </div>

            {selectedLog.error && (
              <div>
                <span className="font-bold text-red-500 block uppercase text-[10px]">Error Details</span>
                <div className="p-2.5 border border-red-200 bg-red-50/20 text-red-700 rounded-lg mt-1 font-mono text-[10px] whitespace-pre-wrap">
                  {selectedLog.error}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedLog(null)} className="h-8 text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE FORM MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-lg text-xs">
            <div className="flex justify-between items-center border-b border-border pb-2.5">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                <span>{editingTemplate ? "Edit Template" : `New ${templateForm.channel} Template`}</span>
              </h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {templateForm.channel === "EMAIL" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g. New Sales Order Created #{{orderNumber}}"
                  className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between">
                <span>Template Body * (Handlebars formatted)</span>
                <span className="text-[9px] text-muted-foreground normal-case font-normal">
                  Use tags like {"{{orderNumber}}"}, {"{{customerName}}"}, {"{{amount}}"}
                </span>
              </label>
              <textarea
                required
                rows={8}
                value={templateForm.content}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder={
                  templateForm.channel === "EMAIL" 
                    ? "Dear {{customerName}},\n\nYour order {{orderNumber}} has been placed.\nTotal Amount: Rs. {{totalAmount}}"
                    : "Order {{orderNumber}} Placed: Dear {{customerName}}, your order of Rs. {{totalAmount}} is registered."
                }
                className="w-full p-2 border border-border bg-card rounded-lg text-xs outline-none focus:border-primary font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowTemplateModal(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} className="h-8 text-xs">
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* RECIPIENT FORM MODAL */}
      {showRecipientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-5 space-y-4 shadow-lg text-xs">
            <div className="flex justify-between items-center border-b border-border pb-2.5">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                <span>Add Subscriber Recipient</span>
              </h3>
              <button onClick={() => setShowRecipientModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="recipientType"
                  checked={recipientForm.type === "EMPLOYEE"}
                  onChange={() => setRecipientForm(prev => ({ ...prev, type: "EMPLOYEE", email: "", phone: "" }))}
                  className="text-primary focus:ring-primary w-3.5 h-3.5"
                />
                <span className="font-semibold">Internal Employee</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="recipientType"
                  checked={recipientForm.type === "CUSTOM"}
                  onChange={() => setRecipientForm(prev => ({ ...prev, type: "CUSTOM", employeeId: "" }))}
                  className="text-primary focus:ring-primary w-3.5 h-3.5"
                />
                <span className="font-semibold">Custom Contact</span>
              </label>
            </div>

            {recipientForm.type === "EMPLOYEE" ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Select Employee *
                </label>
                <select
                  value={recipientForm.employeeId}
                  onChange={(e) => setRecipientForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-border bg-card rounded-lg outline-none focus:border-primary"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.email || "No email"})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Custom Email Address
                  </label>
                  <input
                    type="email"
                    value={recipientForm.email}
                    onChange={(e) => setRecipientForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full px-3 py-1.5 border border-border bg-card rounded-lg outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Custom WhatsApp/Phone Number
                  </label>
                  <input
                    type="tel"
                    value={recipientForm.phone}
                    onChange={(e) => setRecipientForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+919999999999"
                    className="w-full px-3 py-1.5 border border-border bg-card rounded-lg outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowRecipientModal(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button onClick={handleAddRecipient} className="h-8 text-xs">
                Add Recipient
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SMTP TEST MODAL */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-5 space-y-4 shadow-lg text-xs">
            <div className="flex justify-between items-center border-b border-border pb-2.5">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Play className="h-4 w-4 text-primary" />
                <span>Test SMTP Configuration</span>
              </h3>
              <button onClick={() => setShowTestModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Recipient Email Address *
              </label>
              <input
                type="email"
                required
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="test@domain.com"
                className="w-full px-3 py-1.5 border border-border bg-card rounded-lg outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowTestModal(false)} disabled={testingSmtp} className="h-8 text-xs">
                Cancel
              </Button>
              <Button onClick={handleSendTestEmail} disabled={testingSmtp} className="h-8 text-xs">
                {testingSmtp ? "Sending..." : "Send Test"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
