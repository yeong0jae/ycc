"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { CommunityAvatar } from "@/components/community-avatar";
import { POST_IMAGES_MAX, POST_KINDS, POST_MAX, type CommunityImage, type Post, type PostKind, REPORT_REASONS, type ReportReason } from "@/lib/community-types";
import { resizeImage } from "@/lib/resize-image";

async function problem(res: Response | null, fallback: string) {
  const body = await res?.json().catch(() => null);
  return body?.message || fallback;
}

export function ComposeSheet({
  showId,
  nickname,
  avatarUrl,
  editing,
  onClose,
  onSaved,
}: {
  showId: number | null;
  nickname: string;
  avatarUrl: string | null;
  editing?: Post;
  onClose: () => void;
  onSaved: (post: Post) => void;
}) {
  const [kind, setKind] = useState<PostKind | null>(editing?.kind ?? null);
  const [body, setBody] = useState(editing?.body ?? "");
  const [images, setImages] = useState<CommunityImage[]>(editing?.images ?? []);
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const addImages = async (files: File[]) => {
    const room = POST_IMAGES_MAX - images.length - uploading;
    const picked = files.slice(0, Math.max(0, room));
    setUploading((n) => n + picked.length);
    await Promise.all(
      picked.map(async (file) => {
        try {
          const form = new FormData();
          form.set("file", await resizeImage(file), "photo.jpg");
          const res = await fetch("/api/community/images", { method: "POST", body: form });
          if (!res.ok) return setError(await problem(res, "사진을 올리지 못했어요."));
          const image: CommunityImage = await res.json();
          setImages((current) => [...current, image]);
        } catch {
          setError("사진을 올리지 못했어요.");
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  };

  const submit = async () => {
    if (!kind || !body.trim() || saving || uploading > 0) return;
    setSaving(true);
    setError(null);
    const res = await fetch(editing ? `/api/community/posts/${editing.id}` : "/api/community/posts", {
      method: editing ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ showId, kind, body, imageIds: images.map((image) => image.id) }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) return setError(await problem(res, "올리지 못했어요. 다시 시도해 주세요."));
    onSaved(await res.json());
  };

  return (
    <BottomSheet label={editing ? "글 고치기" : "새 글"} onClose={onClose} className="h-[92dvh]">
      <div className="flex h-full flex-col">
        <div className="flex h-14 shrink-0 items-center px-4 shadow-[inset_0_-1px_0_#eeeef1]">
          <button type="button" onClick={onClose} className="h-10 cursor-pointer px-1 text-[15px]">
            취소
          </button>
          <h2 className="mx-auto text-base font-bold">{editing ? "글 고치기" : "새 글"}</h2>
          <span className="w-10" />
        </div>
        <div className="flex min-h-0 flex-1 gap-3 overflow-y-auto px-5 pt-4">
          <div className="flex flex-col items-center">
            <CommunityAvatar name={nickname} url={avatarUrl} />
            <span className="mt-1.5 w-0.5 flex-1 rounded-full bg-line" />
          </div>
          <div className="min-w-0 flex-1 pb-6">
            <div className="flex items-center gap-1.5">
              <b className="truncate text-[15px]">{nickname}</b>
              <span className="shrink-0 text-xs text-muted">
                (으)로 올라가요 ·{" "}
                <Link href="/me" className="underline">
                  바꾸기
                </Link>
              </span>
            </div>
            <div role="group" aria-label="종류" className="mt-2.5 flex gap-1.5">
              {POST_KINDS.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  aria-pressed={kind === it.key}
                  onClick={() => setKind(it.key)}
                  className={`h-8 cursor-pointer rounded-full px-3 text-[13px] font-bold ${kind === it.key ? "bg-ink text-stub" : "text-[#444449] shadow-[inset_0_0_0_1px_var(--color-line)]"}`}
                >
                  {it.label}
                </button>
              ))}
            </div>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={POST_MAX}
              rows={5}
              autoFocus
              aria-label="내용"
              placeholder="이 공연 이야기를 남겨 보세요"
              className="mt-3 block w-full resize-none text-[15px] leading-normal outline-none placeholder:text-[#9a9aa2]"
            />
            {(images.length > 0 || uploading > 0) && (
              <div className="-mr-5 mt-2.5 flex gap-1.5 overflow-x-auto pr-5">
                {images.map((image) => (
                  <div key={image.id} className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt="" className="h-40 w-30 rounded-xl bg-pill object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((current) => current.filter((it) => it.id !== image.id))}
                      aria-label="사진 빼기"
                      className="absolute top-1.5 right-1.5 flex size-5.5 cursor-pointer items-center justify-center rounded-full bg-ink/60 text-[11px] text-stub"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {Array.from({ length: uploading }, (_, i) => (
                  <div key={`up-${i}`} className="h-40 w-30 shrink-0 animate-pulse rounded-xl bg-pill motion-reduce:animate-none" />
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={images.length + uploading >= POST_IMAGES_MAX}
              className="mt-3 flex h-8 cursor-pointer items-center gap-2 text-[13px] text-[#9a9aa2] disabled:opacity-40"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <circle cx="9" cy="10" r="2" />
                <path d="m21 16-5-5-9 9" />
              </svg>
              사진 {images.length} / {POST_IMAGES_MAX}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(event) => {
                addImages(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
            {error && (
              <p role="alert" className="mt-2 text-sm text-muted">
                {error}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center px-4 pt-3 pb-7 shadow-[inset_0_1px_0_#eeeef1]">
          <span className="text-[13px] text-[#9a9aa2]">
            {kind ? "누구나 볼 수 있어요" : "종류를 골라 주세요"} · {body.length} / {POST_MAX.toLocaleString()}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={!kind || !body.trim() || saving || uploading > 0}
            className="press ml-auto h-10 cursor-pointer rounded-full bg-ink px-5 text-sm font-bold text-stub disabled:opacity-35"
          >
            {editing ? "저장" : "게시"}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export type MoreTarget = { mine: boolean; onEdit: () => void; onDelete: () => void; onReport: () => void };

export function MoreSheet({ target, onClose }: { target: MoreTarget; onClose: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const item = "flex h-14 w-full cursor-pointer items-center px-5 text-left text-[15px] shadow-[inset_0_-1px_0_#eeeef1]";
  return (
    <BottomSheet label="더 보기" onClose={onClose}>
      <div className="flex flex-col pt-3 pb-7">
        {target.mine ? (
          <>
            <button type="button" onClick={target.onEdit} className={item}>
              고치기
            </button>
            <button type="button" onClick={() => (confirming ? target.onDelete() : setConfirming(true))} className={`${item} text-[#c0392b]`}>
              {confirming ? "한 번 더 누르면 지워요" : "지우기"}
            </button>
          </>
        ) : (
          <button type="button" onClick={target.onReport} className={`${item} text-[#c0392b]`}>
            신고
          </button>
        )}
        <button type="button" onClick={onClose} className="h-12 cursor-pointer text-sm text-muted">
          닫기
        </button>
      </div>
    </BottomSheet>
  );
}

export function ReportSheet({ onSubmit, onClose }: { onSubmit: (reason: ReportReason) => Promise<void>; onClose: () => void }) {
  const [sending, setSending] = useState(false);
  return (
    <BottomSheet label="신고" onClose={onClose}>
      <div className="flex flex-col pt-6 pb-7">
        <h2 className="px-5 font-display text-xl">신고하는 이유</h2>
        <p className="mt-1 mb-2 px-5 text-sm text-muted">신고가 쌓이면 먼저 숨기고 확인해요</p>
        {REPORT_REASONS.map((reason) => (
          <button
            key={reason.key}
            type="button"
            disabled={sending}
            onClick={async () => {
              setSending(true);
              await onSubmit(reason.key);
            }}
            className="flex h-14 w-full cursor-pointer items-center px-5 text-left text-[15px] shadow-[inset_0_-1px_0_#eeeef1] disabled:opacity-50"
          >
            {reason.label}
          </button>
        ))}
        <button type="button" onClick={onClose} className="h-12 cursor-pointer text-sm text-muted">
          그만두기
        </button>
      </div>
    </BottomSheet>
  );
}
