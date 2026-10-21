export type PinKind = "STAGE" | "RESTROOM" | "FOOD" | "GOODS" | "INFO" | "GATE" | "ETC";

export const PIN_KINDS: { key: PinKind; label: string; color: string }[] = [
  { key: "STAGE", label: "무대", color: "#1e7fcb" },
  { key: "FOOD", label: "푸드", color: "#2e8b57" },
  { key: "GOODS", label: "굿즈", color: "#d9529a" },
  { key: "RESTROOM", label: "화장실", color: "#111111" },
  { key: "INFO", label: "안내", color: "#6b6b72" },
  { key: "GATE", label: "입구", color: "#e0702a" },
  { key: "ETC", label: "기타", color: "#6b6b72" },
];

export const PIN_KIND: Record<PinKind, (typeof PIN_KINDS)[number]> = Object.fromEntries(PIN_KINDS.map((it) => [it.key, it])) as Record<
  PinKind,
  (typeof PIN_KINDS)[number]
>;

export type Crop = { x: number; y: number; w: number; h: number };

export type MapImage = { id: number; url: string; width: number; height: number; crop: Crop | null };

export type MapPin = {
  id: number;
  imageId: number;
  kind: PinKind;
  name: string;
  description: string | null;
  x: number;
  y: number;
  stageId: number | null;
  ai: boolean;
};

export type ShowMap = {
  published: boolean;
  aiAvailable: boolean;
  images: MapImage[];
  pins: MapPin[];
  stages: { id: number; name: string }[];
};

export const FULL_CROP: Crop = { x: 0, y: 0, w: 1, h: 1 };
