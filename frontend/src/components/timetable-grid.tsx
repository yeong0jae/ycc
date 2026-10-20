"use client";

import { useState } from "react";
import { formatMinute, STAGE_COLORS, STAR_COLOR, type TimetableSlot, type TimetableStage } from "@/lib/timetable-types";

const SNAP_MINUTES = 10;
const HEADER_HEIGHT = 36;
const LABEL_HEIGHT = 16;
const MAX_FIT_STAGES = 4;

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
  stickyTop?: number;
}) {
  const toPx = (minute: number) => LABEL_HEIGHT + ((minute - range.start) / 60) * perHour;
  const height = toPx(range.end);
  const hours = [];
  for (let minute = range.start; minute <= range.end; minute += 60) hours.push(minute);
  const showNow = nowMinute !== null && nowMinute >= range.start && nowMinute <= range.end;
  const scrolls = stages.length > MAX_FIT_STAGES;
  const [poppedId, setPoppedId] = useState<number | null>(null);

  return (
    <div className={`pb-2 ${scrolls ? "overflow-x-auto [scrollbar-width:none]" : ""}`}>
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
          return (
            <div key={stage.id} className="flex min-w-20 flex-1 flex-col">
              <div className={`z-30 bg-paper pb-1.5 ${stickyTop !== undefined && !scrolls ? "sticky" : ""}`} style={{ top: stickyTop }}>
                <span className="flex h-7.5 items-center justify-center truncate rounded-md px-1 font-num text-[11px] font-black text-white" style={{ background: colors.dark }}>
                  {stage.name}
                </span>
              </div>
              <div
                className={`relative ${onEmptyClick ? "cursor-copy" : ""}`}
                style={{
                  height,
                  backgroundImage: `repeating-linear-gradient(var(--color-line) 0 1px, transparent 1px ${perHour}px), repeating-linear-gradient(var(--color-pill) 0 1px, transparent 1px ${perHour / 4}px)`,
                  backgroundPosition: `0 ${LABEL_HEIGHT}px`,
                }}
                onClick={(event) => {
                  if (!onEmptyClick || event.target !== event.currentTarget) return;
                  const y = event.clientY - event.currentTarget.getBoundingClientRect().top - LABEL_HEIGHT;
                  const minute = range.start + Math.round(((y / perHour) * 60) / SNAP_MINUTES) * SNAP_MINUTES;
                  onEmptyClick(stage.id, minute);
                }}
              >
                {slots
                  .filter((slot) => slot.stageId === stage.id)
                  .sort((a, b) => a.start - b.start)
                  .map((slot, order) => {
                    const live = nowMinute !== null && slot.start <= nowMinute && nowMinute < slot.end;
                    const past = nowMinute !== null && slot.end <= nowMinute;
                    const selected = slot.id === selectedId;
                    const starred = starredIds?.has(slot.id) ?? false;
                    const Tag = onSlotClick ? "button" : "div";
                    return (
                      <Tag
                        key={slot.id}
                        {...(onSlotClick
                          ? {
                              type: "button" as const,
                              "aria-pressed": starredIds ? starred : undefined,
                              onClick: () => {
                                setPoppedId(slot.id);
                                onSlotClick(slot);
                              },
                            }
                          : {})}
                        className={`absolute inset-x-0 flex flex-col text-left ${past && !selected ? "opacity-40" : ""} ${onSlotClick ? "press cursor-pointer" : ""}`}
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
                          className={`flex-1 overflow-hidden px-1.25 py-1 text-xs leading-tight font-bold break-keep ${order % 2 === 0 ? "" : "text-white"} ${
                            live || selected ? "shadow-[inset_0_0_0_3px_var(--color-lime)]" : ""
                          }`}
                        >
                          {slot.artist}
                        </span>
                      </Tag>
                    );
                  })}
              </div>
            </div>
          );
        })}
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
