"use client";

import { leave, participate, useParticipated } from "@/lib/participation";

export function ParticipationToggle({ showId }: { showId: number }) {
  const participated = useParticipated();
  if (participated === null) return null;
  const joined = participated.includes(showId);
  return (
    <button
      type="button"
      aria-pressed={joined}
      onClick={() => (joined ? leave(showId) : participate(showId))}
      className={`press flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm font-bold ${joined ? "bg-pill" : "bg-lime"}`}
    >
      <svg
        key={String(joined)}
        width="16"
        height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="animate-pop motion-reduce:animate-none">
        <path d={joined ? "M5 12.5l4.5 4.5L19 7.5" : "M12 5v14M5 12h14"} />
      </svg>
      {joined ? "참여 중" : "참여하기"}
    </button>
  );
}
