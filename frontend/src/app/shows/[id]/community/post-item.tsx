"use client";

import Link from "next/link";
import { useState } from "react";
import { CommunityAvatar } from "@/components/community-avatar";
import { ImageViewer } from "@/components/image-viewer";
import { POST_LABELS, type Post } from "@/lib/community-types";
import { formatAgo } from "@/lib/format";

export function MoreButton({ onClick, label = "더 보기" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="-mr-2 flex size-8 cursor-pointer items-center justify-center rounded-full text-[#9a9aa2]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
      </svg>
    </button>
  );
}

export function Ago({ at, className = "" }: { at: string; className?: string }) {
  return (
    <span suppressHydrationWarning className={`shrink-0 text-sm text-[#9a9aa2] ${className}`}>
      {formatAgo(at)}
    </span>
  );
}

function Photos({ post }: { post: Post }) {
  const [open, setOpen] = useState<number | null>(null);
  if (post.images.length === 0) return null;
  const single = post.images.length === 1;
  return (
    <>
      {open !== null && <ImageViewer images={post.images} start={open} onClose={() => setOpen(null)} />}
      <div className="-mr-5 mt-2 flex gap-1.5 overflow-x-auto pr-5 [scrollbar-width:none]">
        {post.images.map((image, index) => (
          <button key={image.id} type="button" onClick={() => setOpen(index)} aria-label="사진 크게 보기" className="shrink-0 cursor-zoom-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt=""
              width={image.width}
              height={image.height}
              loading="lazy"
              className={`rounded-xl bg-pill object-cover ${single ? "h-auto max-h-80 w-auto max-w-[min(100%,20rem)]" : "h-50 w-38"}`}
            />
          </button>
        ))}
      </div>
    </>
  );
}

export function PostItem({
  post,
  href,
  full = false,
  onLike,
  onMore,
}: {
  post: Post;
  href?: string;
  full?: boolean;
  onLike: (post: Post) => void;
  onMore: (post: Post) => void;
}) {
  const body = <p className={`mt-0.5 text-[15px] leading-normal break-words whitespace-pre-wrap ${full ? "" : "line-clamp-3"}`}>{post.body}</p>;
  return (
    <article className="flex gap-3 px-5 pt-3.5 pb-3 shadow-[inset_0_-1px_0_#eeeef1]">
      <CommunityAvatar name={post.author} url={post.authorAvatar} />
      <div className="min-w-0 flex-1">
        <div className="flex h-5 items-center gap-1.5">
          <b className="truncate text-[15px]">{post.author}</b>
          <Ago at={post.createdAt} />
          <span className="flex h-5 shrink-0 items-center rounded-md bg-pill px-1.5 text-[11px] font-bold text-[#444449]">{POST_LABELS[post.kind]}</span>
          {post.updatedAt && <span className="shrink-0 text-xs text-[#9a9aa2]">수정됨</span>}
          <span className="ml-auto">
            <MoreButton onClick={() => onMore(post)} />
          </span>
        </div>
        {href ? <Link href={href}>{body}</Link> : body}
        <Photos post={post} />
        <div className="mt-1 flex gap-3.5">
          <button
            type="button"
            aria-pressed={post.liked}
            aria-label="좋아요"
            onClick={() => onLike(post)}
            className={`-ml-2 flex h-8 cursor-pointer items-center gap-1 rounded-full px-2 text-[13px] ${post.liked ? "text-[#e8283c]" : "text-[#444449]"}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={post.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
            </svg>
            {post.likeCount > 0 && post.likeCount}
          </button>
          {href ? (
            <Link href={href} aria-label="댓글" className="-ml-2 flex h-8 items-center gap-1 rounded-full px-2 text-[13px] text-[#444449]">
              <CommentIcon />
              {post.commentCount > 0 && post.commentCount}
            </Link>
          ) : (
            <span className="-ml-2 flex h-8 items-center gap-1 px-2 text-[13px] text-[#444449]">
              <CommentIcon />
              {post.commentCount > 0 && post.commentCount}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function CommentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" />
    </svg>
  );
}
