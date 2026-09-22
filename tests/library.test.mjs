// tests/library.test.mjs —— 个人研究平台测试（PLAN-004 / DESIGN-005 实施后）。
// 覆盖：内容契约与全关联可解析（validateLibrary + 真实 LIBRARY 计数与深度分布）、深度权威与兼容适配、
// hash 路由（含新增首页）、方向与阶段分组、首页四区与首次使用、分级模板门槛（deep/standard/quick/entry）、
// block 白名单与渲染安全（源码扫描 + 无 innerHTML）、技术主干独立（不要求先选方向）与可开始门槛、
// 资源字段与核查层次、旧公开内容支线保留覆盖级别、简报目标解析与外链 https 白名单、空态文案、
// index/legacy 接线与 CSP 兼容、styles 新旧两段契约（legacy 段哨兵 + 新版选择器全部限定 lib +
// 字体职责与关键视觉值）、事实字段白名单（id/url/路线顺序/核查日期）与真实性语义。

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { readFile } from 'node:fs/promises';
import { promises as fsp } from 'node:fs';

import { startServer, BIND_HOST } from '../server.mjs';
import { DiscoveryError } from '../discovery.mjs';
import { LIBRARY } from '../public/library-content.js';
import {
  buildHash,
  buildContextHash,
  briefItemTarget,
  briefSourceLabel,
  deliveredDepthOf,
  recommendedDepthOf,
  activeDirections,
  directionStatusOf,
  directionTracks,
  depthBasisLabel,
  featuredTechnicalRoutes,
  getMaterial,
  inferStartContext,
  MULTIAGENT_LAB_PATH,
  MULTIAGENT_LAB_SECTIONS,
  nodeTargetError,
  nodeTargetKey,
  resolveNodeTarget,
  targetPositions,
  trackEntries,
  trackPosition,
  CARD_KIND_LABELS,
  coverageRows,
  coreTechnicalRoutes,
  advancedTechnicalRoutes,
  EMPTY_NOTICES,
  findResource,
  getBrief,
  getDirection,
  getPaper,
  getTechnicalRoute,
  libraryStatus,
  nextStepAfter,
  PAPER_SECTION_TITLES,
  paperBadges,
  paperOutline,
  paperSourceLink,
  parseHash,
  routeEntries,
  routeStages,
  routeStartable,
  routesContaining,
  safeExternalHref,
  sectionAnchorId,
  sectionTitle,
  sortDirections,
  unitResources,
  validateLibrary,
} from '../public/library.js';

const readPublic = (name) => readFile(new URL(`../public/${name}`, import.meta.url), 'utf8');

// ---------- 内容契约：真实 LIBRARY ----------

