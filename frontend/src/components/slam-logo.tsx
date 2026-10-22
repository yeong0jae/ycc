"use client";

import { useEffect, useRef, useState } from "react";

const INTRO = ["motion-safe:animate-slam-in-l", "motion-safe:animate-slam-in-r", "motion-safe:animate-slam-spark-in"];
const PRESS = ["motion-safe:animate-slam-press-l", "motion-safe:animate-slam-press-r", "motion-safe:animate-slam-spark-press"];

export function SlamLogo() {
  const [motion, setMotion] = useState<"intro" | "press" | null>("intro");
  const [runs, setRuns] = useState(0);
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current) {
      setMotion("intro");
      setRuns((n) => n + 1);
    }
    shown.current = true;
  }, []);
  const [left, right, spark] = motion === "press" ? PRESS : motion === "intro" ? INTRO : ["", "", ""];

  return (
    <span
      className="flex items-center gap-2"
      onPointerDown={() => {
        setMotion("press");
        setRuns((n) => n + 1);
      }}
    >
      <svg key={runs} width="40" height="40" viewBox="16 16 90 80" className="overflow-visible" aria-hidden="true" onAnimationEnd={() => setMotion(null)}>
        <circle cx="44" cy="66" r="26" fill="var(--color-lime)" className={`origin-center [transform-box:fill-box] ${left}`} />
        <circle cx="78" cy="52" r="26" fill="var(--color-ink)" className={`origin-center [transform-box:fill-box] ${right}`} />
        <g className={`origin-bottom [transform-box:fill-box] ${spark}`}>
          <path d="M58 30l4-10M70 26l8-8M50 34l-4-9" stroke="var(--color-ink)" strokeWidth="5" strokeLinecap="round" />
        </g>
      </svg>
      <span className="sr-only">슬램</span>
    </span>
  );
}
