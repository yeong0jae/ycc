import type { PinKind } from "@/lib/map-types";

const PATHS: Record<PinKind, React.ReactNode> = {
  STAGE: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
  FOOD: <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-2 6 0 8v10" />,
  GOODS: <path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3c-1 2-2.5 3-4 3s-3-1-4-3z" />,
  RESTROOM: (
    <>
      <circle cx="7" cy="4.5" r="2" />
      <circle cx="17" cy="4.5" r="2" />
      <path d="M5 9h4l1 6H8v6H6v-6H4zM15 9h4v7h-1v5h-2v-5h-1z" />
    </>
  ),
  INFO: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.01" />
    </>
  ),
  GATE: <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M2 21h20M14 12h.01" />,
  ETC: (
    <>
      <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
};

export function PinIcon({ kind, size = 20, strokeWidth = 2 }: { kind: PinKind; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[kind]}
    </svg>
  );
}