test('真实 LIBRARY 通过契约校验：跨引用可解析、深度与依据一致、block 合法', () => {
  const result = validateLibrary(LIBRARY);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test('真实 LIBRARY 规模（A14，008.2）：4 方向（start 5/4/0/0、archive 3/9/8/11）、49 篇（1 deep + 2 standard + 42 quick + 4 entry，含 11 篇经典）、2 材料、11 条技术路线、2 期简报（09-21 期 3 条 + 09-22 空窗口期）', () => {
  assert.equal(LIBRARY.directions.length, 4);
  assert.deepEqual(
    LIBRARY.directions.map((d) => [d.id, d.status]),
    [
      ['cross-harness-collab', 'active'],
      ['code-agent-verification', 'active'],
      ['trusted-rag', 'deferred'],
      ['graph-harmful-fusion', 'deferred'],
    ],
  );
  assert.deepEqual(
    LIBRARY.directions.map((d) => [trackEntries(LIBRARY, d.id, 'start').length, trackEntries(LIBRARY, d.id, 'archive').length]),
    [[5, 3], [4, 9], [0, 8], [0, 11]],
  );
  assert.equal(LIBRARY.papers.length, 49);
  const byDepth = { deep: 0, standard: 0, quick: 0, entry: 0 };
  for (const paper of LIBRARY.papers) byDepth[deliveredDepthOf(paper)] += 1;
  assert.deepEqual(byDepth, { deep: 1, standard: 2, quick: 42, entry: 4 });
  assert.equal(LIBRARY.papers.filter((p) => p.collection === 'foundations').length, 11);
  // 原 45 篇相对顺序不变，新四篇追加在尾部（05 §2）。
  assert.deepEqual(LIBRARY.papers.slice(45).map((p) => p.id), ['beyond-frameworks', 'memgpt', 'handoff-tax', 'handoff-debt']);
  assert.equal(LIBRARY.materials.length, 2);
  assert.deepEqual(LIBRARY.materials.map((m) => m.coverage.mode), ['editorial-primer', 'editorial-primer']);
  // 包4：13 路线 / 26 单元 / featured 恰好三条（order 1–3），10 个 featured 单元全 ready（A11）。
  assert.equal(LIBRARY.technicalRoutes.length, 13);
  assert.equal(LIBRARY.technicalRoutes.reduce((n, t) => n + (t.units ?? []).length, 0), 26);
  assert.equal(coreTechnicalRoutes(LIBRARY).length, 5, 'T4 升 featured 后旧主干剩 5 条');
  assert.equal(advancedTechnicalRoutes(LIBRARY).length, 5);
  const featured = featuredTechnicalRoutes(LIBRARY);
  assert.deepEqual(featured.map((r) => r.id), ['tech-multiagent', 'tech-rag', 'tech-graph-simple']);
  assert.deepEqual(featured.map((r) => r.order), [1, 2, 3]);
  const featuredUnits = featured.flatMap((r) => r.units);
  assert.equal(featuredUnits.length, 10);
  assert.ok(featuredUnits.every((u) => (u.availability ?? 'ready') === 'ready'), '本期 10 个 featured 单元全 ready');
  for (const route of featured) {
    for (const unit of route.units) {
      if (Array.isArray(unit.resourceIds) && unit.resourceIds.length > 0) {
        const primaries = unit.resourceIds
          .map((id) => (route.resources ?? []).find((r) => r.id === id))
          .filter((r) => r?.primary === true);
        assert.equal(primaries.length, 1, route.id + '/' + unit.id + ' ready 资源型单元恰有一个主资源');
      } else {
        assert.ok(Array.isArray(unit.lesson?.blocks) && unit.lesson.blocks.length > 0, route.id + '/' + unit.id + ' 编辑课单元 lesson 非空');
      }
      if (unit.labPath != null) {
        assert.equal(unit.labPath, '/learning/multiagent-lab.md');
        assert.ok(['ma-u1', 'ma-u2', 'ma-u3', 'ma-u4'].includes(unit.labSection));
      }
    }
  }
  // 旧 T4 三单元 id 保留在 tech-rag 内；旧 tech-t4 只作别名，不复制数据。
  assert.deepEqual(getTechnicalRoute(LIBRARY, 'tech-rag').units.map((u) => u.id), ['t4-u1', 't4-u2', 't4-u3']);
  assert.equal(getTechnicalRoute(LIBRARY, 'tech-t4').id, 'tech-rag', '旧 hash 显式别名到 tech-rag');
  assert.equal(LIBRARY.technicalRoutes.filter((t) => t.id === 'tech-t4').length, 0, '不复制第二条 RAG 数据');
  assert.equal(LIBRARY.briefs.length, 2);
  assert.deepEqual(LIBRARY.briefs.map((b) => b.id), ['brief-2026-09-21', 'brief-2026-09-22']);
  assert.equal(LIBRARY.briefs[0].items.length, 3);
  assert.equal(LIBRARY.briefs[1].items.length, 0, '09-22 空窗口期如实为 0 条');
  // 首页 typed startHere（01 D）：真实库只保留新字段。
  assert.deepEqual(LIBRARY.home.startHere, {
    kind: 'article',
    materialId: 'mat-cross-harness-map',
    routeId: 'cross-harness-collab',
    track: 'start',
  });
  assert.equal(LIBRARY.home.startHerePaperId, undefined, '真实库不得保留旧 startHerePaperId');
});

test('深度权威：deliveredDepth 唯一可写；旧 reading 只做只读派生，deep 不降为 standard', () => {
  assert.equal(deliveredDepthOf({ deliveredDepth: 'deep' }), 'deep');
  assert.equal(deliveredDepthOf({ deliveredDepth: 'standard', reading: 'quick' }), 'standard');
  assert.equal(deliveredDepthOf({ reading: 'standard' }), 'standard');
  assert.equal(deliveredDepthOf({ reading: 'quick' }), 'quick');
  assert.equal(deliveredDepthOf({ reading: 'entry' }), 'entry');
  assert.equal(deliveredDepthOf({}), null);
  assert.equal(recommendedDepthOf({ recommendedDepth: 'deep', deliveredDepth: 'quick' }), 'deep');
  assert.equal(recommendedDepthOf({ deliveredDepth: 'standard' }), 'standard');
  for (const paper of LIBRARY.papers) {
    assert.equal(typeof paper.deliveredDepth, 'string', paper.id);
    assert.equal(paper.reading, undefined, `${paper.id} 不应再保留旧 reading 字段`);
  }
});

test('分级门槛：deep 有正文结构与细读/文献/待核问题；quick 只有摘要；entry 只有身份', () => {
  for (const paper of LIBRARY.papers) {
    const depth = deliveredDepthOf(paper);
    if (depth === 'deep') {
      assert.ok(paper.sections.length >= 3, `${paper.id} deep 至少 3 个正文章节`);
      assert.ok(paper.overview?.length > 0 && paper.prereq?.length > 0, `${paper.id} deep 缺概览或先修`);
      assert.ok(paper.deepRead.length >= 2, `${paper.id} deep 至少 2 处细读`);
      assert.ok(paper.references.length >= 1, `${paper.id} deep 至少 1 条相关文献`);
      assert.ok(paper.openQuestions.length >= 1, `${paper.id} deep 需列出待核问题`);
      assert.ok(['full-text', 'partial-text'].includes(paper.coverage.mode), paper.id);
    }
    if (depth === 'standard') {
      assert.ok(paper.sections.length >= 1, paper.id);
      assert.ok(['full-text', 'partial-text'].includes(paper.coverage.mode), paper.id);
    }
    if (depth === 'quick') {
      assert.equal(paper.sections.length, 0, paper.id);
      // 008.1 §2C：quick 可为摘要级，也可为「摘要+指定正文已核」（partial-text，sections 必须非空）。
      assert.ok(['abstract', 'partial-text'].includes(paper.coverage.mode), paper.id);
      if (paper.coverage.mode === 'partial-text') {
        assert.ok(paper.coverage.sections.length > 0, paper.id + " partial-text quick 必须登记已核正文范围");
      }
    }
    if (depth === 'entry') {
      assert.equal(paper.sections.length, 0, paper.id);
      assert.equal(paper.deepRead.length, 0, paper.id);
      assert.equal(paper.questions.length, 0, paper.id);
      assert.equal(paper.coverage.mode, 'metadata', paper.id);
    }
    // 推荐精读而没读正文时，不得宣称精读完成
    if (paper.recommendedDepth === 'deep' && depth !== 'deep') {
      assert.ok(CARD_KIND_LABELS[depth].includes('摘要级') || CARD_KIND_LABELS[depth].includes('入口') || CARD_KIND_LABELS[depth].includes('选读'), paper.id);
    }
  }
});

test('方向说明完整：研究对象、当前研究情况与 asOf、选择理由、限制、来源均可解析', () => {
  for (const direction of LIBRARY.directions) {
    for (const field of ['overview', 'stateOfField', 'whyChoose', 'limits']) {
      assert.ok(direction[field] && direction[field].length > 20, `${direction.id} 缺 ${field}`);
    }
    assert.match(direction.asOf, /^\d{4}-\d{2}-\d{2}$/, direction.id);
    assert.ok(Array.isArray(direction.openQuestions) && direction.openQuestions.length > 0, direction.id);
    for (const source of direction.sources ?? []) {
      assert.ok(safeExternalHref(source.url), `${direction.id} 来源非 https：${source.url}`);
    }
  }
  // 008.2：双轨路线。代码验证 start 4 步、archive 9 步沿原谱系；主方向 start 5 步。
  const codeStart = trackEntries(LIBRARY, 'code-agent-verification', 'start');
  assert.deepEqual(codeStart.map((e) => e.materialId ?? e.paperId), ['mat-read-empirical', 'tosem2025-acceptance', 'agentless', 'swe-bench']);
  const codeArchive = trackEntries(LIBRARY, 'code-agent-verification', 'archive');
  assert.equal(codeArchive.length, 9);
  assert.equal(codeArchive[1].paperId, 'le2018-overfitting', 'archive 顺序沿原路线保留');
  const collabStart = trackEntries(LIBRARY, 'cross-harness-collab', 'start');
  assert.deepEqual(collabStart.map((e) => e.id), ['step-collab-1', 'step-collab-2', 'step-collab-3', 'step-collab-4', 'step-collab-5']);
  assert.equal(collabStart[0].materialId, 'mat-cross-harness-map');
  assert.equal(collabStart[3].passMode, 'core');
  const collabArchive = trackEntries(LIBRARY, 'cross-harness-collab', 'archive');
  assert.deepEqual(collabArchive.map((e) => e.id), ['archive-collab-survey', 'archive-collab-coala', 'archive-collab-context']);
  assert.ok(collabArchive.every((e) => e.external), '主方向 archive 全部为外链目录');
});

test('事实字段与基线一致：45 篇 id/url、三条路线顺序、PLAN-005 前 20 篇 url 不变', () => {
  const expectedUrls = {
    'tosem2025-acceptance': 'https://nmaguirre.github.io/assets/pdf/tosem2025.pdf',
    'le2018-overfitting': 'https://doi.org/10.1007/s10664-017-9577-2',
    'ye2021-assessment': 'https://doi.org/10.1007/s10664-020-09920-w',
    appt: 'https://github.com/iSEngLab/APPT',
    compass: 'https://arxiv.org/abs/2602.07561',
    'rag-survey': 'https://arxiv.org/abs/2312.10997',
    'astute-rag': 'https://aclanthology.org/2025.acl-long.1476/',
    'sufficient-context': 'https://arxiv.org/abs/2411.06037',
    hoh: 'https://aclanthology.org/2025.acl-long.301/',
    'timely-rag': 'https://arxiv.org/abs/2609.11572',
    'spectral-tutorial': 'https://arxiv.org/abs/0711.0189',
    sure: 'https://doi.org/10.1109/TPAMI.2022.3155499',
    'camera-incomplete-mv':
      'https://xlearning-lab.com/assets/2026-TPAMI-Community-aware-Multi-view-Representation-Learning-with-Incomplete-Information.pdf',
    oagl: 'https://researchportal.northumbria.ac.uk/en/publications/one-step-adaptive-graph-learning-for-incomplete-multiview-subspac/',
    bridge:
      'https://openaccess.thecvf.com/content/ICCV2025/html/Jiang_A_Unified_Framework_to_BRIDGE_Complete_and_Incomplete_Deep_Multi-View_ICCV_2025_paper.html',
    toolformer: 'https://arxiv.org/abs/2302.04761',
    toolllm: 'https://arxiv.org/abs/2307.16789',
    'rag-original': 'https://arxiv.org/abs/2005.11401',
    lora: 'https://arxiv.org/abs/2106.09685',
    'peft-guide': 'https://arxiv.org/abs/2303.15647',
  };
  // 原 45 篇 id/url 不变，新四篇追加（008.2）。
  assert.equal(LIBRARY.papers.length, 49);
  for (const [id, url] of Object.entries(expectedUrls)) {
    assert.equal(getPaper(LIBRARY, id)?.url, url, `PLAN-005 前条目 ${id} 的 url 不得改动`);
  }
  assert.deepEqual(
    LIBRARY.directions.map((d) => d.id),
    ['cross-harness-collab', 'code-agent-verification', 'trusted-rag', 'graph-harmful-fusion'],
  );
  // 三条旧谱系移入 archiveRoute 后顺序不变（A14）。
  assert.deepEqual(trackEntries(LIBRARY, 'trusted-rag', 'archive').map((e) => e.paperId), [
    'rag-survey',
    'freshllms',
    'astute-rag',
    'sufficient-context',
    'self-rag',
    'crag',
    'hoh',
    'timely-rag',
  ]);
  assert.deepEqual(trackEntries(LIBRARY, 'graph-harmful-fusion', 'archive').map((e) => e.paperId), [
    'spectral-tutorial',
    'gcn',
    'gat',
    'feature-propagation',
    'sure',
    'camera-incomplete-mv',
    'oagl',
    'nettack',
    'metattack',
    'gnnguard',
    'bridge',
  ]);
  // 插入不得打乱既有论文的相对顺序（相对原 45 篇聚合顺序）。
  const baseline45 = expectedUrls; // 前 20 篇 url 已逐项核对；其余旧 id 通过顺序断言覆盖
  const oldIdsInOrder = LIBRARY.papers.slice(0, 45).map((p) => p.id);
  assert.equal(oldIdsInOrder[0], 'tosem2025-acceptance');
  assert.equal(oldIdsInOrder[44], 'voyager');
  for (const [directionId, originalOrder] of [
    ['code-agent-verification', ['tosem2025-acceptance', 'le2018-overfitting', 'ye2021-assessment', 'appt', 'compass']],
    ['trusted-rag', ['rag-survey', 'astute-rag', 'sufficient-context', 'hoh', 'timely-rag']],
    ['graph-harmful-fusion', ['spectral-tutorial', 'sure', 'camera-incomplete-mv', 'oagl', 'bridge']],
  ]) {
    const actual = trackEntries(LIBRARY, directionId, 'archive').map((e) => e.paperId).filter((id) => originalOrder.includes(id));
    assert.deepEqual(actual, originalOrder, `${directionId} 既有论文相对顺序不得变化`);
  }
  void baseline45;
});

test('真实性语义保留：AI 整理、非本人已读、引用关系区分、简报限流非穷尽', () => {
  const notices = LIBRARY.meta.notices.join('\n');
  assert.match(notices, /AI 依据公开原文整理/);
  assert.match(notices, /不代表本人已经读过/);
  const scope = LIBRARY.briefs[0].scope;
  assert.match(scope, /回溯补记/);
  assert.match(scope, /98 条/);
  assert.match(scope, /启发式排序，不是质量判断/);
  assert.match(scope, /正文未核对/);
  // 摘要级 scope 不引用百分比
  assert.doesNotMatch(scope, /\d+(\.\d+)?%/);
  // 空窗口期如实说明滞后
  assert.match(LIBRARY.briefs[1].scope, /索引滞后/);
  assert.match(LIBRARY.briefs[1].scope, /不凑数/);
  // deep 卡必须把真实引用与编辑安排分开
  const astute = getPaper(LIBRARY, 'astute-rag');
  const relations = new Set(astute.references.map((r) => r.relation));
  assert.ok(relations.has('citation'), 'deep 卡应有真实引用条目');
  assert.ok(relations.has('editorial'), 'deep 卡应区分编辑安排的相邻阅读');
});

test('可见文案不露出内部机器词：deliveredDepth/role/block 代码、grad-radar、scout、本轮等', () => {
  const parts = [];
  for (const d of LIBRARY.directions) {
    parts.push(d.title, d.summary ?? '', d.overview ?? '', d.stateOfField ?? '', d.whyChoose ?? '', d.limits ?? '');
    const tracks = directionTracks(LIBRARY, d);
    for (const track of [tracks.start, tracks.archive]) {
      for (const s of track) {
        if (s.external) parts.push(s.title ?? '', s.role ?? '', s.note ?? '');
        else parts.push(s.purpose ?? '', s.readWhen ?? '', s.check ?? '', s.stage ?? '');
      }
    }
  }
  for (const p of LIBRARY.papers) {
    parts.push(p.lead, p.displayTitle ?? '', ...p.reasons, ...p.questions, ...p.deepRead, ...(p.openQuestions ?? []));
    for (const s of p.sections ?? []) {
      parts.push(s.heading);
      for (const block of s.blocks ?? []) {
        if (block.kind === 'paragraph') parts.push(...block.spans.map((sp) => sp.text));
        if (block.kind === 'list') parts.push(...block.items.flat().map((sp) => sp.text ?? ''));
        if (block.kind === 'comparison') parts.push(block.caption ?? '', ...block.rows.flat());
        if (block.kind === 'callout') parts.push(block.title ?? '');
        if (block.kind === 'formula') parts.push(block.note ?? '');
      }
    }
    for (const ref of p.references ?? []) parts.push(ref.reason ?? '', ref.sourceLocator ?? '');
  }
  for (const t of LIBRARY.technicalRoutes) {
    parts.push(t.title, t.capability, t.summary, t.prerequisites, t.applicability, t.pendingNote ?? '');
    for (const u of t.units ?? []) {
      parts.push(u.title, u.goal, u.focus ?? '', u.selfCheck, u.optionalPractice ?? '', u.skipWhen ?? '', u.prerequisites ?? '');
    }
    for (const r of t.resources ?? []) parts.push(r.title, r.versionNote);
  }
  for (const b of LIBRARY.briefs) {
    parts.push(b.scope);
    for (const i of b.items) parts.push(i.reason, i.summary, i.tier);
  }
  parts.push(...LIBRARY.meta.notices, LIBRARY.home.title, LIBRARY.home.intro);
  for (const zone of LIBRARY.home.zones) parts.push(zone.purpose, zone.howToUse);
  const text = parts.join('\n');
  for (const banned of [
    '——core',
    '——relevant',
    'needs_background：',
    'partial-text',
    'full-text',
    'quick 卡',
    'standard 卡',
    'deep 卡',
    'grad-radar',
    '本轮',
    '（quick',
    '（standard',
    '（deep',
    'deliveredDepth',
    'recommendedDepth',
    'checkLevel',
    'resourceIds',
  ]) {
    assert.ok(!text.includes(banned), `可见文案不应包含内部词：${banned}`);
  }
});

// ---------- hash 路由（含首页） ----------

test('parseHash：空 hash 进入首页，五入口与直达视图齐备，非法输入为 null', () => {
  assert.deepEqual(parseHash(null), { view: 'home', id: null });
  assert.deepEqual(parseHash(''), { view: 'home', id: null });
  assert.deepEqual(parseHash('#'), { view: 'home', id: null });
  assert.deepEqual(parseHash('#/'), { view: 'home', id: null });
  assert.deepEqual(parseHash('#/home'), { view: 'home', id: null });
  assert.deepEqual(parseHash('#/directions'), { view: 'directions', id: null });
  assert.deepEqual(parseHash('#/papers'), { view: 'papers', id: null });
  assert.deepEqual(parseHash('#/learn'), { view: 'learn', id: null });
  assert.deepEqual(parseHash('#/brief'), { view: 'brief', id: null });
  assert.deepEqual(parseHash('#/paper/astute-rag'), { view: 'paper', id: 'astute-rag' });
  assert.deepEqual(parseHash('#/route/code-agent-verification'), { view: 'route', id: 'code-agent-verification' });
  assert.deepEqual(parseHash('#/learn/tech-t3'), { view: 'learnRoute', id: 'tech-t3' });
  assert.deepEqual(parseHash('#/brief/brief-2026-09-15'), { view: 'briefItem', id: 'brief-2026-09-15' });
  for (const bad of ['#/unknown', '#/paper', '#/paper/a/b', '#/PAPER/x', '#/paper/..', '#/paper/.', '#/paper/%zz', 'papers', '#home']) {
    assert.equal(parseHash(bad), null, bad);
  }
});

test('buildHash 与 parseHash 互逆（含需编码的 id 与首页）', () => {
  for (const [view, id] of [['paper', 'astute-rag'], ['route', 'code-agent-verification'], ['learn', 'tech-t1'], ['paper', 'a b/c']]) {
    const hash = buildHash(view, id);
    const parsed = parseHash(hash);
    assert.equal(parsed.id, id, hash);
  }
  assert.deepEqual(parseHash(buildHash('home')), { view: 'home', id: null });
});

// ---------- 首页与方向 ----------

test('首页：五区用途与入口齐备，首读来自编辑设置且不叫“继续阅读”，首次使用三步', () => {
  const home = LIBRARY.home;
  assert.equal(typeof home.title, 'string');
  assert.ok(home.intro.length > 10);
  // REWORK-007 §2：区序按每日回访价值（精选→论文→方向→技术→经典），数据与渲染同序。
  assert.deepEqual(home.zones.map((z) => z.key), ['brief', 'papers', 'directions', 'learn', 'foundations']);
  for (const zone of home.zones) {
    assert.ok(zone.purpose.length > 15, zone.key);
    assert.ok(zone.howToUse.length > 10, zone.key);
    assert.match(zone.entryHash, /^#\//, zone.key);
  }
  // 008.2（01 D）：typed startHere 指向主方向第一步（站内问题导读）。
  assert.deepEqual(home.startHere, { kind: 'article', materialId: 'mat-cross-harness-map', routeId: 'cross-harness-collab', track: 'start' });
  assert.ok(getMaterial(LIBRARY, home.startHere.materialId), 'startHere 材料必须可解析');
  assert.equal(getPaper(LIBRARY, home.startHere.materialId), null, '材料 id 不得送给 getPaper');
  assert.equal(home.startHerePaperId, undefined, '真实库不得保留旧 startHerePaperId');
  assert.equal(home.firstUse.length, 3);
  const homeText = `${home.title}${home.intro}${home.firstUse.map((s) => s.title + s.text).join('')}`;
  assert.doesNotMatch(homeText, /继续阅读/);
  assert.doesNotMatch(homeText, /已读 \d|连续天数|学习时长/);
});

// ---------- 技术学习：独立主干与可开始门槛 ----------

test('旧主干（core 五条，T4 已升 featured）：均可开始、单元数真实、不要求先选方向', () => {
  const core = coreTechnicalRoutes(LIBRARY);
  assert.equal(core.length, 5);
  for (const route of core) {
    assert.ok(route.units.length >= 3, `${route.id} 至少 3 个单元`);
    assert.ok(routeStartable(LIBRARY, route), `${route.id} 缺少可开始单元`);
    for (const unit of route.units) {
      const { primary } = unitResources(route, unit);
      assert.ok(primary, `${route.id}/${unit.id} 缺少主资源`);
      assert.equal(primary.primary, true);
      assert.ok(primary.checkedAt && primary.access && primary.access !== 'unknown', `${unit.id} 主资源未核查或访问条件不明`);
      assert.ok(unit.selfCheck.length > 5, unit.id);
    }
  }
  for (const route of LIBRARY.technicalRoutes) {
    assert.ok(route.relatedPaperIds === undefined || Array.isArray(route.relatedPaperIds), `${route.id} relatedPaperIds 可空但必须是数组`);
    for (const paperId of route.relatedPaperIds ?? []) {
      assert.ok(getPaper(LIBRARY, paperId), `${route.id} 关联论文无法解析：${paperId}`);
    }
  }
  // 主干之间不重复 id；资源 id 在路线内唯一
  const routeIds = new Set(LIBRARY.technicalRoutes.map((r) => r.id));
  assert.equal(routeIds.size, LIBRARY.technicalRoutes.length);
});

test('技术资源字段完整：provider/语言/格式/核查日期/核查层次/访问条件/版本说明', () => {
  let count = 0;
  for (const route of LIBRARY.technicalRoutes) {
    for (const resource of route.resources ?? []) {
      count += 1;
      for (const field of ['id', 'title', 'provider', 'url', 'language', 'format', 'checkedAt', 'checkLevel', 'access', 'versionNote']) {
        assert.ok(resource[field], `${route.id}/${resource.id} 缺 ${field}`);
      }
      assert.ok(safeExternalHref(resource.url), resource.id);
      assert.ok(['section', 'chapter', 'page', 'site', 'directory'].includes(resource.checkLevel), resource.id);
      assert.ok(['open', 'login', 'paid', 'unknown'].includes(resource.access), resource.id);
      assert.ok(findResource(route, resource.id), resource.id);
    }
  }
  assert.ok(count >= 10, `资源数量过少：${count}`);
});

test('按需支线：保留旧公开内容且不升级覆盖级别；RAG 综述不重复造卡', () => {
  const advanced = advancedTechnicalRoutes(LIBRARY);
  assert.ok(advanced.length >= 4);
  const toolBranch = getTechnicalRoute(LIBRARY, 'tech-adv-tool-research');
  assert.deepEqual(toolBranch.relatedPaperIds, ['toolformer', 'toolllm']);
  for (const id of ['toolformer', 'toolllm', 'lora', 'peft-guide', 'rag-original']) {
    const paper = getPaper(LIBRARY, id);
    assert.ok(paper, id);
    assert.equal(deliveredDepthOf(paper), 'quick', `${id} 应保留摘要级覆盖，不得升级为已精读`);
  }
  const surveyIds = LIBRARY.papers.filter((p) => p.title.includes('Retrieval-Augmented Generation for Large Language Models')).map((p) => p.id);
  assert.deepEqual(surveyIds, ['rag-survey']);
});

// ---------- 内容契约：合成 fixture 与破坏用例 ----------

function validLibrary() {
  return {
    meta: {},
    home: {
      title: '研究、阅读与技术学习',
      intro: '首页说明',
      updatedOn: '2026-09-15',
      startHerePaperId: 'p1',
      zones: [{ key: 'directions', title: '方向与路线', purpose: '用途说明', howToUse: '怎么用', entryLabel: '进入', entryHash: '#/directions' }],
      firstUse: [{ title: '先看方向', text: '说明' }],
    },
    directions: [
      {
        id: 'd1',
        order: 1,
        title: '方向一',
        summary: 's',
        overview: '研究对象说明',
        stateOfField: '当前研究情况',
        asOf: '2026-09-15',
        whyChoose: '选择理由',
        limits: '限制与不适用条件',
        openQuestions: ['追问一'],
        sources: [{ label: '来源一', url: 'https://arxiv.org/abs/1' }],
        route: [
          { paperId: 'p1', stage: '建立问题', required: '必读', purpose: 'w', readWhen: 't', check: 'c' },
          { paperId: 'p2', stage: '理解方法', required: '选读', purpose: 'w2', readWhen: 't2', check: 'c2' },
        ],
      },
    ],
    papers: [
      {
        id: 'p1',
        title: 'P1',
        displayTitle: '论文一',
        url: 'https://arxiv.org/abs/1',
        type: 'method',
        importance: 'core',
        difficulty: 'needs_background',
        role: 'baseline',
        roleReason: '基线方法',
        recommendedDepth: 'deep',
        deliveredDepth: 'deep',
        templateVersion: 1,
        reasons: ['r'],
        coverage: { mode: 'full-text', basis: 'b', version: 'v', sections: ['§1'], limitations: 'l', checkedAt: '2026-09-15' },
        lead: 'l',
        overview: [{ kind: 'paragraph', spans: [{ kind: 'text', text: '概览' }] }],
        prereq: [{ kind: 'list', ordered: false, items: [[{ kind: 'text', text: '概念' }]] }],
        sections: [
          { id: 'a', heading: 'h1', blocks: [{ kind: 'paragraph', spans: [{ kind: 'text', text: 'p' }] }] },
          { id: 'b', heading: 'h2', blocks: [{ kind: 'comparison', caption: 'c', columns: ['x', 'y'], rows: [['1', '2']] }] },
          { id: 'c', heading: 'h3', blocks: [{ kind: 'callout', tone: 'author', title: '作者发现', blocks: [{ kind: 'paragraph', spans: [{ kind: 'text', text: '发现' }] }] }] },
        ],
        deepRead: ['d1', 'd2'],
        references: [{ paperId: 'p2', relation: 'citation', sourceLocator: '§2 引用', reason: '真实引用' }],
        openQuestions: ['待核一'],
        questions: ['q'],
        next: { note: 'n', paperId: 'p2' },
      },
      {
        id: 'p2',
        title: 'P2',
        displayTitle: '论文二',
        url: 'https://doi.org/10.1/x',
        type: 'method',
        importance: 'relevant',
        difficulty: 'unknown',
        role: 'background',
        roleReason: '背景',
        recommendedDepth: 'standard',
        deliveredDepth: 'quick',
        templateVersion: 1,
        reasons: ['r2'],
        coverage: { mode: 'abstract', basis: 'b2', version: 'v2', sections: [], limitations: 'l2', checkedAt: '2026-09-15' },
        lead: 'l2',
        sections: [],
        deepRead: [],
        questions: ['q2'],
        next: { note: 'end', paperId: null },
      },
    ],
    technicalRoutes: [
      {
        id: 't1',
        kind: 'core',
        order: 1,
        title: 'T1',
        capability: '能力说明',
        prerequisites: '先修',
        applicability: '适用场合',
        summary: '路线摘要',
        relatedPaperIds: [],
        resources: [
          {
            id: 'r1',
            title: 'R1',
            provider: 'P',
            url: 'https://docs.example.com/a',
            language: 'en',
            format: 'docs',
            checkedAt: '2026-09-15',
            checkLevel: 'section',
            access: 'open',
            versionNote: 'v1',
            primary: true,
          },
        ],
        units: [
          {
            id: 'u1',
            title: 'U1',
            goal: '目标',
            focus: '读什么',
            prerequisites: '先修',
            resourceIds: ['r1'],
            selfCheck: '自查',
            optionalPractice: '选做',
            skipWhen: '跳过条件',
            relatedPaperIds: [],
          },
        ],
      },
    ],
    briefs: [
      {
        id: 'b1',
        date: '2026-09-15',
        scope: '定向挑选的线索清单',
        items: [
          { paperId: 'p2', reason: 'r', summary: 's', published: '2026-02', tier: '速览' },
          { source: 'https://example.com/x', reason: 'r2', summary: 's2', published: '2026-07', tier: '优先' },
        ],
      },
    ],
  };
}

test('fixture：合法库通过校验', () => {
  const result = validateLibrary(validLibrary());
  assert.deepEqual(result.errors, []);
});

test('fixture：跨引用无法解析时逐项报错', () => {
  const cases = [
    ['route.paperId', (lib) => { lib.directions[0].route[0].paperId = 'ghost'; }, /route\[0\]\.paperId 无法解析/],
    ['next.paperId', (lib) => { lib.papers[0].next.paperId = 'ghost'; }, /next\.paperId 无法解析/],
    ['references.paperId', (lib) => { lib.papers[0].references[0].paperId = 'ghost'; }, /references\[0\]\.paperId 无法解析/],
    ['tech relatedPaperIds', (lib) => { lib.technicalRoutes[0].relatedPaperIds = ['ghost']; }, /relatedPaperIds 无法解析/],
    ['unit resourceIds', (lib) => { lib.technicalRoutes[0].units[0].resourceIds = ['ghost']; }, /resourceIds 无法解析/],
    ['brief paperId', (lib) => { lib.briefs[0].items[0].paperId = 'ghost'; }, /items\[0\]\.paperId 无法解析/],
    ['home startHerePaperId', (lib) => { lib.home.startHerePaperId = 'ghost'; }, /startHerePaperId 无法解析/],
  ];
  for (const [name, mutate, pattern] of cases) {
    const lib = validLibrary();
    mutate(lib);
    const result = validateLibrary(lib);
    assert.equal(result.ok, false, name);
    assert.match(result.errors.join('\n'), pattern, name);
  }
});

test('fixture：深度与依据不一致、block 非法、方向说明缺失、主干不可开始均报错', () => {
  const cases = [
    [(lib) => { lib.papers[0].coverage.mode = 'abstract'; }, /deep 需要正文依据/],
    [(lib) => { lib.papers[0].sections = lib.papers[0].sections.slice(0, 2); }, /deep 卡至少需要 3 个正文章节/],
    [(lib) => { lib.papers[0].overview = []; }, /deep 卡缺少 overview/],
    [(lib) => { lib.papers[0].deepRead = ['d1']; }, /deep 卡至少 2 处细读定位/],
    [(lib) => { lib.papers[0].references = []; }, /deep 卡至少 1 条相关文献/],
    [(lib) => { lib.papers[1].sections = [{ id: 'x', heading: 'h', blocks: [{ kind: 'paragraph', spans: [{ kind: 'text', text: 'p' }] }] }]; }, /quick 不应有正文 sections/],
    [(lib) => { lib.papers[0].sections[0].blocks = [{ kind: 'script', text: 'x' }]; }, /kind 必须是/],
    [(lib) => { lib.papers[0].sections[0].blocks = [{ kind: 'paragraph', spans: [{ kind: 'text', text: 'ok' }, { kind: 'link', href: 'http://x.com', text: 'x' }] }]; }, /href 必须是 https/],
    [(lib) => { lib.papers[0].sections[2].blocks[0].title = ''; }, /callout 缺少 title/],
    [(lib) => { delete lib.directions[0].stateOfField; }, /缺少 stateOfField/],
    [(lib) => { lib.directions[0].asOf = ''; }, /缺少 asOf/],
    [(lib) => { lib.directions[0].route[0].stage = '随便'; }, /stage 不在固定阶段内/],
    [(lib) => { lib.technicalRoutes[0].resources[0].access = 'unknown'; }, /主资源不能是访问条件未确认的条目/],
    [(lib) => { lib.technicalRoutes[0].units = []; }, /必学主干至少 1 个学习单元/],
    [(lib) => { lib.technicalRoutes[0].units[0].resourceIds = ['r1']; lib.technicalRoutes[0].resources[0].primary = false; }, /缺少可立即开始的单元/],
    [(lib) => { lib.papers[0].deliveredDepth = 'medium'; }, /deliveredDepth 必须是/],
  ];
  for (const [mutate, pattern] of cases) {
    const lib = validLibrary();
    mutate(lib);
    const result = validateLibrary(lib);
    assert.equal(result.ok, false, pattern);
    assert.match(result.errors.join('\n'), pattern, String(pattern));
  }
});

// ---------- 路线、徽章与目录 ----------

test('track 导航（008.2）：start/archive 前后节点、track 携带与未知输入', () => {
  // A06：TOSEM start 下一步是 Agentless；archive 下一步是 Le；SWE-bench start 结束。
  const tosemStart = trackPosition(LIBRARY, 'code-agent-verification', 'start', { kind: 'paper', paperId: 'tosem2025-acceptance' });
  assert.equal(tosemStart.next.paperId, 'agentless');
  const tosemArchive = trackPosition(LIBRARY, 'code-agent-verification', 'archive', { kind: 'paper', paperId: 'tosem2025-acceptance' });
  assert.equal(tosemArchive.next.paperId, 'le2018-overfitting');
  const sweb = trackPosition(LIBRARY, 'code-agent-verification', 'start', { kind: 'paper', paperId: 'swe-bench' });
  assert.equal(sweb.next, null, 'SWE-bench 是 start 末节点');
  // 主线顺序：导读 → Beyond Frameworks → MemGPT → Tax → Debt。
  const collabStart = trackEntries(LIBRARY, 'cross-harness-collab', 'start');
  assert.deepEqual(collabStart.map((e) => e.materialId ?? e.paperId), ['mat-cross-harness-map', 'beyond-frameworks', 'memgpt', 'handoff-tax', 'handoff-debt']);
  assert.equal(trackPosition(LIBRARY, 'cross-harness-collab', 'start', { kind: 'paper', paperId: 'handoff-debt' }).next, null, 'Debt 起步结束');
  assert.equal(trackPosition(LIBRARY, 'cross-harness-collab', 'start', { kind: 'paper', paperId: 'memgpt' }).prev.paperId, 'beyond-frameworks');
  // routesContaining 携带 track 且保留 archive 关联（A08）。
  const positions = routesContaining(LIBRARY, 'tosem2025-acceptance');
  assert.deepEqual(positions.map((p) => p.track), ['start', 'archive']);
  const archivePos = positions.find((p) => p.track === 'archive');
  assert.equal(archivePos.next.paperId, 'le2018-overfitting');
  assert.equal(routesContaining(LIBRARY, 'ghost').length, 0);
  assert.equal(trackEntries(LIBRARY, 'ghost', 'start').length, 0);
  // 旧 legacy 函数对旧数据回退仍可用（兼容层）。
  const legacy = routeEntries(validLibrary(), 'd1');
  assert.ok(legacy.length > 0);
  assert.equal(nextStepAfter(validLibrary(), 'd1', 'p1').paperId, 'p2');
});

test('paperBadges：深度徽章在前，unknown 不展示，角色可见', () => {
  const badges = paperBadges(getPaper(LIBRARY, 'astute-rag'));
  assert.equal(badges[0].text, '正文精读');
  assert.ok(badges.some((b) => b.text === '核心文献'), '核心文献徽章');
  assert.ok(badges.some((b) => b.text === '基线/对照'), '角色徽章');
  const entry = paperBadges(getPaper(LIBRARY, 'le2018-overfitting'));
  assert.equal(entry[0].text, '原文入口 · 未获取摘要，不是阅读卡');
  assert.ok(!entry.some((b) => b.text === '待判'), 'unknown 难度不展示徽章');
});

test('paperOutline：deep 卡目录含概览/先修/章节/细读/文献/待核/自查/下一篇，锚点带 paperId', () => {
  const paper = getPaper(LIBRARY, 'astute-rag');
  const outline = paperOutline(paper);
  const ids = outline.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids[0], 'lib-sec-overview');
  assert.equal(ids[1], 'lib-sec-prereq');
  assert.ok(ids.includes(sectionAnchorId('astute-rag', 'method')), '章节锚点应包含 paperId 与 sectionId');
  assert.ok(ids.includes('lib-sec-deep'));
  assert.ok(ids.includes('lib-sec-refs'));
  assert.ok(ids.includes('lib-sec-open'));
  assert.ok(ids.includes('lib-sec-questions'));
  assert.equal(ids[ids.length - 1], 'lib-sec-next');
  const quick = paperOutline(getPaper(LIBRARY, 'compass')).map((i) => i.id);
  assert.deepEqual(quick, ['lib-sec-reasons', 'lib-sec-questions', 'lib-sec-next']);
});

test('coverageRows 与 paperSourceLink：来源信息完整，外链仅 https', () => {
  const rows = coverageRows(getPaper(LIBRARY, 'astute-rag'));
  assert.deepEqual(rows.map(([label]) => label), ['依据', '来源', '版本', '实际覆盖', '未覆盖', '核查时间']);
  assert.deepEqual(paperSourceLink(getPaper(LIBRARY, 'tosem2025-acceptance')), {
    href: 'https://nmaguirre.github.io/assets/pdf/tosem2025.pdf',
    host: 'nmaguirre.github.io',
  });
  assert.equal(paperSourceLink({ url: 'javascript:alert(1)' }), null);
});

test('briefItemTarget 与 safeExternalHref：各归其类，非 https 一律降级', () => {
  const lib = validLibrary();
  assert.deepEqual(briefItemTarget(lib, { paperId: 'p2' }), { kind: 'paper', paperId: 'p2' });
  assert.deepEqual(briefItemTarget(lib, { source: 'https://example.com/x' }), { kind: 'external', href: 'https://example.com/x' });
  assert.deepEqual(briefItemTarget(lib, { paperId: 'ghost' }), { kind: 'missing-paper', paperId: 'ghost' });
  assert.equal(briefItemTarget(lib, { source: 'http://example.com/x' }).kind, 'unsafe-source');
  assert.equal(briefItemTarget(lib, {}), null);
  for (const bad of ['http://arxiv.org/abs/1', 'javascript:alert(1)', 'data:text/html,x', '//example.com/x', 'https:///path', 'https://', 42, null]) {
    assert.equal(safeExternalHref(bad), null, String(bad));
  }
});

test('briefSourceLabel（REWORK-007）：arXiv abs 链接显示短编号标签，其它回退 source 原文', () => {
  assert.equal(briefSourceLabel({ source: 'https://arxiv.org/abs/2609.20050' }, 'https://arxiv.org/abs/2609.20050'), 'arXiv:2609.20050');
  assert.equal(briefSourceLabel({ source: 'https://arxiv.org/abs/2609.20812v1' }, 'https://arxiv.org/abs/2609.20812v1'), 'arXiv:2609.20812v1');
  assert.equal(briefSourceLabel({ source: 'https://example.com/paper' }, 'https://example.com/paper'), 'https://example.com/paper');
  assert.equal(briefSourceLabel({}, null), '');
});

test('libraryStatus 与 EMPTY_NOTICES：空集合必须走明确空态文案', () => {
  const status = libraryStatus(LIBRARY);
  assert.deepEqual(
    { directions: status.directions, papers: status.papers, materials: status.materials, technicalRoutes: status.technicalRoutes, briefs: status.briefs },
    { directions: 4, papers: 49, materials: 2, technicalRoutes: 13, briefs: 2 },
  );
  assert.equal(status.allEmpty, false);
  assert.equal(libraryStatus({ directions: [], papers: [], technicalRoutes: [], briefs: [] }).allEmpty, true);
  for (const key of ['directions', 'papers', 'materials', 'technicalRoutes', 'briefs', 'routeEmpty', 'startRouteEmpty', 'learnCore']) {
    assert.ok(EMPTY_NOTICES[key].length > 20, key);
  }
});

// ---------- 注入安全与页面接线 ----------

test('library.js 无 HTML 注入面：不存在 innerHTML/outerHTML 赋值与 insertAdjacentHTML/document.write/srcdoc', async () => {
  const source = await readPublic('library.js');
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.doesNotMatch(source, /\.outerHTML\s*=/);
  assert.doesNotMatch(source, /insertAdjacentHTML\s*\(/);
  assert.doesNotMatch(source, /document\.write\s*\(/);
  assert.doesNotMatch(source, /\bsrcdoc\b\s*=/);
});

test('页内目录真实滚动且不与 hash 路由冲突：button + scrollIntoView，源码不改写 location.hash', async () => {
  const source = await readPublic('library.js');
  assert.match(source, /el\('button'/);
  assert.match(source, /scrollIntoView\(/);
  assert.doesNotMatch(source, /location\.hash\s*=/);
  assert.match(source, /setAttribute\('aria-label', '本页目录'\)/);
  for (const anchor of ['lib-sec-overview', 'lib-sec-deep', 'lib-sec-questions', 'lib-sec-next']) {
    assert.ok(source.includes(`'${anchor}'`), anchor);
  }
});

test('渲染层按深度分支，且 block 渲染只认白名单类型', async () => {
  const source = await readPublic('library.js');
  for (const marker of ["depth === 'deep'", "depth === 'standard'", "depth === 'quick'", "BLOCK_KINDS", 'renderFormula']) {
    assert.ok(source.includes(marker), marker);
  }
  assert.match(source, /未知 block 类型直接跳过/);
});

test('可见文案与交互入口（源码级）：首页四区、方向说明、阶段、技术主干与来源提示齐备', async () => {
  const source = await readPublic('library.js');
  for (const text of [
    '建议先读',
    '这个方向研究什么',
    '当前研究情况',
    '以上情况的核查截止日期',
    '为什么考虑这个方向',
    '难点与不适用条件',
    '按阶段阅读',
    '可以追问的问题',
    '必学主干',
    '按需深入',
    '主资源',
    '何时跳过',
    '来源与覆盖',
    '第一次使用',
    '本页目录',
    '论文原文',
    '上一篇',
    '下一篇',
    '返回首页',
  ]) {
    assert.ok(source.includes(text), text);
  }
});

test('index.html 无内联脚本/内联样式/事件 handler 属性（CSP self 兼容）', async () => {
  const html = await readPublic('index.html');
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)/, 'index.html 存在无 src 的 script');
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i, 'index.html 存在事件 handler 属性');
  assert.doesNotMatch(html, /\sstyle=/, 'index.html 存在内联 style 属性');
});

test('index.html 新结构：首页导航 + 五入口 + 方向入口容器；旧版入口已退役', async () => {
  const html = await readPublic('index.html');
  assert.match(html, /<link rel="stylesheet" href="\/styles.css">/);
  assert.match(html, /<script type="module" src="\/library\.js"><\/script>/);
  assert.match(html, /class="lib-side"/);
  assert.match(html, /id="lib-quick"/);
  assert.match(html, /aria-label="主导航"/);
  for (const label of ['首页', '方向与路线', '论文阅读', '技术学习', '每日精选', '经典书目']) {
    assert.ok(html.includes(label), label);
  }
  for (const hash of ['#/home', '#/directions', '#/papers', '#/learn', '#/brief', '#/foundations']) {
    assert.ok(html.includes(hash), hash);
  }
  assert.match(html, /id="lib-view"/);
  assert.match(html, /id="lib-notices"/);
  // 旧版退役（LEGACY-AUDIT-005）：不得再出现指向 legacy.html 的任何链接
  assert.doesNotMatch(html, /legacy\.html/);
  assert.doesNotMatch(html, /lib-side-legacy|lib-legacy-note/);
});

// ---------- styles 契约 ----------

test('styles.css：旧版段已退役（文件自新版注释起），规则全部限定 lib 作用域', async () => {
  const css = await readPublic('styles.css');
  assert.ok(css.trimStart().startsWith('/* ===== 个人研究平台新版样式'), 'styles.css 应自新版样式注释起（旧版段已删除）');
  assert.ok(!css.includes('.banner-error'), '旧版类名不应残留');
  assert.ok(!css.includes('.rec-card'), '旧版类名不应残留');
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '');
  const selectorRe = /([^{}@]+)\{/g;
  let m;
  while ((m = selectorRe.exec(noComments)) !== null) {
    const selector = m[1].trim();
    if (selector === '') continue;
    assert.ok(/lib/i.test(selector), `选择器缺少 lib 作用域：${selector}`);
  }
});

test('styles.css：字体职责与关键视觉值（正文中英无衬线 18px/1.9、标题栈、按钮与侧栏显式定色）', async () => {
  const css = await readPublic('styles.css');
  assert.match(css, /body\.lib\s*\{[^}]*--lib-side-bg:\s*#15243b/s);
  assert.match(css, /body\.lib\s*\{[^}]*--lib-accent:\s*#0e7663/s);
  assert.match(css, /--lib-serif:[^;]*SimSun/);
  assert.match(css, /--lib-font-read:[^;]*Microsoft YaHei/);
  assert.match(css, /\.lib-shell\s*\{[^}]*grid-template-columns:\s*220px/s);
  assert.match(css, /\.lib-article\s*\{[^}]*font-size:\s*18px/s);
  assert.match(css, /\.lib-article\s*\{[^}]*line-height:\s*1\.9/s);
  assert.match(css, /\.lib-article\s*\{[^}]*max-width:\s*45rem/s);
  // 按钮与侧栏链接显式定色，不依赖全局 a
  assert.match(css, /\.lib-btn\s*\{[^}]*font-family:[^;]*--lib-font-ui/s);
  assert.match(css, /\.lib-btn-primary\s*\{[^}]*color:\s*#ffffff/s);
  assert.match(css, /\.lib-view a\.lib-btn-primary\s*\{[^}]*color:\s*#ffffff/s);
  assert.doesNotMatch(css, /body\.lib a\s*\{\s*color:/);
  // 旧版入口样式已随退役移除
  assert.doesNotMatch(css, /lib-side-legacy|lib-legacy-note/);
});

// ---------- 服务集成：白名单 ----------

const SENTINELS = {
  'index.html': '<!doctype html>sentinel-index',
  'styles.css': '/* sentinel-css */',
  'library.js': '// sentinel-library',
  'library-content.js': '// sentinel-library-content',
  'content/directions.js': '// sentinel-content-directions',
  'content/papers-routes.js': '// sentinel-content-papers-routes',
  'content/papers-supplements.js': '// sentinel-content-papers-supplements',
  'content/papers-foundations.js': '// sentinel-content-papers-foundations',
  'content/technical-routes.js': '// sentinel-content-technical-routes',
  'content/briefs.js': '// sentinel-content-briefs',
  'notes.js': '// sentinel-notes',
  'secret.txt': 'sentinel-must-not-be-served',
};

const testRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'rw-library-test-'));
let base;

function fakeDiscovery() {
  return {
    discover() {
      return Promise.reject(new DiscoveryError({ status: 503, code: 'disabled', message: 'test discovery disabled' }));
    },
  };
}

test.before(async () => {
  await fsp.mkdir(path.join(testRoot, 'content'), { recursive: true });
  for (const [name, content] of Object.entries(SENTINELS)) {
    await fsp.writeFile(path.join(testRoot, name), content, 'utf8');
  }
  base = await startServer({ port: 0, rootDir: testRoot, discovery: fakeDiscovery() });
});

test.after(async () => {
  if (base) await base.close();
  await fsp.rm(testRoot, { recursive: true, force: true }).catch(() => {});
});

function request(pathname, { method = 'GET' } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: BIND_HOST, port: base.port, path: pathname, method, headers: { host: `${BIND_HOST}:${base.port}` } },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

test('服务：白名单仅十二个入口（含 content/ 六个拆分模块）；旧版路径退役后一律 404', async () => {
  for (const [pathname, typePrefix, sentinel] of [
    ['/', 'text/html', SENTINELS['index.html']],
    ['/index.html', 'text/html', SENTINELS['index.html']],
    ['/styles.css', 'text/css', SENTINELS['styles.css']],
    ['/library.js', 'text/javascript', SENTINELS['library.js']],
    ['/library-content.js', 'text/javascript', SENTINELS['library-content.js']],
    ['/content/directions.js', 'text/javascript', SENTINELS['content/directions.js']],
    ['/content/papers-routes.js', 'text/javascript', SENTINELS['content/papers-routes.js']],
    ['/content/papers-supplements.js', 'text/javascript', SENTINELS['content/papers-supplements.js']],
    ['/content/papers-foundations.js', 'text/javascript', SENTINELS['content/papers-foundations.js']],
    ['/content/technical-routes.js', 'text/javascript', SENTINELS['content/technical-routes.js']],
    ['/content/briefs.js', 'text/javascript', SENTINELS['content/briefs.js']],
    ['/notes.js', 'text/javascript', SENTINELS['notes.js']],
  ]) {
    const res = await request(pathname);
    assert.equal(res.status, 200, pathname);
    assert.ok(res.headers['content-type'].startsWith(typePrefix), `${pathname} content-type`);
    assert.equal(res.body.toString('utf8'), sentinel, `${pathname} 哨兵内容`);
  }
  const root = await request('/');
  assert.equal(root.headers['content-security-policy'], "default-src 'self'; connect-src 'self'");
  assert.equal(root.headers['x-content-type-options'], 'nosniff');
  // 旧版退役（LEGACY-AUDIT-005）：app/domain/content/legacy 不再提供
  for (const pathname of ['/app.js', '/domain.js', '/content.js', '/legacy.html']) {
    const retired = await request(pathname);
    assert.equal(retired.status, 404, `旧版路径应 404：${pathname}`);
  }
});

test('服务：编码/大小写/query 变体与非白名单文件一律 404（不提供任意文件）', async () => {
  for (const pathname of [
    '/library.js?x=1',
    '/LIBRARY.JS',
    '/Library.js',
    '/library%2Ejs',
    '/library.js/',
    '/library-content.js?ver=2',
    '/content/briefs.js?x=1',
    '/content/BRIEFS.js',
    '/content/../secret.txt',
    '/content/',
    '/legacy.html#frag',
    '/notes.js.bak',
    '/secret.txt',
    '/library.js.bak',
    '/tests/library.test.mjs',
  ]) {
    const res = await request(pathname);
    assert.equal(res.status, 404, pathname);
  }
});

// ---------- 审查回流回归（原 REVIEW-PLAN-004 待修项 1/2/3/4/5，归档见 docs/HISTORY.md） ----------

test('回流项1：目录与正文同源——目录标签来自 sectionTitle 或论文章节标题，quick/entry 不再与正文漂移', () => {
  for (const paper of LIBRARY.papers) {
    const depth = deliveredDepthOf(paper);
    const outline = paperOutline(paper);
    const allowed = Object.values(PAPER_SECTION_TITLES[depth] ?? PAPER_SECTION_TITLES.standard);
    const ownHeadings = new Set((paper.sections ?? []).map((s) => s.heading));
    for (const item of outline) {
      assert.ok(
        allowed.includes(item.label) || ownHeadings.has(item.label),
        `${paper.id} 目录标签既非该深度标题表用词也非论文章节标题：${item.label}`,
      );
    }
    const ids = outline.map((o) => o.id);
    assert.equal(new Set(ids).size, ids.length, `${paper.id} 目录 id 重复`);
  }
  // 008.2（03 §5.3）：旧 paper.next 降为「延伸阅读」，不再以「下一篇/下一步」措辞出现。
  assert.deepEqual(paperOutline(getPaper(LIBRARY, 'compass')).map((o) => o.label), [
    '为什么留意这篇',
    '取全文时先核对',
    '延伸阅读',
  ]);
  assert.deepEqual(paperOutline(getPaper(LIBRARY, 'le2018-overfitting')).map((o) => o.label), [
    '它在路线里的角色',
    '延伸阅读',
  ]);
  assert.equal(sectionTitle('quick', 'reasons'), '为什么留意这篇');
  assert.equal(sectionTitle('entry', 'next'), '延伸阅读');
  assert.equal(sectionTitle('deep', 'next'), '延伸阅读');
  assert.equal(sectionTitle('unknown-depth', 'reasons'), '为什么读这篇');
  assert.equal(sectionTitle('quick', 'ghost-key'), 'ghost-key');
});

test('回流项2：目录容器为 details，窄屏默认折叠、桌面默认展开（matchMedia 驱动）', async () => {
  const source = await readPublic('library.js');
  assert.match(source, /el\('details', 'lib-toc-wrap'\)/);
  assert.match(source, /matchMedia\('\(max-width: 900px\)'\)/);
  assert.match(source, /details\.open = wide/);
  const css = await readPublic('styles.css');
  assert.match(css, /\.lib-toc-summary\s*\{[^}]*display:\s*none/s);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*?\.lib-toc-summary\s*\{[^}]*display:\s*block/s);
});

test('回流项3：阶段提示按实际分组顺序生成，不硬编码阶段序列', async () => {
  const source = await readPublic('library.js');
  assert.match(source, /groups\.map\(\(g\) => g\.stage\)\.join\(' → '\)/);
  assert.doesNotMatch(source, /阶段有先后：建立问题/);
  // 008.2：真实库走双轨；旧格式回退仍按阶段分组（fixture 验证）。
  const legacy = validLibrary();
  assert.deepEqual(routeStages(legacy, 'd1').map((g) => g.stage), ['建立问题', '理解方法']);
  // 新格式路线的 stage 序列按实际排列（代码验证 start）。
  assert.deepEqual(
    trackEntries(LIBRARY, 'code-agent-verification', 'start').map((e) => e.stage),
    ['建立概念', '建立问题', '看评价与反例', '看评价与反例'],
  );
});

test('回流项4：首页标题选择器带 .lib-view 作用域，不被全局 h3 规则覆盖', async () => {
  const css = await readPublic('styles.css');
  assert.match(css, /\.lib-view h3\.lib-zone-title[^{]*\{[^}]*margin:\s*0/s);
  assert.match(css, /\.lib-view h3\.lib-firstuse-title[^{]*\{[^}]*margin:\s*0/s);
});

test('用户反馈：侧栏方向入口链接块级纵排——details 上不得用 flex 布局', async () => {
  const css = await readPublic('styles.css');
  // Chromium 中 details + display:flex 会把非 summary 子元素塞进匿名内容盒，链接内联横排
  assert.match(css, /\.lib-quick-group\s*\{\s*display:\s*block;\s*\}/);
  assert.match(css, /\.lib-quick-link\s*\{[^}]*display:\s*block/s);
  assert.doesNotMatch(css, /\.lib-quick-group\s*\{[^}]*display:\s*flex/s);
});

test('回流项5：home 字段缺失逐项报错，不再渲染出 undefined', () => {
  const cases = [
    [(lib) => { delete lib.home.updatedOn; }, /home 缺少 updatedOn/],
    [(lib) => { delete lib.home.zones[0].howToUse; }, /home\.zones 条目缺少 howToUse/],
    [(lib) => { delete lib.home.zones[0].entryLabel; }, /home\.zones 条目缺少 entryLabel/],
    [(lib) => { lib.home.firstUse = 'nope'; }, /home\.firstUse 必须是数组/],
    [(lib) => { delete lib.home.firstUse[0].text; }, /home\.firstUse\[0\] 缺少 text/],
    [(lib) => { delete lib.home.firstUse[0].title; }, /home\.firstUse\[0\] 缺少 title/],
  ];
  for (const [mutate, pattern] of cases) {
    const lib = validLibrary();
    mutate(lib);
    const result = validateLibrary(lib);
    assert.equal(result.ok, false, pattern);
    assert.match(result.errors.join('\n'), pattern);
  }
  // 空 firstUse 是明确空态（渲染层有守卫，不渲染 undefined），允许通过校验
  const lib = validLibrary();
  lib.home.firstUse = [];
  assert.equal(validateLibrary(lib).ok, true);
});


// ---------- SCAFFOLD-008（008.2）：双轨路线 / 材料 / featured / track 导航 fixture ----------

function scaffoldPaper(id, extra = {}) {
  return {
    id,
    title: `测试论文 ${id}`,
    url: 'https://arxiv.org/abs/2601.00001',
    type: 'method',
    importance: 'relevant',
    difficulty: 'accessible',
    role: 'frontier',
    roleReason: 'fixture 角色说明',
    recommendedDepth: 'quick',
    deliveredDepth: 'quick',
    lead: 'fixture 导语',
    reasons: ['fixture 理由'],
    questions: ['fixture 自查问题'],
    deepRead: [],
    coverage: { mode: 'abstract', basis: '摘要', version: 'v1', sections: ['摘要'], limitations: '未读正文', checkedAt: '2026-09-22' },
    sections: [],
    ...extra,
  };
}

function scaffoldPrimer(id, extra = {}) {
  return {
    id,
    title: `测试材料 ${id}`,
    format: 'primer',
    lead: 'fixture 材料导语',
    learner: { gist: '讲什么', value: '路线价值', intent: '阅读目的' },
    coverage: {
      mode: 'editorial-primer',
      basis: '站内编辑',
      version: '—',
      sections: ['编辑正文'],
      limitations: '编辑整理，非论文结论',
      checkedAt: '2026-09-22',
    },
    body: { blocks: [{ kind: 'paragraph', spans: [{ kind: 'text', text: '实际编辑正文段落。' }] }] },
    ...extra,
  };
}

function scaffoldFixture() {
  return {
    meta: {},
    home: {
      title: 't',
      intro: 'i',
      updatedOn: '2026-09-22',
      startHere: { kind: 'article', materialId: 'mat-map', routeId: 'collab', track: 'start' },
      zones: [{ key: 'directions', title: '方向', purpose: '用途说明文字', howToUse: '怎么用', entryLabel: '进入', entryHash: '#/directions' }],
      firstUse: [{ title: '一步', text: '说明' }],
    },
    directions: [
      {
        id: 'collab',
        order: 1,
        status: 'active',
        title: '跨工具协作',
        summary: 's',
        overview: '研究对象说明文字',
        stateOfField: '当前研究情况文字',
        asOf: '2026-09-22',
        whyChoose: '选择理由文字',
        limits: '限制文字',
        trackClosing: '本段结束后的行动建议。',
        startRoute: [
          { id: 'step-collab-1', kind: 'article', materialId: 'mat-map', stage: '建立概念', required: '必读', passMode: 'map', purpose: '先分清问题', readWhen: '起步第一篇', check: '能区分场景与机制' },
          { id: 'step-collab-2', kind: 'paper', paperId: 'beyond', stage: '建立问题', required: '必读', passMode: 'map', purpose: '协作维度', readWhen: '导读之后', check: '能说出一个维度' },
          { id: 'step-collab-3', kind: 'paper', paperId: 'tax', stage: '看评价与反例', required: '必读', passMode: 'core', purpose: '换手对照', readWhen: '建立概念后', check: '说出一个成立条件' },
        ],
        archiveRoute: [
          { id: 'archive-collab-x', kind: 'external', title: '按需资料', url: 'https://example.com/survey', role: '协作综述', note: '只查分类', availability: 'ready', checkedAt: '2026-09-22' },
        ],
      },
      {
        id: 'deferred-d',
        order: 3,
        status: 'deferred',
        title: '延后方向',
        summary: 's',
        overview: '研究对象说明文字',
        stateOfField: '当前研究情况文字',
        asOf: '2026-09-15',
        whyChoose: '选择理由文字',
        limits: '限制文字',
        startRoute: [],
        archiveRoute: [
          { id: 'archive-d1', kind: 'paper', paperId: 'beyond', stage: '建立问题', required: '选读', purpose: '旧谱系', readWhen: '按需', check: '不升级' },
        ],
      },
    ],
    materials: [scaffoldPrimer('mat-map')],
    papers: [
      scaffoldPaper('beyond'),
      scaffoldPaper('tax'),
      scaffoldPaper('debt', {
        coverage: { mode: 'partial-text', basis: '摘要与§5', version: 'v2', sections: ['摘要', '§5.1 表2'], limitations: '其余未读', checkedAt: '2026-09-22' },
        readingActions: {
          preserve: [{ target: '四视图定义', why: '先建立评价对象' }],
          explain: [{ target: '事件数与 token 的区别', why: '先借解释理解两个指标', blocks: [{ kind: 'paragraph', spans: [{ kind: 'text', text: '这是实际讲解正文。' }] }] }],
          skip: [{ target: '附录实现细节', why: '当前不需要复现实现' }],
        },
      }),
    ],
    technicalRoutes: [
      {
        id: 'tech-multiagent',
        kind: 'featured',
        order: 1,
        title: '多智能体架构',
        capability: '能力',
        prerequisites: 'Python 基础',
        applicability: '场合',
        summary: '说明',
        resources: [
          { id: 'res-lg', title: 'LangGraph 教程', provider: 'LangChain', url: 'https://docs.langchain.com/oss/python/langgraph/quickstart', language: 'en', format: 'docs', checkedAt: '2026-09-21', versionNote: 'n', checkLevel: 'section', access: 'open', primary: true },
        ],
        units: [
          { id: 'ma-u1', title: '单元一', goal: '目标', selfCheck: '自查', resourceIds: ['res-lg'], labPath: '/learning/multiagent-lab.md', labSection: 'ma-u1' },
          { id: 'ma-u2', title: '单元二', goal: '目标', selfCheck: '自查', resourceIds: ['res-lg'], labPath: '/learning/multiagent-lab.md', labSection: 'ma-u2' },
        ],
      },
      {
        id: 'tech-rag',
        kind: 'featured',
        order: 2,
        title: 'RAG',
        capability: '能力',
        prerequisites: '先修',
        applicability: '场合',
        summary: '说明',
        resources: [
          { id: 'res-li', title: 'LlamaIndex starter', provider: 'LlamaIndex', url: 'https://developers.llamaindex.ai/python/framework/getting_started/starter_example/', language: 'en', format: 'docs', checkedAt: '2026-09-21', versionNote: 'n', checkLevel: 'section', access: 'open', primary: true },
        ],
        units: [{ id: 't4-u1', title: '单元', goal: '目标', selfCheck: '自查', resourceIds: ['res-li'] }],
      },
      {
        id: 'tech-graph-simple',
        kind: 'featured',
        order: 3,
        title: '图（浅尝）',
        capability: '能力',
        prerequisites: '先修',
        applicability: '场合',
        summary: '说明',
        resources: [],
        units: [
          {
            id: 'graph-u3',
            title: '现在用不用图',
            goal: '区分图数据结构与 GNN 研究',
            selfCheck: '能各举一例',
            resourceIds: [],
            lesson: { blocks: [{ kind: 'paragraph', spans: [{ kind: 'text', text: '编辑短文实际正文。' }] }] },
          },
        ],
      },
      {
        id: 'tech-t1',
        kind: 'core',
        order: 4,
        title: '旧主干',
        capability: '能力',
        prerequisites: '先修',
        applicability: '场合',
        summary: '说明',
        resources: [
          { id: 'res-old', title: '旧资源', provider: 'p', url: 'https://example.com/old', language: 'zh', format: 'docs', checkedAt: '2026-09-15', versionNote: 'n', checkLevel: 'page', access: 'open', primary: true },
        ],
        units: [{ id: 't1-u1', title: '旧单元', goal: '目标', selfCheck: '自查', resourceIds: ['res-old'] }],
      },
    ],
    briefs: [],
  };
}

test('A01/A02（fixture 正例）：双轨方向、材料、featured 与 typed 首页通过校验', () => {
  const result = validateLibrary(scaffoldFixture());
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test('A01（反例）：NodeTarget 混填、未知 kind、悬空引用与跨集合重名均拒绝', () => {
  const cases = [
    [(lib) => { lib.directions[0].startRoute[1].materialId = 'mat-map'; }, /目标必须恰好填写/],
    [(lib) => { lib.directions[0].startRoute[1].kind = 'wiki'; }, /目标 kind 必须是/],
    [(lib) => { lib.directions[0].startRoute[1].paperId = 'ghost'; }, /paperId 无法解析/],
    [(lib) => { lib.directions[0].startRoute[0].materialId = 'ghost'; }, /materialId 无法解析/],
    [(lib) => { const s = lib.directions[0].startRoute[1]; lib.directions[0].startRoute[1] = { ...s, kind: 'unit', paperId: undefined, unitRef: { routeId: 'tech-multiagent', unitId: 'ma-u9' } }; }, /unitRef 无法解析/],
    [(lib) => { lib.materials.push(scaffoldPrimer('beyond')); }, /材料 id 与论文 id 重名/],
    [(lib) => { lib.directions[0].startRoute.push({ id: 'step-collab-9', kind: 'paper', paperId: 'beyond', stage: '建立问题', required: '必读', passMode: 'map', purpose: 'p', readWhen: 'r', check: 'c' }); }, /同一 track 内目标重复/],
  ];
  for (const [mutate, pattern] of cases) {
    const lib = scaffoldFixture();
    mutate(lib);
    const result = validateLibrary(lib);
    assert.equal(result.ok, false, pattern);
    assert.match(result.errors.join('\n'), pattern);
  }
  // nodeTargetError 纯函数：单键、kind 一致。
  assert.match(nodeTargetError({ kind: 'paper', paperId: 'a', materialId: 'b' }), /恰好填写/);
  assert.match(nodeTargetError({ kind: 'unit', unitRef: { routeId: 'r' } }), /unitId/);
  assert.equal(nodeTargetKey({ kind: 'article', materialId: 'm' }), 'article:m');
});

test('A02（反例）：新旧 route 冲突、缺 status、pending 无原因、external 越位均拒绝', () => {
  const cases = [
    [(lib) => { lib.directions[0].route = [{ paperId: 'beyond', purpose: 'p', readWhen: 'r', check: 'c' }]; }, /route 不得与 startRoute/],
    [(lib) => { delete lib.directions[0].status; }, /必须显式 status/],
    [(lib) => { delete lib.directions[0].startRoute; }, /startRoute 必须是数组/],
    [(lib) => { delete lib.directions[0].archiveRoute; }, /archiveRoute 必须是数组/],
    [(lib) => { lib.directions[0].startRoute[0].availability = 'pending'; }, /pendingReason/],
    [(lib) => { lib.directions[0].startRoute[0] = { id: 'x1', kind: 'external', title: 't', role: 'r', note: 'n', url: 'https://example.com', availability: 'ready', checkedAt: '2026-09-22' }; }, /external 只允许出现在 archiveRoute/],
    [(lib) => { lib.directions[0].archiveRoute[0].url = 'http://insecure.example'; }, /url 必须是 https/],
  ];
  for (const [mutate, pattern] of cases) {
    const lib = scaffoldFixture();
    mutate(lib);
    const result = validateLibrary(lib);
    assert.equal(result.ok, false, pattern);
    assert.match(result.errors.join('\n'), pattern);
  }
});

test('A03（正反例）：Explain 二选一、失效引用、空 blocks、Skip 无 why、quick 动作', () => {
  const good = scaffoldFixture();
  assert.equal(validateLibrary(good).ok, true, '正例应通过');
  const cases = [
    [(lib) => { lib.papers[2].readingActions.explain[0].sectionId = 'design'; }, /只能二选一/],
    [(lib) => { lib.papers[2].readingActions.explain[0].blocks = []; }, /blocks 必须是非空数组/],
    [(lib) => { lib.papers[2].readingActions.explain[0].sectionId = 'ghost'; delete lib.papers[2].readingActions.explain[0].blocks; }, /本卡不渲染的正文 section/],
    [(lib) => { delete lib.papers[2].readingActions.explain[0].blocks; }, /只有 target\/why 不算讲解/],
    [(lib) => { delete lib.papers[2].readingActions.skip[0].why; }, /缺少 why/],
  ];
  for (const [mutate, pattern] of cases) {
    const lib = scaffoldFixture();
    mutate(lib);
    const result = validateLibrary(lib);
    assert.equal(result.ok, false, pattern);
    assert.match(result.errors.join('\n'), pattern);
  }
});

test('A04：typed 首页入口解析与冲突拒绝；旧 startHerePaperId 单独可读', () => {
  const lib = scaffoldFixture();
  const resolved = resolveNodeTarget(lib, lib.home.startHere);
  assert.equal(resolved.kind, 'article');
  assert.equal(resolved.title, '测试材料 mat-map');
  assert.match(resolved.href, /^#\/material\/mat-map$/);
  assert.equal(getPaper(lib, lib.home.startHere.materialId), null, '材料 id 不得送给 getPaper');
  assert.ok(getMaterial(lib, 'mat-map'), 'getMaterial 应解析材料');
  // 非首节点失败。
  const notFirst = scaffoldFixture();
  notFirst.home.startHere = { kind: 'paper', paperId: 'tax', routeId: 'collab', track: 'start' };
  assert.match(validateLibrary(notFirst).errors.join('\n'), /第一节点/);
  // 两字段并存失败。
  const both = scaffoldFixture();
  both.home.startHerePaperId = 'beyond';
  assert.match(validateLibrary(both).errors.join('\n'), /不得同时存在/);
  // 旧字段单独存在仍可读（兼容层）。
  const legacy = validLibrary();
  assert.equal(validateLibrary(legacy).ok, true, '旧 startHerePaperId 单独可读');
});

test('A05：hash query 往返与非法参数拒绝；无 query 旧形状不变', () => {
  const round = [
    ['#/material/mat-map?route=collab&track=start', { view: 'material', id: 'mat-map', routeId: 'collab', track: 'start' }],
    ['#/paper/tax?route=collab&track=archive', { view: 'paper', id: 'tax', routeId: 'collab', track: 'archive' }],
    ['#/learn/tech-multiagent?unit=ma-u2', { view: 'learnRoute', id: 'tech-multiagent', unitId: 'ma-u2' }],
    ['#/learn/tech-multiagent?route=collab&track=start&unit=ma-u1', { view: 'learnRoute', id: 'tech-multiagent', routeId: 'collab', track: 'start', unitId: 'ma-u1' }],
  ];
  for (const [hash, expected] of round) assert.deepEqual(parseHash(hash), expected, hash);
  const built = buildContextHash('material', 'mat map', { routeId: 'collab', track: 'start' });
  assert.deepEqual(parseHash(built), { view: 'material', id: 'mat map', routeId: 'collab', track: 'start' });
  const bad = [
    '#/paper/tax?route=collab',
    '#/paper/tax?track=start',
    '#/paper/tax?route=collab&track=side',
    '#/paper/tax?route=collab&track=start&unit=ma-u1',
    '#/paper/tax?unit=ma-u1',
    '#/directions?route=collab&track=start',
    '#/paper/tax?route=a&route=b&track=start',
    '#/paper/tax?route=collab&track=start&extra=1',
    '#/paper/tax?route=collab&track=start#frag',
    '#/paper/tax?%',
    '#/learn/tech-multiagent?route=collab&track=start',
  ];
  for (const hash of bad) assert.equal(parseHash(hash), null, hash);
  // 无 query 的旧返回形状保持 { view, id }。
  assert.deepEqual(parseHash('#/paper/tax'), { view: 'paper', id: 'tax' });
  assert.deepEqual(parseHash('#/home'), { view: 'home', id: null });
});

test('A06/A08（fixture）：track 导航、active 过滤与 archive 关联保留', () => {
  const lib = scaffoldFixture();
  const entries = trackEntries(lib, 'collab', 'start');
  assert.deepEqual(entries.map((e) => e.id), ['step-collab-1', 'step-collab-2', 'step-collab-3']);
  const pos = trackPosition(lib, 'collab', 'start', { kind: 'paper', paperId: 'beyond' });
  assert.equal(pos.index, 2);
  assert.equal(pos.prev.resolved.title, '测试材料 mat-map');
  assert.equal(pos.next.paperId, 'tax');
  // 不在 track 内的目标返回 null（渲染层据此显示未找到提示，不静默套其他路线）。
  assert.equal(trackPosition(lib, 'collab', 'start', { kind: 'paper', paperId: 'debt' }), null);
  // active 过滤与 deferred 保留。
  assert.deepEqual(activeDirections(lib).map((d) => d.id), ['collab']);
  assert.equal(directionStatusOf(lib.directions[1]), 'deferred');
  // routesContaining 携带 track 且保留 archive 关联（A08）。
  const positions = routesContaining(lib, 'beyond');
  assert.deepEqual(positions.map((p) => [p.direction.id, p.track]), [['collab', 'start'], ['deferred-d', 'archive']]);
  // 无上下文旧链接：唯一属于 active startRoute 时推导起步上下文。
  assert.deepEqual(inferStartContext(lib, { kind: 'paper', paperId: 'tax' }), { routeId: 'collab', track: 'start' });
  assert.equal(inferStartContext(lib, { kind: 'paper', paperId: 'le' }), null, '不在任何 active startRoute 内不得推导');
  // directionTracks 旧格式回退。
  const legacy = validLibrary();
  const lt = directionTracks(legacy, legacy.directions[0]);
  assert.equal(lt.mode, 'legacy');
  assert.equal(lt.start.length, legacy.directions[0].route.length);
  // targetPositions 对材料同样适用。
  const matPos = targetPositions(lib, { kind: 'article', materialId: 'mat-map' });
  assert.equal(matPos.length, 1);
  assert.equal(matPos[0].next.paperId, 'beyond');
});

test('A11：tech-t4 显式别名、featured 排序、labPath 精确值与单元规则', () => {
  const lib = scaffoldFixture();
  assert.equal(getTechnicalRoute(lib, 'tech-t4').id, 'tech-rag', '旧 id 显式别名到规范 id');
  assert.equal(getTechnicalRoute(lib, 'tech-rag').id, 'tech-rag');
  assert.equal(getTechnicalRoute(lib, 'tech-t1').id, 'tech-t1', '精确 id 优先');
  assert.deepEqual(featuredTechnicalRoutes(lib).map((r) => r.id), ['tech-multiagent', 'tech-rag', 'tech-graph-simple']);
  assert.equal(MULTIAGENT_LAB_PATH, '/learning/multiagent-lab.md');
  assert.deepEqual([...MULTIAGENT_LAB_SECTIONS], ['ma-u1', 'ma-u2', 'ma-u3', 'ma-u4']);
  const cases = [
    [(l) => { l.technicalRoutes[0].units[0].labPath = '/learning/other.md'; }, /labPath 只允许精确值/],
    [(l) => { l.technicalRoutes[0].units[0].labSection = 'ma-u9'; }, /labSection 必须是/],
    [(l) => { l.technicalRoutes[0].units[0].lesson = { blocks: [{ kind: 'paragraph', spans: [{ kind: 'text', text: 'x' }] }] }; }, /只能二选一/],
    [(l) => { l.technicalRoutes[0].units[0].resourceIds = []; }, /非空 resourceIds 或非空 lesson\.blocks/],
    [(l) => { l.technicalRoutes[0].units[0].resourceIds = []; l.technicalRoutes[0].units[0].lesson = { blocks: [] }; }, /非空 resourceIds 或非空 lesson\.blocks/],
    [(l) => { l.technicalRoutes[0].units[0].availability = 'pending'; }, /pendingReason/],
    [(l) => { delete l.technicalRoutes[0].resources[0].primary; }, /ready 资源型单元恰有 1 个主资源/],
    [(l) => { l.technicalRoutes[0].kind = 'special'; }, /kind 必须是 core\|advanced\|featured/],
    [(l) => { l.technicalRoutes[2].units[0].resourceIds = ['res-lg']; }, /只能二选一|无法解析/],
  ];
  for (const [mutate, pattern] of cases) {
    const fixture = scaffoldFixture();
    mutate(fixture);
    const result = validateLibrary(fixture);
    assert.equal(result.ok, false, pattern);
    assert.match(result.errors.join('\n'), pattern);
  }
});

test('A13：quick 依据文案共同函数（摘要级 vs 指定正文已核）', () => {
  const lib = scaffoldFixture();
  const abstractQuick = lib.papers[0];
  const partialQuick = lib.papers[2];
  assert.equal(depthBasisLabel(abstractQuick), '摘要级判断');
  assert.equal(depthBasisLabel(partialQuick), '简读卡 · 摘要及指定正文已核');
  // quick + partial-text 必须登记 sections；缺登记拒绝。
  const bad = scaffoldFixture();
  bad.papers[2].coverage.sections = [];
  assert.match(validateLibrary(bad).errors.join('\n'), /coverage\.sections 登记已核正文范围/);
  // 有正文不自动升 standard：quick 有正文 sections 仍拒绝。
  const bad2 = scaffoldFixture();
  bad2.papers[0].sections = [{ id: 's1', heading: 'h', blocks: [{ kind: 'paragraph', spans: [{ kind: 'text', text: 'x' }] }] }];
  assert.match(validateLibrary(bad2).errors.join('\n'), /不应有正文 sections/);
});
