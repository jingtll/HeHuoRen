<script setup lang="ts">
import { useTeamDemoStore, DEMO_PARTICIPANT } from "../data/team-demo";
const store = useTeamDemoStore();
</script>
<template>
  <aside
    class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-brand-soft p-4 text-sm"
    aria-label="会话内演示说明"
  >
    <div class="min-w-0 flex-1">
      <p class="font-semibold">
        招募为演示数据，操作仅在当前页面会话内生效，刷新后恢复。
      </p>
      <p class="mt-1 text-xs text-muted">
        固定参与者：{{
          DEMO_PARTICIPANT.nickname
        }}。与真实登录独立；申请与举报不会外发。
      </p>
    </div>
    <button
      type="button"
      class="hhr-button hhr-button--secondary"
      @click="store.reset()"
    >
      重置演示
    </button>
  </aside>
</template>
