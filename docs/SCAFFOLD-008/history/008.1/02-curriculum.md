# 02 学习路线：看什么、怎么走

原则：少、可混媒介、先地图后精读。`startRoute` 是用户默认看见的；`archiveRoute` 是以后加长用的，**实施第一期不为主方向 archive 造站内卡，仅登记外链目录**。

版本：008.1。6+4 节点及顺序冻结。下表 Explain 是待制作的讲解题材，只有实际交付讲解并核对依据后才显示；没有材料时省略该 Explain，不强制凑齐三类动作。核心三问仍须交付。passMode 是用户建议读法，deliveredDepth 是实际交付，core 不是合法 deliveredDepth。

每个节点的 `passMode`：

- `map`：一次短浏览，先看摘要/引言/已核总图或小节标题；以能回答「它在地图哪一格」为止，不承诺固定完成时间。  
- `core`：读问题定义、机制主线、实验在比什么。不读附录。  
- `deep`：本里程碑 **startRoute 不要求 deep**。有正文依据后再升级。

阅读动作（Preserve / Explain / Skip）只约束「碰到正文时怎么分配注意力」。`map` 节点的 Preserve 往往是「摘要里的问题句 + 一张总图」，不是全文。

---

## 1. 主方向 `cross-harness-collab`

### 1.1 startRoute（6 步，按此顺序，不得自行加塞）

#### 步 1 — 博客：记忆不是这一轮给模型看的东西

| 字段 | 值 |
|---|---|
| id | `mat-context-eng` |
| kind | `article` |
| stage | 建立概念 |
| required | 必读 |
| passMode | `map` |
| title | Effective Context Engineering for AI Agents |
| url | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents |
| 为什么现在 | 后面所有论文都在「存什么」和「这一轮给模型看什么」之间打转。先把这两层拆开，读 MemGPT / Handoff 才不会混。 |
| 讲什么 | Prompt engineering 问怎么写提示；context engineering 问这一轮哪些 token 该进窗口。 |
| 价值 | 给你一张施工图：指令、工具、历史、外部数据、草稿、压缩，是不同槽位。 |
| 带着什么目的 | 能用自己的话写出：Memory = 可能有用的长期信息；Context = 本轮真正送给模型的有限 token。 |
| Preserve | 「能装下 ≠ 能用好」；列出文中的上下文组成（instructions / tools / history / data 等）。 |
| Explain | 用编辑辅助例子区分“存下来的信息”和“本轮实际输入”；依据原文上下文管理段落，不补造产品功能清单。 |
| Skip | 暂不扩展到原文之外的产品配置和部署学习；不把这些当成已核原文章节。 |
| 读完能解释 | Memory 与 Context 的差别；为什么「把全部历史贴进提示词」不是跨工具协作的答案。 |
| 解锁 | 步 2（状态与历史）；技术路线「多智能体架构」单元 2。 |

若该 URL 失效：备用 LangChain《Context Engineering for Agents》https://www.langchain.com/blog/context-engineering-for-agents ，口径相同，覆盖里写明换源。

#### 步 2 — 博客：当前状态不是事件历史

| 字段 | 值 |
|---|---|
| id | `mat-event-sourcing` |
| kind | `article` |
| stage | 建立概念 |
| required | 必读 |
| passMode | `map` |
| title | Event Sourcing |
| url | https://martinfowler.com/eaaDev/EventSourcing.html |
| 为什么现在 | 「共享状态」常被理解成大家改同一份 JSON。这篇用软件设计把 **现在的值** 和 **怎么变成这样的事件** 分开。跨工具时，共享区到底存快照还是存事件，后面所有通道都依赖这个区分。 |
| 讲什么 | 状态可以由所记录的事件还原；只存最终状态会丢掉变化过程。事件也未必记录全部推理原因，不能承诺完整保存「为什么」。 |
| 价值 | 给共享区一个不是 AI 黑话的祖先概念。 |
| 带着什么目的 | 能画出：事件日志 → 规约成快照；快照可丢细节，日志可重放。 |
| Preserve | Current State ≠ Event History；为何要能重放。 |
| Explain | 文中的业务系统例子。 |
| Skip | 本次不延伸学习具体库、CQRS 和性能调优，不将未核内容写成原文的具体章节。 |
| 读完能解释 | 为什么多个模型直接改一个巨大 JSON 会打结；日志、快照、检查点不是同一个东西。 |
| 解锁 | 步 3 CoALA；技术单元「显式状态」。 |

