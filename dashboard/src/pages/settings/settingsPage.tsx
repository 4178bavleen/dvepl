import React, { useState, useEffect, useMemo } from "react";
import { useERPStore } from "@/store/erpStore";
import { securityApi } from "@/services/modules";
import { organizationApi } from "@/services/organization";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { Eye, EyeOff } from "lucide-react";
import "../../styles/settings.css";

// Hex to HSL space-separated string converter for Tailwind HSL variables compatibility
function hexToHslString(hex: string): string {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);
  return `${hDeg} ${sPct}% ${lPct}%`;
}

// Type definitions
interface UserItem {
  id: string;
  name: string;
  email: string;
  designation?: string | null;
  phone?: string | null;
  role: string;
  pageAccess?: string[];
  fieldPermissions?: Record<string, { view: boolean; edit: boolean }>;
  actionPermissions?: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
  };
}

const defaultWaSettings = {
  masterToggle: true,
  number: "",
  phoneId: "",
  businessId: "",
  accessToken: "",
  orderConfirmation: true,
  lowStock: false,
};

const defaultEmailSettings = {
  address: "",
  orders: true,
  tasks: false,
  payments: true,
  delivery: false,
};

const defaultSmtpSettings = {
  title: "",
  email: "",
  password: "",
  host: "smtp.gmail.com",
  port: 465,
  supportEmail: "",
  supportPhone: "",
  address: "",
};

const defaultCaptchaSettings = {
  siteKey: "",
  secretKey: "",
  enabled: true,
};

const defaultGatewaySettings = {
  baseUrl: "",
  apiKey: "",
  secretKey: "",
  enabled: false,
};

const sanitizeObject = (obj: any, defaults: any) => {
  if (!obj || typeof obj !== "object") return { ...defaults };
  const result = { ...defaults, ...obj };
  for (const key of Object.keys(result)) {
    if (result[key] === null || result[key] === undefined) {
      result[key] = defaults[key] !== undefined ? defaults[key] : "";
    }
  }
  return result;
};

