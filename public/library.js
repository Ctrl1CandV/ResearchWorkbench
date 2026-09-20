// public/library.js —— 个人研究平台渲染与路由（契约见 docs/SPEC.md、docs/DESIGN.md；
// 演进记录见 docs/HISTORY.md）。
// 约束：
// - 动态文本一律 textContent / createTextNode，禁止 innerHTML 等注入面；
// - 外部链接必须经 safeExternalHref（仅 https），否则降级为纯文本提示，不产生可点链接；
// - 站内导航只用 hash（#/...），可直达 home/route/paper/learn/brief/foundations；页内目录用按钮 +
//   scrollIntoView，从不改写 location.hash，避免与 hash 路由冲突；
// - 本人记录只经 notes.js 读写独立键 research-workbench:v3，绝不读写 v1/v2 旧版记录；
// - “近期登记发现”仅在用户点击主题时请求同源 /api/discover；动态条目不进入内容库、不写入任何记录；
// - 内容静态来自 library-content.js；集合为空时显示明确空态；
// - 阅读卡按 deliveredDepth 决定结构（deep/standard/quick/entry），recommendedDepth 只表达建议投入；
//   摘要级不等于精读，入口条目不冒充阅读卡；打开论文或外链不改变任何本人状态。

import { LIBRARY } from './library-content.js';
import {
  V3_STATUS,
  V3_STATUS_LABELS,
  addReadingItem,
  exportMarkdown,
  getPaperRecord,
  loadV3,
  paperRecordDirty,
  removeReadingItem,
  saveV3WithLock,
  setPaperNote,
  setPaperStatus,
} from './notes.js';

// ---------- 标签与固定文案 ----------

export const DEPTH_LABELS = Object.freeze({
  deep: '正文精读',
  standard: '正文选读',
  quick: '摘要级判断',
  entry: '原文入口 · 未获取摘要，不是阅读卡',
});

// 兼容旧导出名：深度标签以 deliveredDepth 为唯一权威。
export const CARD_KIND_LABELS = DEPTH_LABELS;

export const RECOMMENDED_LABELS = Object.freeze({
  deep: '建议投入：精读',
  standard: '建议投入：重点理解',
  quick: '建议投入：快速判断',
});

export const IMPORTANCE_LABELS = Object.freeze({
  core: '核心文献',
  relevant: '相关文献',
  peripheral: '外围文献',
  unknown: '待判',
});

export const DIFFICULTY_LABELS = Object.freeze({
  accessible: '易读',
  needs_background: '需要背景',
  challenging: '有挑战',
  unknown: '待判',
});

export const TYPE_LABELS = Object.freeze({
  method: '方法',
  survey: '综述',
  theory: '理论',
  system: '系统',
  evaluation: '实证研究',
  other: '其他',
});

export const ROLE_LABELS = Object.freeze({
  foundation: '基础作',
  baseline: '基线/对照',
  frontier: '近期竞争',
  counterexample: '反例与边界',
  background: '背景',
});

export const COVERAGE_MODE_LABELS = Object.freeze({
  'partial-text': '正文选读',
  'full-text': '正文',
  abstract: '摘要级',
  metadata: '元数据',
});

export const CALLOUT_LABELS = Object.freeze({
  author: '作者发现',
  editor: '整理者的分析',
  pending: '待验证',
  note: '说明',
});

export const CHECK_LEVEL_LABELS = Object.freeze({
  section: '已核到章节',
  chapter: '已核到章目',
  page: '已核页面',
  site: '已核站点分区',
  directory: '已核课程目录',
});

export const ACCESS_LABELS = Object.freeze({
  open: '公开可读',
  login: '需登录',
  paid: '需付费',
  unknown: '访问条件未确认',
});

export const EMPTY_NOTICES = Object.freeze({
  directions: '方向阅读路线尚未接入：来源核查完成后，每个方向将提供有序阅读路线；当前不提供占位论文。',
  papers: '论文阅读卡尚未接入：通过来源核查并按阅读模板整理后才会显示；本页不编造论文。',
  technicalRoutes: '技术学习路线尚未接入：教程需真实可靠来源，并标明先后顺序、核查层次与掌握标准。',
  briefs: '精选简报尚未发布：第一期简报将注明整理日期、来源与覆盖范围，不会用占位内容充数。',
  routeEmpty: '该方向的阅读路线尚未接入；来源核查完成前不提供论文条目，不编造文献。',
  learnCore: '必学主干尚未接入：需先核验每条的章节与访问条件，未核验的不混入可开始资源。',
});

const NAV_ACTIVE_BY_VIEW = Object.freeze({
  home: 'home',
  directions: 'directions',
  route: 'directions',
  papers: 'papers',
  paper: 'papers',
  learn: 'learn',
  learnRoute: 'learn',
  brief: 'brief',
  briefItem: 'brief',
  foundations: 'foundations',
});

const STEP_LABELS = Object.freeze({
  purpose: '为什么读',
  readWhen: '什么时候读',
  check: '读到什么程度',
});

// 阶段标签：合法的 stage 取值；显示顺序由路线实际排列决定（见 routeStages）。
export const STAGE_ORDER = Object.freeze(['建立问题', '理解方法', '看评价与反例', '核查近期竞争']);

// 论文章节标题唯一来源：目录与正文必须用同一份描述，避免两处文案漂移。
export const PAPER_SECTION_TITLES = Object.freeze({
  deep: Object.freeze({
    overview: '这篇解决什么',
    prereq: '读之前需要知道',
    deepRead: '值得细读的段落',
    references: '相关文献',
    openQuestions: '局限与待核问题',
    questions: '读完后自查',
    next: '下一篇',
  }),
  standard: Object.freeze({
    reasons: '为什么读这篇',
    deepRead: '值得细读的段落',
    questions: '读完后自查',
    next: '下一篇',
  }),
  quick: Object.freeze({
    reasons: '为什么留意这篇',
    questions: '取全文时先核对',
    next: '下一篇',
  }),
  entry: Object.freeze({
    reasons: '它在路线里的角色',
    next: '下一步',
  }),
});

// 取某深度下的章节标题；缺失时退回 standard 用词，不返回 undefined。
export function sectionTitle(depth, key) {
  const byDepth = PAPER_SECTION_TITLES[depth] ?? PAPER_SECTION_TITLES.standard;
  return byDepth[key] ?? PAPER_SECTION_TITLES.standard[key] ?? key;
}

const BLOCK_KINDS = Object.freeze(['paragraph', 'list', 'comparison', 'callout', 'formula']);
const SPAN_KINDS = Object.freeze(['text', 'strong', 'em', 'code', 'link']);

// ---------- 纯函数（node:test 覆盖） ----------

// 外链白名单：仅 https 且带主机名；其余（http/javascript/data/协议相对等）一律 null。
export function safeExternalHref(url) {
  if (typeof url !== 'string') return null;
  if (!/^https:\/\/[^/?#]+/i.test(url)) return null;
  return url;
}

// deliveredDepth 是唯一权威；旧数据只有 reading 时按只读映射派生（standard/quick/entry）。
export function deliveredDepthOf(paper) {
  if (!paper) return null;
  if (typeof paper.deliveredDepth === 'string') return paper.deliveredDepth;
  if (paper.reading === 'standard') return 'standard';
  if (paper.reading === 'quick') return 'quick';
  if (paper.reading === 'entry') return 'entry';
  return null;
}

// 建议投入：缺省时退回实际交付，不凭空拔高。
export function recommendedDepthOf(paper) {
  if (!paper) return null;
  if (typeof paper.recommendedDepth === 'string') return paper.recommendedDepth;
  return deliveredDepthOf(paper);
}

// hash 路由：'' / '#' / '#/' → 首页；'#/home'、'#/directions'、'#/papers'、'#/learn'、'#/brief'、
// '#/foundations' 列表页；'#/route/<id>'、'#/paper/<id>'、'#/learn/<id>'、'#/brief/<id>' 直达；其他一律 null。
export function parseHash(raw) {
  if (raw === undefined || raw === null) return { view: 'home', id: null };
  const s = String(raw);
  if (s === '' || s === '#' || s === '#/') return { view: 'home', id: null };
  if (!s.startsWith('#/')) return null;
  const parts = s
    .slice(2)
    .split('/')
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return null;
      }
    });
  if (parts.some((p) => p === null || p === '' || p === '.' || p === '..')) return null;
  const [view, id] = parts;
  const listViews = ['home', 'directions', 'papers', 'learn', 'brief', 'foundations'];
  if (parts.length === 1 && listViews.includes(view)) {
    return { view, id: null };
  }
  if (parts.length === 2 && (view === 'route' || view === 'paper' || view === 'learn' || view === 'brief')) {
    const mapped = view === 'learn' ? 'learnRoute' : view === 'brief' ? 'briefItem' : view;
    return { view: mapped, id };
  }
  return null;
}

// 与 parseHash 互逆：id 一律 encodeURIComponent，避免 '/', '?', '#' 破坏路由。
export function buildHash(view, id = null) {
  if (id === null || id === undefined) return `#/${view}`;
  return `#/${view}/${encodeURIComponent(String(id))}`;
}

export function getDirection(lib, id) {
  return lib.directions.find((d) => d.id === id) ?? null;
}

export function getPaper(lib, id) {
  return lib.papers.find((p) => p.id === id) ?? null;
}

export function getTechnicalRoute(lib, id) {
  return lib.technicalRoutes.find((t) => t.id === id) ?? null;
}

export function getBrief(lib, id) {
  return lib.briefs.find((b) => b.id === id) ?? null;
}

// 方向按 order 升序（缺省排最后，再按 id 稳定排序）；返回副本，不改原数组。
export function sortDirections(lib) {
  return [...lib.directions].sort((a, b) => {
    const oa = typeof a.order === 'number' ? a.order : Number.POSITIVE_INFINITY;
    const ob = typeof b.order === 'number' ? b.order : Number.POSITIVE_INFINITY;
    return oa - ob || String(a.id).localeCompare(String(b.id));
  });
}

// 路线步骤与论文合并：paper 可能为 null（validateLibrary 会报错，渲染层显式提示）。
export function routeEntries(lib, directionId) {
  const direction = getDirection(lib, directionId);
  if (!direction || !Array.isArray(direction.route)) return [];
  return direction.route.map((step, i) => ({
    index: i + 1,
    paperId: step.paperId,
    purpose: step.purpose,
    readWhen: step.readWhen,
    check: step.check,
    stage: step.stage ?? null,
    required: step.required ?? null,
    paper: getPaper(lib, step.paperId),
  }));
}

// 按阶段分组：保持原顺序，未标阶段的步骤归入“其他”。
export function routeStages(lib, directionId) {
  const groups = [];
  for (const entry of routeEntries(lib, directionId)) {
    const key = entry.stage ?? '其他';
    let group = groups.find((g) => g.stage === key);
    if (!group) {
      group = { stage: key, entries: [] };
      groups.push(group);
    }
    group.entries.push(entry);
  }
  return groups;
}

// 方向内 paperId 的下一步；paperId 不在路线中或已是末篇返回 null。
export function nextStepAfter(lib, directionId, paperId) {
  const entries = routeEntries(lib, directionId);
  const i = entries.findIndex((e) => e.paperId === paperId);
  if (i === -1 || i + 1 >= entries.length) return null;
  return entries[i + 1];
}

// 一篇论文在哪些方向路线中出现（含序位与上一篇/下一篇），用于论文页侧栏。
export function routesContaining(lib, paperId) {
  return sortDirections(lib).flatMap((direction) => {
    const entries = routeEntries(lib, direction.id);
    const i = entries.findIndex((e) => e.paperId === paperId);
    if (i === -1) return [];
    return [
      {
        direction,
        index: i + 1,
        total: entries.length,
        prev: entries[i - 1] ?? null,
        next: entries[i + 1] ?? null,
      },
    ];
  });
}

// 简报条目目标：paperId → 站内论文；source → https 外链；缺失/不安全返回显式降级类型。
export function briefItemTarget(lib, item) {
  if (item?.paperId != null) {
    return getPaper(lib, item.paperId)
      ? { kind: 'paper', paperId: item.paperId }
      : { kind: 'missing-paper', paperId: item.paperId };
  }
  if (item?.source != null) {
    const href = safeExternalHref(item.source);
    return href ? { kind: 'external', href } : { kind: 'unsafe-source', source: item.source };
  }
  return null;
}

export function paperBadges(paper) {
  const badges = [];
  const depth = deliveredDepthOf(paper);
  if (depth) badges.push({ text: DEPTH_LABELS[depth] ?? depth, kind: depth });
  if (paper.importance && paper.importance !== 'unknown') {
    badges.push({ text: IMPORTANCE_LABELS[paper.importance] ?? paper.importance, kind: 'plain' });
  }
  if (paper.difficulty && paper.difficulty !== 'unknown') {
    badges.push({ text: DIFFICULTY_LABELS[paper.difficulty] ?? paper.difficulty, kind: 'plain' });
  }
  if (paper.type) badges.push({ text: TYPE_LABELS[paper.type] ?? paper.type, kind: 'plain' });
  if (paper.role) badges.push({ text: ROLE_LABELS[paper.role] ?? paper.role, kind: 'plain' });
  return badges;
}

