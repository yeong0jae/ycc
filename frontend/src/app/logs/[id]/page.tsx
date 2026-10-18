import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { BackButton } from "@/components/back-button";
import { getMe } from "@/lib/auth";
import { formatPeriod } from "@/lib/format";
import { getLog } from "@/lib/logs";
import { DeleteLogButton } from "./delete-log-button";

export default async function LogPage({ params }: PageProps<"/logs/[id]">) {
  const { id } = await params;
  if (!(await getMe())) redirect("/login");
  const log = await getLog(id);
  if (!log) notFound();

  return (
    <AppFrame className="pb-12">
      <AppHeader as="p" title="로그" leading={<BackButton />} />
      <div className="flex flex-col gap-4 px-4 pt-5">
        <video
          src={log.videoUrl}
          poster={log.thumbnailUrl}
          autoPlay
          muted
          loop
          playsInline
          controls
          className="mx-auto aspect-[9/16] w-full max-w-90 rounded-2xl bg-ink object-cover"
        />
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl leading-snug">
            <Link href={`/shows/${log.showId}`}>{log.showName}</Link>
          </h1>
          <p className="font-mono text-[13px] text-muted">
            {formatPeriod(log.showStartDate, log.showStartDate)} · {log.cutCount}컷
          </p>
        </div>
        {log.song && <p className="text-[15px]">그날의 한 곡 · {log.song}</p>}
        {log.note && <p className="text-[15px] leading-relaxed">“{log.note}”</p>}
        <DeleteLogButton logId={log.id} />
      </div>
    </AppFrame>
  );
}
