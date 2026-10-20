"use client";

import { useState } from "react";
import { REPORT_REASONS, type Reported } from "@/lib/community-types";

function formatAt(value: string) {
  const [date, time] = value.split("T");
  const [, month, day] = date.split("-");
  return `${Number(month)}.${Number(day)} ${time.slice(0, 5)}`;
}

export function ReportBoard({ initial }: { initial: Reported[] }) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const decide = async (item: Reported, hidden: boolean) => {
    const res = await fetch(`/api/dev/community/${item.type}/${item.id}/hidden`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hidden }),
    });
    if (!res.ok) return setError("저장하지 못했어요. 새로고침 후 다시 시도해 주세요.");
    setItems((prev) => prev.filter((it) => !(it.type === item.type && it.id === item.id)));
    setError(null);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 lg:px-6">
        <b className="text-sm">확인할 신고 {items.length}</b>
        {error && (
          <p role="alert" className="text-[13px] text-muted">
            {error}
          </p>
        )}
      </div>
      <ul className="mx-auto flex w-full max-w-3xl flex-col gap-2.5 p-4">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`} className="flex flex-col gap-2 rounded-2xl bg-pill p-4">
            <span className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
              <b className="text-ink">{item.type === "POST" ? "글" : "댓글"}</b>
              {item.hidden && <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-stub">숨김</span>}
              <a href={`/shows/${item.showId}/community/${item.postId}`} target="_blank" rel="noreferrer" className="underline">
                {item.showName}
              </a>
              <span>
                {item.author} · {formatAt(item.createdAt)}
              </span>
            </span>
            <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{item.body}</p>
            <span className="flex flex-wrap gap-1.5 text-xs">
              {REPORT_REASONS.filter((reason) => item.reasons[reason.key]).map((reason) => (
                <span key={reason.key} className="rounded-full bg-paper px-2.5 py-1 font-bold">
                  {reason.label} {item.reasons[reason.key]}
                </span>
              ))}
              <span className="px-1 py-1 text-muted">마지막 신고 {formatAt(item.lastReportedAt)}</span>
            </span>
            <span className="flex gap-2 pt-1">
              <button type="button" onClick={() => decide(item, true)} className="h-9 cursor-pointer rounded-full bg-ink px-4 text-[13px] font-bold text-stub">
                숨기기
              </button>
              <button type="button" onClick={() => decide(item, false)} className="h-9 cursor-pointer rounded-full bg-paper px-4 text-[13px] font-bold">
                {item.hidden ? "다시 보이기" : "문제없음"}
              </button>
            </span>
          </li>
        ))}
        {items.length === 0 && <p className="py-16 text-center text-sm text-muted">확인할 신고가 없어요.</p>}
      </ul>
    </div>
  );
}
