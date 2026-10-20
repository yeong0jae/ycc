"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type ViewerImage = { url: string; width?: number; height?: number };

export function ImageViewer({ images, start, onClose }: { images: ViewerImage[]; start: number; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(start);

  useLayoutEffect(() => {
    dialog.current?.showModal();
    if (track.current) track.current.scrollLeft = start * track.current.clientWidth;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [start]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setCurrent(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-label="이미지 크게 보기"
      onClose={onClose}
      className="viewer m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-stub backdrop:bg-transparent"
    >
      <div ref={track} className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]">
        {images.map((image) => (
          <div
            key={image.url}
            onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
            className="flex h-full w-screen shrink-0 snap-center items-center justify-center px-2 py-16"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="" width={image.width} height={image.height} className="max-h-full max-w-full object-contain" />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <p className="absolute top-5 left-1/2 -translate-x-1/2 font-num text-sm font-extrabold">
          {current + 1} / {images.length}
        </p>
      )}
      <button
        type="button"
        aria-label="닫기"
        onClick={() => dialog.current?.close()}
        className="press absolute top-3 right-3 flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/15"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </dialog>
  );
}
