// tests/plan010.test.mjs —— PLAN-010 内容展示深化：内容/数据契约断言（2026-09-24）。
// 覆盖：首批 6 卡来源与定级（auditRef/深度/预印本标注）、3 篇基础导读（贯穿例子/三问/正文）、
// 主方向课题页数据（四轴编辑框架标注/PF-07/未定候选）、三段式导读九卡、技术路线能力映射。
// 综述两张按「专题分支」存在性断言；广域脉络图（REV001）已入库，landscape 数据契约与内容审查裁决见文件尾段。
// 不联网、不 mock；DOM 探针见 render.test.mjs「PLAN-010」段。

import test from 'node:test';
import assert from 'node:assert/strict';

import { LIBRARY } from '../public/library-content.js';
import {
  deliveredDepthOf,
  getDirection,
  getMaterial,
  getPaper,
  getTechnicalRoute,
  validateLibrary,
} from '../public/library.js';

const NEW_PAPER_IDS = [
  'survey-mem-tois',
  'survey-comms-fcs',
  'compression-cost',
  'do-not-restart',
  'memcollab',
  'routed-graph-handoff',
];

test('PLAN-010 内容契约：真实库仍通过 validateLibrary（新增字段不破坏既有校验）', () => {
  const result = validateLibrary(LIBRARY);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test('PLAN-010 阶段 A：首批 6 卡逐条元数据与来源审计条目对账（auditRef/URL/定级/预印本标注）', () => {
  const expected = {
    'survey-mem-tois': { depth: 'standard', url: 'https://arxiv.org/abs/2404.13501', audit: 'survey-mem-tois' },
    'survey-comms-fcs': { depth: 'standard', url: 'https://arxiv.org/abs/2502.14321', audit: 'survey-comms-fcs' },
    'compression-cost': { depth: 'quick', url: 'https://arxiv.org/abs/2608.16370', audit: '§4.1' },
    'do-not-restart': { depth: 'quick', url: 'https://arxiv.org/abs/2609.13800', audit: '§4.2' },
    memcollab: { depth: 'quick', url: 'https://arxiv.org/abs/2603.23234', audit: '§4.3' },
    'routed-graph-handoff': { depth: 'quick', url: 'https://arxiv.org/abs/2608.25277', audit: '§4.4' },
  };
  for (const [id, want] of Object.entries(expected)) {
    const paper = getPaper(LIBRARY, id);
    assert.ok(paper, `${id} 必须入库`);
    assert.equal(deliveredDepthOf(paper), want.depth, `${id} 定级`);
    assert.equal(paper.url, want.url, `${id} url`);
    assert.ok(typeof paper.auditRef === 'string' && paper.auditRef.includes(want.audit), `${id} auditRef 须登记来源审计条目`);
    assert.ok(paper.coverage.checkedAt === '2026-09-24', `${id} 核查时间`);
    assert.ok(paper.coverage.basis.includes('guidance-display-source-audit.md'), `${id} 来源须指向审计文档`);
  }
  // 近邻 4 篇统一预印本强度标注；目录级 Memory Age 不入首批。
  for (const id of ['compression-cost', 'do-not-restart', 'memcollab', 'routed-graph-handoff']) {
    const paper = getPaper(LIBRARY, id);
    assert.ok(/预印本/.test(paper.coverage.version) && /预印本/.test(paper.coverage.limitations), `${id} 预印本身份双标注`);
    assert.ok(!getPaper(LIBRARY, 'survey-mem-age'), '目录级 Memory Age 不得入库');
  }
  // 两篇综述是 standard 且为导学树树根（专题分支，不等于总览）。
  for (const id of ['survey-mem-tois', 'survey-comms-fcs']) {
    const paper = getPaper(LIBRARY, id);
    assert.ok(Array.isArray(paper.sections) && paper.sections.length >= 2, `${id} 正文选读章节`);
    assert.ok(paper.surveyTree && Array.isArray(paper.surveyTree.roots) && paper.surveyTree.roots.length >= 2, `${id} 导学树树根`);
  }
});

test('PLAN-010 审计口径纪律：Tax 子轴/无条件百分比/时点限定三处修订已落入卡面', () => {
  const tax = getPaper(LIBRARY, 'handoff-tax');
  const taxText = JSON.stringify(tax);
  assert.ok(taxText.includes('谁做压缩') || taxText.includes('谁来做压缩'), 'Tax 卡须按修订口径写「谁做压缩」');
  assert.ok(!taxText.includes('接收方主动获取的两端') || taxText.includes('不存在'), '不得把 Compact_pre/suf 写成主动获取两端');
  const rgh = getPaper(LIBRARY, 'routed-graph-handoff');
  const rghText = JSON.stringify(rgh);
  assert.ok(!rghText.includes('40–60%'), 'RGH 的 40–60% 无条件占比不得出现在任何字段');
  assert.ok(rghText.includes('未经独立复核'), 'RGH 的 76% 须带「未经独立复核」标注');
  const tois = getPaper(LIBRARY, 'survey-mem-tois');
  const toisText = JSON.stringify(tois);
  assert.ok(toisText.includes('写作时点') && toisText.includes('2024-04'), '记忆基准缺口须带写作时点限定');
  assert.ok(toisText.includes('LoCoMo'), '时点限定时须注明 2026 年已有基准');
});

test('PLAN-010 阶段 A：3 篇新基础导读——贯穿例子、三问、正文与 Explain 实际讲解齐备', () => {
  const ids = ['mat-handoff-basics', 'mat-mech-vs-representation', 'mat-read-performance-claims'];
  for (const id of ids) {
    const material = getMaterial(LIBRARY, id);
    assert.ok(material, `${id} 必须入库`);
    assert.equal(material.format, 'primer');
    assert.equal(material.coverage.mode, 'editorial-primer');
    for (const field of ['gist', 'value', 'intent']) {
      assert.ok(material.learner?.[field]?.length > 10, `${id} learner.${field}`);
    }
    const bodyText = JSON.stringify(material.body.blocks);
    assert.ok(bodyText.length > 400, `${id} 正文字数`);
    assert.ok(bodyText.includes('改到一半'), `${id} 须使用统一贯穿例子`);
    // PF-11：Explain 必须有实际讲解（非空 blocks）。
    const explains = material.readingActions?.explain ?? [];
    assert.ok(explains.length >= 1 && explains.every((e) => Array.isArray(e.blocks) && e.blocks.length > 0), `${id} Explain 非空`);
    assert.ok(material.nextAction?.length > 10, `${id} nextAction`);
  }
});

test('PLAN-010 阶段 C：主方向课题页数据——四轴编辑框架标注、实例可解析、未定候选诚实标注', () => {
  const direction = getDirection(LIBRARY, 'cross-harness-collab');
  const axis = direction.axisAnalysis;
  assert.ok(axis && Array.isArray(axis.axes) && axis.axes.length === 4, '恰四轴');
  assert.ok(axis.note.includes('编辑分析框架') && axis.note.includes('不是'), '四轴须标注为用户编辑框架、非综述公认分类');
  assert.deepEqual(
    axis.axes.map((a) => a.title),
    ['状态保存在哪里', '谁决定传/取什么', '保存什么语义', '如何获取及计费'],
  );
  for (const item of axis.axes) {
    assert.ok(item.explain.length > 10, `${item.id} 说明`);
    assert.ok(Array.isArray(item.examples) && item.examples.length >= 2, `${item.id} 至少两个已核实例`);
    for (const example of item.examples) {
      assert.ok(getPaper(LIBRARY, example.ref) || getMaterial(LIBRARY, example.ref), `${item.id} 实例引用不可解析：${example.ref}`);
    }
    assert.ok(item.unknown && item.unknown.length > 5, `${item.id} 须有未定侧说明`);
  }
  // 机制与表示对照表。
  assert.ok(direction.mechVsRep?.table?.rows?.length >= 3, '机制/表示/传输三行对照');
  // 问题演化：节点日期格式与论文可解析。
  const evo = direction.problemEvolution;
  assert.ok(Array.isArray(evo.nodes) && evo.nodes.length >= 8, '演化节点数');
  for (const node of evo.nodes) {
    assert.match(node.when, /^\d{4}-\d{2}$/, '演化节点月份格式');
    assert.ok(getPaper(LIBRARY, node.paperId), `演化节点论文不可解析：${node.paperId}`);
  }
  // 论文联系：每条都有 PF-07 来源声明。
  assert.ok(Array.isArray(direction.paperLinks) && direction.paperLinks.length >= 5, '论文联系条数');
  for (const link of direction.paperLinks) {
    assert.ok(getPaper(LIBRARY, link.from) && getPaper(LIBRARY, link.to), '联系两端须站内可解析');
    assert.ok(/PF-07|非(论文)?引用/.test(link.source ?? ''), '联系须逐条声明编辑关联、非引用');
  }
  // 未定候选：全部标未入库，含目录级 Memory Age 与 Grounding 消歧。
  const cand = direction.undecidedCandidates;
  assert.ok(Array.isArray(cand) && cand.length >= 3, '未定候选条数');
  assert.ok(cand.every((c) => /未入库|未入选/.test(c.status ?? '')), '未定候选不得冒充已入库');
  const candText = JSON.stringify(cand);
  assert.ok(candText.includes('2512.13564'), 'Memory Age 须登记为未入库候选');
  assert.ok(candText.includes('Grounding'), 'Grounding 同名消歧须登记');
});

test('PLAN-010 阶段 D：首批 9 卡三段式导读齐备（背景术语/读前问题/精读定位/实际讲解）', () => {
  const ids = [
    'beyond-frameworks', 'memgpt', 'handoff-tax', 'handoff-debt',
    'survey-mem-tois', 'survey-comms-fcs',
    'compression-cost', 'do-not-restart', 'memcollab',
  ];
  for (const id of ids) {
    const paper = getPaper(LIBRARY, id);
    const guided = paper.guidedReading;
    assert.ok(guided, `${id} 缺三段式导读`);
    assert.ok(Array.isArray(guided.terms) && guided.terms.length >= 3, `${id} 背景术语 ≥3`);
    assert.ok(guided.terms.every((t) => t.term && t.note), `${id} 术语须带解释`);
    assert.ok(Array.isArray(guided.preQuestions) && guided.preQuestions.length >= 2, `${id} 读前问题 ≥2`);
    assert.ok(Array.isArray(guided.locate) && guided.locate.length >= 1, `${id} 精读定位`);
    assert.ok(guided.locate.every((l) => l.target && l.where && l.note), `${id} 定位须带依据说明`);
    assert.ok(Array.isArray(guided.explainBlocks) && guided.explainBlocks.length > 0, `${id} 实际讲解非空`);
  }
  // 讲解不得是摘要复述：每卡讲解正文须达到基本长度。
  for (const id of ids) {
    const text = JSON.stringify(getPaper(LIBRARY, id).guidedReading.explainBlocks);
    assert.ok(text.length >= 120, `${id} 讲解过短，疑似空壳`);
  }
});

test('PLAN-010 阶段 C（专题分支）：综述导学树每个节点必有章节来源标注，站内回链全部可解析', () => {
  for (const id of ['survey-mem-tois', 'survey-comms-fcs']) {
    const tree = getPaper(LIBRARY, id).surveyTree;
    assert.ok(tree.source.length > 5, `${id} 树骨架来源`);
    const walk = (nodes, path) => {
      for (const node of nodes) {
        const at = `${id}/${path}${node.id}`;
        assert.ok(typeof node.source === 'string' && node.source.length >= 2, `${at} 缺章节来源标注`);
        assert.ok(typeof node.explain === 'string' && node.explain.length > 10, `${at} 缺解释`);
        for (const ref of node.refs ?? []) {
          assert.ok(getPaper(LIBRARY, ref) || getMaterial(LIBRARY, ref), `${at} 回链不可解析：${ref}`);
        }
        walk(node.children ?? [], `${path}${node.id}/`);
      }
    };
    walk(tree.roots, '');
  }
});

test('PLAN-010 阶段 E：三条 featured 技术路线各补「与当前研究能力的关系」（非框架目录语）', () => {
  for (const id of ['tech-multiagent', 'tech-rag', 'tech-graph-simple']) {
    const route = getTechnicalRoute(LIBRARY, id);
    assert.ok(typeof route.researchLink === 'string' && route.researchLink.length > 60, `${id} 能力映射`);
    assert.ok(/主方向|研究/.test(route.researchLink), `${id} 能力映射须落到研究能力`);
  }
});

// ---------- PLAN REV001：LIBRARY.landscape 数据契约与内容审查 5 项裁决 ----------

test('REV001：landscape 规模与结构（20 节点三层 / 首层 6–8 / 6 路径 / 字段齐备）且通过 validateLibrary', () => {
  const land = LIBRARY.landscape;
  assert.ok(land && Array.isArray(land.nodes) && land.nodes.length === 20, '节点恰 20（REV001）');
  assert.deepEqual(land.layers.map((l) => l.title), ['AI 背景', 'Agent 全景', '专题分支']);
  const bgCount = land.nodes.filter((n) => n.layer === land.layers[0].id).length;
  assert.ok(bgCount >= 6 && bgCount <= 8, `AI 背景层须 6–8，当前 ${bgCount}`);
  assert.equal(land.paths.length, 6, '学习路径恰 6 条');
  const ids = new Set(land.nodes.map((n) => n.id));
  assert.equal(ids.size, 20, '节点 id 唯一');
  for (const node of land.nodes) {
    for (const field of ['title', 'when', 'problem', 'idea', 'example', 'capability', 'limitation']) {
      assert.ok(typeof node[field] === 'string' && node[field].length >= 4, `${node.id} 缺 ${field}`);
    }
    assert.ok(node.source?.note && node.source?.asOf === '2026-09-24', `${node.id} 来源可核查`);
  }
  for (const path of land.paths) {
    assert.ok(path.nodeIds.length >= 1 && path.nodeIds.every((ref) => ids.has(ref)), `${path.id} 路径节点可解析`);
  }
  const result = validateLibrary(LIBRARY);
  assert.deepEqual(result.errors, []);
});

test('REV001 边口径：academic 边全部附审计来源；reading 边只给编辑理由、零伪来源', () => {
  // PLAN-011 授权替代说明（设计复审 GO、主会话裁决③）：academic 边来源展示由「审计文档节号」改为
  // 「文献名映射」——source.note 为读者可见文献名、不得含内部审计文档编号；可追溯性不降级，移入
  // source.auditRef 数据字段（100% 覆盖、日期不变），渲染层不再显示内部编号。
  const land = LIBRARY.landscape;
  const academic = land.edges.filter((e) => e.kind === 'academic');
  const reading = land.edges.filter((e) => e.kind === 'reading');
  assert.ok(academic.length >= 10 && reading.length >= 4, '两类边都在场');
  for (const edge of academic) {
    assert.ok(typeof edge.source?.note === 'string' && edge.source.note.length > 5, `${edge.id} academic 边须附来源`);
    assert.ok(!edge.source.note.includes('ai-agent-landscape-source-audit'), `${edge.id} 正文来源不得含内部审计编号（PLAN-011）`);
    assert.ok(edge.source?.auditRef?.includes('ai-agent-landscape-source-audit'), `${edge.id} 可追溯性须在 auditRef 数据字段（100% 不降级）`);
    assert.ok(edge.source?.asOf === '2026-09-24', `${edge.id} 来源日期`);
  }
  for (const edge of reading) {
    assert.ok(typeof edge.note === 'string' && edge.note.length > 5, `${edge.id} reading 边须给编辑理由`);
    assert.equal(edge.source, undefined, `${edge.id} reading 边不得附来源（无伪来源）`);
  }
  // 端点可解析且不成环自指。
  const ids = new Set(land.nodes.map((n) => n.id));
  for (const edge of land.edges) {
    assert.ok(ids.has(edge.from) && ids.has(edge.to), `${edge.id} 端点可解析`);
    assert.notEqual(edge.from, edge.to, `${edge.id} 不得自指`);
  }
});

test('REV001 内容审查 5 项裁决落卡：Findings 不标 CCF / 催生→推动因素 / 唯一→主要 / 涌现标争议 / 教程级不冒充 / 深度 RL 范围提示', () => {
  const land = LIBRARY.landscape;
  const byId = Object.fromEntries(land.nodes.map((n) => [n.id, n]));
  // ① Findings of ACL 不得标 CCF、不得继承主会等级。
  const c2 = JSON.stringify(byId['land-c2']);
  assert.ok(c2.includes('Findings of ACL'), 'C2 身份须写明 Findings');
  assert.ok(!/CCF-A/.test(c2), 'Findings of ACL 不得标 CCF-A');
  // ② A2「直接催生」改为「推动因素之一」。
  assert.ok(JSON.stringify(byId['land-a2']).includes('因素之一'), 'A2 须为「推动因素之一」');
  assert.ok(!JSON.stringify(byId['land-a2']).includes('直接催生'), '不得残留「直接催生」');
  // ③ A4「唯一现实底座」改为「主要底座」。
  assert.ok(JSON.stringify(byId['land-a4']).includes('主要底座'), 'A4 须为「主要底座」');
  assert.ok(!JSON.stringify(byId['land-a4']).includes('唯一现实底座'), '不得残留「唯一现实底座」');
  // ④ A5 涌现标注为报告观点且有争议。
  const a5 = JSON.stringify(byId['land-a5']);
  assert.ok(a5.includes('报告观点') && a5.includes('争议'), '涌现须标注报告观点/有争议');
  // ⑤ A2 实际读取级说明（PLAN-011 授权替代：「摘要+元数据级」内部术语改为读者可懂的一句证据说明）。
  const a2Source = JSON.stringify(byId['land-a2'].source);
  assert.ok(a2Source.includes('只核到摘要与元数据'), 'A2 来源须写明实际读取范围（读者语言）');
  assert.ok(a2Source.includes('CACM 2012'), 'A2 备选来源仍登记');
  // 范围提示（实页审查收窄后口径）：深度 RL 广泛用于序列决策/控制，与 RLHF 不互斥；两者均未系统覆盖。
  assert.ok(
    land.note.includes('深度强化学习') && land.note.includes('序列决策与控制')
      && land.note.includes('不是互斥') && land.note.includes('未系统覆盖')
      && land.note.includes('RLHF 只是使用人类反馈的一类对齐方法'),
    '范围提示须在图声明中（RL 定义/不互斥/未覆盖）',
  );
  assert.ok(!land.note.includes('推理模型的专门化训练'), '不得再把深度 RL 定义为推理模型专门化训练');
  // 非线性发展：保留并行分支（至少两条并行/分支语义边与声明）。
  const landText = JSON.stringify(land);
  assert.ok(landText.includes('并行分支'), '须声明并行分支（非单线进化）');
  assert.ok(land.edges.some((e) => e.note.includes('并行')), '须有并行分支边');
});

test('REV001 证据边界：venue 作者自注不升级、预印本身份、CCF 只标有证据者', () => {
  const land = LIBRARY.landscape;
  const byId = Object.fromEntries(land.nodes.map((n) => [n.id, n]));
  const c1 = JSON.stringify(byId['land-c1']);
  assert.ok(c1.includes('作者自注'), 'NSR 接收须标作者自注、不升级为正式核验');
  const d2 = JSON.stringify(byId['land-d2']);
  assert.ok(d2.includes('预印本'), 'RAG 综述预印本身份须标注');
  // CCF 只标有 ccf.org.cn 证据者（NeurIPS bg-instructgpt、TOIS land-d3）；CSUR 两处未核到不标。
  const allText = JSON.stringify(land.nodes.map((n) => n.source.note));
  assert.ok(allText.includes('NeurIPS 2022 正式版，CCF 目录核 A 类会议'), 'NeurIPS 等级须有证据');
  assert.ok(!allText.includes('Computing Surveys 2024 正式版，CCF'), 'CSUR 不得冒标 CCF');
  // 记忆基准缺口时点限定在 D3 保留。
  assert.ok(JSON.stringify(byId['land-d3']).includes('时点'), 'D3 须保留时点限定');
});

test('REV001 审查修复（边/全量扫描）：无「唯一现实底座/直接催生」残留，a4-a5 边为「主要底座＋并行」', () => {
  const landText = JSON.stringify(LIBRARY.landscape);
  for (const stale of ['唯一现实底座', '直接催生']) {
    assert.ok(!landText.includes(stale), `landscape 全量扫描不得残留：${stale}`);
  }
  const edge = LIBRARY.landscape.edges.find((e) => e.id === 'land-edge-a4-a5');
  assert.ok(edge.note.includes('主要底座'), 'a4-a5 边须写「主要底座」');
  assert.ok(edge.note.includes('并行'), 'a4-a5 边须保留并行口径');
  // 逐边扫描：任何边注记都不得含已废止措辞。
  for (const e of LIBRARY.landscape.edges) {
    for (const stale of ['唯一现实底座', '直接催生']) {
      assert.ok(!e.note.includes(stale), `${e.id} 残留废止措辞：${stale}`);
    }
  }
  // 逐节点扫描：问题/思想/能力/局限/来源五字段同口径。
  for (const n of LIBRARY.landscape.nodes) {
    const nodeText = JSON.stringify([n.problem, n.idea, n.capability, n.limitation, n.source?.note]);
    for (const stale of ['唯一现实底座', '直接催生']) {
      assert.ok(!nodeText.includes(stale), `${n.id} 残留废止措辞：${stale}`);
    }
  }
});

test('REV001 实页审查收窄（2026-09-24 二轮）：a6-d1 降为编辑关联、E5 验证信号收窄、无过强表述残留', () => {
  const land = LIBRARY.landscape;
  // ① a6-d1：原「方法依赖：可靠性总前提来自对齐」过强，降为 reading 编辑关联（有理由、无来源）。
  const edge = land.edges.find((e) => e.id === 'land-edge-a6-d1');
  assert.equal(edge.kind, 'reading', 'a6-d1 必须为编辑关联（reading）');
  assert.equal(edge.source, undefined, 'a6-d1 不得附来源');
  assert.ok(edge.note.includes('接口约束') && edge.note.includes('帮助'), 'a6-d1 理由须含接口约束/校验/反馈口径');
  assert.ok(edge.note.includes('而非充分必要前提') || edge.note.includes('非充分必要'), 'a6-d1 须声明对齐非充分必要前提');
  // 全部 academic 边扫描：不得再出现「总前提」类过强表述。
  for (const e of land.edges.filter((x) => x.kind === 'academic')) {
    assert.ok(!e.note.includes('总前提'), `${e.id} academic 边残留过强表述「总前提」`);
  }
  // ② E5：验证信号收窄为「相对可操作但成本与覆盖有限；通过不保证正确」。
  const e5 = land.nodes.find((n) => n.id === 'land-e5');
  assert.ok(e5.problem.includes('相对可操作'), 'E5 问题须写「相对可操作」');
  assert.ok(e5.problem.includes('成本与覆盖有限'), 'E5 问题须写成本与覆盖有限');
  assert.ok(e5.limitation.includes('通过不保证修复正确'), 'E5 局限须写「通过不保证修复正确」');
  assert.ok(!JSON.stringify(e5).includes('便宜而可靠'), 'E5 不得残留「便宜而可靠」');
  // ③ 全图扫描：过强/已废止措辞零残留。
  const landText = JSON.stringify(land);
  for (const stale of ['便宜而可靠', '总前提来自对齐', '推理模型的专门化训练', '唯一现实底座', '直接催生']) {
    assert.ok(!landText.includes(stale), `landscape 全量扫描不得残留：${stale}`);
  }
});
