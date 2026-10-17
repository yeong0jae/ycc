import { ViewTransition } from "react";
import { ViewToggle } from "@/components/view-toggle";
import { getFacilities } from "@/lib/show";
import { ConcertMap } from "./concert-map";

export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const { facility } = await searchParams;
  const facilities = await getFacilities();
  const initialFacilityId = typeof facility === "string" ? Number(facility) : null;
  const showCount = facilities.reduce((sum, facility) => sum + facility.shows.length, 0);

  return (
    <ViewTransition
      enter={{ "view-switch": "view-fade", default: "none" }}
      exit={{ "view-switch": "view-fade", default: "none" }}
      default="none"
    >
      <main className="mx-auto flex h-dvh w-full max-w-2xl flex-col">
        <MapHeader caption={`${facilities.length} VENUES · ${showCount}`} />
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

export function MapHeader({ caption }: { caption: string }) {
  return (
    <header className="z-10 flex items-center justify-between gap-3 bg-paper px-4 pt-5 pb-4 shadow-[0_1px_0_var(--color-line)]">
      <div>
        <p className="font-mono text-xs tracking-[0.12em] text-muted">{caption}</p>
        <h1 className="font-display text-[26px] leading-tight">다가오는 콘서트</h1>
      </div>
      <ViewToggle current="map" />
    </header>
  );
}
