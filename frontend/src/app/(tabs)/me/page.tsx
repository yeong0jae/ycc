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
        title="나"
        trailing={
          <Link
            href="/onboarding?edit"
            className="flex h-10 items-center rounded-xl border border-line bg-stub px-3.5 text-[13px] font-semibold"
          >
            수정
          </Link>
        }
      />
      <div className="flex flex-col gap-5 px-4 py-6">
        <div className="flex items-center gap-3.5">
          <span className="flex size-14 items-center justify-center rounded-full bg-ink text-xl font-semibold text-stub">
            {me.nickname!.slice(0, 1)}
          </span>
          <span className="font-display text-[22px]">{me.nickname}</span>
        </div>
        {me.admin && (
          <Link href="/admin" className="flex h-12 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-stub">
            운영 · 페스티벌 검수
          </Link>
        )}
        <form action={logout}>
          <button type="submit" className="h-11 cursor-pointer text-sm text-muted">
            로그아웃
          </button>
        </form>
      </div>
    </AppFrame>
  );
}
