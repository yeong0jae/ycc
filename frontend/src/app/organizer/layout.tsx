import { type ReactNode, Suspense } from "react";
import { AccountLogin } from "@/components/account-login";
import { backendFetch } from "@/lib/auth";

async function OrganizerGate({ children }: { children: ReactNode }) {
  const res = await backendFetch("/api/organizer/me");
  if (res.status === 401) return <AccountLogin title="주최측 로그인" loginPath="/api/organizer/login" />;
  if (!res.ok) throw new Error(`주최측 정보 조회 실패: ${res.status}`);
  return children;
}

export default function OrganizerLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="sr-only">불러오는 중</p>}>
      <OrganizerGate>{children}</OrganizerGate>
    </Suspense>
  );
}
