import { notFound, redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { BackButton } from "@/components/back-button";
import { LogWall } from "@/components/log-wall";
import { getMe } from "@/lib/auth";
import { getUserLogs, getUserProfile } from "@/lib/logs";

export default async function UserPage({ params }: PageProps<"/users/[id]">) {
  const { id } = await params;
  const me = await getMe();
  if (!me) redirect("/login");
  if (String(me.id) === id) redirect("/me");
  const [profile, logs] = await Promise.all([getUserProfile(id), getUserLogs(id)]);
  if (!profile) notFound();

  return (
    <AppFrame className="pb-12">
      <AppHeader as="p" title={profile.nickname ?? "프로필"} leading={<BackButton />} />
      <div className="flex flex-col gap-5 px-4 py-6">
        <div className="flex items-center gap-3.5">
          <span className="flex size-15 items-center justify-center rounded-full bg-ink text-xl font-semibold text-stub">
            {profile.nickname?.slice(0, 1)}
          </span>
          <div>
            <h1 className="font-display text-[26px]">{profile.nickname}</h1>
            <p className="font-mono text-xs text-muted">공연 로그 {profile.logCount}개</p>
          </div>
        </div>
        <section className="flex flex-col gap-2.5">
          <h2 className="font-display text-xl">공연 로그</h2>
          <LogWall logs={logs ?? []} empty="아직 공개한 로그가 없어요." />
        </section>
      </div>
    </AppFrame>
  );
}
