"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const DIRECTION_ATTR = "data-tab-dir";
const CLEAR_AFTER_MS = 1000;

export type TabDirection = "forward" | "back";

export function markTabDirection(direction: TabDirection) {
  document.documentElement.setAttribute(DIRECTION_ATTR, direction);
  setTimeout(() => document.documentElement.removeAttribute(DIRECTION_ATTR), CLEAR_AFTER_MS);
}

export function TabLink({ href, direction, className, children }: { href: string; direction: TabDirection; className: string; children: ReactNode }) {
  return (
    <Link href={href} replace onClick={() => markTabDirection(direction)} className={className}>
      {children}
    </Link>
  );
}
