import { AppFrame } from "@/components/app-frame";
import { BackButton } from "@/components/back-button";

export default function Loading() {
  return (
    <AppFrame>
      <div className="px-3 pt-2.5">
        <BackButton />
      </div>
      <div aria-busy="true" className="flex animate-pulse flex-col gap-3 px-5 pt-4 motion-reduce:animate-none">
        <div className="h-6.5 w-14 rounded-full bg-pill" />
        <div className="h-8 w-3/4 rounded bg-pill" />
        <div className="h-5 w-1/2 rounded bg-pill" />
        <div className="-mx-2 mt-2 aspect-[3/4] rounded-[20px] bg-pill" />
        <p className="sr-only">불러오는 중</p>
      </div>
    </AppFrame>
  );
}
