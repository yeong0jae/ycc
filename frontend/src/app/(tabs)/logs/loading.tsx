import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";

export default function Loading() {
  return (
    <AppFrame className="pb-32">
      <AppHeader title="로그" />
      <p className="sr-only">불러오는 중</p>
    </AppFrame>
  );
}
