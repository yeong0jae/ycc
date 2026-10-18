"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    key: "list",
    href: "/find",
    label: "목록으로 보기",
    icon: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  },
  {
    key: "map",
    href: "/find/map",
    label: "지도로 보기",
    icon: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />,
  },
] as const;

export function ViewToggle() {
  const current = usePathname().startsWith("/find/map") ? "map" : "list";
  return (
    <nav aria-label="보기 방식" className="relative flex shrink-0 gap-1 rounded-full bg-pill p-1">
      <span
        aria-hidden="true"
        className="absolute top-1 left-1 size-10 rounded-full bg-ink transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
        style={{ transform: current === "map" ? "translateX(44px)" : "none" }}
      />
      {tabs.map((tab) => {
        const active = tab.key === current;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            transitionTypes={["view-switch"]}
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
            className={`press relative flex size-10 items-center justify-center rounded-full transition-colors duration-300 ${
              active ? "text-stub" : "text-ink"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {tab.icon}
            </svg>
          </Link>
        );
      })}
    </nav>
  );
}
