import { ViewTransition } from "react";
import { BrowseHeader } from "@/components/browse-header";
import { getShows } from "@/lib/show";
import { ShowList } from "./show-list";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { q } = await searchParams;
  const shows = await getShows();

  return (
    <ViewTransition
      enter={{ "view-switch": "view-fade", default: "none" }}
      exit={{ "view-switch": "view-fade", default: "none" }}
      default="none"
    >
      <main className="mx-auto w-full max-w-2xl">
        <BrowseHeader current="list" />
        <div className="px-4 py-6">
          <ShowList shows={shows} initialQuery={typeof q === "string" ? q : ""} />
        </div>
      </main>
    </ViewTransition>
  );
}
