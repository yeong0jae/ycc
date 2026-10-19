"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JUST_ADDED_KEY } from "@/lib/back-transition";
import { participate, useParticipated } from "@/lib/participation";

const CELEBRATE_MS = 900;

export function ParticipateButton({ showId }: { showId: number }) {
  const router = useRouter();
  const participated = useParticipated();
  const [celebrating, setCelebrating] = useState(false);
  const joined = participated?.includes(showId) ?? false;

  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    return () => clearTimeout(timer);
  }, [celebrating]);

  const onClick = () => {
    if (joined) {
      try {
        sessionStorage.setItem(JUST_ADDED_KEY, String(showId));
      } catch {}
      return router.push("/");
    }
    participate(showId);
    setCelebrating(true);
    navigator.vibrate?.(12);
  };

  return (
    <button
      type="button"
      disabled={participated === null}
      onClick={onClick}
      className={`press flex h-14 flex-1 cursor-pointer items-center justify-center rounded-full text-base font-bold transition-colors duration-300 motion-reduce:transition-none ${
        joined && !celebrating ? "bg-ink text-stub" : "bg-lime"
      }`}
    >
      {celebrating ? (
        <span key="done" role="status" className="flex animate-pop items-center gap-1.5 motion-reduce:animate-none">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} className="animate-draw motion-reduce:animate-none" />
          </svg>
          참여했어요
        </span>
      ) : joined ? (
        <span key="home" className="flex animate-rise items-center gap-1 motion-reduce:animate-none">
          홈에서 보기
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      ) : (
        <span key="join" className="flex items-center gap-1.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          참여하기
        </span>
      )}
    </button>
  );
}
