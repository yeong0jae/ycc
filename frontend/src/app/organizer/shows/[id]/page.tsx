import { backendFetch } from "@/lib/auth";
import { formatLongPeriod } from "@/lib/format";
import type { Show } from "@/lib/show-types";

export default async function OrganizerShowPage({ params }: PageProps<"/organizer/shows/[id]">) {
  const { id } = await params;
  const res = await backendFetch(`/api/organizer/shows/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`공연 조회 실패: ${res.status}`);
  const show: Show = await res.json();

  return (
    <section className="flex flex-col gap-5 p-4 sm:flex-row sm:gap-6 lg:p-7">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={show.posterUrl}
        alt={`${show.name} 포스터`}
        className="aspect-[3/4] w-40 shrink-0 rounded-2xl bg-pill object-cover sm:w-52"
      />
      <div className="flex min-w-0 flex-col gap-3">
        <h1 className="font-display text-2xl leading-snug">{show.name}</h1>
        <dl className="grid grid-cols-[56px_minmax(0,1fr)] gap-y-2 text-[15px] leading-relaxed">
          <dt className="text-muted">기간</dt>
          <dd>{formatLongPeriod(show.startDate, show.endDate)}</dd>
          <dt className="text-muted">장소</dt>
          <dd>{show.venue}</dd>
        </dl>
        <p className="text-sm text-muted">건의·현장 QR은 곧 열려요.</p>
      </div>
    </section>
  );
}
