import { LogTile } from "@/components/log-tile";
import type { ShowLog } from "@/lib/logs";

export function LogWall({ logs, empty }: { logs: ShowLog[]; empty: string }) {
  if (logs.length === 0) return <p className="rounded-2xl bg-stub px-4 py-5 text-sm text-muted">{empty}</p>;
  return (
    <ul className="grid grid-cols-3 gap-1.5">
      {logs.map((log) => (
        <li key={log.id}>
          <LogTile log={log} />
        </li>
      ))}
    </ul>
  );
}
