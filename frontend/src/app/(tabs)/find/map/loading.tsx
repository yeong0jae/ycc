import { AppFrame } from "@/components/app-frame";

export default function Loading() {
  return (
    <AppFrame className="relative flex h-dvh flex-col">
      <div aria-busy="true" className="flex-1 animate-pulse bg-line motion-reduce:animate-none" />
    </AppFrame>
  );
}
