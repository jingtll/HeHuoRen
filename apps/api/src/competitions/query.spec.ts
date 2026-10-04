import { parseListQuery } from "./query.js";
const parse = (suffix: string) =>
  parseListQuery("/competitions" + suffix, ["law", "science"]);
describe("直接 API 严格参数", () => {
  it("默认、空学院、多选冲突与重复合并", () => {
    expect(parse("")).toMatchObject({ hosts: "all", page: 1, pageSize: 20 });
    expect(parse("?hosts=").hosts).toEqual([]);
    expect(parse("?hosts=all,science,bad&hosts=law,law").hosts).toEqual([
      "law",
      "science",
    ]);
    expect(parse("?hosts=bad").hosts).toEqual([]);
    expect(parse("?hosts=all,bad").hosts).toBe("all");
  });
  it.each(["", "0", "-1", "1.1", "51", "9007199254740992", "Infinity", "1e1"])(
    "非法 pageSize %s",
    (value) => expect(() => parse("?pageSize=" + value)).toThrow(),
  );
  it.each(["1", "50"])("有效 pageSize %s", (value) =>
    expect(parse("?pageSize=" + value).pageSize).toBe(Number(value)),
  );
  it.each([
    "q=a&q=a",
    "status=open&status=open",
    "page=1&page=1",
    "pageSize=4&pageSize=4",
    "status=",
    "status=bad",
    "page=0",
    "page=1.5",
    "page=9007199254740992",
  ])("拒绝 %s", (value) => expect(() => parse("?" + value)).toThrow());
  it("关键词字面内容保留，长度有界", () => {
    expect(parse("?q=%20%25_%20").q).toBe("%_");
    expect(() => parse("?q=" + "字".repeat(101))).toThrow();
  });
});
