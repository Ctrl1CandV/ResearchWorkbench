# 07 来源核查与选目理由

版本：008.2；研究资料定向核查：2026-09-22。身份、实际读取、结论支持、运行验证分开记录。本轮未运行教学教材，也未完成后续卡片生产。

## 1. 起步资源：查过什么、还要核什么

| 资源 | 本轮已核范围与用途 | 实施制作要求 |
|---|---|---|
| [Beyond Frameworks](https://aclanthology.org/2025.acl-long.1037/) / [PDF](https://aclanthology.org/2025.acl-long.1037.pdf) | 官方 ACL 2025 身份（long.1037，21361–21375）；摘要、引言、§3 及 §3.5、Limitations 文字。用来区分协作维度，不是跨商业 harness 证据 | 依 02 写 quick 地图卡，记录所用正文；未检查图像，不凭图号填 Preserve |
| [MemGPT v2](https://arxiv.org/html/2310.08560v2) | 方法概述中主/外部上下文与控制流；支持“存储不等于当前输入”的学习目标 | 核摘要/引言/§2，记录版本与范围；不是长期多 Agent 协作效果结论 |
| [Handoff Tax v1](https://arxiv.org/html/2608.24358v1) | 实验框架、轨迹处理及方向相关权衡，沿用并复核此前正文定位 | 核实际采用结果及边界，默认 quick；具体指标/数字回原文，不照抄聊天结论 |
| [Handoff Debt v2](https://arxiv.org/html/2606.02875v2) | §4.3 运行环境、§5.1 表2、§5.3、§5.5 与局限；区分操作、累计输入消耗、初始长度 | 比较句逐项有定位，不能写成等输入预算的格式排名 |
| mat-cross-harness-map | 依据以上研究与下方按需资料做编辑综合，分类/组合例子为教学表达 | 实际交付 600–900 字，不伪称某论文提出了完整分类或已验证本研究场景 |
| mat-read-empirical；TOSEM/Agentless/SWE-bench | 沿用原卡覆盖与 008.1 教学目标，本轮未重新读这些论文全文 | 旧覆盖日期不刷新；新增学习建议受原依据约束，TOSEM Explain 可用现卡 design 段 |

Tax/Debt 本轮仍按预印本写，不猜录用；Beyond Frameworks 为 ACL 会议论文，不称期刊。coverage.checkedAt 是实际制作核查日期，不因复制本表而自动填今天。

### 三个按需入口

- [Multi-Agent Collaboration Mechanisms: A Survey of LLMs](https://arxiv.org/abs/2501.06322)：本轮核官方身份与摘要，看到 actors/types/structures/strategies/protocols 等分类视角；未逐篇验证综述引用，不承诺覆盖所有机制。
- [CoALA](https://arxiv.org/abs/2309.02427)：本轮核身份与摘要，v3 标为 TMLR camera-ready；给记忆、动作、决策词汇，不是跨 harness 实验。
- [Anthropic Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)：本轮读取上下文定义与管理相关段落；工程博客与实验论文证据等级不同，不据此宣布摘要/记忆最优。

## 2. 最易写错的边界

### Beyond Frameworks

四个协作维度适合入口，不代表一份通用跨 harness 协议。§3.5 的 FullLogLastRound 指上一轮完整对话，不是全部任务轨迹；不能与 Tax/Debt 的 Raw 仅凭名字直接合并。论文自己的任务/环境局限必须保留。来源：[正文](https://aclanthology.org/2025.acl-long.1037.pdf)。

### Handoff Tax

§3 与附录 A 的主 coding 对照使用同一 mini-swe-agent 脚手架、工具和提示环境，保留换手仓库；Raw、Compact_pre、Compact_suf、Traj-drop 是不同条件。方向相关的取舍不能变成普遍规则。§5 有其他任务扩展，但不等于验证独立商业工具互通。来源：[正文](https://arxiv.org/html/2608.24358v1)。

### Handoff Debt

表2 的 agent events 与累计 prompt tokens 不可互换；例如 Qwen 后任两类 notes 累计输入消耗比 raw 少，不能由较少操作推断全面省 token。§5.3 比初始字符长度，raw 更长，不是等输入额度比较。不能据此认定结构化自动更好，也不能反向认定 raw 在所有模型、成本和任务上最优。来源：[§5 正文与表2](https://arxiv.org/html/2606.02875v2)。

### 场景与预算

上述材料提供不同切面的概念和实验例子，没有一篇替本项目证明所有真实工具可在严格相同输入/输出预算下公平比较。00 §3 的记账注意事项是本版研究引导，不是某篇论文的原结论，也不是已冻结的实验协议。未来如何控制模型、harness、权限、任务、阶段与信息可见性仍需单独设计。

AgentPrune 的通信图裁剪可以保留作后续参考，但不是已验证的独立商业 harness 互通方案；不要未经代码核查断言它的所有实现必定只能单进程。

## 3. 技术主资源：已定向核网页，未运行示例

以下为 008.1 在 2026-09-21 记录的官方网页核查，本版继承，不冒充 09-22 重查。实施者按04读指定范围、记录版本与访问前提，不需重新海选教程。本次未安装依赖、未运行这些教程，不将“可访问”写成“运行已验证”。

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

## 4. 为什么缩成这一条短线

这是针对新生与本次研究目标的编辑选择，不宣称文献价值的普遍排序。

1. 用一篇站内导读先澄清“场景—机制—策略”，不让 Event Sourcing 先把方向引向状态数据库设计。
2. 用 Beyond Frameworks 替换默认 CoALA 卡，更早接触协作维度；CoALA 仍可按概念缺口查阅。
3. 保留 MemGPT，让长期记忆确实进入主线，不把所有内容收缩为一次性交接。它只是一种机制例子，不为学习记忆再列十篇必读。
4. 保留 Tax→Debt 的顺序，分别建立异构模型条件意识与交接比较意识；它们不再垄断主方向定义。
5. Anthropic 博客降为按需入口；只留三个按疑问查阅链接，不将聊天中新出现的每个名字都加成卡。
6. 旧十项目录、Event Sourcing、Generative Agents 等仍保留在历史/原索引。ReasoningBank、MemoryArena、A-MEM、LLMLingua 等是可能的后续资料，不是本期必交卡，也不在未核正文时写效果结论。
7. 不做框架源码周，不要求研究样本量或完整 literature matrix；三条技术栈不因研究范围变宽而扩课。
8. 不承诺方法创新或投稿结果；先用少量阅读理解可比较的问题，再独立讨论研究切片。

## 5. 实施期来源失败

优先同作品官方 HTML/PDF/作者版本，不按可访问性随意换选目。主线缺证据则保留 pending 和原因，不让摘要占位冒充交付；archive 只核身份，待核不阻塞 5+4，但应诚实标明。技术资源按 04 指定范围复核与运行，URL 迁移可找同一官方文档位置并记迁移。不要要求用户审论文来替代实施者工作。
