"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Notice, ShowNotices } from "@/lib/notice-types";

export function UrgentLine({ showId }: { showId: number }) {
  const [urgent, setUrgent] = useState<Notice | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/shows/${showId}/notices`)
      .then((res) => (res.ok ? (res.json() as Promise<ShowNotices>) : null))
      .then((body) => alive && setUrgent(body?.urgent ?? null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [showId]);

  if (!urgent) return null;
  return (
    <Link
      href={`/shows/${showId}/notices`}
      className="press mx-3 mt-3.5 flex animate-rise items-center gap-2.5 rounded-2xl bg-ink px-3.5 py-3 text-stub motion-reduce:animate-none"
    >
      <span className="flex h-5.5 shrink-0 items-center rounded-full bg-lime px-2 text-[11px] font-bold text-ink">긴급</span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{urgent.title}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
