"use client";

import { type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { formatMinute, STAGE_COLORS, STAR_COLOR, type TimetableSlot, type TimetableStage } from "@/lib/timetable-types";

const SNAP_MINUTES = 10;
const HEADER_HEIGHT = 36;
const LABEL_HEIGHT = 16;
const MAX_FIT_STAGES = 4;

export type SlotChange = { stageId: number; start: number; end: number };

type Drag =
  | { kind: "create"; stageId: number; from: number; to: number }
  | { kind: "move"; slot: TimetableSlot; offset: number; stageId: number; start: number }
  | { kind: "resize"; slot: TimetableSlot; end: number };

const snap = (minute: number) => Math.round(minute / SNAP_MINUTES) * SNAP_MINUTES;

export function TimetableGrid({
  stages,
  slots,
  range,
  perHour = 80,
  nowMinute = null,
  selectedId = null,
  starredIds,
  onSlotClick,
  onEmptyClick,
  onCreateRange,
  onSlotChange,
  renderHeader,
  addColumn,
  pending,
  stickyTop,
}: {
  stages: TimetableStage[];
  slots: TimetableSlot[];
  range: { start: number; end: number };
  perHour?: number;
  nowMinute?: number | null;
  selectedId?: number | null;
  starredIds?: ReadonlySet<number> | null;
  onSlotClick?: (slot: TimetableSlot) => void;
  onEmptyClick?: (stageId: number, minute: number) => void;
  onCreateRange?: (stageId: number, start: number, end: number) => void;
  onSlotChange?: (slot: TimetableSlot, change: SlotChange) => void;
  renderHeader?: (stage: TimetableStage, index: number, color: string) => ReactNode;
  addColumn?: { header: ReactNode; preview: string | null };
  pending?: { stageId: number; start: number; end: number; label: string } | null;
  stickyTop?: number;
}) {
  const toPx = (minute: number) => LABEL_HEIGHT + ((minute - range.start) / 60) * perHour;
  const height = toPx(range.end);
  const hours = [];
  for (let minute = range.start; minute <= range.end; minute += 60) hours.push(minute);
  const showNow = nowMinute !== null && nowMinute >= range.start && nowMinute <= range.end;
  const scrolls = stages.length > MAX_FIT_STAGES;
  const [poppedId, setPoppedId] = useState<number | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const columns = useRef(new Map<number, HTMLDivElement>());
  const suppressClick = useRef(false);

  const minuteAt = (clientY: number, stageId: number) => {
    const rect = columns.current.get(stageId)?.getBoundingClientRect();
    return rect ? range.start + ((clientY - rect.top - LABEL_HEIGHT) / perHour) * 60 : range.start;
  };
  const stageAt = (clientX: number, fallback: number) => {
    for (const [stageId, el] of columns.current) {
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) return stageId;
    }
    return fallback;
  };
  const clamp = (minute: number, min: number, max: number) => Math.min(Math.max(minute, min), max);

  const swallowNextClick = () => {
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 0);
  };

  const update = (next: Drag | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  useEffect(() => {
    if (!drag) return;
    const onMove = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      if (current.kind === "create") {
        update({ ...current, to: clamp(snap(minuteAt(event.clientY, current.stageId)), range.start, range.end) });
      } else if (current.kind === "move") {
        const length = current.slot.end - current.slot.start;
        const stageId = stageAt(event.clientX, current.stageId);
        const start = clamp(snap(minuteAt(event.clientY, stageId) - current.offset), range.start, range.end - length);
        update({ ...current, stageId, start });
      } else {
        update({ ...current, end: clamp(snap(minuteAt(event.clientY, current.slot.stageId)), current.slot.start + SNAP_MINUTES, range.end) });
      }
    };
    const onUp = () => {
      const current = dragRef.current;
      update(null);
      if (!current) return;
      if (current.kind === "create") {
        if (current.from === current.to) return;
        swallowNextClick();
        onCreateRange?.(current.stageId, Math.min(current.from, current.to), Math.max(current.from, current.to));
      } else if (current.kind === "move") {
        if (current.stageId === current.slot.stageId && current.start === current.slot.start) return;
        swallowNextClick();
        onSlotChange?.(current.slot, { stageId: current.stageId, start: current.start, end: current.start + current.slot.end - current.slot.start });
      } else {
        if (current.end === current.slot.end) return;
        swallowNextClick();
        onSlotChange?.(current.slot, { stageId: current.slot.stageId, start: current.slot.start, end: current.end });
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  });

  const startDrag = (event: ReactPointerEvent, next: Drag) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    event.preventDefault();
    suppressClick.current = false;
    update(next);
  };

  const shown = slots.map((slot) => {
    if (drag?.kind === "move" && drag.slot.id === slot.id) return { ...slot, stageId: drag.stageId, start: drag.start, end: drag.start + slot.end - slot.start };
    if (drag?.kind === "resize" && drag.slot.id === slot.id) return { ...slot, end: drag.end };
    return slot;
  });
  const draggingId = drag && drag.kind !== "create" ? drag.slot.id : null;
  const bubble =
    drag?.kind === "create" && drag.from !== drag.to
      ? { stageId: drag.stageId, at: Math.max(drag.from, drag.to), text: `${formatMinute(Math.min(drag.from, drag.to))} – ${formatMinute(Math.max(drag.from, drag.to))} · ${Math.abs(drag.to - drag.from)}분` }
      : drag?.kind === "move"
        ? {
            stageId: drag.stageId,
            at: drag.start + drag.slot.end - drag.slot.start,
            text: `${stages.find((stage) => stage.id === drag.stageId)?.name ?? ""} · ${formatMinute(drag.start)} – ${formatMinute(drag.start + drag.slot.end - drag.slot.start)}`,
          }
        : drag?.kind === "resize"
          ? { stageId: drag.slot.stageId, at: drag.end, text: `끝 ${formatMinute(drag.end)} · ${drag.end - drag.slot.start}분` }
          : null;

  const columnBody = (stageId: number, children: ReactNode) => (
    <div
      ref={(el) => {
        if (el) columns.current.set(stageId, el);
        else columns.current.delete(stageId);
      }}
      className={`relative ${onEmptyClick ? "cursor-copy" : ""}`}
      style={{
        height,
        backgroundImage: `repeating-linear-gradient(var(--color-line) 0 1px, transparent 1px ${perHour}px), repeating-linear-gradient(var(--color-pill) 0 1px, transparent 1px ${perHour / 4}px)`,
        backgroundPosition: `0 ${LABEL_HEIGHT}px`,
      }}
      onPointerDown={(event) => {
        if (!onCreateRange || event.target !== event.currentTarget) return;
        const minute = clamp(snap(minuteAt(event.clientY, stageId)), range.start, range.end);
        startDrag(event, { kind: "create", stageId, from: minute, to: minute });
      }}
      onClick={(event) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        if (!onEmptyClick || event.target !== event.currentTarget) return;
        const minute = clamp(snap(minuteAt(event.clientY, stageId)), range.start, range.end);
        onEmptyClick(stageId, minute);
      }}
    >
      {children}
    </div>
  );

  return (
    <div className={`pb-2 ${scrolls ? "overflow-x-auto [scrollbar-width:none]" : ""} ${drag ? "select-none" : ""}`}>
      <div className="relative flex min-w-full gap-0.75 pr-2 pl-1">
        <div className={`w-5.5 shrink-0 ${scrolls ? "sticky left-0 z-10 bg-paper" : ""}`}>
          <div style={{ height: HEADER_HEIGHT }} />
          <div className="relative" style={{ height }}>
            {hours.map((minute) => (
              <span key={minute} className="absolute left-0 -translate-y-1/2 font-num text-[11px] leading-none font-black" style={{ top: toPx(minute) }}>
                {Math.floor(minute / 60) % 24}
              </span>
            ))}
          </div>
        </div>
        {stages.map((stage, index) => {
          const colors = STAGE_COLORS[index % STAGE_COLORS.length];
          const original = drag?.kind === "move" && drag.slot.stageId === stage.id && (drag.stageId !== stage.id || drag.start !== drag.slot.start) ? drag.slot : null;
          return (
            <div key={stage.id} className="flex min-w-20 flex-1 flex-col">
              <div className={`z-30 bg-paper pb-1.5 ${stickyTop !== undefined && !scrolls ? "sticky" : ""}`} style={{ top: stickyTop }}>
                {renderHeader ? (
                  renderHeader(stage, index, colors.dark)
                ) : (
                  <span className="flex h-7.5 items-center justify-center truncate rounded-md px-1 font-num text-[11px] font-black text-white" style={{ background: colors.dark }}>
                    {stage.name}
                  </span>
                )}
              </div>
              {columnBody(
                stage.id,
                <>
                  {original && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 rounded-[2px] bg-[repeating-linear-gradient(135deg,var(--color-pill)_0_6px,transparent_6px_12px)] shadow-[inset_0_0_0_1.5px_#b9b9c0]"
                      style={{ top: toPx(original.start), height: toPx(original.end) - toPx(original.start) }}
                    />
                  )}
                  {pending && pending.stageId === stage.id && drag?.kind !== "create" && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 overflow-hidden rounded-[2px] px-1.25 py-1 text-xs leading-tight font-bold break-keep"
                      style={{
                        top: toPx(pending.start),
                        height: toPx(pending.end) - toPx(pending.start),
                        color: colors.dark,
                        background: `color-mix(in srgb, ${colors.dark} 18%, transparent)`,
                        boxShadow: `inset 0 0 0 2px ${colors.dark}`,
                      }}
                    >
                      {pending.label}
                    </div>
                  )}
                  {drag?.kind === "create" && drag.stageId === stage.id && drag.from !== drag.to && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 rounded-[2px]"
                      style={{
                        top: toPx(Math.min(drag.from, drag.to)),
                        height: toPx(Math.max(drag.from, drag.to)) - toPx(Math.min(drag.from, drag.to)),
                        background: `color-mix(in srgb, ${colors.dark} 18%, transparent)`,
                        boxShadow: `inset 0 0 0 2px ${colors.dark}`,
                      }}
                    />
                  )}
                  {shown
                    .filter((slot) => slot.stageId === stage.id)
                    .sort((a, b) => a.start - b.start)
                    .map((slot, order) => {
                      const live = nowMinute !== null && slot.start <= nowMinute && nowMinute < slot.end;
                      const past = nowMinute !== null && slot.end <= nowMinute;
                      const selected = slot.id === selectedId || slot.id === draggingId;
                      const starred = starredIds?.has(slot.id) ?? false;
                      const lifted = drag?.kind === "move" && slot.id === draggingId;
                      const Tag = onSlotClick ? "button" : "div";
                      const original = slots.find((it) => it.id === slot.id)!;
                      return (
                        <Tag
                          key={slot.id}
                          {...(onSlotClick
                            ? {
                                type: "button" as const,
                                "aria-pressed": starredIds ? starred : undefined,
                                onPointerDown: onSlotChange
                                  ? (event: ReactPointerEvent) =>
                                      startDrag(event, { kind: "move", slot: original, offset: minuteAt(event.clientY, original.stageId) - original.start, stageId: original.stageId, start: original.start })
                                  : undefined,
                                onClick: () => {
                                  if (suppressClick.current) {
                                    suppressClick.current = false;
                                    return;
                                  }
                                  setPoppedId(slot.id);
                                  onSlotClick(slot);
                                },
                              }
                            : {})}
                          className={`absolute inset-x-0 flex flex-col text-left ${past && !selected ? "opacity-40" : ""} ${onSlotClick ? "press cursor-pointer" : ""} ${
                            onSlotChange ? "pointer-fine:cursor-grab" : ""
                          } ${lifted ? "z-10 -rotate-1 drop-shadow-[0_10px_18px_rgb(17_17_17/0.28)]" : ""}`}
                          style={{ top: toPx(slot.start) - LABEL_HEIGHT, height: LABEL_HEIGHT + Math.max(toPx(slot.end) - toPx(slot.start), 14) }}
                        >
                          <span className="flex h-4 items-center">
                            <span
                              key={`${slot.id}:${starred}`}
                              className={`flex h-3.5 items-center gap-0.5 rounded-[3px] px-1 font-num text-[10px] leading-none font-black ${
                                starred ? "text-white" : live || selected ? "bg-lime" : "bg-paper"
                              } ${poppedId === slot.id ? "origin-left animate-pop motion-reduce:animate-none" : ""}`}
                              style={starred ? { background: STAR_COLOR } : undefined}
                            >
                              {formatMinute(slot.start)}~{starred && <span aria-label="볼 것">★</span>}
                            </span>
                          </span>
                          <span
                            style={{ background: order % 2 === 0 ? colors.light : colors.dark }}
                            className={`relative flex-1 overflow-hidden px-1.25 py-1 text-xs leading-tight font-bold break-keep ${order % 2 === 0 ? "" : "text-white"} ${
                              live || selected ? "shadow-[inset_0_0_0_3px_var(--color-lime)]" : ""
                            }`}
                          >
                            {slot.artist}
                            {onSlotChange && (
                              <span
                                aria-hidden="true"
                                onPointerDown={(event) => {
                                  event.stopPropagation();
                                  startDrag(event, { kind: "resize", slot: original, end: original.end });
                                }}
                                className="absolute inset-x-0 bottom-0 hidden h-2 cursor-ns-resize pointer-fine:block"
                              />
                            )}
                          </span>
                        </Tag>
                      );
                    })}
                  {bubble && bubble.stageId === stage.id && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 z-20 flex h-6.5 -translate-x-1/2 items-center rounded-full bg-ink px-2.5 font-num text-xs font-black whitespace-nowrap text-stub shadow-[0_4px_12px_rgb(17_17_17/0.25)]"
                      style={{ top: toPx(bubble.at) + 6 }}
                    >
                      {bubble.text}
                    </span>
                  )}
                </>,
              )}
            </div>
          );
        })}
        {addColumn && (
          <div className="flex w-22 shrink-0 flex-col">
            <div className="z-30 bg-paper pb-1.5">{addColumn.header}</div>
            <div className="relative" style={{ height }}>
              {addColumn.preview && (
                <div
                  className="absolute inset-0 flex justify-center rounded-sm pt-10 text-xs font-bold"
                  style={{ color: addColumn.preview, background: `color-mix(in srgb, ${addColumn.preview} 6%, transparent)`, boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${addColumn.preview} 35%, transparent)` }}
                >
                  새 무대
                </div>
              )}
            </div>
          </div>
        )}
        {showNow && (
          <div
            aria-hidden="true"
            data-now-line
            className="pointer-events-none absolute right-2 left-0.5 z-20 flex items-center"
            style={{ top: HEADER_HEIGHT + toPx(nowMinute!) - 8 }}
          >
            <span className="flex h-4 items-center rounded-full bg-lime px-1 font-num text-[9px] font-black">{formatMinute(nowMinute!)}</span>
            <span className="h-0.5 flex-1 bg-lime shadow-[0_0_0_1px_var(--color-paper)]" />
          </div>
        )}
      </div>
    </div>
  );
}
