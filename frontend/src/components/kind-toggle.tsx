"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { kindQuery, type ShowKind } from "@/lib/show-types";

const kinds: { key: ShowKind; label: string }[] = [
  { key: "FESTIVAL", label: "페스티벌" },
  { key: "CONCERT", label: "콘서트" },
];

export function KindToggle({ kind }: { kind: ShowKind }) {
  const pathname = usePathname();
  return (
    <nav aria-label="공연 종류" className="relative flex shrink-0 gap-1 rounded-full bg-pill p-1">
      <span
        aria-hidden="true"
        className="absolute top-1 left-1 h-10 w-19 rounded-full bg-ink transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
        style={{ transform: kind === "CONCERT" ? "translateX(80px)" : "none" }}
      />
      {kinds.map((it) => {
        const active = it.key === kind;
        return (
          <Link
            key={it.key}
            href={`${pathname}${kindQuery(it.key)}`}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`press relative flex h-10 w-19 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300 ${
              active ? "text-stub" : "text-ink"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
