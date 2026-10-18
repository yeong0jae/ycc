import Link from "next/link";
import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { getMe } from "@/lib/auth";

export default async function TogetherPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");

  return (
    <AppFrame className="pb-32">
      <AppHeader title="내 동행" />
      <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
        <p className="font-semibold">아직 동행이 없어요</p>
        <p className="text-sm text-muted">가고 싶은 콘서트에서 같이 갈 사람을 찾아보세요.</p>
        <Link href="/" className="mt-2 flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-semibold text-stub">
          콘서트 보러 가기
        </Link>
      </div>
    </AppFrame>
  );
}
