import { registrationStatus, unknownTime } from "./time.js";
const instant = (value: string) => ({ precision: "instant" as const, value });
const date = (value: string) => ({ precision: "date" as const, value });
const stage = {
  startsAt: instant("2026-10-08T10:00:00+08:00"),
  deadline: instant("2026-10-13T18:00:00+08:00"),
  conflict: false,
};
describe("报名时间边界", () => {
  it.each([
    ["2026-10-08T01:59:59Z", "upcoming"],
    ["2026-10-08T02:00:00Z", "open"],
    ["2026-10-13T09:59:59Z", "open"],
    ["2026-10-13T10:00:00Z", "closed"],
  ])("%s 是 %s", (now, expected) =>
    expect(registrationStatus(stage, new Date(now))).toBe(expected),
  );
  it("日期截止当天未知，北京时间次日截止；日期开始不推断开放", () => {
    const s = {
      ...stage,
      startsAt: date("2026-10-08"),
      deadline: date("2026-10-13"),
    };
    expect(registrationStatus(s, new Date("2026-10-13T15:59:59Z"))).toBe(
      "unknown",
    );
    expect(registrationStatus(s, new Date("2026-10-13T16:00:00Z"))).toBe(
      "closed",
    );
    expect(
      registrationStatus(
        { ...stage, startsAt: date("2026-10-08") },
        new Date("2026-10-09"),
      ),
    ).toBe("unknown");
  });
  it("精确截止已过可关闭，冲突优先，缺少截止未知", () => {
    expect(
      registrationStatus(
        { ...stage, startsAt: unknownTime() },
        new Date("2026-10-14"),
      ),
    ).toBe("closed");
    expect(
      registrationStatus(
        { ...stage, deadline: unknownTime() },
        new Date("2026-10-14"),
      ),
    ).toBe("unknown");
    expect(
      registrationStatus({ ...stage, conflict: true }, new Date("2026-10-14")),
    ).toBe("conflict");
  });
});
