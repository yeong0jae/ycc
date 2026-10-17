import { cacheLife } from "next/cache";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export type Show = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  posterUrl: string;
  ticketUrl: string | null;
  officialUrl: string | null;
  scheduleGuide: string | null;
  priceGuide: string | null;
  facilityId: number | null;
};

export async function getShows(): Promise<Show[]> {
  const res = await fetch(`${API_URL}/api/shows`);
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

export type FacilityShow = Pick<Show, "id" | "name" | "startDate" | "endDate" | "posterUrl">;

export type Facility = {
  id: number;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  shows: FacilityShow[];
};

export async function getFacilities(): Promise<Facility[]> {
  const res = await fetch(`${API_URL}/api/facilities`);
  if (!res.ok) throw new Error(`공연장 목록 조회 실패: ${res.status}`);
  return res.json();
}
