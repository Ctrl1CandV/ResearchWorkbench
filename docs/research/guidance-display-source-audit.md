# 动态导学（内容优先展示）来源审计与导读素材

> 任务包：研究内容准备（非产品实现）。检索与核验日期：2026-09-24。
> 方法协议：按 literature-search 技能（概念词表 → 多来源核验 → 版本追踪）与 paper-reader 技能（先骨架后细节、标注实际读取范围）执行；grad-companion 的每日发现/阅读登记协议不适用本轮（无个人阅读记录初始化，未触碰 private/ 与 .grad/）。
> 诚实边界（必读）：本轮正文获取经 WebFetch 工具对 arXiv/ar5iv HTML 全文页做转述式提取，**不是逐行精读**；每篇下方「实际读取范围」如实标注到节级或「截断」级。凡标注「摘要级」的条目，导读制作时不得出现节/图级指引（PF-03 口径）。摘要绝不冒充全文。

---

## 1. 综述筛选与核准（3 篇）

### 1.1 来源总表

| id | 题名 | 作者 | 日期/版本 | URL | 发表状态 | CCF 归属（仅列有证据者） | 实际读取范围 | 证据级 |
|---|---|---|---|---|---|---|---|---|
| survey-mem-tois | A Survey on the Memory Mechanism of Large Language Model based Agents | Zeyu Zhang, Xiaohe Bo, Chen Ma, Rui Li, Xu Chen, Quanyu Dai, Jieming Zhu, Zhenhua Dong, Ji-Rong Wen | arXiv v1 2024-04-21；TOIS 2025 | https://arxiv.org/abs/2404.13501 ；DOI 10.1145/3748302 | **ACM Transactions on Information Systems 2025（经 OpenAlex 记录核到刊名/年份/DOI）** | **CCF-A（数据库/数据挖掘/内容检索类，ccf.org.cn 目录页逐条核到「TOIS ACM Transactions on Information Systems」列于 A 类）** | ar5iv HTML 正文至 §7.4（§7.5–§9 仅目录级，页面截断） | 元数据+部分正文 |
| survey-comms-fcs | Beyond Self-Talk: A Communication-Centric Survey of LLM-Based Multi-Agent Systems | Bingyu Yan, Zhibo Zhou, Litian Zhang, Lian Zhang, Ziyi Zhou, Dezhuang Miao, Zhoujun Li, Chaozhuo Li, Xiaoming Zhang | arXiv v1 2025-02-20 / v3 2026-05-26 | https://arxiv.org/abs/2502.14321 ；DOI 10.1007/s11704-026-50857-y | **Frontiers of Computer Science 接收（arXiv 评论字段自注 + DOI 可解析）** | **CCF-B（交叉/综合/新兴类，ccf.org.cn 目录页核到「FCS Frontiers of Computer Science」列于 B 类）** | arXiv HTML v3 章节结构+§4 部分内容（框架级） | 元数据+框架级正文 |
| survey-mem-age | Memory in the Age of AI Agents | Yuyang Hu, Shichun Liu, …, Yu-Gang Jiang, Shuicheng Yan（约 55 人） | arXiv v1 2025-12-15 / v2 2026-01-13 | https://arxiv.org/abs/2512.13564 | **仅 arXiv 预印本（abs 页无评论字段、无发表声明；本轮未在出版源检到正式版）** | 不标等级（预印本） | arXiv HTML v2 正文至 §3.1.1 中段即截断，其余为摘要+目录级 | 元数据+摘要/目录级 |

未入选但已核查的综述备选（如实记录，不硬凑）：Multi-Agent Collaboration Mechanisms: A Survey of LLMs（arXiv:2501.06322，无发表声明，框架为 actors/types/structures/strategies/protocols，与 Beyond Self-Talk 覆盖重叠且更粗）；A Survey on LLM-based Multi-Agent System（arXiv:2412.17481）；Large Language Model based Multi-Agents: A Survey of Progress and Challenges（arXiv:2402.01680）。三者均为预印本、框架与已选两篇重叠，按「少而准」不入选。

### 1.2 各篇分类框架（有来源转述）

