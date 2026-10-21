"use client";

import { useEffect, useState } from "react";
import type { TimetableSlot, TimetableStage } from "@/lib/timetable-types";
import { drawTimetable } from "./draw-timetable";

const TOAST_MS = 2500;
const FOOTER = "슬램";

function download(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function TimetableSave({
  showName,
  venue,
  day,
  stages,
  slots,
  range,
  starredIds,
}: {
  showName: string;
  venue: string;
  day: string;
  stages: TimetableStage[];
  slots: TimetableSlot[];
  range: { start: number; end: number };
  starredIds: ReadonlySet<number> | null;
}) {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const blob = await drawTimetable({ showName, venue, day, stages, slots, range, starredIds: starredIds ?? new Set(), footer: FOOTER, host: location.host });
      if (!blob) return;
      const file = new File([blob], `timetable-${day}.png`, { type: "image/png" });
      if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          setToast(true);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }
      download(file);
      setToast(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="press mx-3 mt-5 flex h-13 w-[calc(100%-1.5rem)] cursor-pointer items-center justify-center gap-2 rounded-full bg-pill text-[15px] font-bold disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
        </svg>
        내 타임테이블 저장
      </button>

      <p
        role="status"
        className={`pointer-events-none fixed bottom-40 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4.5 py-3 text-sm font-bold whitespace-nowrap text-stub shadow-[0_4px_16px_rgb(17_17_17/0.25)] transition duration-200 motion-reduce:transition-none ${
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <span className="flex size-4.5 items-center justify-center rounded-full bg-lime text-[11px] text-ink">✓</span>
        내 타임테이블을 저장했어요
      </p>
    </>
  );
}
