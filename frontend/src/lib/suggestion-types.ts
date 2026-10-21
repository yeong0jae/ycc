import type { Verification } from "./verification-types";

export type SuggestionSource = "SITE_QR" | "TICKET";

export const SUGGESTION_SOURCES: Record<SuggestionSource, string> = { SITE_QR: "현장 QR 관객", TICKET: "예매 인증 관객" };

export type Suggestion = {
  id: number;
  source: SuggestionSource;
  body: string;
  image: { url: string; width: number; height: number } | null;
  createdAt: string;
  reply: { body: string; createdAt: string; updatedAt: string | null } | null;
  hidden: boolean;
};

export type WriteState = "OPEN" | "NO_PASS";

export type ShowSuggestions = {
  items: Suggestion[];
  total: number;
  write: WriteState;
  writeSource: SuggestionSource;
  verification: Verification | null;
};

export const SUGGESTION_MAX = 500;
