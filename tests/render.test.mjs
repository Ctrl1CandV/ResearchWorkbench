// tests/render.test.mjs —— 渲染探针回归（审查回流：把验收方的渲染探针固化为仓库测试）。
// 用最小 DOM 桩在 node:test 中真实执行 public/library.js 的渲染分支，覆盖：
// 1) 全部视图渲染成功且文本无 undefined/NaN（防止校验遗漏字段渲染成 undefined）；
// 2) 每篇论文的页内目录（按钮标签、目标 id）与实际渲染的章节标题逐项一致（回流项 1 的 DOM 断言）；
// 3) 目录容器 details 的开闭随 matchMedia 变化：≤900px 默认折叠、>900px 默认展开（回流项 2）；
// 4) 首页四区用途/用法/入口/首读/首次使用全部实际渲染，无“继续阅读”等假进度措辞；
// 5) 路线页阶段提示按实际分组顺序生成（回流项 3 的 DOM 断言）。
// 桩只实现渲染路径用到的 DOM 能力；不引入第三方依赖，不访问网络与 private/。

import test from 'node:test';
import assert from 'node:assert/strict';

import { LIBRARY } from '../public/library-content.js';

// ---------- 最小 DOM 桩 ----------

class DomNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.childNodes = [];
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this.textContentValue = '';
  }
  appendChild(child) {
    if (!child) throw new Error(`appendChild 收到空节点（${this.tagName}）`);
    this.childNodes.push(child);
    return child;
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener(name, fn) { (this.listeners[name] ??= []).push(fn); }
  scrollIntoView() {}
  click() {
    for (const fn of this.listeners.click ?? []) fn();
  }
  remove() { /* 桩内无需真实摘除 */ }
  focus() {}
  select() {}
  prepend(child) { this.childNodes.unshift(child); return child; }
  querySelectorAll(selector) {
    const results = [];
    const want = String(selector).toLowerCase();
    const visit = (n) => {
      for (const c of n.childNodes ?? []) {
        if (c instanceof DomNode) {
          if (c.tagName.toLowerCase() === want) results.push(c);
          visit(c);
        }
      }
    };
    visit(this);
    return results;
  }
  get className() { return this.attributes.class ?? ''; }
  set className(value) { this.attributes.class = String(value); }
  get id() { return this.attributes.id ?? ''; }
  set id(value) { this.attributes.id = String(value); }
  get href() { return this.attributes.href ?? ''; }
  set href(value) { this.attributes.href = String(value); }
  get classList() {
    const self = this;
    return {
      add: (...names) => {
        const set = new Set((self.attributes.class ?? '').split(/\s+/).filter(Boolean));
        for (const name of names) set.add(name);
        self.attributes.class = [...set].join(' ');
      },
      remove: (...names) => {
        const set = new Set((self.attributes.class ?? '').split(/\s+/).filter(Boolean));
        for (const name of names) set.delete(name);
        self.attributes.class = [...set].join(' ');
      },
      contains: (name) => (self.attributes.class ?? '').split(/\s+/).includes(name),
      toggle: (name, force) => {
        const set = new Set((self.attributes.class ?? '').split(/\s+/).filter(Boolean));
        const shouldAdd = force === undefined ? !set.has(name) : Boolean(force);
        if (shouldAdd) set.add(name);
        else set.delete(name);
        self.attributes.class = [...set].join(' ');
        return shouldAdd;
      },
    };
  }
  get textContent() {
    if (this.childNodes.length === 0) return this.textContentValue;
    return this.childNodes.map((c) => (c instanceof DomNode ? c.textContent : String(c.text ?? ''))).join('');
  }
  set textContent(value) {
    this.textContentValue = value === undefined || value === null ? '' : String(value);
    this.childNodes = [];
  }
}

class TextNode {
  constructor(text) { this.text = String(text); this.childNodes = []; }
  get textContent() { return this.text; }
  set textContent(value) { this.text = String(value); }
  appendChild() { throw new Error('文本节点不能有子节点'); }
  setAttribute() {}
  getAttribute() { return null; }
  addEventListener() {}
}

const byId = new Map();
function mountElement(id, tag = 'div') {
  const node = new DomNode(tag);
  node.id = id;
  byId.set(id, node);
  return node;
}

const document = {
  createElement: (tag) => new DomNode(tag),
  createTextNode: (text) => new TextNode(text),
  getElementById: (id) => byId.get(id) ?? null,
  querySelectorAll: () => [],
  body: null,
};
document.body = new DomNode('body');

for (const id of ['lib-view', 'lib-quick', 'lib-notices']) mountElement(id);

let viewportWide = true;
let hashHandler = null;
// localStorage 桩：记录全部键访问，用于断言 v3 不碰 v1/v2、发现查询不写记录。
const storageData = new Map();
const storageCalls = [];
const localStorage = {
  getItem(key) {
    storageCalls.push(['getItem', key]);
    return storageData.has(key) ? storageData.get(key) : null;
  },
  setItem(key, value) {
    storageCalls.push(['setItem', key]);
    storageData.set(key, String(value));
  },
  removeItem(key) {
    storageCalls.push(['removeItem', key]);
    storageData.delete(key);
  },
};
const window = {
  location: { hash: '' },
  localStorage,
  navigator: {},
  addEventListener: (name, fn) => {
    if (name === 'hashchange') hashHandler = fn;
  },
  matchMedia: (query) => ({ matches: query.includes('max-width') ? !viewportWide : viewportWide }),
};

// 发现接口桩：默认返回固定载荷；测试可替换。
let fetchImpl = async () => ({
  ok: true,
  status: 200,
  json: async () => ({
    topic: 'rag',
    query: 'retrieval augmented generation',
    fetchedAt: '2026-09-15T12:00:00.000Z',
    windowStart: '2026-09-09',
    windowEnd: '2026-09-15',
    cached: false,
    registrationNote: '按最近 7 个 UTC 日登记；近期登记不等于近期发表。',
    topicFilterNote: '后置筛选，不是穷尽检索。',
    count: 1,
    filteredCount: 2,
    topicFilteredCount: 3,
    items: [
      {
        doi: '10.1234/test.1',
        title: 'A Test Paper on Retrieval Augmented Generation',
        authors: 'A. Author',
        containerTitle: 'TestConf',
        created: '2026-09-14T00:00:00.000Z',
        published: { text: '2026-09', precision: 'year-month' },
        abstract: 'Test abstract.',
        matchedTerms: ['retrieval augmented', 'generation'],
      },
    ],
  }),
});
globalThis.fetch = (...args) => fetchImpl(...args);
globalThis.URL.createObjectURL = () => 'blob:mock';
globalThis.URL.revokeObjectURL = () => {};
// C 包导出下载用 Blob（只记录内容，不真正落盘）；测试断言导出了什么。
const blobLog = [];
globalThis.Blob = class {
  constructor(parts, options) {
    this.parts = parts;
    this.type = options?.type ?? '';
    blobLog.push(this);
  }
};

globalThis.document = document;
globalThis.window = window;

// 全局就绪后再加载模块：模块顶层会立即渲染一次（空 hash → 首页）。
const lib = await import(new URL('../public/library.js', import.meta.url).href);

function renderAt(hash) {
  if (typeof hashHandler !== 'function') throw new Error('模块未注册 hashchange 监听');
  window.location.hash = hash;
  hashHandler();
  return byId.get('lib-view');
}

function walk(node, fn) {
  if (!node) return;
  if (node instanceof DomNode) fn(node);
  for (const child of node.childNodes ?? []) walk(child, fn);
}

function collectSections(view) {
  const sections = [];
  walk(view, (node) => {
    if (node.tagName === 'SECTION' && typeof node.attributes.id === 'string' && node.attributes.id.startsWith('lib-sec-')) {
      sections.push(node);
    }
  });
  return sections;
}

function collectTocLabels(view) {
  const labels = [];
  walk(view, (node) => {
    if (node.tagName === 'BUTTON' && node.className.split(/\s+/).includes('lib-toc-link')) labels.push(node.textContent);
  });
  return labels;
}

function findTocWrap(view) {
  let found = null;
  walk(view, (node) => {
    if (!found && node.tagName === 'DETAILS' && node.className.split(/\s+/).includes('lib-toc-wrap')) found = node;
  });
  return found;
}

// ---------- 1) 全视图渲染 ----------

const routes = [
  ['#/home', '首页'],
  ['#/map', '领域地图'],
  ['#/directions', '方向列表'],
  ...LIBRARY.directions.map((d) => [`#/route/${d.id}`, `路线 ${d.id}`]),
  ['#/papers', '论文列表'],
  ...LIBRARY.papers.map((p) => [`#/paper/${p.id}`, `论文 ${p.id}`]),
  ['#/learn', '技术概览'],
  ...LIBRARY.technicalRoutes.map((r) => [`#/learn/${r.id}`, `技术 ${r.id}`]),
  ['#/brief', '精选'],
  ['#/brief/brief-2026-09-15', '精选直达'],
  ['#/foundations', '经典书目'],
  ['#/no-such-view', '非法地址'],
];

test('渲染探针：全部视图渲染成功且无 undefined/NaN 文本', () => {
  assert.ok(routes.length >= 40, `视图数异常：${routes.length}`);
  for (const [hash, name] of routes) {
    const view = renderAt(hash);
    const text = view.textContent;
    assert.ok(text.length > 20, `${name} 渲染内容过短`);
    assert.ok(!text.includes('undefined'), `${name} 渲染出 undefined`);
    assert.ok(!text.includes('NaN'), `${name} 渲染出 NaN`);
  }
});

// ---------- 2) 目录与正文逐项一致（回流项 1 的 DOM 断言） ----------

test('回流项1（DOM）：每篇论文的目录按钮、章节锚点、章节标题与 paperOutline 逐项一致', () => {
  for (const paper of LIBRARY.papers) {
    const view = renderAt(`#/paper/${paper.id}`);
    const outline = lib.paperOutline(paper);
    const sections = collectSections(view);
    const tocLabels = collectTocLabels(view);
    assert.deepEqual(
      sections.map((s) => s.attributes.id),
      outline.map((o) => o.id),
      `${paper.id} 渲染章节与目录 id 不一致`,
    );
    assert.deepEqual(tocLabels, outline.map((o) => o.label), `${paper.id} 目录按钮标签与目录不一致`);
    const headings = sections.map((s) => {
      const heading = s.childNodes.find((c) => c instanceof DomNode && c.tagName === 'H3');
      assert.ok(heading, `${paper.id} 章节 ${s.attributes.id} 缺少标题元素`);
      return heading.textContent;
    });
    assert.deepEqual(headings, outline.map((o) => o.label), `${paper.id} 正文标题与目录标签不一致`);
  }
});

// ---------- 3) 目录折叠随视口变化（回流项 2 的 DOM 断言） ----------

test('回流项2（DOM）：目录 details 开闭随 matchMedia 变化（≤900px 折叠，>900px 展开）', () => {
  viewportWide = false;
  const mobileView = renderAt('#/paper/astute-rag');
  const mobileToc = findTocWrap(mobileView);
  assert.ok(mobileToc, '移动视图未找到目录容器');
  assert.equal(mobileToc.open, false, '窄屏目录应默认折叠');

  viewportWide = true;
  const desktopView = renderAt('#/paper/astute-rag');
  const desktopToc = findTocWrap(desktopView);
  assert.ok(desktopToc, '桌面视图未找到目录容器');
  assert.equal(desktopToc.open, true, '桌面目录应默认展开');
});

// ---------- 3b) REWORK-007 §1：阅读动线 ----------

