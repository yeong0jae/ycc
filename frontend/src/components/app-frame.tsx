import type { ReactNode } from "react";

export function AppFrame({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <main className={`mx-auto w-full max-w-2xl ${className}`}>{children}</main>;
}