// 论文原文入口：仅 https；host 用于可见文案，解析失败回退为完整 url。
export function paperSourceLink(paper) {
  const href = safeExternalHref(paper?.url);
  if (!href) return null;
  let host = href;
  try {
    host = new URL(href).host;
  } catch {
    // 保留完整 url 作为可见文案
  }
  return { href, host };
}

// 章节锚点用 paperId + sectionId：中文标题变动不破坏锚点。
export function sectionAnchorId(paperId, sectionId) {
  return `lib-sec-${paperId}-${sectionId}`;
}

// 论文页目录：只包含真正会渲染的区块，与渲染层写入的 id 一一对应。
export function paperOutline(paper) {
  const items = [];
  const depth = deliveredDepthOf(paper);
  if (depth === 'deep') {
    if (Array.isArray(paper.overview) && paper.overview.length > 0) items.push({ id: 'lib-sec-overview', label: sectionTitle(depth, 'overview') });
    if (Array.isArray(paper.prereq) && paper.prereq.length > 0) items.push({ id: 'lib-sec-prereq', label: sectionTitle(depth, 'prereq') });
  } else if (Array.isArray(paper?.reasons) && paper.reasons.length > 0) {
    items.push({ id: 'lib-sec-reasons', label: sectionTitle(depth, 'reasons') });
  }
  if (Array.isArray(paper?.sections)) {
    paper.sections.forEach((section) => {
      if (section?.heading && section?.id) {
        items.push({ id: sectionAnchorId(paper.id, section.id), label: section.heading });
      }
    });
  }
  if (Array.isArray(paper?.deepRead) && paper.deepRead.length > 0) {
    items.push({ id: 'lib-sec-deep', label: sectionTitle(depth, 'deepRead') });
  }
  if (depth === 'deep') {
    if (Array.isArray(paper?.references) && paper.references.length > 0) items.push({ id: 'lib-sec-refs', label: sectionTitle(depth, 'references') });
    if (Array.isArray(paper?.openQuestions) && paper.openQuestions.length > 0) items.push({ id: 'lib-sec-open', label: sectionTitle(depth, 'openQuestions') });
  }
  if (Array.isArray(paper?.questions) && paper.questions.length > 0) items.push({ id: 'lib-sec-questions', label: sectionTitle(depth, 'questions') });
  if (paper?.next?.note) items.push({ id: 'lib-sec-next', label: sectionTitle(depth, 'next') });
  return items;
}

// 来源与覆盖信息行：[标签, 文本]；原文链接由渲染层单独处理，不藏进折叠。
export function coverageRows(paper) {
  const c = paper.coverage ?? {};
  const rows = [];
  if (c.mode) rows.push(['依据', COVERAGE_MODE_LABELS[c.mode] ?? c.mode]);
  if (c.basis) rows.push(['来源', c.basis]);
  if (c.version) rows.push(['版本', c.version]);
  if (Array.isArray(c.sections) && c.sections.length > 0) rows.push(['实际覆盖', c.sections.join('；')]);
  if (c.limitations) rows.push(['未覆盖', c.limitations]);
  if (c.checkedAt) rows.push(['核查时间', c.checkedAt]);
  return rows;
}

// 各集合数量与空态；空集合必须走 EMPTY_NOTICES 的明确文案。
export function libraryStatus(lib) {
  const counts = {
    directions: lib.directions.length,
    papers: lib.papers.length,
    technicalRoutes: lib.technicalRoutes.length,
    briefs: lib.briefs.length,
  };
  return {
    ...counts,
    allEmpty: Object.values(counts).every((n) => n === 0),
  };
}

// 技术学习：必学主干与按需支线分开；不要求先选论文方向。
export function coreTechnicalRoutes(lib) {
  return [...lib.technicalRoutes].filter((r) => (r.kind ?? 'core') === 'core');
}

export function advancedTechnicalRoutes(lib) {
  return [...lib.technicalRoutes].filter((r) => r.kind === 'advanced');
}

export function findResource(route, resourceId) {
  return (route?.resources ?? []).find((r) => r.id === resourceId) ?? null;
}

// 经典书目：collection='foundations' 的论文按 foundations.groups 分组（保持组内 foundation.order 升序）。
export function foundationGroups(lib) {
  const groups = lib.foundations?.groups ?? [];
  return groups.map((group) => ({
    ...group,
    papers: lib.papers
      .filter((p) => p.collection === 'foundations' && p.foundation?.group === group.key)
      .sort((a, b) => (a.foundation?.order ?? 0) - (b.foundation?.order ?? 0)),
  }));
}

export function foundationPapers(lib) {
  return lib.papers.filter((p) => p.collection === 'foundations');
}

// 单元资源：主资源最多一个，其余最多取一个补充；全部必须已在路线 resources 中登记。
export function unitResources(route, unit) {
  const ids = Array.isArray(unit?.resourceIds) ? unit.resourceIds : [];
  const resolved = ids.map((id) => findResource(route, id)).filter(Boolean);
  const primary = resolved.filter((r) => r.primary === true).slice(0, 1);
  const supplement = resolved.filter((r) => r !== primary[0]).slice(0, 1);
  return { primary: primary[0] ?? null, supplement: supplement[0] ?? null };
}

// 可开始门槛：至少有一个单元具备主资源，且主资源核查时间与访问条件已知。
export function routeStartable(lib, route) {
  if ((route.kind ?? 'core') !== 'core') return false;
  return (route.units ?? []).some((unit) => {
    const { primary } = unitResources(route, unit);
    return Boolean(primary && primary.checkedAt && primary.access && primary.access !== 'unknown');
  });
}

