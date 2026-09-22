# 跨 Harness Agent 协作、Shared State、Handoff、Agent Memory 与 Context Engineering 学习路线

> 历史资料索引说明（2026-09-22）：本文件不是平台起步课表或实施契约。当前研究比较固定输入/输出预算下、不同条件中的协作机制与表示组合，不预设 Shared State 或 Handoff 胜出。完整资料和周期建议仅供以后按需查阅；平台主线以 docs/SCAFFOLD-008/02-curriculum.md（008.2）的五步为准，续做先读该目录 README.md 与 09-change-and-resume.md。以下历史内容保留，不整份导入页面。

> 更新日期：2026-09-21  
> 目标：系统理解“多个受限于不同 harness 的模型，如何在尽量少的信息损失与 token 成本下共享项目认知、记忆与工作进度”，并为后续实现原型、复现实验和研究选题做准备。

---

## 0. 先明确：我们真正想研究的是什么？

最初的问题可以表述为：

> GPT、Claude、Fable、便宜模型分别只能运行在自己的 harness 里，不能共享完整上下文。除了让强模型写一堆文档给弱模型，还有没有信息损失更小、token 更省、长期可维护的协作方式？

一个自然设想是：

```text
Persistent Project Memory
        +
Current Project State
        +
Event / Trajectory History
        ↓
Context Selection / Context Compiler
        ↓
Task-specific Handoff Packet
        ↓
Receiver Agent in another Harness
```

但这里最重要的一点是：**不要预设 Shared State + Structured Handoff 一定优于传统文档。**

更值得研究的问题是：

> 在固定 token budget 下，什么样的上下文表示，能够让另一个异构 Agent 最有效地继续任务？

因此至少应把下面几种方式视为彼此竞争的 baseline：

1. **Raw Trajectory**：完整聊天、工具调用、执行轨迹。
2. **Free-form Summary / Markdown Handoff**：自然语言总结。
3. **Wiki / Project Documentation**：长期维护的高密度文档。
4. **Structured State**：任务、决策、假设、证据、约束等结构化表示。
5. **Retrieval-based Memory**：保留大量历史，只在需要时检索。
6. **Hierarchical Memory**：raw event → episode → summary → project-level knowledge。
7. **Adaptive Handoff**：根据 sender、receiver、任务和 token budget 动态选择传递内容。

真正值得研究的可能不是“世界状态”本身，而是：

> **How should an agent compress accumulated experience into a minimal sufficient context for another heterogeneous agent to continue the task?**

后面的学习路线都围绕这个问题展开。

---

# 1. 先建立一张概念地图

在开始读论文前，先把这个领域拆成六块：

```text
A. Agent 基础
   state / observation / action / planning

B. Agent Memory
   working / episodic / semantic / procedural memory
   memory formation / consolidation / retrieval / forgetting

C. Shared State 与长期项目状态
   current state / event history / snapshot / belief state

D. Multi-Agent Communication
   conversation / artifacts / shared workspace / protocols

E. Context Engineering
   selection / retrieval / compression / summarization / budgeting

F. Handoff Evaluation
   continuation quality / rediscovery cost / token cost / latency
```

建议以后读任何论文，都尝试回答：

- 它把“记忆”定义成什么？
- 保存的是 raw trajectory、文本总结、结构化项、代码、图，还是参数？
- 什么时候写入 memory？
- 谁决定写什么？
- 如何更新/删除旧 memory？
- 下一次任务如何检索？
- 检索出来的内容怎样进入 context？
- 它优化的是 accuracy、success rate、token、latency 还是长期学习？
- 它有没有比较 full context / summary / retrieval / structured memory？
- memory 是否真的改变了 Agent 的后续行动？

---

# 2. 推荐学习方式：不要“读完”，而是分三遍

## 第一遍：建立地图

每篇只花 10–20 分钟，看：

- Abstract
- Introduction
- Figure 1 / System Overview
- Method 的小标题
- Experiments 中的 baselines
- Conclusion / Limitations

目标只是回答：**这篇论文在整张地图的哪个位置？**

## 第二遍：读核心方法

重点记录：

```text
Problem
Representation
Write policy
Update policy
Retrieval policy
Context injection
Evaluation
Baselines
Failure modes
```

## 第三遍：只有真正和自己研究问题接近的论文才精读

例如：

- Handoff Debt
- The Handoff Tax
- ReasoningBank
- Agent Workflow Memory
- MemoryArena
- LongMemEval-V2
- AgentPrune

这些值得读实验设计、appendix 和源码。

---

# 3. 第一阶段：Agent、State 与“共享世界”的基础概念

这一阶段不要急着实现系统。目标是理解为什么会出现 state、memory、belief、event、shared workspace 这些概念。

## 3.1 CoALA：Agent 的总体认知架构

### Cognitive Architectures for Language Agents (CoALA)

- 论文：https://arxiv.org/abs/2309.02427
- 优先级：★★★★★
- 建议：第一批阅读

### 为什么读

CoALA 非常适合作为 Agent Memory 的理论入口。它试图把语言 Agent 放进更传统的认知架构视角中，讨论：

- working memory
- long-term memory
- procedural / semantic / episodic knowledge
- decision procedure
- action space

### 重点看

不要纠结每个分类是否“绝对正确”。重点是学习一种思维方式：

> Agent 不应该只被理解成“LLM + prompt”，而是一个包含记忆、决策、动作和环境反馈的系统。

---

## 3.2 Blackboard Architecture：Shared State 的老祖宗

### H. Penny Nii — The Blackboard Model of Problem Solving and the Evolution of Blackboard Architectures

- 论文：https://onlinelibrary.wiley.com/doi/10.1609/aimag.v7i2.537
- 年份：1986
- 优先级：★★★★★

核心思想：多个 knowledge sources 不必直接彼此通信，而是共同读取和更新一个共享“黑板”。

```text
Knowledge Source A ─┐
Knowledge Source B ─┼── Shared Blackboard
Knowledge Source C ─┘
```

这和跨 harness Agent 的 Shared State 思路非常接近。

### Barbara Hayes-Roth — A Blackboard Architecture for Control

- 论文：https://www.sciencedirect.com/science/article/pii/0004370285900633
- 年份：1985
- 优先级：★★★☆☆

