import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory } from "vue-router";
import type { CompetitionDetail, CompetitionList } from "@hehuoren/api-types";
import App from "../App.vue";
import { createAppRouter } from "../router";
import { competitionApi } from "../api/competitions";
import {
  fixtureColleges,
  fixtureDetail,
  fixtureList,
} from "../api/competition-test-fixture";
import { parseFilters } from "../data/competition-discovery";
vi.mock("../api/competitions", async (original) => ({
  ...(await original<typeof import("../api/competitions")>()),
  competitionApi: { colleges: vi.fn(), list: vi.fn(), detail: vi.fn() },
}));
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { resolve, promise };
};
describe("异步请求、错误与URL", () => {
  let wrapper: ReturnType<typeof mount>;
  let router: ReturnType<typeof createAppRouter>;
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.mocked(competitionApi.colleges).mockResolvedValue(fixtureColleges);
    vi.mocked(competitionApi.list).mockImplementation(async (f) =>
      fixtureList(f),
    );
    vi.mocked(competitionApi.detail).mockImplementation(async (id) =>
      fixtureDetail(id),
    );
  });
  afterEach(() => {
    wrapper?.unmount();
    if (router) router.listening = false;
    vi.restoreAllMocks();
  });
  async function visit(path = "/home") {
    router = createAppRouter(createMemoryHistory());
    await router.push(path);
    await router.isReady();
    wrapper = mount(App, { global: { plugins: [router, createPinia()] } });
    await flushPromises();
  }
  it("加载、失败和空结果区分；重试可以恢复", async () => {
    const pending = deferred<CompetitionList>();
    vi.mocked(competitionApi.list).mockReturnValueOnce(pending.promise);
    await visit();
    expect(wrapper.text()).toContain("正在加载比赛");
    pending.resolve(fixtureList(parseFilters({ hosts: "" })));
    await flushPromises();
    expect(wrapper.text()).toContain("暂时没有匹配");
    vi.mocked(competitionApi.list).mockRejectedValueOnce(new Error("timeout"));
    await router.push("/home?q=a");
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain("加载失败");
    expect(wrapper.text()).not.toContain("暂时没有匹配");
    await wrapper.get('[role="alert"] button').trigger("click");
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });
  it("目录ID不一致显示明确错误，不能静默匹配", async () => {
    vi.mocked(competitionApi.colleges).mockResolvedValueOnce(
      fixtureColleges.map((c, i) => (i ? c : { ...c, id: "other" })),
    );
    await visit();
    expect(wrapper.get('[role="alert"]').text()).toContain(
      "学院目录与页面资源不一致",
    );
  });
  it("快速筛选忽略迟到结果且取消旧请求", async () => {
    const old = deferred<CompetitionList>();
    vi.mocked(competitionApi.list).mockReturnValueOnce(old.promise);
    await visit();
    const signal = vi.mocked(competitionApi.list).mock.calls[0]![1]!;
    await router.push("/home?hosts=law");
    await flushPromises();
    expect(signal.aborted).toBe(true);
    old.resolve(fixtureList(parseFilters({})));
    await flushPromises();
    expect(wrapper.findAll("[data-competition-card]")).toHaveLength(0);
  });
  it("超页由响应replace纠正，保留无关query且不重复请求", async () => {
    await visit("/home?hosts=economics&page=999&from=review");
    expect(router.currentRoute.value.query).toEqual({
      hosts: "economics",
      from: "review",
    });
    expect(competitionApi.list).toHaveBeenCalledTimes(1);
    expect(wrapper.findAll("[data-competition-card]")).toHaveLength(1);
  });
  it("详情加载失败和404区分；重试不请求列表", async () => {
    vi.mocked(competitionApi.detail).mockRejectedValueOnce(
      new Error("timeout"),
    );
    await visit("/home/competitions/programming-2026-8?page=999");
    expect(wrapper.get('[role="alert"]').text()).toContain("详情加载失败");
    expect(wrapper.text()).not.toContain("比赛不存在");
    await wrapper.get('[role="alert"] button').trigger("click");
    await flushPromises();
    expect(wrapper.get("h1").text()).toBe("大学生程序设计竞赛");
    expect(competitionApi.list).not.toHaveBeenCalled();
    expect(router.currentRoute.value.query.page).toBe("999");
    await router.push("/home/competitions/missing");
    await flushPromises();
    expect(wrapper.get("h1").text()).toBe("比赛不存在");
  });
  it("快速更换详情ID忽略迟到详情", async () => {
    const old = deferred<CompetitionDetail>();
    vi.mocked(competitionApi.detail).mockReturnValueOnce(old.promise);
    await visit("/home/competitions/programming-2026-8");
    await router.push("/home/competitions/biology-2026-15");
    await flushPromises();
    old.resolve(fixtureDetail("programming-2026-8"));
    await flushPromises();
    expect(wrapper.get("h1").text()).toBe("生物学知识与实验技能竞赛");
  });
  it("详情异步渲染后才滚动到赛段锚点", async () => {
    const pending = deferred<CompetitionDetail>();
    const scroll = vi.fn();
    const warnings = vi.spyOn(console, "warn");
    vi.mocked(competitionApi.detail).mockReturnValueOnce(pending.promise);
    vi.spyOn(document, "getElementById").mockImplementation((id) => {
      const element =
        (
          wrapper?.element as HTMLElement | undefined
        )?.querySelector<HTMLElement>(`[id="${id}"]`) ?? null;
      if (element) element.scrollIntoView = scroll;
      return element;
    });
    await visit(
      "/home/competitions/programming-2026-8#programming-2026-campus",
    );
    expect(scroll).not.toHaveBeenCalled();
    pending.resolve(fixtureDetail("programming-2026-8"));
    await flushPromises();
    expect(scroll).toHaveBeenCalledWith({ block: "start" });
    expect(warnings.mock.calls.flat().join(" ")).not.toContain(
      "VUE_ROUTER_R0042",
    );
  });
  it("缺失锚点不交给路由查找；历史滚动位置仍优先", async () => {
    await visit();
    const target = { ...router.currentRoute.value, hash: "#missing-stage" };
    const behavior = router.options.scrollBehavior!;
    expect(await behavior(target, router.currentRoute.value, null)).toEqual({
      top: 0,
    });
    const saved = { left: 0, top: 240 };
    expect(await behavior(target, router.currentRoute.value, saved)).toEqual(
      saved,
    );
  });
});
