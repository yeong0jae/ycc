import { notFound, redirect } from "next/navigation";
import { type ReviewPage, reviewPath } from "@/lib/admin-types";
import { backendFetch, getMe } from "@/lib/auth";
import { ReviewBoard } from "./review-board";

export default async function AdminPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.admin) notFound();
  const res = await backendFetch(reviewPath("PENDING", 0));
  if (!res.ok) throw new Error(`검수 목록 조회 실패: ${res.status}`);
  const initial: ReviewPage = await res.json();

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center bg-ink px-4 text-stub sm:px-6">
        <p className="font-display text-xl">운영 · 페스티벌 검수</p>
      </header>
      <ReviewBoard initial={initial} />
    </main>
  );
}
