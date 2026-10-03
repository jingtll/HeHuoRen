# 禾伙人阶段一工程骨架实施计划

> 历史材料：本文件与关联截图记录移除 Vant 前的阶段事实，不作为迁移后验收结果。现行样式方案见 [ADR 0002](../../adr/0002-student-styling-and-uni-app.md)，新验收见 [Issue #19](../../issue-19-validation.md)。

> 本文件保留阶段一的历史实施步骤与验收记录。后续工作遵循根目录 `AGENTS.md` 与 `docs/agents/` 中的现行约定；步骤使用复选框记录完成状态。

**Goal:** 建立 Node.js 24 + pnpm Monorepo，让 Vue 3 Web 通过 Pinia 和 Vite 代理读取 NestJS/Fastify API 的真实健康状态，并提供可重复生成的 OpenAPI 类型与 CI 质量门禁。

**Architecture:** 根工作区统一管理 `apps/web`、`apps/api` 和 `packages/api-types`。API 维护版本化路由、环境校验、统一错误响应与 Swagger；Swagger JSON 驱动纯类型包生成。Web 的 Axios API 模块读取生成类型，Pinia health store 管理加载、在线和离线状态。GitHub Actions 在 PR 与 `main` 推送上运行同一套质量检查。

**Tech Stack:** Node.js 24.x（最低 24.15.0）、pnpm 10.30.3、TypeScript、Vue 3、Vite、Pinia、Vant、Tailwind CSS、Vue Router、Axios、NestJS、Fastify、Swagger、Jest、Vitest、ESLint、Prettier、GitHub Actions。

**Spec:** `docs/superpowers/specs/2026-10-01-phase-one-foundation-design.md`

## Global Constraints

- `.nvmrc` 使用 `24` 主版本；根 `package.json` 的 `engines.node` 为 `>=24.15.0 <25`，并声明 `"packageManager": "pnpm@10.30.3"`。
- 工作区目录和包名固定为 `apps/web` (`@hehuoren/web`)、`apps/api` (`@hehuoren/api`)、`packages/api-types` (`@hehuoren/api-types`)；跨包依赖使用 `workspace:*`。
- 健康路由为 `GET /api/v1/health`，成功结构为 `{ status, requestId }`；健康响应不包含系统、环境、密钥或数据库细节。
- 统一错误结构为 `{ code, message, requestId, details? }`；未知异常返回通用 500 文案，响应体不得含堆栈。
- Pinia 只注册一个 health store；不增加持久化或比赛、队伍等业务 store。
- API 类型只能由 OpenAPI 生成；生成命令不得要求学校网站、生产密钥或数据库。
- 不实现阶段二及以后的业务功能，不添加数据库、认证、生产部署或真实业务数据。
- Actions 必须固定到核验过的完整提交 SHA；工作流权限保持 `contents: read`，PR 质量检查不得按路径跳过。
- 本计划不推送到远端；先检查并确认远端历史与认证可用后，才另行推送本地提交。

## Review Focus

- `PORT` 缺失时使用文档中的默认值，非法端口令启动校验失败；在 API 配置单元测试中固定这两种行为（Task 2）。
- API 健康接口成功时生成非空请求 ID，且只暴露公开状态字段；在 Fastify 注入集成测试中断言响应结构与内容（Task 2）。
- 未知异常不得泄露内部错误消息或堆栈，且响应仍带请求 ID；在全局异常过滤器单元测试中覆盖（Task 2）。
- Web 收到健康响应后进入在线状态，网络拒绝或非 2xx 后进入离线状态并保留可读错误；在 Pinia/Vitest 测试中覆盖（Task 4）。
- OpenAPI schema 变更后必须生成可编译的类型，未提交生成差异必须令 CI 失败；在生成命令与 CI 同步检查中覆盖（Task 3、Task 5）。

---

### Task 1: 初始化 pnpm 工作区与 Vue Web 工程

**Files:**

- Create: `.nvmrc`
- Create: `.npmrc`
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `.gitignore`
- Create: `.prettierignore`
- Create: `eslint.config.mjs`
- Create: `apps/web/**`（Vite Vue + TypeScript 骨架）

**Interfaces:**

- Produces: 工作区根配置与 `@hehuoren/web` 包；根命令 `dev`、`lint`、`format:check`、`typecheck`、`api:generate`、`build`、`test:unit`、`test:integration`、`test:e2e`。

- [x] **Step 1: 建立 Node 与 pnpm 根配置**

写入 `.nvmrc`：

```text
24
```

写入 `.npmrc`：

```ini
engine-strict=true
save-exact=true
```

写入 `pnpm-workspace.yaml`：

```yaml
packages:
  - apps/*
  - packages/*
```

根 `package.json` 使用下列身份与命令；依赖安装后为每条命令添加其对应的本地工具：

```json
{
  "name": "hehuoren",
  "private": true,
  "packageManager": "pnpm@10.30.3",
  "engines": { "node": ">=24.15.0 <25" },
  "scripts": {
    "dev": "pnpm --parallel --filter @hehuoren/api --filter @hehuoren/web dev",
    "lint": "pnpm -r --if-present lint",
    "format:check": "prettier --check .",
    "typecheck": "pnpm -r --if-present typecheck",
    "api:generate": "pnpm --filter @hehuoren/api openapi:write && pnpm --filter @hehuoren/api-types generate",
    "build": "pnpm -r --if-present build",
    "test:unit": "pnpm -r --if-present test:unit",
    "test:integration": "pnpm --filter @hehuoren/api test:integration",
    "test:e2e": "pnpm --filter @hehuoren/api test:e2e"
  }
}
```

根 `.gitignore` 至少忽略 `node_modules/`、`dist/`、`coverage/`、`.env`、`.env.*`（保留 `.env.example`）、`.turbo/`、`playwright-report/`、`test-results/` 和操作系统生成文件。

- [x] **Step 2: 生成 Vue + TypeScript 应用并设定工作区包名**

运行：

```bash
pnpm create vite apps/web --template vue-ts --no-interactive
```

`--no-interactive` prevents CI or non-TTY execution from waiting at the generator prompts; this flag is supported by the [Vite project scaffolding command](https://vite.dev/guide/#scaffolding-your-first-vite-project).

把 `apps/web/package.json` 的 `name` 改为 `@hehuoren/web`。移除 Vite 演示组件和演示样式，保留可启动的 `index.html`、`src/main.ts`、`src/App.vue`、Vite 配置及 TypeScript 配置。为 web 包配置 `dev: "vite"`、`build: "vue-tsc -b && vite build"`、`lint: "eslint ."` 和 `typecheck: "vue-tsc -b --pretty false"` 脚本。

- [x] **Step 3: 配置统一 lint 与格式检查**

运行 `pnpm add -Dw eslint @eslint/js typescript-eslint eslint-plugin-vue globals prettier`。根 ESLint flat config 使用这些本地依赖，覆盖 TypeScript/Vue 文件，忽略 `**/dist/**`、`**/coverage/**`、`**/src/generated/**`。配置内容为：

```js
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/coverage/**", "**/src/generated/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    files: ["apps/web/**/*.{ts,vue}"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["apps/api/**/*.ts", "packages/**/*.ts", "**/*.config.*"],
    languageOptions: { globals: globals.node },
  },
);
```

在根 `package.json` 增加 `lint: "pnpm -r --if-present lint"` 和 `format:check: "prettier --check ."`；`.prettierignore` 排除 `node_modules`、构建输出、浏览器测试输出与 lockfile。web 包和 API 包各自实现 `lint: "eslint ."` 脚本。

- [x] **Step 4: 安装并检查工作区骨架**

运行 `pnpm install` 生成唯一根 `pnpm-lock.yaml`。先执行 `pnpm exec prettier --write package.json pnpm-workspace.yaml apps/web`，再运行 `pnpm --filter @hehuoren/web build` 和 `pnpm exec prettier --check package.json pnpm-workspace.yaml apps/web`。

预期：干净的 Vue 应用可构建；pnpm 只在仓库根创建锁文件。

- [x] **Step 5: 提交工作区骨架**

```bash
git add .nvmrc .npmrc .gitignore .prettierignore package.json pnpm-workspace.yaml pnpm-lock.yaml eslint.config.mjs apps/web
git commit -m "chore: initialize pnpm monorepo and Vue app"
```

### Task 2: 构建 NestJS/Fastify 健康 API 与安全错误处理

**Files:**

- Create: `apps/api/**`（Nest CLI TypeScript 骨架）
- Create: `apps/api/.env.example`
- Create: `apps/api/src/config/env.validation.ts`
- Create: `apps/api/src/configure-app.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/health/health.service.ts`
- Create: `apps/api/src/health/health-response.dto.ts`
- Create: `apps/api/src/common/filters/api-exception.filter.ts`
- Create: `apps/api/src/common/filters/api-exception.filter.spec.ts`
- Create: `apps/api/src/common/pipes/global-validation.pipe.ts`
- Create: `apps/api/src/common/pipes/global-validation.pipe.spec.ts`
- Create: `apps/api/src/config/env.validation.spec.ts`
- Create: `apps/api/test/jest-integration.json`
- Create: `apps/api/test/jest-e2e.json`
- Create: `apps/api/scripts/write-openapi.ts`
- Create: `apps/api/test/health.integration-spec.ts`
- Create: `apps/api/test/health.e2e-spec.ts`
- Delete: Nest CLI 默认 Hello World 的 `apps/api/src/app.controller.ts`、`apps/api/src/app.controller.spec.ts`、`apps/api/src/app.service.ts`、`apps/api/test/app.e2e-spec.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/package.json`

**Interfaces:**

- Consumes: Task 1 workspace and pnpm settings.
- Produces: `configureApp(app)` returns the Swagger `OpenAPIObject` and applies the `api/v1` prefix, global pipes/filter, and Swagger; `GET /api/v1/health` returns `{ status: 'ok', requestId: string }`; Swagger serves `/docs` and `/docs-json`; `openapi:write` writes `apps/api/openapi.json` without listening on a network port.
- Produces: Fastify request ID is the sole correlation ID source; all API errors use `{ code, message, requestId, details? }`.

- [x] **Step 1: 使用 Nest CLI 建立 strict TypeScript 服务骨架**

运行：

```bash
pnpm dlx @nestjs/cli new hehuoren-api --directory apps/api --package-manager pnpm --skip-git --skip-install --strict --language TS --no-observe
```

将包名改为 `@hehuoren/api`。用 `@nestjs/platform-fastify` 替换 `@nestjs/platform-express`；删除 CLI 默认 Hello World controller/service、Vitest 配置与对应测试；添加 `@nestjs/config`、`@nestjs/swagger`、`@fastify/static`、`class-validator`、`class-transformer`、`joi`、`fastify`，以及 Jest、`ts-jest`、`@types/jest`、`@jest/globals`。`@fastify/static` 是 Swagger UI 在 Fastify adapter 下挂载静态资源所需的 peer dependency。将 CLI 生成的 `test`、`build`、`start` 命令改为 Jest、`nest build` 和 Nest start，设置 `dev` 启动 `nest start --watch`，默认端口为 `3001`。

Nest CLI v12 默认生成 ESM 包与 Vitest 配置；为保持本计划选用 Jest，API 使用 `"type": "module"` 与 `NodeNext` 编译，Jest/ts-jest 以 ESM 模式运行。Jest 脚本通过 `node --experimental-vm-modules ./node_modules/jest/bin/jest.js` 启动。安装与移除依赖时运行 `pnpm --filter @hehuoren/api add @nestjs/platform-fastify @nestjs/config @nestjs/swagger @fastify/static class-validator class-transformer joi fastify`、`pnpm --filter @hehuoren/api remove @nestjs/platform-express` 和 `pnpm --filter @hehuoren/api add -D jest ts-jest @types/jest @jest/globals`；仓库 `.npmrc` 将保存版本固定为精确值。

在本任务开始时定义 `test:unit`、`test:integration` 与 `test:e2e` 脚本，分别使用 `test/jest-unit.json`、`test/jest-integration.json` 与 `test/jest-e2e.json` 配置并追加 `--runInBand`。三份配置使用 `rootDir: ".."`、`testEnvironment: "node"`、`extensionsToTreatAsEsm: [".ts"]`、将相对导入的 `.js` 后缀映射到 TypeScript 源文件，并通过 `transform: { "^.+\\.ts$": ["ts-jest", { "useESM": true }] }` 编译测试。运行 `pnpm install` 安装依赖。

- [x] **Step 2: 先写环境校验单元测试**

在 `src/config/env.validation.spec.ts` 固定默认端口和非法端口：

```ts
describe("validateEnvironment", () => {
  it("defaults PORT to 3001 when it is missing", () => {
    expect(validateEnvironment({ NODE_ENV: "test" }).PORT).toBe(3001);
  });

  it("rejects a PORT outside the TCP port range", () => {
    expect(() => validateEnvironment({ PORT: "70000" })).toThrow();
  });
});
```

运行 `pnpm --filter @hehuoren/api test:unit -- src/config/env.validation.spec.ts`；预期先因校验函数未实现而失败。

- [x] **Step 3: 实现环境校验并重跑单元测试**

导出 `validateEnvironment(config: Record<string, unknown>)`。使用 Joi 将 `NODE_ENV` 限制为 `development | test | production`，默认 `development`；将 `PORT` 解析为 `1..65535` 的整数，默认 `3001`。非法值抛出 Joi 校验错误，Nest 启动失败。`apps/api/.env.example` 只列 `NODE_ENV=development` 和 `PORT=3001`。

运行 `pnpm --filter @hehuoren/api test:unit -- src/config/env.validation.spec.ts`；预期两个用例通过。

- [x] **Step 4: 写全局异常过滤器单元测试**

在 `src/common/filters/api-exception.filter.spec.ts` 用 mock Fastify reply 验证未知异常会写出通用消息与请求 ID，而不会写出内部消息或堆栈：

```ts
expect(reply.status).toHaveBeenCalledWith(500);
expect(reply.send).toHaveBeenCalledWith({
  code: "INTERNAL_SERVER_ERROR",
  message: "服务器内部错误",
  requestId: "request-123",
});
expect(JSON.stringify(reply.send.mock.calls)).not.toContain(
  "secret database password",
);
expect(JSON.stringify(reply.send.mock.calls)).not.toContain(
  "at internalFunction",
);
```

同一测试组另测 `HttpException` 保留 HTTP 状态码和稳定错误码。运行 `pnpm --filter @hehuoren/api test:unit -- src/common/filters/api-exception.filter.spec.ts`，确认实现前失败。

- [x] **Step 5: 先写 DTO 转换与白名单校验单元测试**

在 `src/common/pipes/global-validation.pipe.spec.ts` 定义测试专用 `CountDto`（`count` 属性使用 `@Type(() => Number)` 与 `@IsInt()`），调用 `createGlobalValidationPipe().transform(value, { type: 'query', metatype: CountDto, data: undefined })`。断言 `{ count: '4' }` 转换为数字 `4`；断言 `{ count: '4', extra: 'x' }` 拒绝并抛出 `BadRequestException`。运行 `pnpm --filter @hehuoren/api test:unit -- src/common/pipes/global-validation.pipe.spec.ts`，预期导出函数缺失时失败。

- [x] **Step 6: 实现错误响应过滤器、全局校验与 Swagger DTO**

实现 `createGlobalValidationPipe()`，返回 `new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })`；`configureApp(app)` 使用此 factory。过滤器从 `FastifyRequest.id` 读取请求 ID。Nest `HttpException` 转为约定错误对象；未知异常始终使用状态码 500、错误码 `INTERNAL_SERVER_ERROR` 与文案 `服务器内部错误`，不序列化异常对象。定义带 Swagger decorators 的 `HealthResponseDto` 与 `ApiErrorDto`，健康路由使用 `@ApiOkResponse({ type: HealthResponseDto })` 与错误响应 decorators 描述返回结构。HTTP 错误映射为稳定代码：400 `BAD_REQUEST`、401 `UNAUTHORIZED`、403 `FORBIDDEN`、404 `NOT_FOUND`、409 `CONFLICT`、422 `UNPROCESSABLE_ENTITY`、429 `TOO_MANY_REQUESTS`；其他 4xx 用 `HTTP_ERROR` 与 `请求失败`；所有 5xx 用 `INTERNAL_SERVER_ERROR` 与 `服务器内部错误`。新建 `src/configure-app.ts` 并导出 `configureApp(app)`：设置 `api/v1` 前缀、全局 pipe 与过滤器、创建 Swagger 文档并挂载 `/docs` 和 `/docs-json`；返回 `OpenAPIObject` 供生成脚本复用，集成测试也调用此函数。

- [x] **Step 7: 先写健康接口 Fastify 注入集成测试**

在 `test/health.integration-spec.ts` 创建真实 `AppModule`，使用 `FastifyAdapter` 初始化并调用 `configureApp(app)`，再执行 `await app.init()` 与 `await app.getHttpAdapter().getInstance().ready()`；不打开 TCP 端口，测试 `GET /api/v1/health` 的 HTTP 状态、字段和请求 ID：

```ts
const response = await app
  .getHttpAdapter()
  .getInstance()
  .inject({ method: "GET", url: "/api/v1/health" });
const body = response.json();

expect(response.statusCode).toBe(200);
expect(body).toEqual({ status: "ok", requestId: expect.any(String) });
expect(body.requestId).not.toHaveLength(0);
expect(response.headers["content-type"]).toContain("application/json");
```

运行 `pnpm --filter @hehuoren/api test:integration`；预期路由未实现时返回 404 并失败。

- [x] **Step 8: 实现健康模块并通过集成测试**

`HealthService.getHealth(requestId: string)` 返回 `HealthResponseDto`。`HealthController` 用 `@Controller('health')` 和 `@Get()` 接口读取 Fastify request ID 并调用服务。`AppModule` 通过 `ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment })` 加载校验后的配置与健康模块。Nest bootstrap 用 `NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())` 建立应用、调用 `configureApp(app)`，从 `ConfigService` 读取 PORT，再监听默认端口 3001；Vite 代理让开发期 API 与 Web 同源，因此不开放通配 CORS。Swagger `DocumentBuilder` 标题为“禾伙人 API”、版本 `1.0`，JSON 地址 `/docs-json`，UI 地址 `/docs`。

- [x] **Step 9: 写全应用 HTTP smoke e2e 并生成 OpenAPI 脚本**

`test/health.e2e-spec.ts` 在随机本地端口启动 Nest/Fastify 应用，调用 `configureApp(app)`，通过 `fetch` 请求 `/api/v1/health` 和 `/docs-json`，并在 `afterAll` 关闭应用。断言健康响应中的 `requestId` 非空、schema 包含 `/api/v1/health`，且健康响应不含 `env`、`stack`、`database` 字段。为脚本提供单独的 Jest 配置，避免与单元及集成用例重复执行。

新建 `scripts/write-openapi.ts`：用 `NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), { logger: false })` 创建应用但不调用 `listen`；调用 `configureApp(app)` 获取同一份 Swagger 文档，写入 `apps/api/openapi.json`，并在 `finally` 中 `await app.close()`。在 Jest 单元、集成和 e2e 配置中分别选择 `src/**/*.spec.ts`、`test/**/*.integration-spec.ts` 与 `test/**/*.e2e-spec.ts`。API 包脚本分别使用 `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --config test/jest-unit.json --runInBand`、`node --experimental-vm-modules ./node_modules/jest/bin/jest.js --config test/jest-integration.json --runInBand` 和 `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --config test/jest-e2e.json --runInBand`。另外添加 `openapi:write`、`typecheck`、`lint` 和 `build` 包脚本。OpenAPI 脚本使用 `tsconfig.openapi.json` 编译至被忽略的 `dist-openapi/`，再由 Node 执行，以保留 NestJS 所需的装饰器元数据。

- [x] **Step 10: 运行 API 质量检查并提交**

运行 `pnpm --filter @hehuoren/api test:unit`、`pnpm --filter @hehuoren/api test:integration`、`pnpm --filter @hehuoren/api test:e2e`、`pnpm --filter @hehuoren/api typecheck`、`pnpm --filter @hehuoren/api build`。修复导致失败的实现或配置，然后运行 `pnpm --filter @hehuoren/api openapi:write`。

```bash
git add apps/api package.json pnpm-lock.yaml
git commit -m "feat(api): add health endpoint and safe errors"
```

### Task 3: 从 Swagger 生成并核验共享 API 类型

**Files:**

- Create: `packages/api-types/package.json`
- Create: `packages/api-types/tsconfig.json`
- Create: `packages/api-types/src/index.ts`
- Create: `packages/api-types/src/generated/schema.d.ts`
- Modify: `apps/api/openapi.json`（由 API 源码生成）

**Interfaces:**

- Consumes: Task 2 的 `apps/api/openapi.json` 和 `GET /api/v1/health` Swagger 定义。
- Produces: `@hehuoren/api-types` 的 `HealthResponse` 类型，精确对应 200 JSON 响应；Task 4 将其用于 Axios 与 Pinia。

- [x] **Step 1: 配置 openapi-typescript 生成脚本**

创建 `packages/api-types/package.json` 和 `tsconfig.json`；package name 为 `@hehuoren/api-types`、version 为 `0.0.0`、private 且使用 ESM，exports 指向 `./src/index.ts`，TypeScript 启用 `strict`、`noEmit`、`skipLibCheck` 并将 target 设为 `ES2022`。在类型包添加精确锁定的 `openapi-typescript` 开发依赖：

```bash
pnpm --filter @hehuoren/api-types add -D openapi-typescript
```

创建 `src/index.ts`，只从生成类型派生 `HealthResponse`：

```ts
import type { paths } from "./generated/schema";

export type HealthResponse =
  paths["/api/v1/health"]["get"]["responses"][200]["content"]["application/json"];
```

在 `package.json` 定义生成脚本：

```json
{
  "scripts": {
    "generate": "openapi-typescript ../../apps/api/openapi.json --output src/generated/schema.d.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

沿用 Task 1 已定义的根 `api:generate`：先调用 API 的 `openapi:write`，再调用 `@hehuoren/api-types` 的 `generate`。

- [x] **Step 2: 运行生成并检查类型形状**

运行 `pnpm api:generate`，检查生成文件包含路径 `/api/v1/health`、方法 `get`、响应码 `200` 和 `status`/`requestId` 字段。`src/index.ts` 的 `HealthResponse` 只从该生成路径派生，不手写重复接口。

- [x] **Step 3: 验证生成幂等与类型检查**

运行 `pnpm api:generate`，将 `apps/api/openapi.json` 与 `packages/api-types/src/generated/schema.d.ts` 加入 Git 暂存区，再运行 `pnpm api:generate` 和 `git diff --exit-code -- apps/api/openapi.json packages/api-types/src/generated/schema.d.ts`；这样可比较第二次生成与暂存基线，即使类型文件此前未被追踪也能发现变动。最后运行 `pnpm --filter @hehuoren/api-types typecheck`。第二次生成不得造成差异。

- [x] **Step 4: 提交共享接口类型**

```bash
git add apps/api/openapi.json packages/api-types
git commit -m "build(api-types): generate contracts from OpenAPI"
```

### Task 4: 实现 Vue、Pinia 健康页与状态单元测试

**Files:**

- Modify: `apps/web/package.json`
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/src/main.ts`
- Modify: `apps/web/src/App.vue`
- Create: `apps/web/src/api/http.ts`
- Create: `apps/web/src/api/health.ts`
- Create: `apps/web/src/stores/health.ts`
- Create: `apps/web/src/stores/health.spec.ts`
- Create: `apps/web/src/router/index.ts`
- Create: `apps/web/src/style.css`
- Create: `apps/web/vitest.config.ts`

**Interfaces:**

- Consumes: Task 3 的 `HealthResponse`，API 位于 `/api/v1/health`。
- Produces: `useHealthStore()` 暴露 `state`、`requestId`、`errorMessage` 和异步 `refresh()`；状态值限定 `idle | loading | online | offline`。

- [x] **Step 1: 安装 Web 依赖并接入类型包**

运行 `pnpm --filter @hehuoren/web add vue-router pinia vant axios`、`pnpm --filter @hehuoren/web add -D tailwindcss @tailwindcss/vite vitest @vue/test-utils jsdom` 和 `pnpm --filter @hehuoren/web add '@hehuoren/api-types@workspace:*'`。保留 `.npmrc` 精确版本设置。Vue Vite 插件由 create-vite 脚手架提供；配置 Tailwind 的 Vite 插件与 CSS import。

- [x] **Step 2: 先为 Pinia health store 写成功与失败测试**

使用 `createPinia()` 和 `setActivePinia()` 重置 store；mock `healthApi.getHealth`。`src/api/health.ts` 导出 `healthApi` 对象，其 `getHealth()` 方法返回生成的 `HealthResponse`。覆盖成功响应与网络拒绝：

```ts
it("publishes the request id after a successful health response", async () => {
  vi.mocked(healthApi.getHealth).mockResolvedValue({
    status: "ok",
    requestId: "request-123",
  });
  const store = useHealthStore();

  await store.refresh();

  expect(store.state).toBe("online");
  expect(store.requestId).toBe("request-123");
  expect(store.errorMessage).toBeNull();
});

it("moves offline and keeps a readable message when the request fails", async () => {
  vi.mocked(healthApi.getHealth).mockRejectedValue(new Error("Network Error"));
  const store = useHealthStore();

  await store.refresh();

  expect(store.state).toBe("offline");
  expect(store.requestId).toBeNull();
  expect(store.errorMessage).toBe("暂时无法连接服务，请稍后重试。");
});

it("uses the same offline state for a non-2xx API response", async () => {
  vi.mocked(healthApi.getHealth).mockRejectedValue(
    new Error("Request failed with status code 500"),
  );
  const store = useHealthStore();

  await store.refresh();

  expect(store.state).toBe("offline");
  expect(store.errorMessage).toBe("暂时无法连接服务，请稍后重试。");
});
```

先在 web `package.json` 配置 `test:unit: "vitest run"`，在 `vitest.config.ts` 设置 Vue 插件、`environment: "jsdom"` 与 `include: ["src/**/*.spec.ts"]`。运行 `pnpm --filter @hehuoren/web test:unit`；预期先因 store/API 模块未实现而失败。

- [x] **Step 3: 实现类型安全 HTTP 与健康 API 模块**

`src/api/http.ts` 导出 `http = axios.create({ baseURL: '/api/v1', timeout: 5000 })`。`src/api/health.ts` 导出 `healthApi.getHealth(): Promise<HealthResponse>`，通过 `http.get<HealthResponse>('/health')` 返回 `response.data`。不在浏览器包中写 API 主机密钥或固定生产主机名。

- [x] **Step 4: 实现最小 Pinia health store**

store 使用 `ref` 保存 `state`、`requestId`、`errorMessage`。`refresh()` 先设为 `loading` 并清空错误；成功后保存 API 状态与请求 ID，再设 `online`；失败时清除请求 ID、设 `offline`、填入上面固定的用户提示，不将 Axios 内部异常详情显示在页面上。不得添加持久化插件。

- [x] **Step 5: 运行 store 测试并处理竞态回归**

运行 `pnpm --filter @hehuoren/web test:unit`；成功和失败两个用例必须通过。额外断言每次调用开始时状态为 `loading`，调用成功后清除上次错误；失败后不保留上次成功响应的 `requestId`。

- [x] **Step 6: 注册 Pinia、路由、Vant 与 Tailwind**

在 `main.ts` 从 Pinia 导入 `createPinia`，从 Vant 按需导入 `Button`、`Cell`、`Loading`、`Tag`，并导入 `vant/lib/index.css`。创建 app 后依次注册 Pinia、router 和上述 Vant 组件，再 mount `#app`。用 Vue Router 设置 `/` 为唯一健康页，未知路径重定向到 `/`。`App.vue` 在挂载后调用 `refresh()`，页面明确呈现服务在线/离线、请求 ID、加载态与重试按钮；使用 Vant 组件和 Tailwind 实现窄屏可用布局，不显示虚构业务数据。`style.css` 引入 `@import "tailwindcss";`。

- [x] **Step 7: 配置 Vite 开发代理与包脚本**

将 `/api` 代理到 `http://localhost:3001`，代理配置只用于本地开发。配置 `vitest.config.ts` 为 `environment: 'jsdom'` 并只收集 `src/**/*.spec.ts`。确认 Web 包脚本包含 `dev`、`build`、`lint`、`typecheck` 和 `test:unit`。

- [x] **Step 8: 运行 Web 与组合启动检查并提交**

分别运行 `pnpm --filter @hehuoren/web test:unit`、`pnpm --filter @hehuoren/web typecheck`、`pnpm --filter @hehuoren/web lint`、`pnpm --filter @hehuoren/web build`。运行 `pnpm dev` 后，在浏览器访问 Web 根路径，确认网络请求经过 Vite 代理到 API 且健康卡片显示真实 `requestId`；停止两个服务。

```bash
git add apps/web package.json pnpm-lock.yaml
git commit -m "feat(web): add Pinia health status page"
```

### Task 5: 添加 GitHub Actions 质量门禁、协作模板与开发说明

**Files:**

- Create: `.github/workflows/ci.yml`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `docs/adr/0001-phase-one-technology-foundation.md`
- Modify: `README.md`

**Interfaces:**

- Consumes: Tasks 1–4 的根脚本与 API/Web 结构。
- Produces: 质量 job 和固定名 `ci-gate`；PR 模板要求变更目的、验证记录、迁移说明和 UI 截图栏目；README 给出可复现的安装、开发、生成和验证命令。

- [x] **Step 1: 编写 Pull Request 模板**

模板包含以下未勾选栏目：变更目的、关联 GitHub Issue、变更摘要、验证命令及结果、数据库迁移（本阶段填写“不适用”）、界面截图（无 UI 改动填写“不适用”）。PR 正文链接相应 issue，不在 issue 中粘贴秘密信息。

- [x] **Step 2: 记录已确认的架构决策**

创建 ADR 0001，状态 `Accepted`，记录本项目采用 pnpm 单仓工作区、Vue 3 + Pinia/Vant/Tailwind、NestJS + Fastify、OpenAPI 生成纯类型包，以及不在第一阶段接入数据库的决定。写出背景、决策、正负后果，并链接阶段一设计稿；不重复抄录实现步骤。

- [x] **Step 3: 编写从干净检出开始的 README**

记录 Node/pnpm 版本、`corepack enable`、`pnpm install`、`cp apps/api/.env.example apps/api/.env`（PowerShell 用户给出 `Copy-Item` 等效命令）、`pnpm dev`、Swagger 地址 `/docs`、OpenAPI 类型生成 `pnpm api:generate` 以及 lint、格式、类型、构建、unit/integration/e2e 脚本。标明健康接口不使用数据库，阶段二以后功能未实现。

- [x] **Step 4: 编写 CI workflow 与完整 SHA 固定**

事件为面向 `main` 的 `pull_request`、`push` 到 `main` 与 `workflow_dispatch`。设置顶层 `permissions: contents: read`，并按 `github.workflow` 与 `github.event.pull_request.number || github.ref` 配置并发取消旧运行。`quality` job 使用下面已核验完整 SHA 的 Action，并先安装 pnpm、再设置 Node 和 pnpm store 缓存：

```yaml
- uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6.1.0
- uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0
  with:
    version: 10.30.3
- uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
  with:
    node-version-file: .nvmrc
    cache: pnpm
```

随后执行 `pnpm install --frozen-lockfile`、格式检查、lint、API 类型生成与 diff 检查、typecheck、build、unit/integration/e2e。实现时再对照 [checkout v6.1.0 发布提交](https://github.com/actions/checkout/commit/d23441a48e516b6c34aea4fa41551a30e30af803)、[pnpm/action-setup v6.1.0 提交](https://github.com/pnpm/action-setup/commit/ea17c68df8912ef543352723c149a84f56e3d413)、[setup-node v7.0.0 提交](https://github.com/actions/setup-node/commit/820762786026740c76f36085b0efc47a31fe5020) 与安全公告复核；不得将 `uses` 改成版本 tag。pnpm 优先于 setup-node 的顺序遵循 [setup-node 官方 pnpm 缓存示例](https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md#caching-packages-data)。

增加 `ci-gate` job，`needs: quality`、`if: always()`，执行 `test "${{ needs.quality.result }}" = "success"`；quality 失败或取消时该 job 必须失败。job 名固定为 `ci-gate`。Workflow 不添加 `paths` 或 `paths-ignore` 过滤器，避免文档或配置变更绕过必需检查。

- [x] **Step 5: 写明本地与远端验证边界**

README 只声明本地可运行命令与 CI job 名。不声称已经设置 GitHub required checks、分支保护或 Auto-merge；这些配置需要仓库权限和可读取的远端状态，完成后再单独核验记录。

- [x] **Step 6: 本地执行全量质量门禁**

按 CI 顺序运行：

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm api:generate
git diff --exit-code -- apps/api/openapi.json packages/api-types/src/generated/schema.d.ts
pnpm typecheck
pnpm build
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

预期所有命令退出码为 `0`；随后再运行一次 `pnpm api:generate`，确认生成文件没有未提交差异。

- [x] **Step 7: 提交 CI 与协作文档**

```bash
git add .github README.md docs/adr
git commit -m "ci: add repository quality gate and contribution template"
```

- [x] **Step 8: 最终审查提交图与工作树**

运行 `git status --short --branch`、`git log --oneline --decorate -6`，确认工作树干净、提交按工作区/API/类型/Web/CI 顺序可读，并确认没有 `.env`、构建产物或浏览器测试输出被提交。记录远端未读取、未推送这一事实，待用户确认远端可访问后再处理。

## 实施结果（2026-10-01）

- 在 `chore/phase-one-foundation` 分支与 `.worktrees/chore-phase-one-foundation` 中完成五个任务，保留独立提交。
- Node 按用户确认放宽为 `>=24.15.0 <25`，`.nvmrc` 使用 `24`；本地使用 Node 24.15.0、pnpm 10.30.3。
- 最新 Nest CLI 使用 ESM；Jest 使用 ESM 配置，OpenAPI 脚本通过 TypeScript 编译以保留装饰器元数据。API 显式安装 Swagger/Fastify 所需的 `@fastify/static`。
- 共享类型包使用 TypeScript 5.9.3 以匹配 openapi-typescript 的 peer 范围；根 ESLint 和应用使用 TypeScript 6。
- 健康页使用独立 `HealthView.vue`，`App.vue` 作为路由出口；Pinia 防止加载时重复请求。ESLint 保留原生 `eslint.config.mjs`，使用 eslint-config-prettier 统一格式规则。
- 本地冻结锁文件安装、格式、lint、生成差异、类型检查、构建与三层测试均成功；单元测试共 11 个、集成测试 1 个、真实 HTTP e2e 测试 1 个。
- 浏览器验证 Vite 代理返回 200、页面显示真实 requestId，点击刷新后更新；375px 窄屏无横向溢出。联调进程已停止。
- 生成文件重复生成无差异；编译缓存、环境文件与构建产物均未跟踪。
- 已通过 GitHub API 核对 CI Action 标签与完整提交 SHA，并复核官方安全公告页面。GitHub Issue 列表读取成功；远端 Git 历史未读取，未推送、未合并，远端 CI 与分支保护尚未验证。
