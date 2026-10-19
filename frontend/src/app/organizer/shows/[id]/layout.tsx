import Link from "next/link";
import { backendFetch } from "@/lib/auth";
import type { OrganizerMe } from "@/lib/organizer-types";
import type { Show } from "@/lib/show-types";
import { OrganizerHeader } from "./organizer-header";
import { OrganizerMenu } from "./organizer-menu";

export default async function OrganizerShowLayout({ children, params }: LayoutProps<"/organizer/shows/[id]">) {
  const { id } = await params;
  const [meRes, showRes] = await Promise.all([
    backendFetch("/api/organizer/me"),
    backendFetch(`/api/organizer/shows/${encodeURIComponent(id)}`),
  ]);
  if (!meRes.ok) throw new Error(`주최측 정보 조회 실패: ${meRes.status}`);
  if (showRes.status === 403 || showRes.status === 400) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-[15px]">맡은 공연이 아니에요.</p>
        <Link href="/organizer" className="press flex h-12 items-center rounded-full bg-ink px-5 font-bold text-stub">
          내 공연으로 가기
        </Link>
      </main>
    );
  }
  if (!showRes.ok) throw new Error(`공연 조회 실패: ${showRes.status}`);
  const me: OrganizerMe = await meRes.json();
  const show: Show = await showRes.json();

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      <OrganizerHeader showName={show.name} displayName={me.displayName} />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <OrganizerMenu showId={show.id} />
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
