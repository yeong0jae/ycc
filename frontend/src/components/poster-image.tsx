"use client";

import { useState } from "react";

export function PosterImage({ className = "", ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img
      {...props}
      ref={(img) => {
        if (img?.complete) setLoaded(true);
      }}
      onLoad={() => setLoaded(true)}
      className={`transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
        loaded ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"
      } ${className}`}
    />
  );
}
