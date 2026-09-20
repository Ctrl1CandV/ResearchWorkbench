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

// ---------- 4) 首页实际渲染 ----------

test('首页（DOM）：四区用途/用法/入口、首读与首次使用全部实际渲染，无假进度措辞', () => {
  const view = renderAt('#/home');
  const text = view.textContent;
  for (const zone of LIBRARY.home.zones) {
    for (const field of ['title', 'purpose', 'howToUse', 'entryLabel']) {
      assert.ok(text.includes(zone[field]), `首页区 ${zone.key} 缺 ${field}`);
    }
  }
  for (const step of LIBRARY.home.firstUse) {
    assert.ok(text.includes(step.title) && text.includes(step.text), `首次使用缺：${step.title}`);
  }
  const start = LIBRARY.papers.find((p) => p.id === LIBRARY.home.startHerePaperId);
  assert.ok(text.includes(start.displayTitle || start.title), '首读推荐未渲染');
  assert.ok(text.includes('建议先读'), '缺“建议先读”标识');
  assert.ok(!text.includes('继续阅读'), '不得出现“继续阅读”等假进度措辞');
});

// ---------- 5) 路线阶段提示（回流项 3 的 DOM 断言） ----------

test('回流项3（DOM）：路线页阶段提示按实际分组顺序生成', () => {
  const view = renderAt('#/route/code-agent-verification');
  const text = view.textContent;
  assert.ok(
    text.includes('本路线阶段顺序：建立问题 → 看评价与反例 → 理解方法 → 核查近期竞争'),
    `阶段提示与实际分组顺序不一致：${text.slice(0, 200)}`,
  );
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
  const forbidden = storageCalls.filter(([, key]) => key !== 'research-workbench:v3');
  assert.deepEqual(forbidden, [], '不得触碰 v3 以外的任何存储键');
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

test('简报页（DOM）：历史工作日索引按期列出、标明本期、缺日如实说明', () => {
  const view = renderAt('#/brief');
  const text = view.textContent;
  assert.ok(text.includes('历史工作日'), '缺历史工作日索引');
  assert.ok(text.includes('2026-09-18（本期）'), '最新一期应标为本期');
  assert.ok(text.includes('不是自动抓取'), '须说明每日产出靠手动工作流');
  const hrefs = [];
  walk(view, (n) => {
    if (n.tagName === 'A' && n.attributes.href) hrefs.push(n.attributes.href);
  });
  assert.ok(hrefs.includes('#/brief/brief-2026-09-15'), '往期日期应链接到对应期');
  assert.ok(hrefs.includes('#/brief/brief-2026-09-16'), '09-16 补记期应在索引');
  assert.ok(hrefs.includes('#/brief/brief-2026-09-17'), '09-17 补记期应在索引');
  // 直达往期：该期标为本期，索引仍在
  const past = renderAt('#/brief/brief-2026-09-15');
  const pastText = past.textContent;
  assert.ok(pastText.includes('2026-09-15 精选'), '往期内容应渲染');
  assert.ok(pastText.includes('2026-09-15（本期）'), '直达往期时该期应标为本期');
  assert.ok(pastText.includes('历史工作日'), '往期页也应有索引');
  // 补记期：如实标明回溯口径
  const backfill = renderAt('#/brief/brief-2026-09-16');
  assert.ok(backfill.textContent.includes('回溯补记'), '补记期应写明回溯口径');
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
