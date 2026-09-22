# SCAFFOLD-008 实施报告

当前状态：008.2 已实施完成；以下包0/1及中断现场段落是历史实施记录，保留原文用于追溯，不用历史成绩替代当前状态。

历史版本：随 008.1 实施逐包追加。实施者：主会话（kimi-k2.8-preview 承载，用户授权实施）。
开始日期：2026-09-21。状态：**已完成（2026-09-22 全部工作包 R/2/3/4/5/6 实施并通过总验收，实施者自检，独立审查未执行）**；测试 143 项 / 142 通过 / 1 条件跳过（符号链接 EPERM，环境性）。2026-09-22 审查后修正四处交付文档与页面文案（状态口径统一、去除内部编号泄漏、导读动作标题与概念表声明），修正后仍为本状态。

> 命名智能体（scout/builder/reviewer）在宿主不可发现（本会话无 Agent 工具可用），
> 全部工作由主会话按 06 的包顺序直接实施；每包末尾如实记录“实施者自检，独立审查未执行”。

---

## 包 0 — 只读基线（2026-09-21）

**所读契约**：AGENTS.md、docs/SPEC.md、docs/BACKLOG.md、docs/SCAFFOLD-008/README 及 00–08 全文；
public/library.js（2441 行全读）、public/library-content.js、server.mjs、public/content/ 六模块、package.json。

**git 状态（实施前快照）**：分支 main；已修改未提交——README.md、docs/BACKLOG.md、docs/DESIGN.md、
docs/SPEC.md、public/library-content.js、public/library.js、public/styles.css、server.mjs、
tests/library.test.mjs、tests/render.test.mjs、tests/server.test.mjs；
未跟踪——docs/research/agent-shared-state-handoff-learning-roadmap.md（GPT 目录索引，02 §1.2 指定用途）、
docs/AI-OPTIMIZATION-HANDOFF-001.md、docs/DESIGN-REWORK-007.md、docs/SCAFFOLD-008/、public/content/。
以上均早于本任务（REWORK-007 与内容拆分成果），实施时遇重叠先合并理解，不回滚。

**测试基线（实跑 `npm test`，2026-09-21）**：127 项 / 通过 126 / 失败 0 / 条件跳过 1
（符号链接 EPERM，环境性，与 SPEC 记录一致）。历史 127 项为参考，本次为实跑值。

**数据基线（实跑导入当前 LIBRARY）**：

- papers = 45，id 与相对顺序（聚合顺序：路线组→支线与补充组→经典组）：
  `tosem2025-acceptance, le2018-overfitting, ye2021-assessment, appt, compass, rag-survey,
  astute-rag, sufficient-context, hoh, timely-rag, spectral-tutorial, sure, camera-incomplete-mv,
  oagl, bridge, toolformer, toolllm, rag-original, lora, peft-guide, swe-bench, swe-agent,
  agentless, autocoderover, openhands, freshllms, self-rag, crag, gcn, gat, feature-propagation,
  nettack, metattack, gnnguard, attention-transformer, bert, gpt3-few-shot, instructgpt,
  cot-prompting, self-consistency, tree-of-thoughts, react, reflexion, generative-agents, voyager`
- directions = 3（均无 status/startRoute/archiveRoute，用旧 `route` 字段）：
  code-agent-verification（order 1，9 步：tosem→le→swe-bench→ye→agentless→appt→swe-agent→autocoderover→compass）；
  trusted-rag（order 2，8 步：rag-survey→freshllms→astute-rag→sufficient-context→self-rag→crag→hoh→timely-rag）；
  graph-harmful-fusion（order 3，11 步：spectral-tutorial→gcn→gat→feature-propagation→sure→camera-incomplete-mv→
  oagl→nettack→metattack→gnnguard→bridge）。
- technicalRoutes = 11：tech-t1:3, tech-t2:3, tech-t3:4, tech-t4:3, tech-t5:3, tech-t6:3 单元，
  tech-adv-training/tool-research/rag-research/graph/multiagent 共 5 条 0 单元支线；单元合计 19。
