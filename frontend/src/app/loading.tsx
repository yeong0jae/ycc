export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6" aria-busy="true">
      <header className="mb-6 px-1 pt-2">
        <div className="h-[1lh] w-24 animate-pulse rounded bg-line text-[13px] motion-reduce:animate-none" />
        <h1 className="font-display text-4xl leading-tight">다가오는 콘서트</h1>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="relative flex min-h-37 overflow-hidden rounded-2xl bg-stub">
            <div className="w-27 shrink-0 animate-pulse bg-line motion-reduce:animate-none" />
            <div className="my-3.5 border-l-2 border-dashed border-line" />
            <div className="absolute -top-2.5 left-24.75 size-5 rounded-full bg-paper" />
            <div className="absolute -bottom-2.5 left-24.75 size-5 rounded-full bg-paper" />
            <div className="flex flex-1 animate-pulse flex-col justify-between p-4 motion-reduce:animate-none">
              <div className="space-y-2">
                <div className="h-5 w-3/4 rounded bg-line" />
                <div className="h-4 w-1/2 rounded bg-line" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-24 rounded bg-line" />
                <div className="h-5 w-12 rounded-full bg-line" />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="sr-only">불러오는 중</p>
    </main>
  );
}
