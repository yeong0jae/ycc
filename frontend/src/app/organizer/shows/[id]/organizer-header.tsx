"use client";

import { useRouter } from "next/navigation";

export function OrganizerHeader({ showName, displayName }: { showName: string; displayName: string }) {
  const router = useRouter();

  const logout = async () => {
    const res = await fetch("/api/organizer/logout", { method: "POST" });
    if (res.ok) router.refresh();
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 bg-ink px-4 text-stub lg:h-16 lg:px-6">
      <p className="min-w-0 truncate font-display text-base lg:text-lg">{showName}</p>
      <span className="ml-auto hidden shrink-0 text-[13px] text-[#B9B9C0] sm:inline">{displayName}</span>
      <button
        type="button"
        onClick={logout}
        className="ml-auto h-9 shrink-0 cursor-pointer rounded-full px-3 text-[13px] font-semibold text-[#C9CCD3] sm:ml-0"
      >
        로그아웃
      </button>
    </header>
  );
}
