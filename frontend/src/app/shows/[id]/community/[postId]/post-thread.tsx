"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CommunityAvatar } from "@/components/community-avatar";
import type { Me } from "@/lib/auth";
import { COMMENT_MAX, type Comment, type PostDetail } from "@/lib/community-types";
import { Ago, MoreButton, PostItem } from "../post-item";
import { ComposeSheet } from "../sheets";
import { postPath as pathOf, useCommunity } from "../use-community";

export function PostThread({ showId, initial, me, loginUrl }: { showId: number | null; initial: PostDetail; me: Me | null; loginUrl: string }) {
  const router = useRouter();
  const [post, setPost] = useState(initial.post);
  const [comments, setComments] = useState(initial.comments);
  const [editingPost, setEditingPost] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [sending, setSending] = useState(false);
  const { needLogin, like, openMore, setToast, sheets } = useCommunity({ signedIn: me !== null, loginUrl });
  const postPath = pathOf(post);

  const removePost = async () => {
    const res = await fetch(postPath, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return setToast("지우지 못했어요");
    router.replace(showId ? `/shows/${showId}/community` : "/community");
  };

  const removeComment = async (comment: Comment) => {
    const res = await fetch(`${postPath}/comments/${comment.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return setToast("지우지 못했어요");
    setComments((current) => current.filter((it) => it.id !== comment.id));
    setPost((current) => ({ ...current, commentCount: current.commentCount - 1 }));
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (needLogin("comment") || sending || !draft.trim()) return;
    setSending(true);
    const res = await fetch(editingComment ? `${postPath}/comments/${editingComment.id}` : `${postPath}/comments`, {
      method: editingComment ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: draft }),
    }).catch(() => null);
    setSending(false);
    if (!res?.ok) {
      const problem = await res?.json().catch(() => null);
      return setToast(problem?.message || "남기지 못했어요");
    }
    const saved: Comment = await res.json();
    if (editingComment) {
      setComments((current) => current.map((it) => (it.id === saved.id ? saved : it)));
    } else {
      setComments((current) => [...current, saved]);
      setPost((current) => ({ ...current, commentCount: current.commentCount + 1 }));
    }
    setDraft("");
    setEditingComment(null);
  };

  return (
    <>
      <PostItem
        post={post}
        full
        onLike={(it) => like(it, setPost)}
        onMore={(it) => openMore({ mine: it.mine, onEdit: () => setEditingPost(true), onDelete: removePost, reportPath: `${postPath}/report` })}
      />
      <div className="flex items-center px-5 py-3 shadow-[inset_0_-1px_0_#eeeef1]">
        <b className="text-sm">댓글 {comments.length}</b>
      </div>
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-2.5 px-5 py-3 shadow-[inset_0_-1px_0_#eeeef1]">
          <CommunityAvatar name={comment.author} url={comment.authorAvatar} size={30} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <b className="truncate text-sm">{comment.author}</b>
              <Ago at={comment.createdAt} className="text-[13px]" />
              {comment.byPostAuthor && <span className="flex h-4.5 shrink-0 items-center rounded-md bg-lime px-1.5 text-[10px] font-bold">글쓴이</span>}
              {comment.updatedAt && <span className="shrink-0 text-xs text-[#9a9aa2]">수정됨</span>}
              <span className="ml-auto">
                <MoreButton
                  onClick={() =>
                    openMore({
                      mine: comment.mine,
                      onEdit: () => {
                        setEditingComment(comment);
                        setDraft(comment.body);
                      },
                      onDelete: () => removeComment(comment),
                      reportPath: `${postPath}/comments/${comment.id}/report`,
                    })
                  }
                />
              </span>
            </div>
            <p className="mt-0.5 text-sm leading-normal break-words whitespace-pre-wrap">{comment.body}</p>
          </div>
        </div>
      ))}
      {comments.length === 0 && <p className="py-12 text-center text-sm text-muted">아직 댓글이 없어요.</p>}

      <form onSubmit={send} className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-2xl items-center gap-2.5 bg-paper px-3 pt-2.5 pb-7 shadow-[0_-1px_0_#eeeef1]">
        {me && <CommunityAvatar name={me.nickname} url={me.avatarUrl} size={32} />}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={(event) => needLogin("comment") && event.target.blur()}
          maxLength={COMMENT_MAX}
          aria-label="댓글"
          placeholder={editingComment ? "댓글 고치기" : `${post.author}님에게 댓글 남기기`}
          className="h-11 min-w-0 flex-1 rounded-full bg-pill px-4 text-sm outline-none placeholder:text-[#9a9aa2] focus:ring-2 focus:ring-ink"
        />
        {editingComment && (
          <button
            type="button"
            onClick={() => {
              setEditingComment(null);
              setDraft("");
            }}
            className="h-11 shrink-0 cursor-pointer px-1 text-sm text-muted"
          >
            취소
          </button>
        )}
        <button type="submit" disabled={sending || !draft.trim()} className="press h-11 shrink-0 cursor-pointer rounded-full bg-ink px-4 text-sm font-bold text-stub disabled:opacity-35">
          {editingComment ? "저장" : "올리기"}
        </button>
      </form>

      {editingPost && me && (
        <ComposeSheet
          showId={showId}
          nickname={me.nickname}
          avatarUrl={me.avatarUrl}
          editing={post}
          onClose={() => setEditingPost(false)}
          onSaved={(saved) => {
            setPost(saved);
            setEditingPost(false);
          }}
        />
      )}
      {sheets}
    </>
  );
}
