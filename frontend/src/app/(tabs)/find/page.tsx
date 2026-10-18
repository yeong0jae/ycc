import { ViewTransition } from "react";
import { AppFrame } from "@/components/app-frame";
import { BrowseHeader } from "@/components/browse-header";
import { KopisSource } from "@/components/kopis-source";
import { searchShows } from "@/lib/show";
import { ShowSearch } from "./show-search";

export default async function FindPage({ searchParams }: PageProps<"/find">) {
  const { q, when } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const showWhen = when === "past" ? "PAST" : when === "ongoing" ? "ONGOING" : "UPCOMING";
  const initial = await searchShows(query, showWhen);

  return (
    <ViewTransition
      enter={{ "view-switch": "view-fade", default: "none" }}
      exit={{ "view-switch": "view-fade", default: "none" }}
      default="none"
    >
      <AppFrame className="pb-28">
        <BrowseHeader current="list" />
        <div className="px-4 py-6">
          <ShowSearch initialQuery={query} initialWhen={showWhen} initial={initial} />
          <KopisSource className="mt-8 text-center" />
        </div>
      </AppFrame>
    </ViewTransition>
  );
}
