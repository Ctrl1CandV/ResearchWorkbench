# PLAN-004 实施验收记录（2026-09-15）

## 1. 范围与输入

依据 PLAN-004 阶段 0–4 实施，配套 DESIGN-005、READING-TEMPLATES-005、TECH-LEARNING-005。用户这一轮的诉求是实施（上一轮 Codex 只做策划与设计）。三个已批准方向不变；不重排方向、不承诺发表、不迁移或删除旧记录。

阶段 0 保护基线（实施前实测）：

| 项 | 值 |
|---|---|
| styles.css 旧版段 | 前 321 行，sha256 前 16 位 `4580d12c6f3be8d8`（实施后复核未变） |
| 旧版页面 | legacy.html、app.js、domain.js、content.js 未改动 |
| 旧本人记录 | 新页面不读写任何浏览器本地存储；legacy 入口保留 |

## 2. 改了什么

| 文件 | 变更 |
|---|---|
| public/library-content.js | 内容模型升级：新增 home（四区说明/首读/首次使用）；方向补 overview/stateOfField/asOf/whyChoose/limits/openQuestions/sources，路线加 stage/required；20 篇论文改用 deliveredDepth + recommendedDepth + role/roleReason，正文改为 block（paragraph/list/comparison/callout/formula）；技术路线改为 6 条必学主干 + 5 条按需支线，含 units/resources 字段；新增旧公开内容 5 篇作为支线（保留原摘要级覆盖） |
| public/library.js | 新增 #/home 首页渲染、方向详情按阶段分组、按深度分支的论文页、block 白名单渲染器、技术概览与单元详情；validateLibrary 重写为 PLAN-004 契约；新增 deliveredDepthOf/recommendedDepthOf/routeStages/routeStartable/unitResources 等纯函数 |
| public/index.html | 新增“首页”导航与 #/home；侧栏方向入口改为可折叠分组；旧版入口改名为“历史笔记（旧版入口）”；标题与品牌改为平台口径 |
| public/styles.css | 仅替换新版段（旧版 321 行不动）：字体职责（正文中英统一无衬线 18px/1.9，标题用宋体栈）、home 四区栅格、阶段/徽章/提示框/公式/表格样式、侧栏与主按钮各状态显式定色 |
| tests/library.test.mjs | 按新契约重写并扩充（34 项）：深度门槛、block 合法性、方向说明完整性、技术可开始门槛、资源字段、旧支线覆盖级别、首页无假进度、样式字体与作用域 |

## 3. 真实来源核查（本轮实际执行）

- **Astute RAG 精读卡**：实际读取 arXiv HTML 全文（2410.07176v2），覆盖摘要、§3、§4.1–4.4、§5 与 Limitations。卡内数字（约 70% 段落不含答案、19.2% 冲突、47.4/52.6、最坏情形差距超过 50 点、冲突子集约 80%、judge 98.2%/95.0%、成本 <5% 与提升 >11%）均取自散文叙述；图未看、表未逐格核对，已在卡内“来源与覆盖”中写明。
- **技术资源定向核查（2026-09-15）**：Python 官方教程 Modules（章节级）、pytest 官方文档（站点分区）、Pro Git 第二版（章目级）、Microsoft 课程第 01/11/14 课（章节级，02/17 课为目录级）、LangGraph 官方 overview（章节级）、OWASP GenAI（站点级）、FastAPI 教程（章节级）。
- **抓取失败、未核验的**：Hugging Face Agents Course、Docker 官方 get-started。二者只写在路线的待办说明里，不作为可开始资源。

## 4. 验证结果

- `npm test`（node --test）：实施时本机实测 **190 项通过、0 失败、0 跳过**；独立验收环境实测 **189 通过、1 跳过**（Windows 符号链接权限条件跳过）。两处环境差异如实记录，以验收方在验收环境的实测为准。审查回流修复后复测：**200 项通过、0 失败、0 跳过**（本机，2026-09-15 晚）。
- 内容契约：validateLibrary 对真实内容包返回 ok=true；深度分布 1 deep / 2 standard / 13 quick / 4 entry；六条必学主干全部 `routeStartable=true`。
- DOM 冒烟（临时最小 DOM 桩，不入库）：26 个视图全部渲染成功，0 失败；deep 卡 2335 字、standard 1868/1720 字、quick 848/718 字、entry 926 字，结构差异可见。
- 服务：127.0.0.1:4173 返回 200，CSP 与安全头不变，白名单路径行为不变。

## 5. 明确未测 / 未完成

- **真实鼠标点击与视觉验收未完成**：本轮用 DOM 桩验证渲染，没有在浏览器里做指针点击，也没有可检视的截图，不宣称视觉与交互验收通过。
- 桌面 1280/1440 与手机 390 的实际视口只做了样式规则层面的处理（栅格、字体、表格横向滚动、侧栏满视口修复保留），未做像素级检查。
- 仍为 quick 的 13 篇（含 5 篇旧支线）没有正文依据，不会升级为阅读卡；TOSEM 建议精读但当前只交付“正文选读”，升级需要再读 §5 与关键设置。
- 旧版内容只做了公开支线接入；个人笔记迁移与旧版退役按设计另需明确授权，本轮未做、也未删除任何旧代码或旧记录。
- 未提交、未推送、未部署（git 仓库仍无任何 commit，文件为未跟踪状态）。

