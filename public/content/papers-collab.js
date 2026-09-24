// public/content/papers-collab.js —— SCAFFOLD-008 主方向新增四张论文卡（008.2）+ PLAN-010 首批六张（2026-09-24）。
// 契约：docs/SCAFFOLD-008/02-curriculum.md（步2–5）、07-source-audit.md（定位与边界）、
//   docs/plans/PLAN-010-content-display-deepening.md 阶段 A；来源唯一准绳＝
//   docs/research/guidance-display-source-audit.md 最终版（§7 修订后）。
// - beyond-frameworks / memgpt / handoff-tax / handoff-debt，均为 quick（Tax/Debt 已核指定正文，mode=partial-text）；
// - PLAN-010 追加六张（尾部追加，旧 49 篇相对顺序不变）：综述 2 篇（survey-mem-tois / survey-comms-fcs，
//   均 standard、partial-text，为综述导学树树根）+ 近邻 4 篇（compression-cost / do-not-restart /
//   memcollab / routed-graph-handoff，均 quick、partial-text，HTML 全文节级提取，预印本统一标注）；
// - 数字与比较句均有正文定位（见各卡 coverage.sections）；不把摘要分类当完整条件列表；
// - Tax/Debt 按预印本身份写（arXiv v1 / v2），不推测录用；Beyond Frameworks 为 ACL 2025 会议论文；
// - 每篇新增卡带 auditRef（来源审计条目 id）；四篇近邻为预印本、未经同行评审，导读中统一按此强度对待；
// - 审计 §7 修订口径：RGH 的「40–60% 预算占比」无具体条件、不登记不转引；Tax 的 Compact_pre/suf 是
//   「谁做压缩」而非「发送/接收两端」；记忆评测缺口仅限综述写作时点（2024-04），不当 2026 现状。
// 本文件只是数据，不含任何本人进度。

