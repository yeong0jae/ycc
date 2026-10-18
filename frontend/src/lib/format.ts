export function formatPeriod(startDate: string, endDate: string) {
  const withYear = startDate.slice(0, 4) !== endDate.slice(0, 4);
  const fmt = (date: string) => {
    const [y, m, d] = date.split("-").map(Number);
    return withYear ? `${y}.${m}.${d}` : `${m}.${d}`;
  };
  return startDate === endDate ? fmt(startDate) : `${fmt(startDate)} — ${fmt(endDate)}`;
}

export function todayInSeoul() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export function formatDday(startDate: string) {
  const days = (Date.parse(startDate) - Date.parse(todayInSeoul())) / 86_400_000;
  return days <= 0 ? "NOW" : `D-${days}`;
}