重点理解：

> 不只是“共享什么”，还有“什么时候哪个模块应该行动”。

以后对应到 Agent，就是 scheduler / router / escalation policy。

---

## 3.3 Event Sourcing：State 和 History 为什么应该分开

### Martin Fowler — Event Sourcing

- 博客：https://martinfowler.com/eaaDev/EventSourcing.html
- 优先级：★★★★★
- 非论文，但强烈建议读

核心思想：

```text
Current State ≠ Event History
```

不要只保存：

```text
status = completed
```

还可以保存：

```text
TaskCreated
TaskClaimed
HypothesisAdded
DecisionAccepted
TestFailed
TaskCompleted
```

于是：

```text
State = reduce(events)
```

这会帮助你理解以后为什么可能需要：

- event log
- snapshot
- checkpoint
- semantic delta
- audit trail

而不是让多个模型直接修改一个巨大 JSON。

---

## 3.4 Contract Net 与 SharedPlans：多 Agent 协作的传统理论

### The Contract Net Protocol: High-Level Communication and Control in a Distributed Problem Solver

- PDF：https://cse-robotics.engr.tamu.edu/dshell/cs631/papers/smith80contract.pdf
- 年份：1980
- 优先级：★★★☆☆

了解多 Agent 如何通过协议进行：

- task announcement
- bidding
- assignment
- result return

### Collaborative Plans for Complex Group Action / SharedPlans

- 论文：https://www.sciencedirect.com/science/article/pii/0004370295001034
- 年份：1996
- 优先级：★★☆☆☆

不用精读数学。主要建立概念：多个 Agent 可以共享一个 collaborative plan，但每个 Agent 对整体任务可能只拥有部分知识。

---

# 4. 第二阶段：Agent Memory——到底应该记什么？

这一阶段是整个学习路线的核心之一。

---

## 4.1 两篇综述先建立地图

### A Survey on the Memory Mechanism of Large Language Model based Agents

- 论文：https://arxiv.org/abs/2404.13501
- 代码/论文列表：https://github.com/nuster1128/LLM_Agent_Memory_Survey
- 优先级：★★★★★

建议先快速扫一遍，不需要逐页精读。

### Memory in the Age of AI Agents

- 论文：https://arxiv.org/abs/2512.13564
- 优先级：★★★★★

这是更新、更大的综述。它特别值得看的地方是区分：

- Agent Memory
- RAG
- Context Engineering
- factual / experiential / working memory
- memory formation / evolution / retrieval

如果以后要做 related work，这篇可以当索引。

可配合查看相关论文列表：

- https://github.com/Shichun-Liu/Agent-Memory-Paper-List

---

## 4.2 Generative Agents：Memory Stream → Retrieval → Reflection

### Generative Agents: Interactive Simulacra of Human Behavior

- 论文：https://arxiv.org/abs/2304.03442
- 优先级：★★★★★

这是非常好的直觉入门。

重点看三件事：

1. Memory Stream
2. Retrieval：recency + importance + relevance
3. Reflection：把大量低层 experience 合成为高层认知

这和以后做项目记忆非常相关：

```text
raw events
    ↓
retrieve / aggregate
    ↓
higher-level reflection
```

---

## 4.3 Reflexion：失败后的语言反思就是一种 Episodic Memory

### Reflexion: Language Agents with Verbal Reinforcement Learning

- 论文：https://arxiv.org/abs/2303.11366
- 优先级：★★★★★

重点：

> 不更新模型参数，也可以通过“语言形式的经验”让 Agent 下一次表现更好。

你可以把它看成最简单的：

```text
trajectory
→ feedback
→ reflection
→ memory
→ next attempt
```

---

## 4.4 ExpeL：从多次经历提炼可复用经验

### ExpeL: LLM Agents Are Experiential Learners

- 论文：https://ojs.aaai.org/index.php/AAAI/article/view/29936
- AAAI 2024
- 优先级：★★★★★

与 Reflexion 的区别值得注意：

- Reflexion 更像单任务 retry 的经验。
- ExpeL 更强调跨任务积累 insight 和 experience。

这已经开始接近“项目长期记忆”。

---

## 4.5 MemGPT：把 Context Window 看成有限工作内存

### MemGPT: Towards LLMs as Operating Systems

- 论文：https://arxiv.org/abs/2310.08560
- 后续项目 Letta：https://github.com/letta-ai/letta
- 优先级：★★★★★

核心直觉：

```text
Context Window ≈ RAM
External Memory ≈ Disk / Virtual Memory
```

不一定要认同 OS 类比的所有细节，但它会让你真正理解：

> 解决长期 Agent 问题，不可能无限增加 prompt；需要 memory hierarchy 和 memory management。

---

## 4.6 Voyager：Memory 不一定是文字，也可以是“可执行能力”

### Voyager: An Open-Ended Embodied Agent with Large Language Models

- 论文：https://arxiv.org/abs/2305.16291
- 项目页：https://voyager.minedojo.org/
- 优先级：★★★★☆

它维护 skill library，把成功程序作为长期能力存下来。

值得思考：

> 对 coding agent 来说，memory 是否应该只是“解释”，还是可以直接是测试、脚本、工具、模板、代码和 executable workflow？

---

## 4.7 Agent Workflow Memory：从 trajectory 提炼 workflow

### Agent Workflow Memory

- 论文：https://arxiv.org/abs/2409.07429
- 优先级：★★★★★

强烈推荐。

它不是简单保存全部 trajectory，而是提炼重复出现的 workflow，之后选择性提供给 Agent。

这直接关联到：

> 如何从大量项目历史中提取可复用过程知识？

---

## 4.8 A-MEM：Memory 作为会不断演化的网络

### A-MEM: Agentic Memory for LLM Agents

- 论文：https://arxiv.org/abs/2502.12110
- Repo 1：https://github.com/WujiangXu/AgenticMemory
- Repo 2：https://github.com/agiresearch/A-mem
- 优先级：★★★★☆

重点：

- memory item 不只是一个文本 chunk
- 带 metadata / tags / links
- 新 memory 可以改变旧 memory 的结构与表示

适合思考：

> Project Memory 是否应该是 list，还是 graph？

