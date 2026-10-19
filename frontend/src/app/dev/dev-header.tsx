"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const tools = [
  { href: "/dev/review", label: "검수" },
  { href: "/dev/requests", label: "추가 요청" },
];

export function DevHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    const res = await fetch("/api/dev/logout", { method: "POST" });
    if (res.ok) router.refresh();
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-5 bg-ink px-4 text-stub lg:px-6">
      <p className="font-display text-lg">개발자</p>
      <nav aria-label="개발자 도구" className="flex gap-1.5 text-[13px] font-semibold">
        {tools.map((tool) => {
          const active = pathname.startsWith(tool.href);
          return (
            <Link
              key={tool.href}
              href={tool.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 items-center rounded-full px-3.5 ${active ? "bg-stub text-ink" : "text-[#C9CCD3]"}`}
            >
              {tool.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={logout}
        className="ml-auto h-9 shrink-0 cursor-pointer rounded-full px-3 text-[13px] font-semibold text-[#C9CCD3]"
      >
        로그아웃
      </button>
    </header>
  );
}
