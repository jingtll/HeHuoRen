# 禾伙人

四川农业大学校园比赛与项目组队平台。当前完成阶段一工程初始化、学生端共享导航与路由，以及登录注册前端表单；其他业务页为待开发占位，真实认证和业务接口尚未开发。工程包含 pnpm 工作区、Vue 健康页、NestJS/Fastify 健康接口、OpenAPI 类型生成与 CI 配置。

项目范围、阶段安排与当前进度见[项目开发计划书](docs/禾伙人-项目开发计划书.md)。

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

- Web 首页：[http://localhost:5173/home](http://localhost:5173/home)，根路径跳转到 `/home`，未知地址显示独立 404；端口占用时以 Vite 输出为准。
- Web 健康页：[http://localhost:5173/health](http://localhost:5173/health)，保留独立健康检查与刷新/重试。
- API：[http://127.0.0.1:3001/api/v1/health](http://127.0.0.1:3001/api/v1/health)。
- Swagger：[http://127.0.0.1:3001/docs](http://127.0.0.1:3001/docs)。
- OpenAPI JSON：[http://127.0.0.1:3001/docs-json](http://127.0.0.1:3001/docs-json)。

API 默认只监听本机。Web 的 `/api` 请求由 Vite 代理到 API；修改 API 端口时需同步修改 `apps/web/vite.config.ts` 的代理配置。环境变量支持 `NODE_ENV` 与 `PORT`；端口必须是 1–65535 的整数。`.env` 不提交。

健康接口返回 `{ status: "ok", requestId: string }`，请求 ID 来自 Fastify。异常响应包含稳定的 `code`、用户可读的 `message` 与 `requestId`，未知异常不暴露内部细节。当前接口不使用数据库。

## 学生端样式与 Demo

学生端视觉基准采用[第一版 Demo](docs/demos/hehuoren-student-demo.html#competitions)：禾苗绿、暖白背景、谷物黄点缀和轻量圆角卡片。该风格已提取到 `apps/web/src/style.css`，通过共享变量统一 Tailwind 与 Vant；现有 `/health` 页面已接入。

实现后续页面时遵循[学生端全局样式约定](docs/student-ui-style.md)。[Demo 说明](docs/demos/README.md)列出选定版本和三份备选静态风格，可直接用浏览器打开对应 HTML，无需启动服务。

学生端已提供桌面侧栏与移动底部导航；业务页面直接开放，尚无认证状态与业务数据。登录、注册采用独立品牌布局和实际表单，其余业务页显示“待开发”。

| 路由                                             | 当前页面                       |
| ------------------------------------------------ | ------------------------------ |
| `/`                                              | 跳转到 `/home`                 |
| `/home`                                          | 首页                           |
| `/home/competitions/:id`                         | 首页内部的比赛详情             |
| `/teams`、`/teams/:id`、`/teams/new`             | 找队友、队伍详情、发布招募     |
| `/my/teams`、`/my/applications`、`/my/favorites` | 我的队伍、申请与邀请、我的收藏 |
| `/notifications`、`/profile`                     | 站内通知、个人资料             |
| `/login`、`/register`                            | 登录、注册前端表单             |
| `/health`                                        | 独立服务状态页                 |
| 未匹配路径                                       | 页面不存在，可返回首页         |

详情的固定 `preview` 链接明确标注“占位预览”，不代表已有比赛或队伍记录。原计划的 `/competitions` 路径已由首页替代。收藏与通知在移动端通过“我的”进入。History 路由部署时需配置 SPA fallback；本次未扩展生产部署。

登录校验邮箱及非空密码；注册包含昵称、邮箱、密码、确认密码与邮箱验证码，密码至少 8 位，不裁剪密码或限制字符组合。密码支持显示/隐藏，验证码发送前校验邮箱。当前 OpenAPI 只有健康接口，提交反馈“认证服务暂未开放”，发送反馈“验证码服务暂未开放”；不创建登录状态、不模拟发送成功或倒计时。密码与验证码不写入浏览器存储、日志或 URL，切换认证页面时清空输入。

邮箱验证码是 Issue #9 新增要求，真实发送、校验、有效期与重发规则依赖后续邮件接口，本次未联调。账号服务尚未开放，当前不能注册或登录。界面与验证记录见[Issue #9 验收记录](docs/issue-9-validation.md)。

Demo 的比赛、队伍、人物、日期与浏览器交互均为示例；数据库、真实认证和组队流程仍按计划书后续阶段实现。Demo 不代表已上线的业务功能。

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

API 单元测试覆盖配置、异常过滤与验证管道；集成测试使用 Fastify 注入请求；e2e 测试在本机临时端口验证真实 HTTP 与 Swagger 契约。Web 单元测试覆盖 Pinia 健康状态、学生端路由、首页嵌套、导航归属、404、健康页重试/刷新，以及认证表单校验、密码切换、验证码前置校验和服务不可用反馈。API 的 Jest ESM 模式使用 `--experimental-vm-modules`，Node 会输出对应实验功能提示。

ESLint 使用原生支持的 `eslint.config.mjs`；`eslint-config-prettier` 关闭与 Prettier 冲突的格式规则。生成文件与构建输出不参与格式检查。

## CI 与协作

GitHub Actions 在面向 `main` 的 PR、`main` 推送及手动触发时运行完整质量检查，Action 固定为完整提交 SHA。最终 job 名为 `ci-gate`，只有 `quality` 成功时通过。配置没有路径过滤器。

`auto-merge.yml` 在 PR 的 `CI` 成功后自动启用合并：仅处理本仓库面向 `main` 的非草稿 PR，核对通过 CI 的提交仍是 PR 最新提交，并使用 merge commit 保留分步提交。它遵守分支保护，不检出或执行 PR 代码。仓库需开启 Allow auto-merge；建议将 `ci-gate` 设为必需检查。该工作流合并到默认分支后才会触发；CI 会在草稿 PR 转为可审阅时重新运行，成功后再次触发自动合并。

问题与方案记录在 GitHub Issues，PR 使用仓库模板。参见 [AGENTS.md](AGENTS.md)、[阶段一设计](docs/superpowers/specs/2026-10-01-phase-one-foundation-design.md)与[实施计划](docs/superpowers/plans/2026-10-01-phase-one-foundation.md)。

新建 Issue 可选择[问题反馈](.github/ISSUE_TEMPLATE/bug_report.yml)、[功能建议](.github/ISSUE_TEMPLATE/feature_request.yml)或[开发任务](.github/ISSUE_TEMPLATE/task.yml)表单，默认进入 `needs-triage`；确认需求后按[分诊标签映射](docs/agents/triage-labels.md)更新状态。提交 PR 时使用 [PR 模板](.github/PULL_REQUEST_TEMPLATE.md)，填写关联 Issue、变更内容与实际验证结果。

本机 Agent 配置、依赖、构建缓存、日志、浏览器测试产物及本地运行数据由 `.gitignore` 排除。环境变量示例、根锁文件、OpenAPI 文档与生成的接口类型随代码提交。

本地检查不能证明远端 CI 已执行；分支保护、required checks 与 Auto-merge 需要在 GitHub 单独配置和核验。当前阶段不包含数据库、登录、比赛、招募、申请或生产部署。
