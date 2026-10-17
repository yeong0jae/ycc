import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { formatPeriod, getShow } from "@/lib/show";

export default async function ShowPage({ params }: PageProps<"/shows/[id]">) {
  const { id } = await params;
  const show = await getShow(id);
  if (!show) notFound();

  return (
    <main className="mx-auto w-full max-w-md px-4 py-4">
      <Link
        href="/"
        className="inline-flex h-11 items-center gap-1.5 px-1 text-[15px] text-muted"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        목록
      </Link>
      <article className="relative mt-4 overflow-hidden rounded-[20px] bg-stub">
        <ViewTransition name={`poster-${show.id}`} share="morph" default="none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={show.posterUrl}
            alt={`${show.name} 포스터`}
            className="aspect-[3/4] w-full object-cover"
          />
        </ViewTransition>
        <div className="flex flex-col gap-4 p-5">
          <h1 className="font-display text-3xl leading-tight">{show.name}</h1>
          <dl className="grid grid-cols-2 gap-3 text-[15px]">
            <div>
              <dt className="text-[13px] text-muted">일정</dt>
              <dd className="font-mono">{formatPeriod(show.startDate, show.endDate)}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-muted">장소</dt>
              <dd>{show.venue}</dd>
            </div>
            {show.scheduleGuide && (
              <div className="col-span-2">
                <dt className="text-[13px] text-muted">회차</dt>
                <dd>{show.scheduleGuide}</dd>
              </div>
            )}
            {show.priceGuide && (
              <div className="col-span-2">
                <dt className="text-[13px] text-muted">가격</dt>
                <dd>{show.priceGuide}</dd>
              </div>
            )}
          </dl>
        </div>
        {(show.ticketUrl || show.officialUrl) && (
          <>
            <div className="mx-4.5 border-t-2 border-dashed border-line" />
            <div className="absolute -left-2.5 bottom-17.5 size-5 rounded-full bg-paper" />
            <div className="absolute -right-2.5 bottom-17.5 size-5 rounded-full bg-paper" />
            <div className="flex gap-2 px-4 pt-3.5 pb-4">
              {show.ticketUrl && (
                <a
                  href={show.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 flex-1 items-center justify-center rounded-xl bg-ink font-semibold text-stub hover:bg-ink/85 transition duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  예매하기
                </a>
              )}
              {show.officialUrl && (
                <a
                  href={show.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 flex-1 items-center justify-center rounded-xl border-[1.5px] border-ink font-semibold hover:bg-ink/5 transition duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  공식 사이트
                </a>
              )}
            </div>
          </>
        )}
      </article>
    </main>
  );
}