**survey-mem-tois（TOIS 2025）——「来源 / 形式 / 操作 / 评测」四问框架**（§5–§6，正文已读）：
- 记忆来源（§5.1）：trial 内信息 / 跨 trial 经验 / 外部知识。
- 记忆形式（§5.2）：文本形式（自然语言、结构化元组、数据库）vs 参数形式（权重内化）；文本侧再按存取策略分完整交互 / 近期缓存 / 检索 top-K / 外部知识。
- 记忆操作（§5.3）：写（投影原始观测为记忆）/ 管理（reflection 高层抽象、merging 合并、forgetting 遗忘）/ 读（相似度检索入库）。
- 评测（§6）：直接评测（主观 coherence/rationality；客观 correctness/F1/效率）vs 间接评测（对话、多源问答、长上下文应用、其他任务）。作者在其写作时点（arXiv v1 为 2024-04）指出「尚无面向记忆模块本身的开源基准」（§6.3 引文）——**这是该版本时点的判断，不得当作 2026 年现状陈述**：此后 LoCoMo、LongMemEval、MemBench 等记忆基准已出现（见 docs/research/agent-shared-state-handoff-learning-roadmap.md §8 索引）；导读引用时必须带时点限定。

**survey-comms-fcs（FCS，CCF-B）——两层通信框架**（章节结构已核，§4 部分正文已读）：
- 系统级通信（§3）：架构（flat / hierarchical / team / society / hybrid）；目标（cooperation / competition / mixed）；协议（MCP、A2A、ANP 等）。
- 系统内部通信（§4）：策略（one-by-one / simultaneous-talk / simultaneous-talk-with-summarizer）；范式（message passing / speech act / **blackboard**）；对象（self / other agents / environment / human）；内容（显式=自然语言、代码与结构化数据；隐式=行为反馈、环境信号）。
- 与站内 Beyond Frameworks 卡互补：那篇按治理/参与/交互/历史四维拆协作；本篇按通信两层面拆，「内容」维显式/隐式之分可直接接到「语义内容」轴。

**survey-mem-age（预印本 v2）——「形态 / 功能 / 动态」三维框架**（摘要+目录级，正文截断）：
- 形态（§3）：token 级（flat 1D / planar 2D / hierarchical 3D）、参数级（内部/外部）、latent 级。
- 功能（§4）：factual / experiential（case/strategy/skill-based）/ working memory——明确批评 long/short-term 二分不够用。
- 动态（§5）：formation（summarization/distillation/structured/latent/parametric）/ evolution（consolidation/updating/forgetting）/ retrieval（时机、query 构造、策略、后处理）。
- §7.5「Shared Memory in Multi-Agent Systems」（仅目录级）：多智能体共享记忆作为前沿方向。
- 使用注意：预印本未正式发表，框架词汇新但未经同行评审；导读中可作「最新提法」，不作定论依据。

### 1.3 章节阅读指引（制作导读用，按目的给节级路线）

| 目的 | 读哪篇哪节 | 读到什么程度 |
|---|---|---|
| 搭「记忆」方法树主干 | survey-mem-tois §5.1–5.3 | 正文已核，可直接做导读骨架 |
| 搭「协作/通信」方法树主干 | survey-comms-fcs §3.1/§3.3/§4.1/§4.2/§4.4 | 框架已核；§4.4 内容分类只有框架级正文，深入需补读 |
| 更新记忆词汇（factual/experiential/working） | survey-mem-age §2.3、§4、§5 目录 | **不入选首批**；目前仅目录级，补读原文前不得写节级指引 |
| 接「共享记忆/多智能体」前沿 | survey-mem-age §7.5 | **不入选首批**；仅目录级，同上 |
| 评测意识（记忆基准缺口，**仅限该综述写作时点的判断**） | survey-mem-tois §6 | 正文已核；引用须带时点限定 |

---

## 2. 领域树 / 方法树（有来源，候选稿）

以下树枝均标注来源。两侧划分沿用 009 R1 的 problem / method 两侧；每枝标 [survey-mem-tois §x]、[survey-comms-fcs §x] 等来源。整棵树是**内容候选**，是否进入 `LIBRARY.map` 取决于主会话审定与 R7 清单流程，本轮不落产品数据。

### 问题侧（Agent 研究对象 / 问题）

