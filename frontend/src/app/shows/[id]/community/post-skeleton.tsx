export function PostSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-shimmer gap-3 px-5 pt-3.5 pb-4 shadow-[inset_0_-1px_0_#eeeef1] motion-reduce:animate-none">
      <span className="size-9 shrink-0 rounded-full bg-pill" />
      <span className="flex flex-1 flex-col gap-2 pt-0.5">
        <span className="h-3.5 w-2/5 rounded-full bg-pill" />
        <span className="h-3.5 w-full rounded-full bg-pill" />
        <span className="h-3.5 w-3/4 rounded-full bg-pill" />
      </span>
    </div>
  );
}
