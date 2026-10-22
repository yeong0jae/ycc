import { backendFetch } from "@/lib/auth";
import type { Show } from "@/lib/show-types";
import type { Suggestion } from "@/lib/suggestion-types";
import { SuggestionInbox } from "./suggestion-inbox";

export default async function OrganizerSuggestionsPage({ params }: PageProps<"/organizer/shows/[id]/suggestions">) {
  const { id } = await params;
  const [res, showRes] = await Promise.all([
    backendFetch(`/api/organizer/shows/${encodeURIComponent(id)}/suggestions`),
    backendFetch(`/api/organizer/shows/${encodeURIComponent(id)}`),
  ]);
  if (!res.ok) throw new Error(`문의 목록 조회 실패: ${res.status}`);
  if (!showRes.ok) throw new Error(`공연 조회 실패: ${showRes.status}`);
  const suggestions: Suggestion[] = await res.json();
  const show: Show = await showRes.json();

  return <SuggestionInbox showId={show.id} initial={suggestions} initialEnabled={show.suggestionsEnabled} />;
}