#### 步 3 — 论文：Agent 不是模型加提示词（只做地图）

| 字段 | 值 |
|---|---|
| id | `coala`（新论文卡，quick） |
| kind | `paper` |
| stage | 建立概念 |
| required | 必读 |
| passMode | `map` |
| title | Cognitive Architectures for Language Agents |
| displayTitle | CoALA：用认知架构看语言智能体 |
| url | https://arxiv.org/abs/2309.02427 |
| identity | arXiv:2309.02427；TMLR 2024；Sumers, Yao, Narasimhan, Griffiths |
| 为什么现在 | 需要一张**词汇表**：工作记忆、长期记忆、内部动作、外部动作、决策循环。后面 MemGPT、换手、多智能体都要挂在这张表上，而不是一上来记网络结构。 |
| 讲什么 | 把语言 Agent 写成：模块化记忆 + 对内对外的动作空间 + 提出-评价-选择-执行的循环。 |
| 价值 | 地图型论文，不是要你实现 CoALA。 |
| 带着什么目的 | 能指着一张自己画的框：LLM 在哪、记忆在哪、环境在哪。 |
| Preserve | 引言中 memory/action/decision-making 三维；总图仅在实施者核对图号、图注及图像后列出，不能抄“图 4/5”。无法查看图像时用已核引言完成地图目标。 |
| Explain | 文中用 CoALA 回顾哪些现有工作。 |
| Skip | 通向「通用智能」的展望、与所有认知科学学派的对照、证明式讨论。 |
| 读完能解释 | 为什么「再写一个更好的 prompt」解决不了跨工具协作。 |
| 覆盖纪律 | 第一期 quick，覆盖至少摘要与引言；图像核查情况单列。依 03 显示实际依据，不固定写“仅摘要”。 |
| 解锁 | 步 4 MemGPT。 |

#### 步 4 — 论文：上下文窗口是有限工作内存（只做地图）

| 字段 | 值 |
|---|---|
| id | `memgpt`（若库中无则新建；现有 foundations 无此 id） |
| kind | `paper` |
| stage | 理解方法 |
| required | 必读 |
| passMode | `map` |
| title | MemGPT: Towards LLMs as Operating Systems |
| displayTitle | MemGPT：把上下文窗口看成内存 |
| url | https://arxiv.org/abs/2310.08560 |
| 为什么现在 | 有了 CoALA 的词，需要一个**机制直觉**：窗口满了怎么办。OS 类比不必全盘接受，但「RAM / 磁盘 / 谁决定换入换出」就是跨工具时「谁决定共享区里什么进入下一任窗口」。独立取舍：不把 Generative Agents 放进第一段——社交模拟会把新生带偏。 |
| 讲什么 | 把上下文当工作内存，把外部存储当磁盘，由控制流管理换页。 |
| 价值 | 把步 1 的 Memory ≠ Context 落到一种可画的机制。 |
| 带着什么目的 | 能说出：存下来的东西不会自动出现在下一轮；要有写入、换出、读回的策略。 |
| Preserve | RAM/磁盘类比；谁在管理 memory hierarchy（控制流，不是「模型自己记得」）。 |
| Explain | 用已核方法概述解释一条信息如何移出当前窗口、以后再取回；不补造实验分数。 |
| Skip | Letta 产品、全部 API、与所有 OS 概念的逐条类比。 |
| 覆盖 | 摘要+引言+方法概述，quick。 |
| 解锁 | 步 5 Handoff Tax。 |

