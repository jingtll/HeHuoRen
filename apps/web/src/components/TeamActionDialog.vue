<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import { roleOptions, type Role } from "../data/team-demo";
const props = defineProps<{ kind: "apply" | "report"; roles: Role[] }>();
const emit = defineEmits<{ close: []; submit: [role: string, note: string] }>();
const dialog = ref<HTMLDialogElement>(),
  role = ref<string>(props.kind === "apply" ? (props.roles[0] ?? "") : ""),
  note = ref(""),
  error = ref("");
const previous = document.activeElement as HTMLElement | null;
onMounted(async () => {
  await nextTick();
  dialog.value?.showModal();
});
onUnmounted(() => {
  dialog.value?.close();
  previous?.focus();
});
function trapFocus(event: KeyboardEvent) {
  if (event.key !== "Tab") return;
  const controls = dialog.value?.querySelectorAll<HTMLElement>(
    'button:not(:disabled), select:not(:disabled), textarea:not(:disabled), input:not(:disabled), [tabindex="0"]',
  );
  if (!controls?.length) return;
  const first = controls[0]!,
    last = controls[controls.length - 1]!;
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      document.activeElement === dialog.value)
  ) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
function submit() {
  if (!role.value || note.value.trim().length > 500) {
    error.value = "请选择意向角色或举报原因；补充说明不能超过 500 字。";
    return;
  }
  emit("submit", role.value, note.value.trim());
}
</script>
<template>
  <dialog
    ref="dialog"
    class="team-dialog w-[calc(100%-2rem)] max-w-lg rounded-panel border border-line bg-surface p-5 text-ink"
    aria-labelledby="action-heading"
    @cancel.prevent="emit('close')"
    @keydown="trapFocus"
  >
    <form novalidate @submit.prevent="submit">
      <div class="flex items-center justify-between gap-3">
        <h2 id="action-heading" class="font-serif text-xl font-semibold">
          {{ kind === "apply" ? "演示申请" : "演示举报" }}
        </h2>
        <button
          type="button"
          class="hhr-button hhr-button--secondary"
          @click="emit('close')"
        >
          关闭
        </button>
      </div>
      <p class="my-4 text-sm text-muted">
        {{
          kind === "apply"
            ? "仅创建会话内待处理申请，不增加成员，不会送达真实队长。"
            : "举报不会外发，也没有实际进入审核。"
        }}
      </p>
      <label for="action-role" class="text-sm">{{
        kind === "apply" ? "角色意向" : "举报原因"
      }}</label>
      <select
        id="action-role"
        v-model="role"
        class="hhr-input mt-2"
        :aria-invalid="!!error"
        aria-describedby="action-error"
      >
        <option value="">请选择</option>
        <template v-if="kind === 'apply'"
          ><option
            v-for="r in roles.filter((r) => roleOptions.includes(r))"
            :key="r"
          >
            {{ r }}
          </option></template
        ><template v-else
          ><option>信息不实</option>
          <option>不当内容</option>
          <option>其他问题</option></template
        >
      </select>
      <label for="action-note" class="mt-4 block text-sm"
        >补充说明（选填，最多 500 字，请勿填写联系方式）</label
      ><textarea
        id="action-note"
        v-model="note"
        class="hhr-input mt-2"
        rows="4"
        maxlength="500"
      />
      <p id="action-error" role="alert" class="mt-2 text-sm text-danger">
        {{ error }}
      </p>
      <button type="submit" class="hhr-button mt-4">
        {{ kind === "apply" ? "提交演示申请" : "提交演示举报" }}
      </button>
    </form>
  </dialog>
</template>
<style scoped>
.team-dialog {
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  margin: auto;
}
.team-dialog::backdrop {
  background: rgb(24 62 48 / 35%);
}
</style>