// 内容契约校验：跨引用可解析；深度与依据一致；block 白名单；外链仅 https。
export function validateLibrary(lib) {
  if (!lib || typeof lib !== 'object') return { ok: false, errors: ['LIBRARY 必须是对象'] };
  const errors = [];
  const push = (message) => errors.push(message);
  const isStr = (v) => typeof v === 'string' && v.trim() !== '';
  const isArr = (v) => Array.isArray(v);

  for (const key of ['directions', 'papers', 'technicalRoutes', 'briefs']) {
    if (!isArr(lib[key])) push(`顶层 ${key} 必须是数组`);
  }
  if (errors.length > 0) return { ok: false, errors };

  const DEPTHS = ['deep', 'standard', 'quick', 'entry'];
  const ROLES = ['foundation', 'baseline', 'frontier', 'counterexample', 'background'];

  function validateBlocks(at, blocks) {
    if (!isArr(blocks)) {
      push(`${at} 必须是数组`);
      return;
    }
    blocks.forEach((block, i) => {
      const bat = `${at}[${i}]`;
      if (!block || typeof block !== 'object' || !BLOCK_KINDS.includes(block.kind)) {
        push(`${bat} kind 必须是 ${BLOCK_KINDS.join('|')}`);
        return;
      }
      if (block.kind === 'paragraph') {
        if (!isArr(block.spans) || block.spans.length === 0) push(`${bat} paragraph 需要非空 spans`);
        else {
          block.spans.forEach((span, j) => {
            if (!span || typeof span !== 'object' || !SPAN_KINDS.includes(span.kind)) {
              push(`${bat} spans[${j}] kind 必须是 ${SPAN_KINDS.join('|')}`);
              return;
            }
            if (span.kind === 'link') {
              if (!safeExternalHref(span.href)) push(`${bat} spans[${j}].href 必须是 https：${span.href}`);
              if (!isStr(span.text)) push(`${bat} spans[${j}].link 缺少 text`);
            } else if (!isStr(span.text)) {
              push(`${bat} spans[${j}] 缺少 text`);
            }
          });
        }
      }
      if (block.kind === 'list') {
        if (!isArr(block.items) || block.items.length === 0) push(`${bat} list 需要非空 items`);
        else if (!block.items.every((item) => isArr(item) && item.length > 0)) push(`${bat} list.items 每项必须是 span 数组`);
      }
      if (block.kind === 'comparison') {
        if (!isArr(block.columns) || block.columns.length === 0) push(`${bat} comparison 需要 columns`);
        if (!isArr(block.rows) || block.rows.length === 0) push(`${bat} comparison 需要 rows`);
        else if (!block.rows.every((row) => isArr(row) && row.length === (block.columns?.length ?? 0))) {
          push(`${bat} comparison.rows 每行长度必须与 columns 一致`);
        }
      }
      if (block.kind === 'callout') {
        if (!['author', 'editor', 'pending', 'note'].includes(block.tone)) push(`${bat} callout.tone 非法：${block.tone}`);
        if (!isStr(block.title)) push(`${bat} callout 缺少 title（不能只靠颜色区分）`);
        validateBlocks(`${bat}.blocks`, block.blocks ?? []);
      }
      if (block.kind === 'formula') {
        if (!isStr(block.text)) push(`${bat} formula 缺少 text`);
        if (!isArr(block.symbols) || block.symbols.length === 0) push(`${bat} formula 需要符号解释 symbols`);
        else if (!block.symbols.every((s) => isStr(s?.symbol) && isStr(s?.meaning))) push(`${bat} formula.symbols 需要 symbol 与 meaning`);
      }
    });
  }

  // ---------- home（可选） ----------
  if (lib.home != null) {
    if (typeof lib.home !== 'object') push('home 必须是对象');
    else {
      for (const field of ['title', 'intro', 'updatedOn']) if (!isStr(lib.home[field])) push(`home 缺少 ${field}`);
      if (isArr(lib.home.zones)) {
        for (const zone of lib.home.zones) {
          const zkey = zone?.key ?? '?';
          for (const field of ['title', 'purpose', 'howToUse', 'entryLabel', 'entryHash']) {
            if (!isStr(zone?.[field])) push(`home.zones 条目缺少 ${field}：${zkey}`);
          }
        }
      } else {
        push('home.zones 必须是数组');
      }
      if (lib.home.firstUse != null) {
        if (!isArr(lib.home.firstUse)) push('home.firstUse 必须是数组');
        else {
          lib.home.firstUse.forEach((step, j) => {
            if (!isStr(step?.title)) push(`home.firstUse[${j}] 缺少 title`);
            if (!isStr(step?.text)) push(`home.firstUse[${j}] 缺少 text`);
          });
        }
      }
    }
  }

  // ---------- meta.ccfNote（可选；CCF 目录事实，不是投稿推荐） ----------
  if (lib.meta?.ccfNote != null) {
    const note = lib.meta.ccfNote;
    if (typeof note !== 'object' || !isStr(note.text)) push('meta.ccfNote 缺少 text');
    else if (!/目录事实/.test(note.text) || !/不是投稿推荐/.test(note.text)) {
      push('meta.ccfNote.text 必须保留“目录事实/不是投稿推荐”的边界表述');
    }
    if (isArr(note?.sources)) {
      for (const source of note.sources) {
        if (!isStr(source?.label) || !safeExternalHref(source?.url)) {
          push(`meta.ccfNote.sources 条目需要 label 与 https url：${source?.label ?? '?'}`);
        }
      }
    }
  }

  // ---------- foundations（可选；与 papers.collection 联动） ----------
  const foundationGroupKeys = new Set();
  if (lib.foundations != null) {
    if (typeof lib.foundations !== 'object') push('foundations 必须是对象');
    else {
      if (!isStr(lib.foundations.intro)) push('foundations 缺少 intro');
      if (!isArr(lib.foundations.groups) || lib.foundations.groups.length === 0) {
        push('foundations.groups 必须是非空数组');
      } else {
        for (const group of lib.foundations.groups) {
          if (!isStr(group?.key) || !isStr(group?.title)) push(`foundations.groups 条目缺少 key/title：${group?.key ?? '?'}`);
          else if (foundationGroupKeys.has(group.key)) push(`foundations.groups key 重复：${group.key}`);
          else foundationGroupKeys.add(group.key);
        }
      }
    }
  }

  // ---------- papers ----------
  const paperIds = new Set();
  lib.papers.forEach((paper, i) => {
    const at = `papers[${i}]`;
    if (!isStr(paper.id)) push(`${at} 缺少 id`);
    else if (paperIds.has(paper.id)) push(`${at} id 重复：${paper.id}`);
    else paperIds.add(paper.id);
    for (const field of ['title', 'url', 'type', 'importance', 'difficulty', 'lead']) {
      if (!isStr(paper[field])) push(`${at} 缺少 ${field}`);
    }
    if (paper.url != null && !safeExternalHref(paper.url)) push(`${at} url 必须是 https：${paper.url}`);

    const depth = deliveredDepthOf(paper);
    if (!DEPTHS.includes(depth)) push(`${at} deliveredDepth 必须是 ${DEPTHS.join('|')}：${paper.deliveredDepth ?? paper.reading}`);
    if (paper.recommendedDepth != null && !['deep', 'standard', 'quick'].includes(paper.recommendedDepth)) {
      push(`${at} recommendedDepth 必须是 deep|standard|quick：${paper.recommendedDepth}`);
    }
    if (paper.displayTitle != null && !isStr(paper.displayTitle)) push(`${at} displayTitle 必须是字符串`);
    if (!ROLES.includes(paper.role)) push(`${at} role 必须是 ${ROLES.join('|')}：${paper.role}`);
    if (!isStr(paper.roleReason)) push(`${at} 缺少 roleReason`);
    if (paper.collection != null) {
      if (paper.collection !== 'foundations') push(`${at} collection 目前只支持 foundations：${paper.collection}`);
      else {
        if (!paper.foundation || typeof paper.foundation !== 'object') push(`${at} collection=foundations 需要 foundation 字段`);
        else if (!foundationGroupKeys.has(paper.foundation.group)) {
          push(`${at} foundation.group 未在 foundations.groups 登记：${paper.foundation.group}`);
        }
      }
    }

    if (!isArr(paper.reasons) || paper.reasons.length === 0 || !paper.reasons.every(isStr)) {
      push(`${at} reasons 必须是非空字符串数组`);
    }
    if (!isArr(paper.questions) || !paper.questions.every(isStr)) push(`${at} questions 必须是字符串数组`);
    if (!isArr(paper.deepRead) || !paper.deepRead.every(isStr)) push(`${at} deepRead 必须是字符串数组`);
    if (paper.openQuestions != null && (!isArr(paper.openQuestions) || !paper.openQuestions.every(isStr))) {
      push(`${at} openQuestions 必须是字符串数组`);
    }
    if (paper.references != null) {
      if (!isArr(paper.references)) push(`${at} references 必须是数组`);
      else {
        paper.references.forEach((ref, j) => {
          if (ref?.paperId != null && !isStr(ref.paperId)) push(`${at} references[${j}].paperId 必须是字符串`);
          if (!['citation', 'editorial'].includes(ref?.relation)) {
            push(`${at} references[${j}].relation 必须是 citation|editorial：${ref?.relation}`);
          }
          if (!isStr(ref?.reason)) push(`${at} references[${j}] 缺少 reason`);
          if (ref?.relation === 'citation' && !isStr(ref?.sourceLocator) && ref?.paperId == null) {
            push(`${at} references[${j}] 真实引用需要 sourceLocator 或 paperId`);
          }
        });
      }
    }

    const coverage = paper.coverage;
    if (!coverage || typeof coverage !== 'object') {
      push(`${at} 缺少 coverage`);
    } else {
      for (const field of ['mode', 'basis', 'version', 'limitations', 'checkedAt']) {
        if (!isStr(coverage[field])) push(`${at} coverage 缺少 ${field}`);
      }
      if (!isArr(coverage.sections) || !coverage.sections.every(isStr)) {
        push(`${at} coverage.sections 必须是字符串数组`);
      }
    }

    if (!isArr(paper.sections)) {
      push(`${at} sections 必须是数组`);
    } else {
      paper.sections.forEach((section, j) => {
        if (!isStr(section?.id)) push(`${at} sections[${j}] 缺少 id（用于锚点）`);
        if (!isStr(section?.heading)) push(`${at} sections[${j}] 缺少 heading`);
        validateBlocks(`${at} sections[${j}].blocks`, section?.blocks ?? []);
      });
      if (depth === 'deep') {
        if (paper.sections.length < 3) push(`${at} deep 卡至少需要 3 个正文章节，不能只扩写摘要`);
        if (!isArr(paper.overview) || paper.overview.length === 0) push(`${at} deep 卡缺少 overview（首屏概览）`);
        if (!isArr(paper.prereq) || paper.prereq.length === 0) push(`${at} deep 卡缺少 prereq（读前概念）`);
        if (!isArr(paper.deepRead) || paper.deepRead.length < 2) push(`${at} deep 卡至少 2 处细读定位`);
        if (!isArr(paper.references) || paper.references.length === 0) push(`${at} deep 卡至少 1 条相关文献`);
        validateBlocks(`${at}.overview`, paper.overview ?? []);
        validateBlocks(`${at}.prereq`, paper.prereq ?? []);
      }
      if (depth === 'standard' && paper.sections.length === 0) {
        push(`${at} standard 卡必须有正文章节；没有正文应标 quick`);
      }
      if ((depth === 'quick' || depth === 'entry') && paper.sections.length > 0) {
        push(`${at} ${depth} 不应有正文 sections；有正文依据应标 standard 或 deep`);
      }
      if (depth === 'entry' && (paper.deepRead.length > 0 || paper.questions.length > 0)) {
        push(`${at} entry 不提供细读与自查（没有内容依据）`);
      }
      const mode = coverage?.mode;
      if ((depth === 'deep' || depth === 'standard') && !['full-text', 'partial-text'].includes(mode)) {
        push(`${at} ${depth} 需要正文依据，coverage.mode 应为 full-text|partial-text：${mode}`);
      }
      if (depth === 'quick' && mode !== 'abstract') push(`${at} quick 的 coverage.mode 应为 abstract：${mode}`);
      if (depth === 'entry' && mode !== 'metadata') push(`${at} entry 的 coverage.mode 应为 metadata：${mode}`);
    }
    if (paper.next != null) {
      if (typeof paper.next !== 'object') push(`${at} next 必须是对象`);
      else {
        if (!isStr(paper.next.note)) push(`${at} next.note 必须是非空字符串`);
        if (paper.next.paperId != null && !isStr(paper.next.paperId)) push(`${at} next.paperId 必须是字符串`);
      }
    }
  });

  lib.papers.forEach((paper, i) => {
    if (paper.next?.paperId != null && !paperIds.has(paper.next.paperId)) {
      push(`papers[${i}] next.paperId 无法解析：${paper.next.paperId}`);
    }
    (paper.references ?? []).forEach((ref, j) => {
      if (ref.paperId != null && !paperIds.has(ref.paperId)) {
        push(`papers[${i}] references[${j}].paperId 无法解析：${ref.paperId}`);
      }
    });
  });

  // ---------- directions ----------
  const directionIds = new Set();
  lib.directions.forEach((direction, i) => {
    const at = `directions[${i}]`;
    if (!isStr(direction.id)) push(`${at} 缺少 id`);
    else if (directionIds.has(direction.id)) push(`${at} id 重复：${direction.id}`);
    else directionIds.add(direction.id);
    if (!isStr(direction.title)) push(`${at} 缺少 title`)
    if (direction.summary != null && !isStr(direction.summary)) push(`${at} summary 必须是字符串`);
    if (typeof direction.order !== 'number') push(`${at} order 必须是数字`);
    for (const field of ['overview', 'stateOfField', 'asOf', 'whyChoose', 'limits']) {
      if (!isStr(direction[field])) push(`${at} 缺少 ${field}（方向说明与现状必须完整）`);
    }
    if (direction.openQuestions != null && (!isArr(direction.openQuestions) || !direction.openQuestions.every(isStr))) {
      push(`${at} openQuestions 必须是字符串数组`);
    }
    if (direction.sources != null) {
      if (!isArr(direction.sources)) push(`${at} sources 必须是数组`);
      else {
        direction.sources.forEach((source, j) => {
          if (!isStr(source?.label)) push(`${at} sources[${j}] 缺少 label`);
          if (source?.url != null && !safeExternalHref(source.url)) push(`${at} sources[${j}].url 必须是 https：${source.url}`);
        });
      }
    }
    if (!isArr(direction.route)) {
      push(`${at} route 必须是数组`);
    } else {
      const seen = new Set();
      direction.route.forEach((step, j) => {
        if (!isStr(step?.paperId)) {
          push(`${at} route[${j}] 缺少 paperId`);
        } else {
          if (!paperIds.has(step.paperId)) push(`${at} route[${j}].paperId 无法解析：${step.paperId}`);
          if (seen.has(step.paperId)) push(`${at} route[${j}] paperId 在路线内重复：${step.paperId}`);
          seen.add(step.paperId);
        }
        for (const field of ['purpose', 'readWhen', 'check']) {
          if (!isStr(step?.[field])) push(`${at} route[${j}] 缺少 ${field}`);
        }
        if (step?.stage != null && !STAGE_ORDER.includes(step.stage)) push(`${at} route[${j}].stage 不在固定阶段内：${step.stage}`);
        if (step?.required != null && !['必读', '选读'].includes(step.required)) push(`${at} route[${j}].required 必须是 必读|选读`);
      });
    }
  });

  // ---------- technicalRoutes ----------
  const CHECK_LEVELS = ['section', 'chapter', 'page', 'site', 'directory'];
  const ACCESS = ['open', 'login', 'paid', 'unknown'];
  lib.technicalRoutes.forEach((route, i) => {
    const at = `technicalRoutes[${i}]`;
    if (!isStr(route.id)) push(`${at} 缺少 id`);
    if (!isStr(route.title)) push(`${at} 缺少 title`);
    if (!['core', 'advanced'].includes(route.kind ?? 'core')) push(`${at} kind 必须是 core|advanced：${route.kind}`);
    if (typeof route.order !== 'number') push(`${at} order 必须是数字`);
    for (const field of ['capability', 'prerequisites', 'applicability', 'summary']) {
      if (!isStr(route[field])) push(`${at} 缺少 ${field}`);
    }
    if (route.relatedPaperIds != null) {
      if (!isArr(route.relatedPaperIds)) push(`${at} relatedPaperIds 必须是数组`);
      else {
        route.relatedPaperIds.forEach((paperId) => {
          if (!paperIds.has(paperId)) push(`${at} relatedPaperIds 无法解析：${paperId}`);
        });
      }
    }
    const resourceIds = new Set();
    (route.resources ?? []).forEach((resource, j) => {
      const rat = `${at} resources[${j}]`;
      if (!isStr(resource?.id)) push(`${rat} 缺少 id`);
      else if (resourceIds.has(resource.id)) push(`${rat} id 重复：${resource.id}`);
      else resourceIds.add(resource.id);
      for (const field of ['title', 'url', 'language', 'format', 'checkedAt', 'versionNote']) {
        if (!isStr(resource?.[field])) push(`${rat} 缺少 ${field}`);
      }
      if (!safeExternalHref(resource?.url)) push(`${rat} url 必须是 https：${resource?.url}`);
      if (!CHECK_LEVELS.includes(resource?.checkLevel)) push(`${rat} checkLevel 必须是 ${CHECK_LEVELS.join('|')}：${resource?.checkLevel}`);
      if (!ACCESS.includes(resource?.access)) push(`${rat} access 必须是 ${ACCESS.join('|')}：${resource?.access}`);
      if (resource?.primary === true && resource.access === 'unknown') {
        push(`${rat} 主资源不能是访问条件未确认的条目`);
      }
    });
    const unitIds = new Set();
    (route.units ?? []).forEach((unit, j) => {
      const uat = `${at} units[${j}]`;
      if (!isStr(unit?.id)) push(`${uat} 缺少 id`);
      else if (unitIds.has(unit.id)) push(`${uat} id 重复：${unit.id}`);
      else unitIds.add(unit.id);
      for (const field of ['title', 'goal', 'selfCheck']) {
        if (!isStr(unit?.[field])) push(`${uat} 缺少 ${field}`);
      }
      if (!isArr(unit?.resourceIds) || unit.resourceIds.length === 0) {
        push(`${uat} resourceIds 必须是非空数组`);
      } else {
        unit.resourceIds.forEach((id) => {
          if (!resourceIds.has(id)) push(`${uat} resourceIds 无法解析：${id}`);
        });
        const primaryCount = unit.resourceIds
          .map((id) => (route.resources ?? []).find((r) => r.id === id))
          .filter((r) => r && r.primary === true).length;
        if (primaryCount > 1) push(`${uat} 主资源最多 1 个，当前 ${primaryCount} 个`);
      }
      if (unit.relatedPaperIds != null) {
        if (!isArr(unit.relatedPaperIds)) push(`${uat} relatedPaperIds 必须是数组`);
        else {
          unit.relatedPaperIds.forEach((paperId) => {
            if (!paperIds.has(paperId)) push(`${uat} relatedPaperIds 无法解析：${paperId}`);
          });
        }
      }
    });
    if ((route.kind ?? 'core') === 'core') {
      if (!isArr(route.units) || route.units.length === 0) push(`${at} 必学主干至少 1 个学习单元`);
      if (!routeStartable(lib, route)) push(`${at} 必学主干缺少可立即开始的单元（主资源需已核查且访问条件明确）`);
    }
  });

  // ---------- briefs ----------
  lib.briefs.forEach((brief, i) => {
    const at = `briefs[${i}]`;
    if (!isStr(brief.id)) push(`${at} 缺少 id`);
    if (!isStr(brief.date)) push(`${at} 缺少 date`);
    if (!isStr(brief.scope)) push(`${at} 缺少 scope`);
    if (!isArr(brief.items)) {
      push(`${at} items 必须是数组`);
    } else {
      brief.items.forEach((item, j) => {
        for (const field of ['reason', 'summary', 'published', 'tier']) {
          if (!isStr(item?.[field])) push(`${at} items[${j}] 缺少 ${field}`);
        }
        const hasPaper = item?.paperId != null;
        const hasSource = item?.source != null;
        if (hasPaper === hasSource) push(`${at} items[${j}] 必须且只能提供 paperId 或 source 之一`);
        if (hasPaper && !paperIds.has(item.paperId)) push(`${at} items[${j}].paperId 无法解析：${item.paperId}`);
        if (hasSource && !safeExternalHref(item.source)) push(`${at} items[${j}].source 必须是 https：${item.source}`);
      });
    }
  });

  if (lib.home?.startHerePaperId != null && !paperIds.has(lib.home.startHerePaperId)) {
    push(`home.startHerePaperId 无法解析：${lib.home.startHerePaperId}`);
  }

  return { ok: errors.length === 0, errors };
}

