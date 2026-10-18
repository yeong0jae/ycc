"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ShowCard } from "@/components/show-card";
import { todayInSeoul } from "@/lib/format";
import type { Show } from "@/lib/show-types";

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, "");
}

export function ShowSearch({ shows, initialQuery }: { shows: Show[]; initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const keyword = normalize(query);
  const results = keyword
    ? shows.filter((show) =>
        normalize(`${show.name} ${show.venue} ${show.area ?? ""} ${show.cast ?? ""}`).includes(keyword),
      )
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
    window.scrollTo({ top: top - searchBar.current.getBoundingClientRect().height, behavior });
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
      <div ref={searchBar} className="sticky top-0 z-10 flex items-center gap-2 bg-paper px-3 pt-2.5 pb-3">
        <div className="relative flex-1">
          <label htmlFor="show-search" className="sr-only">
            페스티벌 검색
          </label>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m20 20-4.2-4.2" />
          </svg>
          <input
            id="show-search"
            type="search"
            value={query}
            onChange={(event) => search(event.target.value)}
            placeholder="페스티벌, 출연진, 지역"
            autoComplete="off"
            className="h-12 w-full rounded-full bg-pill pr-12 pl-11 text-[15px] outline-none placeholder:text-muted focus:ring-2 focus:ring-ink [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => search("")}
              className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center text-muted"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>
        <Link
          href="/find/map"
          aria-label="지도로 보기"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-pill"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />
          </svg>
        </Link>
      </div>

      <div className="px-3">
        {keyword && (
          <p aria-live="polite" className="pb-3 text-sm text-muted">
            {results.length > 0 ? `${results.length}개` : `‘${query}’에 맞는 페스티벌이 없어요.`}
          </p>
        )}
        {shows.length === 0 && <p className="py-16 text-center text-sm text-muted">아직 띄운 페스티벌이 없어요.</p>}
        {past.length > 0 && (
          <ul aria-label="지난 페스티벌" className="grid grid-cols-2 gap-x-2.5 gap-y-4.5 opacity-50 sm:grid-cols-3">
            {past.map((show) => (
              <li key={show.id}>
                <ShowCard show={show} />
              </li>
            ))}
          </ul>
        )}
        {past.length > 0 && upcoming.length > 0 && (
          <div ref={divider} aria-hidden="true" className="flex items-center gap-2 py-5 text-muted">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs">↑ 지난 페스티벌</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        )}
        {upcoming.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-2.5 gap-y-4.5 sm:grid-cols-3">
            {upcoming.map((show) => (
              <li key={show.id}>
                <ShowCard show={show} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        inert={!todayDirection}
        onClick={() =>
          scrollToToday(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth")
        }
        className={`fixed bottom-26 left-1/2 z-20 flex h-11 -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-bold text-stub shadow-[0_4px_16px_rgb(17_17_17/0.25)] transition duration-200 active:scale-95 motion-reduce:transition-none ${
          todayDirection ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={todayDirection === "down" ? "rotate-180" : ""}
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        {todayDirection === "down" ? "다가오는 페스티벌" : "오늘"}
      </button>
    </>
  );
}
