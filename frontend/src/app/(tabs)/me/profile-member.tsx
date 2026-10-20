"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { logout } from "@/lib/actions";
import type { Me } from "@/lib/auth";
import { forgetAccount } from "@/lib/participation";
import { ParticipatedRow, SectionLabel, ServiceRows } from "./profile-rows";

const NICKNAME_MAX = 12;
const sheetClass = "sheet inset-x-0 top-auto bottom-0 mx-auto mb-0 max-h-[90dvh] w-full max-w-2xl rounded-t-3xl bg-paper p-0 text-ink";

export function ProfileMember({ me }: { me: Me }) {
  const router = useRouter();
  const nicknameSheet = useRef<HTMLDialogElement>(null);
  const withdrawSheet = useRef<HTMLDialogElement>(null);
  const logoutSheet = useRef<HTMLDialogElement>(null);
  const [nickname, setNickname] = useState(me.nickname);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openNickname = () => {
    setNickname(me.nickname);
    setError(null);
    nicknameSheet.current?.showModal();
  };

  const shuffle = async () => {
    const res = await fetch("/api/me/random-nickname").catch(() => null);
    if (res?.ok) {
      setNickname((await res.json()).nickname);
      setError(null);
    }
  };

  const saveNickname = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nickname }),
    }).catch(() => null);
    setSaving(false);
    if (res?.ok) {
      nicknameSheet.current?.close();
      return router.refresh();
    }
    const problem = await res?.json().catch(() => null);
    setError(problem?.message || "저장하지 못했어요. 다시 시도해 주세요.");
  };

  const withdraw = async () => {
    const res = await fetch("/api/me", { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return;
    forgetAccount();
    withdrawSheet.current?.close();
    router.refresh();
  };

  const unchanged = nickname.trim() === me.nickname;

  return (
    <>
      <section className="mx-4 mt-1 flex items-center gap-3.5 rounded-3xl bg-[#f7f7f8] p-5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-[22px] font-bold text-stub">{me.nickname.slice(0, 1)}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <b className="truncate text-lg">{me.nickname}</b>
          <span className="flex items-center gap-1.5 text-[13px] text-muted">
            <span className="flex size-4 items-center justify-center rounded-full bg-[#FEE500]">
              <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#191919" d="M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 6l-1 3.6c-.1.3.3.6.6.4l4.2-2.8h1c5 0 9-3.1 9-7s-4-7-9-7z" />
              </svg>
            </span>
            카카오로 로그인됨
          </span>
        </span>
        <button type="button" onClick={openNickname} className="press h-9 shrink-0 cursor-pointer rounded-full bg-paper px-3.5 text-[13px] font-bold">
          수정
        </button>
      </section>

      <SectionLabel>내 공연</SectionLabel>
      <ParticipatedRow />
      <ServiceRows />

      <div className="mt-4.5 flex gap-4 px-5 text-[13px] text-muted">
        <button type="button" onClick={() => logoutSheet.current?.showModal()} className="h-10 cursor-pointer">
          로그아웃
        </button>
        <button type="button" onClick={() => withdrawSheet.current?.showModal()} className="h-10 cursor-pointer">
          회원 탈퇴
        </button>
      </div>

      <dialog
        ref={nicknameSheet}
        aria-labelledby="nickname-title"
        onClick={(event) => event.target === nicknameSheet.current && nicknameSheet.current.close()}
        className={sheetClass}
      >
        <form onSubmit={saveNickname} className="flex flex-col gap-3.5 px-5 pt-6 pb-8">
          <div className="flex items-center">
            <h2 id="nickname-title" className="font-display text-xl">
              닉네임 바꾸기
            </h2>
            <button type="button" onClick={() => nicknameSheet.current?.close()} className="ml-auto h-9 cursor-pointer px-1 text-sm text-muted">
              닫기
            </button>
          </div>
          <p className="-mt-1.5 text-sm text-muted">커뮤니티에 글을 쓰면 이 이름으로 보여요</p>
          <label className="relative">
            <span className="sr-only">닉네임</span>
            <input
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value);
                setError(null);
              }}
              minLength={2}
              maxLength={NICKNAME_MAX}
              required
              autoComplete="off"
              className="h-13 w-full rounded-full bg-pill pr-16 pl-5 text-base outline-none focus:ring-2 focus:ring-ink"
            />
            <span className="pointer-events-none absolute top-1/2 right-4.5 -translate-y-1/2 font-num text-xs font-extrabold text-muted">
              {nickname.length} / {NICKNAME_MAX}
            </span>
          </label>
          {error && (
            <p role="alert" className="-mt-1 pl-2 text-[13px] text-[#c0392b]">
              {error}
            </p>
          )}
          <button type="button" onClick={shuffle} className="press h-9 cursor-pointer self-start rounded-full bg-pill px-3.5 text-[13px] font-bold">
            🎲 랜덤으로
          </button>
          <button
            type="submit"
            disabled={saving || unchanged || nickname.trim().length < 2}
            className="press h-14 cursor-pointer rounded-full bg-ink text-base font-bold text-stub disabled:opacity-40"
          >
            저장하기
          </button>
        </form>
      </dialog>

      <dialog
        ref={logoutSheet}
        aria-labelledby="logout-title"
        onClick={(event) => event.target === logoutSheet.current && logoutSheet.current.close()}
        className={sheetClass}
      >
        <form action={logout} onSubmit={forgetAccount} className="flex flex-col gap-3.5 px-5 pt-6 pb-8">
          <h2 id="logout-title" className="font-display text-xl">
            로그아웃할까요?
          </h2>
          <p className="-mt-1.5 text-sm leading-relaxed text-[#444449]">이 기기에 저장된 참여한 공연은 그대로 남아요.</p>
          <button type="submit" className="press h-14 cursor-pointer rounded-full bg-ink text-base font-bold text-stub">
            로그아웃
          </button>
          <button type="button" onClick={() => logoutSheet.current?.close()} className="h-11 cursor-pointer text-sm text-muted">
            그만두기
          </button>
        </form>
      </dialog>

      <dialog
        ref={withdrawSheet}
        aria-labelledby="withdraw-title"
        onClick={(event) => event.target === withdrawSheet.current && withdrawSheet.current.close()}
        className={sheetClass}
      >
        <div className="flex flex-col gap-3.5 px-5 pt-6 pb-8">
          <h2 id="withdraw-title" className="font-display text-xl">
            탈퇴할까요?
          </h2>
          <p className="-mt-1.5 text-sm leading-relaxed text-[#444449]">
            계정과 계정에 저장된 참여한 공연이 지워지고 되돌릴 수 없어요. 이 기기에 저장된 참여는 그대로 남아요.
          </p>
          <button type="button" onClick={withdraw} className="press h-14 cursor-pointer rounded-full bg-[#c0392b] text-base font-bold text-stub">
            탈퇴하기
          </button>
          <button type="button" onClick={() => withdrawSheet.current?.close()} className="h-11 cursor-pointer text-sm text-muted">
            그만두기
          </button>
        </div>
      </dialog>
    </>
  );
}