- **P-异构接续**：异构模型接续非原生轨迹（non-native continuation）时的质量损失与表示选择。[站内 handoff-tax、handoff-debt 卡；近邻 Do Not Restart §1]
- **P-跨模型共享记忆**：单一记忆系统能否跨不同 backbone 模型复用，模型特异偏差如何剥离。[近邻 MemCollab §1；survey-mem-age §7.5（目录级）]
- **P-通信成本与冗余**：多智能体自然语言通信的 token 开销与冗余裁剪、格式选择问题（该开销的量级因模型/任务而异，本审计不登记任何通用百分比数值）。[survey-comms-fcs §5.1（框架级）；近邻 Routed Graph Handoff §1]
- **P-压缩隐性成本**：上下文压缩在任务完成率不变时累积的再获取交互成本。[近邻 Compression Cost §3–4]
- **P-记忆可靠性**：后任务整理者只看过往轨迹会保留错误/过度泛化/陈旧知识。[近邻 Grounding（摘要级）]
- **P-协作维度混淆**：框架名堆砌替代维度分析。[站内 beyond-frameworks 卡；survey-comms-fcs §1]

### 方法侧（方法 / 解决思想）

- **M-协作维度分解**：治理/参与/交互/历史四维 [beyond-frameworks §3.2–3.5，站内已核]；通信两层面（系统级架构-目标-协议；内部策略-范式-对象-内容）[survey-comms-fcs §3–4]。
- **M-记忆生命周期**：来源→形式→操作（写/管理/读）→评测 [survey-mem-tois §5–6]；新词汇：形态(token/parametric/latent)×功能(factual/experiential/working)×动态(formation/evolution/retrieval) [survey-mem-age §3–5（目录级）]；单智能体机制实例=MemGPT 主/外部上下文+控制流 [站内 memgpt 卡 §2.1–2.4 已核]。
- **M-表示层选择**：raw / compact / drop 三族与方向依赖 [handoff-tax §3.1 已核]；四视图（仓库/原始轨迹/摘要/结构化笔记）[handoff-debt §5 已核]；图结构 vs 自然语言按任务路由 [Routed Graph Handoff §2]。
- **M-合约式接续**：冻结残差合约（reached-state contract）→ 副本上残差补全 → 全图准入后才给实写权限 [Do Not Restart §3，正文已读]。
- **M-对比轨迹蒸馏**：跨模型轨迹两两对比，抽「推理不变量+违规模式」为共享记忆，任务+模型双门控检索 [MemCollab §2，正文已读]。
- **M-计费与评测**：两本账（恢复/保留分列）[handoff-tax §4、handoff-debt 表2 已核]；交互成本（re-query loop、D-state/R-state 可恢复性分解）[Compression Cost §3–4]；TAR 质量/开销同杆秤 [beyond-frameworks 卡]。

### 四轴候选的落点（共享讨论口径，均为候选非定稿）

- **状态在哪**：形式/位置问题 → M-记忆生命周期的「形式」支（文本在窗内/外部库、参数级）[survey-mem-tois §5.2]；图式状态 [RGH §2.1]；合约冻结的 reached state [Do Not Restart §3.1]。
- **谁决定传什么 → 何时更好**：策略与时机问题 → 治理/参与维 [beyond-frameworks]；通信策略 [survey-comms-fcs §4.1]；方向依赖 [handoff-tax §4]；准入时机（先验证后授权）[Do Not Restart §3.3]。
- **语义内容**：内容问题 → 显式（NL/代码/结构化）vs 隐式（行为/环境信号）[survey-comms-fcs §4.4（框架级）]；事实证据 vs 前任判断（见 §4 近邻 RGH/MemCollab 条）；raw 中含错误路径的风险 [站内导读口径+handoff-tax]。
- **获取计费**：成本问题 → 再获取回路 [Compression Cost]；累计输入 token 与事件数分列 [handoff-debt 表2]；接收方每轮重复计费 [handoff-debt §5.3]。

三个子轴落点：**发送方交接 vs 接收方获取**——不能直接以 Tax 的 Compact_pre/Compact_suf 充当这对轴的两端：经 2026-09-24 重查 arXiv:2608.24358v1 §3.1，Compact_pre 是**前任（prefix）模型自己**把轨迹压成摘要传给继任方，Compact_suf 是**继任（suffix）模型自己**读完整轨迹后写摘要再续接——两者都是交接时刻的摘要注入（push），都不是接收方运行时的主动获取（pull）；这对条件说明的是「**谁来做压缩**」，只能给「发送方交接 vs 接收方获取」轴提供「由谁加工表示」的一小段证据，接收方主动获取一侧在 Tax 中不存在，需另找 re-query 回路类机制（如 Compression Cost）佐证。Do Not Restart 是发送方侧合约+接收方侧副本执行的合取，亦非运行时拉取。**事实证据 vs 前任判断**——Debt 四视图、MemCollab 不变量/偏差剥离、Grounding 探针核验，分别落在写/传/存三环节。**选择器缺能力 vs 缺信息**——RGH 路由缺能力（保守默认 NL，oracle 余量 8.6pp）；Compression Cost 的 oracle 状态恢复消掉一半再获取成本，提示部分场景缺的是信息而非能力。

