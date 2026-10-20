"use client";

import { formatMinute, STAGE_STYLES, type TimetableSlot, type TimetableStage } from "@/lib/timetable-types";

const SNAP_MINUTES = 10;
const HEADER_HEIGHT = 40;

export function TimetableGrid({
  stages,
  slots,
  range,
  perHour = 100,
  nowMinute = null,
  selectedId = null,
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
  onSlotClick?: (slot: TimetableSlot) => void;
  onEmptyClick?: (stageId: number, minute: number) => void;
  stickyTop?: number;
}) {
  const toPx = (minute: number) => ((minute - range.start) / 60) * perHour;
  const height = toPx(range.end);
  const ticks = [];
  for (let minute = range.start; minute <= range.end; minute += 30) ticks.push(minute);
  const showNow = nowMinute !== null && nowMinute >= range.start && nowMinute <= range.end;

  return (
    <div className={`pb-2 ${stages.length > 3 ? "overflow-x-auto [scrollbar-width:none]" : ""}`}>
      <div className="relative flex min-w-full gap-1.5 px-3">
        <div className={`w-10 shrink-0 ${stages.length > 3 ? "sticky left-0 z-10 bg-paper" : ""}`}>
          <div style={{ height: HEADER_HEIGHT }} />
          <div className="relative" style={{ height }}>
            {ticks.map((minute) => {
              const hour = minute % 60 === 0;
              return (
                <span
                  key={minute}
                  className={`absolute left-0 -translate-y-1/2 font-num leading-none ${hour ? "text-[11px] font-black" : "text-[9px] font-extrabold text-[#b9b9c0]"}`}
                  style={{ top: toPx(minute) }}
                >
                  {hour ? formatMinute(minute) : ":30"}
                </span>
              );
            })}
          </div>
        </div>
        {stages.map((stage, index) => {
          const style = STAGE_STYLES[index % STAGE_STYLES.length];
          return (
            <div key={stage.id} className="flex min-w-26 flex-1 flex-col">
              <div
                className={`z-30 bg-paper pb-1.5 ${stickyTop !== undefined && stages.length <= 3 ? "sticky" : ""}`}
                style={{ top: stickyTop }}
              >
                <span className={`flex h-8.5 items-center justify-center truncate rounded-[10px] px-1.5 text-xs font-bold ${style.header}`}>
                  {stage.name}
                </span>
              </div>
              <div
                className={`relative ${onEmptyClick ? "cursor-copy" : ""}`}
                style={{
                  height,
                  backgroundImage: `repeating-linear-gradient(#eeeef1 0 1px, transparent 1px ${perHour / 2}px)`,
                }}
                onClick={(event) => {
                  if (!onEmptyClick || event.target !== event.currentTarget) return;
                  const y = event.clientY - event.currentTarget.getBoundingClientRect().top;
                  const minute = range.start + Math.round(((y / perHour) * 60) / SNAP_MINUTES) * SNAP_MINUTES;
                  onEmptyClick(stage.id, minute);
                }}
              >
                {slots
                  .filter((slot) => slot.stageId === stage.id)
                  .map((slot) => {
                    const live = nowMinute !== null && slot.start <= nowMinute && nowMinute < slot.end;
                    const past = nowMinute !== null && slot.end <= nowMinute;
                    const selected = slot.id === selectedId;
                    const Tag = onSlotClick ? "button" : "div";
                    return (
                      <Tag
                        key={slot.id}
                        {...(onSlotClick ? { type: "button" as const, onClick: () => onSlotClick(slot) } : {})}
                        className={`absolute inset-x-0 flex flex-col overflow-hidden rounded-xl px-2 py-1.5 text-left ${style.block} ${
                          live || selected ? "ring-3 ring-lime" : ""
                        } ${past && !selected ? "opacity-35" : ""} ${onSlotClick ? "press cursor-pointer" : ""}`}
                        style={{ top: toPx(slot.start) + 2, height: Math.max(toPx(slot.end) - toPx(slot.start) - 4, 22) }}
                      >
                        <span className="text-sm leading-tight font-bold break-keep">{slot.artist}</span>
                        <span className="mt-0.5 font-num text-[10px] font-extrabold opacity-70">
                          {formatMinute(slot.start)}–{formatMinute(slot.end)}
                        </span>
                        <span className="mt-auto self-end font-num text-xs font-extrabold">{slot.end - slot.start}&apos;</span>
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
            className="pointer-events-none absolute right-3 left-1.5 z-20 flex items-center"
            style={{ top: HEADER_HEIGHT + toPx(nowMinute!) - 9 }}
          >
            <span className="flex h-4.5 items-center rounded-full bg-lime px-1.5 font-num text-[10px] font-black">{formatMinute(nowMinute!)}</span>
            <span className="h-0.5 flex-1 bg-lime shadow-[0_0_0_1px_var(--color-paper)]" />
          </div>
        )}
      </div>
    </div>
  );
}
