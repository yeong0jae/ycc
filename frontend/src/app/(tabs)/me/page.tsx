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
            className="press flex h-11 items-center rounded-full bg-pill px-4 text-sm font-bold"
          >
            수정
          </Link>
        }
      />
      <div className="flex flex-col gap-5 px-5 py-4">
        <div className="flex items-center gap-3.5">
          <span className="flex size-14 items-center justify-center rounded-full bg-ink text-xl font-bold text-stub">
            {me.nickname!.slice(0, 1)}
          </span>
          <span className="font-display text-[22px]">{me.nickname}</span>
        </div>
        <form action={logout}>
          <button type="submit" className="h-11 cursor-pointer text-sm text-muted">
            로그아웃
          </button>
        </form>
      </div>
    </AppFrame>
  );
}
