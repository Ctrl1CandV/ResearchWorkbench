# 来源稿：compression-cost（近邻，quick）

> 状态：已入库（public/content/papers-collab.js，id `compression-cost`）。2026-09-24。
> 来源唯一准绳：docs/research/guidance-display-source-audit.md 最终版 §4.1（条目 id：compression-cost）。

## 身份

- What Does Context Compression Cost an Agent? Interaction Costs Unrevealed by Task-Completion Metrics
- Shuyu Liu（单作者）；arXiv:2608.16370 v1（2026-08-17）；预印本，未经同行评审。

## 实际读取范围

HTML 全文节级提取（工具转述式，非逐行精读）。已核：§1 问题、§3 re-query loop 与 D-state/R-state 分解、§4 实验（IRBench、24 轮上限；DeepSeek/Qwen/GPT-5.5 × 高/低 IR × 压缩比 × 滑窗/抽取式摘要 + oracle 状态恢复干预）、作者自列 11 条局限。

## 关键数字（引用须带设置条件）

- 6 组对比中检索调用全升（5/6 经 Holm 校正仍显著），执行调用稳定。
- GPT-5.5 完成率 80%→85%（p=1.0），检索 +42.9 次（约 3 倍）。
- 恢复 D-state 消掉约一半检索成本；同预算下保事实的摘要算子避开大部分额外检索。
- ALFWorld 中同算子无检索激增——成本是环境依赖的，不是压缩的内在属性。

## 入库口径

- 深度：quick（partial-text，节级正文已核）。
- 角色：frontier——「获取及计费」轴的机制证据；解释价值排序第 1。
- 审计纪律：数字不外推为通用比例；单作者+合成环境，证据强度按预印本对待。

## 站内挂接

- 方向页 paperLinks：↔ handoff-tax（交接后运行账 vs 交接时一次性账）、↔ handoff-debt（R-state 对照 Traj-drop）。
- 导学树：survey-mem-tois「存取策略」「读」节点回链；axisAnalysis「谁决定传/取什么」「如何获取及计费」实例。
- 基础导读：mat-read-performance-claims 的口径样本；mat-handoff-basics 概念二（运行账）。
