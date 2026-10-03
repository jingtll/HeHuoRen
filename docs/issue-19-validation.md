# Issue #19 验收记录

验收日期：2026-10-03。范围：[Issue #19](https://github.com/jingtll/HeHuoRen/issues/19)。修改前基点：`607b50b345dc7485b220a0da839050c9e11c8670`；仓库已有未提交的文档与 Issue #12 Demo，保留其内容，本记录只说明 #19 的新增实现和验收。

## 实现

- 删除 main.ts 的 Vant 导入及全局注册，AuthInput/AuthView/HealthView/StudentLayout 与路由测试均不再依赖 Vant。
- pnpm 移除 Vant，锁文件清理 @vant/use、@vant/popperjs；冻结安装成功。活跃源码、配置与锁文件没有 Vant、van-* 或旧导航图标名称残留。
- 认证采用原生 button，显隐与验证码为 button，登录/注册为 submit；保留模型、插槽、错误关联、校验和服务未开放反馈。
- 健康四态模型保持，标签用语义主题类，LoadingIndicator 用 Tailwind 动画并尊重减少动态效果；请求 ID 用 dl/dt/dd 和 wrap-anywhere；加载期间按钮禁用。
- 导航与顶栏统一 AppIcon，静态按需引入 @lucide/vue 1.51.0 七个图标。来源与完整许可证见[样式文档](student-ui-style.md)及[许可证通知](../third-party-notices/lucide-LICENSE.txt)。
- 保留主题变量、学院多选/取消/显式全部与移动40svh卡片。旧Vant样式层、变量和覆盖全部移除。补齐按钮44px高度、内边距、边框、字体、焦点、禁用和加载外观。
- README、计划书、样式约定、ADR和Demo说明已更新；历史设计、实施计划及验收记录标注适用时期，保留旧事实与截图。CONTEXT只维护业务词汇，未添加技术描述。
- 普通uni-app迁移时机、H5/微信小程序目标和持续提醒规则写入AGENTS入口、[迁移待办](agents/uni-app-migration.md)与[ADR 0002](adr/0002-student-styling-and-uni-app.md)。

## 质量检查

Node.js 24.15.0、pnpm 10.30.3；本地检查全部通过：

| 检查                                 | 结果                     |
| ------------------------------------ | ------------------------ |
| pnpm install --frozen-lockfile       | 成功，锁文件无需解析更新 |
| pnpm format:check                    | 通过                     |
| pnpm lint                            | API/Web通过              |
| pnpm typecheck                       | API/Web/接口类型包通过   |
| pnpm build                           | API/Web通过              |
| pnpm test:unit                       | Web 51项、API 6项通过    |
| pnpm test:integration                | 1项通过                  |
| pnpm test:e2e                        | 1项通过                  |
| pnpm api:generate 与生成文件差异检查 | 成功，无契约差异         |
| git diff --check                     | 通过                     |

Web新增路由级回归覆盖健康加载禁止重复操作、状态反馈和长请求ID；原有50项覆盖认证、学院、导航和健康状态。jsdom不验证布局或原生Enter提交，这些由下述浏览器检查补足。

## 浏览器与视觉检查

使用生产构建及本地Vite preview，Chromium，375/390/1440px宽、900px高。92项浏览器检查全部通过，脚本和原始结果保留本地；PR保留验收摘要和代表性截图。

覆盖：首页、登录、注册、健康页无横向溢出；按钮44px最小高度与图标可访问语义；移动正文不被底栏遮挡；学院40svh、多选、取消、全部和取消全部；导航当前页及收藏/通知移动“我的”归属；认证首错误焦点、可访问名称、密码独立显隐、验证码反馈、原生Enter/点击提交和可见焦点；健康加载禁用、失败、重试、刷新、长ID换行与减少动态效果；键盘Tab跳到正文及焦点落点。

截图已实际检查布局、间距、字体、按钮和加载/禁用视觉。焦点轮廓样式声明3px；浏览器测得2.4px，按可见且至少2px检查，避免设备缩放量化误报。无页面JavaScript错误；控制台有缺少favicon的404和故意模拟离线的503，均不属于页面运行异常。

健康浏览器响应为验收桩，不代表真实服务或数据库；API集成/E2E另行验证。未运行Safari、Firefox、真实iOS安全区域或微信小程序，未来迁移独立验收。

为精简交付，仅保留代表性截图；三种视口均已完成上述检查。

- 首页与导航：[375px](screenshots/issue-19-home-375.png)、[390px](screenshots/issue-19-home-390.png)、[1440px](screenshots/issue-19-home-1440.png)。
- 认证：[375px注册](screenshots/issue-19-register-375.png)、[390px登录](screenshots/issue-19-login-390.png)。
- 健康：[长请求ID](screenshots/issue-19-health-390.png)、[加载/禁用](screenshots/issue-19-health-loading.png)、[离线/重试](screenshots/issue-19-health-offline.png)。
- 固定底栏：[375px正文底部](screenshots/issue-19-home-bottom-375.png)，使用实际视口捕获避免整页拼接影响固定定位。

## 同条件构建体积

修改前后同一机器、Node/pnpm、锁定构建工具与生产命令 `pnpm --filter @hehuoren/web build`；Vite 8.3.1。统计dist/assets所有JS/CSS文件总字节，gzip使用Python gzip.compress、mtime=0、默认level9，按每文件压缩后求和。原始逐文件明细保留本地，汇总字节如下表。不是单一路由首屏网络量，也不包含图片或HTML，不证明运行时性能。

| 产物     | 修改前 bytes | 修改后 bytes |               变化 |
| -------- | -----------: | -----------: | -----------------: |
| JS原始   |       192551 |       181639 |   -10912（-5.67%） |
| JS gzip  |        75627 |        71583 |    -4044（-5.35%） |
| CSS原始  |       219448 |        21078 | -198370（-90.39%） |
| CSS gzip |        58217 |         5406 |  -52811（-90.71%） |

包含新图标和加载实现后的整体构建结果；性能改善是实测附加收益，不作为移除Vant的先验承诺。

## 两轴审查

Standards：发现1处文档规范不一致，已修正为主要操作使用hhr-button、输入行显隐使用局部auth-reveal样式；未发现其他明确规范问题或代码异味。

Spec：0项发现。独立审查确认实现与Issue #19范围、行为、图标、迁移规则及验收证据一致。

## 审查与发布边界

用户授权全量检查后提交并创建 PR。提交前再次通过全仓检查、59项测试、92项浏览器检查和本次新增和修改文档本地引用核验；修复验收脚本经格式化后尾随分号导致的调用语法错误，使用命名函数后复跑成功。PR仅保留Issue #19实现、必要文档与验收证据；此前误纳入的Issue #12 Demo、研究资料同步及无关文档扩写已从PR差异移出，原内容保留本地，重复截图精简为9张代表性证据。PR 使用草稿状态供审查，远端CI以PR实时检查为准；不主动更新或关闭Issue，相关发布仍遵循仓库确认规则。
