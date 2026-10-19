"use client";

import { useEffect, useState } from "react";
import type { OrganizerShow } from "@/lib/dev-types";
import { formatPeriod } from "@/lib/format";

const SEARCH_DELAY_MS = 250;

export function ShowPicker({ value, onChange }: { value: OrganizerShow | null; onChange: (show: OrganizerShow | null) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrganizerShow[]>([]);

  useEffect(() => {
    if (value) return;
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/dev/organizers/shows?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query, value]);

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-pill px-4 py-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{value.name}</span>
          <span className="font-mono text-xs text-muted">{formatPeriod(value.startDate, value.endDate)}</span>
        </span>
        <button type="button" onClick={() => onChange(null)} className="h-8 shrink-0 cursor-pointer rounded-full bg-paper px-3 text-xs font-semibold">
          다시 고르기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="띄움인 공연 이름으로 찾기"
        aria-label="공연 찾기"
        className="h-11 rounded-full bg-pill px-4 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-ink"
      />
      <ul className="max-h-56 overflow-y-auto rounded-2xl border border-line">
        {results.length === 0 && <li className="px-4 py-3 text-sm text-muted">고를 수 있는 공연이 없어요.</li>}
        {results.map((show) => (
          <li key={show.id}>
            <button
              type="button"
              onClick={() => onChange(show)}
              className="flex w-full cursor-pointer items-center gap-2 border-b border-line px-4 py-2.5 text-left last:border-b-0 hover:bg-pill"
            >
              <span className="min-w-0 flex-1 truncate text-sm">{show.name}</span>
              <span className="shrink-0 font-mono text-xs text-muted">{formatPeriod(show.startDate, show.endDate)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
