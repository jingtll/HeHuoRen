<script setup lang="ts">
import { appIcons, type AppIconName } from "./app-icons";

defineProps<{ name: AppIconName }>();
</script>

<template>
  <component
    :is="appIcons[name]"
    :stroke-width="1.5"
    aria-hidden="true"
    focusable="false"
    class="shrink-0"
  />
</template>
