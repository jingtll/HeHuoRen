<script setup lang="ts">
import ProjectLogo from "../components/ProjectLogo.vue";
</script>

<template>
  <main
    class="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-5 py-12"
  >
    <RouterLink to="/home" class="brand-link self-start">
      <ProjectLogo />
      <span
        ><strong class="font-serif text-xl">禾伙人</strong
        ><small class="block text-xs text-muted"
          >校园比赛与项目组队平台</small
        ></span
      >
    </RouterLink>
    <RouterView />
  </main>
</template>
