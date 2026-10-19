import { type ReactNode, Suspense } from "react";
import { backendFetch } from "@/lib/auth";
import { DevHeader } from "./dev-header";
import { DevLogin } from "./dev-login";

async function DevGate({ children }: { children: ReactNode }) {
  const res = await backendFetch("/api/dev/me");
  if (res.status === 401) return <DevLogin />;
  if (!res.ok) throw new Error(`개발자 정보 조회 실패: ${res.status}`);

  return (
    <div className="flex h-dvh flex-col">
      <DevHeader />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

export default function DevLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="sr-only">불러오는 중</p>}>
      <DevGate>{children}</DevGate>
    </Suspense>
  );
}
