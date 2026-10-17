import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPeriod, getFestival } from "@/lib/festival";

export default async function FestivalPage({ params }: PageProps<"/festivals/[id]">) {
  const { id } = await params;
  const festival = await getFestival(id);
  if (!festival) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-neutral-500">
        ← 목록
      </Link>
      <div className="mt-4 flex flex-col gap-6 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={festival.posterUrl}
          alt={`${festival.name} 포스터`}
          className="aspect-[3/4] w-full rounded-lg object-cover sm:w-64"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{festival.name}</h1>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-neutral-500">일정</dt>
              <dd>{formatPeriod(festival.startDate, festival.endDate)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">장소</dt>
              <dd>{festival.venue}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">라인업</dt>
              <dd>{festival.lineup.join(", ")}</dd>
            </div>
          </dl>
          <div className="mt-6 flex gap-2">
            <a
              href={festival.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg bg-foreground py-3 text-center font-semibold text-background"
            >
              예매하기
            </a>
            <a
              href={festival.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg border border-neutral-300 py-3 text-center font-semibold"
            >
              공식 사이트
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
