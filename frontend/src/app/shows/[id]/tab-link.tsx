"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const DIRECTION_ATTR = "data-tab-dir";
const CLEAR_AFTER_MS = 1000;

export function TabLink({ href, direction, className, children }: { href: string; direction: "forward" | "back"; className: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      replace
      onClick={() => {
        document.documentElement.setAttribute(DIRECTION_ATTR, direction);
        setTimeout(() => document.documentElement.removeAttribute(DIRECTION_ATTR), CLEAR_AFTER_MS);
      }}
      className={className}
    >
      {children}
    </Link>
  );
}
