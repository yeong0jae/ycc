import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { PosterImage } from "@/components/poster-image";
import { getMe, KAKAO_LOGIN_URL } from "@/lib/auth";
import { getShows } from "@/lib/show";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  if (await getMe()) redirect("/");
  const posters = (await getShows()).slice(0, 9);

  return (
    <AppFrame className="flex min-h-dvh flex-col">
      <div className="relative h-108 overflow-hidden">
        <div className="grid grid-cols-3 gap-2 px-3 pt-4">
          {Array.from({ length: 9 }, (_, i) => posters[i]).map((show, i) =>
            show ? (
              <span key={show.id} className="aspect-[3/4] overflow-hidden rounded-xl bg-pill">
                <PosterImage src={show.posterUrl} alt="" className="size-full object-cover" />
              </span>
            ) : (
              <span key={i} className="aspect-[3/4] rounded-xl bg-pill" />
            ),
          )}
        </div>
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-paper from-15% to-transparent" />
      </div>
      <div className="flex flex-col gap-2 px-5.5">
        <h1 className="font-display text-[28px]">페스티벌</h1>
        <p className="text-base leading-relaxed text-[#444449]">전국 페스티벌을 한곳에서 봐요.</p>
      </div>
      <div className="mt-auto px-3 pt-6 pb-7.5">
        {error !== undefined && (
          <p role="alert" className="mb-3 text-center text-sm text-muted">
            로그인하지 못했어요. 다시 시도해 주세요.
          </p>
        )}
        <a
          href={KAKAO_LOGIN_URL}
          className="press flex h-14 items-center justify-center gap-2 rounded-full bg-[#FEE500] font-bold text-[#191919]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#191919" d="M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 6l-1 3.6c-.1.3.3.6.6.4l4.2-2.8h1c5 0 9-3.1 9-7s-4-7-9-7z" />
          </svg>
          카카오로 시작하기
        </a>
      </div>
    </AppFrame>
  );
}
