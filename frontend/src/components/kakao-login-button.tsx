"use client";

export function KakaoLoginButton({ loginUrl, className = "" }: { loginUrl: string; className?: string }) {
  const start = () => {
    const here = new URL(location.href);
    here.searchParams.delete("error");
    const next = encodeURIComponent(here.pathname + here.search);
    document.cookie = `ycc_next=${next}; path=/; max-age=600; samesite=lax`;
    location.href = loginUrl;
  };

  return (
    <button
      type="button"
      onClick={start}
      className={`press flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#FEE500] font-bold text-[#191919] ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#191919" d="M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 6l-1 3.6c-.1.3.3.6.6.4l4.2-2.8h1c5 0 9-3.1 9-7s-4-7-9-7z" />
      </svg>
      카카오로 시작하기
    </button>
  );
}
