"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function OrganizerMenu({ showId }: { showId: number }) {
  const pathname = usePathname();
  const links = [
    { href: `/organizer/shows/${showId}/notices`, label: "공지" },
    { href: `/organizer/shows/${showId}/timetable`, label: "타임테이블" },
  ];
  return (
    <nav
      aria-label="주최측 메뉴"
      className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-line px-4 py-3 lg:w-55 lg:flex-col lg:gap-1 lg:border-r lg:border-b-0 lg:px-3 lg:py-5"
    >
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-10 shrink-0 items-center rounded-full px-3.5 text-[15px] lg:h-11 lg:rounded-xl ${
              active ? "bg-ink font-bold text-stub lg:bg-pill lg:text-ink" : ""
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      {["건의", "현장 QR"].map((label) => (
        <span
          key={label}
          aria-disabled="true"
          className="flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-[15px] text-muted lg:h-11 lg:rounded-xl"
        >
          {label}
          <span className="rounded-full bg-pill px-2 py-0.5 text-[11px]">곧 열려요</span>
        </span>
      ))}
    </nav>
  );
}
