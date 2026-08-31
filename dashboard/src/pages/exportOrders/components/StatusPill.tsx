import { STATUS_CONFIG, type DrawingStatus } from "./constants";

export default function StatusPill({ status }: { status: string }) {
  const cfg =
    STATUS_CONFIG[status as DrawingStatus] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.pill}`}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      {cfg.label}
    </span>
  );
}
