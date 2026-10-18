import Link from "next/link";
import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { MarkAttendedButton } from "@/components/mark-attended-button";
import { getMe } from "@/lib/auth";
import { daysFromToday, formatDay, formatDaysLeft } from "@/lib/format";
import { type AttendanceItem, getHome } from "@/lib/logs";

function AddButton() {
  return (
    <Link
      href="/find"
      aria-label="공연 찾기"
      className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-stub"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </Link>
  );
}

function NextTicket({ item }: { item: AttendanceItem }) {
  const today = daysFromToday(item.date) === 0;
  return (
    <div className="flex flex-col gap-3">
      <Link href={`/shows/${item.showId}`} className="relative flex flex-col overflow-hidden rounded-[20px] bg-stub">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.posterUrl} alt="" className="h-44 w-full object-cover" />
        <div className="flex flex-col gap-1.5 px-4.5 pt-4 pb-3.5">
          <p className="font-display text-[22px] leading-snug">{item.showName}</p>
          <p className="text-sm text-muted">{item.venue}</p>
        </div>
        <div className="mx-4 border-t-2 border-dashed border-line" />
        <div className="absolute -left-2.5 bottom-12.5 size-5 rounded-full bg-paper" />
        <div className="absolute -right-2.5 bottom-12.5 size-5 rounded-full bg-paper" />
        <div
          className={`flex h-15 items-center justify-between px-4.5 font-mono ${today ? "bg-ink text-stub" : ""}`}
        >
          <span className="text-[15px]">{formatDay(item.date)}</span>
          <span className="text-[22px]">{formatDaysLeft(item.date)}</span>
        </div>
      </Link>
      {today && (
        <Link
          href={item.logId ? `/logs/${item.logId}` : `/shows/${item.showId}/log`}
          className="flex h-13 items-center justify-center rounded-2xl bg-ink font-semibold text-stub"
        >
          {item.logId ? "오늘 로그 보기" : "공연날 로그 남기기"}
        </Link>
      )}
    </div>
  );
}

function SmallTicket({ item }: { item: AttendanceItem }) {
  return (
    <Link href={`/shows/${item.showId}`} className="flex h-19 overflow-hidden rounded-2xl bg-stub">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.posterUrl} alt="" loading="lazy" className="w-14 shrink-0 object-cover" />
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3.5">
        <span className="truncate text-[15px] font-semibold">{item.showName}</span>
        <span className="truncate text-[13px] text-muted">{item.venue}</span>
      </span>
      <span className="my-2.5 border-l-2 border-dashed border-line" />
      <span className="flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 font-mono">
        <span className="text-[13px]">{formatDay(item.date)}</span>
        <span className="text-xs text-muted">{formatDaysLeft(item.date)}</span>
      </span>
    </Link>
  );
}

export default async function HomePage() {
  const me = await getMe();
  if (me && !me.onboarded) redirect("/onboarding");
  const home = me ? await getHome() : null;
  const [next, ...rest] = home?.upcoming ?? [];

  return (
    <AppFrame className="pb-32">
      <AppHeader title="다가오는 공연" trailing={me && <AddButton />} />
      <div className="flex flex-col gap-7 px-4 py-6">
        {!me && (
          <div className="flex flex-col items-center gap-4 rounded-[20px] bg-stub px-6 py-10 text-center">
            <p className="font-display text-xl leading-snug">갈 공연과 다녀온 공연을<br />한곳에 모아 보세요</p>
            <Link href="/login" className="flex h-12 items-center rounded-xl bg-ink px-6 font-semibold text-stub">
              로그인하고 시작하기
            </Link>
            <Link href="/find" className="text-sm text-muted underline underline-offset-4">
              먼저 공연 둘러보기
            </Link>
          </div>
        )}

        {me && !next && (
          <Link
            href="/find"
            className="flex flex-col items-center gap-2 rounded-[20px] border-2 border-dashed border-line px-6 py-10 text-center"
          >
            <span className="font-display text-xl">아직 갈 공연이 없어요</span>
            <span className="text-sm text-muted">공연을 찾아 &lsquo;갈 예정&rsquo;을 눌러 보세요</span>
          </Link>
        )}

        {next && <NextTicket item={next} />}

        {rest.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h2 className="font-display text-lg">그 다음</h2>
            <ul className="flex flex-col gap-2">
              {rest.map((item) => (
                <li key={`${item.showId}-${item.date}`}>
                  <SmallTicket item={item} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {home && home.unrecorded.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h2 className="font-display text-lg">기록이 비어 있어요</h2>
            <ul className="flex flex-col gap-2">
              {home.unrecorded.map((item) => (
                <li key={`${item.showId}-${item.date}`} className="flex items-center gap-3 rounded-2xl bg-stub p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.posterUrl} alt="" loading="lazy" className="h-14.5 w-11 shrink-0 rounded-lg object-cover" />
                  <Link href={`/shows/${item.showId}`} className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[15px] font-semibold">{item.showName}</span>
                    <span className="font-mono text-xs text-muted">{formatDay(item.date)}</span>
                  </Link>
                  {item.status === "GOING" ? (
                    <MarkAttendedButton showId={item.showId} date={item.date} />
                  ) : (
                    <Link
                      href={`/shows/${item.showId}/log`}
                      className="flex h-10 shrink-0 items-center rounded-full bg-ink px-3.5 text-[13px] font-semibold text-stub"
                    >
                      로그 남기기
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppFrame>
  );
}
