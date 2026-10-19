"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ShowCard } from "@/components/show-card";
import { RESTORE_KEY, SCROLL_KEY } from "@/lib/back-transition";
import { type Show, type ShowKind, type ShowPage, type ShowPeriod, showsQuery } from "@/lib/show-types";

const SEARCH_DELAY_MS = 250;
const LOAD_MARGIN = "800px 0px";

type Feed = { items: Show[]; page: number; hasNext: boolean; total: number };

function toFeed({ items, hasNext, total }: ShowPage): Feed {
  return { items, page: 0, hasNext, total };
}

async function fetchPage(kind: ShowKind, q: string, period: ShowPeriod, page: number): Promise<ShowPage> {
  const res = await fetch(`/api/shows?${showsQuery({ kind, q, period, page })}`);
  if (!res.ok) throw new Error(`공연 목록 조회 실패: ${res.status}`);
  return res.json();
}

export function ShowSearch({
  kind,
  initialQuery,
  initialPast,
  initialUpcoming,
}: {
  kind: ShowKind;
  initialQuery: string;
  initialPast: ShowPage;
  initialUpcoming: ShowPage;
}) {
  const scrollKey = `${SCROLL_KEY}:${kind}`;
  const [query, setQuery] = useState(initialQuery);
  const [searched, setSearched] = useState(initialQuery);
  const [past, setPast] = useState(() => toFeed(initialPast));
  const [upcoming, setUpcoming] = useState(() => toFeed(initialUpcoming));
  const [version, setVersion] = useState(0);
  const pastItems = [...past.items].reverse();

  const searchBar = useRef<HTMLDivElement>(null);
  const divider = useRef<HTMLDivElement>(null);
  const topSentinel = useRef<HTMLDivElement>(null);
  const bottomSentinel = useRef<HTMLDivElement>(null);
  const latestQuery = useRef(initialQuery);
  const loading = useRef<Record<ShowPeriod, boolean>>({ PAST: false, UPCOMING: false });
  const anchor = useRef<{ height: number; y: number } | null>(null);
  const [todayDirection, setTodayDirection] = useState<"up" | "down" | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const scrollToToday = (behavior: ScrollBehavior) => {
    if (!divider.current || !searchBar.current) {
      window.scrollTo({ top: 0, behavior });
      return;
    }
    const top = divider.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - searchBar.current.getBoundingClientRect().bottom, behavior });
  };

  useLayoutEffect(() => {
    const saved = sessionStorage.getItem(scrollKey);
    const restore = sessionStorage.getItem(RESTORE_KEY);
    sessionStorage.removeItem(RESTORE_KEY);
    if (restore && saved) {
      window.scrollTo({ top: Number(saved), behavior: "instant" });
      return;
    }
    scrollToToday("instant");
  }, [version, scrollKey]);

  useLayoutEffect(() => {
    if (!anchor.current) return;
    const { height, y } = anchor.current;
    anchor.current = null;
    window.scrollTo({ top: y + document.documentElement.scrollHeight - height, behavior: "instant" });
  }, [past]);

  useEffect(() => {
    if (query === searched) return;
    const timer = setTimeout(async () => {
      try {
        const [nextPast, nextUpcoming] = await Promise.all([
          fetchPage(kind, query, "PAST", 0),
          fetchPage(kind, query, "UPCOMING", 0),
        ]);
        if (latestQuery.current !== query) return;
        setPast(toFeed(nextPast));
        setUpcoming(toFeed(nextUpcoming));
        setSearched(query);
        setVersion((it) => it + 1);
      } catch {}
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query, searched, kind]);

  const loadMore = async (period: ShowPeriod) => {
    const feed = period === "PAST" ? past : upcoming;
    if (!feed.hasNext || loading.current[period]) return;
    loading.current[period] = true;
    try {
      const next = await fetchPage(kind, searched, period, feed.page + 1);
      if (latestQuery.current !== searched) return;
      const append = (prev: Feed) => ({
        items: [...prev.items, ...next.items],
        page: prev.page + 1,
        hasNext: next.hasNext,
        total: next.total,
      });
      if (period === "PAST") {
        anchor.current = { height: document.documentElement.scrollHeight, y: window.scrollY };
        setPast(append);
      } else {
        setUpcoming(append);
      }
    } catch {
    } finally {
      loading.current[period] = false;
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) loadMore(entry.target === topSentinel.current ? "PAST" : "UPCOMING");
        }),
      { rootMargin: LOAD_MARGIN },
    );
    [topSentinel.current, bottomSentinel.current].forEach((it) => it && observer.observe(it));
    return () => observer.disconnect();
  });

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 4);
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
  }, [version]);

  const search = (value: string) => {
    setQuery(value);
    latestQuery.current = value;
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("q", value);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  };

  return (
    <>
      <div aria-hidden="true" className="h-[58px]" />
      <div
        ref={searchBar}
        className={`sticky top-[58px] z-10 flex items-center gap-2 bg-paper px-3 pt-2 pb-3 transition-shadow duration-200 ${
          scrolled ? "shadow-[0_1px_0_var(--color-line)]" : ""
        }`}
      >
        <div className="relative flex-1">
          <label htmlFor="show-search" className="sr-only">
            공연 검색
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
            placeholder="공연, 출연진, 지역"
            autoComplete="off"
            className="h-12 w-full rounded-full bg-pill pr-12 pl-11 text-[15px] outline-none placeholder:text-muted focus:ring-2 focus:ring-ink [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => search("")}
              className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center text-muted transition-opacity duration-150 active:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div
        className="px-3"
        onClickCapture={() => sessionStorage.setItem(scrollKey, String(window.scrollY))}
      >
        {searched && (
          <p aria-live="polite" className="pb-3 text-sm text-muted">
            {past.total + upcoming.total > 0 ? `${past.total + upcoming.total}개` : `‘${searched}’에 맞는 공연이 없어요.`}
          </p>
        )}
        {!searched && past.total + upcoming.total === 0 && (
          <p className="py-16 text-center text-sm text-muted">아직 띄운 공연이 없어요.</p>
        )}
        <div ref={topSentinel} aria-hidden="true" />
        {pastItems.length > 0 && (
          <ul aria-label="지난 공연" className="grid grid-cols-2 gap-x-2.5 gap-y-4.5 opacity-50 sm:grid-cols-3">
            {pastItems.map((show) => (
              <li key={show.id}>
                <ShowCard show={show} />
              </li>
            ))}
          </ul>
        )}
        {pastItems.length > 0 && upcoming.items.length > 0 && (
          <div ref={divider} aria-hidden="true" className="flex items-center gap-2 py-5 text-muted">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs">↑ 지난 공연</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        )}
        {upcoming.items.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-2.5 gap-y-4.5 sm:grid-cols-3">
            {upcoming.items.map((show) => (
              <li key={show.id}>
                <ShowCard show={show} />
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomSentinel} aria-hidden="true" />
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
        {todayDirection === "down" ? "다가오는 공연" : "오늘"}
      </button>
    </>
  );
}
