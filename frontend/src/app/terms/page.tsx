import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "이용약관 · 공연 모아보기" };

export default function TermsPage() {
  return (
    <LegalPage title="이용약관" updated="2026년 10월 22일">
      <section>
        <h2>1. 서비스</h2>
        <p>공연 모아보기(이하 서비스)는 콘서트·페스티벌의 공연 정보, 주최측 공지·타임테이블, 관객 문의를 한곳에서 볼 수 있게 해요. 공연 정보는 공연예술통합전산망(KOPIS) 등 공개된 자료와 주최측이 올린 내용을 바탕으로 해요.</p>
      </section>
      <section>
        <h2>2. 이용</h2>
        <ul>
          <li>공연 정보·공지·타임테이블·문의는 로그인 없이 볼 수 있어요.</li>
          <li>카카오로 로그인하면 참여한 공연을 여러 기기에서 볼 수 있어요.</li>
          <li>현장 QR로 들어온 기기는 로그인 없이, 예매 인증한 회원은 현장 QR 없이 문의를 남길 수 있어요.</li>
        </ul>
      </section>
      <section>
        <h2>3. 올리는 글</h2>
        <ul>
          <li>문의·커뮤니티 글·댓글 등 이용자가 올린 글은 누구나 볼 수 있어요.</li>
          <li>욕설·광고·남을 해치는 내용, 다른 사람의 개인정보는 올리면 안 돼요. 이런 글은 주최측이나 서비스가 숨길 수 있어요.</li>
          <li>올린 글의 책임은 올린 사람에게 있어요.</li>
        </ul>
      </section>
      <section>
        <h2>4. 공연 정보</h2>
        <p>공연 일정·시간·출연은 주최측 사정으로 바뀔 수 있어요. 예매·환불 등은 각 예매처와 주최측의 안내를 따라요.</p>
      </section>
      <section>
        <h2>5. 탈퇴</h2>
        <p>프로필 → 설정에서 언제든 탈퇴할 수 있어요. 탈퇴하면 계정, 참여 기록, 프로필 사진, 커뮤니티에 쓴 글·댓글이 지워져요.</p>
      </section>
      <section>
        <h2>6. 바뀔 때</h2>
        <p>약관이 바뀌면 시행 전에 이 화면에서 알려 드려요.</p>
      </section>
      <section>
        <h2>7. 문의</h2>
        <p>
          <a href="mailto:festivalwith@gmail.com" className="font-bold text-ink underline underline-offset-2">
            festivalwith@gmail.com
          </a>
        </p>
      </section>
    </LegalPage>
  );
}
