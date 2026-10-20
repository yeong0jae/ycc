import type { Show } from "./show-types";

export type NoticeKind = "URGENT" | "SCHEDULE" | "INFO";

export const NOTICE_KINDS: { key: NoticeKind; label: string }[] = [
  { key: "URGENT", label: "긴급" },
  { key: "SCHEDULE", label: "일정 변경" },
  { key: "INFO", label: "안내" },
];

export const NOTICE_LABELS: Record<NoticeKind, string> = { URGENT: "긴급", SCHEDULE: "일정 변경", INFO: "안내" };

export const NOTICE_CHIPS: Record<NoticeKind, string> = { URGENT: "bg-lime", SCHEDULE: "bg-cream", INFO: "bg-pill" };

export type NoticeImage = { id: number; url: string; width: number; height: number };

export type Notice = {
  id: number;
  kind: NoticeKind;
  title: string;
  body: string | null;
  images: NoticeImage[];
  organizerName: string;
  createdAt: string;
  updatedAt: string | null;
};

export type ShowNotices = { urgent: Notice | null; items: Notice[]; total: number };

export type ParticipatedShow = {
  show: Show;
  latestNotice: Pick<Notice, "kind" | "title" | "createdAt"> | null;
  noticeCount: number;
};
