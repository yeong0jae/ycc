import { AppFrame } from "@/components/app-frame";
import { BrowseHeader } from "@/components/browse-header";

export default function Loading() {
  return (
    <AppFrame className="flex h-dvh flex-col">
      <BrowseHeader current="map" />
      <div aria-busy="true" className="flex-1 animate-pulse bg-line motion-reduce:animate-none" />
    </AppFrame>
  );
}
