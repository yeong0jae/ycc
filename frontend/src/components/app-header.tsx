import type { ReactNode } from "react";
import { ViewTransition } from "react";

export function AppHeader({
  title,
  as: Title = "h1",
  leading,
  trailing,
}: {
  title: ReactNode;
  as?: "h1" | "p";
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <ViewTransition name="app-header">
      <header className="sticky top-0 z-10 flex h-17 items-center gap-2 bg-paper px-3">
        {leading}
        <Title className="min-w-0 flex-1 truncate px-1 font-display text-[22px] leading-tight">{title}</Title>
        {trailing}
      </header>
    </ViewTransition>
  );
}