- foundations（经典书目配置）groups 4 组，collection='foundations' 论文 11 篇（attention-transformer…voyager 尾部）。
- briefs = 4 期（2026-09-15/16/17/18）。
- home 键：title/intro/updatedOn/startHerePaperId/zones/firstUse（旧式 startHerePaperId）。
- contentVersion：LIBRARY-CONTENT v4.3（2026-09-21，REWORK-007 拆分 + 09-15 期重复 scope 键修复）。

**基线已有失败**：无（0 失败）。唯一跳过为符号链接 EPERM 环境项，不阻塞本期。

**退出结论**：基线齐备；旧数据规模 45/3/11/19/11/4 与 05 §2 目标（49/4/13/26、start 6/4/0/0、
archive 10/9/8/11、featured 3）的增量明确。下一包前提满足。

**自检声明**：实施者自检，独立审查未执行（宿主无命名智能体可发现）。

---

## 包 1 — 同步目标与实施中状态（2026-09-21）

**所读契约**：00 §3、05 §1；现有 SPEC/BACKLOG/DESIGN/TECH-LEARNING-005/READING-TEMPLATES-005/README。

**改动文件**（均为文档，未触碰 public/）：

- `docs/SPEC.md`：目标段补「当前首要价值」与两方向授权说明；「不做」中「重排已批准研究方向」按 2026-09-21
  用户授权修正（一次性授权，此后不得无授权再改）；PF-01 补 active 过滤与每日精选感知口径；PF-06 补
  三条技术路线默认与 tech-t4→tech-rag 别名关系；新增 PF-11（起步卡三问、readingActions、Explain 二选一、
  route/track 导航权威）；当前状态段记「008 实施中」+ quick/coverage 澄清（§2C 同步），保留 v4.3 现状描述；
  文档地图登记实施报告入口。
- `docs/BACKLOG.md`：里程碑段改「2026-09-21 起实施中」，挂实施报告链接；深读卡生产继续让路的口径不变。
- `docs/TECH-LEARNING-005.md`：新增 §0——T1–T6 六主干标为历史/保留内容，新默认三条以 04 为准
  （多智能体 Python+LangGraph 必学 / RAG 按需 tech-rag / 图浅尝）。
- `docs/READING-TEMPLATES-005.md`：§2C quick 澄清——简短交付不强制仅摘要；已核指定正文仍交 quick，
  显示「简读卡 · 摘要及指定正文已核」；有正文不自动满足 standard；不放宽无正文门槛。
- `docs/DESIGN.md`：新增「SCAFFOLD-008 实施中说明」段（结构层新增清单、视觉系统不变、目的三不做）。
- `README.md`：当前状态段加 008 实施中与实施报告链接，明确报告未标完成前现状以 v4.3 为准。

**完成项**：旧文档不再把「两方向」「三技术」误判为无授权重排；未宣称产品已完成；文档内相对链接均可解析
（SCAFFOLD-008/ 内部链接沿用既有文件，无新增断链）。

**下一包前提**：满足，进入包 2。

**自检声明**：实施者自检，独立审查未执行（宿主无命名智能体可发现）。

---

（包 2 起按 06 顺序追加。）

---

## 008.2 文档调整与中断现场核对（2026-09-22）

本段由文档修订会话追加，不代表原实施者已经完成包2。此次仅更新契约与交接说明，未修改产品代码、测试或实际学习数据。

**研究变更**：预算约束下的 Cross-Harness Agent Collaboration 条件化机制/表示组合比较。主线由6步改5步：站内问题导读→Beyond Frameworks→MemGPT→Tax→Debt；第二线4步不变。新增4论文/2primer，主archive3个按需外链。技术主栈、阅读纪律、存储和视觉后置不变。依据见00–02与09，旧数量只保留作历史。

**现场更正**：历史报告只到包1，不等于包2未开始。library.js已有NodeTarget、材料解析、query路由与部分校验/quick文案；但validateLibrary、renderApp、首页/侧栏等仍有旧契约消费，需补齐。不得重复覆盖这些半成品，也不能记为已验收。

