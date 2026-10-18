"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function MarkAttendedButton({ showId, date }: { showId: number; date: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const mark = () =>
    startTransition(async () => {
      await fetch(`/api/shows/${showId}/attendances/${date}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "ATTENDED" }),
      });
      router.refresh();
    });

  return (
    <button
      type="button"
      disabled={pending}
      onClick={mark}
      className="flex h-10 shrink-0 cursor-pointer items-center rounded-full border-[1.5px] border-ink px-3.5 text-[13px] font-semibold disabled:opacity-60"
    >
      다녀왔어요
    </button>
  );
}
