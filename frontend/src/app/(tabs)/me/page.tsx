import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { getMe, KAKAO_LOGIN_URL } from "@/lib/auth";
import { ProfileGuest } from "./profile-guest";
import { ProfileMember } from "./profile-member";

export default async function MePage({ searchParams }: PageProps<"/me">) {
  const [me, { error }] = await Promise.all([getMe(), searchParams]);

  return (
    <AppFrame className="pb-32">
      <AppHeader title="프로필" />
      {me ? <ProfileMember me={me} /> : <ProfileGuest loginUrl={KAKAO_LOGIN_URL} failed={error !== undefined} />}
    </AppFrame>
  );
}
