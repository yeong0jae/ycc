import { redirect } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { getMe } from "@/lib/auth";

export default async function HomePage() {
  const me = await getMe();
  if (me && !me.onboarded) redirect("/onboarding");

  return <AppFrame className="pb-32" />;
}
