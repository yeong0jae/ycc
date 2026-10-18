import type { Show } from "./show-types";

export type ReviewStatus = "PENDING" | "VISIBLE" | "HIDDEN";

export const REVIEW_LABELS: Record<ReviewStatus, string> = {
  PENDING: "대기",
  VISIBLE: "띄움",
  HIDDEN: "무시",
};

export type ReviewPage = {
  items: { show: Show; reviewStatus: ReviewStatus }[];
  hasNext: boolean;
  counts: Record<ReviewStatus, number>;
};

export function reviewPath(status: ReviewStatus, page: number) {
  return `/api/admin/shows?status=${status}&page=${page}`;
}
