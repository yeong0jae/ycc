"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function SignalButton({
  userId,
  showId,
  kind,
  sent,
  label,
  sentLabel,
}: {
  userId: number;
  showId: number;
  kind: "WAS_THERE" | "NEXT_TOGETHER";
  sent: boolean;
  label: string;
  sentLabel: string;
}) {
  const router = useRouter();
  const [on, setOn] = useState(sent);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const res = await fetch(`/api/users/${userId}/signals/${kind}?showId=${showId}`, { method: next ? "PUT" : "DELETE" });
      if (!res.ok) setOn(!next);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={pending}
      onClick={toggle}
      className={`h-9 cursor-pointer rounded-full border border-ink px-3.5 text-[13px] font-semibold transition-transform duration-150 active:scale-95 disabled:opacity-70 motion-reduce:transition-none motion-reduce:active:scale-100 ${
        on ? "bg-ink text-stub" : "bg-stub text-ink"
      }`}
    >
      {on ? sentLabel : label}
    </button>
  );
}
