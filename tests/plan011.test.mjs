// tests/plan011.test.mjs —— PLAN-011 读者体验小幅优化：数据与文案契约断言（2026-09-24）。
// 覆盖：10 关键节点 guide 连贯讲解（五段齐备、非术语三句）、其余节点承接句、
// landscape 规模/来源不回退（学术边文献名映射＋auditRef 可追溯）、读者语言（内部编号/契约词退出正文）。
// DOM 探针（guide 渲染、折叠层级、主文案内部词扫描）见 render.test.mjs「PLAN-011」段。
// 不联网、不 mock；授权展示断言替代逐条见本文件与 render.test.mjs 的「PLAN-011 授权替代说明」注释。

import test from 'node:test';
import assert from 'node:assert/strict';

import { LIBRARY } from '../public/library-content.js';
import { validateLibrary } from '../public/library.js';

const GUIDE_IDS = ['land-a1', 'land-a2', 'land-a3', 'land-a4', 'land-a5', 'land-a6', 'land-b1', 'land-b2', 'land-c1', 'land-c2', 'land-c3', 'land-d1', 'land-d2', 'land-d3', 'land-e1', 'land-e2', 'land-e3', 'land-e4', 'land-e5', 'land-f1'];
const SOURCE_LEVEL_IDS = ['land-a5', 'land-a6', 'land-b1', 'land-c2', 'land-c3', 'land-d1', 'land-d2', 'land-d3', 'land-e1', 'land-e2'];
const GUIDE_PARTS = ['motivation', 'mechanism', 'example', 'confusion', 'links'];

test('PLAN-011 A1：20 个节点均带 guide，五段结构齐备、机制段非「术语三句」', () => {
  const land = LIBRARY.landscape;
  const withGuide = land.nodes.filter((n) => n.guide != null).map((n) => n.id);
  assert.deepEqual([...withGuide].sort(), [...GUIDE_IDS].sort(), '当前节点讲解覆盖全图 20 个节点');
  for (const id of GUIDE_IDS) {
    const node = land.nodes.find((n) => n.id === id);
    for (const part of GUIDE_PARTS) {
      assert.ok(typeof node.guide[part] === 'string' && node.guide[part].length >= 20, `${id}.guide.${part} 非空且有实质内容`);
    }
    // 审查修复（PLAN-011 修复轮）：guide 节点须有一句常显 sourceBrief（来源＋证据级/关键身份）。
    assert.ok(typeof node.sourceBrief === 'string' && /来源|参考/.test(node.sourceBrief), `${id} 缺 sourceBrief 常显来源`);
    if (SOURCE_LEVEL_IDS.includes(id)) {
      assert.ok(/预印本|研究报告|框架级|正文已核|摘要与元数据|正式版|无独立入选来源/.test(node.sourceBrief), `${id} sourceBrief 须含证据级或关键身份`);
    }
    // 非「术语三句」回归：机制段须真实解释过程（不少于 60 字），全段总长不设配额上限（写作参考非测试配额）。
    assert.ok(node.guide.mechanism.length >= 60, `${id} 机制段过短，疑似降回术语释义`);
    const total = GUIDE_PARTS.reduce((sum, p) => sum + node.guide[p].length, 0);
    assert.ok(total >= 200 && total <= 2000, `${id} 讲解总长异常（${total}），疑凑数或空壳`);
  }
  assert.equal(land.nodes.filter((n) => n.guide != null).length, land.nodes.length, '全部节点均有完整讲解');
});

test('PLAN-011 A1：guide 内容纪律——编辑解释只示例标注、不句句声明；数字不超两审计已核范围', () => {
  const land = LIBRARY.landscape;
  for (const id of GUIDE_IDS) {
    const text = GUIDE_PARTS.map((p) => land.nodes.find((n) => n.id === id).guide[p]).join('');
    const marks = text.split('（编辑解释）').length - 1;
    assert.ok(marks <= 2, `${id} 「（编辑解释）」标注过多（${marks}），应只在编辑串联处示例标注`);
  }
  // e2 讲解留定性、去具体数字（审查裁决：条件复杂则不列数字）；数字样本见站内 Compression Cost 卡。
  const e2 = land.nodes.find((n) => n.id === 'land-e2').guide;
  const e2Text = GUIDE_PARTS.map((p) => e2[p]).join('');
  assert.ok(e2Text.includes('完成率') && e2Text.includes('检索'), 'e2 定性讲解须保留完成率/检索对照');
  assert.ok(!/\d+%|\d\s*倍/.test(e2Text), 'e2 讲解不得出现具体百分比/倍数（条件复杂，留定性）');
});

