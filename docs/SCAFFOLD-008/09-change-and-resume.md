# 09 变更与续做：交接实施者必读

> **历史快照（实施前，2026-09-22）**：本文件记录的是 SCAFFOLD-008 实施前的变更映射与中断现场（45 论文/0 材料、127 项测试 1 失败等均为当时数据）。SCAFFOLD-008 全部工作包已于 2026-09-22 实施完成并通过总验收（测试 143 项 / 142 通过 / 1 条件跳过），证据见 [IMPLEMENTATION-REPORT.md](IMPLEMENTATION-REPORT.md)；下一步是内容完善、真实使用与反馈，不再继续本产品施工。

版本：008.2；现场核对日期：2026-09-22。本文件防止把新目标交给旧计划继续施工。只读核对与文档修订不是一次产品修复，也不是实施完成验收。

## 1. 生效范围和优先级

本轮用户授权的主要变更是论文主方向及其少量学习引导。当前目录 README、00–09 是 008.2 契约；008.1 快照、历史实施报告、早期交接与 GPT 全表仅供追溯。项目 AGENTS、安全/存储约定继续有效。实施者先读本文件，再按 06 续做，不按聊天即兴扩展。

研究已收束为 Cross-Harness Agent Collaboration 场景下的条件化机制/表示组合比较，输入与输出预算都重要。不是“只比较中断接管”“证明 context compiler”“实现世界状态平台”。换手可以是第一切片，不是整个研究范围。

保持：第二条代码验证四步、真实阅读动作与四档深度、目的三后置、三条技术栈与隔离教材、每日精选只感知、不动个人记录。技术文档只有相关论文引用和定位注释需要对齐，不能借本轮重选框架或增课。

## 2. 实际停止在哪里

历史 IMPLEMENTATION-REPORT 只写到包 1，但实际代码已经部分进入包 2。下面按本次读取现场描述，不归因给某个作者，也不把原有未提交改动当待清理垃圾。

| 对象 | 已观察到 | 不能据此宣布完成 / 下一步 |
|---|---|---|
| public/library.js | 已有 stage/媒介/track 常量，parseHash/buildHash 的 query 支持，getMaterial、NodeTarget/resolveNodeTarget、directionTracks、inferStartContext、featuredTechnicalRoutes 等辅助函数，以及部分 readingActions 校验与 quick 标注 | 保留并测试，检查每个调用端；辅助函数存在不等于页面闭环 |
| validateLibrary | 仍要求 direction.route、旧 home.startHerePaperId，技术 kind 仍限 core/advanced 等旧约束 | 补齐新旧互斥/兼容、材料、featured 与双轨校验；不要先接新数据触发全站校验失败 |
| renderApp / 首页 / 侧栏 | 分发仍缺 material，paper/learn 的 route/track 消费未完整接通；首页仍取旧 paper 字段；侧栏尚未统一 active | 完成材料详情、typed 首页、实际导航与筛选后才切入口 |
| 内容库 | 45 论文、0 材料；旧 3 方向 route 为 9/8/11 步；11 技术路线、19 单元；首页仍是 tosem2025-acceptance | 包 3 尚未接入新内容；materials.js、papers-collab.js 和教材在核对时不存在 |
| 测试 | 本轮实跑 npm test：127 项，125 通过、1 失败、1 条件跳过 | 当前不是全绿；先修下面的断言不同步，再验证新模式，不把旧基线当本轮结果 |

已知失败：tests/library.test.mjs 的“回流项1：目录与正文同源……”测试（核对时约 917/932 行）。预期最后目录项“下一篇”，实际“延伸阅读”。新契约认可旧 paper.next 降为延伸阅读，后续应对齐目录断言并完成真正的 route/track 下一节点测试，不倒退标签、不删测试掩盖问题。其他行为仍需测试，不能由这一个差异推断包 2 已完成。条件跳过为符号链接权限项，沿原条件处理。

这些是本次快照，实施者开始时重新查看状态和测试。若中间又有人改过，以实际证据为准，报告差异；不使用破坏性重置，也不覆盖已有未提交成果。

## 3. 旧要求 → 新要求：必须一起改

