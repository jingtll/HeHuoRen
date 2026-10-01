import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { healthApi } from "../api/health";
import { useHealthStore } from "./health";

vi.mock("../api/health", () => ({ healthApi: { getHealth: vi.fn() } }));

describe("健康状态", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  it("初始状态为空，成功后显示请求 ID", async () => {
    vi.mocked(healthApi.getHealth).mockResolvedValue({
      status: "ok",
      requestId: "request-123",
    });
    const store = useHealthStore();
    expect(store.state).toBe("idle");
    expect(store.requestId).toBeNull();
    await store.refresh();
    expect(store.state).toBe("online");
    expect(store.requestId).toBe("request-123");
    expect(store.errorMessage).toBeNull();
  });

  it.each(["Network Error", "Request failed with status code 500"])(
    "请求失败时显示统一提示：%s",
    async (message) => {
      vi.mocked(healthApi.getHealth).mockRejectedValue(new Error(message));
      const store = useHealthStore();
      await store.refresh();
      expect(store.state).toBe("offline");
      expect(store.requestId).toBeNull();
      expect(store.errorMessage).toBe("暂时无法连接服务，请稍后重试。");
    },
  );

  it("重试立即进入加载状态并清除旧错误，成功后恢复在线", async () => {
    vi.mocked(healthApi.getHealth).mockRejectedValueOnce(new Error("offline"));
    const store = useHealthStore();
    await store.refresh();
    vi.mocked(healthApi.getHealth).mockResolvedValueOnce({
      status: "ok",
      requestId: "retry-123",
    });
    const pending = store.refresh();
    expect(store.state).toBe("loading");
    expect(store.errorMessage).toBeNull();
    await pending;
    expect(store.state).toBe("online");
    expect(store.requestId).toBe("retry-123");
  });

  it("失败后清除上次成功的请求 ID", async () => {
    vi.mocked(healthApi.getHealth).mockResolvedValueOnce({
      status: "ok",
      requestId: "old-id",
    });
    const store = useHealthStore();
    await store.refresh();
    vi.mocked(healthApi.getHealth).mockRejectedValueOnce(new Error("offline"));
    await store.refresh();
    expect(store.requestId).toBeNull();
    expect(store.state).toBe("offline");
  });
});
