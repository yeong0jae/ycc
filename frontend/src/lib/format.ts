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

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const REGIONS: Record<string, string> = {
  경상남도: "경남",
  경상북도: "경북",
  전라남도: "전남",
  전라북도: "전북",
  전북특별자치도: "전북",
  충청남도: "충남",
  충청북도: "충북",
};

function weekday(date: string) {
  return WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

export function formatLongDate(date: string) {
  const [, m, d] = date.split("-").map(Number);
  return `${m}월 ${d}일 ${weekday(date)}요일`;
}

export function formatLongPeriod(startDate: string, endDate: string) {
  if (startDate === endDate) return formatLongDate(startDate);
  const short = (date: string) => {
    const [, m, d] = date.split("-").map(Number);
    return `${m}월 ${d}일 ${weekday(date)}`;
  };
  return `${short(startDate)} — ${short(endDate)}`;
}

export function shortRegion(area: string | null) {
  if (!area) return null;
  return REGIONS[area] ?? area.replace(/(특별자치시|특별자치도|특별시|광역시|도)$/, "");
}

export function festivalBadge(startDate: string, endDate: string) {
  const today = todayInSeoul();
  if (endDate < today) return { label: "END", live: false };
  if (startDate <= today) return { label: startDate === endDate ? "오늘" : "진행 중", live: true };
  return { label: formatDday(startDate), live: false };
}
