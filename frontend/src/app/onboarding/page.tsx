import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { BackButton } from "@/components/back-button";
import { getMe } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const { edit } = await searchParams;
  const me = await getMe();
  if (!me) redirect("/login");
  const editing = edit !== undefined;
  if (me.onboarded && !editing) redirect("/");

  return (
    <AppFrame className="flex min-h-dvh flex-col">
      <AppHeader title={editing ? "프로필 수정" : "시작 설정"} leading={editing ? <BackButton /> : undefined} />
      <div className="flex flex-1 flex-col gap-7 px-4 pt-8 pb-8">
        {!editing && (
          <p className="font-display text-[28px] leading-snug">
            같이 갈 사람에게
            <br />
            보여 줄 이름을 정해요
          </p>
        )}
        <ProfileForm
          nickname={me.nickname ?? ""}
          gender={me.gender}
          next={editing ? "/me" : "/"}
          submitLabel={editing ? "저장하기" : "시작하기"}
        />
      </div>
    </AppFrame>
  );
}
