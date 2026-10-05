import { describe, expect, it } from "vitest";
import {
  formatTime,
  formatEvaluatedAt,
  materialDeadlineLabel,
} from "./competition-discovery";

describe("生产比赛时间展示（北京时间）", () => {
  it("未知时间不补造日期，日期精度保留时刻未知提示", () => {
    expect(formatTime()).toBe("待公布");
    expect(formatTime({ precision: "unknown", value: null })).toBe("待公布");
    expect(formatEvaluatedAt()).toBe("待获取");
    expect(materialDeadlineLabel()).toBe("待公布");
    expect(
      materialDeadlineLabel(
        { precision: "unknown", value: null },
        "2026-10-05T00:00:00Z",
      ),
    ).toBe("待公布");
    expect(formatTime({ precision: "date", value: "2026-10-05" })).toBe(
      "2026-10-05（具体时刻待公布）",
    );
  });
  it.each([
    ["2026-10-04T16:00:00Z", "2026/10/05 00:00"],
    ["2026-10-05T10:00:00Z", "2026/10/05 18:00"],
  ])("UTC %s 在生产格式函数中显示 %s", (value, expected) => {
    expect(formatTime({ precision: "instant", value })).toBe(expected);
    expect(formatEvaluatedAt(value)).toBe(expected);
  });
  it.each([
    ["2026-10-05T09:59:59.999Z", false],
    ["2026-10-05T10:00:00Z", true],
    ["2026-10-05T10:00:00.001Z", true],
  ])("精确材料截止边界 %s：截止=%s", (now, closed) => {
    expect(
      materialDeadlineLabel(
        { precision: "instant", value: "2026-10-05T18:00:00+08:00" },
        now,
      ),
    ).toBe("2026/10/05 18:00" + (closed ? "（材料已截止）" : ""));
  });
  it.each([
    ["2026-10-04T16:00:00Z", false],
    ["2026-10-05T15:59:59.999Z", false],
    ["2026-10-05T16:00:00Z", true],
    ["2026-10-05T16:00:00.001Z", true],
  ])("日期型材料截止以北京时间次日为界 %s：截止=%s", (now, closed) => {
    expect(
      materialDeadlineLabel({ precision: "date", value: "2026-10-05" }, now),
    ).toBe("2026-10-05（具体时刻待公布）" + (closed ? "（材料已截止）" : ""));
  });
  it("未获取服务端计算时间时不判定材料已截止", () => {
    expect(
      materialDeadlineLabel({
        precision: "instant",
        value: "2026-01-01T00:00:00Z",
      }),
    ).toBe("2026/01/01 08:00");
    expect(
      materialDeadlineLabel({ precision: "date", value: "2026-01-01" }),
    ).toBe("2026-01-01（具体时刻待公布）");
  });
});
