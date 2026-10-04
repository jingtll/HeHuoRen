// 仅测试使用的旧前端演示逻辑；生产页面读取服务端状态与分页。
import {
  competitions,
  DEMO_NOW,
  type Competition,
  type Stage,
} from "./competitions";
import type { Filters, Status } from "./competition-discovery";
export { PAGE_SIZE } from "./competition-discovery";
export type Entry = { competition: Competition; stage: Stage };
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
          (filters.hosts.length > 0 &&
            stage.hosts.some((id) => filters.hosts.includes(id)))) &&
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
        (!filters.status || filters.status === stageStatus(stage, now)),
    );
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
