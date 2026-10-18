import { AppFrame } from "@/components/app-frame";

export default function Loading() {
  return (
    <AppFrame className="pb-32">
      <div aria-busy="true" className="flex animate-pulse flex-col gap-3 px-5 pt-6 motion-reduce:animate-none">
        <div className="h-4 w-20 rounded bg-pill" />
        <div className="h-16 w-3/4 rounded bg-pill" />
        <p className="sr-only">불러오는 중</p>
      </div>
    </AppFrame>
  );
}
