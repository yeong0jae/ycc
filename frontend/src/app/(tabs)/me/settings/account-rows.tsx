"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { forgetAccount } from "@/lib/participation";
import { SectionLabel } from "../profile-rows";

const rowClass = "flex h-14 w-full cursor-pointer items-center px-5 text-left text-[15px] shadow-[inset_0_-1px_0_#eeeef1]";

export function AccountRows() {
  const [sheet, setSheet] = useState<"logout" | "withdraw" | null>(null);

  const logout = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetch("/api/logout", { method: "POST" }).catch(() => null);
    forgetAccount();
    location.replace("/me");
  };

  const withdraw = async () => {
    const res = await fetch("/api/me", { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return;
    forgetAccount();
    location.replace("/me");
  };

  return (
    <>
      <SectionLabel>계정</SectionLabel>
      <button type="button" onClick={() => setSheet("logout")} className={rowClass}>
        로그아웃
      </button>
      <button type="button" onClick={() => setSheet("withdraw")} className={`${rowClass} text-muted`}>
        회원 탈퇴
      </button>

      {sheet === "logout" && (
        <BottomSheet label="로그아웃" onClose={() => setSheet(null)}>
          <form onSubmit={logout} className="flex flex-col gap-3.5 px-5 pt-6 pb-8">
            <h2 className="font-display text-xl">로그아웃할까요?</h2>
            <p className="-mt-1.5 text-sm leading-relaxed text-[#444449]">이 기기에 저장된 참여한 공연은 그대로 남아요.</p>
            <button type="submit" className="press h-14 cursor-pointer rounded-full bg-ink text-base font-bold text-stub">
              로그아웃
            </button>
            <button type="button" onClick={() => setSheet(null)} className="h-11 cursor-pointer text-sm text-muted">
              그만두기
            </button>
          </form>
        </BottomSheet>
      )}
      {sheet === "withdraw" && (
        <BottomSheet label="회원 탈퇴" onClose={() => setSheet(null)}>
          <div className="flex flex-col gap-3.5 px-5 pt-6 pb-8">
            <h2 className="font-display text-xl">탈퇴할까요?</h2>
            <p className="-mt-1.5 text-sm leading-relaxed text-[#444449]">
              계정과 계정에 저장된 참여한 공연·글·댓글이 지워지고 되돌릴 수 없어요. 이 기기에 저장된 참여는 그대로 남아요.
            </p>
            <button type="button" onClick={withdraw} className="press h-14 cursor-pointer rounded-full bg-[#c0392b] text-base font-bold text-stub">
              탈퇴하기
            </button>
            <button type="button" onClick={() => setSheet(null)} className="h-11 cursor-pointer text-sm text-muted">
              그만두기
            </button>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