---

## 4.9 Mem0：更工程化的 Memory Pipeline

### Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory

- 论文：https://arxiv.org/abs/2504.19413
- 开源项目：https://github.com/mem0ai/mem0
- 优先级：★★★★☆

重点不是追性能数字，而是看完整 pipeline：

```text
interaction
→ extraction
→ consolidation
→ storage
→ retrieval
→ context
```

特别适合用来对比“full context / RAG / structured memory”。

---

## 4.10 ReasoningBank：不要记“发生了什么”，要记“学到了什么”

### ReasoningBank: Scaling Agent Self-Evolving with Reasoning Memory

- 论文：https://arxiv.org/abs/2509.25140
- ICLR 2026
- 官方代码：https://github.com/google-research/reasoning-bank
- Google Research 博客：https://research.google/blog/reasoningbank-enabling-agents-to-learn-from-experience/
- 优先级：★★★★★

这是与你的方向极其相关的一篇。

核心问题：

```text
Raw Trajectory 太长且噪声大
        ↓
从 success + failure 中提炼
        ↓
Generalizable Reasoning Strategy
```

重点研究：

- memory schema
- trajectory judging
- memory extraction
- retrieval
- failure memory
- memory-aware test-time scaling

如果以后你做“handoff packet”，ReasoningBank 可以作为“高层经验表示”的重要参考。

---

# 5. 第三阶段：Context Engineering——保存了信息之后，应该给模型看什么？

这一阶段实际上可能比“Memory Storage”更接近最终研究问题。

---

## 5.1 Lost in the Middle：长上下文不是万能答案

### Lost in the Middle: How Language Models Use Long Contexts

- 论文：https://aclanthology.org/2024.tacl-1.9/
- TACL 2024
- 优先级：★★★★★

必须理解：

> Context Window 能装下 ≠ 模型能有效利用。

因此：

```text
more context ≠ better context
```

这正是为什么 Context Selection 值得独立研究。

---

## 5.2 LLMLingua：Prompt Compression

### LLMLingua

- 论文：https://arxiv.org/abs/2310.05736
- Repo：https://github.com/microsoft/LLMLingua
- 优先级：★★★★☆

研究：如何在压缩 prompt 的同时尽量保留任务有效信息。

### LongLLMLingua

- 论文：https://arxiv.org/abs/2310.06839
- Repo 同上
- 优先级：★★★★☆

更关注 long context、信息位置和关键内容密度。

对你的意义：

> Handoff 本质上也可以被理解成一种 task-conditioned lossy compression。

---

## 5.3 RAPTOR：不同抽象层级的 Memory

### RAPTOR: Recursive Abstractive Processing for Tree-Organized Retrieval

- 论文：https://arxiv.org/abs/2401.18059
- 优先级：★★★★☆

它对长文档构造不同抽象层级：

```text
raw chunks
   ↓
cluster summaries
   ↓
higher summaries
   ↓
root-level abstraction
```

可以迁移到 Agent History：

```text
action/event
→ episode
→ task summary
→ project lesson
→ project-level knowledge
```

这可能比单一 flat memory 更合理。

---

## 5.4 Anthropic：Effective Context Engineering for AI Agents

- 博客：https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- 优先级：★★★★★

这是非常好的工程入门文。

核心视角：

> Prompt engineering 问“怎么写提示词”；Context engineering 问“这一轮到底应该把哪些 token 给模型”。

特别关注：

- system instructions
- tools
- MCP/tool definitions
- message history
- external data
- scratchpads
- compaction
- context selection

---

## 5.5 LangChain：Context Engineering for Agents

- 博客：https://www.langchain.com/blog/context-engineering-for-agents
- 优先级：★★★★☆

适合补充工程视角：

- write context
- select context
- compress context
- isolate context

---

# 6. 第四阶段：Multi-Agent Communication——Agent 到底应该怎样互相传信息？

先看早期“纯聊天式 multi-agent”，再看结构化通信。

---

## 6.1 CAMEL

### CAMEL: Communicative Agents for "Mind" Exploration of Large Scale Language Model Society

- arXiv：https://arxiv.org/abs/2303.17760
- 优先级：★★★☆☆

意义：理解早期 LLM Multi-Agent 为什么大量采用 role-playing + conversation。

---

## 6.2 AutoGen

### AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation

- 论文：https://arxiv.org/abs/2308.08155
- Repo：https://github.com/microsoft/autogen
- 优先级：★★★☆☆

重点不是学 API，而是理解：

> Conversation 被当成 multi-agent coordination substrate。

之后你才能更好地质疑：为什么一定要把所有协作表示成聊天？

---

## 6.3 ChatDev

### ChatDev: Communicative Agents for Software Development

- 论文：https://arxiv.org/abs/2307.07924
- Repo：https://github.com/OpenBMB/ChatDev
- 优先级：★★★☆☆

适合观察软件工程 Agent 如何采用角色链式沟通。

---

## 6.4 MetaGPT：从聊天转向 SOP 和 Artifact

### MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework

- 论文：https://arxiv.org/abs/2308.00352
- Repo：https://github.com/geekan/MetaGPT
- 优先级：★★★★☆

非常值得和 ChatDev 对比。

MetaGPT 尝试通过 SOP 和中间 artifact 降低纯对话链的不稳定性。

这是从：

```text
agents talk to each other
```

走向：

```text
agents manipulate shared work products
```

的重要一步。

---

## 6.5 AgentVerse

### AgentVerse: Facilitating Multi-Agent Collaboration and Exploring Emergent Behaviors

- 论文：https://arxiv.org/abs/2308.10848
- Repo：https://github.com/OpenBMB/AgentVerse
- 优先级：★★★☆☆

主要用于补充多 Agent 组织与动态协作视角。

---

## 6.6 TalkHier：Structured Communication

### Talk Structurally, Act Hierarchically

- 论文：https://arxiv.org/abs/2502.11098
- Repo：https://github.com/sony/talkhier
- 优先级：★★★★☆

直接研究 structured communication protocol。

重点观察：

> communication schema 是否真的比自由聊天稳定？

---

## 6.7 AgentPrune：通信不是越多越好

