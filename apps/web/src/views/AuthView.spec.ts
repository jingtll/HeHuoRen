import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import AuthView from "./AuthView.vue";

describe("登录注册表单", () => {
  let wrapper: ReturnType<typeof mount>;
  afterEach(() => {
    wrapper?.unmount();
    vi.restoreAllMocks();
  });

  async function visit(mode: "login" | "register") {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/login", component: AuthView, props: { mode: "login" } },
        { path: "/register", component: AuthView, props: { mode: "register" } },
      ],
    });
    await router.push(`/${mode}`);
    wrapper = mount(AuthView, {
      props: { mode },
      attachTo: document.body,
      global: { plugins: [router] },
    });
    return router;
  }

  async function fill(values: Record<string, string>) {
    for (const [field, value] of Object.entries(values))
      await wrapper.get(`#auth-${field}`).setValue(value);
  }
  async function submit() {
    await wrapper.get("form").trigger("submit");
    await flushPromises();
  }
  const registration = {
    nickname: "禾苗",
    email: "student@example.com",
    password: "abcdefgh",
    confirmation: "abcdefgh",
    code: "arbitrary-code",
  };

  it("注册空表单逐项提示、关联错误并聚焦第一个错误", async () => {
    await visit("register");
    await submit();
    expect(wrapper.findAll(".auth-error")).toHaveLength(5);
    expect(wrapper.get("#auth-nickname").attributes("aria-describedby")).toBe(
      "auth-nickname-error",
    );
    expect(wrapper.get("#auth-nickname").attributes("aria-invalid")).toBe(
      "true",
    );
    expect(document.activeElement?.id).toBe("auth-nickname");
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it.each([
    [{ nickname: "   " }, "请输入昵称，不能只填写空格"],
    [{ email: "invalid" }, "请输入有效的邮箱地址"],
    [{ password: "1234567", confirmation: "1234567" }, "密码至少需要 8 位"],
    [{ confirmation: "different" }, "两次输入的密码不一致"],
    [{ code: "   " }, "请输入邮箱验证码"],
  ])("注册非法字段有反馈且不显示认证结果：%j", async (invalid, message) => {
    await visit("register");
    await fill({ ...registration, ...invalid });
    await submit();
    expect(wrapper.text()).toContain(message);
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it("注册保留密码空格、不猜验证码格式、不请求或持久化敏感数据", async () => {
    const local = vi.spyOn(Storage.prototype, "setItem");
    const network = vi.spyOn(globalThis, "fetch");
    const router = await visit("register");
    await fill({
      ...registration,
      password: " 123456 ",
      confirmation: " 123456 ",
    });
    await submit();
    expect(wrapper.get('[role="status"]').text()).toBe("认证服务暂未开放");
    expect(
      (wrapper.get("#auth-password").element as HTMLInputElement).value,
    ).toBe(" 123456 ");
    expect(router.currentRoute.value.fullPath).toBe("/register");
    expect(local).not.toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("注册成功");
  });

  it("登录密码只需非空，旧账号短密码不被注册规则拒绝", async () => {
    await visit("login");
    await fill({ email: "student@example.com", password: "x" });
    await submit();
    expect(wrapper.findAll(".auth-error")).toHaveLength(0);
    expect(wrapper.get('[role="status"]').text()).toBe("认证服务暂未开放");
    await wrapper.get("#auth-password").setValue("");
    await submit();
    expect(wrapper.text()).toContain("请输入密码");
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it("密码与确认密码可独立显示隐藏，切换不会提交", async () => {
    await visit("register");
    for (const field of ["password", "confirmation"]) {
      const input = wrapper.get(`#auth-${field}`);
      const button = input.element.parentElement!.querySelector("button")!;
      expect(button.type).toBe("button");
      button.click();
      await flushPromises();
      expect(input.attributes("type")).toBe("text");
      expect(button.getAttribute("aria-pressed")).toBe("true");
      button.click();
      await flushPromises();
      expect(input.attributes("type")).toBe("password");
    }
    expect(wrapper.findAll(".auth-error")).toHaveLength(0);
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it("发送验证码只验证邮箱；缺失接口时无成功状态或倒计时，修改邮箱清除反馈", async () => {
    await visit("register");
    const send = wrapper.get(".auth-send");
    expect(send.attributes("type")).toBe("button");
    await send.trigger("click");
    await flushPromises();
    expect(wrapper.findAll(".auth-error")).toHaveLength(1);
    expect(wrapper.text()).toContain("请输入邮箱");
    await fill({ email: "bad-address" });
    await send.trigger("click");
    expect(wrapper.text()).toContain("请输入有效的邮箱地址");
    await fill({ email: "student@example.com" });
    await send.trigger("click");
    expect(wrapper.get('[role="status"]').text()).toBe("验证码服务暂未开放");
    expect(send.text()).toBe("发送验证码");
    expect(wrapper.text()).not.toContain("已发送");
    await fill({ email: "another@example.com" });
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
    expect(send.attributes("disabled")).toBeUndefined();
  });

  it("修改已确认的密码后提示不一致，修正后错误恢复", async () => {
    await visit("register");
    await fill(registration);
    await fill({ password: "changed-password" });
    expect(wrapper.text()).toContain("两次输入的密码不一致");
    await fill({ confirmation: "changed-password" });
    expect(wrapper.findAll(".auth-error")).toHaveLength(0);
    await submit();
    expect(wrapper.get('[role="status"]').text()).toBe("认证服务暂未开放");
  });
});
