import Link from "next/link";
import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { logout } from "@/lib/actions";
import { getMe } from "@/lib/auth";

export default async function MePage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");

  return (
    <AppFrame className="pb-32">
      <AppHeader
        title="내 정보"
        trailing={
          <Link
            href="/onboarding?edit"
            className="flex h-10 items-center rounded-xl border border-line bg-stub px-3.5 text-[13px] font-semibold"
          >
            수정
          </Link>
        }
      />
      <div className="flex flex-col gap-6 px-4 py-6">
        <div className="flex items-center gap-3.5">
          <span className="flex size-16 items-center justify-center rounded-full bg-ink text-2xl font-semibold text-stub">
            {me.nickname!.slice(0, 1)}
          </span>
          <p className="flex-1 font-display text-[26px]">{me.nickname}</p>
        </div>
        <section className="flex flex-col gap-2.5">
          <h2 className="font-display text-xl">내 표</h2>
          <p className="rounded-2xl bg-stub px-4 py-5 text-sm text-muted">
            아직 인증한 표가 없어요. 콘서트 상세에서 예매 내역을 인증할 수 있어요.
          </p>
        </section>
        <form action={logout}>
          <button type="submit" className="h-11 cursor-pointer text-sm text-muted">
            로그아웃
          </button>
        </form>
      </div>
    </AppFrame>
  );
}
