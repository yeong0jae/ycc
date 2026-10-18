"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    key: "concert",
    href: "/",
    label: "콘서트",
    icon: (
      <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" />
    ),
  },
  {
    key: "log",
    href: "/logs",
    label: "로그",
    icon: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="3" />
        <path d="M10 9l5 3-5 3z" />
      </>
    ),
  },
  {
    key: "together",
    href: "/together",
    label: "내 동행",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5z" />
        <circle cx="17" cy="9" r="2.6" />
        <path d="M16.5 14c2.3.2 4 1.8 4.5 4.5h-4.6z" />
      </>
    ),
  },
  {
    key: "me",
    href: "/me",
    label: "내 정보",
    icon: (
      <>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5z" />
      </>
    ),
  },
] as const;

function currentTab(pathname: string) {
  if (pathname.startsWith("/logs")) return "log";
  if (pathname.startsWith("/together")) return "together";
  if (pathname.startsWith("/me")) return "me";
  return "concert";
}

export function TabBar() {
  const current = currentTab(usePathname());
  return (
    <nav
      aria-label="탭"
      className="fixed bottom-6 left-1/2 z-30 grid h-16 w-[calc(100%-40px)] max-w-158 -translate-x-1/2 grid-cols-4 items-center gap-1 rounded-full border border-white/80 bg-white/60 p-1 shadow-[0_10px_30px_rgb(17_19_24/0.16),inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-xl backdrop-saturate-150"
    >
      {tabs.map((tab) => {
        const active = tab.key === current;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-full text-ink transition-colors duration-150 ${
              active ? "bg-ink/8 font-bold" : "font-medium"
            }`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={active ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {tab.icon}
            </svg>
            <span className="text-[11px]">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
