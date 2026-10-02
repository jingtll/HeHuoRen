<script setup lang="ts">
import { useRoute } from "vue-router";
import { Icon } from "vant";
import type { NavigationSection } from "../router";

const route = useRoute();
const navigation: {
  section: NavigationSection;
  label: string;
  mobile?: string;
  to: string;
  icon: string;
}[] = [
  {
    section: "home",
    label: "首页",
    mobile: "首页",
    to: "/home",
    icon: "wap-home-o",
  },
  {
    section: "teams",
    label: "找队友",
    mobile: "找队友",
    to: "/teams",
    icon: "friends-o",
  },
  {
    section: "my-teams",
    label: "我的队伍",
    mobile: "队伍",
    to: "/my/teams",
    icon: "cluster-o",
  },
  {
    section: "applications",
    label: "申请与邀请",
    mobile: "申请",
    to: "/my/applications",
    icon: "envelop-o",
  },
  {
    section: "favorites",
    label: "我的收藏",
    to: "/my/favorites",
    icon: "star-o",
  },
  {
    section: "notifications",
    label: "站内通知",
    to: "/notifications",
    icon: "bell",
  },
  {
    section: "profile",
    label: "个人资料",
    mobile: "我的",
    to: "/profile",
    icon: "user-o",
  },
];
function current(section: NavigationSection, mobile = false) {
  return (
    route.meta.navigation === section ||
    (mobile &&
      section === "profile" &&
      ["favorites", "notifications"].includes(route.meta.navigation ?? ""))
  );
}
</script>

<template>
  <div class="student-shell">
    <a href="#student-content" class="skip-link hhr-button">跳到正文</a>
    <aside class="student-sidebar">
      <RouterLink to="/home" class="brand-link">
        <span class="brand-symbol" aria-hidden="true">禾</span>
        <span
          ><strong class="font-serif text-2xl">禾伙人</strong
          ><small class="block text-xs text-muted"
            >一起成长，各有所长</small
          ></span
        >
      </RouterLink>
      <p class="my-7 rounded-control border border-line p-3 text-xs text-muted">
        四川农业大学 · 校园比赛与项目组队
      </p>
      <nav aria-label="学生端主导航" class="grid gap-2">
        <RouterLink
          v-for="item in navigation"
          :key="item.section"
          :to="item.to"
          class="student-nav-link"
          :class="{ 'is-current': current(item.section) }"
          :aria-current="current(item.section) ? 'page' : undefined"
        >
          <Icon :name="item.icon" aria-hidden="true" /><span>{{
            item.label
          }}</span>
        </RouterLink>
      </nav>
      <p class="mt-auto pt-8 text-xs leading-6 text-muted">
        从一颗种子开始，<br />和伙伴一起把想法变成可能。
      </p>
    </aside>
    <div class="student-body">
      <header class="student-topbar">
        <RouterLink
          to="/home"
          class="font-serif text-xl font-semibold text-brand"
          >禾伙人</RouterLink
        >
        <nav aria-label="账号入口" class="flex gap-3 text-sm text-brand">
          <RouterLink to="/login" class="rounded-control px-2 py-2"
            >登录</RouterLink
          >
          <RouterLink to="/register" class="hhr-button hhr-button--soft"
            >注册</RouterLink
          >
        </nav>
      </header>
      <main id="student-content" tabindex="-1" class="student-content">
        <RouterView />
      </main>
    </div>
    <nav aria-label="移动端主导航" class="student-bottom-nav">
      <template v-for="item in navigation" :key="item.section">
        <RouterLink
          v-if="item.mobile"
          :to="item.to"
          :class="{ 'is-current': current(item.section, true) }"
          :aria-current="current(item.section, true) ? 'page' : undefined"
        >
          <Icon :name="item.icon" aria-hidden="true" /><span>{{
            item.mobile
          }}</span>
        </RouterLink>
      </template>
    </nav>
  </div>
</template>
