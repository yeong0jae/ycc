import { AppFrame } from "@/components/app-frame";
import { AppHeader } from "@/components/app-header";
import { HomeShows } from "./home-shows";

export default function HomePage() {
  return (
    <AppFrame className="pb-32">
      <AppHeader title="홈 화면" />
      <HomeShows />
    </AppFrame>
  );
}
