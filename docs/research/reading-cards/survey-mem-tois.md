# 来源稿：survey-mem-tois（记忆机制综述，standard）

> 状态：已入库（public/content/papers-collab.js，id `survey-mem-tois`）。2026-09-24。
> 来源唯一准绳：docs/research/guidance-display-source-audit.md 最终版 §1.1/§1.2/§1.3（条目 id：survey-mem-tois）。

## 身份

- A Survey on the Memory Mechanism of Large Language Model based Agents
- Zeyu Zhang, Xiaohe Bo, Chen Ma, Rui Li, Xu Chen, Quanyu Dai, Jieming Zhu, Zhenhua Dong, Ji-Rong Wen
- arXiv:2404.13501 v1（2024-04-21）；TOIS 2025（DOI 10.1145/3748302，经 OpenAlex 核到刊名/年份）
- CCF：ccf.org.cn 目录页核到 TOIS 列 A 类（目录事实，非投稿推荐）

## 实际读取范围（转述式提取，非逐行精读）

- ar5iv HTML 正文至 §7.4；§7.5–§9 仅目录级（页面截断）。
- 已核骨架：§5.1 记忆来源（trial 内 / 跨 trial / 外部知识）；§5.2 记忆形式（文本：自然语言、结构化元组、数据库；参数：权重内化；存取策略：完整交互 / 近期缓存 / 检索 top-K / 外部知识）；§5.3 记忆操作（写 / 管理=reflection+merging+forgetting / 读=相似度检索）；§6 评测（直接：coherence/rationality/correctness/F1/效率；间接：对话、多源问答、长上下文应用等）。

## 时点限定（引用纪律）

§6.3「尚无面向记忆模块本身的开源基准」是作者写作时点（2024-04）的判断；2026 年已有 LoCoMo、LongMemEval、MemBench 等基准。站内一切引用带时点限定。

## 入库定级理由

- 深度：standard（§5.1–5.3、§6 正文已核，≥1 正文章节）。
- 角色：background——主方向「记忆」候选机制的方法树主干；综述导学树树根之一。
- 风险记录：ar5iv 截断致 §7.5–§9 不做节级指引；图像未核。

## 站内挂接

- 导学树：卡内 surveyTree（四根枝：来源/形式/操作/评测），节点 refs 挂 memgpt、handoff-debt、compression-cost、memcollab。
- 对照：survey-comms-fcs（通信侧骨架）；方向页问题演化节点（2024-04）。
