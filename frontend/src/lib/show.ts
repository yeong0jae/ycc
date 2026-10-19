import { cacheLife } from "next/cache";
import type { Facility, Show, ShowKind } from "./show-types";

export type * from "./show-types";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export async function getShows(kind: ShowKind): Promise<Show[]> {
  const res = await fetch(`${API_URL}/api/shows?kind=${kind}`);
  if (!res.ok) throw new Error(`공연 목록 조회 실패: ${res.status}`);
  return res.json();
}

export async function getShow(id: string): Promise<Show | null> {
  "use cache";
  cacheLife("minutes");
  const res = await fetch(`${API_URL}/api/shows/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`공연 조회 실패: ${res.status}`);
  return res.json();
}

export async function getFacilities(kind: ShowKind): Promise<Facility[]> {
  const res = await fetch(`${API_URL}/api/facilities?kind=${kind}`);
  if (!res.ok) throw new Error(`공연장 목록 조회 실패: ${res.status}`);
  return res.json();
}
