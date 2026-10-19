import type { Show, ShowKind } from "./show-types";

export type ReviewStatus = "PENDING" | "VISIBLE" | "HIDDEN";

export const REVIEW_LABELS: Record<ReviewStatus, string> = {
  PENDING: "대기",
  VISIBLE: "띄움",
  HIDDEN: "무시",
};

export type ReviewItem = {
  show: Show;
  kopisId: string;
  area: string | null;
  cast: string | null;
  reviewStatus: ReviewStatus;
};

export type ReviewList = { items: ReviewItem[]; counts: Record<ReviewStatus, number> };

export function reviewPath(status: ReviewStatus, kind: ShowKind) {
  return `/api/dev/shows?status=${status}&kind=${kind}`;
}

export function kopisUrl(kopisId: string) {
  return `https://www.kopis.or.kr/por/db/pblprfr/pblprfrView.do?menuId=MNU_00020&mt20Id=${kopisId}`;
}

export type ShowRequestStatus = "PENDING" | "DONE" | "IGNORED";

export const REQUEST_LABELS: Record<ShowRequestStatus, string> = {
  PENDING: "대기",
  DONE: "처리함",
  IGNORED: "무시",
};

export type ShowRequestItem = {
  id: number;
  kind: ShowKind;
  name: string;
  url: string | null;
  nickname: string | null;
  member: boolean;
  status: ShowRequestStatus;
  createdAt: string;
};

export type ShowRequestList = { items: ShowRequestItem[]; counts: Record<ShowRequestStatus, number> };

export function requestsPath(status: ShowRequestStatus) {
  return `/api/dev/show-requests?status=${status}`;
}

export type OrganizerShow = { id: number; name: string; startDate: string; endDate: string };

export type OrganizerItem = {
  id: number;
  username: string;
  displayName: string;
  active: boolean;
  show: OrganizerShow;
};
