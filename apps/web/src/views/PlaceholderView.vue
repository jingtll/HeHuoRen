<script setup lang="ts">
import { useRoute } from "vue-router";
const route = useRoute();
</script>

<template>
  <section class="hhr-panel placeholder-panel">
    <span class="hhr-badge hhr-badge--warning mb-6">待开发</span>
    <h1 class="font-serif text-3xl font-semibold tracking-tight">
      {{ route.meta.title }}
    </h1>
    <p class="mt-4 max-w-xl leading-7 text-muted">
      {{ route.meta.description }}
    </p>
    <p class="mt-2 text-sm leading-7 text-muted">
      页面正在准备中，期待与你和伙伴在这里相遇。
    </p>
    <nav aria-label="页面相关入口" class="mt-8 flex flex-wrap gap-3">
      <template v-if="route.name === 'home'">
        <RouterLink
          to="/home/competitions/preview"
          class="hhr-button hhr-button--soft"
          >比赛详情 · 占位预览</RouterLink
        >
        <RouterLink to="/teams" class="hhr-button hhr-button--secondary"
          >去找队友</RouterLink
        >
      </template>
      <RouterLink
        v-else-if="route.name === 'competition-detail'"
        to="/home"
        class="hhr-button hhr-button--secondary"
        >返回首页</RouterLink
      >
      <template v-else-if="route.name === 'teams'">
        <RouterLink to="/teams/new" class="hhr-button">发布招募</RouterLink>
        <RouterLink to="/teams/preview" class="hhr-button hhr-button--soft"
          >队伍详情 · 占位预览</RouterLink
        >
      </template>
      <RouterLink
        v-else-if="route.name === 'team-detail' || route.name === 'team-new'"
        to="/teams"
        class="hhr-button hhr-button--secondary"
        >返回找队友</RouterLink
      >
      <template v-else-if="route.name === 'profile'">
        <RouterLink to="/my/favorites" class="hhr-button hhr-button--soft"
          >我的收藏</RouterLink
        >
        <RouterLink to="/notifications" class="hhr-button hhr-button--soft"
          >站内通知</RouterLink
        >
        <RouterLink to="/login" class="hhr-button hhr-button--secondary"
          >登录</RouterLink
        >
        <RouterLink to="/register" class="hhr-button hhr-button--secondary"
          >注册</RouterLink
        >
      </template>
      <RouterLink v-else to="/home" class="hhr-button hhr-button--secondary"
        >返回首页</RouterLink
      >
    </nav>
  </section>
</template>
