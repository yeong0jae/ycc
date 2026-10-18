import Link from "next/link";
import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { LogWall } from "@/components/log-wall";
import { logout } from "@/lib/actions";
import { getMe } from "@/lib/auth";
import { formatDay } from "@/lib/format";
import { getMyLogs, getRecords } from "@/lib/logs";

export default async function MePage({ searchParams }: PageProps<"/me">) {
  const { view } = await searchParams;
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");
  const wall = view === "wall";
  const [records, logs] = await Promise.all([getRecords(), wall ? getMyLogs() : null]);
  const stats = records?.stats;
  const years = records?.years ?? [];

  return (
    <AppFrame className="pb-32">
      <AppHeader
        title="나"
        trailing={
          <Link
            href="/onboarding?edit"
            className="flex h-10 items-center rounded-xl border border-line bg-stub px-3.5 text-[13px] font-semibold"
          >
            수정
          </Link>
        }
      />
      <div className="flex flex-col gap-5 px-4 py-6">
        <div className="flex items-center gap-3.5">
          <span className="flex size-14 items-center justify-center rounded-full bg-ink text-xl font-semibold text-stub">
            {me.nickname!.slice(0, 1)}
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-display text-[22px]">{me.nickname}</span>
            <span className="font-mono text-xs text-muted">관람 {stats?.total ?? 0}회</span>
          </span>
        </div>

        <dl className="grid grid-cols-3 gap-1.5">
          <div className="flex flex-col-reverse gap-0.5 rounded-2xl bg-stub p-3">
            <dt className="text-xs text-muted">올해 공연</dt>
            <dd className="font-mono text-[22px]">{stats?.thisYear ?? 0}</dd>
          </div>
          <div className="flex flex-col-reverse gap-0.5 rounded-2xl bg-stub p-3">
            <dt className="text-xs text-muted">전체 관람</dt>
            <dd className="font-mono text-[22px]">{stats?.total ?? 0}</dd>
          </div>
          <div className="flex min-w-0 flex-col-reverse gap-0.5 rounded-2xl bg-stub p-3">
            <dt className="text-xs text-muted">
              {stats?.topVenue ? `최다 공연장 · ${stats.topVenue.count}번` : "최다 공연장"}
            </dt>
            <dd className="truncate py-1 text-sm font-semibold">{stats?.topVenue?.name ?? "—"}</dd>
          </div>
        </dl>

        <nav aria-label="기록 보기" className="flex rounded-full border border-line bg-stub p-1">
          {(
            [
              ["/me", "연대기", !wall],
              ["/me?view=wall", "로그 벽", wall],
            ] as const
          ).map(([href, label, active]) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 flex-1 items-center justify-center rounded-full text-sm font-semibold ${
                active ? "bg-ink text-stub" : ""
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {wall && <LogWall logs={logs ?? []} empty="공연 날 로그를 남기면 여기 쌓여요." />}

        {!wall &&
          (years.length === 0 ? (
            <Link
              href="/find?when=past"
              className="flex flex-col items-center gap-2 rounded-[20px] border-2 border-dashed border-line px-6 py-10 text-center"
            >
              <span className="font-display text-lg">다녀온 공연이 아직 없어요</span>
              <span className="text-sm text-muted">지난 공연을 찾아 &lsquo;다녀옴&rsquo;을 남겨 보세요</span>
            </Link>
          ) : (
            years.map(({ year, items }) => (
              <section key={year} className="flex flex-col gap-2">
                <h2 className="flex justify-between font-mono text-[13px] text-muted">
                  <span>{year}</span>
                  <span>{items.length}회</span>
                </h2>
                <ul className="flex flex-col gap-2">
                  {items.map((item) => (
                    <li key={`${item.showId}-${item.date}`}>
                      <Link
                        href={item.logId ? `/logs/${item.logId}` : `/shows/${item.showId}`}
                        className="flex h-16 items-center overflow-hidden rounded-xl bg-stub"
                      >
                        <span className="w-18 shrink-0 text-center font-mono text-[13px]">
                          {formatDay(item.date).split(" ")[0]}
                        </span>
                        <span className="my-2 self-stretch border-l-2 border-dashed border-line" />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5 px-3">
                          <span className="truncate text-sm font-semibold">{item.showName}</span>
                          <span className="truncate text-xs text-muted">{item.venue}</span>
                        </span>
                        {item.logId ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/logs/${item.logId}/thumbnail`}
                            alt="로그 있음"
                            loading="lazy"
                            className="mr-2 h-12 w-9 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <span aria-hidden="true" className="mr-2 h-12 w-9 shrink-0 rounded-md border border-dashed border-line" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          ))}

        <form action={logout}>
          <button type="submit" className="h-11 cursor-pointer text-sm text-muted">
            로그아웃
          </button>
        </form>
      </div>
    </AppFrame>
  );
}
