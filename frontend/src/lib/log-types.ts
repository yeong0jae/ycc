export type Moment = "GOODS" | "ENTRY" | "BEFORE_SHOW" | "AFTER";

export const MOMENTS: { key: Moment; label: string; hint: string }[] = [
  { key: "GOODS", label: "굿즈 줄", hint: "줄 서 있는 지금" },
  { key: "ENTRY", label: "입장 대기", hint: "입장 직전의 설렘" },
  { key: "BEFORE_SHOW", label: "공연 직전", hint: "불 꺼지기 전 무대" },
  { key: "AFTER", label: "끝나고", hint: "나오는 길의 여운" },
];

export type MyLog = {
  id: number;
  status: "DRAFT" | "READY";
  clips: { moment: Moment; durationMs: number }[];
  song: string | null;
  note: string | null;
};

export type ShowLog = {
  id: number;
  showId: number;
  showName: string;
  showStartDate: string;
  song: string | null;
  note: string | null;
  cutCount: number;
  videoUrl: string;
  thumbnailUrl: string;
};

export type AttendanceStatus = "GOING" | "ATTENDED";

export type Attendance = { date: string; status: AttendanceStatus };

export type AttendanceItem = {
  showId: number;
  showName: string;
  posterUrl: string;
  venue: string;
  date: string;
  status: AttendanceStatus;
  logId: number | null;
};

export type Home = { upcoming: AttendanceItem[]; unrecorded: AttendanceItem[] };

export type Records = {
  stats: { thisYear: number; total: number; topVenue: { name: string; count: number } | null };
  years: { year: number; items: AttendanceItem[] }[];
};