---

## 3. 近邻核查总表（原讨论 5 组题名，全部真实存在）

| 题名（原讨论） | 核到的真实条目 | arXiv | 作者 | 发表状态 | 读取范围 |
|---|---|---|---|---|---|
| MemCollab | MemCollab: Cross-Model Memory Collaboration via Contrastive Trajectory Distillation | 2603.23234 v2（v1 2026-03-24，v2 2026-05-28） | Yurui Chang, Yiran Wu, Qingyun Wu, Lu Lin | 预印本，无发表声明 | **HTML 全文节级提取** |
| Routed Graph Handoff | Routed Graph Handoff: Adaptive Format Selection for Multi-Agent LLM Delegation | 2608.25277 v1（2026-08-26） | Pratyay Banerjee, Ankit Chadha | 预印本（2 作者） | **HTML 全文节级提取** |
| What Does Context Compression Cost an Agent? | What Does Context Compression Cost an Agent? Interaction Costs Unrevealed by Task-Completion Metrics | 2608.16370 v1（2026-08-17） | Shuyu Liu | 预印本（单作者） | **HTML 全文节级提取** |
| Do Not Restart | Do Not Restart: Residual Completion for Stateful Agent Handoffs | 2609.13800 v3（v1 2026-09-12 起） | Runzhi Deng, Yiming Zhong, Fang Zhao, Pan Zhou | 预印本 | **HTML 全文节级提取** |
| Grounding Agent Memory | **同名两篇，需消歧**：(a) Grounding Agent Memory: Environment-Probing Curation for Enterprise Agents（2609.11060 v1，2026-09-10，Suresh/Mak/Bhatnagar/Methani/Gutierrez Munoz，企业 GHCP 平台场景）；(b) Grounding Agent Memory in Contextual Intent（2601.10702 v2，STITCH 系统，Yang/Jiang/Jiang/Kargupta/Zhang/Han，评论字段自注 ACL 2026，**ACL Anthology 未检索到，未经官方复核**） | 见左 | 见左 | 均预印本；(b) 有作者自注 venue | 均仅摘要级 |

五组题名无一虚构；两组 Grounding 同名已并列登记待主会话消歧。以下详读卡覆盖前 4 篇（满足「至少 3 篇」），详读均经 HTML 全文页转述提取，关键句为工具回引的原文短句。

---

## 4. 近邻详读卡（4 篇）

### 4.1 What Does Context Compression Cost an Agent?（Compression Cost）

- **身份**：arXiv:2608.16370 v1，2026-08-17，Shuyu Liu（单作者），预印本。
- **问题**：任务完成率是评测上下文压缩的标准指标，但它不完整——压缩丢掉的运行态要靠额外交互买回来，这部分「交互成本」在完成率里看不见（「Task completion is the standard metric…yet it is an incomplete measure」）。
- **机制**：提出 re-query loop 概念，并按**可恢复性**分解被丢状态：D-state（外部可查的任务图，可恢复但再获取费交互）与 R-state（历史依赖约束，公开查询不可恢复）。核心论点：压缩变贵发生在「被丢状态须在有限预算内再获取」时，而非信息丢失本身。
- **证据**：确定性规划环境 IRBench、24 轮交互上限；DeepSeek/Qwen/GPT-5.5 三模型 × 高/低 IR 两任务区制 × 多压缩比 × 两种算子（滑窗/抽取式摘要）+ oracle 状态恢复干预。发现：6 组对比中检索调用全升（5/6 经 Holm 校正仍显著）而执行调用稳定；GPT-5.5 完成率统计不变（80%→85%，p=1.0）检索却增至约 3 倍（+42.9 次）；恢复 D-state 消掉约一半检索成本；同预算下保事实的摘要算子避开大部分额外检索；ALFWorld 中同算子无检索激增——**成本是环境依赖的，不是压缩的内在属性**。
- **局限**（作者自列 11 条摘其要）：两个有界、近合成环境；3 个模型族；24 轮上限是设计选择；工具调用数作成本代理；单压缩点跨模型；选择零效应与内容复制只在部分模型确认。
- **与 Handoff Tax / MemGPT 的关系**：给站内「两本账」口径补上机制证据——Tax/Debt 记的是交接时的输入/累计账，本篇记的是交接后**运行中**因表示有损而再付的账；R-state 不可恢复正是 Tax 的 Traj-drop「丢掉的回不来了」的负面对照；其「完成率不变的压缩可能很贵」直接支持方向反转结论的谨慎解读（Tax 的质量恢复与成本保留分列）。与 MemGPT 的关系：MemGPT 把换出/读回做成显式函数调用，本篇说明**读回次数本身就是该计费的一等公民指标**。
- **解释价值排序**：第 1 优先（直接喂「获取计费」轴，且是 4 篇中实验设计最克制、自列局限最完整的一篇；但单作者+合成环境，证据强度按预印本对待）。

