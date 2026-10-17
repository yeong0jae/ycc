import Link from "next/link";
import { formatPeriod, getFestivals } from "@/lib/festival";

export default async function Home() {
  const festivals = await getFestivals();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">다가오는 페스티벌</h1>
      {festivals.length === 0 ? (
        <p className="text-neutral-500">예정된 페스티벌이 없어요.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {festivals.map((festival) => (
            <li key={festival.id}>
              <Link href={`/festivals/${festival.id}`} className="block">
                {/* 포스터는 여러 외부 사이트에서 오므로 next/image 대신 img 사용 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={festival.posterUrl}
                  alt={`${festival.name} 포스터`}
                  className="aspect-[3/4] w-full rounded-lg object-cover"
                />
                <p className="mt-2 font-semibold leading-snug">{festival.name}</p>
                <p className="text-sm text-neutral-500">
                  {formatPeriod(festival.startDate, festival.endDate)} · {festival.venue}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
