"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteLogButton({ logId }: { logId: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const remove = async () => {
    setPending(true);
    const res = await fetch(`/api/logs/${logId}`, { method: "DELETE" });
    if (res.ok) {
      router.replace("/me");
      router.refresh();
      return;
    }
    setFailed(true);
    setPending(false);
  };

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="h-11 cursor-pointer self-start text-sm text-muted">
        로그 지우기
      </button>
    );
  }

  return (
    <div role="alert" className="flex flex-col gap-3 rounded-2xl bg-stub p-4">
      <p className="text-sm leading-relaxed">
        이 로그를 지울까요? 영상은 되돌릴 수 없고, 이 공연에서 받은 &apos;나도 있었어&apos;도 함께 사라져요.
      </p>
      {failed && <p className="text-sm font-semibold">지우지 못했어요. 잠시 후 다시 시도해 주세요.</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="h-11 flex-1 cursor-pointer rounded-xl border border-line bg-stub text-sm font-semibold"
        >
          취소
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={remove}
          className="h-11 flex-1 cursor-pointer rounded-xl bg-ink text-sm font-semibold text-stub disabled:opacity-60"
        >
          {pending ? "지우는 중…" : "지우기"}
        </button>
      </div>
    </div>
  );
}
