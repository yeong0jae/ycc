import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";

export default function Loading() {
  return (
    <AppFrame className="flex min-h-dvh flex-col">
      <AppHeader title="로그인" />
      <p className="sr-only">불러오는 중</p>
    </AppFrame>
  );
}
