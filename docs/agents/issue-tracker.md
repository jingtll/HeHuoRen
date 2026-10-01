# 问题跟踪器：GitHub

本仓库的问题与方案记录在 GitHub Issues，使用 `gh` CLI 操作。

## 约定

- 创建：`gh issue create --title "..." --body "..."`。
- 查看：`gh issue view <编号> --comments`；需要时同时读取标签。
- 列表：`gh issue list`，按状态和标签筛选，并读取正文与评论。
- 评论与标签：使用 `gh issue comment`、`gh issue edit --add-label/--remove-label`。
- 关闭：`gh issue close <编号> --comment "..."`。
- 默认仓库由 `git remote -v` 推断。

## Pull Requests 是否作为需求入口

**PRs as a request surface: no.** 外部 PR 不进入 issue triage 流程。

## 技能中的 issue 操作约定

- “发布到问题跟踪器”：创建 GitHub Issue。
- “获取关联任务”：运行 `gh issue view <编号> --comments`。
- `/wayfinder` 地图使用 `wayfinder:map` 标签；子任务使用 `wayfinder:research`、`wayfinder:prototype`、`wayfinder:grilling` 或 `wayfinder:task` 标签。
- 子任务优先使用 GitHub 子 issue 关联；不可用时，在地图正文中列出任务，并在子 issue 开头标注 `Part of #<地图编号>`。
- 阻塞关系优先使用 GitHub 原生 issue dependencies；不可用时，在正文标注 `Blocked by: #<编号>`。
- 领取任务时指派给当前用户；完成时先评论结果，再关闭 issue，并把决策摘要补充到地图。

GitHub 的 issue 与 PR 共用编号。遇到不确定的 `#编号` 时，先运行 `gh pr view <编号>`，失败后再运行 `gh issue view <编号>`。
