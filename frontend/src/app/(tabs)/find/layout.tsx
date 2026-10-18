import type { ReactNode } from "react";
import { ViewToggle } from "@/components/view-toggle";

export default function FindLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-2xl justify-end px-3 pt-2.5">
          <div className="pointer-events-auto">
            <ViewToggle />
          </div>
        </div>
      </div>
    </>
  );
}