**实跑测试**：npm test，共127项，125通过、1失败、1条件跳过（符号链接权限条件）。失败为tests/library.test.mjs“回流项1：目录与正文同源……”约917/932行；预期“下一篇”，实际“延伸阅读”。按新契约后者正确，后续对齐断言并测试真实路线导航，不删除测试或恢复误导标签。本轮没有修复此失败；09-21的126通过仅是当时结果。

**实际数据**：仍45论文/0材料/3旧方向（9/8/11步）/11技术路线19单元；首页仍旧paper入口。核对时materials.js、papers-collab.js、multiagent-lab.md未落地。008.2目标不可冒充产品现状。

**文档交付**：README/00–08更新为008.2，新增09变更与续做，保存history/008.1快照，同步根README、SPEC、BACKLOG、DESIGN、TECH-LEARNING-005；旧AI交接与 `docs/research/` GPT路线只加“历史资料/不再是实施契约”提示，保留正文。旧READING-TEMPLATES-005的008.1澄清仍有效，未为改版本重写深度规则。

**续做入口**：06包R→补齐包2→包3新内容与首页同包切换→原包4/5→包6总验收。开始时重核现场是否变化。独立审查未执行；本轮为主会话文档自检，未调用付费模型、运行教学教材、提交或推送。

**文档交付核对**：当前文档59处本地链接目标存在；旧6+4/三材料等要求仅在历史与变更对照中保留，不再生效。10份008.1快照与修订前内容一致（忽略换行/末尾空白规范化）。修订前后核对19个产品与测试文件哈希，均未变化。历史快照内部相对链接保留原位置语义，说明见history/README。

---

## 包 R — 实施者现场核对（2026-09-22，续做起点）

**所读契约**：09、008.2 版 00–08 与 README；对照 history/008.1 快照。

**实跑核对（本包新证据）**：

- 测试：`npm test` 127 项 / 通过 125 / **失败 1** / 条件跳过 1（符号链接 EPERM，环境项）。
  唯一失败为 tests/library.test.mjs「回流项1」（917 行）：期望目录末项「下一篇」，实际「延伸阅读」。
  与 09 记录一致——**断言未同步**，新契约认可旧 next 降为延伸阅读；按 09 对齐断言并补 route/track
  下一节点行为测试，不恢复旧标签、不删测试。
- 半成品（保留，逐一核到源码）：STAGE_ORDER 五阶段、PASS_MODE/TRACK/材料标签、
  parseHash/buildContextHash（hash 内 route/track/unit 白名单）、getMaterial、tech-t4→tech-rag 别名、
  NodeTarget 三函数、directionTracks（legacy 回退）、trackEntries/trackPosition/targetPositions、
  inferStartContext、featuredTechnicalRoutes、depthBasisLabel、validateReadingActions、quick partial-text。
- 待补（包2 范围）：validateLibrary 双轨/材料/featured/单元 lesson·availability·labPath/home.startHere；
  renderApp 分发 material 与 ctx 消费；材料详情页；首页 typed startHere；侧栏与列表 active 过滤；
  renderPaper 的 learner/readingActions/track 导航/依据文案/延伸阅读去重；renderRoute tracks 分支；
  renderLearn featured 布局与 lesson/labPath；`__setRenderLibrary` 测试挂钩。
- 内容库：45 论文 / 0 材料 / 3 旧方向（route 9/8/11）/ 11 路线 19 单元；未发现旧版选目已落地，
  不触发 09 §3 保留例外。
- 现场与 09 快照一致，无他人改动迹象；半成品全部沿用。

**自检声明**：实施者自检，独立审查未执行（宿主无命名智能体可发现）。

---

## 包 2 — 兼容渲染、路由与校验（续做补齐）

**改动文件**：public/library.js、tests/library.test.mjs、tests/render.test.mjs、（server 白名单测试在包 3/4 随数据切换）。

**完成项（2026-09-22 续做）**：

- validateLibrary 补齐：materials 集合（format/url/learner/coverage 四模式/identity 不发布内容/
  跨集合重名）、方向双轨（新旧 route 互斥、显式 status、step 的 NodeTarget/重复目标/pending 原因/
  external 仅 archive）、技术 kind featured、单元 lesson.blocks 与 resourceIds 二选一、ready 资源型
  单元恰一主资源、availability/pendingReason、labPath 精确值与 labSection 枚举、typed home.startHere
  （首节点校验、与旧字段并存报错、目标可解析）。