export function SettingsPage() {
  const store = useERPStore();

  // Active section state
  // 'hub' represents the grid overview, clicking a card loads a section.
  const [activeSection, setActiveSection] = useState<string>("hub");

  // Users List and Search state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [permUser, setPermUser] = useState<UserItem | null>(null);

  // Quick Preset state
  const [pageAccessState, setPageAccessState] = useState<
    Record<string, boolean>
  >({});
  const [fieldPermsState, setFieldPermsState] = useState<
    Record<string, { view: boolean; edit: boolean }>
  >({});
  const [actionPermsState, setActionPermsState] = useState({
    create: true,
    edit: true,
    delete: false,
    export: true,
  });

  // Create single user form state
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newUserDesignation, setNewUserDesignation] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // Create bulk users state
  const [bulkTab, setBulkTab] = useState<"single" | "bulk">("single");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkStatus, setBulkStatus] = useState<"idle" | "importing" | "done">(
    "idle",
  );
  const [bulkResults, setBulkResults] = useState({ created: 0, failed: 0 });

  // Manage Fields State
  const [orderFields, setOrderFields] = useState<Record<string, boolean>>({
    delivery_month_target: true,
    concerned_person: true,
    drawing_status: true,
    po_number: true,
    material_status: true,
    plant_status: true,
    advance_amount: true,
    balance_due: true,
    dispatch_date: true,
  });

  const [concernedPersons, setConcernedPersons] = useState<string[]>([]);
  const [newPersonName, setNewPersonName] = useState("");

  // Notifications state
  const [notifTab, setNotifTab] = useState<
    "contacts" | "smtp" | "templates" | "captcha" | "gateway"
  >("contacts");

  // WhatsApp settings state
  const [waSettings, setWaSettings] = useState(defaultWaSettings);
  const [showWaConfig, setShowWaConfig] = useState(false);

  // Email notifications state
  const [emailSettings, setEmailSettings] = useState(defaultEmailSettings);

  // Alert events toggles
  const [alertEvents, setAlertEvents] = useState<
    Record<string, { wa: boolean; email: boolean }>
  >({
    new_order: { wa: true, email: true },
    order_status: { wa: true, email: true },
    task_overdue: { wa: true, email: true },
    drawing: { wa: false, email: true },
    payment: { wa: false, email: true },
    delivery: { wa: true, email: true },
  });

  const [autoSendDefaults, setAutoSendDefaults] = useState({
    waAuto: true,
    emailAuto: false,
  });

  // SMTP Settings
  const [smtpSettings, setSmtpSettings] = useState(defaultSmtpSettings);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [isEditingSmtp, setIsEditingSmtp] = useState(true);

  // Captcha settings
  const [captchaSettings, setCaptchaSettings] = useState(
    defaultCaptchaSettings,
  );

  // WhatsApp Gateway Settings
  const [gatewaySettings, setGatewaySettings] = useState(
    defaultGatewaySettings,
  );
  const [isEditingGateway, setIsEditingGateway] = useState(true);

  // Email Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTestTemplateId, setSelectedTestTemplateId] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateContent1, setTemplateContent1] = useState("");
  const [templateContent2, setTemplateContent2] = useState("");
  const [templateType, setTemplateType] = useState("");

  // Theme & Appearance State
  const [sidebarPos, setSidebarPos] = useState<"left" | "right">("left");
  const [brandColor, setBrandColor] = useState("#33cc33");
  const [bgColor, setBgColor] = useState("#f8fafc");

  // Backup & Restore state
  const [backupFilename, setBackupFilename] = useState("DVEPL_Backup");
  const [backupModules, setBackupModules] = useState<string[]>([
    "orders",
    "users",
    "vendors",
    "tasks",
  ]);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreMode, setRestoreMode] = useState<"merge" | "overwrite">(
    "merge",
  );
  const [designationsList, setDesignationsList] = useState<any[]>([]);

  // 1. Initial Load of Users & Configuration from API or LocalStorage
  const loadUsersList = async () => {
    setLoadingUsers(true);
    try {
      const rolesList = await securityApi.roles.list().catch(() => []);
      useERPStore.setState({ roles: rolesList });

      // Fetch designations list from organization API
      const desList = await organizationApi.designations.list().catch(() => []);
      setDesignationsList(desList);

      // Fetch users from API endpoint
      const list = await securityApi.users.list();
      console.log("list",list);
      if (Array.isArray(list) && list.length > 0) {
        const mapped: UserItem[] = list.map((u: any) => ({
          id: u.id,
          name:
            u.name ||
            `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
            "No Name",
          email: u.email || "",
          phone: u.phone || "",
          designation:
            typeof u.designation === "object" && u.designation
              ? u.designation.title || "Team Member"
              : u.designation || "Team Member",
          role: u.role || "user",
          pageAccess: u.pageAccess || ["dashboard", "vendors", "orders"],
          fieldPermissions: u.fieldPermissions || {},
          actionPermissions: u.actionPermissions || {
            create: true,
            edit: true,
            delete: false,
            export: true,
          },
        }));
        setUsers(mapped);
      } else {
        // Fallback to store users
        const fallback = store.users.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          designation: "Staff Member",
          role: u.id === store.currentUserId ? "admin" : "user",
          pageAccess: ["dashboard", "vendors", "orders"],
          fieldPermissions: {},
          actionPermissions: {
            create: true,
            edit: true,
            delete: false,
            export: true,
          },
        }));
        setUsers(fallback);
      }
    } catch (err) {
      // Load fallback list on failure
      const fallback = store.users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || "",
        designation: "Staff Member",
        role: "user",
        pageAccess: ["dashboard", "vendors", "orders"],
        fieldPermissions: {},
        actionPermissions: {
          create: true,
          edit: true,
          delete: false,
          export: true,
        },
      }));
      setUsers(fallback);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsersList();

    const initSettings = async () => {
      // First read local storage for fast paint
      const savedOrderFields = localStorage.getItem("dvepl_order_fields");
      if (savedOrderFields) setOrderFields(JSON.parse(savedOrderFields));

      const savedPersons = localStorage.getItem("dvepl_concerned_persons");
      if (savedPersons) {
        setConcernedPersons(JSON.parse(savedPersons));
      } else {
        const defaultPersons = [
          " राहुल शर्मा (Sales)",
          " अमन प्रीत (Procurement)",
          " जसकीरत सिंह (Accounts)",
          " गुरमीत सिंह (Production)",
        ];
        setConcernedPersons(defaultPersons);
      }

      const savedWa = localStorage.getItem("dvepl_whatsapp_settings");
      if (savedWa)
        setWaSettings(sanitizeObject(JSON.parse(savedWa), defaultWaSettings));

      const savedEmail = localStorage.getItem("dvepl_email_settings");
      if (savedEmail)
        setEmailSettings(
          sanitizeObject(JSON.parse(savedEmail), defaultEmailSettings),
        );

      const savedEvents = localStorage.getItem("dvepl_alert_events");
      if (savedEvents) setAlertEvents(JSON.parse(savedEvents));

      const savedAutoSend = localStorage.getItem("dvepl_auto_send_defaults");
      if (savedAutoSend) setAutoSendDefaults(JSON.parse(savedAutoSend));

      const savedSmtp = localStorage.getItem("dvepl_smtp_settings");
      if (savedSmtp) {
        const smtp = JSON.parse(savedSmtp);
        const mappedSmtp = {
          ...smtp,
          email: smtp.email || smtp.username || "",
        };
        setSmtpSettings(sanitizeObject(mappedSmtp, defaultSmtpSettings));
        if (mappedSmtp.host) {
          setIsEditingSmtp(false);
        } else {
          setIsEditingSmtp(true);
        }
      } else {
        setIsEditingSmtp(true);
      }

      const savedCaptcha = localStorage.getItem("dvepl_captcha_settings");
      if (savedCaptcha)
        setCaptchaSettings(
          sanitizeObject(JSON.parse(savedCaptcha), defaultCaptchaSettings),
        );

      const savedGateway = localStorage.getItem("dvepl_whatsapp_gateway");
      if (savedGateway) {
        const parsed = JSON.parse(savedGateway);
        setGatewaySettings(sanitizeObject(parsed, defaultGatewaySettings));
        if (parsed.baseUrl) {
          setIsEditingGateway(false);
        } else {
          setIsEditingGateway(true);
        }
      } else {
        setIsEditingGateway(true);
      }

      const savedTemplates = localStorage.getItem("dvepl_email_templates");
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      } else {
        const defaultTemplates = [
          {
            id: "1",
            name: "Order Confirmation",
            subject: "Your Order #{$poNumber} Placed",
            content1:
              "Hi {$name},\n\nThank you for your order. We are processing it.",
            content2: "Support: {$supportPhone}",
            type: "order_created",
          },
          {
            id: "2",
            name: "Welcome Email",
            subject: "Welcome to DVEPL Portal",
            content1:
              "Dear {$name},\n\nYour account has been registered successfully.",
            content2: "Regards,\nDVEPL Admin",
            type: "welcome",
          },
        ];
        setTemplates(defaultTemplates);
      }

      const savedThemePos = localStorage.getItem("dvepl_theme_sidebar_pos");
      if (savedThemePos) setSidebarPos(savedThemePos as any);

      const savedBrandColor =
        localStorage.getItem("dvepl_brand_color") || "#33cc33";
      setBrandColor(savedBrandColor);
      try {
        const hslVal = hexToHslString(savedBrandColor);
        document.documentElement.style.setProperty("--primary", hslVal);
      } catch (e) {
        document.documentElement.style.setProperty(
          "--primary",
          savedBrandColor,
        );
      }

      const savedBgColor = localStorage.getItem("dvepl_bg_color");
      if (savedBgColor) setBgColor(savedBgColor);

      const savedBackupHistory = localStorage.getItem("dvepl_backup_history");
      if (savedBackupHistory) setBackupHistory(JSON.parse(savedBackupHistory));

      // Now sync from backend store source of truth
      try {
        await store.fetchSettings();
        const settings = store.settings || {};
        if (settings.orderFields) setOrderFields(settings.orderFields);
        if (settings.concernedPersons)
          setConcernedPersons(settings.concernedPersons);
        if (settings.waSettings)
          setWaSettings(sanitizeObject(settings.waSettings, defaultWaSettings));
        if (settings.emailSettings)
          setEmailSettings(
            sanitizeObject(settings.emailSettings, defaultEmailSettings),
          );
        if (settings.alertEvents) setAlertEvents(settings.alertEvents);
        if (settings.autoSendDefaults)
          setAutoSendDefaults(settings.autoSendDefaults);
        if (settings.smtpSettings) {
          const mappedSmtp = {
            ...settings.smtpSettings,
            email:
              settings.smtpSettings.email ||
              settings.smtpSettings.username ||
              "",
          };
          setSmtpSettings(sanitizeObject(mappedSmtp, defaultSmtpSettings));
          if (mappedSmtp.host) {
            setIsEditingSmtp(false);
          } else {
            setIsEditingSmtp(true);
          }
        }
        if (settings.captchaSettings)
          setCaptchaSettings(
            sanitizeObject(settings.captchaSettings, defaultCaptchaSettings),
          );
        if (settings.gatewaySettings) {
          const mappedGateway = {
            ...settings.gatewaySettings,
            baseUrl:
              settings.gatewaySettings.baseUrl ||
              settings.gatewaySettings.instanceId ||
              "",
          };
          setGatewaySettings(
            sanitizeObject(mappedGateway, defaultGatewaySettings),
          );
          if (mappedGateway.baseUrl) {
            setIsEditingGateway(false);
          } else {
            setIsEditingGateway(true);
          }
        }
        if (settings.templates) setTemplates(settings.templates);
        if (settings.brandColor) {
          setBrandColor(settings.brandColor);
          try {
            const hslVal = hexToHslString(settings.brandColor);
            document.documentElement.style.setProperty("--primary", hslVal);
          } catch (e) {
            document.documentElement.style.setProperty(
              "--primary",
              settings.brandColor,
            );
          }
        }
        if (settings.bgColor) setBgColor(settings.bgColor);
        if (settings.sidebarPos) setSidebarPos(settings.sidebarPos);
        if (settings.backupHistory) setBackupHistory(settings.backupHistory);
      } catch (err) {
        console.error("Backend settings fetch failed", err);
      }
    };

    initSettings();
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.role || "").toLowerCase().includes(userSearch.toLowerCase()),
    );
  }, [users, userSearch]);

  // Handle Edit User
  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    try {
      if (securityApi.users.update) {
        await securityApi.users.update(editingUser.id, {
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          designation: editingUser.designation,
        });
      }
      toast.success("User details updated successfully");
      console.log("editing user : ", editingUser);
      setIsEditModalOpen(false);
      loadUsersList();
    } catch (err) {
      toast.error("Failed to update user");
    }
  };

  // Handle User Deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      if (securityApi.users.remove) {
        await securityApi.users.remove(userId);
      }
      toast.success("User deleted successfully");
      loadUsersList();
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  // Permissions Modal Page List
  const modulesList = [
    { key: "dashboard", label: "📊 Dashboard" },

    // Organization
    { key: "companies", label: "🏢 Companies" },
    { key: "branches", label: "🌿 Branches" },
    { key: "departments", label: "🌿 Departments" },
    { key: "teams", label: "👥 Teams" },
    { key: "designations", label: "🎖️ Designations" },
    { key: "cost_centers", label: "💼 Cost Centers" },

    // HRMS
    { key: "employees", label: "👤 Employees" },
    { key: "attendance", label: "⏰ Attendance" },
    { key: "leaves", label: "📅 Leaves" },
    { key: "holidays", label: "📅 Holidays" },
    { key: "shift_management", label: "⏰ Shift Management" },
    { key: "payroll", label: "💸 Payroll" },
    { key: "documents", label: "📄 Documents" },
    { key: "tasks", label: "✅ Tasks" },

    // CRM
    { key: "customers", label: "🤝 Customers" },
    { key: "contacts", label: "📇 Contact Persons" },
    { key: "communication", label: "💬 Communication History" },
    { key: "orders", label: "🛒 Orders" },
    { key: "delivery", label: "🚚 Delivery" },
    { key: "vendors", label: "🚚 Vendors" },
    { key: "inventory", label: "📦 Inventory" },

    // Finance
    { key: "finance", label: "💵 Finance / Accounts" },

    // Lead Management & Tenders
    { key: "tender_requests", label: "📂 Tender Requests" },
    { key: "tenders", label: "🗂️ Tenders" },
    { key: "technical_clarifications", label: "❓ Technical Clarifications" },
    { key: "government_departments", label: "🏢 Government Departments" },
    { key: "sections", label: "🌿 Sections" },
    { key: "divisions", label: "🌿 Divisions" },
    { key: "sub_divisions", label: "👥 Sub Divisions" },
    { key: "reference_codes", label: "📄 Reference Codes" },

    // Security (PRBAC)
    { key: "users", label: "👤 Users" },
    { key: "roles", label: "🛡️ Roles" },
    { key: "permissions", label: "⚡ Permissions" },
    { key: "permission_groups", label: "📂 Permission Groups" },
    { key: "approval_requests", label: "✅ Approval Requests" },

    // Other / Reports / Settings
    { key: "reports", label: "📊 Reports" },
    { key: "audit_logs", label: "📜 Audit Logs" },
    { key: "custom_fields", label: "⚙️ Custom Fields" },
    { key: "recycle_bin", label: "🗑️ Recycle Bin" },
    { key: "settings", label: "⚙️ Settings" },
  ];

  // Fields Access List
  const fieldsAccessList = [
    // Organization
    {
      key: "company_tax_id",
      label: "Company Tax ID (GST/PAN)",
      tag: "organization",
    },
    {
      key: "registration_number",
      label: "Company Registration No",
      tag: "organization",
    },
    {
      key: "budget_limit",
      label: "Cost Center Budget Limit",
      tag: "organization",
    },
    {
      key: "allocated_amount",
      label: "Cost Center Allocated Amt",
      tag: "organization",
    },

    // Finance / Banking
    { key: "advance_amount", label: "Advance Paid", tag: "finance" },
    { key: "balance_due", label: "Balance Due", tag: "finance" },
    { key: "bank_name", label: "Bank Name", tag: "finance" },
    { key: "bank_account_no", label: "Bank Account Number", tag: "finance" },
    { key: "ifsc_code", label: "IFSC Code", tag: "finance" },
    {
      key: "discount_margin",
      label: "Allowed Discount Margin %",
      tag: "finance",
    },
    { key: "markup_percent", label: "Markup Percentage", tag: "finance" },

    // HRMS / Personal Details
    { key: "employee_code", label: "Employee Code", tag: "hrms" },
    { key: "basic_salary", label: "Basic Salary & Payroll", tag: "hrms" },
    { key: "hra_allowance", label: "HRA Allowance", tag: "hrms" },
    { key: "allowances", label: "HRMS Allowances", tag: "hrms" },
    { key: "deductions", label: "HRMS Deductions", tag: "hrms" },
    { key: "total_ctc", label: "Total CTC Value", tag: "hrms" },
    { key: "pan_no", label: "PAN Card Number", tag: "hrms" },
    { key: "aadhaar_no", label: "Aadhaar Card Number", tag: "hrms" },
    { key: "pf_uan", label: "PF UAN Number", tag: "hrms" },
    { key: "date_of_birth", label: "Date of Birth", tag: "hrms" },

    // CRM / Credit
    { key: "customer_pan", label: "Customer/Vendor PAN", tag: "crm" },
    { key: "customer_gstin", label: "Customer/Vendor GSTIN", tag: "crm" },
    { key: "credit_limit", label: "Customer Credit Limit", tag: "crm" },
    { key: "payment_terms", label: "Payment Term (Days)", tag: "crm" },

    // Security
    { key: "password_hash", label: "User Password Hash", tag: "security" },
    {
      key: "is_system_role",
      label: "Is System Role Indicator",
      tag: "security",
    },

    // Orders & Logistics
    { key: "po_number", label: "PO Number", tag: "order" },
    { key: "po_value", label: "PO Total Value", tag: "order" },
    {
      key: "delivery_month_target",
      label: "Delivery Month Target",
      tag: "order",
    },
    { key: "concerned_person", label: "Concerned Person", tag: "order" },
    { key: "drawing_status", label: "Drawing Status", tag: "order" },
    { key: "material_status", label: "Material Status", tag: "order" },
    { key: "plant_status", label: "Plant Status", tag: "order" },
    { key: "dispatch_date", label: "Dispatch Date", tag: "delivery" },
  ];

  // Handle Permissions Modal
  const handleOpenPermModal = (user: UserItem) => {
    setPermUser(user);

    // Initial page checkboxes
    const pageObj: Record<string, boolean> = {};
    modulesList.forEach((m) => {
      pageObj[m.key] = user.pageAccess?.includes(m.key) ?? false;
    });
    setPageAccessState(pageObj);

    // Initial field settings
    const fieldObj: Record<string, { view: boolean; edit: boolean }> = {};
    fieldsAccessList.forEach((f) => {
      fieldObj[f.key] = user.fieldPermissions?.[f.key] ?? {
        view: true,
        edit: true,
      };
    });
    setFieldPermsState(fieldObj);

    // Actions settings
    setActionPermsState(
      user.actionPermissions ?? {
        create: true,
        edit: true,
        delete: false,
        export: true,
      },
    );

    setIsPermModalOpen(true);
  };

  const applyPreset = (preset: "full" | "viewer" | "none") => {
    const pageObj: Record<string, boolean> = {};
    const fieldObj: Record<string, { view: boolean; edit: boolean }> = {};

    modulesList.forEach((m) => {
      pageObj[m.key] = preset === "full" || preset === "viewer";
    });

    fieldsAccessList.forEach((f) => {
      fieldObj[f.key] = {
        view: preset === "full" || preset === "viewer",
        edit: preset === "full",
      };
    });

    setPageAccessState(pageObj);
    setFieldPermsState(fieldObj);
    setActionPermsState({
      create: preset === "full",
      edit: preset === "full",
      delete: preset === "full",
      export: preset === "full" || preset === "viewer",
    });
  };

  const savePermissions = async () => {
    if (!permUser) return;
    try {
      const pageAccess = Object.keys(pageAccessState).filter(
        (k) => pageAccessState[k],
      );
      const updatedUser = {
        ...permUser,
        pageAccess,
        fieldPermissions: fieldPermsState,
        actionPermissions: actionPermsState,
      };

      if (securityApi.users.update) {
        await securityApi.users.update(permUser.id, {
          pageAccess,
          fieldPermissions: fieldPermsState,
          actionPermissions: actionPermsState,
        });
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === permUser.id ? updatedUser : u)),
      );

      // Sync to global Zustand store so table changes apply immediately
      const updatedStoreUsers = store.users.map((u: any) =>
        u.id === permUser.id
          ? {
              ...u,
              pageAccess,
              fieldPermissions: fieldPermsState,
              actionPermissions: actionPermsState,
            }
          : u,
      );
      useERPStore.setState({ users: updatedStoreUsers });

      toast.success("Permissions updated successfully");
      setIsPermModalOpen(false);
    } catch (err) {
      toast.error("Failed to save permissions");
    }
  };

  // 2. Create User Handlers
  const handleCreateUser = async () => {
    const errors: Record<string, boolean> = {};

    if (!newUserName.trim() || newUserName.trim().length < 2) {
      errors.name = true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newUserEmail.trim() || !emailRegex.test(newUserEmail.trim())) {
      errors.email = true;
    }
    if (!newUserPassword || newUserPassword.length < 4) {
      errors.password = true;
    }
    if (!newUserRole) {
      errors.role = true;
    }
    if (newUserPhone) {
      const phoneRegex = /^\+?[\d\s-]{10,15}$/;
      if (!phoneRegex.test(newUserPhone.trim())) {
        errors.phone = true;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please correct the highlighted fields");
      return;
    }

    setFormErrors({});

    try {
      await securityApi.users.create({
        name: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        password: newUserPassword,
        role: newUserRole,
        designation: newUserDesignation.trim() || undefined,
        phone: newUserPhone.trim() || undefined,
      });
      toast.success("User created successfully");
      // Reset form
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserDesignation("");
      setNewUserPhone("");
      setNewUserRole("");
      setFormErrors({});
      loadUsersList();
      setActiveSection("manage-users");
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message || err.message || "Failed to create user";
      toast.error(errMsg);
    }
  };

  // Bulk Excel import
  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(worksheet);

        // Map keys to preview table headers
        const headerMap: Record<string, string> = {
          name: "name",
          email: "email",
          phone: "phone",
          password: "password",
          role: "role",
          designation: "designation",
        };

        const parsedPreview = rows.map((rawRow: any) => {
          const row: any = {};
          for (const key of Object.keys(rawRow)) {
            const cleanKey = key.trim().toLowerCase();
            const mappedKey = headerMap[cleanKey] || key;
            row[mappedKey] = rawRow[key];
          }
          return {
            name: row.name || "N/A",
            email: row.email || "N/A",
            role: row.role || "N/A",
            designation: row.designation || "Team Member",
            status: row.email ? "Ready" : "Invalid Row (No Email)",
          };
        });

        setBulkPreview(parsedPreview);
      } catch (err) {
        toast.error("Failed to parse Excel file preview");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkImport = async () => {
    if (!bulkFile) return;
    setBulkStatus("importing");
    setBulkProgress(20);

    try {
      setBulkProgress(50);
      const res = await (securityApi.users as any).bulkImport(bulkFile);
      setBulkProgress(100);

      const successCount = res.data?.successCount || 0;
      const failureCount = res.data?.failureCount || 0;

      setBulkStatus("done");
      setBulkResults({ created: successCount, failed: failureCount });

      if (failureCount > 0) {
        toast.error(
          `Import finished with ${failureCount} errors. ${successCount} imported successfully.`,
        );
      } else {
        toast.success(`All ${successCount} users imported successfully!`);
      }

      loadUsersList();
    } catch (err: any) {
      setBulkStatus("idle");
      toast.error(err.response?.data?.message || "Bulk import failed.");
    }
  };

  const downloadExcelTemplate = () => {
    // Generate true XLSX file template using SheetJS
    const headers = [
      ["Name", "Email", "Password", "Role", "Designation", "Phone"],
    ];
    const data = [
      [
        "John Doe",
        "john@dvepl.com",
        "Dvepl@2026",
        "admin",
        "Executive",
        "9876543210",
      ],
      [
        "Jane Smith",
        "jane@dvepl.com",
        "Dvepl@2026",
        "sales",
        "Manager",
        "9876543211",
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users Template");

    // Write XLSX output to binary format
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "DVEPL_Users_Import_Template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel template downloaded successfully");
  };

  const updateStoreSettings = async (partialSettings: any) => {
    try {
      const current = store.settings || {};
      const payload = {
        ...current,
        ...partialSettings,
      };
      await store.updateSettings(payload);
    } catch (e) {
      console.error("Failed to update settings:", e);
    }
  };

  // 3. Manage Fields Handlers
  const handleToggleField = (field: string) => {
    const updated = { ...orderFields, [field]: !orderFields[field] };
    setOrderFields(updated);
    localStorage.setItem("dvepl_order_fields", JSON.stringify(updated));
    updateStoreSettings({ orderFields: updated });
    toast.success("Fields configuration updated");
  };

  const handleAddConcernedPerson = () => {
    if (!newPersonName.trim()) return;
    const updated = [...concernedPersons, newPersonName.trim()];
    setConcernedPersons(updated);
    localStorage.setItem("dvepl_concerned_persons", JSON.stringify(updated));
    updateStoreSettings({ concernedPersons: updated });
    setNewPersonName("");
    toast.success("Concerned person added");
  };

  const handleRemoveConcernedPerson = (index: number) => {
    const updated = concernedPersons.filter((_, i) => i !== index);
    setConcernedPersons(updated);
    localStorage.setItem("dvepl_concerned_persons", JSON.stringify(updated));
    updateStoreSettings({ concernedPersons: updated });
    toast.success("Concerned person removed");
  };

  // 4. Notifications Handlers
  const saveNotifSettings = () => {
    localStorage.setItem("dvepl_whatsapp_settings", JSON.stringify(waSettings));
    localStorage.setItem("dvepl_email_settings", JSON.stringify(emailSettings));
    localStorage.setItem("dvepl_alert_events", JSON.stringify(alertEvents));
    localStorage.setItem(
      "dvepl_auto_send_defaults",
      JSON.stringify(autoSendDefaults),
    );
    updateStoreSettings({
      waSettings,
      emailSettings,
      alertEvents,
      autoSendDefaults,
    });
  };

  const testWaConnection = async () => {
    if (!waSettings.number) {
      toast.error("Please enter a valid WhatsApp Number");
      return;
    }
    try {
      const promise = securityApi.settings.testWhatsapp({
        provider: "wati",
        apiKey: gatewaySettings.apiKey,
        instanceId: gatewaySettings.baseUrl,
        number: waSettings.number,
      });
      await toast.promise(promise, {
        loading: "Sending test WhatsApp message...",
        success: "Test WhatsApp message sent successfully!",
        error: (err: any) =>
          err?.response?.data?.message || "Failed to send WhatsApp message.",
      });
    } catch (e) {
      console.error(e);
    }
  };

  const testEmailConnection = async () => {
    if (!emailSettings.address) {
      toast.error("Please enter a valid Email Address");
      return;
    }
    try {
      let customFields = {};
      if (selectedTestTemplateId) {
        const template = templates.find((t) => t.id === selectedTestTemplateId);
        if (template) {
          const replaceVars = (str: string) => {
            return (str || "")
              .replace(/\{\$name\}/g, "John Doe")
              .replace(/\{\$poNumber\}/g, "PO-2026-0001")
              .replace(/\{\$vendorName\}/g, "Acme Industrial Corp")
              .replace(
                /\{\$supportPhone\}/g,
                smtpSettings.supportPhone || "+91 9876543210",
              )
              .replace(
                /\{\$supportEmail\}/g,
                smtpSettings.supportEmail || "support@dvepl.com",
              );
          };

          const finalSubject = replaceVars(template.subject);
          const finalContent1 = replaceVars(template.content1);
          const finalContent2 = replaceVars(template.content2);

          const emailText = `${finalContent1}\n\n${finalContent2}`;
          const emailHtml = `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.5; color: #333;">
            <p>${finalContent1.replace(/\n/g, "<br>")}</p>
            ${finalContent2 ? `<hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" /><p style="color: #666; font-size: 12px;">${finalContent2.replace(/\n/g, "<br>")}</p>` : ""}
          </div>`;

          customFields = {
            subject: finalSubject,
            text: emailText,
            html: emailHtml,
          };
        }
      }

      const promise = securityApi.settings.sendTestEmail({
        smtpSettings: {
          ...smtpSettings,
          username: smtpSettings.email,
          secure: smtpSettings.port === 465,
        },
        toEmail: emailSettings.address,
        fromEmail: smtpSettings.email,
        fromName: smtpSettings.title || "DVEPL ERP",
        ...customFields,
      });
      await toast.promise(promise, {
        loading: "Sending test email...",
        success: "Test email sent successfully!",
        error: (err: any) =>
          err?.response?.data?.message || "Failed to send email.",
      });
    } catch (e) {
      console.error(e);
    }
  };

  const saveSmtpSettings = () => {
    const updatedSmtp = {
      ...smtpSettings,
      username: smtpSettings.email,
    };
    localStorage.setItem("dvepl_smtp_settings", JSON.stringify(updatedSmtp));
    updateStoreSettings({ smtpSettings: updatedSmtp });
    toast.success("SMTP configuration saved successfully");
    setIsEditingSmtp(false);
  };

  const testSmtpConnection = async () => {
    try {
      const promise = securityApi.settings.testSmtp({
        host: smtpSettings.host,
        port: smtpSettings.port,
        username: smtpSettings.email,
        password: smtpSettings.password,
        secure: Number(smtpSettings.port) === 465,
      });
      await toast.promise(promise, {
        loading: "Testing SMTP connection...",
        success: "SMTP server connected successfully!",
        error: (err: any) =>
          err?.response?.data?.message ||
          "SMTP connection failed. Check host and credentials.",
      });
    } catch (e) {
      console.error(e);
    }
  };

  const saveCaptchaSettings = () => {
    localStorage.setItem(
      "dvepl_captcha_settings",
      JSON.stringify(captchaSettings),
    );
    updateStoreSettings({ captchaSettings });
    toast.success("Captcha settings saved");
  };

  const saveGatewaySettings = () => {
    const updatedGateway = {
      ...gatewaySettings,
      instanceId: gatewaySettings.baseUrl,
    };
    localStorage.setItem(
      "dvepl_whatsapp_gateway",
      JSON.stringify(updatedGateway),
    );
    updateStoreSettings({ gatewaySettings: updatedGateway });
    toast.success("WhatsApp Gateway settings saved");
    setIsEditingGateway(false);
  };

  const testGateway = async () => {
    try {
      const promise = securityApi.settings.testWhatsapp({
        provider: "wati",
        apiKey: gatewaySettings.apiKey,
        instanceId: gatewaySettings.baseUrl,
      });
      await toast.promise(promise, {
        loading: "Connecting to Gateway...",
        success: "Gateway handshake successful!",
        error: (err: any) =>
          err?.response?.data?.message || "Gateway unreachable.",
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Template Handlers
  const handleSaveTemplate = () => {
    if (
      !templateName ||
      !templateSubject ||
      !templateContent1 ||
      !templateType
    ) {
      toast.error("Please fill in all template required fields");
      return;
    }
    let updated;
    if (editingTemplate) {
      updated = templates.map((t) =>
        t.id === editingTemplate.id
          ? {
              ...t,
              name: templateName,
              subject: templateSubject,
              content1: templateContent1,
              content2: templateContent2,
              type: templateType,
            }
          : t,
      );
      toast.success("Template updated successfully");
    } else {
      const newT = {
        id: Date.now().toString(),
        name: templateName,
        subject: templateSubject,
        content1: templateContent1,
        content2: templateContent2,
        type: templateType,
      };
      updated = [...templates, newT];
      toast.success("Template added successfully");
    }
    setTemplates(updated);
    localStorage.setItem("dvepl_email_templates", JSON.stringify(updated));
    updateStoreSettings({ templates: updated });
    cancelTemplateForm();
  };

  const handleEditTemplate = (t: any) => {
    setEditingTemplate(t);
    setTemplateName(t.name);
    setTemplateSubject(t.subject);
    setTemplateContent1(t.content1);
    setTemplateContent2(t.content2 || "");
    setTemplateType(t.type);
    setShowTemplateForm(true);
  };

  const handleDeleteTemplate = (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    localStorage.setItem("dvepl_email_templates", JSON.stringify(updated));
    updateStoreSettings({ templates: updated });
    toast.success("Template deleted");
  };

  const cancelTemplateForm = () => {
    setShowTemplateForm(false);
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateSubject("");
    setTemplateContent1("");
    setTemplateContent2("");
    setTemplateType("");
  };

  // 5. Theme & Appearance
  const selectBrandColor = (color: string) => {
    setBrandColor(color);
    localStorage.setItem("dvepl_brand_color", color);
    updateStoreSettings({ brandColor: color });
    try {
      const hslVal = hexToHslString(color);
      document.documentElement.style.setProperty("--primary", hslVal);
    } catch (e) {
      document.documentElement.style.setProperty("--primary", color);
    }
    toast.success("Primary brand color updated");
  };

  const selectBgColor = (color: string) => {
    setBgColor(color);
    localStorage.setItem("dvepl_bg_color", color);
    updateStoreSettings({ bgColor: color });
    document.documentElement.style.setProperty("--bg", color);
    toast.success("Background color updated");
  };

  const selectSidebarPos = (pos: "left" | "right") => {
    setSidebarPos(pos);
    localStorage.setItem("dvepl_theme_sidebar_pos", pos);
    updateStoreSettings({ sidebarPos: pos });
    window.dispatchEvent(new Event("dvepl_sidebar_pos_changed"));
    toast.success(`Sidebar moved to the ${pos}`);
  };

  const resetThemeToDefault = () => {
    setBrandColor("#33cc33");
    setBgColor("#f8fafc");
    setSidebarPos("left");
    localStorage.removeItem("dvepl_brand_color");
    localStorage.removeItem("dvepl_bg_color");
    localStorage.removeItem("dvepl_theme_sidebar_pos");
    updateStoreSettings({
      brandColor: "#33cc33",
      bgColor: "#f8fafc",
      sidebarPos: "left",
    });
    document.documentElement.style.setProperty("--primary", "120 60% 50%"); // HSL coordinates for #33cc33
    document.documentElement.style.setProperty("--bg", "#f8fafc");
    window.dispatchEvent(new Event("dvepl_sidebar_pos_changed"));
    toast.success("Theme reset to system defaults");
  };

  // 6. Backup & Restore
  const downloadBackup = async () => {
    try {
      // Fetch latest backup from backend (merging DB + json settings)
      const backupData = await securityApi.settings
        .exportBackup()
        .catch(() => ({
          timestamp: new Date().toISOString(),
          theme: store.theme,
          orderFields,
          concernedPersons,
          waSettings,
          emailSettings,
          smtpSettings,
          captchaSettings,
          gatewaySettings,
          templates,
        }));

      const str = JSON.stringify(backupData, null, 2);
      const blob = new Blob([str], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${backupFilename || "DVEPL_Backup"}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Save to backup history
      const newHistory = [
        {
          id: Date.now().toString(),
          filename: `${backupFilename || "DVEPL_Backup"}.json`,
          size: `${(str.length / 1024).toFixed(2)} KB`,
          date: new Date().toLocaleString(),
          modules: backupModules.join(", "),
        },
        ...backupHistory,
      ];
      setBackupHistory(newHistory);
      localStorage.setItem("dvepl_backup_history", JSON.stringify(newHistory));
      updateStoreSettings({ backupHistory: newHistory });

      toast.success("Backup file generated and downloaded");
    } catch (error) {
      toast.error("Failed to generate backup.");
    }
  };

  const restoreBackup = () => {
    if (!restoreFile) {
      toast.error("Please select a JSON backup file to restore");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Push the restore data to the backend settings and database
        await securityApi.settings.importBackup(data).catch(() => {});

        const payload: any = {};
        if (data.orderFields) {
          setOrderFields(data.orderFields);
          payload.orderFields = data.orderFields;
          localStorage.setItem(
            "dvepl_order_fields",
            JSON.stringify(data.orderFields),
          );
        }
        if (data.concernedPersons) {
          setConcernedPersons(data.concernedPersons);
          payload.concernedPersons = data.concernedPersons;
          localStorage.setItem(
            "dvepl_concerned_persons",
            JSON.stringify(data.concernedPersons),
          );
        }
        if (data.waSettings) {
          setWaSettings(data.waSettings);
          payload.waSettings = data.waSettings;
          localStorage.setItem(
            "dvepl_whatsapp_settings",
            JSON.stringify(data.waSettings),
          );
        }
        if (data.emailSettings) {
          setEmailSettings(data.emailSettings);
          payload.emailSettings = data.emailSettings;
          localStorage.setItem(
            "dvepl_email_settings",
            JSON.stringify(data.emailSettings),
          );
        }
        if (data.smtpSettings) {
          setSmtpSettings(data.smtpSettings);
          payload.smtpSettings = data.smtpSettings;
          localStorage.setItem(
            "dvepl_smtp_settings",
            JSON.stringify(data.smtpSettings),
          );
        }
        if (data.templates) {
          setTemplates(data.templates);
          payload.templates = data.templates;
          localStorage.setItem(
            "dvepl_email_templates",
            JSON.stringify(data.templates),
          );
        }
        updateStoreSettings(payload);
        toast.success("Backup restored successfully!");
      } catch (err) {
        toast.error(
          "Failed to parse backup file. Please use a valid DVEPL Backup JSON file.",
        );
      }
    };
    reader.readAsText(restoreFile);
  };

  const rolesList =
    store.roles && store.roles.length > 0
      ? store.roles
      : [
          { id: "1", name: "Admin" },
          { id: "2", name: "Sales Executive" },
          { id: "3", name: "Project Manager" },
          { id: "4", name: "Procurement Manager" },
          { id: "5", name: "Accounts Team" },
          { id: "6", name: "Production Team" },
          { id: "7", name: "User" },
        ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            System Settings
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
            ⚙️ Settings & Control Panel
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage users, custom fields, theme styling, SMTP, templates and
            WhatsApp configurations.
          </p>
        </div>
        {activeSection !== "hub" && (
          <button
            onClick={() => setActiveSection("hub")}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition shadow-sm"
          >
            ← Back to Hub
          </button>
        )}
      </div>

      {/* ─── SECTION 1: HUB CARDS OVERVIEW ─── */}
      {activeSection === "hub" && (
        <div className="settings-hub">
          <div
            className="hub-card"
            onClick={() => setActiveSection("manage-users")}
          >
            <div className="hub-icon-wrap green">👤</div>
            <div className="hub-card-body">
              <div className="hub-card-title">Manage Users</div>
              <div className="hub-card-desc">
                View, edit, delete, assign roles and custom permissions.
              </div>
            </div>
            <div className="hub-arrow">→</div>
          </div>

          <div
            className="hub-card"
            onClick={() => {
              setActiveSection("create-user");
              setBulkTab("single");
            }}
          >
            <div className="hub-icon-wrap blue">➕</div>
            <div className="hub-card-body">
              <div className="hub-card-title">Create User</div>
              <div className="hub-card-desc">
                Add a new team member individually or bulk import from Excel.
              </div>
            </div>
            <div className="hub-arrow">→</div>
          </div>

          



          <div className="hub-card" onClick={() => setActiveSection('notifications')}>
            <div className="hub-icon-wrap purple">🔔</div>
            <div className="hub-card-body">
              <div className="hub-card-title">Notifications & SMTP</div>
              <div className="hub-card-desc">
                Configure WhatsApp Gateway, SMTP credentials and templates.
              </div>
            </div>
            <div className="hub-arrow">→</div>
          </div>

          <div className="hub-card" onClick={() => setActiveSection("theme")}>
            <div className="hub-icon-wrap pink">🎨</div>
            <div className="hub-card-body">
              <div className="hub-card-title">Theme & Appearance</div>
              <div className="hub-card-desc">
                Modify brand colors, layouts and sidebar positioning.
              </div>
            </div>
            <div className="hub-arrow">→</div>
          </div>

          <div className="hub-card" onClick={() => setActiveSection("backup")}>
            <div className="hub-icon-wrap blue">💾</div>
            <div className="hub-card-body">
              <div className="hub-card-title">Backup & Restore</div>
              <div className="hub-card-desc">
                Export all system details to local storage backup or restore.
              </div>
            </div>
            <div className="hub-arrow">→</div>
          </div>
        </div>
      )}

      {/* ─── SECTION 2: MANAGE USERS ─── */}
      {activeSection === "manage-users" && (
        <div className="space-y-4">
          <div className="section-card">
            <div className="section-header">
              <div className="section-icon">👤</div>
              <div>
                <div className="section-title">Manage Users</div>
                <div className="section-desc">
                  View and manage system users. Click 🔐 Permissions to
                  fine-tune access control.
                </div>
              </div>
            </div>
            <div className="p-4 bg-muted/10 border-b border-border flex flex-col md:flex-row gap-3 items-center justify-between">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email or role..."
                className="w-full md:max-w-md px-3.5 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
              />
              <div className="text-xs text-muted-foreground font-semibold flex items-center gap-3">
                <span>Total: {users.length} users</span>
                <button
                  onClick={() => {
                    setActiveSection("create-user");
                    setBulkTab("single");
                  }}
                  className="px-3.5 py-1.5 text-xs bg-primary text-white font-bold rounded-lg hover:bg-primary/95 transition shadow-sm"
                >
                  ➕ Add User
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/15 border-b border-border">
                  <tr>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Name
                    </th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Email
                    </th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Designation
                    </th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Role
                    </th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingUsers ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-muted-foreground"
                      >
                        ⏳ Loading system users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No users found matching search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/10">
                        <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-[10px]">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                          {user.name}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {user.email}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {user.designation || "Staff"}
                        </td>
                        <td className="p-3">
                          <span
                            className={`role-badge ${user.role.toLowerCase()}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => handleOpenPermModal(user)}
                              className="px-2 py-1 text-[10px] font-bold bg-primary-pale text-primary border border-primary/25 rounded-md hover:bg-primary-pale/80"
                            >
                              🔐 Permissions
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="px-2 py-1 text-[10px] font-bold bg-muted text-muted-foreground border border-border rounded-md hover:bg-border"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-2 py-1 text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100"
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 3: CREATE USER ─── */}
      {activeSection === "create-user" && (
        <div className="space-y-4">
          {/* Sub Navigation */}
          <div className="flex border-b border-border gap-4">
            <button
              onClick={() => setBulkTab("single")}
              className={`pb-2 text-xs font-bold transition border-b-2 ${bulkTab === "single" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
            >
              👤 Single User
            </button>
            <button
              onClick={() => setBulkTab("bulk")}
              className={`pb-2 text-xs font-bold transition border-b-2 ${bulkTab === "bulk" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
            >
              📊 Bulk Import
            </button>
          </div>

          {bulkTab === "single" ? (
            <div className="section-card">
              <div className="section-header">
                <div className="section-icon">➕</div>
                <div>
                  <div className="section-title">New User Account</div>
                  <div className="section-desc">
                    Create a new user credentials profile directly.
                  </div>
                </div>
              </div>
              <form
                className="section-body space-y-4"
                autoComplete="off"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      autoComplete="new-user-name"
                      className={`w-full px-3.5 py-2 text-xs border bg-card rounded-lg outline-none focus:border-primary ${formErrors.name ? "border-red-500 shake-input" : "border-border"}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="e.g. rahul@dvepl.com"
                      autoComplete="new-user-email"
                      className={`w-full px-3.5 py-2 text-xs border bg-card rounded-lg outline-none focus:border-primary ${formErrors.email ? "border-red-500 shake-input" : "border-border"}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewUserPassword ? "text" : "password"}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={`w-full pl-3.5 pr-10 py-2 text-xs border bg-card rounded-lg outline-none focus:border-primary ${formErrors.password ? "border-red-500 shake-input" : "border-border"}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowNewUserPassword(!showNewUserPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
                      >
                        {showNewUserPassword ? (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Designation
                    </label>
                    <select
                      value={newUserDesignation}
                      onChange={(e) => setNewUserDesignation(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                    >
                      <option value="">— Select Designation —</option>
                      {designationsList.map((d: any) => (
                        <option key={d.id} value={d.title}>
                          {d.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      autoComplete="new-user-phone"
                      className={`w-full px-3.5 py-2 text-xs border bg-card rounded-lg outline-none focus:border-primary ${formErrors.phone ? "border-red-500 shake-input" : "border-border"}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      User Role *
                    </label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className={`w-full px-3.5 py-2 text-xs border bg-card rounded-lg outline-none focus:border-primary ${formErrors.role ? "border-red-500 shake-input" : "border-border"}`}
                    >
                      <option value="">— Select a role —</option>
                      {rolesList.map((r) => (
                        <option key={r.id} value={r.name.toLowerCase()}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="border-t border-border pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("manage-users");
                      setFormErrors({});
                    }}
                    className="px-4 py-2 border border-border rounded-lg bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateUser}
                    className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition shadow-sm"
                  >
                    Create User →
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="section-card">
              <div className="section-header">
                <div className="section-icon">📊</div>
                <div>
                  <div className="section-title">Bulk Import Users</div>
                  <div className="section-desc">
                    Create multiple accounts by uploading an Excel file.
                  </div>
                </div>
              </div>
              <div className="section-body space-y-4">
                <div className="p-4 bg-muted/20 border border-dashed border-border rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      📋 Excel Import Template
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Required fields: Name, Email, Password, Role. Optional:
                      Designation, Phone.
                    </p>
                  </div>
                  <button
                    onClick={downloadExcelTemplate}
                    className="px-3 py-1.5 text-xs bg-primary text-white font-bold rounded-lg hover:bg-primary/95 transition flex items-center gap-1 shadow-sm"
                  >
                    ⬇️ Download Template
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Select Excel File
                  </label>
                  <input
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleBulkFileChange}
                    className="w-full p-2 border border-border bg-card rounded-lg text-xs"
                  />
                </div>

                {/* Preview Grid */}
                {bulkPreview.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-foreground">
                      📋 Preview Data ({bulkPreview.length} records ready)
                    </div>
                    <div className="overflow-hidden border border-border rounded-lg">
                      <table className="w-full text-[11px] text-left border-collapse">
                        <thead className="bg-muted/15 border-b border-border">
                          <tr>
                            <th className="p-2 font-bold text-muted-foreground">
                              Name
                            </th>
                            <th className="p-2 font-bold text-muted-foreground">
                              Email
                            </th>
                            <th className="p-2 font-bold text-muted-foreground">
                              Role
                            </th>
                            <th className="p-2 font-bold text-muted-foreground">
                              Designation
                            </th>
                            <th className="p-2 font-bold text-muted-foreground text-center">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {bulkPreview.map((row, idx) => (
                            <tr key={idx} className="hover:bg-muted/5">
                              <td className="p-2 font-semibold">{row.name}</td>
                              <td className="p-2">{row.email}</td>
                              <td className="p-2">
                                <span className={`role-badge ${row.role}`}>
                                  {row.role}
                                </span>
                              </td>
                              <td className="p-2 text-muted-foreground">
                                {row.designation}
                              </td>
                              <td className="p-2 text-center text-green-600 font-bold">
                                {row.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                {bulkStatus === "importing" && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Importing accounts...</span>
                      <span>{bulkProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${bulkProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Results block */}
                {bulkStatus === "done" && (
                  <div className="p-3 bg-primary-pale border border-primary/25 rounded-lg text-xs">
                    <div className="font-bold text-primary">
                      Import Completed Successfully
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div>
                        Created:{" "}
                        <strong className="text-foreground">
                          {bulkResults.created}
                        </strong>
                      </div>
                      <div>
                        Failed:{" "}
                        <strong className="text-foreground">
                          {bulkResults.failed}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setBulkFile(null);
                      setBulkPreview([]);
                      setBulkStatus("idle");
                    }}
                    className="px-4 py-2 border border-border rounded-lg bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleBulkImport}
                    disabled={!bulkFile || bulkStatus === "importing"}
                    className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📥 Import Users
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      



      {/* ─── SECTION 6: NOTIFICATIONS & SMTP ─── */}
      {activeSection === "notifications" && (
        <div className="space-y-6">
          {/* Subtabs */}
          <div className="flex flex-wrap gap-2 border-b border-border pb-2.5">
            {[
              { key: "contacts", label: "📬 Contacts & Alerts" },
              { key: "smtp", label: "📧 SMTP Settings" },
              { key: "templates", label: "📄 Email Templates" },
              { key: "captcha", label: "🛡️ Captcha settings" },
              { key: "gateway", label: "💬 WhatsApp Gateway" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setNotifTab(tab.key as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${notifTab === tab.key ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted/15"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contacts & Alerts tab */}
          {notifTab === "contacts" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* WhatsApp configuration */}
                <div className="section-card mb-0">
                  <div className="section-header">
                    <div className="section-icon">💬</div>
                    <div className="flex-1">
                      <div className="section-title">
                        WhatsApp Notifications
                      </div>
                      <div className="section-desc">
                        Manage your business WhatsApp gateway alerts.
                      </div>
                    </div>
                    <label className="toggle-wrap">
                      <input
                        type="checkbox"
                        checked={waSettings.masterToggle}
                        onChange={(e) => {
                          const updated = {
                            ...waSettings,
                            masterToggle: e.target.checked,
                          };
                          setWaSettings(updated);
                          localStorage.setItem(
                            "dvepl_whatsapp_settings",
                            JSON.stringify(updated),
                          );
                        }}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="section-body space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        WhatsApp Number
                      </label>
                      <input
                        type="text"
                        value={waSettings.number}
                        onChange={(e) =>
                          setWaSettings({
                            ...waSettings,
                            number: e.target.value,
                          })
                        }
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                      />
                      <small className="text-[10px] text-muted-foreground block">
                        Include country code e.g. +91
                      </small>
                    </div>
                    <button
                      onClick={() => setShowWaConfig(!showWaConfig)}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      {showWaConfig
                        ? "Hide Settings ▾"
                        : "Configure Credentials ▾"}
                    </button>
                    {showWaConfig && (
                      <div className="p-3 bg-muted/10 border border-border rounded-lg space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Phone Number ID
                          </label>
                          <input
                            type="text"
                            value={waSettings.phoneId}
                            onChange={(e) =>
                              setWaSettings({
                                ...waSettings,
                                phoneId: e.target.value,
                              })
                            }
                            placeholder="Meta Phone Number ID"
                            className="w-full px-3 py-1 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Access Token
                          </label>
                          <input
                            type="password"
                            value={waSettings.accessToken}
                            onChange={(e) =>
                              setWaSettings({
                                ...waSettings,
                                accessToken: e.target.value,
                              })
                            }
                            placeholder="Bearer Token"
                            className="w-full px-3 py-1 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    )}
                    <div className="border-t border-border pt-4 flex gap-2">
                      <button
                        onClick={testWaConnection}
                        className="px-3.5 py-1.5 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition shadow-sm"
                      >
                        ✓ Test WhatsApp
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email configuration */}
                <div className="section-card mb-0">
                  <div className="section-header">
                    <div className="section-icon">📧</div>
                    <div className="flex-1">
                      <div className="section-title">Email Notifications</div>
                      <div className="section-desc">
                        Manage system summary and event email reports.
                      </div>
                    </div>
                  </div>
                  <div className="section-body space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Recipient Email Address
                      </label>
                      <input
                        type="email"
                        value={emailSettings.address}
                        onChange={(e) =>
                          setEmailSettings({
                            ...emailSettings,
                            address: e.target.value,
                          })
                        }
                        placeholder="alerts@company.com"
                        className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Test Template (Optional)
                      </label>
                      <select
                        value={selectedTestTemplateId}
                        onChange={(e) =>
                          setSelectedTestTemplateId(e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                      >
                        <option value="">Default Test Message</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Channel Preferences
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={emailSettings.orders}
                            onChange={(e) =>
                              setEmailSettings({
                                ...emailSettings,
                                orders: e.target.checked,
                              })
                            }
                            className="accent-primary"
                          />
                          Order created & update summaries
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={emailSettings.payments}
                            onChange={(e) =>
                              setEmailSettings({
                                ...emailSettings,
                                payments: e.target.checked,
                              })
                            }
                            className="accent-primary"
                          />
                          Payment due notifications
                        </label>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4">
                      <button
                        onClick={testEmailConnection}
                        className="px-3.5 py-1.5 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition shadow-sm"
                      >
                        ✓ Test Email
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert Events Table */}
              <div className="section-card">
                <div className="section-header">
                  <div className="section-icon">🔔</div>
                  <div>
                    <div className="section-title">Alert Events matrix</div>
                    <div className="section-desc">
                      Toggle which system hooks trigger automatic alerts to
                      recipients.
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/15 border-b border-border">
                      <tr>
                        <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Event Hook Name
                        </th>
                        <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                          WhatsApp Channel
                        </th>
                        <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                          Email Channel
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {Object.keys(alertEvents).map((eventKey) => (
                        <tr key={eventKey} className="hover:bg-muted/5">
                          <td className="p-3 font-semibold capitalize">
                            {eventKey.replace(/_/g, " ")}
                          </td>
                          <td className="p-3 text-center">
                            <label className="toggle-wrap">
                              <input
                                type="checkbox"
                                checked={alertEvents[eventKey].wa}
                                onChange={(e) => {
                                  const updated = {
                                    ...alertEvents,
                                    [eventKey]: {
                                      ...alertEvents[eventKey],
                                      wa: e.target.checked,
                                    },
                                  };
                                  setAlertEvents(updated);
                                  localStorage.setItem(
                                    "dvepl_alert_events",
                                    JSON.stringify(updated),
                                  );
                                }}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                          </td>
                          <td className="p-3 text-center">
                            <label className="toggle-wrap">
                              <input
                                type="checkbox"
                                checked={alertEvents[eventKey].email}
                                onChange={(e) => {
                                  const updated = {
                                    ...alertEvents,
                                    [eventKey]: {
                                      ...alertEvents[eventKey],
                                      email: e.target.checked,
                                    },
                                  };
                                  setAlertEvents(updated);
                                  localStorage.setItem(
                                    "dvepl_alert_events",
                                    JSON.stringify(updated),
                                  );
                                }}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SMTP settings tab */}
          {/* SMTP settings tab */}
          {notifTab === "smtp" && (
            <div className="section-card">
              <div className="section-header flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="section-icon">📧</div>
                  <div>
                    <div className="section-title">SMTP Mail Configuration</div>
                    <div className="section-desc">
                      Manage credentials for outgoing server. Required for order
                      pdf mailing.
                    </div>
                  </div>
                </div>
                {!isEditingSmtp && (
                  <button
                    onClick={() => setIsEditingSmtp(true)}
                    className="px-3.5 py-1.5 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition shadow-sm"
                  >
                    ✏️ Edit Configuration
                  </button>
                )}
              </div>

              {!isEditingSmtp ? (
                <div className="overflow-x-auto p-4 space-y-4">
                  <table className="w-full text-xs text-left border-collapse border border-border rounded-lg overflow-hidden">
                    <thead className="bg-muted/15 border-b border-border">
                      <tr>
                        <th className="p-3 font-bold text-muted-foreground w-1/3">
                          Setting Field
                        </th>
                        <th className="p-3 font-bold text-muted-foreground w-2/3">
                          Configured Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-muted/5">
                        <td className="p-3 font-semibold">
                          Sender Name / Title
                        </td>
                        <td className="p-3 text-foreground">
                          {smtpSettings.title || (
                            <span className="text-muted-foreground italic">
                              Not set
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/5">
                        <td className="p-3 font-semibold">
                          SMTP Email Address (Username)
                        </td>
                        <td className="p-3 text-foreground">
                          {smtpSettings.email || (
                            <span className="text-muted-foreground italic">
                              Not set
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/5">
                        <td className="p-3 font-semibold">SMTP Host Server</td>
                        <td className="p-3 text-foreground">
                          {smtpSettings.host || (
                            <span className="text-muted-foreground italic">
                              Not set
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/5">
                        <td className="p-3 font-semibold">SMTP Port</td>
                        <td className="p-3 text-foreground">
                          {smtpSettings.port || (
                            <span className="text-muted-foreground italic">
                              Not set
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/5">
                        <td className="p-3 font-semibold">
                          Security (SSL/TLS)
                        </td>
                        <td className="p-3 text-foreground">
                          {Number(smtpSettings.port) === 465 ? (
                            <span className="role-badge user">
                              SSL/TLS (Port 465)
                            </span>
                          ) : (
                            <span className="role-badge">
                              STARTTLS (Port {smtpSettings.port || "587"})
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/5">
                        <td className="p-3 font-semibold">
                          Support Contact Phone
                        </td>
                        <td className="p-3 text-foreground">
                          {smtpSettings.supportPhone || (
                            <span className="text-muted-foreground italic">
                              Not set
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/5">
                        <td className="p-3 font-semibold">
                          Registered Office Address
                        </td>
                        <td className="p-3 text-foreground">
                          {smtpSettings.address || (
                            <span className="text-muted-foreground italic">
                              Not set
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={testSmtpConnection}
                      className="px-4 py-2 border border-border rounded-lg bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition"
                    >
                      ✉️ Test SMTP Connection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="section-body space-y-4">
                  {/* Dummy inputs to intercept and prevent browser autofill */}
                  <input
                    type="text"
                    name="prevent_autofill_username"
                    style={{ display: "none" }}
                    autoComplete="off"
                  />
                  <input
                    type="password"
                    name="prevent_autofill_password"
                    style={{ display: "none" }}
                    autoComplete="new-password"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Sender Name / Title *
                      </label>
                      <input
                        type="text"
                        name="smtp_sender_title"
                        autoComplete="off"
                        value={smtpSettings.title}
                        onChange={(e) =>
                          setSmtpSettings({
                            ...smtpSettings,
                            title: e.target.value,
                          })
                        }
                        placeholder="e.g. DVEPL PO Service"
                        className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        SMTP Email Address *
                      </label>
                      <input
                        type="text"
                        name="smtp_email_address"
                        autoComplete="new-password"
                        value={smtpSettings.email}
                        onChange={(e) =>
                          setSmtpSettings({
                            ...smtpSettings,
                            email: e.target.value,
                          })
                        }
                        placeholder="e.g. alerts@dvepl.com"
                        className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        SMTP Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showSmtpPass ? "text" : "password"}
                          name="smtp_email_password"
                          autoComplete="new-password"
                          value={smtpSettings.password}
                          onChange={(e) =>
                            setSmtpSettings({
                              ...smtpSettings,
                              password: e.target.value,
                            })
                          }
                          placeholder="••••••••"
                          className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPass(!showSmtpPass)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none flex items-center justify-center"
                        >
                          {showSmtpPass ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        SMTP Host Server *
                      </label>
                      <input
                        type="text"
                        value={smtpSettings.host}
                        onChange={(e) =>
                          setSmtpSettings({
                            ...smtpSettings,
                            host: e.target.value,
                          })
                        }
                        placeholder="smtp.gmail.com"
                        className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        SMTP Port *
                      </label>
                      <input
                        type="number"
                        value={smtpSettings.port}
                        onChange={(e) =>
                          setSmtpSettings({
                            ...smtpSettings,
                            port: parseInt(e.target.value) || 587,
                          })
                        }
                        placeholder="587"
                        className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Support Contact Phone
                      </label>
                      <input
                        type="text"
                        value={smtpSettings.supportPhone}
                        onChange={(e) =>
                          setSmtpSettings({
                            ...smtpSettings,
                            supportPhone: e.target.value,
                          })
                        }
                        placeholder="e.g. +91 94176 01244"
                        className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Registered Office Address
                    </label>
                    <input
                      type="text"
                      value={smtpSettings.address}
                      onChange={(e) =>
                        setSmtpSettings({
                          ...smtpSettings,
                          address: e.target.value,
                        })
                      }
                      placeholder="Ranipur, Pathankot, Punjab"
                      className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                    />
                  </div>
                  <div className="border-t border-border pt-4 flex gap-2">
                    <button
                      onClick={saveSmtpSettings}
                      className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition shadow-sm"
                    >
                      💾 Save SMTP Settings
                    </button>
                    {smtpSettings.host && (
                      <button
                        onClick={() => setIsEditingSmtp(false)}
                        className="px-4 py-2 border border-border rounded-lg bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={testSmtpConnection}
                      className="px-4 py-2 border border-border rounded-lg bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition"
                    >
                      ✉️ Test SMTP
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Templates Tab */}
          {notifTab === "templates" && (
            <div className="space-y-6">
              {showTemplateForm ? (
                <div className="section-card">
                  <div className="section-header">
                    <div className="section-icon">📄</div>
                    <div>
                      <div className="section-title">
                        {editingTemplate
                          ? "Edit Template"
                          : "New Email Template"}
                      </div>
                      <div className="section-desc">
                        Create/edit templates used when emailing PO documents.
                      </div>
                    </div>
                  </div>
                  <div className="section-body space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Template Name *
                        </label>
                        <input
                          type="text"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="e.g. PO Confirmation"
                          className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Subject Line *
                        </label>
                        <input
                          type="text"
                          value={templateSubject}
                          onChange={(e) => setTemplateSubject(e.target.value)}
                          placeholder="Your Purchase Order is ready"
                          className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Main Email Body content *
                      </label>
                      <textarea
                        value={templateContent1}
                        onChange={(e) => setTemplateContent1(e.target.value)}
                        rows={4}
                        placeholder="Content body..."
                        className="w-full p-2 border border-border bg-card rounded-lg text-xs outline-none focus:border-primary font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Footer content
                      </label>
                      <input
                        type="text"
                        value={templateContent2}
                        onChange={(e) => setTemplateContent2(e.target.value)}
                        placeholder="Regards, DVEPL Team"
                        className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Template Type Hook *
                      </label>
                      <select
                        value={templateType}
                        onChange={(e) => setTemplateType(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                      >
                        <option value="">Select type</option>
                        <option value="order_created">Order Created</option>
                        <option value="order_updated">Order Updated</option>
                        <option value="payment_due">Payment Due</option>
                        <option value="welcome">Welcome</option>
                      </select>
                    </div>

                    <div className="p-3 bg-primary-pale border border-primary/25 rounded-lg text-[11px] space-y-1">
                      <strong className="text-primary block">
                        Available Dynamic Variables:
                      </strong>
                      <span className="text-muted-foreground">
                        Use these placeholders to render values dynamically:
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {[
                          "{$name}",
                          "{$poNumber}",
                          "{$vendorName}",
                          "{$supportPhone}",
                          "{$supportEmail}",
                        ].map((v) => (
                          <code
                            key={v}
                            className="bg-card border border-primary/20 px-2 py-0.5 rounded text-[10px] text-primary"
                          >
                            {v}
                          </code>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 flex justify-end gap-2">
                      <button
                        onClick={cancelTemplateForm}
                        className="px-4 py-2 border border-border rounded-lg bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTemplate}
                        className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition shadow-sm"
                      >
                        💾 Save Template
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="section-card">
                  <div className="section-header">
                    <div className="section-icon">📄</div>
                    <div className="flex-1">
                      <div className="section-title">Email Templates</div>
                      <div className="section-desc">
                        Manage structured templates for automated mail
                        dispatches.
                      </div>
                    </div>
                    <button
                      onClick={() => setShowTemplateForm(true)}
                      className="px-3.5 py-1.5 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition shadow-sm"
                    >
                      ➕ Add Template
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-muted/15 border-b border-border">
                        <tr>
                          <th className="p-3 font-bold text-muted-foreground">
                            Template Name
                          </th>
                          <th className="p-3 font-bold text-muted-foreground">
                            Subject Line
                          </th>
                          <th className="p-3 font-bold text-muted-foreground">
                            Hook Type
                          </th>
                          <th className="p-3 font-bold text-muted-foreground text-center">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {templates.map((t) => (
                          <tr key={t.id} className="hover:bg-muted/5">
                            <td className="p-3 font-semibold">{t.name}</td>
                            <td className="p-3 text-muted-foreground">
                              {t.subject}
                            </td>
                            <td className="p-3">
                              <span className="role-badge user">{t.type}</span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="inline-flex gap-1.5">
                                <button
                                  onClick={() => handleEditTemplate(t)}
                                  className="px-2 py-1 text-[10px] font-bold bg-muted text-muted-foreground border border-border rounded hover:bg-border"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(t.id)}
                                  className="px-2 py-1 text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"
                                >
                                  ✕ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Captcha settings tab */}
          {notifTab === "captcha" && (
            <div className="section-card">
              <div className="section-header">
                <div className="section-icon">🛡️</div>
                <div>
                  <div className="section-title">Captcha Settings</div>
                  <div className="section-desc">
                    Protect DVEPL portal authentication using Google ReCAPTCHA.
                  </div>
                </div>
              </div>
              <div className="section-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Site Key
                    </label>
                    <input
                      type="text"
                      value={captchaSettings.siteKey}
                      onChange={(e) =>
                        setCaptchaSettings({
                          ...captchaSettings,
                          siteKey: e.target.value,
                        })
                      }
                      placeholder="Enter Google ReCAPTCHA Site Key"
                      className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Secret Key
                    </label>
                    <input
                      type="text"
                      value={captchaSettings.secretKey}
                      onChange={(e) =>
                        setCaptchaSettings({
                          ...captchaSettings,
                          secretKey: e.target.value,
                        })
                      }
                      placeholder="Enter Google ReCAPTCHA Secret Key"
                      className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="toggle-wrap">
                    <input
                      type="checkbox"
                      checked={captchaSettings.enabled}
                      onChange={(e) =>
                        setCaptchaSettings({
                          ...captchaSettings,
                          enabled: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="text-xs font-semibold text-foreground">
                    Enable Captcha verification on Portal Login page
                  </span>
                </div>
                <div className="border-t border-border pt-4">
                  <button
                    onClick={saveCaptchaSettings}
                    className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition shadow-sm"
                  >
                    💾 Save Captcha
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Gateway settings tab */}
          {notifTab === "gateway" && (
            <div className="section-card">
              <div className="section-header flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="section-icon">💬</div>
                  <div>
                    <div className="section-title">
                      WhatsApp Gateway Settings
                    </div>
                    <div className="section-desc">
                      Manage API endpoints for sending automated WhatsApp text
                      orders.
                    </div>
                  </div>
                </div>
                {!isEditingGateway && gatewaySettings.baseUrl && (
                  <button
                    onClick={() => setIsEditingGateway(true)}
                    className="px-3.5 py-1.5 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition shadow-sm"
                  >
                    ✏️ Edit Configuration
                  </button>
                )}
              </div>

              {!isEditingGateway && gatewaySettings.baseUrl ? (
                <div className="overflow-x-auto p-4 space-y-4">
                  <table className="w-full text-xs text-left border-collapse border border-border rounded-lg overflow-hidden">
                    <thead className="bg-muted/15 border-b border-border">
                      <tr>
                        <th className="p-3 font-bold text-muted-foreground w-1/3">
                          Setting Field
                        </th>
                        <th className="p-3 font-bold text-muted-foreground w-2/3">
                          Configured Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-muted/5">
                        <td className="p-3 font-semibold">API Base URL</td>
                        <td className="p-3 text-foreground">
                          {gatewaySettings.baseUrl || (
                            <span className="text-muted-foreground italic">
                              Not set
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/5">
                        <td className="p-3 font-semibold">
                          API Authorization Key
                        </td>
                        <td className="p-3 text-foreground">
                          {gatewaySettings.apiKey || (
                            <span className="text-muted-foreground italic">
                              Not set
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/5">
                        <td className="p-3 font-semibold">HMAC Secret Key</td>
                        <td className="p-3 text-foreground">
                          {gatewaySettings.secretKey ? (
                            "••••••••••••••••"
                          ) : (
                            <span className="text-muted-foreground italic">
                              Not set
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/5">
                        <td className="p-3 font-semibold">
                          Status / Integration
                        </td>
                        <td className="p-3 text-foreground">
                          {gatewaySettings.enabled ? (
                            <span className="role-badge user">
                              Active / Live
                            </span>
                          ) : (
                            <span className="role-badge">
                              Inactive / Disabled
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={testGateway}
                      className="px-4 py-2 border border-border rounded-lg bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition"
                    >
                      🔌 Test Gateway Handshake
                    </button>
                  </div>
                </div>
              ) : (
                <div className="section-body space-y-4">
                  {/* Dummy inputs to intercept and prevent browser autofill */}
                  <input
                    type="text"
                    name="prevent_autofill_username"
                    style={{ display: "none" }}
                    autoComplete="off"
                  />
                  <input
                    type="password"
                    name="prevent_autofill_password"
                    style={{ display: "none" }}
                    autoComplete="new-password"
                  />

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        API Base URL
                      </label>
                      <input
                        type="text"
                        name="wa_gateway_base_url"
                        autoComplete="off"
                        value={gatewaySettings.baseUrl}
                        onChange={(e) =>
                          setGatewaySettings({
                            ...gatewaySettings,
                            baseUrl: e.target.value,
                          })
                        }
                        placeholder="e.g. https://api.whatsapp-gateway.dvepl.com"
                        className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        API Authorization Key
                      </label>
                      <input
                        type="text"
                        name="wa_gateway_api_key"
                        autoComplete="new-password"
                        value={gatewaySettings.apiKey}
                        onChange={(e) =>
                          setGatewaySettings({
                            ...gatewaySettings,
                            apiKey: e.target.value,
                          })
                        }
                        placeholder="ak_dvepl_whatsapp_..."
                        className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        HMAC Signature Secret Key
                      </label>
                      <input
                        type="password"
                        name="wa_gateway_secret_key"
                        autoComplete="new-password"
                        value={gatewaySettings.secretKey}
                        onChange={(e) =>
                          setGatewaySettings({
                            ...gatewaySettings,
                            secretKey: e.target.value,
                          })
                        }
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="toggle-wrap">
                      <input
                        type="checkbox"
                        checked={gatewaySettings.enabled}
                        onChange={(e) =>
                          setGatewaySettings({
                            ...gatewaySettings,
                            enabled: e.target.checked,
                          })
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className="text-xs font-semibold text-foreground">
                      Activate custom Gateway Integration
                    </span>
                  </div>
                  <div className="border-t border-border pt-4 flex gap-2">
                    <button
                      onClick={saveGatewaySettings}
                      className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition shadow-sm"
                    >
                      💾 Save Gateway
                    </button>
                    {gatewaySettings.baseUrl && (
                      <button
                        onClick={() => setIsEditingGateway(false)}
                        className="px-4 py-2 border border-border rounded-lg bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={testGateway}
                      className="px-4 py-2 border border-border rounded-lg bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition"
                    >
                      🔌 Test Gateway
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── SECTION 7: THEME & APPEARANCE ─── */}
      {activeSection === "theme" && (
        <div className="space-y-6">
          <div className="section-card">
            <div className="section-header">
              <div className="section-icon">↔️</div>
              <div>
                <div className="section-title">Sidebar Position Layout</div>
                <div className="section-desc">
                  Move the primary navigation sidebar to either side of the
                  portal layout.
                </div>
              </div>
            </div>
            <div className="section-body">
              <div className="sidepos-grid">
                <label className="sidepos-option">
                  <input
                    type="radio"
                    name="sidebar-pos"
                    value="left"
                    checked={sidebarPos === "left"}
                    onChange={() => selectSidebarPos("left")}
                  />
                  <div className="sidepos-card">
                    <div className="sidepos-preview">
                      <div className="sp-bar"></div>
                      <div className="sp-main"></div>
                    </div>
                    <div className="sidepos-label">⬅ Left Side</div>
                  </div>
                </label>
                <label className="sidepos-option">
                  <input
                    type="radio"
                    name="sidebar-pos"
                    value="right"
                    checked={sidebarPos === "right"}
                    onChange={() => selectSidebarPos("right")}
                  />
                  <div className="sidepos-card">
                    <div className="sidepos-preview">
                      <div className="sp-main"></div>
                      <div className="sp-bar"></div>
                    </div>
                    <div className="sidepos-label">Right Side ➡</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className="section-header">
              <div className="section-icon">🎨</div>
              <div>
                <div className="section-title">Primary Brand Accent Color</div>
                <div className="section-desc">
                  Sets the main accent color across buttons, tables and selected
                  item menus.
                </div>
              </div>
            </div>
            <div className="section-body space-y-4">
              <div className="theme-color-grid">
                {[
                  { name: "Brand Green", hex: "#33cc33" },
                  { name: "Forest Green", hex: "#1d5c2e" },
                  { name: "Ocean Blue", hex: "#1e40af" },
                  { name: "Crimson Red", hex: "#b91c1c" },
                  { name: "Charcoal Grey", hex: "#374151" },
                  { name: "Deep Purple", hex: "#6b21a8" },
                ].map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => selectBrandColor(color.hex)}
                    className={`theme-swatch ${brandColor === color.hex ? "active" : ""}`}
                    style={{ background: color.hex }}
                    title={color.name}
                  />
                ))}
                <label
                  className="theme-custom-swatch"
                  title="Pick a custom color"
                >
                  🎨
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => selectBrandColor(e.target.value)}
                  />
                </label>
              </div>
              <hr className="border-border my-4" />
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground">
                  🖼️ Workspace Background Color
                </h4>
                <div className="theme-color-grid">
                  {[
                    { name: "Slate Light", hex: "#f8fafc" },
                    { name: "Warm Cream", hex: "#fdfbf7" },
                    { name: "Pure White", hex: "#ffffff" },
                  ].map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => selectBgColor(color.hex)}
                      className={`theme-swatch ${bgColor === color.hex ? "active" : ""}`}
                      style={{
                        background: color.hex,
                        border: "1px solid #cbd5e1",
                      }}
                      title={color.name}
                    />
                  ))}
                  <label
                    className="theme-custom-swatch"
                    title="Pick a custom workspace background"
                  >
                    🎨
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => selectBgColor(e.target.value)}
                    />
                  </label>
                </div>
              </div>
              <div className="theme-live-row">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm"
                  style={{ background: brandColor }}
                >
                  A
                </div>
                <div>
                  <div className="theme-live-title">Style Live Preview</div>
                  <div className="theme-live-desc">
                    Sample preview for buttons, badge elements and layout
                    avatars.
                  </div>
                </div>
                <button
                  className="px-4 py-1.5 text-xs text-white font-bold rounded-lg shadow-sm"
                  style={{ background: brandColor }}
                >
                  Accent Color Button
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={resetThemeToDefault}
              className="px-4 py-2 border border-border rounded-lg bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition"
            >
              ↺ Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {/* ─── SECTION 8: BACKUP & RESTORE ─── */}
      {activeSection === "backup" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create backup */}
            <div className="section-card mb-0">
              <div className="section-header">
                <div className="section-icon">📤</div>
                <div>
                  <div className="section-title">Download System Backup</div>
                  <div className="section-desc">
                    Download configuration and settings logs to your local
                    device.
                  </div>
                </div>
              </div>
              <div className="section-body space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Backup Filename
                  </label>
                  <input
                    type="text"
                    value={backupFilename}
                    onChange={(e) => setBackupFilename(e.target.value)}
                    placeholder="DVEPL_Backup"
                    className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Include Sections
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {["orders", "users", "vendors", "tasks"].map((mod) => (
                      <label
                        key={mod}
                        className="flex items-center gap-1.5 cursor-pointer text-xs capitalize"
                      >
                        <input
                          type="checkbox"
                          checked={backupModules.includes(mod)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBackupModules([...backupModules, mod]);
                            } else {
                              setBackupModules(
                                backupModules.filter((m) => m !== mod),
                              );
                            }
                          }}
                          className="accent-primary"
                        />
                        {mod}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <button
                    onClick={downloadBackup}
                    className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition shadow-sm"
                  >
                    ⬇️ Download Backup
                  </button>
                </div>
              </div>
            </div>

            {/* Restore backup */}
            <div className="section-card mb-0">
              <div className="section-header">
                <div className="section-icon">📥</div>
                <div>
                  <div className="section-title">Restore from Backup</div>
                  <div className="section-desc">
                    Restore settings from a downloaded .json backup.
                  </div>
                </div>
              </div>
              <div className="section-body space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Select Backup File
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) =>
                      setRestoreFile(e.target.files?.[0] || null)
                    }
                    className="w-full p-2 border border-border bg-card rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Restore Mode
                  </label>
                  <select
                    value={restoreMode}
                    onChange={(e) => setRestoreMode(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                  >
                    <option value="merge">
                      Merge — Append and keep current (Safe)
                    </option>
                    <option value="overwrite">
                      Overwrite — Destructive overwrite (Replaces all data)
                    </option>
                  </select>
                </div>
                <div className="border-t border-border pt-4">
                  <button
                    onClick={restoreBackup}
                    disabled={!restoreFile}
                    className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📥 Restore Now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Backup History */}
          <div className="section-card">
            <div className="section-header">
              <div className="section-icon">🕓</div>
              <div>
                <div className="section-title">Local Backup History</div>
                <div className="section-desc">
                  Backup log created inside this session.
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/15 border-b border-border">
                  <tr>
                    <th className="p-3 font-bold text-muted-foreground">
                      Filename
                    </th>
                    <th className="p-3 font-bold text-muted-foreground">
                      Included Modules
                    </th>
                    <th className="p-3 font-bold text-muted-foreground">
                      Size
                    </th>
                    <th className="p-3 font-bold text-muted-foreground">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {backupHistory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-4 text-center text-muted-foreground"
                      >
                        No recent backups.
                      </td>
                    </tr>
                  ) : (
                    backupHistory.map((b) => (
                      <tr key={b.id} className="hover:bg-muted/5">
                        <td className="p-3 font-semibold text-foreground">
                          {b.filename}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {b.modules}
                        </td>
                        <td className="p-3 text-muted-foreground">{b.size}</td>
                        <td className="p-3 text-muted-foreground">{b.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && editingUser && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">✏️ Edit User Details</div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Designation
                </label>
                <select
                  value={editingUser.designation || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      designation: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none focus:border-primary"
                >
                  <option value="">— Select Designation —</option>
                  {designationsList.map((d: any) => (
                    <option key={d.id} value={d.title}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  User Role
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => {
                    console.log("Selected Role:", e.target.value);
                    setEditingUser({ ...editingUser, role: e.target.value });
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-border bg-card rounded-lg outline-none"
                >
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-border rounded-lg bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUserEdit}
                className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition shadow-sm"
              >
                Save Changes →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMISSIONS MODAL */}
      {isPermModalOpen && permUser && (
        <div className="modal-overlay">
          <div className="modal-box perm-modal">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                  🔐
                </div>
                <div>
                  <div className="modal-title text-base font-bold">
                    Manage Permissions
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Configuring access matrix for:{" "}
                    <span className="font-semibold text-primary">
                      {permUser.name}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsPermModalOpen(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body space-y-6">
              {/* Presets */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Quick Preset Profile
                </div>
                <div className="perm-presets">
                  <button
                    onClick={() => applyPreset("full")}
                    className="perm-preset-btn"
                  >
                    ⚡ Full Access
                  </button>
                  <button
                    onClick={() => applyPreset("viewer")}
                    className="perm-preset-btn"
                  >
                    👁 View Only
                  </button>
                  <button
                    onClick={() => applyPreset("none")}
                    className="perm-preset-btn preset-danger"
                  >
                    🚫 No Access
                  </button>
                </div>
              </div>

              {/* Page Access */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Page / Module Navigation Access
                </div>
                <div className="perm-page-access-grid">
                  {modulesList.map((m) => (
                    <label key={m.key} className="perm-page-toggle">
                      <input
                        type="checkbox"
                        checked={pageAccessState[m.key] ?? false}
                        onChange={(e) =>
                          setPageAccessState({
                            ...pageAccessState,
                            [m.key]: e.target.checked,
                          })
                        }
                      />
                      <div className="perm-page-card">{m.label}</div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Permissions */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Entity Action Rules
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      key: "create",
                      label: "➕ Create Records",
                      desc: "Can insert new entries",
                    },
                    {
                      key: "edit",
                      label: "✏️ Edit Records",
                      desc: "Can update existing fields",
                    },
                    {
                      key: "delete",
                      label: "🗑 Delete Records",
                      desc: "Can delete data rows",
                    },
                    {
                      key: "export",
                      label: "📤 Export Data",
                      desc: "Can download csv/reports",
                    },
                  ].map((act) => (
                    <div key={act.key} className="perm-action-card">
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {act.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {act.desc}
                        </div>
                      </div>
                      <label className="toggle-wrap">
                        <input
                          type="checkbox"
                          checked={(actionPermsState as any)[act.key]}
                          onChange={(e) =>
                            setActionPermsState({
                              ...actionPermsState,
                              [act.key]: e.target.checked,
                            })
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Field Permissions */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Field-Level Visibility Restrictions
                </div>
                <div className="perm-fields-table">
                  <div className="perm-fields-header">
                    <div>Fieldname</div>
                    <div className="text-center">👁 View</div>
                    <div className="text-center">✏️ Edit</div>
                  </div>
                  <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
                    {fieldsAccessList.map((f) => (
                      <div key={f.key} className="perm-fields-row">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-xs">
                            {f.label}
                          </span>
                          <span className={`field-tag tag-${f.tag}`}>
                            {f.tag}
                          </span>
                        </div>
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={fieldPermsState[f.key]?.view ?? true}
                            onChange={(e) =>
                              setFieldPermsState({
                                ...fieldPermsState,
                                [f.key]: {
                                  ...(fieldPermsState[f.key] ?? {
                                    view: true,
                                    edit: true,
                                  }),
                                  view: e.target.checked,
                                },
                              })
                            }
                            className="perm-checkbox"
                          />
                        </div>
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={fieldPermsState[f.key]?.edit ?? true}
                            onChange={(e) =>
                              setFieldPermsState({
                                ...fieldPermsState,
                                [f.key]: {
                                  ...(fieldPermsState[f.key] ?? {
                                    view: true,
                                    edit: true,
                                  }),
                                  edit: e.target.checked,
                                },
                              })
                            }
                            className="perm-checkbox"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setIsPermModalOpen(false)}
                className="px-4 py-2.5 border border-border rounded-lg bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={savePermissions}
                className="px-5 py-2.5 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 transition shadow-sm cursor-pointer"
              >
                Save Permissions →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
