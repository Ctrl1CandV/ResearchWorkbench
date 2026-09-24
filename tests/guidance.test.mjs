// tests/guidance.test.mjs —— DYNAMIC-GUIDANCE-009 / C 包：提案闭环纯逻辑回归。
// 覆盖 R8-C 全部拒绝类与正向类：schema/白名单/上限/独立性/目标解析/tombstones/总额、
// stale-base 仅预览冲突、确认重校验与竞态、原子写入（成功或旧状态不变）、撤销＝完整快照
// 前向写入、import 三路比较与显式替换、reset 清 tombstones/undoSlot、损坏/不可用、
// example 持久字段、v3 键逐字节不变、canonicalSerialize 唯一序列化。
// 只读真实 LIBRARY 与 storage 桩，不触网、不开 DOM、不读写 private/。

import test from 'node:test';
import assert from 'node:assert/strict';

import { LIBRARY } from '../public/library-content.js';
import * as G from '../public/guidance.js';

const V3_KEY = 'research-wo' + 'rkbench:v3';
const V3_FIXTURE = JSON.stringify({
  version: 3,
  papers: { memgpt: { status: 'done', question: '我的问题', note: '我的笔记', updatedAt: '2026-09-20T00:00:00.000Z' } },
  readingList: [{ id: 'r1', title: '偶遇论文', url: '', note: '', addedAt: '2026-09-21T00:00:00.000Z' }],
});

function makeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  const calls = [];
  return {
    data,
    calls,
    getItem(key) {
      calls.push(['getItem', key]);
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      calls.push(['setItem', key]);
      if (key === 'boom-key') throw new Error('quota');
      data.set(key, String(value));
    },
    removeItem(key) {
      calls.push(['removeItem', key]);
      data.delete(key);
    },
  };
}

const navLocks = { locks: { request: (name, fn) => Promise.resolve().then(fn) } };
const navNoLocks = {};
function navBrokenLocks() {
  return { locks: { request: () => Promise.reject(new Error('lock denied')) } };
}

// 固定未来时间（确定性）：appliedAt 由 now() 决定，测试传入固定值。
const FIXED_NOW = () => new Date('2026-09-23T08:00:00Z').getTime();

function proposal(changes, extra = {}) {
  return JSON.stringify({
    kind: 'rw.guidance-proposal',
    schemaVersion: 1,
    id: extra.id ?? 'prop-2026-09-23-01',
    createdAt: extra.createdAt ?? '2026-09-23',
    example: extra.example ?? false,
    origin: {
      sourceType: 'ai',
      label: '测试来源',
      asOf: '2026-09-22',
      evidenceNote: '仅测试用的证据边界说明。',
      ...(extra.origin ?? {}),
    },
    changes,
  });
}

const eb = (base, overlay, target) => G.canonicalBaseline(base, overlay, target);
function setChange(type, id, field, value, base = LIBRARY, overlay = null, extra = {}) {
  const target = { type, id, field };
  return { op: 'set', target, expectedBase: eb(base, overlay, target), value, reason: '测试理由', ...extra };
}

// ---------- canonicalSerialize（R3 唯一序列化） ----------

test('canonical：字符串换行统一为 \\n、不 trim；数组以分隔符连接；对象按白名单声明序、未设字段不输出', () => {
  assert.equal(G.canonicalString('a\r\nb\rc\n'), 'a\nb\nc\n');
  const target = { type: 'route-step', id: 'step-collab-3', field: 'readWhen' };
  const raw = LIBRARY.directions[0].startRoute.find((s) => s.id === 'step-collab-3').readWhen;
  assert.equal(eb(LIBRARY, null, target), raw.replace(/\r\n?/g, '\n'));
  // 数组：questions append 的基线＝当前数组逐元素以 \u001F 连接。
  const paper = LIBRARY.papers.find((p) => p.id === 'beyond-frameworks');
  const qTarget = { type: 'paper', id: 'beyond-frameworks', field: 'questions' };
  assert.equal(eb(LIBRARY, null, qTarget), paper.questions.join(String.fromCharCode(0x1f)));
  // 对象（remove 对照）：白名单声明序 key=value、\u001E 连接、未设跳过。
  const step = LIBRARY.directions[0].startRoute.find((s) => s.id === 'step-collab-1');
  const obj = eb(LIBRARY, null, { type: 'route-step', id: 'step-collab-1', field: '' });
  assert.ok(obj.includes('kind=article'));
  assert.ok(obj.includes(`purpose=${step.purpose}`));
  assert.ok(obj.indexOf('kind=') < obj.indexOf('purpose='));
  assert.ok(!obj.includes('anchor='));
  // 未设字段不输出：选读步骤无 check 之外的空值处理。
  assert.ok(!obj.includes('undefined'));
});
// ---------- ①–② 结构拒绝类（每种拒绝都要命中；拒绝＝「尚未形成可应用调整」，不出预览） ----------

const OK = (value = '用于测试的新目的。') => setChange('route-step', 'step-collab-3', 'purpose', value);
const BOM = String.fromCharCode(0xfeff);

test('①：空文本/截断/多对象/BOM 全部拒绝，首个错误定位明确', () => {
  for (const [label, text] of [
    ['empty', ''],
    ['whitespace', '   \n  '],
    ['truncated', '{"kind":"rw.guidance-proposal","changes":[{'],
    ['multi-object', proposal([OK()]) + ' {}'],
    ['bom', BOM + proposal([OK()])],
  ]) {
    const r = G.validateProposal(text, LIBRARY, null);
    assert.equal(r.status, 'reject', label);
    assert.match(r.message, /尚未形成可应用调整/);
    assert.ok(r.firstError, label);
    assert.ok(!('items' in r) || !r.items?.length, `${label} 拒绝不得产出预览条目`);
  }
});

test('②：顶层/条目/origin 未知字段、非白名单 target/field/op、home-focus stepId 全部整案拒绝', () => {
  const cases = [
    ['顶层未知字段', JSON.stringify({ ...JSON.parse(proposal([OK()])), extra: 1 })],
    ['kind 非固定字面量', proposal([OK()]).replace('rw.guidance-proposal', 'rw.hack')],
    ['schemaVersion=2', proposal([OK()]).replace('"schemaVersion":1', '"schemaVersion":2')],
    ['bad id', proposal([OK()], { id: 'proposal-1!' })],
    ['example:true 但 id 无 example 段', proposal([OK()], { id: 'prop-2026-09-23-77', example: true })],
    ['假日历日期', proposal([OK()], { createdAt: '2026-02-30' })],
    ['changes 超上限', proposal(Array.from({ length: 11 }, (_, i) => setChange('route-step', 'step-collab-3', 'purpose', `用于测试的目的${i}。`)))],
    ['changes 空', proposal([])],
    ['条目未知键', proposal([OK()]).replace('"op":"set"', '"op":"set","hack":1')],
    ['origin 未知键', proposal([OK()], { origin: { badge: 'x' } })],
    ['origin.sourceType=content 不允许', proposal([OK()], { origin: { sourceType: 'content' } })],
    ['非白名单字段 title', proposal([{ op: 'set', target: { type: 'paper', id: 'memgpt', field: 'title' }, expectedBase: '', value: '改写标题', reason: 'r' }])],
    ['coverage 越界', proposal([{ op: 'set', target: { type: 'paper', id: 'memgpt', field: 'coverage.basis' }, expectedBase: '', value: '改写依据', reason: 'r' }])],
    ['direction.status 越界', proposal([{ op: 'set', target: { type: 'direction', id: 'cross-harness-collab', field: 'status' }, expectedBase: '', value: 'active', reason: 'r' }])],
    ['archiveRoute 指针', proposal([{ op: 'set', target: { type: 'route-step', id: 'step-collab-1', field: 'archiveRoute' }, expectedBase: '', value: 'x', reason: 'r' }])],
    ['readingActions.explain 越界', proposal([{ op: 'set', target: { type: 'paper', id: 'memgpt', field: 'readingActions.explain' }, expectedBase: '', value: '编造讲解', reason: 'r' }])],
    ['url 字段越界', proposal([{ op: 'set', target: { type: 'paper', id: 'memgpt', field: 'url' }, expectedBase: '', value: 'example.org', reason: 'r' }])],
    ['home-focus 写 stepId', proposal([{ op: 'set', target: { type: 'home-focus', id: 'home', field: 'stepId' }, expectedBase: '', value: 'step-collab-2', reason: 'r' }])],
    ['__proto__ 计算键', proposal([{ op: 'set', target: { type: 'paper', id: 'memgpt', field: '__proto__' }, expectedBase: '', value: 'x', reason: 'r' }])],
    ['constructor 字段', proposal([{ op: 'set', target: { type: 'paper', id: 'memgpt', field: 'constructor' }, expectedBase: '', value: 'x', reason: 'r' }])],
    ['type 未知', proposal([{ op: 'set', target: { type: 'brief', id: 'b1', field: 'scope' }, expectedBase: '', value: 'x', reason: 'r' }])],
    ['op 未知', proposal([{ op: 'replace', target: { type: 'route-step', id: 'step-collab-3', field: 'purpose' }, expectedBase: '', value: 'x', reason: 'r' }])],
    ['map-node 改 source 越界', proposal([{ op: 'set', target: { type: 'map-node', id: 'map-prog-budget', field: 'source' }, expectedBase: '', value: { originType: 'ai', note: 'x', asOf: '2026-09-23' }, reason: 'r' }])],
    ['map-edge 改端点越界', proposal([{ op: 'set', target: { type: 'map-edge', id: LIBRARY.map.edges[0].id, field: 'from' }, expectedBase: '', value: 'map-meth-paging', reason: 'r' }])],
    ['direction 禁改 summary', proposal([{ op: 'set', target: { type: 'direction', id: 'cross-harness-collab', field: 'summary' }, expectedBase: '', value: '改写方向', reason: 'r' }])],
  ];
  for (const [label, text] of cases) {
    const r = G.validateProposal(text, LIBRARY, null);
    assert.equal(r.status, 'reject', label);
    assert.match(r.message, /尚未形成可应用调整/, label);
  }
});

