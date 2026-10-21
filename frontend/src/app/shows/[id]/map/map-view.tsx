"use client";

import Link from "next/link";
import { useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { ImageViewer } from "@/components/image-viewer";
import { MapBoard } from "@/components/map-board";
import { PinIcon } from "@/components/pin-icon";
import { FULL_CROP, type MapPin, PIN_KIND, PIN_KINDS, type PinKind, type ShowMap } from "@/lib/map-types";
import { useStarredSlots } from "@/lib/timetable-stars";
import { formatDay, formatMinute, STAGE_COLORS, type Timetable } from "@/lib/timetable-types";
import { liveDayAndMinute } from "../timetable/timetable-view";

function StageCard({ showId, pin, timetable }: { showId: number; pin: MapPin; timetable: Timetable }) {
  const starred = useStarredSlots();
  const slots = timetable.published ? timetable.slots.filter((slot) => slot.stageId === pin.stageId) : [];
  const live = liveDayAndMinute(timetable.days);
  const today = slots.filter((slot) => slot.day === live.day);
  const now = today.find((slot) => slot.start <= live.minute && live.minute < slot.end);
  const next = (today.length > 0 ? today.filter((slot) => slot.start > live.minute) : slots.filter((slot) => slot.day > live.day))[0];
  const row = (label: string, slot: (typeof slots)[number], live: boolean) => (
    <span className="flex items-center gap-2 text-sm">
      <span className={`flex h-5.5 shrink-0 items-center rounded-full px-2 text-[11px] font-black ${live ? "bg-[#e8283c] text-stub" : "bg-pill"}`}>{label}</span>
      <b className="truncate">{slot.artist}</b>
      <span className="shrink-0 text-muted">
        {today.includes(slot) ? "" : `${formatDay(slot.day)} `}
        {formatMinute(slot.start)} — {formatMinute(slot.end)}
        {starred?.has(slot.id) && " ★"}
      </span>
    </span>
  );
  return (
    <div className="flex flex-col gap-1.5">
      {now && row("지금", now, true)}
      {next && row(today.length > 0 ? "다음" : "첫 순서", next, false)}
      {!now && !next && <span className="text-sm text-muted">{slots.length > 0 ? "오늘 순서가 끝났어요" : "아직 순서가 없어요"}</span>}
      <Link href={`/shows/${showId}/timetable`} className="mt-1.5 flex h-10 items-center justify-center rounded-full bg-pill text-[13px] font-bold">
        타임테이블에서 보기
      </Link>
    </div>
  );
}

export function MapView({ showId, map, timetable }: { showId: number; map: ShowMap; timetable: Timetable }) {
  const image = map.images[0];
  const pins = map.pins.filter((pin) => pin.imageId === image?.id);
  const hasPins = map.published && pins.length > 0;
  const [kind, setKind] = useState<PinKind | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [listing, setListing] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const [focusId, setFocusId] = useState<number | null>(null);

  if (!image) return <p className="py-16 text-center text-sm text-muted">아직 맵이 없어요.</p>;

  const stageColor = (pin: MapPin) => {
    const index = timetable.stages.findIndex((stage) => stage.id === pin.stageId);
    return index >= 0 ? STAGE_COLORS[index % STAGE_COLORS.length].dark : PIN_KIND[pin.kind].color;
  };

  const kinds = PIN_KINDS.filter((it) => pins.some((pin) => pin.kind === it.key));
  const shown = kind ? pins.filter((pin) => pin.kind === kind) : pins.filter((pin) => pin.kind === "STAGE");
  const listed = kind ? shown : pins;
  const selected = pins.find((pin) => pin.id === selectedId) ?? null;
  const sameKind = selected ? pins.filter((pin) => pin.kind === selected.kind) : [];
  const selectedIndex = selected ? sameKind.indexOf(selected) : -1;
  const others = map.images.slice(1);

  const pickKind = (next: PinKind | null) => {
    setKind(next);
    setSelectedId(null);
  };

  const images = (list: typeof map.images, offset: number) =>
    list.map((it, index) => (
      <button key={it.id} type="button" aria-label="공식 맵 크게 보기" onClick={() => setViewing(index + offset)} className="relative cursor-zoom-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={it.url} alt="" width={it.width} height={it.height} className="h-auto w-full rounded-[18px] bg-pill" />
        <span className="absolute top-3 right-3 flex h-7.5 items-center rounded-full bg-ink/55 px-3 text-xs text-stub">눌러서 크게 보기</span>
      </button>
    ));

  if (!hasPins) {
    return (
      <>
        <div className="flex flex-col gap-2.5 px-3 pt-3.5">{images(map.images, 0)}</div>
        {viewing !== null && <ImageViewer images={map.images} start={viewing} onClose={() => setViewing(null)} />}
      </>
    );
  }

  return (
    <div className="pb-48">
      <div role="group" aria-label="찾을 곳" className="flex gap-1 overflow-x-auto px-3 pt-3.5 pb-2 [scrollbar-width:none]">
        {kinds.map((it) => {
          const on = kind === it.key;
          return (
            <button key={it.key} type="button" aria-pressed={on} onClick={() => pickKind(on ? null : it.key)} className="flex w-14 shrink-0 cursor-pointer flex-col items-center gap-1">
              <span className={`flex size-11 items-center justify-center rounded-full transition-colors ${on ? "bg-ink text-stub" : "bg-pill text-ink"}`}>
                <PinIcon kind={it.key} />
              </span>
              <span className={`text-[11px] ${on ? "font-extrabold" : "font-semibold text-muted"}`}>{it.label}</span>
            </button>
          );
        })}
      </div>
      <div className="px-4">
        <MapBoard image={image} crop={image.crop ?? FULL_CROP} pins={shown} selectedId={selectedId} focusId={focusId} pinColor={stageColor} onPinClick={(pin) => setSelectedId(pin.id)}>
          <button
            type="button"
            onClick={() => setListing(true)}
            className="press absolute right-2.5 bottom-2.5 z-20 flex h-9.5 cursor-pointer items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-bold text-stub shadow-[0_2px_8px_rgb(17_17_17/0.2)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
            목록
          </button>
        </MapBoard>
      </div>
      <p className="mt-2 px-5 text-xs text-muted">{kind ? "핀을 누르면 자세히 볼 수 있어요" : "위에서 찾을 곳을 고르면 그곳만 핀으로 보여요"}</p>

      <div className="mt-5 flex flex-col gap-2.5 px-3">
        <button type="button" onClick={() => setViewing(0)} className="h-10 cursor-pointer self-start rounded-full bg-pill px-3.5 text-[13px] font-bold">
          공식 맵 원본 크게 보기
        </button>
        {images(others, 1)}
      </div>

      {selected && (
        <div className="fixed inset-x-3 bottom-24 z-30 mx-auto flex max-w-[calc(42rem-1.5rem)] animate-rise flex-col gap-2 rounded-[22px] bg-paper p-4 shadow-[0_8px_24px_rgb(17_17_17/0.18)] motion-reduce:animate-none">
          <span className="flex items-center gap-2.5">
            <span style={{ background: stageColor(selected) }} className="flex size-9 shrink-0 items-center justify-center rounded-full text-stub">
              <PinIcon kind={selected.kind} size={18} />
            </span>
            <b className="min-w-0 truncate text-[17px]">{selected.name}</b>
            {sameKind.length > 1 && (
              <span className="ml-auto shrink-0 text-[13px] text-muted">
                {selectedIndex + 1} / {sameKind.length}
              </span>
            )}
            <button
              type="button"
              aria-label="닫기"
              onClick={() => setSelectedId(null)}
              className={`${sameKind.length > 1 ? "" : "ml-auto"} -mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center text-muted`}
            >
              ✕
            </button>
          </span>
          {selected.description && <p className="text-sm leading-relaxed text-[#444449]">{selected.description}</p>}
          {selected.kind === "STAGE" && selected.stageId && <StageCard showId={showId} pin={selected} timetable={timetable} />}
          {sameKind.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const nextId = sameKind[(selectedIndex + 1) % sameKind.length].id;
                setKind(selected.kind);
                setSelectedId(nextId);
                setFocusId(nextId);
              }}
              className="h-10 cursor-pointer self-start rounded-full bg-pill px-3.5 text-[13px] font-bold"
            >
              다음 {PIN_KIND[selected.kind].label} →
            </button>
          )}
        </div>
      )}

      {listing && (
        <BottomSheet label="목록" onClose={() => setListing(false)}>
          <div className="flex flex-col pt-6 pb-8">
            <h2 className="px-5 pb-2 font-display text-xl">{kind ? `${PIN_KIND[kind].label} ${listed.length}곳` : `장소 ${listed.length}곳`}</h2>
            <div className="max-h-[60dvh] overflow-y-auto">
              {listed.map((pin) => (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => {
                    setListing(false);
                    setKind(pin.kind);
                    setSelectedId(pin.id);
                    setFocusId(pin.id);
                  }}
                  className="flex h-16 w-full cursor-pointer items-center gap-3 px-5 text-left shadow-[inset_0_-1px_0_#eeeef1]"
                >
                  <span style={{ background: stageColor(pin) }} className="flex size-9 shrink-0 items-center justify-center rounded-full text-stub">
                    <PinIcon kind={pin.kind} size={17} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <b className="truncate text-[15px]">{pin.name}</b>
                    <span className="truncate text-[13px] text-muted">{pin.description ?? PIN_KIND[pin.kind].label}</span>
                  </span>
                  <span className="shrink-0 text-[13px] font-bold text-muted">맵에서 보기 ›</span>
                </button>
              ))}
            </div>
          </div>
        </BottomSheet>
      )}

      {viewing !== null && <ImageViewer images={map.images} start={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
