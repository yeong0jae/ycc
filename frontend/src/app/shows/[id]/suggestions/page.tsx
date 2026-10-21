import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { TabBar } from "@/components/tab-bar";
import { backendFetch, getMe, KAKAO_LOGIN_URL } from "@/lib/auth";
import { getShow } from "@/lib/show";
import type { ShowSuggestions } from "@/lib/suggestion-types";
import { ShowHomeTabs } from "../show-home-tabs";
import { ShowHomeTop } from "../show-home-top";
import { SuggestionFeed } from "./suggestion-feed";

async function Suggestions({ showId, showName }: { showId: number; showName: string }) {
  const [res, me] = await Promise.all([backendFetch(`/api/shows/${showId}/suggestions`), getMe()]);
  if (!res.ok) throw new Error(`건의 조회 실패: ${res.status}`);
  const initial: ShowSuggestions = await res.json();
  return <SuggestionFeed showId={showId} showName={showName} initial={initial} signedIn={me !== null} loginUrl={KAKAO_LOGIN_URL} />;
}

export default async function ShowSuggestionsPage({ params }: PageProps<"/shows/[id]/suggestions">) {
  const { id } = await params;
  const show = await getShow(id);
  if (!show) notFound();

  return (
    <AppFrame className="pb-32">
      <ShowHomeTop show={show} />
      <Suspense fallback={<ShowHomeTabs showId={show.id} active="suggestions" />}>
        <Suggestions showId={show.id} showName={show.name} />
      </Suspense>
      <TabBar />
    </AppFrame>
  );
}
