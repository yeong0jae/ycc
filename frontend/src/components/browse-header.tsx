import { ViewTransition } from "react";
import { ViewToggle } from "./view-toggle";

export function BrowseHeader({ current, count }: { current: "list" | "map"; count?: number }) {
  return (
    <ViewTransition name="browse-header">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-paper px-4 pt-5 pb-4 shadow-[0_1px_0_var(--color-line)]">
        <div>
          <p className="flex h-[1lh] items-center gap-1.5 font-mono text-[13px] tracking-[0.12em] text-muted">
            {count === undefined ? (
              <>
                UPCOMING ·
                <span className="h-3 w-8 animate-pulse rounded bg-line motion-reduce:animate-none" />
              </>
            ) : (
              `UPCOMING · ${String(count).padStart(2, "0")}`
            )}
          </p>
          <h1 className="font-display text-3xl leading-tight">다가오는 콘서트</h1>
        </div>
        <ViewToggle current={current} />
      </header>
    </ViewTransition>
  );
}
