"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Verification } from "./verification-types";

const listeners = new Set<() => void>();
let mine: Verification[] | null | undefined;
let loading: Promise<void> | null = null;

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function loadVerifications() {
  loading ??= fetch("/api/me/verifications")
    .then(async (res) => {
      if (res.status === 401) mine = null;
      else if (res.ok) mine = await res.json();
      notify();
    })
    .catch(() => {})
    .finally(() => {
      loading = null;
    });
  return loading;
}

export function saveVerification(verification: Verification) {
  mine = [verification, ...(mine ?? []).filter((it) => it.showId !== verification.showId)];
  notify();
}

export function useVerifications(): Verification[] | null | undefined {
  const value = useSyncExternalStore(subscribe, () => mine, () => undefined);
  useEffect(() => {
    if (mine === undefined) loadVerifications();
  }, []);
  return value;
}

export function useVerification(showId: number) {
  const list = useVerifications();
  return list === undefined ? undefined : (list?.find((it) => it.showId === showId) ?? null);
}
