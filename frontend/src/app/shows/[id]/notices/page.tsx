import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { TabBar } from "@/components/tab-bar";
import { getShow, getShowNotices } from "@/lib/show";
import { ShowHomeTabs } from "../show-home-tabs";
import { ShowHomeTop } from "../show-home-top";
import { NoticeFeed } from "./notice-feed";
import { QrJoined } from "./qr-joined";

async function Notices({ showId, suggestions }: { showId: number; suggestions: boolean }) {
  return <NoticeFeed showId={showId} suggestions={suggestions} initial={await getShowNotices(showId)} />;
}

export default async function ShowNoticesPage({ params }: PageProps<"/shows/[id]/notices">) {
  const { id } = await params;
  const show = await getShow(id);
  if (!show) notFound();

  return (
    <AppFrame className="pb-32">
      <ShowHomeTop show={show} />
      <Suspense fallback={<ShowHomeTabs showId={show.id} active="notices" suggestions={show.suggestionsEnabled} />}>
        <Notices showId={show.id} suggestions={show.suggestionsEnabled} />
      </Suspense>
      <Suspense fallback={null}>
        <QrJoined showId={show.id} />
      </Suspense>
      <TabBar />
    </AppFrame>
  );
}
