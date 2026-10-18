import { notFound, redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { BackButton } from "@/components/back-button";
import { getMe } from "@/lib/auth";
import { getShowMe } from "@/lib/logs";
import { getShow } from "@/lib/show";
import { LogCapture } from "./log-capture";

export default async function ShowLogPage({ params }: PageProps<"/shows/[id]/log">) {
  const { id } = await params;
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.onboarded) redirect("/onboarding");
  const [show, mine] = await Promise.all([getShow(id), getShowMe(id)]);
  if (!show) notFound();
  if (mine?.log?.status === "READY") redirect(`/logs/${mine.log.id}`);

  return (
    <AppFrame className="pb-12">
      <AppHeader title="공연날 로그" leading={<BackButton />} />
      <div className="flex flex-col gap-5 px-4 pt-6">
        <div>
          <p className="font-display text-2xl leading-snug">{show.name}</p>
          <p className="text-[13px] text-muted">순간마다 2~4초만 남기면, 하나의 브이로그로 합쳐 드려요.</p>
        </div>
        <LogCapture showId={show.id} initial={mine?.log ?? null} />
      </div>
    </AppFrame>
  );
}
