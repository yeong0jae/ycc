import Link from "next/link";
import { formatPeriod } from "@/lib/format";
import type { ShowLog } from "@/lib/logs";

export function LogTile({ log, showName = true }: { log: ShowLog; showName?: boolean }) {
  return (
    <Link href={`/logs/${log.id}`} className="relative block aspect-[9/16] overflow-hidden rounded-xl bg-ink text-stub">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={log.thumbnailUrl} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      <span className="absolute top-2 left-2 rounded-full bg-ink/55 px-1.5 py-0.5 font-mono text-[10px]">
        {formatPeriod(log.showStartDate, log.showStartDate)}
      </span>
      <span className="absolute inset-x-2 bottom-2 text-xs leading-snug font-semibold [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
        {showName ? log.showName : log.nickname}
      </span>
    </Link>
  );
}
