<template>
  <main
    class="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-5 py-12"
  >
    <RouterLink to="/home" class="brand-link self-start">
      <span class="brand-symbol" aria-hidden="true">禾</span>
      <span
        ><strong class="font-serif text-2xl">禾伙人</strong
        ><small class="block text-xs text-muted"
          >校园比赛与项目组队平台</small
        ></span
      >
    </RouterLink>
    <RouterView />
  </main>
</template>
