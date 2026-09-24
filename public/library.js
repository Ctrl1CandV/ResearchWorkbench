// public/library.js —— 个人研究平台渲染与路由（契约见 docs/SPEC.md、docs/DESIGN.md；
// 演进记录见 docs/HISTORY.md）。
// 约束：
// - 动态文本一律 textContent / createTextNode，禁止 innerHTML 等注入面；
// - 外部链接必须经 safeExternalHref（仅 https），否则降级为纯文本提示，不产生可点链接；
// - 站内导航只用 hash（#/...），可直达 home/route/paper/learn/brief/foundations；页内目录用按钮 +
//   scrollIntoView，从不改写 location.hash，避免与 hash 路由冲突；
// - 本人记录只经 notes.js 读写独立键 research-workbench:v3，绝不读写 v1/v2 旧版记录；
// - “近期登记发现”仅在用户点击主题时请求同源 /api/discover；动态条目不进入内容库、不写入任何记录；
// - 内容静态来自 library-content.js（REWORK-007 后由 public/content/ 数据模块聚合）；集合为空时显示明确空态；
// - 阅读动线优先于功能入口（REWORK-007 §1）：论文页正文在前、"我的记录"在正文之后、"来源与覆盖"收尾；
//   精选页简报与历史索引在前、"近期登记发现"在后；首页区序按每日回访价值排序（精选→论文→方向→技术→经典）；
// - 标签不渲染为 chip（REWORK-007 §3）：一律" · "连接的纯文本 meta 行；entry 长句只在论文页页眉完整出现；
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
// DYNAMIC-GUIDANCE-009 / C 包：导学提案闭环（public/guidance.js）。渲染层对生效值与覆盖层的
// 一切读取都经这里注入的接缝（currentGuidanceOverlay / computeEffective），不做第二存储键。
import {
  EXAMPLE_BANNER_TEXT,
  FIELD_LABELS,
  GUIDANCE_KEY,
  ORIGIN_SOURCE_LABELS,
  adjustLabel,
  applyProposal,
  canUndo,
  canonicalBaseline,
  compareImport,
  computeEffective as guidanceComputeEffective,
  currentOverlay,
  exportOverlayText,
  importReplaceOverlay,
  loadOverlay,
  overlayEntry,
  parseImportedOverlay,
  readProposalFileText,
  resetCorruptOverlay,
  resetOverlay,
  targetLabel,
  undoLastApply,
  validateProposal,
} from './guidance.js';

// 渲染数据源：renderBase 是基线（真实 LIBRARY 或测试 fixture），renderLibrary 是每轮渲染前
// 由 computeEffective(renderBase, 覆盖层) 算出的生效库（C 包；无覆盖层时与基线同一引用）。
let renderBase = LIBRARY;
let renderLibrary = LIBRARY;
export function __setRenderLibrary(lib) {
  renderBase = lib && typeof lib === 'object' ? lib : LIBRARY;
  renderLibrary = renderBase;
}

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
  materials: '导读材料尚未接入：站内编辑说明与博客导读按实际核查进度上线，不用占位内容凑数。',
  technicalRoutes: '技术学习路线尚未接入：教程需真实可靠来源，并标明先后顺序、核查层次与掌握标准。',
  briefs: '精选简报尚未发布：第一期简报将注明整理日期、来源与覆盖范围，不会用占位内容充数。',
  routeEmpty: '该方向的阅读路线尚未接入；来源核查完成前不提供论文条目，不编造文献。',
  startRouteEmpty: '起步路线尚未接入：来源核查完成后按「从这里开始」给出有序节点，当前不提供占位内容。',
  learnCore: '必学主干尚未接入：需先核验每条的章节与访问条件，未核验的不混入可开始资源。',
});

