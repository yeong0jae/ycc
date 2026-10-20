import { redirect } from "next/navigation";

export default async function OrganizerShowPage({ params }: PageProps<"/organizer/shows/[id]">) {
  const { id } = await params;
  redirect(`/organizer/shows/${encodeURIComponent(id)}/notices`);
}
