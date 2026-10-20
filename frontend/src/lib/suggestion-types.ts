export type SuggestionSource = "SITE_QR" | "TICKET";

export const SUGGESTION_SOURCES: Record<SuggestionSource, string> = { SITE_QR: "현장 QR", TICKET: "예매 인증" };

export type Suggestion = {
  id: number;
  source: SuggestionSource;
  body: string;
  image: { url: string; width: number; height: number } | null;
  createdAt: string;
  reply: { body: string; createdAt: string; updatedAt: string | null } | null;
  hidden: boolean;
};

export type WriteState = "OPEN" | "NO_PASS" | "CLOSED";

export type ShowSuggestions = {
  items: Suggestion[];
  total: number;
  write: WriteState;
  writableFrom: string;
  writableUntil: string;
};

export const SUGGESTION_MAX = 500;
