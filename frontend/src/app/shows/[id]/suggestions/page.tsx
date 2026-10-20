import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { TabBar } from "@/components/tab-bar";
import { backendFetch } from "@/lib/auth";
import { getShow } from "@/lib/show";
import type { ShowSuggestions } from "@/lib/suggestion-types";
import { ShowHomeTabs } from "../show-home-tabs";
import { ShowHomeTop } from "../show-home-top";
import { SuggestionFeed } from "./suggestion-feed";

async function Suggestions({ showId }: { showId: number }) {
  const res = await backendFetch(`/api/shows/${showId}/suggestions`);
  if (!res.ok) throw new Error(`건의 조회 실패: ${res.status}`);
  const initial: ShowSuggestions = await res.json();
  return <SuggestionFeed showId={showId} initial={initial} />;
}

export default async function ShowSuggestionsPage({ params }: PageProps<"/shows/[id]/suggestions">) {
  const { id } = await params;
  const show = await getShow(id);
  if (!show) notFound();

  return (
    <AppFrame className="pb-32">
      <ShowHomeTop show={show} />
      <Suspense fallback={<ShowHomeTabs showId={show.id} active="suggestions" />}>
        <Suggestions showId={show.id} />
      </Suspense>
      <TabBar />
    </AppFrame>
  );
}