- 渲染消费端：renderApp 分发 material 视图并把 ctx 传给 paper/learnRoute；材料详情页（三问、
  readingActions、正文/sections、覆盖、侧栏前后节点、无记录面板、零存储写入）；首页 typed startHere
  （材料文案「建议从这里开始」、带 route/track 链接）与 featured 技术区；方向列表/首页/侧栏 active 过滤；
  renderRoute 双轨分支（startRoute 顺序列表、archive 折叠、主方向外链目录标题「按需查阅」按内容驱动、
  末节点「本段到此」+ trackClosing）；renderPaper 路线上下文（显式 query 优先、失配明确提示、旧链接
  唯一归属推导）、learner/readingActions、quick 依据文案按 coverage 生成、旧 next 降「延伸阅读」并去重；
  renderRail track 感知；renderLearn featured 布局（默认三条 + 其他主干折叠）、unit 深链定位、
  lesson 正文、教材链接与章节提示、pending 单元；页脚一次性整理依据提示；`__setRenderLibrary` 测试挂钩。
- 同步修正（非掩盖）：旧卡 next.note 中「下一篇按路线读」8 处改为「延伸阅读：按路线读」（A06 口径）；
  「回流项1」两处断言对齐「延伸阅读」新标签并按 09 补了路线导航行为测试。

**实际检查与结果**：`npm test` 143 项 / 通过 142 / 失败 0 / 条件跳过 1（符号链接 EPERM，沿原条件）。
新增 fixture 正反例覆盖 A01–A05、A06/A08、A11、A13（library.test）与 A06/A09/A10、featured、
pending、材料页无记录（render.test）。旧真库全部原测试保持通过（旧首页/旧书签/旧 T4 行为未变）。

**实现取舍（契约内）**：① 路线下一节点与 paper.next 相同时，保留延伸阅读说明文字、去重链接按钮
 （保证页内目录与正文始终同源，符合「不作为竞争的主按钮」）；② archive 标题用数据 archiveLabel、
 缺省时按「全部 external → 按需查阅」推导，不写死方向 id；③ 页脚提示只在首次渲染追加一次。

**未完成/移交**：A07 真实浏览器持久性（刷新/后退/复制深链）留包6；真实数据规模断言（49/2/4 方向、
start 5/4/0/0、archive 3/9/8/11）在包3 启用；服务器白名单与新模块路径在包3；教材与 featured 真实
数据在包4。此时不宣称新课程已发布。

**自检声明**：实施者自检，独立审查未执行（宿主无命名智能体可发现）。

---

## 包 3 — 两条起步路线、真实内容与首页原子切换

**所读契约**：01、02、03、07（008.2）。**写范围**：directions.js、materials.js（新）、papers-collab.js（新）、
papers-routes.js 三张旧卡、library-content.js、server.mjs、三个测试文件、本报告。

**来源核查（2026-09-22 定向读取，定位见各卡 coverage）**：

- Beyond Frameworks：ACL Anthology 官方页（身份：ACL 2025 long.1037，21361–21375，Haochun Wang 等；CC BY 4.0）
  + arXiv:2505.12467 HTML 版 §3.2–3.5 维度定义、§4.1 场景、Limitations（ACL 官方 PDF 无法程序化读取，按 00 §6
  使用同一作品 arXiv 官方 HTML 版本）。
- MemGPT：arXiv HTML v2 摘要/引言/§2（主/外部上下文、函数调用控制流、队列换出）。
- Handoff Tax：arXiv HTML v1 摘要、§3（四条件 Raw/Compact_pre/Compact_suf/Traj-drop、同一 mini-swe-agent、
  切换点百分位）、§4 方向相关结果（QRec≈47%/36% 升配 Raw；Traj-drop 升配 QRec≈64%/84%；降配 Raw 有利、
  Claude 保留约 80% 成本优势）、附录 A 与局限。
