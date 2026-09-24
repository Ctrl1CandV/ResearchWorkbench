# 来源稿：survey-comms-fcs（通信视角综述，standard）

> 状态：已入库（public/content/papers-collab.js，id `survey-comms-fcs`）。2026-09-24。
> 来源唯一准绳：docs/research/guidance-display-source-audit.md 最终版 §1.1/§1.2/§1.3（条目 id：survey-comms-fcs）。

## 身份

- Beyond Self-Talk: A Communication-Centric Survey of LLM-Based Multi-Agent Systems
- Bingyu Yan, Zhibo Zhou, Litian Zhang, Lian Zhang, Ziyi Zhou, Dezhuang Miao, Zhoujun Li, Chaozhuo Li, Xiaoming Zhang
- arXiv:2502.14321 v1（2025-02-20）/ v3（2026-05-26）
- 发表：Frontiers of Computer Science 接收（arXiv 评论字段自注 + DOI 10.1007/s11704-026-50857-y 可解析；未经出版方页面二次核验）
- CCF：ccf.org.cn 目录页核到 FCS 列 B 类（目录事实）

## 实际读取范围

- arXiv HTML v3 章节结构（§1–§6）+ §4 部分内容（框架级）。
- 已核骨架：系统级（§3：架构 flat/hierarchical/team/society/hybrid、目标 cooperation/competition/mixed、协议 MCP/A2A/ANP）；系统内部（§4：策略 one-by-one/simultaneous-talk/simultaneous-talk-with-summarizer；范式 message passing/speech act/blackboard；对象 self/other agents/environment/human；内容 显式=NL/代码/结构化数据 vs 隐式=行为反馈/环境信号）。

## 覆盖边界

§4.4 内容分类只有框架级正文，深入需补读原文；图像与表格数值未核；协议名单只核到目录级提及。

## 入库定级理由

- 深度：standard（章节结构已核 + §4 框架级正文）。
- 角色：background——协作侧通信骨架；与 Beyond Frameworks 互补（分工见卡内对照表）；综述导学树树根之二。
- 价值排序：审计 §1.2 指出「内容」维显式/隐式之分可直接接到「语义内容」轴。

## 站内挂接

- 导学树：卡内 surveyTree（系统级 / 系统内部两根枝），节点 refs 挂 beyond-frameworks、handoff-tax、handoff-debt、routed-graph-handoff、memgpt。
- 方向页：mechVsRep/axisAnalysis 的显式 vs 隐式内容引用（§4.4 框架级，已注明）。
