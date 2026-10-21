"use client";

import { useRef, useState } from "react";
import { MapBoard } from "@/components/map-board";
import { PinIcon } from "@/components/pin-icon";
import { type Crop, FULL_CROP, type MapPin, PIN_KINDS, type PinKind, type ShowMap } from "@/lib/map-types";
import { resizeImage } from "@/lib/resize-image";
import { CropOverlay } from "./crop-overlay";

type Draft = { id: number | null; kind: PinKind; name: string; description: string; x: number; y: number; stageId: number | null };

const inputClass = "rounded-2xl bg-pill px-4 text-[15px] outline-none placeholder:text-muted focus:ring-2 focus:ring-ink";

export function MapEditor({ showId, initial }: { showId: number; initial: ShowMap }) {
  const [map, setMap] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<"upload" | "ai" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAi, setConfirmAi] = useState(false);
  const [cropping, setCropping] = useState<Crop | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const base = `/api/organizer/shows/${showId}/map`;
  const image = map.images[0];
  const pins = map.pins.filter((pin) => pin.imageId === image?.id);

  const call = async (path: string, init: RequestInit, fallback: string) => {
    setError(null);
    const res = await fetch(`${base}${path}`, init).catch(() => null);
    if (!res?.ok) {
      const problem = await res?.json().catch(() => null);
      setError(problem?.message || fallback);
      return null;
    }
    const next: ShowMap = await res.json();
    setMap(next);
    return next;
  };

  const json = (method: string, body: unknown): RequestInit => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  const findPins = async () => {
    setConfirmAi(false);
    setBusy("ai");
    await call("/ai", { method: "POST" }, "AI가 장소를 찾지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
    setDraft(null);
    setBusy(null);
  };

  const upload = async (files: File[]) => {
    if (files.length === 0) return;
    setBusy("upload");
    let latest: ShowMap | null = null;
    for (const file of files) {
      const form = new FormData();
      form.set("file", await resizeImage(file), "map.jpg");
      latest = (await call("/images", { method: "POST", body: form }, "이미지를 올리지 못했어요.")) ?? latest;
    }
    setBusy(null);
    const first = !image && latest && latest.images.length > 0;
    if (first && latest!.aiAvailable) await findPins();
  };

  const savePin = async (next: Draft) => {
    setBusy("save");
    const body = { kind: next.kind, name: next.name, description: next.description || null, x: next.x, y: next.y, stageId: next.kind === "STAGE" ? next.stageId : null };
    const saved = next.id ? await call(`/pins/${next.id}`, json("PUT", body), "저장하지 못했어요.") : await call("/pins", json("POST", body), "저장하지 못했어요.");
    setBusy(null);
    if (saved) setDraft(null);
  };

  const movePin = (pin: MapPin, x: number, y: number) => {
    setMap((current) => ({ ...current, pins: current.pins.map((it) => (it.id === pin.id ? { ...it, x, y } : it)) }));
    call(`/pins/${pin.id}`, json("PUT", { kind: pin.kind, name: pin.name, description: pin.description, x, y, stageId: pin.stageId }), "옮기지 못했어요.");
    if (draft?.id === pin.id) setDraft({ ...draft, x, y });
  };

  const removePin = async () => {
    if (!draft?.id) return setDraft(null);
    await call(`/pins/${draft.id}`, { method: "DELETE" }, "지우지 못했어요.");
    setDraft(null);
  };

  const removeImage = async (imageId: number) => {
    setRemoving(null);
    setDraft(null);
    setCropping(null);
    await call(`/images/${imageId}`, { method: "DELETE" }, "지우지 못했어요.");
  };

  const saveCrop = async () => {
    if (!image || !cropping) return;
    const saved = await call(`/images/${image.id}/crop`, json("PUT", cropping), "범위를 저장하지 못했어요.");
    if (saved) setCropping(null);
  };

  const togglePublish = () => call("/published", json("PUT", { published: !map.published }), "바꾸지 못했어요.");

  const panel = draft && (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (draft.name.trim()) savePin(draft);
      }}
      className="flex flex-col gap-3"
    >
      <b className="text-base">{draft.id ? "핀 고치기" : "새 핀"}</b>
      <div role="group" aria-label="종류" className="flex flex-wrap gap-1.5">
        {PIN_KINDS.map((it) => (
          <button
            key={it.key}
            type="button"
            aria-pressed={draft.kind === it.key}
            onClick={() => setDraft({ ...draft, kind: it.key })}
            className={`h-8 cursor-pointer rounded-full px-3 text-[13px] font-bold ${draft.kind === it.key ? "bg-ink text-stub" : "shadow-[inset_0_0_0_1px_var(--color-line)]"}`}
          >
            <span className="inline-flex items-center gap-1">
              <PinIcon kind={it.key} size={15} />
              {it.label}
            </span>
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold">이름</span>
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} maxLength={60} required autoFocus className={`h-11 ${inputClass}`} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold">
          설명 <span className="font-normal text-muted">(선택)</span>
        </span>
        <textarea
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          maxLength={300}
          rows={3}
          className={`resize-none py-3 leading-relaxed ${inputClass}`}
        />
      </label>
      {draft.kind === "STAGE" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">타임테이블 무대</span>
          <select
            value={draft.stageId ?? ""}
            onChange={(event) => setDraft({ ...draft, stageId: event.target.value ? Number(event.target.value) : null })}
            className={`h-11 ${inputClass}`}
          >
            <option value="">잇지 않음</option>
            {map.stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted">이어 두면 관객이 핀을 눌렀을 때 지금·다음 순서가 보여요</span>
        </label>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={busy === "save" || !draft.name.trim()} className="press h-11 flex-1 cursor-pointer rounded-full bg-ink text-sm font-bold text-stub disabled:opacity-40">
          저장
        </button>
        <button type="button" onClick={removePin} className="h-11 cursor-pointer rounded-full px-4 text-sm font-bold text-[#c0392b] shadow-[inset_0_0_0_1.5px_var(--color-line)]">
          {draft.id ? "지우기" : "그만두기"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="flex flex-col gap-4 px-4 py-5 lg:flex-row lg:gap-6 lg:px-6">
      <section className="flex min-w-0 flex-1 flex-col gap-3 lg:max-w-200">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="hidden font-display text-xl lg:block">맵</h1>
          {image && (
            <label className="ml-auto flex h-10 cursor-pointer items-center gap-2.5 rounded-full bg-pill pr-1.5 pl-4 text-sm font-bold">
              관객에게 핀 공개
              <input type="checkbox" checked={map.published} onChange={togglePublish} className="sr-only" />
              <span className={`flex h-7 w-12 rounded-full p-0.75 transition-colors ${map.published ? "justify-end bg-ink" : "bg-line"}`}>
                <span className="size-5.5 rounded-full bg-paper" />
              </span>
            </label>
          )}
        </div>

        {image && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {map.images.map((it, index) => (
              <div key={it.id} className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt="" className={`h-16 w-auto rounded-lg bg-pill ${index === 0 ? "ring-2 ring-ink" : ""}`} />
                {index === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-ink px-1.5 py-px text-[10px] font-bold text-stub">핀 맵</span>}
                <button
                  type="button"
                  aria-label="이미지 지우기"
                  onClick={() => (removing === it.id ? removeImage(it.id) : setRemoving(it.id))}
                  className={`absolute top-1 right-1 flex h-6 cursor-pointer items-center justify-center rounded-full text-[11px] font-bold text-stub ${
                    removing === it.id ? "bg-[#c0392b] px-2" : "w-6 bg-ink"
                  }`}
                >
                  {removing === it.id ? "지우기" : "✕"}
                </button>
              </div>
            ))}
            {map.images.length < 4 && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={busy !== null}
                className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-lg text-xs text-[#444449] shadow-[inset_0_0_0_1.5px_var(--color-line)]"
              >
                + 추가
              </button>
            )}
          </div>
        )}
        {image && (
          <p className="-mt-1 text-xs leading-relaxed text-muted">
            {removing !== null ? "한 번 더 누르면 지워져요. 핀 맵을 지우면 그 위 핀도 같이 지워져요." : "첫 장에 핀을 찍어요. 나머지는 관객 맵 아래에 이어서 보여요."}
          </p>
        )}

        {!image ? (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy !== null}
            className="flex h-80 cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] text-center shadow-[inset_0_0_0_1.5px_var(--color-line)] disabled:opacity-50"
          >
            <b className="text-base">{busy === "upload" ? "올리는 중" : "공식 맵 이미지 올리기"}</b>
            <span className="text-sm text-muted">인스타에 올린 현장 맵을 그대로 올리면{map.aiAvailable ? " AI가 장소를 찾아 핀을 찍어 줘요" : " 관객이 볼 수 있어요"}</span>
          </button>
        ) : (
          <>
            <div className="relative">
              <MapBoard
                image={image}
                pins={pins}
                selectedId={draft?.id ?? null}
                showLabels
                onPinClick={(pin) => setDraft({ id: pin.id, kind: pin.kind, name: pin.name, description: pin.description ?? "", x: pin.x, y: pin.y, stageId: pin.stageId })}
                onBoardClick={cropping ? undefined : (x, y) => setDraft({ id: null, kind: "ETC", name: "", description: "", x, y, stageId: null })}
                onPinMove={cropping ? undefined : movePin}
                overlay={(cropping || image.crop) && <CropOverlay crop={cropping ?? image.crop ?? FULL_CROP} editing={cropping !== null} onChange={setCropping} />}
              />
              {busy === "ai" && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-[18px] bg-paper/80">
                  <span className="size-8 animate-spin rounded-full border-3 border-line border-t-ink motion-reduce:animate-none" />
                  <b className="text-sm">AI가 맵에서 장소를 찾는 중이에요</b>
                  <span className="text-xs text-muted">10~30초쯤 걸려요</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted">
                {cropping ? "네 귀퉁이를 끌어서 관객에게 보여 줄 지도 부분을 정해요" : "빈 곳을 누르면 그 자리에 핀 추가 · 핀을 끌어서 옮기기 · 핀을 누르면 고치기"}
              </p>
              {cropping ? (
                <span className="ml-auto flex gap-1.5">
                  <button type="button" onClick={() => setCropping(null)} className="h-9 cursor-pointer rounded-full px-3 text-[13px] text-muted">
                    그만두기
                  </button>
                  <button type="button" onClick={saveCrop} className="h-9 cursor-pointer rounded-full bg-ink px-3.5 text-[13px] font-bold text-stub">
                    범위 저장
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(null);
                    setCropping(image.crop ?? FULL_CROP);
                  }}
                  className="ml-auto h-9 cursor-pointer rounded-full bg-pill px-3.5 text-[13px] font-bold"
                >
                  보여 줄 범위 고치기
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-muted">
                핀 {pins.length}개{pins.some((pin) => pin.ai) && ` · AI가 찾은 핀 ${pins.filter((pin) => pin.ai).length}개`}
              </span>
              {map.aiAvailable && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => (pins.length > 0 && !confirmAi ? setConfirmAi(true) : findPins())}
                  className="ml-auto h-9 cursor-pointer rounded-full bg-pill px-3.5 font-bold disabled:opacity-50"
                >
                  {confirmAi ? "지금 핀을 모두 지우고 다시 찾을까요? 한 번 더 누르기" : "AI로 다시 찾기"}
                </button>
              )}
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="text-sm text-[#c0392b]">
            {error}
          </p>
        )}

        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(event) => {
            upload(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </section>

      {image && (
        <aside className="lg:w-80 lg:shrink-0">
          {panel ?? (
            <div className="rounded-2xl bg-[#f7f7f8] p-4 text-[13px] leading-relaxed text-[#444449]">
              <b className="text-ink">핀 확인하기</b>
              <br />
              AI가 찾은 핀은 이름이나 위치가 틀릴 수 있어요. 하나씩 눌러 확인하고, 다 됐으면 위의 &quot;관객에게 핀 공개&quot;를 켜 주세요.
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
