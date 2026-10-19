"use client";

import { useState } from "react";
import { REQUEST_LABELS, requestsPath, type ShowRequestList, type ShowRequestStatus } from "@/lib/dev-types";

const STATUSES: ShowRequestStatus[] = ["PENDING", "DONE", "IGNORED"];

function formatCreatedAt(value: string) {
  const [date, time] = value.split("T");
  const [, month, day] = date.split("-");
  return `${Number(month)}.${Number(day)} ${time.slice(0, 5)}`;
}

function actionLabel(target: ShowRequestStatus) {
  return target === "PENDING" ? "대기로" : REQUEST_LABELS[target];
}

export function RequestBoard({ initial }: { initial: ShowRequestList }) {
  const [status, setStatus] = useState<ShowRequestStatus>("PENDING");
  const [items, setItems] = useState(initial.items);
  const [counts, setCounts] = useState(initial.counts);
  const [error, setError] = useState<string | null>(null);

  const switchTo = async (target: ShowRequestStatus) => {
    if (target === status) return;
    const res = await fetch(requestsPath(target));
    if (!res.ok) return setError("목록을 불러오지 못했어요.");
    const body: ShowRequestList = await res.json();
    setStatus(target);
    setItems(body.items);
    setCounts(body.counts);
    setError(null);
  };

  const decide = async (id: number, target: ShowRequestStatus) => {
    const res = await fetch(`/api/dev/show-requests/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: target }),
    });
    if (!res.ok) return setError("저장하지 못했어요. 새로고침 후 다시 시도해 주세요.");
    setItems((prev) => prev.filter((it) => it.id !== id));
    setCounts((prev) => ({ ...prev, [status]: prev[status] - 1, [target]: prev[target] + 1 }));
    setError(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-4 border-b border-line px-4 lg:px-6">
        <nav aria-label="요청 상태" className="flex gap-1.5 text-[13px] font-semibold">
          {STATUSES.map((it) => (
            <button
              key={it}
              type="button"
              aria-pressed={status === it}
              onClick={() => switchTo(it)}
              className={`h-9 cursor-pointer rounded-full px-3 ${status === it ? "bg-ink text-stub" : "bg-pill"}`}
            >
              {REQUEST_LABELS[it]} {counts[it]}
            </button>
          ))}
        </nav>
        {error && (
          <p role="alert" className="text-sm font-semibold">
            {error}
          </p>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted">{REQUEST_LABELS[status]} 상태인 요청이 없어요.</p>
        ) : (
          <ul className="mx-auto flex max-w-3xl flex-col px-4 lg:px-6">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 border-b border-line py-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <span className="shrink-0 rounded-full bg-pill px-2.5 py-0.5 text-xs font-semibold">
                      {item.kind === "CONCERT" ? "콘서트" : "페스티벌"}
                    </span>
                    <span className="truncate font-semibold">{item.name}</span>
                  </span>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="truncate text-sm underline">
                      {item.url} ↗
                    </a>
                  )}
                  <span className="text-xs text-muted">
                    {item.member ? (item.nickname ?? "회원") : "비회원"} · {formatCreatedAt(item.createdAt)}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {STATUSES.filter((it) => it !== status).map((target) => (
                    <button
                      key={target}
                      type="button"
                      onClick={() => decide(item.id, target)}
                      className={`h-9 cursor-pointer rounded-full px-3 text-[13px] font-semibold ${
                        target === "DONE" ? "bg-ink text-stub" : "bg-pill"
                      }`}
                    >
                      {actionLabel(target)}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
