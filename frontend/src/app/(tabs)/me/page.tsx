import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { backendFetch, getMe, KAKAO_LOGIN_URL } from "@/lib/auth";
import type { Verification } from "@/lib/verification-types";
import { ProfileGuest } from "./profile-guest";
import { ProfileMember } from "./profile-member";

export default async function MePage({ searchParams }: PageProps<"/me">) {
  const [me, { error }] = await Promise.all([getMe(), searchParams]);
  const verifications: Verification[] = me ? await backendFetch("/api/me/verifications").then((res) => (res.ok ? res.json() : [])) : [];

  return (
    <AppFrame className="pb-32">
      <AppHeader
        title="프로필"
        trailing={
          <Link href="/me/settings" aria-label="설정" className="press flex size-11 items-center justify-center rounded-full bg-pill">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
          </Link>
        }
      />
      {me ? <ProfileMember me={me} verifications={verifications} /> : <ProfileGuest loginUrl={KAKAO_LOGIN_URL} failed={error !== undefined} />}
    </AppFrame>
  );
}
