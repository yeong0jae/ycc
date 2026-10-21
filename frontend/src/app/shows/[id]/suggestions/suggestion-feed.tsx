"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { SuggestionItem } from "@/components/suggestion-card";
import { ShieldIcon } from "@/components/verified-mark";
import { resizeImage } from "@/lib/resize-image";
import { useVerification } from "@/lib/verification";
import { SUGGESTION_MAX, type ShowSuggestions } from "@/lib/suggestion-types";
import { REJECT_LABELS } from "@/lib/verification-types";
import { ShowHomeTabs } from "../show-home-tabs";
import { TabSwipe } from "../tab-swipe";

const TOAST_MS = 2500;

function QrIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e8283c" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </svg>
  );
}

function Guide({ title, body, icon = <QrIcon />, children }: { title: string; body: string; icon?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mx-5 mt-4 mb-1 flex flex-col gap-3 rounded-2xl bg-[#f7f7f8] px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-paper">{icon}</span>
        <span className="flex flex-col gap-0.5">
          <b className="text-sm">{title}</b>
          <span className="text-xs leading-normal text-muted">{body}</span>
        </span>
      </div>
      {children}
    </div>
  );
}

function WriterBadge({ ticket }: { ticket: boolean }) {
  return (
    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-stub ${ticket ? "bg-verified-chip" : "bg-muted"}`}>
      {ticket ? (
        <ShieldIcon size={18} />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
        </svg>
      )}
    </span>
  );
}

export function SuggestionFeed({ showId, showName, initial }: { showId: number; showName: string; initial: ShowSuggestions }) {
  const [data, setData] = useState(initial);
  const mine = useVerification(showId);
  const [fresh, setFresh] = useState<number | null>(null);
  const [writing, setWriting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await fetch(`/api/shows/${showId}/suggestions`).catch(() => null);
      if (res?.ok) setData(await res.json());
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [showId]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.url);
  }, [photo]);

  const open = () => {
    setError(null);
    setWriting(true);
  };
  const close = () => setWriting(false);

  const ticket = data.writeSource === "TICKET";
  const writer = ticket ? "예매 인증 관객" : "현장 QR 관객";
  const verification = mine === undefined ? data.verification : mine;

  const pick = (file: File | undefined) => {
    if (!file) return;
    setPhoto({ file, url: URL.createObjectURL(file) });
  };

  const submit = async () => {
    if (sending || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("body", body);
      if (photo) form.set("file", await resizeImage(photo.file), "photo.jpg");
      const res = await fetch(`/api/shows/${showId}/suggestions`, { method: "POST", body: form });
      if (!res.ok) {
        const problem = await res.json().catch(() => null);
        setError(problem?.message || "올리지 못했어요. 다시 시도해 주세요.");
        return;
      }
      const created = await res.json();
      setData((current) => ({ ...current, items: [created, ...current.items], total: current.total + 1 }));
      setFresh(created.id);
      setBody("");
      setPhoto(null);
      close();
      setToast(true);
    } catch {
      setError("올리지 못했어요. 다시 시도해 주세요.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <ShowHomeTabs showId={showId} active="suggestions" count={data.total} />
      <TabSwipe prev={`/shows/${showId}/map`} next={`/shows/${showId}/community`} className="flex min-h-[60dvh] flex-col">
        {data.write === "OPEN" && (
          <>
            <button type="button" onClick={open} className="flex cursor-pointer items-center gap-3 px-5 py-3.5 text-left shadow-[inset_0_-1px_0_#eeeef1]">
              <WriterBadge ticket={ticket} />
              <span className="flex min-w-0 flex-1 flex-col">
                <b className="truncate text-sm">{writer}</b>
                <span className="truncate text-sm text-[#9a9aa2]">궁금하거나 불편한 점을 남겨요</span>
              </span>
              <span className="flex h-8.5 shrink-0 items-center rounded-full px-3.5 text-[13px] font-bold shadow-[inset_0_0_0_1px_var(--color-line)]">문의하기</span>
            </button>
            {!ticket && verification?.status === "PENDING" && (
              <p className="flex items-center gap-1 px-5 pt-2 text-xs font-bold text-muted">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                예매 인증 확인 중 · 보통 하루 안에 끝나요
              </p>
            )}
            {!ticket && verification?.status === "REJECTED" && (
              <p className="flex items-center gap-1 px-5 pt-2 text-xs font-bold text-[#c21f33]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7.5v5.5M12 16.5v.01" />
                </svg>
                예매 인증을 다시 해 주세요 · {REJECT_LABELS[verification.rejectReason ?? "OTHER"]}
              </p>
            )}
            {!ticket && !verification && (
              <p className="flex items-center gap-1 px-5 pt-2 text-xs text-verified">
                <ShieldIcon size={12} />
                위의 예매 인증을 하면 예매 인증 관객으로 올라가요
              </p>
            )}
          </>
        )}
        {data.write === "NO_PASS" && verification?.status === "PENDING" && (
          <Guide icon={<ClockIcon />} title="예매 인증 확인 중이에요" body="보통 하루 안에 끝나요. 확인되면 여기서 바로 문의를 남길 수 있어요." />
        )}
        {data.write === "NO_PASS" && verification?.status === "REJECTED" && (
          <Guide
            icon={<WarnIcon />}
            title="예매 인증을 다시 해 주세요"
            body={`사유 · ${REJECT_LABELS[verification.rejectReason ?? "OTHER"]}. 위의 다시 인증에서 공연 이름 · 날짜 · 예매 상태가 보이게 올려 주세요.`}
          />
        )}
        {data.write === "NO_PASS" && !verification && (
          <Guide icon={<ShieldIcon size={22} />} title="예매했다면 문의를 남길 수 있어요" body="위의 예매 인증에서 캡처를 올리면 확인 뒤 열려요. 현장에선 QR을 찍어도 돼요." />
        )}

        <div className="flex flex-col px-5">
          {data.items.map((suggestion) => (
            <div key={suggestion.id} className={suggestion.id === fresh ? "animate-rise motion-reduce:animate-none" : ""}>
              <SuggestionItem suggestion={suggestion} />
            </div>
          ))}
          {data.total === 0 && <p className="py-16 text-center text-sm text-muted">아직 올라온 문의가 없어요.</p>}
        </div>
      </TabSwipe>

      {writing && (
        <BottomSheet label="문의 남기기" onClose={close} className="h-[92dvh]">
          <div className="flex h-full flex-col">
            <div className="flex h-14 shrink-0 items-center px-4 shadow-[inset_0_-1px_0_#eeeef1]">
              <button type="button" onClick={close} className="h-10 cursor-pointer px-1 text-[15px]">
                취소
              </button>
              <h2 className="mx-auto text-base font-bold">문의 남기기</h2>
              <span className="w-10" />
            </div>
            <div className="flex min-h-0 flex-1 gap-3 overflow-y-auto px-5 pt-4">
              <div className="flex flex-col items-center">
                <WriterBadge ticket={ticket} />
                <span className="mt-1.5 w-0.5 flex-1 rounded-full bg-line" />
              </div>
              <div className="min-w-0 flex-1 pb-6">
                <div className="flex items-center gap-1.5">
                  <b className="truncate text-[15px]">{writer}</b>
                  <span className="shrink-0 text-xs text-muted">(으)로 올라가요 · 이름은 안 보여요</span>
                </div>
                <p className="mt-0.5 text-xs text-muted">{showName} 주최측에 전해지고, 누구나 볼 수 있어요</p>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  maxLength={SUGGESTION_MAX}
                  rows={5}
                  autoFocus
                  aria-label="문의 내용"
                  placeholder="궁금한 점이나 불편한 점을 적어 주세요"
                  className="mt-3 block w-full resize-none text-[15px] leading-normal outline-none placeholder:text-[#9a9aa2]"
                />
                {photo && (
                  <div className="relative mt-2.5 w-30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="붙인 사진" className="h-40 w-30 rounded-xl bg-pill object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      aria-label="사진 빼기"
                      className="absolute top-1.5 right-1.5 flex size-5.5 cursor-pointer items-center justify-center rounded-full bg-ink/60 text-[11px] text-stub"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={photo !== null}
                  className="mt-3 flex h-8 cursor-pointer items-center gap-2 text-[13px] text-[#9a9aa2] disabled:opacity-40"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="16" rx="3" />
                    <circle cx="9" cy="10" r="2" />
                    <path d="m21 16-5-5-9 9" />
                  </svg>
                  사진 {photo ? 1 : 0} / 1
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(event) => {
                    pick(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                {error && (
                  <p role="alert" className="mt-2 text-sm text-muted">
                    {error}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center px-4 pt-3 pb-7 shadow-[inset_0_1px_0_#eeeef1]">
              <span className="font-num text-[13px] font-extrabold text-[#9a9aa2]">
                {body.length} / {SUGGESTION_MAX}
              </span>
              <button
                type="button"
                onClick={submit}
                disabled={sending || !body.trim()}
                className="press ml-auto h-10 cursor-pointer rounded-full bg-ink px-5 text-sm font-bold text-stub disabled:opacity-35"
              >
                {sending ? "올리는 중" : "올리기"}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      <p
        role="status"
        className={`pointer-events-none fixed bottom-40 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4.5 py-3 text-sm font-bold whitespace-nowrap text-stub shadow-[0_4px_16px_rgb(17_17_17/0.25)] transition duration-200 motion-reduce:transition-none ${
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <span className="flex size-4.5 items-center justify-center rounded-full bg-lime text-[11px] text-ink">✓</span>
        문의를 남겼어요
      </p>
    </>
  );
}
