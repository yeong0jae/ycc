"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { participate } from "@/lib/participation";

const TOAST_MS = 6000;

export function QrJoined({ showId }: { showId: number }) {
  const fromQr = useSearchParams().get("from") === "qr";
  const router = useRouter();
  const pathname = usePathname();
  const [toast, setToast] = useState(fromQr);

  useEffect(() => {
    if (!fromQr) return;
    participate(showId);
    router.replace(pathname, { scroll: false });
  }, [fromQr, showId, router, pathname]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div
      role="status"
      inert={!toast}
      className={`fixed inset-x-3.5 bottom-28 z-40 mx-auto flex max-w-md items-center gap-2 rounded-[22px] bg-ink py-3.5 pr-2 pl-4.5 text-stub shadow-[0_4px_16px_rgb(17_17_17/0.25)] transition duration-200 motion-reduce:transition-none ${
        toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <b className="text-sm">참여했어요</b>
        <span className="text-xs text-[#b9b9c0]">건의 탭에서 로그인 없이 건의를 남길 수 있어요</span>
      </span>
      <Link href="/" className="flex h-9.5 shrink-0 items-center rounded-full bg-[#2a2a2e] px-3.5 text-[13px] font-bold">
        홈으로
      </Link>
    </div>
  );
}
