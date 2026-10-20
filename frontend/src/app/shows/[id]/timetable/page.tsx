import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { TabBar } from "@/components/tab-bar";
import { getShow, getTimetable } from "@/lib/show";
import { ShowHomeTabs } from "../show-home-tabs";
import { ShowHomeTop } from "../show-home-top";
import { TabSwipe } from "../tab-swipe";
import { TimetableView } from "./timetable-view";

async function Timetable({ showId }: { showId: number }) {
  return <TimetableView timetable={await getTimetable(showId)} />;
}

export default async function ShowTimetablePage({ params }: PageProps<"/shows/[id]/timetable">) {
  const { id } = await params;
  const show = await getShow(id);
  if (!show) notFound();

  return (
    <AppFrame className="pb-32">
      <ShowHomeTop show={show} />
      <ShowHomeTabs showId={show.id} active="timetable" />
      <TabSwipe prev={`/shows/${show.id}/notices`} className="min-h-[60dvh]">
        <Suspense fallback={null}>
          <Timetable showId={show.id} />
        </Suspense>
      </TabSwipe>
      <TabBar />
    </AppFrame>
  );
}
