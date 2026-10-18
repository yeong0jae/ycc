import { AppHeader } from "./app-header";
import { ViewToggle } from "./view-toggle";

export function BrowseHeader({ current }: { current: "list" | "map" }) {
  return <AppHeader title="찾기" trailing={<ViewToggle current={current} />} />;
}
