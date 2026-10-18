export function LiveBadge({
  label,
  live,
  idle = "bg-stub/92",
  className = "",
}: {
  label: string;
  live: boolean;
  idle?: string;
  className?: string;
}) {
  return (
    <span
      className={`flex items-center gap-1 rounded-full font-num ${live ? "bg-lime" : idle} text-ink ${className}`}
    >
      {live && <span aria-hidden="true" className="size-1.5 animate-beat rounded-full bg-ink motion-reduce:animate-none" />}
      {label}
    </span>
  );
}
