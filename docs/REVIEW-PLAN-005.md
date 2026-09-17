# PLAN-005 实施独立审查（2026-09-16）

## 裁决
**通过**。无 P1/P2 阻塞；多项 P3 记录订正已由主协调在文档内完成。多实施者（kimik3/glm5.3/deepseekv4.1flash）未留下可见的功能或契约不一致：内容契约、渲染分支、存储隔离与来源纪律在代码与实测中均统一。

## 审查范围与方法
- 文档：PLAN-005、ACCEPTANCE-006、RESEARCH-005、LEGACY-AUDIT-005（引用）。
- 代码/内容：public/notes.js、library.js、library-content.js、index.html、styles.css、server.mjs、scripts/check-links.mjs、tests/*。
- 实测：npm test（验收环境）；node 契约盘点（validateLibrary、重复 ID、路线引用、checkedAt、录用字段）；浏览器端到端（首页五区、#/foundations、论文页 v3 面板、保存与刷新持久化、导出触发、discover 点击取数、手机 390 宽度、方向页 CCF 事实）。
- git：提交清单、remote、.gitignore 生效抽查。

## 逐项结论
1. **范围与数量**：45 篇（1 deep/2 standard/38 quick/4 entry）、经典 11 篇四组、方向候选 14 篇、技术 11 路线 19 单元、首页五区，与 ACCEPTANCE-006 第 3 节一致；未超首轮上限口径（GraphRAG 备选按阶段 4 未入首批，属计划内，不是遗漏）。
2. **录用信息纪律**：凡 arXiv comments/Anthology 可证者注明证据；未证者一律写"arXiv 页未标注录用信息；外部检索指向 X，未在 arXiv 页确认"。未发现未核验却标会议的情况。
3. **身份纠错**：RESEARCH-005 的 Metattack 编号 1903.01603 有误；实现改用 1902.08412，经 arXiv 摘要页核对标题/作者/ICLR 2019 journal-ref 吻合，且 contentVersion 留有更正记录。已在 RESEARCH-005 加勘误。
4. **v3 记录**：独立键 v3；notes.js/library.js 不引用 v1/v2；浏览器实测保存（状态+问题字段）、刷新后持久化、边界文案（"导出是唯一备份""不做自动已读与进度统计"）均正确；导出按钮触发下载事件（IAB facade 不暴露文件名/内容，内容正确性由 tests/notes.test.mjs 支撑）。
5. **每日精选接通**：点击主题发起真实 Crossref 查询，窗口/获取时间/结构过滤与主题过滤计数如实呈现，免责声明未弱化；单条命中与主题相关性弱属上游数据质量，界面已用计数与说明如实暴露。
6. **旧版退役**：四文件与旧样式段删除、白名单与入口同步、旧路径 404；git 历史可恢复；CCF 目录按 D3 以一句话事实+来源+边界并入方向页，实测可见。
7. **提交卫生**：3 个本地提交、工作树干净、无 remote、未推送；提交不含 private/.workbuddy/密钥（grep 唯一命中为文件名子串误报）。
8. **测试**：验收环境实测 122 总数、121 通过、0 失败、1 条件跳过（符号链接 EPERM，与前轮同项）。ACCEPTANCE-006 原记"0 跳过"为计数口径错误，已订正。
9. **一致性扫描**：validateLibrary ok；无重复 ID、无路线悬空引用、checkedAt 全覆盖；无占位内容混入（空态文案与表单 placeholder 属正常 UI）。

## P3 记录订正（已执行）
- ACCEPTANCE-006 增补第 10 节：测试计数以验收环境实测为准；审查补做的端到端项与仍保留的未完成项分列。
- RESEARCH-005 增补勘误：Metattack 编号更正说明；GraphRAG 未入首批的原因说明。

## 仍保留为未完成（非本轮缺陷，均已如实登记）
- 深读卡生产（SWE-bench/FreshLLMs/GNNGuard/FP/Attention/InstructGPT/ReAct）与 grad-radar 隔离登记、同源 Markdown 导出。
- 全矩阵视觉验收（截图工具仍不可检视）；check-links 联网首跑留待手动触发；P1.5–P1.7 暂缓项。

## 回流
无需代码回流。下一轮任务包建议：按 RESEARCH-005 §五 顺序生产首批深读卡，并同步补 grad-radar 隔离登记与内容生产证据闭环。
