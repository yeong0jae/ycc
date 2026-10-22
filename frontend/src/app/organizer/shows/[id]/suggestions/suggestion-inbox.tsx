"use client";

import { useEffect, useState } from "react";
import { SourceChip, SuggestionTime } from "@/components/suggestion-card";
import type { Suggestion } from "@/lib/suggestion-types";

type Filter = "open" | "all";

const TOAST_MS = 2500;

function StateChip({ suggestion }: { suggestion: Suggestion }) {
  if (suggestion.hidden) return <span className="flex h-5.5 shrink-0 items-center rounded-full bg-ink px-2 text-xs font-bold text-stub">숨김</span>;
  if (suggestion.reply) return <span className="flex h-5.5 shrink-0 items-center rounded-full bg-pill px-2 text-xs font-bold text-muted">답함</span>;
  return <span className="flex h-5.5 shrink-0 items-center rounded-full bg-lime px-2 text-xs font-bold">답 안 함</span>;
}

export function SuggestionInbox({ showId, initial, initialEnabled }: { showId: number; initial: Suggestion[]; initialEnabled: boolean }) {
  const [items, setItems] = useState(initial);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [filter, setFilter] = useState<Filter>("open");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const base = `/api/organizer/shows/${showId}/suggestions`;
  const open = items.filter((it) => !it.reply && !it.hidden);
  const shown = filter === "open" ? open : items;
  const selected = items.find((it) => it.id === selectedId) ?? null;

  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await fetch(base).catch(() => null);
      if (res?.ok) setItems(await res.json());
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [base]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const select = (suggestion: Suggestion) => {
    setSelectedId(suggestion.id);
    setReply(suggestion.reply?.body ?? "");
    setError(null);
  };

  const replace = (next: Suggestion) => setItems((current) => current.map((it) => (it.id === next.id ? next : it)));

  const send = async (path: string, body: object) => {
    const res = await fetch(`${base}/${selectedId}/${path}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const problem = await res.json().catch(() => null);
      throw new Error(problem?.message || "저장하지 못했어요. 다시 시도해 주세요.");
    }
    return (await res.json()) as Suggestion;
  };

  const saveReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || saving || !reply.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const next = await send("reply", { body: reply });
      replace(next);
      setToast(selected.reply ? "답변을 고쳤어요" : "답변을 올렸어요");
      setSelectedId(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async () => {
    const res = await fetch(`${base}/enabled`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    }).catch(() => null);
    if (!res?.ok) return setToast("바꾸지 못했어요");
    const next: boolean = (await res.json()).enabled;
    setEnabled(next);
    setToast(next ? "문의를 켰어요" : "문의를 껐어요");
  };

  const toggleHidden = async () => {
    if (!selected) return;
    try {
      const next = await send("hidden", { hidden: !selected.hidden });
      replace(next);
      setToast(next.hidden ? "관객 화면에서 숨겼어요" : "다시 보이게 했어요");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const detail = selected && (
    <form onSubmit={saveReply} className="flex flex-col gap-3.5">
      <span className="flex items-center gap-2">
        <SourceChip suggestion={selected} />
        <SuggestionTime at={selected.createdAt} />
        <button
          type="button"
          onClick={toggleHidden}
          className="ml-auto h-9 cursor-pointer rounded-full px-3.5 text-[13px] font-bold text-muted shadow-[inset_0_0_0_1.5px_var(--color-line)]"
        >
          {selected.hidden ? "다시 보이기" : "숨기기"}
        </button>
        <button type="button" onClick={() => setSelectedId(null)} className="h-9 cursor-pointer px-1 text-sm text-muted lg:hidden">
          닫기
        </button>
      </span>
      <p className="text-base leading-relaxed break-words whitespace-pre-wrap lg:text-[17px]">{selected.body}</p>
      {selected.image && (
        <a href={selected.image.url} target="_blank" rel="noreferrer" className="self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.image.url} alt="문의 사진" className="max-h-60 rounded-xl bg-pill" />
        </a>
      )}
      <label className="mt-1 flex flex-col gap-2">
        <b className="text-sm">답변</b>
        <textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          maxLength={1000}
          rows={5}
          placeholder="관객에게 보일 답변을 적어 주세요"
          className="resize-none rounded-2xl bg-pill px-4 py-3.5 text-[15px] leading-relaxed outline-none placeholder:text-muted focus:ring-2 focus:ring-ink"
        />
      </label>
      <p className="-mt-1.5 text-xs text-muted">답변은 관객 화면에 &quot;주최측 답변&quot;으로 바로 보여요. 나중에 고칠 수 있어요.</p>
      {error && (
        <p role="alert" className="text-sm text-muted">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={saving || !reply.trim()}
        className="press h-12 cursor-pointer self-stretch rounded-full bg-ink px-6.5 text-[15px] font-bold text-stub disabled:opacity-40 lg:self-start"
      >
        {selected.reply ? "답변 고치기" : "답변 올리기"}
      </button>
      <p className="hidden rounded-[14px] bg-[#f7f7f8] px-4 py-3.5 text-[13px] leading-relaxed text-[#444449] lg:block">
        <b className="text-ink">숨기기</b> · 욕설·광고처럼 관객에게 보이면 안 되는 문의를 내려요. 기록은 남고 &quot;전체&quot;에서 다시 보이게 할 수 있어요.
      </p>
    </form>
  );

  return (
    <div className="lg:flex lg:h-full">
      <section className="flex flex-col lg:w-115 lg:shrink-0 lg:overflow-y-auto lg:shadow-[inset_-1px_0_0_var(--color-line)]">
        <label className="mx-4 mt-4 flex cursor-pointer items-center gap-3 rounded-2xl bg-[#f7f7f8] py-3.5 pr-3 pl-4 lg:mx-4.5 lg:mt-5.5">
          <span className="flex flex-1 flex-col gap-0.5">
            <b className="text-sm">관객 문의 받기</b>
            <span className="text-xs leading-normal text-muted">
              {enabled ? "현장 QR이 열려 있고, 공연 홈에 문의 탭이 보여요." : "켜면 현장 QR이 생기고, 공연 홈에 문의 탭이 생겨요."}
            </span>
          </span>
          <input type="checkbox" checked={enabled} onChange={toggleEnabled} className="sr-only" />
          <span className={`flex h-7 w-12 shrink-0 rounded-full p-0.75 transition-colors ${enabled ? "justify-end bg-ink" : "bg-line"}`}>
            <span className="size-5.5 rounded-full bg-paper" />
          </span>
        </label>
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 lg:px-4.5 lg:pt-5.5">
          <h1 className="hidden font-display text-xl lg:block">문의</h1>
          <div role="group" aria-label="보기" className="flex gap-0.5 rounded-full bg-pill p-0.75 lg:ml-auto">
            {(
              [
                ["open", "답 안 한 것", open.length],
                ["all", "전체", items.length],
              ] as const
            ).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={`flex h-8.5 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold ${
                  filter === key ? "bg-paper shadow-[0_1px_3px_rgb(17_17_17/0.12)]" : "text-muted"
                }`}
              >
                {label} <span className="font-num font-black">{count}</span>
              </button>
            ))}
          </div>
        </div>
        <ul className="flex flex-col shadow-[inset_0_1px_0_#eeeef1]">
          {shown.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                onClick={() => select(suggestion)}
                aria-current={suggestion.id === selectedId ? "true" : undefined}
                className={`flex w-full cursor-pointer flex-col gap-1.5 px-4.5 py-3.5 text-left ${
                  suggestion.id === selectedId ? "bg-[#f7f7f8] shadow-[inset_3px_0_0_var(--color-ink)]" : "shadow-[inset_0_-1px_0_#eeeef1]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <StateChip suggestion={suggestion} />
                  <SourceChip suggestion={suggestion} />
                  <SuggestionTime at={suggestion.createdAt} />
                  {suggestion.image && <span className="text-xs text-muted">· 사진 1</span>}
                </span>
                <span className="line-clamp-2 text-sm leading-normal">{suggestion.body}</span>
              </button>
            </li>
          ))}
        </ul>
        {shown.length === 0 && (
          <p className="py-16 text-center text-sm text-muted">{filter === "open" ? "답할 문의가 없어요." : "아직 올라온 문의가 없어요."}</p>
        )}
      </section>

      <section className="hidden min-w-0 flex-1 px-8 py-6.5 lg:block">
        <div className="max-w-160">{detail || <p className="pt-10 text-sm text-muted">왼쪽에서 문의를 고르면 답할 수 있어요.</p>}</div>
      </section>

      {selected && (
        <>
          <div aria-hidden="true" onClick={() => setSelectedId(null)} className="fixed inset-0 z-30 bg-ink/40 lg:hidden" />
          <div className="fixed inset-x-0 bottom-0 z-30 max-h-[85dvh] overflow-y-auto rounded-t-[26px] bg-paper px-5 pt-5 pb-7 shadow-[0_-8px_24px_rgb(17_17_17/0.12)] lg:hidden">
            {detail}
          </div>
        </>
      )}

      {toast && (
        <p
          role="status"
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4.5 py-3 text-sm font-bold whitespace-nowrap text-stub shadow-[0_4px_16px_rgb(17_17_17/0.25)]"
        >
          <span className="flex size-4.5 items-center justify-center rounded-full bg-lime text-[11px] text-ink">✓</span>
          {toast}
        </p>
      )}
    </div>
  );
}
