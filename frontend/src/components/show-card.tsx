import Link from "next/link";
import { ViewTransition } from "react";
import { festivalBadge, formatPeriod, shortRegion } from "@/lib/format";
import type { Show } from "@/lib/show-types";

export function ShowCard({ show }: { show: Show }) {
  const badge = festivalBadge(show.startDate, show.endDate);
  const region = shortRegion(show.area);
  return (
    <Link href={`/shows/${show.id}`} prefetch className="group flex min-w-0 flex-col gap-2">
      <span className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-pill">
        <ViewTransition name={`poster-${show.id}`} share="morph" default="none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={show.posterUrl}
            alt={`${show.name} 포스터`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-200 ease-out group-active:scale-[0.98] motion-reduce:transition-none"
          />
        </ViewTransition>
        {badge && (
          <span
            className={`absolute top-2 left-2 flex h-6 items-center rounded-full px-2 font-num text-xs ${
              badge.live ? "bg-lime text-ink" : "bg-stub/92 text-ink"
            }`}
          >
            {badge.label}
          </span>
        )}
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
