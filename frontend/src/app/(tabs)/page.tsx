import Link from "next/link";
import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { getMe } from "@/lib/auth";

export default async function HomePage() {
  const me = await getMe();
  if (me && !me.onboarded) redirect("/onboarding");

  return (
    <AppFrame className="pb-32">
      <header className="flex flex-col gap-2 px-5 pt-6">
        <p className="text-sm text-muted">내 페스티벌</p>
        <h1 className="font-display text-2xl leading-snug">
          예매한 페스티벌을
          <br />
          인증하면 여기 모여요
        </h1>
        <p className="text-[15px] leading-relaxed text-muted">가장 가까운 날짜부터 D-day와 함께 보여 드려요.</p>
      </header>

      <div aria-hidden="true" className="grid grid-cols-2 gap-2.5 px-3 pt-6 sm:grid-cols-3">
        <span className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-[#f7f7f8] bg-[radial-gradient(rgb(0_0_0/0.045)_1px,transparent_1px)] bg-size-[4px_4px] shadow-[inset_0_0_0_2px_var(--color-line)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c7c7cd" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className="aspect-[3/4] rounded-2xl bg-[#fafafb] bg-[radial-gradient(rgb(0_0_0/0.035)_1px,transparent_1px)] bg-size-[4px_4px] shadow-[inset_0_0_0_2px_#eeeef1]" />
      </div>

      <div className="px-3 pt-5">
        <Link
          href={me ? "/find" : "/login"}
          className="press flex h-14 items-center justify-center rounded-full bg-lime text-base font-bold"
        >
          {me ? "인증할 페스티벌 찾기" : "로그인하고 시작하기"}
        </Link>
      </div>
    </AppFrame>
  );
}
