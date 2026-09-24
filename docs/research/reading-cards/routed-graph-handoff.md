# 来源稿：routed-graph-handoff（近邻，quick）

> 状态：已入库（public/content/papers-collab.js，id `routed-graph-handoff`）。2026-09-24。
> 来源唯一准绳：docs/research/guidance-display-source-audit.md 最终版 §4.4 + §7 修订 2（条目 id：routed-graph-handoff）。

## 身份

- Routed Graph Handoff: Adaptive Format Selection for Multi-Agent LLM Delegation
- Pratyay Banerjee, Ankit Chadha（2 作者）；arXiv:2608.25277 v1（2026-08-26）；预印本。

## 审计修订口径（必读）

- 原文「自然语言通信占 token 预算 40–60%」无具体模型/任务条件：**不登记、不转引**（审计 §7 修订 2）。
- 「76% 失败涉智能体间不对齐」为**该文自称、未经独立复核**——站内引用必须带此标注。

## 实际读取范围

HTML 全文节级提取。已核：§2 机制（类型化依赖图 8 节点类型/7 边关系；约 155 token 轻量 LLM 路由按任务在图/NL 间选择，默认保守回退 NL；需配图感知执行器提示词；structure-flexibility 权衡）、实验（BrowseComp/BFCL/τ-retail/AppWorld，1052 条轨迹，Claude Sonnet 4.5 编排，配对 bootstrap CI）。

## 关键数字（引用须带设置条件）

- τ-retail +12.7pp 且 3.2× 压缩（p<0.01）；BrowseComp +8.7pp 2.2× 压缩（p<0.05）；AppWorld 持平（路由避开 14.6pp 回退）；oracle 分析余量 8.6pp。

## 自列局限

路由按任务类型聚类而非实例级自适应；schema 在 47 条 τ-bench 轨迹上设计，泛化未证；主结果单编排骨架（GPT-5 mini 仅测过）；执行器提示词必要但增加复杂度。

## 入库口径

- 深度：quick（partial-text）；importance: peripheral；角色：frontier——只作机制例子不作结论依据（解释价值排序第 4）。

## 站内挂接

- 方向页 paperLinks：↔ handoff-tax（静态四条件→按任务路由）；axisAnalysis「谁决定传/取什么」实例（自动路由）与「状态保存在哪里」未定侧（图式状态）。
- 技术路线 tech-graph-simple 的 researchLink 引用（表示层结构化极致的例子）。