// ---------- 渲染（仅浏览器；node:test 只覆盖上面的纯函数） ----------

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function link(href, text, className) {
  const a = el('a', className, text);
  a.href = href;
  return a;
}

function externalLink(url, text) {
  const safe = safeExternalHref(url);
  if (!safe) return el('span', 'lib-unsafe-link', `${text}（链接未通过 https 校验，不提供可点链接）`);
  const a = link(safe, text);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}

function paperLink(paper, className) {
  return link(buildHash('paper', paper.id), paper.displayTitle || paper.title, className);
}

function emptyBox(message) {
  return el('p', 'lib-empty', message);
}

// ---------- 本人记录（v3）：只在浏览器环境启用；存储不可用/损坏都有明确文案 ----------

const v3Runtime = {
  kind: 'empty', // empty | ok | unavailable | corrupt
  state: null,
  storage: null,
};

function v3Init() {
  if (typeof window === 'undefined') return;
  try {
    v3Runtime.storage = window.localStorage;
  } catch {
    v3Runtime.kind = 'unavailable';
    return;
  }
  if (!v3Runtime.storage) {
    v3Runtime.kind = 'unavailable';
    return;
  }
  const loaded = loadV3(v3Runtime.storage);
  v3Runtime.kind = loaded.kind;
  v3Runtime.state = loaded.state;
}

function v3Available() {
  return (v3Runtime.kind === 'ok' || v3Runtime.kind === 'empty') && v3Runtime.state != null;
}

function v3StatusOf(paperId) {
  if (!v3Available()) return null;
  return getPaperRecord(v3Runtime.state, paperId);
}

// 保存并整体重渲染；失败时在页面顶部给出明确错误，不静默。
async function v3Persist(nextState) {
  const result = await saveV3WithLock(window.navigator, v3Runtime.storage, nextState);
  if (!result.ok) {
    const container = document.getElementById('lib-view');
    if (container) {
      const warn = el('p', 'lib-notice-flat', `保存失败：${result.reason}`);
      container.prepend(warn);
    }
    return false;
  }
  v3Runtime.kind = 'ok';
  v3Runtime.state = nextState;
  renderApp();
  return true;
}

function v3StorageNotice() {
  if (v3Runtime.kind === 'unavailable') {
    return el(
      'p',
      'lib-notice-flat',
      '本浏览器存储不可用，阅读状态、笔记与待读清单当前无法保存；页面其余功能不受影响。',
    );
  }
  if (v3Runtime.kind === 'corrupt') {
    return el(
      'p',
      'lib-notice-flat',
      '检测到本地记录数据损坏，已不加载（未做任何改动）。如需重新开始，可在浏览器站点数据中删除 research-workbench:v3 后刷新。',
    );
  }
  return null;
}

// 论文页“我的记录”面板：状态三选 + 一个问题 + 一条笔记；显式保存，脏状态可见。
function renderNotesPanel(paper) {
  const box = el('section', 'lib-notes');
  box.appendChild(el('h3', 'lib-block-title', '我的记录'));
  const notice = v3StorageNotice();
  if (notice) {
    box.appendChild(notice);
    return box;
  }
  const saved = v3StatusOf(paper.id) ?? { status: 'unread', question: '', note: '', updatedAt: null };
  const draft = { status: saved.status, question: saved.question ?? '', note: saved.note ?? '' };

  const statusLine = el('p', 'lib-notes-status');
  statusLine.appendChild(el('span', 'lib-step-label', '状态（本人标记）：'));
  const statusButtons = new Map();
  const savedLine = el('p', 'lib-notes-saved');
  const updateSavedLine = (dirty) => {
    savedLine.textContent = dirty
      ? '有未保存的修改。'
      : saved.updatedAt
        ? `已保存（${saved.updatedAt.slice(0, 16).replace('T', ' ')}）。状态与笔记只存在本浏览器，导出是唯一备份。`
        : '尚未保存过；点“保存记录”才会写入本浏览器。';
  };
  const refreshDirty = () => {
    updateSavedLine(paperRecordDirty(getPaperRecord(v3Runtime.state, paper.id), draft));
    for (const [value, button] of statusButtons) {
      button.classList.toggle('lib-notes-active', draft.status === value);
    }
  };
  for (const value of V3_STATUS) {
    const button = el('button', 'lib-notes-btn', V3_STATUS_LABELS[value]);
    button.type = 'button';
    button.addEventListener('click', () => {
      draft.status = value;
      refreshDirty();
    });
    statusButtons.set(value, button);
    statusLine.appendChild(button);
  }
  box.appendChild(statusLine);

  const makeField = (labelText, placeholder, key) => {
    const label = el('label', 'lib-notes-field');
    label.appendChild(el('span', 'lib-step-label', labelText));
    const area = el('textarea', 'lib-notes-area');
    area.rows = key === 'note' ? 3 : 2;
    area.placeholder = placeholder;
    area.value = draft[key];
    area.addEventListener('input', () => {
      draft[key] = area.value;
      refreshDirty();
    });
    label.appendChild(area);
    return label;
  };
  box.appendChild(makeField('我的问题', '读完这篇要回答的一个问题（可选）', 'question'));
  box.appendChild(makeField('我的笔记', '自己的话记一笔（可选）', 'note'));

  const actions = el('p', 'lib-actions');
  const saveButton = el('button', 'lib-btn lib-btn-primary', '保存记录');
  saveButton.type = 'button';
  saveButton.addEventListener('click', async () => {
    saveButton.disabled = true;
    let next = setPaperStatus(v3Runtime.state, paper.id, draft.status);
    next = setPaperNote(next, paper.id, { question: draft.question, note: draft.note });
    await v3Persist(next);
    saveButton.disabled = false;
  });
  actions.appendChild(saveButton);
  box.appendChild(actions);
  box.appendChild(savedLine);
  refreshDirty();
  return box;
}

