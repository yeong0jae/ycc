"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { parseKind, type ShowKind } from "@/lib/show-types";
import { KindToggle } from "./kind-toggle";
import { RequestButton } from "./request-button";
import { ViewToggle } from "./view-toggle";

export function FindToolbar({ kind }: { kind: ShowKind }) {
  const onMap = usePathname().startsWith("/find/map");
  return (
    <div className={`fixed inset-x-0 top-0 z-20 ${onMap ? "pointer-events-none" : ""}`}>
      <div className={`mx-auto flex max-w-2xl justify-between px-3 pt-2.5 ${onMap ? "" : "bg-paper"}`}>
        <div className="pointer-events-auto">
          <KindToggle kind={kind} />
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <RequestButton kind={kind} />
          <ViewToggle kind={kind} />
        </div>
      </div>
    </div>
  );
}

export function FindToolbarFromParams() {
  return <FindToolbar kind={parseKind(useSearchParams().get("kind"))} />;
}
