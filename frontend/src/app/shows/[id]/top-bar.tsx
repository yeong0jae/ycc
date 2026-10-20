"use client";

import { type ReactNode, useEffect, useState } from "react";

export const SHOW_HOME_HEADER_ID = "show-home-header";
const TOP_BAR_HEIGHT = 68;

export function TopBar({ title, leading, trailing }: { title: string; leading: ReactNode; trailing: ReactNode }) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const header = document.getElementById(SHOW_HOME_HEADER_ID);
    if (!header) return;
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), {
      rootMargin: `-${TOP_BAR_HEIGHT}px 0px 0px 0px`,
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-0 z-50 flex h-17 items-center gap-2 bg-paper px-3">
      {leading}
      <p
        aria-hidden={!compact}
        className={`min-w-0 flex-1 truncate text-base font-bold transition duration-200 motion-reduce:transition-none ${
          compact ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
      >
        {title}
      </p>
      {trailing}
    </div>
  );
}
