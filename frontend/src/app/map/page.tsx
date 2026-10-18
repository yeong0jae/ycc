import { ViewTransition } from "react";
import { BrowseHeader } from "@/components/browse-header";
import { getFacilities } from "@/lib/show";
import { ConcertMap } from "./concert-map";

export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const { facility } = await searchParams;
  const facilities = await getFacilities();
  const initialFacilityId = typeof facility === "string" ? Number(facility) : null;

  return (
    <ViewTransition
      enter={{ "view-switch": "view-fade", default: "none" }}
      exit={{ "view-switch": "view-fade", default: "none" }}
      default="none"
    >
      <main className="mx-auto flex h-dvh w-full max-w-2xl flex-col">
        <BrowseHeader current="map" />
        <ConcertMap
          key={initialFacilityId ?? "all"}
          facilities={facilities}
          appKey={process.env.KAKAO_MAP_KEY ?? ""}
          initialFacilityId={initialFacilityId}
        />
      </main>
    </ViewTransition>
  );
}
