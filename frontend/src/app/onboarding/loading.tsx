import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";

export default function Loading() {
  return (
    <AppFrame className="flex min-h-dvh flex-col">
      <AppHeader title="시작 설정" />
      <p className="sr-only">불러오는 중</p>
    </AppFrame>
  );
}
