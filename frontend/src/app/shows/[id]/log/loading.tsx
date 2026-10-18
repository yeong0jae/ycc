import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";

export default function Loading() {
  return (
    <AppFrame>
      <AppHeader title="공연날 로그" />
      <p className="sr-only">불러오는 중</p>
    </AppFrame>
  );
}
