"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { RequestButton } from "@/components/request-button";
import { VerificationSheet } from "@/components/verification-sheet";
import { ShieldIcon } from "@/components/verified-mark";
import type { ParticipatedShow } from "@/lib/notice-types";
import { useParticipated } from "@/lib/participation";
import { posterProps } from "@/lib/poster";
import type { Show } from "@/lib/show-types";
import { useVerifications } from "@/lib/verification";
import { REJECT_LABELS, type Verification } from "@/lib/verification-types";

const rowClass = "flex h-14 w-full cursor-pointer items-center px-5 text-left text-[15px] shadow-[inset_0_-1px_0_#eeeef1]";

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b9b9c0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ml-1.5">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function Row({ href, label, value }: { href: string; label: string; value?: ReactNode }) {
  return (
    <Link href={href} className={rowClass}>
      <span className="flex-1">{label}</span>
      {value !== undefined && <span className="text-sm text-muted">{value}</span>}
      <Chevron />
    </Link>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="mx-5 mt-6 mb-1 text-[13px] font-bold text-muted">{children}</p>;
}

export function ParticipatedRow() {
  const ids = useParticipated();
  return <Row href="/" label="참여한 공연" value={ids === null ? "" : `${ids.length}개`} />;
}

function VerificationState({ verification }: { verification: Verification }) {
  if (verification.status === "APPROVED") {
    return (
      <span className="flex h-6.5 shrink-0 items-center gap-1 rounded-full bg-verified-chip px-2.5 text-xs font-bold text-stub">
        <ShieldIcon size={11} />
        인증됨
      </span>
    );
  }
  if (verification.status === "PENDING") {
    return <span className="flex h-6.5 shrink-0 items-center rounded-full bg-pill px-2.5 text-xs font-bold">확인 중</span>;
  }
  return <span className="flex h-6.5 shrink-0 items-center rounded-full bg-[#fde7ea] px-2.5 text-xs font-bold text-[#c21f33]">다시 올려 주세요</span>;
}

function period(startDate: string, endDate: string) {
  const day = (value: string) => value.slice(5).split("-").map(Number).join(".");
  return startDate === endDate ? day(startDate) : `${day(startDate)} — ${day(endDate)}`;
}

function verificationNote(verification: Verification) {
  if (verification.status === "PENDING") return "보통 하루 안에 끝나요";
  if (verification.status === "REJECTED") return `사유 · ${REJECT_LABELS[verification.rejectReason ?? "OTHER"]}`;
  return period(verification.startDate, verification.endDate);
}

function PickShowSheet({ verifications, onPick, onClose }: { verifications: Verification[]; onPick: (show: Show) => void; onClose: () => void }) {
  const ids = useParticipated();
  const key = ids?.join(",") ?? "";
  const [shows, setShows] = useState<{ key: string; items: Show[] } | null>(null);

  useEffect(() => {
    if (!key) return;
    let alive = true;
    fetch(`/api/shows/participated?ids=${key}`)
      .then((res) => (res.ok ? (res.json() as Promise<ParticipatedShow[]>) : []))
      .catch(() => [])
      .then((items) => alive && setShows({ key, items: items.map((it) => it.show) }));
    return () => {
      alive = false;
    };
  }, [key]);

  const items = shows?.key === key ? shows.items : null;

  return (
    <BottomSheet label="예매 인증할 공연" onClose={onClose}>
      <div className="flex flex-col pt-6 pb-8">
        <h2 className="px-5 font-display text-xl">어느 공연을 인증할까요?</h2>
        <p className="mt-1 px-5 pb-2 text-[13px] text-muted">참여한 공연 중에서 골라요</p>
        <div className="max-h-[60dvh] overflow-y-auto">
          {items?.map((show) => {
            const verification = verifications.find((it) => it.showId === show.id);
            const done = verification && verification.status !== "REJECTED";
            return (
              <button
                key={show.id}
                type="button"
                disabled={done}
                onClick={() => onPick(show)}
                className="flex h-16 w-full cursor-pointer items-center gap-3 px-5 text-left shadow-[inset_0_-1px_0_#eeeef1] disabled:cursor-default"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img {...posterProps(show.posterUrl, "40px")} alt="" className="h-13 w-10 shrink-0 rounded-lg bg-pill object-cover" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <b className="truncate text-[15px]">{show.name}</b>
                  <span className="text-xs text-muted">{period(show.startDate, show.endDate)}</span>
                </span>
                {verification?.status === "APPROVED" ? (
                  <span className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-verified">
                    <ShieldIcon size={12} />
                    인증됨
                  </span>
                ) : verification?.status === "PENDING" ? (
                  <span className="shrink-0 text-xs font-bold text-muted">확인 중</span>
                ) : (
                  <Chevron />
                )}
              </button>
            );
          })}
          {items?.length === 0 && <p className="py-12 text-center text-sm text-muted">참여한 공연이 없어요.</p>}
          {ids?.length === 0 && <p className="py-12 text-center text-sm text-muted">참여한 공연이 없어요.</p>}
        </div>
      </div>
    </BottomSheet>
  );
}

export function VerificationRows() {
  const verifications = useVerifications();
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<Show | null>(null);
  if (!verifications) return null;
  return (
    <>
      {verifications.map((verification) => (
        <Link key={verification.showId} href={`/shows/${verification.showId}`} className={`${rowClass} h-16 gap-3`}>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate">{verification.showName}</span>
            <span className="truncate text-xs text-muted">{verificationNote(verification)}</span>
          </span>
          <VerificationState verification={verification} />
        </Link>
      ))}
      <button type="button" onClick={() => setPicking(true)} className={`${rowClass} gap-2 font-bold text-verified`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        예매 인증하기
      </button>
      {picking && (
        <PickShowSheet
          verifications={verifications}
          onClose={() => setPicking(false)}
          onPick={(show) => {
            setPicking(false);
            setPicked(show);
          }}
        />
      )}
      {picked && (
        <VerificationSheet
          showId={picked.id}
          showName={picked.name}
          rejected={verifications.find((it) => it.showId === picked.id)}
          onClose={() => setPicked(null)}
          onDone={() => setPicked(null)}
        />
      )}
    </>
  );
}

export function ServiceRows() {
  return (
    <>
      <SectionLabel>서비스</SectionLabel>
      <RequestButton kind="FESTIVAL" className={rowClass}>
        <span className="flex-1">공연 추가 요청</span>
        <Chevron />
      </RequestButton>
      <Row href="/terms" label="이용약관" />
      <Row href="/privacy" label="개인정보 처리방침" />
    </>
  );
}