test('②：值/文案上限与内容边界（URL/HTML/脚本/控制字符）、reason/expectedBase/value 结构规则', () => {
  const cases = [
    ['超长 value', proposal([{ op: 'set', target: { type: 'route-step', id: 'step-collab-3', field: 'purpose' }, expectedBase: '', value: '字'.repeat(501), reason: 'r' }])],
    ['expectedBase 超 600', proposal([{ op: 'set', target: { type: 'route-step', id: 'step-collab-3', field: 'purpose' }, expectedBase: 'x'.repeat(601), value: '新目的。', reason: 'r' }])],
    ['value 含外链', proposal([setChange('route-step', 'step-collab-3', 'purpose', '先读 https://evil.example/x。')])],
    ['value 含 HTML', proposal([setChange('route-step', 'step-collab-3', 'purpose', '<b>加粗</b>目的')])],
    ['value 含脚本词', proposal([setChange('route-step', 'step-collab-3', 'purpose', 'javascript:alert(1)')])],
    ['value 含控制字符', proposal([setChange('route-step', 'step-collab-3', 'purpose', `正常${String.fromCharCode(0)}文字`)])],
    ['openQuestions 追加超 200', proposal([{ op: 'append', target: { type: 'direction', id: 'cross-harness-collab', field: 'openQuestions' }, expectedBase: eb(LIBRARY, null, { type: 'direction', id: 'cross-harness-collab', field: 'openQuestions' }), value: '问'.repeat(201), reason: 'r' }])],
    ['questions 一次 append 多条', proposal([{ op: 'append', target: { type: 'paper', id: 'memgpt', field: 'questions' }, expectedBase: eb(LIBRARY, null, { type: 'paper', id: 'memgpt', field: 'questions' }), value: ['两条？', '不行'], reason: 'r' }])],
    ['reason 缺失', proposal([OK()]).replace('"reason":"测试理由"', '')],
    ['set 缺 expectedBase', proposal([{ op: 'set', target: { type: 'route-step', id: 'step-collab-3', field: 'purpose' }, value: '新目的。', reason: 'r' }])],
    ['insert 携带 expectedBase', proposal([{ op: 'insert', target: { type: 'map-node', id: 'map-prog-a' }, expectedBase: '', value: { side: 'problem', label: '甲', summary: '乙', refs: ['cross-harness-collab'], source: { originType: 'self', note: '测试', asOf: '2026-09-23' } }, reason: 'r' }])],
    ['remove 带 value', proposal([{ op: 'remove', target: { type: 'route-step', id: 'step-ov-x' }, expectedBase: '', value: '多余', reason: 'r' }])],
    ['stage 非枚举', proposal([setChange('route-step', 'step-collab-3', 'stage', '随便写的阶段')])],
    ['passMode 非枚举', proposal([setChange('route-step', 'step-collab-3', 'passMode', 'deepish')])],
    ['required 非枚举', proposal([setChange('route-step', 'step-collab-3', 'required', '必背')])],
    ['label 混入整句', proposal([setChange('map-node', 'map-prog-budget', 'label', '这是一句整句概述，它不是标签。')])],
    ['目标 id 含冒号', proposal([{ op: 'set', target: { type: 'route-step', id: 'a:b', field: 'purpose' }, expectedBase: '', value: 'x', reason: 'r' }])],
  ];
  for (const [label, text] of cases) {
    const r = G.validateProposal(text, LIBRARY, null);
    assert.equal(r.status, 'reject', label);
  }
});
// ---------- 提案内独立性与 ③ 目标可解析（整案拒绝类） ----------

test('独立性：重复 targetRef、anchor/端点引用本提案另一条目产物 ⇒ 整案拒绝（复核阻断 1）', () => {
  const t1 = setChange('route-step', 'step-collab-3', 'purpose', '目的甲。');
  const t2 = setChange('route-step', 'step-collab-3', 'purpose', '目的乙。');
  assert.equal(G.validateProposal(proposal([t1, t2]), LIBRARY, null).status, 'reject', '重复 targetRef');
  const anchorToOwnInsert = {
    op: 'insert', target: { type: 'route-step', id: 'step-ov-b' },
    value: { kind: 'paper', paperId: 'memgpt', purpose: '目的。', readWhen: '时机。', anchor: { routeId: 'cross-harness-collab', afterStepId: 'step-ov-a' } },
    reason: 'r',
  };
  const insertA = {
    op: 'insert', target: { type: 'route-step', id: 'step-ov-a' },
    value: { kind: 'paper', paperId: 'memgpt', purpose: '目的。', readWhen: '时机。', anchor: { routeId: 'cross-harness-collab', afterStepId: 'step-collab-2' } },
    reason: 'r',
  };
  assert.equal(G.validateProposal(proposal([insertA, anchorToOwnInsert]), LIBRARY, null).status, 'reject', 'anchor 引用本提案将新建的步骤');
  const removeA = { op: 'remove', target: { type: 'route-step', id: 'step-ov-a' }, expectedBase: '', reason: 'r' };
  assert.equal(G.validateProposal(proposal([insertA, removeA]), LIBRARY, null).status, 'reject', 'insert 与 remove 同 id 也算依赖');
  const edgeToOwnNode = {
    op: 'insert', target: { type: 'map-edge', id: 'map-edge-own' },
    value: { from: 'map-meth-paging', to: 'map-prog-new', meaning: 'addresses：测试', evidence: ['memgpt'], source: { originType: 'content', note: '测试，非引用', asOf: '2026-09-23' } },
    reason: 'r',
  };
  const newNode = {
    op: 'insert', target: { type: 'map-node', id: 'map-prog-new' },
    value: { side: 'problem', label: '新问', summary: '测', refs: ['cross-harness-collab'], source: { originType: 'self', note: '测试', asOf: '2026-09-23' } },
    reason: 'r',
  };
  assert.equal(G.validateProposal(proposal([newNode, edgeToOwnNode]), LIBRARY, null).status, 'reject', '边端点引用本提案将新建的节点');
});

test('③：目标缺失/基线不可删/tombstones 撞车/paperId 不存在/anchor 解析失败 ⇒ 整案拒绝', () => {
  const cases = [
    ['步骤不存在', proposal([setChange('route-step', 'step-ghost', 'purpose', '新目的。')])],
    ['论文不存在', proposal([{ op: 'set', target: { type: 'paper', id: 'ghost-paper', field: 'learner.gist' }, expectedBase: '', value: 'x', reason: 'r' }])],
    ['地图节点不存在', proposal([setChange('map-node', 'map-ghost', 'label', '甲')])],
    ['删基线步骤', proposal([{ op: 'remove', target: { type: 'route-step', id: 'step-collab-1' }, expectedBase: '', reason: 'r' }])],
    ['删基线地图节点（只可 set）', proposal([{ op: 'remove', target: { type: 'map-node', id: 'map-prog-budget' }, expectedBase: '', reason: 'r' }])],
    ['insert 步骤撞基线 id', proposal([{ op: 'insert', target: { type: 'route-step', id: 'step-collab-1' }, value: { kind: 'paper', paperId: 'memgpt', purpose: 'p。', readWhen: 'r。', anchor: { routeId: 'cross-harness-collab' } }, reason: 'r' }])],
    ['insert 步骤 id 非 step-ov-', proposal([{ op: 'insert', target: { type: 'route-step', id: 'step-hack' }, value: { kind: 'paper', paperId: 'memgpt', purpose: 'p。', readWhen: 'r。', anchor: { routeId: 'cross-harness-collab' } }, reason: 'r' }])],
    ['insert paperId 不存在', proposal([{ op: 'insert', target: { type: 'route-step', id: 'step-ov-x' }, value: { kind: 'paper', paperId: 'ghost', purpose: 'p。', readWhen: 'r。', anchor: { routeId: 'cross-harness-collab' } }, reason: 'r' }])],
    ['anchor routeId 不存在', proposal([{ op: 'insert', target: { type: 'route-step', id: 'step-ov-x' }, value: { kind: 'paper', paperId: 'memgpt', purpose: 'p。', readWhen: 'r。', anchor: { routeId: 'ghost-dir' } }, reason: 'r' }])],
    ['anchor afterStepId 不存在', proposal([{ op: 'insert', target: { type: 'route-step', id: 'step-ov-x' }, value: { kind: 'paper', paperId: 'memgpt', purpose: 'p。', readWhen: 'r。', anchor: { routeId: 'cross-harness-collab', afterStepId: 'step-ghost' } }, reason: 'r' }])],
    ['refs 无法解析', proposal([{ op: 'insert', target: { type: 'map-node', id: 'map-prog-x' }, value: { side: 'problem', label: '甲', summary: '乙', refs: ['ghost-ref'], source: { originType: 'self', note: '测试', asOf: '2026-09-23' } }, reason: 'r' }])],
    ['evidence 无法解析（schema 层整案拒绝，不降级）', proposal([{ op: 'insert', target: { type: 'map-edge', id: 'map-edge-x' }, value: { from: 'map-meth-paging', to: 'map-prog-memory', meaning: 'addresses：测试', evidence: ['ghost-ev'], source: { originType: 'content', note: '编辑排定，非引用', asOf: '2026-09-23' } }, reason: 'r' }])],
    ['evidence 未命中 R7 保留可用（保留收窄条目不成边）', proposal([{ op: 'insert', target: { type: 'map-edge', id: 'map-edge-x' }, value: { from: 'map-meth-paging', to: 'map-prog-memory', meaning: 'addresses：测试', evidence: ['tosem2025-acceptance'], source: { originType: 'content', note: '编辑排定，非引用', asOf: '2026-09-23' } }, reason: 'r' }])],
    ['advisor 为 addresses 边唯一来源', proposal([{ op: 'insert', target: { type: 'map-edge', id: 'map-edge-x' }, value: { from: 'map-meth-paging', to: 'map-prog-memory', meaning: 'addresses：测试', evidence: ['memgpt'], source: { originType: 'advisor', note: '转述，非引用', asOf: '2026-09-23' } }, reason: 'r' }])],
    ['ai 节点挂方法侧', proposal([{ op: 'insert', target: { type: 'map-node', id: 'map-meth-x' }, value: { side: 'method', label: '甲', summary: '乙', refs: ['cross-harness-collab'], source: { originType: 'ai', note: '测试', asOf: '2026-09-23' } }, reason: 'r' }])],
    ['meaning 不以固定词汇开头', proposal([{ op: 'insert', target: { type: 'map-edge', id: 'map-edge-x' }, value: { from: 'map-meth-paging', to: 'map-prog-memory', meaning: 'cites：论文引用', evidence: ['memgpt'], source: { originType: 'content', note: '非引用', asOf: '2026-09-23' } }, reason: 'r' }])],
    ['addresses 方向倒置', proposal([{ op: 'insert', target: { type: 'map-edge', id: 'map-edge-x' }, value: { from: 'map-prog-memory', to: 'map-meth-paging', meaning: 'addresses：测试', evidence: ['memgpt'], source: { originType: 'content', note: '非引用', asOf: '2026-09-23' } }, reason: 'r' }])],
    ['边来源缺 PF-07 声明', proposal([{ op: 'insert', target: { type: 'map-edge', id: 'map-edge-x' }, value: { from: 'map-meth-paging', to: 'map-prog-memory', meaning: 'addresses：测试', evidence: ['memgpt'], source: { originType: 'content', note: '编辑排定', asOf: '2026-09-23' } }, reason: 'r' }])],
    ['home-focus 切到 deferred 方向', proposal([setChange('home-focus', 'home', 'routeId', 'trusted-rag')])],
  ];
  for (const [label, text] of cases) {
    const r = G.validateProposal(text, LIBRARY, null);
    assert.equal(r.status, 'reject', label);
  }
});

