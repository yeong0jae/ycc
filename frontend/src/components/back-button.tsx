"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="뒤로"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className="-ml-3 flex size-11 shrink-0 cursor-pointer items-center justify-center"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
