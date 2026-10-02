# 禾伙人项目约定

输出中文。

## Agent skills

### 禁用 Superpowers

本项目禁用整个 Superpowers 技能包。处理本仓库任务时，不加载、调用或遵循该包的技能及其工作流；即使全局技能目录仍列出这些技能，也按本项目规则跳过。使用其他技能时，遇到对 Superpowers 的依赖也跳过该依赖。

禁用范围包括所有 `superpowers:*` 技能，以及无此前缀的包内技能：`using-superpowers`、`brainstorming`、`writing-plans`、`executing-plans`、`dispatching-parallel-agents`、`subagent-driven-development`、`test-driven-development`、`systematic-debugging`、`using-git-worktrees`、`verification-before-completion`、`requesting-code-review`、`receiving-code-review`、`finishing-a-development-branch`、`writing-skills`。

按用户需求和本仓库约定直接开展工作，其他技能仍按任务需要使用。

### Issue tracker

本仓库的问题与方案记录在 GitHub Issues。参见 `docs/agents/issue-tracker.md`。

### Triage labels

分诊、生成方案与拆分任务时，使用默认五类状态标签；标签映射参见 `docs/agents/triage-labels.md`。

### Domain docs

项目采用单一上下文：根目录 `CONTEXT.md` 与 `docs/adr/`。参见 `docs/agents/domain.md`。
