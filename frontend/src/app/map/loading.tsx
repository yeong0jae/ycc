import { BrowseHeader } from "@/components/browse-header";

export default function Loading() {
  return (
    <main className="mx-auto flex h-dvh w-full max-w-2xl flex-col" aria-busy="true">
      <BrowseHeader current="map" />
      <div className="flex-1 animate-pulse bg-line motion-reduce:animate-none" />
    </main>
  );
}
