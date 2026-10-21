"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { CommunityAvatar } from "@/components/community-avatar";
import type { Me } from "@/lib/auth";
import { squareImage } from "@/lib/resize-image";
import { ParticipatedRow, SectionLabel, VerificationRows } from "./profile-rows";

const NICKNAME_MAX = 12;
const SHUFFLE_CHARS = "가나다라마바사아자차카타파하떼창응원봉앵콜0123456789";
const SHUFFLE_STEPS = 10;
const SHUFFLE_MS = 40;

function upload(form: FormData, onProgress: (ratio: number) => void) {
  return new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", "/api/me/avatar");
    xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total);
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(form);
  });
}
const sheetClass = "sheet inset-x-0 top-auto bottom-0 mx-auto mb-0 max-h-[90dvh] w-full max-w-2xl rounded-t-3xl bg-paper p-0 text-ink";

export function ProfileMember({ me }: { me: Me }) {
  const router = useRouter();
  const nicknameSheet = useRef<HTMLDialogElement>(null);
  const [nickname, setNickname] = useState(me.nickname);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const changeAvatar = async (file: File | undefined) => {
    if (!file) return;
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      const form = new FormData();
      form.set("file", await squareImage(file), "avatar.jpg");
      setProgress(0);
      if (!(await upload(form, setProgress))) throw new Error();
      setProgress(1);
      setAvatarOpen(false);
      router.refresh();
    } catch {
      setAvatarError("사진을 올리지 못했어요. 다시 시도해 주세요.");
    } finally {
      setAvatarBusy(false);
      setProgress(null);
    }
  };

  const removeAvatar = async () => {
    setAvatarBusy(true);
    const res = await fetch("/api/me/avatar", { method: "DELETE" }).catch(() => null);
    setAvatarBusy(false);
    if (!res?.ok) return setAvatarError("지우지 못했어요. 다시 시도해 주세요.");
    setAvatarOpen(false);
    router.refresh();
  };

  const openNickname = () => {
    setNickname(me.nickname);
    setError(null);
    nicknameSheet.current?.showModal();
  };

  const shuffle = async () => {
    if (shuffling) return;
    const res = await fetch("/api/me/random-nickname").catch(() => null);
    if (!res?.ok) return;
    const target: string = (await res.json()).nickname;
    setError(null);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setNickname(target);
    setShuffling(true);
    const chars = [...target];
    for (let step = 1; step <= SHUFFLE_STEPS; step++) {
      const settled = Math.floor((chars.length * step) / SHUFFLE_STEPS);
      setNickname(chars.map((char, i) => (i < settled ? char : SHUFFLE_CHARS[Math.floor(Math.random() * SHUFFLE_CHARS.length)])).join(""));
      await new Promise((resolve) => setTimeout(resolve, SHUFFLE_MS));
    }
    setNickname(target);
    setShuffling(false);
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

  const unchanged = nickname.trim() === me.nickname;

  return (
    <>
      <section className="mx-4 mt-1 flex items-center gap-3.5 rounded-3xl bg-[#f7f7f8] p-5">
        <button
          type="button"
          onClick={() => {
            setAvatarError(null);
            setAvatarOpen(true);
          }}
          aria-label="프로필 사진 바꾸기"
          className="press relative shrink-0 cursor-pointer rounded-full"
        >
          <CommunityAvatar name={me.nickname} url={me.avatarUrl} size={56} />
          <span className="absolute -right-0.5 -bottom-0.5 flex size-5.5 items-center justify-center rounded-full bg-paper shadow-[0_1px_3px_rgb(17_17_17/0.2)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </span>
        </button>
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

      <SectionLabel>예매 인증한 공연</SectionLabel>
      <VerificationRows />

      <SectionLabel>내 공연</SectionLabel>
      <ParticipatedRow />

      <input
        ref={avatarInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          changeAvatar(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {avatarOpen && (
        <BottomSheet label="프로필 사진" onClose={() => setAvatarOpen(false)}>
          <div className="flex flex-col items-center gap-3.5 px-5 pt-6 pb-8">
            <h2 className="self-start font-display text-xl">프로필 사진</h2>
            <span className="relative flex size-28 items-center justify-center">
              <CommunityAvatar name={me.nickname} url={me.avatarUrl} size={96} />
              {progress !== null && (
                <svg viewBox="0 0 112 112" aria-hidden="true" className="absolute inset-0 -rotate-90">
                  <circle cx="56" cy="56" r="53" fill="none" stroke="var(--color-line)" strokeWidth="4" />
                  <circle
                    cx="56"
                    cy="56"
                    r="53"
                    fill="none"
                    stroke="var(--color-ink)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - Math.max(progress, 0.04)}
                    className="transition-[stroke-dashoffset] duration-200 motion-reduce:transition-none"
                  />
                </svg>
              )}
            </span>
            {avatarError && (
              <p role="alert" className="text-[13px] text-[#c0392b]">
                {avatarError}
              </p>
            )}
            <button
              type="button"
              disabled={avatarBusy}
              onClick={() => avatarInput.current?.click()}
              className="press h-14 w-full cursor-pointer rounded-full bg-ink text-base font-bold text-stub disabled:opacity-50"
            >
              {avatarBusy ? "올리는 중" : "사진 고르기"}
            </button>
            {me.avatarUrl && (
              <button type="button" disabled={avatarBusy} onClick={removeAvatar} className="h-11 cursor-pointer text-sm text-[#c0392b] disabled:opacity-50">
                사진 지우기
              </button>
            )}
            <button type="button" onClick={() => setAvatarOpen(false)} className="h-11 cursor-pointer text-sm text-muted">
              닫기
            </button>
          </div>
        </BottomSheet>
      )}

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
            랜덤으로
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
    </>
  );
}
