import { createRouter, createWebHistory } from "vue-router";
import HealthView from "../views/HealthView.vue";
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/health", component: HealthView },
    { path: "/", redirect: "/health" },
    { path: "/:pathMatch(.*)*", redirect: "/health" },
  ],
});
