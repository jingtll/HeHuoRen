<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  id: string;
  label: string;
  autocomplete: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  secret?: boolean;
  email?: boolean;
}>();
const value = defineModel<string>({ required: true });
defineEmits<{ blur: [] }>();
const visible = ref(false);
</script>

<template>
  <div class="auth-field">
    <label :for="id" class="auth-label">{{ label }}</label>
    <div class="auth-input-row" :class="{ 'has-error': error }">
      <input
        :id="id"
        v-model="value"
        :name="id"
        :type="secret && !visible ? 'password' : email ? 'email' : 'text'"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        :aria-invalid="!!error"
        :aria-describedby="
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        "
        :inputmode="email ? 'email' : undefined"
        :autocapitalize="email ? 'none' : undefined"
        :spellcheck="false"
        required
        class="hhr-input"
        @blur="$emit('blur')"
      />
      <button
        v-if="secret"
        type="button"
        class="auth-reveal"
        :aria-label="`${visible ? '隐藏' : '显示'}${label}`"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        {{ visible ? "隐藏" : "显示" }}
      </button>
      <slot />
    </div>
    <p v-if="error" :id="`${id}-error`" class="auth-error">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="auth-hint">{{ hint }}</p>
  </div>
</template>
