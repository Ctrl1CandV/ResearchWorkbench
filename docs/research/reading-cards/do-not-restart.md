# 来源稿：do-not-restart（近邻，quick）

> 状态：已入库（public/content/papers-collab.js，id `do-not-restart`）。2026-09-24。
> 来源唯一准绳：docs/research/guidance-display-source-audit.md 最终版 §4.2（条目 id：do-not-restart）。

## 身份

- Do Not Restart: Residual Completion for Stateful Agent Handoffs
- Runzhi Deng, Yiming Zhong, Fang Zhao, Pan Zhou；arXiv:2609.13800 v3（v1 2026-09-12）；预印本。

## 实际读取范围

HTML 全文节级提取（正文已读）。已核：§1 问题与 commitment frontier、§3 CFRC 三阶段（RSCC 冻结残差合约 / ERC 隔离副本补全+证据链接图 / CE 整图准入+活环境回执）、§4 五个有状态工具基准（STATE-Bench、τ²-Retail、τ²-Airline、ToolSandbox、Agent-Diff）。

## 关键数字（引用须带设置条件）

- CFRC 70.8% macro vs 强锚 69.6%，成本 34.6%；跨厂商对距强锚 0.5 分以内（成本 26.0%/44.1%）。
- 整图准入比逐步核查 +8.8 分且省 $8.26。
- 审计：持久写义务召回 91.2%，零无据实写，124 次 CE 干预全部发生在首次实写之前。

## 自列局限（影响强度判断）

只评单任期 cheap→strong 与合约冻结；递归路由超范围；对话披露不在工具效果 schema 内时形式化提升以合约完整为前提；不保证构造器正确、不保证解存在、失败不隐含回滚。模型代号与基准均新，未独立复核基准真实性。

## 入库口径

- 深度：quick（partial-text）；角色：frontier——「状态保存在哪里/谁决定何时更好」两轴的合约级证据；解释价值排序第 2。

## 站内挂接

- 方向页 paperLinks：↔ handoff-tax（合约 vs 仓库现场）；axisAnalysis「状态保存在哪里」「谁决定传/取什么」实例（环境侧门禁）。
- 基础导读：mat-handoff-basics 概念三（残差义务）；与 MemGPT 的对照（确定性准入 vs LLM 自主策略）。
