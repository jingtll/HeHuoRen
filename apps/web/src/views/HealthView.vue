<script setup lang="ts">
import { computed, onMounted } from "vue";
import ProjectLogo from "../components/ProjectLogo.vue";
import { useHealthStore } from "../stores/health";
const health = useHealthStore();
const statusText = computed(
  () =>
    ({
      idle: "等待检查",
      loading: "正在连接",
      online: "服务在线",
      offline: "服务离线",
    })[health.state],
);
onMounted(() => {
  void health.refresh();
});
</script>
<template>
  <main
    class="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-12"
  >
    <header class="mb-8">
      <p class="hhr-eyebrow">HEHUOREN</p>
      <div class="brand-link">
        <ProjectLogo />
        <h1 class="font-serif text-[28px] font-semibold tracking-tight">
          禾伙人
        </h1>
      </div>
      <p class="mt-3 text-sm leading-7 text-muted">校园比赛与项目组队平台</p>
    </header>
    <section
      aria-labelledby="health-heading"
      class="hhr-panel overflow-hidden p-6"
    >
      <div class="mb-6 flex items-center justify-between gap-4">
        <h2 id="health-heading" class="text-lg font-semibold">服务状态</h2>
        <van-tag
          :type="
            health.state === 'online'
              ? 'success'
              : health.state === 'offline'
                ? 'danger'
                : 'default'
          "
          size="large"
          >{{ statusText }}</van-tag
        >
      </div>
      <div
        role="status"
        aria-live="polite"
        :aria-busy="health.state === 'loading'"
      >
        <van-loading v-if="health.state === 'loading'" size="20px" class="mb-5"
          >正在检查服务…</van-loading
        >
        <p v-else-if="health.errorMessage" class="mb-5 text-sm text-danger">
          {{ health.errorMessage }}
        </p>
        <p
          v-else-if="health.state === 'online'"
          class="mb-5 text-sm text-muted"
        >
          连接正常，可以访问服务。
        </p>
        <van-cell
          title="请求 ID"
          :value="health.requestId ?? '—'"
          class="request-id"
        />
      </div>
      <van-button
        type="primary"
        block
        class="mt-6"
        :loading="health.state === 'loading'"
        :disabled="health.state === 'loading'"
        @click="health.refresh()"
        >{{ health.state === "offline" ? "重试连接" : "刷新状态" }}</van-button
      >
    </section>
    <p class="mt-5 text-xs leading-6 text-muted">
      工程初始化阶段 · 比赛、招募与申请功能将在后续阶段开放。
    </p>
  </main>
</template>
