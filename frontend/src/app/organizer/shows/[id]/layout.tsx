import Link from "next/link";
import { backendFetch } from "@/lib/auth";
import type { OrganizerMe } from "@/lib/organizer-types";
import type { Show } from "@/lib/show-types";
import { OrganizerHeader } from "./organizer-header";

const MENU = ["공지", "건의", "현장 QR"];

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
        <nav
          aria-label="주최측 메뉴"
          className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-line px-4 py-3 lg:w-55 lg:flex-col lg:gap-1 lg:border-r lg:border-b-0 lg:px-3 lg:py-5"
        >
          {MENU.map((label) => (
            <span
              key={label}
              aria-disabled="true"
              className="flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-[15px] text-muted lg:h-11 lg:rounded-xl"
            >
              {label}
              <span className="rounded-full bg-pill px-2 py-0.5 text-[11px]">곧 열려요</span>
            </span>
          ))}
        </nav>
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