### Cut the Crap: An Economical Communication Pipeline for LLM-based Multi-Agent Systems / AgentPrune

- ICLR 2025：https://proceedings.iclr.cc/paper_files/paper/2025/hash/bbc461518c59a2a8d64e70e2c38c4a0e-Abstract-Conference.html
- Repo：https://github.com/yanweiyue/AgentPrune
- 优先级：★★★★★

这是你的方向非常值得读的一篇。

它正式研究：

> Communication Redundancy

也就是说，multi-agent communication 中大量 token 可能是冗余的，合理 prune 后仍然可以保持甚至改善效果。

这给你的 Context Compiler / Handoff Selector 提供了直接研究依据。

---

## 6.8 Anthropic：How we built our multi-agent research system

- 博客：https://www.anthropic.com/engineering/multi-agent-research-system
- 优先级：★★★★☆

适合看真正工业系统中的：

- delegation
- parallel subagents
- context isolation
- result aggregation
- evaluation
- coordination overhead

---

# 7. 第五阶段：Handoff——这是目前与你问题最直接的文献

---

## 7.1 Handoff Debt：必须精读

### Handoff Debt: The Rediscovery Cost When Coding Agents Take Over Interrupted Tasks

- 论文：https://arxiv.org/abs/2606.02875
- 年份：2026
- 优先级：★★★★★（核心）

它直接比较：

```text
Repository only
Raw trace
Summary notes
Structured notes
```

这几乎就是你质疑“结构化 state 真比 Markdown 好吗？”的实验版本。

### 阅读时重点记录

- handoff point 怎样构造？
- structured notes 包含哪些字段？
- summary 是谁生成的？
- successor model 是否相同？
- solved rate 和 efficiency 的关系？
- token 成本怎么算？
- 哪些信息帮助减少 rediscovery？

### 你以后可以复现/扩展的问题

- heterogeneous sender / receiver
- memory across multiple handoffs
- long-term project state，而非单次 interruption
- fixed token budget 下的公平比较
- learned / adaptive handoff selector

---

## 7.2 The Handoff Tax：必须精读

### The Handoff Tax: Continuing Non-Native Trajectories in LLM Agents

- 论文：https://arxiv.org/abs/2608.24358
- 年份：2026
- 优先级：★★★★★（核心）

它研究：

```text
cheap / weaker model → stronger model
stronger model → cheaper / weaker model
```

并比较：

- full trajectory
- compaction
- trajectory removal（只保留 repository state）

最重要的启示不是某个具体数字，而是：

> 最优 handoff interface 依赖 handoff direction。

也就是说：

```text
Best Context = f(sender, receiver, task, stage, budget)
```

这直接支持“Adaptive Context Compiler”的研究方向。

---

## 7.3 OpenAI Agents SDK Handoff

- Python 文档：https://openai.github.io/openai-agents-python/handoffs/
- 优先级：★★★☆☆

用途：看现代 Agent runtime 怎样把 handoff 建模成正式机制。

重点不是 API，而是：

- handoff 输入是什么？
- conversation history 是否继承？
- 如何 filter 输入？
- target agent 如何获得上下文？

`input_filter` 可以被理解成一个非常原始的 Context Compiler。

---

## 7.4 agent-handoff：跨 CLI harness 的直接工程参考

### nick-vi/agent-handoff

- Repo：https://github.com/nick-vi/agent-handoff
- 优先级：★★★★★（源码阅读）

它直接支持在 Cursor、Codex、Claude 等 CLI Agent 之间 handoff。

重点看：

- `SKILL.md`
- session registry
- trace persistence
- workspace / topic
- handoff prompt 的构造
- 不同 agent adapter
- runtime state 放在哪里

它非常适合回答：

> “协议核心”和“harness adapter”应该怎样拆分？

---

# 8. 第六阶段：Agent Memory 的评测——“记住了”不等于“会用”

如果以后想做论文，这一部分必须认真读。

---

## 8.1 LoCoMo

### Evaluating Very Long-Term Conversational Memory of LLM Agents

- 项目页：https://snap-research.github.io/locomo/
- Repo：https://github.com/snap-research/locomo
- 优先级：★★★★☆

重点看：非常长时间跨度的 conversational memory 怎样构造 benchmark。

局限也要记住：它很大程度还是“记忆 → 回答”的评测。

---

## 8.2 LongMemEval

### LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory

- 论文：https://arxiv.org/abs/2410.10813
- 优先级：★★★★★

五类能力非常值得记：

- information extraction
- multi-session reasoning
- temporal reasoning
- knowledge update
- abstention

同时它把 memory 系统拆解成 indexing / retrieval / reading 等阶段，非常适合学习实验设计。

---

## 8.3 MemBench

### MemBench: Towards More Comprehensive Evaluation on the Memory of LLM-based Agents

- ACL Findings 2025：https://aclanthology.org/2025.findings-acl.989/
- Repo：https://github.com/import-myself/Membench
- 优先级：★★★★☆

重点：不仅看 effectiveness，还开始看：

- efficiency
- capacity
- factual memory
- reflective memory

---

## 8.4 MemoryArena：强烈推荐

### MemoryArena: Benchmarking Agent Memory in Interdependent Multi-Session Agentic Tasks

- 论文：https://arxiv.org/abs/2602.16313
- 优先级：★★★★★

这是你特别应该关注的 benchmark。

它批评很多 memory benchmark 只是测：

> “还能不能回答过去发生了什么？”

MemoryArena 更关注：

> **过去记下来的东西，是否真的改变了未来的 Agent 行动？**

这与你的 handoff 目标完全一致：

一个 handoff packet 的价值，不是 receiver 能复述 predecessor 做过什么，而是：

- 是否减少重复探索？
- 是否减少错误？
- 是否正确延续关键约束？
- 是否更快完成任务？

---

## 8.5 LongMemEval-V2

### LongMemEval-V2: Evaluating Long-Term Agent Memory Toward Experienced Colleagues

- arXiv：https://arxiv.org/abs/2605.12493
- Repo：https://github.com/xiaowu0162/LongMemEval-V2
- 优先级：★★★★★

这个题目本身就很值得注意：

> experienced colleagues

也就是 Agent 不只是“记住事实”，而是逐渐形成：

