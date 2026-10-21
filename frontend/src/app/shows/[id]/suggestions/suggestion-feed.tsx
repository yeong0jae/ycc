"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { LoginSheet } from "@/components/login-sheet";
import { SuggestionItem } from "@/components/suggestion-card";
import { ShieldIcon } from "@/components/verified-mark";
import { resizeImage } from "@/lib/resize-image";
import { SUGGESTION_MAX, type ShowSuggestions } from "@/lib/suggestion-types";
import { lastDay, REJECT_LABELS } from "@/lib/verification-types";
import { VerificationSheet } from "./verification-sheet";
import { ShowHomeTabs } from "../show-home-tabs";
import { TabSwipe } from "../tab-swipe";

const TOAST_MS = 2500;

function formatUntil(at: string) {
  const [, m, d] = at.slice(0, 10).split("-").map(Number);
  const time = at.slice(11, 16);
  return `${m}.${d} ${time === "12:00" ? "정오" : time}`;
}

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

const actionClass = "press flex h-11.5 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-ink text-[15px] font-bold text-stub";

export function SuggestionFeed({
  showId,
  showName,
  initial,
  signedIn,
  loginUrl,
}: {
  showId: number;
  showName: string;
  initial: ShowSuggestions;
  signedIn: boolean;
  loginUrl: string;
}) {
  const [data, setData] = useState(initial);
  const [verifying, setVerifying] = useState(false);
  const [askLogin, setAskLogin] = useState(false);
  const [toastText, setToastText] = useState("건의를 남겼어요");
  const [fresh, setFresh] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
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
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  const startVerify = () => (signedIn ? setVerifying(true) : setAskLogin(true));

  const ticket = data.writeSource === "TICKET";
  const verification = data.verification;
  const canVerify = new Date() < new Date(data.verifiableUntil);

  const pick = (file: File | undefined) => {
    if (!file) return;
    setPhoto({ file, url: URL.createObjectURL(file) });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      setToastText("건의를 남겼어요");
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
          <div className="flex flex-col gap-2 px-5 pt-4 pb-1">
            <button
              type="button"
              onClick={open}
              className="press flex h-13 cursor-pointer items-center justify-center gap-2 rounded-full bg-lime text-base font-bold"
            >
              건의 남기기 {!ticket && <span className="text-xs font-medium text-[#444449]">· 로그인 없이</span>}
            </button>
            {ticket ? (
              <p className="flex items-center justify-center gap-1 text-xs text-muted">
                <ShieldIcon size={12} />
                예매 인증됨 · {lastDay(data.writableUntil)}까지 쓸 수 있어요
              </p>
            ) : (
              <>
                <p className="text-center text-xs text-muted">현장 QR로 들어와서 쓸 수 있어요 · {formatUntil(data.writableUntil)}까지</p>
                {verification?.status === "PENDING" && (
                  <p className="flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-muted">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                    예매 인증 확인 중 · 보통 하루 안에 끝나요
                  </p>
                )}
                {verification?.status === "REJECTED" && canVerify && (
                  <button type="button" onClick={startVerify} className="flex cursor-pointer items-center justify-center gap-1 self-center px-2.5 py-1.5 text-xs font-bold text-[#c21f33]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7.5v5.5M12 16.5v.01" />
                    </svg>
                    예매 인증 다시 하기 · {REJECT_LABELS[verification.rejectReason ?? "OTHER"]} <span className="font-medium">›</span>
                  </button>
                )}
                {!verification && canVerify && (
                  <button type="button" onClick={startVerify} className="flex cursor-pointer items-center justify-center gap-1 self-center px-2.5 py-1.5 text-xs font-bold text-verified">
                    <ShieldIcon size={12} />
                    예매했다면 예매 인증하기 <span className="font-medium">›</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}
        {data.write === "NO_PASS" && verification?.status === "PENDING" && (
          <Guide icon={<ClockIcon />} title="예매 인증 확인 중이에요" body="보통 하루 안에 끝나요. 확인되면 여기서 바로 건의를 남길 수 있어요." />
        )}
        {data.write === "NO_PASS" && verification?.status === "REJECTED" && (
          <Guide
            icon={<WarnIcon />}
            title="예매 인증을 다시 해 주세요"
            body={`사유 · ${REJECT_LABELS[verification.rejectReason ?? "OTHER"]}. 공연 이름 · 날짜 · 예매 상태가 보이게 찍어 주세요.`}
          >
            {canVerify && (
              <button type="button" onClick={startVerify} className={actionClass}>
                캡처 다시 올리기
              </button>
            )}
          </Guide>
        )}
        {data.write === "NO_PASS" && !verification && canVerify && (
          <Guide icon={<ShieldIcon size={22} />} title="예매했다면 지금 건의를 남길 수 있어요" body="예매 내역 캡처를 올리면 확인 뒤 열려요. 현장에선 QR을 찍어도 돼요.">
            <button type="button" onClick={startVerify} className={actionClass}>
              <ShieldIcon size={15} />
              예매 인증하고 건의 남기기
            </button>
          </Guide>
        )}
        {data.write === "NO_PASS" && !verification && !canVerify && (
          <Guide title="현장 QR을 찍으면 건의를 쓸 수 있어요" body="입구·부스·화장실에 붙어 있어요. 로그인은 필요 없어요." />
        )}
        {data.write === "CLOSED" &&
          (ticket ? (
            <Guide icon={<ShieldIcon size={22} />} title="건의를 쓸 수 있는 기간이 지났어요" body={`예매 인증 건의는 ${lastDay(data.writableUntil)}까지 쓸 수 있었어요`} />
          ) : (
            <Guide
              title="건의는 공연 기간에만 쓸 수 있어요"
              body={`${formatUntil(data.writableFrom).replace(" 00:00", " 0시")} — ${formatUntil(data.writableUntil)}`}
            />
          ))}

        <div className="flex flex-col px-5">
          {data.items.map((suggestion) => (
            <div key={suggestion.id} className={suggestion.id === fresh ? "animate-rise motion-reduce:animate-none" : ""}>
              <SuggestionItem suggestion={suggestion} />
            </div>
          ))}
          {data.total === 0 && <p className="py-16 text-center text-sm text-muted">아직 올라온 건의가 없어요.</p>}
        </div>
      </TabSwipe>

      <dialog
        ref={dialog}
        aria-labelledby="suggestion-title"
        onClick={(event) => event.target === dialog.current && close()}
        className="sheet inset-x-0 top-auto bottom-0 mx-auto mb-0 max-h-[90dvh] w-full max-w-2xl rounded-t-3xl bg-paper p-0 text-ink"
      >
        <form onSubmit={submit} className="flex flex-col gap-3.5 px-5 pt-6 pb-8">
          <div className="flex items-center">
            <h2 id="suggestion-title" className="font-display text-lg">
              건의 남기기
            </h2>
            <button type="button" onClick={close} className="ml-auto h-9 cursor-pointer px-1 text-sm text-muted">
              닫기
            </button>
          </div>
          <p className="-mt-1.5 text-[13px] text-muted">주최측에 전해져요. 누구나 볼 수 있어요.</p>
          <label className="relative">
            <span className="sr-only">건의 내용</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={SUGGESTION_MAX}
              required
              rows={6}
              placeholder="불편한 점이나 바라는 점을 적어 주세요"
              className="block w-full resize-none rounded-2xl bg-pill px-4 pt-3.5 pb-8 text-[15px] leading-relaxed outline-none placeholder:text-muted focus:ring-2 focus:ring-ink"
            />
            <span className="pointer-events-none absolute right-3.5 bottom-2.5 font-num text-xs font-extrabold text-muted">
              {body.length} / {SUGGESTION_MAX}
            </span>
          </label>
          <div className="flex items-center gap-2.5">
            {photo ? (
              <div className="relative size-16 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="붙인 사진" className="size-16 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  aria-label="사진 빼기"
                  className="absolute -top-1.5 -right-1.5 flex size-6 cursor-pointer items-center justify-center rounded-full bg-ink text-xs text-stub"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex size-16 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] text-[#444449] shadow-[inset_0_0_0_1.5px_var(--color-line)]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
                사진 1장
              </button>
            )}
            <span className="text-xs leading-normal text-muted">이름 없이 &quot;{ticket ? "예매 인증 관객" : "현장 QR 관객"}&quot;으로 올라가요</span>
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
          </div>
          {error && (
            <p role="alert" className="text-sm text-muted">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="press mt-1 h-14 cursor-pointer rounded-full bg-ink text-base font-bold text-stub disabled:opacity-40"
          >
            {sending ? "올리는 중" : "올리기"}
          </button>
        </form>
      </dialog>

      <p
        role="status"
        className={`pointer-events-none fixed bottom-40 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4.5 py-3 text-sm font-bold whitespace-nowrap text-stub shadow-[0_4px_16px_rgb(17_17_17/0.25)] transition duration-200 motion-reduce:transition-none ${
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <span className="flex size-4.5 items-center justify-center rounded-full bg-lime text-[11px] text-ink">✓</span>
        {toastText}
      </p>

      {verifying && (
        <VerificationSheet
          showId={showId}
          showName={showName}
          onClose={() => setVerifying(false)}
          onDone={(next) => {
            setData((current) => ({ ...current, verification: next }));
            setVerifying(false);
            setToastText("예매 인증을 보냈어요");
            setToast(true);
          }}
        />
      )}
      {askLogin && <LoginSheet reason="verify" loginUrl={loginUrl} onClose={() => setAskLogin(false)} />}
    </>
  );
}