#### 步 5 — 论文：强弱模型换手，界面会反向（第一期核心论文）

| 字段 | 值 |
|---|---|
| id | `handoff-tax` |
| kind | `paper` |
| stage | 看评价与反例 |
| required | 必读 |
| passMode | `core` |
| title | The Handoff Tax: Continuing Non-Native Trajectories in LLM Agents |
| displayTitle | 换手税：接着别人的轨迹往下干 |
| url | https://arxiv.org/abs/2608.24358 |
| identity | arXiv:2608.24358，2026-08-25；Ganz, Nacson, Kalyanpur, Litman |
| 为什么现在 | **这是与用户问题最对齐的一篇**：弱且便宜 ↔ 强且贵，中途换模型，接收方要接非自己产生的轨迹。独立取舍：先于 Handoff Debt——Debt 研究的是「中断后谁来接管」，Tax 研究的是「能力不对称的协作」，更接近目的 1。 |
| 讲什么 | 在其 SWE-bench Verified coding 设置下，比较强弱模型升配/降配及轨迹处理方式；保留仓库，改变接收方可见信息。弱模型全轨迹升配有质量与成本代价，降配时保留强模型轨迹更有利；该设置下界面偏好随方向变化。摘要概述 raw/compaction/removal；细讲变体须按正文协议，不把摘要分类当完整条件列表。 |
| 价值 | 直接打破「多传信息总更好」和「同一种 handoff 格式通吃」。 |
| 带着什么目的 | 记住三个对照轴：方向（升/降）、时机、界面（raw / compact / drop）。读实验时盯设置，不盯广告句。 |
| Preserve | 问题定义（non-native trajectory）；三类轨迹处理在比什么（正文压缩分两种来源）；其coding设置下界面偏好随方向变化的实验含义。 |
| Explain | 质量恢复与成本保留指标（QRec / CSRet）各在回答什么。具体数字仅在编辑读取并定位正文表/段后出现；没有数字依据就解释概念，不渲染空数字栏，也不从摘要抄百分比。 |
| Skip | 附录超参、全部模型昵称对照、与本问题无关的工程栈。 |
| 覆盖 | 默认 quick；编辑核摘要、实验协议与局限，写清同一 mini-swe-agent/仓库环境及结果适用范围。满足 READING-TEMPLATES standard 全部要求（机制、证据、边界、细读位置、自查）才升级。只读设置不足以升级；未核结果位置不写数字，含“不到一半”这类隐含比例。 |
| 解锁 | 步 6；问题意识：通道选择是否依赖发送方、接收方与任务，需要比较。 |

#### 步 6 — 论文：四种交接视图（本期交地图导读，以后按需精读）

| 字段 | 值 |
|---|---|
| id | `handoff-debt` |
| kind | `paper` |
| stage | 看评价与反例 |
| required | 必读 |
| passMode | `map` |
| title | Handoff Debt: The Rediscovery Cost When Coding Agents Take Over Interrupted Tasks |
| displayTitle | 换手债：下一任要重新发现多少 |
| url | https://arxiv.org/abs/2606.02875 |
| identity | arXiv:2606.02875，v2 2026-08-30；Dipesh KC, Anjila Budathoki |
| 为什么现在 | 提供仓库/原始轨迹/摘要笔记/结构化笔记四种视图。主实验中 raw 的事件数更少，但累计输入 token 的优劣依接收模型而异；raw 初始上下文明显更长，不能当成等输入预算下的格式排名。结构化并不自动优于原始轨迹。 |
| 讲什么 | 在确定中断点冻结仓库，让后任在四种视图下接手，测 rediscovery。 |
| 价值 | 给「共享区里到底放什么」四个可点名的 baseline。 |
| 带着什么目的 | 能列出四视图；能说出「效率」和「是否解出」不是同一指标。 |
| Preserve | 四视图定义；handoff debt = 信息不透明时的重新发现成本；效率 ≠ 解出率。 |
| Explain | 任务、中断点与接手运行不是同一种统计单位；结合已核设置解释为什么事件数与累计输入token要分开看。 |
| Skip | 结构化笔记的字段清单（留给以后精读）；后任模型名单背诵。 |
| 覆盖 | 仍交 quick；编辑至少核摘要、引言、§5.1 表2、§5.3、§5.5 与局限，并登记定位。用户 map 只需四视图和指标区别。若只取得摘要，暂不发布 raw 与 notes 排名，节点待补结果核查，不宣称完整验收。 |
| 解锁 | archive 里的 AgentPrune / ReasoningBank / MemoryArena；以及「自己做最小对照」的想象，**本里程碑不要求做实验**。 |

