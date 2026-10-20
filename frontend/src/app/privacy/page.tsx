import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "개인정보 처리방침 · 공연 모아보기" };

export default function PrivacyPage() {
  return (
    <LegalPage title="개인정보 처리방침" updated="2026년 10월 22일">
      <section>
        <h2>1. 모으는 정보</h2>
        <ul>
          <li>카카오 로그인: 카카오 회원번호. 이름·이메일·전화번호는 받지 않아요.</li>
          <li>회원 정보: 닉네임, 프로필 사진(올린 경우), 참여한 공연, 가입 시각</li>
          <li>커뮤니티: 쓴 글·댓글·사진, 좋아요, 신고</li>
          <li>현장 QR: QR을 찍은 기기를 알아보는 무작위 기기 ID(쿠키)</li>
          <li>건의: 건의 내용, 붙인 사진, 쓴 시각</li>
        </ul>
        <p className="mt-1.5">로그인하지 않고 참여한 공연은 이 기기(브라우저)에만 저장되고 서버로 보내지 않아요.</p>
      </section>
      <section>
        <h2>2. 쓰는 곳</h2>
        <ul>
          <li>로그인 유지, 여러 기기에서 참여한 공연 보여 주기</li>
          <li>현장 QR로 들어온 기기인지 확인하고 건의 도배 막기</li>
          <li>주최측이 건의를 보고 답하기</li>
        </ul>
      </section>
      <section>
        <h2>3. 보관 기간</h2>
        <ul>
          <li>회원 정보·참여 기록·커뮤니티 글: 탈퇴할 때까지. 탈퇴하면 바로 지워요.</li>
          <li>로그인 유지 정보: 마지막으로 쓴 뒤 30일</li>
          <li>기기 ID 쿠키: 1년</li>
          <li>건의: 공연 홈에 계속 보여요. 지워야 할 내용이 있으면 아래 이메일로 알려 주세요.</li>
        </ul>
      </section>
      <section>
        <h2>4. 다른 곳에 주기</h2>
        <p>모은 정보를 다른 곳에 팔거나 주지 않아요. 건의는 그 공연의 주최측이 볼 수 있어요. 서비스는 Google Cloud(서울)에서 운영돼요.</p>
      </section>
      <section>
        <h2>5. 내 정보 지우기</h2>
        <p>프로필 → 설정에서 탈퇴하면 계정 정보가 지워져요. 브라우저의 사이트 데이터를 지우면 이 기기에 저장된 참여와 기기 ID도 지워져요.</p>
      </section>
      <section>
        <h2>6. 문의</h2>
        <p>
          개인정보 보호책임자: 공연 모아보기 운영자
          <br />
          이메일:{" "}
          <a href="mailto:festivalwith@gmail.com" className="font-bold text-ink underline underline-offset-2">
            festivalwith@gmail.com
          </a>
        </p>
      </section>
    </LegalPage>
  );
}
