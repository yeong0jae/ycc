export type TimetableStage = { id: number; name: string };

export type TimetableSlot = { id: number; stageId: number; day: string; start: number; end: number; artist: string };

export type TimetableImage = { id: number; day: string; url: string; width: number; height: number };

export type Timetable = {
  published: boolean;
  days: string[];
  stages: TimetableStage[];
  slots: TimetableSlot[];
  images: TimetableImage[];
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDay(day: string) {
  const [, m, d] = day.split("-").map(Number);
  return `${m}.${d} ${WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()]}`;
}

export function formatMinute(minute: number, wrap = true) {
  const hours = Math.floor(minute / 60);
  return `${String(wrap ? hours % 24 : hours).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

export function parseMinute(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const minute = Number(match[1]) * 60 + Number(match[2]);
  return Number(match[2]) < 60 && minute <= 30 * 60 ? minute : null;
}

export function timetableRange(slots: TimetableSlot[]) {
  if (slots.length === 0) return { start: 12 * 60, end: 22 * 60 };
  return {
    start: Math.floor(Math.min(...slots.map((slot) => slot.start)) / 60) * 60,
    end: Math.ceil(Math.max(...slots.map((slot) => slot.end)) / 60) * 60,
  };
}

export const STAGE_STYLES = [
  { header: "bg-paper shadow-[inset_0_0_0_2px_var(--color-ink)]", block: "bg-paper shadow-[inset_0_0_0_2px_var(--color-ink)]" },
  { header: "bg-[#dcdce1]", block: "bg-[#dcdce1]" },
  { header: "bg-ink text-stub", block: "bg-ink text-stub" },
];
