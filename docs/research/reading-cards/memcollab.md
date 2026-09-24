# 来源稿：memcollab（近邻，quick）

> 状态：已入库（public/content/papers-collab.js，id `memcollab`）。2026-09-24。
> 来源唯一准绳：docs/research/guidance-display-source-audit.md 最终版 §4.3（条目 id：memcollab）。

## 身份

- MemCollab: Cross-Model Memory Collaboration via Contrastive Trajectory Distillation
- Yurui Chang, Yiran Wu, Qingyun Wu, Lu Lin；arXiv:2603.23234 v2（v1 2026-03-24）；预印本。

## 实际读取范围

HTML 全文节级提取（正文已读至实验节；附录提取到附录级、未逐页核）。已核：§1 问题（跨模型记忆共享）、§2 对比轨迹蒸馏（选优选劣→最强模型抽「违规模式+推理不变量」→enforce/avoid 范型入共享记忆、带模型身份标签；推理时任务类别→参与模型→语义排序 top-3 双门控检索）。

## 关键数字（引用须带任务域条件）

- Qwen-7B 平均 57.1→71.6；Qwen-32B 70.8→79.6。
- 直接迁移（7B 用 32B 记忆）在 MATH500 反降 52.2→50.6——「朴素共享有害」的直接证据。
- 表格数值除表 1 选取行外未逐项核表。

## 自列局限

任务域为数学/代码/应用任务，与 coding Agent 交接场景有距离；访问控制与安全过滤留作未来工作；附录未逐页核。

## 入库口径

- 深度：quick（partial-text）；角色：frontier——「表示组合」从单任务交接到跨模型记忆的扩展；解释价值排序第 3。

## 站内挂接

- 方向页 paperLinks：↔ memgpt（跨模型缺口对照）；axisAnalysis「保存什么语义」实例（enforce/avoid 二分）。
- 导学树：survey-mem-tois「写」节点回链；mat-mech-vs-representation 的「同机制同表示换接收模型」开放问题引用。
