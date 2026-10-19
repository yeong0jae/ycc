import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/auth";
import type { OrganizerMe } from "@/lib/organizer-types";

export default async function OrganizerPage() {
  const res = await backendFetch("/api/organizer/me");
  if (!res.ok) throw new Error(`주최측 정보 조회 실패: ${res.status}`);
  const me: OrganizerMe = await res.json();
  redirect(`/organizer/shows/${me.showId}/notices`);
}