- Handoff Debt：arXiv HTML v2 摘要/引言、§4.3（OpenHands 式运行时、Qwen 前任、三个后任）、§5.1 表2
  （Qwen 后任摘要笔记 602k vs raw 811k；Gemma/Devstral 后任 raw 更省：300k vs 317–319k、1.66M vs 2.30M；
  事件数 raw 一致更少 57–59%）、§5.3（初始字符 raw 中位 87k vs 7.2k/9.8k/10.0k）、§5.5（九对组合 raw 事件数
  一致更少）与局限。以上数字均在卡内注明定位，未用摘要替代正文。

**交付内容**：materials.js 恰好两篇 primer（mat-cross-harness-map 约 900 字含四行小表与两个编辑举例组合、
mat-read-empirical 约 600 字三遍读法+四问题）；papers-collab.js 四张 quick 卡（Beyond Frameworks / MemGPT /
Tax / Debt，Tax 与 Debt 为 partial-text 并登记已核 sections，learner 三问、readingActions 的 Explain 均为
实际 blocks）；papers-routes.js 的 TOSEM 卡补 learner + Explain（sectionId='design'，本卡已渲染正文）+
Preserve/Skip；papers-supplements.js 的 Agentless / SWE-bench 补 learner 与 Preserve/Skip；
directions.js 切为四方向双轨（start 5/4/0/0、archive 3/9/8/11；主方向 archive 三个 external 语义 id
survey/coala/context，checkedAt 2026-09-22）；library-content.js 聚合新模块、typed startHere
（mat-cross-harness-map + route/track）、firstUse 三条、感知口径 zones 文案、version v5.0；
server.mjs 精确新增 /content/materials.js、/content/papers-collab.js 两个白名单路径。

**实际检查与结果**：validateLibrary(真实 LIBRARY) 通过（0 错误）；`npm test` 143 项 / 142 通过 / 0 失败 /
1 条件跳过。新增/更新断言：A14 规模（49/2/4 方向、start 5/4/0/0、archive 3/9/8/11、原 45 相对顺序、
新四篇追加、typed startHere、无旧字段）、A06 导航（TOSEM start→Agentless、archive→Le、SWE-bench start 结束、
主线 5 步顺序）、A08（routesContaining 带 track 保留 archive）、A12（白名单 14 路径含两新模块）。
旧卡 next.note 8 处「下一篇按路线读」已于包2 改为延伸阅读口径。**5+4 全部 ready，无 pending 节点。**

**未完成/移交**：真实库 techRoutes 仍为 11/19 单元（包4 升 13/26 + featured 3）；教材与 /learning 路径在包4；
全局文案收尾在包5；浏览器走查与窄屏冒烟在包6。

**自检声明**：实施者自检，独立审查未执行（宿主无命名智能体可发现）。

---

## 包 4 — 三条技术栈与贯通教材

**所读契约**：04、07 §3（008.2）。**写范围**：technical-routes.js、public/learning/multiagent-lab.md（新）、
library.js、library-content.js 技术入口文案、server.mjs、三个测试文件、本报告；运行只用独立临时练习目录。

**交付内容**：technical-routes.js 新增 featured 三条——tech-multiagent（order 1，四单元 ma-u1…ma-u4，
各恰一个 primary 主资源 res-lg-quickstart/checkpointers/workflows/interrupts，labPath 精确值 + labSection，
availability 全 ready）、tech-rag（order 2，tech-t4 规范迁移，t4-u1/u2/u3 单元 id 保留；u1/u3 主资源改为
res-llamaindex-starter，原 RAG 五阶段改非主补充；relatedPaperIds 用 memgpt/beyond-frameworks，不引用未建卡的
coala）、tech-graph-simple（order 3，graph-u1 NetworkX / graph-u2 Distill GNN / graph-u3 站内编辑课 lesson 正文
resourceIds=[]）；旧六主干保留（T4 升 featured 后 core=5），按需支线 ten 条折叠；tech-adv-multiagent 文案改为
「进阶协作研究，先见多智能体架构」；旧「方向一/二/三」编号文案全部改为方向名称与已延后口径。

