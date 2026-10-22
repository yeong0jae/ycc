"use client";

import { useEffect, useRef, useState } from "react";
import { NoticeItem, UrgentNoticeCard } from "@/components/notice-card";
import type { ShowNotices } from "@/lib/notice-types";
import { ShowHomeTabs } from "../show-home-tabs";
import { TabSwipe } from "../tab-swipe";

function noticeIds(notices: ShowNotices) {
  return [notices.urgent, ...notices.items].flatMap((it) => (it ? [it.id] : []));
}

export function NoticeFeed({ showId, suggestions, initial }: { showId: number; suggestions: boolean; initial: ShowNotices }) {
  const [notices, setNotices] = useState(initial);
  const [fresh, setFresh] = useState<ReadonlySet<number>>(new Set());
  const seen = useRef(new Set(noticeIds(initial)));
  const isNew = (id: number) => fresh.has(id);

  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await fetch(`/api/shows/${showId}/notices`).catch(() => null);
      if (!res?.ok) return;
      const next: ShowNotices = await res.json();
      setFresh(new Set(noticeIds(next).filter((id) => !seen.current.has(id))));
      noticeIds(next).forEach((id) => seen.current.add(id));
      setNotices(next);
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [showId]);

  return (
    <>
      {notices.urgent && (
        <div className={`mx-3 mt-4 ${isNew(notices.urgent.id) ? "animate-rise motion-reduce:animate-none" : ""}`}>
          <UrgentNoticeCard key={notices.urgent.id} notice={notices.urgent} />
        </div>
      )}
      <ShowHomeTabs showId={showId} active="notices" count={notices.total} suggestions={suggestions} />
      <TabSwipe next={`/shows/${showId}/timetable`} className="flex min-h-[60dvh] flex-col px-5">
        {notices.items.map((notice) => (
          <div key={`${notice.id}:${notice.updatedAt ?? ""}`} className={isNew(notice.id) ? "animate-rise motion-reduce:animate-none" : ""}>
            <NoticeItem notice={notice} />
          </div>
        ))}
        {notices.total === 0 && <p className="py-16 text-center text-sm text-muted">아직 올라온 공지가 없어요.</p>}
      </TabSwipe>
    </>
  );
}
