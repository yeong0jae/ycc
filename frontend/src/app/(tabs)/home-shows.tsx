"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, ViewTransition } from "react";
import { LiveBadge } from "@/components/live-badge";
import { JUST_ADDED_KEY } from "@/lib/back-transition";
import { festivalBadge, formatNoticeTime, formatPeriod, shortRegion, todayInSeoul } from "@/lib/format";
import { NOTICE_CHIPS, NOTICE_LABELS, type ParticipatedShow } from "@/lib/notice-types";
import { useParticipated, useSignedIn } from "@/lib/participation";

function Poster({ id, src, className }: { id: number; src: string; className: string }) {
  return (
    <ViewTransition name={`poster-${id}`} share="morph" default="none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" data-poster={id} className={className} />
    </ViewTransition>
  );
}

function TodayCard({ item, order }: { item: ParticipatedShow; order: number }) {
  const { show, latestNotice } = item;
  const badge = festivalBadge(show.startDate, show.endDate);
  return (
    <Link
      href={`/shows/${show.id}/notices`}
      prefetch
      style={{ animationDelay: `${order * 40}ms` }}
      className="press flex animate-rise flex-col gap-3 rounded-3xl bg-ink p-3.5 text-stub motion-reduce:animate-none"
    >
      <span className="flex items-center gap-3">
        <Poster id={show.id} src={show.posterUrl} className="aspect-[3/4] w-16 shrink-0 rounded-xl bg-[#2a2a2e] object-cover" />
        <span className="flex min-w-0 flex-col gap-1.5">
          {badge && <LiveBadge label={badge.label} live={badge.live} className="h-5.5 self-start px-2 text-xs" />}
          <span className="truncate text-lg font-bold">{show.name}</span>
          <span className="truncate text-[13px] text-[#b9b9c0]">
            {formatPeriod(show.startDate, show.endDate)}
            {shortRegion(show.area) && ` · ${shortRegion(show.area)}`}
          </span>
        </span>
      </span>
      {latestNotice && (
        <span className="flex flex-col gap-1 rounded-2xl bg-[#2a2a2e] px-3.5 py-3">
          <span className="flex items-center gap-2">
            <span className={`flex h-5 items-center rounded-full px-2 text-[11px] font-bold text-ink ${NOTICE_CHIPS[latestNotice.kind]}`}>
              {NOTICE_LABELS[latestNotice.kind]}
            </span>
            <span suppressHydrationWarning className="font-num text-xs font-extrabold text-[#b9b9c0]">
              {formatNoticeTime(latestNotice.createdAt)}
            </span>
            <span className="ml-auto text-xs font-bold text-lime">공지 {item.noticeCount}</span>
          </span>
          <span className="line-clamp-2 text-[15px] leading-snug font-medium">{latestNotice.title}</span>
        </span>
      )}
    </Link>
  );
}

function ShowRow({ item, order, past = false }: { item: ParticipatedShow; order: number; past?: boolean }) {
  const { show } = item;
  const badge = festivalBadge(show.startDate, show.endDate);
  const region = shortRegion(show.area);
  return (
    <Link
      href={`/shows/${show.id}/notices`}
      prefetch
      style={{ animationDelay: `${order * 40}ms` }}
      className={`press flex animate-rise items-center gap-3 rounded-[20px] bg-pill p-2.5 motion-reduce:animate-none ${past ? "opacity-50" : ""}`}
    >
      <Poster id={show.id} src={show.posterUrl} className="aspect-[3/4] w-12 shrink-0 rounded-[10px] bg-cream object-cover" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-bold">{show.name}</span>
        <span className="truncate text-[13px] text-muted">
          {formatPeriod(show.startDate, show.endDate)}
          {region && ` · ${region}`}
        </span>
      </span>
      {badge && <span className="flex h-6.5 shrink-0 items-center rounded-full bg-paper px-2.5 font-num text-[13px] font-black">{badge.label}</span>}
    </Link>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-3.5 px-7 pt-24 text-center">
      <span className="flex size-28 items-center justify-center rounded-full bg-pill">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 8h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" />
          <path d="M14 8v10" strokeDasharray="2 2" />
        </svg>
      </span>
      <p className="text-lg font-bold">공연에 참여해 보세요</p>
      <p className="text-sm leading-relaxed text-muted">
        참여한 공연은 여기에 모여요.
        <br />
        공지를 바로 볼 수 있어요.
      </p>
      <Link href="/find" className="press mt-1.5 flex h-13 items-center rounded-full bg-ink px-6 text-[15px] font-bold text-stub">
        공연 찾아보기
      </Link>
    </div>
  );
}

function takeJustAdded() {
  try {
    const id = sessionStorage.getItem(JUST_ADDED_KEY);
    sessionStorage.removeItem(JUST_ADDED_KEY);
    return id ? Number(id) : null;
  } catch {
    return null;
  }
}

export function HomeShows() {
  const ids = useParticipated();
  const signedIn = useSignedIn();
  const key = ids?.join(",") ?? "";
  const [loaded, setLoaded] = useState<{ key: string; items: ParticipatedShow[]; justAdded: number | null } | null>(null);

  useEffect(() => {
    if (!key) return;
    let alive = true;
    fetch(`/api/shows/participated?ids=${key}`)
      .then((res) => (res.ok ? (res.json() as Promise<ParticipatedShow[]>) : []))
      .catch(() => [])
      .then((items) => alive && setLoaded({ key, items, justAdded: takeJustAdded() }));
    return () => {
      alive = false;
    };
  }, [key]);

  const highlighted = useRef<HTMLDivElement>(null);
  const justAdded = loaded?.justAdded ?? null;

  useLayoutEffect(() => {
    const el = highlighted.current;
    if (!el) return;
    const { top, bottom } = el.getBoundingClientRect();
    if (top < 0 || bottom > window.innerHeight - 100) el.scrollIntoView({ block: "center", behavior: "instant" });
  }, [justAdded]);

  if (ids === null) return null;
  if (ids.length === 0) return <Empty />;
  if (!loaded) return null;

  const wrap = (id: number, radius: string, node: React.ReactNode) => (
    <div
      key={id}
      ref={id === justAdded ? highlighted : undefined}
      className={id === justAdded ? `animate-flash motion-reduce:animate-none ${radius}` : undefined}
    >
      {node}
    </div>
  );

  const today = todayInSeoul();
  const items = loaded.items;
  const ongoing = items.filter((it) => it.show.startDate <= today && it.show.endDate >= today);
  const upcoming = items.filter((it) => it.show.startDate > today);
  const past = items.filter((it) => it.show.endDate < today).reverse();

  return (
    <div className="flex flex-col gap-2.5 px-3.5 pt-1">
      {ongoing.map((item, i) => wrap(item.show.id, "rounded-3xl", <TodayCard item={item} order={i} />))}
      {upcoming.length > 0 && <p className="mx-1.5 mt-2.5 text-[13px] font-bold text-muted">다가오는</p>}
      {upcoming.map((item, i) => wrap(item.show.id, "rounded-[20px]", <ShowRow item={item} order={ongoing.length + i} />))}
      {past.length > 0 && <p className="mx-1.5 mt-2.5 text-[13px] font-bold text-muted">지난</p>}
      {past.map((item, i) => wrap(item.show.id, "rounded-[20px]", <ShowRow item={item} order={ongoing.length + upcoming.length + i} past />))}
      {signedIn === false && <p className="mx-1.5 mt-2.5 text-xs leading-relaxed text-muted">참여한 공연은 이 기기에만 저장돼요.</p>}
    </div>
  );
}
