# SCAFFOLD-008 实施文档

版本：008.2（研究方向调整与中断续做）  
修订日期：2026-09-22  
状态：**已实施完成并通过总验收（2026-09-22，实施者自检，独立审查未执行）**；测试 143 项 / 142 通过 / 1 条件跳过（符号链接 EPERM，环境性）。全部工作包（R/2/3/4/5/6）的证据见 [IMPLEMENTATION-REPORT.md](IMPLEMENTATION-REPORT.md)。本文件夹 00–08 为实施前契约与历史快照（08 为文档就绪自检、09 为中断变更记录），不再代表当前产品状态；下一步不是继续 SCAFFOLD-008 产品施工，而是进入内容完善（深读卡生产等 BACKLOG 项）、真实使用与反馈阶段。

本版取代 008.1 的研究定位、选目、数量和续做安排。目的二的真实阅读辅助、目的三后置、目的四的三条技术栈继续有效。用户是研究生新生，实施者负责核查资料，不把选论文和辨别文献结论的责任退给用户。

## 从这里读

1. [IMPLEMENTATION-REPORT.md](IMPLEMENTATION-REPORT.md)：当前实施结果、测试基线、已知边界与未提交状态。
2. [00-contract.md](00-contract.md)：本里程碑的目的、授权、禁止项与边界。
3. [01-directions.md](01-directions.md)、[02-curriculum.md](02-curriculum.md)：主方向正文与冻结的少量起步材料。
4. [03-reading-system.md](03-reading-system.md)、[04-tech-routes.md](04-tech-routes.md)：阅读/导航契约与技术教学契约。
5. [05-product-changes.md](05-product-changes.md)、[06-work-packages.md](06-work-packages.md)、[07-source-audit.md](07-source-audit.md)：实现范围、验证要求与来源边界。
6. [history/README.md](history/README.md)：008.1 和实施前 008.2 文档的历史快照，不作为当前施工指令。

[08-readiness-review.md](08-readiness-review.md) 与 [09-change-and-resume.md](09-change-and-resume.md) 也已明确标注为实施前历史快照；不要按其中的旧测试结果或续做步骤重复实施。[AI-OPTIMIZATION-HANDOFF-001.md](../AI-OPTIMIZATION-HANDOFF-001.md) 与 [研究路线资料索引](../research/agent-shared-state-handoff-learning-roadmap.md) 是讨论/资料索引，不是当前实施命令。冲突以本版和实施报告为准；项目安全仍服从 AGENTS.md。

## 这次真正改变了什么

主方向是 Cross-Harness Agent Collaboration：在不同 Agent 无法共享同一 harness、完整上下文和持续会话的条件下，在固定输入/输出 token 预算约束下，研究不同协作机制及其具体信息表示策略，对异构模型持续完成复杂任务的效果、成本和适用条件。

共享状态、handoff packet、文档/wiki、原始轨迹、检索记忆及其组合都是候选，不预设胜者；换手只是一个可观察切片，不等于研究全貌。平台提供方向引导，不建设通信协议、研究数据库、实验平台或完整课程。

主线改为五步：站内问题导读 → Beyond Frameworks → MemGPT → Handoff Tax → Handoff Debt。一篇导读、四篇论文，其中三篇先看地图，Tax 作为第一次读核心的建议。第二条代码验证四步不变。不是五篇全文精读作业，也不是必须完成整条路线才能开始思考。

## 实施结果与边界

- 目标已落地：两条默认研究方向；5+4 起步节点；49 论文、2 材料；主方向仅 3 个按需外链；三条默认技术路线。
- 当前内容库为 4 个方向（2 active / 2 deferred）、13 条技术路线与 26 个单元；旧方向和旧技术主干仍保留，但不进入默认起步入口。
- 当前测试为 143 项：142 通过、1 条件跳过。跳过项是符号链接权限导致的环境项；教材 mock 七类检查已隔离实跑，真实 API 未运行且不被宣称已验证。
- 后续工作进入 [BACKLOG.md](../BACKLOG.md) 的深读卡生产、真实使用与反馈阶段，不再按 008.2 的旧续做步骤重复施工。

## 用户可感受到的完成标准

1. 知道研究的是“什么条件下哪种协作策略更合适”，而不是已确定要发明共享状态。
2. 用少量材料分清场景、机制、表示、传输，理解记忆与当前输入不同；能提出一个有条件的比较问题。
3. 卡片明确讲什么、为什么现在看、带什么目的；自己看/看整理/暂跳过有具体范围和真实内容。
4. 起步导航不被旧长谱系带走，技术学习仍是完整可学的栈而非步骤口号，精选不变成阅读作业。
5. 自动测试、来源核查、真实点击与技术教材运行分别通过；文档就绪不等于产品交付。

不新增画像、自动已读、个人材料记录或视觉换皮；不提交、不推送、不改插件安装文件或私人研究记录。
