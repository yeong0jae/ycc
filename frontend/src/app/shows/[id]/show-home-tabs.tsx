import { ViewTransition } from "react";
import { TabLink } from "./tab-link";

const TABS = [
  { key: "notices", path: "notices", label: "공지" },
  { key: "timetable", path: "timetable", label: "타임테이블" },
  { key: "map", path: "map", label: "맵" },
  { key: "suggestions", path: "suggestions", label: "문의" },
  { key: "community", path: "community", label: "커뮤니티" },
] as const;

export type ShowHomeTab = (typeof TABS)[number]["key"];

const tabClass = "relative flex h-11 shrink-0 items-center gap-1 text-[15px]";

export function ShowHomeTabs({ showId, active, count, suggestions }: { showId: number; active: ShowHomeTab; count?: number; suggestions: boolean }) {
  const tabs = TABS.filter((tab) => suggestions || tab.key !== "suggestions");
  const activeIndex = tabs.findIndex((tab) => tab.key === active);
  return (
    <nav aria-label="공연 홈" className="sticky top-17 z-40 mt-4.5 flex gap-4.5 overflow-x-auto bg-paper px-5 shadow-[inset_0_-1px_0_var(--color-line)]">
      {tabs.map((tab, index) =>
        tab.key === active ? (
          <span key={tab.key} aria-current="page" className={`${tabClass} font-bold`}>
            {tab.label}
            {count !== undefined && <span className="font-num text-[13px] font-black">{count}</span>}
            <ViewTransition name="show-home-tab" share="tab-indicator" default="none">
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-ink" />
            </ViewTransition>
          </span>
        ) : (
          <TabLink key={tab.key} href={`/shows/${showId}/${tab.path}`} direction={index > activeIndex ? "forward" : "back"} className={`${tabClass} text-muted`}>
            {tab.label}
          </TabLink>
        ),
      )}
    </nav>
  );
}
