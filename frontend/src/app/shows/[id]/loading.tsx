import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { BackButton } from "@/components/back-button";

export default function Loading() {
  return (
    <AppFrame>
      <AppHeader as="p" title="콘서트" leading={<BackButton />} />
      <div aria-busy="true">
        <div className="relative m-4 mt-6 overflow-hidden rounded-[20px] bg-stub">
          <div className="sm:flex">
            <div className="aspect-[3/4] w-full animate-pulse bg-line motion-reduce:animate-none sm:w-64 sm:shrink-0" />
            <div className="flex-1 animate-pulse space-y-4 p-5 motion-reduce:animate-none">
              <div className="h-8 w-2/3 rounded bg-line" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 rounded bg-line" />
                <div className="h-10 rounded bg-line" />
              </div>
              <div className="h-10 w-3/4 rounded bg-line" />
            </div>
          </div>
          <div className="mx-4.5 border-t-2 border-dashed border-line" />
          <div className="absolute -left-2.5 bottom-17.5 size-5 rounded-full bg-paper" />
          <div className="absolute -right-2.5 bottom-17.5 size-5 rounded-full bg-paper" />
          <div className="flex gap-2 px-4 pt-3.5 pb-4">
            <div className="h-12 flex-1 animate-pulse rounded-xl bg-line motion-reduce:animate-none" />
            <div className="h-12 flex-1 animate-pulse rounded-xl bg-line motion-reduce:animate-none" />
          </div>
        </div>
        <p className="sr-only">불러오는 중</p>
      </div>
    </AppFrame>
  );
}
