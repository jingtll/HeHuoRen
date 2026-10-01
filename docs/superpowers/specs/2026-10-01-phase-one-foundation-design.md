# 禾伙人阶段一工程骨架设计

状态：待用户审阅

依据：外部计划书 `D:\Codex\2026-10-01\new-chat\outputs\禾伙人-项目开发计划书.md` V1.1，第 5、8 节及阶段一；本设计已将阶段一的关键决策摘录为自包含要求。

## 目标

建立一个可从干净检出安装、独立构建并能演示 Web 到 API 健康检查的 pnpm Monorepo，为后续认证、比赛、招募与组队业务提供清晰的工程边界。

本次范围止于阶段一工程骨架，不实现阶段二及之后的业务功能。

## 技术与仓库结构

- 单仓库使用 pnpm workspace，包含 `apps/web`、`apps/api`、`packages/api-types`。
- 工作区包名为 `@hehuoren/web`、`@hehuoren/api`、`@hehuoren/api-types`；本地依赖使用 `workspace:*`。
- Web 使用 Vue 3、TypeScript、Vite、Pinia、Vant、Tailwind CSS、Vue Router 与 Axios；Pinia 在应用入口注册。
- API 使用 NestJS 与 Fastify Adapter；API 类型包只包含从 OpenAPI 生成的接口类型，不包含后端运行时代码。
- 根脚本提供 `dev`、`lint`、`format:check`、`typecheck`、`api:generate`、`build`、`test:unit`、`test:integration` 与 `test:e2e` 入口。阶段一实现可运行的单元测试；数据库集成测试与 Playwright 流程测试留到相应阶段。
- `.nvmrc` 固定到 Node.js 24.21.0 LTS，根 `package.json` 的 `packageManager` 固定到当前环境 pnpm 10.30.3。依赖精确版本由锁文件固定。

Node.js 官方发布信息列出 24.21.0 为 LTS；Nest CLI 文档要求生成器运行于 Node 24.15 或更高补丁版本，Vite 8 要求 Node 20.19+ 或 22.12+。选择 Node 24.21.0 满足这几项约束：[Node.js releases](https://nodejs.org/en/blog)、[NestJS prerequisites](https://docs.nestjs.com/first-steps)、[Vite 8 release](https://vite.dev/blog/announcing-vite8)。

## 请求流与服务边界

Web 提供简洁的响应式状态页，通过 Vite 代理将 `/api/v1/health` 请求转发到 API。轻量 Pinia health store 负责加载、在线、离线状态、`requestId` 与错误信息，并通过 action 调用 API 模块；页面只呈现 store 状态，不展示伪造的比赛或队伍数据。阶段一不添加持久化插件或其他业务 store。

API 提供 `GET /api/v1/health`，成功响应包含 `status` 与 `requestId`。该接口只表示应用进程已启动，不连接数据库，也不返回密钥、环境变量、系统路径或运行时细节。

Nest 全局配置负责环境变量校验、DTO 转换与白名单校验、统一异常响应以及 Swagger 文档。错误响应沿用计划书结构 `{ code, message, requestId, details? }`；未知异常返回通用 500 文案，不返回堆栈。

Swagger 文档由受控配置生成。`api:generate` 从该文档生成 `packages/api-types`；生成过程不访问学校网站、不需要生产密钥或数据库。CI 重新生成类型并检查 Git 差异，避免生成内容未提交。

## CI 与 GitHub 协作

`.github/workflows/ci.yml` 在面向 `main` 的 Pull Request、推送到 `main` 和手动触发时运行。quality 检查包括锁文件安装、格式、lint、接口类型同步、类型检查、构建与单元测试；`ci-gate` 仅在 quality 成功时成功。工作流不按路径跳过检查，使用同 PR 并发取消旧运行，权限仅授予读取内容所需权限，第三方 Action 固定到核验过的完整提交 SHA。

Pull Request 模板包含变更目的、验证记录、数据库迁移说明和界面截图栏目。CI 配置提供 `ci-gate` 检查名，但分支保护、必需检查与 Auto-merge 设置需要仓库权限，且本次无法读取远端；它们不作为本地代码已完成或已验证的声明。

## Git 初始化与远端状态

本地仓库以 `main` 为初始分支，并配置 `origin` 为用户提供的 URL。当前环境的 Git 凭据协商失败，无法读取远端分支或提交历史。因此本阶段只创建本地提交，不推送；远端历史确认并且认证可用后再推送，避免覆盖未知历史。

## 不在本次范围内

- 数据库 schema、迁移、PostgreSQL 服务和真实数据。
- 注册、登录、Session、资料、比赛、收藏、队伍、申请、邀请、通知、举报和管理后台。
- 生产部署、域名配置、分支保护和真实 PR 自动合并验证。
- 依赖缓存优化、Turborepo、Nx、聊天、AI 推荐或学校身份认证。

## 阶段一验收

- 干净检出可按文档安装依赖，Web 与 API 可分别启动。
- Web 经开发代理调用 API 健康接口，Pinia store 能展示真实响应状态和请求失败状态。
- API 健康接口不依赖数据库，不暴露环境或系统细节；Swagger 文档可访问。
- OpenAPI 类型生成结果与提交内容一致；工作区 lint、格式、类型检查、构建和单元测试可运行。
- GitHub Actions 的 `ci-gate` 能反映 quality 成败；故意引入类型错误并观察 GitHub CI 阻断、实际分支保护与 Auto-merge 验证都需要远端认证和仓库权限，未完成前单独记录，不虚报已验证。