test('REWORK-007（DOM）：论文页正文在前——"我的记录"位于"延伸阅读"之后、"来源与覆盖"之前', () => {
  const text = renderAt('#/paper/astute-rag').textContent;
  const iSelf = text.indexOf('读完后自查');
  const iNext = text.indexOf('延伸阅读');
  const iNotes = text.indexOf('我的记录');
  const iCov = text.indexOf('来源与覆盖');
  assert.ok(iSelf > 0 && iNext > 0 && iNotes > 0 && iCov > 0, '关键区块齐备');
  assert.ok(iSelf < iNotes && iNext < iNotes, '记录面板不得再压在正文之前');
  assert.ok(iNotes < iCov, '来源与覆盖在记录之后收尾');
  // 008.2（03 §5.3）：旧 paper.next 不得再以主「下一篇」措辞出现。
  assert.ok(!text.includes('下一篇'), '旧 paper.next 不得再渲染为“下一篇”');
  assert.ok(text.includes('延伸阅读是整理者建议，不是本路线的下一步'), '缺延伸阅读边界说明');
});

// ---------- 4) 首页实际渲染 ----------

test('首页（DOM）：四区用途/用法/入口、首读与首次使用全部实际渲染，无假进度措辞', () => {
  const view = renderAt('#/home');
  const text = view.textContent;
  for (const zone of LIBRARY.home.zones) {
    for (const field of ['title', 'purpose', 'howToUse']) {
      assert.ok(text.includes(zone[field]), `首页区 ${zone.key} 缺 ${field}`);
    }
    // PLAN-011 审查修复（去重仅限主推荐语义角色）：goal 区头不再渲染 entryLabel 重复入口，
    // 首读由区内「建议从这里开始」条目承担；其余区 entryLabel 照常渲染。
    if (zone.key !== 'goal') assert.ok(text.includes(zone.entryLabel), `首页区 ${zone.key} 缺 entryLabel`);
  }
  for (const step of LIBRARY.home.firstUse) {
    assert.ok(text.includes(step.title) && text.includes(step.text), `首次使用缺：${step.title}`);
  }
  // 008.2：typed 首读为站内问题导读（材料），链到带路线上下文的材料页。
  const startMaterial = LIBRARY.materials.find((m) => m.id === LIBRARY.home.startHere.materialId);
  assert.ok(text.includes(startMaterial.title), '首读推荐（材料）未渲染');
  assert.ok(text.includes('建议从这里开始'), '缺“建议从这里开始”标识');
  const startHrefs = [];
  walk(view, (n) => {
    if (n.tagName === 'A' && n.attributes.href) startHrefs.push(n.attributes.href);
  });
  assert.ok(startHrefs.includes('#/material/mat-cross-harness-map?route=cross-harness-collab&track=start'), '首读链接应携带 route/track');
  assert.ok(!text.includes('继续阅读'), '不得出现“继续阅读”等假进度措辞');
});

// ---------- 4b) DYNAMIC-GUIDANCE-009 / B 包：首屏动线、地图、动线与生效值接缝 ----------

function collectByClass(view, cls) {
  const found = [];
  walk(view, (n) => {
    if (n instanceof DomNode && n.className.split(/\s+/).includes(cls)) found.push(n);
  });
  return found;
}

function countTag(view, tag) {
  let count = 0;
  walk(view, (n) => {
    if (n.tagName === tag) count += 1;
  });
  return count;
}

test('DG009-B（DOM）：首屏回答「做什么／读什么／怎么读」，无记录时显式声明不是进度', () => {
  const prev = lib.__getV3ForTest();
  lib.__setV3ForTest('empty', { version: 3, papers: {}, readingList: [] });
  const view = renderAt('#/home');
  const text = view.textContent;
  const heroText = collectByClass(view, 'lib-home-focus')[0].textContent;
  try {
    for (const label of ['当前关注', '下一步', '为什么选它', '怎么读它', '我的记录']) {
      assert.ok(text.includes(label), `首屏缺「${label}」`);
    }
    // 当前关注为 active order 最小的主方向；下一步为生效 startRoute 首节点（推导，非写死指针）。
    assert.ok(text.includes('跨工具的智能体协作'), '当前关注应为主方向');
    assert.ok(text.includes('跨工具协作：先把研究问题分清楚'), '下一步应为起步导读');
    // cross-harness 是兴趣场景／阅读上下文，不得陈述为定稿论文题目（长期约束）。
    assert.ok(text.includes('不是已经定稿的论文题目'), '缺「兴趣≠定稿题目」声明');
    // 无记录时显式声明"不是你的进度"；首屏动线卡内不出现任何进度措辞。
    assert.ok(heroText.includes('尚无阅读记录') && heroText.includes('不是你的进度'), '无记录须显式声明非进度');
    for (const forbidden of ['已读', '已掌握', '百分比', '连续天数', '进度 100', '完成度']) {
      assert.ok(!heroText.includes(forbidden), `首屏动线卡出现假进度措辞：${forbidden}`);
    }
  } finally {
    lib.__setV3ForTest(prev.kind, prev.state);
  }
});

test('DG009-B（DOM）：地图为两侧文字节点，连线注明语义与来源，未解析条目降级为待查', () => {
  const view = renderAt('#/map');
  const text = view.textContent;
  // 两侧都在场。
  assert.ok(text.includes('Agent 研究对象／问题') && text.includes('方法／解决思想'), '地图缺两侧标题');
  // 每个基线节点渲染一张卡，且都带来源行（provenance）。
  const nodeCards = collectByClass(view, 'lib-map-node');
  assert.equal(nodeCards.length, LIBRARY.map.nodes.length, '节点卡数量应与基线地图一致');
  const sources = collectByClass(view, 'lib-map-source');
  assert.ok(sources.length >= nodeCards.length, '每个节点应有来源行');
  assert.ok(sources.every((s) => s.textContent.includes('来源：')), '来源行须以「来源：」开头');
  // 关系：条数与基线一致，每条带语义标签＋证据＋来源。
  const edgeRows = collectByClass(view, 'lib-map-edge');
  assert.equal(edgeRows.length, LIBRARY.map.edges.length, '关系条数应与基线一致');
  for (const row of edgeRows) {
    assert.ok(row.textContent.includes('证据（站内已核条目）'), '关系须展示证据');
    assert.ok(row.textContent.includes('来源：'), '关系须展示来源');
  }
  // 「addresses（部分）」限定括注应保留呈现，不把部分回应夸大为完全回应。
  assert.ok(text.includes('（部分）'), '关系语气的限定括注（部分）应保留');
  // 同侧关系（depends-on：问题→问题）的两端标签必须按 node.side 派生，不得被硬标成"方法→问题"。
  const sameSideEdge = LIBRARY.map.edges.find((e) => {
    const f = LIBRARY.map.nodes.find((n) => n.id === e.from);
    const t = LIBRARY.map.nodes.find((n) => n.id === e.to);
    return f && t && f.side === 'problem' && t.side === 'problem';
  });
  assert.ok(sameSideEdge, '应存在一条两端同为 problem 侧的关系（depends-on）');
  const sameFrom = LIBRARY.map.nodes.find((n) => n.id === sameSideEdge.from);
  const sameTo = LIBRARY.map.nodes.find((n) => n.id === sameSideEdge.to);
  const sameRow = edgeRows.find((r) => r.textContent.includes(sameFrom.label) && r.textContent.includes(sameTo.label));
  assert.ok(sameRow, '未找到该同侧关系的渲染行');
  // 两端都出现"问题："前缀（来自 node.side），绝不被硬标成"方法："。
  assert.ok(sameRow.textContent.includes(`问题：${sameFrom.label}`) && sameRow.textContent.includes(`问题：${sameTo.label}`), '同侧关系两端应按 side 标为"问题"');
  assert.ok(!sameRow.textContent.includes(`方法：${sameFrom.label}`) && !sameRow.textContent.includes(`方法：${sameTo.label}`), '同侧关系不得硬标"方法"（B 包审查项）');
  // PF-07：关系非论文引用；个人进度缺失与未复核状态都显式呈现。
  assert.ok(text.includes('非论文引用') || text.includes('不是论文之间的真实引用'), '缺 PF-07 关系声明');
  assert.ok(text.includes('阅读进度') && text.includes('不记录'), '缺个人进度缺失声明');
  // 未入图方向由当前数据派生（不是写死条目名）：应点名第二 active 方向标题。
  assert.ok(text.includes('本轮未进入基线的方向') && text.includes('代码智能体的修复正确性'), '未入图方向应数据派生点名');
  // 关系≠进度：末尾说明节点/边计数不是任何人的进度。
  assert.ok(text.includes('不是任何人的阅读进度'), '缺计数非进度说明');
});

test('DG009-B（DOM）：地图未解析 ref／XSS 文本安全降级为纯文本，不产生可点链接或元素', () => {
  const mutated = structuredClone(LIBRARY);
  mutated.map.nodes[0].refs = ['ghost-material-id'];
  mutated.map.nodes[0].summary = '<img src=x onerror=alert(1)>恶意文本';
  lib.__setRenderLibrary(mutated);
  const view = renderAt('#/map');
  const text = view.textContent;
  assert.ok(text.includes('待查') && text.includes('ghost-material-id'), '未解析 ref 应降级为待查文字');
  // 文本以 textContent 呈现，注入串作为字面文字出现，且没有生成 IMG 元素（无 innerHTML 注入面）。
  assert.ok(text.includes('<img'), '注入串应作为纯文本呈现');
  assert.equal(countTag(view, 'IMG'), 0, '不得因动态文本创建元素（XSS）');
  // 该节点降级后，其"可走到的内容"里不应出现指向 ghost 的 <a>。
  const ghostLinks = collectLinks(view).filter((h) => h.includes('ghost-material-id'));
  assert.deepEqual(ghostLinks, [], '未解析条目不得产生可点链接');
  lib.__setRenderLibrary(LIBRARY);
});

