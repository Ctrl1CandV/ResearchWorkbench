// public/content/directions.js —— 四条研究方向（SCAFFOLD-008 / 008.2）。
// 契约：docs/SCAFFOLD-008/01-directions.md（008.2）、03-reading-system.md §3/§5。
// - active=2（cross-harness-collab 主方向 / code-agent-verification），deferred=2，正文不删；
// - startRoute/archiveRoute 是新数据权威；旧 direction.route 仅由 library.js 兼容层读取；
// - 主方向研究定位（008.2）：固定输入/输出 token 预算下，跨 harness 异构 Agent 的
//   协作机制与信息表示组合比较；不预设共享状态或交接包胜出。
// 本文件只是数据，不含任何本人进度。

export const DIRECTIONS = [
  {
    id: 'cross-harness-collab',
    order: 1,
    status: 'active',
    title: '跨工具的智能体协作：预算约束下的机制比较',
    summary:
      '不同模型在彼此隔离的工具中合作，不能直接继承完整会话。在输入/输出 token 预算受限时，什么协作机制与信息表示组合，能以合适成本持续完成任务？这里比较条件与效果，不预设共享状态或交接包最好。',
    overview:
      'Cross-Harness Agent Collaboration：在不同 Agent 无法共享同一 harness、完整上下文和持续会话的条件下，在固定输入/输出 token 预算约束下，研究不同协作机制及其具体信息表示策略，对异构模型持续完成复杂任务的效果、成本和适用条件。跨工具是研究场景，不是一种算法。可以直接传消息或摘要，也可以借助共享工作区、长期记忆、检索和仓库工件，或把它们组合起来。共享状态是候选，不是研究题目本身；通信、记忆与交接也不是必须互斥的选项。要问的不是哪一种格式普遍最好，而是哪类项目和问题、哪对模型、哪种预算与合作阶段适合哪种做法。换手便于观察信息传递，但持续分工、反馈往返和长期合作也在视野中。先读少量材料辨清问题，再逐渐选择一个小切片；不要求先学完全部机制。',
    stateOfField:
      '多智能体协作可以拆开观察组织方式、交互及历史管理，而不只比较框架名；记忆研究则帮助区分长期存储与当前输入。两篇换手研究提供了具体观察窗口，但它们的运行环境和预算条件不等于所有真实跨工具设置。现阶段这些是建立问题的依据，不足以证明某种表示全面占优，也没有证明本方向已经具有足够发表新颖性。各论文结论的证据边界见其阅读卡内的「来源与覆盖」。',
    asOf: '2026-09-22',
    whyChoose:
      '来源于实际跨工具协作困惑，能先从读懂对照与失败模式开始，不必先训练大模型或建设平台。这是适合起步探索的理由，不是“容易发论文”的保证。',
    limits:
      '容易退化成换一种摘要格式的展示。真正比较还要控制可见信息、工具权限、模型能力和输入/输出预算；写摘要、取记忆、读工件也有成本。封闭工具未必暴露完整轨迹和用量，不能许诺严格可比。强弱是任务相关能力，不由价格直接决定。',
    openQuestions: [
      '在同一明确的预算口径下，摘要、轨迹、状态、wiki、检索与工件引用的单独或组合使用，怎样影响任务成功、返工和成本？',
      '发送方/接收方能力差异、项目与问题类型、交接时机，是否会改变合适策略？',
      '一次换手与多轮持续合作是否需要不同的信息保留方式？记忆何时有用、何时过期或传播错误？',
      '组合的收益来自机制互补，还是只是用了更多信息、调用或工具权限？',
    ],
    sources: [
      { label: 'Beyond Frameworks，ACL 2025', url: 'https://aclanthology.org/2025.acl-long.1037/', note: '协作维度拆解' },
      { label: 'MemGPT', url: 'https://arxiv.org/abs/2310.08560', note: '记忆与当前输入的机制例子' },
      { label: 'Handoff Tax', url: 'https://arxiv.org/abs/2608.24358', note: '异构模型换手观察' },
      { label: 'Handoff Debt', url: 'https://arxiv.org/abs/2606.02875', note: '交接视图与重新发现成本' },
    ],
    archiveLabel: '按需查阅（不必接着读）',
    trackClosing:
      '选一个你仍不明白的比较问题，回看对应论文的设置；想动手时，再按需进入多智能体技术路线。练习自愿，研究实验另议。',
    startRoute: [
      {
        id: 'step-collab-1',
        kind: 'article',
        materialId: 'mat-cross-harness-map',
        stage: '建立概念',
        required: '必读',
        passMode: 'map',
        purpose: '先分清场景、机制、表示与传输四层，消除「世界状态就是研究方向」的误解，后续论文才能放对位置。',
        readWhen: '主线第一篇：在碰任何论文之前先读这份站内导读。',
        check: '能用自己的话提出「在什么条件和预算下，哪种机制/表示组合更合适」，并指出换手只是整个协作问题的一个切片。',
      },
      {
        id: 'step-collab-2',
        kind: 'paper',
        paperId: 'beyond-frameworks',
        stage: '建立问题',
        required: '必读',
        passMode: 'map',
        purpose: '把「协作」拆成治理、参与、交互与历史管理四个维度，避免把框架名当协作机制。',
        readWhen: '导读之后立刻读：用它给后面的记忆与换手论文定位。',
        check: '能提出一个协作维度，并说明它改变什么、不预设其普遍最佳取值。',
      },
      {
        id: 'step-collab-3',
        kind: 'paper',
        paperId: 'memgpt',
        stage: '理解方法',
        required: '必读',
        passMode: 'map',
        purpose: '建立「存下来的信息不会自动进入下一轮输入」的机制直觉，为记忆这一候选机制打底。',
        readWhen: '有了维度词汇之后读它，把记忆放进机制地图。',
        check: '能区分记忆库、检索/管理策略和这一轮上下文三样东西。',
      },
      {
        id: 'step-collab-4',
        kind: 'paper',
        paperId: 'handoff-tax',
        stage: '看评价与反例',
        required: '必读',
        passMode: 'core',
        purpose: '主方向的核心对照：异构模型换手时，交接界面的优劣随方向反转——「多传信息总更好」不成立。',
        readWhen: '带着导读的预算意识读：盯 §3 的设置与 §4 的方向相关结果。',
        check: '能说出一个「结论成立的条件」和一个不能直接外推的场景。',
      },
      {
        id: 'step-collab-5',
        kind: 'paper',
        paperId: 'handoff-debt',
        stage: '看评价与反例',
        required: '必读',
        passMode: 'map',
        purpose: '四种交接视图的 baseline：事件数、累计输入 token、初始长度与解出率要分开看，结构化不自动胜出。',
        readWhen: 'Tax 之后立刻读：把「界面随方向变」与「指标要分开记」合在一起。',
        check: '能解释「同额度比较」与「给了不同长度材料再看成本」的区别。',
      },
    ],
    archiveRoute: [
      {
        id: 'archive-collab-survey',
        kind: 'external',
        title: 'Multi-Agent Collaboration Mechanisms: A Survey of LLMs',
        url: 'https://arxiv.org/abs/2501.06322',
        role: '协作机制综述',
        note: '对协作分类仍无全貌时只查摘要与分类；不读完所有被引论文。',
        availability: 'ready',
        checkedAt: '2026-09-22',
      },
      {
        id: 'archive-collab-coala',
        kind: 'external',
        title: 'CoALA: Cognitive Architectures for Language Agents',
        url: 'https://arxiv.org/abs/2309.02427',
        role: '认知架构词汇',
        note: '仍分不清 Agent 的记忆、动作、决策时查阅；不是起步卡。',
        availability: 'ready',
        checkedAt: '2026-09-22',
      },
      {
        id: 'archive-collab-context',
        kind: 'external',
        title: 'Anthropic: Effective Context Engineering for AI Agents',
        url: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents',
        role: '工程博客',
        note: '对「存什么」和「这一轮给什么」仍混淆时查阅；技术博客不是跨工具比较证据。',
        availability: 'ready',
        checkedAt: '2026-09-22',
      },
    ],
  },
  {
    id: 'code-agent-verification',
    order: 2,
    status: 'active',
    title: '代码智能体的修复正确性与预算受限验证',
    summary: '真实软件维护中代码智能体的修复正确性、回归风险与验证预算分配。',
    overview:
      '代码智能体能提交一个补丁，但测试通过并不保证需求真的完成，也不能保证没有引入回归。这个方向研究的是：在有限的验证预算下，验证器应该检查什么，才能把“看起来修好了”和“真的修好了”区分开。主方向问 Agent 如何跨工具合作；本条问合作的产出（补丁）怎样算对。两条一起养「能协作」和「能检验」，不是两个无关兴趣。',
    stateOfField:
      '补丁通过测试却不真正正确，是自动程序修复里的长期问题：TOSEM 2025 的实证研究用契约加缺陷查找工具复核补丁，发现工具接受的补丁多数是伪修复，扩大测试套件能压低过拟合却不增加真修复。基于预训练模型的补丁正确性分类（APPT、ComPass）已经把“判断补丁对不对”做成了学习任务；代码基准本身也需要审计，OpenAI 在 2026-07-08 的 SWE-Bench Pro 审计报告了较多任务存在问题。因此“多跑几个测试”或“多用一个模型审查”本身都不能算作新贡献。',
    asOf: '2026-09-15',
    whyChoose:
      '它把研究对象落在可审计的软件工程问题上：任务、输出、错误接受成本和验证预算都比较明确，适合从“验证器该看什么”入手，而不是先搭更大的智能体框架。材料中的工程与核验设施也可能降低实验组织成本，但这不等于现有设施已经满足论文要求。',
    limits:
      '主要难点是真值、跨仓库泛化和公平预算，不是搭更大的 Agent 框架。如果只证明“多跑测试比不跑好”或“多模型审查分数更高”，不足以支撑研究主张。传统工具与小程序基准的结论不能直接外推到现代代码智能体。',
    startHint:
      '初期不必走完下面的完整谱系。先用一篇方法说明学会「实证研究怎么读」，再读 TOSEM 把「测试通过 ≠ 修好」立住，再看 Agentless：复杂 Agent 循环的好处必须自己证明。SWE-bench 只扫评价定义，因为它是主方向换手论文常用的台子。其余篇是谱系背景，等你真的要把验证预算写成研究问题时再打开。',
    openQuestions: [
      '固定生成器与计算预算时，按当前可见证据选择下一项检查，能否优于同预算下的固定、随机、覆盖率优先或不确定性优先策略？',
      '测试不完整、模型审查相互相关、日志与真实状态不一致时，哪些证据组合仍能可靠降低错误接受？',
      '在未见过的仓库、缺陷类别或代码模型上，能否保持有用的接受覆盖率，而不是遇到新情况就一律拒绝？',
    ],
    sources: [
      { label: 'TOSEM 2025：测试验收准则实证研究', url: 'https://nmaguirre.github.io/assets/pdf/tosem2025.pdf', note: '作者全文；问题、实验与外推限制' },
      { label: 'ComPass：补丁正确性判断（arXiv 2602.07561）', url: 'https://arxiv.org/abs/2602.07561', note: '近期学习型基线；本卡只依据摘要' },
      { label: 'OpenAI：代码评测审计（2026-07-08）', url: 'https://openai.com/index/separating-signal-from-noise-coding-evaluations/', note: '机构研究报告，按该机构审计定义' },
    ],
    startRoute: [
      {
        id: 'step-code-1',
        kind: 'article',
        materialId: 'mat-read-empirical',
        stage: '建立概念',
        required: '必读',
        passMode: 'map',
        purpose: '下一篇 TOSEM 是评价论文；先学会「测什么、真值怎么来、数字的分母是谁」，不被 AI 摘要带着走。',
        readWhen: '本线第一篇：读 TOSEM 之前先读这份站内方法说明。',
        check: '能说出三遍读法与四个问题（问题、设置、证据、外推），并知道数字必须回原文。',
      },
      {
        id: 'step-code-2',
        kind: 'paper',
        paperId: 'tosem2025-acceptance',
        stage: '建立问题',
        required: '必读',
        passMode: 'core',
        purpose: '把「测试通过 ≠ 修好」立成可引用的实证基准，方向里后面的验收讨论都以它为参照。',
        readWhen: '读完方法说明立刻读：带着「patch ≠ fix」读 RQ1/RQ4 的设置。',
        check: '能复述 patch 与 fix 之别、RQ1 与 RQ4 的关键数字及其设置，并说出作者在 §7 建议的三条出路。',
      },
      {
        id: 'step-code-3',
        kind: 'paper',
        paperId: 'agentless',
        stage: '看评价与反例',
        required: '必读',
        passMode: 'map',
        purpose: '最重要的对照：不用 agent 循环的三阶段流水线逼近复杂 agent——脚手架的边际收益必须先自证。',
        readWhen: '在 TOSEM 之后读它，用它质疑「再加一个 Agent 传话」是否真的必要。',
        check: '能说出三阶段流程（摘要级），并记住「复杂脚手架的边际收益必须自证」。',
      },
      {
        id: 'step-code-4',
        kind: 'paper',
        paperId: 'swe-bench',
        stage: '看评价与反例',
        required: '必读',
        passMode: 'map',
        purpose: '只建立评价定义：真实 issue + 失败转通过 / 通过须保持的测试；主方向两篇换手论文都用同类软件任务做实验。',
        readWhen: '本线最后一篇：读懂台子的判据即可，不读榜。',
        check: '能复述任务从哪来（issue-PR 对）与两类测试各防哪种误判。',
      },
    ],
    archiveRoute: [
      { id: 'archive-code-1', kind: 'paper', paperId: 'tosem2025-acceptance', stage: '建立问题', required: '必读', purpose: '建立“测试通过不等于修复正确”的实证基础，理解验证预算为什么是独立的研究变量。', readWhen: '方向一第一篇：后续关于验收标准与补丁评估的文献都建立在这篇的问题定义之上。', check: '能复述 patch 与 fix 之别、RQ1 与 RQ4 的关键数字及其设置，并说出作者在 §7 建议的三条出路。' },
      { id: 'archive-code-2', kind: 'paper', paperId: 'le2018-overfitting', stage: '建立问题', required: '必读', purpose: 'TOSEM 在 RQ4 里复核的对象就是它：这篇用 held-out 测试估计语义类修复工具的过拟合程度。', readWhen: '第二篇，紧接 TOSEM；带着 RQ4 的疑问核对它的原始结论。', check: '能说出它与 TOSEM 在“如何判定过拟合”上的方法差异（held-out 测试 vs 契约加缺陷查找复核）。' },
      { id: 'archive-code-3', kind: 'paper', paperId: 'swe-bench', stage: '建立问题', required: '必读', purpose: '理解“修复正确”在现代代码智能体语境下的评价定义：真实 issue + 失败转通过、通过保通过两类测试。', readWhen: '第三篇；传统 APR 的过拟合问题之后，看这个评价台如何把“修没修好”落到可执行的判据上。', check: '能复述任务构造（issue-PR 对）与两类测试各自防止的误判；当前只有摘要级判断。' },
      { id: 'archive-code-4', kind: 'paper', paperId: 'ye2021-assessment', stage: '看评价与反例', required: '必读', purpose: '看补丁评估如何规模化（TOSEM 参考条目 [58]），对照“小基准细复核”与“大规模统计评估”两条路线。', readWhen: '第四篇；在理解验收问题之后再看规模化评估。', check: '读完后能概述其评估信号与规模化思路，并与 TOSEM 的契约复核标准对照。' },
      { id: 'archive-code-5', kind: 'paper', paperId: 'agentless', stage: '看评价与反例', required: '必读', purpose: '最重要的对照：不用 agent 循环的三阶段流水线逼近复杂 agent——脚手架的边际收益必须先自证。', readWhen: '第五篇；在看过两种评估路线后，用它重置对“复杂方法”的预期。', check: '能说出三阶段流程与作者对基准条目的人工分类结论（当前只有摘要级判断）。' },
      { id: 'archive-code-6', kind: 'paper', paperId: 'appt', stage: '理解方法', required: '选读', purpose: '了解基于预训练语言模型加序列模型的补丁分类方案（作者仓库说明），作为“学习型验收器”的近期参照。', readWhen: '第六篇；在掌握验收问题与评估路线后看学习型方案。', check: '能说出其输入输出（补丁到是否正确的分类）与所用组件（预训练语言模型加序列模型），并在仓库核对论文信息。' },
      { id: 'archive-code-7', kind: 'paper', paperId: 'swe-agent', stage: '理解方法', required: '必读', purpose: '看 agent 路线的代表系统：智能体-计算机接口（ACI）如何影响修复成功率。', readWhen: '第七篇；带着 Agentless 的质疑读它，分清哪些收益来自接口、哪些来自基座模型。', check: '能复述 ACI 的设计目标与评价台（当前只有摘要级判断）。' },
      { id: 'archive-code-8', kind: 'paper', paperId: 'autocoderover', stage: '理解方法', required: '选读', purpose: '看验证信号进入修复流程上游的一种做法：程序结构搜索 + 测试光谱定位辅助 LLM 定位。', readWhen: '第八篇；方法谱系对照，看它与传统分析工具的结合点。', check: '能说出结构搜索与光谱定位各自收窄了什么（当前只有摘要级判断）。' },
      { id: 'archive-code-9', kind: 'paper', paperId: 'compass', stage: '核查近期竞争', required: '必读', purpose: '了解 ComPass 的思路：对比学习加语义保持变换来判断补丁正确性；方向一近期的竞争线索。', readWhen: '第九篇收尾；先看这里的摘要级判断，再决定是否取全文。', check: '能复述摘要卡里的问题—做法—定位，并指出哪些结论未经正文核对。' },
    ],
  },
  {
    id: 'trusted-rag',
    order: 3,
    status: 'deferred',
    title: '动态多源知识下的可信检索与回答',
    summary: '动态知识下检索增强生成的证据有效期、来源冲突与可靠拒答。',
    deferredNote: '这条方向初期不作为探索入口。检索记忆相关能力见技术路线「RAG / 检索记忆」；论文卡仍可查阅。',
    overview:
      '同一事实会随时间或软件版本变化，不同来源还可能互相矛盾。这个方向关心的不是能不能检索到相近文字，而是这些证据在目标时间是否有效、是否足以支撑回答，以及在证据不足时是否应该拒答。',
    stateOfField:
      'Astute RAG（ACL 2025）已经把“检索不完美 + 内外知识冲突”做成受控实验，并给出来源感知的合并机制；Sufficient Context 已有基于上下文充分性的选择性生成与拒答；时间敏感方面已有 HoH（ACL 2025 动态基准）与 TimelyRAG（2026-09-10 预印本，语义-时间混合排序）。因此增加引用、给文档加日期标签或简单拒答，都不能直接声称创新。',
    asOf: '2026-09-15',
    whyChoose:
      '它可以从公开技术文档与固定生成模型出发做问题分析，不必先训练大模型，原型门槛相对低；知识更新与来源矛盾是长期存在的信息质量问题，不随基础模型升级自动消失。代价是同质化风险高，必须和强组合基线比较。',
    limits:
      '主要难点是版本真值与标注成本：来源时间和版本真值需要人工投入，小数据上“看起来更可信”不能支撑泛化。若只是在自己的知识库里加引用或图谱，那更接近功能开发。',
    openQuestions: [
      '在一批数据上校准出的回答阈值，语料和来源更新后还可靠吗？失败来自检索、证据解释还是拒答决策？',
      '一个结论依赖多个证据、其中只有部分失效时，如何更新证据链并识别当前仍无法解决的冲突？',
      '固定成本下，增加检索、版本核查或来源交叉验证何时有实质价值？必须与现有时间、冲突、拒答方法的合理组合比较。',
    ],
    sources: [
      { label: 'Astute RAG（ACL 2025 正式长文）', url: 'https://aclanthology.org/2025.acl-long.1476/', note: '冲突刻画与来源感知合并' },
      { label: 'Sufficient Context（arXiv 2411.06037）', url: 'https://arxiv.org/abs/2411.06037', note: '上下文充分性与拒答；本卡只依据摘要' },
      { label: 'HoH：过时信息动态基准（ACL 2025）', url: 'https://aclanthology.org/2025.acl-long.301/', note: '时间维度评测' },
    ],
    startRoute: [],
    archiveRoute: [
      { id: 'archive-rag-1', kind: 'paper', paperId: 'rag-survey', stage: '建立问题', required: '选读', purpose: '建立检索增强生成的全景：先有问题与方法地图，再进入具体机制。', readWhen: '方向二第一篇。综述只需快速过一遍，找到“检索后处理/不可靠检索”的位置即可。', check: '能说出综述的主要组织脉络，并在目录里找到不可靠检索对应的位置。' },
      { id: 'archive-rag-2', kind: 'paper', paperId: 'freshllms', stage: '建立问题', required: '必读', purpose: '把“动态知识”落到可评测的失败模式：快变知识答错、虚假前提不纠正。', readWhen: '第二篇；全景之后立刻建立“动态”的问题定义，再进机制。', check: '能说出 FreshQA 的两类失败模式与两模式评价思路（当前只有摘要级判断）。' },
      { id: 'archive-rag-3', kind: 'paper', paperId: 'astute-rag', stage: '理解方法', required: '必读', purpose: '掌握“检索不完美 + 内外知识冲突”的问题刻画与来源感知合并机制，作为方向二的方法基线。', readWhen: '第三篇：先建立冲突问题刻画，再读时间敏感、拒答类工作，避免把“让模型比较来源”当成新贡献。', check: '能说清三步机制、来源标签消融的作用，并指出哪些可靠性数字来自模型自评而非独立担保。' },
      { id: 'archive-rag-4', kind: 'paper', paperId: 'sufficient-context', stage: '理解方法', required: '必读', purpose: '了解“上下文够不够用”的判定视角，以及上下文不足时回答还是拒答的权衡；方向二做可靠拒答绕不开它。', readWhen: '第四篇，紧跟 Astute 的冲突问题之后。', check: '能复述充分性判定与拒答的取舍，并知道版本沿革（v1 2024-11-09，v3 2025-04-23）；后续查新须与它比较。' },
      { id: 'archive-rag-5', kind: 'paper', paperId: 'self-rag', stage: '理解方法', required: '选读', purpose: '看训练式路线：把“要不要检索、证据信不信”训进模型的反思标记。', readWhen: '第五篇；与 Astute 的规则式合并对照，分清两种可信化哲学。', check: '能说出反思标记控制的三类决策（当前只有摘要级判断）。' },
      { id: 'archive-rag-6', kind: 'paper', paperId: 'crag', stage: '理解方法', required: '选读', purpose: '看独立评估器路线：检索质量判定 + 纠正回路（精炼/联网重查/混合）。', readWhen: '第六篇；与 Self-RAG 对照，注意评估器错误沿流水线传递的问题。', check: '能说出三种判定结果各自触发的动作（当前只有摘要级判断）。' },
      { id: 'archive-rag-7', kind: 'paper', paperId: 'hoh', stage: '看评价与反例', required: '必读', purpose: '看看“知识会过时”怎么被做成基准：过时信息如何进入问答评测。', readWhen: '第七篇；读完 Astute 与 Sufficient Context 后再看评测维度。', check: '能说出该基准构造的时间维度与它测什么（以 anthology 条目页与摘要为准）。' },
      { id: 'archive-rag-8', kind: 'paper', paperId: 'timely-rag', stage: '核查近期竞争', required: '必读', purpose: '了解时间敏感检索的语义加时间混合排序与 TimelyQA 基准（2026-09-10 登记）；方向二近期的竞争线索。', readWhen: '第八篇收尾；它也是 2026-09-15 精选简报的优先项。', check: '能复述语义-时间混合排序的思路与基准构成（只有摘要级判断；未经正文核对）。' },
    ],
  },
  {
    id: 'graph-harmful-fusion',
    order: 4,
    status: 'deferred',
    title: '部分观测图数据中的有害融合识别',
    summary:
      '观测残缺或来源冲突时，融合中的“补出来的错误”是否会被当作信号，使结果更差且更难察觉？本方向研究如何识别这类有害融合。',
    deferredNote: '这条方向初期不作为探索入口。图相关基础见技术路线「图（浅尝）」；论文卡仍可查阅。',
    overview:
      '同一个对象可能有属性、关系和行为特征等不同来源的信息。当信息缺失或来源冲突时，把这些信息强行融合，可能比只用一个可靠来源更差，这叫负迁移或有害融合。这个方向要回答的是：什么时候不该融合，以及在没有测试标签的情况下依据什么知道。',
    stateOfField:
      '不完整多视图学习已有不少近期工作：CAMERA（TPAMI 作者稿）同时处理样本缺失与视图未对齐，并用可学习社区中心加互注意力做恢复；OAGL（TKDE 2025）用一步自适应图学习处理不完整多视图子空间聚类；BRIDGE（ICCV 2025）用两阶段迁移加域对抗应对非独立同分布缺失。可信融合方向也有 RCMCL（TPAMI 2026）用证据不确定性处理冲突多视图决策。它们与“属性图上的聚类”并非同一种任务，不能按题名相近就当作可直接比较。',
    asOf: '2026-09-15',
    whyChoose:
      '这是三条里最独立的机器学习方法问题：关键不是再设计一种图卷积层，而是给出“何时不该融合”的可识别条件与无标签诊断信号。它更依赖图学习与优化基础，需要落实指导条件后再投入。',
    limits:
      '需要系统地补线性代数、谱聚类、图学习和优化，现有软件工程经验不会自动覆盖这些。无标签条件下“哪个结果更正确”并非无条件可识别，必须交代假设；如果最终贡献只剩几个损失项叠加，不建议作为冲击 A 类期刊的主线。',
    openQuestions: [
      '如果不同视图支持不同但都自洽的聚类，没有标签时能否知道哪个更接近目标？需要哪些结构假设或少量可信配对？',
      '是否存在可观测信号，能在模型选择阶段识别融合有害？注意力权重和预测置信度不能自动当作校准后的可信度。',
      '能否对对象或子图选择融合、保留分歧或请求少量核验，而不是简单丢掉所有有差异的来源？',
    ],
    sources: [
      { label: 'CAMERA：社区感知多视图表征学习（作者稿）', url: 'https://xlearning-lab.com/assets/2026-TPAMI-Community-aware-Multi-view-Representation-Learning-with-Incomplete-Information.pdf', note: '缺失与未对齐恢复' },
      { label: 'OAGL：一步自适应图学习（TKDE 2025）', url: 'https://researchportal.northumbria.ac.uk/en/publications/one-step-adaptive-graph-learning-for-incomplete-multiview-subspac/', note: '不完整多视图子空间聚类' },
      { label: 'BRIDGE：完整与不完整深度多视图统一框架（ICCV 2025）', url: 'https://openaccess.thecvf.com/content/ICCV2025/html/Jiang_A_Unified_Framework_to_BRIDGE_Complete_and_Incomplete_Deep_Multi-View_ICCV_2025_paper.html', note: '非独立同分布缺失' },
    ],
    startRoute: [],
    archiveRoute: [
      { id: 'archive-graph-1', kind: 'paper', paperId: 'spectral-tutorial', stage: '建立问题', required: '选读', purpose: '补谱聚类与谱方法直觉（教程），为路线中的谱线索打底。', readWhen: '方向三第一篇，用来打底概念；不需要图神经网络背景。', check: '能说出谱聚类的主要步骤与它依赖的假设。' },
      { id: 'archive-graph-2', kind: 'paper', paperId: 'gcn', stage: '建立问题', required: '必读', purpose: '建立“融合”的机制图像：邻居聚合是消息传递的起点，有害融合就发生在这一步。', readWhen: '第二篇；谱直觉之后，先看固定权重的聚合。', check: '能说出 GCN 聚合权重由什么决定（当前只有摘要级判断）。' },
      { id: 'archive-graph-3', kind: 'paper', paperId: 'gat', stage: '建立问题', required: '选读', purpose: '看融合权重可学的版本：注意力给不同邻居不同权重——这既是对策也是风险入口。', readWhen: '第三篇；与 GCN 对照，理解“权重可学”改变了什么。', check: '能说出注意力权重与固定归一化的差异（当前只有摘要级判断）。' },
      { id: 'archive-graph-4', kind: 'paper', paperId: 'feature-propagation', stage: '建立问题', required: '必读', purpose: '把“部分观测”立起来：缺失特征如何被扩散式重建——补出来的东西何时可信正是本方向的问题。', readWhen: '第四篇；机制基础之后，建立“补”的问题定义。', check: '能复述扩散式重建的两步框架（当前只有摘要级判断）。' },
      { id: 'archive-graph-5', kind: 'paper', paperId: 'sure', stage: '理解方法', required: '选读', purpose: '看 CAMERA 直接对照的前作：不完整多视图聚类（CAMERA 参考条目 [13]，文中称 SURE）。', readWhen: '第五篇；先于 CAMERA 建立问题设定的来路。', check: '读完后能说出它与 CAMERA 在问题设定与方法上的承续关系（本条为入口；细节以原文为准）。' },
      { id: 'archive-graph-6', kind: 'paper', paperId: 'camera-incomplete-mv', stage: '理解方法', required: '必读', purpose: '看缺失与未对齐时融合如何出错与补救：补齐与对齐本身可能引入错误，这正是属性图有害融合识别要面对的问题（任务不同，问题相通）。', readWhen: '第六篇（路线中有正文整理的卡）；读完应能说明它与属性图有害融合识别的差异。', check: '能复述 SP/VP 定义、MAI/MAA 机制与两个社区概念，并用自己的话说明它为何不是有害融合的直接解法（整理者的分析）。' },
      { id: 'archive-graph-7', kind: 'paper', paperId: 'oagl', stage: '理解方法', required: '必读', purpose: '了解 TKDE 2025 的一步自适应图学习怎么处理不完整多视图子空间聚类，扩充“融合加缺失”的方法谱系。', readWhen: '第七篇；在 CAMERA 的补齐与对齐机制之上对照不同技术组合。', check: '能复述其四个技术要点（只依据摘要），并指出它们与 CAMERA 的差异在方法哪一层。' },
      { id: 'archive-graph-8', kind: 'paper', paperId: 'nettack', stage: '理解方法', required: '必读', purpose: '把“有害”形式化：对抗扰动证明少量不易察觉的坏边/坏特征就能显著拉低模型——有害信号注入的极端样本。', readWhen: '第八篇；缺失融合之后，看“有害”在对抗场景里的可计算定义。', check: '能说出不可察觉性约束保住的统计量（当前只有摘要级判断）。' },
      { id: 'archive-graph-9', kind: 'paper', paperId: 'metattack', stage: '理解方法', required: '选读', purpose: '看训练期污染：图结构被当超参数做元梯度投毒——“数据本身被污染”的最强版本。', readWhen: '第九篇；Nettack 的谱系延续，理解测试时与训练时攻击的差别。', check: '能说出投毒与逃逸攻击的目标差异（当前只有摘要级判断）。' },
      { id: 'archive-graph-10', kind: 'paper', paperId: 'gnnguard', stage: '理解方法', required: '必读', purpose: '看“识别并压低有害边”的可操作定义：边两端特征是否相容；方向三方法谱系的关键一环。', readWhen: '第十篇；攻击之后看防御，思考这种识别能否迁移到无攻击者的缺失/冲突场景。', check: '能复述邻居重要性估计与剪边的依据（当前只有摘要级判断）。' },
      { id: 'archive-graph-11', kind: 'paper', paperId: 'bridge', stage: '核查近期竞争', required: '必读', purpose: '了解 ICCV 2025 的统一框架怎么同时处理完整与不完整的深度多视图数据：两阶段迁移，再用域对抗应对非独立同分布缺失。', readWhen: '第十一篇收尾。', check: '能说出两阶段设计与域对抗各自应对什么（只有摘要级判断；未经正文核对）。' },
    ],
  },
];
