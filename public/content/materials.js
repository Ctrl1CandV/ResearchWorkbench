// public/content/materials.js —— SCAFFOLD-008 起步导读材料（站内编辑 primer）+ PLAN-010 三篇（2026-09-24）。
// 契约：docs/SCAFFOLD-008/03-reading-system.md §3、02-curriculum.md（008.2）、
//   docs/plans/PLAN-010-content-display-deepening.md 阶段 A/D。
// - 五个材料均为 editorial-primer：实际编辑正文，不伪装成外部论文；材料只读，不进个人记录；
// - 旧两篇（mat-cross-harness-map / mat-read-empirical）原样保留；新三篇以同一贯穿例子展开：
//   「工具 A 的 Agent 修一个 issue 改到一半（已改三个文件、跑过一次测试），把现场交给工具 B 的 Agent」。
// 本文件只是数据，不含任何本人进度。

export const MATERIALS = [
  {
    id: 'mat-cross-harness-map',
    title: '跨工具协作：先把研究问题分清楚',
    format: 'primer',
    lead: '先分清场景、机制、表示与传输四层，再谈哪种协作做法合适；不预设任何赢家。',
    learner: {
      gist: '在彼此隔离的工具里，Agent 如何交换与保留信息：场景、机制、表示和传输不是同一层。',
      value: '先消除「共享世界状态就是研究方向」这类误解，后面四篇论文才能各归其位。',
      intent: '读完能用自己的话提出「在什么条件与输入/输出预算下，哪种机制/表示组合更合适」，而不是先选一种格式当答案。',
    },
    readingActions: {
      preserve: [
        { target: '场景 / 机制 / 表示 / 传输的区分', why: '这是全路线的地图；后面每篇论文都要先放进这四层之一再比较。' },
        { target: '输入预算与输出预算分开记', why: '接收方一次看到的上下文额度和端到端累计消耗是两本账，混在一起就无法比较成本。' },
      ],
      explain: [
        {
          target: '两种机制+表示组合的编辑例子',
          why: '编辑举例，帮助理解「可组合」是什么意思（不是研究结果，不表示哪种更好）。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '例子一：仓库工件 + 短摘要。工具 A 改到一半，把工作区文件（工件）连同一段它自己写的摘要留在仓库；工具 B 从仓库接续，摘要告诉它「改了什么、为什么」，工件是它可以直接验证的证据。' },
              ],
            },
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '例子二：长期记忆 + 检索 + 交接包。A 把值得复用的结论写进长期记忆；B 接手时先按当前问题检索记忆，再读一份结构化交接包补齐本次任务的上下文。两个例子的信息都经过了「写入—取回」的选择，不是把全部历史原样倒给下一任。' },
              ],
            },
            {
              kind: 'callout',
              tone: 'editor',
              title: '编辑举例',
              blocks: [
                {
                  kind: 'paragraph',
                  spans: [{ kind: 'text', text: '以上两个组合是编辑为解释结构而构造的例子，不代表任何论文的实验结论，也不表示哪种组合更好。' }],
                },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: '事件溯源数据库、A2A/MCP 实现', why: '此时不学具体协议与数据库设计；传输层用什么实现是后面的工程问题。' },
        { target: '论文发表流程', why: '先把问题读清楚；是否成研究问题、如何成题另议。' },
      ],
    },
    coverage: {
      mode: 'editorial-primer',
      basis: '站内编辑。问题意识依据 Beyond Frameworks（协作维度，ACL 2025）、MemGPT（记忆与当前输入）、两篇换手研究（Tax/Debt）与方向页「按需查阅」中的三篇资料；四层划分与组合例子为编辑整理，不伪称某论文提出了完整分类，也不为尚未验证的跨工具效果背书。2026-09-23（009-A）：四篇基础论文按节/小节级重新拉取原文复核（Beyond §3.2–3.5/§4.1、MemGPT §2.1–2.4、Tax §3/§4、Debt §4.3/§5.1/§5.3），本导读正文未新增论文事实，仅复核了引用面。',
      version: '—',
      sections: ['编辑正文'],
      limitations: '编辑说明不是论文；分类存在交叠，各论文不一定采用同一套划分。',
      checkedAt: '2026-09-23',
    },
    body: {
      blocks: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '先把场景说清。' },
            { kind: 'text', text: '「跨工具」指不同 Agent 无法共享同一个 harness、完整上下文和持续会话——常常是因为想用的模型分别锁在各自的工具里。harness 不只是模型名字：它还包括工具集、权限、日志与计费方式。不能共享完整会话，不代表不能共享获准的文件或仓库；反过来，能传文件也不代表信息就被正确理解了。这是研究场景，不是一种算法。' },
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '机制是可组合的。' },
            { kind: 'text', text: '直接传消息或摘要是一种机制；借助共享工作区、长期记忆、检索、仓库工件协作也是机制；它们可以组合使用，不互斥。「状态 + 交接包」只是众多组合之一，不是题目本身。' },
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '表示是机制内部的选择。' },
            { kind: 'text', text: 'summary（摘要）、raw trajectory（原始轨迹）、handoff packet（交接包）、wiki、状态快照、检索选段，都是「传什么」的候选表示，各有信息量与成本。文件、Git、协议属于传输/互操作层：解决「怎么搬」，不解决「搬什么最有效」。' },
          ],
        },
        {
          kind: 'comparison',
          columns: ['层', '回答的问题', '例子'],
          rows: [
            ['场景', '在什么约束下协作', '模型分处两个封闭工具'],
            ['机制', '用什么方式协作', '传消息 / 共享工件 / 记忆+检索'],
            ['表示', '具体传什么信息', '摘要 / 轨迹 / 交接包 / 快照'],
            ['传输', '怎么把信息搬过去', '文件 / Git / 协议'],
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '预算要记两本账。' },
            { kind: 'text', text: '接收方一次能看到的通信上下文是一个额度；端到端所有参与者的累计输入、输出消耗是另一本账。摘要生成、记忆写入与检索、工具返回、打开工件后进入上下文的内容都要记账，不能成为不记账的信息后门。成功、返工、token、延迟是不同的量：能复述前史不等于少走弯路。固定的是预算上限/口径，不要求每次都恰好消耗相同 token；异构 tokenizer 与不可见的工具轨迹会让严格可比更难，读论文时先看它记的口径。' },
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '一个中性例子。' },
            { kind: 'text', text: '工具 A 的 Agent 修一个 issue 做到一半（已改三个文件、跑过一次测试），把现场交给工具 B 的 Agent；B 继续后可能再交回 A。这一小段里就有全部四层：场景是 A/B 两个 harness；机制可以是「B 读 A 留下的工件+摘要」；表示是摘要怎么写、工件留哪些；传输是共享仓库或导出文件。换手的 Tax/Debt 两篇论文把这一小段做成了可对照的实验设置——但换手只是整个协作问题的第一切片，持续分工、反馈往返和长期合作仍在研究范围内。' },
          ],
        },
        {
          kind: 'callout',
          tone: 'note',
          title: '待研究的不是「哪种格式最好」',
          blocks: [
            {
              kind: 'paragraph',
              spans: [{ kind: 'text', text: '要问的是：哪类项目与问题、哪对模型、哪种预算与合作阶段，适合哪种机制/表示组合。组合带来的收益也要分清是机制互补，还是仅仅用了更多信息、调用或工具权限。另外，共享状态里的事实、假设和未决问题不能一概当作客观真相传给下一任。' }],
            },
          ],
        },
      ],
    },
    nextAction: '下一步读《Beyond Frameworks》：把「协作」拆成治理、参与、交互与历史管理四个维度（定义分别落在 §3.2/§3.3/§3.4/§3.5，读前可对照本页四层表：它的「历史管理」≈本页「表示」层）。',
  },
  {
    id: 'mat-read-empirical',
    title: '怎样读实证研究：三遍读法与四个问题',
    format: 'primer',
    lead: '读评价类论文先问「测什么、真值怎么来、数字的分母是谁」，再决定信不信它的结论。',
    learner: {
      gist: '实证研究论文的三遍读法：摘要加总图 → 方法与协议 → 数字与边界；配套四个问题：问题、设置、证据、外推。',
      value: '下一条路线节点（TOSEM）是评价论文；先学会读法，才不会被 AI 摘要或单个漂亮数字带着走。',
      intent: '读完能带着「patch ≠ fix」这类警惕去读 RQ 设置，知道每个数字回原文找它的分母与口径。',
    },
    readingActions: {
      preserve: [
        { target: '四个问题：问题、设置、证据、外推', why: '任何评价论文都先过这四问；答不上来的结论先存疑。' },
        { target: '三遍读法', why: '第一遍建地图、第二遍看协议、第三遍才碰数字，避免倒着读。' },
      ],
      explain: [
        {
          target: '「数字的分母是谁」的编辑例子',
          why: '编辑举例：同一句话换个分母就换了个结论。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '（编辑举例）「测试通过的补丁有 40% 是伪修复」——分母是「被测试接受的补丁」。换成「全部提交的补丁」，比例会完全不同。读论文时先把每个百分比的分母写下来，再决定它支撑了什么主张。摘要里的数字尤其要回正文找原始表。' },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: '统计课与 p 值哲学', why: '起步只需会问分母与口径；显著性检验的深入讨论此时不需要。' },
      ],
    },
    coverage: {
      mode: 'editorial-primer',
      basis: '站内编辑。读法框架为编辑整理；示例（分母问题）为编辑构造，不对应某篇论文的具体数字。2026-09-23（009-A）核对本篇对 TOSEM 的指涉（真值＝契约加缺陷查找工具复核）与其卡已登记的 §3 级覆盖一致；本轮未重新读 TOSEM 全文。',
      version: '—',
      sections: ['编辑正文'],
      limitations: '编辑说明不是论文；不提供统计推断教程。',
      checkedAt: '2026-09-23',
    },
    body: {
      blocks: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '第一遍：摘要加总图。' },
            { kind: 'text', text: '只回答三件事：研究对象是什么（比如「测试验收会不会放过伪修复」）、作者自称的发现是什么、实验在哪个台子上做。这一遍不读方法细节，先决定这篇论文值不值得进入第二遍。' },
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '第二遍：方法与协议。' },
            { kind: 'text', text: '真值（ground truth）怎么来？谁复核谁？对比的各组除了被研究的变量外，其他条件是否相同（同模型、同预算、同任务集）？评价指标的分母是谁？这一遍是评价论文的主体。' },
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '第三遍：数字与边界。' },
            { kind: 'text', text: '只读支撑核心主张的那一两个结果：找到原始表或段落，确认数字与设置对得上，再把作者的适用范围声明读完。数字必须回原文核对，摘要里的百分比不当已核数字用。' },
          ],
        },
        {
          kind: 'list',
          items: [
            [{ kind: 'text', text: '问题：它到底在测量什么？评价对象是谁？' }],
            [{ kind: 'text', text: '设置：任务、真值、对照组、预算从哪里来，是否可比？' }],
            [{ kind: 'text', text: '证据：哪个结果最能支撑主张？分母与口径是什么？' }],
            [{ kind: 'text', text: '外推：结论适用于哪些任务、模型与工具？作者自己划的边界在哪？' }],
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'text', text: '带着这四问去读下一条路线的 TOSEM：它研究「测试验收准则会不会把没修好的补丁当修好」，真值来自契约加缺陷查找工具的独立复核——这正是「数字回原文、分母先看清」的练习材料。' },
          ],
        },
      ],
    },
    nextAction: '下一步读 TOSEM 卡：用三遍读法过一遍它的 RQ1 与 RQ4。',
  },

  // ---------- PLAN-010 阶段 A：基础导读 3 篇（贯穿同一例子；2026-09-24） ----------
  {
    id: 'mat-handoff-basics',
    title: '任务接续：换手时到底在传什么',
    format: 'primer',
    lead: '把「换手」从一句直觉拆成可对照的概念：非原生轨迹、重新发现成本、残差义务，各对应哪一篇论文的哪一层。',
    learner: {
      gist: '前任在中断点离开、后任在隔离环境继续时，真正发生的不是「传一个文件」，而是三件可分开观察的事：后任看到了什么表示（仓库/轨迹/笔记）、后任要重新发现多少（重新发现成本）、哪些义务已经开了必须补完（残差义务）。',
      value: '读懂站内四篇换手/近邻论文的公共底座：Tax 管表示，Debt 管重新发现成本，Do Not Restart 管残差义务，Compression Cost 管接续后的运行账。',
      intent: '读完能把同一道贯穿例子分别映射到三个概念上，并说出每个概念对应哪篇论文的哪一节。',
    },
    readingActions: {
      preserve: [
        { target: '三个概念的区分：表示 / 重新发现成本 / 残差义务', why: '这是读四篇换手相关论文的公共坐标系，缺一个就会张冠李戴。' },
      ],
      explain: [
        {
          target: '贯穿例子在三概念上的映射',
          why: '编辑讲解：同一例子走三遍，概念各归其位。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '（编辑讲解）同一道贯穿例子走三遍。第一遍问表示：B 接手时眼前有什么——只有仓库？还是附带 A 的原始轨迹、摘要笔记或结构化笔记？这是 Handoff Debt 的四视图（§5），每种表示对应不同的初始输入长度。第二遍问重新发现成本：B 为搞清「改了什么、为什么、还缺什么」要多走多少步、多烧多少 token——Debt 把它叫 handoff debt，Tax 的方向条件说明这份成本随模型对而变。第三遍问残差义务：A 已接受「把三个文件改成这样」的中间状态里，哪些承诺已经生效、哪些请求范围内的工作还开着——Do Not Restart 用 commitment frontier 与残差合约把「还欠什么」形式化（§3）。三遍各管一层，互相不能替代：表示再好，义务没冻结照样漏做；义务冻结了，表示太差 B 也找不着入口。' },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: '协议与传输实现', why: '本篇只立概念；文件/Git/协议怎么搬是传输层工程问题。' },
      ],
    },
    coverage: {
      mode: 'editorial-primer',
      basis: '站内编辑。概念来源：non-native trajectory 与四条件（Handoff Tax §3 已核）、四视图与重新发现成本（Handoff Debt §5 已核）、commitment frontier 与 CFRC（Do Not Restart §3 已核，arXiv:2609.13800）、运行中再获取成本（Compression Cost §3–4 已核）。贯穿例子沿用 mat-cross-harness-map 的中性例子；三概念映射为编辑整理，不伪称任何论文提出了完整分类。',
      version: '—',
      sections: ['编辑正文'],
      limitations: '编辑说明不是论文；三概念划分是教学坐标系，各论文的问题定义以原文为准。',
      checkedAt: '2026-09-24',
    },
    body: {
      blocks: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '一个贯穿例子。' },
            { kind: 'text', text: '工具 A 的 Agent 修一个 issue 改到一半：已改三个文件、跑过一次测试，现在把现场交给工具 B 的 Agent，B 继续后可能再交回 A。下面所有概念都用这一道例子展开；四篇相关论文（Tax / Debt / Do Not Restart / Compression Cost）各自只照见这道例子的一个侧面。' },
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '概念一：表示——B 接手时眼前有什么。' },
            { kind: 'text', text: '候选从少到多：仅仓库（B 自己从工作区推断）、原始轨迹（A 的完整事件流）、摘要笔记（A 或第三者写的一段话）、结构化笔记（按字段组织的交接包）。这就是 Debt 的四视图。表示选择决定初始输入长度（Debt §5.3：raw 约 87k 字符，仅仓库约 7.2k），也决定 B 从哪开始推断。注意审计修订后的口径：Tax 的 Compact_pre 与 Compact_suf 都是交接时刻的摘要注入，差别只在「谁做的压缩」，不存在「接收方运行时主动拉取」的条件——主动获取是另一类机制，见 Compression Cost 的 re-query。' },
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '概念二：重新发现成本——B 要补多少课。' },
            { kind: 'text', text: '不管给哪种表示，B 都需要重建「现状 + 历史 + 约束」的心智模型，为此多走的探查步数、多发的检索调用，就是重新发现成本。Debt 把它做成可度量的账（事件数、累计 token 分列）；Tax 证明这笔账随换手方向变化（升配与降配的划算界面相反）；Compression Cost 补上了交接之后的运行账——压缩丢掉的状态，B 会在后续轮次里用 re-query 循环一笔一笔买回来。' },
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '概念三：残差义务——还欠什么。' },
            { kind: 'text', text: '前两个概念都默认「现场冻结即义务清楚」，但 Do Not Restart 指出：已接受前缀里既有必须保留的进度，也有请求范围内仍开放的工作——commitment frontier 就是这条分界。它的三阶段把义务管起来：交接前先冻结残差合约（被省略的工作不会因继任方不提就消失），B 在隔离副本上补全，整张证据图对照合约准入后才给实写权限，且只认活环境的回执（副本成功不解除义务）。在贯穿例子里：A 改掉的三个文件是已接受绑定，「跑一次完整回归」如果是请求范围里的工作而 A 没做，就是开放义务，B 必须补完而不是从头重开。' },
          ],
        },
        {
          kind: 'callout',
          tone: 'editor',
          title: '编辑整理',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '「表示 / 重新发现成本 / 残差义务」三概念划分是本站的教学坐标系，不是任何一篇论文提出的公认分类；各概念的证据以对应论文的已核章节为准。三篇预印本（Do Not Restart / Compression Cost / MemCollab / Routed Graph Handoff）均未经同行评审，引用数字须带设置条件。' },
              ],
            },
          ],
        },
      ],
    },
    nextAction: '下一步带着三概念重读 Handoff Debt 卡（表示层）与 Do Not Restart 卡（残差义务），对照贯穿例子各归其位。',
  },
  {
    id: 'mat-mech-vs-representation',
    title: '机制与表示：两个别混的层次',
    format: 'primer',
    lead: '「用共享记忆协作」是机制，「记忆里存文本还是结构」是表示；混为一谈就无法比较，也提不出可检验的问题。',
    learner: {
      gist: '机制回答「用什么方式协作」：直接传消息、共享工件、长期记忆+检索、黑板、合约式接续；表示回答「具体传什么」：自然语言摘要、原始轨迹、结构化笔记、依赖图、检索选段。同一机制可配不同表示，同一表示也可走不同机制搬运。',
      value: '主方向的全部比较问题都建立在两层分开之上：Tax/Debt 比的是表示（同机制换表示），Do Not Restart 比的是机制（合约门禁 vs 自由接续），MemGPT 是机制+表示的组合样本。',
      intent: '读完能对站内每篇相关论文说出它动的是哪一层，并能自己构造一个「换表示不换机制」的对照问题。',
    },
    readingActions: {
      preserve: [
        { target: '机制层与表示层的判别标准', why: '判别标准一丢，比较就退回框架名堆砌。' },
        { target: '站内论文的分层归位', why: 'Tax/Debt（表示）、Do Not Restart（机制）、MemGPT（组合样本）——归位后才知道各篇证据能回答什么问题。' },
      ],
      explain: [
        {
          target: '贯穿例子在两层上的展开',
          why: '编辑讲解：同一例子，两层各填一格。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '（编辑讲解）贯穿例子里两层的填法：机制层——A 与 B 靠什么协作？可以是「B 读 A 留在仓库的工件+摘要」，可以是「A 把结论写进长期记忆、B 接手时检索」，也可以是 Do Not Restart 的合约式接续。表示层——无论选哪种机制，具体传给 B 的是什么？自然语言摘要、原始轨迹、结构化笔记，还是类型化依赖图（Routed Graph Handoff 的方案）。两层正交：同样的「仓库工件+摘要」机制，摘要怎么写是表示问题；同样的结构化笔记，走文件传递还是协议推送是传输问题。Tax 的对照设计就是「机制固定（同脚手架、同交接流程）、只换表示（四种轨迹处理条件）」——这正是把两层分开后才能做的实验。' },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: '表示的编码方案细节', why: '本篇只立分层；具体编码（JSON schema、字段设计）等真有交接包需求时再学。' },
      ],
    },
    coverage: {
      mode: 'editorial-primer',
      basis: '站内编辑。表示层谱系来源：raw/compact/drop 三族与方向依赖（Handoff Tax §3.1/§4 已核）、四视图（Handoff Debt §5 已核）、图 vs 自然语言按任务路由（Routed Graph Handoff §2 已核）、显式 vs 隐式内容（survey-comms-fcs §4.4 框架级）；机制层谱系来源：四维（Beyond Frameworks §3.2–3.5 已核）、主/外部上下文+控制流（MemGPT §2.1–2.4 已核）、CFRC（Do Not Restart §3 已核）。分层判别为编辑整理。',
      version: '—',
      sections: ['编辑正文'],
      limitations: '编辑说明不是论文；两层划分存在交叠地带（「路由选择格式」横跨两层），分类是教学工具不是定论。',
      checkedAt: '2026-09-24',
    },
    body: {
      blocks: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '判别标准一句话。' },
            { kind: 'text', text: '贯穿例子仍是那一道：A 改到一半交给 B。问「去掉这个选择，协作还能不能发生」：能，它是表示；不能，它是机制。去掉摘要的具体写法，B 仍然能接手（换个写法而已）——表示；去掉「B 读 A 的工件」这条通道，这套协作就不成立了——机制。' },
          ],
        },
        {
          kind: 'comparison',
          columns: ['层', '回答的问题', '贯穿例子里的取值', '站内论文'],
          rows: [
            ['机制', '用什么方式协作', '仓库工件+摘要 / 记忆+检索 / 合约式接续', 'Beyond Frameworks（维度词汇）、Do Not Restart（合约门禁）、MemGPT（单 Agent 控制流样本）'],
            ['表示', '具体传什么', '摘要 / 原始轨迹 / 结构化笔记 / 依赖图', 'Handoff Tax（四条件）、Handoff Debt（四视图）、Routed Graph Handoff（图 vs NL）'],
            ['传输', '怎么把信息搬过去', '文件 / Git / 协议', '（站内不比这层；传输层实现是工程问题）'],
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '表示层的谱系。' },
            { kind: 'text', text: '已核的表示取值可以排成一条线：原始轨迹（信息最全、初始最贵、含错误路径）→ 压缩摘要（谁做压缩是个独立变量，Tax 的 Compact_pre/suf 之分）→ 结构化笔记（字段化、可校验，Debt 的第四视图）→ 类型化依赖图（结构化极致，RGH；需配图感知执行器）。线的两端各有一个警告：raw 一端，每轮重复计费且错误路径会误导后任；结构化一端，schema 设计有任务泛化问题（RGH 的 schema 在 47 条轨迹上设计）。表示选择没有免费的一端。' },
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '机制层的谱系。' },
            { kind: 'text', text: '机制侧的已核取值：自由接续（Tax/Debt 的默认：给表示，放手让后任干）；记忆+检索（MemGPT：写入/读回由 LLM 策略发起）；合约门禁（Do Not Restart：副本补全、整图准入后才实写）；路由选择（RGH：按任务在图/NL 间选格式）。机制选择的共同变量是「谁决定、何时决定、错了怎么办」——四轴里「谁决定传取什么」的谱系就在这里。' },
          ],
        },
        {
          kind: 'callout',
          tone: 'note',
          title: '为什么分层后问题才成立',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '不分层时，「共享记忆好还是交接包好」是个没法回答的问题——两样东西机制不同、表示也不同。分层后可以拆成可检验的小问：固定机制换表示（Tax 已做：方向依赖），固定表示换机制（合约门禁 vs 自由接续，站内还没有对照实验，是开放问题），或同机制同表示换接收模型（MemCollab 在记忆侧做了：朴素共享有害）。主方向的候选研究问题就是这样一条条拆出来的。' },
              ],
            },
          ],
        },
      ],
    },
    nextAction: '下一步读 Handoff Tax 卡：它固定机制、只换表示的对照设计，是「分层后才做得出的实验」的样本。',
  },
  {
    id: 'mat-read-performance-claims',
    title: '读懂性能提升：数字的分母、条件与口径',
    format: 'primer',
    lead: '这个方向的论文都爱报「提升」；同一句话换个分母、换个模型对、换本账，就可能是另一个结论。读数字前先看三样东西。',
    learner: {
      gist: '三个读数纪律：分母（百分比相对谁、绝对多少）、条件（哪对模型、哪个方向、哪个任务域、多少样本）、口径（质量/成本/事件数各自记在哪本账）。站内四组数字——Tax 的 QRec、Debt 的表2、Compression Cost 的检索次数、RGH 的 pp 提升——都按这三样各归其位。',
      value: '主方向的论文全是评价类工作，且其中三篇是预印本；不带这三条纪律读，会把设置条件里的结论读成通用结论。',
      intent: '读完能对任何一个「X 提升 Y%」的宣称，当场问出它的分母、条件与口径，并知道哪一篇站内论文是哪种口径的样本。',
    },
    readingActions: {
      preserve: [
        { target: '三条读数纪律：分母、条件、口径', why: '评价类论文的通用读法；与 mat-read-empirical 的四问互补（四问建地图，三纪律读数字）。' },
      ],
      explain: [
        {
          target: '站内四个数字样本的读法',
          why: '编辑讲解：把三纪律用到已核数字上。',
          blocks: [
            {
              kind: 'paragraph',
              spans: [
                { kind: 'text', text: '（编辑讲解）Tax 的「升配 Raw QRec≈47%/36%」：分母是强模型从头干的质量优势，条件是两对模型（Claude 对/GPT 对）分别给值——所以写作「≈47%/36%」而不是单一数字；hard 子集约 24 条，只配当探索性线索。Debt 的「602k vs 811k」：口径是累计 prompt token，分母口径是 Qwen 这一个后任模型——换成 Gemma 后任结论反向（300k vs 319k），所以论文自己也不发布格式排名。Compression Cost 的「检索增至约 3 倍」：条件限定 GPT-5.5、IRBench、完成率 80%→85%（p=1.0）——完成率这本账没动，动的是另一本。RGH 的「+12.7pp」：条件是 τ-retail 这一个基准、单编排骨架；oracle 余量 8.6pp 反而是比结果数字更诚实的信息。' },
              ],
            },
          ],
        },
      ],
      skip: [
        { target: '统计检验的深入理论', why: '起步只需会问 Holm 校正这类名词「校正了什么」；检验理论此时不需要。' },
      ],
    },
    coverage: {
      mode: 'editorial-primer',
      basis: '站内编辑。数字样本全部取自站内已核卡片：Tax §4（QRec/CSRet，2026-09-23 复核）、Debt §5.1 表2/§5.3（2026-09-23 复核）、Compression Cost §3–4（2026-09-24 审计提取）、RGH 实验节（2026-09-24 审计提取）；「76% 失败涉不对齐」为该文自称、未独立复核，本导读不采用。三纪律为编辑整理，示例不对应任何论文的完整结论。',
      version: '—',
      sections: ['编辑正文'],
      limitations: '编辑说明不是论文；三纪律是读数工具，不构成统计方法论教程。',
      checkedAt: '2026-09-24',
    },
    body: {
      blocks: [
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '一个贯穿例子。' },
            { kind: 'text', text: '还是那一道：A 改到一半交给 B。现在有人报告「我们的新交接表示让 B 的完成率提升了 X%」。这个数字该不该信、能用到哪，由下面三样东西决定。' },
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '第一样：分母。' },
            { kind: 'text', text: '「提升」永远是相对某个基线。问：基线是「B 空手接手」还是「B 看原始轨迹」？是「强模型从头干」还是「弱模型自己干到底」？Tax 的质量恢复（QRec）就 explicitly 选了后一种读法：接着弱模型轨迹干，比弱模型自己干到底好多少、距离强模型从头干有多好——两个分母各回答一个问题，混用就出错。遇到没有写明分母的百分比，先回原文找原始表，找不到就不引用。' },
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '第二样：条件。' },
            { kind: 'text', text: '哪对模型（升配与降配结论相反，Tax）、哪个任务域（数学/代码任务的结论迁到 coding 交接要论证，MemCollab）、多少样本（hard 子集约 24 条只配当线索，Tax）、什么运行环境（OpenHands 式运行时，Debt）、单轮还是重复运行（每配置单轮就没有方差估计，Debt 已登记）。条件写不全的提升句，降级为「在该设置下的观察」。' },
          ],
        },
        {
          kind: 'paragraph',
          spans: [
            { kind: 'strong', text: '第三样：口径。' },
            { kind: 'text', text: '质量、成本、事件数是三本账。完成率不变不代表免费（Compression Cost：检索调用增至约 3 倍）；操作更少不代表省 token（Debt：事件数与累计输入分列、不可互换）；初始一次性成本与运行中累计成本也不能混（Debt §5.3 初始长度是字符口径，不是 token）。读每篇论文先问「这个数字记在哪本账上」，再决定它支撑什么主张。' },
          ],
        },
        {
          kind: 'list',
          items: [
            [{ kind: 'text', text: '预印本身份再降一档：站内四篇近邻全是预印本，数字引用一律带设置条件，不当定论转述。' }],
            [{ kind: 'text', text: '「该文自称」要标注：RGH 的 76% 失败涉不对齐未经独立复核，本导读只登记、不采用。' }],
            [{ kind: 'text', text: '审计删除的不转引：RGH 原文「NL 占预算 40–60%」无具体条件，已从站内口径删除——看到来源里无条件的漂亮数字，第一反应应是查条件而非转引。' }],
          ],
        },
      ],
    },
    nextAction: '下一步重读 Handoff Tax 卡 §4 的数字段，把 QRec/CSRet 按三纪律各归其位，再对照 Compression Cost 的完成率对照实验。',
  },
];
