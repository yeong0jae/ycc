import { cacheLife } from "next/cache";
import { type Facility, type Show, type ShowPage, type ShowWhen, showSearchPath } from "./show-types";

export type * from "./show-types";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export async function searchShows(q: string, when: ShowWhen): Promise<ShowPage> {
  const res = await fetch(`${API_URL}${showSearchPath(q, when, 0)}`);
  if (!res.ok) throw new Error(`공연 검색 실패: ${res.status}`);
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

export async function getFacilities(): Promise<Facility[]> {
  const res = await fetch(`${API_URL}/api/facilities`);
  if (!res.ok) throw new Error(`공연장 목록 조회 실패: ${res.status}`);
  return res.json();
}
