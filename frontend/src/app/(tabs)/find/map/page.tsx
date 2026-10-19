import { ViewTransition } from "react";
import { AppFrame } from "@/components/app-frame";
import { getFacilities } from "@/lib/show";
import { parseKind } from "@/lib/show-types";
import { ConcertMap } from "./concert-map";

export default async function MapPage({ searchParams }: PageProps<"/find/map">) {
  const { facility, kind: kindParam } = await searchParams;
  const kind = parseKind(kindParam);
  const facilities = await getFacilities(kind);
  const initialFacilityId = typeof facility === "string" ? Number(facility) : null;

  return (
    <ViewTransition
      enter={{ "view-switch": "view-fade", default: "none" }}
      exit={{ "view-switch": "view-fade", default: "none" }}
      default="none"
    >
      <AppFrame className="relative flex h-dvh flex-col">
        <ConcertMap
          key={`${kind}:${initialFacilityId ?? "all"}`}
          facilities={facilities}
          appKey={process.env.KAKAO_MAP_KEY ?? ""}
          initialFacilityId={initialFacilityId}
        />
      </AppFrame>
    </ViewTransition>
  );
}
