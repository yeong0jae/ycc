"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { RequestButton } from "@/components/request-button";
import { ShieldIcon } from "@/components/verified-mark";
import { useParticipated } from "@/lib/participation";
import { lastDay, REJECT_LABELS, type Verification } from "@/lib/verification-types";

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

function verificationNote(verification: Verification) {
  if (verification.status === "APPROVED") return `${lastDay(verification.writableUntil)}까지 건의 가능`;
  if (verification.status === "PENDING") return "보통 하루 안에 끝나요";
  return `사유 · ${REJECT_LABELS[verification.rejectReason ?? "OTHER"]}`;
}

export function VerificationRows({ verifications }: { verifications: Verification[] }) {
  return verifications.map((verification) => (
    <Link key={verification.showId} href={`/shows/${verification.showId}/suggestions`} className={`${rowClass} h-16 gap-3`}>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate">{verification.showName}</span>
        <span className="truncate text-xs text-muted">{verificationNote(verification)}</span>
      </span>
      <VerificationState verification={verification} />
    </Link>
  ));
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
