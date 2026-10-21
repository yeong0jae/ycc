import Link from "next/link";
import { Suspense, ViewTransition } from "react";
import { BackButton } from "@/components/back-button";
import { DetailBadge } from "@/components/detail-badge";
import { KAKAO_LOGIN_URL } from "@/lib/auth";
import { formatLongPeriod, shortRegion } from "@/lib/format";
import { posterProps } from "@/lib/poster";
import type { Show } from "@/lib/show-types";
import { ParticipationToggle } from "./participation-toggle";
import { SHOW_HOME_HEADER_ID, TopBar } from "./top-bar";
import { VerificationButton } from "./verification-button";

export function ShowHomeTop({ show }: { show: Show }) {
  const region = shortRegion(show.area);
  return (
    <>
      <TopBar title={show.name} leading={<BackButton />} trailing={
          <>
            <VerificationButton showId={show.id} showName={show.name} loginUrl={KAKAO_LOGIN_URL} />
            <ParticipationToggle showId={show.id} />
          </>
        }
      />

      <Link
        id={SHOW_HOME_HEADER_ID}
        href={`/shows/${show.id}`}
        aria-label={`${show.name} 공연 정보`}
        className="press mx-2 flex gap-3.5 rounded-2xl px-3 py-2"
      >
        <ViewTransition name={`poster-${show.id}`} share="morph" default="none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img {...posterProps(show.posterUrl, "72px")} alt="" data-poster={show.id} className="aspect-[3/4] w-18 shrink-0 rounded-xl bg-pill object-cover" />
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
    </>
  );
}