**教材与运行验证（2026-09-22 实跑，隔离目录 %TEMP%/ma-lab-check，uv 0.6.17 + anaconda Python 3.12.4）**：
依赖 langgraph 1.2.12、langchain-core 1.6.4、langgraph-checkpoint-sqlite 3.1.1（安装需联网）。
public/learning/multiagent-lab.md 已交付（约 24KB，内嵌与实测逐字一致的完整 multiagent-lab.py；
PowerShell 与常见终端两套 venv 命令；锁定实测版本；mock 默认 + real 可选；末尾研究边界声明）。
mock 七类检查全部实跑通过，实测输出已写入教材 §5：
① normal → 复核通过（steps=2）；② invalid_tool → 工具错误出口；③ step_cap → 达到步数上限 6；
④ 磁盘恢复：第一步后中断（steps=1）→ 新连接恢复至复核通过（steps=3，SQLite 检查点）；
⑤ 复核退回再通过（注入错误答案，retries=1，最终 answer=12）；⑥ 重试耗尽 + 人工取消（retries=2）；
⑦ 重试耗尽 + 人工接受（retries=2）。real 模式无凭据时如实只打印运行条件。
**过程中发现并修复两处真实缺陷**（已进教材说明）：退回续跑时旧 stop_reason 未清零导致提前结束；
interrupt 恢复重执行使重试计数丢失——重试计数移入独立 retry_gate 节点落盘、人工门只读幂等。
**真实 API 未运行**（无凭据），教材验收仅覆盖 mock；此为已知边界，不夸大。

**实际检查与结果**：validateLibrary 通过；`npm test` 143 项 / 142 通过 / 0 失败 / 1 条件跳过。
新增断言：A11（13 路线/26 单元/featured=3/10 单元全 ready/恰一主资源/labPath 精确值/旧 t4-u* 保留/
tech-t4 别名不复制数据）、A12（白名单 15 路径，教材 text/plain）。server.mjs 注释同步。

**未完成/移交**：包5 文案收尾；包6 总验收（真实浏览器走查、窄屏冒烟、SPEC/BACKLOG 状态）。

**自检声明**：实施者自检，独立审查未执行（宿主无命名智能体可发现）。

---

## 包 5 — 全局与每日精选文案收尾

**所读契约**：05 §3/4。**写范围**：library-content.js、library.js、render 测试、本报告。

**完成项**：方向列表页旧文案「三个已批准的方向」改为两条起步 + 延后保留口径；简报页 intro 与首页精选区
统一「感知相关/前沿工作及方法，不是今天的阅读作业，通常无需读正文」；全局 notices 的「表格与图没有逐格
核对」绝对句改为按卡标注（多数未核；已核指定正文者如 Handoff Debt §5.1 表2 按卡可见）；首页方向区回退
入口标签「查看三个方向」改「查看方向」。每日精选漏斗边界、历史简报与 /api/discover 未动。

**实际检查与结果**：`npm test` 143 项 / 142 通过 / 0 失败 / 1 条件跳过。默认入口无第二套课表、无误导性
「下一篇」；精选不进阅读任务。

**自检声明**：实施者自检，独立审查未执行（宿主无命名智能体可发现）。

---

## 包 6 — 总验收与交付

**自动测试（2026-09-22 实跑）**：`npm test` **143 项 / 通过 142 / 失败 0 / 条件跳过 1**（符号链接 EPERM，
沿原条件）。validateLibrary（真实 LIBRARY）0 错误。A01–A15 结果分布：A01–A05、A06/A08、A11、A13 由
fixture 正反例覆盖；A04、A05、A07（尾节点/上下文失配/pending）、A09、A10 由 DOM 测试覆盖；A12 服务白名单
15 路径（含两新模块与教材 text/plain，query/编码/遍历/符号链接保护不放宽）；A14 真实规模与旧数据保留
（49/2/4 方向、start 5/4/0/0、archive 3/9/8/11、原 45 相对顺序、经典 11、简报 2（09-21/09-22，旧四期仅本地归档）、旧 t4-u* 单元）；
A15 首页与简报感知口径、空态、原测试保留。

