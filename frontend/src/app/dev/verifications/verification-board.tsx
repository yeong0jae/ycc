"use client";

import { useState } from "react";
import { type DevVerification, type DevVerifications, REJECT_LABELS, REJECT_REASONS, type RejectReason } from "@/lib/verification-types";

type Filter = "PENDING" | "ALL";

const STATUS_LABELS = { PENDING: "확인 중", APPROVED: "승인", REJECTED: "거절" };

function formatAt(value: string) {
  const [date, time] = value.split("T");
  const [, month, day] = date.split("-");
  return `${Number(month)}.${Number(day)} ${time.slice(0, 5)}`;
}

function formatDay(value: string) {
  const [, month, day] = value.split("-");
  return `${Number(month)}.${Number(day)}`;
}

export function VerificationBoard({ initial }: { initial: DevVerifications }) {
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [data, setData] = useState(initial);
  const [selectedId, setSelectedId] = useState<number | null>(initial.items[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (next: Filter) => {
    const res = await fetch(`/api/dev/verifications${next === "PENDING" ? "?status=PENDING" : ""}`);
    if (!res.ok) return setError("불러오지 못했어요. 새로고침해 주세요.");
    const body: DevVerifications = await res.json();
    setData(body);
    setSelectedId((current) => (body.items.some((it) => it.id === current) ? current : (body.items[0]?.id ?? null)));
  };

  const pickFilter = (next: Filter) => {
    setFilter(next);
    setError(null);
    load(next);
  };

  const decide = async (item: DevVerification, decision: "APPROVE" | "REJECT" | "REVOKE", reason?: RejectReason) => {
    setBusy(true);
    const res = await fetch(`/api/dev/verifications/${item.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision, reason }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError("저장하지 못했어요. 새로고침 후 다시 시도해 주세요.");
    setError(null);
    const index = data.items.findIndex((it) => it.id === item.id);
    await load(filter);
    if (filter === "PENDING") setSelectedId(data.items[index + 1]?.id ?? data.items[index - 1]?.id ?? null);
  };

  const selected = data.items.find((it) => it.id === selectedId) ?? null;

  return (
    <div className="flex h-full">
      <div className="flex w-85 shrink-0 flex-col gap-2.5 overflow-y-auto border-r border-line p-4">
        <b className="text-lg">예매 인증</b>
        <div className="flex gap-1.5">
          {(["PENDING", "ALL"] as const).map((it) => (
            <button
              key={it}
              type="button"
              aria-pressed={filter === it}
              onClick={() => pickFilter(it)}
              className={`h-8.5 cursor-pointer rounded-full px-3.5 text-[13px] font-bold ${filter === it ? "bg-ink text-stub" : "bg-pill"}`}
            >
              {it === "PENDING" ? `확인 중 ${data.pending}` : "전체"}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted">{filter === "PENDING" ? "오래된 순" : "최근 순"}</span>
        {data.items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            className={`flex cursor-pointer flex-col gap-1 rounded-[14px] px-4 py-3.5 text-left ${
              item.id === selectedId ? "bg-pill shadow-[inset_0_0_0_2px_var(--color-ink)]" : "bg-[#f7f7f8]"
            }`}
          >
            <span className="flex items-center gap-2">
              <b className="truncate text-sm">{item.showName}</b>
              <span className="ml-auto shrink-0 font-num text-xs font-extrabold text-muted">{formatAt(item.createdAt)}</span>
            </span>
            <span className="text-[13px] text-muted">
              {item.nickname}
              {filter === "ALL" && ` · ${STATUS_LABELS[item.status]}`}
            </span>
          </button>
        ))}
        {data.items.length === 0 && <p className="py-12 text-center text-sm text-muted">{filter === "PENDING" ? "확인할 신청이 없어요." : "신청이 없어요."}</p>}
      </div>

      {selected && (
        <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-6 lg:p-8">
          <div className="flex flex-col gap-1">
            <b className="text-xl">{selected.showName}</b>
            <span className="text-sm text-muted">
              {formatDay(selected.startDate)} — {formatDay(selected.endDate)} · {selected.venue} · 신청한 회원 {selected.nickname} · {formatAt(selected.createdAt)}
            </span>
          </div>
          {selected.hasImage ? (
            <a href={`/api/dev/verifications/${selected.id}/image`} target="_blank" rel="noreferrer" className="self-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/dev/verifications/${selected.id}/image`} alt="개인정보를 가린 예매 내역" className="max-h-[60dvh] w-auto rounded-2xl bg-pill" />
            </a>
          ) : (
            <p className="rounded-2xl bg-[#f7f7f8] px-4 py-3 text-sm text-muted">
              {STATUS_LABELS[selected.status]}
              {selected.rejectReason && ` · ${REJECT_LABELS[selected.rejectReason]}`}
              {selected.decidedAt && ` · ${formatAt(selected.decidedAt)}`} · 캡처는 지워졌어요
            </p>
          )}
          {selected.status === "PENDING" && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => decide(selected, "APPROVE")}
                className="h-12 cursor-pointer rounded-full bg-ink px-7 text-[15px] font-bold text-stub disabled:opacity-50"
              >
                승인
              </button>
              <span className="ml-1 text-[13px] text-muted">거절 사유</span>
              {REJECT_REASONS.map((reason) => (
                <button
                  key={reason.key}
                  type="button"
                  disabled={busy}
                  onClick={() => decide(selected, "REJECT", reason.key)}
                  className="h-8.5 cursor-pointer rounded-full bg-pill px-3 text-[13px] font-bold disabled:opacity-50"
                >
                  {reason.label}
                </button>
              ))}
            </div>
          )}
          {selected.status === "APPROVED" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(selected, "REVOKE")}
              className="h-10 cursor-pointer self-start rounded-full bg-pill px-4 text-[13px] font-bold disabled:opacity-50"
            >
              승인 취소
            </button>
          )}
          <span className="text-xs text-muted">예매번호 · 개인정보는 AI가 가린 뒤 저장돼요 · 승인하거나 거절하면 캡처는 바로 지워져요</span>
          {error && (
            <p role="alert" className="text-[13px] text-[#c0392b]">
              {error}
            </p>
          )}
        </main>
      )}
    </div>
  );
}
