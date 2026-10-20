import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { TabBar } from "@/components/tab-bar";
import { backendFetch, getMe, KAKAO_LOGIN_URL } from "@/lib/auth";
import type { PostPage } from "@/lib/community-types";
import { getShow } from "@/lib/show";
import { ShowHomeTabs } from "../show-home-tabs";
import { ShowHomeTop } from "../show-home-top";
import { CommunityFeed } from "./community-feed";

async function Community({ showId }: { showId: number }) {
  const [res, me] = await Promise.all([backendFetch(`/api/shows/${showId}/community`), getMe()]);
  if (!res.ok) throw new Error(`커뮤니티 조회 실패: ${res.status}`);
  const initial: PostPage = await res.json();
  return <CommunityFeed showId={showId} initial={initial} me={me} loginUrl={KAKAO_LOGIN_URL} />;
}

export default async function ShowCommunityPage({ params }: PageProps<"/shows/[id]/community">) {
  const { id } = await params;
  const show = await getShow(id);
  if (!show) notFound();

  return (
    <AppFrame className="pb-32">
      <ShowHomeTop show={show} />
      <Suspense fallback={<ShowHomeTabs showId={show.id} active="community" />}>
        <Community showId={show.id} />
      </Suspense>
      <TabBar />
    </AppFrame>
  );
}
