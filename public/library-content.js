// public/library-content.js —— 个人研究平台内容包聚合器（数据契约见各模块文件头与下列文档）。
// 契约来源：docs/SPEC.md、docs/DESIGN.md、docs/READING-TEMPLATES-005.md、
// docs/TECH-LEARNING-005.md、docs/DAILY-BRIEF-006.md、docs/SCAFFOLD-008（008.2）；
// 拆分记录见 docs/DESIGN-REWORK-007.md §6。
// - meta/home/foundations 配置在本文件；directions/papers/technicalRoutes/briefs/materials 在
//   public/content/ 模块中；papers 按「路线组→支线与补充组→经典组→协作新卡组」拼接，
//   原 45 篇相对顺序不变，新四篇（008.2）追加在尾部。
// - map（DYNAMIC-GUIDANCE-009 / A 包，2026-09-23 新增）：小型文字地图基线，模型见下方 LIBRARY.map
//   注释与 docs/DYNAMIC-GUIDANCE-009.md R1；渲染属 B 包、覆盖层校验属 C 包，本文件只是基线数据。
// - 依据纪律：deep/standard 必须有相应正文依据，quick 可为摘要级或「摘要+指定正文已核」；
//   只升不降不冒充已读。本文件只是数据：排序与路线是编辑安排，不是用户画像事实，不含任何本人进度。

import { DIRECTIONS } from './content/directions.js';
import { ROUTE_PAPERS } from './content/papers-routes.js';
import { SUPPLEMENT_PAPERS } from './content/papers-supplements.js';
import { FOUNDATION_PAPERS } from './content/papers-foundations.js';
import { COLLAB_PAPERS } from './content/papers-collab.js';
import { TECHNICAL_ROUTES } from './content/technical-routes.js';
import { BRIEFS } from './content/briefs.js';
import { MATERIALS } from './content/materials.js';

