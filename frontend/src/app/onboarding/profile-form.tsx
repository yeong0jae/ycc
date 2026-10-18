"use client";

import { useActionState, useState } from "react";
import type { Gender } from "@/lib/auth";
import { type ProfileState, saveProfile } from "@/lib/actions";

const genders: [Gender, string][] = [
  ["FEMALE", "여성"],
  ["MALE", "남성"],
  ["UNDISCLOSED", "밝히지 않음"],
];

export function ProfileForm({
  nickname,
  gender,
  next,
  submitLabel,
}: {
  nickname: string;
  gender: Gender | null;
  next: string;
  submitLabel: string;
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, { error: null });
  const [picked, setPicked] = useState<Gender | null>(gender);

  return (
    <form action={action} className="flex flex-1 flex-col gap-7">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-2">
        <label htmlFor="nickname" className="text-sm font-semibold">
          닉네임
        </label>
        <input
          id="nickname"
          name="nickname"
          defaultValue={nickname}
          required
          minLength={2}
          maxLength={12}
          autoComplete="off"
          className="h-13 rounded-full bg-pill px-5 text-base outline-none focus:ring-2 focus:ring-ink"
        />
        <p className="text-[13px] text-muted">카카오 이름 대신 이 닉네임만 보여요. 2~12자예요.</p>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">성별</legend>
        <div className="grid grid-cols-3 gap-2">
          {genders.map(([value, label]) => (
            <label
              key={value}
              className={`flex h-12 cursor-pointer items-center justify-center rounded-full text-[15px] font-bold has-focus-visible:ring-2 has-focus-visible:ring-ink ${
                picked === value ? "bg-ink text-stub" : "bg-pill"
              }`}
            >
              <input
                type="radio"
                name="gender"
                value={value}
                required
                checked={picked === value}
                onChange={() => setPicked(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
        <p className="text-[13px] leading-relaxed text-muted">
          다른 사람에게는 보이지 않아요.
        </p>
      </fieldset>
      {state.error && (
        <p role="alert" className="text-sm font-semibold">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="press mt-auto h-14 cursor-pointer rounded-full bg-ink font-bold text-stub disabled:opacity-60"
      >
        {pending ? "저장하는 중…" : submitLabel}
      </button>
    </form>
  );
}
