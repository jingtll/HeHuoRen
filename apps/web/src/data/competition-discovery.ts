import type { LocationQuery, LocationQueryRaw } from "vue-router";
import { colleges, type CollegeId } from "./colleges";
import type { CollegeSelection } from "./college-selection";
import {
  competitions,
  DEMO_NOW,
  type Competition,
  type Stage,
  type Scope,
} from "./competitions";

export const statuses = {
  upcoming: "尚未开始",
  open: "报名时段内",
  closed: "已截止",
  unknown: "待公布 / 待核对",
  conflict: "时间待核对",
};
export type Status = keyof typeof statuses;
export const categories = ["编程", "学科技能", "科技创新", "数据建模"] as const;
export type Filters = {
  hosts: CollegeSelection;
  q: string;
  category: Competition["category"] | "";
  status: Status | "";
  page: number;
};
export type Entry = { competition: Competition; stage: Stage };
export const PAGE_SIZE = 4;
// eligible 是已移除的参赛范围筛选参数；规范化旧链接时一并清理。
const owned = ["hosts", "q", "category", "status", "eligible", "page"];
const first = (value: LocationQuery[string]) =>
  (Array.isArray(value) ? value[0] : value) ?? "";
const tokens = (value: LocationQuery[string]) =>
  (Array.isArray(value) ? value : [value]).flatMap((v) => v?.split(",") ?? []);
export function parseFilters(query: LocationQuery): Filters {
  const hostTokens = tokens(query.hosts);
  const ids = colleges
    .filter((c) => hostTokens.includes(c.id))
    .map((c) => c.id);
  const page = Number(first(query.page));
  return {
    hosts: ids.length ? ids : hostTokens.includes("all") ? "all" : [],
    q: first(query.q).trim().slice(0, 100),
    category: categories.some((c) => c === first(query.category))
      ? (first(query.category) as Competition["category"])
      : "",
    status: Object.hasOwn(statuses, first(query.status))
      ? (first(query.status) as Status)
      : "",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}
export function writeFilters(
  query: LocationQuery,
  filters: Filters,
): LocationQueryRaw {
  const result: LocationQueryRaw = { ...query };
  owned.forEach((key) => delete result[key]);
  if (filters.hosts === "all") result.hosts = "all";
  else if (filters.hosts.length)
    result.hosts = colleges
      .filter((c) => filters.hosts.includes(c.id))
      .map((c) => c.id)
      .join(",");
  if (filters.q) result.q = filters.q;
  if (filters.category) result.category = filters.category;
  if (filters.status) result.status = filters.status;
  if (filters.page > 1) result.page = String(filters.page);
  return result;
}
export function stageStatus(stage: Stage, now = DEMO_NOW): Status {
  if (stage.conflict) return "conflict";
  const instant = Date.parse(now);
  if (!Number.isFinite(instant)) return "unknown";
  if (stage.deadline && instant >= Date.parse(stage.deadline)) return "closed";
  if (!stage.deadline || !stage.startsAt) return "unknown";
  return instant < Date.parse(stage.startsAt) ? "upcoming" : "open";
}
export function filterEntries(
  filters: Filters,
  now = DEMO_NOW,
  data = competitions,
): Entry[] {
  const q = filters.q.toLocaleLowerCase();
  return data
    .flatMap((competition) =>
      competition.stages.map((stage) => ({ competition, stage })),
    )
    .filter(
      ({ competition, stage }) =>
        (filters.hosts === "all" ||
          !filters.hosts.length ||
          stage.hosts.some((id) => filters.hosts.includes(id))) &&
        (!q ||
          [
            competition.name,
            competition.edition,
            stage.name,
            competition.organizer,
          ]
            .join(" ")
            .toLocaleLowerCase()
            .includes(q)) &&
        (!filters.category || filters.category === competition.category) &&
        (!filters.status || filters.status === stageStatus(stage, now)),
    );
}
export function canonicalQuery(query: LocationQuery): LocationQueryRaw {
  const filters = parseFilters(query);
  filters.page = Math.min(
    filters.page,
    Math.max(1, Math.ceil(filterEntries(filters).length / PAGE_SIZE)),
  );
  return writeFilters(query, filters);
}
export function collegeNames(ids: CollegeId[]) {
  return (
    ids.map((id) => colleges.find((c) => c.id === id)?.name).join("、") ||
    "校级组织 / 承办学院待核对"
  );
}
export function scopeLabel(scope: Scope) {
  return scope.kind === "all"
    ? "全校开放"
    : scope.kind === "colleges"
      ? collegeNames(scope.colleges)
      : "资格需核对原文";
}
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
export function materialDeadlineLabel(value?: string, now = DEMO_NOW) {
  return (
    formatTime(value) +
    (value && Date.parse(value) <= Date.parse(now) ? "（材料已截止）" : "")
  );
}
export function formatTime(value?: string) {
  return value ? dateFormatter.format(new Date(value)) : "待公布";
}
