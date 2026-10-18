import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, ViewTransition } from "react";
import { AppFrame } from "@/components/app-frame";
import { BackButton } from "@/components/back-button";
import { KopisSource } from "@/components/kopis-source";
import { LiveBadge } from "@/components/live-badge";
import { festivalBadge, formatLongPeriod, shortRegion } from "@/lib/format";
import { getShow } from "@/lib/show";

async function DetailBadge({ startDate, endDate }: { startDate: string; endDate: string }) {
  await connection();
  const badge = festivalBadge(startDate, endDate);
  if (!badge) return null;
  return (
    <LiveBadge
      label={badge.label}
      live={badge.live}
      idle="bg-pill"
      className="h-6.5 animate-rise self-start px-2.5 text-[13px] motion-reduce:animate-none"
    />
  );
}

export default async function ShowPage({ params }: PageProps<"/shows/[id]">) {
  const { id } = await params;
  const show = await getShow(id);
  if (!show) notFound();
  const region = shortRegion(show.area);
  const ticketUrl = show.ticketUrl ?? show.officialUrl;

  return (
    <AppFrame className="pb-32">
      <div className="px-3 pt-2.5">
        <BackButton />
      </div>

      <header className="flex flex-col gap-2.5 px-5 pt-3.5">
        <div className="flex h-6.5">
          <Suspense fallback={null}>
            <DetailBadge startDate={show.startDate} endDate={show.endDate} />
          </Suspense>
        </div>
        <h1 className="animate-rise font-display text-[26px] leading-snug [animation-delay:50ms] motion-reduce:animate-none">
          {show.name}
        </h1>
        <p className="animate-rise text-base leading-normal [animation-delay:100ms] motion-reduce:animate-none">
          <b>{formatLongPeriod(show.startDate, show.endDate)}</b>
          <span className="text-muted">
            {" · "}
            {show.venue}
            {region && `, ${region}`}
          </span>
        </p>
      </header>

      <a href={show.posterUrl} target="_blank" rel="noopener noreferrer" className="relative mx-3 mt-4 block">
        <ViewTransition name={`poster-${show.id}`} share="morph" default="none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={show.posterUrl} alt={`${show.name} 포스터`} className="w-full rounded-[20px] bg-pill" />
        </ViewTransition>
        <span className="absolute top-3 right-3 flex h-7.5 items-center rounded-full bg-ink/55 px-3 text-xs text-stub">
          눌러서 크게 보기
        </span>
      </a>

      <dl className="mx-5 mt-2">
        {show.scheduleGuide && (
          <div className="flex gap-3 border-b border-line py-3.5">
            <dt className="w-11 shrink-0 text-sm text-muted">회차</dt>
            <dd className="text-[15px] leading-relaxed">{show.scheduleGuide}</dd>
          </div>
        )}
        {show.priceGuide && (
          <div className="flex gap-3 border-b border-line py-3.5">
            <dt className="w-11 shrink-0 text-sm text-muted">가격</dt>
            <dd className="text-[15px] leading-relaxed whitespace-pre-line">{show.priceGuide}</dd>
          </div>
        )}
        {show.cast && (
          <div className="flex gap-3 border-b border-line py-3.5">
            <dt className="w-11 shrink-0 text-sm text-muted">출연</dt>
            <dd className="text-[15px] leading-relaxed">{show.cast}</dd>
          </div>
        )}
        <div className="flex items-center gap-3 py-3.5">
          <dt className="w-11 shrink-0 text-sm text-muted">장소</dt>
          <dd className="flex flex-1 items-center justify-between gap-2 text-[15px]">
            {show.venue}
            {show.facilityId && (
              <Link
                href={`/find/map?facility=${show.facilityId}`}
                className="press flex h-8.5 shrink-0 items-center rounded-full bg-pill px-3 text-[13px] font-medium"
              >
                지도
              </Link>
            )}
          </dd>
        </div>
      </dl>

      <KopisSource className="px-5 pt-4 text-center" />

      <div className="fixed inset-x-0 bottom-0 z-20 bg-paper shadow-[0_-1px_0_var(--color-line)]">
        <div className="mx-auto flex max-w-2xl gap-2 px-3 pt-3 pb-7">
          {ticketUrl && (
            <a
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="press flex h-14 w-30 shrink-0 items-center justify-center rounded-full bg-pill text-[15px] font-bold"
            >
              예매처 ↗
            </a>
          )}
          <button
            type="button"
            disabled
            className="h-14 flex-1 rounded-full bg-lime text-base font-bold disabled:opacity-50"
          >
            예매 인증 · 곧 열려요
          </button>
        </div>
      </div>
    </AppFrame>
  );
}
