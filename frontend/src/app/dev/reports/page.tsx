import { backendFetch } from "@/lib/auth";
import type { Reported } from "@/lib/community-types";
import { ReportBoard } from "./report-board";

export default async function DevReportsPage() {
  const res = await backendFetch("/api/dev/community/reports");
  if (!res.ok) throw new Error(`신고 목록 조회 실패: ${res.status}`);
  const initial: Reported[] = await res.json();

  return <ReportBoard initial={initial} />;
}