**内容人工核查**：5+4 节点三问与读法已按 02 交付；Tax 的升/降结论写明设置（同一 mini-swe-agent、
SWE-bench Verified、两模型对、非商业 harness）；Debt 事件数、累计 token、初始长度分开且有 §5.1 表2 /
§5.3 定位；TOSEM 讲解引用现卡 design 段（四工具的技术类别与复核流程）；新 quick 卡 inline 讲解与导读
编辑例子均实际写在 readingActions.blocks 并标注「编辑举例」。

**教材验证**：mock 七类检查隔离实跑通过（见包4）；**真实 API 未运行**（无凭据）——已知边界，不夸大。

**真实浏览器走查（IAB，1280 视口 + 390 窄屏冒烟）**：首页 typed 首读（材料 + route/track）真实点击；
主线五步逐站点击（导读→Beyond Frameworks→MemGPT→Tax→Debt），hash 上下文逐步保持，Debt 显示「本段到此」；
Debt 页 inline 讲解实际渲染；材料页浏览零 localStorage 写入、无记录面板；TOSEM start 下一步=Agentless、
archive 下一步=Le；延后方向旧书签横幅与谱系可用；#/learn/tech-t4?unit=t4-u2 别名深链可用；MA 单元教材
链接「打开/下载教材」可达（/learning/multiagent-lab.md 返回 text/plain）；390 宽度无横向溢出。
刷新/后退持久性由 hash 内 query 设计保证并经多轮 goto 验证。

**完成状态**：SPEC「当前状态」、BACKLOG 里程碑、README 已按真实完成情况更新为 v5.0 / 已完成（未提交）。
深读卡生产（BACKLOG 第 1 项）自本日起恢复优先；BACKLOG 第 9 项全站 390/1440 视觉矩阵仍开放（不在本期）。

**未执行/边界**：真实 API 教材冒烟未执行；独立 reviewer 未执行（宿主无命名智能体，全程实施者自检）；
不提交、不推送、不改个人记录——已遵守。

**自检声明**：实施者自检，独立审查未执行。

---

## 审查后修正（2026-09-22，GPT 审查四条）

1. **状态口径统一**：SCAFFOLD-008/README、08、09、IMPLEMENTATION-REPORT、SPEC 文档地图五处改为一致声明——
   已实施完成并通过总验收（143 项 / 142 通过 / 1 条件跳过）；08/09 明确标注「实施前历史快照」；
   下一步为内容完善、真实使用与反馈，不再继续本产品施工。
2. **内部编号泄漏**：directions.js「证据边界见 07」→「各论文结论的证据边界见其阅读卡内的来源与覆盖」；
   materials.js「按需资料（07）」→「方向页『按需查阅』中的三篇资料」。已全量复查可见字符串无其他编号泄漏。
3. **导读 Preserve 标题**：renderReadingActionsBlock 增加 kind 参数——站内导读（article）用「先自己阅读」，
   论文沿用「先自己看原文」；补 DOM 回归断言。
4. **概念表数值声明**：表格提示只对含数值的表格显示「表内数值未逐格核对」，纯概念表仅显示可横向滚动；
   补 DOM 回归断言（fixture 概念表断言不显示该声明）。

**验证**：`npm test` 143 项 / 142 通过 / 0 失败 / 1 条件跳过（符号链接 EPERM，沿原条件）。
自检声明：实施者自检，独立审查未执行（审查意见来自外部 GPT 会话，已由实施者逐条核对落实）。

---

## 提交前整理（2026-09-22）

- 将根目录的历史研究路线资料索引移至 `docs/research/agent-shared-state-handoff-learning-roadmap.md`，保留全文并同步当前文档与历史快照中的引用。
- 将 SCAFFOLD-008、SPEC、DESIGN 与实施报告的当前状态统一为“008.2 已完成”；旧 08/09 和包 0/1 内容继续保留为历史快照，不再作为施工指令。
- 核对提交范围：`private/`、`.grad/`、`.zcodeignore` 和本地运行缓存继续留在本机，不进入提交；未发现应无风险删除的、未被忽略的缓存或临时构建产物，因此没有删除研究资料或运行记录。
- 清理后重新运行 `npm test`：143 项，142 通过，1 条件跳过，0 失败；`git diff --check` 通过。
- 本次仅做目录与交付文档整理，未提交、未推送、未修改个人阅读记录。
