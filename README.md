# 禾伙人

四川农业大学校园比赛与项目组队平台。当前完成阶段一工程初始化：pnpm 工作区、Vue 健康页、NestJS/Fastify 健康接口、OpenAPI 类型生成与 CI 配置。

## 环境

- Node.js 24，最低 `24.15.0`，支持范围 `>=24.15.0 <25`；`.nvmrc` 使用 `24`，不固定补丁版本。
- pnpm `10.30.3`，由根目录 `packageManager` 固定。

```bash
corepack enable
pnpm install --frozen-lockfile
```

安装 Node 时如未包含 Corepack，请先按 [Corepack 官方说明](https://github.com/nodejs/corepack#manual-installs)安装。

## 本地开发

在仓库根目录复制环境变量示例：

```bash
cp apps/api/.env.example apps/api/.env
```

PowerShell 等效命令：

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

```bash
pnpm dev
```

- Web：[http://localhost:5173](http://localhost:5173)，端口占用时以 Vite 输出为准。
- API：[http://127.0.0.1:3001/api/v1/health](http://127.0.0.1:3001/api/v1/health)。
- Swagger：[http://127.0.0.1:3001/docs](http://127.0.0.1:3001/docs)。
- OpenAPI JSON：[http://127.0.0.1:3001/docs-json](http://127.0.0.1:3001/docs-json)。

API 默认只监听本机。Web 的 `/api` 请求由 Vite 代理到 API；修改 API 端口时需同步修改 `apps/web/vite.config.ts` 的代理配置。环境变量支持 `NODE_ENV` 与 `PORT`；端口必须是 1–65535 的整数。`.env` 不提交。

健康接口返回 `{ status: "ok", requestId: string }`，请求 ID 来自 Fastify。异常响应包含稳定的 `code`、用户可读的 `message` 与 `requestId`，未知异常不暴露内部细节。当前接口不使用数据库。

## 目录与接口契约

| 目录                 | 用途                                             |
| -------------------- | ------------------------------------------------ |
| `apps/web`           | Vue 3、Vue Router、Pinia、Vant、Tailwind、Axios  |
| `apps/api`           | NestJS、Fastify、配置验证、Swagger、安全错误响应 |
| `packages/api-types` | 从 OpenAPI 生成的接口类型，无运行时代码          |
| `docs/adr`           | 架构决策                                         |
| `CONTEXT.md`         | 业务领域词汇表                                   |

修改 API DTO 或路由后运行：

```bash
pnpm api:generate
git diff -- apps/api/openapi.json packages/api-types/src/generated/schema.d.ts
```

生成过程不监听端口，不需要数据库。生成文件随代码提交，不手工编辑。为支持 NestJS 装饰器元数据，API 先编译生成脚本到被忽略的 `dist-openapi/`，再由 Node 执行。类型生成包采用 TypeScript 5.9，应用采用 TypeScript 6，以匹配各工具的兼容范围。

## 质量检查

```bash
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

API 单元测试覆盖配置、异常过滤与验证管道；集成测试使用 Fastify 注入请求；e2e 测试在本机临时端口验证真实 HTTP 与 Swagger 契约。Web 单元测试覆盖 Pinia 健康状态。API 的 Jest ESM 模式使用 `--experimental-vm-modules`，Node 会输出对应实验功能提示。

ESLint 使用原生支持的 `eslint.config.mjs`；`eslint-config-prettier` 关闭与 Prettier 冲突的格式规则。生成文件与构建输出不参与格式检查。

## CI 与协作

GitHub Actions 在面向 `main` 的 PR、`main` 推送及手动触发时运行完整质量检查，Action 固定为完整提交 SHA。最终 job 名为 `ci-gate`，只有 `quality` 成功时通过。配置没有路径过滤器。

`auto-merge.yml` 在 PR 的 `CI` 成功后自动启用合并：仅处理本仓库面向 `main` 的非草稿 PR，核对通过 CI 的提交仍是 PR 最新提交，并使用 merge commit 保留分步提交。它遵守分支保护，不检出或执行 PR 代码。仓库需开启 Allow auto-merge；建议将 `ci-gate` 设为必需检查。该工作流合并到默认分支后才会触发；CI 会在草稿 PR 转为可审阅时重新运行，成功后再次触发自动合并。

问题与方案记录在 GitHub Issues，PR 使用仓库模板。参见 [AGENTS.md](AGENTS.md)、[阶段一设计](docs/superpowers/specs/2026-10-01-phase-one-foundation-design.md)与[实施计划](docs/superpowers/plans/2026-10-01-phase-one-foundation.md)。

新建 Issue 可选择[问题反馈](.github/ISSUE_TEMPLATE/bug_report.yml)、[功能建议](.github/ISSUE_TEMPLATE/feature_request.yml)或[开发任务](.github/ISSUE_TEMPLATE/task.yml)表单，默认进入 `needs-triage`；确认需求后按[分诊标签映射](docs/agents/triage-labels.md)更新状态。提交 PR 时使用 [PR 模板](.github/PULL_REQUEST_TEMPLATE.md)，填写关联 Issue、变更内容与实际验证结果。

本机 Agent 配置、依赖、构建缓存、日志、浏览器测试产物及本地运行数据由 `.gitignore` 排除。环境变量示例、根锁文件、OpenAPI 文档与生成的接口类型随代码提交。

本地检查不能证明远端 CI 已执行；分支保护、required checks 与 Auto-merge 需要在 GitHub 单独配置和核验。当前阶段不包含数据库、登录、比赛、招募、申请或生产部署。
