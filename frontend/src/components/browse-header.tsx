import { ViewTransition } from "react";
import { ViewToggle } from "./view-toggle";

export function BrowseHeader({ current }: { current?: "list" | "map" }) {
  const Title = current ? "h1" : "p";
  return (
    <ViewTransition name="browse-header">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-paper px-4 pt-5 pb-4 shadow-[0_1px_0_var(--color-line)]">
        <Title className="font-display text-3xl leading-tight">다가오는 콘서트</Title>
        <ViewToggle current={current} />
      </header>
    </ViewTransition>
  );
}
