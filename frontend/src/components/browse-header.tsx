import { AppHeader } from "./app-header";
import { ViewToggle } from "./view-toggle";

export function BrowseHeader({ current }: { current: "list" | "map" }) {
  return <AppHeader title="다가오는 콘서트" trailing={<ViewToggle current={current} />} />;
}
