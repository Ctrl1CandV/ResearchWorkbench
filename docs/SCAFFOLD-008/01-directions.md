# 01 初期两条方向（入库正文）

版本：008.2。仅主方向研究定位与起步选目改变；方向 id、两条 active、两条 deferred 与兼容原则保留。

实施时写入 `public/content/directions.js`。每条方向增加：

```js
status: 'active' | 'deferred'  // 列表与首页只渲染 active
startRoute: [ /* 步骤，见 02 */ ]
archiveRoute: [ /* 现有长路线或后段节点；默认折叠 */ ]
```

现有 `route` 字段：代码验证的 9 步整表移入 `archiveRoute`，`startRoute` 用 02 的短表。新对象不长期保存另一个可写 `route`；兼容读取由 03 的解析函数处理。延后两方向 `startRoute: []`，原 8/11 步完整移入 `archiveRoute`。主方向 archive 采用 03 的外链目录分支。渲染以 `startRoute` 为「从这里开始」；主方向 `archiveRoute` 为「按需查阅（不必接着读）」，其余方向为「完整谱系（初期不必走）」。

`STAGE_ORDER` 扩展为：`建立概念` → `建立问题` → `理解方法` → `看评价与反例` → `核查近期竞争`。旧步骤的 stage 值仍合法。

---

## A. 主方向（新建，active）

```text
id: cross-harness-collab
order: 1
status: active
title: 跨工具的智能体协作：预算约束下的机制比较
```

**summary**  
不同模型在彼此隔离的工具中合作，不能直接继承完整会话。在输入/输出 token 预算受限时，什么协作机制与信息表示组合，能以合适成本持续完成任务？这里比较条件与效果，不预设共享状态或交接包最好。

**overview**（入库正文）

Cross-Harness Agent Collaboration：在不同 Agent 无法共享同一 harness、完整上下文和持续会话的条件下，在固定输入/输出 token 预算约束下，研究不同协作机制及其具体信息表示策略，对异构模型持续完成复杂任务的效果、成本和适用条件。

跨工具是研究场景，不是一种算法。可以直接传消息或摘要，也可以借助共享工作区、长期记忆、检索和仓库工件，或把它们组合起来。共享状态是候选，不是研究题目本身；通信、记忆与交接也不是必须互斥的选项。

要问的不是哪一种格式普遍最好，而是哪类项目和问题、哪对模型、哪种预算与合作阶段适合哪种做法。换手便于观察信息传递，但持续分工、反馈往返和长期合作也在视野中。先读少量材料辨清问题，再逐渐选择一个小切片；不要求先学完全部机制。

**stateOfField**（asOf: 2026-09-22）

多智能体协作可以拆开观察组织方式、交互及历史管理，而不只比较框架名；记忆研究则帮助区分长期存储与当前输入。两篇换手研究提供了具体观察窗口，但它们的运行环境和预算条件不等于所有真实跨工具设置。现阶段这些是建立问题的依据，不足以证明某种表示全面占优，也没有证明本方向已经具有足够发表新颖性。证据边界见 07。

**asOf**  
2026-09-22（本轮定向来源核查，不宣称穷尽最新研究）

**whyChoose**  
来源于实际跨工具协作困惑，能先从读懂对照与失败模式开始，不必先训练大模型或建设平台。这是适合起步探索的理由，不是“容易发论文”的保证。

**limits**  
容易退化成换一种摘要格式的展示。真正比较还要控制可见信息、工具权限、模型能力和输入/输出预算；写摘要、取记忆、读工件也有成本。封闭工具未必暴露完整轨迹和用量，不能许诺严格可比。强弱是任务相关能力，不由价格直接决定。

**openQuestions**

- 在同一明确的预算口径下，摘要、轨迹、状态、wiki、检索与工件引用的单独或组合使用，怎样影响任务成功、返工和成本？
- 发送方/接收方能力差异、项目与问题类型、交接时机，是否会改变合适策略？
- 一次换手与多轮持续合作是否需要不同的信息保留方式？记忆何时有用、何时过期或传播错误？
- 组合的收益来自机制互补，还是只是用了更多信息、调用或工具权限？

**sources**（依据，不是新增阅读清单）

- [Beyond Frameworks，ACL 2025](https://aclanthology.org/2025.acl-long.1037/)：协作维度拆解。
- [MemGPT](https://arxiv.org/abs/2310.08560)：记忆与当前输入的机制例子。
- [Handoff Tax](https://arxiv.org/abs/2608.24358)：异构模型换手观察。
- [Handoff Debt](https://arxiv.org/abs/2606.02875)：交接视图与重新发现成本。

**startRoute / archiveRoute**  
见 [02-curriculum.md](02-curriculum.md) §1。方向页不展开完整研究因素表或实验计划；预算边界由一段说明和首篇导读承载。

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

`LIBRARY.home.startHere = { kind: 'article', materialId: 'mat-cross-harness-map', routeId: 'cross-harness-collab', track: 'start' }`。删除真实数据中的旧 `startHerePaperId`；只在读取旧输入时将其适配为 paper 类型，两个字段同时存在即校验失败。共用 03 的目标解析器，不能把材料 ID 送给 `getPaper`。链接到带路线上下文的材料页，文案用“建议从这里开始”。

`firstUse` 改为三条：

1. 先看两条方向各在解决什么，选一条起步（默认主方向）。  
2. 按该方向「从这里开始」的顺序走，先建立概念再碰论文。  
3. 读论文卡住时，只补当前方向用得上的技术单元，不把十一条主干当课表。
