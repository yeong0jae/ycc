"use client";

import { useEffect, useRef, useState } from "react";
import type { ShowKind } from "@/lib/show-types";

const kinds: { key: ShowKind; label: string }[] = [
  { key: "FESTIVAL", label: "페스티벌" },
  { key: "CONCERT", label: "콘서트" },
];

const TOAST_MS = 2500;

const inputClass = "h-12 rounded-full bg-pill px-5 text-[15px] outline-none placeholder:text-muted focus:ring-2 focus:ring-ink";

export function RequestButton({ kind }: { kind: ShowKind }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(kind);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const open = () => {
    setSelected(kind);
    setError(null);
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSending(true);
    setError(null);
    const res = await fetch("/api/show-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: selected, name: form.get("name"), url: form.get("url") || null }),
    });
    setSending(false);
    if (res.ok) {
      formElement.reset();
      close();
      setToast(true);
      return;
    }
    const body = await res.json().catch(() => null);
    setError(body?.message || "보내지 못했어요. 다시 시도해 주세요.");
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="공연 추가 요청"
        className="press flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-pill"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="request-title"
        onClick={(event) => event.target === dialog.current && close()}
        className="sheet inset-x-0 top-auto bottom-0 mx-auto mb-0 max-h-[90dvh] w-full max-w-2xl rounded-t-3xl bg-paper p-0 text-ink"
      >
        <div className="flex flex-col gap-5 px-5 pt-6 pb-8">
          <h2 id="request-title" className="font-display text-xl">
            공연 추가 요청
          </h2>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div role="group" aria-label="종류" className="flex gap-1.5">
              {kinds.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  aria-pressed={selected === it.key}
                  onClick={() => setSelected(it.key)}
                  className={`press h-10 cursor-pointer rounded-full px-4 text-sm font-bold ${
                    selected === it.key ? "bg-ink text-stub" : "bg-pill"
                  }`}
                >
                  {it.label}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">공연 이름</span>
              <input name="name" required maxLength={100} autoComplete="off" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">
                링크 <span className="font-normal text-muted">(선택)</span>
              </span>
              <input
                name="url"
                type="url"
                maxLength={500}
                placeholder="예매처나 공식 페이지 주소"
                autoComplete="off"
                className={inputClass}
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-muted">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={sending}
              className="press mt-1 h-13 cursor-pointer rounded-full bg-ink font-bold text-stub disabled:opacity-50"
            >
              요청 보내기
            </button>
          </form>
        </div>
      </dialog>
      <p
        role="status"
        className={`pointer-events-none fixed bottom-40 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-4 py-3 text-sm font-semibold whitespace-nowrap text-stub shadow-[0_4px_16px_rgb(17_17_17/0.25)] transition duration-200 motion-reduce:transition-none ${
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        요청을 보냈어요. 확인하고 추가할게요.
      </p>
    </>
  );
}
