import { requestsPath, type ShowRequestList } from "@/lib/dev-types";
import { backendFetch } from "@/lib/auth";
import { RequestBoard } from "./request-board";

export default async function DevRequestsPage() {
  const res = await backendFetch(requestsPath("PENDING"));
  if (!res.ok) throw new Error(`추가 요청 목록 조회 실패: ${res.status}`);
  const initial: ShowRequestList = await res.json();

  return <RequestBoard initial={initial} />;
}