test('③：生效总额 12/15 越限整案拒绝（基线 10/12，余量 2/3，含示例同限）', () => {
  const node = (i) => ({ op: 'insert', target: { type: 'map-node', id: `map-prog-extra${i}` }, value: { side: 'problem', label: `甲${i}`, summary: '测', refs: ['cross-harness-collab'], source: { originType: 'self', note: '测试', asOf: '2026-09-23' } }, reason: 'r' });
  const edge = (i) => ({ op: 'insert', target: { type: 'map-edge', id: `map-edge-extra${i}` }, value: { from: 'map-meth-paging', to: 'map-prog-memory', meaning: 'addresses：测试', evidence: ['memgpt'], source: { originType: 'content', note: '测试，非引用', asOf: '2026-09-23' } }, reason: 'r' });
  assert.equal(G.validateProposal(proposal([node(1), node(2)]), LIBRARY, null).status, 'preview', '余量内通过');
  assert.equal(G.validateProposal(proposal([node(1), node(2), node(3)]), LIBRARY, null).status, 'reject', '13 节点拒绝');
  assert.equal(G.validateProposal(proposal([edge(1), edge(2), edge(3), edge(4)]), LIBRARY, null).status, 'reject', '16 边拒绝');
  // 覆盖层已有插入时复校：对带覆盖层生效态校验。
  const overlayWith2 = {
    version: 1, seq: 1, base: { contentVersionLabel: 'x' },
    entries: {
      'map-node:map-prog-extra1:': { op: 'insert', value: node(1).value, origin: { sourceType: 'self', label: 'l', asOf: '2026-09-23', evidenceNote: 'n' }, proposalId: 'prop-a', appliedAt: '2026-09-23T08:00:00.000Z', example: false },
      'map-node:map-prog-extra2:': { op: 'insert', value: node(2).value, origin: { sourceType: 'self', label: 'l', asOf: '2026-09-23', evidenceNote: 'n' }, proposalId: 'prop-a', appliedAt: '2026-09-23T08:00:00.000Z', example: false },
    },
    history: [], homeFocus: null, map: { nodes: [], edges: [] }, tombstones: {},
  };
  assert.equal(G.validateProposal(proposal([node(3)]), LIBRARY, overlayWith2).status, 'reject', '生效总额按合并后计算');
});
// ---------- ④ stale-base：仅预览内冲突；任意采纳子集独立、可应用（复核阻断 1/2） ----------

test('④：单条 stale-base 不整案拒绝、仍进预览，三格数据齐备；合法条目状态 ok', () => {
  const good = setChange('route-step', 'step-collab-3', 'purpose', '新的读法目的。');
  const stale = { op: 'set', target: { type: 'route-step', id: 'step-collab-4', field: 'readWhen' }, expectedBase: '与当前生效值不一致的旧依据', value: '新时机。', reason: 'r' };
  const r = G.validateProposal(proposal([good, stale]), LIBRARY, null);
  assert.equal(r.status, 'preview', 'stale 永不阻止预览');
  assert.equal(r.items[0].status, 'ok');
  assert.equal(r.items[1].status, 'stale');
  assert.equal(r.items[1].proposalOld, stale.expectedBase, '三格·提案旧值');
  const cur4 = LIBRARY.directions[0].startRoute.find((s) => s.id === 'step-collab-4');
  assert.equal(r.items[1].baseCurrent, cur4.readWhen.replace(/\r\n?/g, '\n'), '三格·当前生效值');
  assert.equal(r.items[1].newValue, '新时机。', '三格·新值');
});

test('④+确认：任意采纳子集独立应用；子集结果＝基线＋仅采纳项；stale 条目保持旧值时不改写', async () => {
  const p1 = setChange('route-step', 'step-collab-3', 'purpose', '采纳甲。');
  const p2 = setChange('route-step', 'step-collab-4', 'purpose', '采纳乙。');
  const p3 = setChange('route-step', 'step-collab-5', 'purpose', '放弃丙。');
  const text = proposal([p1, p2, p3]);
  // 只采纳 1、3
  const storage = makeStorage();
  let v = G.validateProposal(text, LIBRARY, null);
  const accepted = {};
  for (const it of v.items) if (it.op === 'set' && it.target.id !== 'step-collab-4') accepted[it.ref] = true;
  const snapshot = Object.fromEntries(v.items.map((it) => [it.ref, it.baseCurrent]));
  const r = await G.applyProposal({ storage, navigatorLike: navLocks, base: LIBRARY, proposalText: text, accepted, previewSnapshot: snapshot }, { now: FIXED_NOW });
  assert.ok(r.ok, JSON.stringify(r));
  const overlay = G.currentOverlay(storage);
  assert.ok(overlay.entries['route-step:step-collab-3:purpose']);
  assert.ok(!overlay.entries['route-step:step-collab-4:purpose'], '未采纳条目不写入');
  assert.ok(overlay.entries['route-step:step-collab-5:purpose']);
  const eff = G.computeEffective(LIBRARY, overlay);
  assert.equal(eff.lib.directions[0].startRoute.find((s) => s.id === 'step-collab-3').purpose, '采纳甲。');
  assert.notEqual(eff.lib.directions[0].startRoute.find((s) => s.id === 'step-collab-4').purpose, '采纳乙。');
});

// ---------- computeEffective 语义（R5 单入口） ----------

test('computeEffective：无覆盖层透传基线（同一引用）；insert/set/append/remove 物化正确；再叠加显式抛错', () => {
  const noOverlay = G.computeEffective(LIBRARY, null);
  assert.equal(noOverlay.lib, LIBRARY, '无覆盖层不复制第二副本');
  assert.equal(noOverlay.map, LIBRARY.map);
  assert.equal(noOverlay.homeFocus, null);
  // 对已生效视图再叠加 ⇒ 抛错（防第二缓存副本）
  const overlay = {
    version: 1, seq: 1, base: { contentVersionLabel: 'x' },
    entries: { 'route-step:step-collab-3:purpose': { op: 'set', value: '甲', origin: { sourceType: 'self', label: 'l', asOf: '2026-09-23', evidenceNote: 'n' }, proposalId: 'prop-a', appliedAt: '2026-09-23T08:00:00.000Z', example: false } },
    history: [], homeFocus: null, map: { nodes: [], edges: [] }, tombstones: {},
  };
  const eff1 = G.computeEffective(LIBRARY, overlay);
  assert.throws(() => G.computeEffective(eff1.lib, overlay), /单入口/);
  assert.equal(eff1.lib.directions[0].startRoute.find((s) => s.id === 'step-collab-3').purpose, '甲');
  assert.equal(G.computeEffective(LIBRARY, { ...overlay, entries: {} }).lib, LIBRARY, '仅无条目且无 tombstones 视为空');
  assert.notEqual(G.computeEffective(LIBRARY, { version: 1, seq: 1, base: { contentVersionLabel: 'x' }, entries: {}, history: [], homeFocus: null, map: { nodes: [], edges: [] }, tombstones: { 'step-ov-z': '2026-09-23' } }).lib, LIBRARY, 'tombstones 仍在则覆盖层非空');
});

test('物化：insert 锚点位置 / remove 删除并封存 / append 顺序累加 / 材料·方向·地图条目', async () => {
  const storage = makeStorage();
  const ins = { op: 'insert', target: { type: 'route-step', id: 'step-ov-mid' }, value: { kind: 'article', materialId: 'mat-read-empirical', purpose: '目的。', readWhen: '时机。', anchor: { routeId: 'cross-harness-collab', afterStepId: 'step-collab-2' } }, reason: 'r' };
  const append1 = { op: 'append', target: { type: 'paper', id: 'memgpt', field: 'questions' }, expectedBase: eb(LIBRARY, null, { type: 'paper', id: 'memgpt', field: 'questions' }), value: '追加问题一？', reason: 'r' };
  const append2 = { op: 'append', target: { type: 'direction', id: 'cross-harness-collab', field: 'openQuestions' }, expectedBase: eb(LIBRARY, null, { type: 'direction', id: 'cross-harness-collab', field: 'openQuestions' }), value: '追加问题二？', reason: 'r' };
  const hf = setChange('home-focus', 'home', 'routeId', 'code-agent-verification');
  let v = G.validateProposal(proposal([ins, append1, append2, hf], { id: 'prop-mat-1' }), LIBRARY, null);
  assert.equal(v.status, 'preview', v.firstError);
  let r = await G.applyProposal({ storage, navigatorLike: navLocks, base: LIBRARY, proposalText: proposal([ins, append1, append2, hf], { id: 'prop-mat-1' }), accepted: Object.fromEntries(v.items.map((it) => [it.ref, true])), previewSnapshot: Object.fromEntries(v.items.map((it) => [it.ref, it.baseCurrent ?? ''])) }, { now: FIXED_NOW });
  assert.ok(r.ok);
  let overlay = G.currentOverlay(storage);
  let eff = G.computeEffective(LIBRARY, overlay);
  const ids = eff.lib.directions[0].startRoute.map((s) => s.id);
  assert.deepEqual(ids, ['step-collab-1', 'step-collab-2', 'step-ov-mid', 'step-collab-3', 'step-collab-4', 'step-collab-5'], '锚点后插入');
  const memgpt = eff.lib.papers.find((p) => p.id === 'memgpt');
  assert.equal(memgpt.questions[memgpt.questions.length - 1], '追加问题一？');
  assert.equal(memgpt.questions.length, LIBRARY.papers.find((p) => p.id === 'memgpt').questions.length + 1);
  assert.equal(eff.lib.directions[0].openQuestions.at(-1), '追加问题二？');
  assert.deepEqual(overlay.homeFocus && { routeId: overlay.homeFocus.routeId }, { routeId: 'code-agent-verification' });
  // 第二条提案再 append 同一 questions：顺序累加、expectedBase 匹配当前生效值（非基线）
  const append3 = { op: 'append', target: { type: 'paper', id: 'memgpt', field: 'questions' }, expectedBase: eb(LIBRARY, overlay, { type: 'paper', id: 'memgpt', field: 'questions' }), value: '追加问题三？', reason: 'r' };
  v = G.validateProposal(proposal([append3], { id: 'prop-mat-2' }), LIBRARY, overlay);
  assert.equal(v.items[0].status, 'ok', 'expectedBase 以生效值为准（含已应用覆盖层）');
  r = await G.applyProposal({ storage, navigatorLike: navLocks, base: LIBRARY, proposalText: proposal([append3], { id: 'prop-mat-2' }), accepted: { [v.items[0].ref]: true }, previewSnapshot: { [v.items[0].ref]: v.items[0].baseCurrent } }, { now: FIXED_NOW });
  assert.ok(r.ok);
  overlay = G.currentOverlay(storage);
  assert.equal(overlay.entries['paper:memgpt:questions'].value.length, 2);
  eff = G.computeEffective(LIBRARY, overlay);
  assert.equal(eff.lib.papers.find((p) => p.id === 'memgpt').questions.at(-1), '追加问题三？');
  // remove 覆盖层步骤 ⇒ 删除 + tombstones + 条目清除
  const rm = { op: 'remove', target: { type: 'route-step', id: 'step-ov-mid' }, expectedBase: eb(LIBRARY, overlay, { type: 'route-step', id: 'step-ov-mid', field: '' }), reason: 'r' };
  v = G.validateProposal(proposal([rm], { id: 'prop-mat-3' }), LIBRARY, overlay);
  assert.equal(v.status, 'preview', v.firstError ?? 'remove 应可预览');
  r = await G.applyProposal({ storage, navigatorLike: navLocks, base: LIBRARY, proposalText: proposal([rm], { id: 'prop-mat-3' }), accepted: { [v.items[0].ref]: true }, previewSnapshot: { [v.items[0].ref]: v.items[0].baseCurrent } }, { now: FIXED_NOW });
  assert.ok(r.ok);
  overlay = G.currentOverlay(storage);
  assert.ok(overlay.tombstones['step-ov-mid']);
  assert.ok(!overlay.entries['route-step:step-ov-mid:'], '插入条目随 remove 移除');
  assert.ok(!overlay.entries['route-step:step-ov-mid:purpose'], '对该步骤的字段 set 一并清除');
  eff = G.computeEffective(LIBRARY, overlay);
  assert.ok(!eff.lib.directions[0].startRoute.some((s) => s.id === 'step-ov-mid'));
  // 同名复活 ⇒ 拒绝（tombstones 释放后不复用，R5）
  const reinsert = { ...ins, value: { ...ins.value, anchor: { routeId: 'cross-harness-collab', afterStepId: 'step-collab-2' } } };
  assert.equal(G.validateProposal(proposal([reinsert], { id: 'prop-mat-4' }), LIBRARY, overlay).status, 'reject', '撞 tombstones');
});
// ---------- 确认重校验（⑤）、原子写入、竞态、v3 不受影响、seq/history 规则 ----------

