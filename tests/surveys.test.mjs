import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SURVEYS } from '../public/content/surveys.js';
import { parseHash } from '../public/library.js';
import { articleGraphModel, normalizeMapState, surveyUnitUrl, validateTopicMap } from '../public/survey-graph.js';

test('SURVEY-013 只按真实进度区分候选与部分阅读包，不伪装为 complete', () => {
  assert.equal(SURVEYS.schemaVersion, 1);
  assert.deepEqual(SURVEYS.articles.map((item) => item.id), [
    'survey-agent-evaluation-2026',
    'survey-autonomous-agents-fcs-2024',
    'survey-llm-agents-arxiv-2023',
  ]);
  for (const item of SURVEYS.articles) {
    assert.ok(['candidate', 'partial'].includes(item.state));
    assert.ok(item.localFileName.endsWith('.pdf'));
    assert.ok(!/[\\/]/.test(item.localFileName), 'public record contains basename only');
    assert.ok(item.brief && item.scope && item.relevance && item.limits);
  }
  const first = SURVEYS.articles[0];
  assert.equal(first.state, 'partial');
  assert.ok(first.units.some((unit) => unit.id === 'benchmark-dimensions'));
  assert.equal(first.coverage.readSections.includes('§8'), true);
  assert.equal(first.coverage.taughtSections.includes('§8'), true);
  assert.ok(first.coverage.notYetTaught.some((section) => section.includes('References')));
  assert.equal(first.coverage.visualFiguresAndTables.length > 0, true);
  const second = SURVEYS.articles[1];
  assert.equal(second.state, 'partial');
  assert.ok(second.units.some((unit) => unit.id === 'fcs-memory-design'));
  assert.equal(second.units.find((unit) => unit.id === 'fcs-memory-design').graph.axes.length, 3);
  const third = SURVEYS.articles[2];
  assert.equal(third.state, 'partial');
  assert.ok(third.units.some((unit) => unit.id === 'rise-perception-action'));
  assert.equal(third.units.find((unit) => unit.id === 'rise-perception-action').graph.axes.length, 3);
  assert.ok(third.coverage.readSections.includes('§3.1'));
  assert.ok(third.coverage.taughtSections.includes('§7'));
  assert.ok(third.coverage.notYetTaught.some((section) => section.includes('References')));
  assert.equal(third.coverage.visualFiguresAndTables.length > 0, true);
  for (const article of SURVEYS.articles) for (const unit of article.units) {
    assert.ok(unit.lead && unit.blocks.length >= 3);
    assert.ok(unit.blocks.every((block) => block.text || (block.headers && block.rows)), 'blocks must contain prose or structured comparison data');
  }
  assert.ok(second.readingPaths[0].steps.every((step) => second.units.some((unit) => unit.id === step.unitId)));
  const benchmark = first.units.find((unit) => unit.id === 'benchmark-dimensions');
  assert.equal(benchmark.graph.axes.length, 5);
  assert.ok(benchmark.graph.axes.every((axis) => benchmark.blocks.some((block) => block.type === 'heading' && block.id === axis.targetHeadingId)));
  assert.equal(benchmark.blocks.find((block) => block.type === 'comparison').rows.length, 8);
});

test('综述单元可深链；文章间互补关系有两端单元锚点', () => {
  assert.deepEqual(parseHash('#/survey/survey-agent-evaluation-2026'), {
    view: 'survey', id: 'survey-agent-evaluation-2026',
  });
  assert.deepEqual(parseHash('#/survey/survey-agent-evaluation-2026/unit/separate-model-harness'), {
    view: 'survey', id: 'survey-agent-evaluation-2026', unitId: 'separate-model-harness',
  });
  assert.equal(SURVEYS.relations.length, 3);
  assert.equal(SURVEYS.relations[0].kind, 'complements');
  assert.ok(SURVEYS.relations[0].fromUnitIds.length > 0);
  assert.ok(SURVEYS.relations[0].toUnitIds.length > 0);
});

