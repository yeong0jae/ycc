"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function PlanButton({ showId, planned }: { showId: number; planned: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(planned);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const res = await fetch(`/api/shows/${showId}/plan`, { method: next ? "PUT" : "DELETE" });
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
      className={`flex h-12 flex-1 cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-ink font-semibold transition duration-150 active:scale-[0.97] disabled:opacity-70 motion-reduce:transition-none motion-reduce:active:scale-100 ${
        on ? "bg-ink text-stub" : "bg-stub text-ink"
      }`}
    >
      {on ? "갈 거예요 ✓" : "갈 거예요"}
    </button>
  );
}
