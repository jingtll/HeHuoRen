<script setup lang="ts">
import { useTeamDemoStore } from "../data/team-demo";
const store = useTeamDemoStore();
</script>
<template>
  <div class="mt-5 flex justify-end">
    <button
      type="button"
      class="hhr-button hhr-button--secondary"
      title="清除当前会话内的新建招募和申请，恢复初始演示数据"
      @click="store.reset()"
    >
      重置演示
    </button>
  </div>
</template>
