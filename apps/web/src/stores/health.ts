import { defineStore } from "pinia";
import { ref } from "vue";
import { healthApi } from "../api/health";
export const useHealthStore = defineStore("health", () => {
  const state = ref<"idle" | "loading" | "online" | "offline">("idle");
  const requestId = ref<string | null>(null);
  const errorMessage = ref<string | null>(null);
  async function refresh(): Promise<void> {
    if (state.value === "loading") return;
    state.value = "loading";
    requestId.value = null;
    errorMessage.value = null;
    try {
      const response = await healthApi.getHealth();
      requestId.value = response.requestId;
      state.value = "online";
    } catch {
      requestId.value = null;
      errorMessage.value = "暂时无法连接服务，请稍后重试。";
      state.value = "offline";
    }
  }
  return { state, requestId, errorMessage, refresh };
});
