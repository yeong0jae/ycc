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

