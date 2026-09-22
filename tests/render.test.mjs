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
    for (const field of ['title', 'purpose', 'howToUse', 'entryLabel']) {
      assert.ok(text.includes(zone[field]), `首页区 ${zone.key} 缺 ${field}`);
    }
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

test('REWORK-007 首页（DOM）：本人"在读"直达行出现在论文区（在上方 v3 保存之后仍持久）', () => {
  const text = renderAt('#/home').textContent;
  assert.ok(text.includes('我在读（本人标记）'), '有在读标记时首页论文区应给直达入口');
  assert.ok(text.includes('Astute RAG'), '直达应指向标记为在读的论文');
  assert.ok(text.includes('建议从这里开始'), '编辑建议行保留（008.2 材料首读）');
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
