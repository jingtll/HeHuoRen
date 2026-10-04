<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import CollegePicker from "../components/CollegePicker.vue";
import { DEMO_NOW, originLabels } from "../data/competitions";
import {
  collegeNames,
  filterEntries,
  formatTime,
  materialDeadlineLabel,
  PAGE_SIZE,
  parseFilters,
  scopeLabel,
  stageStatus,
  statuses,
  writeFilters,
  type Filters,
} from "../data/competition-discovery";

const route = useRoute();
const router = useRouter();
const filters = computed(() => parseFilters(route.query));
const search = ref(filters.value.q);
watch(
  () => filters.value.q,
  (value) => {
    search.value = value;
  },
);
const entries = computed(() => filterEntries(filters.value));
const pages = computed(() =>
  Math.max(1, Math.ceil(entries.value.length / PAGE_SIZE)),
);
const visible = computed(() =>
  entries.value.slice(
    (filters.value.page - 1) * PAGE_SIZE,
    filters.value.page * PAGE_SIZE,
  ),
);
const competitionCount = computed(
  () => new Set(entries.value.map((e) => e.competition.id)).size,
);
function update(patch: Partial<Filters>, page = 1) {
  void router.push({
    name: "home",
    query: writeFilters(route.query, { ...filters.value, ...patch, page }),
  });
}
function choice(event: Event) {
  return (event.target as HTMLSelectElement).value;
}
function reset() {
  search.value = "";
  update({ ...parseFilters({}) });
}
</script>

<template>
  <header class="mb-7">
    <p class="hhr-eyebrow">校园里的每一种可能</p>
    <h1 class="font-serif text-3xl font-semibold">发现比赛，找到同路人</h1>
    <p class="mt-3 text-sm text-muted">
      从一场比赛开始，让想法生根，让各有所长的伙伴相遇。
    </p>
  </header>
  <div
    class="grid items-start gap-5 min-[1100px]:grid-cols-[340px_minmax(0,1fr)]"
  >
    <CollegePicker
      compact
      :model-value="filters.hosts"
      @update:model-value="update({ hosts: $event })"
    >
      <template #footer>
        <form
          aria-label="比赛筛选"
          class="grid grid-cols-[minmax(0,1fr)_auto] gap-0.5"
          @submit.prevent="update({ q: search.trim().slice(0, 100) })"
        >
          <div class="col-span-2 flex min-w-0 gap-1.5">
            <input
              v-model="search"
              type="search"
              class="hhr-input discovery-filter-control h-8 min-h-0 min-w-0 px-2 py-0 text-xs"
              placeholder="搜索比赛名称、届次"
              maxlength="100"
              aria-label="搜索比赛"
            />
            <button
              type="submit"
              class="hhr-button h-8 min-h-0 shrink-0 px-3 py-0 text-xs"
            >
              搜索
            </button>
          </div>
          <select
            class="hhr-input discovery-filter-control h-8 min-h-0 min-w-0 px-2 py-0 text-xs"
            aria-label="报名状态"
            :value="filters.status"
            @change="update({ status: choice($event) as Filters['status'] })"
          >
            <option value="">全部状态</option>
            <option
              v-for="(label, status) in statuses"
              :key="status"
              :value="status"
            >
              {{ label }}
            </option>
          </select>
          <div class="flex items-center justify-end text-[11px]">
            <div class="flex gap-2">
              <button
                type="button"
                class="min-h-8 text-brand"
                @click="update({ hosts: [] })"
              >
                清除学院条件
              </button>
              <button type="button" class="min-h-8 text-brand" @click="reset">
                重置所有筛选
              </button>
            </div>
          </div>
        </form>
      </template>
    </CollegePicker>
    <section class="min-w-0" aria-label="比赛发现">
      <p class="my-4 text-xs leading-6 text-muted">
        样例时间基准：{{
          formatTime(DEMO_NOW)
        }}（北京时间）。状态为演示，名额及最新安排以官方通知为准。
      </p>
      <div class="mb-3 flex items-center justify-between gap-3">
        <h2 class="font-serif text-xl font-semibold">比赛一览</h2>
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          class="text-xs text-brand"
        >
          {{ competitionCount }} 项比赛 · {{ entries.length }} 个赛段
        </p>
      </div>
      <div v-if="!entries.length" class="hhr-panel py-10 text-center">
        <h3 class="font-semibold">暂时没有匹配的比赛</h3>
        <p class="mt-2 text-sm text-muted">
          试试其他学院或放宽筛选，学院入口仍可继续选择。
        </p>
        <button
          type="button"
          class="hhr-button hhr-button--soft mt-4"
          @click="reset"
        >
          重置所有筛选
        </button>
      </div>
      <div v-else class="grid gap-3">
        <article
          v-for="{ competition, stage } in visible"
          :key="stage.id"
          class="hhr-card p-5"
          data-competition-card
        >
          <div class="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span class="hhr-badge">{{ competition.category }}</span
            ><span class="text-muted">{{ competition.edition }}</span>
            <span class="hhr-badge hhr-badge--muted">{{
              originLabels[competition.origin]
            }}</span>
          </div>
          <h3 class="font-serif text-lg font-semibold">
            <RouterLink
              :to="{
                name: 'competition-detail',
                params: { id: competition.id },
                query: route.query,
                hash: '#' + stage.id,
              }"
              class="inline-block py-1 text-brand hover:underline"
              >{{ competition.name }}</RouterLink
            >
          </h3>
          <p class="mt-1 text-sm">{{ stage.name }}</p>
          <dl
            class="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs leading-6"
          >
            <dt class="text-muted">承办学院</dt>
            <dd>{{ collegeNames(stage.hosts) }}</dd>
            <dt class="text-muted">参赛范围</dt>
            <dd>{{ scopeLabel(stage.scope) }}</dd>
          </dl>
          <p class="mt-2 text-xs leading-6 text-muted">
            {{ stage.scope.note }}
          </p>
          <div class="mt-3 border-t border-line pt-3 text-xs">
            <span class="font-semibold text-brand">{{
              statuses[stageStatus(stage)]
            }}</span>
            <p class="mt-1">
              报名截止：{{
                stage.conflict ? "时间待核对" : formatTime(stage.deadline)
              }}
            </p>
            <p v-if="stage.materialsAt">
              材料截止：{{ materialDeadlineLabel(stage.materialsAt) }}
            </p>
          </div>
        </article>
      </div>
      <nav
        v-if="entries.length"
        aria-label="比赛分页"
        class="mt-5 flex flex-wrap items-center justify-between gap-2"
      >
        <button
          type="button"
          class="hhr-button hhr-button--secondary"
          :disabled="filters.page <= 1"
          @click="update({}, filters.page - 1)"
        >
          上一页
        </button>
        <span class="text-xs text-muted"
          >第 {{ filters.page }} / {{ pages }} 页</span
        >
        <button
          type="button"
          class="hhr-button hhr-button--secondary"
          :disabled="filters.page >= pages"
          @click="update({}, filters.page + 1)"
        >
          下一页
        </button>
      </nav>
    </section>
  </div>
</template>

<style scoped>
.discovery-filter-control:focus-visible {
  outline-width: 2px;
  outline-offset: -2px;
}
</style>
