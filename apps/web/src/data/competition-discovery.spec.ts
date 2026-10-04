import { describe, expect, it } from "vitest";
import { colleges } from "./colleges";
import { competitions, type Stage } from "./competitions";
import {
  canonicalQuery,
  filterEntries,
  formatTime,
  PAGE_SIZE,
  parseFilters,
  stageStatus,
  writeFilters,
} from "./competition-discovery";

describe("比赛筛选与 URL 契约", () => {
  it("区分默认、全部及手动选满 27 项，并稳定去重排序", () => {
    expect(parseFilters({}).hosts).toEqual([]);
    expect(parseFilters({ hosts: "all" }).hosts).toBe("all");
    expect(
      parseFilters({
        hosts: ["all,law,unknown", "information-engineering,law"],
      }).hosts,
    ).toEqual(["information-engineering", "law"]);
    const full = parseFilters({
      hosts: colleges
        .map((c) => c.id)
        .reverse()
        .join(","),
    });
    expect(full.hosts).toEqual(colleges.map((c) => c.id));
    expect(writeFilters({}, full).hosts).not.toBe("all");
    expect(parseFilters({ hosts: "bad,bad" }).hosts).toEqual([]);
  });
  it("规范化冲突及无效参数，保留无关参数且幂等", () => {
    const query = {
      hosts: ["all", "law,law,bad"],
      category: "bad",
      status: "bad",
      eligible: "bad",
      page: "Infinity",
      q: "  比赛  ",
      from: ["a", "b"],
    };
    const canonical = canonicalQuery(query);
    expect(canonical).toEqual({ hosts: "law", q: "比赛", from: ["a", "b"] });
    expect(canonicalQuery(parseQuery(canonical))).toEqual(canonical);
  });
  it("承办任一匹配，范围独立且其他条件取交集", () => {
    const filters = parseFilters({
      hosts: "information-engineering,life-science",
      eligible: "law",
      category: "编程",
      q: "程序",
    });
    expect(filterEntries(filters).map((e) => e.competition.id)).toEqual([
      "programming-2026-8",
    ]);
    expect(filterEntries({ ...filters, hosts: ["law"] })).toEqual([]);
    expect(filterEntries({ ...filters, status: "closed" })).toEqual([]);
  });
  it("学院资格只纳入明确全校或指定学院，复杂和未知可独立查看", () => {
    const eligible = filterEntries(parseFilters({ eligible: "resources" }));
    expect(eligible.some((e) => e.stage.id === "challenge-20-resources")).toBe(
      true,
    );
    expect(eligible.some((e) => e.stage.id === "challenge-20-civil")).toBe(
      false,
    );
    expect(
      eligible.every(
        (e) =>
          e.stage.scope.kind !== "complex" && e.stage.scope.kind !== "unknown",
      ),
    ).toBe(true);
    expect(
      filterEntries(parseFilters({ eligible: "uncertain" })).every((e) =>
        ["complex", "unknown"].includes(e.stage.scope.kind),
      ),
    ).toBe(true);
  });
  it("先筛全量再分页，超出页数归位；同届院赛各自保留截止", () => {
    expect(filterEntries(parseFilters({})).length).toBeGreaterThan(PAGE_SIZE);
    expect(
      canonicalQuery({ hosts: "economics", page: "3" }).page,
    ).toBeUndefined();
    const challenge = competitions.find((c) => c.id === "challenge-2027-20")!;
    expect(challenge.stages[0]!.materialsAt).not.toBe(
      challenge.stages[1]!.materialsAt,
    );
    expect(new Set(competitions.map((c) => c.id)).size).toBe(
      competitions.length,
    );
  });
  it("样例来源类型、ID 与阶段引用一致，虚构信息不伪造来源", () => {
    for (const competition of competitions) {
      for (const stage of competition.stages) {
        expect(
          stage.sourceIds.every((id) =>
            competition.notices.some((n) => n.id === id),
          ),
        ).toBe(true);
        expect(
          stage.hosts.every((id) => colleges.some((c) => c.id === id)),
        ).toBe(true);
      }
      if (competition.origin === "demo")
        expect(competition.notices).toEqual([]);
      else
        for (const source of competition.notices) {
          expect(new URL(source.url).hostname.endsWith(".sicau.edu.cn")).toBe(
            true,
          );
          expect(source.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(source.checkedAt).toBe("2026-10-04");
        }
    }
  });
});
function parseQuery(query: ReturnType<typeof canonicalQuery>) {
  return Object.fromEntries(
    Object.entries(query).map(([key, value]) => [
      key,
      Array.isArray(value)
        ? value.map((v) => (v == null ? null : String(v)))
        : value == null
          ? null
          : String(value),
    ]),
  );
}
describe("北京时间与报名边界", () => {
  const stage: Stage = {
    id: "boundary",
    name: "测试",
    organizer: "测试",
    hosts: [],
    scope: { kind: "all", colleges: [], note: "" },
    startsAt: "2026-10-08T10:00:00+08:00",
    deadline: "2026-10-13T18:00:00+08:00",
    eventAt: "2026-10-20T12:00:00+08:00",
    registration: "",
    sourceIds: [],
  };
  it.each([
    ["2026-10-08T09:59:59+08:00", "upcoming"],
    ["2026-10-08T02:00:00Z", "open"],
    ["2026-10-13T17:59:59+08:00", "open"],
    ["2026-10-13T10:00:00Z", "closed"],
  ])("时间 %s 得到 %s", (now, expected) =>
    expect(stageStatus(stage, now)).toBe(expected),
  );
  it("比赛日期不代替报名截止；材料、时间冲突和未知开始分别处理", () => {
    expect(
      stageStatus(
        { ...stage, deadline: undefined },
        "2026-10-09T12:00:00+08:00",
      ),
    ).toBe("unknown");
    expect(
      stageStatus(
        { ...stage, startsAt: undefined },
        "2026-10-09T12:00:00+08:00",
      ),
    ).toBe("unknown");
    expect(stageStatus({ ...stage, conflict: true })).toBe("conflict");
    expect(
      stageStatus({
        ...stage,
        deadline: undefined,
        materialsAt: "2026-05-01T12:00:00+08:00",
      }),
    ).toBe("closed");
    expect(formatTime("2026-10-13T10:00:00Z")).toContain("18:00");
    expect(formatTime()).toBe("待公布");
  });
});
