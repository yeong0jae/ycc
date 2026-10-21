"use client";

import { useRef, useState } from "react";
import type { Crop } from "@/lib/map-types";

const MIN = 0.1;

type Corner = "tl" | "tr" | "bl" | "br";

export function CropOverlay({ crop, editing, onChange }: { crop: Crop; editing: boolean; onChange?: (crop: Crop) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [corner, setCorner] = useState<Corner | null>(null);

  const move = (event: React.PointerEvent) => {
    if (!corner || !onChange) return;
    const rect = root.current!.getBoundingClientRect();
    const px = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const py = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    let { x, y, w, h } = crop;
    const right = x + w;
    const bottom = y + h;
    if (corner.includes("l")) x = Math.min(px, right - MIN);
    if (corner.includes("r")) w = Math.max(px - x, MIN);
    if (corner.includes("t")) y = Math.min(py, bottom - MIN);
    if (corner.includes("b")) h = Math.max(py - y, MIN);
    if (corner.includes("l")) w = right - x;
    if (corner.includes("t")) h = bottom - y;
    onChange({ x, y, w, h });
  };

  const pct = (value: number) => `${value * 100}%`;
  const shade = "absolute bg-ink/45 pointer-events-none";

  return (
    <div ref={root} className={`absolute inset-0 z-[5] ${editing ? "" : "pointer-events-none"}`} onPointerMove={move} onPointerUp={() => setCorner(null)}>
      <div className={shade} style={{ left: 0, top: 0, right: 0, height: pct(crop.y) }} />
      <div className={shade} style={{ left: 0, top: pct(crop.y + crop.h), right: 0, bottom: 0 }} />
      <div className={shade} style={{ left: 0, top: pct(crop.y), width: pct(crop.x), height: pct(crop.h) }} />
      <div className={shade} style={{ left: pct(crop.x + crop.w), top: pct(crop.y), right: 0, height: pct(crop.h) }} />
      <div
        className={`absolute rounded-sm ${editing ? "border-2 border-paper shadow-[0_0_0_1px_rgb(17_17_17/0.4)]" : "border border-dashed border-paper/80"}`}
        style={{ left: pct(crop.x), top: pct(crop.y), width: pct(crop.w), height: pct(crop.h) }}
      >
        {editing &&
          (["tl", "tr", "bl", "br"] as const).map((it) => (
            <span
              key={it}
              role="slider"
              aria-label="범위 끌기"
              aria-valuenow={0}
              onPointerDown={(event) => {
                event.stopPropagation();
                event.currentTarget.setPointerCapture(event.pointerId);
                setCorner(it);
              }}
              onPointerMove={move}
              onPointerUp={() => setCorner(null)}
              className={`map-fixed absolute z-20 size-6 cursor-pointer touch-none rounded-full border-2 border-ink bg-paper shadow-[0_1px_4px_rgb(17_17_17/0.3)] ${
                it.includes("t") ? "top-2" : "bottom-2"
              } ${it.includes("l") ? "left-2" : "right-2"}`}
            />
          ))}
      </div>
    </div>
  );
}