async function applyAll(storage, text, id = 'prop-a') {
  const v = G.validateProposal(text, LIBRARY, G.currentOverlay(storage));
  assert.equal(v.status, 'preview', id);
  return G.applyProposal({
    storage,
    navigatorLike: navLocks,
    base: LIBRARY,
    proposalText: text,
    accepted: Object.fromEntries(v.items.map((it) => [it.ref, true])),
    previewSnapshot: Object.fromEntries(v.items.map((it) => [it.ref, it.baseCurrent ?? ''])),
  }, { now: FIXED_NOW });
}

test('⑤ 竞态：预览后覆盖层被改（双标签页）⇒ 确认拒绝、旧状态逐字节不变', async () => {
  const storage = makeStorage();
  const textA = proposal([setChange('route-step', 'step-collab-3', 'purpose', 'A 的改写。')], { id: 'prop-race-a' });
  const textB = proposal([setChange('route-step', 'step-collab-3', 'purpose', 'B 的改写。')], { id: 'prop-race-b' });
  assert.ok((await applyAll(storage, textA)).ok);
  const afterA = storage.data.get(G.GUIDANCE_KEY);
  // B 的预览快照取自 A 写入之前（expectedBase 匹配旧生效值）；写入后再看：stale 标记但仍只是预览内冲突。
  const vB = G.validateProposal(textB, LIBRARY, null);
  assert.equal(vB.status, 'preview');
  assert.equal(G.validateProposal(textB, LIBRARY, G.currentOverlay(storage)).items[0].status, 'stale', 'A 写入使 B 变 stale（不阻止预览）');
  const r = await G.applyProposal({
    storage, navigatorLike: navLocks, base: LIBRARY, proposalText: textB,
    accepted: { [vB.items[0].ref]: true },
    previewSnapshot: { [vB.items[0].ref]: vB.items[0].baseCurrent },
  }, { now: FIXED_NOW });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'preview-stale');
  assert.equal(storage.data.get(G.GUIDANCE_KEY), afterA, '拒绝写入后覆盖层逐字节不变');
});

test('原子写入：setItem 抛错 ⇒ 明确失败、旧状态不变；无第二键、无部分写', async () => {
  const storage = makeStorage();
  await applyAll(storage, proposal([setChange('route-step', 'step-collab-3', 'purpose', '初值。')], { id: 'prop-atom-0' }));
  const before = storage.data.get(G.GUIDANCE_KEY);
  const broken = makeStorage();
  broken.setItem = () => { throw new Error('quota'); };
  broken.getItem = (k) => storage.getItem(k);
  const v = G.validateProposal(proposal([setChange('route-step', 'step-collab-3', 'purpose', '新值。')], { id: 'prop-atom-1' }), LIBRARY, G.currentOverlay(broken));
  const r = await G.applyProposal({
    storage: broken, navigatorLike: navLocks, base: LIBRARY,
    proposalText: proposal([setChange('route-step', 'step-collab-3', 'purpose', '新值。')], { id: 'prop-atom-1' }),
    accepted: { [v.items[0].ref]: true }, previewSnapshot: { [v.items[0].ref]: v.items[0].baseCurrent },
  }, { now: FIXED_NOW });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'storage-write-failed');
  assert.equal(storage.data.get(G.GUIDANCE_KEY), before, '共享存储未被部分写入');
});

test('Web Locks：有锁走锁、锁获取失败⇒不写；无锁退化为直接写', async () => {
  let lockedName = null;
  const nav = { locks: { request: (name, fn) => { lockedName = name; return Promise.resolve().then(fn); } } };
  const storage = makeStorage();
  const text = proposal([setChange('route-step', 'step-collab-3', 'purpose', '带锁写入。')], { id: 'prop-lock-1' });
  const v = G.validateProposal(text, LIBRARY, null);
  const r = await G.applyProposal({ storage, navigatorLike: nav, base: LIBRARY, proposalText: text, accepted: { [v.items[0].ref]: true }, previewSnapshot: { [v.items[0].ref]: v.items[0].baseCurrent } }, { now: FIXED_NOW });
  assert.ok(r.ok);
  assert.equal(lockedName, G.GUIDANCE_LOCK, '写入在具名锁内');
  const brokenNav = navBrokenLocks();
  const storage2 = makeStorage();
  const r2 = await G.applyProposal({ storage: storage2, navigatorLike: brokenNav, base: LIBRARY, proposalText: text, accepted: { [v.items[0].ref]: true }, previewSnapshot: { [v.items[0].ref]: v.items[0].baseCurrent } }, { now: FIXED_NOW });
  assert.equal(r2.ok, false);
  assert.equal(r2.reason, 'lock-failed');
  assert.equal(storage2.data.size, 0, '锁失败不得写任何键');
  const storage3 = makeStorage();
  const r3 = await G.applyProposal({ storage: storage3, navigatorLike: navNoLocks, base: LIBRARY, proposalText: text, accepted: { [v.items[0].ref]: true }, previewSnapshot: { [v.items[0].ref]: v.items[0].baseCurrent } }, { now: FIXED_NOW });
  assert.ok(r3.ok, '无 Web Locks 时退化为直接写（口径同 notes.js）');
});

test('v3 逐字节不变：apply/undo/import/reset 全周期只写导学键，绝不触碰 v3', async () => {
  const storage = makeStorage({ [V3_KEY]: V3_FIXTURE });
  await applyAll(storage, proposal([setChange('route-step', 'step-collab-3', 'purpose', 'v3 隔离检验。')], { id: 'prop-v3-1' }));
  const u = await G.undoLastApply({ storage, navigatorLike: navLocks }, { now: FIXED_NOW });
  assert.ok(u.ok);
  const r = await G.resetOverlay({ storage, navigatorLike: navLocks }, { now: FIXED_NOW });
  assert.ok(r.ok);
  assert.equal(storage.data.get(V3_KEY), V3_FIXTURE, 'v3 原始字符串逐字节不变');
  const writes = storage.calls.filter(([op, key]) => op === 'setItem' && key === V3_KEY);
  assert.deepEqual(writes, [], '任何导学操作都不得写 v3 键');
});

test('seq 单调＋history 只追加：apply/undo/reset 各自 +1；历史末条决定撤销按钮可用性；截断只丢最旧', async () => {
  const storage = makeStorage();
  let r = await applyAll(storage, proposal([setChange('route-step', 'step-collab-3', 'purpose', '一。')], { id: 'prop-seq-1' }));
  assert.equal(r.overlay.seq, 1);
  assert.equal(r.overlay.history.at(-1).kind, 'apply');
  assert.deepEqual({ a: r.overlay.history.at(-1).acceptedCount, b: r.overlay.history.at(-1).rejectedCount }, { a: 1, b: 0 });
  const u = await G.undoLastApply({ storage, navigatorLike: navLocks }, { now: FIXED_NOW });
  assert.ok(u.ok);
  assert.equal(u.overlay.seq, 2, '撤销＝前向写入 seq+1');
  assert.equal(u.overlay.history.at(-1).kind, 'undo');
  assert.equal(u.overlay.history.length, 2, 'history 只追加不回删');
  assert.equal(G.canUndo(u.overlay), false, '连续撤销不可用');
  assert.equal((await G.undoLastApply({ storage, navigatorLike: navLocks }, { now: FIXED_NOW })).reason, 'no-undo');
  r = await applyAll(storage, proposal([setChange('route-step', 'step-collab-4', 'purpose', '二。')], { id: 'prop-seq-2' }));
  assert.equal(r.overlay.seq, 3);
  assert.equal(G.canUndo(r.overlay), true);
  const reset = await G.resetOverlay({ storage, navigatorLike: navLocks }, { now: FIXED_NOW });
  assert.ok(reset.ok);
  assert.equal(reset.overlay.seq, 4);
  assert.equal(G.canUndo(reset.overlay), false, 'reset 后不可再撤销');
  assert.equal(reset.overlay.undoSlot, undefined);
  assert.deepEqual(reset.overlay.tombstones, {}, 'reset 清空 tombstones');
  assert.equal(reset.overlay.entries && Object.keys(reset.overlay.entries).length, 0, 'reset 清空 entries');
  assert.ok(reset.overlay.history.length <= G.HISTORY_LIMIT);
  // 截断：连写 25 次，保留最新 20 条且 seq 不回退
  const big = makeStorage();
  for (let i = 0; i < 25; i += 1) {
    await applyAll(big, proposal([setChange('route-step', 'step-collab-3', 'purpose', `批量${i}。`)], { id: `prop-big-${i}` }));
  }
  const ov = G.currentOverlay(big);
  assert.equal(ov.seq, 25);
  assert.equal(ov.history.length, 20);
  assert.equal(ov.history[0].seq, 6, '截断只丢最旧摘要');
});

