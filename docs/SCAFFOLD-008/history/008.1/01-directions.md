# 01 初期两条方向（入库正文）

版本：008.1。两条方向范围不变；补齐状态、首页与旧谱系兼容口径。

实施时写入 `public/content/directions.js`。每条方向增加：

```js
status: 'active' | 'deferred'  // 列表与首页只渲染 active
startRoute: [ /* 步骤，见 02 */ ]
archiveRoute: [ /* 现有长路线或后段节点；默认折叠 */ ]
```

现有 `route` 字段：代码验证的 9 步整表移入 `archiveRoute`，`startRoute` 用 02 的短表。新对象不长期保存另一个可写 `route`；兼容读取由 03 的解析函数处理。延后两方向 `startRoute: []`，原 8/11 步完整移入 `archiveRoute`。主方向 archive 采用 03 的外链目录分支。渲染以 `startRoute` 为「从这里开始」，`archiveRoute` 为「完整谱系（初期不必走）」。

`STAGE_ORDER` 扩展为：`建立概念` → `建立问题` → `理解方法` → `看评价与反例` → `核查近期竞争`。旧步骤的 stage 值仍合法。

---

## A. 主方向（新建，active）

```text
id: cross-harness-collab
order: 1
status: active
title: 跨工具的多智能体协作与通信
```

**summary**  
当想用的模型分别受限于不同工具时，强且贵的模型和弱且便宜的模型要一起干活，就会遇到跨工具、跨模型的信息传递问题。这个方向研究这种约束下的协作与通信，而不是说所有模型协作都必须跨工具。

**overview**  
（入库用）

同一件事常常要换工具才能换模型：有的模型只在自己的 harness 里。这时两个 Agent 不能共享完整对话窗口，只能通过进程外的东西合作——共享文件或状态、交接包、仓库本身、检索记忆、或一篇文档。这个方向要搞清楚：协作时到底在传什么、什么时候该传、怎样判断下一任有没有真的接上，而不是只又写了一堆总结。

第一段借“换手”观察通信如何影响后续工作；整个方向还包括持续分工、反馈往返、共享工件和协调。记忆、状态与交接格式都是理解这个问题的工具，初期不选定哪一种作为答案。

**stateOfField**  
（入库用；asOf: 2026-09-21）

已有多智能体工作采用对话链、SOP 与中间工件，Agent 记忆和上下文管理提供了另一组机制。Handoff Tax 在其 coding-agent 设置中比较强弱模型换手，交接界面的优劣随方向变化；Handoff Debt 比较仓库、原始轨迹与两种笔记，说明接手的效率和解出率应分别观察。这些结果为起步提供了可对照的问题，但不直接证明不同公司工具之间的协作效果，也不是固定输入长度下所有通道的完整排名。我们接下来关注能力不对称、信息可见性和预算怎样共同影响协作；这是一条待查新与验证的探索路径，不宣称已经发现研究空白。

**asOf**  
`2026-09-21`

**whyChoose**  
问题就发生在每天换 Cursor、Codex 等工具的时候，起步不必先训模型、也不必先搭集群。公开的换手实验已经把「传什么」做成可对照的设置，适合从读懂对照、再想一个最小可复现观察开始。这是初期探索的主方向。

**limits**  
容易做成提示词工程或再造一种笔记格式。结构化字段可能遗漏线索，摘要错误在原始证据未保留时难以追溯。AgentPrune 研究既定多智能体管线中的消息图裁剪，未直接验证跨独立 harness 的互操作。换手论文的结果不能自动外推到所有任务、模型或工具，本方向不保证发表。

**openQuestions**

- 弱模型交给强模型、强模型交给弱模型，是否需要不同的通信内容？已有论文在特定设置下观察到方向相关的界面偏好，跨工具时是否仍然如此？  
- 原始轨迹、自由文档、结构化状态、wiki、检索记忆，在固定长度下各保住了什么、丢掉了什么？  
- 怎样测「下一任接上了」：能复述前史，还是少走弯路、少继承错误约束？  
- 长期项目里，哪些事件值得写成可复用记忆，哪些只该留在日志里？

**sources**（方向页「支撑判断的公开来源」）

- Handoff Tax，arXiv:2608.24358，https://arxiv.org/abs/2608.24358 — 强弱模型换手，界面随方向反转  
- Handoff Debt，arXiv:2606.02875，https://arxiv.org/abs/2606.02875 — 中断接管，四种交接视图  
- CoALA，arXiv:2309.02427，https://arxiv.org/abs/2309.02427 — Agent = 记忆 + 决策 + 动作，不是「模型加提示词」  
- Anthropic：Effective Context Engineering for AI Agents，https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents — 记忆 ≠ 本轮上下文  

**startRoute / archiveRoute**  
见 [02-curriculum.md](02-curriculum.md) §1。

---

## B. 第二条（已有方向，收成短起步，active）

```text
id: code-agent-verification
order: 2
status: active
```

标题、overview、stateOfField、whyChoose、limits、openQuestions、sources **沿用现有** `directions.js` 里该对象，不要重写领域判断。只改：

- `order`: 2  
- `status`: `'active'`  
- `startRoute`: 02 §2 的四步  
- `archiveRoute`: 现有 9 步整表（含 Le、SWE-bench、Ye、Agentless、APPT、SWE-agent、AutoCodeRover、ComPass）  
- 方向页在 limits 之后加一段「初期怎么用这条」（纯文本，不是新板块）：

> 初期不必走完下面的完整谱系。先用一篇方法说明学会「实证研究怎么读」，再读 TOSEM 把「测试通过 ≠ 修好」立住，再看 Agentless：复杂 Agent 循环的好处必须自己证明。SWE-bench 只扫评价定义，因为它是主方向换手论文常用的台子。其余篇是谱系背景，等你真的要把验证预算写成研究问题时再打开。

主方向与这条的关系（写在代码验证方向页 overview 末或独立一句）：主方向问 Agent 如何跨工具合作；本条问合作的产出（补丁）怎样算对。两条一起养「能协作」和「能检验」，不是两个无关兴趣。

---

## C. 延后方向（deferred，不删）

```text
id: trusted-rag
order: 3
status: deferred
```

```text
id: graph-harmful-fusion
order: 4
status: deferred
```

正文不动。方向列表与首页不展示。若用户打开旧书签 `#/route/trusted-rag`，页顶一行：

> 这条方向初期不作为探索入口。检索记忆相关能力见技术路线「RAG / 检索记忆」；论文卡仍可查阅。

图融合同理，指向技术路线「图（浅）」。

---

## D. 首页与 `startHere`

`LIBRARY.home.startHere = { kind: 'article', materialId: 'mat-context-eng', routeId: 'cross-harness-collab', track: 'start' }`。删除真实数据中的旧 `startHerePaperId`；只在读取旧输入时将其适配为 paper 类型，两个字段同时存在即校验失败。共用 03 的目标解析器，不能把材料 ID 送给 `getPaper`。链接到带路线上下文的材料页，文案用“建议从这里开始”。

`firstUse` 改为三条：

1. 先看两条方向各在解决什么，选一条起步（默认主方向）。  
2. 按该方向「从这里开始」的顺序走，先建立概念再碰论文。  
3. 读论文卡住时，只补当前方向用得上的技术单元，不把十一条主干当课表。
