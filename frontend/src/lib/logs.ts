import { backendFetch } from "./auth";
import type { MyLog, NextFeedItem, PastFeedItem, ShowLog } from "./log-types";

export type * from "./log-types";

async function json<T>(path: string): Promise<T | null> {
  const res = await backendFetch(path);
  if (res.status === 401 || res.status === 404) return null;
  if (!res.ok) throw new Error(`${path} 조회 실패: ${res.status}`);
  return res.json();
}

export const getShowMe = (showId: string) => json<{ planned: boolean; log: MyLog | null }>(`/api/shows/${showId}/me`);
export const getPastFeed = () => json<PastFeedItem[]>("/api/feed/past");
export const getNextFeed = () => json<NextFeedItem[]>("/api/feed/next");
export const getLog = (logId: string) => json<ShowLog>(`/api/logs/${logId}`);
export const getUserLogs = (userId: string | number) => json<ShowLog[]>(`/api/users/${userId}/logs`);
export const getUserProfile = (userId: string) =>
  json<{ id: number; nickname: string | null; logCount: number }>(`/api/users/${userId}`);
