"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    key: "home",
    href: "/",
    label: "홈",
    icon: <path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />,
  },
  {
    key: "find",
    href: "/find",
    label: "찾기",
    icon: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4.2-4.2" />
      </>
    ),
  },
  {
    key: "me",
    href: "/me",
    label: "나",
    icon: (
      <>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5z" />
      </>
    ),
  },
] as const;

function currentTab(pathname: string) {
  if (pathname.startsWith("/find")) return "find";
  if (pathname.startsWith("/me")) return "me";
  return "home";
}

export function TabBar() {
  const current = currentTab(usePathname());
  return (
    <nav
      aria-label="탭"
      className="fixed bottom-6 left-1/2 z-30 grid h-16 w-[calc(100%-40px)] max-w-80 -translate-x-1/2 grid-cols-3 items-center gap-1 rounded-full border border-white/80 bg-white/60 p-1 shadow-[0_10px_30px_rgb(17_19_24/0.16),inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-xl backdrop-saturate-150"
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
              fill={active && tab.key !== "find" ? "currentColor" : "none"}
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
