import { backendFetch } from "@/lib/auth";
import type { Timetable } from "@/lib/timetable-types";
import { TimetableEditor } from "./timetable-editor";

export default async function OrganizerTimetablePage({ params }: PageProps<"/organizer/shows/[id]/timetable">) {
  const { id } = await params;
  const res = await backendFetch(`/api/organizer/shows/${encodeURIComponent(id)}/timetable`);
  if (!res.ok) throw new Error(`타임테이블 조회 실패: ${res.status}`);
  const timetable: Timetable = await res.json();

  return <TimetableEditor showId={Number(id)} initial={timetable} />;
}
