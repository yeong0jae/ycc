import Link from "next/link";
import { ViewTransition } from "react";
import { formatDday, formatPeriod, getFestivals } from "@/lib/festival";

export default async function Home() {
  const festivals = await getFestivals();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="mb-6 px-1 pt-2">
        <p className="font-mono text-[13px] tracking-[0.12em] text-muted">
          UPCOMING · {String(festivals.length).padStart(2, "0")}
        </p>
        <h1 className="font-display text-4xl leading-tight">다가오는 페스티벌</h1>
      </header>
      {festivals.length === 0 ? (
        <p className="px-1 text-muted">예정된 페스티벌이 없어요.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {festivals.map((festival) => (
            <li key={festival.id}>
              <Link
                href={`/festivals/${festival.id}`}
                prefetch
                className="relative flex min-h-37 overflow-hidden rounded-2xl bg-stub transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/10 active:translate-y-0 active:scale-[0.98] active:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
              >
                <ViewTransition name={`poster-${festival.id}`} share="morph" default="none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={festival.posterUrl}
                    alt={`${festival.name} 포스터`}
                    className="w-27 shrink-0 object-cover"
                  />
                </ViewTransition>
                <div className="my-3.5 border-l-2 border-dashed border-line" />
                <div className="absolute -top-2.5 left-24.75 size-5 rounded-full bg-paper" />
                <div className="absolute -bottom-2.5 left-24.75 size-5 rounded-full bg-paper" />
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
                  <div>
                    <p className="font-display text-xl leading-snug">{festival.name}</p>
                    <p className="text-sm text-muted">{festival.venue}</p>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[13px]">
                    <span>{formatPeriod(festival.startDate, festival.endDate)}</span>
                    <span className="rounded-full bg-ink px-2.5 py-0.5 text-stub">
                      {formatDday(festival.startDate)}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
