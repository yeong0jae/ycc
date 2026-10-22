import Link from "next/link";
import { backendFetch } from "@/lib/auth";
import type { Show } from "@/lib/show-types";
import { SiteQr } from "./site-qr";

export default async function OrganizerQrPage({ params }: PageProps<"/organizer/shows/[id]/qr">) {
  const { id } = await params;
  const [codeRes, showRes] = await Promise.all([
    backendFetch(`/api/organizer/shows/${encodeURIComponent(id)}/site-code`),
    backendFetch(`/api/organizer/shows/${encodeURIComponent(id)}`),
  ]);
  if (codeRes.status === 409) {
    return (
      <section className="flex flex-col gap-4 px-4 py-5 lg:mx-auto lg:w-full lg:max-w-160 lg:px-0 lg:py-8">
        <h1 className="hidden font-display text-[22px] lg:block">현장 QR</h1>
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-[#f7f7f8] px-6 py-12 text-center">
          <b className="text-[15px]">문의를 켜면 현장 QR이 생겨요</b>
          <p className="text-sm leading-relaxed text-muted">찍은 관객은 로그인 없이 문의를 남길 수 있어요.</p>
          <Link href={`/organizer/shows/${id}/suggestions`} className="press mt-2 flex h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-stub">
            문의 켜러 가기
          </Link>
        </div>
      </section>
    );
  }
  if (!codeRes.ok) throw new Error(`현장 QR 조회 실패: ${codeRes.status}`);
  if (!showRes.ok) throw new Error(`공연 조회 실패: ${showRes.status}`);
  const { code }: { code: string } = await codeRes.json();
  const show: Show = await showRes.json();

  return <SiteQr showId={show.id} initialCode={code} showName={show.name} startDate={show.startDate} endDate={show.endDate} venue={show.venue} />;
}
