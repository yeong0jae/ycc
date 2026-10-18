import { AppFrame } from "@/components/app-frame";

export default function Loading() {
  return (
    <AppFrame className="flex min-h-dvh flex-col">
      <p className="sr-only">불러오는 중</p>
    </AppFrame>
  );
}
