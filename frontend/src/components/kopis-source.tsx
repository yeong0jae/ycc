export function KopisSource({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-muted ${className}`}>
      출처: (재)예술경영지원센터 공연예술통합전산망 (
      <a href="https://www.kopis.or.kr" target="_blank" rel="noopener noreferrer" className="underline">
        www.kopis.or.kr
      </a>
      )
    </p>
  );
}
