"use client";

import { useSyncExternalStore } from "react";

const KEY = "ycc:timetable-stars";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedIds: ReadonlySet<number> = new Set();

function read(): ReadonlySet<number> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw === cachedRaw) return cachedIds;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedIds = new Set(Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id)) : []);
  } catch {
    cachedIds = new Set();
  }
  return cachedIds;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useStarredSlots(): ReadonlySet<number> | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function toggleStar(slotId: number) {
  const ids = new Set(read());
  if (!ids.delete(slotId)) ids.add(slotId);
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {}
  listeners.forEach((listener) => listener());
}
