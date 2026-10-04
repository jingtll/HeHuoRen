# 禾伙人

四川农业大学校园比赛与项目组队平台。当前完成阶段一工程初始化、学生端共享导航与路由，登录注册前端表单，以及比赛首页、院徽筛选承办学院、比赛详情（Issue #12）。Issue #22 接入 PostgreSQL、人工核对数据导入、学院与比赛公开查询及真实 API 联调；其他业务页仍为待开发占位，真实认证尚未开发。工程包含 pnpm 工作区、Vue 健康页、NestJS/Fastify 健康接口、OpenAPI 类型生成与 CI 配置。

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
docker compose up -d --wait
pnpm --filter @hehuoren/api db:migrate
pnpm --filter @hehuoren/api data:import data/reviewed-competitions.json
pnpm --filter @hehuoren/api data:import data/publish-reviewed.json --preview
pnpm --filter @hehuoren/api data:import data/publish-reviewed.json
pnpm dev
```

- Web 首页：[http://localhost:5173/home](http://localhost:5173/home)，根路径跳转到 `/home`，未知地址显示独立 404；端口占用时以 Vite 输出为准。
- Web 健康页：[http://localhost:5173/health](http://localhost:5173/health)，保留独立健康检查与刷新/重试。
- API：[http://127.0.0.1:3001/api/v1/health](http://127.0.0.1:3001/api/v1/health)。
- Swagger：[http://127.0.0.1:3001/docs](http://127.0.0.1:3001/docs)。
- OpenAPI JSON：[http://127.0.0.1:3001/docs-json](http://127.0.0.1:3001/docs-json)。

API 默认只监听本机。开发端口冲突时可设置 API 的 PORT 和 Web 的 API_PROXY_TARGET（默认 http://127.0.0.1:3001），无需停止其他进程。Web 的 `/api` 请求由 Vite 代理到 API；修改 API 端口时需同步修改 `apps/web/vite.config.ts` 的代理配置。环境变量支持 `NODE_ENV`、`PORT` 与 `DATABASE_URL`；端口必须是 1–65535 的整数。`.env` 不提交。

健康接口返回 `{ status: "ok", requestId: string }`，请求 ID 来自 Fastify。异常响应包含稳定的 `code`、用户可读的 `message` 与 `requestId`，未知异常不暴露内部细节。health 不检查数据库就绪；学院与比赛接口使用数据库。

## 学生端样式

学生端采用禾苗绿主色、暖白背景、谷物黄点缀和轻量圆角卡片。该风格已提取到 `apps/web/src/style.css`，通过共享变量统一 Tailwind 与原生控件；现有 `/health` 页面已接入。

实现后续页面时遵循[学生端全局样式约定](docs/student-ui-style.md)。设计预览、截图和验收产物仅保留本地，不进入 Git。

学生端已提供桌面侧栏与移动底部导航；业务页面直接开放，尚无认证状态；比赛数据由公开查询接口提供。登录、注册采用独立品牌布局和实际表单，其余业务页显示“待开发”。

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

首页与比赛详情读取 API；队伍的固定 `preview` 链接仍为占位预览。原计划的 `/competitions` 路径已由首页替代。收藏与通知在移动端通过“我的”进入。History 路由部署时需配置 SPA fallback；本次未扩展生产部署。

登录校验邮箱及非空密码；注册包含昵称、邮箱、密码、确认密码与邮箱验证码，密码至少 8 位，不裁剪密码或限制字符组合。密码支持显示/隐藏，验证码发送前校验邮箱。OpenAPI 包含健康与比赛公开查询，认证尚未接入；提交反馈“认证服务暂未开放”，发送反馈“验证码服务暂未开放”；不创建登录状态、不模拟发送成功或倒计时。密码与验证码不写入浏览器存储、日志或 URL，切换认证页面时清空输入。

邮箱验证码是 Issue #9 新增要求，真实发送、校验、有效期与重发规则依赖后续邮件接口，本次未联调。账号服务尚未开放，当前不能注册或登录。认证表单与尚未开放的服务边界以当前源码及 Issue #9 为准。

## 目录与接口契约

| 目录                 | 用途                                              |
| -------------------- | ------------------------------------------------- |
| `apps/web`           | Vue 3、Vue Router、Pinia、Tailwind、Lucide、Axios |
| `apps/api`           | NestJS、Fastify、Drizzle、pg/PostgreSQL、Swagger  |
| `packages/api-types` | 从 OpenAPI 生成的接口类型，无运行时代码           |
| `docs/adr`           | 架构决策                                          |
| `CONTEXT.md`         | 业务领域词汇表                                    |

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
TEST_DATABASE_URL=postgresql://hehuoren:hehuoren_test@127.0.0.1:54323/hehuoren_test pnpm test:integration
TEST_DATABASE_URL=postgresql://hehuoren:hehuoren_test@127.0.0.1:54323/hehuoren_test pnpm test:e2e
```

