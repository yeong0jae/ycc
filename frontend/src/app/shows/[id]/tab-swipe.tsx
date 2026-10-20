"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import { markTabDirection } from "./tab-link";

const MIN_DISTANCE = 60;
const EDGE_GUARD = 24;

function scrollsSideways(from: Element | null, until: Element, dx: number) {
  for (let el = from; el && el !== until; el = el.parentElement) {
    const overflow = getComputedStyle(el).overflowX;
    if ((overflow === "auto" || overflow === "scroll") && el.scrollWidth > el.clientWidth) {
      if (dx < 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1) return true;
      if (dx > 0 && el.scrollLeft > 0) return true;
    }
  }
  return false;
}

export function TabSwipe({ prev, next, className = "", children }: { prev?: string; next?: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (prev) router.prefetch(prev);
    if (next) router.prefetch(next);
  }, [router, prev, next]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { x: number; y: number; target: Element | null } | null = null;
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const target = event.target instanceof Element ? event.target : null;
      start =
        event.touches.length === 1 && touch.clientX > EDGE_GUARD && touch.clientX < window.innerWidth - EDGE_GUARD && !target?.closest("dialog")
          ? { x: touch.clientX, y: touch.clientY, target }
          : null;
    };
    const onEnd = (event: TouchEvent) => {
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const target = start.target;
      start = null;
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (scrollsSideways(target, el, dx)) return;
      const href = dx < 0 ? next : prev;
      if (!href) return;
      markTabDirection(dx < 0 ? "forward" : "back");
      router.replace(href);
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [router, prev, next]);

  return (
    <div ref={ref} className={`tab-content ${className}`}>
      {children}
    </div>
  );
}