## 6. 审查回流修复（2026-09-15 晚，依据 docs/REVIEW-PLAN-004.md）

独立验收裁决为“主体可试用，6 项 P2 待修 + 视觉/交互证据缺口”。修复批次的落实情况：

| 待修项 | 落实方式 | 证据 |
|---|---|---|
| 1. 阅读目录与标题不一致 | 章节标题收敛为单一来源：`library.js` 新增 `PAPER_SECTION_TITLES` + `sectionTitle(depth, key)`，目录与正文都用它生成；quick 卡正文用词（为什么留意这篇/取全文时先核对）与目录一致，entry 同理 | `tests/library.test.mjs` 回流项1（含 quick/entry 标签断言）；`tests/render.test.mjs` 回流项1（DOM 逐项：目录按钮标签、章节锚点、正文标题三者一致，覆盖全部 20 篇） |
| 2. 手机目录不可折叠 | 目录容器改 `<details class="lib-toc-wrap">`：≤900px 摘要可见、默认折叠（`matchMedia('(max-width: 900px)')` 驱动），桌面摘要隐藏、默认展开 | `tests/render.test.mjs` 回流项2（窄屏 open=false / 桌面 open=true）；样式断言桌面 `display:none`、移动 `display:block`。真机复验留待验收方 |
| 3. 路线阶段提示自相矛盾 | 提示改为按 `routeStages` 实际分组顺序动态生成（`本路线阶段顺序：…`），不硬编码阶段序列，也不为提示重排论文 | `tests/library.test.mjs` 回流项3（源码 + 方向一实际顺序断言）；`tests/render.test.mjs` 回流项3（DOM 文本断言） |
| 4. 首页标题样式被覆盖 | `.lib-view h3.lib-zone-title, .lib-view h3.lib-firstuse-title { margin: 0; font-size: 17px; … }` 提升作用域，压过 `.lib-view h3` 全局规则 | `tests/library.test.mjs` 回流项4（选择器断言）。计算样式核验留待验收方浏览器复验 |
| 5. 内容校验缺口 | `validateLibrary` 补齐 home 必填字段：updatedOn、zones 的 title/purpose/howToUse/entryLabel/entryHash、firstUse 条目的 title/text | `tests/library.test.mjs` 回流项5（6 个变异用例逐项报错；空 firstUse 走渲染层守卫的明确空态） |
| 6. 记录修正 | 本文件第 4 节计数改为如实记录两次实测并补复测数；PLAN-004 追加实施事实与本次修复记录，原始计划正文保持原样 | 见第 4 节与 docs/plans/PLAN-004-personal-platform.md 追加节 |

补充项（deep 卡辅助例子）：Astute RAG 精读卡的“机制”节新增明确标注**“整理者的辅助例子（不在原文中，只演示机制）”**的提示框，演示打标签→归组→按可靠性定答三步如何运转，并声明不构成“该信新文档还是旧文档”的结论。卡内关键数字已对照本轮实际抓取的 arXiv HTML 全文逐项复核（约 70%、19.2%、47.4/52.6、最坏情形超 50 点、冲突子集约 80%、judge 98.2%/95.0%、成本 <5% 与提升 >11%、四模型/温度 0/默认 t=1、五条基线名），未发现漂移。

新增 `tests/render.test.mjs`：把验收方使用过的渲染探针固化为仓库回归——41 个视图全部渲染、无 undefined/NaN、目录与正文逐项一致、折叠开闭随视口、首页字段实际渲染、阶段提示实际顺序。修复后全套 `npm test` 为 **200 项通过、0 失败、0 跳过**（本机）。

仍无可重放证据、不宣称完成的部分：

- **grad-radar 隔离登记与同源 Markdown 导出**：本轮未执行，精读卡的“实际读过”仍缺独立的登记记录佐证；审查方要求的内容生产流程（READING-TEMPLATES-005 第 6 节）只完成了第 1–4 步与部分第 3 步。
- **全矩阵视觉与真实交互**：桌面 1280/1440 与手机 390 下三档卡/目录/前后篇/legacy 的完整矩阵，以及字体与颜色的计算样式核验，留待验收方浏览器复验；本轮只有 DOM 桩与源码级证据。
- 结构校验与文本复核不能证明“实际读过全部所标章节”这一事实本身，只能保证卡内陈述与已获取全文之间无已知漂移。

## 7. 用户反馈的排版修复（2026-09-15 晚，截图反馈）

- **现象**：侧栏“方向入口”的三个方向链接内联横排成一团，没有按行堆叠。
- **根因**：`<details class="lib-quick-group">` 上写了 `display: flex; flex-direction: column`。Chromium 中 `details` 配 flex 布局时，非 summary 子元素会被装进匿名内容盒，flex 纵排不生效，链接退化为内联流。
- **修复**：`.lib-quick-group` 改为 `display: block`；`.lib-quick-link` 改为块级（`display: block` + 上下 padding），summary 加底部间距；清理移动端失效的 `gap`。旧版样式段（前 321 行）哈希复核未变（`4580d12c6f3be8d8`）。
- **回归**：`tests/library.test.mjs` 新增断言——`.lib-quick-group` 必须为 block、`.lib-quick-link` 必须为块级、details 上禁止 flex。修复后全套 `npm test` **201 项通过、0 失败、0 跳过**（本机）。浏览器端观感请刷新 4173 页面确认。
