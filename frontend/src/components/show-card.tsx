import Link from "next/link";
import { ViewTransition } from "react";
import { formatDday, formatPeriod } from "@/lib/format";
import type { Show } from "@/lib/show-types";

export function ShowCard({ show, ended }: { show: Show; ended: boolean }) {
  return (
    <Link
      href={`/shows/${show.id}`}
      prefetch
      className="relative flex min-h-37 overflow-hidden rounded-2xl bg-stub transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/10 active:translate-y-0 active:scale-[0.98] active:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
    >
      <ViewTransition name={`poster-${show.id}`} share="morph" default="none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={show.posterUrl}
          alt={`${show.name} 포스터`}
          loading="lazy"
          className="w-27 shrink-0 object-cover"
        />
      </ViewTransition>
      <div className="my-3.5 border-l-2 border-dashed border-line" />
      <div className="absolute -top-2.5 left-24.75 size-5 rounded-full bg-paper" />
      <div className="absolute -bottom-2.5 left-24.75 size-5 rounded-full bg-paper" />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
        <div>
          <p className="font-display text-lg leading-snug tracking-tight">{show.name}</p>
          <p className="text-sm text-muted">{show.venue}</p>
        </div>
        <div className="flex items-center justify-between font-mono text-[13px]">
          <span>{formatPeriod(show.startDate, show.endDate)}</span>
          {ended ? (
            <span className="rounded-full bg-line px-2.5 py-0.5 text-muted">END</span>
          ) : (
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-stub">
              {formatDday(show.startDate)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
