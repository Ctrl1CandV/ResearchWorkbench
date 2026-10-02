// tests/render.test.mjs —— 渲染探针回归（审查回流：把验收方的渲染探针固化为仓库测试）。
// 用最小 DOM 桩在 node:test 中真实执行 public/library.js 的渲染分支，覆盖：
// 1) 全部视图渲染成功且文本无 undefined/NaN（防止校验遗漏字段渲染成 undefined）；
// 2) 每篇论文的页内目录（按钮标签、目标 id）与实际渲染的章节标题逐项一致（回流项 1 的 DOM 断言）；
// 3) 目录容器 details 的开闭随 matchMedia 变化：≤900px 默认折叠、>900px 默认展开（回流项 2）；
// 4) 首页学习顺序、真实起点、两条方向与四个主要栏目均可读可达；
// 5) 路线页阶段提示按实际分组顺序生成（回流项 3 的 DOM 断言）。
// 桩只实现渲染路径用到的 DOM 能力；不引入第三方依赖，不访问网络与 private/。

import test from 'node:test';
import assert from 'node:assert/strict';

import { LIBRARY } from '../public/library-content.js';
import { SURVEYS } from '../public/content/surveys.js';

// ---------- 最小 DOM 桩 ----------

class DomNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.childNodes = [];
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this.textContentValue = '';
    this.style = {};
    this.parentNode = null;
  }
  appendChild(child) {
    if (!child) throw new Error(`appendChild 收到空节点（${this.tagName}）`);
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }
  append(...children) {
    for (const child of children) {
      this.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
  }
  replaceChildren(...children) {
    this.childNodes = [];
    for (const child of children) this.appendChild(child);
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener(name, fn) { (this.listeners[name] ??= []).push(fn); }
  scrollIntoView() {}
  scrollTo(left, top) { this.scrollLeft = left; this.scrollTop = top; }
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
    const edgeIndexMatch = String(selector).match(/^\[data-edge-index="(\d+)"\]$/i);
    const visit = (n) => {
      for (const c of n.childNodes ?? []) {
        if (c instanceof DomNode) {
          const matches = want.startsWith('.')
            ? c.className.split(/\s+/).includes(want.slice(1))
            : edgeIndexMatch
              ? String(c.dataset.edgeIndex) === edgeIndexMatch[1]
            : c.tagName.toLowerCase() === want;
          if (matches) results.push(c);
          visit(c);
        }
      }
    };
    visit(this);
    return results;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  closest(selector) {
    const wanted = String(selector).toLowerCase();
    for (let node = this; node; node = node.parentNode) {
      if (node.tagName.toLowerCase() === wanted) return node;
    }
    return null;
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
  createElementNS: (_namespace, tag) => new DomNode(tag),
  createTextNode: (text) => new TextNode(text),
  getElementById: (id) => byId.get(id) ?? null,
  querySelectorAll: () => [],
  body: null,
};
document.body = new DomNode('body');

for (const id of ['lib-view', 'lib-quick']) mountElement(id);

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

test('READING-014（DOM）：离开综述后清理共享容器的专属样式', () => {
  const view = byId.get('lib-view');
  view.classList.add('survey-view'); // 模拟刚离开综述页时留下的旧状态。
  renderAt('#/home');
  assert.equal(view.classList.contains('survey-view'), false, '首页不得继承综述字号与宽度');
  view.classList.add('survey-view');
  renderAt('#/papers');
  assert.equal(view.classList.contains('survey-view'), false, '论文库不得继承综述字号与宽度');
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

test('READING-014（DOM）：论文只有显式路线来路才显示路线位置', () => {
  const direct = renderAt('#/paper/beyond-frameworks');
  assert.ok(!direct.textContent.includes('在路线中的位置'), '无来路的论文深链不推测所属方向');
  const fromRoute = renderAt('#/paper/beyond-frameworks?route=cross-harness-collab&track=start');
  assert.ok(fromRoute.textContent.includes('在路线中的位置'), '路线入口携带参数时显示当前步骤');
  assert.ok(fromRoute.textContent.includes('第 2 / 5 步'), '显式上下文应显示准确位置');
});

test('READING-014（DOM）：基础材料无来路时不推测方向', () => {
  lib.__setRenderLibrary(LIBRARY);
  const direct = renderAt('#/material/mat-cross-harness-map');
  assert.ok(!direct.textContent.includes('在路线中的位置'), '无来路的材料深链不推测所属方向');
  const fromRoute = renderAt('#/material/mat-cross-harness-map?route=cross-harness-collab&track=start');
  assert.ok(fromRoute.textContent.includes('在路线中的位置'), '路线入口保留显式路线位置');
});

// ---------- 4) 首页实际渲染 ----------

test('首页（DOM）：学习顺序、有效起点、探索方向和栏目入口清楚可达', () => {
  const view = renderAt('#/home');
  const text = view.textContent;
  assert.equal(collectByClass(view, 'lib-learning-step').length, 3, '学习顺序应呈现三步');
  assert.equal(collectByClass(view, 'lib-home-reader-card').length, 4, '首页应保留四个主要栏目');
  assert.equal(collectByClass(view, 'lib-home-direction').length, 2, '首页只展示两条当前探索方向');
  const start = collectByClass(view, 'lib-home-start')[0];
  const focus = lib.resolveHomeFocus(LIBRARY);
  assert.ok(start?.textContent.includes(focus.step.resolved.title), '建议起点应来自生效路线的首步');
  assert.ok(start.textContent.includes(focus.step.purpose), '建议起点保留阅读目的');
  assert.ok(start.textContent.includes(focus.step.check), '建议起点保留读后自检');
  assert.equal(collectByClass(view, 'lib-firstuse').length, 0, '重复的首次使用流程不再占首页空间');
  assert.ok(!text.includes('内容更新日期'), '首页不展示内容维护时间');
  assert.ok(text.includes('建议起点'), '起点卡需要明确标出推荐性质');
  const hrefs = collectLinks(view);
  for (const href of ['#/surveys', '#/papers', '#/directions', '#/learn', '#/foundations']) {
    assert.ok(hrefs.includes(href), `首页主要入口缺少 ${href}`);
  }
  assert.ok(hrefs.includes('#/brief'), '每日精选暂停更新后仍保留历史入口');
  assert.ok(!text.includes('关于内容与来源'), '首页不重复展示全站制作说明');
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
  const start = collectByClass(view, 'lib-home-start')[0];
  const startText = start.textContent;
  try {
    assert.ok(startText.includes('建议起点'), '首屏需要清楚标出建议阅读入口');
    assert.ok(startText.includes('跨工具协作：先把研究问题分清楚'), '起点应为有效路线的第一步');
    assert.ok(startText.includes('为什么从这里开始') && startText.includes('读完试着回答'), '保留推荐理由和阅读自检');
    // 页面不靠“进度面板”解释推荐；推荐入口仍是编辑建议，不推断本人状态。
    for (const forbidden of ['已读', '已掌握', '百分比', '连续天数', '进度 100', '完成度']) {
      assert.ok(!startText.includes(forbidden), `起点卡出现进度统计：${forbidden}`);
    }
  } finally {
    lib.__setV3ForTest(prev.kind, prev.state);
  }
});

test('DG009-B（DOM）：旧专题图仍保留在折叠次级区，不挤占广域图主体', () => {
  const view = renderAt('#/map');
  const text = view.textContent;
  const legacy = collectByClass(view, 'lib-map-legacy')[0];
  assert.ok(legacy && !legacy.open, '旧 009 专题图须保留但默认收起');
  assert.equal(collectByClass(legacy, 'lib-map-node').length, LIBRARY.map.nodes.length, '折叠区仍保留全部专题节点');
  assert.equal(collectByClass(view, 'lib-land-node').length, LIBRARY.landscape.nodes.length, '主视图应呈现广域图节点');
  assert.ok(!collectByClass(view, 'lib-land-detailbox').length, '主图页不再并列长篇详情');
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
  // 首页首屏：推荐起点进入站内导读，综述总览保留独立入口。
  const home = renderAt('#/home');
  const homeLinks = collectLinks(home);
  assert.ok(homeLinks.includes('#/surveys'), '首页应能进入综述全景');
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
  const secondary = collectByClass(home, 'lib-home-secondary-reader')[0];
  assert.ok(secondary, '缺次级入口行');
  const hrefs = collectLinks(secondary);
  for (const need of ['#/brief', '#/directions', '#/guidance']) {
    assert.ok(hrefs.includes(need), `次级入口缺 ${need}`);
  }
  const all = collectLinks(home);
  for (const need of ['#/foundations', '#/learn', '#/papers']) assert.ok(all.includes(need), `主要栏目入口缺 ${need}`);
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
  assert.ok(text.includes('阅读重点：') && text.includes('读完自检：'), '起步路线需要突出当前步骤讲解');
  const codeArchive = renderAt('#/route/code-agent-verification?section=archive').textContent;
  assert.ok(codeArchive.includes('完整谱系（初期不必走）'), 'archive 视图保留完整谱系标题');
  const collab = renderAt('#/route/cross-harness-collab?section=archive').textContent;
  assert.ok(collab.includes('按需查阅（不必接着读）'), '主方向 archive 标题');
  const start = renderAt('#/route/cross-harness-collab').textContent;
  assert.ok(start.includes('本段到此'), '尾节点结束提示');
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

test('READING-014（DOM）：论文书库按路线范围切换、搜索恢复、基础导读可回查且全量不重复', () => {
  const view = renderAt('#/papers');
  const scope = collectByClass(view, 'lib-paper-scope')[0];
  const search = collectByClass(view, 'lib-paper-search')[0];
  assert.ok(scope && search, '论文库应提供范围选择与搜索');
  assert.equal(scope.value, 'primary', '默认先看主方向起步论文');
  assert.ok(view.textContent.includes('Beyond Frameworks'), '主方向起步列表可扫描');
  assert.ok(collectLinks(view).includes('#/paper/beyond-frameworks?route=cross-harness-collab&track=start'), '主方向书库入口保留路线来路');
  assert.ok(!view.textContent.includes('Attention Is All You Need'), '基础经典单独从经典书目进入');

  search.value = 'Beyond Frameworks';
  search.listeners.input[0]();
  assert.equal(collectByClass(view, 'lib-paper-item').length, 1, '搜索命中只保留相关条目');
  search.value = 'no-such-paper-should-match';
  search.listeners.input[0]();
  assert.ok(view.textContent.includes('没有找到匹配的论文'), '空结果给出可理解提示');
  const clear = clickFirst(view, (node) => node.textContent === '清除搜索');
  assert.ok(clear, '空结果提供清除搜索入口');
  clear.listeners.click[0]();
  assert.equal(collectByClass(view, 'lib-paper-item').length, 4, '清空搜索恢复主方向起步列表');

  scope.value = 'secondary';
  scope.listeners.change[0]();
  assert.ok(view.textContent.includes('代码智能体的修复正确性'), '可切换到第二方向起步文献');
  assert.ok(collectLinks(view).includes('#/paper/tosem2025-acceptance?route=code-agent-verification&track=start'), '第二方向论文入口保留路线来路');
  scope.value = 'expanded';
  scope.listeners.change[0]();
  assert.ok(view.textContent.includes('拓展阅读'), '拓展范围显示路线归属');

  scope.value = 'all';
  scope.listeners.change[0]();
  const visiblePapers = collectByClass(view, 'lib-paper-item');
  assert.equal(visiblePapers.length, LIBRARY.papers.filter((paper) => paper.collection !== 'foundations').length, '全量范围包含所有非经典论文且不重复');
  const links = collectLinks(view);
  for (const id of [
    'mat-cross-harness-map', 'mat-read-empirical', 'mat-handoff-basics',
    'mat-mech-vs-representation', 'mat-read-performance-claims',
  ]) assert.ok(links.some((href) => href.startsWith(`#/material/${id}`)), `基础导读缺可达入口：${id}`);
  assert.ok(links.includes('#/material/mat-cross-harness-map?route=cross-harness-collab&track=start'), '路线内材料保留上下文入口');
});

test('READING-014（DOM）：三篇补充导读从课题分析与对应阅读卡就近可达', () => {
  lib.__setRenderLibrary(LIBRARY);
  const topic = renderAt('#/route/cross-harness-collab?section=topic');
  const topicLinks = collectLinks(topic);
  assert.ok(topicLinks.includes('#/material/mat-handoff-basics'), '课题分析可打开任务接续背景导读');
  assert.ok(topicLinks.includes('#/material/mat-mech-vs-representation'), '机制与表示对照旁可打开配套导读');

  const paper = renderAt('#/paper/handoff-tax');
  assert.ok(collectLinks(paper).includes('#/material/mat-read-performance-claims'), '数字解释旁可打开性能读数导读');
});

test('READING-014（DOM）：三篇综述都逐项呈现已核读、已讲解与未讲解范围', () => {
  for (const article of SURVEYS.articles) {
    const view = renderAt(`#/survey/${article.id}`);
    const text = view.textContent;
    assert.ok(text.includes('已核读范围') && text.includes('站内已讲解') && text.includes('尚未讲解'), `${article.id} 覆盖区分不完整`);
    for (const section of article.coverage.readSections) assert.ok(text.includes(section), `${article.id} 缺已核读范围 ${section}`);
    for (const section of article.coverage.taughtSections) assert.ok(text.includes(section), `${article.id} 缺已讲解范围 ${section}`);
    for (const section of article.coverage.notYetTaught) assert.ok(text.includes(section), `${article.id} 缺尚未讲解范围 ${section}`);
  }
});

test('READING-014（DOM）：综述图关系说明在宽屏展开、窄屏收起', () => {
  viewportWide = true;
  let view = renderAt(`#/survey/${SURVEYS.articles[0].id}`);
  let related = collectByClass(view, 'survey-atlas-neighbors')[0];
  assert.ok(related, '图谱选中内容应包含关系说明');
  assert.equal(related.open, true, '宽屏默认展开关系说明');

  viewportWide = false;
  view = renderAt(`#/survey/${SURVEYS.articles[0].id}`);
  related = collectByClass(view, 'survey-atlas-neighbors')[0];
  assert.equal(related.open, false, '窄屏默认收起关系说明，避免遮挡图谱与阅读入口');
  viewportWide = true;
});

test('READING-014（DOM）：窄屏点击关系编号会展开并定位到依据', () => {
  viewportWide = false;
  const view = renderAt(`#/survey/${SURVEYS.articles[0].id}`);
  const related = collectByClass(view, 'survey-atlas-neighbors')[0];
  const badge = collectByClass(view, 'survey-atlas-edge-badge')[0];
  assert.ok(related && badge, '测试需要关系说明与图中关系编号');
  assert.equal(related.open, false, '窄屏初始收起关系说明');
  badge.listeners.click[0]();
  assert.equal(related.open, true, '点击图中编号后自动展开依据');
  viewportWide = true;
});

test('READING-014（DOM）：经典书目搜索保留主题分组并在无结果时可恢复', () => {
  const view = renderAt('#/foundations');
  const search = collectByClass(view, 'lib-paper-search')[0];
  assert.ok(search, '经典书目应复用论文列表搜索');
  assert.equal(collectByClass(view, 'lib-paper-item').length, LIBRARY.papers.filter((paper) => paper.collection === 'foundations').length);
  search.value = 'Attention Is All You Need';
  search.listeners.input[0]();
  assert.equal(collectByClass(view, 'lib-paper-item').length, 1, '搜索后隐藏不匹配的主题组');
  assert.ok(view.textContent.includes('架构'), '命中论文仍保留主题分组');
  search.value = 'not-a-foundation';
  search.listeners.input[0]();
  assert.ok(view.textContent.includes('没有找到匹配的论文'), '经典书目空结果明确');
  assert.ok(clickFirst(view, (node) => node.textContent === '清除搜索'), '空结果提供恢复入口');
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
  const scope = collectByClass(list, 'lib-paper-scope')[0];
  scope.value = 'all';
  scope.listeners.change[0]();
  assert.ok(list.textContent.includes('我的状态：在读（本人标记）'), '列表应显示本人标记状态');
  assert.ok(list.textContent.includes('导出我的记录（Markdown）'), '缺导出按钮');
  assert.ok(list.textContent.includes('我的待读清单'), '缺待读清单区');
  assert.ok(list.textContent.includes('本人添加、未核查'), '待读清单须标注未核查');
});

test('READING-014（DOM）：记录先预览已有内容，编辑表单需主动展开', () => {
  const previous = lib.__getV3ForTest();
  lib.__setV3ForTest('ok', {
    version: 3,
    papers: {
      'astute-rag': {
        status: 'reading',
        question: '原记录问题：如何区分检索误差与生成误差？',
        note: '原记录笔记：先看召回，再看上下文组织。',
        updatedAt: '2026-09-29T08:15:00.000Z',
      },
    },
    readingList: [],
  });
  const view = renderAt('#/paper/astute-rag');
  const editor = collectByClass(view, 'lib-notes-editor')[0];
  assert.ok(editor, '缺少折叠的记录编辑区');
  const summary = editor.childNodes.find((child) => child.tagName === 'SUMMARY');
  assert.ok(summary?.textContent.includes('本人标记：在读'), '摘要先显示本人标记');
  assert.ok(summary?.textContent.includes('展开编辑'), '编辑动作需要明确展开');
  const preview = collectByClass(view, 'lib-notes-preview')[0];
  assert.ok(preview?.textContent.includes('如何区分检索误差与生成误差？'), '完整保留原问题预览');
  assert.ok(preview?.textContent.includes('先看召回，再看上下文组织。'), '完整保留原笔记预览');
  assert.equal(collectByClass(editor, 'lib-notes-area').length, 2, '原编辑表单仍可从折叠区展开');
  lib.__setV3ForTest(previous.kind, previous.state);
});

test('v3（DOM）：待读清单添加流程（https 校验与标注）', async () => {
  const view = renderAt('#/papers');
  const add = clickFirst(view, (n) => n.textContent === '加入待读');
  assert.ok(add, '缺添加按钮');
  const form = collectByClass(view, 'lib-notes-form')[0];
  const inputs = [];
  walk(form, (n) => {
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

test('READING-014 首页（DOM）：仅将本人明确标记的在读论文作为继续入口', () => {
  const view = renderAt('#/home');
  const start = collectByClass(view, 'lib-home-start')[0];
  assert.ok(start.textContent.includes('继续在读：'), '本人在读记录应提供继续入口');
  assert.ok(start.textContent.includes('Astute RAG'), '继续入口应指向本人标记的论文');
  assert.ok(start.textContent.includes('建议起点'), '继续入口不替代编辑建议的起点');
});

test('READING-014 首页（DOM）：仅展示本人手动标记的在读论文，不推断或汇总掌握状态', () => {
  const prev = lib.__getV3ForTest();
  const homeState = (v3State) => {
    lib.__setV3ForTest(v3State.kind, v3State.state);
    const view = renderAt('#/home');
    return { text: view.textContent, start: collectByClass(view, 'lib-home-start')[0]?.textContent ?? '' };
  };
  try {
    // 空记录下只显示建议起点，不另造空进度面板。
    let state = homeState({ kind: 'empty', state: { version: 3, papers: {}, readingList: [] } });
    assert.ok(state.start.includes('建议起点'), '无记录也应保留建议起点');
    assert.ok(!state.start.includes('尚无阅读记录') && !state.start.includes('进度'), '不展示空进度声明');

    // 已读状态由用户在论文阅读页维护，不在首页汇总。
    state = homeState({
      kind: 'ok',
      state: { version: 3, papers: { 'memgpt': { status: 'done', question: '', note: '', updatedAt: '2026-09-23T00:00:00.000Z' } }, readingList: [] },
    });
    assert.ok(!state.start.includes('已读 1 篇') && !state.start.includes('MemGPT'), '不汇总或误报已读记录');

    // 问题和笔记保留在对应论文卡，不出现在起点推荐区。
    state = homeState({
      kind: 'ok',
      state: { version: 3, papers: { 'memgpt': { status: 'unread', question: '存储与当前输入如何区分？', note: '', updatedAt: null } }, readingList: [] },
    });
    assert.ok(!state.start.includes('存储与当前输入如何区分'), '不把私人的问题记录拼入首页');

    // 待读清单是书库中的独立对象，不当作“继续在读”。
    state = homeState({
      kind: 'ok',
      state: { version: 3, papers: {}, readingList: [{ id: 'r1', title: '偶遇论文', url: '', note: '', addedAt: '2026-09-23T00:00:00.000Z' }] },
    });
    assert.ok(!state.start.includes('继续在读') && !state.start.includes('偶遇论文'), '待读条目不被误标成在读');

    // 混合状态只给明确的在读项提供直达，不把其它状态混进首页。
    state = homeState({
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
    assert.ok(state.start.includes('Astute RAG') && state.start.includes('继续在读'), '本人在读状态可直达');
    assert.ok(!state.start.includes('MemGPT') && !state.start.includes('已读 1 篇'), '不在首页显示已读与笔记汇总');

    // 本地记录不可用/损坏时首页不推测状态，论文页保留记录处理入口。
    state = homeState({ kind: 'unavailable', state: null });
    assert.ok(!state.start.includes('存储不可用') && !state.start.includes('尚无阅读记录'), '不可用时不虚构状态');

    state = homeState({ kind: 'corrupt', state: null });
    assert.ok(!state.start.includes('损坏') && !state.start.includes('尚无阅读记录'), '损坏时不推断本人状态');
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
  // 读者页面聚焦论文题名与发表时间，不展示整理/抓取流程。
  assert.ok(pastText.includes('DolphinBench: Mapping the Pareto Frontier of Agent Memory'), '精选应展示论文题名');
  assert.ok(pastText.includes('发表时间：2026-09-21（arXiv 提交）'), '精选应标注论文发表时间');
  assert.ok(!pastText.includes('检索：') && !pastText.includes('整理日期'), '不展示检索与整理时间说明');
  const empty = renderAt('#/brief/brief-2026-09-22');
  assert.ok(empty.textContent.includes('2026-09-22 精选'), '空窗口期仍应显示对应期次');
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
  assert.ok(homeText.includes('建议起点'), '首页起点推荐文案');
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
  assert.ok(text.includes('本段到此') && text.includes('选一个你仍不明白的比较问题'), '末段结束与行动建议');
  const archiveView = renderAt('#/route/collab?section=archive');
  assert.ok(archiveView.textContent.includes('按需查阅（不必接着读）'), '主方向 archive 单独可达');
  const selectedView = renderAt('#/route/collab?section=start&step=step-collab-2');
  assert.ok(selectedView.textContent.includes('协作维度'), 'step query 应在详情面板选择对应步骤');
  assert.ok(collectByClass(selectedView, 'lib-route-index-link').some((item) => item.getAttribute('aria-current') === 'step'), '当前步骤有语义化选中标记');
  const invalidStep = renderAt('#/route/collab?step=removed-step');
  assert.ok(invalidStep.textContent.includes('已回到本段第一步'), '已失效步骤回退到本段第一步并提示');
  const topicView = renderAt('#/route/collab?section=topic');
  assert.ok(topicView.textContent.includes('理解课题'), '课题分析作为独立视图可达');
  const codeView = renderAt('#/route/code-verify');
  assert.ok(renderAt('#/route/code-verify?section=archive').textContent.includes('完整谱系（初期不必走）'), '第二方向 archive 标题沿用');
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
  view = renderAt('#/route/cross-harness-collab?section=start&step=step-collab-3');
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
  view = renderAt('#/route/cross-harness-collab?section=start&step=step-collab-3');
  assert.ok(view.textContent.includes('页面走查后的新目的。'), '重载后生效变化仍在');
  // 撤销＝一次全回＋前向写入（seq+1、history 只追加）
  view = renderAt('#/guidance');
  const undoBtn = findButton(view, '撤销最近一次导学调整');
  assert.ok(undoBtn, '缺撤销按钮');
  await undoBtn.listeners.click[0]();
  view = renderAt('#/route/cross-harness-collab?section=start&step=step-collab-3');
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
  const hero = collectByClass(view, 'lib-home-start')[0].textContent;
  const directionPanel = collectByClass(view, 'lib-home-direction-panel')[0].textContent;
  assert.ok(directionPanel.includes('跨工具的智能体协作'), '示例 homeFocus 不得改写当前关注（R6 规则①）');
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
  const hero = collectByClass(view, 'lib-home-start')[0].textContent;
  const directionPanel = collectByClass(view, 'lib-home-direction-panel')[0].textContent;
  assert.ok(directionPanel.includes('代码智能体的修复正确性与预算受限验证'), '真实 homeFocus 生效：当前关注切到第二条 active 方向');
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
  const hero2 = collectByClass(view, 'lib-home-start')[0].textContent;
  assert.ok(collectByClass(view, 'lib-home-direction-panel')[0].textContent.includes('跨工具的智能体协作'), '重置后当前关注回基线主方向');
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
  const hero = collectByClass(view, 'lib-home-start')[0].textContent;
  const purpose = collectByClass(view, 'lib-home-start-purpose')[0].textContent;
  assert.ok(purpose.includes('首屏生效的新目的。'), 'B2：首屏「为什么从这里开始」应显示生效值');
  assert.ok(!purpose.includes('先分清场景、机制、表示与传输四层'), 'B2：旧目的不应残留在推荐理由里');
  assert.ok(hero.includes('导学调整 · AI建议 2026-09-22（本人确认）'), 'B2：被调整的首屏字段带 R4 来源行');
  // 复原（撤销）给下一用例干净状态
  view = renderAt('#/guidance');
  await findButton(view, '撤销最近一次导学调整').listeners.click[0]();
  view = renderAt('#/home');
  const baselinePurpose = LIBRARY.directions.find((direction) => direction.id === 'cross-harness-collab').startRoute[0].purpose;
  assert.ok(collectByClass(view, 'lib-home-start-purpose')[0].textContent.includes(baselinePurpose), '撤销后首屏推荐理由回到当前正式基线文案');
});

test('DG009-C（DOM，B2）：仅附注（note-only）homeFocus 也给出来源行，方向不被误切', async () => {
  let view = renderAt('#/guidance');
  await uiApplyProposal(view, domProposal([domSet('home-focus', 'home', 'note', '本周只补一条附注。')], { id: 'prop-b2-note', sourceType: 'advisor' }));
  view = renderAt('#/home');
  const hero = collectByClass(view, 'lib-home-start')[0].textContent;
  assert.ok(collectByClass(view, 'lib-home-direction-panel')[0].textContent.includes('跨工具的智能体协作'), 'note-only 不改当前关注');
  assert.ok(hero.includes('附注：本周只补一条附注。'), 'note-only 附注应在首屏显示');
  assert.ok(hero.includes('导学调整 · 导师转述 2026-09-22（本人确认）'), 'note-only 焦点须带来源 meta 行（B2 修复项）');
  // 复原：重置两步
  view = renderAt('#/guidance');
  await findButton(view, '重置导学覆盖层（先导出备份）').listeners.click[0]();
  view = byId.get('lib-view');
  await findButton(view, '确认重置（我已导出备份）').listeners.click[0]();
  view = renderAt('#/home');
  assert.ok(!collectByClass(view, 'lib-home-start')[0].textContent.includes('附注'), '重置后附注消失');
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

test('READING-014（DOM）：首页按学习动线组织，四个栏目用途和推荐入口齐备', () => {
  const view = renderAt('#/home');
  const text = view.textContent;
  const hrefs = collectLinks(view);
  assert.equal(collectByClass(view, 'lib-learning-step').length, 3, '三步学习动线');
  assert.equal(collectByClass(view, 'lib-home-reader-card').length, 4, '四个栏目入口');
  assert.equal(collectByClass(view, 'lib-home-direction').length, 2, '两条当前研究方向');
  for (const title of ['综述阅读', '论文阅读', '技术学习', '经典书目']) {
    assert.ok(text.includes(title), `首页缺少栏目：${title}`);
  }
  assert.ok(text.includes('建议起点') && text.includes('读完试着回答'), '起点卡应给出推荐材料和自检');
  assert.ok(text.includes('主方向首篇论文：Beyond Frameworks：把协作拆成四个维度'), '首页论文入口应从有效 startRoute 解析，不依赖旧 route 字段');
  for (const need of ['#/surveys', '#/papers', '#/directions', '#/learn', '#/foundations', '#/brief']) {
    assert.ok(hrefs.includes(need), `首页入口不可达：${need}`);
  }
  assert.ok(hrefs.includes('#/paper/beyond-frameworks'), '首页应提供可直达的主方向首篇论文');
  assert.ok(text.includes('每日精选 · 暂停更新'), '精选历史入口需说明暂停更新');
  assert.ok(!text.includes('来源与状态说明') && !text.includes('关于内容与来源'), '首页不展示重复制作说明');
});

test('PLAN-010（DOM）：课题页渲染四轴表/机制与表示/问题演化/论文联系/未定候选，实例是可点站内链接', () => {
  const view = renderAt('#/route/cross-harness-collab?section=topic');
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

test('PLAN-012（DOM）：#/map 只展示可点击 SVG 图，节点详情不与图同屏', () => {
  const view = renderAt('#/map');
  const text = view.textContent;
  assert.ok(text.includes('从 AI 到 Agent：知识地图'), '地图标题应在场');
  assert.ok(!text.includes('核查截止'), '地图正文不展示核查日期');
  const land = LIBRARY.landscape;
  assert.equal(collectByClass(view, 'lib-land-node').length, land.nodes.length, 'SVG 节点数应与数据一致');
  assert.equal(collectByClass(view, 'lib-land-detailbox').length, 0, '概览页不应显示节点详情');
  assert.equal(collectByClass(view, 'lib-land-path').length, land.paths.length, '图下保留学习路径索引');
  assert.equal(collectByClass(view, 'lib-map-legacy').length, 1, '009 专题图仍保留在次级区');
  assert.ok(text.includes('学术关系') && text.includes('Neural-Symbolic Learning and Reasoning'), '学术边须附来源文献名');
  assert.ok(!text.includes('ai-agent-landscape-source-audit'), '内部审计编号不得渲染进页面（PLAN-011）');
  assert.ok(text.includes('编辑安排'), '阅读顺序边须标注为编辑安排');
  const paths = collectByClass(view, 'lib-land-paths')[0];
  assert.ok(paths && !paths.open, '学习路径作为辅助内容默认收起');
});

test('PLAN-012（DOM）：点击与键盘选节点都进入独立详情页，并保留返回地图入口', () => {
  const view = renderAt('#/map');
  const land = LIBRARY.landscape;
  const svgNodes = collectByClass(view, 'lib-land-node');
  const target = land.nodes.find((n) => n.id === 'land-f1');
  const index = land.nodes.indexOf(target);
  svgNodes[index].listeners.click[0]();
  assert.ok(window.location.hash.includes(`node=${target.id}`), '点击应导航至目标节点详情');
  const detailView = renderAt(window.location.hash);
  assert.ok(detailView.textContent.includes(target.title), '详情页标题应对应目标节点');
  assert.ok(detailView.textContent.includes('协作机制 × 表示组合 × 计费'), 'F1 详情正文保留');
  assert.ok(collectLinks(detailView).some((href) => href.startsWith('#/map')), '详情页提供返回地图入口');

  renderAt('#/map');
  const other = land.nodes.find((n) => n.id === 'land-a4');
  const otherIndex = land.nodes.indexOf(other);
  let prevented = false;
  svgNodes[otherIndex].listeners.keydown[0]({ key: 'Enter', preventDefault: () => { prevented = true; } });
  assert.ok(prevented, 'Enter 应被拦截（避免页面滚动）');
  assert.ok(window.location.hash.includes(`node=${other.id}`), 'Enter 应导航至对应节点详情');
  assert.ok(renderAt(window.location.hash).textContent.includes('注意力与 Transformer'), '键盘打开的详情页应显示节点标题');
});

test('REV001（DOM）：主方向页渲染广域图相关支线预览与进入完整图入口', () => {
  const view = renderAt('#/route/cross-harness-collab?section=topic');
  const text = view.textContent;
  assert.ok(text.includes('广域脉络中的相关支线'), '主方向页缺支线预览块');
  assert.ok(text.includes('多智能体协作'), '预览应含相关节点');
  assert.ok(collectLinks(view).includes('#/map'), '预览缺进入完整图入口');
  // 第二条方向也有自己的支线（代码智能体）。
  const view2 = renderAt('#/route/code-agent-verification?section=topic');
  assert.ok(view2.textContent.includes('代码智能体与软件工程应用'), 'code 方向预览应含 E5 节点');
});

test('PLAN-012（DOM）：图下层级索引的节点入口也进入对应详情页', () => {
  const view = renderAt('#/map');
  const land = LIBRARY.landscape;
  const buttons = collectByClass(view, 'lib-land-item');
  const target = land.nodes.find((n) => n.id === 'land-e2');
  buttons[land.nodes.indexOf(target)].listeners.click[0]();
  assert.ok(window.location.hash.includes(`node=${target.id}`), '节点索引点击应导航到详情页');
  assert.ok(renderAt(window.location.hash).textContent.includes('评测与成本'), '详情页应显示节点正文');
});

// ---------- PLAN-011 读者体验小幅优化（2026-09-24）：首页去重/单行化、课题页三级+折叠、图谱 guide 优先 ----------

test('READING-014（DOM）：首页主要信息按层级排布，不重复旧首页分区和说明', () => {
  const view = renderAt('#/home');
  const text = view.textContent;
  assert.equal(collectByClass(view, 'lib-zone').length, 0, '旧生产分区说明不再重复展示');
  assert.equal(collectByClass(view, 'lib-home-reader-card').length, 4, '主要栏目数量与职责清楚');
  assert.equal(collectByClass(view, 'lib-home-start').length, 1, '建议起点只有一个主要展示区');
  assert.ok(!text.includes('内容更新日期') && !text.includes('关于内容与来源'), '移除与阅读无关的全站说明');
  assert.ok(!text.includes('今日任务') && !text.includes('完成率'), '不制造打卡式进度');
  const hrefs = collectLinks(view);
  assert.ok(hrefs.includes('#/route/cross-harness-collab'), '推荐起点附近可回到完整路线');
});

test('PLAN-011（DOM）：课题页三级排布（导读→对照→辅助来源），旧介绍默认收起可展开', () => {
  const view = renderAt('#/route/cross-harness-collab?section=topic');
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

test('PLAN-011（DOM）：节点讲解在独立详情页完整呈现，地图概览不显示详情', () => {
  const view = renderAt('#/map');
  const land = LIBRARY.landscape;
  assert.equal(collectByClass(view, 'lib-land-detailbox').length, 0, '图页不呈现并列详情');
  const openNode = (id) => {
    const target = land.nodes.find((n) => n.id === id);
    return renderAt(`#/map?node=${target.id}`);
  };
  // 当前已补齐讲解的节点（land-a5）：详情页保持五段讲解。
  let detailView = openNode('land-a5');
  let detail = collectByClass(detailView, 'lib-land-lesson')[0];
  assert.ok(detail && detail.textContent.includes('猜下一个词'), 'guide 机制段应直接可读');
  assert.equal(collectByClass(detail, 'lib-land-lesson-section').length, 5, '详情页按现有结构呈现五段讲解');
  assert.equal(collectByClass(detail, 'lib-land-source-brief').length, 1, '详情页保留简短来源行');
  // 详情正文沿用现有版本；其它节点也通过独立路由进入。
  detailView = openNode('land-a1');
  detail = collectByClass(detailView, 'lib-land-lesson')[0];
  assert.ok(detail && detail.textContent.includes('符号与搜索'), '节点详情页路由有效');
  assert.ok(collectByClass(detail, 'lib-land-lesson-section').length >= 4, '节点讲解内容保持显示');
  // 学术边在详情中显示来源文献名。
  assert.ok(detail.textContent.includes('Neural-Symbolic Learning and Reasoning'), '学术边来源应为文献名');
  // 编辑边显示「建议的阅读顺序（编辑安排）」。
  detailView = openNode('land-f1');
  detail = collectByClass(detailView, 'lib-land-lesson')[0];
  assert.ok(detail.textContent.includes('推荐阅读顺序'), '详情页应保留推荐阅读关系');
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
