"use client";

import { toBlob } from "html-to-image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { TimetableGrid } from "@/components/timetable-grid";
import { formatDay, type TimetableSlot, type TimetableStage } from "@/lib/timetable-types";

const TOAST_MS = 2500;
const PIXEL_RATIO = 3;
const BASE_WIDTH = 390;
const STAGE_WIDTH = 86;

const noSubscribe = () => () => {};

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
  const sheet = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const host = useSyncExternalStore(noSubscribe, () => location.host, () => "");
  const starCount = slots.filter((slot) => starredIds?.has(slot.id)).length;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const save = async () => {
    if (!sheet.current || saving) return;
    setSaving(true);
    try {
      const blob = await toBlob(sheet.current, { pixelRatio: PIXEL_RATIO, backgroundColor: "#ffffff" });
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

      <div aria-hidden="true" inert className="pointer-events-none fixed top-0 -left-[10000px]">
        <div ref={sheet} className="bg-paper pb-5 text-ink" style={{ width: Math.max(BASE_WIDTH, 40 + stages.length * STAGE_WIDTH) }}>
          <div className="px-5 pt-7 pb-1">
            <p className="font-num text-[13px] font-black text-muted">
              {formatDay(day)} · {venue}
            </p>
            <p className="mt-1 text-2xl font-black tracking-tight">{showName}</p>
            {starCount > 0 && (
              <p className="mt-1.5 text-xs text-muted">
                <span className="font-black text-[#e8283c]">★</span> 내가 볼 순서 {starCount}개
              </p>
            )}
          </div>
          <div className="pt-3.5">
            <TimetableGrid stages={stages} slots={slots} range={range} starredIds={starredIds} />
          </div>
          <div className="mx-5 mt-4.5 flex items-center justify-between pt-3.5 shadow-[inset_0_1px_0_var(--color-line)]">
            <span className="rounded-md bg-pill px-2.5 py-1.5 text-[11px] font-bold">공연 모아보기</span>
            <span className="text-[11px] text-muted">{host}</span>
          </div>
        </div>
      </div>

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
