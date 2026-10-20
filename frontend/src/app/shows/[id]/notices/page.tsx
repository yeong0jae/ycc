import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { TabBar } from "@/components/tab-bar";
import { getShow, getShowNotices } from "@/lib/show";
import { ShowHomeTabs } from "../show-home-tabs";
import { ShowHomeTop } from "../show-home-top";
import { NoticeFeed } from "./notice-feed";

async function Notices({ showId }: { showId: number }) {
  return <NoticeFeed showId={showId} initial={await getShowNotices(showId)} />;
}

export default async function ShowNoticesPage({ params }: PageProps<"/shows/[id]/notices">) {
  const { id } = await params;
  const show = await getShow(id);
  if (!show) notFound();

  return (
    <AppFrame className="pb-32">
      <ShowHomeTop show={show} />
      <Suspense fallback={<ShowHomeTabs showId={show.id} active="notices" />}>
        <Notices showId={show.id} />
      </Suspense>
      <TabBar />
    </AppFrame>
  );
}
