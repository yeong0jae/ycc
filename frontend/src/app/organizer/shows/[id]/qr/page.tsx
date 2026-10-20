import { backendFetch } from "@/lib/auth";
import type { Show } from "@/lib/show-types";
import { SiteQr } from "./site-qr";

export default async function OrganizerQrPage({ params }: PageProps<"/organizer/shows/[id]/qr">) {
  const { id } = await params;
  const [codeRes, showRes] = await Promise.all([
    backendFetch(`/api/organizer/shows/${encodeURIComponent(id)}/site-code`),
    backendFetch(`/api/organizer/shows/${encodeURIComponent(id)}`),
  ]);
  if (!codeRes.ok) throw new Error(`현장 QR 조회 실패: ${codeRes.status}`);
  if (!showRes.ok) throw new Error(`공연 조회 실패: ${showRes.status}`);
  const { code }: { code: string } = await codeRes.json();
  const show: Show = await showRes.json();

  return <SiteQr showId={show.id} initialCode={code} showName={show.name} startDate={show.startDate} endDate={show.endDate} venue={show.venue} />;
}
