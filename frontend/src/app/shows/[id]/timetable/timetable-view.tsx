"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { ImageViewer } from "@/components/image-viewer";
import { TimetableGrid } from "@/components/timetable-grid";
import { toggleStar, useStarredSlots } from "@/lib/timetable-stars";
import { formatDay, type Timetable, timetableRange } from "@/lib/timetable-types";
import { TimetableSave } from "./timetable-save";

type Mode = "schedule" | "image";

const MODE_KEY = "ycc:timetable-view";
const DAY_MINUTES = 24 * 60;
const AFTER_MIDNIGHT = 6 * 60;
const STICKY_TOP = 68 + 44;

function seoulNow() {
  const [date, time] = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).split(" ");
  const [h, m] = time.split(":").map(Number);
  return { date, minute: h * 60 + m };
}

function previousDay(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function liveDayAndMinute(days: string[]) {
  const now = seoulNow();
  const yesterday = previousDay(now.date);
  if (now.minute < AFTER_MIDNIGHT && days.includes(yesterday)) return { day: yesterday, minute: now.minute + DAY_MINUTES };
  return { day: now.date, minute: now.minute };
}

const noSubscribe = () => () => {};

function storedMode(): Mode | null {
  try {
    const value = localStorage.getItem(MODE_KEY);
    return value === "schedule" || value === "image" ? value : null;
  } catch {
    return null;
  }
}

export function TimetableView({ timetable, showName, venue }: { timetable: Timetable; showName: string; venue: string }) {
  const { days, stages, slots, images } = timetable;
  const hasSchedule = timetable.published && stages.length > 0 && slots.length > 0;
  const hasImages = images.length > 0;
  const [live, setLive] = useState(() => liveDayAndMinute(days));
  const [day, setDay] = useState(() => (days.includes(live.day) ? live.day : days[0]));
  const stored = useSyncExternalStore(noSubscribe, storedMode, () => null);
  const starredIds = useStarredSlots();
  const [picked, setPicked] = useState<Mode | null>(null);
  const preferred = picked ?? stored;
  const mode: Mode =
    preferred === "schedule" && hasSchedule ? "schedule" : preferred === "image" && hasImages ? "image" : hasSchedule ? "schedule" : "image";
  const [viewing, setViewing] = useState<number | null>(null);
  const scrolled = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setLive(liveDayAndMinute(days)), 60_000);
    return () => clearInterval(timer);
  }, [days]);

  const daySlots = slots.filter((slot) => slot.day === day);
  const dayImages = images.filter((image) => image.day === day);
  const range = timetableRange(daySlots);
  const nowMinute = day === live.day ? live.minute : null;

  useLayoutEffect(() => {
    if (scrolled.current || mode !== "schedule") return;
    scrolled.current = true;
    const line = document.querySelector<HTMLElement>("[data-now-line]");
    if (!line) return;
    const top = line.getBoundingClientRect().top + window.scrollY - window.innerHeight / 3;
    window.scrollTo({ top: Math.max(top, 0), behavior: "instant" });
  }, [mode]);

  const pickMode = (next: Mode) => {
    setPicked(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {}
  };

  if (!hasSchedule && !hasImages) {
    return <p className="py-16 text-center text-sm text-muted">아직 타임테이블이 없어요.</p>;
  }

  return (
    <>
      <div className="flex items-center gap-1.5 px-4 pt-3.5">
        <div role="group" aria-label="날짜" className="flex min-w-0 gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {days.map((it) => (
            <button
              key={it}
              type="button"
              aria-pressed={it === day}
              onClick={() => setDay(it)}
              className={`press h-9 shrink-0 cursor-pointer rounded-full px-3.5 font-num text-[13px] font-black ${it === day ? "bg-ink text-stub" : "bg-pill"}`}
            >
              {formatDay(it)}
            </button>
          ))}
        </div>
        {hasSchedule && hasImages && (
          <div role="group" aria-label="보기" className="ml-auto flex shrink-0 gap-0.5 rounded-full bg-pill p-0.75">
            {(["schedule", "image"] as const).map((it) => (
              <button
                key={it}
                type="button"
                aria-pressed={mode === it}
                onClick={() => pickMode(it)}
                className={`h-7.5 cursor-pointer rounded-full px-3 text-xs font-bold transition-colors ${
                  mode === it ? "bg-paper shadow-[0_1px_3px_rgb(17_17_17/0.12)]" : "text-muted"
                }`}
              >
                {it === "schedule" ? "시간표" : "공식 이미지"}
              </button>
            ))}
          </div>
        )}
      </div>

      {mode === "schedule" ? (
        daySlots.length > 0 ? (
          <div className="pt-3.5">
            <TimetableGrid
              stages={stages}
              slots={daySlots}
              range={range}
              nowMinute={nowMinute}
              starredIds={starredIds}
              onSlotClick={(slot) => toggleStar(slot.id)}
              stickyTop={STICKY_TOP}
            />
            <TimetableSave showName={showName} venue={venue} day={day} stages={stages} slots={daySlots} range={range} starredIds={starredIds} />
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-muted">이 날은 아직 순서가 없어요.</p>
        )
      ) : dayImages.length > 0 ? (
        <div className="flex flex-col gap-2.5 px-3 pt-3.5">
          {dayImages.map((image, index) => (
            <button key={image.id} type="button" aria-label="공식 이미지 크게 보기" onClick={() => setViewing(index)} className="relative cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" width={image.width} height={image.height} className="h-auto w-full rounded-[18px] bg-pill" />
              <span className="absolute top-3 right-3 flex h-7.5 items-center rounded-full bg-ink/55 px-3 text-xs text-stub">눌러서 크게 보기</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-muted">이 날 공식 이미지가 없어요.</p>
      )}

      {viewing !== null && <ImageViewer images={dayImages} start={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
