// public/content/papers-routes.js —— 方向一/二/三路线论文卡（deliveredDepth 四档，依据纪律见文件头）
// 由单一文件 library-content.js 按 REWORK-007（docs/DESIGN-REWORK-007.md §6）拆分而来：
// 条目内容与顺序同拆分前；数据契约与诚实纪律不变（docs/SPEC.md、docs/READING-TEMPLATES-005.md、
// docs/TECH-LEARNING-005.md、docs/DAILY-BRIEF-006.md）。本文件只是数据，不含任何本人进度。

export const ROUTE_PAPERS = [
    // ---------- 方向一 ----------
    {
      id: 'tosem2025-acceptance',
      title: 'An Empirical Study on the Suitability of Test-based Patch Acceptance Criteria',
      displayTitle: '测试验收准则够不够用：一项实证研究',
      url: 'https://nmaguirre.github.io/assets/pdf/tosem2025.pdf',
      type: 'evaluation',
      importance: 'core',
      difficulty: 'needs_background',
      role: 'foundation',
      roleReason: '它把“测试通过算不算修复正确”变成了有数字可查的实证问题，方向一后面的讨论都以它为基准。',
      recommendedDepth: 'deep',
      deliveredDepth: 'standard',
      templateVersion: 1,
      coverage: {
        mode: 'partial-text',
        basis: 'external_parser（pdftotext）抽取的 PDF 全文文本',
        version: 'ACM TOSEM Vol. 34, No. 3, Article 57, 2025 年 2 月（DOI 10.1145/3702971）',
        sections: ['摘要', '§1', '§3（3.1–3.9，RQ1–RQ4）', '§4', '§6', '§7'],
        limitations:
          '图 1–2 与表 1–10 仅由纯文本抽取、行列错位，未逐格核对；本卡引用的数字均出自原文散文叙述；公式符号乱码处不依赖；§2 与 §5 未读。升级到精读还需补 §5 与关键设置的原文核对。',
        checkedAt: '2026-09-15',
      },
      reasons: [
        '核心文献：它把“测试通过算不算修复正确”变成有数字的实证问题；方向一讨论验证预算与验收标准，都以这份经验为基础。',
        '需要背景：自动程序修复、符号执行与测试套件构造的基本概念；不要求形式化方法的深入背景。',
        '实证研究：全文是一个基准、四个工具、四个研究问题；价值在测量方法与结论边界，不在新方法。',
        '路线首位：读任何验收标准或补丁评估文献之前，先用它校准“测试验收会漏掉什么”。',
      ],
      lead:
        '自动修复工具普遍用测试套件验收补丁；这项研究改用契约加缺陷查找工具复核补丁。在 IntroClass 基准上，四个代表性工具接受的补丁多数是通过测试但实际错误的伪修复；把验证套件扩到约百级、千级有界穷尽测试能减少过拟合，却几乎不增加真修复，还使部分工具更易超时。对方向一，它把“修复正确性如何验证、验证预算花在哪”变成了可测量的问题。',
      learner: {
        gist: '测试验收会放过伪修复：四个代表性工具接受的补丁多数通过测试但并不正确；扩测试能压过拟合，几乎不增加真修复。',
        value: '把「看起来修好」变成可引用的实证基准；代码验证线后面的验收讨论都以它为参照，主方向的预算意识也以它为镜。',
        intent: '带着「patch ≠ fix」读 RQ1 与 RQ4 的设置与散文数字，重点是复核协议而非学写修复工具。',
      },
      readingActions: {
        preserve: [
          { target: 'patch 与 fix 之别；RQ1 与 RQ4 的设置与散文中的关键数字', why: '这是全卡的主张与证据核心（§3、§4，已核正文）。' },
          { target: '§7 的三条出路', why: '作者自己给出的后续方向，评价预算讨论的起点。' },
        ],
        explain: [
          {
            target: '四个工具的技术类别与实验复核流程',
            why: '先用本卡已核正文建立「谁被谁复核」的图景，不承诺卡外的详细算法。',
            sectionId: 'design',
          },
        ],
        skip: [
          { target: '§2 与 §5', why: '原覆盖未读，本次暂不进入；不把未读章节判断成无价值。' },
          { target: '公式乱码处', why: '纯文本抽取的公式符号不可依赖，不据其解释结论。' },
        ],
      },
      sections: [
        {
          id: 'problem',
          heading: '先把问题讲明白',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '自动程序修复在最坏情形下归约到程序综合，在图灵完备语言上不可判定（§1），所以工具退而求其次：用验证测试套件当验收标准，补丁通过全部测试即被接受。作者指出风险：测试不完备，通过测试的补丁可能只是“看起来修好”的伪修复（spurious patch）。' },
              ],
            },
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '此前对过拟合的进一步核查多靠人工检查或追加测试套件；这篇的区别在于拿形式化规约加缺陷查找工具当复核标准（§1、§3）。' },
              ],
            },
          ],
        },
        {
          id: 'design',
          heading: '实验怎么设计：小基准加契约复核',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '实验材料是 IntroClass：学生写的六道小题（checksum、digits、grade、median、smallest、syllables），程序通常不超过 30 行（§1、§3.1）。作者在 §1 明确说这不是分析缺陷：如果最先进工具在这种基准上都分不清真修复与伪修复，没有理由期待它在更大更复杂的基准上表现更好。' },
              ],
            },
            {
              kind: 'list',
              ordered: true,
              items: [
                [{ kind: 'text', text: '四个工具覆盖不同技术路线：GenProg（遗传搜索，C）、Angelix（符号执行加 MaxSMT，C）、Nopol（SMT 修条件语句，Java）、AutoFix（契约驱动的 Eiffel 修复）。' }],
                [{ kind: 'text', text: '补丁统一翻译成 C#，配上 Code Contracts 前后置条件，用 Pex 找违反契约的输入。' }],
                [{ kind: 'text', text: '为防复核流程自身出错，Pex 生成的失败测试还要回放到原补丁方法上确认真的失败（§3）。' }],
              ],
            },
          ],
        },
        {
          id: 'evidence',
          heading: '结论靠什么支撑：RQ1 与 RQ4 的数字',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: 'RQ1（§3.6）：GenProg 在 570 个故障里修对 30 个（5.3%），远低于先前文献表格可能造成的 36.8% 修复印象；Angelix 补出近 90 个补丁，经 Pex 复核只剩 23 个真修复；Nopol 与 AutoFix 的真修复只有个位数，AutoFix 仅报告的一个补丁也是错的。总体上，工具接受伪修复的概率显著高于产出真修复。' },
              ],
            },
            {
              kind: 'callout',
              tone: 'author',
              title: '作者发现',
              blocks: [
                {
                  kind: 'paragraph',
                  spans: [
                    { kind: 'text', text: 'RQ4（§3.9）：把先前 Angelix 研究可复现包中的 45,131 个补丁去重得 2,120 个，先用基准自带套件当 held-out、再用 Pex 复核：超过八成补丁通过了 held-out 却被判定为错误。这正是“用 held-out 测试验收补丁不可靠”的直接证据。' },
                  ],
                },
              ],
            },
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: 'RQ2/RQ3（§3.7–3.8）：套件从原始扩到约 100/1000 个测试（有界穷尽）后过拟合普遍下降：Nopol 的补丁数从 32 降到 8、真修复依然很少；GenProg 在 O∪S100 下补丁数翻倍、真修复从 30 降到 10，O∪S1000 下真修复从 30 降到 11；Angelix 在 O∪S100 下于 digits、median 各多出 5 个真修复。同时套件越大超时越多（GenProg 与 Angelix 对规模敏感，Nopol 因丢弃冗余测试而不受影响）。' },
              ],
            },
            {
              kind: 'comparison',
              caption: '加测试的代价与收益（依 §6 的概括，原文表格未逐格核对）',
              columns: ['做法', '过拟合', '真修复', '副作用'],
              rows: [
                ['原始测试套件', '高', '基线', '超时少'],
                ['扩到约 100 个有界穷尽测试', '下降', '基本不增，个别题目有增加', '部分工具超时变多'],
                ['扩到约 1000 个有界穷尽测试', '继续下降', '基本不增', '超时显著增加'],
              ],
            },
          ],
        },
        {
          id: 'limits',
          heading: '外推边界与作者建议',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '§4 写明：结论只适用于 IntroClass 与这四个工具的处理方式；不要跨语言、跨数据集比较工具；Pex 被当作复核标准，它自己也可能错（作者指出这类错误只会对其假设不利）；PAR、SPR 等工具因不可用未能纳入。' },
              ],
            },
            {
              kind: 'list',
              ordered: true,
              items: [
                [{ kind: 'text', text: '更强的形式化规约。' }],
                [{ kind: 'text', text: '能局部替代规约的有界穷尽大套件（工具需能处理大套件）。' }],
                [{ kind: 'text', text: '人参与验收的迭代。' }],
              ],
            },
            {
              kind: 'callout',
              tone: 'pending',
              title: '待验证',
              blocks: [
                {
                  kind: 'paragraph',
                  spans: [
                    { kind: 'text', text: '§7 的三条出路是作者的建议；它们今天是否仍是空白，需要对照最新文献确认——这是方向一查新时要先回答的问题，不是本卡的结论。' },
                  ],
                },
              ],
            },
          ],
        },
      ],
      deepRead: [
        '§1 末段：“程序通常不超过 30 行不是分析缺陷”的论证——讨论基准规模与验证成本时的关键前提。',
        '§3.9 连同 Table 10 的配套叙述：held-out 通过、Pex 判错的层层证据链，是“验证器本身需要被验证”的范例（具体数字在抽取文本中错位，请对照原文表格）。',
        '§6 结尾与 §7：加测试不增产真修复的概括与三条出路——找研究缺口时对照最新文献核查这些方向是否已被占。',
      ],
      references: [
        { paperId: 'le2018-overfitting', relation: 'citation', sourceLocator: 'TOSEM 参考条目 [56]，RQ4 复核对象', reason: 'RQ4 直接复核它的 held-out 结论，是真实引用关系。' },
        { paperId: 'ye2021-assessment', relation: 'citation', sourceLocator: 'TOSEM 参考条目 [58]', reason: '补丁评估规模化的代表条目，真实引用关系。' },
      ],
      openQuestions: [
        '“小基准结论可外推到大基准”是作者明说的主张，还是整理者的分析？依据在 §1 哪一句？',
        '如果把验收标准从测试换成更便宜的程序分析，哪些错误模式会消失、哪些会保留？',
      ],
      questions: [
        'RQ1 中 GenProg 的 5.3% 与先前的 36.8%：两个百分比的分子、分母分别是什么？可直接横比吗？',
        'Pex 加契约复核自身可能出什么错？论文用什么步骤兜底（失败测试回放到原方法）？',
        '加测试压低过拟合却换不来真修复，这说明验证预算应该花在哪一类证据上？',
      ],
      next: {
        note: '延伸阅读：按路线读 Le 等 2018（TOSEM 参考条目 [56]）：RQ4 复核的正是它的 held-out 结论。',
        paperId: 'le2018-overfitting',
      },
    },
    {
      id: 'le2018-overfitting',
      title: 'Overfitting in Semantics-based Automated Program Repair（Le 等，EMSE 2018）',
      displayTitle: '语义类自动修复的过拟合（Le 等 2018）',
      url: 'https://doi.org/10.1007/s10664-017-9577-2',
      type: 'other',
      importance: 'relevant',
      difficulty: 'unknown',
      role: 'baseline',
      roleReason: '它是 TOSEM RQ4 复核的直接对象，用来核对“held-out 测试能不能证明修复正确”。',
      recommendedDepth: 'standard',
      deliveredDepth: 'entry',
      templateVersion: 1,
      reasons: [
        '相关文献：TOSEM 2025 在 RQ4 里复核的直接对象（其参考条目 [56]），路线第二位。',
        '难度未判：还没有获取摘要，先不做难度判断。',
        '类型待定：手头的身份信息不足以归类，读过原文再改。',
        '路线中的角色：这是一条阅读入口，不是阅读卡——摘要还没拿到，不提供内容整理；读完 TOSEM 后按 RQ4 的指向核对其结论。',
      ],
      coverage: {
        mode: 'metadata',
        basis: 'TOSEM 2025 参考条目 [56] 与正文引用（未获取原文摘要）',
        version: 'EMSE 2018（DOI 10.1007/s10664-017-9577-2，Crossref 核查 2026-09-15）',
        sections: [],
        limitations:
          '未获取摘要与正文；本条不提供任何内容判断；身份经 TOSEM 2025 参考条目 [56] 核对，链接为本篇 DOI（Crossref 核查 2026-09-15）。',
        checkedAt: '2026-09-15',
      },
      lead:
        '这是一条阅读入口：Le 等关于语义类自动修复过拟合的研究（EMSE 2018，身份经 TOSEM 2025 参考条目 [56] 核对）。摘要还没有获取，这里不提供内容整理，请直接读原文。',
      sections: [],
      deepRead: [],
      references: [
        { paperId: 'tosem2025-acceptance', relation: 'editorial', reason: '按路线顺序，读完 TOSEM 后再回来核对它与 RQ4 的差异（编辑安排，不是引用关系）。' },
      ],
      openQuestions: [],
      questions: [],
      next: {
        note: '读完原文后自己补上：它与 TOSEM RQ4 在过拟合估计上的结论差异。',
        paperId: null,
      },
    },
    {
      id: 'ye2021-assessment',
      title: 'Automated Patch Assessment for Program Repair at Scale（Ye/Martinez/Monperrus，EMSE 2021）',
      displayTitle: '大规模补丁自动评估（Ye 等 2021）',
      url: 'https://doi.org/10.1007/s10664-020-09920-w',
      type: 'evaluation',
      importance: 'relevant',
      difficulty: 'unknown',
      role: 'baseline',
      roleReason: '补丁评估规模化的代表条目，用来对照“小基准细复核”与“大规模统计评估”。',
      recommendedDepth: 'standard',
      deliveredDepth: 'entry',
      templateVersion: 1,
      reasons: [
        '相关文献：补丁评估规模化的代表条目（TOSEM 2025 参考条目 [58]），路线第三位。',
        '难度未判：还没有获取摘要，先不做难度判断。',
        '实证评估（依标题初判）：从标题看是评估工作，读过原文再确认。',
        '路线中的角色：这是一条阅读入口，不是阅读卡——摘要还没拿到，不提供内容整理。',
      ],
      coverage: {
        mode: 'metadata',
        basis: 'TOSEM 2025 参考条目 [58]（未获取原文摘要）',
        version: 'EMSE 2021（DOI 10.1007/s10664-020-09920-w，Crossref 核查 2026-09-15）',
        sections: [],
        limitations:
          '未获取摘要与正文；本条不提供任何内容判断；身份经 TOSEM 2025 参考条目 [58] 核对，链接为本篇 DOI（Crossref 核查 2026-09-15）。',
        checkedAt: '2026-09-15',
      },
      lead:
        '这是一条阅读入口：补丁评估的规模化研究（Ye/Martinez/Monperrus，EMSE 2021，身份经 TOSEM 2025 参考条目 [58] 核对）。摘要还没有获取，这里不提供内容整理，请直接读原文。',
      sections: [],
      deepRead: [],
      references: [
        { paperId: 'tosem2025-acceptance', relation: 'citation', sourceLocator: 'TOSEM 参考条目 [58]', reason: '真实引用关系，TOSEM 在规模化评估上对照它。' },
      ],
      openQuestions: [],
      questions: [],
      next: {
        note: '读完原文后自己补上：它的评估信号与 TOSEM 的契约复核标准怎么对照。',
        paperId: null,
      },
    },
    {
      id: 'appt',
      title: 'APPT（TSE 2024，作者仓库标识）',
      displayTitle: 'APPT：用预训练模型判断补丁正确性',
      url: 'https://github.com/iSEngLab/APPT',
      type: 'method',
      importance: 'relevant',
      difficulty: 'unknown',
      role: 'baseline',
      roleReason: '学习型补丁正确性判断的近期参照，用来看清“分类正确性”与“主动选择验证动作”的区别。',
      recommendedDepth: 'standard',
      deliveredDepth: 'entry',
      templateVersion: 1,
      reasons: [
        '相关文献：基于预训练语言模型加序列模型的补丁分类方案（作者仓库说明），是“学习型验收器”的近期参照。',
        '难度未判：论文摘要还没有获取，先不做难度判断。',
        '方法论文（依仓库说明初判）：作者仓库说明它是补丁分类方法；正式标题与卷期还要核对。',
        '路线中的角色：这是一条阅读入口，不是阅读卡——摘要还没拿到，不提供内容整理。',
      ],
      coverage: {
        mode: 'metadata',
        basis: '作者仓库说明（scout 提供）；论文摘要未获取',
        version: 'TSE 2024（作者仓库标识；卷期待核）',
        sections: [],
        limitations:
          '未获取论文摘要与正文；仓库链接非论文页；正式标题、发表卷期与组件细节以仓库及论文页为准。',
        checkedAt: '2026-09-15',
      },
      lead:
        '这是一条阅读入口：APPT，用预训练语言模型加序列模型做补丁分类（TSE 2024，作者仓库标识）。论文摘要还没有获取，这里不提供内容整理；请从仓库链接核对论文信息。',
      sections: [],
      deepRead: [],
      references: [],
      openQuestions: [],
      questions: [],
      next: {
        note: '读完原文后自己补上：正式标题、输入输出与训练标签来源。',
        paperId: null,
      },
    },
    {
      id: 'compass',
      title: 'ComPass: Contrastive Learning for Automated Patch Correctness Assessment in Program Repair',
      displayTitle: 'ComPass：用对比学习判断补丁正确性',
      url: 'https://arxiv.org/abs/2602.07561',
      type: 'method',
      importance: 'relevant',
      difficulty: 'needs_background',
      role: 'frontier',
      roleReason: '补丁正确性判断的近期竞争工作，用来确认“学习型验收器”已经走到哪一步。',
      recommendedDepth: 'standard',
      deliveredDepth: 'quick',
      templateVersion: 1,
      reasons: [
        '相关文献：补丁正确性判断的近期竞争线索，路线收尾与简报速览项。',
        '需要背景：补丁正确性与对比学习的基本概念（依摘要判断）。',
        '方法论文：摘要显示为补丁正确性判断方法。',
        '读法：以下判断只依据摘要，正文没有核对。',
      ],
      coverage: {
        mode: 'abstract',
        basis: 'arXiv 摘要（scout 提供）',
        version: 'arXiv:2602.07561（v1 2026-02-07；v2 2026-04-06）',
        sections: [],
        limitations: '仅摘要级判断；未读正文；不引用摘要中的百分比数字（缺少完整设置）。',
        checkedAt: '2026-09-15',
      },
      lead:
        '只凭摘要说：这篇用对比学习与语义保持变换来判断补丁正确性（v1 2026-02-07，v2 2026-04-06）。正文还没有核对，结论以原文为准。放在方向一第五篇，作为补丁分类与验收的近期竞争线索。它做的是“判断这个补丁对不对”，不等于“在预算内选择下一步验证动作”，这两件事需要分开建模。',
      sections: [],
      deepRead: [],
      references: [
        { paperId: 'appt', relation: 'editorial', reason: '同为学习型补丁正确性基线，按路线顺序对照阅读（编辑安排）。' },
      ],
      openQuestions: [],
      questions: [
        '其“语义保持变换”的判定边界在哪？取全文时先核对变换是否可能把错误补丁判为正确。',
      ],
      next: { note: '方向一路线到此收尾；工程与评价能力见“技术学习”。', paperId: null },
    },

    // ---------- 方向二 ----------
    {
      id: 'rag-survey',
      title: 'Retrieval-Augmented Generation for Large Language Models: A Survey（Gao 等）',
      displayTitle: '检索增强生成综述（Gao 等）',
      url: 'https://arxiv.org/abs/2312.10997',
      type: 'survey',
      importance: 'core',
      difficulty: 'accessible',
      role: 'background',
      roleReason: '方向二的问题地图：先把流水线与分类讲清楚，再进具体机制。',
      recommendedDepth: 'deep',
      deliveredDepth: 'quick',
      templateVersion: 1,
      reasons: [
        '核心文献：方向二的问题地图，先看全景再进机制。',
        '易读：综述面向入门读者，适合放在路线开头。',
        '综述：价值在组织与分类，不在单一方法。',
        '读法：这里只依据摘要做身份判断；综述的内部组织，读过原文再补。建议精读但当前只有摘要，不冒充已精读。',
      ],
      coverage: {
        mode: 'abstract',
        basis: 'arXiv 摘要页（scout 提供身份）',
        version: 'arXiv:2312.10997（具体版本未确认）',
        sections: [],
        limitations: '仅摘要级身份，未读正文；本卡不复述综述的内部分类细节。',
        checkedAt: '2026-09-15',
      },
      lead:
        'Gao 等的检索增强生成综述：据摘要，它把发展整理为 Naive、Advanced、Modular 三条范式，沿检索、增强、生成三个组件梳理方法，也谈到评价与挑战。放在方向二开头，是为了先在流水线里定位“检索后处理”的位置，再进入具体的机制论文；综述的分类是组织工具，不能当成方法有效性的证据。注意：以下只依据摘要，正文没有读，综述内部的分类细节不复述。',
      sections: [],
      deepRead: [],
      references: [
        { paperId: 'astute-rag', relation: 'editorial', reason: '综述之后按路线进入具体机制论文（编辑安排）。' },
      ],
      openQuestions: [],
      questions: [
        '读正文时先找“不可靠检索/检索后处理”被放在哪一节，再回到 Astute RAG 对照。',
      ],
      next: { note: '延伸阅读：按路线读 Astute RAG，那篇有正文整理。', paperId: 'astute-rag' },
    },
    {
      id: 'astute-rag',
      title: 'Astute RAG: Overcoming Imperfect Retrieval Augmentation and Knowledge Conflicts for Large Language Models',
      displayTitle: 'Astute RAG：检索不完美与知识冲突怎么办',
      url: 'https://aclanthology.org/2025.acl-long.1476/',
      type: 'method',
      importance: 'core',
      difficulty: 'needs_background',
      role: 'baseline',
      roleReason: '它给出了“不完美检索加内外知识冲突”的受控刻画与来源感知合并机制，是方向二的公共基线。',
      recommendedDepth: 'deep',
      deliveredDepth: 'deep',
      templateVersion: 1,
      reasons: [
        '核心文献：它对“检索不完美、内外知识冲突”给出受控实验的刻画，配上来源感知的合并机制；方向二的方法讨论都以它为公共参照。',
        '需要背景：检索增强生成的常见流水线与问答基准常识；机制全部由提示工程组成，不用啃训练细节。',
        '方法论文：贡献在检索后阶段（生成、合并、定答），证据是黑盒 API 上的对照实验与消融。',
        '路线第二位：先建立冲突问题的刻画与基线机制，再读时间敏感与拒答类工作，免得把别人做过的当成新方向。',
      ],
      coverage: {
        mode: 'full-text',
        basis: '本次实际读取 arXiv HTML 全文（2410.07176v2）散文叙述；ACL 2025 正式长文为同一工作的出版版本',
        version: 'arXiv:2410.07176v2（2025-05-31）；ACL 2025 正式长文（DOI 10.18653/v1/2025.acl-long.1476）',
        sections: ['摘要', '§3 受控分析', '§4.1–4.4 方法', '§5 实验设置与结果', 'Limitations'],
        limitations:
          '本次读的是 HTML 全文文字：图 1–12 只见到图注与配套散文叙述，未看图；主结果表未逐格核对，卡内数字均出自散文叙述；附录提示词全文与复现细节未读。',
        checkedAt: '2026-09-15',
      },
      overview: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'text', text: '检索增强生成默认“检索到的段落是有用的”。Astute RAG 先把这个前提拿出来检验：检索段落常常不直接包含答案，还会和模型内部知识冲突。论文的做法是：在检索之后、回答之前插入三步——按需生成内部知识段落、给内外段落打来源标签后迭代合并、按可靠性比较候选答案再定答。' },
          ],
        },
        {
          kind: 'callout',
          tone: 'note',
          title: '这张卡的依据',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '内容依据本次实际读取的 arXiv HTML 全文（v2）散文叙述，覆盖摘要、§3、§4.1–4.4、§5 与 Limitations；图表未逐格核对。' },
              ],
            },
          ],
        },
      ],
      prereq: [
        {
          kind: 'list',
          ordered: false,
          items: [
            [{ kind: 'text', text: '检索增强生成流水线：查询 → 检索若干段落 → 拼进上下文 → 生成答案；知道召回与重排分别发生在哪一步。' }],
            [{ kind: 'text', text: '问答基准与精确匹配类指标：答案字符串命中即判对，它衡量的是命中，不等于推理正确。' }],
            [{ kind: 'text', text: '黑盒模型调用的基本概念：温度、最大输出长度、一次调用算一次成本；本方法不改模型权重。' }],
          ],
        },
      ],
      lead:
        'RAG 的检索结果不完美，还会与模型内部知识冲突。Astute RAG（ACL 2025）在检索之后加三步：按需生成内部知识段落、给内外段落打来源标签迭代合并、按可靠性定答。控制实验中约七成检索段落不直接含真答案、19.2% 的样例出现知识冲突；在最坏情形（检索全是最差负例）下，它是唯一追平或超过“不用 RAG”基线的方案。对方向二，这是多来源可信合并的公共基线。',
      sections: [
        {
          id: 'analysis',
          heading: '问题定义：检索不完美与知识冲突有多常见',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '§3 用 NQ、TriviaQA、BioASQ、PopQA 抽 1,000 个实例、每题以 Google Search 取 10 段做受控分析：“检索精度”定义为直接包含真答案的段落比例。结果有两层：约 70% 的检索段落不直接包含真答案；以 Claude 3.5 Sonnet 计，19.2% 的样例构成知识冲突。' },
              ],
            },
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '冲突的操作化定义是“不用 RAG 的输出与用 RAG 的输出不一致，且恰好一方正确”。在这类冲突样例中，内部知识正确占 47.4%，外部知识正确占 52.6%。这是对两路输出的对比观测，不直接探测模型内部知识，也不表示系统只采用外部知识；双方都错的样例归入另一子集。' },
              ],
            },
            {
              kind: 'callout',
              tone: 'author',
              title: '作者发现（反直觉的一条）',
              blocks: [
                {
                  kind: 'paragraph',
                  spans: [
                    { kind: 'text', text: '检索精度为 0% 时冲突率反而明显更低：此时混入的多是不相关段落，而不是看起来像答案的错误段落。噪声与冲突是两种要分开处理的失败模式。' },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'method',
          heading: '机制：三步都围绕来源感知（§4.2–4.4）',
          blocks: [
            {
              kind: 'list',
              ordered: true,
              items: [
                [{ kind: 'text', text: '自适应生成内部知识（4.2）：提示中写明“准确、相关、无幻觉”的宪法式原则，让模型最多生成若干段、每段覆盖不同信息，没有可靠信息时可以不生成。' }],
                [{ kind: 'text', text: '来源感知的迭代合并（4.3）：把外部检索段落与内部生成段落合并，每段带来源标签；提示模型归组一致信息、暴露冲突、滤掉不相关内容，可迭代多次。' }],
                [{ kind: 'text', text: '按可靠性定答（4.4）：每组各产出一个候选答案，比较来源、跨源印证、频率与信息完备度后定答；这一步可并入最后一次合并以减少调用。' }],
              ],
            },
            {
              kind: 'formula',
              text: 'D0 = E ⊕ I；  S0 = [ 1{d ∈ E} for d in D0 ]；  ⟨D(j+1), S(j+1)⟩ = M(p_con, q, ⟨D0,S0⟩, ⟨Dj,Sj⟩)',
              symbols: [
                { symbol: 'E', meaning: '外部检索到的段落集合' },
                { symbol: 'I', meaning: '模型按提示生成的内部知识段落，段数可为 0' },
                { symbol: 'D0', meaning: '合并后的初始段落集合' },
                { symbol: 'S0', meaning: '来源标签：来自外部检索记 1，否则为内部生成' },
                { symbol: 't', meaning: '合并迭代次数；主实验默认 t = 1' },
              ],
              note: '符号取自本次读取的 §4.2–4.3 HTML 正文；此处按可显示字符书写，未改动含义。',
            },
            {
              kind: 'callout',
              tone: 'editor',
              title: '整理者的辅助例子（不在原文中，只演示机制）',
              blocks: [
                {
                  kind: 'paragraph',
                  spans: [
                    { kind: 'text', text: '假设有人问“这个接口现在返回什么类型”。模型不确定时，第一步可以一段内部知识都不生成；检索拿到两段外部文档：旧版手册写“返回整数”，新迁移指南写“返回字符串”。第二步给两段都打上“外部检索”标签后合并，要求归组一致信息、暴露冲突——于是“两份外部文档互相矛盾”被明明白白摆出来，而不是被悄悄选掉一个。第三步定答时，因为没有任何跨源印证，系统可以说明分歧或拒答，而不是硬挑一个。' },
                  ],
                },
                {
                  kind: 'paragraph',
                  spans: [
                    { kind: 'text', text: '这个例子只演示三步机制（打标签、归组、按可靠性定答）怎么运转，不构成“该信新文档还是旧文档”的结论；时间与版本如何进入证据，正是方向二要研究的问题。' },
                  ],
                },
              ],
            },
            {
              kind: 'callout',
              tone: 'editor',
              title: '整理者的解释',
              blocks: [
                {
                  kind: 'paragraph',
                  spans: [
                    { kind: 'text', text: '整套机制不含训练、不换检索器，定位在检索之后，因此与“改进检索器”“自适应检索”等工作正交——这是判断后续工作有没有真正新增量时的关键坐标。' },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'evidence',
          heading: '关键证据：设置与结果边界',
          blocks: [
            {
              kind: 'comparison',
              caption: '实验设置要点（§5 文本叙述；主结果表未逐格核对）',
              columns: ['项', '设置'],
              rows: [
                ['短格式问答', 'NQ、TriviaQA、BioASQ、PopQA，每题 10 段真实检索'],
                ['长格式', 'ASQA'],
                ['最坏情形', 'RGB 英文子集，每题取 5 条最差负例构造'],
                ['模型', 'Claude 3.5 Sonnet、Gemini 1.5 Pro、Mistral Large（128B）、Mistral Nemo（12B）'],
                ['生成设置', '温度 0，最大输出 1,024 token，零样本；主实验默认 t=1'],
                ['基线', 'USC、GenRead、RobustRAG、InstructRAG、Self-Route'],
              ],
            },
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '结果方面：各检索精度区间一致占优；接近零精度时其他 RAG 变体全部不如“不用 RAG”，只有 Astute RAG 例外。在最坏情形构造下，“用 RAG”与“不用 RAG”的差距超过 50 个点，其他 RAG 变体仍明显落后，Astute RAG 是唯一接近“不用 RAG”的方案。在冲突子集上，它约 80% 的情况选对答案（分母即该子集）。' },
              ],
            },
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '消融给出的三点：去掉来源标签整体变差，在 NQ、PopQA、BioASQ 上尤其明显；与“答案精修”“上下文过滤”相比，只过滤不如先整合；上下文压缩在这组实验里无效甚至更差，因为它容易把有用信息一起删掉。' },
              ],
            },
            {
              kind: 'callout',
              tone: 'pending',
              title: '证据边界',
              blocks: [
                {
                  kind: 'paragraph',
                  spans: [
                    { kind: 'text', text: '中间步骤由 LLM judge 评估（知识合并准确率 98.2%、置信度分配 95.0%），论文未说明 judge 与被评模型是否同一，这不构成对最终答案可靠性的独立担保；主结果用字符串匹配算准确率，也不等于语义正确；成本只给 token 与调用次数作为代理指标（论文称额外成本低于 5%、相对 RAG 基线提升超过 11%）。' },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'limits',
          heading: '局限与可迁移点',
          blocks: [
            {
              kind: 'list',
              ordered: false,
              items: [
                [{ kind: 'text', text: '作者写明：方法依赖模型有强的指令遵循与推理能力，较弱模型上适用性可能受限。' }],
                [{ kind: 'text', text: '作者写明：更长输入下的不完美检索与冲突尚未充分实验，是后续方向。' }],
                [{ kind: 'text', text: '多轮合并收益递减，默认只迭代一次是为省成本；提示模板在附录，本次没有核对。' }],
              ],
            },
            {
              kind: 'callout',
              tone: 'editor',
              title: '整理者的分析',
              blocks: [
                {
                  kind: 'paragraph',
                  spans: [
                    { kind: 'text', text: '可以带走的是问题刻画（不完美检索不可避免、冲突是检索后瓶颈）与可借用的做法（来源标签、迭代合并、按可靠性定答）。但“让模型比较来源”本身不足以构成新贡献——Astute RAG 已占了这个位置；后续要在它没覆盖的地方找问题，例如证据的时间有效期与跨源冲突的动态变化。' },
                  ],
                },
              ],
            },
          ],
        },
      ],
      deepRead: [
        '§3 关于检索精度与冲突率的两段散文叙述（图 2、图 3 的配套文字；本次只读文字，未看图）：论证“为什么需要可信合并”时可直接引用的实证刻画。',
        '§4.3 来源标签 S0 的定义与合并提示的叙述：做任何“来源感知”设计前先看它的原始形态。',
        '§5 关于中间步骤由 LLM judge 评估的一段：区分对中间产物的评估与最终答案可靠性。',
        'Limitations：两条作者自述的边界，写相关工作对比时要如实引用。',
      ],
      references: [
        { paperId: 'sufficient-context', relation: 'editorial', reason: '同属检索后判断：它处理冲突，Sufficient Context 处理充分性与拒答，两者要分开比较（编辑安排）。' },
        { paperId: 'timely-rag', relation: 'editorial', reason: '近期时间敏感竞争工作，按路线放在其后核查（编辑安排）。' },
        { label: 'Yu 等 2023a 的内部知识生成框架', relation: 'citation', sourceLocator: '§4.2 引用并改进其提示生成框架', reason: '真实引用关系。' },
      ],
      openQuestions: [
        '19.2% 冲突率的分母是哪个数据集合、哪个模型？换一个模型还成立吗？',
        '“约 80% 选对”衡量的是最终答案选择还是中间判断？分母是哪个子集？',
        '最坏情形构造（5 条最差负例）与真实检索分布差多远？结论能外推到哪种部署场景？',
        '证据的时间有效期没有被建模：文档更新后，来源标签与合并结论如何失效？这是方向二可追问的切口。',
      ],
      questions: [
        '内外知识在冲突中各对一半（47.4/52.6），这对“优先相信外部检索”的默认做法意味着什么？',
        '去掉来源标签为什么会在 NQ、PopQA、BioASQ 上掉得最明显？',
        '如果把一次合并改成按证据有效期分组再合并，机制哪一步必须先改？',
      ],
      next: {
        note: '延伸阅读：按路线读 Sufficient Context（只依据摘要的卡）：拒答与回答覆盖的既有参照。',
        paperId: 'sufficient-context',
      },
    },
    {
      id: 'sufficient-context',
      title: 'Sufficient Context: A New Lens on Retrieval Augmented Generation Systems',
      displayTitle: '上下文够不够用：一个新的观察角度',
      url: 'https://arxiv.org/abs/2411.06037',
      type: 'method',
      importance: 'core',
      difficulty: 'needs_background',
      role: 'baseline',
      roleReason: '“可靠拒答”一线的既有参照；后续做拒答或上下文充分性调研都要与它比较。',
      recommendedDepth: 'standard',
      deliveredDepth: 'quick',
      templateVersion: 1,
      reasons: [
        '核心文献：“可靠拒答”一线的既有参照；后续做拒答或上下文充分性的调研都要与它比较。',
        '需要背景：检索增强问答评测的基本概念（依摘要判断）。',
        '方法论文：摘要显示为充分性判定加选择性生成与拒答。',
        '读法：以下判断只依据摘要，正文没有核对。',
      ],
      coverage: {
        mode: 'abstract',
        basis: 'arXiv 摘要（scout 提供）',
        version: 'arXiv:2411.06037（v1 2024-11-09；v3 2025-04-23）',
        sections: [],
        limitations: '仅摘要级判断；未读正文；不引用摘要中的百分比数字（缺少完整设置）。',
        checkedAt: '2026-09-15',
      },
      lead:
        '只凭摘要说：这篇提出“上下文是否充分”的判定视角，研究上下文不足时是回答还是拒答。正文还没有核对，结论以原文为准。放在方向二第三篇，是拒答与回答覆盖权衡绕不开的既有工作。',
      sections: [],
      deepRead: [],
      references: [
        { paperId: 'astute-rag', relation: 'editorial', reason: '与冲突处理互为补充：先看充分性，再谈冲突时选谁（编辑安排）。' },
      ],
      openQuestions: [],
      questions: [
        '“充分但答错”与“不充分而答对”两类样例在其结果里如何区分？取全文时先核对这一层。',
      ],
      next: { note: '延伸阅读：按路线读 HoH（只依据摘要的卡）。', paperId: 'hoh' },
    },
    {
      id: 'hoh',
      title: 'HoH: A Dynamic Benchmark for Evaluating the Impact of Outdated Information on Retrieval-Augmented Generation',
      displayTitle: 'HoH：过时信息怎么影响 RAG',
      url: 'https://aclanthology.org/2025.acl-long.301/',
      type: 'evaluation',
      importance: 'relevant',
      difficulty: 'needs_background',
      role: 'counterexample',
      roleReason: '把“知识会过时”落成可测的评测维度，用来检查只按时间排序会失败的情况。',
      recommendedDepth: 'standard',
      deliveredDepth: 'quick',
      templateVersion: 1,
      reasons: [
        '相关文献：把“知识会过时”落成可测的基准维度，方向二评测侧的参照。',
        '需要背景：问答基准与时间敏感评测的基本常识（依摘要判断）。',
        '实证评估：摘要显示为动态、过时信息场景的基准工作。',
        '读法：以下判断只依据摘要，正文没有核对。',
      ],
      coverage: {
        mode: 'abstract',
        basis: 'ACL Anthology 条目页与摘要（scout 提供）',
        version: 'ACL 2025 正式长文（anthology 条目；具体版本未核）',
        sections: [],
        limitations: '仅摘要级判断；未读正文；基准的标注流程细节与真值构造仍需核查；不引用摘要百分比。',
        checkedAt: '2026-09-15',
      },
      lead:
        '面向“过时信息怎么影响 RAG”的动态基准：据摘要，它以 token 级 diff 与 LLM 流水线构造时间知识演化的问答数据，并观察到过时信息即使与当前信息同时出现也会干扰回答。放在方向二第四篇，把“知识会过时”落成可以测量的评测维度。注意：以下只依据摘要，正文没有读；基准的标注流程细节与真值构造仍需核查；也不能说它是这个方向最早的基准。',
      sections: [],
      deepRead: [],
      references: [],
      openQuestions: [],
      questions: [
        '它的“过时”如何定义与抽样？取全文时先核对时间维度的构造方式。',
      ],
      next: { note: '延伸阅读：按路线读 TimelyRAG（只依据摘要的卡，简报优先项）。', paperId: 'timely-rag' },
    },
    {
      id: 'timely-rag',
      title: 'TimelyRAG: Semantic-Temporal Hybrid Retrieval for Time-Critical Question Answering in Overlapping-Evolving Documents',
      displayTitle: 'TimelyRAG：把时间信号放进排序',
      url: 'https://arxiv.org/abs/2609.11572',
      type: 'method',
      importance: 'core',
      difficulty: 'needs_background',
      role: 'frontier',
      roleReason: '直接竞争时间修订问题的近期工作，是方向二查新时必须比较的对象。',
      recommendedDepth: 'standard',
      deliveredDepth: 'quick',
      templateVersion: 1,
      reasons: [
        '核心文献：直接竞争时间修订问题的近期工作（2026-09-10），也是本期简报的优先项。',
        '需要背景：时间敏感问答与排序的基本概念（依摘要判断）。',
        '方法论文：摘要显示为语义-时间混合排序方法，并附基准。',
        '读法：以下判断只依据摘要，正文没有核对。',
      ],
      coverage: {
        mode: 'abstract',
        basis: 'arXiv 摘要（scout 提供）',
        version: 'arXiv:2609.11572（2026-09-10；具体版本未确认）',
        sections: [],
        limitations: '仅摘要级判断；未读正文；不引用摘要百分比。',
        checkedAt: '2026-09-15',
      },
      lead:
        '只凭摘要说：这篇做时间敏感检索的语义加时间混合排序，并构造了 TimelyQA Bench（arXiv 条目日期 2026-09-10）。正文还没有核对，结论以原文为准。放在方向二第五篇，是直接竞争时间修订问题的近期线索。',
      sections: [],
      deepRead: [],
      references: [
        { paperId: 'hoh', relation: 'editorial', reason: '同为时间维度工作：一个做基准，一个做排序，比较时先统一“时间”的定义（编辑安排）。' },
      ],
      openQuestions: [],
      questions: [
        '语义相关性与时间信号在排序中如何折中？取全文时先核对其权衡机制与 TimelyQA Bench 的构造。',
      ],
      next: { note: '方向二路线到此收尾；工程与评价能力见“技术学习”。', paperId: null },
    },

    // ---------- 方向三 ----------
    {
      id: 'spectral-tutorial',
      title: 'A Tutorial on Spectral Clustering（von Luxburg）',
      displayTitle: '谱聚类教程（von Luxburg）',
      url: 'https://arxiv.org/abs/0711.0189',
      type: 'survey',
      importance: 'relevant',
      difficulty: 'needs_background',
      role: 'background',
      roleReason: '谱方法概念打底，支撑路线中 SURE、CAMERA、OAGL 的谱线索。',
      recommendedDepth: 'deep',
      deliveredDepth: 'quick',
      templateVersion: 1,
      reasons: [
        '相关文献：谱方法概念打底，支撑路线中 SURE、CAMERA、OAGL 的谱线索。',
        '需要背景：线性代数与图划分的基本概念（依摘要判断）。',
        '综述：教程，价值在直觉与推导入口。',
        '读法：这里只依据摘要做身份判断；它是教程，按需精读，这次没有核对正文。',
      ],
      coverage: {
        mode: 'abstract',
        basis: 'arXiv 摘要页（scout 提供身份）',
        version: 'arXiv:0711.0189（具体版本未确认）',
        sections: [],
        limitations: '仅摘要级身份，未读正文；按教程使用时以原文为准。',
        checkedAt: '2026-09-15',
      },
      lead:
        '谱聚类教程：据摘要，围绕图拉普拉斯矩阵讲解常用谱聚类算法，并以图割与随机游走视角解释原理，先修线性代数。放在方向三开头打底概念：先建立“相似图—拉普拉斯—谱嵌入”的直觉，再读 SURE、CAMERA 的谱线索。注意：这里只有摘要层面的身份信息，正文没有读；谱方法相对 k-means 的优势是经验观察，不能当成保证。',
      sections: [],
      deepRead: [],
      references: [],
      openQuestions: [],
      questions: [
        '谱聚类的输入输出是什么？它隐含假设数据具有哪种簇结构？',
      ],
      next: { note: '延伸阅读：按路线读 SURE（入口条目，CAMERA 前作）。', paperId: 'sure' },
    },
    {
      id: 'sure',
      title: 'Robust Multiview Clustering with Incomplete Information（CAMERA 参考条目 [13]，文中称 SURE）',
      displayTitle: 'SURE：信息不完整时的鲁棒多视图聚类',
      url: 'https://doi.org/10.1109/TPAMI.2022.3155499',
      type: 'method',
      importance: 'relevant',
      difficulty: 'unknown',
      role: 'baseline',
      roleReason: 'CAMERA 直接对照的前作，用来看清问题设定与方法上的承续关系。',
      recommendedDepth: 'standard',
      deliveredDepth: 'entry',
      templateVersion: 1,
      reasons: [
        '相关文献：CAMERA 直接对照的前作（其参考条目 [13]），路线第二位。',
        '难度未判：还没有获取摘要，先不做难度判断。',
        '方法论文（依条目标识初判）：不完整多视图聚类方法，读过原文再确认。',
        '路线中的角色：这是一条阅读入口，不是阅读卡——摘要还没拿到，不提供内容整理。',
      ],
      coverage: {
        mode: 'metadata',
        basis: 'CAMERA 作者稿参考条目 [13]（未获取原文摘要）',
        version: 'IEEE TPAMI 45(1), 2023（early access 2022；DOI 10.1109/TPAMI.2022.3155499，Crossref 核查 2026-09-15）',
        sections: [],
        limitations:
          '未获取摘要与正文；本条不提供任何内容判断；身份经 CAMERA 作者稿参考条目 [13] 核对，链接为本篇 DOI（Crossref 核查 2026-09-15）。',
        checkedAt: '2026-09-15',
      },
      lead:
        '这是一条阅读入口：不完整多视图聚类的既有方法（文中称 SURE，身份经 CAMERA 作者稿参考条目 [13] 核对）。摘要还没有获取，这里不提供内容整理，请直接读原文。',
      sections: [],
      deepRead: [],
      references: [
        { paperId: 'camera-incomplete-mv', relation: 'citation', sourceLocator: 'CAMERA 参考条目 [13]', reason: '真实引用关系：CAMERA 直接对照它。' },
      ],
      openQuestions: [],
      questions: [],
      next: {
        note: '读完原文后自己补上：它与 CAMERA 在问题设定与方法上的承续与差异。',
        paperId: null,
      },
    },
    {
      id: 'camera-incomplete-mv',
      title: 'Community-aware Multi-view Representation Learning with Incomplete Information',
      displayTitle: 'CAMERA：缺失与未对齐时的社区感知融合',
      url: 'https://xlearning-lab.com/assets/2026-TPAMI-Community-aware-Multi-view-Representation-Learning-with-Incomplete-Information.pdf',
      type: 'method',
      importance: 'relevant',
      difficulty: 'challenging',
      role: 'baseline',
      roleReason: '它展示“补齐与对齐本身可能引入错误”，问题意识与方向三相邻但任务不同。',
      recommendedDepth: 'standard',
      deliveredDepth: 'standard',
      templateVersion: 1,
      reasons: [
        '相关文献：它处理样本缺失、视图未对齐下的融合表征，“补齐与对齐本身可能引入错误”的问题意识与方向三直接相邻；任务不同（这是整理者的判断）。',
        '有挑战：信息论下界与三个损失项相互咬合，公式在抽取文本中乱码，需要对照原文逐个理解。',
        '方法论文：贡献是双流网络、目标函数与统一的缺失、未对齐恢复框架（MAI/MAA），证据是七个数据集上的聚类、分类与动作识别对比。',
        '路线第三位（路线中有正文整理的卡）：先学会描述“不完整信息下的融合”，再回到属性图任务本身。',
      ],
      coverage: {
        mode: 'partial-text',
        basis: 'external_parser（pdftotext）抽取的作者稿 PDF 全文文本',
        version: 'TPAMI 版式作者稿；正式卷期与出版版本未知，引用时不标注卷期',
        sections: ['摘要', '§1 开篇', '§3（3.1–3.4）', '§4.1–4.3', '§4.6', '§5'],
        limitations:
          '图 1–6 与注意力可视化仅见图注，未看图；表 4–7 文本已抽取但未逐格核对，不引用表内数值；式(1)–(18) 符号在纯文本中乱码，机制理解以正文叙述为准；补充材料与定理证明未读。',
        checkedAt: '2026-09-15',
      },
      lead:
        '多视图表征学习里处理“样本缺失（SP）与视图未对齐（VP）”的方法论文：CAMERA（TPAMI 版式作者稿，版本未知）把两个社会学概念数学化——社区共同性收紧视图内簇、社区多样性保留视图差异——用可学习社区中心加互注意力的双流网络实现，并在推理期用同一注意力做缺失填补（MAI）与未对齐重配（MAA）。要留意：它处理的是多视图特征数据，不是属性图；读它是为了看清“不完整信息下融合怎么出错、怎么补救”，它本身不是属性图任务的现成方案——这一句是整理者的分析。',
      sections: [
        {
          id: 'problem',
          heading: '问题：不完整信息有两种，取舍普遍失衡',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: 'SP 指某些样本的部分视图整段缺失；VP 指视图之间样本没有对齐（引言以自动驾驶传感器损坏与信号失步为例；§3.4 定义 3 给出形式化）。作者主张已有方法在样本恢复、视图对齐与数据多样性保持之间取舍失衡（摘要、§1）。' },
              ],
            },
          ],
        },
        {
          id: 'mechanism',
          heading: '机制：社区共同性与多样性如何同时保住（§3.1–3.4）',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '双流网络：每个视图学一组可学习社区中心，互注意力连接样本与中心；样本级表示拉向自己的社区中心（共同性），中心又聚合视图内样本形成社区级表示（§3.1）。' },
              ],
            },
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '总损失是双层级学习损失加重构损失（§3.2）：共同性损失一方面锐化注意力，让样本自信地分给某个社区，其熵项同时防止大多数样本坍缩进同一社区（§3.2.1）；多样性损失在目标中将正对余弦相似度截断于 τ=0.7，使继续提高正对相似度不再获得额外收益，并用 hinge 维持正负对间隔（§3.2.2）；样本级一致性损失对齐同一样本的跨视图表示。τ 是正对相似度的截断阈值，不等同于互信息约束中的 margin，相关证明这次没有核对。' },
              ],
            },
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '恢复框架（§3.4）：MAI 用观测视图的注意力加缺失视图的社区中心填补缺失表示，并保留观测样本自身的表示以维持跨视图一致性；跨视图社区先建立对应（先由注意力得到社区分配，再对有配对的样本跑 Hungarian），两视图的注意力比较才有意义。MAA 据此用“两视图注意力最大处一致”确认配对，不一致时在跨视图近邻中找注意力匹配的新对应。两者都在推理期完成，不重训网络。' },
              ],
            },
          ],
        },
        {
          id: 'evidence',
          heading: '证据与设置（摘要、§4.6）',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '摘要称在七个数据集上对比 24 个多视图方法，覆盖聚类、分类与动作识别。§4.6 的参数与消融在 Scene-15 聚类任务上进行：折中参数取 10 时最佳；共同性权重除 0 外不敏感（取 0 时注意力趋均匀、共同性丢失）；多样性边界在 0.5–0.8 区间稳定、0.7 最佳。' },
              ],
            },
            {
              kind: 'list',
              ordered: false,
              items: [
                [{ kind: 'text', text: '四个损失项各有贡献，且多样性损失依赖样本级一致性先建立的表示——单独使用反而更差（§4.6.3）。' }],
                [{ kind: 'text', text: '每轮 k-means 或直接用可学习中心构造社区都不如双流的软聚合，因为 k-means 中心过时、丢失社区演化信息（§4.6.4）。' }],
                [{ kind: 'text', text: '填补与对齐只用样本表示或只用社区表示都会明显变差，两者合用才保住共同性与多样性（§4.6.5）。' }],
              ],
            },
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '训练与配对前提（§4.2、§4.3）：前 50 epoch 先用除多样性损失外的损失 warm-up（早期注意力未立住时它会错误拉近跨社区样本）；随后由注意力得到社区分配，并在有配对的样本上跑 Hungarian 算法建立跨视图社区对应。全部实例均存在部分视图缺失（full SP）或视图完全未对齐时没有先验配对样本可用，方法改以样本及其跨视图最近邻充当配对并构建社区对应——并不要求完整配对集。' },
              ],
            },
          ],
        },
        {
          id: 'relation',
          heading: '与方向三的关系：任务不同，问题相通（整理者的分析）',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: 'CAMERA 回答的是“视图残缺时如何恢复表征并保住多样性”，对象是图像与特征型的多视图数据。方向三的“部分观测图数据有害融合识别”对象是属性图，要问的是融合过程中有害信息如何被引入与识别——问题形态不同，不能把 CAMERA 当作直接解法。' },
              ],
            },
            {
              kind: 'callout',
              tone: 'editor',
              title: '整理者的分析',
              blocks: [
                {
                  kind: 'paragraph',
                  spans: [
                    { kind: 'text', text: '填补与重配依赖学到的表示及跨视图对应，因此值得追问：错误恢复会不会影响下游任务，什么时候难以被识别。这个问题能否迁移到属性图的跨源融合，仍需在图任务中单独验证；CAMERA 本身没有给出答案。' },
                  ],
                },
              ],
            },
          ],
        },
      ],
      deepRead: [
        '§3.1 式(1)–(3) 前后的文字解释：互注意力的双向作用（样本取中心、中心聚样本），双流机制全部从这里展开。',
        '§3.4 定义 3：SP 与 VP 的形式化定义，讨论“部分观测”时可直接复用的刻画。',
        '§4.6.3 配套叙述：多样性损失单独使用反而更差——损失项之间依赖性的实证例子。',
      ],
      references: [
        { paperId: 'sure', relation: 'citation', sourceLocator: 'CAMERA 参考条目 [13]', reason: '真实引用关系：CAMERA 直接对照的前作。' },
        { paperId: 'oagl', relation: 'editorial', reason: '同为不完整多视图方法，按路线顺序对照技术组合（编辑安排）。' },
      ],
      openQuestions: [
        '把 SP/VP 换成属性图的“节点/子图缺失、跨源节点未对齐”，CAMERA 的机制哪些部分直接失效？',
        '错误恢复在下游任务上的影响有没有被测量？CAMERA 的实验只测到表征与聚类指标。',
      ],
      questions: [
        '社区共同性与多样性的信息论定义（定义 1/2）和日常语义差在哪？定理 1/2 保证到哪一层（下界而非等式）？',
        'MAA 的配对判据（两视图注意力最大处一致）在什么数据上会系统性失效？',
        '摘要称七个数据集上超过 24 个方法：去 §4.3–4.5 核对每个数据集用什么指标、缺失与未对齐的设置是否一致。',
      ],
      next: {
        note: '延伸阅读：按路线读 OAGL（只依据摘要的卡）：不完整多视图子空间聚类的另一种技术组合。',
        paperId: 'oagl',
      },
    },
    {
      id: 'oagl',
      title: 'One-Step Adaptive Graph Learning for Incomplete Multi-view Subspace Clustering（TKDE 2025）',
      displayTitle: 'OAGL：一步自适应图学习',
      url: 'https://researchportal.northumbria.ac.uk/en/publications/one-step-adaptive-graph-learning-for-incomplete-multiview-subspac/',
      type: 'method',
      importance: 'relevant',
      difficulty: 'challenging',
      role: 'frontier',
      roleReason: '不完整多视图子空间聚类的近期技术组合，用来扩充“融合加缺失”的方法谱系。',
      recommendedDepth: 'standard',
      deliveredDepth: 'quick',
      templateVersion: 1,
      reasons: [
        '相关文献：不完整多视图子空间聚类的近期技术组合，扩充方向三“融合加缺失”的方法谱系。',
        '有挑战：摘要要点涉及谱嵌入、稀疏表示与低秩张量多个技术层（依摘要判断）。',
        '方法论文：摘要显示为一步自适应图学习方法。',
        '读法：以下判断只依据摘要，正文没有核对。',
      ],
      coverage: {
        mode: 'abstract',
        basis: '出版机构条目页与摘要（scout 提供）',
        version: 'TKDE 2025（DOI 10.1109/TKDE.2025.3543696；条目页）',
        sections: [],
        limitations: '仅摘要级判断；未读正文；不引用摘要百分比。',
        checkedAt: '2026-09-15',
      },
      lead:
        '只凭摘要说：一步自适应图学习处理不完整多视图子空间聚类——聚类指示器谱嵌入融合、稀疏表示初始化、低秩张量建模与交替优化（TKDE 2025，DOI 10.1109/TKDE.2025.3543696）。正文还没有核对。放在方向三第四篇。',
      sections: [],
      deepRead: [],
      references: [
        { paperId: 'camera-incomplete-mv', relation: 'editorial', reason: '同为不完整多视图方法，对照差异在图构造还是恢复（编辑安排）。' },
      ],
      openQuestions: [],
      questions: [
        '“一步”相对于哪类多步交替流程而言？取全文时先核对其与 CAMERA 类方法的机制差异在图构造还是恢复。',
      ],
      next: { note: '延伸阅读：按路线读 BRIDGE（只依据摘要的卡）。', paperId: 'bridge' },
    },
    {
      id: 'bridge',
      title: 'BRIDGE：完整与不完整深度多视图的统一框架（ICCV 2025；完整标题以条目页为准）',
      displayTitle: 'BRIDGE：完整与不完整数据的统一框架',
      url: 'https://openaccess.thecvf.com/content/ICCV2025/html/Jiang_A_Unified_Framework_to_BRIDGE_Complete_and_Incomplete_Deep_Multi-View_ICCV_2025_paper.html',
      type: 'method',
      importance: 'relevant',
      difficulty: 'needs_background',
      role: 'frontier',
      roleReason: '它说明“真实缺失不是随机缺失”已有研究，方向三不能单独把这一条当创新。',
      recommendedDepth: 'standard',
      deliveredDepth: 'quick',
      templateVersion: 1,
      reasons: [
        '相关文献：完整与不完整数据的统一处理框架，补齐方向三近期竞争图景。',
        '需要背景：深度多视图学习与域对抗的基本概念（依摘要判断）。',
        '方法论文：摘要显示为两阶段迁移加域对抗的统一框架。',
        '读法：以下判断只依据摘要，正文没有核对。',
      ],
      coverage: {
        mode: 'abstract',
        basis: 'CVF Open Access 条目页与摘要（scout 提供）',
        version: 'ICCV 2025（openaccess 条目）',
        sections: [],
        limitations: '仅摘要级判断；未读正文；完整标题以条目页显示为准；不引用摘要百分比。',
        checkedAt: '2026-09-15',
      },
      lead:
        '只凭摘要说：两阶段框架——先在完整数据上学习再迁移，并以域对抗应对非独立同分布缺失（ICCV 2025）。正文还没有核对。放在方向三第五篇，路线到此收尾。',
      sections: [],
      deepRead: [],
      references: [],
      openQuestions: [],
      questions: [
        '“非独立同分布缺失”在其实验里如何构造？取全文时先核对域对抗具体对齐的是什么分布差。',
      ],
      next: { note: '方向三路线到此收尾；技术能力见“技术学习”。', paperId: null },
    },

];
