import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { getMe, KAKAO_LOGIN_URL } from "@/lib/auth";
import { GlobalFeed } from "./global-feed";

async function Feed() {
  const me = await getMe();
  return <GlobalFeed me={me} loginUrl={KAKAO_LOGIN_URL} />;
}

export default function CommunityPage() {
  return (
    <AppFrame className="pb-32">
      <AppHeader title="커뮤니티" />
      <Suspense fallback={null}>
        <Feed />
      </Suspense>
    </AppFrame>
  );
}
