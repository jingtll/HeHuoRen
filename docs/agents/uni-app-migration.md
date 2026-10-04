# uni-app 迁移提醒与集中待办

## 时间与目标

项目完成后统一迁移到普通 uni-app，目标为 H5 和微信小程序。当前继续交付 Vue Web；此文登记现有适配点，不要求本次改造，也不表示相关能力全部不受支持。尚未建立 uni-app 工程或进行小程序运行验收。

## 持续协作规则

以后开发中，遇到影响跨端的选型或实现，在确定方案或引入实现时：

1. 指出具体 API、组件、样式及源码位置。
2. 分别解释 H5、微信小程序影响，明确区分官方已知限制、推断与待验证事项。
3. 提供替代方案，或说明迁移需做的适配与成本。
4. 在方案、Issue 或 PR 记录已采用方案及成本，重要事项同步本表。发布 Issue 仍遵循 issue-tracker.md 的先展示与确认规则。

不能用 Web SVG 正常、Chrome 样式正常或 jsdom 通过来推断小程序兼容。功能验收与跨端验收分别记录；后续验证时记下 uni-app/微信基础库版本、设备和平台。

## 当前集中待办

所有下列适配均留待统一迁移，负责人为后续迁移实施者；当前状态为“已登记，目标端待实测”。

| 位置/能力                                                           | H5 影响                                      | 微信小程序影响与适配路径                                                                                     | 成本 |
| ------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---- |
| AuthView 的 HTMLFormElement、querySelector、focus                   | 浏览器焦点与原生 Enter 提交可用，迁移后回归  | 没有同等浏览器 DOM；改用输入组件 focus 属性和平台表单事件，保留首个错误定位                                  | 中   |
| router/index.ts 的 document.title、History、window.scrollTo、锚点   | 核对部署回退、标题、刷新、历史和滚动         | 使用 pages.json、uni.navigateTo/redirectTo、导航栏标题与页面滚动 API，重新设计筛选参数恢复                   | 中   |
| AppIcon / @lucide/vue 动态组件与 SVG                                | Vue/Web SVG 当前已验收；uni-app 编译仍需验证 | 不能直接移植 Web SVG 与动态 component；统一入口按平台换 image/模板，优先本地 PNG，颜色需资源或其他受支持方案 | 中   |
| CollegePicker 内联 SVG 勾选                                         | 保留按压与选中语义                           | 勾选改为受支持资源/样式，同时验证可访问反馈                                                                  | 低   |
| style.css / BrandLayout / CollegePicker 的 svh、40svh               | 依浏览器动态视口验证                         | 小程序视口单位能力待实测，可按窗口高度计算卡片固定尺寸，保留内部滚动                                         | 中   |
| Grid、gap、复杂选择器、Tailwind 与 CSS 变量                         | 当前响应式布局已使用，按目标浏览器回归       | 按基础库与实际编译输出验证，必要时 Flex/平台模板/静态主题；不能笼统认定 Grid 全部不可用                      | 中   |
| CollegePicker overflow、滚动条伪元素                                | 可定制浏览器滚动条                           | 核对 scroll-view 内部滚动及可滚动提示，滚动条装饰可降级                                                      | 低   |
| student-bottom-nav / student-content 的 env(safe-area-inset-bottom) | 当前浏览器安全区域；真实 iOS 仍待测          | 使用平台安全区域信息或平台导航，重测正文底部空间与点击区域                                                   | 中   |
| AuthInput 原生 input、button、form 与 aria-*                        | 当前原生键盘、名称、错误关联                 | 迁移到平台表单控件；键盘、焦点、显隐、辅助技术支持需独立验收                                                 | 中   |
| ProjectLogo 与学院 WebP、mix-blend-mode                             | 当前资源构建加载正常                         | 使用 image 的 aspectFit；核对基础库/系统 WebP 支持和混合效果，可用 PNG 及底色兜底                            | 低   |
| api/http.ts 的 Axios 浏览器请求                                     | 同源代理与超时当前可用                       | 改为 uni.request 或请求适配器，处理域名白名单、错误与响应映射                                                | 中   |

## 官方依据与验证原则

依据截至 2026-10-03 查阅的官方文档：[Vue3 平台差异](https://uniapp.dcloud.net.cn/tutorial/vue3-basics.html)、[image 图片与平台差异](https://uniapp.dcloud.io/component/image.html)、[SelectorQuery](https://uniapp.dcloud.net.cn/api/ui/nodes-info.html)。Vue 支持差异不等同于 Web DOM 可用；SelectorQuery 提供节点信息而非浏览器 focus 的等价替代。image 文档说明小程序 SVG 仅支持网络地址，因此本地 PNG 是迁移候选，不把本地 SVG 当作已验证的方案。

[Lucide Vue 文档](https://lucide.dev/guide/vue)说明 Vue 组件渲染 SVG 与静态按需导入；这是 Web 渲染依据，不是微信小程序支持声明。CSS 和安全区域表中内容是适配调查项，须在项目最终选择的编译器、基础库与设备上验证后更新状态。

## Issue #12 新增适配点

| 位置 / 能力                                                                        | H5 影响                                                          | 微信小程序影响与适配路径                                                                                                   | 成本 |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---- |
| competition-discovery.ts 与 router/index.ts 的 query、replace、History 和赛段 hash | 回归 URL 规范化、刷新、前进后退、详情返回和锚点；保留无关参数    | 转换为平台路由参数、页面状态与返回恢复；以赛段 ID 定位平台节点                                                             | 中   |
| CompetitionListView 的 search、select、form 和 live region                         | 当前浏览器原生控件；迁移后重新检查键盘、标签、焦点及选项         | 改用 input、picker、button 等平台组件；独立验证筛选交互与可访问反馈                                                        | 中   |
| CompetitionDetailView 的外链和 navigator.clipboard                                 | 官网页面可新窗口打开；剪贴板受浏览器权限影响，已提供手动复制回退 | 使用 uni.setClipboardData，并按官方要求核对小程序隐私保护指引配置；web-view 需配置业务域名，不能假设各学院官网均可直接打开 | 中   |
| competition-discovery.ts 的 Intl.DateTimeFormat / Asia/Shanghai                    | 当前浏览器按北京时间格式化，跨 UTC 边界测试覆盖                  | 核对目标运行时 Intl 与时区支持，必要时改成统一北京时间格式函数                                                             | 低   |

后续比赛数据请求以 [uni.request](https://zh.uniapp.dcloud.io/api/request/request) 适配，微信小程序需配置 request 合法服务器域名；本期没有比赛 API 请求。官网原文适配依据 [web-view](https://uniapp.dcloud.io/component/web-view.html)，复制候选依据 [uni.setClipboardData](https://uniapp.dcloud.io/api/system/clipboard)。上述均为迁移登记，尚未建立 uni-app 工程，Web 验收不证明小程序兼容。
