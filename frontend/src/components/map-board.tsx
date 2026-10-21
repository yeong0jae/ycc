"use client";

import { type ReactNode, useRef, useState } from "react";
import { type Crop, FULL_CROP, type MapImage, type MapPin, PIN_KIND } from "@/lib/map-types";
import { PinIcon } from "./pin-icon";

const ZOOMS = [1, 1.5, 2, 3];

export function MapBoard({
  image,
  pins,
  crop = FULL_CROP,
  selectedId,
  showLabels = false,
  pinColor,
  onPinClick,
  onBoardClick,
  onPinMove,
  overlay,
  children,
}: {
  image: MapImage;
  pins: MapPin[];
  crop?: Crop;
  selectedId?: number | null;
  showLabels?: boolean;
  pinColor?: (pin: MapPin) => string;
  onPinClick?: (pin: MapPin) => void;
  onBoardClick?: (x: number, y: number) => void;
  onPinMove?: (pin: MapPin, x: number, y: number) => void;
  overlay?: ReactNode;
  children?: ReactNode;
}) {
  const [zoom, setZoom] = useState(0);
  const board = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);

  const toImage = (clientX: number, clientY: number) => {
    const rect = board.current!.getBoundingClientRect();
    const vx = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const vy = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
    return { x: crop.x + vx * crop.w, y: crop.y + vy * crop.h };
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length !== 2) return;
    const [a, b] = [event.touches[0], event.touches[1]];
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (!pinch.current) {
      pinch.current = { distance, zoom };
      return;
    }
    const scale = (ZOOMS[pinch.current.zoom] * distance) / pinch.current.distance;
    setZoom(ZOOMS.reduce((best, value, index) => (Math.abs(value - scale) < Math.abs(ZOOMS[best] - scale) ? index : best), 0));
  };

  const visible = pins.filter((pin) => pin.x >= crop.x && pin.x <= crop.x + crop.w && pin.y >= crop.y && pin.y <= crop.y + crop.h);

  return (
    <div className="relative">
      <div
        className="overflow-auto rounded-[18px] bg-pill [scrollbar-width:none]"
        onTouchMove={onTouchMove}
        onTouchEnd={() => {
          pinch.current = null;
        }}
      >
        <div
          ref={board}
          style={{ width: `${ZOOMS[zoom] * 100}%`, aspectRatio: `${image.width * crop.w} / ${image.height * crop.h}` }}
          className={`relative overflow-hidden ${onBoardClick ? "cursor-crosshair" : ""}`}
          onClick={(event) => {
            if (!onBoardClick || (event.target as HTMLElement).dataset.board === undefined) return;
            const { x, y } = toImage(event.clientX, event.clientY);
            onBoardClick(x, y);
          }}
          onPointerMove={(event) => {
            if (!drag) return;
            const { x, y } = toImage(event.clientX, event.clientY);
            setDrag({ ...drag, x, y, moved: true });
          }}
          onPointerUp={() => {
            if (!drag) return;
            const pin = pins.find((it) => it.id === drag.id);
            if (pin && drag.moved) onPinMove?.(pin, drag.x, drag.y);
            setDrag(null);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt="공식 맵"
            data-board=""
            draggable={false}
            style={{ width: `${100 / crop.w}%`, left: `${(-crop.x / crop.w) * 100}%`, top: `${(-crop.y / crop.h) * 100}%`, height: `${100 / crop.h}%` }}
            className="absolute max-w-none select-none"
          />
          {overlay}
          {visible.map((pin) => {
            const selected = pin.id === selectedId;
            const x = drag?.id === pin.id ? drag.x : pin.x;
            const y = drag?.id === pin.id ? drag.y : pin.y;
            const kind = PIN_KIND[pin.kind];
            return (
              <button
                key={pin.id}
                type="button"
                aria-label={`${kind.label} · ${pin.name}`}
                aria-pressed={selected}
                data-pin={pin.id}
                onPointerDown={(event) => {
                  if (!onPinMove) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setDrag({ id: pin.id, x: pin.x, y: pin.y, moved: false });
                }}
                onClick={() => {
                  if (drag?.moved) return;
                  onPinClick?.(pin);
                }}
                style={{ left: `${((x - crop.x) / crop.w) * 100}%`, top: `${((y - crop.y) / crop.h) * 100}%` }}
                className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center ${onPinMove ? "touch-none" : ""}`}
              >
                <span
                  style={{ background: pinColor?.(pin) ?? kind.color }}
                  className={`flex items-center justify-center rounded-full text-stub ${
                    selected
                      ? "size-9 animate-pop shadow-[0_0_0_3px_#fff,0_3px_10px_rgb(17_17_17/0.35)] motion-reduce:animate-none"
                      : "size-7 shadow-[0_0_0_2px_#fff,0_3px_8px_rgb(17_17_17/0.3)]"
                  }`}
                >
                  <PinIcon kind={pin.kind} size={selected ? 17 : 14} strokeWidth={2.4} />
                </span>
                {(selected || showLabels) && (
                  <span className="mt-1 max-w-32 truncate rounded-md bg-ink px-1.5 py-px text-[10px] font-bold whitespace-nowrap text-stub">{pin.name}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="absolute top-2.5 right-2.5 z-20 flex flex-col overflow-hidden rounded-xl bg-paper shadow-[0_2px_8px_rgb(17_17_17/0.15)]">
        <button type="button" aria-label="크게" disabled={zoom === ZOOMS.length - 1} onClick={() => setZoom((z) => z + 1)} className="flex size-9 cursor-pointer items-center justify-center text-lg disabled:opacity-30">
          ＋
        </button>
        <button
          type="button"
          aria-label="작게"
          disabled={zoom === 0}
          onClick={() => setZoom((z) => z - 1)}
          className="flex size-9 cursor-pointer items-center justify-center text-lg shadow-[inset_0_1px_0_#eeeef1] disabled:opacity-30"
        >
          －
        </button>
      </div>
      {children}
    </div>
  );
}
