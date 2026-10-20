const COLORS = ["#111111", "#1e7fcb", "#e0702a", "#2e8b57", "#d9529a", "#6b6b72"];

function color(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)!) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function CommunityAvatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" aria-hidden="true" width={size} height={size} style={{ width: size, height: size }} className="shrink-0 rounded-full bg-pill object-cover" />;
  }
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, background: color(name), fontSize: Math.round(size * 0.42) }}
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-stub"
    >
      {name.slice(0, 1)}
    </span>
  );
}
