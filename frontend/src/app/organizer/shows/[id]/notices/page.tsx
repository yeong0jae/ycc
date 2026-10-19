import { backendFetch } from "@/lib/auth";
import type { Notice } from "@/lib/notice-types";
import type { OrganizerMe } from "@/lib/organizer-types";
import { NoticeEditor } from "./notice-editor";

export default async function OrganizerNoticesPage({ params }: PageProps<"/organizer/shows/[id]/notices">) {
  const { id } = await params;
  const [meRes, noticesRes] = await Promise.all([
    backendFetch("/api/organizer/me"),
    backendFetch(`/api/organizer/shows/${encodeURIComponent(id)}/notices`),
  ]);
  if (!meRes.ok) throw new Error(`주최측 정보 조회 실패: ${meRes.status}`);
  if (!noticesRes.ok) throw new Error(`공지 목록 조회 실패: ${noticesRes.status}`);
  const me: OrganizerMe = await meRes.json();
  const notices: Notice[] = await noticesRes.json();

  return <NoticeEditor showId={Number(id)} organizerName={me.displayName} initial={notices} />;
}
