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
  cast: string | null;
  area: string | null;
  facilityId: number | null;
};

export type FacilityShow = Pick<Show, "id" | "name" | "startDate" | "endDate" | "posterUrl">;

export type Facility = {
  id: number;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  shows: FacilityShow[];
};
