# 02 学习路线：少量引导，不是完整课程

版本：008.2。主线 5 步、第二条 4 步；选目和顺序冻结，实施者不得扩成全机制综述或按周课表。这里的详细要求服务内容制作，不应原封不动塞满页面。

map 是一次短浏览，回答“这项工作在研究地图哪里”；core 是读问题、机制与实验主线，非全文精读；本期不要求 deep。passMode 是建议读法，deliveredDepth 是实际交付，不相互冒充。“必读”只表示选择本路线时推荐的起步节点，不是完成整条课表才准开始。

每张卡只围绕三问、少量实际讲解和自查。Explain 下表只是制作题材，必须交付有依据的正文或有效引用才能显示。只提供摘要的卡不能伪写已核正文。

## 1. 主方向 cross-harness-collab

### 1.1 startRoute：五步

| 步骤 / step id | 目标 | 角色 / stage | passMode |
|---|---|---|---|
| 1 / step-collab-1 | article: mat-cross-harness-map | 站内问题导读 / 建立概念 | map |
| 2 / step-collab-2 | paper: beyond-frameworks | 拆开看协作维度 / 建立问题 | map |
| 3 / step-collab-3 | paper: memgpt | 理解记忆与本轮输入 / 理解方法 | map |
| 4 / step-collab-4 | paper: handoff-tax | 第一次读核心的候选 / 看评价与反例 | core |
| 5 / step-collab-5 | paper: handoff-debt | 读懂比较设置及指标 / 看评价与反例 | map |

五步 required 均为“必读”，availability 依实际核查。用户也可先看导读和 Tax 再按疑问回补，平台默认顺序不增加前置课程或强制学习门槛。后三个旧目标 id 保持，不按论文在路线中的新序号改 id。

#### 步 1：我们研究的是什么，而不是什么

- id：mat-cross-harness-map；format：primer；站内编辑说明，不是假定存在的外部论文。title：“跨工具协作：先把研究问题分清楚”。
- 讲什么：隔离工具中的 Agent 如何交换与保留信息；场景、机制、表示和传输不是同一层。
- 路线价值：先消除“世界状态就是研究方向”这一误解，后续论文才能放对位置。
- 阅读目的：能用自己的话提出“在什么条件和预算下，哪种机制/表示组合更合适”，不先选赢家。
- 实际正文：约 600–900 中文字，可配一个不超过六行的小表。用一次“工具 A 做到一半、B 继续、之后可能再交回”的中性例子，不写产品架构设计或实验大计划。
- 必须说明：harness 不只是模型名；不能共享完整会话不代表不能共享获准的文件；通信、记忆、工作区/工件协作可组合；summary/trace/packet/wiki/快照/检索选段是可比较的做法；文件/Git/协议属于传输或互操作层。工作性分类有交叠，不伪称各论文一致采用此分类。
- 组合例子：仓库工件 + 短摘要、长期记忆 + 检索 + 交接包。例子仅解释结构，不说哪种更好；状态中的事实、假设和未决问题不可一概当客观真相。
- 一小段预算说明：接收上下文限额不等于端到端输入/输出消耗；摘要生成和取回材料也有成本。成功、返工、token 和延迟不同，不凭“能复述前史”判成功。详见 00 §3，但不把全部方法学注意事项搬到首屏。
- Preserve：场景/机制/表示/传输的区分，以及输入/输出预算双侧。
- Explain：上述两种组合的编辑例子，实际写进 readingActions.explain.blocks，正文不重复拷贝；字数预算含该段。明确“编辑举例”，非研究结果。
- Skip：此时不学事件溯源数据库、A2A/MCP 实现和论文发表流程。
- coverage.mode=editorial-primer，basis=站内编辑。来源说明引用 07 的协作论文/综述、MemGPT/CoALA 与上下文博客，标出“分类与例子为编辑整理”；不用它们为尚未验证的跨工具效果背书。
- 自查：能区分场景与方法，并指出换手只是一个切片。下一步 Beyond Frameworks。

#### 步 2：Beyond Frameworks——不把框架名当协作机制

