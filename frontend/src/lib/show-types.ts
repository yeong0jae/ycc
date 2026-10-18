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

export type ShowWhen = "ONGOING" | "UPCOMING" | "PAST";

export type ShowPage = { items: Show[]; hasNext: boolean };

export function showSearchPath(q: string, when: ShowWhen, page: number) {
  const params = new URLSearchParams({ when, page: String(page) });
  if (q.trim()) params.set("q", q.trim());
  return `/api/shows?${params}`;
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
