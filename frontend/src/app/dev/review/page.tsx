import { type ReviewList, reviewPath } from "@/lib/dev-types";
import { backendFetch } from "@/lib/auth";
import { todayInSeoul } from "@/lib/format";
import { ReviewBoard } from "./review-board";

export default async function DevReviewPage() {
  const res = await backendFetch(reviewPath("PENDING", "FESTIVAL"));
  if (!res.ok) throw new Error(`검수 목록 조회 실패: ${res.status}`);
  const initial: ReviewList = await res.json();

  return (
    <ReviewBoard initial={initial} today={todayInSeoul()} />
  );
}
