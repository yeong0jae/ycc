import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { SlamLogo } from "@/components/slam-logo";
import { HomeShows } from "./home-shows";

export default function HomePage() {
  return (
    <AppFrame className="pb-32">
      <AppHeader title={<SlamLogo />} />
      <HomeShows />
    </AppFrame>
  );
}
