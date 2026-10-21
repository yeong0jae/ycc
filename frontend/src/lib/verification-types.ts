export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type RejectReason = "WRONG_SHOW" | "NOT_VISIBLE" | "CANCELED" | "OTHER";

export const REJECT_REASONS: { key: RejectReason; label: string }[] = [
  { key: "WRONG_SHOW", label: "공연이 달라요" },
  { key: "NOT_VISIBLE", label: "예매 내역이 안 보여요" },
  { key: "CANCELED", label: "취소된 예매예요" },
  { key: "OTHER", label: "기타" },
];

export const REJECT_LABELS = Object.fromEntries(REJECT_REASONS.map((it) => [it.key, it.label])) as Record<RejectReason, string>;

export type Verification = {
  showId: number;
  showName: string;
  startDate: string;
  endDate: string;
  status: VerificationStatus;
  rejectReason: RejectReason | null;
  writableUntil: string;
};

export type DevVerification = {
  id: number;
  showId: number;
  showName: string;
  startDate: string;
  endDate: string;
  venue: string;
  nickname: string;
  status: VerificationStatus;
  rejectReason: RejectReason | null;
  hasImage: boolean;
  createdAt: string;
  decidedAt: string | null;
};

export type DevVerifications = { items: DevVerification[]; pending: number };

export function lastDay(until: string) {
  const date = new Date(`${until.slice(0, 10)}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}
