// 内部业务/持久化模型；不依赖 Swagger 或公开响应 DTO。
export type TimeValue = {
  precision: "instant" | "date" | "unknown";
  value: string | null;
};
export type CollegeRecord = { id: string; name: string; order: number };
export type ScopeRecord = {
  kind: "all" | "colleges" | "complex" | "unknown";
  colleges: string[];
  note: string;
};
export type NoticeRecord = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt: string | null;
  checkedAt: string | null;
  kind: "registration" | "supplement" | "award" | "news";
};
export type TrackRecord = {
  id: string;
  name: string;
  mode: "individual" | "team" | "mixed";
  members: string;
  rules: string;
};
export type StageRecord = {
  id: string;
  name: string;
  organizer: string;
  hosts: string[];
  scope: ScopeRecord;
  startsAt: TimeValue;
  deadline: TimeValue;
  materialsAt: TimeValue;
  eventAt: TimeValue;
  timeNote: string;
  conflict: boolean;
  registration: string;
  order: number;
  sourceIds: string[];
};
export type EditionSummary = {
  id: string;
  name: string;
  edition: string;
  category: string;
  organizer: string;
  origin: "official" | "historical" | "demo";
};
export type Publication = "draft" | "published" | "hidden";
export type EditionRecord = EditionSummary & {
  publication: Publication;
  stages: StageRecord[];
  tracks: TrackRecord[];
  notices: NoticeRecord[];
};

export const statusValues = [
  "upcoming",
  "open",
  "closed",
  "unknown",
  "conflict",
] as const;
export type Status = (typeof statusValues)[number];
export type StageSummaryRecord = Pick<
  StageRecord,
  "id" | "name" | "hosts" | "scope" | "deadline" | "materialsAt" | "conflict"
> & { status: Status };
export type EntryRecord = {
  competition: EditionSummary;
  stage: StageSummaryRecord;
};
export type CompetitionPage = {
  items: EntryRecord[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalStages: number;
  totalCompetitions: number;
  totalPages: number;
  evaluatedAt: string;
};
