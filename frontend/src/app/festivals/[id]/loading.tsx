export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-4" aria-busy="true">
      <div className="h-11" />
      <div className="relative mt-4 overflow-hidden rounded-[20px] bg-stub">
        <div className="aspect-[3/4] w-full animate-pulse bg-line motion-reduce:animate-none" />
        <div className="animate-pulse space-y-4 p-5 motion-reduce:animate-none">
          <div className="h-8 w-2/3 rounded bg-line" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-10 rounded bg-line" />
            <div className="h-10 rounded bg-line" />
          </div>
          <div className="h-10 w-3/4 rounded bg-line" />
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
    </main>
  );
}
