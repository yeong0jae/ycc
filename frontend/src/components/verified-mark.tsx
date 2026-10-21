export function ShieldIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function VerifiedMark({ className = "text-[11px]" }: { className?: string }) {
  return (
    <span className={`flex shrink-0 items-center gap-0.5 font-bold text-verified ${className}`}>
      <ShieldIcon size={12} />
      예매 인증
    </span>
  );
}
