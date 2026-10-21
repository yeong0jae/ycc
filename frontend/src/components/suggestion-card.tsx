"use client";

import { useState } from "react";
import { ImageViewer } from "@/components/image-viewer";
import { formatNoticeTime } from "@/lib/format";
import { ShieldIcon } from "@/components/verified-mark";
import { SUGGESTION_SOURCES, type Suggestion } from "@/lib/suggestion-types";

export function SourceChip({ suggestion }: { suggestion: Suggestion }) {
  const ticket = suggestion.source === "TICKET";
  return (
    <span className={`flex shrink-0 items-center gap-1 text-[13px] font-bold ${ticket ? "text-verified" : "text-muted"}`}>
      {ticket ? (
        <ShieldIcon />
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
        </svg>
      )}
      {SUGGESTION_SOURCES[suggestion.source]}
    </span>
  );
}

export function SuggestionTime({ at, className = "" }: { at: string; className?: string }) {
  return (
    <span suppressHydrationWarning className={`font-num text-[13px] font-extrabold text-muted ${className}`}>
      {formatNoticeTime(at)}
    </span>
  );
}

export function SuggestionItem({ suggestion }: { suggestion: Suggestion }) {
  const [viewing, setViewing] = useState(false);
  return (
    <article className="flex flex-col gap-2 py-4 shadow-[inset_0_-1px_0_#eeeef1]">
      <span className="flex items-center gap-2">
        <SourceChip suggestion={suggestion} />
        <SuggestionTime at={suggestion.createdAt} className="ml-auto text-xs" />
      </span>
      <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{suggestion.body}</p>
      {suggestion.image && (
        <>
          {viewing && <ImageViewer images={[suggestion.image]} start={0} onClose={() => setViewing(false)} />}
          <button type="button" onClick={() => setViewing(true)} aria-label="사진 크게 보기" className="cursor-zoom-in self-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={suggestion.image.url}
              alt=""
              width={suggestion.image.width}
              height={suggestion.image.height}
              loading="lazy"
              className="h-auto max-h-60 w-auto max-w-[60%] rounded-xl bg-pill object-cover"
            />
          </button>
        </>
      )}
      {suggestion.reply && (
        <div className="mt-0.5 flex flex-col gap-1 rounded-[14px] bg-[#f7f7f8] px-3.5 py-3">
          <span className="flex items-center gap-1.5 text-xs font-bold">
            주최측 답변
            <SuggestionTime at={suggestion.reply.createdAt} className="text-xs" />
            {suggestion.reply.updatedAt && <span className="text-xs font-normal text-muted">· 수정됨</span>}
          </span>
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-[#333338]">{suggestion.reply.body}</p>
        </div>
      )}
    </article>
  );
}
