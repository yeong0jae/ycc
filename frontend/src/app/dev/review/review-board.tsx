"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  kopisUrl,
  REVIEW_LABELS,
  type ReviewItem,
  type ReviewList,
  type ReviewStatus,
  reviewPath,
} from "@/lib/dev-types";
import { ZoomableImage } from "@/components/zoomable-image";
import { formatPeriod } from "@/lib/format";
import type { ShowKind } from "@/lib/show-types";

const STATUSES: ReviewStatus[] = ["PENDING", "VISIBLE", "HIDDEN"];
const KINDS: { key: ShowKind; label: string }[] = [
  { key: "FESTIVAL", label: "페스티벌" },
  { key: "CONCERT", label: "콘서트" },
];
const SWIPE = 80;

type Decision = { item: ReviewItem; index: number; from: ReviewStatus; to: ReviewStatus };

function firstUpcoming(items: ReviewItem[], today: string) {
  const index = items.findIndex((it) => it.show.startDate >= today);
  return items[index >= 0 ? index : items.length - 1]?.show.id ?? null;
}

function actionLabel(target: ReviewStatus) {
  return target === "PENDING" ? "대기로" : REVIEW_LABELS[target];
}

export function ReviewBoard({ initial, today }: { initial: ReviewList; today: string }) {
  const [status, setStatus] = useState<ReviewStatus>("PENDING");
  const [kind, setKind] = useState<ShowKind>("FESTIVAL");
  const [items, setItems] = useState(initial.items);
  const [counts, setCounts] = useState(initial.counts);
  const [currentId, setCurrentId] = useState(() => firstUpcoming(initial.items, today));
  const [history, setHistory] = useState<Decision[]>([]);
  const [error, setError] = useState<string | null>(null);
  const queue = useRef<HTMLDivElement>(null);
  const divider = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const index = items.findIndex((it) => it.show.id === currentId);
  const current = index >= 0 ? items[index] : null;
  const total = counts.PENDING + counts.VISIBLE + counts.HIDDEN;
  const done = total - counts.PENDING;
  const targets = STATUSES.filter((it) => it !== status);
  const dividerAt = items.findIndex((it) => it.show.startDate >= today);
  const last = history[history.length - 1];

  useLayoutEffect(() => {
    if (queue.current && divider.current) queue.current.scrollTop = divider.current.offsetTop - queue.current.offsetTop;
  }, [status, kind]);

  useEffect(() => {
    queue.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest" });
  }, [currentId]);

  const put = async (ids: number[], target: ReviewStatus) => {
    const res = await fetch("/api/dev/shows/review", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids, status: target }),
    });
    if (!res.ok) setError("저장하지 못했어요. 새로고침 후 다시 시도해 주세요.");
    return res.ok;
  };

  const move = useCallback(
    (delta: number) => {
      const next = items[index + delta];
      if (next) setCurrentId(next.show.id);
    },
    [items, index],
  );

  const decide = useCallback(
    (target: ReviewStatus) => {
      if (!current || target === status) return;
      const next = items[index + 1] ?? items[index - 1] ?? null;
      setItems((prev) => prev.filter((it) => it.show.id !== current.show.id));
      setCounts((prev) => ({ ...prev, [status]: prev[status] - 1, [target]: prev[target] + 1 }));
      setHistory((prev) => [...prev, { item: current, index, from: status, to: target }]);
      setCurrentId(next?.show.id ?? null);
      setError(null);
      put([current.show.id], target);
    },
    [current, items, index, status],
  );

  const undo = useCallback(() => {
    if (!last) return;
    setHistory((prev) => prev.slice(0, -1));
    setItems((prev) => [...prev.slice(0, last.index), last.item, ...prev.slice(last.index)]);
    setCounts((prev) => ({ ...prev, [last.to]: prev[last.to] - 1, [last.from]: prev[last.from] + 1 }));
    setCurrentId(last.item.show.id);
    put([last.item.show.id], last.from);
  }, [last]);

  const switchTo = async (target: ReviewStatus, targetKind: ShowKind) => {
    if (target === status && targetKind === kind) return;
    const res = await fetch(reviewPath(target, targetKind));
    if (!res.ok) return setError("목록을 불러오지 못했어요.");
    const body: ReviewList = await res.json();
    setStatus(target);
    setKind(targetKind);
    setItems(body.items);
    setCounts(body.counts);
    setHistory([]);
    setCurrentId(firstUpcoming(body.items, today));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "j" || key === "s") move(1);
      else if (key === "k") move(-1);
      else if (key === "v") decide("VISIBLE");
      else if (key === "x") decide("HIDDEN");
      else if (key === "z") undo();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, decide, undo]);

  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) decide(dx > 0 ? "VISIBLE" : "HIDDEN");
    else if (dy > SWIPE) move(-1);
    else if (dy < -SWIPE) move(1);
  };

  const shortcut = (target: ReviewStatus) => (target === "VISIBLE" ? "V" : target === "HIDDEN" ? "X" : null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-4 border-b border-line px-4 lg:px-6">
        <nav aria-label="공연 종류" className="flex gap-1.5 text-[13px] font-semibold">
          {KINDS.map((it) => (
            <button
              key={it.key}
              type="button"
              aria-pressed={kind === it.key}
              onClick={() => switchTo(status, it.key)}
              className={`h-9 cursor-pointer rounded-full px-3 ${kind === it.key ? "bg-ink text-stub" : "bg-pill"}`}
            >
              {it.label}
            </button>
          ))}
        </nav>
        <div className="hidden flex-1 items-center gap-2.5 lg:flex">
          <span className="h-1.5 max-w-80 flex-1 overflow-hidden rounded-full bg-line">
            <span className="block h-full bg-ink" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </span>
          <span className="font-mono text-[13px] text-muted">
            {done} / {total} 처리
          </span>
        </div>
        <nav aria-label="검수 상태" className="ml-auto flex gap-1.5 text-[13px] font-semibold">
          {STATUSES.map((it) => (
            <button
              key={it}
              type="button"
              aria-pressed={status === it}
              onClick={() => switchTo(it, kind)}
              className={`h-9 cursor-pointer rounded-full px-3 ${status === it ? "bg-ink text-stub" : "bg-pill"}`}
            >
              {REVIEW_LABELS[it]} {counts[it]}
            </button>
          ))}
        </nav>
      </div>
      <div className="h-1 bg-line lg:hidden">
        <span className="block h-full bg-ink" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-75 shrink-0 flex-col border-r border-line lg:flex">
          <div className="flex justify-between border-b border-line px-4 py-3 text-xs text-muted">
            <span>시작일 순</span>
            <span>↑ 올리면 지난 날짜</span>
          </div>
          <div ref={queue} className="min-h-0 flex-1 overflow-y-auto">
            {items.map((item, i) => {
              const active = item.show.id === currentId;
              const past = item.show.startDate < today;
              return (
                <div key={item.show.id}>
                  {i === dividerAt && (
                    <div ref={divider} aria-hidden="true" className="flex items-center gap-2 px-4 py-2.5 text-muted">
                      <span className="flex-1 border-t-2 border-dashed border-line" />
                      <span className="font-mono text-[11px]">TODAY {formatPeriod(today, today)}</span>
                      <span className="flex-1 border-t-2 border-dashed border-line" />
                    </div>
                  )}
                  <button
                    type="button"
                    aria-current={active}
                    onClick={() => setCurrentId(item.show.id)}
                    className={`flex w-full cursor-pointer items-center gap-2.5 border-b border-[#E3E5E9] px-4 py-2.5 text-left ${
                      active ? "bg-pill shadow-[inset_3px_0_0_var(--color-ink)]" : ""
                    } ${past && !active ? "opacity-55" : ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.show.posterUrl} alt="" loading="lazy" className="h-10 w-7.5 shrink-0 rounded object-cover" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="line-clamp-2 text-[13px] leading-snug font-semibold">{item.show.name}</span>
                      <span className="font-mono text-[11px] text-muted">
                        {formatPeriod(item.show.startDate, item.show.endDate)}
                      </span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        <section
          className="min-w-0 flex-1 overflow-y-auto p-4 pb-48 lg:p-6"
          onTouchStart={(event) => (touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY })}
          onTouchEnd={onTouchEnd}
        >
          {!current ? (
            <p className="py-20 text-center text-sm text-muted">{REVIEW_LABELS[status]} 상태인 {kind === "CONCERT" ? "콘서트가" : "페스티벌이"} 없어요.</p>
          ) : (
            <article className="flex flex-col gap-5 lg:flex-row lg:gap-6">
              <ZoomableImage src={current.show.posterUrl} label="포스터 크게 보기" className="w-full lg:w-75 lg:shrink-0 lg:self-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.show.posterUrl}
                  alt={`${current.show.name} 포스터`}
                  className="max-h-[55dvh] w-full rounded-2xl bg-line object-contain lg:max-h-none"
                />
              </ZoomableImage>
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="flex gap-1.5">
                    {current.area && (
                      <span className="rounded-full bg-[#E3E5E9] px-2.5 py-0.5 text-xs font-semibold">{current.area}</span>
                    )}
                    {current.show.startDate < today && (
                      <span className="rounded-full bg-line px-2.5 py-0.5 text-xs text-muted">지난 날짜</span>
                    )}
                  </span>
                  <h1 className="font-display text-2xl leading-snug lg:text-[26px]">{current.show.name}</h1>
                </div>
                <dl className="grid grid-cols-[72px_minmax(0,1fr)] gap-y-2.5 text-sm leading-relaxed">
                  <dt className="text-muted">기간</dt>
                  <dd className="font-mono">{formatPeriod(current.show.startDate, current.show.endDate)}</dd>
                  <dt className="text-muted">장소</dt>
                  <dd>{current.show.venue}</dd>
                  <dt className="text-muted">회차</dt>
                  <dd>{current.show.scheduleGuide ?? "—"}</dd>
                  <dt className="text-muted">가격</dt>
                  <dd className="whitespace-pre-line">{current.show.priceGuide ?? "—"}</dd>
                  <dt className="text-muted">출연</dt>
                  <dd>{current.cast ?? "—"}</dd>
                </dl>
                <div className="flex flex-wrap gap-2">
                  {current.show.ticketUrl && (
                    <a
                      href={current.show.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 items-center rounded-full bg-pill px-3.5 text-[13px] font-semibold"
                    >
                      예매처 열기 ↗
                    </a>
                  )}
                  <a
                    href={kopisUrl(current.kopisId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 items-center rounded-full bg-pill px-3.5 text-[13px] font-semibold"
                  >
                    KOPIS 원문 ↗
                  </a>
                </div>
              </div>
            </article>
          )}
        </section>

        <aside className="hidden w-85 shrink-0 flex-col gap-3.5 border-l border-line p-6 lg:flex">
          <p className="text-[13px] text-muted">찾기에 띄울까요?</p>
          {targets.map((target) => (
            <button
              key={target}
              type="button"
              disabled={!current}
              onClick={() => decide(target)}
              className={`flex h-16 cursor-pointer items-center justify-center gap-2.5 rounded-2xl text-[17px] font-semibold disabled:opacity-40 ${
                target === "VISIBLE" ? "bg-ink text-stub" : "border-[1.5px] border-ink"
              }`}
            >
              {actionLabel(target)}
              {shortcut(target) && (
                <span
                  className={`rounded-md px-1.5 py-0.5 font-mono text-xs ${target === "VISIBLE" ? "bg-[#2E3139]" : "bg-[#E3E5E9]"}`}
                >
                  {shortcut(target)}
                </span>
              )}
            </button>
          ))}
          <button type="button" onClick={() => move(1)} className="h-11 cursor-pointer text-sm text-muted">
            나중에 보기 · S
          </button>
          <div className="mt-auto flex flex-col gap-2">
            {last && (
              <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-[13px]">
                <span className="min-w-0 flex-1 truncate">
                  {actionLabel(last.to)} · {last.item.show.name}
                </span>
                <button
                  type="button"
                  onClick={undo}
                  className="h-8 shrink-0 cursor-pointer rounded-lg bg-[#E3E5E9] px-2.5 text-xs font-semibold"
                >
                  되돌리기 Z
                </button>
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm font-semibold">
                {error}
              </p>
            )}
            <p className="font-mono text-[11px] text-muted">J / K 이전·다음 · V 띄움 · X 무시 · Z 되돌리기</p>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 flex flex-col gap-2.5 bg-paper px-4 pt-3 pb-7 lg:hidden">
        {last && (
          <button
            type="button"
            onClick={undo}
            className="h-8.5 cursor-pointer self-center rounded-full bg-[#E3E5E9] px-3 text-xs font-semibold"
          >
            {actionLabel(last.to)} · 되돌리기
          </button>
        )}
        {error && (
          <p role="alert" className="text-center text-sm font-semibold">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {[...targets].reverse().map((target) => (
            <button
              key={target}
              type="button"
              disabled={!current}
              onClick={() => decide(target)}
              className={`h-15 cursor-pointer rounded-2xl text-[17px] font-semibold disabled:opacity-40 ${
                target === "VISIBLE" ? "bg-ink text-stub" : "border-[1.5px] border-ink bg-stub"
              }`}
            >
              {actionLabel(target)}
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-muted">좌우로 밀어 결정 · 아래로 밀면 이전 날짜</p>
      </div>
    </div>
  );
}
