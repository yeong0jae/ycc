const SOON = ["타임테이블", "건의", "커뮤니티"];

export function ShowHomeTabs({ noticeCount }: { noticeCount?: number }) {
  return (
    <nav aria-label="공연 홈" className="sticky top-17 z-10 mt-4.5 flex gap-4.5 overflow-x-auto bg-paper px-5 shadow-[inset_0_-1px_0_var(--color-line)]">
      <span aria-current="page" className="flex h-11 shrink-0 items-center gap-1 text-[15px] font-bold shadow-[inset_0_-2px_0_var(--color-ink)]">
        공지 {noticeCount !== undefined && <span className="font-num text-[13px] font-black">{noticeCount}</span>}
      </span>
      {SOON.map((label) => (
        <span key={label} aria-disabled="true" title="곧 열려요" className="flex h-11 shrink-0 items-center text-[15px] text-[#b9b9c0]">
          {label}
        </span>
      ))}
    </nav>
  );
}