export const COLLAB_PAPERS = [
  {
    id: 'beyond-frameworks',
    title: 'Beyond Frameworks: Unpacking Collaboration Strategies in Multi-Agent Systems',
    displayTitle: 'Beyond Frameworks：把协作拆成四个维度',
    url: 'https://aclanthology.org/2025.acl-long.1037/',
    type: 'survey',
    importance: 'relevant',
    difficulty: 'accessible',
    role: 'background',
    roleReason: '给主方向提供协作机制的维度词汇：治理、参与、交互、历史管理；不是跨 harness 实验证据。',
    recommendedDepth: 'standard',
    deliveredDepth: 'quick',
    lead: '把「多智能体协作」从框架名拆成治理、参与控制、交互动态、对话历史管理四个可操作维度，并在两个证据整合场景中量化各维度对准确率与开销的影响。',
    learner: {
      gist: '读前词汇：协作可拆成四个维度（§3.2–3.5）——谁决策＝治理（分散自组织 vs 集中 instructor 协调）；谁在哪轮发言＝参与控制（§3.3，如全员/择员/instructor 决定）；按什么顺序与对象交互＝交互动态（§3.4，I1 同时、I2 顺序、I3 随机顺序、I4 选择性点对点）；每轮看到什么历史＝历史管理（§3.5，含 C1「上一轮完整日志」）。论文把这些当作可分维度分别考察（编辑整理）：参与/协调的取法与历史表示的取法可以分开选择。',
      value: '主方向研究的是机制与表示的组合比较；先借这一篇建立维度词汇，避免「多一个框架名就是多一种方法」。',
      intent: '读摘要、引言与 §3.2–3.5 的维度定义即可；§4.1 只看两个证据整合场景怎么设置。目标是能任选一个维度说出「它改变了什么、其他什么要保持」，不要求背全配置组合。',
    },
    reasons: [
      '框架级综述常停在「有哪些架构」；这篇把协作策略拆到维度级，正好接上主方向「机制与表示组合」的问法。',
      '历史管理维度（§3.5，每轮看到什么历史）直接对应跨工具时的信息表示问题。',
      '作者提出 Token-Accuracy Ratio（TAR）把质量与开销放在同一杆秤上，和预算意识一致。',
      '定义集中、可核对：四个维度分别落在 §3.2/§3.3/§3.4/§3.5 小节（2026-09-23 逐节复核），读完导读的四层划分后拿它补「机制内部」的词汇。',
    ],
    questions: [
      '四个维度各是什么？任选一个，说出它改变的是协作的哪一层。',
      '「谁发起下一轮」与「下一轮看到什么历史」分别属于哪个维度？',
      '§3.5 的三种对话历史策略里，C1「上一轮完整日志」为什么不算「整个任务的完整轨迹」？它的代价是什么？',
      '这篇的实验场景是什么？为什么不能把它读成跨商业 harness 的互通验证？',
    ],
    deepRead: [],
    guidedReading: {
      terms: [
        { term: '治理（governance）', note: '谁决策：集中 instructor 协调 vs 分散自组织（§3.2）。' },
        { term: '参与控制', note: '谁在哪轮发言：全员/择员/instructor 决定（§3.3）。' },
        { term: '交互动态', note: 'I1 同时 / I2 顺序 / I3 随机顺序 / I4 选择性点对点（§3.4）。' },
        { term: '历史管理', note: '每轮看到什么历史：C1 上一轮完整日志（仅最近一轮，不是整个任务的完整轨迹）等（§3.5）。' },
        { term: 'TAR（Token-Accuracy Ratio）', note: '质量与开销同一杆秤的指标；预算意识的现成表述。' },
      ],
      preQuestions: [
        '四个维度各是什么？任选一个，说出它改变的是协作的哪一层。',
        '「谁发起下一轮」与「下一轮看到什么历史」分别属于哪个维度？',
        '为什么这篇的 DEI/SES 实验场景不能读成跨商业 harness 的互通验证？',
      ],
      locate: [
        { target: '四个维度定义', where: '§3.2（治理）/ §3.3（参与）/ §3.4（交互）/ §3.5（历史管理）', note: '2026-09-23 逐节复核（009-A）；§4.1 两场景为 DEI 与 SES。' },
      ],
      explainBlocks: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '实际讲解：维度词汇怎么用。' },
            { kind: 'text', text: '「协作机制」这个词太大，直接比较会退化成框架名排名。本篇的用法是先把任何一个协作系统填进四个格子：谁决策、谁发言、按什么顺序交互、每轮看到什么历史。填完格子再做比较，问题就从「A 框架和 B 框架谁好」变成「在历史管理这一维上，C1 完整日志和 instructor 摘要各自适合什么」。主方向研究机制与表示的组合，恰好需要这种可点名的词汇：Tax 的四种轨迹处理条件，落在历史管理维；Routed Graph Handoff 的类型化依赖图，落在治理与交互维。读完这篇应能做的事：给任何一篇多智能体论文标出它的四个维度取值，并指出哪个维度是它的真正贡献。' },
          ],
        },
      ],
    },
    readingActions: {
      preserve: [
        { target: '摘要、引言与 §3 的四个维度定义', why: '这是本篇的地图，也是主方向的词汇表。' },
      ],
      explain: [
        {
          target: '「谁发起下一轮」与「下一轮看到什么历史」的区分',
          why: '编辑例子：一句话分清「协调」与「表示」两个维度。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '（编辑举例）「谁发起下一轮」是参与控制与治理的问题——集中式由 instructor 点名，分散式由各 Agent 自决；「下一轮看到什么历史」是历史管理的问题——可能是上一轮完整日志（§3.5 的 Full Log of the Last Round，仅指最近一轮，不是整个任务的完整轨迹）、自我摘要，或 instructor 统一摘要。两个选择相互独立：同一套点名规则可以配不同的历史表示。' },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: '穷举的配置组合与榜单', why: '起步只需维度词汇；具体配置排名不进入本期读法。' },
        { target: '框架 API 与实现细节', why: '本卡只取维度定义，不学习任何框架用法。' },
      ],
    },
    coverage: {
      mode: 'partial-text',
      basis: 'ACL Anthology 官方页（身份 long.1037、21361–21375、作者与摘要四维度）＋ arXiv HTML 版 §3（3.2 治理 / 3.3 参与 / 3.4 交互模式 / 3.5 上下文管理）维度定义、§4.1 场景说明与 Limitations；2026-09-23（009-A）逐节复核，§4.1 两场景核实为 DEI（MIMIC-III 出院去向预测）与 SES（证据基事实核查）。',
      version: 'ACL 2025（2025.acl-long.1037，21361–21375）/ arXiv:2505.12467v1（2025-05-18）',
      sections: ['摘要', '引言', '§3.2 治理', '§3.3 参与', '§3.4 交互模式', '§3.5 上下文/历史管理', '§4.1 实验场景（DEI/SES）', 'Limitations'],
      limitations: '未核图像与表格数值；§3.5 的 Full Log of the Last Round 指上一轮完整对话，不可理解为整个任务的完整轨迹；两个实验场景（DEI/SES）为单框架内的证据整合任务，非跨 harness 设置；摘要中的维度取值偏好不自动等于跨工具结论。',
      checkedAt: '2026-09-23',
    },
    sections: [],
  },
  {
    id: 'memgpt',
    title: 'MemGPT: Towards LLMs as Operating Systems',
    displayTitle: 'MemGPT：把上下文窗口看成内存',
    url: 'https://arxiv.org/abs/2310.08560',
    type: 'system',
    importance: 'relevant',
    difficulty: 'needs_background',
    role: 'background',
    roleReason: '长期记忆机制的具体机制例子：主方向把「记忆」列为候选机制，需要一篇能落地机制直觉的论文。',
    recommendedDepth: 'standard',
    deliveredDepth: 'quick',
    lead: '把 LLM 的上下文窗口当作有限工作内存、外部存储当作磁盘，由控制流（函数调用）在两者之间搬运信息，从而在固定窗口模型上制造「无限上下文」的假象。',
    learner: {
      gist: '主上下文（这一轮真正送给模型的 token）与外部上下文（窗口外的存储）由控制流管理：LLM 通过函数调用自己决定何时把信息换出、写入、检索回窗口。',
      value: '补上「长期记忆」这一候选机制：存下来的东西不会自动进入下一位 Agent 的输入，写入与读回都需要策略。',
      intent: '读摘要、引言与 §2 方法概述（§2.1 主上下文的三段构成、§2.2 队列管理器与换出、§2.3 函数执行器、§2.4 控制流与函数链）；目标是能说出「谁决定写入、谁决定读回」，不为记忆方案下优劣结论。',
    },
    reasons: [
      '主方向把记忆与检索列为候选表示通道；MemGPT 是这条通道上机制讲得最清楚的入口。',
      '「存下来 ≠ 这一轮可见」正是导读里强调的预算意识的最小机制例子。',
      '单 Agent 的上下文管理例子，顺手为技术路线「多智能体架构」的状态/检查点单元打底。',
    ],
    questions: [
      '主上下文与外部上下文各指什么？信息从外部上下文进入主上下文要经过谁？',
      '队列管理与换出（eviction）在主上下文满时起什么作用？',
      '为什么这个单 Agent 例子不能当作跨 harness 或多 Agent 长期协作的效果证据？',
    ],
    deepRead: [],
    guidedReading: {
      terms: [
        { term: '主上下文', note: '这一轮真正送给模型的 token：系统指令＋固定工作上下文＋FIFO 消息队列（§2.1）。' },
        { term: '外部上下文', note: '窗口外的存储；换出的消息经递归摘要归档到这里（§2.2）。' },
        { term: '队列管理器', note: '告警阈值提醒 LLM 保存关键信息、溢出阈值换出并摘要（§2.2）。' },
        { term: '函数执行器与控制流', note: '把 LLM 补全解释为函数调用，可用关键字连做几步检索（§2.3–2.4）。' },
      ],
      preQuestions: [
        '主上下文与外部上下文各指什么？信息从外部进入主上下文要经过谁？',
        '换出（eviction）在主上下文满时起什么作用？',
        '为什么这个单 Agent 例子不能当作跨 harness 长期协作的效果证据？',
      ],
      locate: [
        { target: '方法概述', where: '§2.1 主上下文 / §2.2 队列管理器 / §2.3 函数执行器 / §2.4 控制流与函数链', note: '2026-09-23 逐小节复核（009-A）；未读实验章节，不引用任何分数。' },
      ],
      explainBlocks: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '实际讲解：「存下来 ≠ 这一轮输入」的最小完整例子。' },
            { kind: 'text', text: 'MemGPT 的机制值得逐层拆开看，因为它是「记忆」这个候选机制里控制流讲得最清楚的一篇。第一层是分界：模型永远只看主上下文，外部存储里的东西不读回就永远进不了这一轮输入。第二层是策略：什么时候写、什么时候读，不是系统规定死的，而是 LLM 通过函数调用自己发起的——这意味着记忆的效果依赖「策略执行得对不对」，不是「存了就有」。第三层是成本：换出要做递归摘要，读回要发起检索，两者都烧 token——这正是 Compression Cost 那篇在运行中实测的账。把这三层记牢，再读任何「我们的 Agent 有长期记忆」的论文，都可以先问：它的分界在哪、策略谁定、成本记没记。' },
          ],
        },
      ],
    },
    readingActions: {
      preserve: [
        { target: '主/外部上下文之分与控制流（§2.1–2.4）', why: '这是「记忆 ≠ 这一轮输入」的机制落点。' },
      ],
      explain: [
        {
          target: '一条任务线索移出窗口、随后再取回的过程',
          why: '编辑示意：只用已核方法概述（§2.1–2.4），不编造实验分数。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '（编辑示意）主上下文（§2.1：系统指令＋固定工作上下文＋FIFO 消息队列）接近容量时，队列管理器（§2.2）在告警阈值提醒 LLM 保存关键信息、在溢出阈值把较早消息换出并做递归摘要归档到外部存储；之后当新问题需要旧信息时，函数执行器（§2.3）把 LLM 生成的补全解释为函数调用，经控制流与函数链（§2.4，可用即时续推的关键字连做几步检索）把相关内容读回主上下文。要点是：搬运由控制流按策略执行、由 LLM 自主发起，不是「模型自己记得」；外部存储里的一切，不读回就永远不会出现在这一轮输入里。' },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: 'Letta 产品、API 全表与部署文档', why: '起步只需机制直觉，不学产品用法。' },
        { target: '与操作系统概念的逐条类比', why: '类比帮助直觉即可，逐条对应不是本期目标。' },
      ],
    },
    coverage: {
      mode: 'partial-text',
      basis: 'arXiv HTML 版 v2 的摘要、引言与 §2 方法概述；2026-09-23（009-A）逐小节复核：§2.1 主上下文（系统指令/工作上下文/FIFO 队列）、§2.2 队列管理器（告警与溢出阈值、换出后递归摘要）、§2.3 函数执行器（补全解释为函数调用）、§2.4 控制流与函数链（LLM 自主发起检索）。',
      version: 'arXiv:2310.08560 v2（2024-02-12；v1 2023-10-12）',
      sections: ['摘要', '引言', '§2.1 主上下文', '§2.2 队列管理器', '§2.3 函数执行器', '§2.4 控制流与函数链'],
      limitations: '图像未核，不列图号；未读实验章节，不引用任何分数；单 Agent 上下文管理，不是跨 harness 或长期多 Agent 协作证据。',
      checkedAt: '2026-09-23',
    },
    sections: [],
  },
  {
    id: 'handoff-tax',
    title: 'The Handoff Tax: Continuing Non-Native Trajectories in LLM Agents',
    displayTitle: '换手税：接着别人的轨迹往下干',
    url: 'https://arxiv.org/abs/2608.24358',
    type: 'evaluation',
    importance: 'core',
    difficulty: 'challenging',
    role: 'frontier',
    roleReason: '主方向最直接的对照窗口：异构模型组合下，交接表示的选择随换手方向反转；但其设置为同一 mini-swe-agent 脚手架，不是商业 harness 实测。',
    recommendedDepth: 'standard',
    deliveredDepth: 'quick',
    lead: '在 SWE-bench Verified 的 coding 设置中，让弱/强模型中途互换手：保留仓库现场，只改变传给接收方的轨迹信息；升配与降配呈现相反的权衡，「换手税」随方向变化。',
    learner: {
      gist: '模型接续非自己产生的轨迹（non-native trajectory）时，继承的轨迹既可能帮忙也可能带偏；在不同的轨迹处理条件下，升配（弱→强）与降配（强→弱）的最优界面相反。',
      value: '直接打破「多传信息总更好」：升配时丢掉弱模型轨迹反而更接近重开质量，降配时保留强模型轨迹反而划算——界面偏好随方向变化。',
      intent: '带着三个对照轴读 §3/§4：方向（升/降）、时机（步数百分位）、界面（Raw / Compact_pre / Compact_suf / Traj-drop）；读数字时盯设置，不盯广告句。',
    },
    reasons: [
      '主方向问「哪种机制/表示组合在什么条件下更合适」；这篇给出最具体的条件化对照：方向改变，合适的交接界面跟着改变。',
      '四种轨迹处理条件（Raw、Compact_pre、Compact_suf、Traj-drop）是「表示层」比较的现成设计。',
      '它的指标把质量恢复与成本放在一起，直接呼应输入/输出预算意识。',
    ],
    questions: [
      'non-native trajectory 的定义是什么？接收方继承了什么、没继承什么？',
      '四个轨迹处理条件各传了什么？（注意：摘要把压缩合并成大类，正文 §3.1 是两种不同压缩）',
      '升配与降配各自的「划算界面」为什么相反？这依赖哪些设置条件？',
      '这篇的结论不能外推到哪里？（模型对数、台子、单轮换手、非商业 harness）',
    ],
    deepRead: [],
    guidedReading: {
      terms: [
        { term: 'non-native trajectory', note: '接收方接续的不是自己产生的轨迹；继承的轨迹既可能帮忙也可能带偏（§3 问题定义）。' },
        { term: '换手方向（升配/降配）', note: '弱→强为升配，强→弱为降配；界面优劣随方向反转的核心变量（§4）。' },
        { term: 'QRec / CSRet', note: '质量恢复与成本保留：两个指标分开看，恢复多不一定省，省也不一定恢复多（§4）。' },
        { term: 'Raw / Compact_pre / Compact_suf / Traj-drop', note: '四种轨迹处理条件：都是交接时刻的摘要注入（push），说明「谁做压缩」，不构成交接 vs 主动获取两端（审计 §7 修订口径）。' },
      ],
      preQuestions: [
        '四个轨迹处理条件各传了什么？Compact_pre 与 Compact_suf 的「谁做压缩」差别是什么？',
        '升配与降配各自的「划算界面」为什么相反？',
        'hard 子集 N≈24 与每配置单轮运行，对结论强度各有什么限制？',
      ],
      locate: [
        { target: '问题定义与四条件', where: '§3（含 §3.1 四条件与切换点）', note: '2026-09-23 对 arXiv:2608.24358v1 复核（009-A）。' },
        { target: '方向相关结果', where: '§4', note: 'QRec 升配 Raw≈47%/36%、Traj-drop≈64%/84%；降配 CSRet Claude 对≈80%、GPT 对≈14%；数字均带模型对条件，非通用比例。' },
      ],
      explainBlocks: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '实际讲解：方向依赖为什么这么重要。' },
            { kind: 'text', text: '「多传信息总更好」的直觉在这里被精确地证伪了，而且是以一种值得记住的方式：升配时丢掉弱模型的轨迹反而更接近「强模型从头干」的质量（Traj-drop QRec 反而更高），因为弱模型的中间推理对强者是噪声；降配时保留强模型的轨迹反而划算（Claude 对 Raw 保留约 80% 成本优势），因为弱者需要前人推理当脚手架。同一个界面，换一对手就翻转——所以「哪种表示好」永远不是一个无条件问题，而是「哪对模型、哪个方向」的条件问题。这也是审计修订后强调的读法：Compact_pre 是前任自压摘要，Compact_suf 是继任自读自写，两者都是交接时刻的 push；Tax 没有接收方运行时主动获取的条件，那一侧的证据要看 Compression Cost 的 re-query。读数字时记住 hard 子集只有约 24 条、每配置单轮运行，这些是探索性结果，不当定论引用。' },
          ],
        },
      ],
    },
    readingActions: {
      preserve: [
        { target: '问题定义（non-native trajectory）与 §3 协议的四个条件', why: '这是全篇的对照骨架：方向 × 时机 × 界面。' },
        { target: '「界面偏好随方向反转」的实验含义（§4）', why: '主方向的核心问题意识就从这一反转开始。' },
      ],
      explain: [
        {
          target: '质量恢复与成本保留各在回答什么',
          why: '先借概念读懂数字，再看具体值（依据 §4 正文叙述）。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '质量恢复回答：「接着弱模型的轨迹往下干，比弱模型自己干到底好多少、距离强模型从头干有多好」——正文报告升配 Raw 只恢复了 HC 质量优势的一部分（Claude 对 QRec≈47%，GPT 对 QRec≈36%），而 Traj-drop 反而恢复更多（QRec≈64% / 84%）。成本保留回答：「换来这份质量要付多少」——Claude 下降配时 Raw 保留了约 80% 的成本优势。两个指标分开看：恢复多不一定省，省也不一定恢复多，这正是「输入/输出两本账」的实例。' },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: '模型昵称对照与附录超参', why: '记住 LC/HC 两个角色即可，名单背诵无助于理解机制。' },
        { target: '非 coding 的任务扩展细节', why: '起步只读主 coding 设置；§5 扩展知道存在即可。' },
      ],
    },
    coverage: {
      mode: 'partial-text',
      basis: 'arXiv HTML 版 v1：摘要、§3 实验框架（含 §3.1 四条件与切换点）、§4 方向相关结果与局限、附录 A 设置；2026-09-23（009-A）复核 §3 四条件与「同 mini-swe-agent 脚手架」、§4 的 QRec（升配 Raw≈47%/36%、Traj-drop≈64%/84%）、降配 CSRet 分模型对（Claude 对≈80%、GPT 对≈14%，非单一无条件数字）与 hard 子集 N≈24 探索性口径。',
      version: 'arXiv:2608.24358 v1（2026-08-25），Ganz, Nacson, Kalyanpur, Litman',
      sections: ['摘要', '§3 实验框架', '§4 方向相关结果', '局限（§6/附录A）'],
      limitations: '主实验为 SWE-bench Verified + 同一 mini-swe-agent 脚手架/工具/提示，两对模型；切换点按起始模型步数分布预设； hard 子集小（约 24 条）属探索性；每配置单轮运行无重复方差；美元成本结论依赖供应商定价与缓存命中率。不是 Cursor/Codex 等独立商业 harness 之间的搬迁验证。',
      checkedAt: '2026-09-23',
    },
    sections: [],
  },
  {
    id: 'handoff-debt',
    title: 'Handoff Debt: The Rediscovery Cost When Coding Agents Take Over Interrupted Tasks',
    displayTitle: '换手债：下一任要重新发现多少',
    url: 'https://arxiv.org/abs/2606.02875',
    type: 'evaluation',
    importance: 'core',
    difficulty: 'challenging',
    role: 'frontier',
    roleReason: '给「共享区里放什么」四个可点名 baseline（仓库/原始轨迹/摘要笔记/结构化笔记），并把效率与解出率分开度量；设置有运行时边界，不写成格式排名。',
    recommendedDepth: 'standard',
    deliveredDepth: 'quick',
    lead: '在中断点冻结仓库，让后任在四种交接视图（仅仓库 / 原始轨迹 / 摘要笔记 / 结构化笔记）下接续任务，量化「重新发现成本」：操作数、累计输入 token、是否解出是三本要分开看的账。',
    learner: {
      gist: '后任接手时看到的信息越多不一定越省：原始轨迹初始输入长得多，操作数普遍更少，但累计输入 token 的优劣随接收模型而变；结构化笔记不自动优于原始轨迹，反过来也不成立。',
      value: '让「下一任有没有接上」从印象变成可讨论的指标——并且示范了比较时必须连同预算口径一起看。',
      intent: '能列出四视图，并分别说出「效率」（事件数、累计 token）与「是否解出」在比什么；理解这不是等输入预算下的格式排名。',
    },
    reasons: [
      '四个视图正是主方向「表示层」候选的具体化：仓库工件、raw trace、summary、structured packet。',
      '它把事件数、累计输入 token、初始长度、解出率分开报告，是预算记账意识的直接教材。',
      '与 Tax 同用软件修复任务，两篇合读能看清「换手」问题的两个切片：能力不对称协作 vs 中断接管。',
    ],
    questions: [
      '四种交接视图各传什么？冻结的是什么、没冻结的是什么？',
      '「操作更少」与「累计输入 token 更省」为什么可能给出相反结论？（想想 Qwen 后任与 Gemma/Devstral 后任的差异）',
      '为什么说这不是等输入预算下的比较？初始字符长度为什么不能当 token？',
      '单轮运行与 75 任务池对结论强度有什么限制？',
    ],
    deepRead: [],
    guidedReading: {
      terms: [
        { term: 'handoff debt（重新发现成本）', note: '后任接手后为多走路程重新探查而付出的操作与 token 成本。' },
        { term: '四视图', note: '仅仓库 / 原始轨迹 / 摘要笔记 / 结构化笔记——「共享区里放什么」的四个 baseline（§5）。' },
        { term: '分账度量', note: '事件数、累计输入 token、初始长度、解出率分开报告，不可互换（§5.1 表2）。' },
        { term: '非等输入预算比较', note: '四视图初始长度差一个量级（raw 约 87k 字符 vs 约 7–10k），不是同额度下的格式排名。' },
      ],
      preQuestions: [
        '冻结的是什么、没冻结的是什么？后任在四种视图下各看到什么？',
        '「操作更少」与「累计输入 token 更省」为什么给出过相反结论？',
        '为什么初始字符长度不能当 token 数？',
      ],
      locate: [
        { target: '四视图与运行环境', where: '§4.3 运行环境、§5 四视图定义', note: '2026-09-23 对 arXiv:2606.02875v2 复核（009-A）。' },
        { target: '分账数字', where: '§5.1 表2、§5.3 初始长度', note: '表2：Qwen 后任笔记 602k vs 原始 811k；Gemma 300k vs 319k；Devstral 1.66M vs 2.30M。§5.3：raw 约 87k 字符 vs 仅仓库 7.2k / 笔记约 10k。' },
      ],
      explainBlocks: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '实际讲解：为什么要「分开记账」。' },
            { kind: 'text', text: '这篇的方法贡献不只在四视图，更在度量纪律。原始轨迹让后任少走弯路（事件数少），但那份 87k 字符的材料每一轮都在累计输入里重复计费；表 2 里 Qwen 后任用笔记更省（602k vs 811k），Gemma 与 Devstral 后任却是原始轨迹更省。如果只看事件数或只看累计 token，都会讲出一个「哪种格式最优」的假结论——正确读法是：表示的收益随接收模型而变，先定记账口径，再谈划不划算。读任何交接/压缩/记忆论文时这套纪律都适用：初始一次性成本与运行中累计成本是两本账，完成率只是第三本。' },
          ],
        },
      ],
    },
    readingActions: {
      preserve: [
        { target: '四视图定义与 handoff debt（重新发现成本）的含义', why: '主方向表示层比较的四个 baseline 全在这里。' },
        { target: '「效率 ≠ 解出率」：事件数、累计输入 token、解出率分开看', why: '这是读一切交接比较的第一纪律。' },
      ],
      explain: [
        {
          target: '同一输入更长的方案为何可能减少操作却增加累计消耗',
          why: '依据 §5.1 表2 与 §5.3 已核内容解释，不杜撰统一排名。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '原始轨迹把前任的完整事件流贴进初始上下文（§5.3：初始提示字符数中位数约 87k，而仅仓库约 7.2k、两类笔记约 10k），后任因此少走弯路、事件数普遍更少；但那份长材料每一轮都在累计输入里重复计费。表 2 里 Qwen 后任是笔记更省（摘要笔记累计 602k vs 原始 811k），Gemma 与 Devstral 后任却是原始更省（300k vs 约 317–319k；1.66M vs 2.30M）。所以「操作更少」推不出「token 更省」，两者要分开记账——这正是导读说的两本账。' },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: '结构化笔记的字段清单', why: '字段设计留给以后真有笔记需求时再精读。' },
        { target: '后任模型名单背诵', why: '记住「结果随接收模型而变」这一事实即可。' },
      ],
    },
    coverage: {
      mode: 'partial-text',
      basis: 'arXiv HTML 版 v2：摘要/引言、§4.3 运行环境、§5.1 表2、§5.3 初始长度、§5.5 跨模型检查与局限；2026-09-23（009-A）复核表2 累计 prompt token 对比（Qwen 后任 602k/811k；Gemma 300k/319k；Devstral 1.66M/2.30M）、§5.3 初始提示字符中位（raw 87k vs 仅仓库 7.2k/摘要笔记 9.8k/结构化笔记 10.0k）、§4.3 Qwen 前任与 OpenHands 式环境、每交接点每视图单轮运行与 75 源任务局限。',
      version: 'arXiv:2606.02875 v2（末次修订 2026-08-30；v1 2026-06），Dipesh KC, Anjila Budathoki',
      sections: ['摘要/引言', '§4.3 运行环境', '§5.1 表2', '§5.3 初始长度', '§5.5 跨模型检查', '局限'],
      limitations: 'OpenHands 式运行时内结论；主研究每个交接点每视图单次运行；75 个 SWE-bench Verified 源任务；官方验证只覆盖补丁通过测试，不含可维护性；表 2 为 agent 事件数与累计 prompt token 两列口径、不可互换，§5.3 初始长度为字符口径不是 token，四视图不是等输入预算比较。不发布「哪种格式全面最优」的排名。',
      checkedAt: '2026-09-23',
    },
    sections: [],
  },

  // ---------- PLAN-010 阶段 A：综述 2 篇（standard，综述导学树树根；auditRef=来源审计 §1.1/§1.2） ----------
  {
    id: 'survey-mem-tois',
    auditRef: 'survey-mem-tois',
    title: 'A Survey on the Memory Mechanism of Large Language Model based Agents',
    displayTitle: '记忆机制综述：来源、形式、操作与评测四问',
    url: 'https://arxiv.org/abs/2404.13501',
    type: 'survey',
    importance: 'core',
    difficulty: 'needs_background',
    role: 'background',
    roleReason: '给主方向「记忆」候选机制提供有章节来源的方法树主干：记忆来源/形式/操作/评测四问框架（§5–§6，正文已核）；是站内记忆侧导学的骨架综述。',
    recommendedDepth: 'standard',
    deliveredDepth: 'standard',
    lead: '把 LLM Agent 的记忆机制拆成四个可分别回答的问题：记忆从哪来（§5.1）、以什么形式存（§5.2）、怎么被写入/管理/读出（§5.3）、以及如何评测（§6）；作者并在其写作时点指出记忆模块缺少专门基准（该判断限 2024-04，非 2026 现状）。',
    learner: {
      gist: '记忆不是「模型自己会记得」：这篇综述把记忆拆成来源（trial 内信息 / 跨 trial 经验 / 外部知识）、形式（文本：自然语言、结构化元组、数据库；参数：权重内化；文本侧再按完整交互/近期缓存/检索 top-K/外部知识区分存取）、操作（写＝投影原始观测、管理＝reflection/merging/forgetting、读＝相似度检索）与评测（直接 vs 间接）四问。',
      value: '主方向把记忆列为候选机制；这篇提供带章节坐标的词汇表，让「记忆何时有用、过期或传播错误」可以按层提问，而不是停在「要不要加记忆」.',
      intent: '读 §5.1–5.3 建方法树主干，§6 建立评测意识；引用「评测缺口」时一定带上作者写作时点（arXiv v1 2024-04）的限定，不当现状陈述。',
    },
    reasons: [
      '四问框架（来源/形式/操作/评测）每问都有已核章节坐标（§5.1/§5.2/§5.3/§6），可直接做站内记忆侧导学的骨架。',
      '「文本形式 vs 参数形式」「存取策略四分」正好接上主方向「表示层」的比较问法：存什么、怎么存、怎么取，是三个独立选择。',
      '评测一章（§6）把直接评测与间接评测分开，并记录了写作时点的基准缺口——这是读一切记忆论文的怀疑训练材料。',
      'TOIS 2025 正式发表（DOI 经 OpenAlex 核到刊名与年份；CCF 目录页核到 TOIS 列 A 类），综述身份可靠。',
    ],
    questions: [
      '四问各是什么？任选一个记忆系统（如 MemGPT），说出它在四问上的取值。',
      '「文本形式」内部的四种存取策略（完整交互/近期缓存/检索 top-K/外部知识）与主方向的「表示层」有什么关系？',
      '§6.3 说「尚无面向记忆模块本身的开源基准」——这句话为什么必须带写作时点限定？2026 年的现状是什么？',
      '这篇综述的覆盖边界在哪？（ar5iv 页面截断于 §7.4，§7.5–§9 只有目录级，不做节级指引）',
    ],
    deepRead: [
      '§5.1–5.3：四问框架正文，建方法树主干时逐节读（正文已核）。',
      '§6：评测分类与写作时点（2024-04）的基准缺口判断；引用须带时点限定（正文已核）。',
    ],
    readingActions: {
      preserve: [
        { target: '§5.1–5.3 四问框架', why: '站内记忆侧导学的骨架，后面每张记忆相关卡都挂回这四问。' },
        { target: '§6 直接评测与间接评测之分', why: '读一切记忆论文的评测意识来源。' },
      ],
      explain: [
        {
          target: '「存什么、怎么存、怎么取」是三件事',
          why: '编辑讲解：用站内已核机制把四问框架落到一张卡上（MemGPT §2.1–2.4 已核）。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '（编辑讲解）综述的四问可以叠在 MemGPT 一张卡上看：「存什么」＝来源与语义（哪些观测值得投影成记忆）；「怎么存」＝形式（MemGPT 把换出的消息递归摘要成文本存进外部存储，而不是微调进权重）；「怎么取」＝操作里的「读」（LLM 经函数调用发起检索，把相关内容读回主上下文）。三问各有独立选择，比如同样「存文本」，取法可以是完整交互回放，也可以是检索 top-K——成本与效果都不同。这正是主方向「机制与表示组合比较」在记忆侧的具体化。' },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: '§7.5–§9（截断部分）', why: '2026-09-24 审计只核到目录级；不做节级指引，补读原文前不引用其内容。' },
        { target: '逐篇被引论文', why: '起步只用四问框架，被引文献按需再追。' },
      ],
    },
    guidedReading: {
      terms: [
        { term: 'trial', note: '一次任务执行过程；「trial 内信息」与「跨 trial 经验」是记忆来源的两大类（§5.1）。' },
        { term: '记忆形式（文本 vs 参数）', note: '文本形式＝自然语言/结构化元组/数据库；参数形式＝权重内化；两者成本与可编辑性完全不同（§5.2）。' },
        { term: 'reflection / merging / forgetting', note: '记忆管理的三种操作：高层抽象、合并、遗忘（§5.3）。' },
        { term: '直接评测 vs 间接评测', note: '直接评记忆本身（coherence/rationality/correctness/F1）vs 借下游任务间接看记忆效果（§6）。' },
      ],
      preQuestions: [
        '这篇综述的四问框架是哪四问？各自落在哪一节？',
        '为什么说「记忆模块的评测缺口」必须带写作时点限定？',
        'MemGPT 在四问框架上的取值各是什么？',
      ],
      locate: [
        { target: '四问框架', where: '§5.1（来源）/ §5.2（形式）/ §5.3（操作）/ §6（评测）', note: '正文已核，可直接做导读骨架（来源审计 §1.3 第一行）。' },
        { target: '评测缺口判断', where: '§6.3 引文', note: '作者写作时点（arXiv v1 2024-04）的判断；2026 年已有 LoCoMo/LongMemEval/MemBench 等基准，引用必须带时点限定。' },
      ],
      explainBlocks: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '实际讲解：四问框架怎么用。' },
            { kind: 'text', text: '拿到任何一篇「我们的 Agent 有记忆」的论文，先按四问各填一格：记忆从哪来（人工写入/自动投影/外部知识库）、以什么形式存（自然语言段落/结构化元组/向量库/模型权重）、经过哪些操作（写入策略、是否做 reflection 或遗忘、读出是回放还是检索）、以及作者怎么评测（直接测记忆质量，还是只看下游任务涨了就算记忆有用）。四问里任何一问答不上来，「记忆带来提升」的主张就要打折。站内 MemGPT 卡是单智能体机制实例，Compression Cost 卡是「读回要计费」的反面教材，都能直接挂进这张四问表。' },
          ],
        },
      ],
    },
    surveyTree: {
      source: '以本篇 §5–§6 章节结构为骨架（TOIS 2025；arXiv v1 2024-04-21）。',
      note: '树节点＝综述章节主题；每节点附一句编辑解释与章节来源（可核查）；站内回链是编辑排定的阅读顺序，不是论文引用关系（PF-07）。',
      roots: [
        {
          id: 'tree-mem-source',
          title: '记忆从哪来（来源）',
          source: '§5.1',
          explain: '三类来源：trial 内信息（当前任务过程里产生的）、跨 trial 经验（历史任务积累的）、外部知识（人工或检索注入的）。来源决定记忆的可信边界：跨 trial 经验可能携带错误或过时的结论。',
          refs: [],
          children: [],
        },
        {
          id: 'tree-mem-form',
          title: '以什么形式存（形式）',
          source: '§5.2',
          explain: '文本形式（自然语言、结构化元组、数据库）vs 参数形式（权重内化）；文本侧再按存取策略分完整交互、近期缓存、检索 top-K、外部知识。形式决定成本结构与可检查性：文本可审计，参数不可直接查看。',
          refs: ['memgpt'],
          children: [
            {
              id: 'tree-mem-form-text',
              title: '文本形式：自然语言 / 结构化元组 / 数据库',
              source: '§5.2',
              explain: '站内实例：MemGPT 把换出的消息递归摘要成文本存入外部存储（§2.2 已核）；Handoff Debt 的「摘要笔记/结构化笔记」两视图也是文本形式的两种取值（§5.1 表2 已核）。',
              refs: ['memgpt', 'handoff-debt'],
              children: [],
            },
            {
              id: 'tree-mem-form-access',
              title: '存取策略：完整交互 / 近期缓存 / 检索 top-K / 外部知识',
              source: '§5.2',
              explain: '同样存文本，取法四分对应完全不同的输入预算：完整交互最贵但无损，检索 top-K 便宜但依赖检索质量——这正是主方向「获取及计费」轴的记忆侧对照。',
              refs: ['compression-cost'],
              children: [],
            },
          ],
        },
        {
          id: 'tree-mem-ops',
          title: '怎么写入、管理与读出（操作）',
          source: '§5.3',
          explain: '写＝把原始观测投影为记忆；管理＝reflection（高层抽象）/ merging（合并）/ forgetting（遗忘）；读＝相似度检索入库。操作层是「存下来的 ≠ 这一轮输入」的机制落点。',
          refs: ['memgpt'],
          children: [
            {
              id: 'tree-mem-ops-write',
              title: '写：谁决定投影什么',
              source: '§5.3',
              explain: '编辑对照：MemGPT 由 LLM 自主发起写入（§2.3–2.4 已核）；MemCollab 由最强模型对比轨迹后抽「推理不变量＋违规模式」入共享记忆（§2 已核）——写入者的能力直接影响记忆质量。',
              refs: ['memgpt', 'memcollab'],
              children: [],
            },
            {
              id: 'tree-mem-ops-read',
              title: '读：检索与再获取的成本',
              source: '§5.3',
              explain: '读出不是免费动作：Compression Cost 显示压缩丢掉的运行态要靠 re-query 循环再买回来，读回次数本身就是计费的一等公民指标。',
              refs: ['compression-cost'],
              children: [],
            },
          ],
        },
        {
          id: 'tree-mem-eval',
          title: '怎么评测（评测）',
          source: '§6',
          explain: '直接评测（主观 coherence/rationality；客观 correctness/F1/效率）vs 间接评测（对话、多源问答、长上下文应用等下游任务）。注意时点：作者在其写作时点（2024-04）指出尚无面向记忆模块本身的开源基准；2026 年已有 LoCoMo/LongMemEval/MemBench 等基准，引用该判断必须带时点限定。',
          refs: [],
          children: [],
        },
      ],
    },
    coverage: {
      mode: 'partial-text',
      basis: 'ar5iv HTML 正文至 §7.4（§7.5–§9 仅目录级，页面截断）；身份与发表信息：arXiv v1 2024-04-21、TOIS 2025，DOI 10.1145/3748302 经 OpenAlex 核到刊名/年份；CCF 归属：ccf.org.cn 目录页核到 TOIS 列 A 类（目录事实，非投稿推荐）。来源审计条目 id：survey-mem-tois（docs/research/guidance-display-source-audit.md §1.1/§1.2）。',
      version: 'arXiv:2404.13501 v1（2024-04-21）；TOIS 2025（DOI 10.1145/3748302）',
      sections: ['摘要/目录', '§5.1 记忆来源', '§5.2 记忆形式', '§5.3 记忆操作', '§6 评测（含 §6.3 基准缺口的时点限定判断）'],
      limitations: 'ar5iv 页面截断于 §7.4：§7.5–§9 仅目录级，不做节级指引；图像与表格未核；「尚无面向记忆模块本身的开源基准」为作者写作时点（arXiv v1 2024-04）的判断，2026 年已有 LoCoMo/LongMemEval/MemBench 等基准，不得当作现状陈述；§5–§6 之外的内容未读。',
      checkedAt: '2026-09-24',
    },
    sections: [
      {
        id: 'four-questions',
        heading: '四问框架：来源、形式、操作、评测',
        blocks: [
          {
            kind: 'paragraph',
            spans: [
              { kind: 'strong', text: '来源（§5.1）。' },
              { kind: 'text', text: '记忆内容来自三处：trial 内信息（本次任务过程）、跨 trial 经验（历史任务积累）、外部知识（人工或检索注入）。来源决定了记忆的可信边界——跨 trial 经验可能是错误结论或过时的做法，直接传给下一任会把错误一并传递。' },
            ],
          },
          {
            kind: 'paragraph',
            spans: [
              { kind: 'strong', text: '形式（§5.2）。' },
              { kind: 'text', text: '大分两类：文本形式（自然语言、结构化元组、数据库）与参数形式（把记忆内化进模型权重）。文本侧再按存取策略分：完整交互、近期缓存、检索 top-K、外部知识。形式决定成本结构与可检查性：文本可以审计和修改，参数形式不可直接查看；检索 top-K 便宜但依赖检索质量。' },
            ],
          },
          {
            kind: 'paragraph',
            spans: [
              { kind: 'strong', text: '操作（§5.3）。' },
              { kind: 'text', text: '三类操作：写（把原始观测投影为记忆）、管理（reflection 高层抽象、merging 合并、forgetting 遗忘）、读（相似度检索入库）。「存下来的 ≠ 当前输入」就落在操作层：写入与读回都需要策略执行，不是自动发生。' },
            ],
          },
        ],
      },
      {
        id: 'evaluation-time',
        heading: '评测与写作时点的限定',
        blocks: [
          {
            kind: 'paragraph',
            spans: [
              { kind: 'strong', text: '直接 vs 间接（§6）。' },
              { kind: 'text', text: '直接评测记忆本身：主观指标（coherence、rationality）与客观指标（correctness、F1、效率）；间接评测借下游任务观察记忆效果：对话、多源问答、长上下文应用等。间接评测涨分不自动等于记忆模块工作正常——提升可能来自更多输入或更多调用。' },
            ],
          },
          {
            kind: 'callout',
            tone: 'note',
            title: '时点限定（引用必读）',
            blocks: [
              {
                kind: 'paragraph',
                spans: [
                  { kind: 'text', text: '作者在其写作时点（arXiv v1 为 2024-04）指出「尚无面向记忆模块本身的开源基准」（§6.3 引文）。这是该版本时点的判断，不是 2026 年的现状：此后 LoCoMo、LongMemEval、MemBench 等记忆基准已出现（见 docs/research/agent-shared-state-handoff-learning-roadmap.md §8 索引）。本站引用该缺口时一律带时点限定。' },
                ],
              },
            ],
          },
          {
            kind: 'paragraph',
            spans: [
              { kind: 'text', text: '覆盖边界：ar5iv 页面截断于 §7.4，§7.5–§9 只有目录级；多智能体共享记忆（§7.5）在 2026-09-24 审计中未读正文，站内相关讨论只引用已核的近邻论文（MemCollab）与目录级标注。' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'survey-comms-fcs',
    auditRef: 'survey-comms-fcs',
    title: 'Beyond Self-Talk: A Communication-Centric Survey of LLM-Based Multi-Agent Systems',
    displayTitle: '通信视角综述：系统级与系统内部两个层面',
    url: 'https://arxiv.org/abs/2502.14321',
    type: 'survey',
    importance: 'relevant',
    difficulty: 'needs_background',
    role: 'background',
    roleReason: '给主方向「协作机制」提供通信两层面的分类骨架（架构/目标/协议 × 策略/范式/对象/内容）；与 Beyond Frameworks 的维度分解互补，「内容」维的显式/隐式之分直接接到表示层。',
    recommendedDepth: 'standard',
    deliveredDepth: 'standard',
    lead: '从「通信」视角拆解 LLM 多智能体系统：系统级通信看架构（flat/hierarchical/team/society/hybrid）、目标（合作/竞争/混合）与协议（MCP、A2A、ANP 等）；系统内部通信看策略（one-by-one/同时发言/带摘要的同时发言）、范式（消息传递/言语行为/黑板）、对象（自己/其他智能体/环境/人）与内容（显式 vs 隐式）。',
    learner: {
      gist: '两篇站内协作综述的分工：Beyond Frameworks 按治理/参与/交互/历史四维拆「协作内部结构」，本篇按「系统级 vs 系统内部」两个层面拆「通信」；本篇独有的「内容」维把通信内容分为显式（自然语言、代码、结构化数据）与隐式（行为反馈、环境信号），直接对应主方向的表示层问题。',
      value: '主方向问「传什么、谁决定传」；本篇给「内容」与「对象」两维的正式词汇，让通信成本与表示选择可以分开讨论。',
      intent: '读章节结构（§3/§4）建立两层面骨架；§4.4 内容分类只有框架级正文，深入前要补读原文；不要背协议名单（MCP/A2A/ANP 知道存在即可）。',
    },
    reasons: [
      '「显式内容（NL/代码/结构化数据）vs 隐式内容（行为反馈/环境信号）」是表示层比较的直接词汇来源，与 Handoff Tax 的 raw/compact/drop、Debt 的四视图可以对表。',
      '通信策略（§4.1：one-by-one / simultaneous-talk / simultaneous-talk-with-summarizer）对应「谁决定传取什么」轴的讨论。',
      '与 Beyond Frameworks 互补：一篇管协作内部分析维度，一篇管通信内容分类；两篇合读避免按框架名排名。',
      'FCS 已接收（arXiv 评论字段自注 + DOI 10.1007/s11704-026-50857-y 可解析；CCF 目录页核到 FCS 列 B 类，目录事实）。',
    ],
    questions: [
      '系统级通信与系统内部通信各包含哪几维？各维的定义举一个取值。',
      '「内容」维的显式与隐式之分，对应主方向表示层的哪个问题？',
      '本篇与 Beyond Frameworks 的分工是什么？哪一篇管「历史/表示」，哪一篇管「内容分类」？',
      '§4.4 内容分类的覆盖边界是什么？（框架级正文，深入需补读）',
    ],
    deepRead: [
      '§3.1 架构 / §3.3 协议：系统级骨架（框架级已核，协议名单不必背）。',
      '§4.1 策略 / §4.2 范式 / §4.4 内容分类：内部通信三维度（§4.4 为框架级，深入需补读原文）。',
    ],
    readingActions: {
      preserve: [
        { target: '两层面框架（§3 系统级 / §4 系统内部）', why: '协作侧导学的骨架，与 Beyond Frameworks 四维对照使用。' },
        { target: '内容维的显式/隐式之分（§4.4）', why: '表示层比较的直接词汇。' },
      ],
      explain: [
        {
          target: '通信两层面与 Beyond Frameworks 四维的对照',
          why: '编辑讲解：两篇综述怎么分工使用。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '（编辑讲解）Beyond Frameworks 问「协作内部怎么组织」：谁决策（治理）、谁发言（参与）、按什么顺序交互（交互）、每轮看到什么历史（历史管理）。本篇问「智能体之间怎么通信」：在什么架构下（系统级）、用什么策略与范式、向谁、传什么内容。读论文时的用法：先用 Beyond Frameworks 的四维定位「机制」层，再用本篇的「内容」维定位「表示」层——比如 Handoff Tax 的四种轨迹处理条件，落在本篇的框架里就是「内容＝显式自然语言（结构化程度不同）」，落在 Beyond Frameworks 的框架里就是「历史管理维的不同取值」。两个坐标系叠用，比较才不会变成框架名堆砌。' },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: '协议实现细节（MCP/A2A/ANP）', why: '起步只需知道协议名单存在；传输层实现是工程问题，不是本期读法。' },
        { target: '§4.4 之后的深入分类', why: '框架级正文未支撑节级指引，补读原文前不引用。' },
      ],
    },
    guidedReading: {
      terms: [
        { term: '系统级 vs 系统内部通信', note: '前者看架构/目标/协议（§3），后者看策略/范式/对象/内容（§4）——两个层面别混。' },
        { term: '通信策略', note: 'one-by-one / simultaneous-talk / simultaneous-talk-with-summarizer（§4.1），对应「谁何时发言」。' },
        { term: '黑板范式', note: 'system 内部通信范式之一（§4.2）：共享工作区，各智能体读写——与「共享状态」候选机制同构。' },
        { term: '显式 vs 隐式内容', note: '显式＝自然语言、代码、结构化数据；隐式＝行为反馈、环境信号（§4.4，框架级）。' },
      ],
      preQuestions: [
        '通信两层面各含哪几维？「内容」维为什么直接对应主方向的表示层？',
        '黑板范式与「共享状态」候选机制是什么关系？',
        '本篇与 Beyond Frameworks 各管什么？怎么叠用？',
      ],
      locate: [
        { target: '两层面框架', where: '§3（系统级）/ §4（系统内部）', note: '章节结构已核（arXiv HTML v3）；§4.4 内容分类仅框架级正文，深入需补读（来源审计 §1.3 第二行）。' },
        { target: '内容维分类', where: '§4.4', note: '框架级正文：显式（NL/代码/结构化数据）vs 隐式（行为反馈/环境信号）。' },
      ],
      explainBlocks: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '实际讲解：用「内容」维重读站内换手论文。' },
            { kind: 'text', text: '把 Handoff Debt 的四视图放进本篇的「内容」维：仅仓库视图接近「隐式内容＋环境信号」（后任自己从工作区推断），原始轨迹/摘要笔记/结构化笔记是三种显式程度不同的内容。把 Routed Graph Handoff 放进来：它的类型化依赖图是「结构化数据」内容，约 155 token 的路由决定是「谁决定传什么」的机制答案——默认保守回退自然语言，说明选择器缺能力时内容维会退回最贵的取值。这一维读熟了，主方向四轴里的「保存什么语义」就有了现成词汇。' },
          ],
        },
      ],
    },
    surveyTree: {
      source: '以本篇 §3–§4 章节结构为骨架（Frontiers of Computer Science 接收；arXiv v1 2025-02-20 / v3 2026-05-26）。',
      note: '树节点＝综述章节主题；每节点附一句编辑解释与章节来源；站内回链是编辑排定的阅读顺序，不是论文引用关系（PF-07）。§4.4 内容分类仅框架级正文，节点注明边界。',
      roots: [
        {
          id: 'tree-comms-sys',
          title: '系统级通信（§3）',
          source: '§3.1/§3.3',
          explain: '三个维度：架构（flat / hierarchical / team / society / hybrid）、目标（cooperation / competition / mixed）、协议（MCP、A2A、ANP 等）。系统级回答「在什么组织结构下通信」，不回答「传什么」。',
          refs: ['beyond-frameworks'],
          children: [
            {
              id: 'tree-comms-sys-arch',
              title: '架构五取值',
              source: '§3.1',
              explain: 'flat（全对等）到 society（社会分工）五档；Beyond Frameworks 的治理维（集中 instructor vs 分散自组织）是它的一个投影——两个分类在「谁协调」上重叠但不同源，引用时各归各。',
              refs: ['beyond-frameworks'],
              children: [],
            },
          ],
        },
        {
          id: 'tree-comms-inner',
          title: '系统内部通信（§4）',
          source: '§4.1/§4.2/§4.4',
          explain: '四个维度：策略（one-by-one / simultaneous-talk / simultaneous-talk-with-summarizer）、范式（message passing / speech act / blackboard）、对象（self / other agents / environment / human）、内容（显式 vs 隐式）。内部通信回答「每轮具体怎么传」。',
          refs: [],
          children: [
            {
              id: 'tree-comms-inner-content',
              title: '内容：显式 vs 隐式',
              source: '§4.4（框架级）',
              explain: '显式内容＝自然语言、代码、结构化数据；隐式内容＝行为反馈、环境信号。主方向表示层的直接词汇：Tax 的 raw/compact/drop、Debt 的四视图都是「显式内容」的不同结构化程度。本条仅框架级正文，深入需补读原文。',
              refs: ['handoff-tax', 'handoff-debt', 'routed-graph-handoff'],
              children: [],
            },
            {
              id: 'tree-comms-inner-strategy',
              title: '策略：谁何时发言',
              source: '§4.1',
              explain: 'one-by-one / simultaneous-talk / simultaneous-talk-with-summarizer；对应四轴「谁决定传取什么」的机制侧——RGH 的路由器就是这一维的自动取值器（缺能力时保守回退自然语言）。',
              refs: ['routed-graph-handoff'],
              children: [],
            },
            {
              id: 'tree-comms-inner-blackboard',
              title: '范式：消息传递 / 言语行为 / 黑板',
              source: '§4.2',
              explain: '黑板＝共享工作区范式，与「共享状态」候选机制同构：信息放在公共区，由各智能体按需读写——「状态保存在哪里」轴的范式级答案。',
              refs: ['memgpt'],
              children: [],
            },
          ],
        },
      ],
    },
    coverage: {
      mode: 'partial-text',
      basis: 'arXiv HTML v3 章节结构（§1–§6）+ §4 部分内容（框架级）；发表信息：arXiv 评论字段自注 FCS 接收 + DOI 10.1007/s11704-026-50857-y 可解析；CCF 归属：ccf.org.cn 目录页核到 FCS 列 B 类（目录事实）。来源审计条目 id：survey-comms-fcs（docs/research/guidance-display-source-audit.md §1.1/§1.2）。',
      version: 'arXiv:2502.14321 v1（2025-02-20）/ v3（2026-05-26）；Frontiers of Computer Science 接收',
      sections: ['章节结构（§1–§6）', '§3 系统级通信（框架级）', '§4.1 策略 / §4.2 范式 / §4.4 内容分类（框架级）'],
      limitations: '§4.4 内容分类只有框架级正文，深入需补读原文；未核图像与表格数值；协议名单（MCP/A2A/ANP）只核到目录级提及；FCS 接收依据为 arXiv 评论字段自注 + DOI 可解析，未经出版方页面二次核验。',
      checkedAt: '2026-09-24',
    },
    sections: [
      {
        id: 'two-layers',
        heading: '通信的两层面框架',
        blocks: [
          {
            kind: 'paragraph',
            spans: [
              { kind: 'strong', text: '系统级（§3）。' },
              { kind: 'text', text: '三个维度：架构（flat / hierarchical / team / society / hybrid）、目标（cooperation / competition / mixed）、协议（MCP、A2A、ANP 等）。系统级回答「在什么组织结构下通信」；协议名单知道存在即可，起步不学实现。' },
            ],
          },
          {
            kind: 'paragraph',
            spans: [
              { kind: 'strong', text: '系统内部（§4）。' },
              { kind: 'text', text: '四个维度：策略（one-by-one / simultaneous-talk / simultaneous-talk-with-summarizer）、范式（message passing / speech act / blackboard）、对象（self / other agents / environment / human）、内容（显式＝自然语言/代码/结构化数据，隐式＝行为反馈/环境信号）。内部通信回答「每轮具体怎么传、传什么」。' },
            ],
          },
        ],
      },
      {
        id: 'with-beyond-frameworks',
        heading: '与 Beyond Frameworks 的分工与叠用',
        blocks: [
          {
            kind: 'comparison',
            columns: ['问题', 'Beyond Frameworks（ACL 2025）', '本篇（FCS 接收）'],
            rows: [
              ['协作内部怎么组织', '治理/参与/交互/历史管理四维（§3.2–3.5）', '不覆盖'],
              ['智能体之间怎么通信', '不覆盖', '系统级架构-目标-协议 + 内部策略-范式-对象-内容'],
              ['每轮看到什么历史', '历史管理维（含 C1 上一轮完整日志）', '内容维的「对象+内容」取值'],
              ['表示层词汇', '历史管理维的取值枚举', '显式 vs 隐式内容（§4.4，框架级）'],
            ],
          },
          {
            kind: 'paragraph',
            spans: [
              { kind: 'text', text: '叠用法：先用 Beyond Frameworks 的四维定位机制层，再用本篇的「内容」维定位表示层。审计已核的两篇站内卡（Tax/Debt）的交接界面，在 Beyond Frameworks 坐标里是「历史管理维的不同取值」，在本篇坐标里是「显式内容的不同结构化程度」——两个坐标系各说对了一层。' },
            ],
          },
        ],
      },
    ],
  },

  // ---------- PLAN-010 阶段 A：近邻 4 篇（quick，partial-text，HTML 全文节级提取；均预印本） ----------
  {
    id: 'compression-cost',
    auditRef: 'compression-cost（§4.1）',
    title: 'What Does Context Compression Cost an Agent? Interaction Costs Unrevealed by Task-Completion Metrics',
    displayTitle: '上下文压缩的隐形成本：完成率看不见的账',
    url: 'https://arxiv.org/abs/2608.16370',
    type: 'evaluation',
    importance: 'core',
    difficulty: 'needs_background',
    role: 'frontier',
    roleReason: '给主方向「获取及计费」轴补上运行中计费机制证据：交接后压缩丢掉的运行态要靠 re-query 循环再买回来；完成率不变的压缩可能很贵。单作者+合成环境，证据强度按预印本对待。',
    recommendedDepth: 'standard',
    deliveredDepth: 'quick',
    lead: '任务完成率是评测上下文压缩的标准指标，但它不完整：压缩丢掉的运行态要靠额外交互买回来。本篇提出 re-query loop 概念，按可恢复性分解被丢状态（可恢复的 D-state vs 不可恢复的 R-state），证明「压缩变贵发生在被丢状态须在有限预算内再获取时，而非信息丢失本身」。',
    learner: {
      gist: '压缩表示（滑窗/抽取式摘要）保住完成率的同时，Agent 会发起更多检索调用把丢掉的状态买回来；恢复 D-state 消掉约一半检索成本——成本是环境依赖的，不是压缩的内在属性。',
      value: '直接补主方向两本账口径：Tax/Debt 记交接时的一次性账，本篇记交接后运行中的重复计费账；读回次数本身就是计费指标。',
      intent: '带着自己的预算口径读 §3–4：两个有界近合成环境（IRBench、ALFWorld）、三模型、oracle 恢复干预；数字按设置条件读，不转引为通用比例。',
    },
    reasons: [
      '「完成率不变的压缩可能很贵」直接支持对 Tax 质量恢复/成本保留分列结论的谨慎解读。',
      'D-state/R-state 可恢复性分解是「获取及计费」轴的现成机制词汇。',
      '作者自列 11 条局限（两个有界近合成环境、3 个模型族、24 轮上限、工具调用数作成本代理等），是读法训练的好材料。',
    ],
    questions: [
      're-query loop 是什么？为什么完成率指标看不见它？',
      'D-state 与 R-state 的区分是什么？R-state 不可恢复对应 Tax 的哪个条件？',
      '为什么「成本是环境依赖的，不是压缩的内在属性」？ALFWorld 对照说明了什么？',
      '这篇的 11 条自列局限里，哪三条最影响你对结论强度的判断？',
    ],
    deepRead: [],
    readingActions: {
      preserve: [
        { target: 're-query loop 概念与 D-state/R-state 分解（§3–4）', why: '「获取及计费」轴的机制证据，后续读一切压缩/摘要论文都带着这对概念。' },
      ],
      explain: [
        {
          target: '「交接后还要再付的账」与站内两本账的关系',
          why: '编辑讲解：三笔账各记什么。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '（编辑讲解）站内现在有三笔账要分开记：Handoff Debt 记交接时刻的输入账（初始提示 87k 字符的原始轨迹 vs 约 10k 的笔记，§5.3 已核），Handoff Tax 记交接后累计的成本保留（降配 Raw 保留约 80% 成本优势，§4 已核），本篇记交接后运行中因表示有损而再付的账（GPT-5.5 完成率 80%→85% 统计不变、p=1.0，检索调用却增至约 3 倍）。三笔账对应三种度量口径，互相不能替代：初始省下来的 token，可能在运行中被再买回去。' },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: '实现级附录与提示词全文', why: '机制层读懂即可；复现细节等真要跑实验时再看。' },
      ],
    },
    guidedReading: {
      terms: [
        { term: 're-query loop', note: '压缩丢掉运行态后，Agent 发起额外交互把状态再买回来的循环——完成率指标看不见的成本。' },
        { term: 'D-state / R-state', note: '被丢状态的两种：D-state 外部可查、可恢复但费交互；R-state 历史依赖约束、公开查询不可恢复。' },
        { term: 'oracle 状态恢复', note: '实验干预：直接把状态还给 Agent，用于分解「缺能力」还是「缺信息」。' },
      ],
      preQuestions: [
        '完成率不变为什么不代表压缩免费？',
        'D-state 与 R-state 的可恢复性差异，对「表示该保留什么」有什么提示？',
        'oracle 恢复消掉约一半检索成本，这说明接收方缺的是能力还是信息？',
      ],
      locate: [
        { target: 're-query loop 与可恢复性分解', where: '§3–4（HTML 全文节级提取）', note: '正文已核到节级；图表数值除正文叙述外未逐项核表。' },
      ],
      explainBlocks: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '实际讲解：为什么「完成率不变」是个陷阱。' },
            { kind: 'text', text: '任务完成率只数「最后做成了没有」，不数「中间多绕了几圈」。压缩把 Agent 记得的运行态（哪个文件改过、哪条约束还没满足）丢掉以后，Agent 为保住完成率会自己想办法：重新检索、重新探查——这些动作每一轮都在烧输入预算。本篇的实验设计克制处在于 oracle 干预：直接把丢掉的状态还回去，约一半额外检索就消失了，说明这笔钱是「信息缺失税」而不是「模型变笨税」。读 Tax 时同理：Traj-drop 在完成率上不输 Raw，不代表接手方没为重新发现付代价——Debt 已经告诉我们那份代价记在哪本账上。' },
          ],
        },
      ],
    },
    coverage: {
      mode: 'partial-text',
      basis: 'arXiv HTML 全文节级提取（工具转述式，非逐行精读）；关键数字经正文叙述回引：GPT-5.5 完成率 80%→85%（p=1.0）检索 +42.9 次（约 3 倍）、恢复 D-state 消掉约一半检索成本、6 组对比检索调用 5/6 经 Holm 校正仍显著。来源审计条目 id：compression-cost（docs/research/guidance-display-source-audit.md §4.1）。',
      version: 'arXiv:2608.16370 v1（2026-08-17），Shuyu Liu（单作者），预印本',
      sections: ['§1 问题定义', '§2 相关工作（框架级）', '§3 re-query loop 与 D-state/R-state 分解', '§4 实验（IRBench/ALFWorld、oracle 干预）', '局限（作者自列 11 条）'],
      limitations: '预印本、未经同行评审；单作者；两个有界、近合成环境（IRBench、ALFWorld）；3 个模型族；24 轮交互上限是设计选择；工具调用数作成本代理；单压缩点跨模型；选择零效应与内容复制只在部分模型确认。数字引用须带设置条件，不外推为通用比例。',
      checkedAt: '2026-09-24',
    },
    sections: [],
  },
  {
    id: 'do-not-restart',
    auditRef: 'do-not-restart（§4.2）',
    title: 'Do Not Restart: Residual Completion for Stateful Agent Handoffs',
    displayTitle: '不要重开：有状态换手的残差补全',
    url: 'https://arxiv.org/abs/2609.13800',
    type: 'method',
    importance: 'relevant',
    difficulty: 'challenging',
    role: 'frontier',
    roleReason: '把换手从「传什么表示」推进到「冻结什么义务」：合约式接续（先冻结残差合约、副本上补全、整图准入后才给实写权限），给四轴的「状态保存在哪里/谁决定何时更好」两轴提供发送方合约+环境侧门禁的第三种分工证据。',
    recommendedDepth: 'standard',
    deliveredDepth: 'quick',
    lead: '有状态 handoff 中，继任模型如何在不推翻已接受选择的前提下补全未完成义务。提出 commitment frontier 与 CFRC 三阶段：交接前冻结残差合约（被省略的工作不会因继任方不提就消失）、隔离副本上残差补全、整图对照合约准入后才授予实写权限（副本成功不解除义务）。',
    learner: {
      gist: '与 Tax/Debt 的对照：Tax/Debt 冻结的是仓库现场（表示层），本篇冻结的是合约——什么固定了、什么还开着；「先验证后授权」给出环境侧门禁：确定性准入而非 LLM 自主决定何时放行。',
      value: '四轴里「谁决定传取什么」的第三种答案：发送方交接（Tax/Debt）、接收方获取（Compression Cost 的 re-query）、环境侧门禁（本篇 CE 阶段）。',
      intent: '按三阶段读 §3：RSCC（冻结残差合约）→ ERC（副本补全+证据链接图）→ CE（整图准入+活环境回执）；结果数字按模型对与成本口径读。',
    },
    reasons: [
      'commitment frontier（已接受前缀必须保留、请求范围内工作仍开放）是「状态保存在哪里」的合约级答案。',
      '整图准入比逐步核查 +8.8 分且省 $8.26，给出「何时验证」比「验证多严」更值钱的证据。',
      '与 MemGPT 互补：MemGPT 的搬运由 LLM 策略自主发起，本篇的准入是确定性的——正好回答「何时不该放行」。',
    ],
    questions: [
      'commitment frontier 与 Tax 的「保留仓库现场、只改轨迹信息」差在哪一层？',
      'CFRC 三阶段各自冻结/验证什么？为什么「副本成功不解除义务」？',
      '跨厂商模型对「距强锚 0.5 分以内、成本 26.0%/44.1%」这类数字要带着哪些设置条件读？',
      '作者自列局限里「不保证构造器正确、不保证解存在、失败不隐含回滚」对手动复现意味着什么？',
    ],
    deepRead: [],
    readingActions: {
      preserve: [
        { target: 'commitment frontier 与三谓词（§3）', why: '合约式接续的概念骨架：从已达状态执行、保留已接受绑定/效果、补全全部开放义务。' },
        { target: '排序原则：先目标后提议、整提议先于授权、活证据先于成功（§3）', why: '「何时验证」的设计原则，比单点技巧更可迁移。' },
      ],
      explain: [
        {
          target: '「冻结合约」与「冻结仓库现场」的区别',
          why: '编辑讲解：两种冻结各管什么。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '（编辑讲解）Handoff Debt 在中断点冻结的是仓库现场：文件、测试状态——后任看到的是「物」。本篇冻结的是合约：哪些承诺已接受、其效果必须保留，哪些义务还开着、必须补全——后任看到的是「账」。两者的互补关系：仓库现场回答「世界现在什么样」，残差合约回答「还欠什么」。审计的注意点也在这里：合约完整性以形式化为前提（作者自列局限），如果前史的披露不全在工具效果 schema 内，形式化提升不保证成立。' },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: '构造器正确性证明与形式化细节', why: '起步只需三阶段直觉；形式化前提已登记为局限。' },
      ],
    },
    guidedReading: {
      terms: [
        { term: 'commitment frontier', note: '已接受前缀的进度必须保留，而请求范围内的工作仍开放——「什么固定了、什么还开着」的分界（§3）。' },
        { term: '残差合约（reached-state contract）', note: '继任方提议之前先从已接受轨迹冻结的合约；被省略的工作不会因继任方不提就消失。' },
        { term: 'CFRC 三阶段', note: 'RSCC 冻结合约 → ERC 副本补全+证据链接图 → CE 整图准入后实写、只以活环境回执确认完成。' },
      ],
      preQuestions: [
        '合约式接续与「传摘要/传轨迹」的表示层方案是正交还是替代关系？',
        '为什么整图准入比逐步核查更好？这与「验证时机」有什么关系？',
        '「副本成功不解除义务」对「以副本试运行当验证」的做法意味着什么？',
      ],
      locate: [
        { target: 'CFRC 三阶段', where: '§3（正文已读，HTML 节级提取）', note: '结果与审计数字：CFRC 70.8% macro vs 强锚 69.6%（成本 34.6%）；整图准入 +8.8 分且省 $8.26；124 次 CE 干预全部发生在首次实写之前。' },
      ],
      explainBlocks: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '实际讲解：第三种分工——环境侧门禁。' },
            { kind: 'text', text: '主方向四轴里「谁决定传取什么」已有两类答案：发送方在交接时打包（Tax 的 Compact 条件、Debt 的四视图），接收方在运行中补取（Compression Cost 的 re-query 循环）。本篇给出第三类：环境侧的门禁——继任方写的一切先在隔离副本上发生，汇成证据链接图，整张图对照残差合约准入之后才授予实写权限，且只有活环境的回执算数（副本里「成功」不解除义务）。这个设计的可迁移点不在 handoff：任何「让模型先提议、由确定性检查决定是否放行」的环节都适用。与 MemGPT 对读更清楚：MemGPT 把「何时读回记忆」交给 LLM 策略自主决定，本篇示范了相反的极端——「何时放行写入」交给确定性准入。' },
          ],
        },
      ],
    },
    coverage: {
      mode: 'partial-text',
      basis: 'arXiv HTML 全文节级提取（正文已读至方法/实验节）；关键数字经正文叙述回引：CFRC 70.8% macro vs 强锚 69.6%（成本 34.6%）、跨厂商对距强锚 0.5 分以内（成本 26.0%/44.1%）、整图准入 +8.8 分省 $8.26、持久写义务召回 91.2%、124 次 CE 干预全部在首次实写前。来源审计条目 id：do-not-restart（docs/research/guidance-display-source-audit.md §4.2）。',
      version: 'arXiv:2609.13800 v3（v1 2026-09-12），Runzhi Deng, Yiming Zhong, Fang Zhao, Pan Zhou，预印本',
      sections: ['§1 问题与 commitment frontier', '§3 CFRC 三阶段（RSCC/ERC/CE）', '§4 五个有状态工具基准实验', '局限（作者自列）'],
      limitations: '预印本、未经同行评审；模型代号（Luna/Sol 等）与基准（STATE-Bench、τ²-Retail/Airline、ToolSandbox、Agent-Diff）均新，未独立复核基准真实性；只评单任期 cheap→strong 与合约冻结；递归路由超范围；对话披露不在工具效果 schema 内时形式化提升以合约完整为前提；不保证构造器正确、不保证解存在、失败不隐含回滚。',
      checkedAt: '2026-09-24',
    },
    sections: [],
  },
  {
    id: 'memcollab',
    auditRef: 'memcollab（§4.3）',
    title: 'MemCollab: Cross-Model Memory Collaboration via Contrastive Trajectory Distillation',
    displayTitle: '跨模型记忆协作：朴素共享为什么有害',
    url: 'https://arxiv.org/abs/2603.23234',
    type: 'method',
    importance: 'relevant',
    difficulty: 'needs_background',
    role: 'frontier',
    roleReason: '把主方向「表示组合」问题从单任务交接扩展到跨模型记忆：记忆把任务知识与模型特异推理风格缠在一起，朴素迁移反而降性能；「表示与模型的耦合本身就是税」是 Tax 方向依赖的记忆侧镜像。',
    recommendedDepth: 'standard',
    deliveredDepth: 'quick',
    lead: '异构部署下单一记忆系统能否跨模型共享。发现朴素跨模型迁移反而降性能——记忆把任务知识与模型特异推理风格缠在一起。解法是对比轨迹蒸馏：多模型轨迹选优选劣，由最强模型抽「推理不变量＋违规模式」为共享记忆（带模型身份标签），推理时任务+模型双门控检索。',
    learner: {
      gist: '「存下来的东西给另一个模型用会怎样」的直接实验：直接迁移 7B 用 32B 记忆在 MATH500 反降（52.2→50.6）；剥离模型特异偏差（不变量/违规模式 + 双门控检索）后 Qwen-7B 平均 57.1→71.6。',
      value: '给「共享状态是候选不是答案」提供记忆侧证据：接收方不是越强越能消化前任表示，表示与接收模型的耦合本身就是成本。',
      intent: '读机制 §2（对比轨迹蒸馏与双门控检索），数字按数学/代码任务域读——与 coding 场景有距离，引用时注意迁移边界。',
    },
    reasons: [
      '「朴素共享有害」是方向 openQuestions 第 3 条（记忆何时传播错误）的现成实验证据。',
      '任务+模型双门控检索是 MemGPT 控制流的跨模型版——单智能体机制词汇直接可对照。',
      '「不变量 vs 违规模式」的内容区分，接到四轴「保存什么语义」：事实证据与前任判断要分开存。',
    ],
    questions: [
      '为什么朴素跨模型迁移会降性能？「任务知识与模型特异推理风格缠在一起」具体指什么？',
      '对比轨迹蒸馏的「选优选劣」规则是什么？由最强模型抽取意味着什么能力前提？',
      '双门控检索（任务类别→参与模型→语义排序 top-3）与 MemGPT 的函数调用读回各管什么？',
      '数学/代码任务上的结论，迁移到 coding Agent 交接场景要跨过哪些边界？',
    ],
    deepRead: [],
    readingActions: {
      preserve: [
        { target: '对比轨迹蒸馏机制（§2）', why: '「谁来做压缩/抽象」的跨模型答案：最强模型对比抽不变量与违规模式。' },
        { target: '朴素迁移有害的证据（MATH500 52.2→50.6）', why: '「共享状态是候选不是答案」的直接实验记录，数字带任务域限定引用。' },
      ],
      explain: [
        {
          target: '「事实证据 vs 前任判断」的内容区分',
          why: '编辑讲解：MemCollab 的内容二分对四轴「保存什么语义」的提示。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '（编辑讲解）MemCollab 抽出的两类记忆值得对照本站四轴「保存什么语义」：推理不变量（enforce）是跨模型仍成立的事实性约束，违规模式（avoid）是带模型身份标签的判断性经验。朴素共享有害的机制就藏在混淆二者：把「某模型容易犯的错」当「任务的通用约束」传给另一个模型，等于传了一份噪声。作者的处理是双门控——按任务类别过滤、再按参与模型过滤——用检索策略补救内容层面的混杂。这与导读「共享状态里的事实、假设和未决问题不能一概当作客观真相传给下一任」是同一条纪律的跨模型版。' },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: '附录实现细节（未逐页核）', why: '2026-09-24 审计提取到附录级，未逐页核；引用附录内容前需补读。' },
      ],
    },
    guidedReading: {
      terms: [
        { term: '对比轨迹蒸馏', note: '同一任务多模型产出轨迹，选优选劣后由最强模型对比抽「违规模式＋推理不变量」入共享记忆（§2）。' },
        { term: 'enforce / avoid 范型', note: '记忆内容的二分：要遵守的不变量 vs 要避免的违规模式，带模型身份标签。' },
        { term: '双门控检索', note: '任务类别过滤 → 参与模型过滤 → 语义排序 top-3；MemGPT 控制流的跨模型版。' },
      ],
      preQuestions: [
        '「朴素共享有害」与 Tax 的「方向依赖」是什么镜像关系？',
        '为什么抽取者要由最强模型担任？这隐含什么能力前提？',
        '双门控检索说明「接收方缺的是能力还是信息」的哪一面？',
      ],
      locate: [
        { target: '机制与主结果', where: '§2（正文已读）与实验节', note: '关键数字：Qwen-7B 平均 57.1→71.6、Qwen-32B 70.8→79.6、朴素迁移 52.2→50.6（MATH500）；表格数值除选取行外未逐项核表。' },
      ],
      explainBlocks: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '实际讲解：表示与模型是耦合的。' },
            { kind: 'text', text: '直觉上「好记忆谁用都好」是错的：轨迹里混着两样东西——对任务成立的事实（不变量），和产出这条轨迹的模型的习惯（先验偏好、常走的弯路）。前者可迁移，后者对新模型可能是误导。7B 模型直接用 32B 模型的记忆在 MATH500 上反降，说明接收方不是越强越能自动消化前任表示——表示与它被写下的那个模型的推理风格缠在一起。这对主方向的直接提示：跨模型协作里，「表示怎么编码」与「接收方是谁」不是两个独立变量，把它们当独立变量设计实验（固定表示换模型）正是 Tax 方向条件已经示范过的做法；MemCollab 在记忆侧补了同一课。' },
          ],
        },
      ],
    },
    coverage: {
      mode: 'partial-text',
      basis: 'arXiv HTML 全文节级提取（正文已读至实验节；附录提取到附录级、未逐页核）；关键数字经正文叙述回引：Qwen-7B 57.1→71.6、Qwen-32B 70.8→79.6、直接迁移 52.2→50.6（MATH500）。来源审计条目 id：memcollab（docs/research/guidance-display-source-audit.md §4.3）。',
      version: 'arXiv:2603.23234 v2（v1 2026-03-24），Yurui Chang, Yiran Wu, Qingyun Wu, Lu Lin，预印本',
      sections: ['§1 问题（跨模型记忆共享）', '§2 对比轨迹蒸馏与双门控检索', '实验节（MATH500/GSM8K/MBPP/HumanEval/AppWorld/ASQA；选取行已核）', '局限（作者自列）'],
      limitations: '预印本、未经同行评审；任务域为数学/代码/应用任务，与 coding Agent 交接场景有距离，迁移需论证；访问控制与安全过滤留作未来工作（作者自列）；附录未逐页核；表格数值除 MemCollab 表 1 选取行外未逐项核表。',
      checkedAt: '2026-09-24',
    },
    sections: [],
  },
  {
    id: 'routed-graph-handoff',
    auditRef: 'routed-graph-handoff（§4.4）',
    title: 'Routed Graph Handoff: Adaptive Format Selection for Multi-Agent LLM Delegation',
    displayTitle: '路由图换手：按任务在图与自然语言间选格式',
    url: 'https://arxiv.org/abs/2608.25277',
    type: 'method',
    importance: 'peripheral',
    difficulty: 'accessible',
    role: 'frontier',
    roleReason: '「adaptive handoff selector」的现成小实例：按任务在结构化依赖图与自然语言间路由（缺能力时保守默认 NL；oracle 余量 8.6pp 提示部分场景缺的是信息）；作者规模与基准设计约束明显，只作机制例子不作结论依据。',
    recommendedDepth: 'quick',
    deliveredDepth: 'quick',
    lead: '多智能体委派默认自然语言通信，token 开销大且易不对齐。本篇用类型化依赖图（8 节点类型、7 边关系）承担结构化委派，约 155 token 的轻量 LLM 路由器按任务在图/NL 间选择（默认保守回退 NL），需配图感知执行器提示词才有效果。',
    learner: {
      gist: '结构-灵活性权衡：图利于有依赖链的任务，伤害需自适应的任务；路由按任务类型聚类而非实例级自适应，缺能力时保守回退自然语言（oracle 余量 8.6pp 说明还有信息没被用上）。',
      value: '把 Tax 的静态四条件升级为「按任务路由」的思路样本；也是「表示选择需要配套执行器认知」的小例子。',
      intent: '读机制 §2 即可（类型化依赖图 + 路由 + 执行器提示词）；结果数字（τ-retail +12.7pp 且 3.2× 压缩等）按单编排骨架、47 条轨迹设计的 schema 等约束条件读。',
    },
    reasons: [
      '「选择器缺能力 vs 缺信息」的两面证据都在这篇里：保守默认 NL（缺能力）与 oracle 余量 8.6pp（缺信息）。',
      'structure-flexibility 权衡（图利依赖链、伤害自适应）是表示层「不是越结构化越好」的具体例证。',
      '机制小而直接，适合导读举例；预印本、2 作者、基准设计约束明显，只作机制例子。',
    ],
    questions: [
      '类型化依赖图（8 节点/7 边）承担了什么？路由器只决定「用图还是 NL」吗？',
      '为什么默认保守回退自然语言？这说明选择器缺的是什么？',
      'oracle 余量 8.6pp 提示什么？路由按任务类型聚类而非实例级，代价是什么？',
      '这篇的机制哪些能迁移到跨 harness 交接，哪些不能（多智能体委派语境 vs 单任务接手）？',
    ],
    deepRead: [],
    readingActions: {
      preserve: [
        { target: '类型化依赖图 + 轻量路由的机制组合（§2）', why: '「谁决定传取什么」的自动取值实例：155 token 路由决定格式。' },
      ],
      explain: [
        {
          target: '「缺能力 vs 缺信息」的两面证据',
          why: '编辑讲解：选择器轴的现成样本。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '（编辑讲解）这篇把「选择器为什么不工作」拆成了两半：路由在不确定时保守回退自然语言——这是缺能力的一面，宁可贵不要错；oracle 分析还有 8.6 个百分点的余量——这是缺信息的一面，有些任务明明该用图却没用上。对照 Compression Cost 的 oracle 状态恢复（消掉约一半再获取成本）：两篇的 oracle 干预都在说同一件事——部分场景里系统缺的不是更强的模型，而是更好的「何时用哪种表示」的决策信息。这个读法比单看 τ-retail +12.7pp 的结果数字更有迁移价值。' },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: '执行器提示词全文', why: '知道「需配图感知提示词才有效果」这一条件即可，起步不抄提示词。' },
      ],
    },
    coverage: {
      mode: 'partial-text',
      basis: 'arXiv HTML 全文节级提取（正文已读）；关键数字经正文叙述回引：τ-retail +12.7pp 且 3.2× 压缩（p<0.01）、BrowseComp +8.7pp 2.2× 压缩（p<0.05）、AppWorld 持平（路由避开 14.6pp 回退）、oracle 余量 8.6pp。审计修订：原文的 NL 开销量化占比无具体模型/任务条件，不登记不转引（审计 §7 修订 2）；「76% 失败涉不对齐」为该文自称、未经独立复核。来源审计条目 id：routed-graph-handoff（docs/research/guidance-display-source-audit.md §4.4）。',
      version: 'arXiv:2608.25277 v1（2026-08-26），Pratyay Banerjee, Ankit Chadha（2 作者），预印本',
      sections: ['§1 问题与错误分析（76% 不对齐为该文自称）', '§2 类型化依赖图 + 路由 + 执行器提示词', '实验（BrowseComp/BFCL/τ-retail/AppWorld；1052 条轨迹）', '局限（作者自列）'],
      limitations: '预印本、未经同行评审，2 作者；路由按任务类型聚类而非实例级自适应；schema 在 47 条 τ-bench 轨迹上设计，泛化未证；主结果单编排骨架（GPT-5 mini 仅测过）；执行器提示词必要但增加复杂度；其 NL 通信开销的量化占比缺少模型/任务条件（按审计修订不登记、不转引），「76% 失败涉不对齐」亦未经独立复核，引用须带此标注。',
      checkedAt: '2026-09-24',
    },
    sections: [],
  },
];