// Markdown 导出：生成文件下载；只含本人记录。
function downloadMyNotes() {
  if (!v3Available()) return;
  const text = exportMarkdown(v3Runtime.state, LIBRARY);
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = el('a', null, '');
  a.href = url;
  a.download = `research-workbench-notes-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// 待读清单（本人添加、未核查）：添加表单 + 列表 + 删除。
function renderReadingList() {
  const box = el('section', 'lib-notes');
  box.appendChild(el('h3', 'lib-block-title', '我的待读清单'));
  box.appendChild(
    el('p', 'lib-notes-hint', '路线之外偶遇的论文（导师给的、追文献追到的）记在这里；条目为本人添加、未核查，不会进入公开内容库。'),
  );
  const notice = v3StorageNotice();
  if (notice) {
    box.appendChild(notice);
    return box;
  }
  const list = el('ul', 'lib-list');
  for (const item of v3Runtime.state.readingList) {
    const li = el('li', 'lib-reading-item');
    if (item.url) li.appendChild(externalLink(item.url, item.title));
    else li.appendChild(document.createTextNode(item.title));
    const meta = [item.note || null, item.addedAt ? `添加于 ${item.addedAt.slice(0, 10)}` : null].filter(Boolean).join('；');
    if (meta) li.appendChild(el('span', 'lib-res-meta', `（${meta}）`));
    const remove = el('button', 'lib-notes-btn', '移除');
    remove.type = 'button';
    remove.addEventListener('click', () => v3Persist(removeReadingItem(v3Runtime.state, item.id)));
    li.appendChild(remove);
    list.appendChild(li);
  }
  if (v3Runtime.state.readingList.length === 0) list.appendChild(el('li', 'lib-muted', '（暂无）'));
  box.appendChild(list);

  const form = el('div', 'lib-notes-form');
  const titleInput = el('input', 'lib-notes-input');
  titleInput.type = 'text';
  titleInput.placeholder = '标题（必填）';
  const urlInput = el('input', 'lib-notes-input');
  urlInput.type = 'text';
  urlInput.placeholder = '链接（https，可空）';
  const noteInput = el('input', 'lib-notes-input');
  noteInput.type = 'text';
  noteInput.placeholder = '一句备注（可空）';
  const errorLine = el('p', 'lib-notes-saved', '');
  const addButton = el('button', 'lib-btn', '加入待读');
  addButton.type = 'button';
  addButton.addEventListener('click', async () => {
    const result = addReadingItem(v3Runtime.state, {
      title: titleInput.value,
      url: urlInput.value,
      note: noteInput.value,
    });
    if (result.error) {
      errorLine.textContent = result.error;
      return;
    }
    addButton.disabled = true;
    await v3Persist(result.state);
  });
  form.appendChild(titleInput);
  form.appendChild(urlInput);
  form.appendChild(noteInput);
  form.appendChild(addButton);
  box.appendChild(form);
  box.appendChild(errorLine);
  return box;
}


function notFoundBox(kind, id) {
  const box = el('div', 'lib-empty');
  box.appendChild(el('p', null, `${kind}未找到：${id}。可能内容尚未接入，或地址有误。`));
  box.appendChild(link('#/home', '返回首页'));
  return box;
}

function crumb(parts) {
  const p = el('p', 'lib-crumb');
  parts.forEach((part, i) => {
    if (i > 0) p.appendChild(document.createTextNode(' / '));
    if (part.href) p.appendChild(link(part.href, part.text));
    else p.appendChild(document.createTextNode(part.text));
  });
  return p;
}

function badgeLine(paper) {
  const p = el('p', 'lib-badges');
  for (const badge of paperBadges(paper)) {
    p.appendChild(el('span', `lib-badge${['deep', 'standard'].includes(badge.kind) ? ' lib-badge-kind' : ''}`, badge.text));
  }
  return p;
}

// ---------- block 渲染：白名单 DOM，禁止 innerHTML ----------

function renderSpans(parent, spans) {
  for (const span of spans ?? []) {
    if (!span || typeof span !== 'object') continue;
    const text = typeof span.text === 'string' ? span.text : '';
    if (span.kind === 'strong') parent.appendChild(el('strong', null, text));
    else if (span.kind === 'em') parent.appendChild(el('em', null, text));
    else if (span.kind === 'code') parent.appendChild(el('code', 'lib-code', text));
    else if (span.kind === 'link') parent.appendChild(externalLink(span.href, text));
    else parent.appendChild(document.createTextNode(text));
  }
  return parent;
}

function renderList(block) {
  const list = el(block.ordered ? 'ol' : 'ul', 'lib-list');
  for (const item of block.items ?? []) {
    const li = el('li');
    renderSpans(li, item);
    list.appendChild(li);
  }
  return list;
}

function renderComparison(block) {
  const wrap = el('div', 'lib-table-wrap');
  const table = el('table', 'lib-table');
  if (block.caption) table.appendChild(el('caption', 'lib-table-caption', block.caption));
  const thead = el('thead');
  const headRow = el('tr');
  for (const column of block.columns ?? []) headRow.appendChild(el('th', null, column));
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = el('tbody');
  for (const row of block.rows ?? []) {
    const tr = el('tr');
    for (const cell of row) tr.appendChild(el('td', null, cell));
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  wrap.appendChild(el('p', 'lib-table-hint', '表格可横向滚动；表内数值未逐格核对，结论以正文叙述为准。'));
  return wrap;
}

function renderCallout(block) {
  const box = el('div', `lib-callout lib-callout-${block.tone ?? 'note'}`);
  box.appendChild(el('p', 'lib-callout-title', block.title ?? ''));
  renderBlocks(box, block.blocks ?? []);
  return box;
}

function renderFormula(block) {
  const box = el('div', 'lib-formula');
  box.appendChild(el('p', 'lib-formula-text', block.text ?? ''));
  const dl = el('dl', 'lib-formula-symbols');
  for (const symbol of block.symbols ?? []) {
    dl.appendChild(el('dt', null, symbol.symbol ?? ''));
    dl.appendChild(el('dd', null, symbol.meaning ?? ''));
  }
  box.appendChild(dl);
  if (block.note) box.appendChild(el('p', 'lib-formula-note', block.note));
  return box;
}

export function renderBlocks(parent, blocks) {
  for (const block of blocks ?? []) {
    if (!block || typeof block !== 'object') continue;
    if (block.kind === 'paragraph') {
      const p = el('p', 'lib-para');
      renderSpans(p, block.spans);
      parent.appendChild(p);
    } else if (block.kind === 'list') {
      parent.appendChild(renderList(block));
    } else if (block.kind === 'comparison') {
      parent.appendChild(renderComparison(block));
    } else if (block.kind === 'callout') {
      parent.appendChild(renderCallout(block));
    } else if (block.kind === 'formula') {
      parent.appendChild(renderFormula(block));
    }
    // 未知 block 类型直接跳过：不渲染任何未经白名单的内容。
  }
  return parent;
}

function blockSection(heading, blocks, anchorId) {
  const box = el('section', 'lib-block');
  if (anchorId) box.id = anchorId;
  if (heading) box.appendChild(el('h3', 'lib-block-title', heading));
  renderBlocks(box, blocks);
  return box;
}

// ---------- 首页 ----------

function homeZone(zone, body) {
  const section = el('section', `lib-zone lib-zone-${zone.key}`);
  const head = el('div', 'lib-zone-head');
  head.appendChild(el('h3', 'lib-zone-title', zone.title));
  head.appendChild(link(zone.entryHash, zone.entryLabel, 'lib-zone-entry'));
  section.appendChild(head);
  section.appendChild(el('p', 'lib-zone-purpose', zone.purpose));
  section.appendChild(el('p', 'lib-zone-how', zone.howToUse));
  if (body) section.appendChild(body);
  return section;
}

function latestBrief(lib) {
  if (lib.briefs.length === 0) return null;
  return [...lib.briefs].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
}

function renderHome(container) {
  const home = LIBRARY.home;
  const page = el('div', 'lib-home');
  container.appendChild(page);
  if (!home) {
    page.appendChild(el('h2', null, '研究、阅读与技术学习'));
    page.appendChild(emptyBox('首页说明尚未接入。'));
    return;
  }
  page.appendChild(el('h1', 'lib-display', home.title));
  page.appendChild(el('p', 'lib-sub', home.intro));
  page.appendChild(el('p', 'lib-home-updated', `内容更新日期 ${home.updatedOn}（只反映本页内容的整理时间，不是论文发表时间）`));

  const grid = el('div', 'lib-home-grid');
  page.appendChild(grid);

  // 区一：方向与路线
  const directions = sortDirections(LIBRARY);
  const dirBody = el('div', 'lib-zone-body');
  if (directions.length === 0) dirBody.appendChild(emptyBox(EMPTY_NOTICES.directions));
  for (const direction of directions) {
    const item = el('div', 'lib-zone-item');
    const title = el('p', 'lib-zone-item-title');
    title.appendChild(link(buildHash('route', direction.id), direction.title));
    item.appendChild(title);
    if (direction.summary) item.appendChild(el('p', 'lib-zone-item-note', direction.summary));
    dirBody.appendChild(item);
  }
  grid.appendChild(
    homeZone(
      home.zones.find((z) => z.key === 'directions') ?? {
        key: 'directions',
        title: '方向与路线',
        purpose: '把“可以研究什么”变成有边界、有依据的候选，并给一条按阶段推进的阅读路线。',
        howToUse: '先看方向说明与当前研究情况，再决定要不要按路线读。',
        entryLabel: '查看三个方向',
        entryHash: '#/directions',
      },
      dirBody,
    ),
  );

  // 区二：论文阅读
  const paperBody = el('div', 'lib-zone-body');
  const startPaper = getPaper(LIBRARY, home.startHerePaperId);
  if (startPaper) {
    const item = el('div', 'lib-zone-item');
    item.appendChild(el('p', 'lib-zone-flag', '建议先读'));
    const title = el('p', 'lib-zone-item-title');
    title.appendChild(paperLink(startPaper));
    item.appendChild(title);
    item.appendChild(badgeLine(startPaper));
    item.appendChild(el('p', 'lib-zone-item-note', startPaper.lead));
    const actions = el('p', 'lib-actions');
    actions.appendChild(link(buildHash('paper', startPaper.id), '打开阅读卡', 'lib-btn lib-btn-primary'));
    actions.appendChild(link(buildHash('papers'), '全部论文', 'lib-btn'));
    item.appendChild(actions);
    paperBody.appendChild(item);
  } else if (LIBRARY.papers.length === 0) {
    paperBody.appendChild(emptyBox(EMPTY_NOTICES.papers));
  }
  grid.appendChild(
    homeZone(
      home.zones.find((z) => z.key === 'papers') ?? {
        key: 'papers',
        title: '论文阅读',
        purpose: '单篇论文读到能讲清楚它解决什么、怎么做、证据支持到哪里。',
        howToUse: '从建议先读的一篇开始，按“读到什么程度”自查。',
        entryLabel: '打开全部论文',
        entryHash: '#/papers',
      },
      paperBody,
    ),
  );

  // 区三：技术学习
  const learnBody = el('div', 'lib-zone-body');
  const core = coreTechnicalRoutes(LIBRARY);
  if (core.length === 0) learnBody.appendChild(emptyBox(EMPTY_NOTICES.learnCore));
  for (const route of core) {
    const item = el('div', 'lib-zone-item');
    const title = el('p', 'lib-zone-item-title');
    title.appendChild(link(buildHash('learn', route.id), route.title));
    item.appendChild(title);
    const count = route.units?.length ?? 0;
    const state = routeStartable(LIBRARY, route) ? '已有可开始单元' : '可开始单元待补核';
    item.appendChild(el('p', 'lib-zone-item-note', `共 ${count} 个单元，${state}。${route.prerequisites ?? ''}`));
    learnBody.appendChild(item);
  }
  const advanced = advancedTechnicalRoutes(LIBRARY);
  if (advanced.length > 0) {
    const line = el('p', 'lib-zone-adv');
    line.appendChild(el('span', 'lib-step-label', '按需深入：'));
    advanced.forEach((route, i) => {
      if (i > 0) line.appendChild(document.createTextNode('；'));
      line.appendChild(link(buildHash('learn', route.id), route.title));
    });
    learnBody.appendChild(line);
  }
  grid.appendChild(
    homeZone(
      home.zones.find((z) => z.key === 'learn') ?? {
        key: 'learn',
        title: '技术学习',
        purpose: '建立做 Agent 研究要用的工程与评价能力。',
        howToUse: '不必先选题，按主干顺序学，已掌握的部分用单元自查跳过。',
        entryLabel: '进入技术学习',
        entryHash: '#/learn',
      },
      learnBody,
    ),
  );

  // 区四：每日精选
  const briefBody = el('div', 'lib-zone-body');
  const latest = latestBrief(LIBRARY);
  if (latest) {
    briefBody.appendChild(el('p', 'lib-zone-flag', `最近一期 ${latest.date}`));
    for (const item of latest.items.slice(0, 3)) {
      const line = el('div', 'lib-zone-item');
      const title = el('p', 'lib-zone-item-title');
      const target = briefItemTarget(LIBRARY, item);
      if (target?.kind === 'paper') {
        const paper = getPaper(LIBRARY, target.paperId);
        title.appendChild(paperLink(paper));
      } else if (target?.kind === 'external') {
        title.appendChild(externalLink(target.href, item.source));
      } else {
        title.appendChild(el('span', 'lib-unsafe-link', `${item.paperId ?? item.source ?? ''}（关联未接入）`));
      }
      line.appendChild(title);
      line.appendChild(el('p', 'lib-zone-item-note', `${item.tier}：${item.reason}`));
      briefBody.appendChild(line);
    }
  } else {
    briefBody.appendChild(emptyBox(EMPTY_NOTICES.briefs));
  }
  grid.appendChild(
    homeZone(
      home.zones.find((z) => z.key === 'brief') ?? {
        key: 'brief',
        title: '每日精选',
        purpose: '少量值得留意的新线索，说明为什么挑它。',
        howToUse: '看整理日期与论文日期；这不是当天全量检索。',
        entryLabel: '看最近一期',
        entryHash: '#/brief',
      },
      briefBody,
    ),
  );

  // 区五：经典书目
  const foundBody = el('div', 'lib-zone-body');
  const fGroups = foundationGroups(LIBRARY);
  if (fGroups.length === 0) {
    foundBody.appendChild(emptyBox('经典书目尚未接入：按主题分组的基础经典将在核查身份后显示。'));
  }
  for (const group of fGroups) {
    const item = el('div', 'lib-zone-item');
    const title = el('p', 'lib-zone-item-title');
    title.appendChild(link('#/foundations', group.title));
    item.appendChild(title);
    item.appendChild(el('p', 'lib-zone-item-note', `${group.papers.length} 篇：${group.papers.map((p) => p.displayTitle || p.title).join('、')}。`));
    foundBody.appendChild(item);
  }
  grid.appendChild(
    homeZone(
      home.zones.find((z) => z.key === 'foundations') ?? {
        key: 'foundations',
        title: '经典书目',
        purpose: '做 Agent 研究的共同语言：不绑定方向的基础经典。',
        howToUse: '先读“架构与预训练”，再按需要进入推理与智能体范式。',
        entryLabel: '打开经典书目',
        entryHash: '#/foundations',
      },
      foundBody,
    ),
  );

  if (Array.isArray(home.firstUse) && home.firstUse.length > 0) {
    const first = el('section', 'lib-firstuse');
    first.appendChild(el('h3', 'lib-firstuse-title', '第一次使用'));
    const ol = el('ol', 'lib-steps');
    for (const step of home.firstUse) {
      const li = el('li', 'lib-route-step');
      li.appendChild(el('h4', 'lib-step-title', step.title));
      if (step.text) li.appendChild(el('p', 'lib-step-line', step.text));
      ol.appendChild(li);
    }
    first.appendChild(ol);
    page.appendChild(first);
  }
}

// ---------- 方向与路线 ----------

function renderDirections(container) {
  const page = el('div', 'lib-page');
  container.appendChild(page);
  page.appendChild(crumb([{ text: '首页', href: '#/home' }, { text: '方向与路线' }]));
  page.appendChild(el('h2', null, '方向与路线'));
  page.appendChild(
    el('p', 'lib-intro', '三个已批准的方向：每个都有研究对象、当前研究情况、选择理由和限制。它们是备选，不必同时推进。'),
  );
  const directions = sortDirections(LIBRARY);
  if (directions.length === 0) {
    page.appendChild(emptyBox(EMPTY_NOTICES.directions));
    return;
  }
  for (const direction of directions) {
    const section = el('section', 'lib-panel-flat');
    const head = el('div', 'lib-dir-head');
    head.appendChild(el('span', 'lib-dir-num', String(direction.order)));
    const title = el('h3', 'lib-dir-title');
    title.appendChild(link(buildHash('route', direction.id), direction.title));
    head.appendChild(title);
    section.appendChild(head);
    if (direction.summary) section.appendChild(el('p', 'lib-dir-summary', direction.summary));
    if (direction.overview) section.appendChild(el('p', 'lib-dir-overview', direction.overview));
    const entries = routeEntries(LIBRARY, direction.id);
    const first = entries.find((e) => e.paper) ?? entries[0] ?? null;
    if (first?.paper) {
      const line = el('p', 'lib-first-line');
      line.appendChild(el('strong', 'lib-step-label', '第一篇：'));
      line.appendChild(paperLink(first.paper));
      section.appendChild(line);
    }
    const more = el('p', 'lib-dir-more');
    more.appendChild(link(buildHash('route', direction.id), '查看完整说明与阅读路线'));
    section.appendChild(more);
    page.appendChild(section);
  }
  // CCF 目录事实（D3 决策：并入方向页底部一句话事实 + 来源；不是投稿推荐）。
  const ccf = LIBRARY.meta?.ccfNote;
  if (ccf?.text) {
    const box = el('div', 'lib-sources');
    box.appendChild(el('p', 'lib-sources-title', '投稿参照（目录事实）'));
    box.appendChild(el('p', 'lib-para', ccf.text));
    if (Array.isArray(ccf.sources)) {
      const ul = el('ul', 'lib-list');
      for (const source of ccf.sources) {
        const li = el('li');
        li.appendChild(externalLink(source.url, source.label));
        ul.appendChild(li);
      }
      box.appendChild(ul);
    }
    page.appendChild(box);
  }
}

function renderRoute(container, directionId) {
  const direction = getDirection(LIBRARY, directionId);
  const page = el('div', 'lib-page');
  container.appendChild(page);
  page.appendChild(
    crumb([{ text: '首页', href: '#/home' }, { text: '方向与路线', href: '#/directions' }, { text: direction ? direction.title : directionId }]),
  );
  if (!direction) {
    page.appendChild(notFoundBox('方向', directionId));
    return;
  }
  page.appendChild(el('h2', null, direction.title));
  if (direction.summary) page.appendChild(el('p', 'lib-intro', direction.summary));

  page.appendChild(el('h3', 'lib-block-title', '这个方向研究什么'));
  if (direction.overview) page.appendChild(el('p', 'lib-para', direction.overview));

  page.appendChild(el('h3', 'lib-block-title', '当前研究情况'));
  if (direction.stateOfField) page.appendChild(el('p', 'lib-para', direction.stateOfField));
  if (direction.asOf) page.appendChild(el('p', 'lib-asof', `以上情况的核查截止日期：${direction.asOf}；之后的新工作需另行查新。`));
  if (Array.isArray(direction.sources) && direction.sources.length > 0) {
    const box = el('div', 'lib-sources');
    box.appendChild(el('p', 'lib-sources-title', '支撑这些判断的公开来源'));
    const ul = el('ul', 'lib-list');
    for (const source of direction.sources) {
      const li = el('li');
      if (source.url) li.appendChild(externalLink(source.url, source.label));
      else li.appendChild(document.createTextNode(source.label));
      if (source.note) li.appendChild(document.createTextNode(` —— ${source.note}`));
      ul.appendChild(li);
    }
    box.appendChild(ul);
    page.appendChild(box);
  }

  page.appendChild(el('h3', 'lib-block-title', '为什么考虑这个方向'));
  if (direction.whyChoose) page.appendChild(el('p', 'lib-para', direction.whyChoose));

  page.appendChild(el('h3', 'lib-block-title', '难点与不适用条件'));
  if (direction.limits) page.appendChild(el('p', 'lib-para', direction.limits));

  page.appendChild(el('h3', 'lib-block-title', '按阶段阅读'));
  const groups = routeStages(LIBRARY, directionId);
  if (groups.length === 0) {
    page.appendChild(emptyBox(EMPTY_NOTICES.routeEmpty));
  } else {
    // 提示按路线实际排列生成：不为匹配固定措辞而重排已批准的论文顺序。
    page.appendChild(
      el('p', 'lib-intro', `本路线阶段顺序：${groups.map((g) => g.stage).join(' → ')}。每步写明为什么读、什么时候读、读到什么程度；顺序以保持论文原有先后为准。`),
    );
    for (const group of groups) {
      const stageBox = el('div', 'lib-stage');
      stageBox.appendChild(el('p', 'lib-stage-label', group.stage));
      const ol = el('ol', 'lib-steps');
      for (const entry of group.entries) {
        const li = el('li', 'lib-route-step');
        const title = el('h4', 'lib-step-title');
        if (entry.paper) title.appendChild(paperLink(entry.paper));
        else title.appendChild(el('span', 'lib-unsafe-link', `${entry.paperId}（关联未解析，内容待修复）`));
        li.appendChild(title);
        const meta = el('p', 'lib-step-flags');
        if (entry.required) meta.appendChild(el('span', 'lib-flag', entry.required));
        const depth = deliveredDepthOf(entry.paper);
        if (depth) meta.appendChild(el('span', 'lib-flag', DEPTH_LABELS[depth] ?? depth));
        if (meta.childNodes.length > 0) li.appendChild(meta);
        for (const field of ['purpose', 'readWhen', 'check']) {
          if (!entry[field]) continue;
          const p = el('p', 'lib-step-line');
          p.appendChild(el('strong', 'lib-step-label', `${STEP_LABELS[field]}：`));
          p.appendChild(document.createTextNode(entry[field]));
          li.appendChild(p);
        }
        ol.appendChild(li);
      }
      stageBox.appendChild(ol);
      page.appendChild(stageBox);
    }
  }

  if (Array.isArray(direction.openQuestions) && direction.openQuestions.length > 0) {
    page.appendChild(el('h3', 'lib-block-title', '可以追问的问题'));
    const ul = el('ul', 'lib-list');
    for (const question of direction.openQuestions) ul.appendChild(el('li', null, question));
    page.appendChild(ul);
  }
}

// ---------- 论文 ----------

function paperListItem(paper) {
  const item = el('section', 'lib-paper-item');
  const title = el('h3', 'lib-paper-title');
  title.appendChild(paperLink(paper));
  item.appendChild(title);
  item.appendChild(badgeLine(paper));
  const record = v3StatusOf(paper.id);
  if (record && record.status !== 'unread') {
    item.appendChild(el('p', 'lib-paper-status', `我的状态：${V3_STATUS_LABELS[record.status]}（本人标记）`));
  }
  if (paper.lead) item.appendChild(el('p', 'lib-paper-lead', paper.lead));
  return item;
}

function renderPapers(container) {
  const page = el('div', 'lib-page');
  container.appendChild(page);
  page.appendChild(crumb([{ text: '首页', href: '#/home' }, { text: '论文阅读' }]));
  page.appendChild(el('h2', null, '论文阅读'));
  page.appendChild(
    el('p', 'lib-intro', '读了正文的按正文整理，只看过摘要的只给摘要层面的判断，只有可靠身份的只做原文入口。每张卡都注明依据。'),
  );
  const actions = el('p', 'lib-actions');
  if (v3Available()) {
    const exportButton = el('button', 'lib-btn', '导出我的记录（Markdown）');
    exportButton.type = 'button';
    exportButton.addEventListener('click', downloadMyNotes);
    actions.appendChild(exportButton);
  }
  actions.appendChild(link('#/foundations', '经典书目（不绑定方向的基础经典）', 'lib-btn'));
  page.appendChild(actions);
  const storageNotice = v3StorageNotice();
  if (storageNotice) page.appendChild(storageNotice);
  if (LIBRARY.papers.length === 0) {
    page.appendChild(emptyBox(EMPTY_NOTICES.papers));
    return;
  }
  // 分组：方向路线文献（按方向顺序）→ 路线外条目；经典书目独立视图，这里只给入口。
  const routed = new Set();
  for (const direction of sortDirections(LIBRARY)) {
    const entries = routeEntries(LIBRARY, direction.id).filter((e) => e.paper);
    if (entries.length === 0) continue;
    const groupBox = el('div', 'lib-paper-group');
    groupBox.appendChild(el('h3', 'lib-block-title', `方向${direction.order} · ${direction.title}`));
    const list = el('div', 'lib-paper-list');
    for (const entry of entries) {
      if (routed.has(entry.paper.id)) continue;
      routed.add(entry.paper.id);
      list.appendChild(paperListItem(entry.paper));
    }
    if (list.childNodes.length > 0) {
      groupBox.appendChild(list);
      page.appendChild(groupBox);
    }
  }
  const unrouted = LIBRARY.papers.filter((p) => !routed.has(p.id) && p.collection !== 'foundations');
  if (unrouted.length > 0) {
    const groupBox = el('div', 'lib-paper-group');
    groupBox.appendChild(el('h3', 'lib-block-title', '支线与路线外'));
    const list = el('div', 'lib-paper-list');
    for (const paper of unrouted) list.appendChild(paperListItem(paper));
    groupBox.appendChild(list);
    page.appendChild(groupBox);
  }
  page.appendChild(renderReadingList());
}

function paperHeader(paper) {
  const wrap = el('header', 'lib-paper-head');
  wrap.appendChild(el('h2', 'lib-paper-heading', paper.title));
  if (paper.displayTitle) wrap.appendChild(el('p', 'lib-paper-subtitle', paper.displayTitle));
  const meta = el('p', 'lib-metaline');
  for (const badge of paperBadges(paper)) {
    meta.appendChild(el('span', `lib-badge${['deep', 'standard'].includes(badge.kind) ? ' lib-badge-kind' : ''}`, badge.text));
  }
  const source = paperSourceLink(paper);
  if (source) {
    const a = link(source.href, `论文原文 · ${source.host}`, 'lib-orig');
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    meta.appendChild(a);
  } else if (paper.url) {
    meta.appendChild(el('span', 'lib-unsafe-link', '原文链接未通过 https 校验，不提供可点链接'));
  }
  wrap.appendChild(meta);
  const recommended = recommendedDepthOf(paper);
  const delivered = deliveredDepthOf(paper);
  if (recommended && delivered && recommended !== delivered) {
    wrap.appendChild(
      el(
        'p',
        'lib-depth-note',
        `${RECOMMENDED_LABELS[recommended] ?? recommended}；当前实际交付：${DEPTH_LABELS[delivered] ?? delivered}。建议投入不等于已经读到这个深度。`,
      ),
    );
  }
  return wrap;
}

function renderReferences(article, paper) {
  const refs = (paper.references ?? []).filter(Boolean);
  if (refs.length === 0) return;
  const box = el('section', 'lib-block');
  box.id = 'lib-sec-refs';
  box.appendChild(el('h3', 'lib-block-title', sectionTitle('deep', 'references')));
  const citations = refs.filter((r) => r.relation === 'citation');
  const editorial = refs.filter((r) => r.relation === 'editorial');
  if (citations.length > 0) {
    box.appendChild(el('p', 'lib-ref-label', '真实引用关系（有原文依据）'));
    const ul = el('ul', 'lib-list');
    for (const ref of citations) {
      const li = el('li');
      if (ref.paperId) {
        const paper = getPaper(LIBRARY, ref.paperId);
        if (paper) li.appendChild(paperLink(paper));
        else li.appendChild(el('span', 'lib-unsafe-link', `${ref.paperId}（关联未接入）`));
      } else if (ref.label) {
        li.appendChild(document.createTextNode(ref.label));
      }
      if (ref.sourceLocator) li.appendChild(document.createTextNode(` —— ${ref.sourceLocator}`));
      if (ref.reason) li.appendChild(document.createTextNode(`；${ref.reason}`));
      ul.appendChild(li);
    }
    box.appendChild(ul);
  }
  if (editorial.length > 0) {
    box.appendChild(el('p', 'lib-ref-label', '整理时排定的相邻阅读（不是引用关系）'));
    const ul = el('ul', 'lib-list');
    for (const ref of editorial) {
      const li = el('li');
      if (ref.paperId) {
        const paper = getPaper(LIBRARY, ref.paperId);
        if (paper) li.appendChild(paperLink(paper));
        else li.appendChild(el('span', 'lib-unsafe-link', `${ref.paperId}（关联未接入）`));
      } else if (ref.label) {
        li.appendChild(document.createTextNode(ref.label));
      }
      if (ref.reason) li.appendChild(document.createTextNode(` —— ${ref.reason}`));
      ul.appendChild(li);
    }
    box.appendChild(ul);
  }
  article.appendChild(box);
}

// 目录容器：桌面展开；窄屏默认折叠，避免长目录挤在正文开头（DESIGN-005）。
function tocWrap(paper, outline) {
  const details = el('details', 'lib-toc-wrap');
  details.appendChild(el('summary', 'lib-toc-summary', '本页目录'));
  const tocNav = el('nav', 'lib-toc');
  tocNav.setAttribute('aria-label', '本页目录');
  tocNav.appendChild(el('p', 'lib-toc-title', '本页目录'));
  for (const item of outline) tocNav.appendChild(tocButton(item.id, item.label));
  details.appendChild(tocNav);
  const wide = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? !window.matchMedia('(max-width: 900px)').matches
    : true;
  details.open = wide;
  return details;
}

function stringList(article, id, heading, items) {
  if (!Array.isArray(items) || items.length === 0) return;
  const box = el('section', 'lib-block');
  if (id) box.id = id;
  box.appendChild(el('h3', 'lib-block-title', heading));
  const ul = el('ul', 'lib-list');
  for (const item of items) ul.appendChild(el('li', null, item));
  box.appendChild(ul);
  article.appendChild(box);
}

function renderNext(article, paper) {
  if (!paper.next?.note) return;
  const box = el('section', 'lib-block');
  box.id = 'lib-sec-next';
  box.appendChild(el('h3', 'lib-block-title', sectionTitle(deliveredDepthOf(paper), 'next')));
  box.appendChild(el('p', 'lib-para', paper.next.note));
  if (paper.next.paperId) {
    const nextPaper = getPaper(LIBRARY, paper.next.paperId);
    if (nextPaper) {
      const nav = el('p', 'lib-actions');
      nav.appendChild(
        link(buildHash('paper', nextPaper.id), `打开《${nextPaper.displayTitle || nextPaper.title}》`, 'lib-btn lib-btn-primary'),
      );
      box.appendChild(nav);
    }
  }
  article.appendChild(box);
}

function renderCoverage(article, paper) {
  const details = el('details', 'lib-coverage');
  details.appendChild(el('summary', null, '来源与覆盖（点开查看）'));
  const rows = coverageRows(paper);
  if (rows.length > 0) {
    const dl = el('dl', 'lib-coverage-list');
    for (const [label, value] of rows) {
      dl.appendChild(el('dt', null, label));
      dl.appendChild(el('dd', null, value));
    }
    details.appendChild(dl);
  }
  article.appendChild(details);
}

function tocButton(targetId, label) {
  const button = el('button', 'lib-toc-link', label);
  button.type = 'button';
  button.addEventListener('click', () => {
    const target = document.getElementById(targetId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  return button;
}

function renderRail(page, paper, positions, source) {
  const rail = el('aside', 'lib-rail');
  const outline = paperOutline(paper);
  if (outline.length > 0) {
    rail.appendChild(tocWrap(paper, outline));
  }
  if (source) {
    const block = el('div', 'lib-rail-block');
    block.appendChild(el('p', 'lib-rail-label', '原文'));
    const a = link(source.href, source.host, 'lib-rail-line');
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    block.appendChild(a);
    rail.appendChild(block);
  }
  if (positions.length > 0) {
    const block = el('div', 'lib-rail-block');
    block.appendChild(el('p', 'lib-rail-label', '在路线中的位置'));
    for (const position of positions) {
      block.appendChild(el('p', 'lib-rail-pos', `《${position.direction.title}》第 ${position.index} / ${position.total} 篇`));
      const prevLine = el('p', 'lib-rail-line');
      if (position.prev?.paper) {
        prevLine.appendChild(
          link(buildHash('paper', position.prev.paper.id), `上一篇：《${position.prev.paper.displayTitle || position.prev.paper.title}》`),
        );
      } else {
        prevLine.appendChild(el('span', 'lib-muted', '这是第一篇'));
      }
      block.appendChild(prevLine);
      const nextLine = el('p', 'lib-rail-line');
      if (position.next?.paper) {
        nextLine.appendChild(
          link(buildHash('paper', position.next.paper.id), `下一篇：《${position.next.paper.displayTitle || position.next.paper.title}》`),
        );
      } else {
        nextLine.appendChild(el('span', 'lib-muted', '已是本路线最后一篇'));
      }
      block.appendChild(nextLine);
      const backLine = el('p', 'lib-rail-line');
      backLine.appendChild(link(buildHash('route', position.direction.id), '返回路线'));
      block.appendChild(backLine);
    }
    rail.appendChild(block);
  }
  if (rail.childNodes.length > 0) page.appendChild(rail);
  else page.classList.add('lib-reading-solo');
}

function renderPaper(container, paperId) {
  const paper = getPaper(LIBRARY, paperId);
  const positions = routesContaining(LIBRARY, paperId);
  const crumbParts = [{ text: '首页', href: '#/home' }, { text: '论文阅读', href: '#/papers' }];
  for (const position of positions) {
    crumbParts.push({ text: position.direction.title, href: buildHash('route', position.direction.id) });
  }
  container.appendChild(crumb(crumbParts));

  const page = el('div', 'lib-reading');
  const article = el('article', 'lib-article');
  container.appendChild(page);
  page.appendChild(article);
  if (!paper) {
    article.appendChild(notFoundBox('论文', paperId));
    page.classList.add('lib-reading-solo');
    return;
  }

  const depth = deliveredDepthOf(paper);
  page.classList.add(`lib-paper-${depth ?? 'entry'}`);
  const source = paperSourceLink(paper);
  article.appendChild(paperHeader(paper));
  article.appendChild(renderNotesPanel(paper));

  if (depth === 'deep') {
    if (Array.isArray(paper.overview) && paper.overview.length > 0) {
      article.appendChild(blockSection(sectionTitle(depth, 'overview'), paper.overview, 'lib-sec-overview'));
    }
    if (Array.isArray(paper.prereq) && paper.prereq.length > 0) {
      article.appendChild(blockSection(sectionTitle(depth, 'prereq'), paper.prereq, 'lib-sec-prereq'));
    }
    for (const section of paper.sections ?? []) {
      const box = el('section', 'lib-section');
      box.id = sectionAnchorId(paper.id, section.id);
      box.appendChild(el('h3', 'lib-block-title', section.heading));
      renderBlocks(box, section.blocks);
      article.appendChild(box);
    }
    stringList(article, 'lib-sec-deep', sectionTitle(depth, 'deepRead'), paper.deepRead);
    renderReferences(article, paper);
    stringList(article, 'lib-sec-open', sectionTitle(depth, 'openQuestions'), paper.openQuestions);
    stringList(article, 'lib-sec-questions', sectionTitle(depth, 'questions'), paper.questions);
    renderNext(article, paper);
  } else if (depth === 'standard') {
    if (paper.lead) article.appendChild(el('p', 'lib-lead', paper.lead));
    stringList(article, 'lib-sec-reasons', sectionTitle(depth, 'reasons'), paper.reasons);
    for (const section of paper.sections ?? []) {
      const box = el('section', 'lib-section');
      box.id = sectionAnchorId(paper.id, section.id);
      box.appendChild(el('h3', 'lib-block-title', section.heading));
      renderBlocks(box, section.blocks);
      article.appendChild(box);
    }
    stringList(article, 'lib-sec-deep', sectionTitle(depth, 'deepRead'), paper.deepRead);
    stringList(article, 'lib-sec-questions', sectionTitle(depth, 'questions'), paper.questions);
    renderNext(article, paper);
  } else if (depth === 'quick') {
    article.appendChild(
      el('p', 'lib-notice-flat', '这篇只依据摘要做过判断，正文还没有读，所以没有正文整理；依据与没读到的部分见下方“来源与覆盖”。'),
    );
    if (paper.lead) article.appendChild(el('p', 'lib-lead', paper.lead));
    stringList(article, 'lib-sec-reasons', sectionTitle(depth, 'reasons'), paper.reasons);
    stringList(article, 'lib-sec-questions', sectionTitle(depth, 'questions'), paper.questions);
    renderNext(article, paper);
  } else {
    article.appendChild(
      el('p', 'lib-notice-flat', '这篇还没有获取摘要，这里只提供论文本身的线索，没有任何内容判断；请从上方“论文原文”核对原文，再决定投入多少时间。'),
    );
    if (paper.lead) article.appendChild(el('p', 'lib-lead', paper.lead));
    stringList(article, 'lib-sec-reasons', sectionTitle(depth, 'reasons'), paper.reasons);
    renderNext(article, paper);
  }

  renderCoverage(article, paper);
  renderRail(page, paper, positions, source);
}

// ---------- 经典书目 ----------

function renderFoundations(container) {
  const page = el('div', 'lib-page');
  container.appendChild(page);
  page.appendChild(crumb([{ text: '首页', href: '#/home' }, { text: '经典书目' }]));
  page.appendChild(el('h2', null, '经典书目'));
  page.appendChild(
    el('p', 'lib-intro', LIBRARY.foundations?.intro ?? '不绑定方向的基础经典。'),
  );
  page.appendChild(
    el('p', 'lib-notice-flat', '这些卡当前都是摘要级判断：身份经 2026-09-15 逐页核查，正文还没有读；建议投入（精读/重点理解）不等于已经读到那个深度。'),
  );
  const groups = foundationGroups(LIBRARY);
  if (groups.length === 0) {
    page.appendChild(emptyBox('经典书目尚未接入：按主题分组的基础经典将在核查身份后显示，不编造条目。'));
    return;
  }
  for (const group of groups) {
    const box = el('div', 'lib-paper-group');
    box.appendChild(el('h3', 'lib-block-title', group.title));
    if (group.note) box.appendChild(el('p', 'lib-para', group.note));
    const list = el('div', 'lib-paper-list');
    for (const paper of group.papers) list.appendChild(paperListItem(paper));
    box.appendChild(list);
    page.appendChild(box);
  }
}

// ---------- 技术学习 ----------

function resourceLine(resource, label) {
  const wrap = el('p', 'lib-res-line');
  wrap.appendChild(el('strong', 'lib-step-label', `${label}：`));
  wrap.appendChild(externalLink(resource.url, resource.title));
  const parts = [
    resource.provider,
    CHECK_LEVEL_LABELS[resource.checkLevel],
    ACCESS_LABELS[resource.access],
    resource.language === 'zh' ? '中文' : '英文',
  ].filter(Boolean);
  if (resource.checkedAt) parts.push(`核查 ${resource.checkedAt}`);
  wrap.appendChild(el('span', 'lib-res-meta', `（${parts.join(' · ')}）`));
  if (resource.versionNote) wrap.appendChild(el('span', 'lib-res-note', ` ${resource.versionNote}`));
  return wrap;
}

function technicalRouteCard(route) {
  const card = el('section', 'lib-panel-flat');
  const title = el('h3', 'lib-tech-title');
  title.appendChild(link(buildHash('learn', route.id), route.title));
  card.appendChild(title);
  card.appendChild(el('p', 'lib-tech-capability', route.capability));
  const meta = el('p', 'lib-tech-meta');
  meta.appendChild(el('span', 'lib-step-label', '单元数：'));
  meta.appendChild(document.createTextNode(String(route.units?.length ?? 0)));
  meta.appendChild(el('span', 'lib-tech-sep', ' · '));
  meta.appendChild(el('span', 'lib-step-label', '先修：'));
  meta.appendChild(document.createTextNode(route.prerequisites ?? '无特别先修'));
  card.appendChild(meta);
  card.appendChild(el('p', 'lib-tech-note', `适用：${route.applicability ?? '—'}`));
  if (route.kind === 'core' && !routeStartable(LIBRARY, route)) {
    card.appendChild(el('p', 'lib-tech-warn', '可开始单元待补核：当前没有已核查到章节且访问条件明确的主资源。'));
  }
  return card;
}

function renderLearn(container, routeId = null) {
  const page = el('div', 'lib-page');
  container.appendChild(page);
  page.appendChild(crumb([{ text: '首页', href: '#/home' }, { text: '技术学习', href: '#/learn' }]));
  page.appendChild(el('h2', null, '技术学习'));
  page.appendChild(
    el('p', 'lib-intro', '技术学习不要求先选定论文方向。六条必学主干按能力组织，每条给出单元、主资源、自查与何时跳过；方向相关的深入内容放在按需支线。'),
  );
  const core = coreTechnicalRoutes(LIBRARY);
  const advanced = advancedTechnicalRoutes(LIBRARY);
  if (core.length === 0 && advanced.length === 0) {
    page.appendChild(emptyBox(EMPTY_NOTICES.technicalRoutes));
    return;
  }

  if (routeId !== null) {
    const route = getTechnicalRoute(LIBRARY, routeId);
    if (!route) {
      page.appendChild(notFoundBox('技术路线', routeId));
      return;
    }
    page.appendChild(el('h3', 'lib-tech-title', route.title));
    page.appendChild(el('p', 'lib-tech-capability', route.capability));
    for (const [label, value] of [
      ['先修', route.prerequisites],
      ['适用场合', route.applicability],
      ['本条路线', route.summary],
    ]) {
      if (!value) continue;
      const p = el('p', 'lib-step-line');
      p.appendChild(el('strong', 'lib-step-label', `${label}：`));
      p.appendChild(document.createTextNode(value));
      page.appendChild(p);
    }
    if (route.pendingNote) page.appendChild(el('p', 'lib-notice-flat', route.pendingNote));
    if (Array.isArray(route.relatedPaperIds) && route.relatedPaperIds.length > 0) {
      const p = el('p', 'lib-step-line');
      p.appendChild(el('strong', 'lib-step-label', '关联论文：'));
      route.relatedPaperIds.forEach((paperId, i) => {
        if (i > 0) p.appendChild(document.createTextNode('；'));
        const paper = getPaper(LIBRARY, paperId);
        if (paper) p.appendChild(paperLink(paper));
        else p.appendChild(el('span', 'lib-unsafe-link', `${paperId}（关联未接入）`));
      });
      page.appendChild(p);
    }

    if ((route.units ?? []).length > 0) {
      page.appendChild(el('h3', 'lib-block-title', '单元目录'));
      const ol = el('ol', 'lib-steps');
      for (const unit of route.units) {
        const li = el('li', 'lib-route-step');
        li.appendChild(el('h4', 'lib-step-title', unit.title));
        if (unit.goal) li.appendChild(el('p', 'lib-step-line', unit.goal));
        ol.appendChild(li);
      }
      page.appendChild(ol);

      for (const unit of route.units) {
        const box = el('section', 'lib-unit');
        box.appendChild(el('h3', 'lib-block-title', unit.title));
        box.appendChild(el('p', 'lib-para', unit.goal));
        if (unit.focus) {
          const p = el('p', 'lib-step-line');
          p.appendChild(el('strong', 'lib-step-label', '读什么：'));
          p.appendChild(document.createTextNode(unit.focus));
          box.appendChild(p);
        }
        const { primary, supplement } = unitResources(route, unit);
        if (primary) box.appendChild(resourceLine(primary, '主资源'));
        if (supplement) box.appendChild(resourceLine(supplement, '补充'));
        if (!primary && !supplement) box.appendChild(el('p', 'lib-notice-flat', '本单元还没有已登记的可开始资源。'));
        for (const [label, value] of [
          ['先修', unit.prerequisites],
          ['自查', unit.selfCheck],
          ['选做', unit.optionalPractice],
          ['何时跳过', unit.skipWhen],
        ]) {
          if (!value) continue;
          const p = el('p', 'lib-step-line');
          p.appendChild(el('strong', 'lib-step-label', `${label}：`));
          p.appendChild(document.createTextNode(value));
          box.appendChild(p);
        }
        if (Array.isArray(unit.relatedPaperIds) && unit.relatedPaperIds.length > 0) {
          const p = el('p', 'lib-step-line');
          p.appendChild(el('strong', 'lib-step-label', '关联论文：'));
          unit.relatedPaperIds.forEach((paperId, i) => {
            if (i > 0) p.appendChild(document.createTextNode('；'));
            const paper = getPaper(LIBRARY, paperId);
            if (paper) p.appendChild(paperLink(paper));
            else p.appendChild(el('span', 'lib-unsafe-link', `${paperId}（关联未接入）`));
          });
          box.appendChild(p);
        }
        page.appendChild(box);
      }
    } else if (route.kind === 'advanced') {
      page.appendChild(el('p', 'lib-notice-flat', '这条是按需支线：先按关联论文或对应主干学习，再决定是否深入。'));
      if (Array.isArray(route.relatedPaperIds) && route.relatedPaperIds.length > 0) {
        const ol = el('ol', 'lib-steps');
        for (const paperId of route.relatedPaperIds) {
          const paper = getPaper(LIBRARY, paperId);
          const li = el('li', 'lib-route-step');
          if (paper) {
            const h = el('h4', 'lib-step-title');
            h.appendChild(paperLink(paper));
            li.appendChild(h);
            li.appendChild(el('p', 'lib-step-line', paper.lead));
          } else {
            li.appendChild(el('span', 'lib-unsafe-link', `${paperId}（关联未接入）`));
          }
          ol.appendChild(li);
        }
        page.appendChild(ol);
      }
    }
    return;
  }

  page.appendChild(el('h3', 'lib-block-title', '必学主干'));
  if (core.length === 0) page.appendChild(emptyBox(EMPTY_NOTICES.learnCore));
  for (const route of core) page.appendChild(technicalRouteCard(route));

  if (advanced.length > 0) {
    page.appendChild(el('h3', 'lib-block-title', '按需深入'));
    for (const route of advanced) page.appendChild(technicalRouteCard(route));
  }
}

// ---------- 精选 ----------

function briefPanel(brief) {
  const panel = el('section', 'lib-panel-flat');
  panel.appendChild(el('h3', 'lib-brief-title', `${brief.date} 精选`));
  panel.appendChild(el('p', 'lib-muted', `整理日期 ${brief.date}（区别于论文发表时间）；覆盖范围：${brief.scope}。`));
  const ol = el('ol', 'lib-brief-items');
  for (const item of brief.items) {
    const li = el('li', 'lib-brief-item');
    const title = el('p', 'lib-brief-item-title');
    const target = briefItemTarget(LIBRARY, item);
    if (target?.kind === 'paper') {
      title.appendChild(paperLink(getPaper(LIBRARY, target.paperId)));
    } else if (target?.kind === 'external') {
      title.appendChild(externalLink(target.href, item.source));
    } else if (target?.kind === 'missing-paper') {
      title.appendChild(el('span', 'lib-unsafe-link', `${item.paperId}（关联论文未接入，内容待修复）`));
    } else if (target?.kind === 'unsafe-source') {
      title.appendChild(el('span', 'lib-unsafe-link', `${item.source}（来源未通过 https 校验，不提供可点链接）`));
    } else {
      title.appendChild(el('span', 'lib-unsafe-link', '（本条缺少可解析目标，内容待修复）'));
    }
    li.appendChild(title);
    for (const [label, value] of [
      ['推荐理由', item.reason],
      ['摘要', item.summary],
      ['论文时间', item.published],
      ['优先级', item.tier],
    ]) {
      if (!value) continue;
      const p = el('p', 'lib-step-line');
      p.appendChild(el('strong', 'lib-step-label', `${label}：`));
      p.appendChild(document.createTextNode(value));
      li.appendChild(p);
    }
    ol.appendChild(li);
  }
  panel.appendChild(ol);
  return panel;
}

// ---------- 近期登记发现（点击才查询；结果不进入内容库、不写入任何记录） ----------

const DISCOVER_TOPICS = Object.freeze([
  { id: 'agent', label: '智能体与工具使用' },
  { id: 'rag', label: '检索增强生成' },
  { id: 'peft', label: '参数高效微调' },
]);

function renderDiscoverItem(item) {
  const box = el('div', 'lib-zone-item');
  const title = el('p', 'lib-zone-item-title');
  const doiHref = safeExternalHref(`https://doi.org/${item.doi}`);
  if (doiHref) title.appendChild(externalLink(doiHref, item.title));
  else title.appendChild(document.createTextNode(item.title));
  box.appendChild(title);
  const metaParts = [
    item.authors,
    item.containerTitle,
    `登记 ${String(item.created ?? '').slice(0, 10)}`,
    item.published?.text ? `发表 ${item.published.text}` : '发表时间未知',
  ].filter(Boolean);
  box.appendChild(el('p', 'lib-res-meta', metaParts.join(' · ')));
  if (item.abstract) box.appendChild(el('p', 'lib-zone-item-note', item.abstract));
  else box.appendChild(el('p', 'lib-zone-item-note', '来源未提供摘要。'));
  return box;
}

