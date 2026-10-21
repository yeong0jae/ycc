"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { CommunityAvatar } from "@/components/community-avatar";
import { InfiniteSentinel } from "@/components/infinite-sentinel";
import type { Me } from "@/lib/auth";
import { POST_KINDS, type Post, type PostKind, type PostPage } from "@/lib/community-types";
import { festivalBadge, formatPeriod, todayInSeoul } from "@/lib/format";
import type { ParticipatedShow } from "@/lib/notice-types";
import { useParticipated } from "@/lib/participation";
import type { Show } from "@/lib/show-types";
import { PostItem } from "../../shows/[id]/community/post-item";
import { PostSkeleton } from "../../shows/[id]/community/post-skeleton";
import { ComposeSheet } from "../../shows/[id]/community/sheets";
import { postHref, postPath, useCommunity } from "../../shows/[id]/community/use-community";

type Scope = "mine" | "all";

const SCOPE_KEY = "ycc:community-scope";

function storedScope(): Scope | null {
  try {
    const value = localStorage.getItem(SCOPE_KEY);
    return value === "mine" || value === "all" ? value : null;
  } catch {
    return null;
  }
}

function orderShows(shows: Show[]) {
  const today = todayInSeoul();
  const rank = (show: Show) => (show.endDate < today ? 2 : show.startDate <= today ? 0 : 1);
  return [...shows].sort((a, b) => rank(a) - rank(b) || a.startDate.localeCompare(b.startDate));
}

function Check({ on }: { on: boolean }) {
  return (
    <span className={`flex size-5.5 shrink-0 items-center justify-center rounded-full ${on ? "bg-ink" : "shadow-[inset_0_0_0_2px_var(--color-line)]"}`}>
      {on && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      )}
    </span>
  );
}

function PickShowSheet({ shows, onPick, onClose }: { shows: Show[] | null; onPick: (show: Show | null) => void; onClose: () => void }) {
  const [picked, setPicked] = useState<number | "none" | null>(null);
  return (
    <BottomSheet label="공연 고르기" onClose={onClose}>
      <div className="flex flex-col pt-6 pb-8">
        <>
            <h2 className="px-5 font-display text-xl">어느 공연에 쓸까요?</h2>
            <p className="mt-1 mb-2 px-5 text-sm text-muted">공연을 고르면 그 공연 커뮤니티에도 올라가요</p>
            <div className="max-h-[50dvh] overflow-y-auto">
              <button
                type="button"
                aria-pressed={picked === "none"}
                onClick={() => setPicked("none")}
                className="flex h-17 w-full cursor-pointer items-center gap-3 px-5 text-left shadow-[inset_0_-1px_0_#eeeef1]"
              >
                <span className="flex aspect-[3/4] w-10 shrink-0 items-center justify-center rounded-lg bg-pill">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" />
                  </svg>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <b className="text-[15px]">공연 없이 쓰기</b>
                  <span className="text-[13px] text-muted">전체 커뮤니티에만 올라가요</span>
                </span>
                <Check on={picked === "none"} />
              </button>
              {(shows ?? []).map((show) => {
                const badge = festivalBadge(show.startDate, show.endDate);
                const on = picked === show.id;
                return (
                  <button
                    key={show.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPicked(show.id)}
                    className="flex h-17 w-full cursor-pointer items-center gap-3 px-5 text-left shadow-[inset_0_-1px_0_#eeeef1]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={show.posterUrl} alt="" className="aspect-[3/4] w-10 shrink-0 rounded-lg bg-pill object-cover" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <b className="truncate text-[15px]">{show.name}</b>
                      <span className="text-[13px] text-muted">
                        {badge?.label === "END" ? "지난 공연" : badge?.label} · {formatPeriod(show.startDate, show.endDate)}
                      </span>
                    </span>
                    <Check on={on} />
                  </button>
                );
              })}
              {shows === null && <p className="py-10 text-center text-sm text-muted">불러오는 중</p>}
              {shows?.length === 0 && (
                <p className="px-5 pt-4 text-[13px] leading-relaxed text-muted">
                  공연에 참여하면 그 공연 커뮤니티에도 쓸 수 있어요 ·{" "}
                  <Link href="/find" className="font-bold text-ink underline">
                    공연 찾아보기
                  </Link>
                </p>
              )}
            </div>
            <div className="px-5 pt-4">
              <button
                type="button"
                disabled={picked === null}
                onClick={() => {
                  if (picked === "none") return onPick(null);
                  const show = shows?.find((it) => it.id === picked);
                  if (show) onPick(show);
                }}
                className="press h-14 w-full cursor-pointer rounded-full bg-ink text-base font-bold text-stub disabled:opacity-35"
              >
                다음
              </button>
            </div>
        </>
      </div>
    </BottomSheet>
  );
}

