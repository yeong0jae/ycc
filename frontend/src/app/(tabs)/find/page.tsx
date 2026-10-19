import { ViewTransition } from "react";
import { AppFrame } from "@/components/app-frame";
import { KopisSource } from "@/components/kopis-source";
import { getShows } from "@/lib/show";
import { parseKind } from "@/lib/show-types";
import { ShowSearch } from "./show-search";

export default async function FindPage({ searchParams }: PageProps<"/find">) {
  const { q, kind: kindParam } = await searchParams;
  const kind = parseKind(kindParam);
  const query = typeof q === "string" ? q : "";
  const [past, upcoming] = await Promise.all([
    getShows({ kind, q: query, period: "PAST" }),
    getShows({ kind, q: query, period: "UPCOMING" }),
  ]);

  return (
    <ViewTransition
      enter={{ "view-switch": "view-fade", default: "none" }}
      exit={{ "view-switch": "view-fade", default: "none" }}
      default="none"
    >
      <AppFrame className="pb-32 [overflow-anchor:none]">
        <ShowSearch key={kind} kind={kind} initialQuery={query} initialPast={past} initialUpcoming={upcoming} />
        <KopisSource className="mt-10 px-4 text-center" />
      </AppFrame>
    </ViewTransition>
  );
}
