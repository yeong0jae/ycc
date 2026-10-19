import { ViewTransition } from "react";
import { AppFrame } from "@/components/app-frame";
import { KopisSource } from "@/components/kopis-source";
import { getShows } from "@/lib/show";
import { parseKind } from "@/lib/show-types";
import { ShowSearch } from "./show-search";

export default async function FindPage({ searchParams }: PageProps<"/find">) {
  const { q, kind: kindParam } = await searchParams;
  const kind = parseKind(kindParam);
  const shows = await getShows(kind);

  return (
    <ViewTransition
      enter={{ "view-switch": "view-fade", default: "none" }}
      exit={{ "view-switch": "view-fade", default: "none" }}
      default="none"
    >
      <AppFrame className="pb-32">
        <ShowSearch key={kind} kind={kind} shows={shows} initialQuery={typeof q === "string" ? q : ""} />
        <KopisSource className="mt-10 px-4 text-center" />
      </AppFrame>
    </ViewTransition>
  );
}
