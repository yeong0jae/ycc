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
      <header className="sticky top-0 z-10 flex h-20 items-center gap-2 bg-paper px-4 shadow-[0_1px_0_var(--color-line)]">
        {leading}
        <Title className="min-w-0 flex-1 truncate font-display text-3xl leading-tight">{title}</Title>
        {trailing}
      </header>
    </ViewTransition>
  );
}