test('综述页面不以 HTML 字符串注入正文', async () => {
  const source = await readFile(new URL('../public/surveys.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.match(source, /textContent/);
});

test('整篇图覆盖全部阅读单元，原文目录映射不因图中分组被丢弃', () => {
  for (const article of SURVEYS.articles) {
    assert.deepEqual(validateTopicMap(article), []);
    if (!article.units) continue;
    const graph = articleGraphModel(article);
    assert.deepEqual(new Set(graph.nodes.map((n) => n.unitId)), new Set(article.units.map((u) => u.id)));
    for (const section of article.outline) for (const id of section.unitIds) {
      assert.ok(graph.nodes.some((n) => n.unitId === id));
    }
    for (const node of graph.nodes) {
      assert.ok(node.unit && node.x >= 0 && node.x + node.width < graph.width);
      assert.ok(node.y + node.height < graph.height);
      assert.deepEqual(parseHash(surveyUnitUrl(article.id, node.unitId)), { view: 'survey', id: article.id, unitId: node.unitId });
    }
    for (const [i, a] of graph.nodes.entries()) for (const b of graph.nodes.slice(i + 1)) {
      assert.ok(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y, 'node rectangles must not overlap');
    }
  }
});

test('图的折叠不删除正文，附录可还原，建议读序不伪装成作者关系', () => {
  const article = SURVEYS.articles[0];
  const state = normalizeMapState(article);
  const graph = articleGraphModel(article, state.collapsed);
  assert.equal(graph.nodes.length, article.units.length);
  assert.equal(graph.nodes.filter((n) => !n.visible).length, 3);
  assert.equal(articleGraphModel(article, []).nodes.every((n) => n.visible), true);
  assert.ok(graph.reading.every((edge) => edge.origin === 'editorial' && edge.kind === 'reading'));
  assert.ok(graph.relations.every((edge) => edge.kind === 'relation'));
});

test('图状态只恢复有效节点、分组和有界缩放', () => {
  const article = SURVEYS.articles[0];
  const state = normalizeMapState(article, { selected: 'missing', collapsed: ['missing', 'appendices'], zoom: 99, scrollLeft: -3, scrollTop: Infinity });
  assert.equal(state.selected, 'survey-scope');
  assert.deepEqual(state.collapsed, ['appendices']);
  assert.equal(state.zoom, 1.8);
  assert.equal(state.scrollLeft, 0);
  assert.equal(state.scrollTop, 0);
  assert.equal(normalizeMapState(article, { selected: 'core-capabilities', zoom: .1 }).zoom, .65);
});

test('图校验拒绝孤立阅读单元、悬空边和缺依据的作者边', () => {
  const article = structuredClone(SURVEYS.articles[0]);
  article.topicMap.groups[0].items.pop();
  article.topicMap.relations.push({ from: 'missing', to: 'survey-scope', origin: 'author', label: 'x', reason: 'x' });
  const errors = validateTopicMap(article);
  assert.ok(errors.some((e) => e.includes('unreachable')));
  assert.ok(errors.includes('unknown relation endpoint'));
  assert.ok(errors.includes('author relation requires source'));
});

test('阅读样板保留实际分类、机制及例子，不只验证字数', () => {
  const fcs = SURVEYS.articles[1];
  const architecture = fcs.units.find((u) => u.id === 'fcs-architecture');
  assert.ok(architecture.blocks.some((b) => b.text?.includes('PDDL')));
  assert.ok(architecture.blocks.some((b) => b.text?.includes('模型反馈')));
  const capability = fcs.units.find((u) => u.id === 'fcs-capabilities');
  const mechanisms = capability.blocks.find((b) => b.type === 'comparison');
  assert.deepEqual(mechanisms.rows.map((r) => r[0]), ['试错', '群体协作', '经验积累', '自驱演化']);
  assert.ok(fcs.units.find((u) => u.id === 'fcs-evaluation').blocks.some((b) => b.text?.includes('指标、协议、基准')) || fcs.units.find((u) => u.id === 'fcs-evaluation').blocks.some((b) => b.text?.includes('指标、协议')));
  const harness = SURVEYS.articles[0].units.find((u) => u.id === 'separate-model-harness');
  assert.equal(harness.blocks.find((b) => b.type === 'comparison').role, 'teaching-example');
  assert.ok(harness.blocks.some((b) => b.text?.includes('交互效应')));
  const rise = SURVEYS.articles[2];
  assert.ok(rise.units.find((u) => u.id === 'rise-scope').blocks.some((b) => b.text?.includes('World Scope')));
  const whyLlm = rise.units.find((u) => u.id === 'rise-background').blocks.find((b) => b.type === 'comparison');
  assert.deepEqual(whyLlm.rows.map((r) => r[0]), ['自主性', '反应性', '主动性', '社会能力']);
  const multi = rise.units.find((u) => u.id === 'rise-practice').blocks.find((b) => b.type === 'comparison');
  assert.deepEqual(multi.rows.map((r) => r[0]), ['无序合作', '有序合作', '对抗/辩论']);
  assert.ok(rise.units.find((u) => u.id === 'rise-discussion').blocks.some((b) => b.text?.includes('持续演化')));
});
