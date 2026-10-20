"use client";

import { useEffect, useRef, useState } from "react";
import { type SlotChange, TimetableGrid } from "@/components/timetable-grid";
import { resizeImage } from "@/lib/resize-image";
import { formatDay, formatMinute, parseMinute, STAGE_COLORS, type Timetable, timetableRange, type TimetableSlot, type TimetableStage } from "@/lib/timetable-types";

const DEFAULT_LENGTH = 40;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const UNDO_MS = 5000;

type Draft = { key: number; id: number | null; stageId: number; start: string; end: string; artist: string; note?: string };

type Undo = { slot: TimetableSlot; message: string };

const inputClass = "h-11 w-full rounded-xl bg-paper px-3.5 text-[15px] outline-none focus:ring-2 focus:ring-ink";

async function errorMessage(res: Response, fallback: string) {
  const body = await res.json().catch(() => null);
  return (body?.message as string | undefined) || fallback;
}

export function TimetableEditor({ showId, initial }: { showId: number; initial: Timetable }) {
  const [timetable, setTimetable] = useState(initial);
  const [day, setDay] = useState(initial.days[0]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingStage, setEditingStage] = useState<number | null>(null);
  const [deletingStage, setDeletingStage] = useState<number | null>(null);
  const [addingStage, setAddingStage] = useState(false);
  const [newStage, setNewStage] = useState("");
  const [draggedStage, setDraggedStage] = useState<number | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);
  const draftKey = useRef(0);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const base = `/api/organizer/shows/${showId}/timetable`;

  const call = async (path: string, method: string, body?: unknown) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      setError(await errorMessage(res, "저장하지 못했어요."));
      return false;
    }
    setTimetable(await res.json());
    setError(null);
    return true;
  };

  const { stages } = timetable;
  const daySlots = timetable.slots.filter((slot) => slot.day === day);
  const dayImages = timetable.images.filter((image) => image.day === day);
  const fitted = timetableRange(daySlots);
  const range = { start: Math.min(fitted.start, 12 * 60), end: Math.max(fitted.end, 22 * 60) + 60 };

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  const openDraft = (next: Omit<Draft, "key">) => setDraft({ ...next, key: ++draftKey.current });
  const openSlot = (slot: TimetableSlot) =>
    openDraft({ id: slot.id, stageId: slot.stageId, start: formatMinute(slot.start, false), end: formatMinute(slot.end, false), artist: slot.artist });
  const openNew = (stageId: number, minute: number, endMinute = minute + DEFAULT_LENGTH, note?: string) =>
    openDraft({ id: null, stageId, start: formatMinute(minute, false), end: formatMinute(endMinute, false), artist: "", note });

  const slotBody = (slot: TimetableSlot, change: SlotChange) => ({ stageId: change.stageId, day: slot.day, start: change.start, end: change.end, artist: slot.artist });

  const changeSlot = async (slot: TimetableSlot, change: SlotChange) => {
    setTimetable((current) => ({ ...current, slots: current.slots.map((it) => (it.id === slot.id ? { ...it, ...change } : it)) }));
    const moved = change.stageId !== slot.stageId || change.start !== slot.start;
    const stageName = stages.find((stage) => stage.id === change.stageId)?.name ?? "";
    if (await call(`/slots/${slot.id}`, "PUT", slotBody(slot, change))) {
      setUndo({ slot, message: moved ? `${slot.artist}를 ${stageName} ${formatMinute(change.start)}으로 옮겼어요` : `${slot.artist} 끝을 ${formatMinute(change.end)}으로 바꿨어요` });
      if (draft?.id === slot.id) setDraft(null);
    } else {
      setTimetable((current) => ({ ...current, slots: current.slots.map((it) => (it.id === slot.id ? slot : it)) }));
    }
  };

  const undoChange = async () => {
    if (!undo) return;
    const { slot } = undo;
    setUndo(null);
    await call(`/slots/${slot.id}`, "PUT", slotBody(slot, slot));
  };

  const start = draft ? parseMinute(draft.start) : null;
  const end = draft ? parseMinute(draft.end) : null;
  const overlap =
    draft && start !== null && end !== null
      ? daySlots.find((slot) => slot.id !== draft.id && slot.stageId === draft.stageId && slot.start < end && start < slot.end)
      : undefined;

  const saveSlot = async (next: boolean) => {
    if (!draft) return;
    if (start === null || end === null) return setError("시간은 14:00처럼 적어 주세요. 자정을 넘기면 25:30처럼요.");
    const body = { stageId: draft.stageId, day, start, end, artist: draft.artist };
    const ok = await call(draft.id ? `/slots/${draft.id}` : "/slots", draft.id ? "PUT" : "POST", body);
    if (!ok) return;
    if (!next) return setDraft(null);
    const length = end - start;
    openNew(draft.stageId, end, end + length, `${draft.artist.trim()} 저장했어요 · 끝난 ${formatMinute(end)}부터, 같은 길이(${length}분)로 채웠어요`);
  };

  const deleteSlot = async () => {
    if (draft?.id && (await call(`/slots/${draft.id}`, "DELETE"))) setDraft(null);
  };

  const moveStage = (stageId: number, toIndex: number) => {
    const ids = stages.map((stage) => stage.id).filter((id) => id !== stageId);
    ids.splice(toIndex, 0, stageId);
    if (ids.some((id, index) => id !== stages[index].id)) call("/stages/order", "PUT", { stageIds: ids });
  };

  const renameStage = (stage: TimetableStage, value: string) => {
    const name = value.trim();
    setEditingStage(null);
    setDeletingStage(null);
    if (name && name !== stage.name) call(`/stages/${stage.id}`, "PUT", { name });
  };

  const deleteStage = async (stage: TimetableStage) => {
    if (deletingStage !== stage.id && timetable.slots.some((slot) => slot.stageId === stage.id)) return setDeletingStage(stage.id);
    await call(`/stages/${stage.id}`, "DELETE");
    setEditingStage(null);
    setDeletingStage(null);
    setDraft(null);
  };

  const addStages = async (names: string[]) => {
    for (const name of names) if (!(await call("/stages", "POST", { name }))) return false;
    return true;
  };

  const renderStageHeader = (stage: TimetableStage, index: number, color: string) =>
    editingStage === stage.id ? (
      <div className="flex h-7.5 items-center gap-1 rounded-md bg-paper pr-1 pl-2" style={{ boxShadow: `inset 0 0 0 2px ${color}` }}>
        <input
          autoFocus
          defaultValue={stage.name}
          maxLength={30}
          aria-label="무대 이름"
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") {
              event.currentTarget.value = stage.name;
              setEditingStage(null);
              setDeletingStage(null);
            }
          }}
          onBlur={(event) => renameStage(stage, event.target.value)}
          className="w-0 min-w-0 flex-1 bg-transparent font-num text-[11px] font-black outline-none"
        />
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => deleteStage(stage)}
          className={`h-5.5 shrink-0 cursor-pointer rounded px-1.5 text-[10px] font-bold ${deletingStage === stage.id ? "bg-ink text-stub" : "text-muted"}`}
        >
          {deletingStage === stage.id ? "블록도 지우기" : "지우기"}
        </button>
      </div>
    ) : (
      <button
        type="button"
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          setDraggedStage(stage.id);
        }}
        onDragEnd={() => setDraggedStage(null)}
        onDragOver={(event) => draggedStage !== null && event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (draggedStage !== null) moveStage(draggedStage, index);
          setDraggedStage(null);
        }}
        onClick={() => setEditingStage(stage.id)}
        title="눌러서 이름 바꾸기 · 끌어서 순서 바꾸기"
        className={`flex h-7.5 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md px-1 font-num text-[11px] font-black text-white ${draggedStage === stage.id ? "opacity-40" : ""}`}
        style={{ background: color }}
      >
        <span aria-hidden="true" className="hidden cursor-grab tracking-[-1px] opacity-70 pointer-fine:inline">
          ⠿
        </span>
        <span className="truncate">{stage.name}</span>
      </button>
    );

  const nextStageColor = STAGE_COLORS[stages.length % STAGE_COLORS.length].dark;
  const addColumn = {
    preview: addingStage ? nextStageColor : null,
    header: addingStage ? (
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const name = newStage.trim();
          if (name && (await addStages([name]))) setNewStage("");
        }}
        className="flex h-7.5 items-center gap-1 rounded-md bg-paper pr-1 pl-2"
        style={{ boxShadow: `inset 0 0 0 2px ${nextStageColor}` }}
      >
        <input
          autoFocus
          value={newStage}
          onChange={(event) => setNewStage(event.target.value)}
          onKeyDown={(event) => event.key === "Escape" && setAddingStage(false)}
          onBlur={() => !newStage.trim() && setAddingStage(false)}
          maxLength={30}
          placeholder="무대 이름"
          aria-label="새 무대 이름"
          className="w-0 min-w-0 flex-1 bg-transparent font-num text-[11px] font-black outline-none placeholder:font-sans placeholder:font-normal"
        />
        <button type="submit" className="h-5 shrink-0 cursor-pointer rounded px-1 text-[9px] font-bold text-white" style={{ background: nextStageColor }}>
          Enter
        </button>
      </form>
    ) : (
      <button
        type="button"
        onClick={() => setAddingStage(true)}
        className="flex h-7.5 w-full cursor-pointer items-center justify-center rounded-md text-[13px] font-bold text-muted shadow-[inset_0_0_0_1.5px_#b9b9c0]"
      >
        + 무대
      </button>
    ),
  };

  const addImages = async (files: File[]) => {
    const invalid = files.find((file) => !IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES);
    if (invalid) return setError("jpg·png·webp 이미지를 장당 10MB까지 올릴 수 있어요.");
    setUploading((count) => count + files.length);
    for (const file of files) {
      try {
        const form = new FormData();
        form.append("file", await resizeImage(file), "timetable.jpg");
        const res = await fetch(`${base}/images?day=${day}`, { method: "POST", body: form });
        if (!res.ok) throw new Error(await errorMessage(res, "이미지를 올리지 못했어요."));
        setTimetable(await res.json());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "이미지를 올리지 못했어요.");
      } finally {
        setUploading((count) => count - 1);
      }
    }
  };

  const editor = draft && (
    <div className="flex flex-col gap-3">
      <p className="text-base font-bold">{draft.id ? "순서 고치기" : "순서 추가"}</p>
      {draft.note && <p className="-mt-1.5 text-xs text-muted">{draft.note}</p>}
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold">출연</span>
        <input key={draft.key} value={draft.artist} onChange={(event) => setDraft({ ...draft, artist: event.target.value })} maxLength={100} autoFocus className={inputClass} />
      </label>
      <div role="group" aria-label="무대" className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold">무대</span>
        <div className="flex flex-wrap gap-1.5">
          {stages.map((stage) => (
            <button
              key={stage.id}
              type="button"
              aria-pressed={draft.stageId === stage.id}
              onClick={() => setDraft({ ...draft, stageId: stage.id })}
              className={`h-9 cursor-pointer rounded-full px-3.5 text-[13px] font-bold ${draft.stageId === stage.id ? "bg-ink text-stub" : "bg-paper"}`}
            >
              {stage.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">시작</span>
          <input value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} inputMode="numeric" className={`${inputClass} font-num font-extrabold`} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">끝</span>
          <input value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} inputMode="numeric" className={`${inputClass} font-num font-extrabold`} />
        </label>
      </div>
      <p className="-mt-1 text-xs text-muted">자정을 넘기면 25:30처럼 적어 주세요</p>
      {overlap && <p className="text-xs font-semibold">같은 무대의 {overlap.artist}와 시간이 겹쳐요</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => saveSlot(false)} className="press h-12 flex-1 cursor-pointer rounded-full bg-lime text-[15px] font-bold">
          저장
        </button>
        {!draft.id && (
          <button
            type="button"
            onClick={() => saveSlot(true)}
            className="press h-12 flex-1 cursor-pointer rounded-full bg-paper px-3 text-sm font-bold whitespace-nowrap shadow-[inset_0_0_0_1.5px_var(--color-line)]"
          >
            저장하고 다음 순서
          </button>
        )}
        {draft.id && (
          <button type="button" onClick={deleteSlot} className="h-12 cursor-pointer rounded-full bg-paper px-4 text-[15px] shadow-[inset_0_0_0_1.5px_var(--color-line)]">
            지우기
          </button>
        )}
        <button type="button" onClick={() => setDraft(null)} className="h-12 cursor-pointer px-2 text-sm text-muted">
          닫기
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:h-full lg:flex-row">
      <section className="flex min-w-0 flex-1 flex-col gap-3 py-4 lg:overflow-y-auto lg:py-5 lg:*:mx-auto lg:*:w-full lg:*:max-w-160">
        <div className="flex flex-wrap items-center gap-1.5 px-4 lg:px-6">
          {timetable.days.map((it) => (
            <button
              key={it}
              type="button"
              aria-pressed={it === day}
              onClick={() => {
                setDay(it);
                setDraft(null);
              }}
              className={`press h-10 cursor-pointer rounded-full px-4 font-num text-sm font-black ${it === day ? "bg-ink text-stub" : "bg-pill"}`}
            >
              {formatDay(it)}
            </button>
          ))}
          <button
            type="button"
            role="switch"
            aria-checked={timetable.published}
            onClick={() => call("/published", "PUT", { published: !timetable.published })}
            className="ml-auto flex h-10 cursor-pointer items-center gap-2.5 rounded-full bg-pill pr-1.5 pl-4 text-sm font-bold"
          >
            관객에게 공개
            <span className={`flex h-7 w-12 items-center rounded-full p-0.75 transition-colors ${timetable.published ? "justify-end bg-lime" : "bg-[#dcdce1]"}`}>
              <span className="size-5.5 rounded-full bg-ink" />
            </span>
          </button>
        </div>
        {error && (
          <p role="alert" className="px-4 text-sm font-semibold lg:px-6">
            {error}
          </p>
        )}
        {stages.length === 0 ? (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const names = newStage.split(",").map((name) => name.trim()).filter(Boolean);
              if (names.length > 0 && (await addStages(names))) setNewStage("");
            }}
            className="flex flex-col gap-2 px-4 py-10 lg:px-6"
          >
            <label htmlFor="first-stages" className="text-sm font-bold">
              무대 이름을 쉼표로 적어 주세요
            </label>
            <div className="flex gap-1.5">
              <input
                id="first-stages"
                value={newStage}
                onChange={(event) => setNewStage(event.target.value)}
                placeholder="MAIN, FOREST, LOUNGE"
                className={`${inputClass} flex-1 bg-pill`}
              />
              <button type="submit" disabled={!newStage.trim()} className="h-11 shrink-0 cursor-pointer rounded-xl bg-ink px-4 text-sm font-bold text-stub disabled:opacity-40">
                무대 만들기
              </button>
            </div>
          </form>
        ) : (
          <>
            <TimetableGrid
              stages={stages}
              slots={daySlots}
              range={range}
              selectedId={draft?.id ?? null}
              onSlotClick={openSlot}
              onEmptyClick={(stageId, minute) => openNew(stageId, minute)}
              onCreateRange={(stageId, from, to) => openNew(stageId, from, to, "손을 떼면 시간이 채워져요. 출연만 적으면 돼요.")}
              onSlotChange={changeSlot}
              renderHeader={renderStageHeader}
              addColumn={addColumn}
              pending={draft && !draft.id && start !== null && end !== null && start < end ? { stageId: draft.stageId, start, end, label: draft.artist.trim() || "새 순서" } : null}
            />
            <p className="px-4 text-xs text-muted lg:px-6">
              <span className="pointer-fine:hidden">빈 곳을 누르면 그 시간에 추가 · 블록을 누르면 고치기 · 무대 이름표를 누르면 이름 바꾸기</span>
              <span className="hidden pointer-fine:inline">빈 곳을 끌어서 추가 · 블록을 끌어서 옮기기 · 블록 아래 끝을 끌어서 길이 바꾸기 · 무대 이름표를 누르면 이름 바꾸기, ⠿를 끌어서 순서 바꾸기</span>
            </p>
          </>
        )}
      </section>

      <aside className="flex flex-col gap-6 border-line bg-[#f7f7f8] p-4 lg:w-85 lg:shrink-0 lg:overflow-y-auto lg:border-l lg:p-6">
        {draft && <div className="hidden lg:block">{editor}</div>}

        <div className="flex flex-col gap-2.5">
          <p className="text-base font-bold">공식 이미지 · {formatDay(day)}</p>
          <p className="-mt-1 text-xs leading-relaxed text-muted">인스타에 올린 타임테이블 이미지를 그대로 올리면 관객이 &quot;공식 이미지&quot;로 볼 수 있어요. 올리면 바로 보여요.</p>
          <div className="flex flex-wrap gap-2">
            {dayImages.map((image) => (
              <div key={image.id} className="relative h-29 w-23 shrink-0 overflow-hidden rounded-xl bg-[#dcdce1]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  aria-label="공식 이미지 빼기"
                  onClick={() => call(`/images/${image.id}`, "DELETE")}
                  className="absolute top-1.5 right-1.5 flex size-6.5 cursor-pointer items-center justify-center rounded-full bg-ink text-xs text-stub"
                >
                  ✕
                </button>
              </div>
            ))}
            {Array.from({ length: uploading }, (_, i) => (
              <div key={`uploading-${i}`} className="flex h-29 w-23 shrink-0 animate-pulse items-center justify-center rounded-xl bg-pill text-xs text-muted">
                올리는 중
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex h-29 min-w-23 flex-1 cursor-pointer items-center justify-center rounded-xl bg-paper text-sm text-[#444449] shadow-[inset_0_0_0_1.5px_var(--color-line)]"
            >
              + 이미지 추가
            </button>
          </div>
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
        </div>
      </aside>

      {undo && (
        <p
          role="status"
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink py-2.5 pr-2.5 pl-4.5 text-sm font-bold whitespace-nowrap text-stub shadow-[0_4px_16px_rgb(17_17_17/0.25)]"
        >
          {undo.message}
          <button type="button" onClick={undoChange} className="h-7 cursor-pointer rounded-full px-2.5 text-lime">
            되돌리기
          </button>
        </p>
      )}

      {draft && (
        <div className="fixed inset-x-0 bottom-0 z-30 rounded-t-[26px] bg-[#f7f7f8] px-4.5 pt-5 pb-7 shadow-[0_-8px_24px_rgb(17_17_17/0.12)] lg:hidden">
          {editor}
        </div>
      )}
    </div>
  );
}
