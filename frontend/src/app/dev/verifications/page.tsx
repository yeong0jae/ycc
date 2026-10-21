import { backendFetch } from "@/lib/auth";
import type { DevVerifications } from "@/lib/verification-types";
import { VerificationBoard } from "./verification-board";

export default async function DevVerificationsPage() {
  const res = await backendFetch("/api/dev/verifications?status=PENDING");
  if (!res.ok) throw new Error(`예매 인증 목록 조회 실패: ${res.status}`);
  const initial: DevVerifications = await res.json();

  return <VerificationBoard initial={initial} />;
}
