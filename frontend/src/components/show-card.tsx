import Link from "next/link";
import { ViewTransition } from "react";
import { LiveBadge } from "@/components/live-badge";
import { PosterImage } from "@/components/poster-image";
import { festivalBadge, formatPeriod, shortRegion } from "@/lib/format";
import type { Show } from "@/lib/show-types";

export function ShowCard({ show }: { show: Show }) {
  const badge = festivalBadge(show.startDate, show.endDate);
  const region = shortRegion(show.area);
  return (
    <Link href={`/shows/${show.id}`} prefetch className="press flex min-w-0 flex-col gap-2">
      <span className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-pill">
        <ViewTransition name={`poster-${show.id}`} share="morph" default="none">
          <PosterImage
            src={show.posterUrl}
            alt={`${show.name} 포스터`}
            loading="lazy"
            data-poster={show.id}
            className="size-full object-cover"
          />
        </ViewTransition>
        {badge && <LiveBadge label={badge.label} live={badge.live} className="absolute top-2 left-2 h-6 px-2 text-xs" />}
      </span>
      <span className="flex flex-col gap-0.5 px-0.5">
        <span className="line-clamp-2 text-[15px] leading-snug font-bold tracking-tight">{show.name}</span>
        <span className="text-[13px] text-muted">
          {formatPeriod(show.startDate, show.endDate)}
          {region && ` · ${region}`}
        </span>
      </span>
    </Link>
  );
}
