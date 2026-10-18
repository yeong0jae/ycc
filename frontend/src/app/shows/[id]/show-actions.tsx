import Link from "next/link";
import { PlanButton } from "@/components/plan-button";
import { getMe } from "@/lib/auth";
import { todayInSeoul } from "@/lib/format";
import { getShowMe } from "@/lib/logs";

export async function ShowActions({ showId, startDate }: { showId: number; startDate: string }) {
  const me = await getMe();
  if (!me) {
    return (
      <Link href="/login" className="mx-4 flex h-12 items-center justify-center rounded-xl border-[1.5px] border-ink font-semibold">
        로그인하고 &apos;갈 거예요&apos; 표시하기
      </Link>
    );
  }
  const mine = await getShowMe(String(showId));
  const started = todayInSeoul() >= startDate;
  const log = mine?.log;

  return (
    <div className="mx-4 flex gap-2">
      <PlanButton showId={showId} planned={mine?.planned ?? false} />
      {log?.status === "READY" ? (
        <Link href={`/logs/${log.id}`} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-ink font-semibold text-stub">
          내 로그 보기
        </Link>
      ) : (
        started && (
          <Link href={`/shows/${showId}/log`} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-ink font-semibold text-stub">
            {log ? "로그 이어서 남기기" : "공연날 로그 남기기"}
          </Link>
        )
      )}
    </div>
  );
}
