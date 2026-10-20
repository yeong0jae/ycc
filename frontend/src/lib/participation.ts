"use client";

import { useSyncExternalStore } from "react";

const KEY = "ycc:participated";
const ACCOUNT_KEY = "ycc:account";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedIds: number[] = [];
let accountId: number | null = null;
let accountKnown = false;

function read(): number[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw === cachedRaw) return cachedIds;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedIds = Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id)) : [];
  } catch {
    cachedIds = [];
  }
  return cachedIds;
}

function notify() {
  listeners.forEach((listener) => listener());
}

function write(ids: number[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
  notify();
}

function storedAccount() {
  try {
    return localStorage.getItem(ACCOUNT_KEY);
  } catch {
    return null;
  }
}

function storeAccount(id: number | null) {
  try {
    if (id === null) localStorage.removeItem(ACCOUNT_KEY);
    else localStorage.setItem(ACCOUNT_KEY, String(id));
  } catch {}
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useParticipated(): number[] | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function useSignedIn(): boolean | null {
  return useSyncExternalStore(
    subscribe,
    () => (accountKnown ? accountId !== null : null),
    () => null,
  );
}

type Account = { userId: number; showIds: number[] };

function account(method: string, path = "", body?: unknown) {
  return fetch(`/api/me/participations${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function syncAccount() {
  const res = await account("GET").catch(() => null);
  if (!res || (!res.ok && res.status !== 401)) return;
  accountKnown = true;
  if (res.status === 401) {
    accountId = null;
    storeAccount(null);
    return notify();
  }
  let data: Account = await res.json();
  if (storedAccount() !== String(data.userId)) {
    const local = read();
    if (local.length > 0) {
      const merged = await account("POST", "", { showIds: local }).catch(() => null);
      if (!merged?.ok) return;
      data = await merged.json();
    }
    storeAccount(data.userId);
  }
  accountId = data.userId;
  write(data.showIds);
}

export function forgetAccount() {
  accountId = null;
  storeAccount(null);
  notify();
}

function save(request: Promise<Response>) {
  request.then((res) => res.status === 401 && forgetAccount()).catch(() => {});
}

export function participate(showId: number) {
  const ids = read();
  if (!ids.includes(showId)) write([showId, ...ids]);
  if (accountId !== null) save(account("POST", "", { showIds: [showId] }));
}

export function leave(showId: number) {
  write(read().filter((id) => id !== showId));
  if (accountId !== null) save(account("DELETE", `/${showId}`));
}
