import { AppFrame } from "@/components/app-frame";

export default function Loading() {
  return (
    <AppFrame className="pb-32">
      <div aria-busy="true">
        <div className="flex gap-2 px-3 pt-2.5 pb-3">
          <div className="h-12 flex-1 rounded-full bg-pill" />
          <div className="size-12 rounded-full bg-pill" />
        </div>
        <ul className="grid animate-pulse grid-cols-2 gap-x-2.5 gap-y-4.5 px-3 motion-reduce:animate-none sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex flex-col gap-2">
              <div className="aspect-[3/4] rounded-2xl bg-pill" />
              <div className="h-4 w-4/5 rounded bg-pill" />
              <div className="h-3.5 w-1/2 rounded bg-pill" />
            </li>
          ))}
        </ul>
        <p className="sr-only">불러오는 중</p>
      </div>
    </AppFrame>
  );
}
