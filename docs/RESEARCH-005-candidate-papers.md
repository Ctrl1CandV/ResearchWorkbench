# RESEARCH-005：高价值候选论文清单（调研轮，2026-09-15）

> 勘误（2026-09-16 审查）：Metattack 的 arXiv 编号原写 1903.01603 有误；实施时经 arXiv 摘要页核查更正为 **1902.08412**（标题/作者/ICLR 2019 journal-ref 吻合），入库内容以更正后编号为准。GraphRAG 备选按 PLAN-005 阶段 4 范围未入首批，非遗漏。

本文件是 PLAN-005 的内容输入。性质：**候选清单，不是已入库承诺**。每篇都经过本轮公开检索核实"论文存在、身份（arXiv/DOI）、主题匹配"；录用信息以检索证据为准并逐条标注置信度，**入库前仍须逐篇打开 arXiv 摘要页复核 acceptance/comments 字段**（沿用项目"不写未核验录用信息"的规则）。

本轮只决定"收哪些、挂哪里、建议什么深度"。**不写详细阅读卡**——正文级卡片（standard/deep）由后续模型按 READING-TEMPLATES-005 实际读全文后生产。

## 一、基础经典（不绑定单一方向，Agent 研究生必读）

入选标准：是该子领域的定义性工作或范式起点；不读会在组会与审稿语境中反复吃亏。建议深度一律从 entry/quick 元数据卡起步，其中 Attention、InstructGPT、ReAct 三篇建议后续升 standard/deep。

| 候选 | 身份 | 主题位 | 为什么必收 | 建议深度 |
| --- | --- | --- | --- | --- |
| Attention Is All You Need | arXiv:1706.03762 | 架构起点 | Transformer 定义性工作，一切后续工作的共同语言 | 后续升 deep |
| BERT | arXiv:1810.04805 | 预训练范式 | 预训练-微调范式的定义性工作 | quick→standard |
| GPT-3（Language Models are Few-Shot Learners） | arXiv:2005.14165 | 规模与上下文学习 | in-context learning 的起点，理解"提示为什么有效"的前提 | quick→standard |
| InstructGPT（Training language models to follow instructions with human feedback） | arXiv:2203.02155 | 指令与对齐 | RLHF 与指令遵循的定义性工作 | 后续升 deep |
| Chain-of-Thought Prompting | arXiv:2201.11903 | 推理 | 思维链提示的起点 | quick→standard |
| Self-Consistency Improves Chain of Thought Reasoning | arXiv:2203.11171 | 推理 | 多路径采样投票，与 CoT 对照读 | quick |
| Tree of Thoughts | arXiv:2305.10601 | 规划 | 搜索式推理的代表，与 CoT 线性推理对照 | quick |
| ReAct | arXiv:2210.03629 | 智能体范式 | 推理-行动交替，Agent 工作方式的定义性工作 | 后续升 deep |
| Reflexion | arXiv:2303.11366 | 智能体范式 | 语言反馈自我修正，"反思"类方法起点 | quick→standard |
| Generative Agents | arXiv:2304.03442 | 智能体系统 | 记忆-反思-规划的完整智能体架构样本 | quick |
| Voyager | arXiv:2305.16291 | 智能体系统 | 技能库式终身学习智能体，代码即行动的样本 | quick |

注：Toolformer、ToolLLM、Lewis RAG、LoRA、Gao RAG 综述、Lialin PEFT 综述已在库（旧版支线接入），**不重复收录**。以上 11 篇的会议/年份为学界公认事实，但按项目规则入库时 acceptance 字段仍须逐篇复核。

## 二、方向一补充：代码智能体的修复正确性与预算受限验证（TSE/TOSEM）

| 候选 | 身份 | 角色 | 为什么收 | 建议深度 |
| --- | --- | --- | --- | --- |
| SWE-bench: Can Language Models Resolve Real-World GitHub Issues? | arXiv:2310.06770 | 基准定义 | 该方向事实上的标准评价台；正确性=fail-to-pass+pass-to-pass 的定义出处。检索证据：ICLR 2024（codesota 等多源一致） | 后续升 deep（精读候选） |
| SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering | arXiv:2405.15793 | 方法代表 | ACI 设计如何影响修复成功率；NeurIPS 2024（多源一致） | standard |
| Agentless: Demystifying LLM-based Software Engineering Agents | arXiv:2407.01489 | 反例/对照 | 不用 agent 循环的简单流水线逼近复杂 agent——直接质疑"agent 脚手架的边际收益"，是方向一"评价严谨性"的最佳对照；检索证据指向 ICSE 2025，入库前复核 | standard |
| AutoCodeRover: Autonomous Program Improvement | arXiv:2404.05427 | 方法代表 | 静态分析+LLM 的混合定位；ISSTA 2024（多源一致，含引用记录） | quick→standard |
| OpenHands: An Open Platform for AI Software Developers as Generalist Agents | arXiv:2407.16741 | 平台/复现入口 | 开放复现平台，做预算受限验证实验时的基础设施选项；检索证据指向 ICLR 2025，入库前复核 | entry→quick |
| （备选）SWE-bench-Live | 项目站 swe-bench-live.github.io | 时效/防污染 | 持续更新的防污染基准，呼应"基准构造偏差"风险；本轮只核到项目站与排行榜页，无论文身份核验 | entry（收录前先核论文身份） |