function renderDiscoverSection() {
  const box = el('section', 'lib-discover');
  box.appendChild(el('h3', 'lib-block-title', '近期登记发现（实时查询）'));
  box.appendChild(
    el('p', 'lib-intro', '点下面的主题才会向本机服务发起一次 Crossref 查询（最近 7 个 UTC 日登记）。近期登记不等于近期发表；失败、超时或限额都会明说，不会用旧数据冒充。动态条目只读，不会进入阅读库，也不会写入你的任何记录。'),
  );
  const topicLine = el('p', 'lib-actions');
  const resultBox = el('div', 'lib-discover-result');
  resultBox.appendChild(el('p', 'lib-muted', '尚未查询。'));
  for (const topic of DISCOVER_TOPICS) {
    const button = el('button', 'lib-btn', topic.label);
    button.type = 'button';
    button.addEventListener('click', async () => {
      for (const b of topicLine.querySelectorAll('button')) b.disabled = true;
      resultBox.textContent = '';
      resultBox.appendChild(el('p', 'lib-muted', `正在查询“${topic.label}”（真实访问 Crossref，可能需要几秒）…`));
      try {
        const res = await fetch(`/api/discover?topic=${topic.id}`, { headers: { accept: 'application/json' } });
        const payload = await res.json().catch(() => null);
        resultBox.textContent = '';
        if (!res.ok || !payload || payload.error) {
          const message = payload?.error?.message ?? `查询失败（HTTP ${res.status}）；未获取到数据，不会用其他内容冒充。`;
          resultBox.appendChild(el('p', 'lib-notice-flat', message));
          return;
        }
        const meta = el('p', 'lib-res-meta');
        meta.textContent = `窗口 ${payload.windowStart} ~ ${payload.windowEnd} · 获取于 ${String(payload.fetchedAt ?? '').slice(0, 16).replace('T', ' ')} · ${payload.cached ? '15 分钟内缓存' : '实时查询'} · 命中 ${payload.count} 条（结构/窗口过滤 ${payload.filteredCount}，主题过滤 ${payload.topicFilteredCount}）`;
        resultBox.appendChild(meta);
        resultBox.appendChild(el('p', 'lib-discover-note', payload.registrationNote ?? ''));
        resultBox.appendChild(el('p', 'lib-discover-note', payload.topicFilterNote ?? ''));
        if (!payload.items || payload.items.length === 0) {
          resultBox.appendChild(el('p', 'lib-empty', '这个窗口内没有命中主题的记录；0 条不代表该方向没有相关研究。'));
          return;
        }
        for (const item of payload.items) resultBox.appendChild(renderDiscoverItem(item));
      } catch {
        resultBox.textContent = '';
        resultBox.appendChild(el('p', 'lib-notice-flat', '无法连接本机服务（网络或服务未运行）；未获取到数据，不会用其他内容冒充。'));
      } finally {
        for (const b of topicLine.querySelectorAll('button')) b.disabled = false;
      }
    });
    topicLine.appendChild(button);
  }
  box.appendChild(topicLine);
  box.appendChild(resultBox);
  return box;
}

