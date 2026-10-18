import Link from "next/link";
import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { getMe } from "@/lib/auth";

export default async function HomePage() {
  const me = await getMe();
  if (me && !me.onboarded) redirect("/onboarding");

  return (
    <AppFrame className="pb-32">
      <AppHeader title="다가오는 공연" />
      <div className="flex flex-col gap-7 px-4 py-6">
        {me ? (
          <Link
            href="/find"
            className="flex flex-col items-center gap-2 rounded-[20px] border-2 border-dashed border-line px-6 py-10 text-center"
          >
            <span className="font-display text-xl">예매 인증한 페스티벌이 여기 떠요</span>
            <span className="text-sm text-muted">페스티벌 찾아보기</span>
          </Link>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-[20px] bg-stub px-6 py-10 text-center">
            <p className="font-display text-xl leading-snug">갈 페스티벌을<br />한곳에 모아 보세요</p>
            <Link href="/login" className="flex h-12 items-center rounded-xl bg-ink px-6 font-semibold text-stub">
              로그인하고 시작하기
            </Link>
            <Link href="/find" className="text-sm text-muted underline underline-offset-4">
              먼저 페스티벌 둘러보기
            </Link>
          </div>
        )}
      </div>
    </AppFrame>
  );
}
