import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { getMe, KAKAO_LOGIN_URL } from "@/lib/auth";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  if (await getMe()) redirect("/");

  return (
    <AppFrame className="flex min-h-dvh flex-col">
      <AppHeader title="로그인" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-6 pb-8">
        <div className="flex flex-1 flex-col justify-center">
          <div className="relative overflow-hidden rounded-3xl bg-stub">
            <div className="flex flex-col gap-2.5 px-6 py-7">
              <p className="font-mono text-xs tracking-[0.12em] text-muted">ADMIT TWO</p>
              <h1 className="font-display text-4xl leading-tight">같이 갈 사람</h1>
              <p className="leading-relaxed">
                표 있는 사람끼리,
                <br />
                굿즈 줄부터 같이 가요.
              </p>
            </div>
            <div className="mx-5 border-t-2 border-dashed border-line" />
            <div className="absolute -left-3 bottom-15 size-6 rounded-full bg-paper" />
            <div className="absolute -right-3 bottom-15 size-6 rounded-full bg-paper" />
            <p className="flex items-center gap-2 px-6 py-5 text-sm">
              <span className="flex size-4.5 items-center justify-center rounded-full bg-lime">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </span>
              예매 인증한 사람만 서로 보여요
            </p>
          </div>
        </div>
        {error !== undefined && (
          <p role="alert" className="mb-3 text-center text-sm text-muted">
            로그인하지 못했어요. 다시 시도해 주세요.
          </p>
        )}
        <a
          href={KAKAO_LOGIN_URL}
          className="flex h-13.5 items-center justify-center gap-2 rounded-2xl bg-[#FEE500] font-semibold text-[#191919] transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
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
