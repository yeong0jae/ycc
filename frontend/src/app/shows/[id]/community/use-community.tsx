"use client";

import { useEffect, useState } from "react";
import { LoginSheet } from "@/components/login-sheet";
import type { LoginReason, Post, ReportReason } from "@/lib/community-types";
import { type MoreTarget, MoreSheet, ReportSheet } from "./sheets";

const TOAST_MS = 2500;

export function postPath(post: Pick<Post, "id" | "showId">) {
  return `/api/shows/${post.showId}/community/${post.id}`;
}

export function useCommunity({ signedIn, loginUrl }: { signedIn: boolean; loginUrl: string }) {
  const [login, setLogin] = useState<LoginReason | null>(null);
  const [more, setMore] = useState<MoreTarget | null>(null);
  const [reportPath, setReportPath] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const needLogin = (reason: LoginReason) => {
    if (signedIn) return false;
    setLogin(reason);
    return true;
  };

  const like = async (post: Post, apply: (next: Post) => void) => {
    if (needLogin("like")) return;
    const liked = !post.liked;
    apply({ ...post, liked, likeCount: post.likeCount + (liked ? 1 : -1) });
    const res = await fetch(`${postPath(post)}/like`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ liked }),
    }).catch(() => null);
    if (res?.ok) {
      const result: { liked: boolean; likeCount: number } = await res.json();
      apply({ ...post, ...result });
    } else {
      apply(post);
    }
  };

  const openMore = (target: Omit<MoreTarget, "onReport"> & { reportPath: string }) =>
    setMore({
      ...target,
      onEdit: () => {
        setMore(null);
        target.onEdit();
      },
      onDelete: () => {
        setMore(null);
        target.onDelete();
      },
      onReport: () => {
        setMore(null);
        if (!needLogin("report")) setReportPath(target.reportPath);
      },
    });

  const report = async (reason: ReportReason) => {
    const res = await fetch(reportPath!, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason }),
    }).catch(() => null);
    setReportPath(null);
    setToast(res?.ok ? "신고했어요. 확인할게요" : "신고하지 못했어요");
  };

  const sheets = (
    <>
      {login && <LoginSheet reason={login} loginUrl={loginUrl} onClose={() => setLogin(null)} />}
      {more && <MoreSheet target={more} onClose={() => setMore(null)} />}
      {reportPath && <ReportSheet onSubmit={report} onClose={() => setReportPath(null)} />}
      <p
        role="status"
        className={`pointer-events-none fixed bottom-28 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4.5 py-3 text-sm font-bold whitespace-nowrap text-stub shadow-[0_4px_16px_rgb(17_17_17/0.25)] transition duration-200 motion-reduce:transition-none ${
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {toast}
      </p>
    </>
  );

  return { needLogin, like, openMore, setToast, sheets };
}
