import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { TabBar } from "@/components/tab-bar";
import type { ShowMap } from "@/lib/map-types";
import { getShow, getTimetable } from "@/lib/show";
import { ShowHomeTabs } from "../show-home-tabs";
import { ShowHomeTop } from "../show-home-top";
import { TabSwipe } from "../tab-swipe";
import { MapView } from "./map-view";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

async function ShowMapContent({ showId }: { showId: number }) {
  const [res, timetable] = await Promise.all([fetch(`${API_URL}/api/shows/${showId}/map`), getTimetable(showId)]);
  if (!res.ok) throw new Error(`맵 조회 실패: ${res.status}`);
  const map: ShowMap = await res.json();
  return <MapView showId={showId} map={map} timetable={timetable} />;
}

export default async function ShowMapPage({ params }: PageProps<"/shows/[id]/map">) {
  const { id } = await params;
  const show = await getShow(id);
  if (!show) notFound();

  return (
    <AppFrame className="pb-32">
      <ShowHomeTop show={show} />
      <ShowHomeTabs showId={show.id} active="map" />
      <TabSwipe prev={`/shows/${show.id}/timetable`} next={`/shows/${show.id}/suggestions`} className="min-h-[60dvh]">
        <Suspense fallback={null}>
          <ShowMapContent showId={show.id} />
        </Suspense>
      </TabSwipe>
      <TabBar />
    </AppFrame>
  );
}
