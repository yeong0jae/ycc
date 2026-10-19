"use client";

import { useRef, useState } from "react";
import { NoticeItem, UrgentNoticeCard } from "@/components/notice-card";
import { formatNoticeTime } from "@/lib/format";
import { NOTICE_CHIPS, NOTICE_KINDS, NOTICE_LABELS, type Notice, type NoticeImage, type NoticeKind } from "@/lib/notice-types";
import { resizeImage } from "./resize-image";

const MAX_TITLE = 60;
const MAX_BODY = 3000;
const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Draft = { kind: NoticeKind; title: string; body: string; images: NoticeImage[] };

const EMPTY: Draft = { kind: "INFO", title: "", body: "", images: [] };

async function errorMessage(res: Response, fallback: string) {
  const body = await res.json().catch(() => null);
  return (body?.message as string | undefined) || fallback;
}

export function NoticeEditor({ showId, organizerName, initial }: { showId: number; organizerName: string; initial: Notice[] }) {
  const [notices, setNotices] = useState(initial);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(0);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const formTop = useRef<HTMLDivElement>(null);

  const base = `/api/organizer/shows/${showId}`;
  const update = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));
  const report = (message: string | null, done: string | null = null) => {
    setError(message);
    setNotice(done);
  };

  const addFiles = async (files: File[]) => {
    const room = MAX_IMAGES - draft.images.length - uploading;
    if (room <= 0) return report(`이미지는 ${MAX_IMAGES}장까지 붙일 수 있어요.`);
    const picked = files.slice(0, room);
    const invalid = picked.find((file) => !IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES);
    if (invalid) return report("jpg·png·webp 이미지를 장당 10MB까지 올릴 수 있어요.");
    report(files.length > room ? `이미지는 ${MAX_IMAGES}장까지라 ${room}장만 붙였어요.` : null);
    setUploading((count) => count + picked.length);
    for (const file of picked) {
      try {
        const form = new FormData();
        form.append("file", await resizeImage(file), "image.jpg");
        const res = await fetch(`${base}/notice-images`, { method: "POST", body: form });
        if (!res.ok) throw new Error(await errorMessage(res, "이미지를 올리지 못했어요."));
        const image: NoticeImage = await res.json();
        setDraft((prev) => ({ ...prev, images: [...prev.images, image] }));
      } catch (e) {
        report(e instanceof Error ? e.message : "이미지를 올리지 못했어요.");
      } finally {
        setUploading((count) => count - 1);
      }
    }
  };

  const reset = () => {
    setDraft(EMPTY);
    setEditingId(null);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    const payload = {
      kind: draft.kind,
      title: draft.title,
      body: draft.body || null,
      imageIds: draft.images.map((image) => image.id),
    };
    const res = await fetch(editingId ? `${base}/notices/${editingId}` : `${base}/notices`, {
      method: editingId ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSending(false);
    if (!res.ok) return report(await errorMessage(res, "공지를 올리지 못했어요."));
    const saved: Notice = await res.json();
    setNotices((prev) => (editingId ? prev.map((it) => (it.id === saved.id ? saved : it)) : [saved, ...prev]));
    report(null, editingId ? "공지를 고쳤어요." : "공지를 올렸어요. 공연 홈에 바로 보여요.");
    reset();
  };

  const edit = (target: Notice) => {
    setEditingId(target.id);
    setDraft({ kind: target.kind, title: target.title, body: target.body ?? "", images: target.images });
    report(null);
    formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const remove = async (id: number) => {
    const res = await fetch(`${base}/notices/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) return report(await errorMessage(res, "공지를 지우지 못했어요."));
    setNotices((prev) => prev.filter((it) => it.id !== id));
    if (editingId === id) reset();
    report(null, "공지를 지웠어요.");
  };

  const preview: Notice = {
    id: 0,
    kind: draft.kind,
    title: draft.title || "제목",
    body: draft.body || null,
    images: draft.images,
    organizerName,
    createdAt: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).replace(" ", "T"),
    updatedAt: null,
  };

  return (
    <div className="flex flex-col lg:h-full lg:flex-row">
      <form onSubmit={submit} className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:overflow-y-auto lg:px-7 lg:py-6">
        <div ref={formTop} className="flex items-center gap-3">
          <h1 className="text-xl font-bold">{editingId ? "공지 고치기" : "공지 올리기"}</h1>
          {editingId && (
            <button type="button" onClick={reset} className="ml-auto h-9 cursor-pointer rounded-full bg-pill px-3.5 text-[13px] font-bold">
              고치기 그만두기
            </button>
          )}
        </div>

        <div role="group" aria-label="종류" className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">종류</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {NOTICE_KINDS.map((kind) => (
              <button
                key={kind.key}
                type="button"
                aria-pressed={draft.kind === kind.key}
                onClick={() => update({ kind: kind.key })}
                className={`press h-10 cursor-pointer rounded-full px-4 text-sm font-bold ${draft.kind === kind.key ? "bg-ink text-stub" : "bg-pill"}`}
              >
                {kind.label}
              </button>
            ))}
            <span className="ml-1 text-xs text-muted">긴급은 공연 홈 맨 위에 검은 카드로 보여요</span>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">제목</span>
          <input
            value={draft.title}
            onChange={(event) => update({ title: event.target.value })}
            required
            maxLength={MAX_TITLE}
            className="h-12 rounded-[14px] bg-pill px-4.5 text-base outline-none focus:ring-2 focus:ring-ink"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex text-[13px] font-bold">
            내용
            <span className="ml-1 font-normal text-muted">(선택 · 이미지로 대신해도 돼요)</span>
            <span className="ml-auto font-num font-extrabold text-muted">
              {draft.body.length.toLocaleString()} / {MAX_BODY.toLocaleString()}
            </span>
          </span>
          <textarea
            value={draft.body}
            onChange={(event) => update({ body: event.target.value })}
            maxLength={MAX_BODY}
            rows={8}
            className="resize-y rounded-[14px] bg-pill px-4.5 py-3.5 text-[15px] leading-relaxed outline-none focus:ring-2 focus:ring-ink"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">
            이미지 <span className="font-normal text-muted">(선택 · {MAX_IMAGES}장까지 · 장당 10MB)</span>
          </span>
          <div className="flex flex-wrap gap-2.5">
            {draft.images.map((image) => (
              <div key={image.id} className="relative h-32 w-26 shrink-0 overflow-hidden rounded-xl bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  aria-label="이미지 빼기"
                  onClick={() => update({ images: draft.images.filter((it) => it.id !== image.id) })}
                  className="absolute top-1.5 right-1.5 flex size-7 cursor-pointer items-center justify-center rounded-full bg-ink text-stub"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            ))}
            {Array.from({ length: uploading }, (_, i) => (
              <div key={`uploading-${i}`} className="flex h-32 w-26 shrink-0 animate-pulse items-center justify-center rounded-xl bg-pill text-xs text-muted">
                올리는 중
              </div>
            ))}
            {draft.images.length + uploading < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  addFiles(Array.from(event.dataTransfer.files));
                }}
                className={`flex h-32 min-w-26 flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl text-sm text-[#444449] shadow-[inset_0_0_0_1.5px_var(--color-line)] ${dragging ? "bg-pill" : ""}`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="hidden lg:inline">이미지를 끌어 놓거나 눌러서 고르기</span>
                <span className="lg:hidden">사진</span>
              </button>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
        </div>

        {(error || notice) && (
          <p role={error ? "alert" : "status"} className={`text-sm font-semibold ${error ? "" : "text-muted"}`}>
            {error ?? notice}
          </p>
        )}

        <button
          type="submit"
          disabled={sending || uploading > 0}
          className="press h-13 cursor-pointer rounded-full bg-lime text-base font-bold disabled:opacity-50 lg:self-start lg:px-8"
        >
          {editingId ? "고친 내용 저장" : "공지 올리기"}
        </button>
      </form>

      <aside className="flex flex-col gap-3.5 border-line bg-[#f7f7f8] p-4 lg:w-95 lg:shrink-0 lg:overflow-y-auto lg:border-l lg:p-6">
        <p className="hidden text-[13px] font-bold text-muted lg:block">관객에게 이렇게 보여요</p>
        <div className="hidden rounded-[20px] bg-paper px-4 lg:block">
          {draft.kind === "URGENT" ? (
            <div className="py-4">
              <UrgentNoticeCard notice={preview} />
            </div>
          ) : (
            <div className="[&>article]:border-b-0">
              <NoticeItem notice={preview} />
            </div>
          )}
        </div>

        <p className="text-[13px] font-bold text-muted lg:mt-2">올린 공지 {notices.length}</p>
        {notices.length === 0 ? (
          <p className="rounded-2xl bg-paper px-4 py-6 text-center text-sm text-muted">아직 올린 공지가 없어요.</p>
        ) : (
          <ul className="flex flex-col rounded-2xl bg-paper shadow-[inset_0_0_0_1px_var(--color-line)]">
            {notices.map((item) => (
              <li key={item.id} className="flex items-center gap-2 border-b border-line px-3.5 py-3 last:border-b-0">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${NOTICE_CHIPS[item.kind]}`}>
                      {NOTICE_LABELS[item.kind]}
                    </span>
                    <span className="truncate text-sm font-medium">{item.title}</span>
                  </span>
                  <span suppressHydrationWarning className="font-num text-xs font-extrabold text-muted">
                    {formatNoticeTime(item.createdAt)}
                    {item.updatedAt && " · 수정됨"}
                    {item.images.length > 0 && ` · 이미지 ${item.images.length}`}
                  </span>
                </span>
                {deletingId === item.id ? (
                  <>
                    <button type="button" onClick={() => remove(item.id)} className="h-8 shrink-0 cursor-pointer rounded-full bg-ink px-2.5 text-xs font-bold text-stub">
                      지우기
                    </button>
                    <button type="button" onClick={() => setDeletingId(null)} className="h-8 shrink-0 cursor-pointer rounded-full px-2 text-xs text-muted">
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => edit(item)} className="h-8 shrink-0 cursor-pointer rounded-full bg-pill px-2.5 text-xs font-bold">
                      고치기
                    </button>
                    <button type="button" onClick={() => setDeletingId(item.id)} className="h-8 shrink-0 cursor-pointer rounded-full px-2 text-xs text-muted">
                      지우기
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