test('PLAN-011 硬约束 2：landscape 规模不回退（20 节点/19 边/6 路径，id 集合与 010 基线一致）', () => {
  const land = LIBRARY.landscape;
  assert.equal(land.nodes.length, 20, '节点恰 20（不增删）');
  assert.equal(land.edges.length, 19, '边恰 19（不增删）');
  assert.equal(land.paths.length, 6, '路径恰 6（不增删）');
  assert.equal(land.edges.filter((e) => e.kind === 'academic').length, 13, '学术边恰 13');
  assert.equal(land.edges.filter((e) => e.kind === 'reading').length, 6, '阅读顺序边恰 6');
  const expectedNodes = ['land-a1', 'land-a2', 'land-a3', 'land-a4', 'land-a5', 'land-a6', 'land-b1', 'land-b2', 'land-c1', 'land-c2', 'land-c3', 'land-d1', 'land-d2', 'land-d3', 'land-e1', 'land-e2', 'land-e3', 'land-e4', 'land-e5', 'land-f1'];
  assert.deepEqual(land.nodes.map((n) => n.id).sort(), [...expectedNodes].sort(), '节点 id 集合不得变化');
  // 学术边来源 100% 保留（日期＋auditRef 可追溯），文献名不得为空或内部编号。
  for (const edge of land.edges.filter((e) => e.kind === 'academic')) {
    assert.ok(edge.source?.asOf === '2026-09-24', `${edge.id} 来源日期`);
    assert.ok(edge.source?.auditRef?.includes('ai-agent-landscape-source-audit'), `${edge.id} auditRef 可追溯`);
    assert.ok(!/landscape-source-audit|§/.test(edge.source.note), `${edge.id} 读者可见来源不得含内部编号/节号`);
  }
  // 节点来源日期 100% 保留。
  for (const node of land.nodes) {
    assert.ok(node.source?.note && node.source?.asOf === '2026-09-24', `${node.id} 来源保留`);
  }
  // 数据整体仍通过校验（guide 为可选新字段，不破坏既有校验）。
  const result = validateLibrary(LIBRARY);
  assert.deepEqual(result.errors, []);
});

test('PLAN-011 A2：读者语言——内部契约词/编号退出正文数据（保留在数据字段者除外）', () => {
  // 审查裁决：本扫描只扫读者可见文案字段，不扫 id/auditRef 等纯数据字段（内部编号保留在数据里）。
  const land = LIBRARY.landscape;
  const readerParts = [];
  readerParts.push(land.note);
  for (const node of land.nodes) {
    readerParts.push(node.title, node.problem, node.idea, node.example, node.capability, node.limitation, node.source?.note ?? '');
    if (node.guide) readerParts.push(...GUIDE_PARTS.map((p) => node.guide[p]));
  }
  for (const edge of land.edges) readerParts.push(edge.note, edge.source?.note ?? '');
  for (const path of land.paths) readerParts.push(path.title, path.description ?? '');
  for (const zone of LIBRARY.home.zones) readerParts.push(zone.title, zone.purpose, zone.howToUse, zone.entryLabel);
  // 主方向课题页读者字段（axisAnalysis/mechVsRep/paperLinks/undecidedCandidates）。
  const main = LIBRARY.directions.find((d) => d.id === 'cross-harness-collab');
  readerParts.push(main.axisAnalysis.note, ...main.axisAnalysis.axes.flatMap((a) => [a.title, a.explain, a.unknown ?? '', ...a.examples.map((e) => e.text)]));
  readerParts.push(main.mechVsRep.intro, main.mechVsRep.reading, ...main.mechVsRep.table.rows.flat());
  readerParts.push(...main.paperLinks.flatMap((l) => [l.note, l.source]));
  readerParts.push(...main.undecidedCandidates.flatMap((c) => [c.title, c.reason]));
  const text = readerParts.join('\n');
  for (const banned of [
    'PF-07',
    'auditRef',
    'contentVersion',
    'land-edge-',
    'land-path-',
    'land-layer-',
    'ai-agent-landscape-source-audit',
    'guidance-display-source-audit',
    '摘要+元数据级',
    '框架级已核',
    '已核）',
    'ar5iv',
    // 内部节点编号（审查裁决 1：正文/讲解/边注/路径中一律用完整自然节点名）。
    '（A1', '（A2', '（A3', '（A4', '（A5', '（A6', '（B1', '（B2', '（C1', '（C2', '（C3',
    '（D1', '（D2', '（D3', '（E1', '（E2', '（E3', '（E4', '（E5', '（F1',
    'A6/C2', 'C3/D3', 'D3/D2', 'D1/D2', '接 D1', '接 D2', '接 D3', '记 E2', '见 E2', '见 E4',
  ]) {
    assert.ok(!text.includes(banned), `读者可见文案不应包含内部词：${banned}`);
  }
  // guide 讲解中也不允许残留裸节点编号（如「依赖 A5」「E2 记账」类写法已由上行括号牌覆盖，再扫一次裸模式）。
  for (const bare of ['A5 预训练', 'B1 闭环', 'E2 记账', 'F1）', 'F1 的映射', 'F1 给出', 'F1 映射', 'E5 的代码智能体', '接回 E1', 'E2（', 'E3', '（B2 ', '（B1 ']) {
    assert.ok(!text.includes(bare), `读者可见文案不应包含裸节点编号：${bare}`);
  }
  // 最终复核补强：正则 /[A-F]\d/ 全量覆盖 guide 五段、边注与全部读者字段；
  // 扫描集不含 id/auditRef 等纯 ID 数据字段（内部编号允许保留在数据里）。
  assert.ok(!/[A-F]\d/.test(text), '读者可见文案不应残留内部节点编号（/[A-F]\\d/ 全量扫描）');
});
