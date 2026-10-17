import { MapHeader } from "./page";

export default function Loading() {
  return (
    <main className="mx-auto flex h-dvh w-full max-w-2xl flex-col" aria-busy="true">
      <MapHeader caption="불러오는 중" />
      <div className="flex-1 animate-pulse bg-line motion-reduce:animate-none" />
    </main>
  );
}
