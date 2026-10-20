export type PostKind = "FREE" | "QUESTION" | "TIP" | "REVIEW" | "COMPANION";

export const POST_KINDS: { key: PostKind; label: string }[] = [
  { key: "FREE", label: "자유" },
  { key: "QUESTION", label: "질문" },
  { key: "TIP", label: "추천" },
  { key: "REVIEW", label: "후기" },
  { key: "COMPANION", label: "동행" },
];

export const POST_LABELS: Record<PostKind, string> = { FREE: "자유", QUESTION: "질문", TIP: "추천", REVIEW: "후기", COMPANION: "동행" };

export type CommunityImage = { id: number; url: string; width: number; height: number };

export type Post = {
  id: number;
  kind: PostKind;
  body: string;
  images: CommunityImage[];
  author: string;
  authorAvatar: string | null;
  createdAt: string;
  updatedAt: string | null;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  mine: boolean;
};

export type Comment = {
  id: number;
  body: string;
  author: string;
  authorAvatar: string | null;
  createdAt: string;
  updatedAt: string | null;
  mine: boolean;
  byPostAuthor: boolean;
};

export type PostPage = { items: Post[]; hasMore: boolean };

export type PostDetail = { post: Post; comments: Comment[] };

export type ReportReason = "ABUSE" | "SPAM" | "PRIVACY" | "OTHER";

export const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: "ABUSE", label: "욕설·비방" },
  { key: "SPAM", label: "광고·도배" },
  { key: "PRIVACY", label: "개인정보" },
  { key: "OTHER", label: "기타" },
];

export type LoginReason = "write" | "like" | "comment" | "report";

export const LOGIN_TITLES: Record<LoginReason, string> = {
  write: "글을 쓰려면 로그인이 필요해요",
  like: "좋아요를 누르려면 로그인이 필요해요",
  comment: "댓글을 남기려면 로그인이 필요해요",
  report: "신고하려면 로그인이 필요해요",
};

export const POST_MAX = 1000;
export const COMMENT_MAX = 300;
export const POST_IMAGES_MAX = 4;

export type Reported = {
  type: "POST" | "COMMENT";
  id: number;
  showId: number;
  showName: string;
  postId: number;
  body: string;
  author: string;
  createdAt: string;
  hidden: boolean;
  reasons: Partial<Record<ReportReason, number>>;
  lastReportedAt: string;
};