PowerShell 先执行 `$env:TEST_DATABASE_URL="postgresql://hehuoren:hehuoren_test@127.0.0.1:54323/hehuoren_test"`，再运行两个数据库测试命令。测试连接数据库名须以 `_test` 结尾，且不能与开发连接相同；每套测试创建独立 schema，完成后清理。

API 单元测试覆盖配置、异常过滤、严格查询校验与报名时间边界；真实 PostgreSQL 集成测试验证迁移、事务导入、稳定排序、计数及分页；集成测试使用 Fastify 注入请求；e2e 测试在本机临时端口验证真实 HTTP 与 Swagger 契约。Web 单元测试覆盖 Pinia 健康状态、学生端路由、首页嵌套、导航归属、404、健康页重试/刷新，以及认证表单校验、密码切换、验证码前置校验和服务不可用反馈。API 的 Jest ESM 模式使用 `--experimental-vm-modules`，Node 会输出对应实验功能提示。

ESLint 使用原生支持的 `eslint.config.mjs`；`eslint-config-prettier` 关闭与 Prettier 冲突的格式规则。生成文件与构建输出不参与格式检查。

## CI 与协作

GitHub Actions 在面向 `main` 的 PR、`main` 推送及手动触发时运行完整质量检查，Action 固定为完整提交 SHA。最终 job 名为 `ci-gate`，只有 `quality` 成功时通过。配置没有路径过滤器。

`auto-merge.yml` 在 PR 的 `CI` 成功后自动启用合并：仅处理本仓库面向 `main` 的非草稿 PR，核对通过 CI 的提交仍是 PR 最新提交，并使用 merge commit 保留分步提交。它遵守分支保护，不检出或执行 PR 代码。仓库需开启 Allow auto-merge；建议将 `ci-gate` 设为必需检查。该工作流合并到默认分支后才会触发；CI 会在草稿 PR 转为可审阅时重新运行，成功后再次触发自动合并。

合并命令执行后，工作流重新确认 PR 已合并，再显式删除来源远程分支。仅删除 SHA 仍等于通过 CI 的提交、未受保护、不是默认分支且没有其他打开的 PR 引用的本仓库分支；已删除或新增提交的分支会跳过。如果 `--auto` 只启用了等待合并，本次运行保留分支，后续延迟合并仍依赖仓库自动删除设置或人工清理。

问题与方案记录在 GitHub Issues，PR 使用仓库模板。参见 [AGENTS.md](AGENTS.md)，现行决策见 [ADR](docs/adr/0001-phase-one-technology-foundation.md)。

新建 Issue 可选择[问题反馈](.github/ISSUE_TEMPLATE/bug_report.yml)、[功能建议](.github/ISSUE_TEMPLATE/feature_request.yml)或[开发任务](.github/ISSUE_TEMPLATE/task.yml)表单，默认进入 `needs-triage`；确认需求后按[分诊标签映射](docs/agents/triage-labels.md)更新状态。提交 PR 时使用 [PR 模板](.github/PULL_REQUEST_TEMPLATE.md)，填写关联 Issue、变更内容与实际验证结果。

本机 Agent 配置、依赖、构建缓存、日志、浏览器测试产物及本地运行数据由 `.gitignore` 排除。环境变量示例、根锁文件、OpenAPI 文档与生成的接口类型随代码提交。

本地检查不能证明远端 CI 已执行；分支保护、required checks 与 Auto-merge 需要在 GitHub 单独配置和核验。本次完成首页所需数据库与公开比赛 API；真实登录、招募、申请和生产部署仍待开发。

## 学生端样式与跨端规划

Issue #19 完整移除 Vant；现采用 Tailwind 为主、少量普通 CSS、按复用与行为需要封装组件。图标使用 `@lucide/vue` 1.51.0，经 `AppIcon.vue` 统一入口静态按需导入，许可证与渲染适配见[图标来源](third-party-notices/lucide-LICENSE.txt)和[样式约定](docs/student-ui-style.md)。认证、健康状态与导航保持既有行为。

项目完成后统一迁移到普通 uni-app，目标 H5、微信小程序。当前继续交付 Web，未搭建跨端工程；开发时持续识别、解释并记录影响，参见[迁移提醒与待办](docs/agents/uni-app-migration.md)。验证结果与构建体积对比记录在 PR；验收文档和截图仅保留本地。