- workflow knowledge
- environment-specific experience
- gotchas
- operating knowledge

这与“项目记忆”非常接近。

---

## 8.6 LoCoMo-Plus

### Locomo-Plus: Beyond-Factual Cognitive Memory Evaluation Framework for LLM Agents

- ACL 2026：https://aclanthology.org/2026.acl-long.1150/
- Repo：https://github.com/xjtuleeyf/Locomo-Plus
- 优先级：★★★★☆

它开始研究隐式 constraints，而不只是显式事实 recall。

对于软件项目同样非常重要。例如：

> “不要再用这个 API，因为上一次发现它在 Windows 上不稳定。”

未来任务未必会直接询问这句话，但 Agent 应该在行动中遵守这个约束。

---

# 9. 第七阶段：工程博客与教程——帮助建立“怎么做”的直觉

论文回答“为什么”，工程资料更擅长回答“现实中大家怎么做”。

---

## 9.1 OpenAI — Harness Engineering

- https://openai.com/index/harness-engineering/
- 优先级：★★★★★

非常适合你的 coding-agent 场景。

重点：

- repository knowledge as system of record
- `AGENTS.md` 不应该成为百科全书，而更像目录
- structured docs
- agent legibility
- architecture / taste 如何被固化
- 长期 autonomous agent 会产生什么 entropy

这可以看作“文档派 / repo knowledge 派”的高质量实践案例。

---

## 9.2 LangChain — Memory for Agents

- https://www.langchain.com/blog/memory-for-agents
- 优先级：★★★★☆

用来快速理解：

- semantic memory
- episodic memory
- procedural memory

---

## 9.3 LangMem Conceptual Guide

- https://langchain-ai.github.io/langmem/concepts/conceptual_guide/
- Repo：https://github.com/langchain-ai/langmem
- 优先级：★★★★★

非常适合从论文进入代码。

重点思考：

```text
What should be remembered?
When is memory formed?
Where is it stored?
How is it recalled?
```

---

## 9.4 How To Give Your Agent Memory

- https://www.langchain.com/blog/how-to-give-your-agent-memory
- 优先级：★★★★★

一个很关键的观点：

> trace / transcript / log 本身不是 memory；只有被提炼成未来能改变行为的 durable context，才真正成为 memory。

这句话非常适合用来指导你的系统设计。

---

## 9.5 Wiki Memory

- https://www.langchain.com/blog/wiki-memory
- 优先级：★★★★★

这正是 Structured State 的一个强竞争 baseline。

核心思想：

```text
raw logs / docs / experiments / conversations
                 ↓
         agent-maintained wiki
                 ↓
      compact durable knowledge
```

以后做实验时非常值得比较：

```text
Markdown Wiki
vs Structured State
vs Raw Trace
vs Retrieval
```

---

## 9.6 OpenWiki

- Repo：https://github.com/langchain-ai/openwiki
- 优先级：★★★★★（源码）

它把 Wiki Memory 的思想真正工程化：

- 从代码和其他 source 生成 wiki
- linked Markdown
- source claims
- source drift
- incremental update
- coding-agent integrations

尤其值得看：

- run state
- claims
- integration protocol
- 如何保证文档和 source 不漂移

这可能是你验证“传统文档到底能做到多好”的最佳 baseline 之一。

---

## 9.7 Agent Builder Memory 的工程实现

- https://www.langchain.com/blog/how-we-built-agent-builders-memory-system
- 优先级：★★★☆☆

适合看生产系统怎么权衡 simplicity 与 memory capability。

---

## 9.8 Google Research — ReasoningBank Blog

- https://research.google/blog/reasoningbank-enabling-agents-to-learn-from-experience/
- 优先级：★★★★☆

建议在论文前或论文后读一遍，帮助形成更直观的 pipeline 理解。

---

# 10. 第八阶段：重点开源项目源码阅读路线

现在才开始读代码。

建议顺序不要反过来。

---

## 10.1 LangMem —— 最适合入门 Memory 实现

- Repo：https://github.com/langchain-ai/langmem

### 重点看

- memory extraction
- consolidation
- retrieval
- hot-path / background memory
- storage abstraction

### 为什么先看

代码范围比大型 Agent Framework 小，概念和论文关系清晰。

---

## 10.2 OpenWiki —— “文档 / wiki 作为项目记忆”的强实现

- Repo：https://github.com/langchain-ai/openwiki

重点看：

- generation state
- claims
- evidence linkage
- update lifecycle
- coding-agent integrations

研究问题：

> 如果 Wiki 已经做得足够好，Structured State 还能增加多少价值？

---

## 10.3 Beads —— Structured Project Memory / Task Graph

- Repo：https://github.com/gastownhall/beads
- Wiki：https://github.com/gastownhall/beads/wiki
- 优先级：★★★★★

Beads 明确把自己定位为 coding agent 的 persistent structured memory。

重点看：

- task dependency graph
- persistent memory
- `bd prime`
- `bd remember`
- compaction / memory decay
- audit trail
- agent-specific setup（Codex / Claude 等）

### 最值得研究的点

`bd prime` 的思想：

> 从大的持久状态中，生成当前 agent 可以直接使用的小上下文。

这已经非常接近 Context Compiler。

---

## 10.4 agent-handoff —— 跨 Harness Adapter

- Repo：https://github.com/nick-vi/agent-handoff

重点看：

- CLI abstraction
- per-agent adapter
- session / topic registry
- durable trace
- `SKILL.md`
- handoff brief

Beads 更像 persistent state；agent-handoff 更像 cross-harness transport / continuation。

把两个项目对照看非常有价值。

---

## 10.5 LangGraph —— Checkpoint 与 Long-term Store

- Repo：https://github.com/langchain-ai/langgraph
- Persistence 文档源码：https://github.com/langchain-ai/docs/blob/main/src/oss/langgraph/persistence.mdx
- 优先级：★★★★☆

重点理解：

```text
Checkpointer
= thread-local / short-term state

Store
= cross-thread / durable memory
```

不要一开始读整个 LangGraph，只读 persistence 相关部分。

---

## 10.6 OpenHands —— EventStream + State + Action + Observation

- Repo：https://github.com/All-Hands-AI/OpenHands
- 优先级：★★★★☆

