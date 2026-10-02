import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory } from "vue-router";
import { Button, Cell, Loading, Tag } from "vant";
import App from "../App.vue";
import { healthApi } from "../api/health";
import { createAppRouter } from "./index";

vi.mock("../api/health", () => ({ healthApi: { getHealth: vi.fn() } }));

const pages = [
  ["/home", "首页", "home"],
  ["/home/competitions/preview?from=home", "比赛详情", "competition-detail"],
  ["/teams", "找队友", "teams"],
  ["/teams/42?role=dev", "队伍详情", "team-detail"],
  ["/teams/new", "发布招募", "team-new"],
  ["/my/teams", "我的队伍", "my-teams"],
  ["/my/applications", "申请与邀请", "applications"],
  ["/my/favorites", "我的收藏", "favorites"],
  ["/notifications", "站内通知", "notifications"],
  ["/profile", "个人资料", "profile"],
  ["/login", "登录", "login"],
  ["/register", "注册", "register"],
] as const;

describe("学生端路由", () => {
  let wrapper: ReturnType<typeof mount> | undefined;
  const routers: ReturnType<typeof createAppRouter>[] = [];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    routers.splice(0).forEach((router) => (router.listening = false));
    vi.restoreAllMocks();
  });

  async function visit(path: string) {
    const router = createAppRouter(createMemoryHistory());
    routers.push(router);
    await router.push(path);
    await router.isReady();
    wrapper = mount(App, {
      global: { plugins: [router, createPinia(), Button, Cell, Loading, Tag] },
    });
    await flushPromises();
    return router;
  }

  it("默认入口进入首页，比赛详情保留首页内容区域与导航归属", async () => {
    const router = await visit("/");
    expect(router.currentRoute.value.path).toBe("/home");
    expect(wrapper!.get("h1").text()).toBe("首页");
    await wrapper!.get('a[href="/home/competitions/preview"]').trigger("click");
    await flushPromises();
    expect(wrapper!.get("[data-home-content] h1").text()).toBe("比赛详情");
    expect(router.currentRoute.value.meta.navigation).toBe("home");
    expect(
      wrapper!
        .get('nav[aria-label="学生端主导航"] a[aria-current="page"]')
        .text(),
    ).toBe("首页");
    await wrapper!.get('[aria-label="页面相关入口"] a').trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/home");
  });

  it.each(pages)(
    "直接访问 %s 显示 %s 的待开发页",
    async (path, title, name) => {
      const router = await visit(path);
      expect(wrapper!.get("h1").text()).toBe(title);
      expect(wrapper!.text()).toContain("待开发");
      expect(document.title).toBe(`${title} · 禾伙人`);
      expect(router.currentRoute.value.name).toBe(name);
      expect(healthApi.getHealth).not.toHaveBeenCalled();
    },
  );

  it.each(["/teams/new", "/teams/preview"])("%s 高亮找队友", async (path) => {
    await visit(path);
    expect(
      wrapper!
        .get('nav[aria-label="学生端主导航"] a[aria-current="page"]')
        .text(),
    ).toBe("找队友");
    expect(
      wrapper!
        .get('nav[aria-label="移动端主导航"] a[aria-current="page"]')
        .text(),
    ).toBe("找队友");
  });

  it.each(["/my/favorites", "/notifications"])(
    "移动端 %s 归入我的",
    async (path) => {
      await visit(path);
      expect(
        wrapper!
          .get('nav[aria-label="移动端主导航"] a[aria-current="page"]')
          .text(),
      ).toBe("我的");
    },
  );

  it("个人资料提供收藏、通知与账号入口", async () => {
    await visit("/profile");
    for (const path of [
      "/my/favorites",
      "/notifications",
      "/login",
      "/register",
    ]) {
      expect(
        wrapper!.find(`[aria-label="页面相关入口"] a[href="${path}"]`).exists(),
      ).toBe(true);
    }
  });

  it.each(["/missing/deep?x=1", "/competitions", "/competitions/42"])(
    "未知地址 %s 显示独立 404",
    async (path) => {
      const router = await visit(path);
      expect(router.currentRoute.value.name).toBe("not-found");
      expect(wrapper!.get("h1").text()).toBe("页面不存在");
      expect(wrapper!.find(".student-shell").exists()).toBe(false);
      expect(wrapper!.get('a.hhr-button[href="/home"]').text()).toBe(
        "返回首页",
      );
      expect(healthApi.getHealth).not.toHaveBeenCalled();
    },
  );

  it("健康页独立保留，首次失败后重试和刷新仍能正常请求", async () => {
    vi.mocked(healthApi.getHealth)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ status: "ok", requestId: "retry-7" })
      .mockResolvedValueOnce({ status: "ok", requestId: "refresh-7" });
    const router = await visit("/health");
    expect(router.currentRoute.value.name).toBe("health");
    expect(wrapper!.find(".student-shell").exists()).toBe(false);
    expect(wrapper!.text()).toContain("服务离线");
    await wrapper!.get("button").trigger("click");
    await flushPromises();
    expect(wrapper!.text()).toContain("retry-7");
    await wrapper!.get("button").trigger("click");
    await flushPromises();
    expect(wrapper!.text()).toContain("refresh-7");
    expect(healthApi.getHealth).toHaveBeenCalledTimes(3);
  });
});
