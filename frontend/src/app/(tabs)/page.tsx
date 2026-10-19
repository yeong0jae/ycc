import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { getMe } from "@/lib/auth";

export default async function HomePage() {
  const me = await getMe();
  if (me && !me.onboarded) redirect("/onboarding");

  return (
    <AppFrame className="pb-32">
      <AppHeader title="홈 화면" />
    </AppFrame>
  );
}