- id：beyond-frameworks；title：Beyond Frameworks: Unpacking Collaboration Strategies in Multi-Agent Systems。
- 身份：ACL 2025，Haochun Wang 等；[官方条目](https://aclanthology.org/2025.acl-long.1037/)，[正文](https://aclanthology.org/2025.acl-long.1037.pdf)；不要与其他同名博客混淆。
- 讲什么：将协作组织和互动方式拆成治理、参与、交互、对话历史管理等维度。
- 路线价值：主研究范围包括协作机制，不只对比交接文档格式。先借这一篇建立少量维度词汇，避免“多一个框架名就是多一种方法”。
- 阅读目的/Preserve：读摘要、引言与 §3 的维度定义；任选一个维度说明“改变了什么、其他什么需保持”。不要求背全组合。
- Explain：用“谁发起下一轮”和“下一轮看到什么历史”区分协调选择与信息表示，注明编辑例子。
- Skip：本次不穷举配置和榜单，不学习框架 API；未核表格不写数值比较。
- 编辑覆盖：默认 quick；读上述范围及 Limitations，登记定位。该实验不是独立商业 harness 互通验证；§3.5 的 FullLogLastRound 是上一轮完整日志，不可翻译成整个任务完整 trajectory。使用图须另核图像，本期仅文字即可。
- 自查：能提出一个协作维度，而不预设其普遍最佳取值。下一步 MemGPT。

#### 步 3：MemGPT——长期保存不等于已经进入当前输入

- id：memgpt；title：MemGPT: Towards LLMs as Operating Systems；[官方来源](https://arxiv.org/abs/2310.08560)，本次读 v2 方法概述。
- 讲什么：一种管理当前上下文与外部记忆、在两者之间移动信息的设计。
- 路线价值：补上长期记忆这一候选机制；不要把它缩成 handoff 的附件，也不要从这一例推出所有记忆方案的优劣。
- 阅读目的/Preserve：摘要、引言和 §2 主/外部上下文及控制流概念；理解谁决定写入、读回，存下来不会自动进入下一位 Agent 的输入。
- Explain：一条任务线索移出窗口、随后再取回的编辑示意；只使用已核方法概述，不编实验分数。
- Skip：Letta 产品部署、API 全表、所有操作系统类比。
- 编辑覆盖：quick，至少摘要/引言/§2 方法概述，图像未核则不列图号。单 Agent 的上下文管理例子，不是跨 harness 或长期多 Agent 协作效果证据。
- 自查：能区分记忆库、检索/管理策略和本轮上下文。下一步 Tax，不自动跳进完整 RAG 课程。

#### 步 4：Handoff Tax——看模型组合怎样影响换手

- id：handoff-tax；title：The Handoff Tax: Continuing Non-Native Trajectories in LLM Agents；[官方来源](https://arxiv.org/abs/2608.24358)。
- 讲什么：模型接续非自己产生的轨迹，在作者的设置下观察方向、时机与轨迹处理的关系。
- 路线价值：将异构模型对放进研究问题；Tax 仍先于 Debt，但不再把它称为整个研究方向的唯一代表。
- 阅读目的/Preserve：问题定义、§3 协议、轨迹处理条件及 §4 的方向相关权衡；理解“同一种表示能否适用于不同接收者”。
- Explain：质量恢复和成本保留指标分别回答什么；数值只有读到相应表/段才可写，不从摘要借百分比或隐含比例。
- Skip：本次不穷举模型昵称、附录超参。
- 编辑覆盖：默认 quick；核摘要、协议、采用结果与局限。主 coding 比较使用相同 mini-swe-agent 脚手架及工具环境，不能改写成 Cursor/Codex 的实测。Raw、Compact_pre、Compact_suf、Traj-drop 的区别见 07；不把两种压缩合成后声称完整实验只有三条件。
- core 只建议学习者重点读问题与对照；standard 必须另满足完整模板，不因定位几段方法而升级。
- 自查：说出一个“结论成立的条件”和一个不能直接外推的场景。下一步 Debt。

#### 步 5：Handoff Debt——格式比较必须连同预算与指标看

- id：handoff-debt；title：Handoff Debt: The Rediscovery Cost When Coding Agents Take Over Interrupted Tasks；[官方来源](https://arxiv.org/abs/2606.02875)；本次核 v2。
- 讲什么：中断后，后任在仓库、原始轨迹、摘要笔记、结构化笔记四种视图下接续任务。
- 路线价值：让“下一任是否接上”从印象变成可讨论的指标；同时看懂对照的不等价之处。
- 阅读目的/Preserve：四视图与重新发现成本；操作数、累计输入 token、初始长度、是否解出不同。结构化不自动优于原始轨迹，也不能反推 raw 在所有成本上都赢。
- Explain：同一输入更长的方案可能减少操作却增加累计输入消耗，依 07 已核表/段解释，不杜撰统一排名。
- Skip：暂不背笔记字段与后任模型名单，不以这篇作为完整长期协作实验。
- 编辑覆盖：quick；摘要/引言、§4.3、§5.1 表2、§5.3、§5.5 与局限。初始字符长度不是 token，四视图也不是严格等输入预算比较。只有摘要时暂不发布 raw/notes 排名，节点记待核，不宣称完整验收。
- 自查：能解释“同额度比较”与“给了不同长度材料再看成本”的区别。末节点显示本段结束，无自动下一门课。

### 1.2 archiveRoute：只留三个按疑问查阅的外链

固定 external，不新增卡片，不算课表；字段按 03。标题使用“按需查阅（不必接着读）”。

| id | 资源 | 什么时候才打开 |
|---|---|---|
| archive-collab-survey | [Multi-Agent Collaboration Mechanisms: A Survey of LLMs](https://arxiv.org/abs/2501.06322) | 对协作分类仍无全貌时，只查摘要/分类；不读完所有被引论文 |
| archive-collab-coala | [CoALA](https://arxiv.org/abs/2309.02427) | 仍分不清 Agent 的记忆、动作、决策时；不是起步卡 |
| archive-collab-context | [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 对“存什么”和“本轮给什么”仍混淆时；技术博客不是跨工具比较证据 |

采用语义 id，避免复用 008.1 的 archive-collab-1 等序号指向不同资源。三个外链核身份和访问，失败 pending 不阻塞起步；不得标可读却实际不可访问。

Event Sourcing 与旧十项候选保留在 [008.1 快照](history/008.1/02-curriculum.md) 和原 GPT 索引，不删资料，不再要求生产对应卡片或把它们全部显示在页面。没有“读完五步还要读完目录”的隐含任务。

---

## 2. 第二条 `code-agent-verification`

### 2.1 startRoute（4 步）

#### 步 1 — 站内材料：怎样读实证研究

| 字段 | 值 |
|---|---|
| id | `mat-read-empirical` |
| kind | `article`（站内编写，无外链或外链仅作延伸） |
| stage | 建立概念 |
| required | 必读 |
| passMode | `map` |
| 为什么现在 | 下一篇 TOSEM 是评价论文。新生若不会问「测什么、真值怎么来、数字的分母是谁」，会被 AI 摘要带着走。 |
| 正文要求 | 400–700 字，实施者撰写，不是论文摘要。必须包含：三遍读法（摘要+图 → 方法/协议 → 数字与边界）；四个问题（问题、设置、证据、外推）；**数字必须回原文，禁止把摘要百分比当已核**。 |
| Preserve | 四个问题；三遍读法。 |
| Skip | 统计课、p 值哲学。 |
| 解锁 | TOSEM。 |

#### 步 2 — TOSEM（已有 standard 卡，id `tosem2025-acceptance`）

沿用现有卡。补 learner 三问与动作（现有正文够写，不升 deep）：

- 讲什么：测试验收会放过伪修复；扩测试能压过拟合，几乎不增加真修复。  
- 价值：把「看起来修好」变成可引用的实证，方向里后面的验收讨论都以它为基准。  
- 目的：带着「patch ≠ fix」读 RQ1/RQ4 的设置，不是学怎么写修复工具。  
- Preserve：patch/fix 之别；RQ1 与 RQ4 的设置与散文中的关键数字（已在现卡）；§7 三条出路。  
- Explain：四个工具的技术类别与实验复核流程，引用现卡 sectionId='design'；不承诺现卡没有的详细算法。  
- Skip：§2、§5 原覆盖未读，本次暂不进入；公式乱码处不据其解释结论，不把未读章节判断成无价值。  
- 现有 `check` 保留。

#### 步 3 — Agentless（已有 quick，id `agentless`）

- 讲什么：不用复杂 agent 循环的三阶段流水线，也能在软件修复基准上走得很远。  
- 价值：反例——「上多智能体」必须先证明比简单流水线多了什么。  
- 目的：读完能用它质疑主方向里「再加一个 Agent 传话」是不是真的必要。  
- Preserve：三阶段是什么（摘要级）；「脚手架的边际收益必须自证」。  
- Skip：未核正文前的实现细节与榜单数字。  
- 覆盖保持 quick。

#### 步 4 — SWE-bench（已有 quick，id `swe-bench`）

- 讲什么：真实 issue + 失败转通过 / 通过须保持的测试。  
- 价值：主方向两篇换手论文都在同类软件任务上做实验；不懂台子就读不懂 Tax/Debt 的设置。  
- 目的：只建立评价定义，不读榜。  
- Preserve：任务从哪来；两类测试各防哪种误判。  
- Skip：排行榜、具体模型分数。  
- passMode: `map`。

### 2.2 archiveRoute

现有 9 步整表。页面默认折叠。不要在第一期为 Le/Ye/APPT/ComPass 升级深度。

---

## 3. 两条方向怎么衔接

主线五步让你能提出有条件的协作比较，代码验证四步帮助判断产出怎样才算对。两条不是必须同时完成的课程。

主线末尾只给一句建议：“选一个你仍不明白的比较问题，回看对应论文的设置；想动手时，再按需进入多智能体技术路线。”不自动生成实验任务，不要求 20–50 个样本、文献矩阵或十二周进度。技术练习自愿，研究实验另议。

卡片可用现有 questions 自查：场景是什么、改了什么、哪些条件相同、预算怎么记、结果适用于哪里。每卡选最有关的一两个问题，不新增表单、数据库字段或 P1.5 跨论文表。