大型项目，不建议从头读。

只围绕下面的概念导航：

```text
Agent
State
Action
Observation
Runtime
EventStream
```

重点理解：EventStream 如何成为组件之间通信 backbone。

---

## 10.7 A2A Protocol —— Agent 互操作协议

- Repo：https://github.com/a2aproject/A2A
- Specification：https://github.com/a2aproject/A2A/blob/main/docs/specification.md
- 优先级：★★★★☆

重点数据模型：

```text
Task
TaskStatus
Message
Part
Artifact
Context
```

特别注意它明确区分：

- Message = communication
- Artifact = deliverable
- Task = stateful unit of work

它适合作为“handoff protocol data model”的参考，但它并没有直接解决长期 cognitive state / memory selection。

---

## 10.8 AgentPrune —— 通信裁剪实验代码

- Repo：https://github.com/yanweiyue/AgentPrune

重点看：

- communication graph 怎么建模
- prune criterion
- token efficiency 怎么统计
- baseline 怎么比较

---

## 10.9 ReasoningBank —— 经验 → reasoning memory

- Repo：https://github.com/google-research/reasoning-bank

重点看：

```text
trajectory
→ judge
→ extract memory
→ store
→ retrieve
→ inject
```

这是最值得复现的 memory pipeline 之一。

---

# 11. 推荐的 12 周学习路线

时间可以压缩，也可以拉长。核心是顺序。

## Week 1：Agent 总体框架

读：

- CoALA
- Agent Memory Survey（只扫）

目标：理解 Agent = model + memory + decision + action + environment。

输出一页笔记：

```text
我认为 Agent state / memory / context 的区别是什么？
```

---

## Week 2：Shared State 的理论祖先

读：

- Blackboard Model
- Event Sourcing
- Contract Net（快速）

目标：理解：

```text
shared workspace
current state
history
snapshot
protocol
```

是不同概念。

---

## Week 3：经典 Agent Memory

读：

- Generative Agents
- Reflexion
- ExpeL
- MemGPT

目标：给每篇画同一张 pipeline 图。

例如：

```text
Experience
→ Memory Formation
→ Storage
→ Retrieval
→ Action
```

---

## Week 4：从“记录”走向“抽象经验”

读：

- Voyager
- Agent Workflow Memory
- A-MEM
- ReasoningBank

重点回答：

> 最有价值的 memory 单元到底应该是什么？

---

## Week 5：Context Selection / Compression

读：

- Lost in the Middle
- LLMLingua
- LongLLMLingua
- RAPTOR
- Anthropic Context Engineering

目标：形成观点：

```text
Memory ≠ Context
```

Memory 是可以被取用的长期信息；Context 是本轮真正交给模型的有限 token。

---

## Week 6：Multi-Agent Communication

读：

- AutoGen
- ChatDev
- MetaGPT
- AgentVerse（扫）
- TalkHier

目标：比较：

```text
free-form conversation
vs structured protocol
vs shared artifacts
```

---

## Week 7：Communication Efficiency

精读：

- AgentPrune
- Anthropic multi-agent system blog

思考：

> 为什么一些信息应该被删除，而不是被完整保存？

---

## Week 8：Handoff 核心周

精读：

- Handoff Debt
- The Handoff Tax

这一周不要读太多别的。

建议做一张完整对比表：

| 变量 | Handoff Debt | Handoff Tax |
|---|---|---|
| sender | | |
| receiver | | |
| task | | |
| handoff point | | |
| context representation | | |
| token budget | | |
| metric | | |
| strongest finding | | |
| limitation | | |

然后写：

> 如果让我做下一篇论文，我会改哪三个实验设置？

---

## Week 9：Memory Evaluation

读：

- LoCoMo
- LongMemEval
- MemBench
- MemoryArena
- LongMemEval-V2

重点从“方法”切换到“实验设计”。

---

## Week 10：第一轮源码

只读：

1. LangMem
2. OpenWiki
3. agent-handoff

不要试图彻底理解；重点找代码中与论文概念对应的位置。

---

## Week 11：第二轮源码

读：

1. Beads
2. ReasoningBank
3. LangGraph persistence
4. OpenHands EventStream（只读相关部分）

---

## Week 12：做一个最小实验，不要先做完整框架

不要写完整 Shared State 系统。

先选择 20–50 个可重复的软件任务，比较：

```text
A. repository only
B. raw trajectory
C. free-form handoff.md
D. structured handoff.json
E. wiki memory + task packet
```

统一限制，例如：

```text
handoff budget = 2k / 4k / 8k tokens
```

测：

- task success
- continuation steps
- rediscovery actions
- input tokens
- total cost
- latency
- incorrect inherited assumptions

先验证“Structured State 是否真的更好”，再决定要不要设计复杂框架。

---

# 12. 未来可能形成论文的问题

以下不是结论，而是值得验证的研究假设。

## 12.1 Minimal Sufficient Handoff

> 在固定 token budget 下，什么信息集合足以让 successor 接近拥有完整历史的表现？

可能比较：

```text
Raw Trace
Summary
Structured State
Retrieved Episodes
Wiki
Hybrid
```

---

## 12.2 Sender-Receiver Asymmetry

受 Handoff Tax 启发：

```text
weak → strong
```

和：

```text
strong → weak
```

可能需要完全不同的信息传递策略。

研究：

> Handoff representation 是否应根据 sender / receiver capability 自适应？

---

## 12.3 State vs Documentation

这是你最初的质疑，也是非常好的问题：

> Structured project state 是否真的优于维护良好的 Wiki / Markdown documentation？

强 baseline：

- OpenWiki
- OpenAI Harness Engineering 风格 docs
- free-form handoff
- Beads structured memory

这比拿一个很差的 `summary.md` 当 baseline 有意义得多。

---

## 12.4 Project Memory Formation

不是所有 event 都值得进入长期 memory。

研究：

> 哪些 trajectory 片段应该被提升为 durable project memory？

可以比较：

- LLM extraction
- rule-based
- failure-triggered
- surprise / novelty driven
- test/eval driven
- importance/relevance based

---

## 12.5 Memory Granularity

比较：

```text
raw event
episode
workflow
reasoning lesson
decision
constraint
wiki page
```

