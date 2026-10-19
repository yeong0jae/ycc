"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { formatNoticeTime } from "@/lib/format";
import { NOTICE_CHIPS, NOTICE_LABELS, type Notice } from "@/lib/notice-types";

function NoticeTime({ notice, className }: { notice: Notice; className: string }) {
  return (
    <span suppressHydrationWarning className={`font-num text-[13px] font-extrabold ${className}`}>
      {formatNoticeTime(notice.createdAt)}
      {notice.updatedAt && " · 수정됨"}
    </span>
  );
}

function NoticeImages({ notice, dark = false }: { notice: Notice; dark?: boolean }) {
  if (notice.images.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {notice.images.map((image) => (
        <a key={image.id} href={image.url} target="_blank" rel="noopener noreferrer" aria-label="이미지 크게 보기">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt=""
            width={image.width}
            height={image.height}
            loading="lazy"
            className={`h-auto w-full rounded-[14px] ${dark ? "bg-[#2a2a2e]" : "bg-cream"}`}
          />
        </a>
      ))}
    </div>
  );
}

function ClampedBody({ body }: { body: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !expanded) setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [body, expanded]);

  return (
    <>
      <p
        ref={ref}
        className={`text-sm leading-relaxed break-words whitespace-pre-wrap text-[#444449] ${expanded ? "" : "line-clamp-4"}`}
      >
        {body}
      </p>
      {overflowing && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="h-8 cursor-pointer self-start text-[13px] font-bold"
        >
          더 보기
        </button>
      )}
    </>
  );
}

export function UrgentNoticeCard({ notice }: { notice: Notice }) {
  return (
    <article className="flex flex-col gap-2 rounded-[18px] bg-ink px-4 py-3.5 text-stub">
      <span className="flex items-center gap-2">
        <span className="flex h-5.5 items-center rounded-full bg-lime px-2 text-xs font-bold text-ink">긴급</span>
        <NoticeTime notice={notice} className="text-[#b9b9c0]" />
      </span>
      <h2 className="text-base leading-snug font-bold">{notice.title}</h2>
      {notice.body && (
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-[#d6d6db]">{notice.body}</p>
      )}
      <NoticeImages notice={notice} dark />
      <span className="text-xs text-[#9c9ca3]">주최측 · {notice.organizerName}</span>
    </article>
  );
}

export function NoticeItem({ notice }: { notice: Notice }) {
  return (
    <article className="flex flex-col gap-2 border-b border-[#eeeef1] py-4.5">
      <span className="flex items-center gap-2">
        <span className={`flex h-5.5 items-center rounded-full px-2 text-xs font-bold ${NOTICE_CHIPS[notice.kind]}`}>
          {NOTICE_LABELS[notice.kind]}
        </span>
        <NoticeTime notice={notice} className="text-muted" />
      </span>
      <h2 className="text-base leading-snug font-bold">{notice.title}</h2>
      {notice.body && <ClampedBody body={notice.body} />}
      <NoticeImages notice={notice} />
      <span className="text-xs text-muted">주최측 · {notice.organizerName}</span>
    </article>
  );
}