| 位置/旧契约 | 008.2 要求 | 已有工作怎么处理 |
|---|---|---|
| 主方向 title/overview/openQuestions | 跨工具协作场景、异构模型、输入/输出预算、机制与表示组合、适用条件 | id 仍 cross-harness-collab；不是仅换标题，重写 01 所列正文 |
| 起步 6 步：Context→Event→CoALA→MemGPT→Tax→Debt | 5 步：问题导读→Beyond Frameworks→MemGPT→Tax→Debt | 用 02 的 step-collab-1…5 重排；不改后三篇论文 id |
| 待建论文 coala | 待建 beyond-frameworks | 不把 coala id 改成另一篇；未建则不再制作；若实际已存在，保留为库中可选资料 |
| 待建 mat-context-eng、mat-event-sourcing | 新 mat-cross-harness-map；另保留 mat-read-empirical | 不重用博客 id 承载新导读；本次未发现两旧材料已落地 |
| home.startHere 材料 mat-context-eng | article/materialId=mat-cross-harness-map，routeId=cross-harness-collab，track=start | 接收端就绪后与内容同包切；真实数据无 startHerePaperId |
| 主 archive 十项 | 三个语义 id 外链：survey/coala/context，见 02 | 旧十项仍留历史索引，不批量造卡或搬进默认页面 |
| papers=49、materials=3、start=6/4、archive=10/9/8/11 | papers=49、materials=2、start=5/4/0/0、archive=3/9/8/11 | 论文新增4不变，只换其中1篇；更新内容、计数、导航测试与人工走查清单 |
| 技术 relatedPaperIds 把 CoALA 当起步卡 | 使用实际存在的 memgpt / beyond-frameworks 等关联；不用外链 id 充外键 | Python+LangGraph、RAG、浅图本身不改，不新增研究原型 |
| 主线完成后解锁长目录/实验 | 显示本段结束与一个回看/按需学习建议 | 不自动进入 archive，不强制实验或自动已读 |
| 固定长度、4k handoff 被当整个预算 | 接收上下文额度与端到端输入/输出记账分开 | 写研究边界，不在平台新增计费/评估子系统 |

内容基线对应的其他目标不变：四方向/两 active/两 deferred，13 技术路线/26 单元/3 featured，旧 45 论文相对顺序、经典和简报保留。

### 若续做时发现旧选目已经入库

不以 49/2 的数量断言为由删除 CoALA/博客或改其 id。保留可用旧直达与论文记录，移出默认 startRoute，新增正确身份的 Beyond/primer；去掉旧 active 入口与悬空外键。先在报告列出现存 id、来源、引用、记录风险与目标数量差额，再同步针对真实库的数量说明/断言。此“保留新增内容”的受控例外不授权新增默认课表，也不授权存储迁移；涉及无法无损保留的变更先请求裁决。

材料本期没有记录，不代表允许清除浏览器或改 papers 字典；不用清 localStorage 解决路由测试问题。

## 4. 推荐续做顺序

1. 包 R：重新核当前工作区、数据和测试，追加报告，明确已有半成品。历史包 0/1 不重做。
2. 包 2：补齐校验与渲染消费端，使用 fixture 验证材料/论文混合路线、typed 首页、track 导航和无记录副作用；旧真库仍能打开。修目录文案断言时补行为测试。
3. 包 3：核 07 原始资料，交四张新 quick 卡和两篇 primer，保留第二线旧卡；新方向、材料、新首页与真实规模断言一起切换。先保证一条五步能实际走完，不把无正文占位当交付。
4. 包 4/5：继续原技术教材与全局精选收尾，仅同步受主线影响的关联；研究调整不是重写技术路线的授权。
5. 包 6：自动测试、内容、真实浏览器、教学 mock 各自记证据。方向语义也要核，不能只数卡。更新真实实施状态，未完成就明确写出。

具体可写文件和每包退出条件见 05/06。无授权不提交、不推送、不部署、不运行全天发现、不改个人研究记录。

## 5. 本轮交付与非交付

本轮交付：008.2 契约、精简选目与依据、原 008.1 快照、根文档入口同步、中断现场及已知失败记录。产品代码、测试文件、依赖、教材、真实卡片没有在本轮修改；基线测试失败留给实施包解决，不伪报已修复。独立 reviewer 未执行；08 是主会话文档自检。

选目不再退给新生重审。遇来源失效按 00/07 处理；遇范围改变才请求裁决。对照当前文档做小范围合并，不复制整个文件覆盖已有产品实现。
