export default function Loading() {
  return (
    <main className="flex min-h-dvh flex-col" aria-busy="true">
      <header className="flex h-16 items-center bg-ink px-4 text-stub sm:px-6">
        <p className="font-display text-xl">운영 · 페스티벌 검수</p>
      </header>
      <p className="sr-only">불러오는 중</p>
    </main>
  );
}
