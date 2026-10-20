import type { ReactNode } from "react";
import { AppFrame } from "./app-frame";
import { AppHeader } from "./app-header";
import { BackButton } from "./back-button";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <AppFrame className="pb-16">
      <AppHeader title={title} leading={<BackButton />} />
      <article className="flex flex-col gap-6 px-5 pt-2 text-[15px] leading-relaxed text-[#333338] [&_h2]:mb-1.5 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-4 [&_li]:list-disc">
        <p className="text-[13px] text-muted">시행일 {updated}</p>
        {children}
      </article>
    </AppFrame>
  );
}