图标与加载组件位于 `apps/web/src/components/`，分别为 `AppIcon.vue`、`app-icons.ts` 和 `LoadingIndicator.vue`，复用既有认证与学院组件。

## 比赛查询与人工导入（Issue #22）

首页显式请求每页 4 个赛段；API 默认 20，支持 1–50。PostgreSQL 按完整过滤结果计算赛段数、去重届次数与页数，并按届次全部通知的最大发布日期倒序、届次 ID、赛段展示顺序、赛段 ID 稳定排序。API 使用服务端当前时刻，页面显示 evaluatedAt；官方通知、历史与演示标识独立于发布状态。比赛报名、材料提交和举行时间分别展示；未注明开始时间的通知提示待核对，不以发布日期推断开放报名。

URL query 约定：`hosts` 为稳定学院 ID 的逗号列表或 `all`，缺省为全部学院；显式空值（`hosts=`）表示未选择且不显示比赛；`q`、`status`、`page` 分别保存搜索、状态与页码。旧版 `category`、`eligible` 参数在 URL 规范化时移除。有效自选学院优先于 all，校验、去重并按字典排序；无关参数保留。筛选变更回到第 1 页，规范化使用 replace，不增加历史记录。首页搜索和状态筛选合并在院徽卡片内，使用紧凑控件；点击院徽仅按承办学院筛选，不提供“本学院可参加”筛选。参赛范围与其他资格限制在比赛卡片和详情中说明，不作为学院入口的筛选依据。

程序设计为个人赛，生物竞赛为同校区 4 人组队；挑战杯院赛保留各自截止与材料方式。详情提供官方原文、发布时间、核对日期与复制入口，并明确平台组队不等于官方报名。收藏与关联招募为禁用的后续入口，不模拟成功、不保存业务记录、不接入业务 localStorage 或认证。

公开接口为 GET /api/v1/colleges、GET /api/v1/competitions、GET /api/v1/competitions/:id；详情仅返回已发布届次，草稿、隐藏或不存在统一 404。请求错误统一返回 code、message、requestId。直接 API 的 q/status/page/pageSize 重复值返回 400；hosts 可重复合并，未知学院忽略；q 为最长 100 字符的字面包含搜索。超页返回最后有效页，无结果 page=1、totalPages=1；页面收到响应后 replace 纠正页码。生产页面不读取 competitions.ts，该文件及 competition-demo.ts 仅供旧行为测试。

人工数据位于 apps/api/data/reviewed-competitions.json：27 个稳定学院 ID、4 个非演示届次，默认草稿。2026-10-04 重新读取六条官网通知；挑战杯校团委附件需验证码，未验证附件规则，保留未知字段及提醒。复赛/院赛日期用 date 精度，24:00 等价保存为次日 00:00 的精确瞬间并保留原文说明。统计建模通知明确的是材料截止，不自动当作报名截止。

```bash
pnpm --filter @hehuoren/api data:import data/reviewed-competitions.json --validate
pnpm --filter @hehuoren/api data:import data/reviewed-competitions.json --preview
pnpm --filter @hehuoren/api data:import data/reviewed-competitions.json
```

--validate 仅验证文件结构；--preview 在数据库事务内验证引用、发布条件与数据库约束，输出新增/更新和解除关系，再回滚。导入以稳定 ID 更新，缺失实体不删除；承办学院、范围学院和赛段来源缺省保留、数组完整替换、空数组清空。部分更新文件仍采用 colleges/competitions 根结构及各对象 id。未知时间为 { precision: "unknown", value: null }，清除时间须显式写该对象。

发布须在输入对应届次写 publication: "published"；隐藏写 "hidden"。改动已发布内容（含关系和公开学院目录）执行时必须附 --confirm-published，预览无需确认。草稿变为发布亦须通过来源、赛道与时间校验。生产 NODE_ENV=production 拒绝 demo；导入失败整批回滚，不输出数据库凭据。--validate 不证明来源真实，请先人工核对。开发测试容器分别使用持久卷和独立临时数据，禁止将本地示例凭据用于生产。

迁移为 apps/api/migrations/0001_competitions.sql，带事务和迁移记录，重复运行不重复建表。现有仓库尚无业务数据库，首次应用属于新增模型；回退应用时保留比赛数据，不提供自动删库回退。正式接口契约从 DTO/Swagger 生成，无需活数据库或开放端口。后台、自动采集、收藏、关联招募及认证仍待接入。

首次草稿导入后公开列表为空，需按上方命令审阅并执行 publish-reviewed.json 显式发布清单。重新导入原始草稿文件会把已发布记录改回草稿，执行须 --confirm-published；通常对已发布内容使用按 ID 的部分更新文件，而不是重跑初始草稿清单。
