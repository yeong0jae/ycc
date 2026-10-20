import { cacheLife } from "next/cache";
import type { ShowNotices } from "./notice-types";
import type { Timetable } from "./timetable-types";
import { type Facility, type Show, type ShowKind, type ShowPage, type ShowPeriod, showsQuery } from "./show-types";

export type * from "./show-types";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export async function getShows({
  kind,
  q = "",
  period = "UPCOMING",
}: {
  kind: ShowKind;
  q?: string;
  period?: ShowPeriod;
}): Promise<ShowPage> {
  const res = await fetch(`${API_URL}/api/shows?${showsQuery({ kind, q, period, page: 0 })}`);
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

export async function getShowNotices(id: number): Promise<ShowNotices> {
  const res = await fetch(`${API_URL}/api/shows/${id}/notices`);
  if (!res.ok) throw new Error(`공지 조회 실패: ${res.status}`);
  return res.json();
}

export async function getTimetable(id: number): Promise<Timetable> {
  const res = await fetch(`${API_URL}/api/shows/${id}/timetable`);
  if (!res.ok) throw new Error(`타임테이블 조회 실패: ${res.status}`);
  return res.json();
}
