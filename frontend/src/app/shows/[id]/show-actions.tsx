import Link from "next/link";
import { getMe } from "@/lib/auth";
import { todayInSeoul } from "@/lib/format";
import { getShowMe } from "@/lib/logs";
import { AttendancePicker } from "./attendance-picker";

export async function ShowActions({ showId, startDate, endDate }: { showId: number; startDate: string; endDate: string }) {
  const me = await getMe();
  if (!me) {
    return (
      <Link href="/login" className="mx-4 flex h-12 items-center justify-center rounded-xl border-[1.5px] border-ink font-semibold">
        로그인하고 기록하기
      </Link>
    );
  }
  const mine = await getShowMe(String(showId));
  const today = todayInSeoul();
  const log = mine?.log;

  return (
    <div className="mx-4 flex flex-col gap-3">
      <AttendancePicker
        showId={showId}
        startDate={startDate}
        endDate={endDate}
        today={today}
        initial={mine?.attendances ?? []}
      />
      {log?.status === "READY" ? (
        <Link href={`/logs/${log.id}`} className="flex h-12 items-center justify-center rounded-xl bg-ink font-semibold text-stub">
          내 로그 보기
        </Link>
      ) : (
        today >= startDate && (
          <Link href={`/shows/${showId}/log`} className="flex h-12 items-center justify-center rounded-xl bg-ink font-semibold text-stub">
            {log ? "로그 이어서 남기기" : "공연날 로그 남기기"}
          </Link>
        )
      )}
    </div>
  );
}