function renderBrief(container, briefId = null) {
  const page = el('div', 'lib-page');
  container.appendChild(page);
  page.appendChild(crumb([{ text: '首页', href: '#/home' }, { text: '每日精选', href: '#/brief' }]));
  page.appendChild(el('h2', null, '每日精选'));
  page.appendChild(
    el('p', 'lib-intro', '这里是工作日更新的定向挑选：每期由每日论文漏斗实际产出，少量论文每条写明挑选理由；整理日期与论文发表日期分开标注，缺日即当日未产出，不补写。'),
  );
  if (LIBRARY.briefs.length === 0) {
    page.appendChild(emptyBox(EMPTY_NOTICES.briefs));
    return;
  }
  page.appendChild(renderDiscoverSection());
  if (briefId !== null) {
    const brief = getBrief(LIBRARY, briefId);
    if (!brief) {
      page.appendChild(notFoundBox('简报', briefId));
      return;
    }
    page.appendChild(briefPanel(brief));
    page.appendChild(briefArchive(brief.id));
    return;
  }
  const latest = latestBrief(LIBRARY);
  page.appendChild(el('h3', 'lib-block-title', '选编简报'));
  page.appendChild(briefPanel(latest));
  page.appendChild(briefArchive(latest.id));
}

// 历史工作日索引：按期列出全部简报并标明当前期；未产出的日期不占位、不补写。
function briefArchive(currentId) {
  const box = el('div', 'lib-brief-archive');
  box.appendChild(el('h3', 'lib-block-title', '历史工作日'));
  const sorted = [...LIBRARY.briefs].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const ul = el('ul', 'lib-list');
  for (const brief of sorted) {
    const li = el('li');
    if (brief.id === currentId) {
      li.appendChild(el('strong', null, brief.date));
      li.appendChild(document.createTextNode('（本期）'));
    } else {
      li.appendChild(link(buildHash('brief', brief.id), brief.date));
    }
    li.appendChild(el('span', 'lib-res-meta', ` · ${brief.items.length} 条`));
    ul.appendChild(li);
  }
  box.appendChild(ul);
  box.appendChild(
    el('p', 'lib-muted', '仅列出实际产出的工作日；未列出的日期当日没有产出简报。每日产出靠手动运行工作流更新，不是自动抓取。'),
  );
  return box;
}

