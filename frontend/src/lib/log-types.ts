export type Moment = "GOODS" | "ENTRY" | "BEFORE_SHOW" | "AFTER";
export type Visibility = "PUBLIC" | "PRIVATE";

export const MOMENTS: { key: Moment; label: string; hint: string }[] = [
  { key: "GOODS", label: "굿즈 줄", hint: "줄 서 있는 지금" },
  { key: "ENTRY", label: "입장 대기", hint: "입장 직전의 설렘" },
  { key: "BEFORE_SHOW", label: "공연 직전", hint: "불 꺼지기 전 무대" },
  { key: "AFTER", label: "끝나고", hint: "나오는 길의 여운" },
];

export type MyLog = {
  id: number;
  status: "DRAFT" | "READY";
  clips: { moment: Moment; durationMs: number }[];
  song: string | null;
  note: string | null;
  visibility: Visibility;
};

export type ShowLog = {
  id: number;
  userId: number;
  nickname: string | null;
  showId: number;
  showName: string;
  showStartDate: string;
  song: string | null;
  note: string | null;
  visibility: Visibility;
  cutCount: number;
  videoUrl: string;
  thumbnailUrl: string;
};

export type FeedShow = { id: number; name: string; startDate: string; endDate: string; venue: string };

export type FeedPerson = {
  userId: number;
  nickname: string | null;
  log: ShowLog | null;
  wasThereSent: boolean;
  nextTogetherSent: boolean;
  nextTogetherMatched: boolean;
};

export type PastFeedItem = { show: FeedShow; myLogId: number; people: FeedPerson[] };
export type NextFeedItem = { show: FeedShow; people: FeedPerson[] };
