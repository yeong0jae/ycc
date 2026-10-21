import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { BackButton } from "@/components/back-button";
import { backendFetch, getMe, KAKAO_LOGIN_URL } from "@/lib/auth";
import type { PostDetail } from "@/lib/community-types";
import { PostThread } from "../../shows/[id]/community/[postId]/post-thread";

async function Thread({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const [res, me] = await Promise.all([backendFetch(`/api/community/posts/${encodeURIComponent(postId)}`), getMe()]);
  if (res.status === 404 || res.status === 400) notFound();
  if (!res.ok) throw new Error(`글 조회 실패: ${res.status}`);
  const detail: PostDetail = await res.json();
  return <PostThread showId={detail.post.showId} initial={detail} me={me} loginUrl={KAKAO_LOGIN_URL} />;
}

export default function CommunityPostPage({ params }: PageProps<"/community/[postId]">) {
  return (
    <AppFrame className="pb-28">
      <AppHeader
        as="p"
        leading={<BackButton />}
        title={
          <span className="flex flex-col">
            <span className="text-base">글</span>
            <span className="truncate font-sans text-xs font-normal tracking-normal text-muted">커뮤니티</span>
          </span>
        }
      />
      <Suspense fallback={<p className="sr-only">불러오는 중</p>}>
        <Thread params={params} />
      </Suspense>
    </AppFrame>
  );
}
