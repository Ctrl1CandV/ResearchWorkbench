# 阅读包选材记录：A Survey on Evaluation of LLM-based Agents

状态：全文讲解稿已形成；关键图表的视觉核对尚未完成，因此发布状态仍为 `partial`。

## 选择理由

用户现有的三篇本地综述里，这篇最适合做阅读流程样板：它把 Agent 的能力、应用任务、benchmark 设计和开发期评测框架放在同一结构中；§7.2 又明确提醒评测要区分 backbone LLM 与 agent harness 的贡献。这能给当前 Cross-Harness Agent Collaboration 研究提供实验评价背景，但它并不是跨 harness 通信综述，也没有比较 summary、raw trajectory、handoff、共享状态或长期记忆。

## 来源身份

- 文件：`2026.findings-acl.1330.pdf`（只留在用户本机论文集目录，未复制入仓库）
- 标题：*A Survey on Evaluation of LLM-based Agents*
- 作者：Asaf Yehudai, Lilach Eden, Alan Li, Guy Uziel, Yilun Zhao, Roy Bar-Haim, Arman Cohan, Michal Shmueli-Scheuer
- 出版信息：Findings of the Association for Computational Linguistics: ACL 2026, pp. 26690–26714, July 2–7, 2026
- PDF 页数：25；PDF 创建/修改元数据：2026-06-09（时区 +02:00）
- SHA-256：`2C3C80FFF5735925378B99528684559E2D47F82E281957DC4B955397186560B1`
- 全文文字层：可抽取；不是扫描件。
- 版本原则：节页定位均指向上述 25 页本地 PDF；不混用其他版本的页码。

## 选择边界

本文新近、范围直接，但新近不等于长期权威，且综述自述的代表性不能替代独立质量评估。其 benchmark 名称、作者给出的现状与建议只作为原文转述，不以此声称每个被引系统都经过本阅读包独立验证。读者应把它当作建立评测概念地图的入口，而非一周内必须逐篇精读所有引用工作的任务表。
