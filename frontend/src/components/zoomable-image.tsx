"use client";

import { type ReactNode, useState } from "react";
import { ImageViewer } from "@/components/image-viewer";

export function ZoomableImage({
  src,
  label = "이미지 크게 보기",
  className = "",
  children,
}: {
  src: string;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-label={label} onClick={() => setOpen(true)} className={`cursor-zoom-in ${className}`}>
        {children}
      </button>
      {open && <ImageViewer images={[{ url: src }]} start={0} onClose={() => setOpen(false)} />}
    </>
  );
}