哪一种 memory unit 对 coding agent continuation 最有效？

---

## 12.6 Hierarchical Project Memory

借鉴 RAPTOR：

```text
raw events
   ↓
session episodes
   ↓
task summaries
   ↓
project decisions / lessons
   ↓
architecture / domain knowledge
```

研究不同层级怎样组合检索。

---

## 12.7 Memory Reliability / Staleness

长期项目里最大的问题之一：

> Memory 可能曾经正确，但代码已经变了。

可以研究：

- source-linked memory
- evidence provenance
- invalidation condition
- freshness score
- automated forgetting

OpenWiki 的 claims/source drift 机制尤其值得参考。

---

## 12.8 Handoff as a Context Compiler

最终可能形成：

```text
Persistent Memory
Current State
History
Receiver Profile
Task
Token Budget
        ↓
Context Compiler
        ↓
Minimal Task-specific Context
```

这个 compiler 可以从简单 heuristic 开始，再逐渐变成：

- retrieval
- ranking
- learned selector
- RL / bandit
- LLM judge
- receiver-aware policy

---

# 13. 建议你建立统一的论文阅读模板

每篇相关论文都用同一模板记录，后面做 related work 会非常省时间。

```markdown
# Paper

## 1. Problem
这篇论文到底解决什么问题？

## 2. Setting
单 Agent / 多 Agent？
长期任务 / 单任务？
同模型 / 异构模型？

## 3. What is memory/state?
它存什么？

## 4. Representation
raw text / summary / JSON / graph / code / parameter？

## 5. Write policy
什么时候写？谁决定写什么？

## 6. Update / forgetting
旧 memory 如何修改、合并、删除？

## 7. Retrieval / selection
下一任务怎样找到相关 memory？

## 8. Context injection
最后给 LLM 的是什么？多少 token？

## 9. Baselines
最重要的 baseline 是哪些？

## 10. Metrics
success / accuracy / token / cost / latency / steps？

## 11. Main finding
一句话。

## 12. Failure cases
它在哪里失败？

## 13. Relation to my problem
对跨 harness handoff 有什么启发？

## 14. Reproducible idea
我能否用很小成本复现一个关键实验？

## 15. Open question
它没有解决的最重要问题是什么？
```

---

# 14. 资料索引：论文

## Agent / Cognitive Architecture

- CoALA — https://arxiv.org/abs/2309.02427
- Generative Agents — https://arxiv.org/abs/2304.03442
- Reflexion — https://arxiv.org/abs/2303.11366
- ExpeL — https://ojs.aaai.org/index.php/AAAI/article/view/29936
- Voyager — https://arxiv.org/abs/2305.16291

## Agent Memory

- A Survey on the Memory Mechanism of LLM-based Agents — https://arxiv.org/abs/2404.13501
- Memory in the Age of AI Agents — https://arxiv.org/abs/2512.13564
- MemGPT — https://arxiv.org/abs/2310.08560
- Agent Workflow Memory — https://arxiv.org/abs/2409.07429
- A-MEM — https://arxiv.org/abs/2502.12110
- Mem0 — https://arxiv.org/abs/2504.19413
- ReasoningBank — https://arxiv.org/abs/2509.25140

## Context / Compression

- Lost in the Middle — https://aclanthology.org/2024.tacl-1.9/
- LLMLingua — https://arxiv.org/abs/2310.05736
- LongLLMLingua — https://arxiv.org/abs/2310.06839
- RAPTOR — https://arxiv.org/abs/2401.18059

## Multi-Agent Communication

- CAMEL — https://arxiv.org/abs/2303.17760
- AutoGen — https://arxiv.org/abs/2308.08155
- ChatDev — https://arxiv.org/abs/2307.07924
- MetaGPT — https://arxiv.org/abs/2308.00352
- AgentVerse — https://arxiv.org/abs/2308.10848
- TalkHier — https://arxiv.org/abs/2502.11098
- AgentPrune / Cut the Crap — https://proceedings.iclr.cc/paper_files/paper/2025/hash/bbc461518c59a2a8d64e70e2c38c4a0e-Abstract-Conference.html

## Handoff

- Handoff Debt — https://arxiv.org/abs/2606.02875
- The Handoff Tax — https://arxiv.org/abs/2608.24358

## Memory Evaluation

- LoCoMo — https://snap-research.github.io/locomo/
- LongMemEval — https://arxiv.org/abs/2410.10813
- MemBench — https://aclanthology.org/2025.findings-acl.989/
- MemoryArena — https://arxiv.org/abs/2602.16313
- LongMemEval-V2 — https://arxiv.org/abs/2605.12493
- LoCoMo-Plus — https://aclanthology.org/2026.acl-long.1150/

## Classical Multi-Agent / Shared State Foundations

- Blackboard Model — https://onlinelibrary.wiley.com/doi/10.1609/aimag.v7i2.537
- Blackboard Architecture for Control — https://www.sciencedirect.com/science/article/pii/0004370285900633
- Contract Net Protocol — https://cse-robotics.engr.tamu.edu/dshell/cs631/papers/smith80contract.pdf
- SharedPlans / Collaborative Plans — https://www.sciencedirect.com/science/article/pii/0004370295001034

---

# 15. 资料索引：博客 / 教程

- Anthropic — Effective Context Engineering for AI Agents  
  https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

- Anthropic — How we built our multi-agent research system  
  https://www.anthropic.com/engineering/multi-agent-research-system

- OpenAI — Harness Engineering  
  https://openai.com/index/harness-engineering/

- LangChain — Memory for Agents  
  https://www.langchain.com/blog/memory-for-agents

- LangChain — Context Engineering for Agents  
  https://www.langchain.com/blog/context-engineering-for-agents

- LangChain — How To Give Your Agent Memory  
  https://www.langchain.com/blog/how-to-give-your-agent-memory

- LangChain — Wiki Memory  
  https://www.langchain.com/blog/wiki-memory

- LangChain — How we built Agent Builder’s memory system  
  https://www.langchain.com/blog/how-we-built-agent-builders-memory-system

- LangMem — Conceptual Guide  
  https://langchain-ai.github.io/langmem/concepts/conceptual_guide/

