"use client";

import { useEffect, useState } from "react";
import { CommunityAvatar } from "@/components/community-avatar";
import type { Me } from "@/lib/auth";
import { POST_KINDS, type Post, type PostKind, type PostPage } from "@/lib/community-types";
import { ShowHomeTabs } from "../show-home-tabs";
import { TabSwipe } from "../tab-swipe";
import { PostItem } from "./post-item";
import { PostSkeleton } from "./post-skeleton";
import { ComposeSheet } from "./sheets";
import { InfiniteSentinel } from "@/components/infinite-sentinel";
import { postPath, useCommunity } from "./use-community";

export function CommunityFeed({
  showId,
  suggestions,
  initial,
  me,
  loginUrl,
}: {
  showId: number;
  suggestions: boolean;
  initial: PostPage;
  me: Me | null;
  loginUrl: string;
}) {
  const [kind, setKind] = useState<PostKind | null>(null);
  const [page, setPage] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [composing, setComposing] = useState<{ editing?: Post } | null>(null);
  const [fresh, setFresh] = useState<number | null>(null);
  const { needLogin, like, openMore, setToast, sheets } = useCommunity({ signedIn: me !== null, loginUrl });
  const base = `/api/shows/${showId}/community`;

  const load = async (nextKind: PostKind | null, before?: number) => {
    setLoading(true);
    const query = new URLSearchParams();
    if (nextKind) query.set("kind", nextKind);
    if (before) query.set("before", String(before));
    const res = await fetch(`${base}?${query}`).catch(() => null);
    setLoading(false);
    if (!res?.ok) return;
    const next: PostPage = await res.json();
    setPage((current) => (before ? { items: [...current.items, ...next.items], hasMore: next.hasMore } : next));
  };

  useEffect(() => {
    const refresh = () => document.visibilityState === "visible" && load(kind);
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  });

  const pick = (next: PostKind | null) => {
    setKind(next);
    load(next);
  };

  const replace = (post: Post) => setPage((current) => ({ ...current, items: current.items.map((it) => (it.id === post.id ? post : it)) }));

  const write = () => {
    if (!needLogin("write")) setComposing({});
  };

  const remove = async (post: Post) => {
    const res = await fetch(postPath(post), { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return setToast("지우지 못했어요");
    setPage((current) => ({ ...current, items: current.items.filter((it) => it.id !== post.id) }));
    setToast("지웠어요");
  };

  const saved = (post: Post) => {
    const editing = composing?.editing;
    setComposing(null);
    if (editing) return replace(post);
    setFresh(post.id);
    if (kind === null || kind === post.kind) setPage((current) => ({ ...current, items: [post, ...current.items] }));
  };

  return (
    <>
      <ShowHomeTabs showId={showId} active="community" suggestions={suggestions} />
      <TabSwipe prev={`/shows/${showId}/${suggestions ? "suggestions" : "map"}`} className="flex min-h-[60dvh] flex-col">
        <div role="group" aria-label="종류" className="flex gap-1.5 overflow-x-auto px-5 pt-3 pb-1 [scrollbar-width:none]">
          {[{ key: null, label: "전체" }, ...POST_KINDS].map((it) => (
            <button
              key={it.label}
              type="button"
              aria-pressed={kind === it.key}
              onClick={() => pick(it.key)}
              className={`h-8.5 shrink-0 cursor-pointer rounded-full px-3.5 text-[13px] font-bold ${
                kind === it.key ? "bg-ink text-stub" : "text-[#444449] shadow-[inset_0_0_0_1px_var(--color-line)]"
              }`}
            >
              {it.label}
            </button>
          ))}
        </div>

        <button type="button" onClick={write} className="flex cursor-pointer items-center gap-3 px-5 py-3.5 text-left shadow-[inset_0_-1px_0_#eeeef1]">
          {me ? (
            <CommunityAvatar name={me.nickname} url={me.avatarUrl} />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-line text-[#9a9aa2]">?</span>
          )}
          <span className="flex min-w-0 flex-1 flex-col">
            <b className="truncate text-sm">{me ? me.nickname : "로그인 안 함"}</b>
            <span className="text-sm text-[#9a9aa2]">{me ? "이 공연 이야기를 남겨 보세요" : "로그인하고 이야기를 남겨 보세요"}</span>
          </span>
          <span className="flex h-8.5 shrink-0 items-center rounded-full px-3.5 text-[13px] font-bold shadow-[inset_0_0_0_1px_var(--color-line)]">글쓰기</span>
        </button>

        <div className={loading && page.items.length === 0 ? "opacity-50" : ""}>
          {page.items.map((post) => (
            <div key={post.id} className={post.id === fresh ? "animate-drop motion-reduce:animate-none" : ""}>
              <PostItem
                post={post}
                href={`/shows/${showId}/community/${post.id}`}
                onLike={(it) => like(it, replace)}
                onMore={(it) =>
                  openMore({
                    mine: it.mine,
                    onEdit: () => setComposing({ editing: it }),
                    onDelete: () => remove(it),
                    reportPath: `${postPath(it)}/report`,
                  })
                }
              />
            </div>
          ))}
        </div>
        {page.items.length === 0 && !loading && (
          <p className="py-16 text-center text-sm text-muted">{kind ? "이 종류의 글이 아직 없어요." : "아직 올라온 글이 없어요. 첫 글을 남겨 보세요."}</p>
        )}
        {loading && page.items.length > 0 && (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        )}
        <InfiniteSentinel active={page.hasMore && !loading} onReach={() => load(kind, page.items.at(-1)?.id)} />
      </TabSwipe>

      {composing && me && (
        <ComposeSheet showId={showId} nickname={me.nickname} avatarUrl={me.avatarUrl} editing={composing.editing} onClose={() => setComposing(null)} onSaved={saved} />
      )}
      {sheets}
    </>
  );
}
