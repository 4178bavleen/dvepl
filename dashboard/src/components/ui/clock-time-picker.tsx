// src/components/ui/clock-time-picker.tsx
import React, { useCallback, useRef, useState } from "react";
import { Clock } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const TRACK_R = 90;   // outer ring radius
const NUM_R   = 73;   // where numbers sit
const HAND_R  = 70;   // hand tip
const TIP_R   = 16;   // highlight circle radius on tip

type Mode = "hour" | "minute";

// ─── Geometry helpers ─────────────────────────────────────────────────────────
function toXY(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function fromXY(x: number, y: number) {
  const a = (Math.atan2(y, x) * 180) / Math.PI + 90;
  return (a + 360) % 360;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ClockTimePickerProps {
  /** HH:mm in 24-hour format, or "" */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ClockTimePicker({
  value,
  onChange,
  placeholder = "Set time",
}: ClockTimePickerProps) {
  const [open, setOpen]   = useState(false);
  const [mode, setMode]   = useState<Mode>("hour");
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Parse value ──────────────────────────────────────────────────────────
  const parts = value?.split(":") ?? [];
  const h24  = parts[0] !== undefined ? parseInt(parts[0], 10) : 12;
  const min  = parts[1] !== undefined ? parseInt(parts[1], 10) : 0;
  const isPM = !isNaN(h24) && h24 >= 12;
  const h12  = isNaN(h24) ? 12 : h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  const safeMin = isNaN(min) ? 0 : min;

  const displayTime = value
    ? `${h12}:${pad(safeMin)} ${isPM ? "PM" : "AM"}`
    : placeholder;

  const emit = (newH24: number, newMin: number) =>
    onChange(`${pad(newH24)}:${pad(newMin)}`);

  // ── Angle → value ─────────────────────────────────────────────────────────
  const applyAngle = useCallback(
    (angle: number, currentMode: Mode) => {
      if (currentMode === "hour") {
        let h = Math.round(angle / 30) % 12;
        if (h === 0) h = 12;
        const newH24 = isPM
          ? h === 12 ? 12 : h + 12
          : h === 12 ? 0  : h;
        emit(newH24, safeMin);
      } else {
        const m = Math.round(angle / 6) % 60;
        emit(h24, m);
      }
    },
    [isPM, h24, safeMin], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const angleFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      return fromXY(clientX - rect.left - CX, clientY - rect.top - CY);
    },
    [],
  );

  // ── Pointer events (drag support) ─────────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
      applyAngle(angleFromEvent(e.clientX, e.clientY), mode);
    },
    [applyAngle, angleFromEvent, mode],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragging) return;
      applyAngle(angleFromEvent(e.clientX, e.clientY), mode);
    },
    [dragging, applyAngle, angleFromEvent, mode],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDragging(false);
      if (mode === "hour") {
        setTimeout(() => setMode("minute"), 120);
      }
      // Minute mode: stay open, user clicks OK to confirm
    },
    [mode],
  );

  // ── AM/PM ─────────────────────────────────────────────────────────────────
  const setAMPM = (pm: boolean) => {
    if (pm === isPM) return;
    const newH24 = pm
      ? h12 === 12 ? 12 : h12 + 12
      : h12 === 12 ? 0  : h12;
    emit(newH24, safeMin);
  };

  // ── Clock geometry ────────────────────────────────────────────────────────
  const handAngle = mode === "hour" ? (h12 % 12) * 30 : safeMin * 6;
  const handTip   = toXY(handAngle, HAND_R);

  const hourNums = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minLabels = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setMode("hour");
        }}
        className={`h-9 w-full flex items-center justify-center gap-2 rounded-md border text-xs font-medium transition-all duration-150 ${
          open
            ? "border-primary bg-primary/10 text-primary"
            : value
            ? "border-input bg-background text-foreground hover:bg-muted/50"
            : "border-dashed border-input bg-background text-muted-foreground hover:bg-muted/50"
        }`}
      >
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>{displayTime}</span>
      </button>

      {/* Inline clock panel */}
      {open && (
        <div className="rounded-xl border border-border bg-card shadow-md overflow-hidden">
          {/* ── Time display + AM/PM ─────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-1 bg-primary/5 border-b border-border px-4 py-3">
            <button
              type="button"
              onClick={() => setMode("hour")}
              className={`text-3xl font-bold rounded-lg w-14 text-center py-1 transition-colors ${
                mode === "hour"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {pad(h12)}
            </button>

            <span className="text-3xl font-bold text-muted-foreground select-none">:</span>

            <button
              type="button"
              onClick={() => setMode("minute")}
              className={`text-3xl font-bold rounded-lg w-14 text-center py-1 transition-colors ${
                mode === "minute"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {pad(safeMin)}
            </button>

            <div className="ml-3 flex flex-col gap-1">
              {(["AM", "PM"] as const).map((ap) => (
                <button
                  key={ap}
                  type="button"
                  onClick={() => setAMPM(ap === "PM")}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors ${
                    (ap === "PM") === isPM
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground border border-border hover:bg-muted"
                  }`}
                >
                  {ap}
                </button>
              ))}
            </div>
          </div>

          {/* ── Mode hint ────────────────────────────────────────────────── */}
          <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground pt-3 pb-1">
            {mode === "hour" ? "Select hour" : "Select minute"}
          </p>

          {/* ── Clock face ───────────────────────────────────────────────── */}
          <div className="flex justify-center px-4 pb-2">
            <svg
              ref={svgRef}
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="cursor-pointer touch-none select-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {/* Outer track */}
              <circle
                cx={CX} cy={CY} r={TRACK_R}
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                opacity={0.1}
              />

              {/* Inner fill */}
              <circle cx={CX} cy={CY} r={TRACK_R - 1} fill="hsl(var(--muted)/0.3)" />

              {/* Minute tick marks */}
              {mode === "minute" &&
                Array.from({ length: 60 }, (_, i) => {
                  const ang = i * 6;
                  const o = toXY(ang, TRACK_R - 2);
                  const inn = toXY(ang, TRACK_R - (i % 5 === 0 ? 9 : 5));
                  return (
                    <line
                      key={i}
                      x1={o.x} y1={o.y}
                      x2={inn.x} y2={inn.y}
                      stroke="currentColor"
                      strokeWidth={i % 5 === 0 ? 1.5 : 0.7}
                      opacity={0.35}
                    />
                  );
                })}

              {/* Hand line */}
              <line
                x1={CX} y1={CY}
                x2={handTip.x} y2={handTip.y}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeLinecap="round"
              />

              {/* Hand tip highlight */}
              <circle
                cx={handTip.x} cy={handTip.y} r={TIP_R}
                fill="hsl(var(--primary))"
              />

              {/* Center dot */}
              <circle cx={CX} cy={CY} r={4} fill="hsl(var(--primary))" />

              {/* Numbers */}
              {mode === "hour"
                ? hourNums.map((h, i) => {
                    const pos = toXY(i * 30, NUM_R);
                    const selected = h === h12;
                    return (
                      <text
                        key={h}
                        x={pos.x} y={pos.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={13}
                        fontWeight={selected ? 700 : 500}
                        fill={
                          selected
                            ? "hsl(var(--primary-foreground))"
                            : "currentColor"
                        }
                        opacity={selected ? 1 : 0.85}
                      >
                        {h}
                      </text>
                    );
                  })
                : minLabels.map((m, i) => {
                    const pos = toXY(i * 30, NUM_R);
                    const nearestFive = Math.round(safeMin / 5) * 5 % 60;
                    const selected = nearestFive === m;
                    return (
                      <text
                        key={m}
                        x={pos.x} y={pos.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight={selected ? 700 : 500}
                        fill={
                          selected
                            ? "hsl(var(--primary-foreground))"
                            : "currentColor"
                        }
                        opacity={selected ? 1 : 0.8}
                      >
                        {pad(m)}
                      </text>
                    );
                  })}
            </svg>
          </div>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
                setMode("hour");
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setMode("hour");
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setMode("hour");
                }}
                className="text-xs font-bold text-primary hover:opacity-80 transition-opacity"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
