import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { BackButton } from "@/components/back-button";
import { getMe } from "@/lib/auth";
import { ServiceRows } from "../profile-rows";
import { AccountRows } from "./account-rows";

export default async function SettingsPage() {
  const me = await getMe();

  return (
    <AppFrame className="pb-32">
      <AppHeader title="설정" leading={<BackButton />} />
      <ServiceRows />
      {me && <AccountRows />}
    </AppFrame>
  );
}
