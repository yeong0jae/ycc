"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { RequestButton } from "@/components/request-button";
import { useParticipated } from "@/lib/participation";

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
