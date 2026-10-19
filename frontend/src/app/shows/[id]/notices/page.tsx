import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { AppFrame } from "@/components/app-frame";
import { BackButton } from "@/components/back-button";
import { DetailBadge } from "@/components/detail-badge";
import { TabBar } from "@/components/tab-bar";
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

      <TabBar />
    </AppFrame>
  );
}
