"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DevLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const res = await fetch("/api/dev/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
    });
    setPending(false);
    if (res.ok) return router.refresh();
    setError(res.status === 401 ? "아이디나 비밀번호가 맞지 않아요." : "로그인하지 못했어요. 다시 시도해 주세요.");
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form method="post" onSubmit={submit} className="flex w-full max-w-sm flex-col gap-3">
        <h1 className="mb-3 font-display text-2xl">개발자 로그인</h1>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">아이디</span>
          <input
            name="username"
            required
            autoComplete="username"
            className="h-12 rounded-full bg-pill px-5 text-[15px] outline-none focus:ring-2 focus:ring-ink"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">비밀번호</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="h-12 rounded-full bg-pill px-5 text-[15px] outline-none focus:ring-2 focus:ring-ink"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-muted">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="press mt-3 h-13 cursor-pointer rounded-full bg-ink font-bold text-stub disabled:opacity-50"
        >
          로그인
        </button>
      </form>
    </main>
  );
}
