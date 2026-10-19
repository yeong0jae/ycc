import { backendFetch } from "@/lib/auth";
import type { OrganizerItem } from "@/lib/dev-types";
import { OrganizerBoard } from "./organizer-board";

export default async function DevOrganizersPage() {
  const res = await backendFetch("/api/dev/organizers");
  if (!res.ok) throw new Error(`주최측 목록 조회 실패: ${res.status}`);
  const initial: OrganizerItem[] = await res.json();

  return <OrganizerBoard initial={initial} />;
}