function renderNotFound(container, rawHash) {
  const page = el('div', 'lib-page');
  container.appendChild(page);
  page.appendChild(el('h2', null, '地址未找到'));
  page.appendChild(el('p', 'lib-intro', `无法解析的地址：${rawHash === '' ? '（空）' : rawHash}。`));
  page.appendChild(link('#/home', '返回首页', 'lib-btn'));
}

// ---------- 骨架 ----------

function setNav(view) {
  const active = NAV_ACTIVE_BY_VIEW[view] ?? 'home';
  document.querySelectorAll('.lib-nav-link').forEach((a) => {
    if (a.dataset.libNav === active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function renderSidebarQuick() {
  const box = document.getElementById('lib-quick');
  if (!box || box.dataset.rendered === 'true') return;
  box.dataset.rendered = 'true';
  const group = el('details', 'lib-quick-group');
  group.open = true;
  group.appendChild(el('summary', 'lib-quick-title', '方向入口'));
  const directions = sortDirections(LIBRARY);
  if (directions.length === 0) group.appendChild(el('p', 'lib-quick-empty', '方向尚未接入。'));
  for (const direction of directions) {
    const a = link(buildHash('route', direction.id), '', 'lib-quick-link');
    a.appendChild(el('span', 'lib-quick-num', String(direction.order ?? '·')));
    a.appendChild(document.createTextNode(direction.title));
    group.appendChild(a);
  }
  box.appendChild(group);
}

function renderFooterOnce() {
  const footer = document.getElementById('lib-notices');
  if (!footer || footer.dataset.rendered === 'true') return;
  footer.dataset.rendered = 'true';
  const details = el('details', 'lib-about');
  details.appendChild(el('summary', null, '关于内容与来源'));
  for (const notice of LIBRARY.meta?.notices ?? []) details.appendChild(el('p', null, notice));
  footer.appendChild(details);
}

function renderApp() {
  const container = document.getElementById('lib-view');
  if (!container) return;
  const raw = window.location.hash;
  const parsed = parseHash(raw);
  container.textContent = '';
  renderFooterOnce();
  renderSidebarQuick();
  if (!parsed) {
    setNav('home');
    renderNotFound(container, String(raw ?? ''));
    return;
  }
  setNav(parsed.view);
  switch (parsed.view) {
    case 'home':
      renderHome(container);
      break;
    case 'directions':
      renderDirections(container);
      break;
    case 'route':
      renderRoute(container, parsed.id);
      break;
    case 'papers':
      renderPapers(container);
      break;
    case 'paper':
      renderPaper(container, parsed.id);
      break;
    case 'learn':
      renderLearn(container);
      break;
    case 'learnRoute':
      renderLearn(container, parsed.id);
      break;
    case 'brief':
      renderBrief(container);
      break;
    case 'briefItem':
      renderBrief(container, parsed.id);
      break;
    case 'foundations':
      renderFoundations(container);
      break;
    default:
      renderNotFound(container, String(raw ?? ''));
  }
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  v3Init();
  window.addEventListener('hashchange', renderApp);
  renderApp();
}
