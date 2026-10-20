import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { BackButton } from "@/components/back-button";
import { backendFetch, getMe, KAKAO_LOGIN_URL } from "@/lib/auth";
import type { PostDetail } from "@/lib/community-types";
import { getShow } from "@/lib/show";
import { PostThread } from "./post-thread";

async function Thread({ showId, postId }: { showId: number; postId: string }) {
  const [res, me] = await Promise.all([backendFetch(`/api/shows/${showId}/community/${encodeURIComponent(postId)}`), getMe()]);
  if (res.status === 404 || res.status === 400) notFound();
  if (!res.ok) throw new Error(`글 조회 실패: ${res.status}`);
  const detail: PostDetail = await res.json();
  return <PostThread showId={showId} initial={detail} me={me} loginUrl={KAKAO_LOGIN_URL} />;
}

export default async function CommunityPostPage({ params }: PageProps<"/shows/[id]/community/[postId]">) {
  const { id, postId } = await params;
  const show = await getShow(id);
  if (!show) notFound();

  return (
    <AppFrame className="pb-28">
      <AppHeader
        as="p"
        leading={<BackButton />}
        title={
          <span className="flex flex-col">
            <span className="text-base">글</span>
            <span className="truncate font-sans text-xs font-normal tracking-normal text-muted">{show.name} · 커뮤니티</span>
          </span>
        }
      />
      <Suspense fallback={<p className="sr-only">불러오는 중</p>}>
        <Thread showId={show.id} postId={postId} />
      </Suspense>
    </AppFrame>
  );
}
