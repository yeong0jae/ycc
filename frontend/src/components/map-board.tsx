"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { type ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { type Crop, FULL_CROP, type MapImage, type MapPin, PIN_KIND } from "@/lib/map-types";
import { PinIcon } from "./pin-icon";

const FOCUS_SCALE = 2.5;

export function MapBoard({
  image,
  pins,
  crop = FULL_CROP,
  selectedId,
  focusId,
  cover = false,
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
  focusId?: number | null;
  cover?: boolean;
  showLabels?: boolean;
  pinColor?: (pin: MapPin) => string;
  onPinClick?: (pin: MapPin) => void;
  onBoardClick?: (x: number, y: number) => void;
  onPinMove?: (pin: MapPin, x: number, y: number) => void;
  overlay?: ReactNode;
  children?: ReactNode;
}) {
  const zoomer = useRef<ReactZoomPanPinchRef>(null);
  const root = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);
  const panned = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const [zoomed, setZoomed] = useState(false);
  const [drag, setDrag] = useState<{ id: number; x: number; y: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (focusId == null) return;
    const node = board.current?.querySelector<HTMLElement>(`[data-pin="${focusId}"]`);
    const api = zoomer.current;
    if (!node || !api) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    api.zoomToElement(node, Math.max(api.instance.transformState.scale, FOCUS_SCALE), reduce ? 0 : 300);
  }, [focusId]);

  useEffect(() => {
    if (!cover || !root.current) return;
    const observer = new ResizeObserver(([entry]) => setFrame({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [cover]);

  useEffect(() => {
    if (frame) zoomer.current?.centerView(1, 0);
  }, [frame]);

  const ratio = (image.width * crop.w) / (image.height * crop.h);
  const coverWidth = frame ? Math.max(frame.width, frame.height * ratio) : null;
  const movable = cover || zoomed;

  const toImage = (clientX: number, clientY: number) => {
    const rect = board.current!.getBoundingClientRect();
    const vx = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const vy = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
    return { x: crop.x + vx * crop.w, y: crop.y + vy * crop.h };
  };

  const visible = pins.filter((pin) => pin.x >= crop.x && pin.x <= crop.x + crop.w && pin.y >= crop.y && pin.y <= crop.y + crop.h);

  return (
    <div ref={root} data-no-swipe="" className={`relative overflow-hidden rounded-[18px] bg-pill ${cover ? "h-[min(44dvh,420px)]" : ""}`}>
      <TransformWrapper
        ref={zoomer}
        minScale={1}
        maxScale={5}
        limitToBounds
        centerZoomedOut
        panning={{ disabled: !movable, excluded: ["map-fixed"] }}
        doubleClick={{ mode: "toggle", excluded: ["map-pin"] }}
        pinch={{ step: 5 }}
        wheel={{ step: 0.15 }}
        onPanningStart={(ref) => {
          panned.current = false;
          panStart.current = { x: ref.state.positionX, y: ref.state.positionY };
        }}
        onPanning={(ref) => {
          if (Math.hypot(ref.state.positionX - panStart.current.x, ref.state.positionY - panStart.current.y) > 4) panned.current = true;
        }}
        onTransformed={(ref, state) => {
          ref.instance.contentComponent?.style.setProperty("--pin-scale", String(1 / state.scale));
          setZoomed(state.scale > 1.01);
        }}
      >
        <TransformComponent wrapperStyle={{ width: "100%", height: cover ? "100%" : undefined, touchAction: movable ? "none" : "pan-y" }}
          contentStyle={{ width: coverWidth ?? "100%" }}>
          <div
            ref={board}
            data-board=""
            style={{ aspectRatio: `${image.width * crop.w} / ${image.height * crop.h}` }}
            className={`relative w-full overflow-hidden ${onBoardClick ? "cursor-crosshair" : movable ? "cursor-grab" : ""}`}
            onClick={(event) => {
              if (panned.current) {
                panned.current = false;
                return;
              }
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
                  onClick={(event) => {
                    event.stopPropagation();
                    if (panned.current) {
                      panned.current = false;
                      return;
                    }
                    if (drag?.moved) return;
                    onPinClick?.(pin);
                  }}
                  style={{ left: `${((x - crop.x) / crop.w) * 100}%`, top: `${((y - crop.y) / crop.h) * 100}%`, scale: "var(--pin-scale, 1)" }}
                  className={`map-pin absolute z-10 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center ${onPinMove ? "map-fixed touch-none" : ""}`}
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
        </TransformComponent>
      </TransformWrapper>
      {zoomed && (
        <button
          type="button"
          onClick={() => zoomer.current?.centerView(1)}
          className="press absolute bottom-2.5 left-2.5 z-20 flex h-9.5 cursor-pointer items-center rounded-full bg-paper px-3 text-[12px] font-bold shadow-[0_2px_8px_rgb(17_17_17/0.15)]"
        >
          원래대로
        </button>
      )}
      {children}
    </div>
  );
}
