# 07 来源核查与独立取舍

版本：008.1；修订核查日期：2026-09-21。`docs/research/` GPT路线文档只是候选目录。身份可确认、正文已读取、结论得到支持、代码实际运行是四件事；下面不混写。

## 1. 起步资源与制作前的读取范围

| 资源 | 本次文档审查依据 | 制作卡片时还须完成 |
|---|---|---|
| [Anthropic Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 已读取原文的上下文组织与长期任务管理内容；支持“存储信息不等于本轮输入”的教学区分 | 核所用段落，制作短导读及编辑例子；不能凭印象列产品功能或不存在的部署章节 |
| [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) | 原作者文章，状态与事件记录的区分适合作概念材料 | 读取并解释选用的业务例子；不宣称事件日志完整保存了人的推理原因，也不将其当成必须建设事件数据库 |
| [CoALA](https://arxiv.org/abs/2309.02427) | 身份与摘要；正文可用 [v3 HTML](https://arxiv.org/html/2309.02427v3)。地图使用记忆、动作与决策三个维度 | 核摘要与引言；用图须另核实际图像与图注，不照抄旧建议的图4/5；TMLR身份按来源明确记录 |
| [MemGPT](https://arxiv.org/abs/2310.08560) | 身份、摘要，当前abs显示v2；上下文层级管理，不是跨harness实验 | 核引言/方法概述，才能生成02要求的机制导读；不从摘要补造实验分数 |
| [Handoff Tax](https://arxiv.org/html/2608.24358v1) | 摘要、§3实验框架、§4方向性结果及附录A的实验设置 | 按实际采用版本登记coverage；主实验同mini-swe-agent脚手架，不是Cursor与Codex间搬迁验证 |
| [Handoff Debt](https://arxiv.org/html/2606.02875v2) | 正文§5.1表2、§5.3、§5.5与运行时边界；不是只核摘要 | 卡片如采用比较句必须重新读取相应位置，明确事件数/累计输入token/初始长度与外推边界 |
| TOSEM、Agentless、SWE-bench | 现有库的覆盖记录与正文是这次编辑的起点，不冒充今天重读过全文 | 校对新增学习建议是否被原coverage支撑；TOSEM可用design正文解释工具类别和复核，而非四套详细算法 |

Tax/Debt只按预印本身份写，不推测录用。checkedAt 是实际制作时的核查日期，不能复制本文件日期充当重读记录。现有卡未新增来源读取，不改其原checkedAt。

## 2. 必须精确表达的证据边界

### Handoff Tax

正文§3及附录A说明其主要coding比较使用相同mini-swe-agent、工具和提示，保留换手时仓库状态，比较轨迹继承方式；§3.1区分Raw、Compact_pre、Compact_suf、Traj-drop。摘要把压缩合并成大类，讲完整条件时不能说只有三个实验条件。升配/降配呈不同权衡，是该设置的结果；§5还有其他任务扩展，不能反过来说整篇只研究coding，也不能据此宣称验证了不同商业harness互通。来源：[Tax正文](https://arxiv.org/html/2608.24358v1)。

推荐卡片句：“在作者的coding设置下，交接信息的取舍随换手方向而变；跨工具能否复现仍需验证。”不用“总是”“必然”，不用未经定位的隐含比例。建议未来比较通信机制是编辑分析，不是论文保证。

### Handoff Debt

- “raw比笔记少操作”定位§5.1表2的agent events：主实验所列后任模型中，raw中位事件数低于summary/structured。
- “更省token”不能直接接在上一句后面：同表Qwen后任的summary/structured累计prompt tokens反而低于raw；其他后任呈不同权衡。
- §5.3比较的是初始提示字符长度，raw明显更长；不能把字符数称token，也不是等长输入实验。
- §5.5的跨模型检查与运行时局限需要保留；“上下文降低重新发现成本”不等于“哪个格式永远最优”，也不等于最终解出率必然提升。

以上依据是[Debt正文§5及表2](https://arxiv.org/html/2606.02875v2)，不是其摘要。推荐卡片句：“结构化不自动优于原始轨迹；这里的操作次数、累计输入token和最终解出率要分别看。”若无法取到正文，仅凭摘要不能发布上述排名。

### AgentPrune与平台边界

[AgentPrune / Cut the Crap](https://arxiv.org/abs/2410.02506)研究多智能体管线的通信图裁剪。准确边界是“没有在本方案所指的独立商业harness之间验证互通”，而不是未经核查断言所有实现只能单进程。同运行时通信优化提供对照视角，不能直接解决受限工具之间的信息访问问题。

## 3. 技术主资源：已定向核网页，未运行示例

以下均在本次文档修订中核到官方内容。实施者按04读指定范围、记录版本与访问前提，不需重新海选教程。本次未安装依赖、未运行这些教程，不将“可访问”写成“运行已验证”。

| 资源id / 单元 | 官方地址 | 已核内容与边界 |
|---|---|---|
| res-lg-quickstart / MA-1 | [LangGraph Quickstart](https://docs.langchain.com/oss/python/langgraph/quickstart) | Graph API包含工具、状态、节点、结束逻辑、编译运行的示例；教材自行补参数校验与步数上限，不能谎称原教程全有。原真实模型示例需要API凭据 |
| res-lg-checkpointers / MA-2 | [Checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers) | 已核threads/checkpoints/replay及库接口范围；[Persistence总览](https://docs.langchain.com/oss/python/langgraph/persistence)作背景，明确InMemorySaver重启丢失与SQLite适用范围。磁盘教材还须按实际安装版本核对接口并运行 |
| res-lg-workflows / MA-3 | [Workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) | Evaluator-optimizer的生成/评估/回路示例；本教材算术任务与确定性真值检查是编辑教学设计，不是原文实验 |
| res-lg-interrupts / MA-4 | [Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts) | interrupt与恢复，说明节点恢复的重新执行边界；教材另加两次重试上限/取消出口，不承诺框架自动防一切副作用 |
| res-llamaindex-starter / RAG | [Starter Tutorial (Using OpenAI)](https://developers.llamaindex.ai/python/framework/getting_started/starter_example/) | 可跟随的载入、索引、查询教程；网页公开，真实模型运行需凭据及费用。引用检查/失效观察是04补充任务 |
| res-networkx-tutorial / G-1 | [NetworkX Tutorial](https://networkx.org/documentation/stable/tutorial.html) | 建图、节点/边/邻居；本次页面为3.6.1，实施按实际版本记录 |
| res-distill-gnn / G-2 | [A Gentle Introduction to Graph Neural Networks](https://distill.pub/2021/gnn-intro/) | 图表达与消息传递直觉，教学只取图示，不据此要求全部推导 |

旧 res-sbert 的召回重排教程按既有URL定向复核；旧 T3 的 res-ms-17 保留原目录级核查，不将其提升成已经验证的手写循环教程。HF Agents Course 仍不自动升可开始。API费用不是网页阅读付费，access与versionNote要区分。

## 4. archive身份目录与历史核查

02列十项是范围冻结的外链目录，不是十张新卡。先前文档记载的ReasoningBank、MemoryArena、Lost in the Middle、MetaGPT/AutoGen、Blackboard、wiki/harness文章身份保留为核查线索；本次没有逐项复核完整正文，不能统一打成“全文已核”。实施只需逐项核公开身份、URL及目录角色；结果填checkedAt，失败pending。MemoryArena用arXiv:2602.16313核身份，不与同名无关仓库混淆。

不为archive写未读取的算法或效果结论；目录note表达“以后核什么”而非已经证实的研究缺陷。archive待核不阻塞6+4，待核链接也不能伪称可读。OpenAI SDK只作外链背景，不再是MA-4主课。

## 5. 相对旧GPT目录与原008的独立决定

1. 12周全表只当索引；6+4是起步地图，不是承诺最优或必须按周完成的课表。
2. Tax先于Debt，因为先关注强弱模型协作，再看中断接管；换手只是更广通信问题的第一切片。
3. MemGPT先于Generative Agents，是与当前问题的学习适配判断，不是判定后者价值低。
4. Event Sourcing先于Blackboard原论文，先用可读的状态/事件例子建概念；不让新生先实现事件溯源架构。
5. Debt必须呈现结构化不自动胜出，但不把它改写成raw在任何成本指标上全面胜出。
6. AgentPrune仅为消息图优化对照，不是跨工具解法。
7. 不做LangMem/Beads/OpenWiki/OpenHands源码周，不在工作台建研究协议。技术路线改用同一Python+LangGraph练习学工程概念，不是添加研究平台。
8. 不要求本期跑20–50任务研究对照，教学测试只证明教材可用，不证明科学假设。
9. RAG研究方向延后，技术按需；图是浅技术，不是第三条论文方向。
10. 本期材料无个人记录，后续若确需材料笔记，另立存储版本与迁移契约，不塞入papers字典或未被保存器支持的items。

## 6. 保持未决

不同模型与商业harness间结果是否同分布、长期合作是否需另一类机制、共享状态是否胜过维护良好的文档/wiki、是否具有足够新颖性与发表价值，都仍需阅读与实验。此文档只将起步学习和平台实施变得明确，没有替这些研究问题提前下结论。
