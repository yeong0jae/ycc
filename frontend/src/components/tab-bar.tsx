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
      className="fixed bottom-6 left-1/2 z-30 flex h-15 -translate-x-1/2 items-center gap-2 rounded-full bg-pill px-1.5 shadow-[0_8px_24px_rgb(17_17_17/0.12)]"
    >
      {tabs.map((tab) => {
        const active = tab.key === current;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
            className={`flex size-12 items-center justify-center rounded-full transition-colors duration-150 ${
              active ? "bg-ink text-stub" : "text-ink"
            }`}
          >
            <svg
              width="22"
              height="22"
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
