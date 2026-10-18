import Link from "next/link";

const tabs = [
  {
    key: "list",
    href: "/find",
    label: "목록",
    icon: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  },
  {
    key: "map",
    href: "/find/map",
    label: "지도",
    icon: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />,
  },
] as const;

export function ViewToggle({ current }: { current?: "list" | "map" }) {
  return (
    <nav aria-label="보기 방식" className="flex shrink-0 rounded-full border border-line bg-stub p-1">
      {tabs.map((tab) => {
        const active = tab.key === current;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            transitionTypes={["view-switch"]}
            aria-current={active ? "page" : undefined}
            className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ${
              active ? "bg-ink text-stub" : "text-ink"
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {tab.icon}
            </svg>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