export function GlobalFeed({ me, loginUrl }: { me: Me | null; loginUrl: string }) {
  const ids = useParticipated();
  const [chosen, setChosen] = useState<Scope | null>(storedScope);
  const [kind, setKind] = useState<PostKind | null>(null);
  const [page, setPage] = useState<{ key: string; items: Post[]; hasMore: boolean } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [picking, setPicking] = useState<Show[] | null | false>(false);
  const [composing, setComposing] = useState<{ show?: Show | null; editing?: Post } | null>(null);
  const [fresh, setFresh] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const { needLogin, like, openMore, setToast, sheets } = useCommunity({ signedIn: me !== null, loginUrl });

  const scope: Scope | null = ids === null ? null : (chosen ?? (ids.length > 0 ? "mine" : "all"));
  const mineEmpty = scope === "mine" && ids?.length === 0;
  const key = scope === null ? "" : `${scope}|${kind ?? ""}|${scope === "mine" ? ids!.join(",") : ""}|${tick}`;

  const url = (before?: number) => {
    const query = new URLSearchParams();
    if (scope === "mine") query.set("showIds", ids!.join(","));
    if (kind) query.set("kind", kind);
    if (before) query.set("before", String(before));
    return `/api/community?${query}`;
  };

  useEffect(() => {
    if (!key || mineEmpty) return;
    let alive = true;
    fetch(url())
      .then((res) => (res.ok ? (res.json() as Promise<PostPage>) : { items: [], hasMore: false }))
      .catch(() => ({ items: [], hasMore: false }))
      .then((next) => alive && setPage({ key, ...next }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, mineEmpty]);

  useEffect(() => {
    const refresh = () => document.visibilityState === "visible" && setTick((n) => n + 1);
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);

  if (scope === null) return null;

  const pickScope = (next: Scope) => {
    setChosen(next);
    try {
      localStorage.setItem(SCOPE_KEY, next);
    } catch {}
  };

  const loadMore = async () => {
    if (!page || loadingMore) return;
    setLoadingMore(true);
    const res = await fetch(url(page.items.at(-1)?.id)).catch(() => null);
    setLoadingMore(false);
    if (!res?.ok) return;
    const next: PostPage = await res.json();
    setPage((current) => current && { ...current, items: [...current.items, ...next.items], hasMore: next.hasMore });
  };

  const replace = (post: Post) => setPage((current) => current && { ...current, items: current.items.map((it) => (it.id === post.id ? post : it)) });

  const write = async () => {
    if (needLogin("write")) return;
    setPicking(null);
    if (!ids || ids.length === 0) return setPicking([]);
    const res = await fetch(`/api/shows/participated?ids=${ids.join(",")}`).catch(() => null);
    setPicking(orderShows(res?.ok ? ((await res.json()) as ParticipatedShow[]).map((it) => it.show) : []));
  };

  const remove = async (post: Post) => {
    const res = await fetch(postPath(post), { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return setToast("지우지 못했어요");
    setPage((current) => current && { ...current, items: current.items.filter((it) => it.id !== post.id) });
    setToast("지웠어요");
  };

  const saved = (post: Post) => {
    const editing = composing?.editing;
    setComposing(null);
    if (editing) return replace(post);
    setFresh(post.id);
    if (kind === null || kind === post.kind) setPage((current) => current && { ...current, items: [post, ...current.items] });
  };

  const ready = page !== null && page.key === key;
  const items = ready ? page.items : [];

  return (
    <>
      <div role="group" aria-label="보기" className="mx-5 mb-2.5 flex gap-0.5 rounded-full bg-pill p-0.75">
        {(
          [
            ["mine", "내 공연"],
            ["all", "모든 공연"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={scope === value}
            onClick={() => pickScope(value)}
            className={`h-9 flex-1 cursor-pointer rounded-full text-sm font-bold ${scope === value ? "bg-paper shadow-[0_1px_3px_rgb(17_17_17/0.12)]" : "text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mineEmpty ? (
        <div className="flex flex-col items-center gap-3 px-8 pt-16 text-center">
          <span className="flex size-24 items-center justify-center rounded-full bg-pill">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" />
            </svg>
          </span>
          <b className="text-lg">참여한 공연의 글이 여기 모여요</b>
          <p className="text-sm leading-relaxed text-muted">공연에 참여하면 그 공연 관객들의 질문·후기·동행 글을 한곳에서 볼 수 있어요</p>
          <div className="mt-1.5 flex gap-2">
            <Link href="/find" className="press flex h-12 items-center rounded-full bg-ink px-5 text-[15px] font-bold text-stub">
              공연 찾아보기
            </Link>
            <button type="button" onClick={() => pickScope("all")} className="press h-12 cursor-pointer rounded-full bg-pill px-5 text-[15px] font-bold">
              모든 공연 글 보기
            </button>
          </div>
        </div>
      ) : (
        <>
          <div role="group" aria-label="종류" className="flex gap-1.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
            {[{ key: null, label: "전체" }, ...POST_KINDS].map((it) => (
              <button
                key={it.label}
                type="button"
                aria-pressed={kind === it.key}
                onClick={() => setKind(it.key)}
                className={`h-8.5 shrink-0 cursor-pointer rounded-full px-3.5 text-[13px] font-bold ${
                  kind === it.key ? "bg-ink text-stub" : "text-[#444449] shadow-[inset_0_0_0_1px_var(--color-line)]"
                }`}
              >
                {it.label}
              </button>
            ))}
          </div>

          <button type="button" onClick={write} className="flex w-full cursor-pointer items-center gap-3 px-5 py-3.5 text-left shadow-[inset_0_-1px_0_#eeeef1]">
            {me ? (
              <CommunityAvatar name={me.nickname} url={me.avatarUrl} />
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-line text-[#9a9aa2]">?</span>
            )}
            <span className="flex min-w-0 flex-1 flex-col">
              <b className="truncate text-sm">{me ? me.nickname : "로그인 안 함"}</b>
              <span className="text-sm text-[#9a9aa2]">{me ? "참여한 공연 이야기를 남겨 보세요" : "로그인하고 이야기를 남겨 보세요"}</span>
            </span>
            <span className="flex h-8.5 shrink-0 items-center rounded-full px-3.5 text-[13px] font-bold shadow-[inset_0_0_0_1px_var(--color-line)]">글쓰기</span>
          </button>

          {items.map((post) => (
            <div key={post.id} className={post.id === fresh ? "animate-drop motion-reduce:animate-none" : ""}>
              <PostItem
                post={post}
                showChip
                href={postHref(post)}
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
          {ready && items.length === 0 && (
            <p className="py-16 text-center text-sm text-muted">{kind ? "이 종류의 글이 아직 없어요." : "아직 올라온 글이 없어요. 첫 글을 남겨 보세요."}</p>
          )}
          {(!ready || loadingMore) && (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          )}
          <InfiniteSentinel active={ready && page.hasMore && !loadingMore} onReach={loadMore} />
        </>
      )}

      {picking !== false && (
        <PickShowSheet
          shows={picking}
          onClose={() => setPicking(false)}
          onPick={(show) => {
            setPicking(false);
            setComposing({ show });
          }}
        />
      )}
      {composing && me && (
        <ComposeSheet
          showId={composing.editing ? composing.editing.showId : (composing.show?.id ?? null)}
          nickname={me.nickname}
          avatarUrl={me.avatarUrl}
          editing={composing.editing}
          onClose={() => setComposing(null)}
          onSaved={saved}
        />
      )}
      {sheets}
    </>
  );
}
