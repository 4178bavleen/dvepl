import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  UserPlus,
  FileText,
  ExternalLink,
  RefreshCw,
  Maximize2,
  Minimize2,
  Circle,
  Clock3,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { useERPStore } from "@/store/erpStore";
import { isAdminUser } from "@/utils/pagePermissions";
import { useWorkflowTemplate } from "@/hooks/useWorkflowTemplate";
import workflowApi from "@/services/workflowApi";

import {
  SalesOrderAssignModal,
} from "./components/SalesOrderAssignModal";
import { AddOrderModal } from "./components/AddOrderModal";
import { ProjectDocumentUploadPanel } from "./components/ProjectDocumentUploadPanel";

import {
  QuoteTenderOrder,
  DetailItem,
  DetailSectionTitle,
  workflowStageLabel,
  workflowStagePercent,
  fetchQuoteTenderOrders,
} from "./orderShared";

// ============================================================
// TABS
// ============================================================

type TabId = "overview" | "workflow" | "documents" | "audit";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useERPStore();

  const { stages: workflowStages } = useWorkflowTemplate();

  const currentUser = useMemo(() => {
    return store.users.find((user) => user.id === store.currentUserId) as any;
  }, [store.users, store.currentUserId]);

  const currentUserId = store.currentUserId || currentUser?.id || null;
  const isAdmin = isAdminUser(currentUser);

  const isOrderAssignedToCurrentUser = useCallback(
    (order: QuoteTenderOrder | null | undefined) => {
      if (!order || !currentUserId) return false;
      const orderStage = order.workflowStage;
      return (order.assignments || []).some(
        (assignment) =>
          assignment.userId === currentUserId &&
          (!orderStage ||
            assignment.stage === null ||
            assignment.stage === undefined ||
            assignment.stage === orderStage),
      );
    },
    [currentUserId],
  );

  const [tender, setTender] = useState<QuoteTenderOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const canWorkOnOrder = isAdmin || isOrderAssignedToCurrentUser(tender);

  const [assigningTender, setAssigningTender] =
    useState<QuoteTenderOrder | null>(null);
  const [assigningStageKey, setAssigningStageKey] = useState<string | null>(
    null,
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const loadTender = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const result = await fetchQuoteTenderOrders();
      if (!result.success) {
        toast.error(result.message ?? "Unable to load order.");
        setIsLoading(false);
        return;
      }
      const found = result.rows.find((r) => r.id === id);
      if (!found) {
        setNotFound(true);
      } else {
        setTender(found);
        setNotFound(false);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Unable to load order.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTender();
  }, [loadTender]);

  const handleStageToggle = async (stageKey: string, checked: boolean) => {
    if (!tender || !canWorkOnOrder) return;
    const currentIndex = workflowStages.findIndex(
      (s) => s.key === tender.workflowStage,
    );
    const targetIndex = workflowStages.findIndex((s) => s.key === stageKey);
    if (targetIndex === -1) return;

    // Checking a stage advances the order past it; unchecking reverts the
    // workflow back to that stage (making it the current/in-progress stage).
    const targetStage = checked
      ? workflowStages[Math.min(targetIndex + 1, workflowStages.length - 1)]
          ?.key ?? stageKey
      : stageKey;

    if (targetStage === tender.workflowStage && currentIndex === targetIndex) {
      return;
    }

    setIsUpdatingStage(true);
    try {
      await workflowApi.updateOrderWorkflowStage(tender.id, targetStage, {
        description: checked
          ? `Marked "${workflowStages[targetIndex]?.name}" as completed`
          : `Reopened "${workflowStages[targetIndex]?.name}"`,
      });
      toast.success(
        checked ? "Stage marked as completed." : "Stage reopened.",
      );
      await loadTender();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ?? "Failed to update workflow stage.",
      );
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const openAssignForStage = (stageKey: string) => {
    if (!isAdmin) return;
    setAssigningStageKey(stageKey);
    setAssigningTender(tender);
  };

  const openAssignAll = () => {
    if (!isAdmin) return;
    setAssigningStageKey(null);
    setAssigningTender(tender);
  };

  const drawingsCount = tender?.drawings?.length ?? 0;
  const attachmentCount = tender?.attachments?.length ?? 0;

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "workflow", label: "Workflow" },
    { id: "documents", label: "Documents", count: drawingsCount + attachmentCount },
    { id: "audit", label: "Communication & Audit" },
  ];

  // ============================================================
  // LOADING / NOT FOUND STATES
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <RefreshCw className="size-4 animate-spin" />
          Loading order…
        </div>
      </div>
    );
  }

  if (notFound || !tender) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-sm font-semibold text-muted-foreground">
          This order could not be found.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-xl"
          onClick={() => navigate("/tender/orders")}
        >
          <ArrowLeft className="size-3.5" />
          Back to Orders
        </Button>
      </div>
    );
  }

  const remarkStyles: Record<string, string> = {
    accepted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    rejected: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  };
  const remarkKey = String(tender.remark || "").toLowerCase();

  return (
    <div className="flex flex-col h-full">
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}

      <div className="border-b bg-muted/30 px-4 sm:px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <button
              onClick={() => navigate("/tender/orders")}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="size-3.5" />
              Back to Orders
            </button>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {tender.tender_no || "—"}
              </h1>

              <span
                className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                  remarkStyles[remarkKey] ||
                  "bg-muted text-muted-foreground border-muted-foreground/10"
                }`}
              >
                {tender.remark || "—"}
              </span>

              {tender.dveplCode && (
                <span className="text-[10px] font-bold px-3 py-1 rounded-full border bg-background text-muted-foreground">
                  {tender.dveplCode}
                </span>
              )}
            </div>

            {tender.name_of_work && (
              <p className="mt-1.5 text-xs font-medium text-muted-foreground max-w-2xl line-clamp-2">
                {tender.name_of_work}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
              className="h-8 text-xs font-bold rounded-xl gap-1.5"
            >
              {isFullscreen ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
              {isFullscreen ? "Exit Full Screen" : "Full Screen"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold rounded-xl"
              onClick={() => setIsEditOpen(true)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!isAdmin}
              onClick={() => {
                if (!isAdmin) return;
                setAssigningTender(tender);
              }}
              title={
                isAdmin
                  ? "Manage Assignments"
                  : "Only administrators can manage assignments"
              }
              className="h-8 text-xs font-bold rounded-xl gap-1.5"
            >
              <UserPlus className="size-3.5" />
              Assignments
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================
          TAB BAR
          ======================================================== */}

      <div className="flex items-center gap-1 border-b px-4 sm:px-6 bg-background overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span
                className={`ml-1.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[9px] ${
                  activeTab === t.id
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================
          TAB CONTENT
          ======================================================== */}

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin">
        <div className="max-w-5xl mx-auto space-y-7">
          {activeTab === "overview" && (
            <>
              <section>
                <DetailSectionTitle
                  title="Basic Information"
                  color="bg-primary"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem label="Tender Number" value={tender.tender_no} />
                  <DetailItem label="Tender ID" value={tender.tenderID} />
                  <DetailItem
                    label="Reference Code"
                    value={tender.reference_code}
                  />
                  <DetailItem label="Remark" value={tender.remark} />
                  <DetailItem
                    label="Name of Work"
                    value={tender.name_of_work}
                    multiline
                    className="md:col-span-2"
                  />
                </div>
              </section>

              <section className="border-t pt-7">
                <DetailSectionTitle
                  title="Contact Information"
                  color="bg-blue-500"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailItem label="Contact Person" value={tender.name} />
                  <DetailItem label="Firm Name" value={tender.firm_name} />
                  <DetailItem label="Mobile" value={tender.mobile} />
                  <DetailItem label="Email" value={tender.email_id} />
                </div>
              </section>

              <section className="border-t pt-7">
                <DetailSectionTitle title="Jurisdiction" color="bg-emerald-500" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <DetailItem
                    label="Department"
                    value={tender.department_name}
                  />
                  <DetailItem label="Section" value={tender.section_name} />
                  <DetailItem label="Division" value={tender.division_name} />
                  <DetailItem label="Sub Division" value={tender.subdivision} />
                  <DetailItem label="State" value={tender.state_name} />
                  <DetailItem label="City" value={tender.city_name} />
                </div>
              </section>

              {tender.poStatus && (
                <section className="border-t pt-7">
                  <DetailSectionTitle
                    title="Purchase Order Status"
                    color="bg-indigo-500"
                  />
                  <div className="rounded-2xl border border-border/80 bg-muted/10 p-4 flex items-center justify-between gap-4 flex-wrap shadow-3xs">
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {tender.poStatus}
                      </p>
                      {tender.poNumber && (
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                          {tender.poNumber}
                        </p>
                      )}
                    </div>
                    {tender.reference_code && (
                      <button
                        onClick={() =>
                          navigate(
                            `/purchase/vendors?ref=${encodeURIComponent(
                              tender.reference_code,
                            )}&mode=${
                              tender.poStatus === "No PO" ? "generate" : "view"
                            }`,
                          )
                        }
                        className="text-xs text-primary hover:text-primary-hover font-bold flex items-center gap-1"
                      >
                        {tender.poStatus === "No PO"
                          ? "＋ Generate PO"
                          : "View PO"}
                        <ExternalLink className="size-3" />
                      </button>
                    )}
                  </div>
                </section>
              )}
            </>
          )}

          {activeTab === "workflow" && (
            <>
              <section>
                <DetailSectionTitle
                  title="Workflow Progress"
                  color="bg-emerald-500"
                />

                {workflowStages.length > 0 ? (
                  (() => {
                    const currentIndex = workflowStages.findIndex(
                      (s) => s.key === tender.workflowStage,
                    );
                    const percent = workflowStagePercent(
                      tender.workflowStage,
                      workflowStages,
                    );
                    const isDone = currentIndex === workflowStages.length - 1;

                    return (
                      <div className="rounded-2xl border border-border/80 bg-muted/10 p-5 shadow-3xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {tender.workflowStage
                                ? workflowStageLabel(
                                    tender.workflowStage,
                                    workflowStages,
                                  )
                                : "Pipeline"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                                isDone
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              }`}
                            >
                              {isDone ? "100% Done" : `${percent}% Complete`}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!isAdmin}
                              onClick={openAssignAll}
                              title={
                                isAdmin
                                  ? "Assign users to all stages"
                                  : "Only administrators can manage assignments"
                              }
                              className="gap-1.5 h-8 text-xs font-bold border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/5 hover:border-blue-500/40 rounded-xl transition-all duration-200"
                            >
                              <UserPlus className="size-3.5" />
                              Assign All Stages
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {workflowStages.map((s, i) => {
                            const stageCompleted = i < currentIndex;
                            const stageCurrent = i === currentIndex;
                            const stageUsers = (tender.assignments || []).filter(
                              (a) =>
                                !a.stage ||
                                a.stage === s.key ||
                                a.stage === "",
                            );

                            return (
                              <div
                                key={s.key}
                                onClick={() => openAssignForStage(s.key)}
                                className={`flex items-center gap-3 rounded-xl border bg-background px-3 py-2.5 transition-all duration-200 shadow-3xs ${
                                  stageCurrent
                                    ? "border-blue-500/40 ring-2 ring-blue-500/10"
                                    : stageCompleted
                                      ? "border-emerald-500/20"
                                      : "border-border/70"
                                } ${
                                  isAdmin
                                    ? "cursor-pointer hover:border-blue-500/40 hover:shadow-sm"
                                    : ""
                                }`}
                                title={
                                  isAdmin
                                    ? `Assign users to "${s.name}"`
                                    : "Only administrators can assign users"
                                }
                              >
                                <Checkbox
                                  checked={stageCompleted}
                                  disabled={!canWorkOnOrder || isUpdatingStage}
                                  onCheckedChange={(checked) => {
                                    handleStageToggle(s.key, !!checked);
                                  }}
                                  className="shrink-0"
                                  title={
                                    canWorkOnOrder
                                      ? `Mark "${s.name}" as ${
                                          stageCompleted ? "in progress" : "completed"
                                        }`
                                      : "You don't have access to change this stage"
                                  }
                                />
                                <span
                                  className="size-2.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: s.color || "#3b82f6",
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-foreground truncate">
                                    {s.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {stageUsers.length > 0
                                      ? `${stageUsers.length} user${
                                          stageUsers.length > 1 ? "s" : ""
                                        } assigned`
                                      : "No users assigned"}
                                  </p>
                                </div>
                                <span
                                  className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                                    stageCompleted
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                      : stageCurrent
                                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                        : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                                  }`}
                                >
                                  {stageCompleted ? (
                                    <CheckCircle2 className="size-3" />
                                  ) : stageCurrent ? (
                                    <Clock3 className="size-3" />
                                  ) : (
                                    <Circle className="size-3" />
                                  )}
                                  {stageCompleted
                                    ? "Completed"
                                    : stageCurrent
                                      ? "In Progress"
                                      : "Pending"}
                                </span>
                                {isAdmin && (
                                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="rounded-xl border border-border/70 bg-background px-4 py-3 shadow-3xs">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                              Next Action
                            </p>
                            <p className="mt-1 text-xs font-semibold text-foreground">
                              {tender.nextAction || "No action assigned"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/70 bg-background px-4 py-3 shadow-3xs">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                              Due Date
                            </p>
                            <p className="mt-1 text-xs font-semibold text-foreground">
                              {tender.dueDate
                                ? new Date(tender.dueDate).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-center shadow-3xs">
                    <p className="text-xs font-medium text-muted-foreground">
                      No workflow template has been configured for this order
                      yet.
                    </p>
                  </div>
                )}
              </section>

              <section className="border-t pt-7">
                <div className="flex items-center justify-between mb-4">
                  <DetailSectionTitle title="Assigned Users" color="bg-violet-500" />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!isAdmin}
                    onClick={() => {
                      if (!isAdmin) return;
                      setAssigningTender(tender);
                    }}
                    title={
                      isAdmin
                        ? "Manage Assignments"
                        : "Only administrators can manage assignments"
                    }
                    className="gap-1.5 h-8 text-xs font-bold border-violet-500/20 text-violet-600 dark:text-violet-400 hover:bg-violet-500/5 hover:border-violet-500/40 rounded-xl transition-all duration-200"
                  >
                    <UserPlus className="size-3.5" />
                    Manage Assignments
                  </Button>
                </div>

                <div className="rounded-2xl border border-border/80 bg-muted/10 p-4 shadow-3xs">
                  {tender.assignments && tender.assignments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tender.assignments.map((assignment, idx) => (
                        <div
                          key={assignment.id || assignment.userId || idx}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-background shadow-3xs"
                        >
                          <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] uppercase border">
                            {(assignment.user?.name || "U").charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-foreground">
                              {assignment.user?.name ||
                                "User ID: " + assignment.userId}
                            </p>
                            {assignment.user?.email && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {assignment.user.email}
                              </p>
                            )}
                          </div>
                          <span
                            className={`ml-1 inline-flex items-center text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${
                              assignment.stage
                                ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                                : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                            }`}
                          >
                            {assignment.stage
                              ? workflowStageLabel(assignment.stage, workflowStages)
                              : "All Stages"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-muted-foreground p-1">
                      <span className="italic font-medium">
                        No users are currently assigned to this order.
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!isAdmin}
                        onClick={() => {
                          if (!isAdmin) return;
                          setAssigningTender(tender);
                        }}
                        title={
                          isAdmin
                            ? "Assign Users"
                            : "Only administrators can manage assignments"
                        }
                        className="h-8 text-xs font-bold rounded-lg px-3"
                      >
                        ＋ Assign Now
                      </Button>
                    </div>
                  )}
                </div>
              </section>

              <section className="border-t pt-7">
                <DetailSectionTitle
                  title="Work Access Status"
                  color={
                    isOrderAssignedToCurrentUser(tender)
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }
                />
                <div
                  className={`rounded-2xl border p-4 flex items-start gap-3 shadow-3xs ${
                    isOrderAssignedToCurrentUser(tender)
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-950 dark:text-emerald-300"
                      : "border-amber-500/20 bg-amber-500/5 text-amber-950 dark:text-amber-300"
                  }`}
                >
                  {isOrderAssignedToCurrentUser(tender) ? (
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-bold leading-none">
                      {isOrderAssignedToCurrentUser(tender)
                        ? "Assigned to You"
                        : "View-only Mode"}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground/80 leading-normal font-medium">
                      {isOrderAssignedToCurrentUser(tender)
                        ? "You have full write access to manage this tender order, upload engineering drawings, and transition workflow states."
                        : "You are not assigned to this tender. You have read-only access. Please request assignment from an administrator if modifications are needed."}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === "documents" && (
            <>
              <section>
                <DetailSectionTitle title="Project Documents" color="bg-cyan-500" />
                <ProjectDocumentUploadPanel
                  attachments={tender.attachments || []}
                  immediate
                  orderId={tender.id}
                  disabled={!isOrderAssignedToCurrentUser(tender) && !isAdmin}
                  onUploaded={() => void loadTender()}
                  onDeleted={() => void loadTender()}
                />
                {!isOrderAssignedToCurrentUser(tender) && !isAdmin && (
                  <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                    View-only: you can open attached documents but cannot add
                    or remove them.
                  </p>
                )}
              </section>

              <section className="border-t pt-7">
                <DetailSectionTitle title="Engineering Drawings" color="bg-primary" />

                {tender.drawings && tender.drawings.length > 0 ? (
                  <div className="rounded-2xl border border-border/80 overflow-hidden shadow-3xs">
                    <div className="divide-y divide-border/60">
                      {tender.drawings.map((drawing) => (
                        <div
                          key={drawing.id}
                          className="flex items-center justify-between gap-4 px-4 py-3 bg-muted/10 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/15 shrink-0">
                              <FileText className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {drawing.title || drawing.drawingNo || "Untitled Drawing"}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-medium truncate">
                                {drawing.drawingNo ? `${drawing.drawingNo} · ` : ""}
                                {drawing.fileName || "—"}
                              </p>
                            </div>
                          </div>

                          {drawing.fileUrl && (
                            <a
                              href={drawing.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
                            >
                              View
                              <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-center shadow-3xs">
                    <p className="text-xs font-medium text-muted-foreground">
                      No engineering drawings have been attached to this order yet.
                    </p>
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === "audit" && (
            <>
              <section>
                <DetailSectionTitle title="Status History" color="bg-amber-500" />
                <div className="rounded-2xl border border-border/80 bg-muted/10 p-4 shadow-3xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                        remarkStyles[remarkKey] ||
                        "bg-muted text-muted-foreground border-muted-foreground/10"
                      }`}
                    >
                      {tender.remark || "—"}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {tender.remarked_at
                        ? new Date(tender.remarked_at).toLocaleString("en-IN")
                        : "—"}
                    </span>
                  </div>
                </div>
              </section>

              <section className="border-t pt-7">
                <div className="rounded-2xl border border-border/80 bg-muted/10 p-5 shadow-3xs">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/15">
                      <FileText className="size-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Record Information
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                        Metadata associated with this synchronized tender record.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-background border border-border/80 p-3 shadow-3xs hover:border-primary/25 transition-all duration-200">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground/80 tracking-wider">
                        Record ID
                      </p>
                      <p className="mt-1 text-xs font-bold text-foreground break-all">
                        {tender.id || "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-background border border-border/80 p-3 shadow-3xs hover:border-primary/25 transition-all duration-200">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground/80 tracking-wider">
                        Tender ID
                      </p>
                      <p className="mt-1 text-xs font-bold text-foreground break-all">
                        {tender.tenderID || "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-background border border-border/80 p-3 shadow-3xs hover:border-primary/25 transition-all duration-200">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground/80 tracking-wider">
                        Status
                      </p>
                      <p className="mt-1 text-xs font-bold text-foreground capitalize">
                        {tender.remark || "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-background border border-border/80 p-3 shadow-3xs hover:border-primary/25 transition-all duration-200">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground/80 tracking-wider">
                        File
                      </p>
                      <p className="mt-1 text-xs font-bold text-foreground truncate">
                        {tender.file_name && tender.file_name !== "null"
                          ? tender.file_name
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {/* ========================================================
          ASSIGN USERS MODAL
          ======================================================== */}
      <SalesOrderAssignModal
        open={Boolean(assigningTender)}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningTender(null);
            setAssigningStageKey(null);
          }
        }}
        order={assigningTender}
        initialStageKey={assigningStageKey}
        onSuccess={() => void loadTender()}
      />

      {/* ========================================================
          EDIT ORDER MODAL
          ======================================================== */}
      <AddOrderModal
        open={isEditOpen}
        onOpenChange={(open) => setIsEditOpen(open)}
        editingOrder={tender}
        companyId={(currentUser as any)?.companyId || null}
        orderTakenById={currentUserId}
        onSuccess={() => void loadTender()}
      />
    </div>
  );
}

export default OrderDetailPage;