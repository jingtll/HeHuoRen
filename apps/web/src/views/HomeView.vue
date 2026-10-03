<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import CollegePicker from "../components/CollegePicker.vue";
import type { CollegeSelection } from "../data/college-selection";

const route = useRoute();
const selectedCollege = ref<CollegeSelection>([]);
</script>

<template>
  <div data-home-content>
    <p class="hhr-eyebrow mb-5">首页 · 校园里的每一种可能</p>
    <div v-if="route.name === 'home'" class="mb-6">
      <CollegePicker v-model="selectedCollege" />
      <p class="mt-3 text-xs leading-6 text-muted">
        学院选择已开放，比赛筛选即将上线。下方为待开发占位内容。
      </p>
    </div>
    <RouterView />
  </div>
</template>