### 4.2 Do Not Restart: Residual Completion for Stateful Agent Handoffs（Do Not Restart）

- **身份**：arXiv:2609.13800 v3（v1 2026-09-12），Runzhi Deng, Yiming Zhong, Fang Zhao, Pan Zhou，预印本。
- **问题**：有状态 handoff 中，继任模型如何在保留已接受选择与其效果的前提下补全未完成义务、避免重复动作。提出 **commitment frontier**（已接受前缀的进度必须保留，而请求范围内的工作仍开放）与 commitment-constrained residual completion 三谓词：从已达状态执行、保留已接受绑定/效果、补全全部开放义务。
- **机制**（CFRC 三阶段）：①RSCC——继任方提议**之前**先从已接受轨迹冻结残差合约，「被省略的工作不会因继任方不提就消失」；②ERC——继任方在隔离副本上写续接，确定性桥接为证据链接图；③CE——整图对照合约准入后才给实写权限，且只以活环境回执确认完成（「副本成功不解除义务」）。排序原则：先目标后提议、整提议先于授权、活证据先于成功。
- **证据**：5 个有状态工具基准（STATE-Bench、τ²-Retail、τ²-Airline、ToolSandbox、Agent-Diff）；GPT-5.4-mini/5.5 与 Luna/Sol 为主模型对，另有跨厂商对（Luna/Sonnet 5、Luna/Gemini 3.7 Flash、Haiku 4.5/Sol）；基线 StepWise、MTRouter、RouteLLM-BERT、FrugalGPT、AgServe-QAC。结果：CFRC 70.8% macro vs 强锚 69.6%，成本 34.6%；跨厂商对「距强锚 0.5 分以内，成本 26.0%/44.1%」；整图准入比逐步核查 +8.8 分且省 $8.26；审计：持久写义务召回 91.2%，零无据实写，124 次 CE 干预全部发生在首次实写之前。
- **局限**（作者自列）：只评单任期 cheap→strong、合约冻结；递归路由超范围；对话披露不在工具效果 schema 内时形式化提升以合约完整为前提；不保证构造器正确、不保证解存在、失败不隐含回滚。
- **与 Handoff Tax / MemGPT 的关系**：把 Tax 的「方向×界面」骨架推进到「状态义务」维度——Tax/Debt 冻结的是仓库现场，本篇冻结的是**合约**（什么固定了、什么还开着）；其「先验证后授权」给出了发送方交接与接收方获取之外的第三种分工：环境侧门禁。与 MemGPT 呼应：MemGPT 的控制流由 LLM 自主发起，本篇的准入是**确定性**的——正好补 MemGPT 卡「搬运由策略执行」之外的「何时不该放行」问题。
- **解释价值排序**：第 2 优先（与主方向「状态在哪/何时更好」两轴直接咬合，跨厂商对有状态证据；但模型代号与基准均新，未独立复核基准真实性）。

### 4.3 MemCollab: Cross-Model Memory Collaboration via Contrastive Trajectory Distillation

