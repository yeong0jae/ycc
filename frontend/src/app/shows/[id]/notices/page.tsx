import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { AppFrame } from "@/components/app-frame";
import { BackButton } from "@/components/back-button";
import { DetailBadge } from "@/components/detail-badge";
import { formatLongPeriod, shortRegion } from "@/lib/format";
import { getShow, getShowNotices } from "@/lib/show";
import { NoticeFeed } from "./notice-feed";
import { ParticipationToggle } from "./participation-toggle";
import { ShowHomeTabs } from "./show-home-tabs";

async function Notices({ showId }: { showId: number }) {
  return <NoticeFeed showId={showId} initial={await getShowNotices(showId)} />;
}

export default async function ShowNoticesPage({ params }: PageProps<"/shows/[id]/notices">) {
  const { id } = await params;
  const show = await getShow(id);
  if (!show) notFound();
  const region = shortRegion(show.area);

  return (
    <AppFrame className="pb-32">
      <div className="flex items-center px-3 pt-2.5">
        <BackButton />
        <ParticipationToggle showId={show.id} />
      </div>

      <Link href={`/shows/${show.id}`} aria-label={`${show.name} 공연 정보`} className="press mx-2 mt-1.5 flex gap-3.5 rounded-2xl px-3 py-2">
        <ViewTransition name={`poster-${show.id}`} share="morph" default="none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={show.posterUrl} alt="" data-poster={show.id} className="aspect-[3/4] w-18 shrink-0 rounded-xl bg-pill object-cover" />
        </ViewTransition>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex h-6">
            <Suspense fallback={null}>
              <DetailBadge startDate={show.startDate} endDate={show.endDate} className="h-6 self-start px-2.5 text-xs" />
            </Suspense>
          </div>
          <h1 className="font-display text-[22px] leading-snug">{show.name}</h1>
          <p className="text-sm leading-normal text-muted">
            <b className="text-ink">{formatLongPeriod(show.startDate, show.endDate)}</b>
            {" · "}
            {show.venue}
            {region && `, ${region}`}
          </p>
        </div>
      </Link>

      <Suspense fallback={<ShowHomeTabs />}>
        <Notices showId={show.id} />
      </Suspense>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-paper shadow-[0_-1px_0_var(--color-line)]">
        <div className="mx-auto flex max-w-2xl gap-2 px-3 pt-3 pb-7">
          <button type="button" disabled className="h-14 flex-1 rounded-full bg-pill text-[15px] font-bold text-muted">
            예매 인증 · 곧
          </button>
          <button type="button" disabled className="h-14 flex-[1.4] rounded-full bg-lime text-base font-bold opacity-50">
            건의 남기기 · 곧 열려요
          </button>
        </div>
      </div>
    </AppFrame>
  );
}