test('损坏/不可用：明确分类；不猜测修复、不静默清空；应用被拒但坏档保留；重置需两步', async () => {
  const corrupt = makeStorage({ [G.GUIDANCE_KEY]: '{"version":1,"entries":{' });
  let loaded = G.loadOverlay(corrupt);
  assert.equal(loaded.kind, 'corrupt');
  assert.equal(loaded.raw, '{"version":1,"entries":{');
  assert.equal(G.currentOverlay(corrupt), null, '损坏⇒页面降级基线显示');
  const text = proposal([setChange('route-step', 'step-collab-3', 'purpose', '坏档下写入。')], { id: 'prop-corr' });
  const v = G.validateProposal(text, LIBRARY, null);
  const r = await G.applyProposal({ storage: corrupt, navigatorLike: navLocks, base: LIBRARY, proposalText: text, accepted: { [v.items[0].ref]: true }, previewSnapshot: { [v.items[0].ref]: v.items[0].baseCurrent } }, { now: FIXED_NOW });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'storage-corrupt');
  assert.equal(corrupt.data.get(G.GUIDANCE_KEY), '{"version":1,"entries":{', '坏档原文保留供导出自查');
  assert.equal((await G.resetOverlay({ storage: corrupt, navigatorLike: navLocks }, { now: FIXED_NOW })).reason, 'storage-corrupt-needs-backup');
  const forced = await G.resetCorruptOverlay({ storage: corrupt, navigatorLike: navLocks }, { now: FIXED_NOW });
  assert.ok(forced.ok);
  assert.equal(forced.overlay.seq, 1);
  // 未知字段（非 JSON 错，结构不可辨认）⇒ 同样 corrupt
  const unknown = makeStorage({ [G.GUIDANCE_KEY]: JSON.stringify({ version: 1, seq: 0, base: { contentVersionLabel: 'x' }, entries: {}, history: [], map: { nodes: [], edges: [] }, tombstones: {}, hack: 1 }) });
  assert.equal(G.loadOverlay(unknown).kind, 'corrupt', '覆盖层未知字段⇒损坏处理，不猜测修复');
  // 不可用
  const dead = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.equal(G.loadOverlay(dead).kind, 'unavailable');
  assert.equal(G.currentOverlay(dead), null);
});
// ---------- 导出/导入（三路比较、显式替换、undoSlot 本机专用）、reset 后旧提案 stale、示例持久 ----------

test('撤销＝多字段提案一次全回（不留半套），history 无回删', async () => {
  const storage = makeStorage();
  const changes = [
    setChange('route-step', 'step-collab-3', 'purpose', '一次全回甲。'),
    setChange('paper', 'memgpt', 'learner.gist', '一次全回乙。'),
    { op: 'insert', target: { type: 'map-node', id: 'map-prog-undoall' }, value: { side: 'problem', label: '全回节点', summary: '测', refs: ['cross-harness-collab'], source: { originType: 'self', note: '测试', asOf: '2026-09-23' } }, reason: 'r' },
    { op: 'append', target: { type: 'direction', id: 'cross-harness-collab', field: 'openQuestions' }, expectedBase: eb(LIBRARY, null, { type: 'direction', id: 'cross-harness-collab', field: 'openQuestions' }), value: '全回追加问题？', reason: 'r' },
  ];
  const r = await applyAll(storage, proposal(changes, { id: 'prop-multi' }));
  assert.ok(r.ok, JSON.stringify(r));
  let eff = G.computeEffective(LIBRARY, G.currentOverlay(storage));
  assert.equal(eff.lib.directions[0].startRoute.find((s) => s.id === 'step-collab-3').purpose, '一次全回甲。');
  assert.equal(eff.lib.papers.find((x) => x.id === 'memgpt').learner.gist, '一次全回乙。');
  assert.equal(eff.map.nodes.length, 11);
  assert.equal(eff.lib.directions[0].openQuestions.at(-1), '全回追加问题？');
  const u = await G.undoLastApply({ storage, navigatorLike: navLocks }, { now: FIXED_NOW });
  assert.ok(u.ok);
  eff = G.computeEffective(LIBRARY, u.overlay);
  assert.notEqual(eff.lib.directions[0].startRoute.find((s) => s.id === 'step-collab-3').purpose, '一次全回甲。', '一次全回：字段回旧');
  assert.notEqual(eff.lib.papers.find((x) => x.id === 'memgpt').learner.gist, '一次全回乙。');
  assert.equal(eff.map.nodes.length, 10, '一次全回：插入节点消失');
  assert.notEqual(eff.lib.directions[0].openQuestions.at(-1), '全回追加问题？');
  assert.equal(u.overlay.seq, 2);
  assert.deepEqual(u.overlay.history.map((h) => h.kind), ['apply', 'undo'], 'history 无回删、只追加');
  assert.equal(Object.keys(u.overlay.entries).length, 0);
});

test('导出＝其余字段（不含 undoSlot）；导入含 undoSlot⇒按未知字段拒绝；未知字段拒绝', async () => {
  const storage = makeStorage();
  await applyAll(storage, proposal([setChange('route-step', 'step-collab-3', 'purpose', '导出口径。')], { id: 'prop-exp-1' }));
  const overlay = G.currentOverlay(storage);
  const text = G.exportOverlayText(overlay);
  assert.ok(!/undoSlot/.test(text), '导出档不得含 undoSlot');
  const parsed = G.parseImportedOverlay(text);
  assert.equal(parsed.status, 'ok');
  assert.equal(G.parseImportedOverlay(JSON.stringify({ ...JSON.parse(text), undoSlot: { overlayBefore: null } })).status, 'reject', '导入档含 undoSlot⇒拒绝');
  assert.match(G.parseImportedOverlay(JSON.stringify({ ...JSON.parse(text), hack: 1 })).message, /未知字段|结构自检/);
});

test('import 三路比较：全等⇒与本机一致 no-op；不一致⇒逐 targetRef 差异、默认不覆盖；替换 seq 本机+1、撤销槽=替换前快照', async () => {
  const storage = makeStorage();
  await applyAll(storage, proposal([setChange('route-step', 'step-collab-3', 'purpose', '本机值。')], { id: 'prop-local' }));
  const local = G.currentOverlay(storage);
  // 同内容自导出⇒identical
  const same = G.parseImportedOverlay(G.exportOverlayText(local)).overlay;
  assert.equal(G.compareImport(LIBRARY, local, same).identical, true, '三项全等⇒不写入');
  // 另一台机器：不同 seq/内容
  const other = makeStorage();
  await applyAll(other, proposal([setChange('route-step', 'step-collab-4', 'purpose', '外机值。')], { id: 'prop-other' }));
  const incoming = G.currentOverlay(other);
  const cmp = G.compareImport(LIBRARY, local, incoming);
  assert.equal(cmp.identical, false);
  const kinds = cmp.diff.map((d) => `${d.ref}:${d.kind}`).sort();
  assert.deepEqual(kinds, ['route-step:step-collab-3:purpose:local-only', 'route-step:step-collab-4:purpose:incoming-only']);
  // 显式替换（UI 在差异展示后才调用本函数）
  const r = await G.importReplaceOverlay({ storage, navigatorLike: navLocks, incoming }, { now: FIXED_NOW });
  assert.ok(r.ok);
  assert.equal(r.overlay.seq, local.seq + 1, 'seq 在本机原值上 +1，不采外来 seq');
  assert.equal(r.overlay.history.at(-1).kind, 'import');
  assert.ok(r.overlay.entries['route-step:step-collab-4:purpose'], '替换按导入档重建');
  assert.ok(!r.overlay.entries['route-step:step-collab-3:purpose']);
  assert.equal(r.overlay.undoSlot.overlayBefore.entries['route-step:step-collab-3:purpose'].value, '本机值。', 'undoSlot=本机替换前完整快照');
  // 替换后可撤销，撤销只回指导覆盖层
  const u = await G.undoLastApply({ storage, navigatorLike: navLocks }, { now: FIXED_NOW });
  assert.ok(u.ok);
  assert.equal(u.overlay.entries['route-step:step-collab-3:purpose'].value, '本机值。');
  assert.ok(!u.overlay.entries['route-step:step-collab-4:purpose']);
  assert.equal(u.overlay.seq, local.seq + 2, '撤销也是前向写入');
  assert.equal(u.overlay.history.at(-1).kind, 'undo');
  assert.ok(!u.overlay.undoSlot);
});

test('reset 后：旧提案按 stale-base 进预览（不静默拒绝）；tombstone id 可复用', async () => {
  const storage = makeStorage();
  const ins = { op: 'insert', target: { type: 'route-step', id: 'step-ov-reset' }, value: { kind: 'paper', paperId: 'memgpt', purpose: '目的。', readWhen: '时机。', anchor: { routeId: 'cross-harness-collab' } }, reason: 'r' };
  await applyAll(storage, proposal([ins], { id: 'prop-r1' }));
  const ov1 = G.currentOverlay(storage);
  const r2 = await applyAll(storage, proposal([setChange('route-step', 'step-ov-reset', 'purpose', '改一笔。', LIBRARY, ov1)], { id: 'prop-r2' }));
  assert.ok(r2.ok);
  await G.resetOverlay({ storage, navigatorLike: navLocks }, { now: FIXED_NOW });
  const afterReset = G.currentOverlay(storage);
  assert.equal(afterReset, null, 'reset 后覆盖层为空（无 entries 无 tombstones）');
  // 旧提案指向已不存在的覆盖层步骤 ⇒ target-missing 整案拒绝（R3 ③：目标缺失属非法而非冲突）
  const goneText = proposal([{ op: 'set', target: { type: 'route-step', id: 'step-ov-reset', field: 'purpose' }, expectedBase: '改一笔。', value: '再改。', reason: 'r' }], { id: 'prop-r3' });
  assert.equal(G.validateProposal(goneText, LIBRARY, afterReset).status, 'reject');
  // 目标仍存在但基线不匹配的情形（reset 后旧 set 提案）⇒ 按 stale-base 进预览，不静默拒绝
  const staleSet = proposal([{ op: 'set', target: { type: 'route-step', id: 'step-collab-3', field: 'purpose' }, expectedBase: 'reset 前的值', value: '新值。', reason: 'r' }], { id: 'prop-r4' });
  assert.equal(G.validateProposal(staleSet, LIBRARY, afterReset).items[0].status, 'stale', 'reset 后旧 set 提案按 stale-base 进预览');
  // tombstones 已清空⇒同名 id 可复用（新周期）
  const rRe = await applyAll(storage, proposal([ins], { id: 'prop-r5' }));
  assert.ok(rRe.ok, 'reset 后 insert 同名 step-ov-reset 允许（新周期）');
});