挂载建议：SWE-bench 挂在"建立问题"阶段之后（理解评价定义）；SWE-agent/AutoCodeRover 挂"理解方法"；Agentless 挂"看评价与反例"；OpenHands 挂技术学习 T1/T5 的关联资源。

## 三、方向二补充：动态、多源知识下的可信检索与回答（TKDE/TOIS）

| 候选 | 身份 | 角色 | 为什么收 | 建议深度 |
| --- | --- | --- | --- | --- |
| FreshLLMs: Refreshing Large Language Models with Search Engine Augmentation | arXiv:2310.03214；ACL Anthology 2024.findings-acl.813（本轮已核到 anthology 页面，Findings of ACL 2024，页码 13697–13720，DOI 10.18653/v1/2024.findings-acl.813） | 动态性基准 | FreshQA 是"动态世界知识"的定义性基准——方向二"动态"二字最直接的落点；含 false-premise 与快变知识两类失败模式 | standard（升 deep 候选） |
| Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection | arXiv:2310.11511 | 方法代表 | 自适应决定是否检索+反思标记自我评价；与 Astute RAG（已在库 deep）同属"检索后可信"谱系，对照读价值高。检索证据指向 ICLR 2024，入库前复核 | standard |
| CRAG: Corrective Retrieval Augmented Generation | arXiv:2401.15884 | 方法代表 | 检索评估器+纠正回路，是"检索失败识别"这一子问题的直接工作；会议归属本轮未核到一致证据，入库前复核 | quick→standard |
| （备选）GraphRAG: From Local to Global | arXiv:2404.16130 | 多源/结构化知识 | "多源知识"的结构化路线代表；与方向二"多源"相关但偏摘要任务，列为备选 | quick |

挂载建议：FreshLLMs 挂"建立问题"（定义动态性）；Self-RAG/CRAG 挂"理解方法"并与 Astute RAG 互标编辑对照；GraphRAG 挂"核查近期竞争"。

## 四、方向三补充：部分观测图数据中的有害融合识别（TKDE）

| 候选 | 身份 | 角色 | 为什么收 | 建议深度 |
| --- | --- | --- | --- | --- |
| GCN: Semi-Supervised Classification with Graph Convolutional Networks | arXiv:1609.02907 | 方向基础 | 消息传递的起点，"融合"一词的机制载体；ICLR 2017 为公认事实，入库前复核 | quick |
| GAT: Graph Attention Networks | arXiv:1710.10903 | 方向基础 | 注意力加权融合——"融合权重可学"正是有害融合得以发生的机制；ICLR 2018 为公认事实，入库前复核 | quick |
| Nettack: Adversarial Attacks on Graph Neural Networks via Meta Learning 前作（Adversarial Attacks on Neural Networks for Graph Data） | arXiv:1805.07984 | 有害信号注入 | 图对抗攻击的定义性工作（KDD 2018 最佳论文，多源一致）；把"有害边/特征"问题形式化的起点 | standard |
| Metattack: Adversarial Attacks on Graph Neural Networks via Meta Learning | arXiv:1903.01603 | 投毒/全局攻击 | 元梯度投毒攻击，"训练期被污染"的形式化；ICLR 2019 为公认事实，入库前复核 | quick→standard |
| GNNGuard: Defending Graph Neural Networks against Adversarial Attacks | arXiv:2006.08149 | 防御=有害边识别 | 直接做"识别并削弱有害边权重"——与方向三"有害融合识别"几乎是同一动词；NeurIPS 2020（NeurIPS 2020 论文目录多源一致） | standard（升 deep 候选） |
| Feature Propagation: On the Unreasonable Effectiveness of Feature Propagation in Learning on Graphs with Missing Node Features | arXiv:2111.12128（本轮已核到 arXiv 全文页与摘要） | 部分观测 | "部分观测"最直接的定义性方法：缺失特征下的扩散式重建，99% 缺失仍 ~4% 相对精度下降（摘要数据）；会议归属（LoG 2022）本轮未核到权威页面，入库前复核 | standard（升 deep 候选） |

挂载建议：GCN/GAT 挂"建立问题"前的基础位；Nettack/Metattack 挂"理解方法"（把"有害"形式化）；GNNGuard 挂"理解方法"并与 CAMERA（已在库）对照；Feature Propagation 挂"建立问题"（定义部分观测）。

## 五、收录纪律（沿用项目规则）

1. 上表全部条目本轮只做"身份+主题"核验；入库时一律先生成 entry/quick 元数据卡（标题、身份、角色、为什么收、建议深度、核查日期），**不凭摘要写正文细节**。
2. acceptance/会议字段：凡标注"入库前复核"的，未复核前卡片上写"录用信息待核"。
3. 数量控制：方向一 5+1 备选、方向二 3+1 备选、方向三 6 篇、基础经典 11 篇，合计约 25 篇。首批入库建议不超过每方向 4 篇 + 经典 11 篇，避免再一次"内容多而浅"。
4. 深读卡生产顺序建议（后续模型）：SWE-bench → FreshLLMs → GNNGuard/Feature Propagation → Attention/InstructGPT/ReAct。
