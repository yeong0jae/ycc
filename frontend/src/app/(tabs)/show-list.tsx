"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, ViewTransition } from "react";
import { formatDday, formatPeriod, todayInSeoul } from "@/lib/format";
import type { Show } from "@/lib/show";

const SEARCH_BAR_TOP = 80;

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, "");
}

function ShowCard({ show, ended }: { show: Show; ended: boolean }) {
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

export function ShowList({ shows, initialQuery }: { shows: Show[]; initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const keyword = normalize(query);
  const results = keyword
    ? shows.filter((show) => normalize(`${show.name} ${show.venue}`).includes(keyword))
    : shows;
  const today = todayInSeoul();
  const past = results.filter((show) => show.endDate < today);
  const upcoming = results.filter((show) => show.endDate >= today);

  const searchBar = useRef<HTMLDivElement>(null);
  const divider = useRef<HTMLDivElement>(null);
  const [todayDirection, setTodayDirection] = useState<"up" | "down" | null>(null);

  const scrollToToday = (behavior: ScrollBehavior) => {
    if (!divider.current || !searchBar.current) {
      window.scrollTo({ top: 0, behavior });
      return;
    }
    const top = divider.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - searchBar.current.getBoundingClientRect().height - SEARCH_BAR_TOP, behavior });
  };

  useLayoutEffect(() => scrollToToday("instant"), [keyword]);

  useEffect(() => {
    const update = () => {
      if (!divider.current || !searchBar.current) return setTodayDirection(null);
      const { top, bottom } = divider.current.getBoundingClientRect();
      const visibleTop = searchBar.current.getBoundingClientRect().bottom;
      if (bottom < visibleTop) setTodayDirection("up");
      else if (top > window.innerHeight) setTodayDirection("down");
      else setTodayDirection(null);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [keyword]);

  const search = (value: string) => {
    setQuery(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("q", value);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  };

  return (
    <>
      <div ref={searchBar} className="sticky top-20 z-[5] -mx-4 mb-4 bg-paper px-4 pt-2 pb-3">
        <div className="relative">
          <label htmlFor="show-search" className="sr-only">
            콘서트 검색
          </label>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="show-search"
            type="search"
            value={query}
            onChange={(event) => search(event.target.value)}
            placeholder="공연명, 아티스트, 장소"
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-line bg-stub pr-12 pl-11 text-[15px] outline-none placeholder:text-muted focus:border-ink [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => search("")}
              className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center text-muted"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>
        {keyword && (
          <p aria-live="polite" className="mt-2 text-sm text-muted">
            {results.length > 0 ? `${results.length}개` : `‘${query}’에 맞는 콘서트가 없어요.`}
          </p>
        )}
      </div>
      {shows.length === 0 && <p className="text-muted">예정된 콘서트가 없어요.</p>}
      {past.length > 0 && (
        <ul aria-label="이전 공연" className="grid gap-3 opacity-60 grayscale sm:grid-cols-2">
          {past.map((show) => (
            <li key={show.id}>
              <ShowCard show={show} ended />
            </li>
          ))}
        </ul>
      )}
      {past.length > 0 && upcoming.length > 0 && (
        <div ref={divider} aria-hidden="true" className="flex items-center gap-3 py-5 text-muted">
          <span className="flex-1 border-t-2 border-dashed border-line" />
          <span className="flex items-center gap-1 text-xs font-semibold">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            이전 공연
          </span>
          <span className="flex-1 border-t-2 border-dashed border-line" />
        </div>
      )}
      {upcoming.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {upcoming.map((show) => (
            <li key={show.id}>
              <ShowCard show={show} ended={false} />
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        inert={!todayDirection}
        onClick={() =>
          scrollToToday(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth")
        }
        className={`fixed bottom-28 left-1/2 z-20 flex h-11 -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-stub shadow-[0_4px_16px_rgb(17_19_24/0.25)] transition duration-200 active:scale-95 motion-reduce:transition-none ${
          todayDirection ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={todayDirection === "down" ? "rotate-180" : ""}
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        {todayDirection === "down" ? "다가오는 공연" : "오늘"}
      </button>
    </>
  );
}
