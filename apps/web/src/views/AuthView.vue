<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { Button } from "vant";
import AuthInput from "../components/AuthInput.vue";

const props = defineProps<{ mode: "login" | "register" }>();
const registering = computed(() => props.mode === "register");
type Field = "nickname" | "email" | "password" | "confirmation" | "code";
const values = reactive<Record<Field, string>>({
  nickname: "",
  email: "",
  password: "",
  confirmation: "",
  code: "",
});
const errors = reactive<Partial<Record<Field, string>>>({});
const feedback = ref("");
const form = ref<HTMLFormElement>();
const fields = computed<Field[]>(() =>
  registering.value
    ? ["nickname", "email", "password", "confirmation", "code"]
    : ["email", "password"],
);

function validate(field: Field) {
  const value = values[field];
  let message = "";
  if (field === "nickname" && !value.trim())
    message = "请输入昵称，不能只填写空格";
  if (field === "email") {
    if (!value.trim()) message = "请输入邮箱";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
      message = "请输入有效的邮箱地址";
  }
  if (field === "password") {
    if (!value) message = "请输入密码";
    else if (registering.value && Array.from(value).length < 8)
      message = "密码至少需要 8 位";
  }
  if (field === "confirmation") {
    if (!value) message = "请再次输入密码";
    else if (value !== values.password) message = "两次输入的密码不一致";
  }
  if (field === "code" && !value.trim()) message = "请输入邮箱验证码";
  errors[field] = message;
  return !message;
}

async function focusField(field: Field) {
  await nextTick();
  form.value?.querySelector<HTMLInputElement>(`#auth-${field}`)?.focus();
}

function submit() {
  feedback.value = "";
  fields.value.forEach(validate);
  const invalid = fields.value.find((field) => errors[field]);
  if (invalid) {
    void focusField(invalid);
    return;
  }
  // 真实 OpenAPI 当前只有健康接口；不创建会话或模拟请求成功。
  feedback.value = "认证服务暂未开放";
}

function sendCode() {
  feedback.value = "";
  if (!validate("email")) {
    void focusField("email");
    return;
  }
  feedback.value = "验证码服务暂未开放";
}

watch(values, () => {
  feedback.value = "";
  fields.value.forEach((field) => {
    if (errors[field]) validate(field);
  });
  if (values.confirmation) validate("confirmation");
});
</script>

<template>
  <section
    class="hhr-panel auth-panel p-8 max-md:px-5 max-md:py-6"
    aria-labelledby="auth-heading"
  >
    <p class="hhr-eyebrow">
      {{ registering ? "GROW TOGETHER" : "WELCOME BACK" }}
    </p>
    <h1
      id="auth-heading"
      class="font-serif text-3xl font-semibold tracking-tight"
    >
      {{ registering ? "注册" : "登录" }}
    </h1>
    <p class="auth-intro">
      {{
        registering
          ? "从认识彼此开始，一起让想法生根。"
          : "欢迎回来，继续寻找你的校园伙伴。"
      }}
    </p>
    <form ref="form" class="auth-form" novalidate @submit.prevent="submit">
      <AuthInput
        v-if="registering"
        id="auth-nickname"
        v-model="values.nickname"
        label="昵称"
        autocomplete="nickname"
        placeholder="希望伙伴怎么称呼你"
        :error="errors.nickname"
        @blur="validate('nickname')"
      />
      <AuthInput
        id="auth-email"
        v-model="values.email"
        label="邮箱"
        email
        autocomplete="email"
        placeholder="请输入邮箱地址"
        :error="errors.email"
        @blur="validate('email')"
      />
      <AuthInput
        id="auth-password"
        v-model="values.password"
        label="密码"
        secret
        :autocomplete="registering ? 'new-password' : 'current-password'"
        :placeholder="registering ? '至少 8 位，不限制字符组合' : '请输入密码'"
        :error="errors.password"
        @blur="validate('password')"
      />
      <AuthInput
        v-if="registering"
        id="auth-confirmation"
        v-model="values.confirmation"
        label="确认密码"
        secret
        autocomplete="new-password"
        placeholder="请再次输入密码"
        :error="errors.confirmation"
        @blur="validate('confirmation')"
      />
      <AuthInput
        v-if="registering"
        id="auth-code"
        v-model="values.code"
        label="邮箱验证码"
        autocomplete="one-time-code"
        placeholder="请输入验证码"
        hint="验证码服务暂未开放，暂时无法获取验证码。"
        :error="errors.code"
        @blur="validate('code')"
      >
        <Button native-type="button" class="auth-send" @click="sendCode"
          >发送验证码</Button
        >
      </AuthInput>
      <p class="auth-service-note">
        账号服务暂未开放，当前可先浏览首页与找队友。
      </p>
      <p v-if="feedback" class="auth-feedback" role="status" aria-live="polite">
        {{ feedback }}
      </p>
      <Button native-type="submit" type="primary" block class="auth-submit">
        {{ registering ? "注册" : "登录" }}
      </Button>
    </form>
    <p class="auth-switch">
      {{ registering ? "已经有账号？" : "还没有账号？" }}
      <RouterLink :to="registering ? '/login' : '/register'">
        {{ registering ? "前往登录" : "前往注册"
        }}<span aria-hidden="true"> →</span>
      </RouterLink>
    </p>
  </section>
</template>
