"use client";

import { useEffect, useRef } from "react";

export function InfiniteSentinel({ active, onReach }: { active: boolean; onReach: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const reach = useRef(onReach);

  useEffect(() => {
    reach.current = onReach;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && reach.current(), { rootMargin: "600px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);

  return <div ref={ref} aria-hidden="true" className="h-px" />;
}