- **身份**：arXiv:2603.23234 v2（v1 2026-03-24，v2 2026-05-28），Yurui Chang, Yiran Wu, Qingyun Wu, Lu Lin，预印本。
- **问题**：异构部署下（不同规模/架构/专长的 backbone），单一记忆系统能否跨模型共享。发现朴素跨模型迁移反而降性能——记忆把任务知识与**模型特异推理风格**缠在一起。
- **机制**：对比轨迹蒸馏。同一任务多模型产出轨迹，选优选劣（正确解优先，否则最强模型解优先），由最强模型对比抽**违规模式**与**推理不变量**，落成「enforce i_k; avoid v_k」范型约束入共享记忆库（带模型身份标签）；推理时两阶段检索：任务类别过滤→参与模型过滤→语义排序取 top-3。
- **证据**：MATH500、GSM8K、MBPP、HumanEval、AppWorld、ASQA；Qwen2.5-7B/32B、LLaMA-3-8B，扩展至 Llama-3-70B、Qwen2.5-72B、Gemma3-4B、GPT-5-mini/nano；基线 BoT、Dynamic Cheatsheet 及同源记忆消融。结果：Qwen-7B 平均 57.1→71.6，Qwen-32B 70.8→79.6；直接迁移（7B 用 32B 记忆）在 MATH500 反降（52.2→50.6），支撑「朴素共享有害」论断。
- **局限**（作者自列）：实际部署需对记忆访问/复用做策略化治理（访问控制、安全过滤留作未来工作）；附录另有实现层面限制（本轮提取到附录级，未逐页核）。
- **与 Handoff Tax / MemGPT 的关系**：直接补 MemGPT 的跨模型缺口——MemGPT 管单智能体窗内外搬运，MemCollab 问「存下来的东西给**另一个模型**用会怎样」；其「朴素迁移有害」给 Tax 的方向依赖提供一个记忆侧镜像：接收方不是越强越能消化前任表示，表示与模型的耦合本身就是税。检索双门控（任务+模型）是 MemGPT 控制流的跨模型版。
- **解释价值排序**：第 3 优先（把主方向「表示组合」问题从单任务交接扩展到跨模型记忆，机制写得完整；数学/代码任务与 coding 场景有距离，引用时注意迁移边界）。

### 4.4 Routed Graph Handoff: Adaptive Format Selection for Multi-Agent LLM Delegation

- **身份**：arXiv:2608.25277 v1，2026-08-26，Pratyay Banerjee, Ankit Chadha（2 作者），预印本。
- **问题**：多智能体系统默认自然语言通信，该文称这给委派带来显著 token 开销（**原文给出的 40–60% 预算占比无具体模型/任务条件，本审计不登记、不转引此数值**）；其错误分析（该文自称、未独立复核）报告称 76% 失败涉智能体间不对齐。
- **机制**：类型化依赖图（8 节点类型、7 边关系）承担结构化委派；约 155 token 的轻量 LLM 路由按任务在图/NL 间选择（默认保守回退 NL）；需配图感知执行器提示词才有效果。点出 structure-flexibility 权衡：图利于有依赖链任务，伤害需自适应的任务。
- **证据**：BrowseComp、BFCL、τ-retail、AppWorld 四基准、1052 条轨迹、Claude Sonnet 4.5 编排、配对 bootstrap CI。τ-retail +12.7pp 且 3.2× 压缩（p<0.01）；BrowseComp +8.7pp 2.2× 压缩（p<0.05）；AppWorld 持平（路由避开 14.6pp 回退）；oracle 分析余量 8.6pp。
- **局限**（作者自列）：路由按任务类型聚类而非实例级自适应；schema 在 47 条 τ-bench 轨迹上设计，泛化未证；主结果单编排骨架（GPT-5 mini 仅测过）；执行器提示词必要但增加复杂度。
- **与 Handoff Tax / MemGPT 的关系**：是「adaptive handoff selector」的现成实例，把 Tax 的静态四条件升级为按任务路由；其「缺能力（保守默认 NL）vs 缺信息（oracle 余量 8.6pp）」正是选择器轴的两面证据；与 MemGPT 关系弱（多智能体委派语境），仅在「表示选择需要配套执行器认知」上与 MemGPT「读回需策略」同构。
- **解释价值排序**：第 4 优先（机制小而直接，适合导读举例；作者规模与基准设计约束明显，只作机制例子不作结论依据）。

---

