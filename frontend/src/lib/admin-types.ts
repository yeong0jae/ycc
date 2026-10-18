import type { Show } from "./show-types";

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

export function reviewPath(status: ReviewStatus) {
  return `/api/admin/shows?status=${status}`;
}

export function kopisUrl(kopisId: string) {
  return `https://www.kopis.or.kr/por/db/pblprfr/pblprfrView.do?menuId=MNU_00020&mt20Id=${kopisId}`;
}
