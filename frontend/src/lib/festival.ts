const API_URL = process.env.API_URL ?? "http://localhost:8080";

export type Festival = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  posterUrl: string;
  lineup: string[];
  ticketUrl: string;
  officialUrl: string;
};

export async function getFestivals(): Promise<Festival[]> {
  const res = await fetch(`${API_URL}/api/festivals`);
  if (!res.ok) throw new Error(`페스티벌 목록 조회 실패: ${res.status}`);
  return res.json();
}

export async function getFestival(id: string): Promise<Festival | null> {
  const res = await fetch(`${API_URL}/api/festivals/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`페스티벌 조회 실패: ${res.status}`);
  return res.json();
}

// "2026-10-31" ~ "2026-11-01" → "10.31 – 11.1"
export function formatPeriod(startDate: string, endDate: string) {
  const fmt = (date: string) => {
    const [, m, d] = date.split("-").map(Number);
    return `${m}.${d}`;
  };
  return startDate === endDate ? fmt(startDate) : `${fmt(startDate)} – ${fmt(endDate)}`;
}