export const LIBRARY = {
  contentVersion:
    'LIBRARY-CONTENT v5.4 (2026-09-24，PLAN-011 读者体验小幅优化，独立审查修复轮)：landscape 10 个关键节点（land-a5/a6/b1/c2/c3/d1/d2/d3/e1/e2）新增 guide 连贯讲解（动机/机制/例子/易混/衔接五段，编辑解释示例标注一次，渲染常显简短来源＋证据级、完整来源在折叠速览内）；其余 10 节点 limitation 补承接下节点的衔接句；学术边来源由审计文档节号改为文献名映射（可追溯性移入 source.auditRef 数据字段，正文不显示内部编号）；节点正文/讲解中的内部节点编号（A6/C2、D1 等）全部改为完整自然节点名；节点来源行、首页四区说明、课题页四轴实例改读者语言；a5 例子口径修正（BERT/GPT-3/DALL·E 为不同基础模型实例而非同一底座三种用法）、a6 对齐与工具可靠性的关系降为「帮助遵循接口、仍需校验」、d3 RAG 与记忆改按「流程 vs 机制」界定（可组合）、e2 讲解去具体数字留定性；首页去重（goal 区头不再重复路线入口，保留首读与课题区探索链接）；课题页旧介绍折叠＋导读/对照/辅助来源三级；图谱页 guide 优先。节点/边/路径数量与 009 基线地图（LIBRARY.map）数据不动。上一版本注记：v5.3 (2026-09-24，PLAN-010 内容展示深化)：阶段 A 首批内容入库——综述 2 篇（survey-mem-tois 记忆四问，TOIS 2025/arXiv:2404.13501，standard；survey-comms-fcs 通信两层面，FCS 接收/arXiv:2502.14321，standard；均为专题分支综述与导学树树根）+ 近邻 4 篇（compression-cost / do-not-restart / memcollab / routed-graph-handoff，均 quick·partial-text·预印本标注，尾部追加，旧 49 篇相对顺序不变；论文合计 49→55）；基础导读新增 3 篇（mat-handoff-basics 任务接续 / mat-mech-vs-representation 机制与表示 / mat-read-performance-claims 读懂性能提升，与旧 2 篇共用同一贯穿例子；材料合计 2→5）。REV001 补包：广域认知脉络图 LIBRARY.landscape 入库（20 节点三层：AI 背景 6 + Agent 全景 13 + 专题 1，6 学习路径，19 边；学术边附来源、阅读顺序边只给编辑理由；已同步内容审查 5 项裁决——Findings of ACL 不标 CCF 不继承主会、A2「推动因素之一」、A4「主要底座」、A5 涌现标注报告观点有争议、统计学习教程级覆盖不冒充已读正文、深度 RL 非 RLHF 未系统覆盖的范围提示），#/map 主体改为可点击 SVG+同源层级文本/节点详解（图文同数据、键盘可选、窄屏文本优先），旧 009 基线地图降为次级区数据不动；首页知识脉络区三层介绍+直接入口，主方向页加相关支线预览。来源唯一准绳＝docs/research/guidance-display-source-audit.md 最终版（含 §7 修订：Tax 子轴推断修正、RGH 无条件百分比删除、记忆基准缺口加时点限定、首批范围收窄），每篇新卡带 auditRef 登记。阶段 B 首页五区重排为四区（阅读目标/综述总览/课题深化/技术入口，区配置在本文件）；阶段 C 主方向页新增四轴编辑分析表（标注为用户编辑框架而非综述分类）、机制与表示对照、问题演化、论文联系（PF-07 来源声明）与未定候选；阶段 D 首批 9 卡补三段式导读（背景术语/精读定位/实际讲解）；阶段 E 三条 featured 技术路线补「与当前研究能力的关系」。审计口径纪律：不转引 RGH 的 40–60% 无条件占比；不把 Tax 的 Compact_pre/suf 说成接收方主动获取；记忆评测缺口仅限综述写作时点；候选研究问题标注为候选、非用户定题。',
  meta: {
    role: 'editorial/AI-suggestion',
    updatedOn: '2026-09-24',
    directionSourceNote:
      '方向集合经用户 2026-09-21 授权（008.1）与 2026-09-22 调整（008.2）确定：初期入口两条（主方向 cross-harness-collab、第二条 code-agent-verification），另两条延后不删除；研究定位为固定输入/输出 token 预算下的跨 harness 异构 Agent 协作机制与表示组合比较。公开证据初筛见 docs/research/DIRECTION-SCREENING-2026-09-15.md 与 docs/SCAFFOLD-008/07-source-audit.md。',
    pendingNote:
      '技术主干 T1/T5/T6 的部分资源为 2026-09-15 定向核查；Hugging Face Agents Course 与 Docker 官方 get-started 这次抓取失败，章节与访问条件都还没有核对，暂不作为可开始资源，只记在路线待办里。',
    protocolNote:
      '重要性、难度、类型三条轴独立判断；建议投入（recommendedDepth）与实际交付（deliveredDepth）分开，只有摘要最多交付 quick，没有摘要只交付 entry；已核指定正文的 quick 显示「简读卡 · 摘要及指定正文已核」。',
    notices: [
      '每篇卡都标注了实际依据：读了正文的标“正文精读”或“正文选读”，只读过摘要的标“摘要级判断”，核过摘要与指定正文的 quick 标“简读卡 · 摘要及指定正文已核”，只有可靠身份的标“原文入口”。',
      '卡片由 AI 依据公开原文整理，不代表本人已经读过；打开论文或外链不会改变任何本人状态。',
      '卡里的数字都取自论文原文的文字叙述并已登记定位（见各卡「来源与覆盖」）；表格与图多数未逐格核对，已核指定正文的卡按卡标注（如 Handoff Debt §5.1 表2）；只看过摘要的卡片不引用摘要里的百分比。',
      '除 TOSEM 参考 [56][58] 与 CAMERA 参考 [13] 两处外，论文之间的相邻关系都是整理时排定的阅读顺序，不是论文之间真实的引用关系。',
      '技术路线默认三条（多智能体架构 / RAG·检索记忆 / 图·浅尝）；其余主干保留在「其他主干（当前不必先学）」，不要求按十一条主干顺序学。',
      '精选简报是感知相关/前沿工作及方法的线索清单，不是今天的阅读作业；条目采用整理时排定的次序，不代表质量判断。',
      '经典书目与方向补充条目当前都是摘要级判断（依据 2026-09-15 逐页核查的 arXiv 页面）；录用信息只写 arXiv 页或 Anthology 页明确标注的，未标注的写“待核”。',
      '“我的记录”（状态/笔记/待读清单）只保存在当前浏览器 localStorage，不上传；换浏览器或清数据即丢失，导出 Markdown 是唯一备份手段。状态是本人手动标记，页面不做自动已读与进度统计。',
      '“近期登记发现”在你点击主题时才查询 Crossref；近期登记不等于近期发表，失败与限额都会明说，动态条目不进入阅读库、不写入任何记录。',
    ],
    // CCF 目录事实（D3 决策：并入方向页底部，不保留整块）：目录事实，不是投稿推荐。
    ccfNote: {
      text:
        'CCF A 类期刊与会议分列考虑，不混同（目录第七版 2026-03-31 发布、4 月 9 日勘误，2026-09-14 核查 CCF 官网）。人工智能类期刊：Artificial Intelligence、TPAMI、IJCV、JMLR；会议：AAAI、NeurIPS、ACL、CVPR、ICCV、ICML、IJCAI。这是目录事实，不是投稿推荐；未核查当年 CFP、截止日期或征稿范围。',
      sources: [
        { label: 'CCF 推荐国际学术刊物目录（按类别）', url: 'https://www.ccf.org.cn/Academic_Evaluation/By_category/' },
        { label: 'CCF 人工智能类目录', url: 'https://www.ccf.org.cn/Academic_Evaluation/AI/' },
      ],
    },
  },

  home: {
    title: '研究、阅读与技术学习',
    intro: '沿起步路线读论文，跟着广域脉络图看清 AI 到 Agent 的整体知识脉络，按需补 Agent 技术，定期看看值得留意的新工作。',
    updatedOn: '2026-09-24',
    // 008.2（01 D）：带类型首读——主方向第一步（站内问题导读），链接携带 route/track。
    startHere: {
      kind: 'article',
      materialId: 'mat-cross-harness-map',
      routeId: 'cross-harness-collab',
      track: 'start',
    },
    // PLAN-010 阶段 B：首页四区（阅读目标/综述总览/课题深化/技术入口），替代 008 五区平铺；
    // 旧五区内容不删，重排归入四区（精选与首读归入「阅读目标」，方向归入「课题深化」，
    // 技术路线归入「技术入口」，经典书目归入「综述总览」的共同语言小节）。
    zones: [
      {
        key: 'goal',
        title: '阅读目标',
        purpose: '这区回答「现在读什么、为什么、读到什么程度」：编辑建议的起步动线、站内基础导读，以及本人手动标记的「在读」直达。',
        howToUse: '先按主方向顺序走首读导读；三篇基础导读随时可插读；每日精选只是感知前沿，不是今天的作业。',
        entryLabel: '打开主方向路线',
        entryHash: '#/route/cross-harness-collab',
      },
      {
        key: 'survey',
        title: '知识脉络',
        purpose: '可自学的广域脉络图：AI 背景六线索、Agent 全景、专题分支三层，每个节点有问题、思想、例子、局限与来源，6 条学习路径给出建议顺序。',
        howToUse: '打开图后点节点（或键盘 Enter）看详解；手机上以层级文本为主，图文同一份数据；脉络是并行分支的合流，不是单线进化。',
        entryLabel: '打开广域脉络图',
        entryHash: '#/map',
      },
      {
        key: 'topic',
        title: '课题深化',
        purpose: '主方向的课题结构：四轴编辑分析框架（状态保存在哪里/谁决定传取什么/保存什么语义/如何获取及计费）、机制与表示对照、问题演化、未定候选。',
        howToUse: '沿四轴与问题演化看课题怎样从单 Agent 长任务走到预算约束协作；旧的对象/现状/理由/限制收在页内可展开处。',
        entryLabel: '打开课题结构与论文库',
        entryHash: '#/route/cross-harness-collab',
      },
      {
        key: 'tech',
        title: '技术入口',
        purpose: '默认三条技术路线（多智能体/RAG/浅图），各补了一句「与当前研究能力的关系」。',
        howToUse: '不要求先选方向也不必按旧主干顺序学；读论文卡住时只补当前方向用得上的单元，其余主干折叠在下方。',
        entryLabel: '进入技术学习',
        entryHash: '#/learn',
      },
    ],
    // 008.2（01 D）：firstUse 三条。
    firstUse: [
      { title: '先看两条方向', text: '两条方向各在解决什么，选一条起步（默认主方向：跨工具的智能体协作）。' },
      { title: '按顺序走', text: '按该方向「从这里开始」的顺序走，先建立概念再碰论文；archive 谱系初期不必走。' },
      { title: '按需补技术', text: '读论文卡住时，只补当前方向用得上的技术单元，不把十一条主干当课表。' },
    ],
  },

  directions: DIRECTIONS,

  materials: MATERIALS,

  // ---------- DYNAMIC-GUIDANCE-009 / A 包基线地图（2026-09-23）----------
  // 契约：docs/DYNAMIC-GUIDANCE-009.md R1（模型）、R7（来源审查）。
  // - 两侧固定：problem＝Agent 研究对象／问题（含开放问题）；method＝方法／解决思想。
  // - 节点 id 匹配 ^map-[a-z0-9][a-z0-9.-]{1,47}$，边 id 形如 map-edge-*；发布后不改义、不回收。
  // - refs 只引用站内已存在 ID（direction / material / paper / step-*），由渲染层（B 包）解析。
  // - source.originType 封闭枚举 content|advisor|ai|self；本基线全部 content：内容均可回溯到站内
  //   经 2026-09-23（009-A）逐节复核的阅读卡/primer/方向条目（见 docs/DYNAMIC-GUIDANCE-009.md R7 表）。
  // - meaning 固定词汇：addresses（方法→问题）/ variant-of / conflicts / depends-on / inspires；
  //   冒号后为这一条边的语义注记。关系是编辑排定的概念关联，不是论文引用（PF-07）。
  // - evidence[] 每项站内可解析且命中 R7「保留可用」；advisor/ai 不成边（R1 来源限制）；
  //   未连接的开放问题只以 problem 节点文字行呈现，不画线。
  // - 基线＋生效覆盖层合并后总额 ≤12 节点 / ≤15 边（R1）；当前基线 10/12，为 C 包覆盖层留 2/3 余量。
  // - 第二方向（code-agent-verification）相关条目因本轮 R7 结论为「保留收窄」（TOSEM/SWE-bench 未能
  //   重新核对正文），按规则不得成边，故其节点暂不进入基线地图；见 R7 表与 tests/library.test.mjs。
  map: {
    nodes: [
      {
        id: 'map-prog-budget',
        side: 'problem',
        label: '预算受限时哪种协作组合更合适',
        summary:
          '主方向总问题（2026-09-22 用户批准的方向定义）：不同 Agent 无法共享同一 harness、完整上下文与持续会话时，在固定输入/输出 token 预算下，哪种机制与信息表示的组合能让异构模型以合适成本持续完成复杂任务。哪类项目、哪对模型、哪种预算与合作阶段适合哪种做法，仍是开放问题；不预设共享状态或交接包胜出。',
        refs: ['cross-harness-collab', 'step-collab-1'],
        source: {
          originType: 'content',
          note: '取自方向 summary/overview 与站内问题导读（四层与两本账表述）；方向定义经用户 2026-09-22 授权（008.2）。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-prog-represent',
        side: 'problem',
        label: '传什么：摘要、轨迹、交接包还是工件',
        summary:
          '表示层问题：summary、raw trajectory、handoff packet、wiki、状态快照、检索选段各有信息量与成本；「多传信息总更好」是常见先验，已在换手对照里成为待检验对象（见相邻边）。对哪类项目与哪个后任模型，哪种表示更合适，仍待研究。',
        refs: ['step-collab-1', 'handoff-tax', 'mat-cross-harness-map'],
        source: {
          originType: 'content',
          note: '候选枚举出自问题导读正文（编辑综合）；作为待检验问题的换手证据出自 Handoff Tax 卡已核 §3/§4（2026-09-23 复核）。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-prog-memory',
        side: 'problem',
        label: '存下来的不会自动进入这轮输入',
        summary:
          '记忆与检索是候选机制；存进外部存储的信息必须被写入策略与读回策略选中，才影响接收方这一轮输入。记忆何时有用、何时过期或传播错误、由谁决定读写，是方向 openQuestions 第 3 条的开放问题；MemGPT 只提供单 Agent 的机制直觉，不是多 Agent 协作效果证据。',
        refs: ['step-collab-3', 'memgpt', 'cross-harness-collab'],
        source: {
          originType: 'content',
          note: '「存储≠当前输入」核自 MemGPT 卡已登记 §2（2026-09-23 逐小节复核）；过期/传播错误为方向开放问题文字行，非论文结论。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-prog-handoff',
        side: 'problem',
        label: '换手后下一任要重新发现多少',
        summary:
          '换手切片：前任在中断点离开、后任在隔离环境继续时，后任看到什么、要多走多少步、能否解出。「重新发现成本」把直觉变成可讨论的问题；换手只是整个协作问题的第一切片，持续分工、反馈往返与长期合作仍在研究范围内（方向定义与导读表述）。',
        refs: ['step-collab-4', 'step-collab-5', 'cross-harness-collab'],
        source: {
          originType: 'content',
          note: '概念核自 Handoff Debt 卡已登记 §5.1/§5.3（2026-09-23 复核）；「切片而非全题」出自方向 overview 与导读正文。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-prog-combine',
        side: 'problem',
        label: '组合收益来自互补还是更多信息量',
        summary:
          '开放问题（方向 openQuestions 第 4 条）：把多种机制组合起来（如记忆+检索+交接包），收益是机制互补，还是仅仅用了更多信息、更多调用或更大工具权限？目前没有站内已核证据判定任何组合胜出，本节点作为待查问题呈现。',
        refs: ['cross-harness-collab', 'step-collab-1'],
        source: {
          originType: 'content',
          note: '方向 openQuestions 原文归属；导读「组合例子为编辑构造、不表示哪种更好」的边界表述。站内没有任何已核结论直接回答它，只有一条「问题由四层划分提出」的边。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-meth-fourlayers',
        side: 'method',
        label: '四层划分：场景/机制/表示/传输',
        summary:
          '站内问题导读的教学划分：场景（在什么约束下协作）、机制（用什么方式协作）、表示（具体传什么）、传输（怎么把信息搬过去）。机制可组合、不互斥；文件、Git、协议解决「怎么搬」，不解决「搬什么最有效」。预算记两本账：接收方一次可见的上下文额度，与端到端累计输入/输出消耗。工作性分类，存在交叠，不伪称任何论文提出的公认分类。',
        refs: ['mat-cross-harness-map', 'step-collab-1'],
        source: {
          originType: 'content',
          note: '编辑正文（primer），07 审计与 009-A 均核对其来源说明与标注；其依据的四篇论文 2026-09-23 逐节复核通过。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-meth-dimensions',
        side: 'method',
        label: '把协作拆成四个维度',
        summary:
          'Beyond Frameworks 的维度分解（§3.2 治理：集中 instructor 协调 vs 分散自组织；§3.3 参与：谁在哪轮发言；§3.4 交互：I1 同时/I2 顺序/I3 随机顺序/I4 选择性点对点；§3.5 历史管理：每轮看到什么历史，含 C1「上一轮完整日志」）。同一协调规则可配不同历史表示——「机制/表示组合」由此有可点名的维度词汇。',
        refs: ['beyond-frameworks', 'step-collab-2'],
        source: {
          originType: 'content',
          note: '§3.2–3.5 各小节定义 2026-09-23 对 arXiv:2505.12467v1 HTML 逐节复核；实验场景（DEI/SES）非跨 harness 设置，见卡 coverage。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-meth-paging',
        side: 'method',
        label: '虚拟上下文管理：分层存储＋控制流',
        summary:
          'MemGPT 机制：主上下文（系统指令、工作上下文、FIFO 队列）与外部存储分层，队列管理器在换出阈值触发时摘要归档，LLM 经函数调用自主决定写入与读回（§2.1–2.4 控制流与函数链）。要点：信息不会自动进入这一轮输入，搬运由策略执行。「存下来的 ≠ 当前可见」的最小机制直觉。',
        refs: ['memgpt', 'step-collab-3'],
        source: {
          originType: 'content',
          note: '§2.1–2.4 于 2026-09-23 对 arXiv:2310.08560v2 HTML 复核；单 Agent 上下文管理，不作多 Agent 协作效果证据（卡内局限）。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-meth-cond',
        side: 'method',
        label: '方向条件化的交接界面对照',
        summary:
          'Handoff Tax 的对照设计：方向（升配/降配）× 时机（步数百分位）× 界面（Raw / Compact_pre / Compact_suf / Traj-drop，均保留工作树、只改轨迹信息）。已核 §4：升配时 Raw 只恢复部分质量优势（QRec≈47%/36%），Traj-drop 反而更高（≈64%/84%）；降配 CSRet 随模型对而异：Claude 对 Raw 保留约 80% 成本优势，GPT 对仅约 14%。界面优劣随方向反转——解决思路是把「选什么界面」变成条件化问题。',
        refs: ['handoff-tax', 'step-collab-4'],
        source: {
          originType: 'content',
          note: '四条件、同脚手架与 §4 数字 2026-09-23 对 arXiv:2608.24358v1 复核（hard 子集 N≈24 属探索性，不外推）。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-meth-ledger',
        side: 'method',
        label: '分账度量：事件数/累计token/解出率',
        summary:
          'Handoff Debt 的度量思路：在中断点冻结仓库，后任在四种交接视图（仅仓库/原始轨迹/摘要笔记/结构化笔记）下接续，分开报告 agent 事件数、累计 prompt token、初始提示长度与是否解出。已核 §5.1 表2 与 §5.3：操作更少推不出 token 更省，累计消耗优劣随接收模型而变。解决思路：先定记账口径，再谈哪种交接「更划算」。',
        refs: ['handoff-debt', 'step-collab-5'],
        source: {
          originType: 'content',
          note: '表2 数字（602k/811k、300k/319k、1.66M/2.30M）与初始长度（87k vs 7.2k/9.8k/10.0k 字符）2026-09-23 对 arXiv:2606.02875v2 复核。',
          asOf: '2026-09-23',
        },
      },
    ],
    edges: [
      {
        id: 'map-edge-layers-budget',
        from: 'map-meth-fourlayers',
        to: 'map-prog-budget',
        meaning: 'addresses：四层划分把「哪种组合合适」拆成可按层作答的问题，不混成「换一种摘要格式」',
        evidence: ['mat-cross-harness-map', 'step-collab-1', 'cross-harness-collab'],
        source: {
          originType: 'content',
          note: '编辑排定的概念关联（导读→方向问题），非论文引用（PF-07）。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-edge-layers-combine',
        from: 'map-meth-fourlayers',
        to: 'map-prog-combine',
        meaning: 'addresses（部分）：机制不互斥、表示各记成本的划分，使「组合收益归因」成为可提出的问题',
        evidence: ['mat-cross-harness-map'],
        source: {
          originType: 'content',
          note: '编辑排定；组合例子为编辑构造、不表示哪种更好（导读内标注），非论文引用。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-edge-dims-budget',
        from: 'map-meth-dimensions',
        to: 'map-prog-budget',
        meaning: 'addresses：维度词汇把「机制组合比较」变成点名维度取值的问题，避免按框架名排名',
        evidence: ['beyond-frameworks', 'step-collab-2'],
        source: {
          originType: 'content',
          note: '编辑排定的概念关联（step-collab-2 purpose 同表述），非论文引用；维度定义见卡已核 §3.2–3.5。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-edge-dims-repr',
        from: 'map-meth-dimensions',
        to: 'map-prog-represent',
        meaning: 'addresses：§3.5 历史管理（每轮看到什么历史）直接对应「传什么」的表示选择',
        evidence: ['beyond-frameworks'],
        source: {
          originType: 'content',
          note: '卡内 reasons 已登记的对应关系（编辑整理）；§3.5 定义 2026-09-23 复核，非论文引用。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-edge-page-mem',
        from: 'map-meth-paging',
        to: 'map-prog-memory',
        meaning: 'addresses：写入/换出/读回的控制流机制具体演示「存储与当前输入」的分界',
        evidence: ['memgpt', 'step-collab-3'],
        source: {
          originType: 'content',
          note: '机制事实限定在卡已核 §2.1–2.4 范围内（单 Agent 例子）；编辑排定，非论文引用。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-edge-page-repr',
        from: 'map-meth-paging',
        to: 'map-prog-represent',
        meaning: 'addresses（部分）：换出与检索读回说明「哪些内容进入这一轮」本身就是表示选择',
        evidence: ['memgpt', 'mat-cross-harness-map'],
        source: {
          originType: 'content',
          note: '导读例子二（长期记忆+检索+交接包，编辑构造并标注）与 MemGPT 卡机制概述的对应；编辑排定，非论文引用。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-edge-cond-repr',
        from: 'map-meth-cond',
        to: 'map-prog-represent',
        meaning: 'addresses：四种轨迹处理条件就是表示层的对照实验化，直接回答「传什么」',
        evidence: ['handoff-tax', 'step-collab-4'],
        source: {
          originType: 'content',
          note: '卡内 reasons 登记（四条件是表示层比较的现成设计）；§3 条件 2026-09-23 复核；编辑排定，非论文引用。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-edge-cond-reverses-intuition',
        from: 'map-meth-cond',
        to: 'map-prog-represent',
        meaning: 'conflicts：与「多传信息总更好」的先验相抵——升配 Traj-drop 反而恢复更多（≈64%/84%）；降配 Claude 对 Raw 保留约 80% 成本优势、GPT 对仅约 14%',
        evidence: ['handoff-tax', 'step-collab-4'],
        source: {
          originType: 'content',
          note: '冲突仅在两篇已核设置的口径内陈述（同一 mini-swe-agent 脚手架、两对模型、单轮换手），不反断「越少越好」；step-collab-4 purpose 同表述。编辑排定，非论文引用。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-edge-ledger-handoff',
        from: 'map-meth-ledger',
        to: 'map-prog-handoff',
        meaning: 'addresses：把「后任接上没有」变成事件数/累计 token/解出率的分开度量',
        evidence: ['handoff-debt', 'step-collab-5'],
        source: {
          originType: 'content',
          note: '§5.1 表2、§5.3 于 2026-09-23 复核；分账事实限定在卡登记范围，编辑排定，非论文引用。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-edge-ledger-repr',
        from: 'map-meth-ledger',
        to: 'map-prog-represent',
        meaning: 'addresses：四视图（仅仓库/原始轨迹/摘要笔记/结构化笔记）给「传什么」可点名的 baseline',
        evidence: ['handoff-debt', 'step-collab-5'],
        source: {
          originType: 'content',
          note: '卡内 reasons 登记（四视图是表示层候选的具体化）；四视图定义核自摘要页与 §5 已读范围；编辑排定，非论文引用。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-edge-ledger-budget',
        from: 'map-meth-ledger',
        to: 'map-prog-budget',
        meaning: 'addresses：操作数与累计消耗不互换的记账法，是「合适成本」这一问法的度量底座',
        evidence: ['handoff-debt', 'mat-cross-harness-map'],
        source: {
          originType: 'content',
          note: '「两本账」出自导读正文（编辑表述），记账实例核自 Debt §5.1/§5.3；编辑排定，非论文引用。',
          asOf: '2026-09-23',
        },
      },
      {
        id: 'map-edge-handoff-on-repr',
        from: 'map-prog-handoff',
        to: 'map-prog-represent',
        meaning: 'depends-on：换手要重新发现多少，取决于交接时传了哪种表示',
        evidence: ['handoff-debt', 'handoff-tax'],
        source: {
          originType: 'content',
          note: '两篇已核换手研究的共同设置观察（编辑综合）；问题节点间关联，非论文引用关系。',
          asOf: '2026-09-23',
        },
      },
    ],
  },

  // ---------- PLAN REV001（2026-09-24 补包）：广域认知脉络图 LIBRARY.landscape ----------
  // 主体渲染在 #/map（可点击 SVG + 同源层级文本/节点详解，图文同数据）；旧 009 基线地图保留为次级区，
  // 其数据与校验（DG009-A）不动。规模：20 节点（AI 背景 6 + Agent 全景 13 + 专题 1）、6 学习路径。
  // 边两类：academic＝学术关系（附审计来源 source{note, asOf}）；reading＝建议阅读顺序/编辑映射（只给编辑理由，
  // 不附伪来源）。节点字段：问题/思想/例子/能力变化/局限/来源，前后关系由边表达。
  // 来源唯一准绳＝docs/research/ai-agent-landscape-source-audit.md（2026-09-24 交付）：
  // 大部分条目为摘要+元数据级、三篇为章节结构级（框架级正文），节点正文按此强度写，不冒充已核全文；
  // Findings of ACL 不等同 ACL 主会（不标 CCF-A）；元数据作者自注（NSR 接收等）不升级为正式核验。
  landscape: {
    note: '广域认知脉络图是编辑整理的知识地图：帮助从 AI 发展的整体脉络理解 Agent。讲述的不是单一来源的 AI 通史，而是多条并行分支在 Agent 处的合流（历史先后不等于全面替代）；节点正文供直接自学，原文是证据与选读、不是必读作业。十个关键节点（预训练/对齐、Agent 闭环、推理/规划、工具/RAG/记忆、协作、评测）附连贯讲解，选中即读。范围提示：RLHF 只是使用人类反馈的一类对齐方法；深度强化学习广泛用于序列决策与控制，与 RLHF 不是互斥关系。本图对这两条路线都未系统覆盖，仅在对齐与指令跟随、推理两个节点按背景常识点名。',
    asOf: '2026-09-24',
    layers: [
      { id: 'land-layer-bg', title: 'AI 背景', summary: '六条基础线索——Agent 的每个部件都站在这些线索的末端；只讲问题动机与核心思想，不展开技术细节。' },
      { id: 'land-layer-agent', title: 'Agent 全景', summary: '按 Agent 的组成组织：闭环总览、感知与多模态、推理与规划、工具/检索/记忆、协作、评测与可信。' },
      { id: 'land-layer-topic', title: '专题分支', summary: '深入专题的接入口：从全景映射回本工作区的研究方向（记忆/通信的已核专题见各综述卡）。' },
    ],
    nodes: [
      // —— 路径 A · AI 基础发展（背景层 6 节点，摘要+元数据级）——
      {
        id: 'land-a1', layer: 'land-layer-bg', title: '符号与搜索', when: '20 世纪中后期',
        problem: '机器能否「思考」？早期 AI 的答案是先把知识和推理规则显式写下来。',
        idea: '智能可用符号表示 + 逻辑规则 + 搜索实现；定理证明、专家系统、经典规划是其代表，面对组合爆炸时靠启发式裁剪搜索空间。',
        example: '逻辑定理证明器、医学诊断专家系统、靠大规模搜索与评估函数取胜的象棋程序。',
        capability: '在规则封闭的窄域达到高水平。',
        limitation: '遭遇知识获取瓶颈——常识写不完，环境一变就脆弱。这条线索没有死亡：它与统计学习是并行分支，神经符号计算是其后来的互相借鉴（来源为 2017 年预印本综述，作思想前史足够、作机制依据不足）。衔接：符号路线「常识写不完」的困境，正是下一节点统计学习要回答的问题。',
        source: { note: 'Neural-Symbolic Learning and Reasoning: A Survey and Interpretation（arXiv:1711.03902，预印本）；核对了摘要与元数据，正文未逐行读', asOf: '2026-09-24' },
        topics: [],
      },
      {
        id: 'land-a2', layer: 'land-layer-bg', title: '统计学习', when: '1990s–2000s',
        problem: '知识手写不完，能否从数据中自动归纳规律？',
        idea: '学习＝从有限样本逼近未知函数；训练/测试划分、泛化误差、偏差-方差权衡、过拟合与正则化是通用语言；监督与无监督是两类基本设定。',
        example: '垃圾邮件分类、支持向量机与集成方法时代的表格数据建模。',
        capability: '给深度学习提供了问题表述与评测习惯。',
        limitation: '表现高度依赖人工特征与数据质量——这个瓶颈是推动深度学习发展的因素之一（非唯一因果）。衔接：它给下一节点深度学习留下的是问题表述与评测习惯，而不是方法本身。备选先读：Domingos《A Few Useful Things to Know about ML》（CACM 2012，已核备选）。',
        source: { note: '统计学习无独立入选来源：背景脉络取自 Deep Learning（LeCun/Bengio/Hinton，Nature 2015 正式版）的教程综述，备选为 Domingos《A Few Useful Things to Know about ML》（CACM 2012）；两者均只核到摘要与元数据', asOf: '2026-09-24' },
        topics: [],
      },
      {
        id: 'land-a3', layer: 'land-layer-bg', title: '深度学习', when: '2010s',
        problem: '特征工程人工昂贵、领域迁移差。',
        idea: '多层可微函数 + 反向传播，让机器自动学「表示」：底层抓边缘纹理，高层抓物体语义；卷积处理空间结构，循环处理序列。',
        example: '视觉识别与语音识别在 2010 年代前半的跃进（该综述的历史脉络）。',
        capability: '表示学习统一了视觉、语音、语言的任务方法。',
        limitation: '数据与算力饥渴、决策可解释性差、对分布外输入脆弱——这三条限制一路带进 Agent 时代。方法上它仍是统计学习（经验风险最小化），与符号线索并行不悖。衔接：深度学习学到的「表示」思路，在下一节点注意力与 Transformer 处被重组成可并行的架构。',
        source: { note: 'Deep Learning（LeCun/Bengio/Hinton，Nature 2015 正式版，OpenAlex 核 DOI）；核对了摘要与元数据——权威教程综述，但已十年，细节以近年文献为准', asOf: '2026-09-24' },
        topics: [],
      },
      {
        id: 'land-a4', layer: 'land-layer-bg', title: '注意力与 Transformer', when: '2017',
        problem: '循环网络逐步处理序列，难并行、长程信息易衰减。',
        idea: '自注意力让序列中任意两对位置直接交互（查询-键-值、缩放点积、多头），加位置编码保留次序，整个架构高度可并行。',
        example: '机器翻译质量跃升是原始论文（2017，NeurIPS）的标志性结果（原始论文未入本包，作背景常识点名）。',
        capability: '成为后续大模型架构的主要底座（并行替代路线存在，但本图按主流谱系呈现）。',
        limitation: '标准注意力的计算与显存随序列长度平方增长，长文本与多轮交互场景被卡成本——高效注意力谱系（稀疏/线性/近似）正是综述主题。这也是 Agent 长上下文问题的技术根源。衔接：Transformer 的成本曲线，直接引出下一节点「预训练与基础模型」对规模与效率的权衡。',
        source: { note: 'Efficient Transformers: A Survey（Tay 等，ACM Computing Surveys 2022 正式版，OpenAlex 核 DOI）；核对了摘要与元数据，CCF 等级未核到不标', asOf: '2026-09-24' },
        topics: [],
      },
      {
        id: 'land-a5', layer: 'land-layer-bg', title: '预训练与基础模型', when: '2020–2022',
        problem: '每个任务单独训练一个模型太浪费，能否「一次训练、到处适配」？',
        idea: '在大规模语料上做自监督预训练（如语言建模），再通过微调或提示适配下游任务；报告观点认为规模到达一定程度后出现「涌现」能力——该判断有争议，属报告论点，不作定论转述。',
        example: '该报告点名的 BERT、GPT-3、DALL·E 一代模型。',
        capability: '能力涌现但不可靠；评估与治理滞后，能力集中于少数机构。',
        limitation: '这是斯坦福 CRFM 的百余人研究报告，不是同行评审论文——引用其判断时注明「报告的论点」。它与强化学习是并行分支，在 Agent 处合流。',
        guide: {
          motivation: '在预训练普及之前，每做一个任务（翻译、分类、问答）都要单独收集数据、单独训练一个模型。预训练要回答的是：能不能先让模型在通用文本上完成一次「通识教育」，之后每个具体任务只用很少的适配成本？',
          mechanism: '机制分两步。第一步是自监督预训练：不给人工标注，而是让模型在海量文本上练「猜下一个词」这类可以从数据自身构造监督信号的任务，由此学会语法、事实与推理的统计规律。第二步是适配：下游任务通过微调（在小数据上继续训练）或提示（把任务写进输入）完成。「涌现」指规模超过某档后突然出现小模型没有的能力——这是报告的提法，后续文献认为部分「突变」是评测指标不连续造成的假象（编辑解释：两种说法都先记住，不必裁决）。',
          example: '报告点名的三个代表：BERT（双向编码、靠微调适配）、GPT-3（大规模自回归、靠提示就能做新任务）、DALL·E（文本生成图像）。它们是基础模型时代早期形态各异的三例，不是同一个底座的三种用法。',
          confusion: '最易混的是「预训练 vs 对齐」（下一节点）：预训练给模型的是能力与知识——它「会什么」；对齐管的是它「听不听话、按谁的意图干活」。模型变大不会自动解决后者。另一个易混点是「涌现」：它是报告观点且有争议，不要当作已裁决事实引用。',
          links: '方法依赖上一节点 Transformer（注意力是预训练能并行的前提）；它与强化学习路线是并行分支、在 Agent 处合流；「会什么」立住之后，下一节点对齐回答「怎么用才可靠」。',
        },
        sourceBrief: '来源：斯坦福 CRFM/HAI 报告《On the Opportunities and Risks of Foundation Models》；核到摘要与元数据（研究报告，非同行评审论文）',
        source: { note: 'On the Opportunities and Risks of Foundation Models（斯坦福 CRFM/HAI 报告，arXiv:2108.07258 v3）；核对了摘要与元数据——研究报告，非同行评审论文', asOf: '2026-09-24' },
        topics: [],
      },
      {
        id: 'land-a6', layer: 'land-layer-bg', title: '对齐与指令跟随', when: '2022',
        problem: '模型变大不等于听用户话——会跑题、会产生有害或不诚实内容。',
        idea: '先指令微调，再用人类反馈强化学习（RLHF）：人类比较答案训练奖励模型，以 PPO 优化语言模型对齐人类偏好；宪法 AI / RLAIF 是用 AI 反馈替代部分人类标注的并行分支。',
        example: 'InstructGPT（1.3B 参数）在人类偏好比较中胜过 175B 的 GPT-3（论文摘要自陈）——规模之外还有「听不听话」的维度。',
        capability: '让模型可被普通用户调度；对齐帮助模型遵循工具与角色接口，但调用正确性仍需接口约束、参数校验与环境反馈把关。',
        limitation: '奖励黑客、偏好因人而异、对齐可能损失部分能力（对齐税）。',
        guide: {
          motivation: '预训练模型 continuation 的是「像人话的话」，不是「你要的答案」——直接拿来用会跑题、编造、产生有害内容。对齐要回答：怎么让模型按用户的意图干活，而不是只按统计规律接话？',
          mechanism: '以 InstructGPT 的路线为例分三步（编辑解释：三步是论文摘要级的共识讲法）。第一步指令微调：用人工撰写的「指令—理想回答」样例做有监督训练，先学会「这是个任务」的格式。第二步训练奖励模型：把同一提示下的多个回答两两配对请人比较，训练一个给回答打分的模型。第三步强化学习：以奖励模型的分数为回报，用 PPO 策略梯度微调语言模型。后起的宪法 AI / RLAIF 用 AI 自己的批评替代部分人类标注，是同一思想的并行分支。',
          example: '论文摘要自陈：1.3B 参数的 InstructGPT 在人类偏好比较中胜过 175B 的 GPT-3。规模差了上百倍，「听不听话」却逆转了——这个对照本身就是「对齐是独立维度」的证据。',
          confusion: '两对易混。其一「预训练 vs 对齐」：上一节点给能力，本节点给可控性，对齐税说的是两者可能互相拉扯。其二「RLHF vs 深度 RL」：RLHF 只是用人类反馈的一类对齐方法；用深度强化学习训练推理模型是与之不同的并行分支，两者不互斥，本图都未系统展开。',
          links: '依赖上一节点预训练的能力；对齐帮助模型遵循工具与角色接口，但这不是可靠性的必要条件：调用正确性还靠接口约束、参数校验与环境反馈。再往下进入「Agent 与感知—规划—行动循环」节点。',
        },
        sourceBrief: '来源：InstructGPT 论文（NeurIPS 2022 正式版，CCF 目录核 A 类会议）；核到摘要与元数据',
        source: { note: 'Training language models to follow instructions with human feedback（Ouyang 等，NeurIPS 2022 正式版，CCF 目录核 A 类会议）；核对了摘要与元数据', asOf: '2026-09-24' },
        topics: [],
      },
      // —— 路径 B · Agent 总览 ——
      {
        id: 'land-b1', layer: 'land-layer-agent', title: 'Agent 与「感知—规划—行动」循环', when: '2023',
        problem: '一次性问答完成不了多步真实任务（查资料、填表、改代码）。',
        idea: '把语言模型放进闭环：接收环境/用户输入 → 更新记忆 → 规划下一步 → 行动 → 观察结果，循环到目标达成。总览综述以四模块组织——profiling（角色与画像）、memory（记忆）、planning（规划）、action（行动）。',
        example: '「AI 助手订机票」的教科书式循环：查班次→比价→下单→确认。',
        capability: '从「一个模型」变成「一个系统」；本层是 C/D/E 全部专题节点的容器。',
        limitation: '框架各模块的实现差异极大，「用了某框架」不等于解决了任何机制问题。',
        guide: {
          motivation: '问一次答一次的模式，只适合答案在模型参数里或一轮就能推完的任务。真实任务（订机票、修 bug、填报销单）要分好多步、中间还要看环境的脸色。Agent 要回答：怎么把语言模型包进一个能自己转起来的循环？',
          mechanism: '循环每一轮做四件事：感知——读入用户指令与环境反馈（上一轮的执行结果）；规划——决定下一步做什么，可以很简单（直接回话）也可以分解为子任务；行动——调用工具或输出内容；观察——把行动结果读回来，作为下一轮感知的输入。总览综述用四个模块刻画这套构造：profiling 定角色与画像（它是谁、会什么），memory 管记忆（它记得什么），planning 管规划（它接下来做什么），action 管行动（它怎么动手）。',
          example: '「订一张下周三去上海最便宜的机票」：查班次（工具）→ 比价（读结果）→ 下单（写操作）→ 确认出票（观察）→ 若失败则重试或改方案。每一步都依赖上一步的真实返回，而不是一次性生成全部答案。',
          confusion: 'Agent 和「一次问答」的本质差别有三处（编辑解释：以下三处是「Agent 与一次问答的本质差别」节点并入本节点的承接讲解）。一是状态累积：上下文就是状态，多轮之后窗口里装着整段历史，管理不好就溢出或失真；二是误差累积：每一步的小错沿链放大，第二步误读第一步的订单号，后面全链崩溃；三是环境接地：行动成败由真实环境裁定，模型无法靠流畅自洽蒙混。这三个性质就是 C/D/E 各专题存在的理由。',
          links: '本层是坐标系：感知与多模态、推理、规划挂在输入与「想清楚」一侧，行动与工具使用是输出侧，知识检索与记忆是知识与状态侧，多智能体协作是群体推广，评测与成本是账本；往下先读三处本质差别的展开（「Agent 与一次问答的本质差别」已并入本节点），再进路径 C（感知与认知核心）。',
        },
        sourceBrief: '来源：LLM Agents 总览综述（FCS 2024 正式版，CCF-B）；核到章节结构（框架级），未逐行读全文',
        source: { note: 'A Survey on Large Language Model based Autonomous Agents（Wang 等，Frontiers of Computer Science 2024 正式版，CCF-B）；核对了章节结构与组织逻辑（框架级），未逐行读全文', asOf: '2026-09-24' },
        topics: [],
      },
      {
        id: 'land-b2', layer: 'land-layer-agent', title: 'Agent 与一次问答的本质差别', when: '2023',
        problem: '只是「包一层循环」，差别真的大吗？',
        idea: '差别在三处——多步交互带来状态累积（上下文就是状态）、误差累积（每一步的小错沿链放大）、以及环境接地（行动成败由真实环境裁定，模型无法靠流畅自洽蒙混）。',
        example: '多轮任务中第二步误读了第一步的订单号，后面全链崩溃——单轮问答里这种错误无从发生。',
        capability: '说明为什么 Agent 的研究议程几乎等于「让循环在长任务上不衰减」。',
        limitation: '任务越长线，规划与记忆的短板越暴露（规划与任务分解、记忆与状态、评测与成本三节点展开）。衔接：三处差别的完整讲解已并入上一节点（Agent 与「感知—规划—行动」循环）的「易混」段；顺着它进入路径 C，看「想清楚」（推理与规划）如何延缓误差累积。',
        source: { note: '同一总览综述的引言部分（摘要级）＋编辑综合——本节点是上一节点（Agent 与「感知—规划—行动」循环）的推论节点，无独立来源', asOf: '2026-09-24' },
        topics: [],
      },
      // —— 路径 C · 感知与认知核心 ——
      {
        id: 'land-c1', layer: 'land-layer-agent', title: '感知与多模态', when: '2023',
        problem: '世界不只是文本——图像、音频、视频怎么进语言模型？',
        idea: '以语言模型为「大脑」，用视觉/音频编码器把原始信号对齐到语言空间，统一用指令跟随接口调度多模态任务。',
        example: '看图写故事、免 OCR 的数学题推理（综述摘要点名）。',
        capability: '组成 Agent 闭环的输入侧。',
        limitation: '幻觉从文字扩展到感知、细粒度与空间理解仍弱——感知错误会作为误差累积的第一环进入闭环。venue（NSR 接收）仅 abs 评论字段自注，未检到正式版记录，按「已接收待刊」对待。衔接：感知决定闭环第一环的输入质量，接下来的推理与规划两节点处理「想清楚」的部分。',
        source: { note: 'A Survey on Multimodal Large Language Models（Yin 等，arXiv:2306.13549）；核对了摘要与元数据；NSR 接收为作者自注（abs 评论字段）、未检到正式版记录', asOf: '2026-09-24' },
        topics: [],
      },
      {
        id: 'land-c2', layer: 'land-layer-agent', title: '推理：链式思考与推理增强', when: '2022–2023',
        problem: '参数记忆「背」不出多步算术、多跳逻辑——答案需要在推理过程中逐步算出。',
        idea: '让模型生成中间推理步骤再作答的 CoT 范式，配合多采样取一致、检索外部知识辅助、训练侧推理数据增强等路线；综述系统梳理了当时（2022–2023）的推理增强方法谱系。',
        example: '多步算术与常识推理任务上，「先推理后作答」显著优于直接作答。',
        capability: '依赖预训练的规模能力，是规划的认知基础。',
        limitation: '步骤变长不等于结论变对，自我纠错不可靠，无形式保证。注意：该文发表于 Findings of ACL 2023——Findings 不等同 ACL 主会，不标 CCF 等级；此后推理模型（RL 训练专门化）是快速演化的并行分支，本图不展开。',
        guide: {
          motivation: '语言模型学文本时见过大量「问题—答案」对，参数记忆里存的是答案的分布，不是计算过程。遇到多步算术、多跳逻辑这类「答案必须现场算出来」的题，直接作答容易一步错步步错。推理增强要回答：怎么让模型把思考过程显式摊开在纸上再下结论？',
          mechanism: '主流做法是链式思考（CoT）：提示或训练模型先输出中间推理步骤、再给最终答案，把一步大跳变成多小步。围绕它有三类增强（编辑解释：分类为综述脉络的通行讲法）：采样侧——同一个题让模型生成多条推理路径，取多数一致的答案（自洽投票）；知识侧——推理卡住时检索外部知识补进上下文；训练侧——构造推理样例微调，把「先推理后作答」的习惯训进权重。',
          example: '多步算术与常识推理任务上，「先推理后作答」显著优于直接作答——同一个模型，只是把草稿纸铺开，正确率就上一个台阶。',
          confusion: '最易混的是「推理 vs 规划」（下一节点）：推理管单步内部想清楚，规划管步骤之间的分解与次序。另一个误区是「步骤长＝想得对」：推理链可能每步都流畅却整体跑偏，自我纠错并不可靠，也没有形式化保证，所以关键结论仍要外部核验。该文是 Findings of ACL 2023（主会附属文集，不继承主会等级）。',
          links: '依赖预训练与基础模型节点的规模能力——小模型先学会语言规律，CoT 才有东西可「展开」；它是下一节点（规划与任务分解）的认知基础：规划把任务切成步骤，推理保证每一步内部算得清。',
        },
        sourceBrief: '来源：推理综述（Findings of ACL 2023，不继承主会 CCF 等级）；核到摘要与元数据',
        source: { note: 'Towards Reasoning in Large Language Models: A Survey（Huang & Chang，Findings of ACL 2023，OpenAlex 核 Anthology DOI）；核对了摘要与元数据', asOf: '2026-09-24' },
        topics: [],
      },
      {
        id: 'land-c3', layer: 'land-layer-agent', title: '规划与任务分解', when: '2023',
        problem: '长任务无法一次想出全部步骤，且环境会中途变化。',
        idea: '分解—执行—观察—重规划的闭环；总览综述把规划分为无反馈规划与有反馈规划两类，后者把执行结果重新纳入决策。',
        example: '旅行规划先分解为订交通/住宿的子任务，执行中航班取消则触发重规划。',
        capability: '组成 Agent 的决策中枢，依赖单步推理质量。',
        limitation: '计划漂移（执行偏离原计划后模型不自知）、子目标分解谬误、重规划成本随任务长度上升。',
        guide: {
          motivation: '「写一份调研报告」这样的任务，步骤多到没法在一个提示里一次想全；而且执行中环境会变——航班取消、接口报错、需求改口。规划要回答：怎么把一个远目标拆成可执行的步骤序列，并在中途变化时修正路线？',
          mechanism: '基本循环是四拍：分解——把目标拆成有依赖次序的子任务（先订交通才能订接机）；执行——按序或按需做每一步；观察——读每一步的真实结果；重规划——结果与预期不符时改后面的计划。总览综述把规划分成两类：无反馈规划一次性出计划再执行，适合环境稳定、步骤可预知的任务；有反馈规划把执行结果不断重新纳入决策，适合环境会变的任务——代价是每轮都要多想一遍。',
          example: '旅行规划：先分解为交通、住宿、行程三个子任务；执行到一半航班取消，观察环节发现原计划失效，触发重规划——改签或换交通方式，后续住宿与行程相应挪动。',
          confusion: '与上一节点推理的分工最易混：推理保证「每一步内部想清楚」，规划管理「步骤之间的依赖、次序与时机」。两者都会「一步一步来」，但误差形态不同——推理错在一步之内，规划错在步骤之间（漏了依赖、该重规划时没重规划）。规划层的误差会沿链放大：一步漏排，后面全等着返工。',
          links: '依赖上一节点（推理）的单步推理质量——分解得再好，每一步算错照样崩；它是 Agent 闭环的决策中枢；规划的连续性在交接场景最受考验（见「从全景回到主方向」节点的映射），协作时谁接着规划正是主方向的问题。',
        },
        sourceBrief: '来源：LLM Agents 总览综述的规划章节（框架级）＋推理综述背景；未逐行读全文',
        source: { note: 'LLM Agents 综述的规划章节（章节结构与组织逻辑已核，框架级）＋推理综述作背景；未逐行读全文', asOf: '2026-09-24' },
        topics: ['cross-harness-collab'],
      },
      // —— 路径 D · 外部能力扩展 ——
      {
        id: 'land-d1', layer: 'land-layer-agent', title: '行动与工具使用', when: '2023',
        problem: '模型不知道实时信息，也不能真正执行操作。',
        idea: '把 API、搜索引擎、代码解释器当作模型的「外骨骼」；工具学习回答四个子问题——工具集里有什么、何时用、参数怎么填、结果如何并回回答。综述以组件连接与「从意图到计划」的流程组织方法，并覆盖从示范与反馈中学习及安全可信工具学习专节。',
        example: '数学题调计算器、查实时天气、代码解释器跑数据分析。',
        capability: '组成 Agent 的输出侧；指令对齐可帮助模型按工具规范响应，但可靠性还依赖接口约束、参数校验与环境反馈。',
        limitation: '选错工具或填错参数的误差会级联放大；权限与安全授权是开放问题。',
        guide: {
          motivation: '预训练模型的知识冻结在参数里：不知道今天的天气、下不了单、改不了文件。工具使用要回答：怎么让模型「动手」——调用外部 API 与程序，去完成自己做不到的事？',
          mechanism: '把工具当作模型的外骨骼。一次合格的工具使用要连过四关：知道有什么（工具集里列了哪些 API、各自干什么）、知道何时用（判断当前任务该查、该算还是该写）、会填参数（把意图翻译成合法的函数调用）、会消化结果（把返回的数据并回回答、决定下一步）。综述还覆盖了两条进阶路线：从示范与反馈中学习工具使用（不再全靠提示词描述），以及安全可信工具学习专节（权限控制、恶意输入防御）。',
          example: '三个典型场景：数学题调计算器（何时用＋参数填充）；查实时天气（模型参数里没有的信息，只能向外要）；代码解释器跑数据分析（结果不是文字而是执行产物，需要再观察）。',
          confusion: '这一层三只「向外的手」最易混（编辑解释：分工框架为编辑整理）。工具改变环境（下单、写文件），检索把知识取回但不改变世界，记忆读写 Agent 自己的状态。搜索是个交叉点：作为查知识的手段它是检索，作为调 API 的动作它又像工具。三者真正的共同点是「向模型参数之外伸手」，伸手的次数与代价正是评测与成本节点记账的对象。',
          links: '组成 Agent 闭环的输出侧；与对齐节点的关系是「对齐有帮助而非充分必要前提」——工具可靠性还靠接口约束、参数校验与环境反馈；它的成本与风险在评测与成本（计费）、可靠性与安全两节点收尾。',
        },
        sourceBrief: '来源：Tool Learning 综述（ACM Computing Surveys 2024 正式版）；框架级，未逐行读全文',
        source: { note: 'Tool Learning with Foundation Models（Qin 等，ACM Computing Surveys 2024 正式版，OpenAlex 核 DOI）；核对了章节结构（框架级），未逐行读全文，CCF 等级未核到不标', asOf: '2026-09-24' },
        topics: ['cross-harness-collab'],
      },
      {
        id: 'land-d2', layer: 'land-layer-agent', title: '知识检索与 RAG', when: '2023–2024',
        problem: '幻觉、知识过时、结论不可溯源。',
        idea: '生成之前先检索外部知识库，把检索结果注入上下文共同生成；综述把范式演进整理为 Naive → Advanced → Modular 三代，并按检索、生成、增强过程三组件展开。',
        example: '带引用出处的开放域问答。',
        capability: '与「长上下文」是并行竞争又互补的两条路线；与工具谱系交叠（搜索即工具）。',
        limitation: '检索质量决定上限、注入上下文稀释注意力、模型可能「引用但不理解」。预印本（评论「Ongoing Work」），分类术语已被社区广泛采用，引用具体图表前需补读原文。',
        guide: {
          motivation: '模型回答「某公司去年营收多少」时，参数记忆里要么没有、要么已经过时，还容易一本正经地编。RAG 要回答：怎么让结论站在可查的外部证据上，而不是站在模型的自信上？',
          mechanism: '基本流程是「先查后写」：把用户问题拿去检索外部知识库（数据源、索引、查询改写各有讲究），把检出的段落注入上下文，再让模型基于这些材料生成、并附引用。综述把范式演进整理为三代：Naive（检索—注入—生成一条龙）、Advanced（对检索与生成各环节做精细优化）、Modular（把检索、生成、增强拆成可替换模块自由组合）；并按检索、生成、增强过程三组件分别展开方法谱系。',
          example: '带引用出处的开放域问答：每个论断后面挂着它来自哪篇文档的哪一段，读者可以回查——「可溯源」正是 RAG 相对纯参数记忆的核心卖点。',
          confusion: '两处易混。其一「RAG vs 长上下文」：把全部资料塞进越来越长的窗口与按需检索，是并行竞争又互补的两条路线（该综述有专节讨论）。其二「检索到≠理解了」：注入的上下文会稀释注意力，模型可能引用了证据却没用对意思——检索质量决定上限，不保证结论。',
          links: '与工具使用谱系交叠（搜索即工具），与记忆互补；在主方向映射里（「从全景回到主方向」节点），检索与工具一起构成「如何获取」的手段谱系，而获取的计费记在评测与成本节点。',
        },
        sourceBrief: '来源：RAG 综述（arXiv:2312.10997 v5，预印本）；框架级，未逐行读全文',
        source: { note: 'Retrieval-Augmented Generation for LLMs: A Survey（Gao 等，arXiv:2312.10997 v5，预印本）；核对了章节结构（框架级），未逐行读全文', asOf: '2026-09-24' },
        topics: ['cross-harness-collab'],
      },
      {
        id: 'land-d3', layer: 'land-layer-agent', title: '记忆与状态（概述级）', when: '2024',
        problem: '上下文窗口有限且昂贵，跨会话的经验与事实会丢。',
        idea: '用四问组织记忆研究——来源（单次任务内/跨任务经验/外部知识）、形式（文本或参数）、操作（写入/管理/读取）、评测。',
        example: 'MemGPT 把记忆分主上下文与外部存储、由控制流函数自主搬运（站内 MemGPT 卡有机制导读）。',
        capability: '组成 Agent 的状态侧，是本工作区主方向的核心变量：表示选择直接决定记忆/交接的质量与成本。',
        limitation: '记忆综述在其写作时点（2024-04）判断「尚无面向记忆模块本身的开源基准」——这是时点判断，此后 LoCoMo、LongMemEval、MemBench 等已出现，引用必须带时点限定。深入专题（共享记忆、多智能体记忆、通信内容分类）直接读站内两篇已核综述卡。',
        guide: {
          motivation: '上下文窗口装不下长会话，也装不下跨天的经验：昨天踩过的坑、上周定过的方案，关了窗口就丢。记忆研究要回答：哪些信息值得留下、以什么形式存在哪、什么时候回到模型的输入里？',
          mechanism: '记忆机制综述用四问组织整个领域。来源：信息从哪来——单次任务内的上下文、跨任务累积的经验、外部知识库。形式：存成什么——文本（自然语言、结构化元组、数据库）或参数（把经验训进权重）。操作：怎么打理——写入（把原始观测投影成记忆）、管理（反思抽象、合并、遗忘）、读取（相似度检索取回）。评测：直接评记忆本身（连贯性、正确率），还是间接评它撑起的下游任务。最小机制样本是 MemGPT：主上下文当工作内存、外部存储当磁盘，换出与读回都由控制流函数显式发起。',
          example: 'MemGPT 的分层搬运：主上下文快满时，队列管理器把旧内容摘要归档到外部存储；需要时 LLM 自己发起函数调用把相关记忆读回来。要点是「存下来 ≠ 当前可见」——进不进这一轮输入，由读写策略决定。',
          confusion: '与检索（RAG）的分工最易混：RAG 是「生成前先检索、把结果注入上下文」的流程，记忆是「保留—更新—利用自身状态」的机制——检索的对象可以是外部文档、也可以是自己的历史，记忆的内容同样可以包括外部知识；二者不是按「别人的/自己的」划界，而是流程与机制之别，实践中常组合使用（检索到的东西写入记忆、需要时再读回）。另一个误区是把「能存」当「会用」：写入什么、何时读回是策略问题，策略差劲的记忆库不但无益，还会把错误固化、传播给后续会话。',
          links: '组成 Agent 闭环的状态侧；它是本工作区主方向的核心变量——「状态保存在哪里、保存什么语义、如何获取及计费」三问都落在这一层；深入专题（共享记忆、多智能体记忆）见站内两篇已核综述卡与近邻详读，「从全景回到主方向」节点给出映射。',
        },
        sourceBrief: '来源：记忆机制综述（TOIS 2025 正式版，CCF-A）；正文已核（见站内综述卡）',
        source: { note: 'A Survey on the Memory Mechanism of Large Language Model based Agents（Zhang 等，TOIS 2025 正式版，CCF 目录核 A 类期刊）；正文已核（见站内综述卡）', asOf: '2026-09-24' },
        topics: ['cross-harness-collab'],
      },
      // —— 路径 E · 群体、评测与可信 ——
      {
        id: 'land-e1', layer: 'land-layer-agent', title: '多智能体协作', when: '2023',
        problem: '单个 Agent 的角色视角与能力边界有限；复杂任务天然分工。',
        idea: '为不同 Agent 设定不同 profile（角色、技能），通过通信协调完成共同任务；总览综述把应用按社会科学、自然科学、工程三类组织。',
        example: '模拟软件团队的多角色开发（需求/编码/测试 Agent 分工）。',
        capability: '单 Agent 闭环的群体推广；多 Agent 之间的状态共享与交接表示正是主方向的研究对象。',
        limitation: '通信 token 成本、一个 Agent 的错误沿通信传播、出错后责任难归属。通信本身是一等问题：协议、范式、显式/隐式内容分类见站内已核的通信专题综述。',
        guide: {
          motivation: '一个 Agent 同时扮演需求分析、编码、测试、文档，角色互相干扰、能力也顾不过来。多智能体协作要回答：怎么让多个各有所长的 Agent 分工配合，完成单个 Agent 扛不动的复杂任务？',
          mechanism: '基本构造是两步：分工——给每个 Agent 设定 profile（它是谁、负责什么、掌握什么技能与上下文）；协调——Agent 之间靠通信对齐进度与交接工作。总览综述把应用按社会科学、自然科学、工程三类组织（软件开发团队模拟是工程类的代表）。但真正的难点在通信：用什么协议传（系统级：架构、目标、协议），传什么内容（内部级：一次一句还是同时发言、显式文字还是隐式行为信号）——站内已核的通信专题综述把这两层面拆成了可分析的维度。',
          example: '模拟软件团队：需求 Agent 写规格、编码 Agent 实现、测试 Agent 挑错，三者的产出物互相传递。一个需求理解偏差，会沿着「需求→编码→测试」的通信链逐级放大成返工。',
          confusion: '「协作收益 vs 协作成本」必须放在一起看（编辑解释：与评测与成本节点的分工为编辑整理）。收益来自分工：专长对齐、上下文各管一段、可以并行。成本也实在：每轮通信都烧 token；一个 Agent 的错误会沿通信传播；出错后责任难归属——「三个 Agent 互相指认」是真实故障形态。只展示收益不谈成本的协作叙事不可信。',
          links: 'Agent 闭环的群体推广；多 Agent 之间的状态共享与交接表示正是主方向的研究对象（「从全景回到主方向」节点映射到「状态保存在哪里、谁决定传取什么」）；通信账记在评测与成本节点，风险面接可靠性与安全节点。',
        },
        sourceBrief: '来源：LLM Agents 总览综述多智能体章节（框架级）＋通信专题综述（FCS，CCF-B，正文已核，见站内综述卡）',
        source: { note: 'LLM Agents 综述的多智能体章节（框架级）＋Beyond Self-Talk: A Communication-Centric Survey of LLM-Based Multi-Agent Systems（Yan 等，FCS，CCF-B，正文已核见站内综述卡）', asOf: '2026-09-24' },
        topics: ['cross-harness-collab'],
      },
      {
        id: 'land-e2', layer: 'land-layer-agent', title: '评测与成本', when: '2023–2024',
        problem: '「能跑通」不等于「好」，且成本常被完成率掩盖。',
        idea: '评测分主观（人类偏好）与客观（任务指标）两路；基准走向多维化（备选的 AgentBench 以 8 个环境评推理与决策，身份经核、ICLR 不在 CCF 目录不标）；成本侧，注意力随长度平方增长使长上下文 Agent 的 token 账单成为一等指标。',
        example: '站内既有审计的 Compression Cost 实验证明：任务完成率不变的压缩，运行中的再获取交互成本可能翻数倍——完成率看不见这笔账。',
        capability: '应用维度贯穿所有节点；「质量与成本分列记账」是本工作区主方向的计费轴。',
        limitation: '基准污染、过程指标缺失、不同基准的设置不可比。',
        guide: {
          motivation: '演示视频里跑通一次不难，难的是知道它「有多好」和「多贵」：同一个 Agent，在基准 A 上领先、在基准 B 上垫底并不罕见。评测与成本要回答：用什么尺子量质量，用什么账本记代价——而且两把尺子都不能只剩完成率一个数。',
          mechanism: '质量侧分两路：主观评测请人比答案好坏（人类偏好），客观评测用任务指标（准确率、成功率、测试通过）。基准在走向多维化——备选的 AgentBench 用多个环境评推理与决策。成本侧有个硬约束：注意力的计算随序列长度平方增长，长上下文 Agent 的 token 账单是一等指标，不是附属信息。站内已核的 Compression Cost 实验给了最直观的演示：任务完成率纹丝不动的压缩，运行中为了买回丢掉的状态，检索类交互明显变多——完成率根本看不见这笔账。',
          example: '两组对照（定性转述，具体数字与设置见站内 Compression Cost 卡）：完成率在统计上没变化的压缩设置，运行中的检索调用却明显变多；把丢掉的可恢复状态还给模型，额外交互有所减少，但并未消除——说明贵的不一定是压缩本身，而是「丢了还得再买」的交互。',
          confusion: '评测 vs 测试的边界要分清：测试通过≠修复正确（站内 TOSEM 卡立过这个实证），完成率≠低成本，单次跑通≠稳定复现。三类常见误读都源于只看一个数。基准自身也有污染与设置不可比的问题，跨基准比数字前先比设置。',
          links: '应用维度贯穿所有节点；「质量与成本分列记账」是主方向的计费轴（见「从全景回到主方向」节点）；评测的客观指标思路直接通向代码智能体与软件工程应用节点（测试即指标），协作的通信账接回多智能体协作节点。',
        },
        sourceBrief: '来源：LLM Agents 总览综述评测章节（框架级）＋AgentBench（身份经核）＋Compression Cost 已核详读',
        source: { note: 'LLM Agents 综述的评测章节（框架级）＋AgentBench（身份经核，ICLR 不在 CCF 目录不标）＋高效 Transformer 综述（成本侧）＋站内 Compression Cost 已核详读', asOf: '2026-09-24' },
        topics: ['cross-harness-collab'],
      },
      {
        id: 'land-e3', layer: 'land-layer-agent', title: '可靠性与安全（框架级，专源待补）', when: '2023',
        problem: '幻觉、提示注入、越权操作会沿工具进入真实环境——Agent 的风险面比聊天机器人大。',
        idea: '（框架级）总览综述将可靠性作为 Agent 落地的核心关切组织讨论；工具综述设有「安全可信工具学习」专节，指向权限控制、恶意输入防御等子问题。',
        example: '恶意网页内容诱导 Agent 泄露会话数据（提示注入，背景常识）。',
        capability: '依赖对齐与工具授权设计。',
        limitation: '本轮未选入专门的安全/对齐综述，本节点只作框架级导引：任何「安全机制有效」的结论性表述在补核专源前不得出现。专源已登记为下一轮候选。衔接：风险面首先由工具使用节点的授权设计把守；评测侧如何给可靠性记账见评测与成本节点，部署后的学习适应见学习适应节点。',
        source: { note: 'LLM Agents 综述（框架级）＋Tool Learning 综述的安全可信专节标题（框架级）；安全专题来源待补', asOf: '2026-09-24' },
        topics: [],
      },
      {
        id: 'land-e4', layer: 'land-layer-agent', title: '学习适应（框架级，专源待补）', when: '2023',
        problem: '部署后模型权重冻结，新经验从哪来？',
        idea: '（框架级）三条互补路线——上下文内学习（提示与记忆写入，最快但受上下文限制）、参数更新（微调/持续学习，彻底但有灾难性遗忘）、工具与流程固化（经验沉淀为可复用外部资产）；总览综述按是否微调组织能力获取。',
        example: '记忆写入即第一条路线；站内既有审计的 Grounding Agent Memory 条目提示——未经核验的经验写入会把错误一并固化（其条目为摘要级）。',
        capability: '三类路线可组合使用。',
        limitation: '经验质量参差、写入什么/何时写是策略问题。本轮未选入持续学习/自进化专源，按框架级对待；专源已登记为下一轮候选。衔接：三条路线里「上下文内学习」就是记忆与状态节点的记忆写入；经验固化的证据问题与评测与成本节点的评测记账相连。',
        source: { note: 'LLM Agents 综述的学习适应章节（框架级）；持续学习专题来源待补', asOf: '2026-09-24' },
        topics: [],
      },
      {
        id: 'land-e5', layer: 'land-layer-agent', title: '代码智能体与软件工程应用', when: '2023–2024',
        problem: '软件工程任务步骤长，但测试提供了开放域里相对可操作的验证信号——只是成本与覆盖有限。',
        idea: '把「读 issue → 定位代码 → 修改 → 跑测试」的循环交给 Agent；总览综述将此类归入工程应用。',
        example: '站内 SWE-bench 卡记录的基准——从真实 GitHub issue 出发修复 bug，以测试通过为判据（详细导读见站内卡）。',
        capability: '通向本工作区第二条起步方向 code-agent-verification；与评测问题天然耦合（测试即客观指标）。',
        limitation: '测试通过不保证修复正确（伪修复问题，站内 TOSEM 卡为已核条目）；长程任务中的错误累积与「修一个坏一个」的回归问题突出，正是误差累积在工程域的具体化。衔接：代码智能体是工具使用与评测与成本两节点在软件工程域的合流，也是第二条起步方向 code-agent-verification 的入口。',
        source: { note: 'LLM Agents 综述的工程应用章节（框架级）＋站内 SWE-bench 卡（本工作区已核条目）', asOf: '2026-09-24' },
        topics: ['code-agent-verification'],
      },
      // —— 路径 F · 回到本工作区的研究方向 ——
      {
        id: 'land-f1', layer: 'land-layer-topic', title: '从全景回到主方向：协作机制 × 表示组合 × 计费', when: '2026',
        problem: '全景层学到的每条线索，在主方向的哪个位置变成真问题？',
        idea: '主方向直接动用的节点：多智能体协作（多体协作与通信）→ 预算约束的动机；记忆与状态、知识检索与 RAG（状态与知识的表示选择）→「状态保存在哪里、保存什么语义」；行动与工具使用、知识检索与 RAG（检索与工具）→「如何获取」的手段谱系；评测与成本（完成率之外的交互成本）→「如何计费」的账本结构；规划与任务分解（规划在交接中的连续性）。',
        example: '下一步深读：既有审计的 2 篇有正文综述（记忆机制、通信中心）+ 4 篇近邻详读（Compression Cost / Do Not Restart / MemCollab / Routed Graph Handoff）是主方向的第一批精读材料。',
        capability: '把广域脉络映射为可操作的阅读顺序；主方向阅读卡住时，可按本节点的映射回到对应背景节点补课。',
        limitation: '本节点是编辑映射，不是引用关系；主方向的四轴框架是用户讨论形成的编辑分析框架，不是综述公认分类。衔接：主方向阅读卡住时，按上面的映射回到对应背景节点补课；专题深入见站内两篇已核综述卡与四篇近邻详读。',
        source: { note: '本图节点映射＋站内既有来源审计（编辑整理，非引用关系）', asOf: '2026-09-24' },
        topics: ['cross-harness-collab'],
      },
    ],
    edges: [
      // 学术关系边（kind=academic）：source.note 为读者可见的文献名映射；可追溯的审计条目登记在
      // source.auditRef（数据字段，不渲染到页面）。无文献映射处保留原始详情、不假装已映射（PLAN-011 硬约束 2/3）。
      { id: 'land-edge-a1-a2', from: 'land-a1', to: 'land-a2', kind: 'academic', note: '历史发展：符号与统计是并行分支，符号线索未死亡（神经符号计算是后来的互相借鉴）', source: { note: 'Neural-Symbolic Learning and Reasoning（arXiv:1711.03902）与 Deep Learning（Nature 2015）的背景脉络', asOf: '2026-09-24', auditRef: 'ai-agent-landscape-source-audit §4 A1/A2' } },
      { id: 'land-edge-a2-a3', from: 'land-a2', to: 'land-a3', kind: 'academic', note: '方法依赖：统计学习给深度学习提供问题表述与评测习惯', source: { note: 'Deep Learning（Nature 2015）', asOf: '2026-09-24', auditRef: 'ai-agent-landscape-source-audit §4 A2/A3' } },
      { id: 'land-edge-a1-a3', from: 'land-a1', to: 'land-a3', kind: 'academic', note: '历史发展：深度学习与符号线索并行不悖', source: { note: 'Neural-Symbolic Learning and Reasoning（arXiv:1711.03902）', asOf: '2026-09-24', auditRef: 'ai-agent-landscape-source-audit §4 A3' } },
      { id: 'land-edge-a4-a5', from: 'land-a4', to: 'land-a5', kind: 'academic', note: '方法依赖：Transformer 是基础模型的主要底座（并行路线存在，本图按主流谱系呈现）', source: { note: 'Efficient Transformers（ACM Computing Surveys 2022）与 On the Opportunities and Risks of Foundation Models（arXiv:2108.07258）', asOf: '2026-09-24', auditRef: 'ai-agent-landscape-source-audit §4 A4/A5' } },
      { id: 'land-edge-a5-a6', from: 'land-a5', to: 'land-a6', kind: 'academic', note: '方法依赖：对齐建立在预训练能力之上', source: { note: 'On the Opportunities and Risks of Foundation Models（arXiv:2108.07258）与 Training language models to follow instructions with human feedback（NeurIPS 2022）', asOf: '2026-09-24', auditRef: 'ai-agent-landscape-source-audit §4 A6' } },
      { id: 'land-edge-b1-b2', from: 'land-b1', to: 'land-b2', kind: 'academic', note: '组成：「Agent 与一次问答的本质差别」是「感知—规划—行动」循环节点的推论节点（三处本质差别）', source: { note: 'A Survey on Large Language Model based Autonomous Agents（FCS 2024）', asOf: '2026-09-24', auditRef: 'ai-agent-landscape-source-audit §4 B2' } },
      { id: 'land-edge-b1-c1', from: 'land-b1', to: 'land-c1', kind: 'academic', note: '组成：感知与多模态是闭环的输入侧', source: { note: 'A Survey on Large Language Model based Autonomous Agents（FCS 2024）与 A Survey on Multimodal Large Language Models（arXiv:2306.13549）', asOf: '2026-09-24', auditRef: 'ai-agent-landscape-source-audit §4 B1/C1' } },
      { id: 'land-edge-b1-c3', from: 'land-b1', to: 'land-c3', kind: 'academic', note: '组成：规划是闭环的决策中枢', source: { note: 'A Survey on Large Language Model based Autonomous Agents（FCS 2024）', asOf: '2026-09-24', auditRef: 'ai-agent-landscape-source-audit §4 C3' } },
      { id: 'land-edge-b1-d1', from: 'land-b1', to: 'land-d1', kind: 'academic', note: '组成：工具使用是闭环的输出侧', source: { note: 'A Survey on Large Language Model based Autonomous Agents（FCS 2024）与 Tool Learning with Foundation Models（ACM Computing Surveys 2024）', asOf: '2026-09-24', auditRef: 'ai-agent-landscape-source-audit §4 D1' } },
      { id: 'land-edge-b1-d3', from: 'land-b1', to: 'land-d3', kind: 'academic', note: '组成：记忆与状态是闭环的状态侧', source: { note: 'A Survey on Large Language Model based Autonomous Agents（FCS 2024）与 A Survey on the Memory Mechanism of LLM based Agents（TOIS 2025）', asOf: '2026-09-24', auditRef: 'ai-agent-landscape-source-audit §4 D3' } },
      { id: 'land-edge-b1-e1', from: 'land-b1', to: 'land-e1', kind: 'academic', note: '组成：多智能体协作是单 Agent 闭环的群体推广', source: { note: 'A Survey on Large Language Model based Autonomous Agents（FCS 2024）与 Beyond Self-Talk: A Communication-Centric Survey（FCS）', asOf: '2026-09-24', auditRef: 'ai-agent-landscape-source-audit §4 E1' } },
      { id: 'land-edge-a5-c2', from: 'land-a5', to: 'land-c2', kind: 'academic', note: '方法依赖：推理增强依赖预训练的规模能力', source: { note: 'Towards Reasoning in Large Language Models: A Survey（Findings of ACL 2023）', asOf: '2026-09-24', auditRef: 'ai-agent-landscape-source-audit §4 C2' } },
      { id: 'land-edge-c2-c3', from: 'land-c2', to: 'land-c3', kind: 'academic', note: '方法依赖：规划的每一步依赖单步推理质量', source: { note: 'A Survey on Large Language Model based Autonomous Agents（FCS 2024）', asOf: '2026-09-24', auditRef: 'ai-agent-landscape-source-audit §4 C3' } },
      { id: 'land-edge-a6-d1', from: 'land-a6', to: 'land-d1', kind: 'reading', note: '编辑关联：指令对齐可帮助模型按工具规范响应，但工具可靠性还依赖接口约束、参数校验与环境反馈——对齐是帮助而非充分必要前提（原方法依赖表述过强，按实页审查收窄为编辑关联）' },
      // 编辑学习顺序/主方向映射边（只给编辑理由，不附来源）
      { id: 'land-edge-e1-f1', from: 'land-e1', to: 'land-f1', kind: 'reading', note: '通信成本与冗余 → 主方向预算约束的动机（编辑映射）' },
      { id: 'land-edge-d3-f1', from: 'land-d3', to: 'land-f1', kind: 'reading', note: '记忆形式与操作 →「状态保存在哪里、保存什么语义」（编辑映射）' },
      { id: 'land-edge-d2-f1', from: 'land-d2', to: 'land-f1', kind: 'reading', note: '检索与工具 →「如何获取」的手段谱系（编辑映射）' },
      { id: 'land-edge-e2-f1', from: 'land-e2', to: 'land-f1', kind: 'reading', note: '完成率之外的交互成本 →「如何计费」的账本结构（编辑映射）' },
      { id: 'land-edge-c3-f1', from: 'land-c3', to: 'land-f1', kind: 'reading', note: '规划的连续性在交接中受考验（编辑映射）' },
    ],
    paths: [
      { id: 'land-path-a', title: '路径 A · AI 基础发展（背景层）', description: '回答「Agent 的零件各自从哪来」。六个节点各约 5–10 分钟建立轮廓；记住每条线索解决了什么旧问题、带来什么新限制即可，不必记年代。', nodeIds: ['land-a1', 'land-a2', 'land-a3', 'land-a4', 'land-a5', 'land-a6'] },
      { id: 'land-path-b', title: '路径 B · Agent 总览：从一次问答到闭环系统', description: '从「一个模型」到「一个系统」：两个节点建立 Agent 的总体图景与它和普通聊天机器人的本质差别，是后面所有专题节点的坐标系。', nodeIds: ['land-b1', 'land-b2'] },
      { id: 'land-path-c', title: '路径 C · 感知与认知核心', description: 'Agent 的输入侧与「想清楚」：感知与多模态、推理（链式思考）、规划与任务分解。适合读完路径 B 后按顺序或按需跳读。', nodeIds: ['land-c1', 'land-c2', 'land-c3'] },
      { id: 'land-path-d', title: '路径 D · 外部能力扩展：工具、检索与记忆', description: '模型参数是「死知识」，这一层讲 Agent 向外的三只手——调用工具、检索知识、读写记忆；与主方向（共享状态、表示组合、计费）咬合最紧。', nodeIds: ['land-d1', 'land-d2', 'land-d3'] },
      { id: 'land-path-e', title: '路径 E · 群体、评测与可信', description: '单个 Agent 之上与之外：多体协作、评测与成本、可靠性与安全、学习适应、代码智能体应用。系统观的收束，最直接通向研究方向。', nodeIds: ['land-e1', 'land-e2', 'land-e3', 'land-e4', 'land-e5'] },
      { id: 'land-path-f', title: '路径 F · 回到本工作区的研究方向', description: '把全景映射回主方向：每条线索在主方向哪个位置变成真问题。读完 A–E 再读本路径；主方向阅读卡住时也可按映射回到背景节点补课。', nodeIds: ['land-f1'] },
    ],
  },

  // 经典书目：不绑定方向的基础经典（PLAN-005 决策 D1 方案 A）。papers 中 collection='foundations'
  // 的条目按这里的分组展示；与方向路线是两种组织轴（主题轴 vs 方向轴）。
  foundations: {
    intro:
      '做 Agent 研究的共同语言：不绑定具体方向的必读经典。它们按主题分组，先看“架构与预训练”，再按需要进入推理与智能体范式；卡片当前都是摘要级，深读卡会按整理计划陆续补上。',
    groups: [
      { key: 'arch', title: '架构与预训练', note: '自注意力、预训练范式与规模效应：理解一切后续工作的三件事。' },
      { key: 'align', title: '指令与对齐', note: '模型怎么学会“听话”：RLHF 三段流程的来路。' },
      { key: 'reason', title: '推理与规划', note: '从把步骤写出来，到多路径投票，再到搜索一棵树。' },
      { key: 'agent', title: '智能体范式', note: '推理与行动交织、自我修正，以及完整的智能体系统样本。' },
    ],
  },

  // papers 拼接顺序 = 原 45 篇分组顺序（方向一/二/三 → 支线与三组补充 → 经典）+ 新四篇追加。
  papers: [...ROUTE_PAPERS, ...SUPPLEMENT_PAPERS, ...FOUNDATION_PAPERS, ...COLLAB_PAPERS],

  technicalRoutes: TECHNICAL_ROUTES,

  briefs: BRIEFS,
};
