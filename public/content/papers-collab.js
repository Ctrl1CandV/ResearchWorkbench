// public/content/papers-collab.js —— SCAFFOLD-008 主方向新增四张论文卡（008.2）。
// 契约：docs/SCAFFOLD-008/02-curriculum.md（步2–5）、07-source-audit.md（定位与边界）。
// - beyond-frameworks / memgpt / handoff-tax / handoff-debt，均为 quick（Tax/Debt 已核指定正文，mode=partial-text）；
// - 数字与比较句均有正文定位（见各卡 coverage.sections）；不把摘要分类当完整条件列表；
// - Tax/Debt 按预印本身份写（arXiv v1 / v2），不推测录用；Beyond Frameworks 为 ACL 2025 会议论文。
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
      gist: '协作组织与互动方式可拆成四个维度：谁决策（治理）、谁参与（参与控制）、按什么顺序与对象交互（交互动态）、每轮看到什么历史（历史管理）。',
      value: '主方向研究的是机制与表示的组合比较；先借这一篇建立维度词汇，避免「多一个框架名就是多一种方法」。',
      intent: '读摘要、引言与 §3 的维度定义即可；目标是能任选一个维度说出「它改变了什么、其他什么要保持」，不要求背全组合。',
    },
    reasons: [
      '框架级综述常停在「有哪些架构」；这篇把协作策略拆到维度级，正好接上主方向「机制与表示组合」的问法。',
      '历史管理维度（每轮看到什么历史）直接对应跨工具时的信息表示问题。',
      '作者提出 Token-Accuracy Ratio（TAR）把质量与开销放在同一杆秤上，和预算意识一致。',
    ],
    questions: [
      '四个维度各是什么？任选一个，说出它改变的是协作的哪一层。',
      '「谁发起下一轮」与「下一轮看到什么历史」分别属于哪个维度？',
      '这篇的实验场景是什么？为什么不能把它读成跨商业 harness 的互通验证？',
    ],
    deepRead: [],
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
      basis: 'ACL Anthology 官方页摘要与引言，arXiv HTML 版 §3（3.2–3.5）维度定义、§4.1 场景说明与 Limitations。',
      version: 'ACL 2025（2025.acl-long.1037，21361–21375）/ arXiv:2505.12467',
      sections: ['摘要', '引言', '§3 维度定义（3.2–3.5）', 'Limitations'],
      limitations: '未核图像与表格数值；§3.5 的 Full Log of the Last Round 指上一轮完整对话，不可理解为整个任务的完整轨迹；两个实验场景（DEI/SES）非跨 harness 设置。',
      checkedAt: '2026-09-22',
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
      intent: '读摘要、引言与 §2 的主/外部上下文及控制流概念；目标是能说出「谁决定写入、谁决定读回」，不为记忆方案下优劣结论。',
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
    readingActions: {
      preserve: [
        { target: '主/外部上下文之分与控制流（§2）', why: '这是「记忆 ≠ 这一轮输入」的机制落点。' },
      ],
      explain: [
        {
          target: '一条任务线索移出窗口、随后再取回的过程',
          why: '编辑示意：只用已核方法概述，不编造实验分数。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '（编辑示意）主上下文快满时，MemGPT 的控制流（函数调用）把较早的对话内容换出到外部存储（recall storage）；之后当新问题需要旧信息时，再由 LLM 发起检索函数把相关内容读回主上下文。要点是：搬运由控制流按策略执行，不是「模型自己记得」；外部存储里的一切，不读回就永远不会出现在这一轮输入里。' },
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
      basis: 'arXiv HTML 版 v2 的摘要、引言与 §2 方法概述（主/外部上下文、函数调用、控制流、队列换出）。',
      version: 'arXiv:2310.08560 v2',
      sections: ['摘要', '引言', '§2 方法概述'],
      limitations: '图像未核，不列图号；未读实验章节，不引用任何分数；单 Agent 上下文管理，不是跨 harness 或长期多 Agent 协作证据。',
      checkedAt: '2026-09-22',
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
      basis: 'arXiv HTML 版 v1：摘要、§3 实验框架（含 §3.1 四条件与切换点）、§4 方向相关结果与局限、附录 A 设置。',
      version: 'arXiv:2608.24358 v1（2026-08-25），Ganz, Nacson, Kalyanpur, Litman',
      sections: ['摘要', '§3 实验框架', '§4 方向相关结果', '局限（§6/附录A）'],
      limitations: '主实验为 SWE-bench Verified + 同一 mini-swe-agent 脚手架/工具/提示，两对模型；切换点按起始模型步数分布预设； hard 子集小（约 24 条）属探索性；每配置单轮运行无重复方差；美元成本结论依赖供应商定价与缓存命中率。不是 Cursor/Codex 等独立商业 harness 之间的搬迁验证。',
      checkedAt: '2026-09-22',
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
      basis: 'arXiv HTML 版 v2：摘要/引言、§4.3 运行环境、§5.1 表2、§5.3 初始长度、§5.5 跨模型检查与局限。',
      version: 'arXiv:2606.02875 v2（2026-08-30），Dipesh KC, Anjila Budathoki',
      sections: ['摘要/引言', '§4.3 运行环境', '§5.1 表2', '§5.3 初始长度', '§5.5 跨模型检查', '局限'],
      limitations: 'OpenHands 式运行时内结论；主研究每个交接点每视图单次运行；75 个 SWE-bench Verified 源任务；官方验证只覆盖补丁通过测试，不含可维护性；表 2 为字符/相对变化口径，初始长度不是 token，四视图不是等输入预算比较。不发布「哪种格式全面最优」的排名。',
      checkedAt: '2026-09-22',
    },
    sections: [],
  },
];