- Google Research — ReasoningBank: Enabling agents to learn from experience  
  https://research.google/blog/reasoningbank-enabling-agents-to-learn-from-experience/

- Martin Fowler — Event Sourcing  
  https://martinfowler.com/eaaDev/EventSourcing.html

- OpenAI Agents SDK — Handoffs  
  https://openai.github.io/openai-agents-python/handoffs/

---

# 16. 资料索引：开源项目

## Memory / Project Knowledge

- LangMem  
  https://github.com/langchain-ai/langmem

- OpenWiki  
  https://github.com/langchain-ai/openwiki

- Beads  
  https://github.com/gastownhall/beads

- ReasoningBank  
  https://github.com/google-research/reasoning-bank

- A-MEM  
  https://github.com/WujiangXu/AgenticMemory  
  https://github.com/agiresearch/A-mem

- Mem0  
  https://github.com/mem0ai/mem0

- LoCoMo  
  https://github.com/snap-research/locomo

- LongMemEval-V2  
  https://github.com/xiaowu0162/LongMemEval-V2

- LoCoMo-Plus  
  https://github.com/xjtuleeyf/Locomo-Plus

- MemBench  
  https://github.com/import-myself/Membench

## Cross-Harness / Handoff

- agent-handoff  
  https://github.com/nick-vi/agent-handoff

- A2A Protocol  
  https://github.com/a2aproject/A2A

## Agent Runtime / State

- LangGraph  
  https://github.com/langchain-ai/langgraph

- OpenHands  
  https://github.com/All-Hands-AI/OpenHands

## Multi-Agent

- AutoGen  
  https://github.com/microsoft/autogen

- MetaGPT  
  https://github.com/geekan/MetaGPT

- AgentVerse  
  https://github.com/OpenBMB/AgentVerse

- ChatDev  
  https://github.com/OpenBMB/ChatDev

- TalkHier  
  https://github.com/sony/talkhier

- AgentPrune  
  https://github.com/yanweiyue/AgentPrune

## Context Compression

- LLMLingua  
  https://github.com/microsoft/LLMLingua

---

# 17. 第一轮只读清单：如果资料太多，从这里开始

如果现在不想面对几十篇文献，先只读下面 **12 个**：

1. **CoALA**  
   https://arxiv.org/abs/2309.02427

2. **Blackboard Model**  
   https://onlinelibrary.wiley.com/doi/10.1609/aimag.v7i2.537

3. **Event Sourcing**  
   https://martinfowler.com/eaaDev/EventSourcing.html

4. **Generative Agents**  
   https://arxiv.org/abs/2304.03442

5. **MemGPT**  
   https://arxiv.org/abs/2310.08560

6. **Agent Workflow Memory**  
   https://arxiv.org/abs/2409.07429

7. **ReasoningBank**  
   https://arxiv.org/abs/2509.25140

8. **Lost in the Middle**  
   https://aclanthology.org/2024.tacl-1.9/

9. **AgentPrune**  
   https://proceedings.iclr.cc/paper_files/paper/2025/hash/bbc461518c59a2a8d64e70e2c38c4a0e-Abstract-Conference.html

10. **Handoff Debt**  
    https://arxiv.org/abs/2606.02875

11. **The Handoff Tax**  
    https://arxiv.org/abs/2608.24358

12. **MemoryArena**  
    https://arxiv.org/abs/2602.16313

读完这 12 个以后，再根据兴趣进入：

```text
memory representation → A-MEM / Mem0
context compression → LLMLingua / RAPTOR
multi-agent → MetaGPT / TalkHier
project memory → OpenWiki / Beads
benchmark → LongMemEval / LongMemEval-V2
```

---

# 18. 现阶段最重要的几个认知

学习过程中可以不断回来检查这些判断是否仍然成立。

### 1. Memory 和 Context 不是一回事

```text
Memory = potentially useful durable information
Context = information actually shown to the model this turn
```

系统真正困难的部分常常不是 storage，而是 selection。

### 2. Raw Trace 信息最完整，但未必最好

它可能：

- 太贵
- 太长
- 含有错误路径
- 把 receiver 锚定在 predecessor 的错误思路上

### 3. Summary 很便宜，但不可逆地丢信息

自由 Markdown 的最大问题不是“不结构化”，而是：

> 总结者必须提前猜未来什么信息重要。

一旦猜错，信息就消失了。

### 4. Structured State 也不是免费午餐

Schema 本身是一种 inductive bias。

如果 schema 只有：

```text
task
status
decision
```

那么很多 tacit knowledge、failure context、审美判断可能根本无处可放。

### 5. Wiki Memory 是非常强的 baseline

不要把“传统文档”想象成手工写的 `README.md`。

OpenWiki 这类持续维护、带 source provenance 的 agent-readable wiki，可能已经能解决大量“长期项目认知”的问题。

### 6. 最优方案很可能是 Hybrid

未来更可能是：

```text
Structured current state
+
Wiki-like semantic project knowledge
+
Raw evidence / trajectory archive
+
Task-conditioned retrieval
+
Receiver-aware handoff compiler
```

而不是单一 JSON 或单一 Markdown。

---

# 19. 最后：你真正可以长期追踪的研究问题

以后阅读每一篇新论文，都可以问它是否帮助回答下面的问题：

> **给定一个已经积累了大量项目经验的 Agent 系统，如何把这些经验表示、维护和压缩，使另一个处于不同 harness、使用不同能力模型的 Agent，可以在有限 token 预算下，以最小 rediscovery cost 和最少错误继承，继续完成同一长期任务？**

这一个问题自然连接：

- Agent Memory
- Context Engineering
- Multi-Agent Communication
- Long-Horizon Agents
- Coding Agents
- Model Routing
- Continual Learning
- Information Compression
- Distributed Systems
- Software Engineering Knowledge Management

如果最终要把它做成研究，建议从一个非常具体、可验证的问题开始，而不是先设计完整框架：

> **Structured handoff、Wiki documentation、raw trajectory 和 retrieval memory，在 heterogeneous coding-agent continuation 中的质量 / token / rediscovery trade-off 是什么？**

先把这个问题做实，之后 Shared State、Project Memory、Context Compiler 才有必要逐渐长出来。