const NAV_ACTIVE_BY_VIEW = Object.freeze({
  home: 'home',
  // B 包：领域地图从首页首屏「打开地图」进入，归首页导航（导航保持六入口，DESIGN 不变）。
  map: 'home',
  // C 包：导学调整页同理归首页项（不新增侧栏入口，保持导航六项）。
  guidance: 'home',
  directions: 'directions',
  route: 'directions',
  papers: 'papers',
  paper: 'papers',
  // 03 §6：材料详情带路线上下文时归方向导航激活项；独立打开归论文项（渲染层按 ctx 覆盖）。
  material: 'papers',
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
// SCAFFOLD-008：新增「建立概念」作为起步第一阶段；旧步骤的 stage 值仍合法。
export const STAGE_ORDER = Object.freeze(['建立概念', '建立问题', '理解方法', '看评价与反例', '核查近期竞争']);

// SCAFFOLD-008（008.1）：起步路线 / 材料 / track 导航的固定文案与枚举。
export const PASS_MODE_LABELS = Object.freeze({ map: '地图浏览', core: '读核心', deep: '精读' });

export const TRACK_LABELS = Object.freeze({ start: '从这里开始', archive: '完整谱系（初期不必走）' });

export const NODE_KIND_LABELS = Object.freeze({ paper: '论文', article: '材料', unit: '技术单元', external: '外链目录' });

export const MATERIAL_FORMAT_LABELS = Object.freeze({
  blog: '博客导读',
  docs: '官方文档',
  tutorial: '教程',
  video: '视频',
  primer: '站内方法说明',
});

export const MATERIAL_COVERAGE_LABELS = Object.freeze({
  'web-page': '已核网页正文',
  'partial-text': '正文选读',
  'editorial-primer': '站内编辑说明',
  identity: '身份待核',
});

// ---------- DYNAMIC-GUIDANCE-009 / B 包：地图渲染常量（语义与来源词表，R1/R4） ----------
// meaning 固定五值词汇（R1）；显示为中文标签，边原文仍保留在数据里。
export const MAP_MEANING_LABELS = Object.freeze({
  addresses: '回应（方法→问题）',
  'variant-of': '变体',
  conflicts: '与直觉相抵',
  'depends-on': '依赖',
  inspires: '启发',
});
// source.originType 封闭枚举 → 中文标签（仅 UI 映射，与提案 origin.sourceType 同一词表，R1/R4）。
export const MAP_ORIGIN_LABELS = Object.freeze({
  content: '内容条目（站内已核）',
  advisor: '导师转述',
  ai: 'AI 建议',
  self: '本人陈述',
});
export const MAP_SIDE_LABELS = Object.freeze({ problem: 'Agent 研究对象／问题', method: '方法／解决思想' });
// 边两端的简短侧别标签：一律由 node.side 派生，绝不假设"from=方法、to=问题"
// （depends-on 等关系可能两端同侧，硬标会错——B 包审查项）。
const MAP_SIDE_SHORT = Object.freeze({ problem: '问题', method: '方法' });
function mapSideLabel(node) {
  return node && MAP_SIDE_SHORT[node.side] ? MAP_SIDE_SHORT[node.side] : '节点';
}
// 页面级来源声明（B 包固定文案；关系≠引用）。
export const MAP_PROVENANCE_NOTE =
  '实线表示有来源支持的知识关系，虚线表示建议阅读顺序；建议顺序是阅读指引，不是论文引用。';
// 个人进度缺失的显式声明（不显示任何已读/进度；R2「没有个人记录时不暗示已读」）。
export const MAP_NO_PROGRESS_NOTE =
  '地图与关系不记录、也不显示任何人的阅读进度或已读状态：这里只有认识结构与来源，打开本页不改变任何本人标记。';
// 未复核来源状态的显式呈现（R7）：通用规则；具体"哪个 active 方向未入图"由 renderMap 按当前数据派生，
// 不把条目名写死在此（避免数据变化后文案变陈旧——B 包审查项：source pinning）。
export const MAP_UNREVIEWED_NOTE =
  '未连接的开放问题只作为问题文字呈现，不画线、不暗示连接：只有来源核查为「保留可用」的条目才进入节点与连线。';
// 覆盖层尚未接入前的基线范围声明（含核查日期锚点，随内容工作刷新）。
export const MAP_BASELINE_SCOPE_NOTE =
  '地图只纳入已有依据支持的内容；证据不足的方向与关系暂不画入图中。';

// PLAN-011：内部契约词（如 PF-07 编号）保留在数据字段与测试断言中，不进入读者可见文本；
// 渲染时从来源注记里剥离。仅做精确短串剥离，不改写数据本身（009 地图数据契约不降级）。
function readerSourceNote(note) {
  return String(note ?? '')
    .replace(/（PF-07）/g, '')
    .replace(/\(PF-07\)/g, '')
    .replace(/20\d{2}-\d{2}-\d{2}/g, '')
    .replace(/\s*[；，、]\s*[；，、]/g, '；')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// 多智能体贯通教材的唯一允许路径与章节标识（04 §2.1；labPath 仅允许这个精确值）。
export const MULTIAGENT_LAB_PATH = '/learning/multiagent-lab.md';
export const MULTIAGENT_LAB_SECTIONS = Object.freeze(['ma-u1', 'ma-u2', 'ma-u3', 'ma-u4']);

// 论文章节标题唯一来源：目录与正文必须用同一份描述，避免两处文案漂移。
export const PAPER_SECTION_TITLES = Object.freeze({
  deep: Object.freeze({
    overview: '这篇解决什么',
    prereq: '读之前需要知道',
    deepRead: '值得细读的段落',
    references: '相关文献',
    openQuestions: '局限与待核问题',
    questions: '读完后自查',
    next: '延伸阅读',
  }),
  standard: Object.freeze({
    reasons: '为什么读这篇',
    deepRead: '值得细读的段落',
    questions: '读完后自查',
    next: '延伸阅读',
  }),
  quick: Object.freeze({
    reasons: '为什么留意这篇',
    questions: '取全文时先核对',
    next: '延伸阅读',
  }),
  entry: Object.freeze({
    reasons: '它在路线里的角色',
    next: '延伸阅读',
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
// '#/foundations' 列表页；'#/route/<id>'、'#/paper/<id>'、'#/material/<id>'、'#/learn/<id>'、'#/brief/<id>'
// 直达；其他一律 null。
// SCAFFOLD-008：hash 内部允许 ?route=<方向>&track=start|archive（paper/material/learn 详情）与
// ?unit=<单元id>（仅 learn 详情，可单独使用）；重复/未知参数、route/track 不成对、错误 track、
// 非 learn 带 unit、列表或方向页带这些参数均返回无效路由。无 query 时返回形状与旧版完全一致。
export function parseHash(raw) {
  if (raw === undefined || raw === null) return { view: 'home', id: null };
  const s = String(raw);
  if (s === '' || s === '#' || s === '#/') return { view: 'home', id: null };
  if (!s.startsWith('#/')) return null;
  const qIndex = s.indexOf('?');
  const path = qIndex === -1 ? s : s.slice(0, qIndex);
  const queryString = qIndex === -1 ? null : s.slice(qIndex + 1);
  const parts = path
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
  const listViews = ['home', 'map', 'guidance', 'directions', 'papers', 'learn', 'brief', 'foundations'];
  let parsed = null;
  if (parts.length === 1 && listViews.includes(view)) {
    parsed = { view, id: null };
  } else if (
    parts.length === 2 &&
    (view === 'route' || view === 'paper' || view === 'material' || view === 'learn' || view === 'brief')
  ) {
    const mapped = view === 'learn' ? 'learnRoute' : view === 'brief' ? 'briefItem' : view;
    parsed = { view: mapped, id };
  }
  if (!parsed) return null;
  if (queryString === null) return parsed;
  const ctx = parseHashQuery(queryString, parsed.view);
  if (!ctx) return null;
  return { ...parsed, ...ctx };
}

// hash 内 query 白名单：仅 route/track/unit；规则见 03 §5。
function parseHashQuery(qs, view) {
  if (qs === '') return null;
  const out = {};
  const seen = new Set();
  for (const pair of qs.split('&')) {
    const eq = pair.indexOf('=');
    if (eq <= 0) return null;
    const key = pair.slice(0, eq);
    const rawValue = pair.slice(eq + 1);
    if (!['route', 'track', 'unit', 'node', 'path', 'layout', 'y'].includes(key) || seen.has(key)) return null;
    seen.add(key);
    let value;
    try {
      value = decodeURIComponent(rawValue);
    } catch {
      return null;
    }
    if (value === '' || value === '.' || value === '..') return null;
    if (key === 'route') out.routeId = value;
    else if (key === 'unit') out.unitId = value;
    else if (key === 'track') out.track = value;
    else if (key === 'node') out.mapNodeId = value;
    else if (key === 'path') out.mapPathId = value;
    else if (key === 'layout') out.mapLayout = value;
    else out.mapScrollY = value;
  }
  const detailViews = ['paper', 'material', 'learnRoute'];
  const hasMapContext = ['mapNodeId', 'mapPathId', 'mapLayout', 'mapScrollY'].some((key) => out[key] !== undefined);
  if (hasMapContext && view !== 'map') return null;
  if (out.mapLayout !== undefined && !['map', 'list'].includes(out.mapLayout)) return null;
  if (out.mapScrollY !== undefined && !/^\d{1,7}$/.test(out.mapScrollY)) return null;
  if (out.unitId !== undefined && view !== 'learnRoute') return null;
  if ((out.routeId !== undefined || out.track !== undefined) && !detailViews.includes(view)) return null;
  if (out.routeId !== undefined && out.track === undefined) return null;
  if (out.track !== undefined && out.routeId === undefined) return null;
  if (out.track !== undefined && !['start', 'archive'].includes(out.track)) return null;
  if (view === 'learnRoute' && out.unitId === undefined && (out.routeId !== undefined || out.track !== undefined)) {
    return null;
  }
  return out;
}

// 与 parseHash 互逆：id 一律 encodeURIComponent，避免 '/', '?', '#' 破坏路由。
export function buildHash(view, id = null) {
  if (id === null || id === undefined) return `#/${view}`;
  return `#/${view}/${encodeURIComponent(String(id))}`;
}

// 带路线上下文的详情 hash（03 §5）：route/track 成对附加；unit 可单独使用。
export function buildContextHash(view, id, ctx = {}) {
  const base = buildHash(view, id);
  const params = [];
  if (ctx.routeId && ctx.track) {
    params.push(`route=${encodeURIComponent(ctx.routeId)}`, `track=${encodeURIComponent(ctx.track)}`);
  }
  if (ctx.unitId) params.push(`unit=${encodeURIComponent(ctx.unitId)}`);
  return params.length > 0 ? `${base}?${params.join('&')}` : base;
}

export function getDirection(lib, id) {
  return lib.directions.find((d) => d.id === id) ?? null;
}

export function getPaper(lib, id) {
  return lib.papers.find((p) => p.id === id) ?? null;
}

export function getMaterial(lib, id) {
  return (lib.materials ?? []).find((m) => m.id === id) ?? null;
}

// 技术路线解析：先精确匹配现有 id；找不到时才把旧 tech-t4 显式别名为 tech-rag（04 §1）。
export function getTechnicalRoute(lib, id) {
  const found = lib.technicalRoutes.find((t) => t.id === id) ?? null;
  if (found) return found;
  if (id === 'tech-t4') return lib.technicalRoutes.find((t) => t.id === 'tech-rag') ?? null;
  return null;
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

// 方向状态：旧数据缺省按 active 读取（05 §2 兼容层）。
export function directionStatusOf(direction) {
  return direction?.status === 'deferred' ? 'deferred' : 'active';
}

// 默认入口（首页、方向列表、侧栏）只列 active；routesContaining 不过滤，保留 archive 关联（03 §5.6）。
export function activeDirections(lib) {
  return sortDirections(lib).filter((d) => directionStatusOf(d) === 'active');
}

// quick 依据的共同文案（03 §1 / 05 §3）：核过指定正文的 quick 不再称“仅摘要”；
// 有正文不自动升 standard。列表、卡页、路线与 notices 共用此函数。
export function depthBasisLabel(paper) {
  const depth = deliveredDepthOf(paper);
  if (depth === 'quick') {
    return paper?.coverage?.mode === 'partial-text' ? '简读卡 · 摘要及指定正文已核' : DEPTH_LABELS.quick;
  }
  return DEPTH_LABELS[depth] ?? depth;
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

// 一篇论文在哪些方向路线中出现（含序位、track 与上一篇/下一篇），用于论文页侧栏。
// SCAFFOLD-008：返回项携带 track；旧数据只有 start（legacy 回退），新数据含 archive 关联（A08）。
export function routesContaining(lib, paperId) {
  return targetPositions(lib, { kind: 'paper', paperId });
}

// 任意 NodeTarget 在各方向 start/archive 轨道中的位置（paper 与 material 均适用，03 §5）。
export function targetPositions(lib, target) {
  const key = nodeTargetKey(target);
  if (!key) return [];
  return sortDirections(lib).flatMap((direction) => {
    const tracks = directionTracks(lib, direction);
    const out = [];
    const collect = (entries, track) => {
      const i = entries.findIndex((e) => !e.external && nodeTargetKey(e.target) === key);
      if (i === -1) return;
      out.push({
        direction,
        track,
        index: i + 1,
        total: entries.length,
        prev: entries[i - 1] ?? null,
        next: entries[i + 1] ?? null,
      });
    };
    collect(tracks.start, 'start');
    if (tracks.mode === 'tracks') collect(tracks.archive, 'archive');
    return out;
  });
}

// ---------- SCAFFOLD-008（008.1）：NodeTarget、双轨路线与 track 导航 ----------

const NODE_TARGET_KINDS = ['paper', 'article', 'unit'];

// NodeTarget 判别联合（03 §3）：恰好一个外键，kind 与键一致，unitRef 含 routeId+unitId。
export function nodeTargetError(target) {
  if (!target || typeof target !== 'object') return '目标必须是对象';
  const { kind, paperId, materialId, unitRef } = target;
  if (!NODE_TARGET_KINDS.includes(kind)) return `目标 kind 必须是 ${NODE_TARGET_KINDS.join('|')}：${kind}`;
  const keys = [paperId, materialId, unitRef].filter((v) => v !== undefined && v !== null);
  if (keys.length !== 1) return '目标必须恰好填写 paperId / materialId / unitRef 之一';
  if (kind === 'paper' && (typeof paperId !== 'string' || paperId.trim() === '')) return 'paper 目标需要非空 paperId';
  if (kind === 'article' && (typeof materialId !== 'string' || materialId.trim() === '')) {
    return 'article 目标需要非空 materialId';
  }
  if (kind === 'unit') {
    if (!unitRef || typeof unitRef !== 'object') return 'unit 目标需要 unitRef 对象';
    if (typeof unitRef.routeId !== 'string' || unitRef.routeId.trim() === '') return 'unitRef.routeId 必须是非空字符串';
    if (typeof unitRef.unitId !== 'string' || unitRef.unitId.trim() === '') return 'unitRef.unitId 必须是非空字符串';
  }
  return null;
}

export function nodeTargetKey(target) {
  if (target?.kind === 'paper') return `paper:${target.paperId}`;
  if (target?.kind === 'article') return `article:${target.materialId}`;
  if (target?.kind === 'unit') return `unit:${target.unitRef?.routeId}/${target.unitRef?.unitId}`;
  return null;
}

// 统一目标解析（03 §4）：首页、路线、前后节点、unit 链接共用；目标不存在返回 null。
// 旧 paper 专用读取（getPaper）不得接 materialId——材料目标经此函数或 getMaterial 解析。
export function resolveNodeTarget(lib, target) {
  if (nodeTargetError(target)) return null;
  if (target.kind === 'paper') {
    const paper = getPaper(lib, target.paperId);
    if (!paper) return null;
    return {
      kind: 'paper',
      title: paper.displayTitle || paper.title,
      href: buildHash('paper', paper.id),
      availability: 'ready',
      depthLabel: depthBasisLabel(paper),
      lead: paper.lead ?? null,
    };
  }
  if (target.kind === 'article') {
    const material = getMaterial(lib, target.materialId);
    if (!material) return null;
    const pending = material.coverage?.mode === 'identity' || material.availability === 'pending';
    return {
      kind: 'article',
      title: material.title,
      href: buildHash('material', material.id),
      availability: pending ? 'pending' : 'ready',
      pendingReason: pending ? material.pendingReason ?? material.coverage?.limitations ?? '来源待核' : null,
      formatLabel: MATERIAL_FORMAT_LABELS[material.format] ?? material.format ?? '材料',
      lead: material.lead ?? null,
    };
  }
  const route = getTechnicalRoute(lib, target.unitRef.routeId);
  const unit = (route?.units ?? []).find((u) => u.id === target.unitRef.unitId) ?? null;
  if (!route || !unit) return null;
  const availability = unit.availability === 'pending' ? 'pending' : 'ready';
  return {
    kind: 'unit',
    title: `${route.title} · ${unit.title}`,
    href: `${buildHash('learn', route.id)}?unit=${encodeURIComponent(unit.id)}`,
    availability,
    pendingReason: availability === 'pending' ? unit.pendingReason ?? null : null,
    lead: unit.goal ?? null,
  };
}

function legacyStep(lib, step, i) {
  const paper = getPaper(lib, step?.paperId);
  return {
    id: `legacy-${i + 1}`,
    index: i + 1,
    kind: 'paper',
    external: false,
    target: { kind: 'paper', paperId: step?.paperId },
    paperId: step?.paperId,
    materialId: undefined,
    unitRef: undefined,
    stage: step?.stage ?? null,
    required: step?.required ?? null,
    passMode: null,
    purpose: step?.purpose ?? null,
    readWhen: step?.readWhen ?? null,
    check: step?.check ?? null,
    availability: 'ready',
    pendingReason: null,
    nextAction: null,
    paper,
    resolved: paper ? resolveNodeTarget(lib, { kind: 'paper', paperId: step.paperId }) : null,
  };
}

function normalizeStep(lib, step, i) {
  if (step?.kind === 'external') {
    return {
      id: step?.id,
      index: i + 1,
      kind: 'external',
      external: true,
      target: null,
      title: step?.title,
      url: step?.url ?? null,
      role: step?.role ?? null,
      note: step?.note ?? null,
      availability: step?.availability === 'pending' ? 'pending' : 'ready',
      pendingReason: step?.pendingReason ?? null,
      checkedAt: step?.checkedAt ?? null,
      resolved: null,
    };
  }
  const target = { kind: step?.kind, paperId: step?.paperId, materialId: step?.materialId, unitRef: step?.unitRef };
  const availability = step?.availability === 'pending' ? 'pending' : 'ready';
  return {
    id: step?.id,
    index: i + 1,
    kind: step?.kind,
    // C 包（R6）：覆盖层插入/调整的条目持久携带 example 标记，渲染与首页推导都要看到它。
    ...(step?.example === true ? { example: true } : {}),
    external: false,
    target,
    paperId: step?.paperId,
    materialId: step?.materialId,
    unitRef: step?.unitRef,
    stage: step?.stage ?? null,
    required: step?.required ?? null,
    passMode: step?.passMode ?? null,
    purpose: step?.purpose ?? null,
    readWhen: step?.readWhen ?? null,
    check: step?.check ?? null,
    availability,
    pendingReason: availability === 'pending' ? step?.pendingReason ?? null : null,
    nextAction: step?.nextAction ?? null,
    paper: step?.kind === 'paper' ? getPaper(lib, step?.paperId) : null,
    resolved: resolveNodeTarget(lib, target),
  };
}

// 方向的双轨读取（01/03）：新数据以 startRoute/archiveRoute 为权威，旧 route 只读回退（05 §2）。
// 返回 { mode: 'tracks'|'legacy', start: [...], archive: [...] }；元素为规范化 step（含解析后的目标）。
export function directionTracks(lib, direction) {
  if (!direction) return { mode: 'none', start: [], archive: [] };
  const hasNew = Array.isArray(direction.startRoute) || Array.isArray(direction.archiveRoute);
  if (!hasNew) {
    return { mode: 'legacy', start: (direction.route ?? []).map((step, i) => legacyStep(lib, step, i)), archive: [] };
  }
  const norm = (track) => (Array.isArray(track) ? track.map((step, i) => normalizeStep(lib, step, i)) : []);
  return { mode: 'tracks', start: norm(direction.startRoute), archive: norm(direction.archiveRoute) };
}

export function trackEntries(lib, directionId, track) {
  if (!['start', 'archive'].includes(track)) return [];
  const direction = getDirection(lib, directionId);
  if (!direction) return [];
  const tracks = directionTracks(lib, direction);
  return track === 'start' ? tracks.start : tracks.archive;
}

// 目标在某方向指定 track 内的序位（前后节点导航，03 §5）；不是成员返回 null。
export function trackPosition(lib, directionId, track, target) {
  const key = nodeTargetKey(target);
  if (!key) return null;
  const entries = trackEntries(lib, directionId, track);
  const i = entries.findIndex((e) => !e.external && nodeTargetKey(e.target) === key);
  if (i === -1) return null;
  return {
    direction: getDirection(lib, directionId),
    track,
    index: i + 1,
    total: entries.length,
    step: entries[i],
    prev: entries[i - 1] ?? null,
    next: entries[i + 1] ?? null,
  };
}

// 无 query 的旧链接：目标唯一属于某 active startRoute 时推导起步上下文（03 §5.2）；
// 否则返回 null，由渲染层只给“返回相关路线”，不擅自选 archive 顺序。
export function inferStartContext(lib, target) {
  const key = nodeTargetKey(target);
  if (!key) return null;
  const matches = activeDirections(lib).filter((direction) =>
    trackEntries(lib, direction.id, 'start').some((e) => !e.external && nodeTargetKey(e.target) === key),
  );
  return matches.length === 1 ? { routeId: matches[0].id, track: 'start' } : null;
}

// 技术路线 featured 集合（04 §1）；旧数据没有 featured 时返回 []，页面继续旧布局。
export function featuredTechnicalRoutes(lib) {
  return [...lib.technicalRoutes]
    .filter((r) => r.kind === 'featured')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

// 库外条目的短显示标签（REWORK-007 附带整理）：arXiv abs 链接显示编号，避免裸长 URL 当标题；
// 其它链接回退完整 source 文案。链接目标不变，仅改可见文字。
export function briefSourceLabel(item, href) {
  const raw = href || item?.source || '';
  const m = /^https?:\/\/arxiv\.org\/abs\/([^#?/]+)(?:[/?#].*)?$/i.exec(raw);
  if (m) return `arXiv:${m[1]}`;
  return item?.source ?? '';
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
  // 深度徽章文案统一走 depthBasisLabel（03 §1）：核过指定正文的 quick 不再显示“仅摘要”。
  if (depth) badges.push({ text: depthBasisLabel(paper), kind: depth });
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
  if (c.basis) rows.push(['来源', readerSourceNote(c.basis)]);
  if (Array.isArray(c.sections) && c.sections.length > 0) rows.push(['实际覆盖', c.sections.join('；')]);
  if (c.limitations) rows.push(['未覆盖', c.limitations]);
  return rows;
}

function paperPublicationLabel(paper) {
  const version = String(paper?.coverage?.version ?? '');
  const arxiv = version.match(/arXiv:(\d{4})\.\d{4,5}/i) ?? String(paper?.url ?? '').match(/arxiv\.org\/(?:abs|pdf)\/(\d{4})\.\d{4,5}/i);
  const uncertainVenue = /外部检索指向|未在.*确认|待核/.test(version);
  const venue = !uncertainVenue
    ? version.match(/(Findings of ACL|ACM Computing Surveys|NeurIPS|ICLR|ICML|EMNLP|NAACL|AAAI|IJCAI|CVPR|ICCV|TSE|TOSEM|TOIS|EMSE|TPAMI|Nature|KDD|COLM|ICSE|ISSTA|FCS)\s*(20\d{2})/i)
    : null;
  if (venue) return `发表版本：${venue[1]} ${venue[2]}`;
  if (arxiv) {
    const date = version.match(/v1\s+(\d{4}-\d{2}-\d{2})/);
    if (date) return `arXiv 首次提交：${date[1]}`;
    const id = version.match(/arXiv:(\d{2})(\d{2})\.\d{4,5}/i) ?? String(paper?.url ?? '').match(/arxiv\.org\/(?:abs|pdf)\/(\d{2})(\d{2})\.\d{4,5}/i);
    if (id) {
      const year = Number(id[1]) >= 90 ? 1900 + Number(id[1]) : 2000 + Number(id[1]);
      return `arXiv 首次提交：${year}-${id[2]}`;
    }
  }
  if (!version || /外部检索指向|未在.*确认|待核/.test(version)) return '';
  const year = version.match(/\b((?:19|20)\d{2})\b/);
  return year ? `发表年份：${year[1]}` : '';
}

// 各集合数量与空态；空集合必须走 EMPTY_NOTICES 的明确文案。
export function libraryStatus(lib) {
  const counts = {
    directions: lib.directions.length,
    papers: lib.papers.length,
    materials: (lib.materials ?? []).length,
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

  // readingActions（03 §2）：Preserve/Explain/Skip 的 target、why 非空；Explain 必须 blocks 与
  // sectionId 二选一（sectionId 必须引用本卡实际渲染的正文 section）；entry 不得有内容性动作。
  function validateReadingActions(at, item, sections, forbidContent) {
    const ra = item?.readingActions;
    if (ra == null) return;
    if (typeof ra !== 'object' || isArr(ra)) {
      push(`${at} readingActions 必须是对象`);
      return;
    }
    for (const listName of ['preserve', 'explain', 'skip']) {
      const list = ra[listName];
      if (list == null) continue;
      if (forbidContent && isArr(list) && list.length > 0) {
        push(`${at} entry 不得有内容性动作（readingActions.${listName}）`);
        continue;
      }
      if (!isArr(list)) {
        push(`${at} readingActions.${listName} 必须是数组`);
        continue;
      }
      list.forEach((act, j) => {
        const aat = `${at} readingActions.${listName}[${j}]`;
        if (!isStr(act?.target)) push(`${aat} 缺少 target`);
        if (!isStr(act?.why)) push(`${aat} 缺少 why`);
        if (listName !== 'explain') return;
        const hasBlocks = act?.blocks != null;
        const hasSection = act?.sectionId != null;
        if (hasBlocks && hasSection) push(`${aat} blocks 与 sectionId 只能二选一`);
        if (!hasBlocks && !hasSection) push(`${aat} 必须提供非空 blocks 或有效 sectionId 之一（只有 target/why 不算讲解）`);
        if (hasBlocks) {
          if (!isArr(act.blocks) || act.blocks.length === 0) push(`${aat} blocks 必须是非空数组`);
          else validateBlocks(`${aat}.blocks`, act.blocks);
        }
        if (hasSection) {
          if (!isStr(act.sectionId)) push(`${aat} sectionId 必须是字符串`);
          else if (!sections.some((s) => s?.id === act.sectionId)) {
            push(`${aat} sectionId 引用了本卡不渲染的正文 section：${act.sectionId}`);
          }
        }
      });
    }
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
      // 008.1 §2C：quick 允许 abstract（仅摘要）或 partial-text（摘要+指定正文已核）；
      // partial-text 的 quick 必须在 coverage.sections 登记实际读取范围。
      if (depth === 'quick' && !['abstract', 'partial-text'].includes(mode)) {
        push(`${at} quick 的 coverage.mode 应为 abstract|partial-text：${mode}`);
      }
      if (depth === 'quick' && mode === 'partial-text' && (!isArr(coverage.sections) || coverage.sections.length === 0)) {
        push(`${at} quick（partial-text）必须在 coverage.sections 登记已核正文范围`);
      }
      if (depth === 'entry' && mode !== 'metadata') push(`${at} entry 的 coverage.mode 应为 metadata：${mode}`);
    }
    // 起步卡三问（03 §1）：learner 三字段全非空；与 lead 重复内容只显示一次是渲染层职责。
    if (paper.learner != null) {
      if (typeof paper.learner !== 'object') push(`${at} learner 必须是对象`);
      else {
        for (const field of ['gist', 'value', 'intent']) {
          if (!isStr(paper.learner[field])) push(`${at} learner 缺少 ${field}`);
        }
      }
    }
    validateReadingActions(at, paper, paper.sections ?? [], depth === 'entry');
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

  // ---------- materials（SCAFFOLD-008；缺 materials 视为 []，旧库无此集合） ----------
  const materialIds = new Set();
  (lib.materials ?? []).forEach((material, i) => {
    const at = `materials[${i}]`;
    if (!isStr(material.id)) push(`${at} 缺少 id`);
    else if (materialIds.has(material.id)) push(`${at} id 重复：${material.id}`);
    else if (paperIds.has(material.id)) push(`${at} 材料 id 与论文 id 重名：${material.id}`);
    else materialIds.add(material.id);
    if (!isStr(material.title)) push(`${at} 缺少 title`);
    if (!['blog', 'docs', 'tutorial', 'video', 'primer'].includes(material.format)) {
      push(`${at} format 必须是 blog|docs|tutorial|video|primer：${material.format}`);
    }
    // primer 可空 url；其他类型必须 https。
    if (material.format !== 'primer' && !safeExternalHref(material.url)) {
      push(`${at} url 必须是 https：${material.url}`);
    }
    if (material.format === 'primer' && material.url != null && !safeExternalHref(material.url)) {
      push(`${at} primer 的 url 必须是 https：${material.url}`);
    }
    const mcoverage = material.coverage;
    if (!mcoverage || typeof mcoverage !== 'object') {
      push(`${at} 缺少 coverage`);
    } else {
      if (!['web-page', 'partial-text', 'editorial-primer', 'identity'].includes(mcoverage.mode)) {
        push(`${at} coverage.mode 必须是 web-page|partial-text|editorial-primer|identity：${mcoverage.mode}`);
      }
      for (const field of ['basis', 'version', 'limitations', 'checkedAt']) {
        if (!isStr(mcoverage[field])) push(`${at} coverage 缺少 ${field}`);
      }
      if (!isArr(mcoverage.sections) || !mcoverage.sections.every(isStr)) {
        push(`${at} coverage.sections 必须是字符串数组`);
      }
      if (material.format === 'primer' && mcoverage.mode !== 'editorial-primer') {
        push(`${at} primer 的 coverage.mode 应为 editorial-primer`);
      }
      // identity 仅用于 pending 材料，不发布内容判断。
      if (mcoverage.mode === 'identity') {
        if (material.availability !== 'pending') push(`${at} identity 材料必须 availability=pending`);
        if ((material.body?.blocks ?? []).length > 0) push(`${at} identity 材料不得携带正文 body`);
        if ((material.sections ?? []).length > 0) push(`${at} identity 材料不得携带 sections`);
        if (['preserve', 'explain', 'skip'].some((k) => (material.readingActions?.[k] ?? []).length > 0)) {
          push(`${at} identity 材料不得携带 readingActions`);
        }
      }
    }
    if (material.availability != null && !['ready', 'pending'].includes(material.availability)) {
      push(`${at} availability 必须是 ready|pending：${material.availability}`);
    }
    if (material.availability === 'pending' && !isStr(material.pendingReason)) {
      push(`${at} pending 材料必须提供 pendingReason`);
    }
    if (!isStr(material.lead)) push(`${at} 缺少 lead`);
    if (mcoverage?.mode !== 'identity') {
      if (!material.learner || typeof material.learner !== 'object') {
        push(`${at} 非 identity 材料必须有 learner 三问`);
      } else {
        for (const field of ['gist', 'value', 'intent']) {
          if (!isStr(material.learner[field])) push(`${at} learner 缺少 ${field}`);
        }
      }
    }
    validateReadingActions(at, material, material.sections ?? [], false);
    if (material.format === 'primer') {
      if (!material.body || !isArr(material.body.blocks) || material.body.blocks.length === 0) {
        push(`${at} primer 必须有非空 body.blocks`);
      }
    }
    validateBlocks(`${at}.body.blocks`, material.body?.blocks ?? []);
    if (!isArr(material.sections)) {
      if (material.sections != null) push(`${at} sections 必须是数组`);
    } else {
      material.sections.forEach((section, j) => {
        if (!isStr(section?.id)) push(`${at} sections[${j}] 缺少 id（用于锚点）`);
        if (!isStr(section?.heading)) push(`${at} sections[${j}] 缺少 heading`);
        validateBlocks(`${at} sections[${j}].blocks`, section?.blocks ?? []);
      });
    }
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

    const hasTracks = Array.isArray(direction.startRoute) || Array.isArray(direction.archiveRoute);
    if (hasTracks) {
      // 新数据：startRoute/archiveRoute 权威；route 与之同时存在即失败；status 必须显式。
      if (direction.route != null) push(`${at} route 不得与 startRoute/archiveRoute 同时存在`);
      if (!['active', 'deferred'].includes(direction.status)) {
        push(`${at} 新数据必须显式 status=active|deferred：${direction.status}`);
      }
      if (direction.startHint != null && !isStr(direction.startHint)) push(`${at} startHint 必须是字符串`);
      if (direction.trackClosing != null && !isStr(direction.trackClosing)) push(`${at} trackClosing 必须是字符串`);
      if (direction.deferredNote != null && !isStr(direction.deferredNote)) push(`${at} deferredNote 必须是字符串`);
      if (direction.archiveLabel != null && !isStr(direction.archiveLabel)) push(`${at} archiveLabel 必须是字符串`);
      const unitIndex = new Map();
      for (const route of lib.technicalRoutes) {
        for (const unit of route.units ?? []) unitIndex.set(`${route.id}/${unit.id}`, true);
      }
      const validateTrackSteps = (trackName, steps, allowExternal) => {
        if (!isArr(steps)) {
          push(`${at} ${trackName} 必须是数组`);
          return;
        }
        const seenIds = new Set();
        const seenTargets = new Set();
        steps.forEach((step, j) => {
          const sat = `${at} ${trackName}[${j}]`;
          if (!isStr(step?.id)) push(`${sat} 缺少 id`);
          else if (seenIds.has(step.id)) push(`${sat} id 重复：${step.id}`);
          else seenIds.add(step.id);
          if (step?.kind === 'external') {
            if (!allowExternal) push(`${sat} external 只允许出现在 archiveRoute`);
            for (const field of ['title', 'role', 'note']) {
              if (!isStr(step?.[field])) push(`${sat} 外链目录缺少 ${field}`);
            }
            if (step?.url != null && !safeExternalHref(step.url)) push(`${sat} url 必须是 https：${step.url}`);
            if (step?.availability !== 'pending' && !safeExternalHref(step?.url)) {
              push(`${sat} ready 外链必须有可访问的 https url`);
            }
          } else {
            const terr = nodeTargetError(step);
            if (terr) push(`${sat} ${terr}`);
            if (step?.kind === 'paper' && !paperIds.has(step?.paperId)) {
              push(`${sat} paperId 无法解析：${step?.paperId}`);
            }
            if (step?.kind === 'article' && !materialIds.has(step?.materialId)) {
              push(`${sat} materialId 无法解析：${step?.materialId}`);
            }
            if (step?.kind === 'unit' && !unitIndex.has(`${step?.unitRef?.routeId}/${step?.unitRef?.unitId}`)) {
              push(`${sat} unitRef 无法解析：${step?.unitRef?.routeId}/${step?.unitRef?.unitId}`);
            }
            const key = nodeTargetKey(step);
            if (key) {
              if (seenTargets.has(key)) push(`${sat} 同一 track 内目标重复：${key}`);
              else seenTargets.add(key);
            }
            for (const field of ['purpose', 'readWhen', 'check']) {
              if (!isStr(step?.[field])) push(`${sat} 缺少 ${field}`);
            }
            if (step?.stage != null && !STAGE_ORDER.includes(step.stage)) push(`${sat} .stage 不在固定阶段内：${step.stage}`);
            if (step?.required != null && !['必读', '选读'].includes(step.required)) push(`${sat} .required 必须是 必读|选读：${step.required}`);
            if (step?.passMode != null && !['map', 'core', 'deep'].includes(step.passMode)) {
              push(`${sat} .passMode 必须是 map|core|deep：${step.passMode}`);
            }
            if (step?.availability != null && !['ready', 'pending'].includes(step.availability)) {
              push(`${sat} .availability 必须是 ready|pending：${step.availability}`);
            }
            if (step?.availability === 'pending' && !isStr(step?.pendingReason)) {
              push(`${sat} pending 步骤必须提供 pendingReason`);
            }
          }
        });
      };
      validateTrackSteps('startRoute', direction.startRoute, false);
      validateTrackSteps('archiveRoute', direction.archiveRoute, true);
    } else if (!isArr(direction.route)) {
      push(`${at} route 必须是数组`);
    } else {
      // 旧格式只读回退（05 §2 兼容层）；既有论文步骤校验不变。
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
    // SCAFFOLD-008：新增 featured（默认三条）；旧 core/advanced 继续存在、默认折叠。
    if (!['core', 'advanced', 'featured'].includes(route.kind ?? 'core')) {
      push(`${at} kind 必须是 core|advanced|featured：${route.kind}`);
    }
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
      // SCAFFOLD-008（04 §4/§5）：单元要么是恰好一个主资源的 resourceIds，要么是非空 lesson.blocks
      // 且 resourceIds=[]；禁止两边都空；availability 缺省 ready，pending 必须有 pendingReason；
      // ready 资源型单元恰有一个主资源；labPath 仅允许多智能体教材精确路径。
      if (unit?.availability != null && !['ready', 'pending'].includes(unit.availability)) {
        push(`${uat} availability 必须是 ready|pending：${unit.availability}`);
      }
      const unitReady = (unit?.availability ?? 'ready') === 'ready';
      if (!unitReady && !isStr(unit?.pendingReason)) push(`${uat} pending 单元必须提供 pendingReason`);
      const hasResources = isArr(unit?.resourceIds) && unit.resourceIds.length > 0;
      const lessonBlocks = unit?.lesson?.blocks;
      const hasLesson = isArr(lessonBlocks) && lessonBlocks.length > 0;
      if (hasLesson && hasResources) push(`${uat} lesson.blocks 与 resourceIds 只能二选一（编辑课单元的 resourceIds 应为 []）`);
      if (!hasLesson && !hasResources) push(`${uat} 需要非空 resourceIds 或非空 lesson.blocks 之一`);
      if (hasResources) {
        unit.resourceIds.forEach((id) => {
          if (!resourceIds.has(id)) push(`${uat} resourceIds 无法解析：${id}`);
        });
        const primaryCount = unit.resourceIds
          .map((id) => (route.resources ?? []).find((r) => r.id === id))
          .filter((r) => r && r.primary === true).length;
        if (primaryCount > 1) push(`${uat} 主资源最多 1 个，当前 ${primaryCount} 个`);
        if (unitReady && primaryCount !== 1) push(`${uat} ready 资源型单元恰有 1 个主资源，当前 ${primaryCount} 个`);
      }
      if (hasLesson) validateBlocks(`${uat}.lesson.blocks`, lessonBlocks);
      if (unit?.labPath != null) {
        if (unit.labPath !== MULTIAGENT_LAB_PATH) push(`${uat} labPath 只允许精确值 ${MULTIAGENT_LAB_PATH}`);
        if (!MULTIAGENT_LAB_SECTIONS.includes(unit?.labSection)) {
          push(`${uat} labSection 必须是 ${MULTIAGENT_LAB_SECTIONS.join('|')}：${unit?.labSection}`);
        }
      } else if (unit?.labSection != null) {
        push(`${uat} labSection 需要同时提供 labPath`);
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

  // home.startHere（03 §4）：typed NodeTarget + routeId/track='start'，必须是该 startRoute 第一节点；
  // 旧 startHerePaperId 只读适配，两者同时存在即失败。
  if (lib.home?.startHere != null && lib.home?.startHerePaperId != null) {
    push('home.startHere 与 home.startHerePaperId 不得同时存在');
  }
  if (lib.home?.startHere != null) {
    const sh = lib.home.startHere;
    const terr = nodeTargetError(sh);
    if (terr) push(`home.startHere ${terr}`);
    if (sh?.track !== 'start') push(`home.startHere.track 必须是 start：${sh?.track}`);
    if (!isStr(sh?.routeId) || !directionIds.has(sh.routeId)) {
      push(`home.startHere.routeId 无法解析：${sh?.routeId}`);
    } else {
      const first = trackEntries(lib, sh.routeId, 'start')[0] ?? null;
      if (!first || first.external || nodeTargetKey(first.target) !== nodeTargetKey(sh)) {
        push('home.startHere 必须是该方向 startRoute 的第一节点');
      }
    }
    if (!terr) {
      if (sh.kind === 'paper' && !paperIds.has(sh.paperId)) push(`home.startHere.paperId 无法解析：${sh.paperId}`);
      if (sh.kind === 'article' && !materialIds.has(sh.materialId)) {
        push(`home.startHere.materialId 无法解析：${sh.materialId}`);
      }
      if (sh.kind === 'unit') {
        const route = lib.technicalRoutes.find((t) => t.id === sh.unitRef?.routeId);
        if (!route || !(route.units ?? []).some((u) => u.id === sh.unitRef?.unitId)) {
          push(`home.startHere.unitRef 无法解析：${sh.unitRef?.routeId}/${sh.unitRef?.unitId}`);
        }
      }
    }
  }

  if (lib.home?.startHerePaperId != null && !paperIds.has(lib.home.startHerePaperId)) {
    push(`home.startHerePaperId 无法解析：${lib.home.startHerePaperId}`);
  }

  // ---------- landscape（PLAN REV001；可选：nodes 为空时视为未接入，不报错） ----------
  if (lib.landscape != null) {
    const land = lib.landscape;
    if (typeof land !== 'object' || isArr(land)) {
      push('landscape 必须是对象');
    } else if (Array.isArray(land.nodes) && land.nodes.length > 0) {
      // 层：至少一层，id/title/summary 齐备。
      const layers = land.layers ?? [];
      if (!isArr(layers) || layers.length === 0) push('landscape.nodes 非空时 layers 必须非空');
      const layerIds = new Set();
      for (const layer of layers) {
        if (!isStr(layer?.id) || !isStr(layer?.title) || !isStr(layer?.summary)) {
          push(`landscape.layers 条目需要 id/title/summary：${layer?.id ?? '?'}`);
        } else if (layerIds.has(layer.id)) push(`landscape.layers id 重复：${layer.id}`);
        else layerIds.add(layer.id);
      }
      // 节点：20–26；字段齐备；id 命名空间；前后关系由边表达。
      const LAND_ID = /^land-[a-z0-9][a-z0-9.-]{1,47}$/;
      const landNodes = land.nodes;
      if (landNodes.length < 20 || landNodes.length > 26) {
        push(`landscape 节点数须为 20–26（REV001），当前 ${landNodes.length}`);
      }
      if (layers.length > 0 && layerIds.has(layers[0].id)) {
        const bgCount = landNodes.filter((n) => n?.layer === layers[0].id).length;
        if (bgCount < 6 || bgCount > 8) push(`landscape 首层（AI 背景）节点须 6–8，当前 ${bgCount}`);
      }
      const landIds = new Set();
      for (const node of landNodes) {
        const at = `landscape.nodes（${node?.id ?? '?'}）`;
        if (!isStr(node?.id) || !LAND_ID.test(node.id)) push(`${at} id 须匹配 ${LAND_ID}`);
        else if (landIds.has(node.id)) push(`${at} id 重复：${node.id}`);
        else landIds.add(node.id);
        if (!layerIds.has(node?.layer)) push(`${at} layer 未登记：${node?.layer ?? '?'}`);
        for (const field of ['title', 'when', 'problem', 'idea', 'example', 'capability', 'limitation']) {
          if (!isStr(node?.[field])) push(`${at} 缺少 ${field}`);
        }
        if (!node?.source || typeof node.source !== 'object' || !isStr(node.source.note) || !isStr(node.source.asOf)) {
          push(`${at} 需要 source{note, asOf}（来源可核查）`);
        }
        if (node?.topics != null && (!isArr(node.topics) || !node.topics.every(isStr))) {
          push(`${at} topics 必须是字符串数组`);
        }
      }
      // 边：academic 必须附审计来源；reading 只给编辑理由、不得附来源（无伪来源）。
      const landEdges = land.edges ?? [];
      const seenEdges = new Set();
      for (const edge of landEdges) {
        const at = `landscape.edges（${edge?.id ?? '?'}）`;
        if (!isStr(edge?.id)) push(`${at} 缺少 id`);
        else if (seenEdges.has(edge.id)) push(`${at} id 重复：${edge.id}`);
        else seenEdges.add(edge.id);
        if (!landIds.has(edge?.from) || !landIds.has(edge?.to)) push(`${at} 端点须为已登记节点：${edge?.from ?? '?'} → ${edge?.to ?? '?'}`);
        if (!['academic', 'reading'].includes(edge?.kind)) push(`${at} kind 必须是 academic|reading：${edge?.kind}`);
        if (edge?.kind === 'academic') {
          if (!edge?.source || !isStr(edge.source.note) || !isStr(edge.source.asOf)) {
            push(`${at} academic 边必须附审计来源 source{note, asOf}`);
          }
        }
        if (edge?.kind === 'reading') {
          if (!isStr(edge?.note)) push(`${at} reading 边必须给出编辑理由 note`);
          if (edge?.source != null) push(`${at} reading 边不得附来源（只给编辑理由，拒绝伪来源）`);
        }
      }
      // 学习路径：4–6 条，节点引用可解析。
      const landPaths = land.paths ?? [];
      if (landPaths.length < 4 || landPaths.length > 6) push(`landscape 学习路径须 4–6 条（REV001），当前 ${landPaths.length}`);
      for (const path of landPaths) {
        const at = `landscape.paths（${path?.id ?? '?'}）`;
        for (const field of ['id', 'title', 'description']) if (!isStr(path?.[field])) push(`${at} 缺少 ${field}`);
        if (!isArr(path?.nodeIds) || path.nodeIds.length < 1) push(`${at} nodeIds 至少 1 个节点（路径 F 为单节点映射落点，合法）`);
        else {
          for (const ref of path.nodeIds) {
            if (!landIds.has(ref)) push(`${at} nodeIds 无法解析：${ref}`);
          }
        }
      }
    } else if (land.nodes != null && !isArr(land.nodes)) {
      push('landscape.nodes 必须是数组（空数组＝未接入过渡态）');
    }
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

// 本人记录总览（首页"我的记录"用；B-Q1 修复：不再把"没有在读"误判为"没有记录"）。
// 返回：unavailable/corrupt（存储不可读，显式声明读不到，绝不称"尚无"）；
// 或各计数 + hasAny（是否存在任何本人手动标记：状态≠未读、有问题/笔记、或待读清单非空）。
function v3RecordSummary() {
  if (!v3Available()) {
    return {
      readable: false,
      unavailable: v3Runtime.kind === 'unavailable',
      corrupt: v3Runtime.kind === 'corrupt',
      reading: 0,
      done: 0,
      noted: 0,
      list: 0,
      hasAny: false,
    };
  }
  const papers = v3Runtime.state?.papers ?? {};
  let reading = 0;
  let done = 0;
  let noted = 0;
  let hasAny = false;
  for (const rec of Object.values(papers)) {
    if (!rec) continue;
    if (rec.status === 'reading') {
      reading += 1;
      hasAny = true;
    } else if (rec.status === 'done') {
      done += 1;
      hasAny = true;
    }
    const hasText = String(rec.question ?? '').trim() !== '' || String(rec.note ?? '').trim() !== '';
    if (hasText) {
      noted += 1;
      hasAny = true;
    }
  }
  const list = Array.isArray(v3Runtime.state?.readingList) ? v3Runtime.state.readingList.length : 0;
  if (list > 0) hasAny = true;
  return { readable: true, unavailable: false, corrupt: false, reading, done, noted, list, hasAny };
}

// 仅测试用的渲染数据源接缝（与 __setRenderLibrary 同类：验证 v3 读取分支，不写盘、不接入 C 覆盖层）。
export function __setV3ForTest(kind, state) {
  v3Runtime.kind = kind;
  v3Runtime.state = state;
}
export function __getV3ForTest() {
  return { kind: v3Runtime.kind, state: v3Runtime.state };
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

// REWORK-007 §3：列表与首页预览用一行纯文本 meta；entry 的完整诚实标注句只在论文页页眉出现。
function badgeLine(paper) {
  const texts = paperBadges(paper).map((b) => (b.kind === 'entry' ? '原文入口' : b.text));
  return el('p', 'lib-depth-note', texts.join(' · '));
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
  // 只对含数值的表格显示数值核对声明（纯概念表不显示，避免模板感）。
  const hasNumbers = (block.rows ?? []).some((row) => row.some((cell) => /\d/.test(String(cell))));
  wrap.appendChild(
    el('p', 'lib-table-hint', hasNumbers
      ? '表格可横向滚动；表内数值未逐格核对，结论以正文叙述为准。'
      : '表格可横向滚动。'),
  );
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
  // PLAN-011 审查修复（去重仅限主推荐语义角色）：goal 区头不再重复「打开主方向路线」入口——
  // 区内的真正首读/继续读条目保留，topic 区保留课题探索链接；不加新路由功能。
  if (zone.key !== 'goal') head.appendChild(link(zone.entryHash, zone.entryLabel, 'lib-zone-entry'));
  section.appendChild(head);
  // PLAN-011 B1：purpose+howToUse 合并为一行「这区是什么 · 什么时候用」，减少双段重复说明。
  const about = el('p', 'lib-zone-about');
  about.appendChild(document.createTextNode(`${zone.purpose}　`));
  const when = el('span', 'lib-zone-about-when', zone.howToUse);
  about.appendChild(when);
  section.appendChild(about);
  if (body) section.appendChild(body);
  return section;
}

function latestBrief(lib) {
  if (lib.briefs.length === 0) return null;
  return [...lib.briefs].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
}

// 带类型首读的详情链接（03 §4/§5）：论文/材料带 route+track；unit 另带 unit 定位。
function startTargetHref(target) {
  if (target?.kind === 'paper') return buildContextHash('paper', target.paperId, { routeId: target.routeId, track: 'start' });
  if (target?.kind === 'article') return buildContextHash('material', target.materialId, { routeId: target.routeId, track: 'start' });
  if (target?.kind === 'unit') {
    return buildContextHash('learn', target.unitRef.routeId, { routeId: target.routeId, track: 'start', unitId: target.unitRef.unitId });
  }
  return null;
}

// 路线步骤的详情链接（03 §5）：外链目录直接开 https；站内目标带 route/track 上下文。
function stepHref(directionId, track, step) {
  if (step?.external) return safeExternalHref(step.url);
  const target = step?.target;
  if (!target) return null;
  const ctx = { routeId: directionId, track };
  if (target.kind === 'paper') return buildContextHash('paper', target.paperId, ctx);
  if (target.kind === 'article') return buildContextHash('material', target.materialId, ctx);
  if (target.kind === 'unit') return buildContextHash('learn', target.unitRef.routeId, { ...ctx, unitId: target.unitRef.unitId });
  return null;
}

// ---------- DYNAMIC-GUIDANCE-009 / B+C 包：导学生效值接缝 + 地图/首屏解析辅助 ----------
// 生效值单入口（R5 single overlay source）：页面任何位置读取"生效值"只经 computeEffective(base, overlay)
// 一个入口；C 包在此接入 research-workbench:guidance:v1（guidance.js 负责解析/校验/物化），
// 渲染层不出现第二存储键、不缓存第二副本。存储损坏/不可用 ⇒ 覆盖层按 null 降级为基线显示，
// 「导学调整」页给出明确文案与坏档导出；本人 v3 记录不受影响。

// 覆盖层唯一读取入口：无有效变更（空存储/仅无条目/损坏/不可用）⇒ null（＝基线）。
export function currentGuidanceOverlay() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    // B1：渲染读取也带基线做完整校验（手工改存储/导入坏档 ⇒ corrupt ⇒ 按基线降级显示）。
    return currentOverlay(window.localStorage, renderBase);
  } catch {
    return null;
  }
}

// 生效视图：委托 guidance.computeEffective（纯函数）。overlay 为 null ⇒ 生效值＝基线（透传引用）。
export function computeEffective(base, overlay = currentGuidanceOverlay()) {
  return guidanceComputeEffective(base, overlay);
}

// 找到覆盖某 id 的路线步骤（含所属方向与 track），用于地图 step-* ref 的站内定位。
function findStepById(lib, stepId) {
  if (typeof stepId !== 'string' || !stepId) return null;
  for (const direction of lib.directions ?? []) {
    for (const track of ['start', 'archive']) {
      const step = trackEntries(lib, direction.id, track).find((s) => s.id === stepId);
      if (step) return { step, direction, track };
    }
  }
  return null;
}

// 把地图节点 ref / 边 evidence 的站内 id 解析为可点入口（paper/material/direction/tech-route/step-*）。
// 解析不了返回 null：渲染层据此降级为纯文本"待查问题"，不画线、不产生假链接（R1 渲染层校验）。
export function resolveMapRef(lib, id) {
  if (typeof id !== 'string' || !id) return null;
  const paper = getPaper(lib, id);
  if (paper) return { kind: 'paper', label: paper.displayTitle || paper.title, href: buildHash('paper', paper.id) };
  const material = getMaterial(lib, id);
  if (material) return { kind: 'article', label: material.title, href: buildHash('material', material.id) };
  const direction = getDirection(lib, id);
  if (direction) return { kind: 'direction', label: direction.title, href: buildHash('route', direction.id) };
  const tech = getTechnicalRoute(lib, id);
  if (tech) return { kind: 'tech-route', label: tech.title, href: buildHash('learn', tech.id) };
  if (id.startsWith('step-')) {
    const located = findStepById(lib, id);
    if (!located) return null;
    const href = stepHref(located.direction.id, located.track, located.step);
    const label = located.step?.resolved?.title ?? id;
    return { kind: 'step', stepId: id, label, href: href ?? null };
  }
  return null;
}

// meaning 词表以固定词汇开头（R1）；返回 { vocab, vocabLabel, note } 供渲染逐条显示语义。
// 允许词汇后紧跟限定括注（如 "addresses（部分）："），解析时剥掉该括注与冒号，只留语义注记。
export function parseMapMeaning(meaning) {
  const text = String(meaning ?? '');
  const match = text.match(/^(variant-of|conflicts|depends-on|inspires|addresses)(?=$|[（(：:\s])/i);
  const vocab = match ? match[1].toLowerCase() : null;
  let note;
  let qualifier = null;
  if (vocab) {
    let rest = text.slice(match[1].length);
    const q = rest.match(/^\s*[（(]([^)）]*)[)）]/); // 词汇后的限定括注（部分）等，保留不臆断
    if (q) {
      qualifier = q[1].trim();
      rest = rest.slice(q[0].length);
    }
    rest = rest.replace(/^\s*[：:]\s*/, ''); // 去掉分隔冒号
    note = rest.trim();
  } else {
    note = text.trim();
  }
  return { vocab, vocabLabel: vocab ? MAP_MEANING_LABELS[vocab] ?? vocab : null, qualifier, note };
}

// 首页「当前关注／下一步」推导（R2/R3 默认焦点，R5 单一来源，R6 example 永久过滤）。
// 无覆盖层时：当前关注＝active 方向中 order 最小者；下一步＝其生效 startRoute 首节点。
// 不写死步骤指针：home.startHere 基线数据不被改写，其内容测试不变式继续生效（R0 不变式）。
export function resolveHomeFocus(lib, overlay = currentGuidanceOverlay()) {
  const eff = computeEffective(lib, overlay);
  // B2 修复轮：方向与轨道一律读生效库 eff.lib（基线只作 computeEffective 的输入）——
  // 覆盖层改过首步字段后，首屏「下一步」随生效值变化；example 条目在首页推导里永久过滤（R6 规则①）。
  const active = activeDirections(eff.lib);
  let direction = null;
  let fromOverlay = false;
  const hfUsable = Boolean(eff.homeFocus) && eff.homeFocus.example !== true;
  if (hfUsable && typeof eff.homeFocus.routeId === 'string') {
    direction = active.find((d) => d.id === eff.homeFocus.routeId) ?? null;
    fromOverlay = Boolean(direction);
  }
  if (!direction) direction = active[0] ?? null;
  const startSteps = trackEntries(eff.lib, direction?.id, 'start').filter((s) => s.example !== true);
  let step = startSteps[0] ?? null;
  let fallbackNote = null;
  if (!step) {
    // 理论上不可能（基线步骤不可删）；仍失败则回退基线 startHere 并显式提示，不静默（R3）。
    const startHere = eff.lib.home?.startHere ?? lib.home?.startHere ?? null;
    if (startHere) {
      const resolved = resolveNodeTarget(eff.lib, startHere);
      if (resolved) {
        step = { id: null, kind: resolved.kind, resolved, passMode: null, purpose: null, __fallback: true };
      }
    }
    fallbackNote = resolved2Note(step);
  }
  // note-only 焦点（只写附注、未切方向）同样给出来源行：noteVisible 驱动首屏 meta 渲染（B2）。
  const focusNote = hfUsable ? eff.homeFocus?.note ?? null : null;
  const noteVisible = hfUsable && Boolean(fromOverlay || focusNote);
  return { direction, step, fromOverlay, focusNote, noteVisible, fallbackNote };
}

function resolved2Note(step) {
  return step ? '起步路线暂无法从生效数据推导，已回退编辑基线首读；这不改变基线 startHere 数据。' : null;
}

// 首屏动线卡（B 包线框＋C 包生效）：当前关注／下一步／为什么选它／怎么读它／我的记录，加主行动入口。
// 覆盖层"来源行"（R4）与"待确认提案"横幅（pending 仅会话内存、不落盘，R2）在此渲染；
// example 条目不驱动推导（R6 规则①），但影响首屏展示的字段时按规则②带常驻示例横幅。
function renderHomeFocusHero() {
  const focus = resolveHomeFocus(renderBase);
  const overlay = currentGuidanceOverlay();
  const box = el('section', 'lib-home-focus');
  box.appendChild(el('h2', 'lib-home-focus-title', '今日视角 · 做什么、读什么、怎么读'));

  const direction = focus.direction;
  // —— 做什么（当前关注）——
  const focusLine = el('p', 'lib-focus-line');
  focusLine.appendChild(el('strong', 'lib-focus-label', '当前关注'));
  if (direction) focusLine.appendChild(link(buildHash('route', direction.id), direction.title));
  else focusLine.appendChild(el('span', 'lib-unsafe-link', '方向尚未接入'));
  box.appendChild(focusLine);
  // 页面只呈现读者需要的导学信息；授权和核查时间留在数据与审计文档中。
  if (focus.noteVisible) {
    const hf = overlay?.homeFocus ?? null;
    const meta = hf ? adjustLabel({ origin: hf.origin, example: hf.example }) : '导学调整（本人确认）';
    box.appendChild(el('p', 'lib-focus-prov', `${meta}${focus.focusNote ? ` · 附注：${focus.focusNote}` : ''}`));
  }
  // 当前关注经覆盖层示例条目改写的情况不会出现（example 在推导里永久过滤，R6 规则①）；
  // 若下一步展示的「为什么选它」被示例调整，则首屏按规则②带常驻示例横幅。
  const heroStepRefs = focus.step?.id
    ? ['purpose', 'readWhen', 'check'].map((f) => `route-step:${focus.step.id}:${f}`)
    : [];
  const heroAdjustments = heroStepRefs.map((ref) => overlayEntry(overlay, ref)).filter(Boolean);
  if (heroAdjustments.some((entry) => entry.example === true)) {
    box.appendChild(el('p', 'lib-example-banner', EXAMPLE_BANNER_TEXT));
  }
  for (const entry of heroAdjustments) {
    box.appendChild(el('p', 'lib-adjust-meta', adjustLabel(entry)));
  }
  box.appendChild(el('p', 'lib-focus-scope', '当前关注是起步的兴趣与阅读上下文，不是已经定稿的论文题目；研究机制仍待比较。'));
  // cross-harness 兴趣 ≠ 定稿题目（交付行为 1／长期约束：不承诺创新或发表）。
  if (focus.fallbackNote) box.appendChild(el('p', 'lib-notice-flat', focus.fallbackNote));

  // —— 读什么（下一步，生效 startRoute 首节点推导）——
  const step = focus.step;
  let nextHref = null;
  if (step && step.resolved) {
    nextHref = step.__fallback
      ? startTargetHref(renderLibrary.home?.startHere)
      : stepHref(direction?.id, 'start', step) ?? step.resolved.href;
    const nextLine = el('p', 'lib-focus-line');
    nextLine.appendChild(el('strong', 'lib-focus-label', '下一步'));
    nextLine.appendChild(link(nextHref ?? step.resolved.href ?? '#/home', step.resolved.title));
    box.appendChild(nextLine);
    if (step.purpose) {
      const why = el('p', 'lib-focus-line');
      why.appendChild(el('strong', 'lib-focus-label', '为什么选它'));
      why.appendChild(document.createTextNode(step.purpose));
      box.appendChild(why);
    }
    const howMode = step.passMode ? PASS_MODE_LABELS[step.passMode] ?? step.passMode : null;
    const howIsPrimer = step.kind === 'article' || step.resolved.kind === 'article';
    const how = el('p', 'lib-focus-line');
    how.appendChild(el('strong', 'lib-focus-label', '怎么读它'));
    how.appendChild(
      document.createTextNode(
        howIsPrimer
          ? '先读这份站内问题导读（它本身就是起步用的问题地图）；'
          : `${howMode ?? '按需'}；`,
      ),
    );
    const mapLink = link('#/map', '打开领域地图');
    how.appendChild(mapLink);
    how.appendChild(document.createTextNode('看两侧认识与有据关联，再进原文。'));
    box.appendChild(how);
  }

  // —— 我的记录：四态分明（不可读 / 无记录 / 只有非在读记录 / 有在读），不把"没有在读"误报成"没有记录" ——
  const recLine = el('p', 'lib-focus-line');
  recLine.appendChild(el('strong', 'lib-focus-label', '我的记录'));
  const rec = v3RecordSummary();
  if (!rec.readable) {
    recLine.appendChild(
      document.createTextNode(
        rec.corrupt
          ? '检测到本地记录数据损坏，已不加载（未做任何改动）——这里不显示任何进度；如需处理见"论文阅读"页的记录区。'
          : '本浏览器存储不可用，当前读不到本地记录——这里不显示任何进度；页面其余内容照常。',
      ),
    );
  } else if (!rec.hasAny) {
    recLine.appendChild(document.createTextNode('尚无阅读记录——以下为编辑建议的起步路线，不是你的进度。'));
  } else {
    const parts = [];
    if (rec.reading > 0) parts.push(`在读 ${rec.reading} 篇`);
    if (rec.done > 0) parts.push(`已读 ${rec.done} 篇`);
    if (rec.noted > 0) parts.push(`问题／笔记 ${rec.noted} 篇`);
    if (rec.list > 0) parts.push(`待读清单 ${rec.list} 条`);
    recLine.appendChild(
      document.createTextNode(`${parts.join(' · ')}（均为本人手动标记，不是统计意义上的进度；不显示百分比或连续天数）。`),
    );
  }
  box.appendChild(recLine);

  // —— 主行动入口 ——
  const actions = el('p', 'lib-focus-actions');
  actions.appendChild(link('#/map', '打开地图', 'lib-btn'));
  if (step && step.resolved) {
    actions.appendChild(link(nextHref ?? step.resolved.href ?? '#/home', step.resolved.kind === 'article' ? '导读：分清问题' : '打开阅读卡', 'lib-btn'));
  }
  box.appendChild(actions);
  // 待确认提案横幅（C 包，R2）：只在存在 pending（本会话粘贴、未确认）时出现；
  // pending 不落盘——刷新/关闭即整案丢弃，横幅随会话消失（不存在「半写入」中间态）。
  if (guidanceUi.pending.length > 0) {
    const banner = el('p', 'lib-pending-banner');
    banner.appendChild(
      link('#/guidance', `有 ${guidanceUi.pending.length} 条待确认提案 → 预览（未确认前不会写入任何内容）`),
    );
    box.appendChild(banner);
  }
  return box;
}

// 次级入口一行（每日精选/经典/技术/方向/材料）：可达但不抢主动线。
function renderHomeSecondaryRow() {
  const line = el('p', 'lib-home-secondary');
  line.appendChild(el('span', 'lib-focus-label', '其他入口'));
  const entries = [
    ['每日精选', '#/brief'],
    ['经典书目', '#/foundations'],
    ['技术学习', '#/learn'],
    ['方向与路线', '#/directions'],
    ['全部论文', '#/papers'],
    // C 包：本机导学提案闭环的常驻入口（导学调整页；提案/预览/确认/撤销/备份都在这里）。
    ['导学调整', '#/guidance'],
  ];
  const links = entries.map(([label, href]) => link(href, label));
  links.forEach((a, i) => {
    if (i > 0) line.appendChild(document.createTextNode(' · '));
    line.appendChild(a);
  });
  return line;
}

function renderHome(container) {
  return renderHomeLegacy(container);
}

function renderHomeReader(container) {
  const page = el('div', 'lib-home lib-home-reader');
  container.appendChild(page);
  const home = renderLibrary.home;
  if (!home) {
    page.appendChild(el('h1', 'lib-display', '研究、阅读与技术学习'));
    page.appendChild(emptyBox('首页说明尚未接入。'));
    return;
  }

  page.appendChild(el('h1', 'lib-display', home.title));
  page.appendChild(el('p', 'lib-home-lead', '沿知识脉络认识 Agent，再按自己的研究方向读论文、补技术。'));

  const focus = resolveHomeFocus(renderBase);
  const start = focus.step;
  const startBox = el('section', 'lib-home-start');
  startBox.appendChild(el('p', 'lib-zone-flag', '建议从这里开始'));
  if (start?.resolved) {
    const href = start.__fallback
      ? startTargetHref(renderLibrary.home?.startHere)
      : stepHref(focus.direction?.id, 'start', start) ?? start.resolved.href;
    startBox.appendChild(el('h2', 'lib-home-start-title', start.resolved.title));
    if (start.resolved.lead) startBox.appendChild(el('p', 'lib-home-start-note', start.resolved.lead));
    startBox.appendChild(link(href ?? '#/home', '开始阅读', 'lib-btn'));
  } else {
    startBox.appendChild(el('p', 'lib-home-start-note', '起步导读暂不可用，可从研究方向中选择入口。'));
  }

  if (v3Available()) {
    const reading = Object.entries(v3Runtime.state.papers ?? {})
      .filter(([, record]) => record?.status === 'reading')
      .map(([id]) => getPaper(renderLibrary, id))
      .filter(Boolean)
      .slice(0, 2);
    if (reading.length > 0) {
      const line = el('p', 'lib-home-reading');
      line.appendChild(el('strong', null, '继续在读：'));
      reading.forEach((paper, index) => {
        if (index > 0) line.appendChild(document.createTextNode(' · '));
        line.appendChild(paperLink(paper));
      });
      startBox.appendChild(line);
    }
  }
  if (guidanceUi.pending.length > 0) {
    startBox.appendChild(link('#/guidance', `有 ${guidanceUi.pending.length} 条待确认调整`, 'lib-home-pending'));
  }
  page.appendChild(startBox);

  const cards = el('div', 'lib-home-reader-grid');
  const card = (title, description, href, label) => {
    const section = el('section', 'lib-home-reader-card');
    section.appendChild(el('h2', 'lib-home-reader-title', title));
    section.appendChild(el('p', 'lib-home-reader-note', description));
    section.appendChild(link(href, label, 'lib-home-reader-link'));
    cards.appendChild(section);
    return section;
  };

  const land = renderLibrary.landscape;
  const layerIntro = (land?.layers ?? []).map((layer) => layer.title).join(' · ');
  card('知识地图', `从 AI 基础到 Agent 全景，再走进专题：${layerIntro}。`, '#/map', '浏览知识地图');

  const directions = activeDirections(renderLibrary);
  const directionCard = card(
    '研究方向',
    '先看两条起步方向各自要解决什么问题，再进入对应的论文路线。',
    '#/directions',
    '查看研究方向',
  );
  const directionList = el('p', 'lib-home-reader-sub');
  directions.forEach((direction, index) => {
    if (index > 0) directionList.appendChild(document.createTextNode(' · '));
    directionList.appendChild(link(buildHash('route', direction.id), direction.title));
  });
  directionCard.appendChild(directionList);

  const techRoutes = featuredTechnicalRoutes(renderLibrary);
  const techCard = card('技术学习', '读到论文里的方法时，再补当前需要的技术。', '#/learn', '进入技术学习');
  const techList = el('p', 'lib-home-reader-sub');
  techRoutes.forEach((route, index) => {
    if (index > 0) techList.appendChild(document.createTextNode(' · '));
    techList.appendChild(link(buildHash('learn', route.id), route.title));
  });
  techCard.appendChild(techList);
  page.appendChild(cards);

  const latest = [...(renderLibrary.briefs ?? [])]
    .filter((brief) => Array.isArray(brief.items) && brief.items.length > 0)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  const briefs = el('section', 'lib-home-briefs');
  const briefHead = el('div', 'lib-home-brief-head');
  briefHead.appendChild(el('h2', 'lib-home-reader-title', '近期精选'));
  if (latest) briefHead.appendChild(el('span', 'lib-res-meta', `简报期次 ${latest.date}`));
  briefs.appendChild(briefHead);
  if (latest) {
    for (const item of latest.items.slice(0, 3)) {
      const row = el('p', 'lib-home-brief-row');
      const target = briefItemTarget(renderLibrary, item);
      if (target?.kind === 'paper') {
        const paper = getPaper(renderLibrary, target.paperId);
        if (paper) row.appendChild(paperLink(paper));
        else row.appendChild(document.createTextNode(item.title ?? item.paperId ?? ''));
      } else if (target?.kind === 'external') row.appendChild(externalLink(target.href, briefSourceLabel(item, target.href)));
      else row.appendChild(document.createTextNode(item.title ?? item.source ?? ''));
      row.appendChild(el('span', 'lib-home-brief-reason', ` — ${item.reason ?? ''}`));
      briefs.appendChild(row);
    }
  } else {
    briefs.appendChild(el('p', 'lib-muted', '暂无已收录的精选条目。'));
  }
  briefs.appendChild(link('#/brief', '查看全部精选', 'lib-home-reader-link'));
  page.appendChild(briefs);

  const secondary = el('p', 'lib-home-secondary-reader');
  secondary.appendChild(el('span', 'lib-focus-label', '其他入口：'));
  const entries = [['全部论文', '#/papers'], ['经典书目', '#/foundations'], ['导学调整', '#/guidance']];
  entries.forEach(([label, href], index) => {
    if (index > 0) secondary.appendChild(document.createTextNode(' · '));
    secondary.appendChild(link(href, label));
  });
  page.appendChild(secondary);
}

function renderHomeLegacy(container) {
  const home = renderLibrary.home;
  const page = el('div', 'lib-home');
  container.appendChild(page);
  if (!home) {
    page.appendChild(el('h2', null, '研究、阅读与技术学习'));
    page.appendChild(emptyBox('首页说明尚未接入。'));
    return;
  }
  // 简报日期作为内容期次保留；不展示页面整理/维护日期。
  const latest = latestBrief(renderLibrary);
  page.appendChild(el('h1', 'lib-display', home.title));
  page.appendChild(el('p', 'lib-sub', home.intro));

  // DYNAMIC-GUIDANCE-009 / B 包：首屏"做什么、读什么、怎么读"连贯动线（R2 线框）。
  // 生效值仅经 resolveHomeFocus→computeEffective 单入口；无覆盖层时＝基线推导，不写死步骤指针。
  page.appendChild(renderHomeFocusHero());

  // 次级入口一行：每日精选/经典/技术/方向/材料仍可达，但不占主动线（R2 §1、交付行为 1）。
  page.appendChild(renderHomeSecondaryRow());

  // PLAN-010 阶段 B：首页四区（阅读目标/综述总览/课题深化/技术入口）。旧五区内容不删：
  // 精选与首读归入「阅读目标」，两条方向与四轴浓缩归入「课题深化」，技术路线归入「技术入口」，
  // 经典书目归入「综述总览」的共同语言小节；未知 key（旧 fixture）走逐 key 回退，不丢内容。
  const zoneCfg = (key, fallback) => home.zones.find((z) => z.key === key) ?? fallback;
  const grid = el('div', 'lib-home-grid');
  page.appendChild(grid);

  const renderLegacyZone = (zone) => {
    if (zone.key === 'brief') {
      const briefBody = el('div', 'lib-zone-body');
      if (latest) {
        briefBody.appendChild(el('p', 'lib-zone-flag', `最近一期 ${latest.date}`));
        if (latest.items.length === 0) {
          const lastNonEmpty = [...renderLibrary.briefs]
            .sort((a, b) => String(b.date).localeCompare(String(a.date)))
            .find((b) => b.items.length > 0);
          if (lastNonEmpty) {
            const hint = el('p', 'lib-muted', '本期为空窗口（arXiv 索引滞后），暂无条目；最近有内容的一期：');
            hint.appendChild(link(buildHash('brief', lastNonEmpty.id), lastNonEmpty.date));
            briefBody.appendChild(hint);
          }
        }
        for (const item of latest.items.slice(0, 3)) {
          const line = el('div', 'lib-zone-item');
          const title = el('p', 'lib-zone-item-title');
          const target = briefItemTarget(renderLibrary, item);
          if (target?.kind === 'paper') title.appendChild(paperLink(getPaper(renderLibrary, target.paperId)));
          else if (target?.kind === 'external') title.appendChild(externalLink(target.href, item.displayTitle ?? briefSourceLabel(item, target.href)));
          else title.appendChild(el('span', 'lib-unsafe-link', `${item.paperId ?? item.source ?? ''}（关联未接入）`));
          line.appendChild(title);
          if (item.published) line.appendChild(el('p', 'lib-res-meta', `发表时间：${item.published}`));
          line.appendChild(el('p', 'lib-zone-item-note', `${item.tier}：${item.displayReason ?? item.reason}`));
          briefBody.appendChild(line);
        }
      } else {
        briefBody.appendChild(emptyBox(EMPTY_NOTICES.briefs));
      }
      return briefBody;
    }
    if (zone.key === 'papers') {
      const paperBody = el('div', 'lib-zone-body');
      const startTarget =
        home.startHere != null
          ? home.startHere
          : home.startHerePaperId != null
            ? { kind: 'paper', paperId: home.startHerePaperId }
            : null;
      const startResolved = startTarget ? resolveNodeTarget(renderLibrary, startTarget) : null;
      const startHref = startTarget ? startTargetHref(startTarget) : null;
      if (startResolved && startHref) {
        const item = el('div', 'lib-zone-item');
        item.appendChild(el('p', 'lib-zone-flag', startResolved.kind === 'article' ? '建议从这里开始' : '建议先读'));
        const title = el('p', 'lib-zone-item-title');
        title.appendChild(link(startHref, startResolved.title));
        item.appendChild(title);
        if (startResolved.lead) item.appendChild(el('p', 'lib-zone-item-note', startResolved.lead));
        paperBody.appendChild(item);
      }
      return paperBody;
    }
    if (zone.key === 'directions') {
      const dirBody = el('div', 'lib-zone-body');
      for (const direction of activeDirections(renderLibrary)) {
        const item = el('div', 'lib-zone-item');
        const title = el('p', 'lib-zone-item-title');
        title.appendChild(link(buildHash('route', direction.id), direction.title));
        item.appendChild(title);
        if (direction.summary) item.appendChild(el('p', 'lib-zone-item-note', direction.summary));
        dirBody.appendChild(item);
      }
      return dirBody;
    }
    if (zone.key === 'learn') {
      const learnBody = el('div', 'lib-zone-body');
      for (const route of featuredTechnicalRoutes(renderLibrary)) {
        const item = el('div', 'lib-zone-item');
        const title = el('p', 'lib-zone-item-title');
        title.appendChild(link(buildHash('learn', route.id), route.title));
        item.appendChild(title);
        item.appendChild(el('p', 'lib-zone-item-note', `共 ${route.units?.length ?? 0} 个单元。${route.summary ?? route.capability}`));
        learnBody.appendChild(item);
      }
      return learnBody;
    }
    const foundBody = el('div', 'lib-zone-body');
    for (const group of foundationGroups(renderLibrary)) {
      const item = el('div', 'lib-zone-item');
      const title = el('p', 'lib-zone-item-title');
      title.appendChild(link('#/foundations', group.title));
      item.appendChild(title);
      item.appendChild(el('p', 'lib-zone-item-note', `${group.papers.length} 篇：${group.papers.map((p) => p.displayTitle || p.title).join('、')}。`));
      foundBody.appendChild(item);
    }
    return foundBody;
  };

  for (const zone of home.zones) {
    let body;
    if (zone.key === 'goal') {
      body = el('div', 'lib-zone-body');
      // 建议从这里开始（typed 首读）
      const startTarget =
        home.startHere != null
          ? home.startHere
          : home.startHerePaperId != null
            ? { kind: 'paper', paperId: home.startHerePaperId }
            : null;
      const startResolved = startTarget ? resolveNodeTarget(renderLibrary, startTarget) : null;
      const startHref = startTarget ? startTargetHref(startTarget) : null;
      if (startResolved && startHref) {
        const item = el('div', 'lib-zone-item');
        item.appendChild(el('p', 'lib-zone-flag', startResolved.kind === 'article' ? '建议从这里开始' : '建议先读'));
        const title = el('p', 'lib-zone-item-title');
        title.appendChild(link(startHref, startResolved.title));
        item.appendChild(title);
        if (startResolved.kind === 'paper') {
          const startPaper = getPaper(renderLibrary, startTarget.paperId);
          if (startPaper) item.appendChild(badgeLine(startPaper));
        } else {
          const meta = [startResolved.formatLabel, startResolved.depthLabel].filter(Boolean).join(' · ');
          if (meta) item.appendChild(el('p', 'lib-depth-note', meta));
        }
        if (startResolved.lead) item.appendChild(el('p', 'lib-zone-item-note', startResolved.lead));
        const actions = el('p', 'lib-first-line');
        actions.appendChild(link(startHref, startResolved.kind === 'article' ? '打开导读' : '打开阅读卡'));
        item.appendChild(actions);
        body.appendChild(item);
      } else if (renderLibrary.papers.length === 0) {
        body.appendChild(emptyBox(EMPTY_NOTICES.papers));
      }
      // 基础导读（站内 primer，除首读外）：回答「为什么/怎么读」的三个层次
      const primers = (renderLibrary.materials ?? []).filter(
        (m) => m.format === 'primer' && m.id !== home.startHere?.materialId && m.coverage?.mode !== 'identity',
      );
      if (primers.length > 0) {
        const sub = el('div', 'lib-zone-sub');
        sub.appendChild(el('p', 'lib-zone-flag', '站内基础导读（编辑说明，随时可插读）'));
        for (const material of primers) {
          const line = el('p', 'lib-first-line');
          line.appendChild(link(buildHash('material', material.id), material.title));
          if (material.lead) line.appendChild(el('span', 'lib-res-meta', ` —— ${material.lead}`));
          sub.appendChild(line);
        }
        body.appendChild(sub);
      }
      // 本人手动标记的"在读"直达行——只引用真实标记，不做任何进度统计。
      if (v3Available()) {
        const readingPapers = Object.entries(v3Runtime.state.papers ?? {})
          .filter(([, rec]) => rec?.status === 'reading')
          .map(([id]) => getPaper(renderLibrary, id))
          .filter(Boolean);
        if (readingPapers.length > 0) {
          const line = el('p', 'lib-first-line');
          line.appendChild(el('strong', 'lib-step-label', '我在读（本人标记）：'));
          readingPapers.forEach((p, i) => {
            if (i > 0) line.appendChild(document.createTextNode('；'));
            line.appendChild(paperLink(p));
          });
          body.appendChild(line);
        }
      }
      // 每日精选（原区一内容归入此处）：感知前沿，不是今日阅读作业。
      if (latest) {
        const sub = el('div', 'lib-zone-sub');
        sub.appendChild(el('p', 'lib-zone-flag', `感知前沿 · 最近一期 ${latest.date}（不是今天的阅读作业）`));
        if (latest.items.length === 0) {
          const lastNonEmpty = [...renderLibrary.briefs]
            .sort((a, b) => String(b.date).localeCompare(String(a.date)))
            .find((b) => b.items.length > 0);
          if (lastNonEmpty) {
            const hint = el('p', 'lib-muted', '本期为空窗口（arXiv 索引滞后），暂无条目；最近有内容的一期：');
            hint.appendChild(link(buildHash('brief', lastNonEmpty.id), lastNonEmpty.date));
            sub.appendChild(hint);
          } else {
            sub.appendChild(el('p', 'lib-muted', '本期为空窗口（arXiv 索引滞后），暂无条目。'));
          }
        }
        for (const item of latest.items.slice(0, 3)) {
          const line = el('div', 'lib-zone-item');
          const title = el('p', 'lib-zone-item-title');
          const target = briefItemTarget(renderLibrary, item);
          if (target?.kind === 'paper') title.appendChild(paperLink(getPaper(renderLibrary, target.paperId)));
          else if (target?.kind === 'external') title.appendChild(externalLink(target.href, item.displayTitle ?? briefSourceLabel(item, target.href)));
          else title.appendChild(el('span', 'lib-unsafe-link', `${item.paperId ?? item.source ?? ''}（关联未接入）`));
          line.appendChild(title);
          if (item.published) line.appendChild(el('p', 'lib-res-meta', `发表时间：${item.published}`));
          line.appendChild(el('p', 'lib-zone-item-note', `${item.tier}：${item.displayReason ?? item.reason}`));
          sub.appendChild(line);
        }
        body.appendChild(sub);
      } else {
        body.appendChild(emptyBox(EMPTY_NOTICES.briefs));
      }
    } else if (zone.key === 'survey') {
      body = el('div', 'lib-zone-body');
      // PLAN-010 过渡态（主会话 REV 待定稿）：当前仅记忆/通信两个专题分支综述，
      // 广域「AI 发展到 Agent」脉络图待来源包补入后在本区扩展，不以两个专题综述充当总览。
      // 广域脉络图三层介绍 + 直接入口（REV001）；数据未接入时如实过渡，不放假数据。
      const land = renderLibrary.landscape;
      const landLayers = land && Array.isArray(land.nodes) && land.nodes.length > 0 ? (land.layers ?? []) : [];
      if (landLayers.length > 0) {
        const sub = el('div', 'lib-zone-sub');
        sub.appendChild(el('p', 'lib-zone-flag', '广域脉络图 · 三层结构（点击节点看详解）'));
        for (const layer of landLayers) {
          const line = el('p', 'lib-first-line');
          line.appendChild(el('strong', 'lib-step-label', `${layer.title}：`));
          line.appendChild(document.createTextNode(`${layer.summary}（${land.nodes.filter((n) => n.layer === layer.id).length} 个节点）`));
          sub.appendChild(line);
        }
        const entry = el('p', 'lib-first-line');
        entry.appendChild(link('#/map', '打开广域脉络图（图 + 层级文本 + 节点详解）', 'lib-btn'));
        sub.appendChild(entry);
        body.appendChild(sub);
      } else {
        body.appendChild(
          el('p', 'lib-notice-flat', '广域认知脉络图建设中：等待来源包核查后补入三层脉络（AI 背景 → Agent 全景 → 专题分支）与学习路径；当前先以两个专题分支综述打底。'),
        );
      }
      const surveys = renderLibrary.papers.filter((p) => p.surveyTree && Array.isArray(p.surveyTree.roots) && p.surveyTree.roots.length > 0);
      if (surveys.length === 0) body.appendChild(emptyBox(EMPTY_NOTICES.papers));
      for (const survey of surveys) {
        const item = el('div', 'lib-zone-item');
        item.appendChild(el('p', 'lib-zone-flag', `专题分支综述 · 导学树在卡内`));
        const title = el('p', 'lib-zone-item-title');
        title.appendChild(paperLink(survey));
        item.appendChild(title);
        if (survey.lead) item.appendChild(el('p', 'lib-zone-item-note', survey.lead));
        item.appendChild(el('p', 'lib-zone-item-note', '进卡后按章节来源逐层展开知识层级树：每层有解释与来源标注，站内回链是编辑排定的阅读顺序，不是论文引用。'));
        body.appendChild(item);
      }
      // 经典书目（原区五内容归入此处）：跨方向共同语言。
      const fGroups = foundationGroups(renderLibrary);
      if (fGroups.length > 0) {
        const sub = el('div', 'lib-zone-sub');
        sub.appendChild(el('p', 'lib-zone-flag', '共同语言 · 经典书目（不绑定方向的基础经典）'));
        for (const group of fGroups) {
          const line = el('p', 'lib-first-line');
          line.appendChild(link('#/foundations', group.title));
          line.appendChild(el('span', 'lib-res-meta', ` —— ${group.note}（${group.papers.length} 篇）`));
          sub.appendChild(line);
        }
        body.appendChild(sub);
      }
    } else if (zone.key === 'topic') {
      body = el('div', 'lib-zone-body');
      const directions = activeDirections(renderLibrary);
      if (directions.length === 0) body.appendChild(emptyBox(EMPTY_NOTICES.directions));
      for (const direction of directions) {
        const item = el('div', 'lib-zone-item');
        const title = el('p', 'lib-zone-item-title');
        title.appendChild(link(buildHash('route', direction.id), direction.title));
        item.appendChild(title);
        if (direction.summary) item.appendChild(el('p', 'lib-zone-item-note', direction.summary));
        body.appendChild(item);
      }
      // 四轴浓缩视图（主方向有 axisAnalysis 时）：一轴一行，指向课题页。
      const main = directions.find((d) => Array.isArray(d.axisAnalysis?.axes));
      if (main) {
        const sub = el('div', 'lib-zone-sub');
        sub.appendChild(el('p', 'lib-zone-flag', '四轴编辑分析框架（用户讨论口径，非综述公认分类）'));
        for (const axis of main.axisAnalysis.axes) {
          const line = el('p', 'lib-first-line');
          line.appendChild(el('strong', 'lib-step-label', `${axis.title}：`));
          line.appendChild(document.createTextNode(axis.explain));
          sub.appendChild(line);
        }
        const more = el('p', 'lib-first-line');
        more.appendChild(link(buildHash('route', main.id), '进课题页看四轴实例、机制与表示对照、问题演化与未定候选'));
        sub.appendChild(more);
        body.appendChild(sub);
      }
    } else if (zone.key === 'tech') {
      body = el('div', 'lib-zone-body');
      const featured = featuredTechnicalRoutes(renderLibrary);
      if (featured.length > 0) {
        for (const route of featured) {
          const item = el('div', 'lib-zone-item');
          const title = el('p', 'lib-zone-item-title');
          title.appendChild(link(buildHash('learn', route.id), route.title));
          item.appendChild(title);
          const note = el('p', 'lib-zone-item-note');
          note.appendChild(el('strong', null, '与研究能力的关系：'));
          note.appendChild(document.createTextNode(route.researchLink ?? route.capability));
          item.appendChild(note);
          item.appendChild(el('p', 'lib-res-meta', `共 ${route.units?.length ?? 0} 个单元。${route.summary ?? ''}`));
          body.appendChild(item);
        }
        const others = renderLibrary.technicalRoutes.filter((r) => r.kind !== 'featured');
        if (others.length > 0) {
          const details = el('details', 'lib-quick-group');
          details.appendChild(el('summary', 'lib-quick-title', '其他主干（当前不必先学）'));
          const line = el('p', 'lib-zone-adv');
          others.forEach((route, i) => {
            if (i > 0) line.appendChild(document.createTextNode('；'));
            line.appendChild(link(buildHash('learn', route.id), route.title));
          });
          details.appendChild(line);
          body.appendChild(details);
        }
      } else {
        for (const route of coreTechnicalRoutes(renderLibrary)) {
          const item = el('div', 'lib-zone-item');
          const title = el('p', 'lib-zone-item-title');
          title.appendChild(link(buildHash('learn', route.id), route.title));
          item.appendChild(title);
          item.appendChild(el('p', 'lib-zone-item-note', `共 ${route.units?.length ?? 0} 个单元。${route.prerequisites ?? ''}`));
          body.appendChild(item);
        }
      }
    } else {
      body = renderLegacyZone(zone);
    }
    grid.appendChild(homeZone(zone, body));
  }

}

// ---------- DYNAMIC-GUIDANCE-009 / B 包：领域认识 · 小型文字地图（#/map） ----------
// 只读展示基线 LIBRARY.map（经 computeEffective 单入口，C 包覆盖层接入后自动生效）；
// 两侧（problem／method）为文字节点，连线是编辑排定的概念关联（语义＋来源，PF-07：非论文引用）。
// 动态文本一律 textContent／createTextNode；站内 ref 解析不了降级为"待查"文字，不产生假链接。
function mapScrollButton(label, targetId) {
  const btn = el('button', 'lib-map-jump', label);
  btn.type = 'button';
  btn.addEventListener('click', () => {
    const target = document.getElementById(targetId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  return btn;
}

// 渲染一个地图节点卡片（label／summary／refs 站内链接／来源 meta 行）。
function renderMapNode(lib, node) {
  const card = el('article', `lib-map-node lib-map-node-${node.side}`);
  card.id = `lib-map-node-${node.id}`;
  card.appendChild(el('h3', 'lib-map-node-label', node.label ?? node.id));
  if (node.summary) card.appendChild(el('p', 'lib-map-node-summary', node.summary));
  const refs = Array.isArray(node.refs) ? node.refs : [];
  const refLine = el('p', 'lib-map-refs');
  refLine.appendChild(el('span', 'lib-map-inline-label', '可走到的内容：'));
  if (refs.length === 0) {
    refLine.appendChild(el('span', 'lib-muted', '（无站内条目，作为待查问题呈现）'));
  } else {
    refs.forEach((id, i) => {
      if (i > 0) refLine.appendChild(document.createTextNode('、'));
      const resolved = resolveMapRef(lib, id);
      if (resolved?.href) refLine.appendChild(link(resolved.href, resolved.label, 'lib-map-ref'));
      else refLine.appendChild(el('span', 'lib-map-unresolved', `${id}（待查：站内未解析）`));
    });
  }
  card.appendChild(refLine);
  const src = node.source ?? {};
  card.appendChild(
    el(
      'p',
      'lib-map-source',
      `来源：${MAP_ORIGIN_LABELS[src.originType] ?? src.originType ?? '未标注'}${src.note ? ` —— ${readerSourceNote(src.note)}` : ''}`,
    ),
  );
  // C 包（R4）：该节点被覆盖层新增/调整时，追加纯文本 meta 行；示例条目带示例字样。
  const meta = adjustMetaFor(currentGuidanceOverlay(), 'map-node', node.id, ['label', 'summary', 'refs']);
  if (meta) card.appendChild(el('p', 'lib-adjust-meta', meta));
  return card;
}

// 渲染一条关系：语义词汇＋注记、两端可定位、evidence 站内链接、来源 meta 行。
function renderMapEdge(lib, edge, nodeById) {
  const row = el('div', 'lib-map-edge');
  const { vocab, vocabLabel, note, qualifier } = parseMapMeaning(edge.meaning);
  const head = el('p', 'lib-map-edge-head');
  head.appendChild(el('span', 'lib-map-edge-word', `${vocabLabel ?? vocab ?? '关联'}${qualifier ? `（${qualifier}）` : ''}`));
  head.appendChild(document.createTextNode(note ? `：${note}` : ''));
  row.appendChild(head);
  const ends = el('p', 'lib-map-edge-ends');
  const fromNode = nodeById.get(edge.from);
  const toNode = nodeById.get(edge.to);
  if (!fromNode || !toNode) {
    // 端点解析不到 ⇒ 降级为待查文字，不画线、不暗示连接（R1 渲染层校验）。
    ends.appendChild(el('span', 'lib-map-unresolved', `待查：关系端点未解析（${edge.from ?? '?'} → ${edge.to ?? '?'}）`));
  } else {
    // 两端标签由各自 node.side 派生（不假设 from=方法、to=问题；depends-on 可两端同侧）。
    ends.appendChild(mapScrollButton(`${mapSideLabel(fromNode)}：${fromNode.label ?? edge.from}`, `lib-map-node-${edge.from}`));
    ends.appendChild(el('span', 'lib-map-arrow', ` ${vocab ?? 'rel'} → `));
    ends.appendChild(mapScrollButton(`${mapSideLabel(toNode)}：${toNode.label ?? edge.to}`, `lib-map-node-${edge.to}`));
  }
  row.appendChild(ends);
  const evIds = Array.isArray(edge.evidence) ? edge.evidence : [];
  const evLine = el('p', 'lib-map-evidence');
  evLine.appendChild(el('span', 'lib-map-inline-label', '证据（站内已核条目）：'));
  if (evIds.length === 0) {
    evLine.appendChild(el('span', 'lib-map-unresolved', '（无站内证据，降级为待查问题）'));
  } else {
    evIds.forEach((id, i) => {
      if (i > 0) evLine.appendChild(document.createTextNode('、'));
      const resolved = resolveMapRef(lib, id);
      if (resolved?.href) evLine.appendChild(link(resolved.href, resolved.label, 'lib-map-ref'));
      else evLine.appendChild(el('span', 'lib-map-unresolved', `${id}（待查：证据未解析）`));
    });
  }
  row.appendChild(evLine);
  const src = edge.source ?? {};
  row.appendChild(
    el(
      'p',
      'lib-map-source',
      `来源：${MAP_ORIGIN_LABELS[src.originType] ?? src.originType ?? '未标注'}${src.note ? ` —— ${readerSourceNote(src.note)}` : ''}`,
    ),
  );
  const meta = adjustMetaFor(currentGuidanceOverlay(), 'map-edge', edge.id, ['meaning', 'evidence']);
  if (meta) row.appendChild(el('p', 'lib-adjust-meta', meta));
  return row;
}

// ---------- PLAN REV001：广域认知脉络图（LIBRARY.landscape；主体在 #/map） ----------
// 图文同数据：SVG 与层级文本/详解都由同一份 nodes/edges/paths 生成；无第二份数据。
// 桌面 SVG 清楚不挤（分层三列、纵向展开），点击与键盘（Enter/Space）选节点显示详解；
// 窄屏隐藏 SVG、层级文本优先（CSS 断点）。academic 边显示审计来源；reading 边只显示编辑理由。
const LAND_NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs = {}) {
  const node = document.createElementNS
    ? document.createElementNS(LAND_NS, tag)
    : el(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

// 分层三列布局：放宽列距与行距，让完整节点标题在桌面图上可读。
function computeLandscapeLayout(land) {
  const layers = land.layers ?? [];
  const byLayer = new Map(layers.map((l) => [l.id, []]));
  for (const node of land.nodes ?? []) {
    if (!byLayer.has(node.layer)) byLayer.set(node.layer, []);
    byLayer.get(node.layer).push(node);
  }
  const COL_W = 380;
  const ROW_H = 112;
  const pos = new Map();
  layers.forEach((layer, col) => {
    const list = byLayer.get(layer.id) ?? [];
    list.forEach((node, row) => {
      pos.set(node.id, { x: col * COL_W + COL_W / 2, y: row * ROW_H + 52 });
    });
  });
  const width = Math.max(1, layers.length) * COL_W + 40;
  const maxRows = Math.max(1, ...[...byLayer.values()].map((l) => l.length));
  const height = maxRows * ROW_H + 40;
  return { pos, width, height };
}

function landscapeNodeLabel(node) {
  return node.title ?? '';
}

function wrapLandscapeLabel(title, maxUnits = 19) {
  const tokens = String(title).match(/[\p{Script=Han}]+|[A-Za-z0-9]+(?:[-–—][A-Za-z0-9]+)*|[^\s]/gu) ?? [];
  const lines = [];
  let line = '';
  let units = 0;
  let previousLatin = false;
  for (const token of tokens) {
    const latin = /^[A-Za-z0-9]/.test(token);
    const prefix = latin && previousLatin ? ' ' : '';
    const tokenUnits = /^[\p{Script=Han}]+$/u.test(token) ? token.length : [...token].length * (latin ? 0.58 : 1);
    if (line && units + tokenUnits + (prefix ? 0.6 : 0) > maxUnits) {
      lines.push(line);
      line = token;
      units = tokenUnits;
    } else {
      line += prefix + token;
      units += tokenUnits + (prefix ? 0.6 : 0);
    }
    previousLatin = latin;
  }
  if (line) lines.push(line);
  return lines;
}

// 节点详解：guide（连贯讲解）优先；六字段速览退居折叠（有讲解时），无讲解节点字段保持直出。
// 边分两类显示：学术关系带来源文献名（内部审计编号只在数据字段、不上屏）；建议阅读顺序标注为编辑安排。
function renderLandscapeDetail(land, node, nodeById) {
  const box = el('section', 'lib-land-detail');
  box.appendChild(el('h4', 'lib-land-detail-title', node.title ?? ''));
  box.appendChild(el('p', 'lib-res-meta', `${node.when ?? ''} · ${(land.layers.find((l) => l.id === node.layer) ?? {}).title ?? node.layer}`));
  const fields = [
    ['问题', node.problem],
    ['思想', node.idea],
    ['例子', node.example],
    ['能力变化', node.capability],
    ['局限', node.limitation],
    ['来源', node.source?.note ?? null],
  ];
  const buildFields = () => {
    const dl = el('dl', 'lib-land-fields');
    for (const [label, value] of fields) {
      if (!value) continue;
      dl.appendChild(el('dt', null, label));
      dl.appendChild(el('dd', null, value));
    }
    return dl;
  };
  if (node.guide && typeof node.guide === 'object') {
    // PLAN-011 B3：讲解优先，原六字段作速览折叠，避免双重全量展开。
    const guideBox = el('div', 'lib-land-guide');
    for (const part of ['motivation', 'mechanism', 'example', 'confusion', 'links']) {
      const text = node.guide[part];
      if (!text) continue;
      guideBox.appendChild(el('p', 'lib-land-guide-part', text));
    }
    box.appendChild(guideBox);
    // 审查修复（PLAN-011 修复轮）：guide 下保留一句常显来源＋证据级/关键身份，完整来源仍在折叠速览内。
    if (node.sourceBrief) box.appendChild(el('p', 'lib-land-source-brief', node.sourceBrief));
    const fieldsWrap = el('details', 'lib-quick-group lib-land-fields-wrap');
    const summary = el('summary', null, '字段速览（问题/思想/例子/能力变化/局限/来源）');
    fieldsWrap.appendChild(summary);
    fieldsWrap.appendChild(buildFields());
    box.appendChild(fieldsWrap);
  } else {
    box.appendChild(buildFields());
  }
  const touching = (land.edges ?? []).filter((e) => e.from === node.id || e.to === node.id);
  if (touching.length > 0) {
    box.appendChild(el('p', 'lib-land-detail-sub', '前后关系'));
    const ul = el('ul', 'lib-list');
    for (const edge of touching) {
      const otherId = edge.from === node.id ? edge.to : edge.from;
      const other = nodeById.get(otherId);
      const li = el('li');
      const line = el('p', 'lib-step-line');
      line.appendChild(el('strong', null, other ? other.title : otherId));
      line.appendChild(document.createTextNode(
        edge.kind === 'academic'
          ? ` —— 学术关系：${edge.note ?? ''}（来源：${edge.source?.note ?? ''}）`
          : ` —— 建议的阅读顺序（编辑安排）：${edge.note ?? ''}`,
      ));
      li.appendChild(line);
      ul.appendChild(li);
    }
    box.appendChild(ul);
  }
  return box;
}

function renderLandscape(land, context = {}) {
  const box = el('section', 'lib-land');
  box.appendChild(el('p', 'lib-map-note', '这张图从 AI 背景、Agent 组成一路连到研究专题。各条知识线索并行发展，不是单一路线彼此取代；原文来源可用于核对和延伸阅读。'));

  const nodeById = new Map((land.nodes ?? []).map((n) => [n.id, n]));
  const { pos, width, height } = computeLandscapeLayout(land);
  const openNode = (node, pathId = context.mapPathId) => {
    const returnY = typeof window !== 'undefined' ? Math.max(0, Math.round(window.scrollY ?? 0)) : 0;
    if (typeof window !== 'undefined') {
      window.location.hash = mapHash({ node: node.id, path: pathId, y: returnY });
    }
  };

  // —— SVG（桌面主视图；窄屏 CSS 隐藏，层级文本优先）——
  const svg = svgEl('svg', { class: 'lib-land-svg', viewBox: `0 0 ${width} ${height}`, role: 'group', 'aria-label': '广域认知脉络图' });
  for (const [col, layer] of (land.layers ?? []).entries()) {
    const heading = svgEl('text', { x: col * 380 + 190, y: 25, class: 'lib-land-column-title', 'text-anchor': 'middle' });
    heading.textContent = layer.title ?? '';
    svg.appendChild(heading);
  }
  // 边先画（在下层）。
  for (const edge of land.edges ?? []) {
    const a = pos.get(edge.from);
    const b = pos.get(edge.to);
    if (!a || !b) continue;
    const line = svgEl('line', {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      class: `lib-land-edge lib-land-edge-${edge.kind}`,
    });
    const title = svgEl('title');
    title.textContent = edge.kind === 'academic'
      ? `学术关系：${edge.note ?? ''}（来源：${edge.source?.note ?? ''}）`
      : `建议的阅读顺序（编辑安排）：${edge.note ?? ''}`;
    line.appendChild(title);
    svg.appendChild(line);
  }
  // 节点后画（在上层），可点击/可键盘。
  const textButtons = [];
  for (const node of land.nodes ?? []) {
    const p = pos.get(node.id);
    if (!p) continue;
    const g = svgEl('g', {
      class: 'lib-land-node',
      tabindex: '0',
      role: 'button',
      'aria-label': `${node.title}（${node.when ?? ''}）`,
    });
    g.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: 17, class: 'lib-land-dot' }));
    const label = svgEl('text', { x: p.x, y: p.y + 33, class: 'lib-land-label', 'text-anchor': 'middle' });
    const lines = wrapLandscapeLabel(landscapeNodeLabel(node));
    lines.forEach((line, i) => {
      const span = svgEl('tspan', { x: p.x, dy: i === 0 ? 0 : 18 });
      span.textContent = line;
      label.appendChild(span);
    });
    g.appendChild(label);
    g.addEventListener('click', () => openNode(node));
    g.addEventListener('keydown', (event) => {
      if (event?.key === 'Enter' || event?.key === ' ') {
        event?.preventDefault?.();
        openNode(node);
      }
    });
    svg.appendChild(g);
  }
  // 图形独占概览主体；长篇讲解只在点击节点后的详情页出现。
  box.appendChild(svg);
  const legend = el('p', 'lib-land-legend');
  legend.appendChild(el('span', 'lib-land-legend-solid', '实线：有来源的知识关系'));
  legend.appendChild(el('span', 'lib-land-legend-dashed', '虚线：建议阅读顺序'));
  box.appendChild(legend);

  // —— 层级节点索引作为图形下方的辅助入口，默认收起 ——
  const layersBox = el('div', 'lib-land-layers');
  for (const layer of land.layers ?? []) {
    const details = el('details', 'lib-land-layer');
    details.open = false;
    const summary = el('summary', 'lib-land-layer-summary');
    summary.appendChild(el('strong', null, layer.title ?? ''));
    summary.appendChild(el('span', 'lib-res-meta', ` —— ${layer.summary ?? ''}（${(land.nodes ?? []).filter((n) => n.layer === layer.id).length} 个节点）`));
    details.appendChild(summary);
    const list = el('div', 'lib-land-layer-body');
    for (const node of (land.nodes ?? []).filter((n) => n.layer === layer.id)) {
      const button = el('button', 'lib-land-item', `${node.title}（${node.when ?? ''}）`);
      button.type = 'button';
      button.addEventListener('click', () => openNode(node));
      list.appendChild(button);
    }
    details.appendChild(list);
    layersBox.appendChild(details);
  }
  box.appendChild(layersBox);

  // —— 学习路径放在图下方折叠，避免与主图争夺首屏 ——
  if (Array.isArray(land.paths) && land.paths.length > 0) {
    const pathsBox = el('details', 'lib-land-paths');
    pathsBox.open = Boolean(context.mapPathId);
    pathsBox.appendChild(el('summary', null, '浏览学习路径（建议顺序）'));
    for (const path of land.paths) {
      const item = el('div', 'lib-land-path');
      item.appendChild(el('p', 'lib-land-path-title', path.title ?? ''));
      if (path.description) item.appendChild(el('p', 'lib-zone-how', path.description));
      const chain = el('p', 'lib-first-line');
      (path.nodeIds ?? []).forEach((ref, i) => {
        if (i > 0) chain.appendChild(document.createTextNode(' → '));
        const node = nodeById.get(ref);
        if (node) {
          const button = el('button', 'lib-land-chain', node.title);
          button.type = 'button';
          button.addEventListener('click', () => openNode(node, path.id));
          chain.appendChild(button);
        } else {
          chain.appendChild(document.createTextNode(ref));
        }
      });
      item.appendChild(chain);
      pathsBox.appendChild(item);
    }
    box.appendChild(pathsBox);
  }

  return box;
}

function mapHash(params = {}) {
  const entries = Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== '');
  if (entries.length === 0) return '#/map';
  return `#/map?${entries.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join('&')}`;
}

function renderLandscapeOverview(land, context) {
  const overview = el('section', 'lib-land-overview');
  const makeNodeLink = (node, pathId = context.mapPathId) => {
    const returnY = typeof window !== 'undefined' ? Math.max(0, Math.round(window.scrollY ?? 0)) : 0;
    const href = mapHash({ node: node.id, path: pathId, layout: context.mapLayout, y: returnY });
    const card = el('a', 'lib-land-card');
    card.href = href;
    card.appendChild(el('strong', 'lib-land-card-title', node.title));
    if (node.problem) card.appendChild(el('span', 'lib-land-card-summary', node.problem));
    return card;
  };
  const groupNodes = (nodes, ids) => ids.map((id) => nodes.find((node) => node.id === id)).filter(Boolean);
  for (const layer of land.layers ?? []) {
    const layerBox = el('section', `lib-land-band lib-land-band-${layer.id}`);
    layerBox.appendChild(el('h2', 'lib-land-band-title', layer.title));
    layerBox.appendChild(el('p', 'lib-land-band-intro', layer.summary));
    const nodes = (land.nodes ?? []).filter((node) => node.layer === layer.id);
    if (layer.id === 'land-layer-agent') {
      const groups = [
        ['认识与决策', ['land-b1', 'land-b2', 'land-c1', 'land-c2', 'land-c3']],
        ['行动与知识', ['land-d1', 'land-d2', 'land-d3']],
        ['协作、评测与应用', ['land-e1', 'land-e2', 'land-e3', 'land-e4', 'land-e5']],
      ];
      const grid = el('div', 'lib-land-subgroups');
      for (const [title, ids] of groups) {
        const subgroup = el('section', 'lib-land-subgroup');
        subgroup.appendChild(el('h3', 'lib-land-subgroup-title', title));
        const subgroupGrid = el('div', 'lib-land-cards');
        for (const node of groupNodes(nodes, ids)) subgroupGrid.appendChild(makeNodeLink(node));
        subgroup.appendChild(subgroupGrid);
        grid.appendChild(subgroup);
      }
      layerBox.appendChild(grid);
    } else {
      const grid = el('div', 'lib-land-cards');
      for (const node of nodes) grid.appendChild(makeNodeLink(node));
      layerBox.appendChild(grid);
    }
    overview.appendChild(layerBox);
  }

  const selectedPath = (land.paths ?? []).find((path) => path.id === context.mapPathId);
  const pathsBox = el('details', 'lib-land-paths');
  pathsBox.open = Boolean(selectedPath);
  pathsBox.appendChild(el('summary', null, '按学习路径浏览（可跳读）'));
  for (const path of land.paths ?? []) {
    const pathBox = el('section', 'lib-land-path-option');
    pathBox.appendChild(el('h3', 'lib-land-subgroup-title', path.title));
    if (path.description) pathBox.appendChild(el('p', 'lib-land-path-description', path.description));
    const chain = el('p', 'lib-land-path-chain');
    (path.nodeIds ?? []).forEach((id, index) => {
      const node = land.nodes.find((item) => item.id === id);
      if (!node) return;
      if (index > 0) chain.appendChild(document.createTextNode(' → '));
      chain.appendChild(link(mapHash({ node: node.id, path: path.id }), node.title, 'lib-land-path-link'));
    });
    pathBox.appendChild(chain);
    pathsBox.appendChild(pathBox);
  }
  overview.appendChild(pathsBox);
  return overview;
}

function renderLandscapeLesson(land, node, context) {
  const lesson = el('article', 'lib-land-lesson');
  const returnHref = mapHash({ layout: context.mapLayout, path: context.mapPathId, y: context.mapScrollY ?? 0 });
  lesson.appendChild(link(returnHref, '← 返回知识地图', 'lib-land-back'));
  const layer = land.layers.find((item) => item.id === node.layer);
  lesson.appendChild(el('p', 'lib-land-lesson-kicker', `${layer?.title ?? ''}${node.when ? ` · ${node.when}` : ''}`));
  lesson.appendChild(el('h1', 'lib-land-lesson-title', node.title));
  if (node.problem) lesson.appendChild(el('p', 'lib-land-lesson-lead', node.problem));

  const headings = {
    motivation: '为什么需要这条思路',
    mechanism: '它是怎样工作的',
    example: '用例子理解',
    confusion: '容易混淆与局限',
    links: '它和前后知识的关系',
  };
  const guide = node.guide ?? {};
  for (const key of ['motivation', 'mechanism', 'example', 'confusion', 'links']) {
    const text = guide[key] ?? node[key === 'example' ? 'example' : key === 'motivation' ? 'problem' : key === 'mechanism' ? 'idea' : key === 'confusion' ? 'limitation' : 'capability'];
    if (!text) continue;
    const section = el('section', 'lib-land-lesson-section');
    section.appendChild(el('h2', 'lib-land-lesson-heading', headings[key]));
    section.appendChild(el('p', 'lib-land-lesson-text', text));
    lesson.appendChild(section);
  }

  const related = (land.edges ?? []).filter((edge) => edge.from === node.id || edge.to === node.id);
  if (related.length > 0) {
    const section = el('section', 'lib-land-related');
    section.appendChild(el('h2', 'lib-land-lesson-heading', '相关节点'));
    const list = el('ul', 'lib-land-related-list');
    for (const edge of related) {
      const otherId = edge.from === node.id ? edge.to : edge.from;
      const other = land.nodes.find((item) => item.id === otherId);
      if (!other) continue;
      const row = el('li');
      row.appendChild(link(mapHash({ node: other.id, path: context.mapPathId }), other.title));
      row.appendChild(document.createTextNode(` — ${edge.kind === 'academic' ? '知识关系' : '推荐阅读顺序'}：${edge.note ?? ''}`));
      list.appendChild(row);
    }
    section.appendChild(list);
    lesson.appendChild(section);
  }

  const source = readerSourceNote(node.sourceBrief?.split(/[；;]/, 1)[0] ?? node.source?.note?.split(/[；;]/, 1)[0] ?? '');
  if (source) lesson.appendChild(el('p', 'lib-land-source-brief', source.replace(/^来源[：:]\s*/, '参考：')));
  const nextPath = (land.paths ?? []).find((path) => path.id === context.mapPathId);
  if (nextPath) {
    const position = nextPath.nodeIds.indexOf(node.id);
    const next = nextPath.nodeIds.slice(position + 1).map((id) => land.nodes.find((item) => item.id === id)).find(Boolean);
    if (next) lesson.appendChild(link(mapHash({ node: next.id, path: nextPath.id }), `继续学习：${next.title}`, 'lib-land-next'));
  }
  return lesson;
}

function renderMap(container) {
  const page = el('div', 'lib-page lib-map-reader');
  container.appendChild(page);
  const route = parseHash(typeof window === 'undefined' ? '#/map' : window.location.hash) ?? {};
  const land = renderLibrary.landscape;
  const node = (land?.nodes ?? []).find((item) => item.id === route.mapNodeId);
  const path = (land?.paths ?? []).find((item) => item.id === route.mapPathId);
  const context = { ...route, mapPathId: path?.id ?? null };
  if (route.mapNodeId && node) {
    page.appendChild(renderLandscapeLesson(land, node, context));
    return;
  }
  page.appendChild(crumb([{ text: '首页', href: '#/home' }, { text: '知识地图' }]));
  page.appendChild(el('h1', 'lib-display', '从 AI 到 Agent：知识地图'));
  page.appendChild(el('p', 'lib-sub', '先看三层知识脉络与节点关系；点击任一节点，进入独立讲解页。'));
  page.appendChild(renderLandscape(land, context));

  const legacyNodes = renderLibrary.map?.nodes ?? [];
  if (legacyNodes.length > 0) {
    const legacy = el('details', 'lib-map-legacy');
    legacy.appendChild(el('summary', null, '跨工具协作专题关系'));
    const list = el('div', 'lib-map-legacy-nodes');
    for (const item of legacyNodes) list.appendChild(renderMapNode(renderLibrary, item));
    legacy.appendChild(list);
    const edges = renderLibrary.map?.edges ?? [];
    if (edges.length > 0) {
      const edgeList = el('div', 'lib-map-legacy-edges');
      const nodeById = new Map(legacyNodes.map((item) => [item.id, item]));
      for (const edge of edges) edgeList.appendChild(renderMapEdge(renderLibrary, edge, nodeById));
      legacy.appendChild(edgeList);
    }
    page.appendChild(legacy);
  }

  if (Number.isFinite(Number(route.mapScrollY)) && Number(route.mapScrollY) > 0 && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
    window.scrollTo(0, Number(route.mapScrollY));
  }
}

function renderMapLegacy(container) {
  // renderLibrary 已是本轮生效库（renderApp 经 computeEffective 单入口算出）；地图直接读它。
  const nodes = renderLibrary.map?.nodes ?? [];
  const edges = renderLibrary.map?.edges ?? [];
  const overlay = currentGuidanceOverlay();
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const page = el('div', 'lib-page lib-map');
  container.appendChild(page);
  page.appendChild(crumb([{ text: '首页', href: '#/home' }, { text: '领域地图' }]));

  // PLAN REV001：广域认知脉络图为主体；旧 009 基线地图保留为次级区（数据与校验不动）。
  const land = renderLibrary.landscape;
  const landActive = land && Array.isArray(land.nodes) && land.nodes.length > 0;
  if (landActive) {
    page.appendChild(el('h2', 'lib-display', '领域认识 · 广域脉络图'));
    page.appendChild(el('p', 'lib-sub', '从 AI 发展的整体脉络理解 Agent：三层结构（AI 背景 · Agent 全景 · 专题分支），层内与层间是并行分支的合流而非单线进化；点击或键盘选节点看详解，层级文本与图同一份数据，手机上以文本为主。'));
    page.appendChild(renderLandscape(land));
    page.appendChild(el('h3', 'lib-block-title', '站内专题认识图（DYNAMIC-GUIDANCE-009 基线）'));
    page.appendChild(el('p', 'lib-zone-how', '起步方向的专题文字地图：problem/method 两侧、关系语义与来源逐条标注，数据契约与导学覆盖层规则不变。'));
  } else {
    // 过渡态（来源审计未交付）：如实说明，不放假数据；专题基线地图仍是本页主体。
    page.appendChild(
      el('p', 'lib-notice-flat', '广域认知脉络图建设中：等待 ai-agent-landscape-source-audit 来源包核查完成后补入（20–26 节点、AI 背景/Agent 全景/专题三层 + 学习路径）。下方为站内专题认识图（009 基线）。'),
    );
  }
  page.appendChild(el('h2', 'lib-display', landActive ? '专题认识图 · 小型文字地图' : 'Agent 协作 · 小型文字地图'));
  page.appendChild(el('p', 'lib-sub', '从「研究对象／问题」与「方法／解决思想」两侧看当前起步方向：每个节点是一段可核对的文字，每条连线注明它的语义与来源，未连接处只作待查问题。'));
  page.appendChild(el('p', 'lib-map-note', MAP_PROVENANCE_NOTE));
  page.appendChild(el('p', 'lib-map-note', MAP_NO_PROGRESS_NOTE));
  page.appendChild(el('p', 'lib-map-note', MAP_UNREVIEWED_NOTE));

  // 未入图方向：不写死条目名，按当前数据派生（哪个 active 方向的 id/步骤既不在节点 ref，
  // 也不在边的端点/evidence，即本轮未进入基线）——避免数据变化后文案陈旧（B 包审查项：source pinning）。
  const represented = new Set();
  for (const n of nodes) {
    represented.add(n.id);
    for (const r of n.refs ?? []) represented.add(r);
  }
  for (const e of edges) {
    represented.add(e.from);
    represented.add(e.to);
    for (const ev of e.evidence ?? []) represented.add(ev);
  }
  const excludedDirections = activeDirections(renderLibrary).filter((d) => {
    if (represented.has(d.id)) return false;
    return !trackEntries(renderLibrary, d.id, 'start').some((s) => represented.has(s.id));
  });
  if (excludedDirections.length > 0) {
    page.appendChild(
      el('p', 'lib-map-note', `${MAP_BASELINE_SCOPE_NOTE} 本轮未进入基线的方向：${excludedDirections.map((d) => d.title).join('、')}。`),
    );
  }

  // C 包：覆盖层示例条目（节点/边/字段调整）进入本页时按 R6 规则②常驻横幅＋逐条 meta。
  const mapRefs = [];
  for (const n of nodes) mapRefs.push(`map-node:${n.id}:`, ...['label', 'summary', 'refs'].map((f) => `map-node:${n.id}:${f}`));
  for (const e of edges) mapRefs.push(`map-edge:${e.id}:`, ...['meaning', 'evidence'].map((f) => `map-edge:${e.id}:${f}`));
  const mapAdjustments = mapRefs.map((ref) => overlayEntry(overlay, ref)).filter(Boolean);
  if (mapAdjustments.some((entry) => entry.example === true) || nodes.some((n) => n.example === true) || edges.some((e) => e.example === true)) {
    page.appendChild(el('p', 'lib-example-banner', `${EXAMPLE_BANNER_TEXT}：本页含覆盖层示例条目，不是真实导学调整`));
  }
  if (mapAdjustments.length > 0) {
    page.appendChild(
      el('p', 'lib-map-note', `本页有 ${mapAdjustments.length} 处导学调整来自已确认提案（来源逐条注明；内容模块文件未被改写）。`),
    );
  }

  // 起步动线一行：首页 → 地图 → 问题导读（primer）→ 原文（论文卡）。
  const pathLine = el('p', 'lib-map-path');
  pathLine.appendChild(el('span', 'lib-map-inline-label', '起步动线：'));
  const focus = resolveHomeFocus(renderBase);
  pathLine.appendChild(link('#/home', '首页'));
  pathLine.appendChild(document.createTextNode(' → '));
  pathLine.appendChild(el('span', null, '本页地图'));
  pathLine.appendChild(document.createTextNode(' → '));
  const primer = focus.step?.resolved?.kind === 'article'
    ? link(focus.step.resolved.href, focus.step.resolved.title)
    : link('#/home', '问题导读');
  pathLine.appendChild(primer);
  pathLine.appendChild(document.createTextNode(' → 论文原文与「我的记录」文本'));
  page.appendChild(pathLine);

  if (nodes.length === 0) {
    page.appendChild(emptyBox('地图尚未接入：基线节点将在来源核查完成后由内容工作补入。'));
    return;
  }

  // 两侧分栏。
  const sides = el('div', 'lib-map-sides');
  for (const side of ['problem', 'method']) {
    const col = el('section', `lib-map-col lib-map-col-${side}`);
    col.appendChild(el('h3', 'lib-map-col-title', MAP_SIDE_LABELS[side] ?? side));
    const sideNodes = nodes.filter((n) => n.side === side);
    if (sideNodes.length === 0) col.appendChild(el('p', 'lib-muted', '（本侧暂无节点）'));
    for (const node of sideNodes) col.appendChild(renderMapNode(renderLibrary, node));
    sides.appendChild(col);
  }
  page.appendChild(sides);

  // 关系表。
  page.appendChild(el('h3', 'lib-block-title', '有据关联（编辑排定的概念关联，非论文引用）'));
  const edgesBox = el('div', 'lib-map-edges');
  if (edges.length === 0) {
    edgesBox.appendChild(el('p', 'lib-muted', '暂无可呈现的关系；待来源核查后补入。'));
  } else {
    for (const edge of edges) edgesBox.appendChild(renderMapEdge(renderLibrary, edge, nodeById));
  }
  page.appendChild(edgesBox);
  page.appendChild(el('p', 'lib-map-foot', `当前基线共 ${nodes.length} 个节点、${edges.length} 条关系（含覆盖层后总额受 R1 上限约束）。这些计数是内容规模，不是任何人的阅读进度。`));
}

// ---------- 导学调整页（提案提交→预览→确认→撤销→备份；本机闭环，无网络写入） ----------

function renderGuidance(container) {
  const page = el('div', 'lib-page lib-guidance');
  container.appendChild(page);
  page.appendChild(crumb([{ text: '首页', href: '#/home' }, { text: '导学调整' }]));
  page.appendChild(el('h2', 'lib-display', '导学调整（本机提案闭环）'));
  page.appendChild(
    el(
      'p',
      'lib-intro',
      '粘贴或导入有版本的结构化调整提案（kind=rw.guidance-proposal）：网站做白名单校验与差异预览，逐条显式确认后写入本机导学覆盖层；未确认前刷新/关闭即整案丢弃。覆盖层只改指导字段——不写论文事实、不写已读状态、不读写你的笔记与待读清单（那是另一个独立键 research-workbench:v3）。',
    ),
  );
  for (const notice of guidanceUi.notices.splice(0)) {
    page.appendChild(el('p', 'lib-notice-flat', notice));
  }
  const storage = guidanceStorage();
  const loaded = storage ? loadOverlay(storage, renderBase) : { kind: 'unavailable', overlay: null, raw: null };
  if (loaded.kind === 'unavailable') {
    page.appendChild(el('p', 'lib-notice-flat', '本浏览器存储不可用：导学覆盖层无法读写，页面按基线内容显示；原记录不受影响。'));
  } else if (loaded.kind === 'corrupt') {
    page.appendChild(
      el('p', 'lib-example-banner', '导学覆盖层存储已损坏：页面按基线内容显示（你的 v3 笔记不受影响）。不猜测修复、不静默清空——建议先导出坏档原文自查。'),
    );
    const rawBtn = el('button', 'lib-btn', '导出坏档原文（供自查）');
    rawBtn.type = 'button';
    rawBtn.addEventListener('click', () => {
      downloadGuidanceFile(`research-workbench-guidance-corrupt-${new Date().toISOString().slice(0, 10)}.txt`, loaded.raw ?? '', 'text/plain');
      guidanceUi.corruptExported = true;
      pushGuidanceNotice('坏档原文已导出；确认备份后可重置。');
      renderApp();
    });
    page.appendChild(rawBtn);
    if (guidanceUi.corruptExported) {
      const forceReset = el('button', 'lib-btn', '已导出坏档，确认重置覆盖层');
      forceReset.type = 'button';
      forceReset.addEventListener('click', async () => {
        const r = await resetCorruptOverlay({ storage, navigatorLike: guidanceNavigator(), base: renderBase });
        pushGuidanceNotice(r.ok ? '已重置：覆盖层回到空态（seq 继续递增）。' : r.message ?? '重置未执行。');
        guidanceUi.corruptExported = false;
        renderApp();
      });
      page.appendChild(forceReset);
    }
  }

  // —— 提交区（复制粘贴或本地文件；两者同走一条校验路径）——
  const submit = el('section', 'lib-guidance-block');
  submit.appendChild(el('h3', 'lib-block-title', '提交调整提案（粘贴 JSON 或选择本地文件）'));
  submit.appendChild(
    el('p', 'lib-muted', '提案须为有界结构化 JSON（来源类型＋日期、稳定目标、旧版依据 expectedBase、拟变更值、理由、证据边界）。解析失败或不合规只会提示「尚未形成可应用调整」，不会宣称任何路线更新。'),
  );
  const textarea = el('textarea', 'lib-guidance-textarea');
  textarea.placeholder = '把提案 JSON 粘贴到这里（或点下方按钮选择 .json 文件填入）…';
  textarea.setAttribute('aria-label', '导学提案 JSON 文本');
  submit.appendChild(textarea);
  const validateBtn = el('button', 'lib-btn', '校验并预览');
  validateBtn.type = 'button';
  validateBtn.addEventListener('click', () => submitProposalText(textarea.value ?? ''));
  submit.appendChild(validateBtn);
  const fileInput = el('input', 'lib-guidance-file');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.setAttribute('aria-label', '选择导学提案 JSON 文件');
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try {
      const text = await readProposalFileText(file);
      textarea.value = text;
      submitProposalText(text);
    } catch (e) {
      pushGuidanceNotice(`读取文件失败：${e?.message ?? '未知原因'}；未做任何更改。`);
      renderApp();
    }
  });
  submit.appendChild(fileInput);
  if (guidanceUi.submitErrors) {
    const rej = el('p', 'lib-example-banner', `尚未形成可应用调整：${guidanceUi.submitErrors.firstError}`);
    submit.appendChild(rej);
    const ul = el('ul', 'lib-list');
    for (const err of guidanceUi.submitErrors.errors.slice(0, 6)) ul.appendChild(el('li', 'lib-muted', err));
    submit.appendChild(ul);
  }
  page.appendChild(submit);

  // —— 待确认预览（仅本会话内存；pending 不落盘）——
  for (const pending of guidanceUi.pending) renderProposalPreview(page, pending);
  if (guidanceUi.pending.length === 0) {
    const none = el('section', 'lib-guidance-block');
    none.appendChild(el('p', 'lib-muted', '当前没有待确认提案。'));
    page.appendChild(none);
  }

  renderGuidanceEffective(page, loaded);
  renderGuidanceHistory(page, loaded);
  renderGuidanceBackup(page, loaded);
  renderGuidanceBaselineCopy(page);
}

function renderProposalPreview(page, pending) {
  const proposal = pending.proposal;
  const overlay = currentGuidanceOverlay();
  const box = el('section', 'lib-guidance-block lib-preview');
  box.appendChild(
    el(
      'h3',
      'lib-block-title',
      `提案 ${proposal.id} · 来源：${ORIGIN_SOURCE_LABELS[proposal.origin.sourceType] ?? proposal.origin.sourceType} ${proposal.origin.asOf}（${proposal.origin.label}）`,
    ),
  );
  if (proposal.example === true) box.appendChild(el('p', 'lib-example-banner', `${EXAMPLE_BANNER_TEXT}：这是示例提案（顶部常驻），确认后写入的条目也将永久携带示例标记`));
  box.appendChild(el('p', 'lib-preview-evidence', `证据边界：${proposal.origin.evidenceNote}`));
  box.appendChild(
    el('p', 'lib-muted', '逐条选择「采纳此条 / 保持旧值」；stale-base（旧值与当前生效值不一致）以三格对照呈现、逐条判断、不自动合并。「确认并写入」只写入被采纳的条目，写入完整成功或旧状态不变。'),
  );
  const ul = el('ul', 'lib-list');
  for (const item of pending.validation.items) {
    const li = el('li', 'lib-preview-item');
    const head = el('p', 'lib-preview-target');
    head.appendChild(
      document.createTextNode(
        `#${item.index + 1} ${targetLabel(renderBase, overlay, { type: item.target.type, id: item.target.id }, item.target.field ?? '')}（${item.op}${item.status === 'stale' ? ' · stale-base：expectedBase 与当前生效值不一致，见三格对照' : ''}）`,
      ),
    );
    li.appendChild(head);
    const dl = el('dl', 'lib-preview-diff');
    const rows = [
      ['提案旧值', item.op === 'insert' ? '（新增，无旧值）' : guidanceDisplayValue(item.proposalOld ?? '')],
      ['当前生效值', item.baseCurrent === null || item.baseCurrent === undefined ? '（新增目标）' : guidanceDisplayValue(item.baseCurrent)],
      ['拟变更为新值', guidanceDisplayValue(item.newValue)],
      ['理由', item.reason],
    ];
    for (const [label, value] of rows) {
      dl.appendChild(el('dt', null, label));
      dl.appendChild(el('dd', null, value));
    }
    li.appendChild(dl);
    const choiceLine = el('p', 'lib-preview-choice');
    const acceptBtn = el('button', 'lib-btn', '✓ 采纳此条');
    acceptBtn.type = 'button';
    if (pending.choices[item.ref] === 'accept') acceptBtn.classList.add('lib-choice-on');
    acceptBtn.addEventListener('click', () => {
      pending.choices[item.ref] = 'accept';
      renderApp();
    });
    const keepBtn = el('button', 'lib-btn', '✗ 保持旧值');
    keepBtn.type = 'button';
    if (pending.choices[item.ref] === 'keep') keepBtn.classList.add('lib-choice-on');
    keepBtn.addEventListener('click', () => {
      pending.choices[item.ref] = 'keep';
      renderApp();
    });
    choiceLine.appendChild(acceptBtn);
    choiceLine.appendChild(keepBtn);
    choiceLine.appendChild(el('span', 'lib-muted', pending.choices[item.ref] ? `（已选：${pending.choices[item.ref] === 'accept' ? '采纳此条' : '保持旧值'}）` : '（未选择）'));
    li.appendChild(choiceLine);
    ul.appendChild(li);
  }
  box.appendChild(ul);
  const actions = el('p', 'lib-focus-actions');
  const confirmBtn = el('button', 'lib-btn', '确认并写入');
  confirmBtn.type = 'button';
  confirmBtn.addEventListener('click', () => confirmPendingProposal(pending));
  const discardBtn = el('button', 'lib-btn', '整案不采纳');
  discardBtn.type = 'button';
  discardBtn.addEventListener('click', () => discardPendingProposal(pending));
  const revalidateBtn = el('button', null, '重新预览（按当前生效态重算三格对照）');
  revalidateBtn.type = 'button';
  revalidateBtn.addEventListener('click', () => revalidatePendingProposal(pending));
  actions.appendChild(confirmBtn);
  actions.appendChild(discardBtn);
  actions.appendChild(revalidateBtn);
  box.appendChild(actions);
  page.appendChild(box);
}

// —— 当前生效的导学调整 + 撤销最近一次（R5：撤销只回指导覆盖层、一次全回，不丢笔记）——
function renderGuidanceEffective(page, loaded) {
  const section = el('section', 'lib-guidance-block');
  section.appendChild(el('h3', 'lib-block-title', '当前生效的导学调整'));
  const overlay = loaded.kind === 'ok' ? loaded.overlay : null;
  const entries = Object.entries(overlay?.entries ?? {});
  if (entries.length === 0) {
    section.appendChild(el('p', 'lib-muted', '无生效调整：页面内容＝基线内容。'));
  } else {
    if (entries.some(([, entry]) => entry.example === true)) {
      section.appendChild(el('p', 'lib-example-banner', `${EXAMPLE_BANNER_TEXT}：以下含示例条目（横幅从持久字段重建，刷新/重开/import 后仍显示）`));
    }
    const ul = el('ul', 'lib-list');
    for (const [ref, entry] of entries) {
      const li = el('li');
      const firstColon = ref.indexOf(':');
      const lastColon = ref.lastIndexOf(':');
      const type = ref.slice(0, firstColon);
      const id = ref.slice(firstColon + 1, lastColon);
      const field = ref.slice(lastColon + 1);
      li.appendChild(
        document.createTextNode(
          `${targetLabel(renderBase, overlay, { type, id }, field || '')} → ${guidanceDisplayValue(entry.value).slice(0, 80)}${guidanceDisplayValue(entry.value).length > 80 ? '…' : ''}（提案 ${entry.proposalId} · ${entry.appliedAt.slice(0, 10)}）`,
        ),
      );
      li.appendChild(el('span', 'lib-res-meta', ` ${adjustLabel(entry)}`));
      ul.appendChild(li);
    }
    section.appendChild(ul);
  }
  if (overlay && Object.keys(overlay.tombstones ?? {}).length > 0) {
    section.appendChild(el('p', 'lib-muted', `已移除并封存（tombstones，释放后不复用）${Object.keys(overlay.tombstones).length} 个覆盖层自有 id；上限 ${40} 满时需先重置。`));
  }
  if (overlay?.undoSlot) {
    const undoBtn = el('button', 'lib-btn', '撤销最近一次导学调整');
    undoBtn.type = 'button';
    undoBtn.disabled = !canUndo(overlay);
    undoBtn.addEventListener('click', () => undoLastGuidance());
    section.appendChild(undoBtn);
    if (!canUndo(overlay)) {
      section.appendChild(el('p', 'lib-muted', '撤销只支持回退最近一次「应用」；若末条是撤销/重置/导入，连续回退请走「重置导学覆盖层」。'));
    }
  } else {
    section.appendChild(el('p', 'lib-muted', '没有可撤销的最近调整（撤销槽只保留最近一次应用前的完整快照）。'));
  }
  section.appendChild(el('p', 'lib-muted', '撤销＝恢复应用前的完整覆盖层快照并前向写入（seq+1，history 只追加）；多字段提案一次全回，不留半套；绝不触碰 v3 笔记。'));
  page.appendChild(section);
}

// —— 基本历史（≤20 条摘要；只追加不回删）——
function renderGuidanceHistory(page, loaded) {
  const section = el('section', 'lib-guidance-block');
  section.appendChild(el('h3', 'lib-block-title', '导学调整历史（本机，最多保留 20 条摘要）'));
  const history = loaded.kind === 'ok' ? loaded.overlay?.history ?? [] : [];
  if (history.length === 0) {
    section.appendChild(el('p', 'lib-muted', '暂无记录：应用、撤销、导入、重置都会在此留下 seq 递增的条目。'));
    page.appendChild(section);
    return;
  }
  const ul = el('ul', 'lib-list');
  for (const h of history) {
    const li = el('li');
    const kindLabel = { apply: '应用', undo: '撤销', import: '导入替换', reset: '重置' }[h.kind] ?? h.kind;
    li.appendChild(
      document.createTextNode(
        `seq ${h.seq} · ${kindLabel} · ${h.appliedAt.slice(0, 10)} · ${h.summary}${h.origin ? `（来源：${ORIGIN_SOURCE_LABELS[h.origin.sourceType] ?? h.origin.sourceType}）` : ''}`,
      ),
    );
    if (h.example === true) li.appendChild(el('span', 'lib-example-mark', ` ${EXAMPLE_BANNER_TEXT}`));
    ul.appendChild(li);
  }
  section.appendChild(ul);
  page.appendChild(section);
}

// —— 备份：导出 / 导入（三路比较、不默认覆盖）/ 重置（先导出再确认）——
function renderGuidanceBackup(page, loaded) {
  const section = el('section', 'lib-guidance-block');
  section.appendChild(el('h3', 'lib-block-title', '备份与迁移（导出/导入都在浏览器内完成，服务无写路径）'));
  const overlay = loaded.kind === 'ok' ? loaded.overlay : null;
  const exportBtn = el('button', 'lib-btn', '导出导学覆盖层 JSON（不含撤销槽）');
  exportBtn.type = 'button';
  exportBtn.addEventListener('click', () => {
    if (!overlay) {
      pushGuidanceNotice('当前没有可导出的覆盖层（无生效调整）。');
      renderApp();
      return;
    }
    downloadGuidanceFile(`research-workbench-guidance-${new Date().toISOString().slice(0, 10)}.json`, exportOverlayText(overlay), 'application/json');
    pushGuidanceNotice('已导出覆盖层 JSON（只含指导、来源与示例标记；不含本人笔记与撤销槽）。');
    renderApp();
  });
  section.appendChild(exportBtn);
  section.appendChild(el('p', 'lib-muted', 'v3 的 Markdown 导出仍是本人记录唯一备份；本档只是指导覆盖层的备份。'));

  const importInput = el('input', 'lib-guidance-file');
  importInput.type = 'file';
  importInput.accept = '.json,application/json';
  importInput.setAttribute('aria-label', '选择导学覆盖层备份 JSON 文件（导入比较用）');
  importInput.addEventListener('change', async () => {
    const file = importInput.files && importInput.files[0];
    if (!file) return;
    try {
      const text = await readProposalFileText(file);
      const parsed = parseImportedOverlay(text, renderBase);
      if (parsed.status === 'reject') {
        pushGuidanceNotice(`导入被拒绝：${parsed.message}`);
      } else {
        const comparison = compareImport(renderBase, overlay, parsed.overlay);
        if (comparison.identical) {
          pushGuidanceNotice('导入档与本机一致（seq、末条时间与生效内容三项全等），未写入。');
        } else {
          guidanceUi.importState = { incoming: parsed.overlay, comparison };
          pushGuidanceNotice('导入档与本机不一致：先看下方逐项差异，再显式选择「保持本机」或「替换」；不会默认覆盖本机。');
        }
      }
    } catch (e) {
      pushGuidanceNotice(`读取导入文件失败：${e?.message ?? '未知原因'}`);
    }
    renderApp();
  });
  section.appendChild(importInput);
  const rawBtn = el('button', null, '下载存储原始档（自查用；含未识别内容时不解析）');
  rawBtn.type = 'button';
  rawBtn.addEventListener('click', () => {
    const storage = guidanceStorage();
    let rawText = '';
    try {
      rawText = storage ? String(storage.getItem(GUIDANCE_KEY) ?? '') : '';
    } catch {
      rawText = '';
    }
    downloadGuidanceFile('research-workbench-guidance-raw.txt', rawText, 'text/plain');
  });
  section.appendChild(rawBtn);

  if (guidanceUi.importState) {
    const { incoming, comparison } = guidanceUi.importState;
    const box = el('div', 'lib-import-diff');
    box.appendChild(
      el(
        'p',
        'lib-notice-flat',
        `本机 seq ${comparison.local.seq}（末条 ${comparison.local.lastAppliedAt || '—'}）；导入档 seq ${comparison.incoming.seq}（末条 ${comparison.incoming.lastAppliedAt || '—'}）。比较以 seq＋时间＋生效内容 hash 为准，不比版本串。`,
      ),
    );
    if (comparison.diff.length === 0) {
      box.appendChild(el('p', 'lib-muted', '逐 targetRef 比较：内容无差异（差异仅在 seq/时间线）。'));
    } else {
      const ul = el('ul', 'lib-list');
      for (const d of comparison.diff) {
        ul.appendChild(
          el('li', null, `${d.label}：本机「${(d.local ?? '—').slice(0, 60)}」 vs 导入「${(d.incoming ?? '—').slice(0, 60)}」（${d.kind}）`),
        );
      }
      box.appendChild(ul);
    }
    const keepBtn = el('button', 'lib-btn', '保持本机');
    keepBtn.type = 'button';
    keepBtn.addEventListener('click', () => {
      guidanceUi.importState = null;
      pushGuidanceNotice('保持本机：导入档未写入。');
      renderApp();
    });
    const replaceBtn = el('button', 'lib-btn', '导出本机后替换');
    replaceBtn.type = 'button';
    replaceBtn.addEventListener('click', async () => {
      const storage = guidanceStorage();
      if (!storage) return;
      const result = await importReplaceOverlay({ storage, navigatorLike: guidanceNavigator(), incoming, base: renderBase });
      guidanceUi.importState = null;
      pushGuidanceNotice(
        result.ok
          ? '已按导入档替换覆盖层（seq 在本机原值上 +1，不采外来 seq；撤销槽＝本机替换前快照，可撤销本次替换）。'
          : result.message ?? '替换未执行。',
      );
      renderApp();
    });
    box.appendChild(keepBtn);
    box.appendChild(replaceBtn);
    section.appendChild(box);
  }

  if (!guidanceUi.resetArmed) {
    const resetBtn = el('button', 'lib-btn', '重置导学覆盖层（先导出备份）');
    resetBtn.type = 'button';
    resetBtn.addEventListener('click', () => {
      guidanceUi.resetArmed = true;
      pushGuidanceNotice('重置会清空覆盖层（含撤销槽与 tombstones，reset 后不可再撤销）；导出的 JSON 是唯一找回途径。确认请再点一次。');
      renderApp();
    });
    section.appendChild(resetBtn);
  } else {
    const confirmResetBtn = el('button', 'lib-btn', '确认重置（我已导出备份）');
    confirmResetBtn.type = 'button';
    confirmResetBtn.addEventListener('click', async () => {
      const storage = guidanceStorage();
      if (!storage) return;
      const result = await resetOverlay({ storage, navigatorLike: guidanceNavigator(), base: renderBase });
      guidanceUi.resetArmed = false;
      pushGuidanceNotice(
        result.ok
          ? '已重置：tombstones 与撤销槽同时清空（新周期可复用覆盖层自有 id；旧提案若与新生效态不符，按 stale-base 进预览，不静默拒绝）。'
          : result.message ?? '重置未执行。',
      );
      renderApp();
    });
    const cancelBtn = el('button', null, '取消');
    cancelBtn.type = 'button';
    cancelBtn.addEventListener('click', () => {
      guidanceUi.resetArmed = false;
      renderApp();
    });
    section.appendChild(confirmResetBtn);
    section.appendChild(cancelBtn);
  }
  page.appendChild(section);
}

// —— 复制规范基线（R3：expectedBase 由同一 canonicalSerialize 函数导出，防手抄不一致）——
function collectBaselineTargets(base) {
  const out = [];
  const push = (label, type, id, field) => out.push({ label, type, id, field });
  for (const d of base?.directions ?? []) {
    if (d.status === 'deferred') continue;
    for (const s of d.startRoute ?? []) {
      if (!s?.id || s.kind === 'external') continue;
      for (const f of ['purpose', 'readWhen', 'check', 'stage', 'required', 'passMode']) {
        push(`步骤 ${s.id} · ${FIELD_LABELS[f] ?? f}`, 'route-step', s.id, f);
      }
      push(`步骤 ${s.id} · 整体（remove 对照）`, 'route-step', s.id, '');
    }
    push(`方向 ${d.id} · openQuestions（当前数组）`, 'direction', d.id, 'openQuestions');
  }
  const stepTargets = new Set();
  for (const d of base?.directions ?? []) {
    for (const s of [...(d.startRoute ?? []), ...(d.archiveRoute ?? [])]) {
      if (s?.kind === 'paper') stepTargets.add(`paper:${s.paperId}`);
      if (s?.kind === 'article') stepTargets.add(`material:${s.materialId}`);
    }
  }
  for (const ref of stepTargets) {
    const [type, id] = ref.split(':');
    for (const f of ['learner.gist', 'learner.value', 'learner.intent']) push(`${type === 'paper' ? '论文卡' : '材料'} ${id} · ${FIELD_LABELS[f]}`, type, id, f);
    push(`${type === 'paper' ? '论文卡' : '材料'} ${id} · questions（当前数组）`, type, id, 'questions');
  }
  for (const n of base?.map?.nodes ?? []) {
    for (const f of ['label', 'summary', 'refs']) push(`地图节点 ${n.id} · ${FIELD_LABELS[f]}`, 'map-node', n.id, f);
    push(`地图节点 ${n.id} · 整体（remove 对照）`, 'map-node', n.id, '');
  }
  for (const e of base?.map?.edges ?? []) {
    for (const f of ['meaning', 'evidence']) push(`地图关系 ${e.id} · ${FIELD_LABELS[f]}`, 'map-edge', e.id, f);
    push(`地图关系 ${e.id} · 整体（remove 对照）`, 'map-edge', e.id, '');
  }
  push('首页焦点 · routeId', 'home-focus', 'home', 'routeId');
  push('首页焦点 · note', 'home-focus', 'home', 'note');
  return out;
}

async function copyGuidanceBaseline(target, outSpan) {
  const text = canonicalBaseline(renderBase, currentGuidanceOverlay(), { type: target.type, id: target.id, field: target.field }) ?? '（目标不可解析）';
  outSpan.textContent = text;
  const clipboard = guidanceNavigator()?.clipboard ?? null;
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      outSpan.textContent = `${text}（已复制到剪贴板）`;
    } catch {
      // 剪贴板不可用：文本已在页面上，手动选取复制。
    }
  }
}

function renderGuidanceBaselineCopy(page) {
  const details = el('details', 'lib-guidance-block');
  details.appendChild(el('summary', 'lib-block-title', '复制规范基线（写提案 expectedBase 用）'));
  details.appendChild(
    el('p', 'lib-muted', '基线＝该目标在「应用本提案前」的生效值，经唯一 canonicalSerialize 序列化（字符串原文、数组以分隔符连接、对象按白名单字段声明序）。手抄不一致会按 stale-base 进预览，不会静默拒绝。'),
  );
  const ul = el('ul', 'lib-list');
  for (const target of collectBaselineTargets(renderBase)) {
    const li = el('li');
    li.appendChild(el('span', 'lib-baseline-label', `${target.label}：`));
    const outSpan = el('span', 'lib-baseline-value', '');
    const btn = el('button', null, '复制基线');
    btn.type = 'button';
    btn.addEventListener('click', () => copyGuidanceBaseline(target, outSpan));
    li.appendChild(btn);
    li.appendChild(outSpan);
    ul.appendChild(li);
  }
  details.appendChild(ul);
  page.appendChild(details);
}

// ---------- 方向与路线 ----------

function renderDirections(container) {
  const page = el('div', 'lib-page');
  container.appendChild(page);
  page.appendChild(crumb([{ text: '首页', href: '#/home' }, { text: '方向与路线' }]));
  page.appendChild(el('h2', null, '方向与路线'));
  page.appendChild(
    el('p', 'lib-intro', '两条起步方向（另两条延后保留，旧书签仍可打开）：每个都有研究对象、当前研究情况、选择理由和限制。它们是备选，不必同时推进。'),
  );
  const directions = activeDirections(renderLibrary);
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
    // 起步第一步（新 tracks 或旧 route 回退统一经 directionTracks）。
    const tracks = directionTracks(renderLibrary, direction);
    const first = tracks.start.find((e) => e.resolved) ?? tracks.start[0] ?? null;
    if (first) {
      const line = el('p', 'lib-first-line');
      line.appendChild(el('strong', 'lib-step-label', '第一步：'));
      if (first.resolved) line.appendChild(link(stepHref(direction.id, 'start', first), first.resolved.title));
      else line.appendChild(el('span', 'lib-unsafe-link', `${first.kind === 'external' ? first.title : nodeTargetKey(first.target)}（关联未解析，内容待修复）`));
      section.appendChild(line);
    }
    const more = el('p', 'lib-dir-more');
    more.appendChild(link(buildHash('route', direction.id), '查看完整说明与阅读路线'));
    section.appendChild(more);
    page.appendChild(section);
  }
  // CCF 目录事实（D3 决策：并入方向页底部一句话事实 + 来源；不是投稿推荐）。
  const ccf = renderLibrary.meta?.ccfNote;
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
  const direction = getDirection(renderLibrary, directionId);
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
  // C 包（R6 规则②）：本页若渲染了示例导学调整（步骤字段/新增步骤/追加问题），顶部常驻示例横幅。
  {
    const routeOverlay = currentGuidanceOverlay();
    const refs = [`direction:${direction.id}:openQuestions`];
    for (const track of ['start', 'archive']) {
      for (const e of trackEntries(renderLibrary, direction.id, track)) {
        refs.push(`route-step:${e.id}:`, ...['purpose', 'readWhen', 'check', 'stage', 'required', 'passMode'].map((f) => `route-step:${e.id}:${f}`));
      }
    }
    const adjusted = refs.map((ref) => overlayEntry(routeOverlay, ref)).filter(Boolean);
    const exampleStep = [...trackEntries(renderLibrary, direction.id, 'start'), ...trackEntries(renderLibrary, direction.id, 'archive')].some((e) => e.example === true);
    if (exampleStep || adjusted.some((entry) => entry.example === true)) {
      page.appendChild(el('p', 'lib-example-banner', `${EXAMPLE_BANNER_TEXT}：本页含示例导学调整，不是真实指导`));
    }
    if (adjusted.length > 0) {
      page.appendChild(el('p', 'lib-adjust-meta', `本页有 ${adjusted.length} 处导学调整来自已确认提案（逐条注明；内容模块文件未被改写）。`));
    }
  }

  // 延后方向（01 C）：旧书签直达保留一行说明 + 谱系，不进默认入口。
  if (directionStatusOf(direction) === 'deferred') {
    page.appendChild(
      el(
        'p',
        'lib-notice-flat',
        direction.deferredNote ??
          '这条方向初期不作为探索入口；论文卡仍可查阅，相关技术能力见对应技术路线。',
      ),
    );
  }

  // PLAN-011 B2：旧介绍（对象/现状/理由/限制）保留为可展开、默认收起，不占主阅读；
  // 复用既有折叠样式（lib-quick-group），原生 details/summary 键盘可达。来源列表移入下方「辅助来源」层。
  const legacyIntro = el('details', 'lib-quick-group lib-route-legacy');
  legacyIntro.appendChild(el('summary', null, '课题原始介绍（研究对象 / 当前研究情况 / 选择理由 / 难点与限制）'));
  const legacyBody = el('div', 'lib-route-legacy-body');
  legacyBody.appendChild(el('h3', 'lib-block-title', '这个方向研究什么'));
  if (direction.overview) legacyBody.appendChild(el('p', 'lib-para', direction.overview));

  legacyBody.appendChild(el('h3', 'lib-block-title', '当前研究情况'));
  if (direction.stateOfField) legacyBody.appendChild(el('p', 'lib-para', direction.stateOfField));

  legacyBody.appendChild(el('h3', 'lib-block-title', '为什么考虑这个方向'));
  if (direction.whyChoose) legacyBody.appendChild(el('p', 'lib-para', direction.whyChoose));

  legacyBody.appendChild(el('h3', 'lib-block-title', '难点与不适用条件'));
  if (direction.limits) legacyBody.appendChild(el('p', 'lib-para', direction.limits));
  legacyIntro.appendChild(legacyBody);
  page.appendChild(legacyIntro);

  // PLAN-010 阶段 C + PLAN-011 B2：深化块按 正文导读（四轴/问题演化）→ 对照表（机制与表示）→
  // 辅助来源（核查记录/论文联系/未定候选）三级排布；页内来源说明只说一次。
  renderDirectionDeepening(page, direction);

  // 01 B：「初期怎么用这条」——纯文本一段，不是新板块。
  if (direction.startHint) page.appendChild(el('p', 'lib-intro', direction.startHint));

  const tracks = directionTracks(renderLibrary, direction);
  if (tracks.mode !== 'legacy') {
    renderRouteTracks(page, direction, tracks);
  } else {
    // 旧格式回退：按阶段分组的长路线（旧库行为不变）。
    page.appendChild(el('h3', 'lib-block-title', '按阶段阅读'));
    const groups = routeStages(renderLibrary, directionId);
    if (groups.length === 0) {
      page.appendChild(emptyBox(EMPTY_NOTICES.routeEmpty));
    } else {
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
          const depth = deliveredDepthOf(entry.paper);
          const depthShort = depth ? (depth === 'entry' ? '原文入口' : DEPTH_LABELS[depth] ?? depth) : null;
          const flagText = [entry.required, depthShort].filter(Boolean).join(' · ');
          if (flagText) li.appendChild(el('p', 'lib-asof', flagText));
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
  }

  if (Array.isArray(direction.openQuestions) && direction.openQuestions.length > 0) {
    page.appendChild(el('h3', 'lib-block-title', '可以追问的问题'));
    const ul = el('ul', 'lib-list');
    for (const question of direction.openQuestions) ul.appendChild(el('li', null, question));
    page.appendChild(ul);
    // C 包（R3 direction append）：追加的问题在列表末尾如实出现，并带来源 meta 行（R4）。
    const qEntry = overlayEntry(currentGuidanceOverlay(), `direction:${direction.id}:openQuestions`);
    if (qEntry) {
      page.appendChild(el('p', 'lib-adjust-meta', `末尾 ${Array.isArray(qEntry.value) ? qEntry.value.length : 0} 条为导学追加：${adjustLabel(qEntry)}`));
      if (qEntry.example === true) page.appendChild(el('p', 'lib-example-mark', EXAMPLE_BANNER_TEXT));
    }
  }
}

// 新格式（tracks）的路线渲染：startRoute 为「从这里开始」，archiveRoute 折叠。
// archive 标题取数据 archiveLabel；缺省时外链目录（全部 external）为「按需查阅（不必接着读）」，
// 其余为「完整谱系（初期不必走）」（05 §3）。
function renderRouteTracks(page, direction, tracks) {
  const allExternal = tracks.archive.length > 0 && tracks.archive.every((e) => e.external);
  const archiveLabel = direction.archiveLabel ?? (allExternal ? '按需查阅（不必接着读）' : TRACK_LABELS.archive);

  const renderStepList = (entries, track) => {
    const ol = el('ol', 'lib-steps');
    for (const entry of entries) {
      const li = el('li', 'lib-route-step');
      const title = el('h4', 'lib-step-title');
      if (entry.external) {
        if (entry.url) title.appendChild(externalLink(entry.url, entry.title));
        else title.appendChild(document.createTextNode(entry.title));
      } else if (entry.resolved) {
        title.appendChild(link(stepHref(direction.id, track, entry), entry.resolved.title));
      } else {
        title.appendChild(el('span', 'lib-unsafe-link', `${nodeTargetKey(entry.target) ?? entry.id}（关联未解析，内容待修复）`));
      }
      li.appendChild(title);
      const flags = [];
      if (entry.required) flags.push(entry.required);
      if (entry.passMode) flags.push(PASS_MODE_LABELS[entry.passMode] ?? entry.passMode);
      if (entry.resolved?.depthLabel) flags.push(entry.resolved.depthLabel);
      if (entry.resolved?.formatLabel) flags.push(entry.resolved.formatLabel);
      if (entry.external && entry.role) flags.push(entry.role);
      if (entry.availability === 'pending') flags.push('待核');
      const flagText = [...new Set(flags)].filter(Boolean).join(' · ');
      if (flagText) li.appendChild(el('p', 'lib-asof', flagText));
      if (entry.availability === 'pending') {
        li.appendChild(el('p', 'lib-notice-flat', `待核：${entry.pendingReason ?? entry.resolved?.pendingReason ?? '原因待补'}。`));
      }
      for (const field of ['purpose', 'readWhen', 'check']) {
        if (!entry[field]) continue;
        const p = el('p', 'lib-step-line');
        p.appendChild(el('strong', 'lib-step-label', `${STEP_LABELS[field]}：`));
        p.appendChild(document.createTextNode(entry[field]));
        li.appendChild(p);
      }
      if (entry.external && entry.note) li.appendChild(el('p', 'lib-step-line', entry.note));
      if (entry.nextAction) li.appendChild(el('p', 'lib-step-line', entry.nextAction));
      // C 包（R4/R6）：被覆盖层调整/新增的步骤追加纯文本 meta 行；示例条目明标示例，不冒充真实指导。
      const stepMeta = adjustMetaFor(currentGuidanceOverlay(), 'route-step', entry.id, ['purpose', 'readWhen', 'check', 'stage', 'required', 'passMode']);
      if (stepMeta) li.appendChild(el('p', 'lib-adjust-meta', stepMeta));
      if (entry.example === true) li.appendChild(el('p', 'lib-example-mark', EXAMPLE_BANNER_TEXT));
      ol.appendChild(li);
    }
    return ol;
  };

  page.appendChild(el('h3', 'lib-block-title', TRACK_LABELS.start));
  if (tracks.start.length === 0) {
    page.appendChild(emptyBox(EMPTY_NOTICES.startRouteEmpty));
  } else {
    page.appendChild(renderStepList(tracks.start, 'start'));
    // 02 §3 / 03 §5.4：末节点显示本段结束与行动建议，不自动进入 archive。
    const last = tracks.start[tracks.start.length - 1];
    if (last?.availability !== 'pending') {
      page.appendChild(el('p', 'lib-asof', '本段到此。'));
    }
    if (direction.trackClosing) page.appendChild(el('p', 'lib-intro', direction.trackClosing));
  }

  const hasArchive = tracks.archive.length > 0;
  if (hasArchive) {
    const details = el('details', 'lib-quick-group');
    details.appendChild(el('summary', 'lib-quick-title', archiveLabel));
    const note = allExternal
      ? '以下按疑问查阅，不必接着读；identity 链接只核到身份与访问。'
      : '完整谱系初期不必走；顺序沿原路线保留。';
    details.appendChild(el('p', 'lib-zone-how', note));
    details.appendChild(renderStepList(tracks.archive, 'archive'));
    page.appendChild(details);
  }
}

// 起步卡三问（03 §1）：标题与覆盖行之后、正文之前；旧卡无 learner 不渲染（不伪填）。
// kind＝'paper'|'material'（C 包 R4：被覆盖层调整的三问字段与追加问题带纯文本 meta 行）。
function renderLearnerBlock(article, item, kind = 'paper') {
  const learner = item?.learner;
  if (!learner || typeof learner !== 'object') return;
  const box = el('section', 'lib-block');
  const lines = [
    ['讲什么', learner.gist],
    ['对当前路线的价值', learner.value],
    ['带着什么目的', learner.intent],
  ];
  for (const [label, text] of lines) {
    if (!text) continue;
    const p = el('p', 'lib-step-line');
    p.appendChild(el('strong', 'lib-step-label', `${label}：`));
    p.appendChild(document.createTextNode(text));
    box.appendChild(p);
  }
  const meta = adjustMetaFor(currentGuidanceOverlay(), kind, item.id, ['learner.gist', 'learner.value', 'learner.intent']);
  if (meta) box.appendChild(el('p', 'lib-adjust-meta', meta));
  if (box.childNodes.length > 0) article.appendChild(box);
}

// 章节动作（03 §2）：Preserve / Explain / Skip 顺序文本列表；inline blocks 直接渲染，
// sectionId 用与目录相同的滚动定位（不改写 hash）；空列表不显示标题。
function renderReadingActionsBlock(article, item, anchorPrefix, kind = 'paper') {
  const ra = item?.readingActions;
  if (!ra || typeof ra !== 'object') return;
  // 站内导读没有外部原文：Preserve 标题随媒介区分（审查修正，2026-09-22）。
  const sections = [
    ['preserve', kind === 'article' ? '先自己阅读' : '先自己看原文'],
    ['explain', '可以先看整理'],
    ['skip', '本次先跳过'],
  ];
  for (const [key, title] of sections) {
    const list = ra[key];
    if (!Array.isArray(list) || list.length === 0) continue;
    const box = el('section', 'lib-block');
    box.appendChild(el('h3', 'lib-block-title', title));
    const ul = el('ul', 'lib-list');
    for (const act of list) {
      const li = el('li');
      const head = el('p', 'lib-step-line');
      head.appendChild(el('strong', null, `${act.target} —— `));
      head.appendChild(document.createTextNode(act.why));
      li.appendChild(head);
      if (key === 'explain') {
        if (Array.isArray(act.blocks) && act.blocks.length > 0) {
          const inner = el('div', 'lib-action-explain');
          renderBlocks(inner, act.blocks);
          li.appendChild(inner);
        } else if (act.sectionId) {
          const targetId = `${anchorPrefix}-${act.sectionId}`;
          const p = el('p', 'lib-first-line');
          // 与目录按钮同款的页内滚动定位，但不用 lib-toc-link 类，避免被目录收集逻辑混淆。
          const button = el('button', 'lib-btn', '定位到本卡的对应讲解段落');
          button.type = 'button';
          button.addEventListener('click', () => {
            const target = document.getElementById(targetId);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          p.appendChild(button);
          li.appendChild(p);
        }
      }
      ul.appendChild(li);
    }
    box.appendChild(ul);
    article.appendChild(box);
  }
}

// ---------- 论文 ----------

// PLAN-010 阶段 D：三段式导读（背景术语与读前问题 → 原文精读定位 → 实际讲解）。
// 只有带 guidedReading 的首批卡渲染；定位段要求正文依据（coverage 为正文选读/正文），
// 无依据自动降级为两段并如实标注「定位待核」。讲解必须是非空 blocks（原创解释，不复述摘要）。
function renderGuidedReading(article, paper) {
  const guided = paper?.guidedReading;
  if (!guided || typeof guided !== 'object') return;
  const box = el('section', 'lib-block lib-guided');
  box.appendChild(el('h3', 'lib-block-title', '三段式导读：背景 → 定位 → 讲解'));
  // ① 背景术语与读前问题
  if (Array.isArray(guided.terms) && guided.terms.length > 0) {
    const dl = el('dl', 'lib-guided-terms');
    for (const term of guided.terms) {
      dl.appendChild(el('dt', null, term.term ?? ''));
      dl.appendChild(el('dd', null, term.note ?? ''));
    }
    box.appendChild(dl);
  }
  if (Array.isArray(guided.preQuestions) && guided.preQuestions.length > 0) {
    const q = el('p', 'lib-step-line');
    q.appendChild(el('strong', 'lib-step-label', '带着这些问题读：'));
    q.appendChild(document.createTextNode(guided.preQuestions.join('　')));
    box.appendChild(q);
  }
  // ② 原文精读定位（无正文依据时降级为两段并标注）
  const hasTextBasis = ['partial-text', 'full-text'].includes(paper?.coverage?.mode);
  const locateList = el('ul', 'lib-list');
  if (hasTextBasis && Array.isArray(guided.locate) && guided.locate.length > 0) {
    for (const item of guided.locate) {
      const li = el('li');
      const head = el('p', 'lib-step-line');
      head.appendChild(el('strong', null, `${item.target} —— ${item.where}`));
      li.appendChild(head);
      if (item.note) li.appendChild(el('p', 'lib-step-line', item.note));
      locateList.appendChild(li);
    }
    const p = el('p', 'lib-step-line');
    p.appendChild(el('strong', 'lib-step-label', '原文精读定位：'));
    box.appendChild(p);
    box.appendChild(locateList);
  } else {
    box.appendChild(
      el('p', 'lib-depth-note', '精读定位待核：本卡暂无正文依据，不给节级指引；取得原文并核对后再补定位段。'),
    );
  }
  // ③ 实际讲解（原创解释性文字，非复述摘要）
  if (Array.isArray(guided.explainBlocks) && guided.explainBlocks.length > 0) {
    const inner = el('div', 'lib-guided-explain');
    renderBlocks(inner, guided.explainBlocks);
    box.appendChild(inner);
  }
  if (box.childNodes.length > 1) article.appendChild(box);
}

// PLAN-010 阶段 C：综述导学树——以综述章节结构为骨架的可展开层级树。
// 每个节点必须有章节来源标注；站内 refs 解析为链接（编辑排定顺序，非论文引用，PF-07）。
function renderSurveyTreeNode(node) {
  const details = el('details', 'lib-tree-node');
  const summary = el('summary', 'lib-tree-summary');
  summary.appendChild(el('span', 'lib-tree-title', node.title ?? ''));
  if (node.source) summary.appendChild(el('span', 'lib-tree-source', `来源：${node.source}`));
  details.appendChild(summary);
  const body = el('div', 'lib-tree-body');
  if (node.explain) body.appendChild(el('p', 'lib-para', node.explain));
  const refs = (node.refs ?? []).map((ref) => resolveMapRef(renderLibrary, ref)).filter(Boolean);
  if (refs.length > 0) {
    const line = el('p', 'lib-first-line');
    line.appendChild(el('strong', 'lib-step-label', '站内回链（编辑排定，非引用）：'));
    refs.forEach((ref, i) => {
      if (i > 0) line.appendChild(document.createTextNode('；'));
      if (ref.href) line.appendChild(link(ref.href, ref.label));
      else line.appendChild(document.createTextNode(ref.label));
    });
    body.appendChild(line);
  }
  for (const child of node.children ?? []) body.appendChild(renderSurveyTreeNode(child));
  details.appendChild(body);
  return details;
}

function renderSurveyTree(article, paper) {
  const tree = paper?.surveyTree;
  if (!tree || !Array.isArray(tree.roots) || tree.roots.length === 0) return;
  const box = el('section', 'lib-block lib-tree');
  box.appendChild(el('h3', 'lib-block-title', '综述导学树（按章节来源展开）'));
  if (tree.source) box.appendChild(el('p', 'lib-asof', tree.source));
  if (tree.note) box.appendChild(el('p', 'lib-zone-how', tree.note));
  for (const node of tree.roots) box.appendChild(renderSurveyTreeNode(node));
  article.appendChild(box);
}

// PLAN-010 阶段 C + PLAN-011 B2：课题页深化块，三级排布——
// ① 正文导读：四轴编辑分析框架、问题演化；② 对照表：机制与表示；③ 辅助来源：核查记录、论文间联系、未定候选。
// 仅当方向数据携带对应字段时渲染；来源与编辑性质在页内只说一次（四轴 note 为主声明）。
function renderDirectionDeepening(page, direction) {
  const axis = direction?.axisAnalysis;
  if (axis && Array.isArray(axis.axes) && axis.axes.length > 0) {
    const box = el('section', 'lib-block');
    box.appendChild(el('h3', 'lib-block-title', '正文导读 · 四轴编辑分析框架'));
    if (axis.note) box.appendChild(el('p', 'lib-intro', axis.note));
    const dl = el('dl', 'lib-axis-list');
    for (const item of axis.axes) {
      const dt = el('dt', null, item.title ?? '');
      const dd = el('dd', null);
      if (item.explain) dd.appendChild(el('p', 'lib-step-line', item.explain));
      for (const example of item.examples ?? []) {
        const line = el('p', 'lib-step-line');
        const resolved = resolveMapRef(renderLibrary, example.ref);
        if (resolved?.href) line.appendChild(link(resolved.href, resolved.label));
        else line.appendChild(document.createTextNode(example.ref ?? '（关联未解析）'));
        line.appendChild(document.createTextNode(` —— ${example.text ?? ''}`));
        dd.appendChild(line);
      }
      if (item.unknown) {
        const unknown = el('p', 'lib-depth-note');
        unknown.appendChild(el('strong', null, '未定候选：'));
        unknown.appendChild(document.createTextNode(item.unknown));
        dd.appendChild(unknown);
      }
      dl.appendChild(dt);
      dl.appendChild(dd);
    }
    box.appendChild(dl);
    page.appendChild(box);
  }

  const evolution = direction?.problemEvolution;
  if (evolution && Array.isArray(evolution.nodes) && evolution.nodes.length > 0) {
    const box = el('section', 'lib-block');
    box.appendChild(el('h3', 'lib-block-title', '正文导读 · 问题演化：从单 Agent 长任务到预算约束协作'));
    if (evolution.note) box.appendChild(el('p', 'lib-zone-how', evolution.note));
    const ol = el('ol', 'lib-timeline');
    for (const node of evolution.nodes) {
      const li = el('li', 'lib-timeline-item');
      const head = el('p', 'lib-timeline-head');
      head.appendChild(el('span', 'lib-timeline-when', node.when ?? ''));
      const paper = node.paperId ? getPaper(renderLibrary, node.paperId) : null;
      if (paper) head.appendChild(paperLink(paper));
      else if (node.paperId) head.appendChild(el('span', 'lib-unsafe-link', `${node.paperId}（关联未解析）`));
      li.appendChild(head);
      if (node.text) li.appendChild(el('p', 'lib-step-line', node.text));
      ol.appendChild(li);
    }
    box.appendChild(ol);
    page.appendChild(box);
  }

  const mech = direction?.mechVsRep;
  if (mech && mech.table && Array.isArray(mech.table.rows) && mech.table.rows.length > 0) {
    const box = el('section', 'lib-block');
    box.appendChild(el('h3', 'lib-block-title', '对照表 · 机制与表示：两个别混的层次'));
    if (mech.intro) box.appendChild(el('p', 'lib-para', mech.intro));
    box.appendChild(renderComparison({ columns: mech.table.columns, rows: mech.table.rows }));
    if (mech.reading) box.appendChild(el('p', 'lib-zone-how', mech.reading));
    page.appendChild(box);
  }

  // ③ 辅助来源：核查记录（方向支撑来源）+ 论文间联系 + 未定候选。
  const sources = Array.isArray(direction?.sources) ? direction.sources : [];
  const links = direction?.paperLinks;
  const candidates = direction?.undecidedCandidates;
  const auxBox = el('section', 'lib-block lib-direction-aux');
  let auxHasContent = false;
  if (sources.length > 0) {
    auxHasContent = true;
    auxBox.appendChild(el('h3', 'lib-block-title', '辅助来源 · 核查记录'));
    auxBox.appendChild(el('p', 'lib-zone-how', '支撑「当前研究情况」等判断的公开来源；核实某个论断时回到这里逐条回查。'));
    const box = el('div', 'lib-sources');
    const ul = el('ul', 'lib-list');
    for (const source of sources) {
      const li = el('li');
      if (source.url) li.appendChild(externalLink(source.url, source.label));
      else li.appendChild(document.createTextNode(source.label));
      if (source.note) li.appendChild(document.createTextNode(` —— ${source.note}`));
      ul.appendChild(li);
    }
    box.appendChild(ul);
    auxBox.appendChild(box);
  }
  if (Array.isArray(links) && links.length > 0) {
    auxHasContent = true;
    auxBox.appendChild(el('h3', 'lib-block-title', '辅助来源 · 论文间联系'));
    // PLAN-011：编辑性质声明页内只说一次（四轴 note 已声明本页分析框架属性），此处只补来源性质一句。
    auxBox.appendChild(el('p', 'lib-zone-how', '以下联系是编辑整理的对照读法，不是论文之间的引用关系；逐条依据见各卡的「来源与覆盖」。'));
    const ul = el('ul', 'lib-list');
    for (const item of links) {
      const li = el('li');
      const line = el('p', 'lib-step-line');
      const from = item.from ? resolveMapRef(renderLibrary, item.from) : null;
      const to = item.to ? resolveMapRef(renderLibrary, item.to) : null;
      if (from?.href) line.appendChild(link(from.href, from.label));
      else line.appendChild(document.createTextNode(item.from ?? '（未解析）'));
      line.appendChild(document.createTextNode(' ↔ '));
      if (to?.href) line.appendChild(link(to.href, to.label));
      else line.appendChild(document.createTextNode(item.to ?? '（未解析）'));
      line.appendChild(document.createTextNode(` —— ${item.note ?? ''}`));
      li.appendChild(line);
      ul.appendChild(li);
    }
    auxBox.appendChild(ul);
  }
  if (Array.isArray(candidates) && candidates.length > 0) {
    auxHasContent = true;
    auxBox.appendChild(el('h3', 'lib-block-title', '辅助来源 · 未定候选（未核验，未入库）'));
    const ul = el('ul', 'lib-list');
    for (const item of candidates) {
      const li = el('li');
      const head = el('p', 'lib-step-line');
      head.appendChild(el('strong', null, `${item.title}（${item.status ?? '未核验，未入库'}）`));
      li.appendChild(head);
      if (item.reason) li.appendChild(el('p', 'lib-step-line', item.reason));
      ul.appendChild(li);
    }
    auxBox.appendChild(ul);
  }
  if (auxHasContent) page.appendChild(auxBox);

  // REV001：主方向页给广域图的相关支线预览 + 进入完整图（不把广域认知藏在课题内）。
  const land = renderLibrary.landscape;
  if (land && Array.isArray(land.nodes) && land.nodes.length > 0) {
    const related = land.nodes.filter((n) => Array.isArray(n.topics) && n.topics.includes(direction.id)).slice(0, 6);
    if (related.length > 0) {
      const nodeById = new Map(land.nodes.map((n) => [n.id, n]));
      const box = el('section', 'lib-block');
      box.appendChild(el('h3', 'lib-block-title', '广域脉络中的相关支线（预览）'));
      const ul = el('ul', 'lib-list');
      for (const node of related) {
        const li = el('li');
        const head = el('p', 'lib-step-line');
        head.appendChild(el('strong', null, `${node.title}（${node.when ?? ''}）`));
        li.appendChild(head);
        if (node.problem) li.appendChild(el('p', 'lib-step-line', node.problem));
        const touching = (land.edges ?? []).filter((e) => e.from === node.id || e.to === node.id);
        if (touching.length > 0) {
          const others = touching
            .map((e) => nodeById.get(e.from === node.id ? e.to : e.from))
            .filter(Boolean)
            .map((n) => n.title);
          if (others.length > 0) li.appendChild(el('p', 'lib-res-meta', `前后关系：${others.join('、')}（完整图内查看）`));
        }
        ul.appendChild(li);
      }
      box.appendChild(ul);
      const entry = el('p', 'lib-first-line');
      entry.appendChild(link('#/map', '进入广域脉络图（看相关支线的完整位置与详解）', 'lib-btn'));
      box.appendChild(entry);
      page.appendChild(box);
    }
  }
}

function paperListItem(paper) {
  const item = el('section', 'lib-paper-item');
  const title = el('h3', 'lib-paper-title');
  title.appendChild(paperLink(paper));
  item.appendChild(title);
  item.appendChild(badgeLine(paper));
  const publication = paperPublicationLabel(paper);
  if (publication) item.appendChild(el('p', 'lib-res-meta', publication));
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
  if (renderLibrary.papers.length === 0) {
    page.appendChild(emptyBox(EMPTY_NOTICES.papers));
    return;
  }
  // 分组：方向路线文献（按方向顺序）→ 路线外条目；经典书目独立视图，这里只给入口。
  const routed = new Set();
  for (const direction of sortDirections(renderLibrary)) {
    const entries = routeEntries(renderLibrary, direction.id).filter((e) => e.paper);
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
  const unrouted = renderLibrary.papers.filter((p) => !routed.has(p.id) && p.collection !== 'foundations');
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
  meta.appendChild(document.createTextNode(paperBadges(paper).map((b) => b.text).join(' · ')));
  const publication = paperPublicationLabel(paper);
  if (publication) meta.appendChild(document.createTextNode(` · ${publication}`));
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
        const paper = getPaper(renderLibrary, ref.paperId);
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
        const paper = getPaper(renderLibrary, ref.paperId);
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

function renderNext(article, paper, routeNextKey = null) {
  if (!paper.next?.note) return;
  // 03 §5.3：旧 paper.next 仅作「延伸阅读（非本段下一步）」；与路线下一节点相同时去重链接
  // （路线导航已覆盖，不再给竞争按钮），保留说明文字，保证目录与正文始终同源。
  const duplicated = routeNextKey && paper.next.paperId && nodeTargetKey({ kind: 'paper', paperId: paper.next.paperId }) === routeNextKey;
  const box = el('section', 'lib-block');
  box.id = 'lib-sec-next';
  box.appendChild(el('h3', 'lib-block-title', sectionTitle(deliveredDepthOf(paper), 'next')));
  box.appendChild(el('p', 'lib-para', paper.next.note));
  box.appendChild(el('p', 'lib-asof', '延伸阅读是整理者建议，不是本路线的下一步。'));
  if (duplicated) {
    box.appendChild(el('p', 'lib-muted', '本条与路线下一节点相同，链接已在侧栏路线导航给出，此处不再重复。'));
  } else if (paper.next.paperId) {
    const nextPaper = getPaper(renderLibrary, paper.next.paperId);
    if (nextPaper) {
      const nav = el('p', 'lib-actions');
      nav.appendChild(link(buildHash('paper', nextPaper.id), `延伸阅读：《${nextPaper.displayTitle || nextPaper.title}》`, 'lib-btn'));
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
      const trackNote = position.track === 'archive' ? '完整谱系' : '从这里开始';
      block.appendChild(el('p', 'lib-rail-pos', `《${position.direction.title}》第 ${position.index} / ${position.total} 步（${trackNote}）`));
      const prevLine = el('p', 'lib-rail-line');
      if (position.prev && !position.prev.external && position.prev.resolved) {
        prevLine.appendChild(
          link(stepHref(position.direction.id, position.track, position.prev), `上一步：《${position.prev.resolved.title}》`),
        );
      } else if (position.prev?.external) {
        prevLine.appendChild(el('span', 'lib-muted', '上一步是外链目录条目'));
      } else {
        prevLine.appendChild(el('span', 'lib-muted', '这是第一步'));
      }
      block.appendChild(prevLine);
      const nextLine = el('p', 'lib-rail-line');
      if (position.next && !position.next.external && position.next.resolved) {
        nextLine.appendChild(
          link(stepHref(position.direction.id, position.track, position.next), `下一步：《${position.next.resolved.title}》`),
        );
      } else if (position.next?.external) {
        nextLine.appendChild(el('span', 'lib-muted', '下一步是外链目录条目'));
      } else {
        // 03 §5.4：尾节点显示「本段到此」，不自动进入 archive。
        nextLine.appendChild(el('span', 'lib-muted', '本段到此'));
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

function renderPaper(container, paperId, ctx = {}) {
  const paper = getPaper(renderLibrary, paperId);
  // 路线上下文（03 §5）：显式 query 优先；上下文与本文不匹配时明确提示，不静默套其他路线；
  // 无上下文的旧链接唯一属于 active startRoute 时推导起步上下文。
  let routeCtx = null;
  let ctxNotice = null;
  if (ctx.routeId && ctx.track) {
    const pos = trackPosition(renderLibrary, ctx.routeId, ctx.track, { kind: 'paper', paperId });
    if (pos) {
      routeCtx = pos;
    } else {
      ctxNotice = '链接携带的路线上下文与本文不匹配，已按无路线上下文显示；请在路线页重新进入。';
    }
  }
  if (!routeCtx && !ctxNotice) {
    const inferred = inferStartContext(renderLibrary, { kind: 'paper', paperId });
    if (inferred) routeCtx = trackPosition(renderLibrary, inferred.routeId, inferred.track, { kind: 'paper', paperId });
  }
  const positions = routeCtx
    ? [routeCtx]
    : routesContaining(renderLibrary, paperId);
  const crumbParts = [{ text: '首页', href: '#/home' }, { text: '论文阅读', href: '#/papers' }];
  if (routeCtx) {
    crumbParts.push({ text: routeCtx.direction.title, href: buildHash('route', routeCtx.direction.id) });
  } else {
    for (const position of positions.slice(0, 2)) {
      crumbParts.push({ text: position.direction.title, href: buildHash('route', position.direction.id) });
    }
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
  if (ctxNotice) article.appendChild(el('p', 'lib-notice-flat', ctxNotice));
  // C 包（R6 规则②）：本页被覆盖层示例条目影响时常驻示例横幅（从持久字段重建，随刷新/import 保留）。
  renderCardGuidanceBanner(article, 'paper', paper.id);

  // 起步卡三问（03 §1）：覆盖短行之后、正文之前；旧卡无 learner 不渲染。
  renderLearnerBlock(article, paper, 'paper');
  // PLAN-010 阶段 D：三段式导读（仅首批深做卡携带 guidedReading；无依据自动降级为两段）。
  renderGuidedReading(article, paper);

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
  } else if (depth === 'quick') {
    // REWORK-007 §4 + 008.1 §2C：卡级依据标注按 coverage 实际口径生成（共同函数 depthBasisLabel）。
    const partialText = paper.coverage?.mode === 'partial-text';
    article.appendChild(
      el(
        'p',
        'lib-depth-note',
        partialText
          ? '简读卡：以下判断依据已核摘要与指定正文（范围见文末「来源与覆盖」），其余部分未读、不作判断。'
          : '以下判断只依据摘要，正文没有读；依据与未核对部分见文末“来源与覆盖”。',
      ),
    );
    if (paper.lead) article.appendChild(el('p', 'lib-lead', paper.lead));
    stringList(article, 'lib-sec-reasons', sectionTitle(depth, 'reasons'), paper.reasons);
    stringList(article, 'lib-sec-questions', sectionTitle(depth, 'questions'), paper.questions);
  } else {
    article.appendChild(
      el('p', 'lib-depth-note', '未获取到可靠摘要：这里只有论文身份与入口，不含任何内容判断；请核对原文后再决定投入。'),
    );
    if (paper.lead) article.appendChild(el('p', 'lib-lead', paper.lead));
    stringList(article, 'lib-sec-reasons', sectionTitle(depth, 'reasons'), paper.reasons);
  }

  // PLAN-010 阶段 C：综述导学树（仅带 surveyTree 的综述卡渲染，节点带来源标注）。
  renderSurveyTree(article, paper);

  // 章节动作（03 §2）：正文之后、记录面板之前。
  renderReadingActionsBlock(article, paper, `lib-sec-${paper.id}`);
  // C 包（R4）：导学追加的自查问题如实出现在列表末尾，并带来源 meta 行；示例条目明标示例。
  renderCardQuestionsMeta(article, 'paper', paper.id);

  // 旧 paper.next 降为延伸阅读（03 §5.3），与路线下一节点相同则去重。
  const routeNextKey = routeCtx?.next && !routeCtx.next.external ? nodeTargetKey(routeCtx.next.target) : null;
  renderNext(article, paper, routeNextKey);

  // REWORK-007 §1：记录是读后动作——面板放在正文全部章节（含"延伸阅读"）之后、"来源与覆盖"之前。
  // 存储仍用原 paperId；route/track query 不参与记录 id（03 §6）。
  article.appendChild(renderNotesPanel(paper));
  renderCoverage(article, paper);
  renderRail(page, paper, positions, source);
}

// ---------- 材料（SCAFFOLD-008；03 §3/§6：只读、无个人记录、无 localStorage 写入） ----------

function materialCoverageRows(material) {
  const c = material.coverage ?? {};
  const rows = [];
  if (c.mode) rows.push(['依据', MATERIAL_COVERAGE_LABELS[c.mode] ?? c.mode]);
  if (c.basis) rows.push(['来源', readerSourceNote(c.basis)]);
  if (Array.isArray(c.sections) && c.sections.length > 0) rows.push(['实际覆盖', c.sections.join('；')]);
  if (c.limitations) rows.push(['未覆盖', c.limitations]);
  return rows;
}

function renderMaterial(container, materialId, ctx = {}) {
  const material = getMaterial(renderLibrary, materialId);
  // 路线上下文解析与论文页同规则（03 §5）。
  let routeCtx = null;
  let ctxNotice = null;
  if (ctx.routeId && ctx.track) {
    const pos = trackPosition(renderLibrary, ctx.routeId, ctx.track, { kind: 'article', materialId });
    if (pos) routeCtx = pos;
    else ctxNotice = '链接携带的路线上下文与本文不匹配，已按无路线上下文显示；请在路线页重新进入。';
  }
  if (!routeCtx && !ctxNotice) {
    const inferred = inferStartContext(renderLibrary, { kind: 'article', materialId });
    if (inferred) routeCtx = trackPosition(renderLibrary, inferred.routeId, inferred.track, { kind: 'article', materialId });
  }
  const positions = routeCtx ? [routeCtx] : targetPositions(renderLibrary, { kind: 'article', materialId });

  const crumbParts = [{ text: '首页', href: '#/home' }];
  if (routeCtx) crumbParts.push({ text: routeCtx.direction.title, href: buildHash('route', routeCtx.direction.id) });
  crumbParts.push({ text: material ? material.title : materialId });
  container.appendChild(crumb(crumbParts));

  const page = el('div', 'lib-reading');
  const article = el('article', 'lib-article');
  container.appendChild(page);
  page.appendChild(article);
  if (!material) {
    article.appendChild(notFoundBox('材料', materialId));
    page.classList.add('lib-reading-solo');
    return;
  }

  // 页眉：标题 + 媒介/依据行 + 外链。
  const header = el('header', 'lib-paper-head');
  header.appendChild(el('h2', 'lib-paper-heading', material.title));
  const meta = el('p', 'lib-metaline');
  meta.appendChild(document.createTextNode(MATERIAL_FORMAT_LABELS[material.format] ?? material.format ?? '材料'));
  const coverageMode = material.coverage?.mode;
  if (coverageMode) meta.appendChild(document.createTextNode(` · ${MATERIAL_COVERAGE_LABELS[coverageMode] ?? coverageMode}`));
  const href = safeExternalHref(material.url);
  if (href) {
    let host = href;
    try {
      host = new URL(href).host;
    } catch {
      // 保留完整 url
    }
    const a = link(href, `原文 · ${host}`, 'lib-orig');
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    meta.appendChild(a);
  }
  header.appendChild(meta);
  article.appendChild(header);
  if (ctxNotice) article.appendChild(el('p', 'lib-notice-flat', ctxNotice));
  renderCardGuidanceBanner(article, 'material', material.id);
  renderCardGuidanceBanner(article, 'material', material.id);

  const pending = material.availability === 'pending' || coverageMode === 'identity';
  if (pending) {
    // 待核材料只显示身份与待核原因，不伪造三问与动作（03 §1）。
    article.appendChild(
      el('p', 'lib-notice-flat', `来源待核：${material.pendingReason ?? material.coverage?.limitations ?? '原因待补'}。此条保留序位，暂不作为可开始内容。`),
    );
  } else {
    renderLearnerBlock(article, material, 'material');
    renderReadingActionsBlock(article, material, `lib-sec-mat-${material.id}`, 'article');
    if (Array.isArray(material.body?.blocks) && material.body.blocks.length > 0) {
      article.appendChild(blockSection('正文', material.body.blocks, null));
    }
    for (const section of material.sections ?? []) {
      const box = el('section', 'lib-section');
      box.id = sectionAnchorId(material.id, section.id);
      box.appendChild(el('h3', 'lib-block-title', section.heading));
      renderBlocks(box, section.blocks);
      article.appendChild(box);
    }
    if (Array.isArray(material.questions) && material.questions.length > 0) {
      // 材料一般没有 questions（白名单 append 对无此字段的材料按目标缺失拒绝）；数据若存在则如实渲染。
      stringList(article, null, '自查问题', material.questions);
    }
    if (material.nextAction) article.appendChild(el('p', 'lib-intro', material.nextAction));
  }

  // 来源与覆盖（材料无「我的记录」面板：03 §6 存储边界）。
  const details = el('details', 'lib-coverage');
  details.appendChild(el('summary', null, '来源与覆盖（点开查看）'));
  const rows = materialCoverageRows(material);
  if (rows.length > 0) {
    const dl = el('dl', 'lib-coverage-list');
    for (const [label, value] of rows) {
      dl.appendChild(el('dt', null, label));
      dl.appendChild(el('dd', null, value));
    }
    details.appendChild(dl);
  }
  article.appendChild(details);

  // 侧栏：原文 + 路线位置（与论文页同规则；无记录面板）。
  const rail = el('aside', 'lib-rail');
  if (href) {
    const block = el('div', 'lib-rail-block');
    block.appendChild(el('p', 'lib-rail-label', '原文'));
    const a = link(href, material.url, 'lib-rail-line');
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    block.appendChild(a);
    rail.appendChild(block);
  }
  if (positions.length > 0) {
    const block = el('div', 'lib-rail-block');
    block.appendChild(el('p', 'lib-rail-label', '在路线中的位置'));
    for (const position of positions) {
      const trackNote = position.track === 'archive' ? '完整谱系' : '从这里开始';
      block.appendChild(el('p', 'lib-rail-pos', `《${position.direction.title}》第 ${position.index} / ${position.total} 步（${trackNote}）`));
      const prevLine = el('p', 'lib-rail-line');
      if (position.prev && !position.prev.external && position.prev.resolved) {
        prevLine.appendChild(link(stepHref(position.direction.id, position.track, position.prev), `上一步：《${position.prev.resolved.title}》`));
      } else if (position.prev?.external) {
        prevLine.appendChild(el('span', 'lib-muted', '上一步是外链目录条目'));
      } else {
        prevLine.appendChild(el('span', 'lib-muted', '这是第一步'));
      }
      block.appendChild(prevLine);
      const nextLine = el('p', 'lib-rail-line');
      if (position.next && !position.next.external && position.next.resolved) {
        nextLine.appendChild(link(stepHref(position.direction.id, position.track, position.next), `下一步：《${position.next.resolved.title}》`));
      } else if (position.next?.external) {
        nextLine.appendChild(el('span', 'lib-muted', '下一步是外链目录条目'));
      } else {
        nextLine.appendChild(el('span', 'lib-muted', '本段到此'));
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

// ---------- 经典书目 ----------

function renderFoundations(container) {
  const page = el('div', 'lib-page');
  container.appendChild(page);
  page.appendChild(crumb([{ text: '首页', href: '#/home' }, { text: '经典书目' }]));
  page.appendChild(el('h2', null, '经典书目'));
  page.appendChild(
    el('p', 'lib-intro', renderLibrary.foundations?.intro ?? '不绑定方向的基础经典。'),
  );
  page.appendChild(
    el('p', 'lib-notice-flat', '这些条目目前依据摘要整理，尚未逐篇阅读正文；建议投入深度不等于已经读到的程度。'),
  );
  const groups = foundationGroups(renderLibrary);
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
  wrap.appendChild(el('span', 'lib-res-meta', `（${parts.join(' · ')}）`));
  if (resource.versionNote) wrap.appendChild(el('span', 'lib-res-note', ` ${readerSourceNote(resource.versionNote)}`));
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
  if (route.kind === 'core' && !routeStartable(renderLibrary, route)) {
    card.appendChild(el('p', 'lib-tech-warn', '可开始单元待补核：当前没有已核查到章节且访问条件明确的主资源。'));
  }
  return card;
}

function renderLearn(container, routeId = null, ctx = {}) {
  const page = el('div', 'lib-page');
  container.appendChild(page);
  page.appendChild(crumb([{ text: '首页', href: '#/home' }, { text: '技术学习', href: '#/learn' }]));
  page.appendChild(el('h2', null, '技术学习'));
  const featured = featuredTechnicalRoutes(renderLibrary);
  // 05 §4：有 featured 后按默认三条呈现；不再使用旧的「六条必学主干」课表文案。
  page.appendChild(
    el(
      'p',
      'lib-intro',
      featured.length > 0
        ? '默认三条技术路线：多智能体架构（主）、RAG / 检索记忆（按需）、图（浅尝）。不要求先选定论文方向，也不必先学完其他主干；其余技术路线折叠在下方，当前不必先学。'
        : '技术学习不要求先选定论文方向。六条必学主干按能力组织，每条给出单元、主资源、自查与何时跳过；方向相关的深入内容放在按需支线。',
    ),
  );
  const core = coreTechnicalRoutes(renderLibrary);
  const advanced = advancedTechnicalRoutes(renderLibrary);
  if (core.length === 0 && advanced.length === 0 && featured.length === 0) {
    page.appendChild(emptyBox(EMPTY_NOTICES.technicalRoutes));
    return;
  }

  if (routeId !== null) {
    const route = getTechnicalRoute(renderLibrary, routeId);
    if (!route) {
      page.appendChild(notFoundBox('技术路线', routeId));
      return;
    }
    // 03 §5：learn 带 route/track 时须有 unit，且该单元是此步骤的目标；unit 可单独深链。
    let unitNotice = null;
    let anchorUnit = null;
    if (ctx.unitId) {
      anchorUnit = (route.units ?? []).find((u) => u.id === ctx.unitId) ?? null;
      if (!anchorUnit) {
        unitNotice = `链接指定的单元 ${ctx.unitId} 不在路线「${route.title}」中；已显示路线全部单元。`;
      } else if (ctx.routeId && ctx.track) {
        const stepPos = trackPosition(renderLibrary, ctx.routeId, ctx.track, {
          kind: 'unit',
          unitRef: { routeId: route.id, unitId: ctx.unitId },
        });
        if (!stepPos) {
          unitNotice = `单元 ${ctx.unitId} 不是该路线步骤的目标；已仅按单元定位。`;
        }
      }
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
    // PLAN-010 阶段 E：featured 路线补「与当前研究能力的关系」块（映射到研究能力而非框架目录）。
    if (typeof route.researchLink === 'string' && route.researchLink.trim() !== '') {
      const capBox = el('div', 'lib-capmap');
      capBox.appendChild(el('p', 'lib-capmap-title', '与当前研究能力的关系'));
      capBox.appendChild(el('p', 'lib-para', route.researchLink));
      page.appendChild(capBox);
    }
    if (Array.isArray(route.relatedPaperIds) && route.relatedPaperIds.length > 0) {
      const p = el('p', 'lib-step-line');
      p.appendChild(el('strong', 'lib-step-label', '关联论文：'));
      route.relatedPaperIds.forEach((paperId, i) => {
        if (i > 0) p.appendChild(document.createTextNode('；'));
        const paper = getPaper(renderLibrary, paperId);
        if (paper) p.appendChild(paperLink(paper));
        else p.appendChild(el('span', 'lib-unsafe-link', `${paperId}（关联未接入）`));
      });
      page.appendChild(p);
    }
    if (unitNotice) page.appendChild(el('p', 'lib-notice-flat', unitNotice));

    if ((route.units ?? []).length > 0) {
      page.appendChild(el('h3', 'lib-block-title', '单元目录'));
      const ol = el('ol', 'lib-steps');
      for (const unit of route.units) {
        const li = el('li', 'lib-route-step');
        const title = el('h4', 'lib-step-title');
        title.appendChild(link(`${buildHash('learn', route.id)}?unit=${encodeURIComponent(unit.id)}`, unit.title));
        li.appendChild(title);
        if (unit.goal) li.appendChild(el('p', 'lib-step-line', unit.goal));
        if (unit.availability === 'pending') li.appendChild(el('p', 'lib-asof', '待核'));
        ol.appendChild(li);
      }
      page.appendChild(ol);

      for (const unit of route.units) {
        const box = el('section', 'lib-unit');
        box.id = `lib-unit-${unit.id}`;
        box.appendChild(el('h3', 'lib-block-title', unit.title));
        box.appendChild(el('p', 'lib-para', unit.goal));
        if (unit.availability === 'pending') {
          box.appendChild(el('p', 'lib-notice-flat', `本单元待核：${unit.pendingReason ?? '原因待补'}；暂不作为可开始内容。`));
        }
        if (unit.focus) {
          const p = el('p', 'lib-step-line');
          p.appendChild(el('strong', 'lib-step-label', '读什么：'));
          p.appendChild(document.createTextNode(unit.focus));
          box.appendChild(p);
        }
        const { primary, supplement } = unitResources(route, unit);
        if (primary) box.appendChild(resourceLine(primary, '主资源'));
        if (supplement) box.appendChild(resourceLine(supplement, '补充'));
        // 编辑课单元（04 §4）：非空 lesson.blocks 且 resourceIds=[]；两种都空时明确提示。
        if (Array.isArray(unit.lesson?.blocks) && unit.lesson.blocks.length > 0) {
          renderBlocks(box, unit.lesson.blocks);
        }
        if (!primary && !supplement && !(Array.isArray(unit.lesson?.blocks) && unit.lesson.blocks.length > 0)) {
          box.appendChild(el('p', 'lib-notice-flat', '本单元还没有已登记的可开始资源。'));
        }
        // 多智能体教材链接（04 §2.1）：精确路径 + 章节提示；普通同源链接，不解析执行。
        if (unit.labPath) {
          const p = el('p', 'lib-first-line');
          const a = link(unit.labPath, '打开/下载教材', 'lib-btn');
          a.setAttribute('download', '');
          p.appendChild(a);
          if (unit.labSection) p.appendChild(el('span', 'lib-res-meta', `（本节对应教材章节 ${unit.labSection}）`));
          box.appendChild(p);
        }
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
            const paper = getPaper(renderLibrary, paperId);
            if (paper) p.appendChild(paperLink(paper));
            else p.appendChild(el('span', 'lib-unsafe-link', `${paperId}（关联未接入）`));
          });
          box.appendChild(p);
        }
        page.appendChild(box);
      }
      // 单元深链定位（03 §5）：不改动 location.hash，只做页内滚动。
      if (anchorUnit && typeof document !== 'undefined') {
        const target = document.getElementById(`lib-unit-${anchorUnit.id}`);
        if (target && typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'start' });
      }
    } else if (route.kind === 'advanced') {
      page.appendChild(el('p', 'lib-notice-flat', '这条是按需支线：先按关联论文或对应主干学习，再决定是否深入。'));
      if (Array.isArray(route.relatedPaperIds) && route.relatedPaperIds.length > 0) {
        const ol = el('ol', 'lib-steps');
        for (const paperId of route.relatedPaperIds) {
          const paper = getPaper(renderLibrary, paperId);
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

  if (featured.length > 0) {
    page.appendChild(el('h3', 'lib-block-title', '默认三条'));
    for (const route of featured) page.appendChild(technicalRouteCard(route));
    const others = renderLibrary.technicalRoutes.filter((r) => r.kind !== 'featured');
    if (others.length > 0) {
      const details = el('details', 'lib-quick-group');
      details.appendChild(el('summary', 'lib-quick-title', '其他主干（当前不必先学）'));
      for (const route of others) details.appendChild(technicalRouteCard(route));
      page.appendChild(details);
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
  panel.appendChild(el('p', 'lib-muted', `简报期次：${brief.date}。条目中的发表时间单独标注。`));
  const ol = el('ol', 'lib-brief-items');
  for (const item of brief.items) {
    const li = el('li', 'lib-brief-item');
    const title = el('p', 'lib-brief-item-title');
    const target = briefItemTarget(renderLibrary, item);
    if (target?.kind === 'paper') {
      title.appendChild(paperLink(getPaper(renderLibrary, target.paperId)));
    } else if (target?.kind === 'external') {
      title.appendChild(externalLink(target.href, item.displayTitle ?? briefSourceLabel(item, target.href)));
    } else if (target?.kind === 'missing-paper') {
      title.appendChild(el('span', 'lib-unsafe-link', `${item.paperId}（关联论文未接入，内容待修复）`));
    } else if (target?.kind === 'unsafe-source') {
      title.appendChild(el('span', 'lib-unsafe-link', `${item.source}（来源未通过 https 校验，不提供可点链接）`));
    } else {
      title.appendChild(el('span', 'lib-unsafe-link', '（本条缺少可解析目标，内容待修复）'));
    }
    li.appendChild(title);
    for (const [label, value] of [
      ['推荐理由', item.displayReason ?? item.reason],
      ['摘要', item.summary],
      ['发表时间', item.published],
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
  // REWORK-007 §4：说明段砍半——"登记≠发表、失败不冒充、不入库"由查询结果区逐次如实呈现，不在面板顶重述。
  box.appendChild(
    el('p', 'lib-intro', '点主题才向本机服务查询一次 Crossref（最近 7 个 UTC 日登记）；结果不入库、不写记录。'),
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
        meta.textContent = `命中 ${payload.count} 条；筛选出 ${payload.topicFilteredCount} 条主题相关结果。各论文发表时间见条目。`;
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
    el('p', 'lib-intro', '这里精选与研究方向相关的新工作，帮助了解近期研究在解决什么问题、使用什么方法；它是观察窗口，不是每日阅读任务。每条论文单独标注发表时间。'),
  );
  if (renderLibrary.briefs.length === 0) {
    page.appendChild(emptyBox(EMPTY_NOTICES.briefs));
    return;
  }
  // REWORK-007 §1：每日变化的简报优先，实时发现区退到历史索引之后（原先压在简报之上）。
  if (briefId !== null) {
    const brief = getBrief(renderLibrary, briefId);
    if (!brief) {
      page.appendChild(notFoundBox('简报', briefId));
      return;
    }
    page.appendChild(briefPanel(brief));
    page.appendChild(briefArchive(brief.id));
    page.appendChild(renderDiscoverSection());
    return;
  }
  const latest = latestBrief(renderLibrary);
  page.appendChild(el('h3', 'lib-block-title', '选编简报'));
  page.appendChild(briefPanel(latest));
  page.appendChild(briefArchive(latest.id));
  page.appendChild(renderDiscoverSection());
}

// 历史工作日索引：按期列出全部简报并标明当前期；未产出的日期不占位、不补写。
function briefArchive(currentId) {
  const box = el('div', 'lib-brief-archive');
  box.appendChild(el('h3', 'lib-block-title', '历史工作日'));
  const sorted = [...renderLibrary.briefs].sort((a, b) => String(b.date).localeCompare(String(a.date)));
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
  // PF-01 补：侧栏快捷入口只列 active。
  const directions = activeDirections(renderLibrary);
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
  for (const notice of renderLibrary.meta?.notices ?? []) details.appendChild(el('p', null, readerSourceNote(notice)));
  // 03 §6：页脚只增加一次的整理依据提示。
  details.appendChild(el('p', null, '整理依据已标明；建议自己看的部分请打开原文。打开网页不会变成已读。'));
  footer.appendChild(details);
}

// ---------- DYNAMIC-GUIDANCE-009 / C 包：本机导学调整（#/guidance）与生效 meta 辅助 ----------
// pending 提案仅存在于页面会话内存、不落盘（R2）：未经确认刷新/关闭＝整案丢弃，需重新粘贴。
// 确认写入由 guidance.applyProposal 在 Web Locks 内重跑校验 ①–④ 后整份 JSON 一次写入；
// 覆盖层读写不触碰 v3 键；损坏/不可用给明确文案并降级为基线显示（R5）。

const guidanceUi = {
  pending: [], // [{key, text, proposal, validation, snapshot, choices}]
  notices: [], // 一次性提示（确认/撤销/导入等动作后随下一次渲染显示）
  submitErrors: null, // 最近一次校验拒绝（①–③）：不出预览
  importState: null, // {incoming, comparison}（导入冲突的显式决策中）
  resetArmed: false, // 重置两步确认
  corruptExported: false, // 坏档已导出后才允许强制重置
  seq: 0,
};

function guidanceStorage() {
  return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
}
function guidanceNavigator() {
  return typeof window !== 'undefined' ? window.navigator ?? null : null;
}
function pushGuidanceNotice(text) {
  guidanceUi.notices.push(text);
}

// R4 meta：该对象被覆盖层新增/字段调整时的纯文本 meta 行（不加徽章、不靠颜色）。
function adjustMetaFor(overlay, type, id, fields) {
  if (!overlay?.entries) return null;
  const lines = [];
  const insertEntry = overlay.entries[`${type}:${id}:`];
  if (insertEntry) lines.push(`${adjustLabel(insertEntry)} · 本对象为覆盖层新增（内容模块文件未改）`);
  for (const f of fields) {
    const entry = overlay.entries[`${type}:${id}:${f}`];
    if (entry) lines.push(`字段「${FIELD_LABELS[f] ?? f}」：${adjustLabel(entry)}`);
  }
  return lines.length > 0 ? lines.join('；') : null;
}

function renderCardGuidanceBanner(article, type, id) {
  const overlay = currentGuidanceOverlay();
  if (!overlay?.entries) return;
  const prefix = `${type}:${id}:`;
  const entries = Object.entries(overlay.entries).filter(([ref]) => ref.startsWith(prefix));
  if (entries.length === 0) return;
  if (entries.some(([, entry]) => entry.example === true)) {
    article.appendChild(el('p', 'lib-example-banner', `${EXAMPLE_BANNER_TEXT}：本页含示例导学调整，不是真实指导`));
  }
  article.appendChild(el('p', 'lib-adjust-meta', `本页有 ${entries.length} 处导学调整来自已确认提案（逐条注明；内容模块文件未被改写）。`));
}

function renderCardQuestionsMeta(article, type, id) {
  const entry = overlayEntry(currentGuidanceOverlay(), `${type}:${id}:questions`);
  if (!entry) return;
  const count = Array.isArray(entry.value) ? entry.value.length : 0;
  article.appendChild(
    el('p', 'lib-adjust-meta', `自查问题末尾 ${count} 条为导学追加（见上「读完后自查」列表）：${adjustLabel(entry)}`),
  );
  if (entry.example === true) article.appendChild(el('p', 'lib-example-mark', EXAMPLE_BANNER_TEXT));
}

function guidanceDisplayValue(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map((v) => guidanceDisplayValue(v)).join('；');
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join('；') : typeof v === 'object' && v ? JSON.stringify(v) : String(v ?? '')}`)
      .join(' · ');
  }
  return String(value ?? '');
}

function submitProposalText(text) {
  guidanceUi.submitErrors = null;
  const validation = validateProposal(String(text ?? ''), renderBase, currentGuidanceOverlay());
  if (validation.status === 'reject') {
    guidanceUi.submitErrors = validation;
    renderApp();
    return;
  }
  guidanceUi.seq += 1;
  guidanceUi.pending.push({
    key: `pending-${guidanceUi.seq}`,
    text: String(text ?? ''),
    proposal: validation.proposal,
    validation,
    snapshot: Object.fromEntries(validation.items.map((it) => [it.ref, it.op === 'insert' ? '' : it.baseCurrent ?? ''])),
    choices: {},
  });
  pushGuidanceNotice('已通过校验进入预览：确认前刷新/关闭即整案丢弃，不写入任何内容。');
  renderApp();
}

async function confirmPendingProposal(pending) {
  const items = pending.validation.items;
  for (const it of items) {
    if (!pending.choices[it.ref]) {
      pushGuidanceNotice('确认前请为每一条显式选择「采纳此条」或「保持旧值」（两个都是显式动作）。');
      renderApp();
      return;
    }
  }
  const accepted = {};
  for (const it of items) if (pending.choices[it.ref] === 'accept') accepted[it.ref] = true;
  const storage = guidanceStorage();
  if (!storage) {
    pushGuidanceNotice('本浏览器存储不可用，导学调整无法保存；页面按基线显示。');
    renderApp();
    return;
  }
  const result = await applyProposal({
    storage,
    navigatorLike: guidanceNavigator(),
    base: renderBase,
    proposalText: pending.text,
    accepted,
    previewSnapshot: pending.snapshot,
    contentVersionLabel: typeof renderBase?.contentVersion === 'string' ? renderBase.contentVersion : null,
  });
  guidanceUi.pending = guidanceUi.pending.filter((p) => p.key !== pending.key);
  if (result.ok) {
    pushGuidanceNotice('已写入：导学覆盖层生效（首页/路线/论文/材料/地图经 computeEffective 单入口生效，重新打开仍有效）。本人笔记（v3）未被触碰。');
  } else {
    pushGuidanceNotice(result.message ?? '写入失败：覆盖层保持旧状态。');
  }
  renderApp();
}

function discardPendingProposal(pending) {
  guidanceUi.pending = guidanceUi.pending.filter((p) => p.key !== pending.key);
  pushGuidanceNotice(`提案 ${pending.proposal.id}：整案不采纳，未写入任何内容（关闭＝不采纳）。`);
  renderApp();
}

function revalidatePendingProposal(pending) {
  const validation = validateProposal(pending.text, renderBase, currentGuidanceOverlay());
  guidanceUi.pending = guidanceUi.pending.filter((p) => p.key !== pending.key);
  if (validation.status === 'reject') {
    guidanceUi.submitErrors = validation;
    pushGuidanceNotice('重新校验未通过：按当前生效态本提案已不可应用（例如目标已被移除），未写入。');
  } else {
    guidanceUi.pending.push({
      key: pending.key,
      text: pending.text,
      proposal: validation.proposal,
      validation,
      snapshot: Object.fromEntries(validation.items.map((it) => [it.ref, it.op === 'insert' ? '' : it.baseCurrent ?? ''])),
      choices: {},
    });
    pushGuidanceNotice('已按当前生效态重新生成预览（选择已重置）。');
  }
  renderApp();
}

async function undoLastGuidance() {
  const storage = guidanceStorage();
  if (!storage) return;
  const result = await undoLastApply({ storage, navigatorLike: guidanceNavigator(), base: renderBase });
  pushGuidanceNotice(result.ok ? '已撤销最近一次导学调整（覆盖层完整快照一次回退；本人笔记不受影响）。' : result.message ?? '撤销未执行。');
  renderApp();
}

function downloadGuidanceFile(name, text, mime) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = el('a', null, '');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function renderApp() {
  const container = document.getElementById('lib-view');
  if (!container) return;
  // C 包：每轮渲染先经生效值单入口算出生效库（无覆盖层＝基线同一引用，不复制第二副本）。
  renderLibrary = computeEffective(renderBase, currentGuidanceOverlay()).lib;
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
  // 03 §6：材料详情带路线上下文时归属方向导航激活项。
  const navView = parsed.view === 'material' && parsed.routeId ? 'route' : parsed.view;
  setNav(navView);
  switch (parsed.view) {
    case 'home':
      renderHome(container);
      break;
    case 'map':
      renderMap(container);
      break;
    case 'guidance':
      renderGuidance(container);
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
      renderPaper(container, parsed.id, parsed);
      break;
    case 'material':
      renderMaterial(container, parsed.id, parsed);
      break;
    case 'learn':
      renderLearn(container);
      break;
    case 'learnRoute':
      renderLearn(container, parsed.id, parsed);
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
