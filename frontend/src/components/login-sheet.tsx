"use client";

import { LOGIN_TITLES, type LoginReason } from "@/lib/community-types";
import { BottomSheet } from "./bottom-sheet";
import { KakaoLoginButton } from "./kakao-login-button";

export function LoginSheet({ reason, loginUrl, onClose }: { reason: LoginReason; loginUrl: string; onClose: () => void }) {
  return (
    <BottomSheet label="로그인" onClose={onClose}>
      <div className="flex flex-col gap-3.5 px-5 pt-6 pb-8">
        <h2 className="font-display text-xl">{LOGIN_TITLES[reason]}</h2>
        <p className="-mt-1.5 text-sm leading-relaxed text-[#444449]">로그인해도 이 화면으로 바로 돌아와요.</p>
        <KakaoLoginButton loginUrl={loginUrl} />
        <button type="button" onClick={onClose} className="h-11 cursor-pointer text-sm text-muted">
          다음에 할게요
        </button>
      </div>
    </BottomSheet>
  );
}
