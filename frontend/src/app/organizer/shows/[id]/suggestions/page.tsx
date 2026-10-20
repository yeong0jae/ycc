import { backendFetch } from "@/lib/auth";
import type { Suggestion } from "@/lib/suggestion-types";
import { SuggestionInbox } from "./suggestion-inbox";

export default async function OrganizerSuggestionsPage({ params }: PageProps<"/organizer/shows/[id]/suggestions">) {
  const { id } = await params;
  const res = await backendFetch(`/api/organizer/shows/${encodeURIComponent(id)}/suggestions`);
  if (!res.ok) throw new Error(`건의 목록 조회 실패: ${res.status}`);
  const suggestions: Suggestion[] = await res.json();

  return <SuggestionInbox showId={Number(id)} initial={suggestions} />;
}