## 5. 制作导读的推荐顺序（可直接执行；按主会话审计口径：首批 = 2 篇综述 + 4 篇近邻，第三篇仅目录级的综述不入选首批）

1. **先立方法树主干（2 篇综述）**：survey-mem-tois §5.1–5.3（记忆：来源/形式/操作）+ §6（评测缺口，带时点限定）→ 接 survey-comms-fcs §3–§4 骨架（通信两层面）。这两篇是已核正文，可放心写节级导读。
2. **再挂站内已核四卡**：Beyond Frameworks 四维 ↔ comms-fcs 通信维对照（一篇管「协作内部分析」、一篇管「通信内容分类」）；MemGPT 挂在记忆树「操作」枝作单智能体机制实例。
3. **近邻 4 篇按解释价值进导读**：Compression Cost（计费轴机制证据）→ Do Not Restart（状态/时机轴）→ MemCollab（跨模型表示轴）→ RGH（选择器轴小例子）。4 篇均预印本，导读中统一标「预印本，未经同行评审」，数字引用带设置条件。
4. **survey-mem-age 不入选首批**（主会话审计意见：仅目录级、预印本）。它只登记为「词汇更新候选」——factual/experiential/working、forms/functions/dynamics 三对新词在补读 §3–§5、§7.5 原文且确认与已核框架兼容前，不得进入任何导读或地图文案。
5. **Grounding 两篇先消歧再决定是否入选**；在摘要级状态下不进任何节级导读。
6. 四轴与三子轴文案维持「候选、未由用户定稿」的标注口径（与共享讨论一致）；**「发送方交接 vs 接收方获取」轴目前只有「谁做压缩」级证据，接收方运行时主动获取一侧尚无已核来源**，相关文案按此强度写。

## 6. 实际获取限制（如实报告）

- DBLP 与 Semantic Scholar 本轮被反爬/429 拒绝，venue 核验走 OpenAlex + arXiv abs + ccf.org.cn 目录页 + ACL Anthology（STITCH 未命中）；如需 DBLP 二次核验，请换网络环境人工补。
- survey-mem-tois 经 ar5iv 读取，页面截断于 §7.4：§7.5–§9 仅目录级。
- survey-mem-age HTML 截断于 §3.1.1 中段：§3.1.1 后半至 §8 仅摘要+目录级。
- 4 篇近邻为工具转述式全文提取，非逐行精读；其图表数值除 MemCollab 表 1 选取行与 RGH 关键 pp 值外未逐项核表。
- TOSEM 卡（code 方向）本轮未涉及；如需并入同一审计表，需另开任务包处理其「保留收窄」状态。
- 全部 9 个条目均为公开来源，未触碰 private/ 与 .grad/，未初始化任何个人研究记录；本文件为唯一新建文件，未提交、未推送。

## 7. 复核修订记录（2026-09-24，按主会话审计意见）

1. **Tax 子轴推断修正**：原稿称「Compact_pre/Compact_suf 正是发送方交接 vs 接收方获取两端」。当轮重查 arXiv:2608.24358v1 §3.1 原文：Compact_pre＝前任模型自压摘要传给继任方，Compact_suf＝继任模型自读全轨迹自写摘要——均为交接时刻的摘要注入（push），无一是接收方运行时主动获取（pull）。已改写为：该对条件只提供「谁做压缩」级证据，「发送方交接 vs 接收方获取」轴的接收方主动获取一侧**尚不能直接证明**，需 re-query 回路类来源另证。
2. **泛化数值删除**：RGH 原文「自然语言通信占 token 预算 40–60%」无具体模型/任务条件，已从领域树 P-通信成本与冗余节点与 §4.4 详读卡中删除，并注明不登记、不转引；其「76% 失败涉不对齐」保留但显式标注为「该文自称、未独立复核」。
3. **时点限定补全**：survey-mem-tois「尚无面向记忆模块本身的开源基准」原为无时限陈述，已限定为「作者在其写作时点（arXiv v1 2024-04）的判断」，并注明 2026 年已有 LoCoMo/LongMemEval/MemBench 等基准、不得当作现状；§1.3 评测意识行同步加限定。
4. **首批范围按审计口径收窄**：推荐顺序改为首批 2 篇综述（survey-mem-tois、survey-comms-fcs）+ 4 篇近邻；survey-mem-age（仅目录级预印本）不入选首批，仅登记为词汇更新候选。
