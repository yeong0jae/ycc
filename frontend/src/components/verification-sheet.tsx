"use client";

import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { resizeImage } from "@/lib/resize-image";
import { saveVerification } from "@/lib/verification";
import { REJECT_LABELS, type Verification } from "@/lib/verification-types";

const TIPS = ["공연 이름 · 날짜 · 예매 상태가 보이게", "예매번호 · 개인정보는 자동으로 가려서 저장해요", "확인이 끝나면 안전하게 삭제돼요"];

export function VerificationSheet({
  showId,
  showName,
  rejected,
  onClose,
  onDone,
}: {
  showId: number;
  showName?: string;
  rejected?: Verification | null;
  onClose: () => void;
  onDone?: (verification: Verification) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [shot, setShot] = useState<{ file: File; url: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (shot) URL.revokeObjectURL(shot.url);
  }, [shot]);

  const send = async () => {
    if (!shot || sending) return;
    setSending(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", await resizeImage(shot.file), "ticket.jpg");
      const res = await fetch(`/api/me/verifications/${showId}`, { method: "POST", body: form });
      if (!res.ok) {
        const problem = await res.json().catch(() => null);
        setError(problem?.message || "보내지 못했어요. 다시 시도해 주세요.");
        return;
      }
      const verification: Verification = await res.json();
      saveVerification(verification);
      onDone?.(verification);
    } catch {
      setError("보내지 못했어요. 다시 시도해 주세요.");
    } finally {
      setSending(false);
    }
  };

  return (
    <BottomSheet label="예매 인증" onClose={onClose}>
      <div className="flex flex-col gap-3.5 px-5 pt-6 pb-8">
        <div className="flex items-center">
          <h2 className="font-display text-lg">예매 인증</h2>
          <button type="button" onClick={onClose} className="ml-auto h-9 cursor-pointer px-1 text-sm text-muted">
            닫기
          </button>
        </div>
        <p className="-mt-1.5 text-[13px] leading-normal text-muted">
          {showName ? `${showName} ` : ""}예매 내역 캡처를 올려 주세요. 확인되면 이 공연을 예매한 관객으로 표시돼요.
        </p>
        {rejected?.status === "REJECTED" && (
          <p role="status" className="rounded-[14px] bg-[#fde7ea] px-3.5 py-2.5 text-[13px] leading-normal font-bold text-[#c21f33]">
            지난 캡처는 확인하지 못했어요 · {REJECT_LABELS[rejected.rejectReason ?? "OTHER"]}
          </p>
        )}
        {shot ? (
          <div className="relative w-28 self-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot.url} alt="올릴 예매 내역" className="h-36 w-28 rounded-[14px] bg-pill object-cover" />
            <button
              type="button"
              onClick={() => setShot(null)}
              aria-label="캡처 빼기"
              className="absolute -top-1.5 -right-1.5 flex size-6 cursor-pointer items-center justify-center rounded-full bg-ink text-xs text-stub"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex h-36 w-28 cursor-pointer flex-col items-center justify-center gap-1 self-start rounded-[14px] text-xs text-[#444449] shadow-[inset_0_0_0_1.5px_var(--color-line)]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            캡처 고르기
          </button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) setShot({ file, url: URL.createObjectURL(file) });
            event.target.value = "";
          }}
        />
        <ul className="flex flex-col gap-1 rounded-[14px] bg-[#f7f7f8] px-3.5 py-3">
          {TIPS.map((tip) => (
            <li key={tip} className="flex gap-2 text-[13px] leading-normal text-[#444449]">
              <span className="font-bold text-ink">✓</span>
              {tip}
            </li>
          ))}
        </ul>
        {error && (
          <p role="alert" className="text-sm text-muted">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={send}
          disabled={!shot || sending}
          className="press mt-1 h-14 cursor-pointer rounded-full bg-ink text-base font-bold text-stub disabled:opacity-40"
        >
          {sending ? "개인정보 가리는 중" : "보내기"}
        </button>
      </div>
    </BottomSheet>
  );
}
