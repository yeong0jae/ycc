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

export function formatPeriod(startDate: string, endDate: string) {
  const withYear = startDate.slice(0, 4) !== endDate.slice(0, 4);
  const fmt = (date: string) => {
    const [y, m, d] = date.split("-").map(Number);
    return withYear ? `${y}.${m}.${d}` : `${m}.${d}`;
  };
  return startDate === endDate ? fmt(startDate) : `${fmt(startDate)} — ${fmt(endDate)}`;
}

export function formatDday(startDate: string) {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const days = (Date.parse(startDate) - Date.parse(today)) / 86_400_000;
  return days <= 0 ? "NOW" : `D-${days}`;
}
