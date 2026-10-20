import type { ReactNode } from "react";
import { KakaoLoginButton } from "@/components/kakao-login-button";
import { ParticipatedRow, SectionLabel, ServiceRows } from "./profile-rows";

function Benefit({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-paper">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icon}
        </svg>
      </span>
      <span className="flex flex-col gap-0.5 pt-px">
        <b className="text-sm">{title}</b>
        <span className="text-[13px] leading-normal text-muted">{body}</span>
      </span>
    </div>
  );
}

export function ProfileGuest({ loginUrl, failed }: { loginUrl: string; failed: boolean }) {
  return (
    <>
      <section className="mx-4 mt-1 flex flex-col gap-4 rounded-3xl bg-[#f7f7f8] p-5">
        <div className="flex items-center gap-3.5">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-line">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9a9aa2" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="8.5" r="3.5" />
              <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" />
            </svg>
          </span>
          <span className="flex flex-col gap-1">
            <b className="text-lg">로그인하지 않았어요</b>
            <span className="text-[13px] text-muted">참여한 공연은 이 기기에만 저장돼 있어요</span>
          </span>
        </div>
        {failed && (
          <p role="alert" className="-mb-1 text-center text-sm text-muted">
            로그인하지 못했어요. 다시 시도해 주세요.
          </p>
        )}
        <KakaoLoginButton loginUrl={loginUrl} />
        <div className="flex flex-col gap-3.5 pt-1">
          <Benefit
            icon={
              <>
                <rect x="3" y="4" width="13" height="10" rx="1.5" />
                <rect x="16" y="9" width="5" height="11" rx="1" />
                <path d="M7 18h6" />
              </>
            }
            title="다른 기기에서도 내 공연"
            body="폰을 바꾸거나 다른 브라우저로 열어도 참여한 공연이 그대로예요"
          />
          <Benefit
            icon={
              <>
                <path d="M4 20h4L19 9l-4-4L4 16z" />
                <path d="M14 6l4 4" />
              </>
            }
            title="커뮤니티 글쓰기"
            body="공연마다 후기·OOTD·질문을 남겨요"
          />
          <Benefit
            icon={
              <>
                <path d="M3 8a2 2 0 0 1 0 4 2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 1 0-4V6H3z" />
                <path d="M10 6v12" strokeDasharray="2 2" />
              </>
            }
            title="예매 인증하고 건의"
            body="현장에 없어도 공연 전·후에 건의를 남겨요"
          />
        </div>
      </section>
      <SectionLabel>이 기기</SectionLabel>
      <ParticipatedRow />
      <ServiceRows />
    </>
  );
}
