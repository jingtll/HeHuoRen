# Issue #17：首页学院入口最终验收记录

> 历史材料：本文件与关联截图记录移除 Vant 前的阶段事实，不作为迁移后验收结果。现行样式方案见 [ADR 0002](adr/0002-student-styling-and-uni-app.md)，新验收见 [Issue #19](issue-19-validation.md)。

验收日期：2026-10-03。按 [Issue #17](https://github.com/jingtll/HeHuoRen/issues/17) 和用户随后确认的交互变更核验，**前端交付已完成，当前具备验收条件**。GitHub Issue 仍为 open，正文的“单选”尚未同步为本次用户确认的多选；本次仅检查及完善本地交付，没有发布、更新或关闭 Issue。

## 最终需求与按钮逻辑

用户确认的最终行为优先于原 Issue 中的单选表述：默认不选学院，可多选并逐项取消；只有点击“全部学院”才激活该按钮，再点则取消。移动端整个卡片占小视口高度约40%，内部网格滚动。

| 当前状态与操作         | 结果                   | 按钮反馈                             |
| ---------------------- | ---------------------- | ------------------------------------ |
| 默认打开首页           | 未选择，空数组         | 所有院徽及全部按钮均未勾选           |
| 点击未选院徽           | 加入自选学院           | 该院徽边框、勾选与 aria-pressed 激活 |
| 已有自选再点击其他院徽 | 保留之前学院并增选     | 多项同时勾选，底部显示数量           |
| 点击已选院徽           | 只取消该项             | 其他院徽保持选择                     |
| 取消最后一项           | 回到空数组             | 不自动选中全部按钮                   |
| 未选择或自选时点击全部 | 清除自选，进入全部状态 | 全部按钮浅绿底、绿色边框、勾选       |
| 全部状态再次点击全部   | 回到空数组             | 全部按钮恢复白底并移除勾选           |
| 全部状态点击院徽       | 进入仅该院的自选状态   | 全部按钮熄灭，该院勾选               |
| 逐个选满27个学院       | 保持自选数组           | 不自动激活全部按钮                   |

未发现按钮状态转换、界面反馈与模型同步的遗留错误。检查并修复了选择事件参数与受控模型数组共享的问题：现在发出独立数组副本，外部监听器原地修改事件参数不会改变当前选择；对应回归测试已通过。

“全部”与“未选择”是两个独立状态；取消全部不恢复之前的自选项。重复选中/取消可用鼠标、触摸和 Enter/Space 操作。卡片选择数量再多也不会撑高。

## #12 对接接口

- `CollegePicker.vue` 通过受控 `v-model` 接收 `CollegeSelection`，定义位于 `apps/web/src/data/college-selection.ts`：`CollegeId[] | "all"`。空数组代表未选择，非空数组代表自选学院，`"all"` 代表明确选择全部。
- `update:modelValue` 总是提供完整选择值。自选非空时另发 `select(ids: CollegeId[])` 副本；选择全部时发无参数 `reset()` 通知；取消最后一项或取消全部时发无参数 `clear()` 通知。命名事件仅作通知时，调用方已能从事件类型知道全部或空状态；完整值以模型为准。避免同时监听模型和命名事件而重复请求。
- `apps/web/src/data/colleges.ts` 导出27项记录及稳定 `CollegeId` 联合类型，映射不依赖位置索引或官网地址。处理脚本按学院名称到ID的成对映射生成，并核对源清单顺序，避免悄悄错配。#12 可复用ID、模型及素材，恢复URL状态时校验传入ID并去重。
- 首页跳转到比赛详情占位后返回，学院选择保留；整页刷新及URL恢复属于 #12。当前下方仍为待开发占位，页面明确说明比赛筛选尚未接入，不展示虚假筛选结果。

## 验收标准逐项判断

| Issue 验收点                             | 结论及依据                                           |
| ---------------------------------------- | ---------------------------------------------------- |
| 首页27入口，名称顺序和院徽对应正确       | 通过；自动测试与原研究JSON核对，无重复或遗漏         |
| 圆形容器、完整长名称                     | 通过；三宽度实测圆形，名称自然换行无省略             |
| 25院徽及缺少/失败回退                    | 通过；两项缺失显示农/土；拦截图片请求验证首字回退    |
| 卡片稳定、内部滚动访问全部               | 通过；键盘翻页、滚轮、触摸及末项验证                 |
| 学院选择、全部按钮及稳定ID               | 通过；按用户后续确认改为多选，按钮逻辑见上表         |
| 占位及未接入筛选状态清楚                 | 通过；保留待开发内容并说明                           |
| 展示素材、原素材及来源保留               | 通过；25原图SHA-256复核，原SVG和裁剪记录保留         |
| 独立哈希资源、大小/请求/缓存记录         | 通过；25独立WebP、无JS图片内联；实测如下             |
| 375/390/1440px无横向溢出、导航不挡操作   | 通过；最新三宽度浏览器复核及截图                     |
| 键盘焦点、完整可访问名称、非纯色选中反馈 | 通过；Tab/Enter/Space/PageDown，实线焦点、边框及勾选 |
| 格式/lint/typecheck/build/相关测试       | 全量通过，详见下表                                   |

原要求约三行可见；当前紧凑布局在常用手机高度显示约三行名称。更矮屏幕按用户确认的40%屏高优先，内部滚动访问后续入口。小于360px宽改为三列。

## 全仓质量检查

| 检查                                         | 结果                          |
| -------------------------------------------- | ----------------------------- |
| `pnpm format:check`                          | 通过                          |
| `pnpm lint`                                  | API与Web通过                  |
| `pnpm api:generate`                          | 通过                          |
| API OpenAPI及生成类型 `git diff --exit-code` | 无漂移                        |
| `pnpm typecheck`                             | API、Web、类型包通过          |
| `pnpm build`                                 | API与Web通过                  |
| `pnpm test:unit`                             | API 6项、Web 50项，共56项通过 |
| `pnpm test:integration`                      | 1项通过                       |
| `pnpm test:e2e`                              | 1项真实HTTP测试通过           |
| `git diff --check`                           | 通过                          |

合计58项测试通过。Web包含11项学院组件测试，覆盖数据一致性、默认未选、多选取消、全部状态进入/退出、父页面恢复、手动选满27项、事件数组隔离、缺图回退、白色透明院徽底衬及懒加载。测试输出中的 Node VM Modules 提示来自现有Jest配置，不是失败。远端CI尚未执行，本地检查不替代远端CI。

## 素材处理与实测

复用研究清单的顺序、正式名称及全部裁剪范围，不重绘或替换院徽。23张官网原始图片和两张SVG内嵌PNG解码原图在研究目录 `originals/`，两张原SVG在 `assets/`。农业工程、土木工程尚无独立院徽，保持首字回退；经济学院用户原素材底部已有截边，保留原貌并保留用户来源与官网图案佐证。

处理脚本 [prepare-homepage-assets.py](research/sicau-colleges-2026-10-02/prepare-homepage-assets.py) 使用 Python 3 和 Pillow 12.2.0，复用本地原图；只有原图缺失时才按来源下载。验证源尺寸和裁剪边界，等比裁剪缩放。图案当前桌面40px、手机28px，资源按最大显示尺寸约2倍生成，最长边上限80px，低分辨率来源不扩大。页面访问时无图片加工或官网代理。

PNG与无损WebP来自同一裁剪缩放结果，按体积选择；25项均选择WebP。PNG合计**277,987 B**，WebP合计**186,428 B**（186.428 KB / 182.06 KiB），约比PNG小32.9%，低于500 KB初步目标。原始图片合计4,456,002 B。来源、原图SHA-256、裁剪、尺寸及逐项比较见 [homepage-assets.json](research/sicau-colleges-2026-10-02/homepage-assets.json)。

| 学院               | 稳定 ID                    | 展示像素 | PNG 字节 | WebP 字节 |
| ------------------ | -------------------------- | -------- | -------- | --------- |
| 农学院             | `agriculture`              | 80 × 80  | 13318    | 7094      |
| 动物科技学院       | `animal-science`           | 80 × 80  | 17268    | 9146      |
| 动物医学院         | `veterinary-medicine`      | 76 × 76  | 13151    | 9402      |
| 草业科技学院       | `grassland-science`        | 80 × 80  | 12847    | 9674      |
| 水产学院           | `fisheries`                | 80 × 80  | 15716    | 7466      |
| 林学院             | `forestry`                 | 80 × 80  | 16513    | 12914     |
| 园艺学院           | `horticulture`             | 74 × 74  | 5835     | 3304      |
| 风景园林学院       | `landscape-architecture`   | 78 × 80  | 9495     | 6786      |
| 资源学院           | `resources`                | 80 × 80  | 8794     | 6524      |
| 环境学院           | `environment`              | 70 × 70  | 12845    | 11422     |
| 经济学院           | `economics`                | 80 × 60  | 11833    | 7986      |
| 管理学院           | `management`               | 80 × 80  | 14788    | 11476     |
| 农业工程学院       | `agricultural-engineering` | 首字     | —        | —         |
| 食品学院           | `food-science`             | 74 × 74  | 5638     | 3338      |
| 理学院             | `science`                  | 80 × 80  | 13970    | 7258      |
| 生命科学学院       | `life-science`             | 52 × 80  | 3769     | 2694      |
| 机电学院           | `mechanical-electrical`    | 80 × 80  | 4932     | 3044      |
| 信息工程学院       | `information-engineering`  | 80 × 60  | 9018     | 5496      |
| 水利水电学院       | `water-conservancy`        | 80 × 80  | 16987    | 12284     |
| 人文学院           | `humanities`               | 80 × 80  | 14370    | 10310     |
| 公共管理学院       | `public-administration`    | 80 × 78  | 17348    | 11542     |
| 法学院             | `law`                      | 80 × 80  | 11298    | 8232      |
| 体育学院           | `sports`                   | 60 × 75  | 9924     | 5162      |
| 艺术与传媒学院     | `arts-media`               | 80 × 60  | 2215     | 1680      |
| 建筑与城乡规划学院 | `architecture-planning`    | 52 × 52  | 1140     | 652       |
| 土木工程学院       | `civil-engineering`        | 首字     | —        | —         |
| 商旅学院           | `business-tourism`         | 80 × 80  | 14975    | 11542     |

园艺、食品、机电、建筑与城乡规划四枚图案为白色透明院徽，仅用深绿圆形容器底衬，不修改图案颜色。导入使用 `?no-inline`，即使小于默认内联阈值也生成独立带内容哈希文件。核验生产构建有25个WebP，体积和文件内容与源目录一致，JS中无图片Base64；原图SHA-256全部一致。

重新生成（Python环境需有Pillow12.2.0；已有原图时无需访问官网）：

```powershell
python docs/research/sicau-colleges-2026-10-02/prepare-homepage-assets.py
pnpm exec prettier --write apps/web/src/data/colleges.ts docs/research/sicau-colleges-2026-10-02/homepage-assets.json
```

## 最新浏览器与网络验证

本地生产预览 `http://127.0.0.1:4173/home`，Chromium独立上下文，设备像素比1；手机启用触摸，减少动态效果以稳定截图。375×812、390×844、1440×1000全部验证27入口、25图片、圆形、无横向溢出、多选、逐项取消、全部进入与再次取消、全部转自选、手动选满27项、卡片高度稳定、键鼠触摸滚动及移动导航不挡末项。三个上下文页面脚本异常均为0。最新证据：[issue-17-browser-results.json](issue-17-browser-results.json)。

另以375×812复核Tab从全部按钮进入滚动区及院徽，焦点为实线（计算宽度2.4px），Enter选中、Space取消；全部按钮点击进入及再次取消通过。拦截农学院图片加载验证回退“农”且仍可选择。

| 视口        | 卡片高度 | 首次院徽请求数 | 首次正文 | Resource Timing transferSize | 再次访问响应 | 再次正文 |
| ----------- | -------- | -------------- | -------- | ---------------------------- | ------------ | -------- |
| 375 × 812   | 324.8px  | 25             | 186428 B | 193928 B                     | 25个304      | 0 B      |
| 390 × 844   | 337.6px  | 25             | 186428 B | 193928 B                     | 25个304      | 0 B      |
| 1440 × 1000 | 369.6px  | 25             | 186428 B | 193928 B                     | 25个304      | 0 B      |

前三行12张声明为 `loading=eager`，其余13张 `loading=lazy`；实际浏览器提前加载附近图片，三个视口首访均请求25张，不把12张声明为实测请求数。重复访问在同一上下文先离开到空白页再返回；Vite preview 图片 `Cache-Control: no-cache`，25张均304重新验证，未重传正文。每项Resource Timing记录300 B估计开销、合计7,500 B，不代表完整链路头/TLS开销，也不代表生产长缓存命中。

截图已更新：

- [桌面默认](screenshots/issue-17-desktop.png) · [375px默认](screenshots/issue-17-mobile-375.png) · [390px默认](screenshots/issue-17-mobile-390-viewport.png)
- [桌面多选](screenshots/issue-17-multiple-1440.png) · [375px多选](screenshots/issue-17-multiple-375.png) · [390px多选](screenshots/issue-17-multiple-390.png)
- [桌面全部](screenshots/issue-17-all-1440.png) · [375px全部](screenshots/issue-17-all-375.png) · [390px全部](screenshots/issue-17-all-390.png)
- [桌面末项](screenshots/issue-17-selected-1440.png) · [375px末项](screenshots/issue-17-selected-375.png) · [390px末项](screenshots/issue-17-selected-390.png)
- [图片失败回退](screenshots/issue-17-image-fallback.png)

移动端完整页面截图中的底部导航位于实际视口底部，长页面其余内容可继续滚动。

## 后续部署要求与完成边界

Issue明确生产缓存随部署落实，不阻塞本前端交付。生产环境尚未上线：Nginx静态提供、长缓存命中、真实带宽及高密度实机显示仍未验证。部署时院徽由Nginx直接提供，不经过NestJS或数据库；哈希静态资源返回 `Cache-Control: public, max-age=31536000, immutable`，HTML用 `no-cache` 重新验证并保留SPA fallback。示意配置需合并到最终部署配置后检查实际响应头：

```nginx
# root 指向部署后的 Web dist 目录。
location /assets/ {
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
location = /index.html {
    add_header Cache-Control "no-cache";
}
location / {
    try_files $uri $uri/ /index.html;
}
```

暂不引入对象存储或CDN。比赛筛选、后端接口及URL恢复由 #12 等后续任务交付；本地功能与验证完成不代表已经提交、合并、上线或关闭GitHub Issue。