test('示例持久：example 标志随条目落盘/回读/export-import 后仍在；首页推导字段可辨', async () => {
  const storage = makeStorage();
  const text = proposal([setChange('route-step', 'step-collab-3', 'purpose', '示例改写。')], { id: 'prop-example-1', example: true });
  const r = await applyAll(storage, text);
  assert.ok(r.ok);
  const overlay = G.currentOverlay(storage);
  assert.equal(overlay.entries['route-step:step-collab-3:purpose'].example, true);
  assert.equal(overlay.history.at(-1).example, true);
  assert.equal(overlay.undoSlot.example, true);
  const back = G.loadOverlay(makeStorage({ [G.GUIDANCE_KEY]: storage.data.get(G.GUIDANCE_KEY) })).overlay;
  assert.equal(back.entries['route-step:step-collab-3:purpose'].example, true, '回读（=刷新/重开）后示例标记仍在');
  const roundtrip = G.parseImportedOverlay(G.exportOverlayText(overlay)).overlay;
  assert.equal(roundtrip.entries['route-step:step-collab-3:purpose'].example, true, 'export/import 后示例标记保留');
});
// ---------- 覆盖层视图重算、tombstone 上限、hash、常量对表、地图条目物化与 homeFocus 视图 ----------

test('normalizeOverlay：homeFocus/map 视图始终由 entries 重算（磁盘副本仅是缓存，entries 唯一权威）', () => {
  const raw = {
    version: 1,
    seq: 3,
    base: { contentVersionLabel: 'LIBRARY-CONTENT v5.2' },
    entries: {
      'home-focus:home:routeId': { op: 'set', value: 'code-agent-verification', origin: { sourceType: 'advisor', label: '转述', asOf: '2026-09-22', evidenceNote: 'x' }, proposalId: 'prop-v-1', appliedAt: '2026-09-23T07:00:00.000Z', example: false },
      'home-focus:home:note': { op: 'set', value: '先换第二条试试', origin: { sourceType: 'advisor', label: '转述', asOf: '2026-09-22', evidenceNote: 'x' }, proposalId: 'prop-v-1', appliedAt: '2026-09-23T07:30:00.000Z', example: false },
    },
    history: [{ seq: 1, kind: 'apply', proposalId: 'prop-v-1', origin: { sourceType: 'advisor', label: '转述', asOf: '2026-09-22', evidenceNote: 'x' }, appliedAt: '2026-09-23T07:30:00.000Z', summary: 's', acceptedCount: 2, rejectedCount: 0, example: false }],
    homeFocus: { routeId: 'WRONG-STALE-COPY', note: null },
    map: { nodes: [{ id: 'map-ghost-view', side: 'problem', label: '陈旧视图', summary: 's', refs: ['x'], source: { originType: 'content', note: 'n', asOf: '2026-09-23' } }], edges: [] },
    tombstones: {},
  };
  const ov = G.normalizeOverlay(raw);
  assert.ok(ov);
  assert.equal(ov.homeFocus.routeId, 'code-agent-verification', '视图按 entries 重算');
  assert.equal(ov.homeFocus.note, '先换第二条试试');
  assert.equal(ov.map.nodes.length, 0, '无 insert 条目则视图为空（忽略陈旧磁盘视图）');
});

test('tombstones 上限 40：超限的 remove 提案整案拒绝，提示先 reset/A 包', () => {
  const tomb = {};
  for (let i = 0; i < 40; i += 1) tomb[`step-ov-old${i}`] = '2026-09-01T00:00:00.000Z';
  const entries = {
    'route-step:step-ov-live:': { op: 'insert', value: { kind: 'paper', paperId: 'memgpt', purpose: 'p。', readWhen: 'r。', anchor: { routeId: 'cross-harness-collab' } }, origin: { sourceType: 'self', label: 'l', asOf: '2026-09-23', evidenceNote: 'n' }, proposalId: 'prop-t', appliedAt: '2026-09-23T06:00:00.000Z', example: false },
  };
  const ov = { version: 1, seq: 9, base: { contentVersionLabel: 'x' }, entries, history: [], homeFocus: null, map: { nodes: [], edges: [] }, tombstones: tomb };
  const rm = { op: 'remove', target: { type: 'route-step', id: 'step-ov-live' }, expectedBase: G.canonicalBaseline(LIBRARY, ov, { type: 'route-step', id: 'step-ov-live', field: '' }), reason: 'r' };
  const r = G.validateProposal(proposal([rm], { id: 'prop-tomb-41' }), LIBRARY, ov);
  assert.equal(r.status, 'reject');
  assert.match(r.firstError, /tombstones/);
});

test('import 比较基准：hash 对 entries 稳定、内容变化即变；比较不依赖版本串', () => {
  const baseOv = { version: 1, seq: 1, base: { contentVersionLabel: 'OLD' }, entries: { 'route-step:step-collab-3:purpose': { op: 'set', value: '甲', origin: { sourceType: 'self', label: 'l', asOf: '2026-09-23', evidenceNote: 'n' }, proposalId: 'prop-h', appliedAt: '2026-09-23T08:00:00.000Z', example: false } }, history: [], homeFocus: null, map: { nodes: [], edges: [] }, tombstones: {} };
  const cloneSame = JSON.parse(JSON.stringify(baseOv));
  cloneSame.base.contentVersionLabel = '完全不同的版本串';
  cloneSame.seq = 77;
  assert.equal(G.effectiveHash(cloneSame), G.effectiveHash(baseOv), 'hash 只看生效内容');
  const different = JSON.parse(JSON.stringify(baseOv));
  different.entries['route-step:step-collab-3:purpose'].value = '乙';
  assert.notEqual(G.effectiveHash(different), G.effectiveHash(baseOv));
});

test('枚举对表与 R7 名单：stage/passMode 与库内一致；tosem/swe-bench/agentless 不在覆盖层边证据名单', async () => {
  assert.deepEqual([...G.STEP_STAGES], ['建立概念', '建立问题', '理解方法', '看评价与反例', '核查近期竞争']);
  assert.deepEqual([...G.STEP_PASS_MODES], ['map', 'core', 'deep']);
  for (const banned of ['tosem2025-acceptance', 'swe-bench', 'agentless', 'trusted-rag', 'graph-harmful-fusion']) {
    assert.ok(!G.R7_USABLE_2026_09_23.includes(banned), banned);
  }
  // agentless 虽「保留可用（摘要级）」但 R7 明示不入地图边（摘要级选目）——名单以 009 表为准。
  assert.ok(G.R7_USABLE_2026_09_23.includes('step-collab-5'));
});

test('地图 insert 物化 + homeFocus 视图示例标记（R6 数据面；渲染断言在 render.test）', async () => {
  const storage = makeStorage();
  const node = { op: 'insert', target: { type: 'map-node', id: 'map-prog-ov1' }, value: { side: 'problem', label: '覆盖层问题', summary: '测试节点概述', refs: ['memgpt'], source: { originType: 'self', note: '本人新增', asOf: '2026-09-23' } }, reason: 'r' };
  const edge = { op: 'insert', target: { type: 'map-edge', id: 'map-edge-ov1' }, value: { from: 'map-meth-paging', to: 'map-prog-ov1', meaning: 'addresses：测试对应', evidence: ['memgpt'], source: { originType: 'self', note: '编辑排定，非引用', asOf: '2026-09-23' } }, reason: 'r' };
  // 同提案里边引用同提案新建节点 ⇒ 独立性整案拒绝（复核阻断 1）
  assert.equal(G.validateProposal(proposal([node, edge], { id: 'prop-map-coupled' }), LIBRARY, null).status, 'reject');
  const r = await applyAll(storage, proposal([node], { id: 'prop-map-1' }));
  assert.ok(r.ok, JSON.stringify(r));
  const overlay = G.currentOverlay(storage);
  assert.deepEqual(overlay.map.nodes.map((n) => n.id), ['map-prog-ov1']);
  assert.deepEqual(overlay.map.edges, [], '节点提案不含边');
  // 第二案引用第一案的覆盖层节点（应用前生效态可解析）⇒ 正常
  const r1b = await applyAll(storage, proposal([edge], { id: 'prop-map-1b' }));
  assert.ok(r1b.ok, JSON.stringify(r1b));
  assert.equal(G.currentOverlay(storage).map.edges[0].to, 'map-prog-ov1');
  const eff = G.computeEffective(LIBRARY, G.currentOverlay(storage));
  assert.equal(eff.map.nodes.length, 11);
  assert.equal(eff.map.edges.length, 13);
  assert.equal(eff.lib.map.nodes.at(-1).id, 'map-prog-ov1');
  // set 覆盖层自有节点字段
  const ov1 = G.currentOverlay(storage);
  const setNode = setChange('map-node', 'map-prog-ov1', 'summary', '改过的概述。', LIBRARY, ov1);
  assert.equal(G.validateProposal(proposal([setNode], { id: 'prop-map-2' }), LIBRARY, ov1).status, 'preview');
  // home-focus：deferred 方向拒绝；example 提案 ⇒ 视图带示例标记（渲染层据此过滤推导）
  assert.equal(G.validateProposal(proposal([setChange('home-focus', 'home', 'routeId', 'trusted-rag')], { id: 'prop-hf-bad' }), LIBRARY, ov1).status, 'reject');
  const hf = await applyAll(storage, proposal([setChange('home-focus', 'home', 'routeId', 'code-agent-verification')], { id: 'prop-hf-example-1', example: true }));
  assert.ok(hf.ok);
  const ov2 = G.currentOverlay(storage);
  assert.equal(ov2.homeFocus.routeId, 'code-agent-verification');
  assert.equal(ov2.homeFocus.example, true, 'homeFocus 视图持久携带示例标记（R5/R6）');
});

// ---------- 独立审查修复轮 B1：本机/导入档的 entries 必须过与提案同一白名单 ----------

