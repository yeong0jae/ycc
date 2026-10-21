"use client";

import { type ReactNode, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { LoginSheet } from "@/components/login-sheet";
import { VerificationSheet } from "@/components/verification-sheet";
import { ShieldIcon } from "@/components/verified-mark";
import { useVerifications } from "@/lib/verification";

function objectParticle(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return "을(를)";
  return code % 28 === 0 ? "를" : "을";
}

function Benefit({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex gap-3 py-3 shadow-[inset_0_-1px_0_#eeeef1]">
      <span className="pt-px text-verified">
        <ShieldIcon size={18} />
      </span>
      <span className="flex flex-col gap-0.5">
        <b className="text-[15px]">{title}</b>
        <span className="text-[13px] text-muted">{body}</span>
      </span>
    </li>
  );
}

function InfoSheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  return (
    <BottomSheet label={label} onClose={onClose}>
      <div className="flex flex-col px-5 pt-6 pb-8">
        {children}
        <button type="button" onClick={onClose} className="press mt-5 h-13 cursor-pointer rounded-full bg-pill text-[15px] font-bold">
          닫기
        </button>
      </div>
    </BottomSheet>
  );
}

const pill = "press flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-bold";

export function VerificationButton({ showId, showName, loginUrl }: { showId: number; showName: string; loginUrl: string }) {
  const list = useVerifications();
  const [open, setOpen] = useState(false);
  if (list === undefined) return null;
  const guest = list === null;
  const verification = list?.find((it) => it.showId === showId) ?? null;

  const close = () => setOpen(false);
  const status = verification?.status;

  return (
    <>
      {status === "APPROVED" ? (
        <button type="button" onClick={() => setOpen(true)} className={`${pill} bg-verified-chip text-stub`}>
          <ShieldIcon size={14} />
          예매 인증됨
        </button>
      ) : status === "PENDING" ? (
        <button type="button" onClick={() => setOpen(true)} className={`${pill} bg-pill text-muted`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          확인 중
        </button>
      ) : status === "REJECTED" ? (
        <button type="button" onClick={() => setOpen(true)} className={`${pill} text-[#c21f33] shadow-[inset_0_0_0_1.5px_#f3c2c9]`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5M12 16.5v.01" />
          </svg>
          다시 인증
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={`${pill} text-verified shadow-[inset_0_0_0_1.5px_var(--color-line)]`}>
          <ShieldIcon size={14} />
          예매 인증
        </button>
      )}

      {open && guest && <LoginSheet reason="verify" loginUrl={loginUrl} onClose={close} />}
      {open && !guest && (status === undefined || status === "REJECTED") && (
        <VerificationSheet showId={showId} showName={showName} rejected={verification} onClose={close} onDone={close} />
      )}
      {open && status === "PENDING" && (
        <InfoSheet label="예매 인증 확인 중" onClose={close}>
          <h2 className="font-display text-xl">예매 인증을 확인하고 있어요</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#444449]">보통 하루 안에 끝나요. 확인되면 이 공연을 예매한 관객으로 표시돼요.</p>
        </InfoSheet>
      )}
      {open && verification?.status === "APPROVED" && (
        <InfoSheet label="예매 인증됨" onClose={close}>
          <span className="flex h-7 items-center gap-1.5 self-start rounded-full bg-verified-chip px-3 text-[13px] font-bold text-stub">
            <ShieldIcon size={13} />
            예매 인증됨
          </span>
          <h2 className="mt-2.5 font-display text-xl">
            {showName}
            {objectParticle(showName)} 예매한 관객이에요
          </h2>
          <ul className="mt-2">
            <Benefit title="커뮤니티에서 믿을 수 있어요" body="글 · 댓글의 닉네임 옆에 예매 인증이 붙어요" />
            <Benefit title="주최측에 바로 말할 수 있어요" body="현장 QR 없이 예매 인증 관객으로 문의해요" />
            <Benefit title="프로필에 쌓여요" body="예매 인증한 공연에서 다시 볼 수 있어요" />
          </ul>
        </InfoSheet>
      )}
    </>
  );
}
