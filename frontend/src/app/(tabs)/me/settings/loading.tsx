import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { BackButton } from "@/components/back-button";

export default function Loading() {
  return (
    <AppFrame className="pb-32">
      <AppHeader title="설정" leading={<BackButton />} />
      <p className="sr-only">불러오는 중</p>
    </AppFrame>
  );
}
