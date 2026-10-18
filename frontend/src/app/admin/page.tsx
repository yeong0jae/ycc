import { notFound, redirect } from "next/navigation";
import { type ReviewList, reviewPath } from "@/lib/admin-types";
import { backendFetch, getMe } from "@/lib/auth";
import { todayInSeoul } from "@/lib/format";
import { ReviewBoard } from "./review-board";

export default async function AdminPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.admin) notFound();
  const res = await backendFetch(reviewPath("PENDING"));
  if (!res.ok) throw new Error(`검수 목록 조회 실패: ${res.status}`);
  const initial: ReviewList = await res.json();

  return (
    <ReviewBoard initial={initial} today={todayInSeoul()} />
  );
}
