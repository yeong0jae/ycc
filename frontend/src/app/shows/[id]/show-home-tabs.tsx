import { ViewTransition } from "react";
import { TabLink } from "./tab-link";

const SOON = ["건의", "커뮤니티"];

const TABS = [
  { key: "notices", path: "notices", label: "공지" },
  { key: "timetable", path: "timetable", label: "타임테이블" },
] as const;

export type ShowHomeTab = (typeof TABS)[number]["key"];

const tabClass = "relative flex h-11 shrink-0 items-center gap-1 text-[15px]";

export function ShowHomeTabs({ showId, active, noticeCount }: { showId: number; active: ShowHomeTab; noticeCount?: number }) {
  const activeIndex = TABS.findIndex((tab) => tab.key === active);
  return (
    <nav aria-label="공연 홈" className="sticky top-17 z-40 mt-4.5 flex gap-4.5 overflow-x-auto bg-paper px-5 shadow-[inset_0_-1px_0_var(--color-line)]">
      {TABS.map((tab, index) =>
        tab.key === active ? (
          <span key={tab.key} aria-current="page" className={`${tabClass} font-bold`}>
            {tab.label}
            {tab.key === "notices" && noticeCount !== undefined && <span className="font-num text-[13px] font-black">{noticeCount}</span>}
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
      {SOON.map((label) => (
        <span key={label} aria-disabled="true" title="곧 열려요" className={`${tabClass} text-[#b9b9c0]`}>
          {label}
        </span>
      ))}
    </nav>
  );
}
