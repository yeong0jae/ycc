"use server";

import { updateTag } from "next/cache";
import { backendFetch } from "@/lib/auth";

export async function setSuggestionsEnabled(showId: number, enabled: boolean): Promise<boolean | null> {
  const res = await backendFetch(`/api/organizer/shows/${showId}/suggestions/enabled`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) return null;
  updateTag(`show-${showId}`);
  return (await res.json()).enabled;
}
