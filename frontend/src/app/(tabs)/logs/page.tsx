import Link from "next/link";
import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { LogTile } from "@/components/log-tile";
import { SignalButton } from "@/components/signal-button";
import { getMe } from "@/lib/auth";
import { formatPeriod, todayInSeoul } from "@/lib/format";
import { getNextFeed, getPastFeed } from "@/lib/logs";

export default async function LogsPage({ searchParams }: PageProps<"/logs">) {
  const { view } = await searchParams;
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");
  const showNext = view === "next";
  const [past, next] = await Promise.all([getPastFeed(), getNextFeed()]);
  const today = todayInSeoul();
  const todayShow = next?.find((item) => item.show.startDate <= today && today <= item.show.endDate)?.show;

  return (
    <AppFrame className="pb-32">
      <AppHeader
        title="로그"
        trailing={
          <nav aria-label="로그 보기" className="flex shrink-0 rounded-full border border-line bg-stub p-1">
            {[
              ["past", "다녀온 공연"],
              ["next", "갈 공연"],
            ].map(([key, label]) => {
              const active = (key === "next") === showNext;
              return (
                <Link
                  key={key}
                  href={key === "next" ? "/logs?view=next" : "/logs"}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-9 items-center rounded-full px-3.5 text-sm font-semibold ${active ? "bg-ink text-stub" : ""}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        }
      />
      <div className="flex flex-col gap-6 px-4 py-5">
        {todayShow && (
          <Link href={`/shows/${todayShow.id}/log`} className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 text-stub">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FF3B30]">
              <span className="size-3.5 rounded-full bg-stub" />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="font-semibold">오늘 공연 날이에요</span>
              <span className="text-[13px] text-[#A3A8B3]">{todayShow.name} · 지금 2초만 남겨 볼까요?</span>
            </span>
          </Link>
        )}

        {!showNext &&
          (past && past.length > 0 ? (
            past.map((item) => (
              <section key={item.show.id} className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl leading-snug">{item.show.name}</h2>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {formatPeriod(item.show.startDate, item.show.endDate)}
                  </span>
                </div>
                <Link href={`/logs/${item.myLogId}`} className="text-[13px] font-semibold underline underline-offset-4">
                  내 로그 보기
                </Link>
                {item.people.length === 0 ? (
                  <p className="rounded-2xl bg-stub px-4 py-5 text-sm text-muted">아직 이 공연의 다른 로그가 없어요.</p>
                ) : (
                  <ul className="grid grid-cols-3 gap-2">
                    {item.people.map((person) => (
                      <li key={person.userId} className="flex flex-col gap-2">
                        {person.log && <LogTile log={person.log} showName={false} />}
                        <SignalButton
                          userId={person.userId}
                          showId={item.show.id}
                          kind="WAS_THERE"
                          sent={person.wasThereSent}
                          label="나도 있었어"
                          sentLabel="나도 있었어 ✓"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))
          ) : (
            <EmptyState text="공연 날 로그를 남기면, 같은 공연에 있던 사람들의 로그가 여기 모여요." />
          ))}

        {showNext &&
          (next && next.length > 0 ? (
            next.map((item) => (
              <section key={item.show.id} className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-2">
                  <Link href={`/shows/${item.show.id}`} className="font-display text-xl leading-snug">
                    {item.show.name}
                  </Link>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {formatPeriod(item.show.startDate, item.show.endDate)}
                  </span>
                </div>
                {item.people.length === 0 ? (
                  <p className="rounded-2xl bg-stub px-4 py-5 text-sm text-muted">아직 이 공연에 간다는 사람이 없어요.</p>
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {item.people.map((person) => (
                      <li key={person.userId} className="flex gap-3 rounded-2xl bg-stub p-3">
                        <div className="w-18 shrink-0">
                          {person.log ? (
                            <LogTile log={person.log} />
                          ) : (
                            <div className="aspect-[9/16] rounded-xl bg-line" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <Link href={`/users/${person.userId}`} className="font-semibold">
                            {person.nickname}
                          </Link>
                          <span className="text-[13px] text-muted">
                            {person.log ? `최근 로그 · ${person.log.showName}` : "아직 남긴 로그가 없어요"}
                          </span>
                          {person.nextTogetherMatched && (
                            <span className="self-start rounded-full bg-lime px-2.5 py-1 text-xs font-semibold">
                              서로 다음엔 같이 가고 싶어 해요
                            </span>
                          )}
                          <div className="mt-auto">
                            <SignalButton
                              userId={person.userId}
                              showId={item.show.id}
                              kind="NEXT_TOGETHER"
                              sent={person.nextTogetherSent}
                              label="다음엔 같이"
                              sentLabel="다음엔 같이 ✓"
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))
          ) : (
            <EmptyState text="콘서트 상세에서 '갈 거예요'를 누르면, 같은 공연에 가는 사람들의 로그가 여기 모여요." />
          ))}
      </div>
    </AppFrame>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <p className="text-sm leading-relaxed text-muted">{text}</p>
      <Link href="/" className="flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-semibold text-stub">
        콘서트 보러 가기
      </Link>
    </div>
  );
}
