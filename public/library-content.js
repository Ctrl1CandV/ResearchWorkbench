// public/library-content.js —— 个人研究平台内容包聚合器（数据契约见各模块文件头与下列文档）。
// 契约来源：docs/SPEC.md、docs/DESIGN.md、docs/READING-TEMPLATES-005.md、
// docs/TECH-LEARNING-005.md、docs/DAILY-BRIEF-006.md、docs/SCAFFOLD-008（008.2）；
// 拆分记录见 docs/DESIGN-REWORK-007.md §6。
// - meta/home/foundations 配置在本文件；directions/papers/technicalRoutes/briefs/materials 在
//   public/content/ 模块中；papers 按「路线组→支线与补充组→经典组→协作新卡组」拼接，
//   原 45 篇相对顺序不变，新四篇（008.2）追加在尾部。
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
    'LIBRARY-CONTENT v5.1 (2026-09-22，SCAFFOLD-008 / 008.2)：两条起步方向落地——主方向 cross-harness-collab（预算约束下的跨 harness 协作机制比较，5 步混媒介路线）与 code-agent-verification（4 步短起步）；trusted-rag / graph-harmful-fusion 转 deferred 不删；新增四张论文卡（beyond-frameworks / memgpt / handoff-tax / handoff-debt，追加于原 45 篇之后）与两篇站内 primer（mat-cross-harness-map / mat-read-empirical）；首页首读切换为带路线上下文的材料导读；技术 featured 三条（包 4 落地）；每日精选重组——移除旧四期（09-15/16/17/18，本地备份于 .grad/radar/archive/），换为 2026-09-21（回溯补记，漏斗全量 98 条按提交日归位）与 2026-09-22（回溯补记，索引滞后如实记空窗口）两期样例',
  meta: {
    role: 'editorial/AI-suggestion',
    updatedOn: '2026-09-22',
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
    intro: '沿起步路线读论文，按需补 Agent 技术，定期看看值得留意的新工作。',
    updatedOn: '2026-09-22',
    // 008.2（01 D）：带类型首读——主方向第一步（站内问题导读），链接携带 route/track。
    startHere: {
      kind: 'article',
      materialId: 'mat-cross-harness-map',
      routeId: 'cross-harness-collab',
      track: 'start',
    },
    // 区序按每日回访价值排列（REWORK-007 §2）：精选→论文→方向→技术→经典；渲染层与此同序。
    zones: [
      {
        key: 'brief',
        title: '每日精选',
        purpose: '感知相关/前沿工作在做什么、用了什么方法；少量值得留意的新线索，说明为什么挑它。',
        howToUse: '看整理日期与论文日期；这不是当天的阅读作业，通常无需读正文；只是定向清单，不是当天全量检索，零条不代表没有新工作。',
        entryLabel: '看最近一期',
        entryHash: '#/brief',
      },
      {
        key: 'papers',
        title: '论文阅读',
        purpose: '单篇论文读到能讲清楚：它解决什么、怎么做、证据支持到哪里、还缺什么。',
        howToUse: '从「建议从这里开始」的导读出发，按所选方向的顺序走；不同论文按重要性与来源给出不同深度的卡，不必每篇都精读。',
        entryLabel: '打开全部论文',
        entryHash: '#/papers',
      },
      {
        key: 'directions',
        title: '方向与路线',
        purpose: '两条起步方向（另两条延后保留）：研究对象、现状、选择理由、限制，以及一条按阶段推进的短路线。',
        howToUse: '先看方向说明与当前研究情况，选一条起步（默认主方向）；archive 谱系折叠在方向页内，初期不必走。',
        entryLabel: '查看两条方向',
        entryHash: '#/directions',
      },
      {
        key: 'learn',
        title: '技术学习',
        purpose: '默认三条技术路线：多智能体架构（主）、RAG / 检索记忆（按需）、图（浅尝）。',
        howToUse: '不必先选题，也不必按旧主干顺序学；读论文卡住时只补当前方向用得上的单元，其余主干折叠在下方。',
        entryLabel: '进入技术学习',
        entryHash: '#/learn',
      },
      {
        key: 'foundations',
        title: '经典书目',
        purpose: '做 Agent 研究的共同语言：不绑定方向的基础经典，按主题分组，标注各自与方向、技术的关系。',
        howToUse: '先读“架构与预训练”，再按需要进入推理与智能体范式；卡片当前为摘要级，深读卡按计划陆续补。',
        entryLabel: '打开经典书目',
        entryHash: '#/foundations',
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
