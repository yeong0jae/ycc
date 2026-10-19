import { connection } from "next/server";
import { LiveBadge } from "@/components/live-badge";
import { festivalBadge } from "@/lib/format";

export async function DetailBadge({ startDate, endDate, className = "" }: { startDate: string; endDate: string; className?: string }) {
  await connection();
  const badge = festivalBadge(startDate, endDate);
  if (!badge) return null;
  return <LiveBadge label={badge.label} live={badge.live} idle="bg-pill" className={className} />;
}