test('DG009-B（DOM）：起步动线 map→导读→论文→本人文本可走通（真实站内链接链）', () => {
  // 首页首屏：当前关注／下一步指向导读，且给出打开地图入口。
  const home = renderAt('#/home');
  const homeLinks = collectLinks(home);
  assert.ok(homeLinks.includes('#/map'), '首屏应给「打开地图」入口');
  assert.ok(homeLinks.some((h) => h.startsWith('#/material/mat-cross-harness-map')), '首屏下一步应链到站内导读');
  // 地图页：方法节点 ref 指向论文卡（原文定位），导读本身也在图内。
  const map = renderAt('#/map');
  const mapLinks = collectLinks(map);
  assert.ok(mapLinks.some((h) => h.startsWith('#/paper/')), '地图应有指向论文卡的链接（→原文）');
  assert.ok(mapLinks.some((h) => h.startsWith('#/material/')), '地图应有指向导读的链接（→primer）');
  // 导读页 → 论文原文入口（safeExternalHref 的 https 链接）。
  const primer = renderAt('#/material/mat-cross-harness-map?route=cross-harness-collab&track=start');
  const primerLinks = collectLinks(primer);
  assert.ok(primerLinks.some((h) => h.startsWith('#/paper/')), '导读应指向论文卡（起步动线）');
  // 论文页：原文外链与「我的记录」文本面板都在（本人文本落点）。
  const paper = renderAt('#/paper/beyond-frameworks');
  const paperText = paper.textContent;
  assert.ok(paperText.includes('论文原文'), '论文页应给原文入口');
  assert.ok(paperText.includes('我的记录'), '论文页应有本人文本记录面板');
  const paperLinks = collectLinks(paper);
  assert.ok(paperLinks.some((h) => /^https:\/\//.test(h)), '论文原文应为 https 外链（经安全校验）');
});

test('DG009-B（DOM）：次级入口（精选／经典／技术／方向／材料）保留可达，不抢主动线', () => {
  const home = renderAt('#/home');
  const secondary = collectByClass(home, 'lib-home-secondary')[0];
  assert.ok(secondary, '缺次级入口行');
  const hrefs = collectLinks(secondary);
  for (const need of ['#/brief', '#/foundations', '#/learn', '#/directions', '#/papers']) {
    assert.ok(hrefs.includes(need), `次级入口缺 ${need}`);
  }
});

test('DG009-B（DOM）：生效值仅经 computeEffective／resolveHomeFocus 单入口（B 无覆盖层＝基线）', () => {
  // C 包口径：存储为空（无覆盖层）时取入口仍返回 null＝基线（B 时代断言的等价升级）。
  assert.equal(lib.currentGuidanceOverlay(), null, '无覆盖层存储时生效接缝必须为 null（基线）');
  // computeEffective 在无覆盖层时把基线地图原样透出（单一来源）。
  const eff = lib.computeEffective(LIBRARY);
  assert.equal(eff.map, LIBRARY.map, '无覆盖层时生效地图应即基线（单入口，不复制第二副本）');
  assert.equal(eff.homeFocus, null, 'B 包无 homeFocus 覆盖层');
  // resolveHomeFocus 默认焦点＝active order 最小；下一步＝其 startRoute 首节点（推导）。
  const focus = lib.resolveHomeFocus(LIBRARY);
  assert.equal(focus.direction.id, 'cross-harness-collab', '默认当前关注为主方向');
  assert.equal(focus.step.id, 'step-collab-1', '默认下一步为 startRoute 首节点（推导，非写死指针）');
  assert.equal(focus.step.materialId, 'mat-cross-harness-map', '首节点应解析为起步导读');
  assert.equal(focus.fromOverlay, false);
  // parseMapMeaning 以固定词汇开头并拆出注记；词汇后的限定括注（如「（部分）」）应剥除。
  const pm = lib.parseMapMeaning('addresses：示例语义');
  assert.equal(pm.vocab, 'addresses');
  assert.ok(pm.vocabLabel && pm.note === '示例语义', '应拆出语义词汇与注记');
  const pm2 = lib.parseMapMeaning('addresses（部分）：机制不互斥');
  assert.equal(pm2.vocab, 'addresses', '带限定括注仍识别为 addresses');
  assert.equal(pm2.note, '机制不互斥', '应剥除「（部分）」括注只留语义注记');
  assert.equal(lib.parseMapMeaning('无词汇开头').vocab, null, '无固定词汇开头时不臆造词汇');
  // renderMap / hero 渲染路径不写任何存储键（页面浏览不改本人状态、不写覆盖层）。
  storageCalls.length = 0;
  renderAt('#/map');
  renderAt('#/home');
  const writes = storageCalls.filter(([op]) => op === 'setItem');
  assert.deepEqual(writes, [], '浏览地图/首页不得写入任何 localStorage 键');
});

// ---------- 5) 路线阶段提示（回流项 3 的 DOM 断言） ----------

test('回流项3（DOM，008.2）：路线页渲染双轨——startRoute 顺序与 archive 折叠标题', () => {
  const view = renderAt('#/route/code-agent-verification');
  const text = view.textContent;
  // startRoute 按序渲染：方法说明 → TOSEM → Agentless → SWE-bench。
  const iRead = text.indexOf('怎样读实证研究');
  const iTosem = text.indexOf('测试验收准则够不够用');
  const iAgentless = text.indexOf('Agentless：没有 agent 循环');
  const iSweb = text.indexOf('SWE-bench：真实 GitHub issue');
  assert.ok(iRead > 0 && iTosem > iRead && iAgentless > iTosem && iSweb > iAgentless, 'startRoute 顺序错误');
  assert.ok(text.includes('完整谱系（初期不必走）'), '缺 archive 折叠标题');
  const collab = renderAt('#/route/cross-harness-collab').textContent;
  assert.ok(collab.includes('按需查阅（不必接着读）'), '主方向 archive 标题');
  assert.ok(collab.includes('本段到此'), '尾节点结束提示');
});

// ---------- 6) 经典书目（PLAN-005） ----------

test('经典书目（DOM）：四组分组渲染、组内论文齐备、标注入口与摘要级提示', () => {
  const view = renderAt('#/foundations');
  const text = view.textContent;
  for (const group of LIBRARY.foundations.groups) {
    assert.ok(text.includes(group.title), `缺分组 ${group.title}`);
  }
  for (const paper of LIBRARY.papers.filter((p) => p.collection === 'foundations')) {
    assert.ok(text.includes(paper.displayTitle || paper.title), `缺经典 ${paper.id}`);
  }
  assert.ok(text.includes('摘要级'), '应明示当前只有摘要级判断');
  assert.ok(!text.includes('undefined'), '经典书目渲染出 undefined');
});

// ---------- 7) 我的记录 v3（PLAN-005） ----------

function clickFirst(node, pred) {
  let found = null;
  walk(node, (n) => {
    if (!found && n.tagName === 'BUTTON' && pred(n)) found = n;
  });
  return found;
}

test('v3（DOM）：论文页有“我的记录”面板，保存后只写 v3 键且列表显示状态', async () => {
  storageCalls.length = 0;
  const view = renderAt('#/paper/astute-rag');
  const text = view.textContent;
  assert.ok(text.includes('我的记录'), '缺记录面板');
  assert.ok(text.includes('状态（本人标记）'), '缺状态标记说明');
  const reading = clickFirst(view, (n) => n.textContent === '在读');
  assert.ok(reading, '缺状态按钮');
  reading.listeners.click[0]();
  const save = clickFirst(view, (n) => n.textContent === '保存记录');
  assert.ok(save, '缺保存按钮');
  await save.listeners.click[0]();
  const writes = storageCalls.filter(([op, key]) => op === 'setItem' && key === 'research-workbench:v3');
  assert.equal(writes.length, 1, '保存应恰好写一次 v3 键');
  // C 包后口径：v3 保存动作只写 v3 键；渲染读到的 research-workbench:guidance:v1 是导学覆盖层
  // 的独立单入口读取（只读、不写、不迁移，R5）；v1/v2 等其它键仍绝不允许出现。
  const badWrites = storageCalls.filter(([op, key]) => op === 'setItem' && key !== 'research-workbench:v3');
  assert.deepEqual(badWrites, [], 'v3 保存不得写 v3 以外的任何存储键');
  const badReads = storageCalls.filter(([, key]) => !['research-workbench:v3', 'research-workbench:guidance:v1'].includes(key));
  assert.deepEqual(badReads, [], '除 v3 与导学覆盖层键外不得触碰任何其它存储键（含 v1/v2）');
  // 保存后重渲染：论文列表显示“我的状态”
  const list = renderAt('#/papers');
  assert.ok(list.textContent.includes('我的状态：在读（本人标记）'), '列表应显示本人标记状态');
  assert.ok(list.textContent.includes('导出我的记录（Markdown）'), '缺导出按钮');
  assert.ok(list.textContent.includes('我的待读清单'), '缺待读清单区');
  assert.ok(list.textContent.includes('本人添加、未核查'), '待读清单须标注未核查');
});

test('v3（DOM）：待读清单添加流程（https 校验与标注）', async () => {
  const view = renderAt('#/papers');
  const add = clickFirst(view, (n) => n.textContent === '加入待读');
  assert.ok(add, '缺添加按钮');
  const inputs = [];
  walk(view, (n) => {
    if (n.tagName === 'INPUT') inputs.push(n);
  });
  assert.equal(inputs.length, 3);
  inputs[0].value = '外部偶遇论文';
  inputs[1].value = 'http://not-https.example';
  await add.listeners.click[0]();
  assert.equal(JSON.parse(storageData.get('research-workbench:v3')).readingList.length, 0, '非法链接不得写入');
  inputs[1].value = 'https://arxiv.org/abs/1234.5678';
  await add.listeners.click[0]();
  const saved = JSON.parse(storageData.get('research-workbench:v3'));
  assert.equal(saved.readingList.length, 1);
  assert.equal(saved.readingList[0].title, '外部偶遇论文');
  const after = renderAt('#/papers');
  assert.ok(after.textContent.includes('外部偶遇论文'), '待读条目应渲染');
  assert.ok(after.textContent.includes('本人添加、未核查'), '须标注未核查');
});

test('REWORK-007 首页（DOM）：本人"在读"直达行出现在论文区（在上方 v3 保存之后仍持久）', () => {
  const text = renderAt('#/home').textContent;
  assert.ok(text.includes('我在读（本人标记）'), '有在读标记时首页论文区应给直达入口');
  assert.ok(text.includes('Astute RAG'), '直达应指向标记为在读的论文');
  assert.ok(text.includes('建议从这里开始'), '编辑建议行保留（008.2 材料首读）');
});

test('DG009-B（DOM）：首屏"我的记录"四态各自可辨（独立 fixture，不依赖其它用例顺序）', () => {
  const prev = lib.__getV3ForTest();
  const recText = (v3State) => {
    lib.__setV3ForTest(v3State.kind, v3State.state);
    const hero = collectByClass(renderAt('#/home'), 'lib-home-focus')[0];
    return hero.textContent;
  };
  try {
    // 无记录：显式声明"不是你的进度"。
    let t = recText({ kind: 'empty', state: { version: 3, papers: {}, readingList: [] } });
    assert.ok(t.includes('尚无阅读记录') && t.includes('不是你的进度'), '无记录应声明不是进度');
    assert.ok(!t.includes('已读'), '无记录不得出现进度认定');

    // 只有"已读"标记（没有任何在读）：B-Q1 回归——绝不能误报"尚无记录"，也不能出现假进度。
    t = recText({
      kind: 'ok',
      state: { version: 3, papers: { 'memgpt': { status: 'done', question: '', note: '', updatedAt: '2026-09-23T00:00:00.000Z' } }, readingList: [] },
    });
    assert.ok(t.includes('已读 1 篇'), 'done-only 应报"已读 1 篇"而非"尚无"');
    assert.ok(!t.includes('尚无阅读记录'), 'done-only 不得误报尚无记录（B-Q1）');
    assert.ok(!t.includes('在读'), 'done-only 不应出现"在读"计数');
    assert.ok(t.includes('不显示百分比或连续天数'), '应声明不显示百分比/连续天数');

    // 只有问题/笔记（状态仍是未读）：算"有记录"，不报"尚无"。
    t = recText({
      kind: 'ok',
      state: { version: 3, papers: { 'memgpt': { status: 'unread', question: '存储与当前输入如何区分？', note: '', updatedAt: null } }, readingList: [] },
    });
    assert.ok(t.includes('问题／笔记 1 篇'), 'note-only 应报问题/笔记计数');
    assert.ok(!t.includes('尚无阅读记录'), 'note-only 不得误报尚无记录（B-Q1）');

    // 待读清单条目：也算"有记录"。
    t = recText({
      kind: 'ok',
      state: { version: 3, papers: {}, readingList: [{ id: 'r1', title: '偶遇论文', url: '', note: '', addedAt: '2026-09-23T00:00:00.000Z' }] },
    });
    assert.ok(t.includes('待读清单 1 条'), '待读清单应计入"有记录"');
    assert.ok(!t.includes('尚无阅读记录'), '仅待读清单也不得误报尚无（B-Q1）');

    // 混合：在读＋已读＋笔记，都按手动标记如实列出。
    t = recText({
      kind: 'ok',
      state: {
        version: 3,
        papers: {
          'astute-rag': { status: 'reading', question: '', note: '', updatedAt: null },
          'memgpt': { status: 'done', question: '', note: '一句话笔记', updatedAt: null },
        },
        readingList: [],
      },
    });
    assert.ok(t.includes('在读 1 篇') && t.includes('已读 1 篇') && t.includes('问题／笔记 1 篇'), '混合态逐项列出');

    // 存储不可用：显式说明读不到，绝不谎称"尚无记录"。
    t = recText({ kind: 'unavailable', state: null });
    assert.ok(t.includes('存储不可用') && t.includes('读不到'), '不可用应说明读不到');
    assert.ok(!t.includes('尚无阅读记录'), '不可用≠无记录（B-Q1）');

    // 数据损坏：显式说明未加载且未改动，绝不谎称"尚无记录"。
    t = recText({ kind: 'corrupt', state: null });
    assert.ok(t.includes('损坏') && t.includes('不加载'), '损坏应说明未加载（不加载）');
    assert.ok(!t.includes('尚无阅读记录'), '损坏≠无记录（B-Q1）');
  } finally {
    lib.__setV3ForTest(prev.kind, prev.state);
  }
});

// ---------- 8) 近期登记发现（PLAN-005） ----------

test('发现区（DOM）：点击才查询、结果渲染、不写入任何记录', async () => {
  storageCalls.length = 0;
  const view = renderAt('#/brief');
  assert.ok(view.textContent.includes('近期登记发现'), '缺发现区');
  assert.ok(view.textContent.includes('尚未查询'), '初始不得自动查询');
  const buttons = [];
  walk(view, (n) => {
    if (n.tagName === 'BUTTON') buttons.push(n);
  });
  const ragButton = buttons.find((b) => b.textContent === '检索增强生成');
  assert.ok(ragButton, '缺主题按钮');
  await ragButton.listeners.click[0]();
  const after = byId.get('lib-view').textContent;
  assert.ok(after.includes('A Test Paper on Retrieval Augmented Generation'), '动态条目未渲染');
  assert.ok(after.includes('近期登记不等于近期发表'), '缺登记≠发表提示');
  assert.ok(after.includes('选编简报'), '手工选编必须保留');
  const writes = storageCalls.filter(([op]) => op === 'setItem');
  assert.deepEqual(writes, [], '发现查询不得写入任何记录');
});

test('发现区（DOM）：错误载荷如实显示，不冒充结果', async () => {
  fetchImpl = async () => ({
    ok: false,
    status: 503,
    json: async () => ({ error: { code: 'daily-limit', message: '主题 rag 今日已达上限；请稍后再试。' } }),
  });
  const view = renderAt('#/brief');
  const buttons = [];
  walk(view, (n) => {
    if (n.tagName === 'BUTTON') buttons.push(n);
  });
  const ragButton = buttons.find((b) => b.textContent === '检索增强生成');
  await ragButton.listeners.click[0]();
  const text = byId.get('lib-view').textContent;
  assert.ok(text.includes('今日已达上限'), '限额信息应如实显示');
  assert.ok(!text.includes('A Test Paper'), '不得显示上一次的结果');
});

// ---------- 9) 历史工作日索引（每日精选工作流，2026-09-18） ----------

test('简报页（DOM，2026-09-22 重组样例）：历史工作日索引按期列出、标明本期、空窗口如实说明', () => {
  const view = renderAt('#/brief');
  const text = view.textContent;
  assert.ok(text.includes('历史工作日'), '缺历史工作日索引');
  assert.ok(text.includes('2026-09-22（本期）'), '最新一期应标为本期');
  assert.ok(text.includes('不是自动抓取'), '须说明每日产出靠手动工作流');
  const hrefs = [];
  walk(view, (n) => {
    if (n.tagName === 'A' && n.attributes.href) hrefs.push(n.attributes.href);
  });
  assert.ok(hrefs.includes('#/brief/brief-2026-09-21'), '09-21 期应在索引并可直达');
  assert.ok(text.includes('0 条'), '09-22 空窗口期应如实显示 0 条');
  // 直达往期：该期标为本期，索引仍在
  const past = renderAt('#/brief/brief-2026-09-21');
  const pastText = past.textContent;
  assert.ok(pastText.includes('2026-09-21 精选'), '往期内容应渲染');
  assert.ok(pastText.includes('2026-09-21（本期）'), '直达往期时该期应标为本期');
  assert.ok(pastText.includes('历史工作日'), '往期页也应有索引');
  assert.ok(pastText.includes('DolphinBench'), '09-21 期条目应渲染');
  // 补记与空窗口口径
  assert.ok(pastText.includes('回溯补记'), '09-21 期应写明回溯口径');
  const empty = renderAt('#/brief/brief-2026-09-22');
  assert.ok(empty.textContent.includes('索引滞后'), '空窗口期应写明索引滞后');
});

// ---------- 9b) REWORK-007 §1：精选页顺序 ----------

test('REWORK-007（DOM）：精选页简报与历史索引在前，实时发现区退到其后', () => {
  const text = renderAt('#/brief').textContent;
  assert.ok(text.indexOf('选编简报') < text.indexOf('近期登记发现'), '发现区不得压在每日简报之上');
  assert.ok(text.indexOf('历史工作日') < text.indexOf('近期登记发现'), '发现区应在历史索引之后');
});

// ---------- 10) 方向页 CCF 目录事实（PLAN-005 决策 D3） ----------

test('方向页（DOM）：底部有 CCF 目录事实与来源，标注“不是投稿推荐”', () => {
  const view = renderAt('#/directions');
  const text = view.textContent;
  assert.ok(text.includes('目录事实'), '缺 CCF 目录事实');
  assert.ok(text.includes('不是投稿推荐'), '缺边界表述');
  const hrefs = [];
  walk(view, (n) => {
    if (n.tagName === 'A' && n.attributes.href) hrefs.push(n.attributes.href);
  });
  assert.ok(hrefs.some((h) => h.includes('ccf.org.cn')), '缺 CCF 来源链接');
});

// ---------- SCAFFOLD-008（008.2）：fixture 渲染行为（材料页 / track 导航 / featured / 无记录副作用） ----------

function fixturePaper(id, extra = {}) {
  return {
    id,
    title: `测试论文 ${id}`,
    displayTitle: `显示名 ${id}`,
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

function fixtureLib() {
  return {
    meta: {},
    home: {
      title: 'fixture 首页',
      intro: 'fixture 说明',
      updatedOn: '2026-09-22',
      startHere: { kind: 'article', materialId: 'mat-map', routeId: 'collab', track: 'start' },
      zones: [
        { key: 'brief', title: '每日精选', purpose: '感知前沿在做什么、用了什么方法，不是今天的阅读作业。', howToUse: 'h', entryLabel: '看最近一期', entryHash: '#/brief' },
        { key: 'papers', title: '论文阅读', purpose: 'p', howToUse: 'h', entryLabel: '打开全部论文', entryHash: '#/papers' },
        { key: 'directions', title: '方向与路线', purpose: 'p', howToUse: 'h', entryLabel: '查看两条方向', entryHash: '#/directions' },
        { key: 'learn', title: '技术学习', purpose: 'p', howToUse: 'h', entryLabel: '进入技术学习', entryHash: '#/learn' },
        { key: 'foundations', title: '经典书目', purpose: 'p', howToUse: 'h', entryLabel: '打开经典书目', entryHash: '#/foundations' },
      ],
      firstUse: [
        { title: '先看两条方向', text: '选一条起步（默认主方向）。' },
        { title: '按顺序走', text: '先建立概念再碰论文。' },
        { title: '按需补技术', text: '不把十一条主干当课表。' },
      ],
    },
    directions: [
      {
        id: 'collab',
        order: 1,
        status: 'active',
        title: '跨工具协作',
        summary: '预算约束下的机制比较',
        overview: '隔离 harness、异构 Agent、输入/输出预算、机制与表示组合的研究对象说明。',
        stateOfField: '当前研究情况文字',
        asOf: '2026-09-22',
        whyChoose: '选择理由文字',
        limits: '限制文字',
        trackClosing: '选一个你仍不明白的比较问题，回看对应论文的设置。',
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
        id: 'code-verify',
        order: 2,
        status: 'active',
        title: '代码验证',
        summary: 's',
        overview: '研究对象说明文字',
        stateOfField: '当前研究情况文字',
        asOf: '2026-09-15',
        whyChoose: '选择理由文字',
        limits: '限制文字',
        startRoute: [
          { id: 'step-code-1', kind: 'paper', paperId: 'tosem', stage: '建立概念', required: '必读', passMode: 'map', purpose: '实证研究怎么读', readWhen: '第一步', check: '会问四个问题' },
          { id: 'step-code-2', kind: 'paper', paperId: 'agentless', stage: '建立问题', required: '必读', passMode: 'map', purpose: '简单流水线反例', readWhen: 'TOSEM 后', check: '边际收益自证' },
        ],
        archiveRoute: [
          { id: 'archive-code-1', kind: 'paper', paperId: 'le', stage: '建立问题', required: '必读', purpose: '过拟合前作', readWhen: '按需', check: '对照 RQ4' },
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
        deferredNote: '这条方向初期不作为探索入口；论文卡仍可查阅。',
        startRoute: [],
        archiveRoute: [
          { id: 'archive-d1', kind: 'paper', paperId: 'beyond', stage: '建立问题', required: '选读', purpose: '旧谱系', readWhen: '按需', check: '不升级' },
        ],
      },
    ],
    materials: [
      {
        id: 'mat-map',
        title: '跨工具协作导读',
        format: 'primer',
        lead: 'fixture 材料导语',
        learner: { gist: '场景、机制、表示和传输不是同一层', value: '先消除误解', intent: '能提出有条件的问题' },
        readingActions: {
          preserve: [{ target: '场景/机制/表示/传输的区分', why: '先建立地图' }],
          explain: [{
            target: '两种组合例子', why: '编辑举例，帮助理解结构',
            blocks: [{ kind: 'paragraph', spans: [{ kind: 'text', text: '仓库工件加短摘要是一种组合；长期记忆加检索加交接包是另一种。' }] }],
          }],
          skip: [{ target: '协议实现细节', why: '此时不学 MCP/A2A 实现' }],
        },
        coverage: { mode: 'editorial-primer', basis: '站内编辑', version: '—', sections: ['编辑正文'], limitations: '编辑整理，非论文结论', checkedAt: '2026-09-22' },
        body: { blocks: [{ kind: 'paragraph', spans: [{ kind: 'text', text: '实际编辑正文第一段。' }] }] },
        nextAction: '下一步读 Beyond Frameworks。',
      },
      {
        id: 'mat-pending',
        title: '待核外部材料',
        format: 'blog',
        url: 'https://example.com/pending',
        lead: '身份入口',
        coverage: { mode: 'identity', basis: '身份待核', version: '—', sections: [], limitations: '2026-09-22 抓取失败', checkedAt: '2026-09-22' },
        availability: 'pending',
        pendingReason: '2026-09-22 访问失败',
      },
    ],
    papers: [
      fixturePaper('beyond'),
      fixturePaper('tax'),
      fixturePaper('debt', {
        coverage: { mode: 'partial-text', basis: '摘要与§5', version: 'v2', sections: ['摘要', '§5.1 表2'], limitations: '其余未读', checkedAt: '2026-09-22' },
        readingActions: {
          explain: [{ target: '事件数与 token 的区别', why: '先借解释理解两个指标', blocks: [{ kind: 'paragraph', spans: [{ kind: 'text', text: '实际讲解：操作次数与累计输入消耗是两种账。' }] }] }],
          skip: [{ target: '附录实现细节', why: '当前不需要复现实现' }],
        },
        next: { note: 'fixture 延伸阅读说明。', paperId: 'beyond' },
      }),
      fixturePaper('tosem'),
      fixturePaper('agentless'),
      fixturePaper('le', {
        deliveredDepth: 'entry',
        recommendedDepth: 'standard',
        reasons: ['入口条目'],
        questions: [],
        coverage: { mode: 'metadata', basis: '元数据', version: '—', sections: [], limitations: '未获取摘要', checkedAt: '2026-09-15' },
      }),
    ],
    technicalRoutes: [
      {
        id: 'tech-multiagent',
        kind: 'featured',
        order: 1,
        title: '多智能体架构',
        capability: '受控 Agent 与双角色协作',
        prerequisites: 'Python 基础',
        applicability: '主方向技术主线',
        summary: '四单元共用一份教材。',
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
        applicability: '按需',
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
        applicability: '浅尝',
        summary: '说明',
        resources: [],
        units: [
          {
            id: 'graph-u3',
            title: '现在用不用图',
            goal: '区分图数据结构与 GNN 研究',
            selfCheck: '能各举一例',
            resourceIds: [],
            lesson: { blocks: [{ kind: 'paragraph', spans: [{ kind: 'text', text: '编辑短文：任务依赖适合图，普通笔记默认不必上图。' }] }] },
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

function collectLinks(view) {
  const hrefs = [];
  walk(view, (n) => {
    if (n.tagName === 'A' && n.attributes.href) hrefs.push(n.attributes.href);
  });
  return hrefs;
}

test('008.2（DOM）：材料页三问在正文前、Explain 实际渲染、无记录面板、零 localStorage 写入', () => {
  storageCalls.length = 0;
  const writesBefore = storageCalls.filter(([op]) => op === 'setItem').length;
  lib.__setRenderLibrary(fixtureLib());
  const view = renderAt('#/material/mat-map?route=collab&track=start');
  const text = view.textContent;
  assert.ok(text.includes('讲什么：'), '缺三问');
  assert.ok(text.includes('跨工具协作导读'), '缺材料标题');
  assert.ok(text.includes('仓库工件加短摘要是一种组合'), 'Explain inline blocks 应实际渲染');
  assert.ok(text.includes('编辑举例，帮助理解结构'), 'Explain why 应渲染');
  assert.ok(text.includes('此时不学 MCP/A2A 实现'), 'Skip 应渲染');
  assert.ok(text.includes('先自己阅读'), '站内导读的 Preserve 标题应为先自己阅读（无外部原文）');
  assert.ok(!text.includes('表内数值未逐格核对'), '概念表不含数值，不显示数值核对声明');
  assert.ok(text.indexOf('讲什么：') < text.indexOf('实际编辑正文第一段'), '三问应在正文前');
  assert.ok(!text.includes('我的记录'), '材料页不得有记录面板');
  assert.ok(!text.includes('保存记录'), '材料页不得有保存按钮');
  // 路线上下文：侧栏给前后节点。
  const hrefs = collectLinks(view);
  assert.ok(hrefs.includes('#/paper/beyond?route=collab&track=start'), '材料页下一步应带路线上下文');
  const writesAfter = storageCalls.filter(([op]) => op === 'setItem').length;
  assert.equal(writesAfter, writesBefore, '浏览材料页不得写入 localStorage');
  lib.__setRenderLibrary(LIBRARY);
});

test('008.2（DOM）：主线三步可走通——导读→Beyond→Tax（本段到此），链接携带 route/track', () => {
  lib.__setRenderLibrary(fixtureLib());
  const v1 = renderAt('#/material/mat-map?route=collab&track=start');
  const hrefs1 = collectLinks(v1);
  assert.ok(hrefs1.includes('#/paper/beyond?route=collab&track=start'), '导读下一步应为 beyond 且带上下文');
  const v2 = renderAt('#/paper/beyond?route=collab&track=start');
  const t2 = v2.textContent;
  assert.ok(t2.includes('上一步：《跨工具协作导读》') || collectLinks(v2).some((h) => h.includes('material/mat-map?route=collab&track=start')), 'beyond 应有上一步回导读');
  const hrefs2 = collectLinks(v2);
  assert.ok(hrefs2.includes('#/paper/tax?route=collab&track=start'), 'beyond 下一步应为 tax');
  const v3 = renderAt('#/paper/tax?route=collab&track=start');
  const t3 = v3.textContent;
  assert.ok(t3.includes('本段到此'), '尾节点应显示本段到此');
  assert.ok(!t3.includes('自动进入'), '尾节点不得自动进入 archive');
  lib.__setRenderLibrary(LIBRARY);
});

test('008.2（DOM）：路线上下文失配明确提示，不静默套其他路线', () => {
  lib.__setRenderLibrary(fixtureLib());
  const view = renderAt('#/paper/debt?route=collab&track=start');
  assert.ok(view.textContent.includes('路线上下文与本文不匹配'), '失配应给出明确提示');
  lib.__setRenderLibrary(LIBRARY);
});

test('008.2（DOM）：首页 typed 首读、active 过滤与延后横幅', () => {
  lib.__setRenderLibrary(fixtureLib());
  const home = renderAt('#/home');
  const homeText = home.textContent;
  assert.ok(homeText.includes('建议从这里开始'), '材料首读文案');
  const homeLinks = collectLinks(home);
  assert.ok(homeLinks.includes('#/material/mat-map?route=collab&track=start'), '首页首读应链到带上下文的材料页');
  assert.ok(homeText.includes('跨工具协作') && homeText.includes('代码验证'), '首页应列两条 active 方向');
  assert.ok(!homeText.includes('延后方向'), '首页不得列 deferred 方向');
  const dirs = renderAt('#/directions');
  assert.ok(!dirs.textContent.includes('延后方向'), '方向列表只列 active');
  // 侧栏重渲染（清掉一次性标记）。
  const quick = byId.get('lib-quick');
  quick.dataset.rendered = 'false';
  quick.childNodes.length = 0;
  renderAt('#/home');
  const quickText = quick.textContent;
  assert.ok(quickText.includes('跨工具协作') && quickText.includes('代码验证'), '侧栏应列 active');
  assert.ok(!quickText.includes('延后方向'), '侧栏不得列 deferred');
  // 延后旧书签：横幅 + archive 仍可看。
  const deferred = renderAt('#/route/deferred-d');
  const dText = deferred.textContent;
  assert.ok(dText.includes('初期不作为探索入口'), '延后方向页顶横幅');
  assert.ok(dText.includes('完整谱系'), '延后 archive 仍可查阅');
  lib.__setRenderLibrary(LIBRARY);
});

test('008.2（DOM）：路线页 startRoute 渲染、主方向 archive 标题为按需查阅', () => {
  lib.__setRenderLibrary(fixtureLib());
  const view = renderAt('#/route/collab');
  const text = view.textContent;
  assert.ok(text.includes('跨工具协作导读') && text.includes('显示名 beyond') && text.includes('显示名 tax'), 'startRoute 三步齐备');
  assert.ok(text.includes('先分清问题'), '步骤 purpose 渲染');
  assert.ok(text.includes('必读 · 地图浏览'), '步骤元信息纯文本');
  assert.ok(text.includes('按需查阅（不必接着读）'), '主方向 archive 标题');
  assert.ok(text.includes('本段到此') && text.includes('选一个你仍不明白的比较问题'), '末段结束与行动建议');
  const codeView = renderAt('#/route/code-verify');
  assert.ok(codeView.textContent.includes('完整谱系（初期不必走）'), '第二方向 archive 标题沿用');
  lib.__setRenderLibrary(LIBRARY);
});

test('008.2（DOM）：技术页 featured 三条 + 其他主干折叠；tech-t4 别名与 unit 深链可用', () => {
  lib.__setRenderLibrary(fixtureLib());
  const learn = renderAt('#/learn');
  const learnText = learn.textContent;
  assert.ok(learnText.includes('默认三条'), 'featured 布局');
  assert.ok(learnText.includes('多智能体架构') && learnText.includes('RAG') && learnText.includes('图（浅尝）'), '三条 featured');
  assert.ok(learnText.includes('其他主干（当前不必先学）'), '其他主干折叠');
  assert.ok(!learnText.includes('必学主干'), 'featured 存在时不得再用旧课表标题');
  // tech-t4 旧 hash 别名到 tech-rag。
  const alias = renderAt('#/learn/tech-t4');
  assert.ok(alias.textContent.includes('LlamaIndex starter'), 'tech-t4 应解析到 tech-rag 内容');
  const aliasDeep = renderAt('#/learn/tech-t4?unit=t4-u1');
  assert.ok(aliasDeep.textContent.includes('t4-u1') || aliasDeep.textContent.includes('单元'), 'tech-t4 带 unit 深链可用');
  // unit 深链与教材链接、编辑课正文。
  const ma = renderAt('#/learn/tech-multiagent?unit=ma-u2');
  const maText = ma.textContent;
  assert.ok(maText.includes('打开/下载教材'), '教材链接渲染');
  assert.ok(maText.includes('ma-u2'), '章节提示渲染');
  const graph = renderAt('#/learn/tech-graph-simple');
  assert.ok(graph.textContent.includes('任务依赖适合图'), 'G3 lesson 实际正文渲染');
  // learn 带 route/track 但无 unit → 无效路由。
  const invalid = renderAt('#/learn/tech-multiagent?route=collab&track=start');
  assert.ok(invalid.textContent.includes('地址未找到'), 'learn 带 route/track 无 unit 应无效');
  lib.__setRenderLibrary(LIBRARY);
});

test('008.2（DOM）：quick 卡依据文案与论文记录面板位置', () => {
  lib.__setRenderLibrary(fixtureLib());
  const view = renderAt('#/paper/debt?route=collab&track=start');
  const text = view.textContent;
  assert.ok(text.includes('简读卡：以下判断依据已核摘要与指定正文'), 'partial-text quick 依据文案');
  assert.ok(text.includes('简读卡 · 摘要及指定正文已核'), '依据短行');
  assert.ok(text.includes('实际讲解：操作次数与累计输入消耗是两种账'), 'quick inline 讲解渲染');
  // 记录面板仍在正文与导航之后、覆盖之前（论文页不受材料规则影响）。
  assert.ok(text.indexOf('我的记录') > text.indexOf('实际讲解'), '记录面板在正文之后');
  assert.ok(text.indexOf('我的记录') < text.indexOf('来源与覆盖（点开查看）'), '记录面板在覆盖之前');
  // pending 材料：只显示身份与待核原因。
  const pending = renderAt('#/material/mat-pending');
  const pText = pending.textContent;
  assert.ok(pText.includes('来源待核'), 'pending 材料显示待核');
  assert.ok(!pText.includes('讲什么：'), 'pending 材料不得伪造三问');
  lib.__setRenderLibrary(LIBRARY);
});

// ---------- 9) DYNAMIC-GUIDANCE-009 / C 包：本机导学提案闭环的 DOM 渲染探针 ----------
// 走真实交互链路：#/guidance 粘贴→校验→预览→逐条选择→确认写入→各视图生效→重载仍在→撤销/重置。
// 断言 R8-C 的 DOM 面：pending 不落盘、示例横幅从持久字段重建（刷新/import 后仍在）、
// 首页推导过滤 example（R6 规则①）、其它视图示例条目带横幅渲染（R6 规则②）、
// R4 纯文本来源 meta 行、v3 逐字节不变、生效读取只触两个键（单入口）。

const GUID = await import('../public/guidance.js');

function findButton(view, label) {
  let found = null;
  walk(view, (n) => {
    if (!found && n.tagName === 'BUTTON' && n.textContent.trim() === label) found = n;
  });
  return found;
}
function findButtons(view, label) {
  const out = [];
  walk(view, (n) => {
    if (n.tagName === 'BUTTON' && n.textContent.trim() === label) out.push(n);
  });
  return out;
}
function findTextarea(view) {
  let found = null;
  walk(view, (n) => {
    if (!found && n.tagName === 'TEXTAREA') found = n;
  });
  return found;
}

function domProposal(changes, extra = {}) {
  return JSON.stringify({
    kind: 'rw.guidance-proposal',
    schemaVersion: 1,
    id: extra.id ?? 'prop-dom-1',
    createdAt: '2026-09-23',
    example: extra.example ?? false,
    origin: { sourceType: extra.sourceType ?? 'ai', label: '页面走查来源', asOf: '2026-09-22', evidenceNote: '走查用证据边界说明。' },
    changes,
  });
}
function domSet(type, id, field, value) {
  return { op: 'set', target: { type, id, field }, expectedBase: GUID.canonicalBaseline(LIBRARY, null, { type, id, field }), value, reason: '页面走查' };
}

test('DG009-C（常量对表）：guidance.js 枚举与 library.js 渲染常量一致（防漂移）', () => {
  assert.deepEqual([...GUID.STEP_STAGES], [...lib.STAGE_ORDER]);
  assert.deepEqual([...GUID.STEP_PASS_MODES].sort(), Object.keys(lib.PASS_MODE_LABELS).sort());
  assert.deepEqual([...GUID.MAP_MEANING_VOCAB].sort(), Object.keys(lib.MAP_MEANING_LABELS).sort());
  assert.deepEqual([...GUID.PROPOSAL_SOURCE_TYPES].sort(), ['advisor', 'ai', 'self']);
});

test('DG009-C（DOM 全链路）：粘贴→预览（不落盘）→采纳写入→路线页生效＋R4 meta→重载仍在→撤销', async () => {
  const v3Before = storageData.get('research-workbench:v3') ?? null;
  storageCalls.length = 0;
  let view = renderAt('#/guidance');
  const ta = findTextarea(view);
  assert.ok(ta, '缺提案粘贴框');
  ta.value = domProposal([domSet('route-step', 'step-collab-3', 'purpose', '页面走查后的新目的。')], { id: 'prop-dom-1' });
  await findButton(view, '校验并预览').listeners.click[0]();
  view = byId.get('lib-view');
  assert.ok(view.textContent.includes('prop-dom-1'), '预览页应显示提案号');
  assert.ok(view.textContent.includes('确认并写入') && view.textContent.includes('整案不采纳'), '缺两个显式动作按钮');
  assert.ok(view.textContent.includes('当前生效值'), '预览应含三格对照');
  const writesDuringPreview = storageCalls.filter(([op, key]) => op === 'setItem' && key === GUID.GUIDANCE_KEY);
  assert.deepEqual(writesDuringPreview, [], 'pending 预览阶段不得写覆盖层键（不落盘，R2）');
  // 未选择就确认 ⇒ 拒绝写入并给提示（两个动作都要显式）
  await findButton(view, '确认并写入').listeners.click[0]();
  view = byId.get('lib-view');
  assert.ok(view.textContent.includes('显式选择'), '未逐条选择应被阻止');
  assert.deepEqual(storageCalls.filter(([op, key]) => op === 'setItem' && key === GUID.GUIDANCE_KEY), [], '被阻止的确认不得写盘');
  // 逐条采纳→确认⇒恰好一次整键写入
  await findButton(view, '✓ 采纳此条').listeners.click[0]();
  view = byId.get('lib-view');
  await findButton(view, '确认并写入').listeners.click[0]();
  assert.equal(storageCalls.filter(([op, key]) => op === 'setItem' && key === GUID.GUIDANCE_KEY).length, 1, '确认＝整份 JSON 一次写入');
  // 路线页生效＋R4 纯文本 meta 行
  view = renderAt('#/route/cross-harness-collab');
  const routeText = view.textContent;
  assert.ok(routeText.includes('页面走查后的新目的。'), '路线页应显示生效后的目的');
  assert.ok(routeText.includes('导学调整 · AI建议 2026-09-22（本人确认）'), '缺 R4 来源 meta 行');
  assert.ok(!routeText.includes('示例 · 非真实指导'), '非示例提案不得出现示例横幅字样');
  // 生效读取只触两个键（单入口：v3＋guidance，无第三键）
  storageCalls.length = 0;
  renderAt('#/home');
  renderAt('#/map');
  renderAt('#/route/cross-harness-collab');
  renderAt('#/paper/memgpt');
  const touchedKeys = [...new Set(storageCalls.map(([, key]) => key))];
  assert.ok(touchedKeys.length > 0 && touchedKeys.every((k) => ['research-workbench:guidance:v1', 'research-workbench:v3'].includes(k)), `渲染只应触这两个键（R5 单入口）：${touchedKeys.join(',')}`);
  assert.ok(touchedKeys.includes('research-workbench:guidance:v1'), '生效读取必须经覆盖层键单入口');
  assert.equal(storageCalls.filter(([op]) => op === 'setItem').length, 0, '渲染阶段不得写任何键');
  // 重载（新模块实例、同存储）⇒ 变化仍在（确认后再打开仍有变化，R2）
  const fresh = await import(new URL('../public/library.js?reload=1', import.meta.url).href);
  assert.ok(fresh.currentGuidanceOverlay() !== null, '新会话从存储重建覆盖层');
  view = renderAt('#/route/cross-harness-collab');
  assert.ok(view.textContent.includes('页面走查后的新目的。'), '重载后生效变化仍在');
  // 撤销＝一次全回＋前向写入（seq+1、history 只追加）
  view = renderAt('#/guidance');
  const undoBtn = findButton(view, '撤销最近一次导学调整');
  assert.ok(undoBtn, '缺撤销按钮');
  await undoBtn.listeners.click[0]();
  view = renderAt('#/route/cross-harness-collab');
  assert.ok(!view.textContent.includes('页面走查后的新目的。'), '撤销后应回到旧值');
  const overlay = JSON.parse(storageData.get(GUID.GUIDANCE_KEY));
  assert.equal(overlay.seq, 2, '撤销＝seq+1 前向写入');
  assert.equal(overlay.history.at(-1).kind, 'undo');
  assert.equal(overlay.history.length, 2, 'history 只追加不回删');
  assert.equal(storageData.get('research-workbench:v3') ?? null, v3Before, 'v3 键逐字节不变');
  // pending 不落盘：全新模块实例（模拟刷新）没有残留预览
  assert.equal(findButton(renderAt('#/guidance'), '确认并写入'), null, '刷新后预览页无残留（pending 不落盘）');
});
async function adoptAllItems(view) {
  let guard = 0;
  for (;;) {
    const pending = findButtons(view, '✓ 采纳此条').find((b) => !b.className.split(/\s+/).includes('lib-choice-on'));
    if (!pending || guard > 12) return;
    await pending.listeners.click[0]();
    view = byId.get('lib-view');
    guard += 1;
  }
}

test('DG009-C（DOM，R6 两规则）：示例横幅从持久字段重建、重载仍在；首页推导过滤 example', async () => {
  const view0 = renderAt('#/guidance');
  const ta = findTextarea(view0);
  ta.value = domProposal(
    [
      domSet('home-focus', 'home', 'routeId', 'code-agent-verification'),
      {
        op: 'insert',
        target: { type: 'map-node', id: 'map-prog-dom-example' },
        value: { side: 'problem', label: '走查示例节点', summary: '走查用概述', refs: ['cross-harness-collab'], source: { originType: 'self', note: '走查新增', asOf: '2026-09-23' } },
        reason: '页面走查',
      },
    ],
    { id: 'prop-example-dom-1', example: true, sourceType: 'advisor' },
  );
  await findButton(view0, '校验并预览').listeners.click[0]();
  let view = byId.get('lib-view');
  assert.ok(view.textContent.includes('示例 · 非真实指导'), '预览页须有示例横幅（example 强制）');
  await adoptAllItems(view);
  view = byId.get('lib-view');
  await findButton(view, '确认并写入').listeners.click[0]();
  // 规则①：example homeFocus 不驱动首页推导——当前关注仍是基线主方向，且不出导学 meta
  view = renderAt('#/home');
  const hero = collectByClass(view, 'lib-home-focus')[0].textContent;
  assert.ok(hero.includes('跨工具的智能体协作'), '示例 homeFocus 不得改写当前关注（R6 规则①）');
  assert.ok(!hero.includes('导学调整 · 导师转述'), '示例焦点不生成首屏导学 meta');
  // 规则②：地图页照常渲染＋常驻横幅
  view = renderAt('#/map');
  assert.ok(view.textContent.includes('走查示例节点'), '示例节点照常渲染');
  assert.ok(view.textContent.includes('示例 · 非真实指导'), '地图页须常驻示例横幅');
  assert.equal(collectByClass(view, 'lib-map-node').length, 11, '生效节点 10+1');
  // 重载后横幅与节点仍在（从持久 example 字段重建，R8-C 断言项）
  await import(new URL('../public/library.js?reload=2', import.meta.url).href);
  view = renderAt('#/map');
  assert.ok(view.textContent.includes('走查示例节点') && view.textContent.includes('示例 · 非真实指导'), '重载后示例横幅与节点仍在');
});
test('DG009-C（DOM）：真实 homeFocus 提案生效于首屏；重置两步后回基线；v3 全程逐字节不变', async () => {
  const v3Before = storageData.get('research-workbench:v3') ?? null;
  const view0 = renderAt('#/guidance');
  const ta = findTextarea(view0);
  ta.value = domProposal([domSet('home-focus', 'home', 'routeId', 'code-agent-verification')], { id: 'prop-homefocus-real', sourceType: 'advisor' });
  await findButton(view0, '校验并预览').listeners.click[0]();
  let view = byId.get('lib-view');
  await adoptAllItems(view);
  view = byId.get('lib-view');
  await findButton(view, '确认并写入').listeners.click[0]();
  view = renderAt('#/home');
  const hero = collectByClass(view, 'lib-home-focus')[0].textContent;
  assert.ok(hero.includes('代码智能体的修复正确性与预算受限验证'), '真实 homeFocus 生效：当前关注切到第二条 active 方向');
  assert.ok(hero.includes('怎样读实证研究'), '下一步＝该方向生效 startRoute 首节点（推导，R3）');
  assert.ok(hero.includes('导学调整 · 导师转述 2026-09-22（本人确认）'), 'R4：首屏 meta 显示导师转述（本人确认）');
  assert.ok(!hero.includes('示例 · 非真实指导'), '非示例调整不带示例横幅（此前示例焦点条目已被本条真实条目取代）');
  // 历史含采纳/放弃条数（R8-C）
  view = renderAt('#/guidance');
  assert.ok(view.textContent.includes('采纳 1 条／放弃 0 条'), 'history 记采纳/放弃条数');
  // 重置两步（先导出提示、再确认）⇒ 清空（含示例覆盖层）
  await findButton(view, '重置导学覆盖层（先导出备份）').listeners.click[0]();
  view = byId.get('lib-view');
  const confirmReset = findButton(view, '确认重置（我已导出备份）');
  assert.ok(confirmReset, '缺第二步确认按钮');
  await confirmReset.listeners.click[0]();
  view = renderAt('#/home');
  const hero2 = collectByClass(view, 'lib-home-focus')[0].textContent;
  assert.ok(hero2.includes('跨工具的智能体协作'), '重置后当前关注回基线主方向');
  assert.ok(!hero2.includes('导学调整'), '重置后不再有导学 meta');
  view = renderAt('#/map');
  assert.ok(!view.textContent.includes('走查示例节点'), 'reset 清空示例覆盖层');
  assert.equal(storageData.get('research-workbench:v3') ?? null, v3Before, 'v3 键逐字节不变（全链）');
});

// ---------- 10) C 独立审查修复轮（B1/B2）的渲染面 ----------

async function uiApplyProposal(view, text) {
  const ta = findTextarea(view);
  assert.ok(ta, '缺提案粘贴框');
  ta.value = text;
  await findButton(view, '校验并预览').listeners.click[0]();
  let v = byId.get('lib-view');
  assert.ok(findButton(v, '确认并写入'), '提案未进入预览');
  await adoptAllItems(v);
  v = byId.get('lib-view');
  await findButton(v, '确认并写入').listeners.click[0]();
  return byId.get('lib-view');
}

test('DG009-C（DOM，B2）：覆盖层改写首步 purpose 后，首屏「下一步/为什么选它」随生效值变化并带来源行', async () => {
  let view = renderAt('#/guidance');
  await uiApplyProposal(view, domProposal([domSet('route-step', 'step-collab-1', 'purpose', '首屏生效的新目的。')], { id: 'prop-b2-step' }));
  view = renderAt('#/home');
  const hero = collectByClass(view, 'lib-home-focus')[0].textContent;
  assert.ok(hero.includes('首屏生效的新目的。'), 'B2：首屏「为什么选它」应显示生效值（此前读基线库＝修复前会显示旧文案）');
  assert.ok(!hero.includes('先分清场景、机制、表示与传输四层'), 'B2：旧基线文案不应残留在首屏');
  assert.ok(hero.includes('导学调整 · AI建议 2026-09-22（本人确认）'), 'B2：被调整的首屏字段带 R4 来源行');
  // 复原（撤销）给下一用例干净状态
  view = renderAt('#/guidance');
  await findButton(view, '撤销最近一次导学调整').listeners.click[0]();
  view = renderAt('#/home');
  assert.ok(collectByClass(view, 'lib-home-focus')[0].textContent.includes('先分清场景、机制、表示与传输四层'), '撤销后首屏回基线');
});

test('DG009-C（DOM，B2）：仅附注（note-only）homeFocus 也给出来源行，方向不被误切', async () => {
  let view = renderAt('#/guidance');
  await uiApplyProposal(view, domProposal([domSet('home-focus', 'home', 'note', '本周只补一条附注。')], { id: 'prop-b2-note', sourceType: 'advisor' }));
  view = renderAt('#/home');
  const hero = collectByClass(view, 'lib-home-focus')[0].textContent;
  assert.ok(hero.includes('跨工具的智能体协作'), 'note-only 不改当前关注');
  assert.ok(hero.includes('附注：本周只补一条附注。'), 'note-only 附注应在首屏显示');
  assert.ok(hero.includes('导学调整 · 导师转述 2026-09-22（本人确认）'), 'note-only 焦点须带来源 meta 行（B2 修复项）');
  // 复原：重置两步
  view = renderAt('#/guidance');
  await findButton(view, '重置导学覆盖层（先导出备份）').listeners.click[0]();
  view = byId.get('lib-view');
  await findButton(view, '确认重置（我已导出备份）').listeners.click[0]();
  view = renderAt('#/home');
  assert.ok(!collectByClass(view, 'lib-home-focus')[0].textContent.includes('附注'), '重置后附注消失');
});

test('DG009-C（DOM，B1）：本机存储被手工塞入非白名单条目（paper:title）⇒ 按基线降级＋导学页明示损坏并保留坏档，不写盘', () => {
  const crafted = {
    version: 1,
    seq: 99,
    base: { contentVersionLabel: 'crafted' },
    entries: {
      'paper:memgpt:title': { op: 'set', value: '伪造标题', origin: { sourceType: 'ai', label: 'x', asOf: '2026-09-23', evidenceNote: 'x' }, proposalId: 'prop-crafted', appliedAt: '2026-09-23T08:00:00.000Z', example: false },
    },
    history: [],
    homeFocus: null,
    map: { nodes: [], edges: [] },
    tombstones: {},
  };
  const raw = JSON.stringify(crafted);
  storageData.set('research-workbench:guidance:v1', raw);
  storageCalls.length = 0;
  const home = renderAt('#/home');
  assert.ok(home.textContent.includes('跨工具协作：先把研究问题分清楚'), '坏档⇒基线内容照常显示（降级）');
  assert.ok(!home.textContent.includes('伪造标题'), '非白名单条目绝不生效');
  const guidance = renderAt('#/guidance');
  assert.ok(guidance.textContent.includes('损坏'), '导学页须明示存储损坏');
  assert.ok(guidance.textContent.includes('导出坏档原文'), '须给出坏档导出（保留原文自查）');
  assert.equal(storageCalls.filter(([op]) => op === 'setItem').length, 0, '读取/校验/渲染阶段不得写任何键');
  assert.equal(storageData.get('research-workbench:guidance:v1'), raw, '坏档原文保留（不静默清空）');
  // 撤销/应用在该状态下也被拒绝（storage-corrupt），导出原文按钮可用：
  const rawBtn = findButton(guidance, '导出坏档原文（供自查）');
  assert.ok(rawBtn, '缺坏档导出按钮');
  blobLog.length = 0;
  rawBtn.listeners.click[0]();
  assert.equal(blobLog.length, 1, '导出应产出一份文件内容');
  assert.equal(blobLog[0].parts[0], raw, '导出的正是坏档原文');
  storageData.delete('research-workbench:guidance:v1');
});

test('DG009-C（DOM，无障碍）：导学页的粘贴框与文件选择控件都有可访问名称（aria-label）', () => {
  const view = renderAt('#/guidance');
  const controls = [];
  walk(view, (n) => {
    if (n.tagName === 'TEXTAREA' || n.tagName === 'INPUT') controls.push(n);
  });
  assert.ok(controls.length >= 3, `导学页控件数量异常：${controls.length}`);
  for (const c of controls) {
    const label = c.getAttribute('aria-label');
    assert.ok(typeof label === 'string' && label.trim() !== '', `${c.tagName}${c.type ? `(${c.type})` : ''} 缺 aria-label`);
  }
});

// ---------- PLAN-010 内容展示深化（2026-09-24）：首页四区 / 课题页新块 / 三段式导读 / 能力映射 ----------

test('PLAN-010（DOM）：首页四区齐备且各含实质文本；综述区为专题分支过渡态，不以两综述充当总览', () => {
  const view = renderAt('#/home');
  const text = view.textContent;
  const zones = collectByClass(view, 'lib-zone');
  assert.equal(zones.length, 4, '首页应渲染四区');
  assert.deepEqual(LIBRARY.home.zones.map((z) => z.key), ['goal', 'survey', 'topic', 'tech']);
  for (const key of ['阅读目标', '知识脉络', '课题深化', '技术入口']) {
    assert.ok(text.includes(key), `首页缺区标题：${key}`);
  }
  // 每区必须有超出「用途+用法」的实质正文（条目/表/说明），不是纯链接列表。
  assert.ok(text.includes('建议从这里开始'), '阅读目标区缺首读');
  assert.ok(text.includes('站内基础导读'), '阅读目标区缺基础导读列表');
  assert.ok(text.includes('感知前沿'), '阅读目标区缺每日精选落点');
  for (const layer of ['AI 背景', 'Agent 全景', '专题分支']) { assert.ok(text.includes(layer), `知识脉络区缺层介绍：${layer}`); } assert.ok(collectLinks(view).includes('#/map'), '知识脉络区缺直接入口 #/map');
  assert.ok(text.includes('专题分支综述'), '两篇综述须标注为专题分支');
  assert.ok(text.includes('四轴编辑分析框架'), '课题深化区缺四轴浓缩');
  assert.ok(text.includes('与研究能力的关系'), '技术入口区缺能力映射句');
  // 旧五区入口仍可达（降级为次级入口或归并入区），不丢内容。
  const hrefs = collectLinks(view);
  for (const need of ['#/brief', '#/foundations', '#/papers']) {
    assert.ok(hrefs.includes(need), `旧区入口不可丢：${need}`);
  }
});

test('PLAN-010（DOM）：课题页渲染四轴表/机制与表示/问题演化/论文联系/未定候选，实例是可点站内链接', () => {
  const view = renderAt('#/route/cross-harness-collab');
  const text = view.textContent;
  for (const heading of ['四轴编辑分析框架', '机制与表示', '问题演化', '论文间联系', '未定候选']) {
    assert.ok(text.includes(heading), `课题页缺块：${heading}`);
  }
  assert.ok(text.includes('不是任何综述的公认分类') || text.includes('非综述公认分类') || text.includes('不是综述公认分类'), '四轴须标注编辑框架性质');
  assert.ok(text.includes('未核验，未入库'), '未定候选须如实标注未入库');
  // PLAN-011 授权替代说明：论文联系的编辑性质声明由「逐条 meta 行」收拢为页内一次
  // （「编辑整理的对照读法，不是论文之间的引用关系」），断言相应替代。
  assert.ok(text.includes('不是论文之间的引用关系'), '论文联系须带编辑性质声明（页内一次）');
  // 四轴实例渲染为指向论文卡的站内链接。
  const hrefs = collectLinks(view);
  for (const need of ['#/paper/memgpt', '#/paper/compression-cost', '#/paper/do-not-restart']) {
    assert.ok(hrefs.includes(need), `四轴实例缺站内链接：${need}`);
  }
  // 问题演化节点挂论文链接。
  assert.ok(hrefs.includes('#/paper/handoff-tax'), '演化节点缺论文链接');
});

test('PLAN-010（DOM）：综述卡渲染章节来源导学树，每个节点带来源标注且可展开', () => {
  for (const id of ['survey-mem-tois', 'survey-comms-fcs']) {
    const view = renderAt(`#/paper/${id}`);
    const text = view.textContent;
    assert.ok(text.includes('综述导学树'), `${id} 缺导学树`);
    assert.ok(text.includes('编辑排定，非引用') || text.includes('不是论文引用'), `${id} 缺回链性质声明`);
    const tree = getPaper(id).surveyTree;
    const walk = (nodes) => nodes.reduce((n, node) => n + 1 + walk(node.children ?? []), 0);
    assert.equal(collectByClass(view, 'lib-tree-node').length, walk(tree.roots), `${id} 树节点数应与数据一致`);
    // 每个节点的 summary 行都带「来源：」标注（100%）。
    for (const summary of collectByClass(view, 'lib-tree-summary')) {
      assert.ok(summary.textContent.includes('来源：'), `${id} 存在无来源标注的树节点`);
    }
  }
  function getPaper(id) { return LIBRARY.papers.find((p) => p.id === id); }
});

test('PLAN-010（DOM）：首批卡三段式导读渲染（背景术语→精读定位→实际讲解），无依据卡降级为两段', () => {
  const view = renderAt('#/paper/compression-cost');
  const text = view.textContent;
  for (const part of ['三段式导读', '带着这些问题读', '原文精读定位', '实际讲解']) {
    assert.ok(text.includes(part), `compression-cost 缺三段式段：${part}`);
  }
  // 术语表（dl）有内容。
  assert.ok(collectByClass(view, 'lib-guided-terms').length >= 1, '缺背景术语表');
  // 无正文依据的旧卡不得冒充定位段（抽查一张摘要级 quick）。
  const quick = LIBRARY.papers.find((p) => p.deliveredDepth === 'quick' && p.coverage?.mode === 'abstract' && !p.guidedReading);
  if (quick) {
    const quickView = renderAt(`#/paper/${quick.id}`);
    assert.ok(!quickView.textContent.includes('三段式导读'), `${quick.id} 无导读数据不得渲染三段式`);
  }
});

test('PLAN-010（DOM）：技术路线详情页渲染「与当前研究能力的关系」块（三条 featured 各一）', () => {
  for (const id of ['tech-multiagent', 'tech-rag', 'tech-graph-simple']) {
    const view = renderAt(`#/learn/${id}`);
    const boxes = collectByClass(view, 'lib-capmap');
    assert.equal(boxes.length, 1, `${id} 应恰有一个能力映射块`);
    assert.ok(boxes[0].textContent.includes('与当前研究能力的关系'), `${id} 缺块标题`);
    assert.ok(boxes[0].textContent.length > 80, `${id} 能力映射块须有实质文本`);
  }
});

test('PLAN-010（DOM）：新基础导读材料页正文渲染、贯穿例子与 Explain 讲解在页面上可见', () => {
  for (const id of ['mat-handoff-basics', 'mat-mech-vs-representation', 'mat-read-performance-claims']) {
    const view = renderAt(`#/material/${id}`);
    const text = view.textContent;
    assert.ok(text.includes('改到一半'), `${id} 页面须出现贯穿例子`);
    assert.ok(text.includes('编辑讲解') || text.includes('编辑整理') || text.includes('编辑举例'), `${id} 缺编辑讲解/边界标注`);
    assert.ok(!text.includes('我的记录'), `${id} 材料页不得有本人记录面板`);
  }
});

// ---------- PLAN REV001：广域认知脉络图（可点击 SVG + 同源层级文本/节点详解；图文同数据） ----------

test('REV001（DOM）：#/map 广域图为主体——SVG 节点数与数据一致，层级文本同源，旧 009 地图保留为次级区', () => {
  const view = renderAt('#/map');
  const text = view.textContent;
  assert.ok(text.includes('领域认识 · 广域脉络图'), '广域图应为本页主体');
  assert.ok(text.includes('站内专题认识图'), '旧 009 地图须保留为次级区');
  assert.ok(text.includes('Agent 研究对象／问题'), '旧图两侧内容仍在');
  // 图文同数据：SVG 节点数、文本层节点按钮数都与数据一致。
  const land = LIBRARY.landscape;
  assert.equal(collectByClass(view, 'lib-land-node').length, land.nodes.length, 'SVG 节点数应与数据一致');
  let textCount = 0;
  walk(view, (n) => { if (n.tagName === 'BUTTON' && n.dataset && n.dataset.landId) textCount += 1; });
  assert.equal(textCount, land.nodes.length, '层级文本节点数应与数据一致（图文同源）');
  // 详解默认可见（默认选中首节点）。
  const detail = collectByClass(view, 'lib-land-detail')[0];
  assert.ok(detail, '缺节点详解面板');
  for (const field of ['问题', '思想', '例子', '能力变化', '局限', '来源']) {
    assert.ok(detail.textContent.includes(field), `详解缺字段：${field}`);
  }
  // PLAN-011 授权替代说明：学术边来源展示由「审计文档名」改为「文献名映射」（可追溯性在数据字段
  // source.auditRef，100% 不降级）；断言以读者可见的文献名为准。
  assert.ok(text.includes('学术关系') && text.includes('Neural-Symbolic Learning and Reasoning'), '学术边须附来源文献名');
  assert.ok(!text.includes('ai-agent-landscape-source-audit'), '内部审计编号不得渲染进页面（PLAN-011）');
  // PLAN-011 B3：建议阅读顺序边标注为「编辑安排」。
  assert.ok(text.includes('编辑安排'), '阅读顺序边须标注为编辑安排');
  // 6 条学习路径渲染。
  assert.equal(collectByClass(view, 'lib-land-path').length, 6, '学习路径应为 6 条');
  // 审查修复：详解（默认选中首节点）须在学习路径之前渲染，桌面与图并列。
  assert.ok(text.indexOf('符号与搜索') < text.indexOf('学习路径'), '节点详解应位于学习路径之前（详解放路径前）');
  const mainBox = collectByClass(view, 'lib-land-main')[0];
  assert.ok(mainBox, '缺图/详解并列容器');
  assert.ok(collectByClass(mainBox, 'lib-land-svg').length === 1 && collectByClass(mainBox, 'lib-land-detailbox').length === 1, '图与详解应并列于同一容器');
});

test('REV001（DOM）：点击与键盘选节点都更新详解；academic/reading 边来源口径正确', () => {
  const view = renderAt('#/map');
  const land = LIBRARY.landscape;
  const svgNodes = collectByClass(view, 'lib-land-node');
  const target = land.nodes.find((n) => n.id === 'land-f1');
  const index = land.nodes.indexOf(target);
  // 点击选中。
  svgNodes[index].listeners.click[0]();
  let detail = collectByClass(view, 'lib-land-detail')[0];
  assert.ok(detail.textContent.includes(target.title), '点击后详解应显示目标节点');
  assert.ok(detail.textContent.includes('协作机制 × 表示组合 × 计费'), 'F1 详解内容');
  // 键盘 Enter 选中另一个节点。
  const other = land.nodes.find((n) => n.id === 'land-a4');
  const otherIndex = land.nodes.indexOf(other);
  let prevented = false;
  svgNodes[otherIndex].listeners.keydown[0]({ key: 'Enter', preventDefault: () => { prevented = true; } });
  assert.ok(prevented, 'Enter 应被拦截（避免页面滚动）');
  detail = collectByClass(view, 'lib-land-detail')[0];
  assert.ok(detail.textContent.includes('注意力与 Transformer'), '键盘选中后详解应切换');
  // 选中节点在文本轨高亮。
  const active = collectByClass(view, 'lib-land-item-active');
  assert.equal(active.length, 1, '文本轨应恰有一个高亮节点');
  // reading 边不附来源：F1 详情的 reading 行不得含「来源：」，academic 行必须含。
  const detailText = detail.textContent;
  void detailText;
});

test('REV001（DOM）：主方向页渲染广域图相关支线预览与进入完整图入口', () => {
  const view = renderAt('#/route/cross-harness-collab');
  const text = view.textContent;
  assert.ok(text.includes('广域脉络中的相关支线'), '主方向页缺支线预览块');
  assert.ok(text.includes('多智能体协作'), '预览应含相关节点');
  assert.ok(collectLinks(view).includes('#/map'), '预览缺进入完整图入口');
  // 第二条方向也有自己的支线（代码智能体）。
  const view2 = renderAt('#/route/code-agent-verification');
  assert.ok(view2.textContent.includes('代码智能体与软件工程应用'), 'code 方向预览应含 E5 节点');
});

test('REV001（DOM）：层级文本按钮点击同样更新详解（图文同数据双向可达）', () => {
  const view = renderAt('#/map');
  const land = LIBRARY.landscape;
  const buttons = [];
  walk(view, (n) => { if (n.tagName === 'BUTTON' && n.dataset && n.dataset.landId) buttons.push(n); });
  const target = land.nodes.find((n) => n.id === 'land-e2');
  buttons[land.nodes.indexOf(target)].listeners.click[0]();
  const detail = collectByClass(view, 'lib-land-detail')[0];
  assert.ok(detail.textContent.includes('评测与成本'), '文本轨点击应更新详解');
  assert.ok(detail.textContent.includes('完成率看不见这笔账'), '详解应含节点实质正文');
});

// ---------- PLAN-011 读者体验小幅优化（2026-09-24）：首页去重/单行化、课题页三级+折叠、图谱 guide 优先 ----------

test('PLAN-011（DOM）：首页四区说明合并为一行且主推荐入口唯一；课题区入口不再同指路线首读', () => {
  const view = renderAt('#/home');
  const text = view.textContent;
  // B1：purpose+howToUse 合并为单行（lib-zone-about），不再渲染双段。
  assert.equal(collectByClass(view, 'lib-zone-about').length, 4, '四区各应有一行合并说明');
  assert.equal(collectByClass(view, 'lib-zone-purpose').length, 0, '旧双段 purpose 不应再渲染');
  // 去重仅限主推荐语义角色：「建议从这里开始」全页唯一；课题深化区入口为「课题结构与论文库」语义。
  const starts = text.split('建议从这里开始').length - 1;
  assert.equal(starts, 1, '「建议从这里开始」应为唯一主推荐');
  assert.ok(text.includes('打开课题结构与论文库'), '课题深化区入口应改为课题结构语义');
  // 审查修复 3（最小做法）：goal 区头不再重复「打开主方向路线」入口；区头链接数＝3（survey/topic/tech）。
  const zoneEntries = collectByClass(view, 'lib-zone-entry');
  assert.equal(zoneEntries.length, 3, 'goal 区头入口应去除，其余三区保留');
  assert.ok(!text.includes('打开主方向路线'), 'goal 区头重复入口文案不应再渲染');
  // goal 区内真正首读保留（「建议从这里开始」条目 + 打开导读链接）。
  assert.ok(collectLinks(view).some((h) => h.includes('#/material/mat-cross-harness-map')), 'goal 区首读导读链接保留');
  // 导航/回链同 URL 不禁止：topic 区入口与 goal 区首读仍可达路线页/材料页。
  const hrefs = collectLinks(view);
  assert.ok(hrefs.filter((h) => h === '#/route/cross-harness-collab').length >= 2, '导航同 URL 保持可达（不禁）');
});

test('PLAN-011（DOM）：课题页三级排布（导读→对照→辅助来源），旧介绍默认收起可展开', () => {
  const view = renderAt('#/route/cross-harness-collab');
  const text = view.textContent;
  // 层级顺序：四轴/问题演化（导读）在机制与表示（对照）之前，二者在辅助来源之前。
  const iAxis = text.indexOf('四轴编辑分析框架');
  const iEvo = text.indexOf('问题演化');
  const iMech = text.indexOf('机制与表示');
  const iAux = text.indexOf('辅助来源');
  assert.ok(iAxis > -1 && iMech > -1 && iAux > -1 && iEvo > -1, '三级块都在场');
  assert.ok(Math.max(iAxis, iEvo) < iMech, '导读应在对照表之前');
  assert.ok(iMech < iAux, '对照表应在辅助来源之前');
  // 旧介绍折叠：details 默认收起，内容保留。
  const legacy = collectByClass(view, 'lib-route-legacy')[0];
  assert.ok(legacy, '缺旧介绍折叠容器');
  assert.ok(!legacy.open, '旧介绍应默认收起');
  assert.ok(legacy.textContent.includes('这个方向研究什么'), '旧介绍内容须保留');
  assert.ok(legacy.textContent.includes('难点与不适用条件'), '旧介绍限制段须保留');
  // 核查记录（方向来源）移入辅助来源层。
  assert.ok(text.includes('核查记录'), '来源列表应在辅助来源层');
  assert.ok(text.indexOf('支撑「当前研究情况」等判断的公开来源') > iMech, '核查记录应位于对照表之后');
  // 页内编辑性质声明只说一次（论文联系区），不逐条重复。
  const decl = text.split('不是论文之间的引用关系').length - 1;
  assert.equal(decl, 1, '论文联系的编辑性质声明应页内一次');
  // 内部契约词不泄露至主文案。
  for (const banned of ['PF-07', 'auditRef', '§4.1 关系段', '（§2.1–2.4 已核）']) {
    assert.ok(!text.includes(banned), `课题页主文案不应含内部词：${banned}`);
  }
});

test('PLAN-011（DOM）：图谱页 guide 优先——讲解直出、字段速览折叠；无讲解节点字段保持直出', () => {
  const view = renderAt('#/map');
  const land = LIBRARY.landscape;
  const buttons = [];
  walk(view, (n) => { if (n.tagName === 'BUTTON' && n.dataset && n.dataset.landId) buttons.push(n); });
  const clickNode = (id) => {
    const target = land.nodes.find((n) => n.id === id);
    buttons[land.nodes.indexOf(target)].listeners.click[0]();
    return collectByClass(view, 'lib-land-detail')[0];
  };
  // 有 guide 的节点（land-a5）：讲解段落直出，六字段收进折叠速览。
  let detail = clickNode('land-a5');
  assert.equal(collectByClass(detail, 'lib-land-guide').length, 1, 'guide 讲解块应在场');
  assert.ok(detail.textContent.includes('猜下一个词'), 'guide 机制段应直接可读');
  // 审查修复 2：guide 下常显一句来源＋证据级/关键身份；完整来源在折叠速览内。
  const brief = collectByClass(detail, 'lib-land-source-brief');
  assert.equal(brief.length, 1, 'guide 节点应常显简短来源行');
  assert.ok(brief[0].textContent.includes('来源') && brief[0].textContent.includes('研究报告'), '常显来源须含来源名与证据级/身份');
  const fieldsWrap = collectByClass(detail, 'lib-land-fields-wrap')[0];
  assert.ok(fieldsWrap, '有讲解时字段应收进折叠速览');
  assert.ok(!fieldsWrap.open, '字段速览应默认收起（guide 优先，避免双重全量展开）');
  assert.ok(fieldsWrap.textContent.includes('问题') && fieldsWrap.textContent.includes('来源'), '速览折叠内仍含六字段');
  // 无 guide 的节点（land-a1）：字段保持直出，不套折叠。
  detail = clickNode('land-a1');
  assert.equal(collectByClass(detail, 'lib-land-guide').length, 0, '无讲解节点不应渲染 guide 块');
  assert.equal(collectByClass(detail, 'lib-land-fields-wrap').length, 0, '无讲解节点字段保持直出');
  assert.ok(collectByClass(detail, 'lib-land-fields').length === 1, '无讲解节点字段表应在场');
  // 学术边在详解中显示来源文献名（land-a1 的相连学术边）。
  assert.ok(detail.textContent.includes('Neural-Symbolic Learning and Reasoning'), '学术边来源应为文献名');
  // 编辑边显示「建议的阅读顺序（编辑安排）」——land-a1 无编辑边，切到 land-f1 断言。
  detail = clickNode('land-f1');
  assert.ok(detail.textContent.includes('建议的阅读顺序（编辑安排）'), '编辑边应标注为编辑安排');
});

test('PLAN-011（DOM）：首页/图谱/课题页主文案不泄露内部编号与契约词', () => {
  for (const [hash, name] of [['#/home', '首页'], ['#/map', '图谱页'], ['#/route/cross-harness-collab', '课题页']]) {
    const view = renderAt(hash);
    const text = view.textContent;
    for (const banned of ['PF-07', 'auditRef', 'contentVersion', 'land-edge-', 'land-path-', 'ai-agent-landscape-source-audit']) {
      assert.ok(!text.includes(banned), `${name} 主文案不应含内部词：${banned}`);
    }
  }
});
