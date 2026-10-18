"use client";

import { useEffect, useRef, useState } from "react";
import { ShowCard } from "@/components/show-card";
import { type Show, type ShowPage, type ShowWhen, showSearchPath } from "@/lib/show-types";

export function ShowSearch({
  initialQuery,
  initialWhen,
  initial,
}: {
  initialQuery: string;
  initialWhen: ShowWhen;
  initial: ShowPage;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [when, setWhen] = useState(initialWhen);
  const [shows, setShows] = useState<Show[]>(initial.items);
  const [hasNext, setHasNext] = useState(initial.hasNext);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const first = useRef(true);
  const busy = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const load = async (q: string, w: ShowWhen, nextPage: number) => {
    busy.current = true;
    setLoading(true);
    try {
      const res = await fetch(showSearchPath(q, w, nextPage));
      if (!res.ok) return;
      const body: ShowPage = await res.json();
      setShows((prev) => (nextPage === 0 ? body.items : [...prev, ...body.items]));
      setHasNext(body.hasNext);
      setPage(nextPage);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasNext || !sentinel.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !busy.current) load(query, when, page + 1);
      },
      { rootMargin: "600px" },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasNext, query, when, page]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const url = new URL(window.location.href);
    if (query.trim()) url.searchParams.set("q", query.trim());
    else url.searchParams.delete("q");
    if (when === "UPCOMING") url.searchParams.delete("when");
    else url.searchParams.set("when", when.toLowerCase());
    window.history.replaceState(null, "", url);
    const timer = setTimeout(() => load(query, when, 0), 250);
    return () => clearTimeout(timer);
  }, [query, when]);

  return (
    <>
      <div className="sticky top-20 z-[5] -mx-4 mb-4 flex flex-col gap-3 bg-paper px-4 pt-2 pb-3">
        <div className="relative">
          <label htmlFor="show-search" className="sr-only">
            공연 검색
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
            onChange={(event) => setQuery(event.target.value)}
            placeholder="페스티벌 이름"
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-line bg-stub pr-12 pl-11 text-[15px] outline-none placeholder:text-muted focus:border-ink [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => setQuery("")}
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
        <div role="group" aria-label="공연 시기" className="flex self-start rounded-full border border-line bg-stub p-1">
          {(
            [
              ["ONGOING", "진행 중"],
              ["UPCOMING", "다가오는"],
              ["PAST", "지난"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={when === value}
              onClick={() => setWhen(value)}
              className={`h-9 cursor-pointer rounded-full px-3.5 text-sm font-semibold ${
                when === value ? "bg-ink text-stub" : "text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {shows.length === 0 && !loading && (
        <p aria-live="polite" className="py-10 text-center text-sm text-muted">
          {query.trim() ? `‘${query.trim()}’에 맞는 페스티벌이 없어요.` : "페스티벌이 없어요."}
        </p>
      )}
      <ul className={`grid gap-3 sm:grid-cols-2 ${loading && page === 0 ? "opacity-60" : ""}`}>
        {shows.map((show) => (
          <li key={show.id}>
            <ShowCard show={show} ended={when === "PAST"} />
          </li>
        ))}
      </ul>
      {hasNext && (
        <div ref={sentinel} aria-live="polite" className="py-6 text-center text-sm text-muted">
          불러오는 중…
        </div>
      )}
    </>
  );
}