const OK_ORIGIN = { sourceType: 'self', label: 'l', asOf: '2026-09-23', evidenceNote: 'n' };
function stored(op, value, origin = OK_ORIGIN) {
  return { op, value, origin, proposalId: 'prop-x', appliedAt: '2026-09-23T08:00:00.000Z', example: false };
}
function wrapOverlay(entries, tombstones = {}) {
  return { version: 1, seq: 1, base: { contentVersionLabel: 'x' }, entries, history: [], homeFocus: null, map: { nodes: [], edges: [] }, tombstones };
}

test('B1（坏档构造）：非白名单 field（title/coverage/deliveredDepth/__proto__/constructor）、非法值、证据名单外、超限 ⇒ 整档 corrupt，绝不静默降级为可用覆盖层', () => {
  const badEntries = {
    'paper:memgpt:title 非白名单': { 'paper:memgpt:title': stored('set', '改标题') },
    'paper:memgpt:coverage.basis 越界': { 'paper:memgpt:coverage.basis': stored('set', '改依据') },
    'paper:memgpt:deliveredDepth 越界': { 'paper:memgpt:deliveredDepth': stored('set', 'deep') },
    '__proto__ 计算键': { 'paper:memgpt:__proto__': stored('set', 'x') },
    'constructor 字段': { 'paper:memgpt:constructor': stored('set', 'x') },
    'direction.status 越界': { 'direction:cross-harness-collab:status': stored('set', 'deferred') },
    'route-step.url 越界': { 'route-step:step-collab-1:url': stored('set', 'example.org') },
    'value 含 URL': { 'route-step:step-collab-3:purpose': stored('set', '先读 https://evil.example/x') },
    'value 含 HTML': { 'route-step:step-collab-3:purpose': stored('set', '<b>目的</b>') },
    'value 超长': { 'route-step:step-collab-3:purpose': stored('set', '字'.repeat(501)) },
    'value 枚举非法': { 'route-step:step-collab-3:stage': stored('set', '随便阶段') },
    'append 元素非字符串': { 'paper:memgpt:questions': stored('append', [123]) },
    'append 类型不支持': { 'route-step:step-collab-3:purpose': stored('append', ['x']) },
    'insert remove op 不落 entries': { 'route-step:step-ov-a:': { op: 'remove', value: null, origin: OK_ORIGIN, proposalId: 'p', appliedAt: '2026-09-23T08:00:00.000Z', example: false } },
    'insert 边 evidence 名单外': { 'map-edge:map-edge-x:': stored('insert', { from: 'map-meth-paging', to: 'map-prog-budget', meaning: 'addresses：测试', evidence: ['tosem2025-acceptance'], source: { originType: 'content', note: '非引用', asOf: '2026-09-23' } }) },
    'insert 边缺 PF-07 声明': { 'map-edge:map-edge-x:': stored('insert', { from: 'map-meth-paging', to: 'map-prog-budget', meaning: 'addresses：测试', evidence: ['memgpt'], source: { originType: 'content', note: '编辑排定', asOf: '2026-09-23' } }) },
    'set map-edge evidence 名单外': { 'map-edge:map-edge-layers-budget:evidence': stored('set', ['swe-bench']) },
    'home-focus routeId 非法值': { 'home-focus:home:routeId': stored('set', 'trusted-rag') },
    'home-focus id 篡改': { 'home-focus:other:routeId': stored('set', 'cross-harness-collab') },
    'insert 步骤非 step-ov 命名': { 'route-step:step-sneak:': stored('insert', { kind: 'paper', paperId: 'memgpt', purpose: 'p。', readWhen: 'r。', anchor: { routeId: 'cross-harness-collab' } }) },
    'insert 目标不存在 paperId': { 'route-step:step-ov-a:': stored('insert', { kind: 'paper', paperId: 'ghost', purpose: 'p。', readWhen: 'r。', anchor: { routeId: 'cross-harness-collab' } }) },
    'insert 撞基线地图 id': { 'map-node:map-prog-budget:': stored('insert', { side: 'problem', label: '甲', summary: '乙', refs: ['memgpt'], source: { originType: 'self', note: 'n', asOf: '2026-09-23' } }) },
    'set 目标不存在': { 'route-step:step-ghost:purpose': stored('set', '合法文本') },
    'set 地图目标不存在': { 'map-node:map-ghost:label': stored('set', '甲') },
    'insert refs 无法解析': { 'map-node:map-prog-zz:': stored('insert', { side: 'problem', label: '甲', summary: '乙', refs: ['ghost-ref'], source: { originType: 'self', note: 'n', asOf: '2026-09-23' } }) },
    'insert 边端点不可解析': { 'map-edge:map-edge-zz:': stored('insert', { from: 'map-ghost-a', to: 'map-prog-budget', meaning: 'addresses：测试', evidence: ['memgpt'], source: { originType: 'content', note: '非引用', asOf: '2026-09-23' } }) },
    'insert 边改 addresses 侧别违例': { 'map-edge:map-edge-zz:': stored('insert', { from: 'map-prog-memory', to: 'map-prog-budget', meaning: 'addresses：测试', evidence: ['memgpt'], source: { originType: 'content', note: '非引用', asOf: '2026-09-23' } }) },
    '总额超限（+3 节点）': Object.fromEntries([1, 2, 3].map((i) => [`map-node:map-prog-xx${i}:`, stored('insert', { side: 'problem', label: `甲${i}`, summary: '乙', refs: ['memgpt'], source: { originType: 'self', note: 'n', asOf: '2026-09-23' } })])),
  };
  // 需基线才能判定的类（存在性/可解析性/侧别/总额）：有基线 ⇒ 拒绝；
  const needsBase = new Set([
    'insert 撞基线地图 id', 'insert 目标不存在 paperId', 'insert refs 无法解析', 'insert 边端点不可解析',
    'insert 边改 addresses 侧别违例', 'set 目标不存在', 'set 地图目标不存在', 'home-focus routeId 非法值', '总额超限（+3 节点）',
  ]);
  for (const [label, entries] of Object.entries(badEntries)) {
    const raw = wrapOverlay(entries);
    assert.equal(G.normalizeOverlay(JSON.parse(JSON.stringify(raw)), LIBRARY), null, `带基线应拒绝：${label}`);
    if (needsBase.has(label)) continue;
    // 结构/白名单/值级违例即使不给基线也必须拒绝（白名单不依赖内容解析）。
    assert.equal(G.normalizeOverlay(JSON.parse(JSON.stringify(raw))), null, `无基线也应拒绝（结构/白名单级）：${label}`);
  }
});

test('B1（导入与本机读取缝）：合法结构但内容违例的档 ⇒ loadOverlay corrupt（保留原文）、currentOverlay null、parseImportedOverlay 拒绝、importReplaceOverlay 拒绝；不写存储', async () => {
  const crafted = wrapOverlay({ 'paper:memgpt:title': stored('set', '伪造标题') });
  const storage = makeStorage({ [G.GUIDANCE_KEY]: JSON.stringify(crafted) });
  const loaded = G.loadOverlay(storage, LIBRARY);
  assert.equal(loaded.kind, 'corrupt');
  assert.equal(loaded.raw, JSON.stringify(crafted), '坏档原文保留供导出自查');
  assert.equal(storage.calls.filter(([op]) => op === 'setItem').length, 0, '读取/校验绝不写盘');
  assert.equal(G.currentOverlay(storage, LIBRARY), null, '内容违例档降级为基线显示（不生效）');
  const parsed = G.parseImportedOverlay(JSON.stringify(crafted), LIBRARY);
  assert.equal(parsed.status, 'reject');
  const r = await G.importReplaceOverlay({ storage: makeStorage(), navigatorLike: navLocks, incoming: crafted, base: LIBRARY });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'import-invalid');
  // tombstones 一致性：insert 撞 tombstone / 只残留对已封存 id 的条目 ⇒ corrupt
  const tombClash = wrapOverlay(
    { 'map-node:map-prog-dead:': stored('insert', { side: 'problem', label: '甲', summary: '乙', refs: ['memgpt'], source: { originType: 'self', note: 'n', asOf: '2026-09-23' } }) },
    { 'map-prog-dead': '2026-09-01T00:00:00.000Z' },
  );
  assert.equal(G.normalizeOverlay(tombClash, LIBRARY), null, 'insert 撞 tombstones ⇒ corrupt');
  const orphanSet = wrapOverlay(
    { 'route-step:step-ov-gone:purpose': stored('set', '文本') },
    { 'step-ov-gone': '2026-09-01T00:00:00.000Z' },
  );
  assert.equal(G.normalizeOverlay(orphanSet, LIBRARY), null, '对已封存 id 的残留条目 ⇒ corrupt');
  const badTomb = wrapOverlay({}, { 'step-collab-1': '2026-09-01T00:00:00.000Z' });
  assert.equal(G.normalizeOverlay(badTomb, LIBRARY), null, '基线 id 进 tombstones ⇒ corrupt（只有覆盖层自有 id 可封存）');
  // 合法导入档不受影响（回归）：干净覆盖层 normalize+currentOverlay 通过
  const good = wrapOverlay({ 'route-step:step-collab-3:purpose': stored('set', '合法改写。') });
  assert.ok(G.normalizeOverlay(good, LIBRARY));
  // applyProposal 对内容违例的本机当前档拒绝写入且保留原文
  const storage2 = makeStorage({ [G.GUIDANCE_KEY]: JSON.stringify(crafted) });
  const text = proposal([setChange('route-step', 'step-collab-3', 'purpose', '正常提案。')], { id: 'prop-b1-apply' });
  const v = G.validateProposal(text, LIBRARY, null);
  const r2 = await G.applyProposal({ storage: storage2, navigatorLike: navLocks, base: LIBRARY, proposalText: text, accepted: { [v.items[0].ref]: true }, previewSnapshot: { [v.items[0].ref]: v.items[0].baseCurrent } }, { now: FIXED_NOW });
  assert.equal(r2.ok, false);
  assert.equal(r2.reason, 'storage-corrupt');
  assert.equal(storage2.data.get(G.GUIDANCE_KEY), JSON.stringify(crafted), '被拒时坏档逐字节原样保留');
});

