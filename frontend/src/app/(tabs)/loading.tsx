import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";

export default function Loading() {
  return (
    <AppFrame className="pb-32">
      <div aria-busy="true">
        <AppHeader title="다가오는 공연" />
        <div className="flex animate-pulse flex-col gap-3 px-4 py-6 motion-reduce:animate-none">
          <div className="h-80 rounded-[20px] bg-stub" />
          <div className="h-19 rounded-2xl bg-stub" />
          <div className="h-19 rounded-2xl bg-stub" />
        </div>
        <p className="sr-only">불러오는 중</p>
      </div>
    </AppFrame>
  );
}
