import { backendFetch } from "@/lib/auth";
import type { ShowMap } from "@/lib/map-types";
import { MapEditor } from "./map-editor";

export default async function OrganizerMapPage({ params }: PageProps<"/organizer/shows/[id]/map">) {
  const { id } = await params;
  const res = await backendFetch(`/api/organizer/shows/${encodeURIComponent(id)}/map`);
  if (!res.ok) throw new Error(`맵 조회 실패: ${res.status}`);
  const map: ShowMap = await res.json();

  return <MapEditor showId={Number(id)} initial={map} />;
}