test('B3：set map-edge meaning 与 insert 同规则——改语义不得造出侧别/来源违例', async () => {
  const edge = LIBRARY.map.edges.find((e) => e.from === 'map-meth-paging' && e.to === 'map-prog-memory');
  assert.ok(edge, 'fixture：存在 方法→问题 的 addresses 边');
  // 正向：把某条 addresses 边的语义改成 conflicts（问题侧仍合法词汇）⇒ 预览
  const ok = proposal([{ op: 'set', target: { type: 'map-edge', id: edge.id, field: 'meaning' }, expectedBase: G.canonicalBaseline(LIBRARY, null, { type: 'map-edge', id: edge.id, field: 'meaning' }), value: 'conflicts：测试语义改写', reason: 'r' }], { id: 'prop-b3-ok' });
  assert.equal(G.validateProposal(ok, LIBRARY, null).status, 'preview');
  // 反向：把 depends-on（两端同为 problem 侧）的边改成 addresses ⇒ 拒绝（侧别违例）
  const sameSide = LIBRARY.map.edges.find((e) => {
    const f = LIBRARY.map.nodes.find((n) => n.id === e.from);
    const t = LIBRARY.map.nodes.find((n) => n.id === e.to);
    return f && t && f.side === 'problem' && t.side === 'problem';
  });
  assert.ok(sameSide, 'fixture：存在两端同为 problem 的边');
  const bad = proposal([{ op: 'set', target: { type: 'map-edge', id: sameSide.id, field: 'meaning' }, expectedBase: G.canonicalBaseline(LIBRARY, null, { type: 'map-edge', id: sameSide.id, field: 'meaning' }), value: 'addresses：伪装回应', reason: 'r' }], { id: 'prop-b3-bad' });
  const r = G.validateProposal(bad, LIBRARY, null);
  assert.equal(r.status, 'reject');
  assert.match(r.firstError, /侧别必须为方法→问题/);
  // 反向（来源规则）：inspires 的方法→问题边允许 advisor 来源，但把它改成 addresses 必须被拒。
  const advisorEdge = { op: 'insert', target: { type: 'map-edge', id: 'map-edge-b3-adv' }, value: { from: 'map-meth-paging', to: 'map-prog-memory', meaning: 'inspires：导师线索边', evidence: ['memgpt'], source: { originType: 'advisor', note: '转述，非引用', asOf: '2026-09-23' } }, reason: 'r' };
  const insV = G.validateProposal(proposal([advisorEdge], { id: 'prop-b3-ins' }), LIBRARY, null);
  assert.equal(insV.status, 'preview', 'inspires 两端问题侧＋advisor 来源合法（非 addresses/方法间）');
  const st = Object.fromEntries(insV.items.map((i) => [i.ref, true]));
  const snap = Object.fromEntries(insV.items.map((i) => [i.ref, i.baseCurrent ?? '']));
  const store = makeStorage();
  const ar = await G.applyProposal({ storage: store, navigatorLike: navLocks, base: LIBRARY, proposalText: proposal([advisorEdge], { id: 'prop-b3-ins' }), accepted: st, previewSnapshot: snap }, { now: FIXED_NOW });
  assert.ok(ar.ok);
  const ov = G.currentOverlay(store, LIBRARY);
  const flip = proposal([{ op: 'set', target: { type: 'map-edge', id: 'map-edge-b3-adv', field: 'meaning' }, expectedBase: G.canonicalBaseline(LIBRARY, ov, { type: 'map-edge', id: 'map-edge-b3-adv', field: 'meaning' }), value: 'addresses：伪装', reason: 'r' }], { id: 'prop-b3-flip' });
  const fr = G.validateProposal(flip, LIBRARY, ov);
  assert.equal(fr.status, 'reject', 'advisor 来源边不得改为 addresses 语义（R1 来源限制）');
  assert.match(fr.firstError, /R1 来源限制/);
});

// ---------- C 复核修复轮（C1 写前自检与累计 append 上限 / C2 撤销槽按基线校验） ----------

test('C1：累计 append 到上限在第 50 条仍可预览并写入，第 51 条于提案校验阶段整案拒绝且零写盘', async () => {
  // 先走真实链路：从 49 条累计到 50
  const acc49 = Array.from({ length: 49 }, (_, i) => `追問${i + 1}？`);
  const ov49 = wrapOverlay({ 'paper:memgpt:questions': stored('append', acc49) });
  assert.ok(G.normalizeOverlay(ov49, LIBRARY), '49 条累计合法');
  const storage = makeStorage({ [G.GUIDANCE_KEY]: JSON.stringify(ov49) });
  let ov = G.currentOverlay(storage, LIBRARY);
  const text50 = proposal([{ op: 'append', target: { type: 'paper', id: 'memgpt', field: 'questions' }, expectedBase: G.canonicalBaseline(LIBRARY, ov, { type: 'paper', id: 'memgpt', field: 'questions' }), value: '追問50？', reason: 'r' }], { id: 'prop-c1-50' });
  assert.equal(G.validateProposal(text50, LIBRARY, ov).status, 'preview', '第 50 条（到限）仍可进预览');
  const ok50 = await applyAll(storage, text50);
  assert.ok(ok50.ok, JSON.stringify(ok50));
  assert.equal(G.currentOverlay(storage, LIBRARY).entries['paper:memgpt:questions'].value.length, 50);
  // 第 51 条：提案校验阶段整案拒绝（不进预览、不写盘、旧档逐字节不变）
  ov = G.currentOverlay(storage, LIBRARY);
  const before = storage.data.get(G.GUIDANCE_KEY);
  const writesBefore = storage.calls.filter(([op]) => op === 'setItem').length;
  const text51 = proposal([{ op: 'append', target: { type: 'paper', id: 'memgpt', field: 'questions' }, expectedBase: G.canonicalBaseline(LIBRARY, ov, { type: 'paper', id: 'memgpt', field: 'questions' }), value: '第51问？', reason: 'r' }], { id: 'prop-c1-51' });
  const v51 = G.validateProposal(text51, LIBRARY, ov);
  assert.equal(v51.status, 'reject');
  assert.match(v51.firstError, /累计上限 50 条/);
  const r51 = await G.applyProposal({ storage, navigatorLike: navLocks, base: LIBRARY, proposalText: text51, accepted: { 'paper:memgpt:questions': true }, previewSnapshot: { 'paper:memgpt:questions': '过期快照' } }, { now: FIXED_NOW });
  assert.equal(r51.ok, false);
  assert.equal(r51.reason, 'revalidate-failed', '确认瞬间重验同样拒绝（含伪造的过期快照）');
  assert.equal(storage.data.get(G.GUIDANCE_KEY), before, '拒绝后旧状态逐字节不变');
  assert.equal(storage.calls.filter(([op]) => op === 'setItem').length, writesBefore, '拒绝路径零新增写入');
});

test('C1：writeOverlay 先以 normalizeOverlay(候选, base) 写前自检——非法候选零 setItem；合法候选写入并回读一致；回读失败如实报告', () => {
  const storage = makeStorage({ [V3_KEY]: V3_FIXTURE });
  const bad = wrapOverlay({ 'route-step:step-ghost:purpose': stored('set', '结构合法但目标不存在') }); // 只有带基线的完整校验能拒
  const r = G.writeOverlay(storage, bad, LIBRARY);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'write-precheck-failed');
  assert.equal(storage.calls.filter(([op]) => op === 'setItem').length, 0, '写前校验失败绝不触碰存储');
  assert.equal(storage.data.get(V3_KEY), V3_FIXTURE, 'v3 不受影响');
  const good = wrapOverlay({ 'route-step:step-collab-3:purpose': stored('set', '合法改写。') });
  assert.ok(G.writeOverlay(storage, good, LIBRARY).ok);
  const back = G.loadOverlay(storage, LIBRARY);
  assert.equal(back.kind, 'ok');
  assert.equal(back.overlay.entries['route-step:step-collab-3:purpose'].value, '合法改写。');
  // 回读失败（setItem 成功但存储读回不可辨认）⇒ write-verify-failed，并如实说明存储当前不可信
  const flaky = { getItem: () => '{broken', setItem: () => {} };
  const r3 = G.writeOverlay(flaky, good, LIBRARY);
  assert.equal(r3.ok, false);
  assert.equal(r3.reason, 'write-verify-failed');
  assert.match(r3.message, /不可信|导出自查/);
});

test('C2：undoSlot.overlayBefore 与整档同按基线校验——塞入非法目标条目的快照 ⇒ 载入即 corrupt、撤销不可用、原文不变', async () => {
  const slotPoison = wrapOverlay({ 'route-step:step-collab-3:purpose': stored('set', '当前生效改写。') });
  slotPoison.seq = 5;
  slotPoison.history = [{ seq: 5, kind: 'apply', proposalId: 'prop-c2', origin: OK_ORIGIN, appliedAt: '2026-09-23T08:00:00.000Z', summary: 's', acceptedCount: 1, rejectedCount: 0, example: false }];
  slotPoison.undoSlot = {
    overlayBefore: wrapOverlay({ 'route-step:step-ghost:purpose': stored('set', '快照里的非法条目（目标不存在）') }), // 结构合法、仅基线校验能拦
    proposalId: 'prop-c2',
    origin: OK_ORIGIN,
    example: false,
  };
  // 不给 base 时结构层放行（历史行为）；给 base 必须整档拒绝——载入/渲染/撤销路径全部带 base。
  assert.equal(G.normalizeOverlay(slotPoison, LIBRARY), null, '撤销槽按基线校验：坏快照 ⇒ 整档不可辨认');
  const raw = JSON.stringify(slotPoison);
  const storage = makeStorage({ [G.GUIDANCE_KEY]: raw });
  const loaded = G.loadOverlay(storage, LIBRARY);
  assert.equal(loaded.kind, 'corrupt');
  assert.equal(loaded.raw, raw, '坏档原文保留供导出自查');
  assert.equal(G.currentOverlay(storage, LIBRARY), null, '页面按基线降级显示');
  const u = await G.undoLastApply({ storage, navigatorLike: navLocks, base: LIBRARY }, { now: FIXED_NOW });
  assert.equal(u.ok, false);
  assert.equal(u.reason, 'storage-corrupt', '撤销在恢复坏快照之前即被拒绝');
  assert.equal(storage.calls.filter(([op]) => op === 'setItem').length, 0, '撤销拒绝时零写入');
  assert.equal(storage.data.get(G.GUIDANCE_KEY), raw, '原文逐字节不变');
  // 正向回归：真实链路产生的 undoSlot（快照对同一基线有效）照常可通过
  const real = makeStorage();
  assert.ok((await applyAll(real, proposal([setChange('route-step', 'step-collab-3', 'purpose', '真实快照。')], { id: 'prop-c2-real' }))).ok);
  assert.equal(G.loadOverlay(real, LIBRARY).kind, 'ok');
  const u2 = await G.undoLastApply({ storage: real, navigatorLike: navLocks, base: LIBRARY }, { now: FIXED_NOW });
  assert.ok(u2.ok, '合法撤销槽不受收紧影响');
});
