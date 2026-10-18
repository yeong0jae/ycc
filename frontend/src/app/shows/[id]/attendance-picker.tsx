"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { datesBetween, formatDay } from "@/lib/format";
import type { Attendance, AttendanceStatus } from "@/lib/log-types";

export function AttendancePicker({
  showId,
  startDate,
  endDate,
  today,
  initial,
}: {
  showId: number;
  startDate: string;
  endDate: string;
  today: string;
  initial: Attendance[];
}) {
  const router = useRouter();
  const dates = datesBetween(startDate, endDate);
  const [attendances, setAttendances] = useState(initial);
  const [selected, setSelected] = useState(
    initial[0]?.date ?? (dates.includes(today) ? today : startDate),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const status = attendances.find((it) => it.date === selected)?.status ?? null;
  const canAttend = selected <= today;

  const toggle = (target: AttendanceStatus) =>
    startTransition(async () => {
      setError(null);
      const off = status === target;
      const res = await fetch(`/api/shows/${showId}/attendances/${selected}`, {
        method: off ? "DELETE" : "PUT",
        headers: off ? undefined : { "content-type": "application/json" },
        body: off ? undefined : JSON.stringify({ status: target }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message ?? "저장하지 못했어요.");
        return;
      }
      setAttendances(await res.json());
      router.refresh();
    });

  const button = (target: AttendanceStatus, label: string, disabled = false) => {
    const on = status === target;
    return (
      <button
        type="button"
        aria-pressed={on}
        disabled={pending || disabled}
        onClick={() => toggle(target)}
        className={`flex h-12 flex-1 cursor-pointer items-center justify-center rounded-xl border-[1.5px] font-semibold transition duration-150 active:scale-[0.97] disabled:cursor-default disabled:active:scale-100 motion-reduce:transition-none ${
          on ? "border-ink bg-ink text-stub" : disabled ? "border-line bg-stub text-muted" : "border-ink bg-stub"
        }`}
      >
        {on ? `${label} ✓` : label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {dates.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-muted">어느 날 가요?</p>
          <div role="group" aria-label="공연 날짜" className="-mx-4 flex gap-2 overflow-x-auto px-4">
            {dates.map((date) => {
              const active = date === selected;
              const marked = attendances.some((it) => it.date === date);
              return (
                <button
                  key={date}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(date)}
                  className={`relative h-12 shrink-0 cursor-pointer rounded-xl px-4 font-mono text-sm ${
                    active ? "bg-ink text-stub" : "border border-line bg-stub"
                  }`}
                >
                  {formatDay(date)}
                  {marked && (
                    <span
                      aria-label="기록 있음"
                      className={`absolute top-1.5 right-1.5 size-1.5 rounded-full ${active ? "bg-stub" : "bg-ink"}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        {button("GOING", "갈 예정")}
        {button("ATTENDED", "다녀옴", !canAttend)}
      </div>
      {!canAttend && <p className="text-center text-xs text-muted">다녀옴은 공연 날부터 남길 수 있어요</p>}
      {error && (
        <p role="alert" className="text-center text-sm font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}