### 1.2 archiveRoute（折叠，第一期只登记身份，不造新深卡）

第一期统一为 kind=external 的折叠身份目录（形状见 03），不增加 papers/materials 卡，不写进 startRoute。链接核到身份即可，失败标 pending；不会阻塞起步路线，但不能伪称可访问。

| 顺序 | id / 材料 | 角色 | 独立提醒 |
|---|---|---|---|
| 1 | Blackboard（Nii, AI Magazine 1986）https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/view/537 或 DOI 10.1609/aimag.v7i2.537 | 共享黑板祖先 | 可能需找开放版本；不是跨 LLM harness 的现代解法 |
| 2 | MetaGPT https://arxiv.org/abs/2308.00352 | SOP 与工件式协作 | 当「工件通道」对照，不作为独立商业harness互通的已验证解法 |
| 3 | AutoGen https://arxiv.org/abs/2308.08155 | 对话当协调基底 | 用来质疑「为什么非聊天不可」，不要学 API |
| 4 | AgentPrune / Cut the Crap，ICLR 2025，arXiv:2410.02506 | 通信图裁剪对照 | 未验证独立商业harness间互通，不据此断言所有实现只能单进程 |
| 5 | ReasoningBank https://arxiv.org/abs/2509.25140 | 经验记忆对照 | 后续精读核查自评判可靠性，目录阶段不预判论文缺陷 |
| 6 | Lost in the Middle https://aclanthology.org/2024.tacl-1.9/ | 长窗口装得下 ≠ 用得好 | 支撑步 1，可与步 1 互指 |
| 7 | MemoryArena https://arxiv.org/abs/2602.16313 | 记住了 ≠ 后来行动变了 | 勿与其它也叫 Memory Arena 的仓库混淆 |
| 8 | OpenAI Harness Engineering https://openai.com/index/harness-engineering/ | 仓库知识当系统记录 | 文档派强 baseline |
| 9 | LangChain Wiki Memory https://www.langchain.com/blog/wiki-memory | wiki 作为项目记忆 | 与结构化状态对照用 |
| 10 | OpenAI Agents SDK Handoffs https://openai.github.io/openai-agents-python/handoffs/ | 运行时怎样建模 handoff | 外链背景，不是MA主教程，不必当论文 |

完整 GPT 目录保存在 `docs/research/agent-shared-state-handoff-learning-roadmap.md`，当作索引，**页面不展开**。

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

## 3. 两条方向怎么衔接（写在主方向 startRoute 末或方向页一句）

读完主方向 6 步：你有了通道词汇和「界面随方向变」的问题意识。  
读完代码验证 4 步：你有了「产出怎样算对」和「更复杂不一定更好」。  
下一步可以补读 Handoff Tax 的核心正文（编辑交付升级 standard 须独立满足模板要求），或进入技术路线「多智能体架构」做贯通练习。练习选做，不作为阅读门槛。末节点显示本段结束和行动建议，不自动进入 archive，也不标本人已读。
