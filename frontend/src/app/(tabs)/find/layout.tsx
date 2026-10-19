import { type ReactNode, Suspense } from "react";
import { FindToolbar, FindToolbarFromParams } from "@/components/find-toolbar";

export default function FindLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={<FindToolbar kind="FESTIVAL" />}>
        <FindToolbarFromParams />
      </Suspense>
    </>
  );
}
