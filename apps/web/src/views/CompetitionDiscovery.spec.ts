import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory } from "vue-router";
import App from "../App.vue";
import { createAppRouter } from "../router";

describe("比赛列表与详情恢复", () => {
  let wrapper: ReturnType<typeof mount>;
  let router: ReturnType<typeof createAppRouter>;
  beforeEach(() => vi.spyOn(window, "scrollTo").mockImplementation(() => {}));
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
  it("全条件直达、详情返回及前进后退均恢复，并保留无关参数", async () => {
    await visit(
      "/home?hosts=all,information-engineering,information-engineering,bad&category=编程&eligible=law&q=程序&from=review",
    );
    expect(router.currentRoute.value.query.hosts).toBe(
      "information-engineering",
    );
    expect(wrapper.findAll("[data-competition-card]")).toHaveLength(1);
    expect(router.currentRoute.value.query.eligible).toBeUndefined();
    expect(router.currentRoute.value.query.category).toBeUndefined();
    expect(wrapper.findAll("select")).toHaveLength(1);
    expect(
      wrapper
        .get('form[aria-label="比赛筛选"]')
        .element.closest(".college-picker"),
    ).not.toBeNull();
    expect(wrapper.get('input[type="search"]').element).toHaveProperty(
      "value",
      "程序",
    );
    await wrapper.get("[data-competition-card] h3 a").trigger("click");
    await flushPromises();
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("个人赛，无需组队"),
    );
    expect(wrapper.text()).toContain("平台组队不等于官方报名");
    expect(wrapper.text()).not.toContain("关联招募 · 待接入");
    router.back();
    await flushPromises();
    expect(router.currentRoute.value.query).toMatchObject({
      hosts: "information-engineering",
      q: "程序",
      from: "review",
    });
    router.forward();
    await flushPromises();
    expect(wrapper.get("h1").text()).toBe("大学生程序设计竞赛");
    await wrapper.get('[aria-label="页面相关入口"] a').trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.name).toBe("home");
    expect(router.currentRoute.value.query.from).toBe("review");
  });
  it("学院状态切换、单独清除及全局重置", async () => {
    await visit("/home?status=unknown&from=review");
    const all = () => wrapper.get(".college-reset");
    await all().trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.query.hosts).toBe("all");
    await all().trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.query.hosts).toBeUndefined();
    await all().trigger("click");
    await flushPromises();
    await wrapper.get('[data-college-id="law"]').trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.query.hosts).toBe("law");
    expect(wrapper.text()).toContain("暂时没有匹配");
    const clear = wrapper
      .findAll("button")
      .find((b) => b.text() === "清除学院条件")!;
    await clear.trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.query.status).toBe("unknown");
    await wrapper
      .findAll("button")
      .find((b) => b.text() === "重置所有筛选")!
      .trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ from: "review" });
    expect(all().attributes("aria-pressed")).toBe("false");
  });
  it("分页后筛选重置到首页，刷新挂载从 URL 恢复", async () => {
    await visit();
    await wrapper
      .findAll("button")
      .find((b) => b.text() === "下一页")!
      .trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.query.page).toBe("2");
    await wrapper.get('[data-college-id="economics"]').trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.query.page).toBeUndefined();
    const path = router.currentRoute.value.fullPath;
    wrapper.unmount();
    router.listening = false;
    await visit(path);
    expect(
      wrapper.get('[data-college-id="economics"]').attributes("aria-pressed"),
    ).toBe("true");
    expect(wrapper.findAll("[data-competition-card]")).toHaveLength(1);
  });
  it("同届院赛各自截止，未知 ID 显示明确返回入口", async () => {
    await visit("/home/competitions/challenge-2027-20?hosts=all");
    expect(wrapper.get("#challenge-20-civil").text()).toContain(
      "2026/10/05 00:00",
    );
    expect(wrapper.get("#challenge-20-resources").text()).toContain(
      "2026/10/10 22:00",
    );
    await router.push("/home/competitions/unknown?hosts=all");
    await flushPromises();
    expect(wrapper.get("h1").text()).toBe("比赛不存在");
    expect(
      wrapper.get('[aria-label="页面相关入口"] a').attributes("href"),
    ).toBe("/home?hosts=all");
  });
});
