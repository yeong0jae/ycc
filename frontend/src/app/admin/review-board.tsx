"use client";

import { useEffect, useRef, useState } from "react";
import { REVIEW_LABELS, type ReviewPage, type ReviewStatus, reviewPath } from "@/lib/admin-types";
import { formatPeriod } from "@/lib/format";

const STATUSES: ReviewStatus[] = ["PENDING", "VISIBLE", "HIDDEN"];
const PAGE_SIZE = 50;

export function ReviewBoard({ initial }: { initial: ReviewPage }) {
  const [status, setStatus] = useState<ReviewStatus>("PENDING");
  const [items, setItems] = useState(initial.items);
  const [hasNext, setHasNext] = useState(initial.hasNext);
  const [counts, setCounts] = useState(initial.counts);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const fetchPage = async (target: ReviewStatus, page: number): Promise<ReviewPage | null> => {
    const res = await fetch(reviewPath(target, page));
    return res.ok ? res.json() : null;
  };

  const switchTo = async (target: ReviewStatus) => {
    setStatus(target);
    setSelected(new Set());
    setItems([]);
    const body = await fetchPage(target, 0);
    if (!body) return;
    setItems(body.items);
    setHasNext(body.hasNext);
    setCounts(body.counts);
  };

  useEffect(() => {
    if (!hasNext || !sentinel.current) return;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || busy.current) return;
        busy.current = true;
        try {
          const body = await fetchPage(status, Math.floor(items.length / PAGE_SIZE));
          if (!body) return;
          setItems((prev) => {
            const seen = new Set(prev.map((it) => it.show.id));
            return [...prev, ...body.items.filter((it) => !seen.has(it.show.id))];
          });
          setHasNext(body.hasNext);
        } finally {
          busy.current = false;
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasNext, status, items.length]);

  const review = async (ids: number[], target: ReviewStatus) => {
    setError(null);
    const res = await fetch("/api/admin/shows/review", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids, status: target }),
    });
    if (!res.ok) {
      setError("바꾸지 못했어요. 다시 시도해 주세요.");
      return;
    }
    const moved = new Set(ids);
    setItems((prev) => prev.filter((it) => !moved.has(it.show.id)));
    setCounts((prev) => ({ ...prev, [status]: prev[status] - ids.length, [target]: prev[target] + ids.length }));
    setSelected(new Set());
  };

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = items.length > 0 && items.every((it) => selected.has(it.show.id));
  const targets = STATUSES.filter((it) => it !== status);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-5 pb-28 sm:px-6">
      <div role="group" aria-label="검수 상태" className="flex self-start rounded-full border border-line bg-stub p-1">
        {STATUSES.map((it) => (
          <button
            key={it}
            type="button"
            aria-pressed={status === it}
            onClick={() => switchTo(it)}
            className={`h-9 cursor-pointer rounded-full px-3.5 text-sm font-semibold ${status === it ? "bg-ink text-stub" : ""}`}
          >
            {REVIEW_LABELS[it]} <span className="font-mono font-medium">{counts[it]}</span>
          </button>
        ))}
      </div>

      {items.length > 0 && (
        <label className="flex h-11 cursor-pointer items-center gap-3 self-start text-sm">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((it) => it.show.id)))}
            className="size-4.5 accent-ink"
          />
          불러온 {items.length}개 전체 선택
        </label>
      )}

      {items.length === 0 && <p className="py-10 text-center text-sm text-muted">{REVIEW_LABELS[status]} 상태인 페스티벌이 없어요.</p>}

      <ul className="flex flex-col gap-2">
        {items.map(({ show }) => (
          <li key={show.id} className="flex items-center gap-3 rounded-2xl bg-stub p-3">
            <input
              type="checkbox"
              aria-label={`${show.name} 선택`}
              checked={selected.has(show.id)}
              onChange={() => toggle(show.id)}
              className="size-4.5 shrink-0 accent-ink"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={show.posterUrl} alt="" loading="lazy" className="h-16 w-12 shrink-0 rounded-md object-cover" />
            <a
              href={`/shows/${show.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 flex-1 flex-col gap-0.5"
            >
              <span className="text-[15px] leading-snug font-semibold">{show.name}</span>
              <span className="truncate text-xs text-muted">
                <span className="font-mono">{formatPeriod(show.startDate, show.endDate)}</span> · {show.venue}
              </span>
            </a>
            <div className="flex shrink-0 gap-1.5">
              {targets.map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => review([show.id], target)}
                  className={`h-10 cursor-pointer rounded-full px-3.5 text-[13px] font-semibold ${
                    target === "VISIBLE" ? "bg-ink text-stub" : "border border-line"
                  }`}
                >
                  {target === "PENDING" ? "대기로" : REVIEW_LABELS[target]}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {hasNext && (
        <div ref={sentinel} className="py-6 text-center text-sm text-muted">
          불러오는 중…
        </div>
      )}

      {error && (
        <p role="alert" className="text-center text-sm font-semibold">
          {error}
        </p>
      )}

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 sm:px-6">
            <span className="flex-1 text-sm font-semibold">{selected.size}개 선택</span>
            {targets.map((target) => (
              <button
                key={target}
                type="button"
                onClick={() => review([...selected], target)}
                className={`h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold ${
                  target === "VISIBLE" ? "bg-ink text-stub" : "border border-line bg-stub"
                }`}
              >
                {target === "PENDING" ? "대기로" : `${REVIEW_LABELS[target]}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
