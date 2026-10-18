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

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function formatDay(date: string) {
  const [, m, d] = date.split("-").map(Number);
  return `${m}.${String(d).padStart(2, "0")} ${WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]}`;
}

export function daysFromToday(date: string) {
  return (Date.parse(date) - Date.parse(todayInSeoul())) / 86_400_000;
}

export function formatDaysLeft(date: string) {
  const days = daysFromToday(date);
  return days === 0 ? "TODAY" : `D-${days}`;
}

export function datesBetween(startDate: string, endDate: string) {
  const dates: string[] = [];
  for (let t = Date.parse(startDate); t <= Date.parse(endDate); t += 86_400_000) {
    dates.push(new Date(t).toISOString().slice(0, 10));
  }
  return dates;
}
