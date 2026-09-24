// public/guidance.js —— DYNAMIC-GUIDANCE-009 / C 包：本机导学提案闭环（纯数据模块，无 DOM）。
// 契约：docs/DYNAMIC-GUIDANCE-009.md R3（Schema 与白名单）、R4（来源展示词表）、R5（存储/冲突/回滚）、
// R6（示例边界）；行为由 tests/guidance.test.mjs 与 tests/render.test.mjs（DG009-C）逐项锁定。
// 边界（R5／交付行为 5）：
// - 只读写独立键 'research-workbench:guidance:v1'，绝不读写 v1/v2/v3（本人笔记与状态在 notes.js，互不触碰）；
// - 服务保持只读：提案导入/导出、覆盖层读写全部发生在浏览器内（localStorage + 文件下载/上传），
//   本模块不发起任何网络请求、不调用任何模型；
// - 生效值唯一入口 computeEffective(base, overlay)（R5 single overlay source）：页面对生效字段的读取
//   一律来自它返回的视图（overlay==null 时直接透传基线，不做第二副本）；对生效视图重复叠加会显式抛错；
// - 校验顺序（R3 定死）：① JSON 解析（截断/多对象/BOM 拒绝）→ ② schema/上限/白名单/枚举/提案内独立性
//   → ③ 目标可解析（对应用前生效态；含 insert 撞 tombstones、总额 12/15 复校）→ ④ 逐条 stale-base 标记
//   （永不整案拒绝、不阻止预览）→ ⑤ 确认瞬间重跑 ①–④（防竞态）后才原子整键写入。
// C 包实现口径（只收紧不放宽，逐条对应 R3–R6；同步记录在 009 文档 C 包实施段）：
// - map-node/map-edge 的 set 仅限 label/summary/refs 与 meaning/evidence：from/to/side/source 不可改
//   （改端点等于换成另一条关系，超出「字段调整」授权；R3 未逐一列名，此处取保守子集并如实记录）。
// - route-step insert 的 anchor 以 {routeId, track?, afterStepId?} 承载在 value 内（R3 未规定字段位置）；
//   afterStepId 缺省＝该 track 末尾。插入步骤要求 purpose 与 readWhen 非空（不塞半套指导）。
// - home-focus 目标以固定 id 'home' 寻址（站内唯一首页焦点）：targetRef = home-focus:home:routeId|note。
// - 覆盖层新增地图边的 evidence 受 R1 核查层约束：只允许 2026-09-23 R7「保留可用」清单内条目
//   （清单日后扩充属内容工作，须经 A 包复核后更新本常量，不得由提案绕开）。
// - 生效内容 hash 为变更检测摘要（stableStringify + FNV-1a），不是加密安全摘要，仅用于 import 三路比较。

// ---------- 常量与词表 ----------

export const GUIDANCE_KEY = 'research-workbench:guidance:v1';
export const GUIDANCE_LOCK = 'research-workbench-guidance-write';
export const OVERLAY_VERSION = 1;
export const PROPOSAL_KIND = 'rw.guidance-proposal';
export const PROPOSAL_SCHEMA_VERSION = 1;

export const MAP_LIMITS = Object.freeze({ nodes: 12, edges: 15 }); // R1 生效总额（基线＋覆盖层，含示例）
export const TOMBSTONE_LIMIT = 40; // R5
export const HISTORY_LIMIT = 20; // R5
export const EXPECTED_BASE_MAX = 600; // UTF-16 码元（R3）
export const CHANGES_MAX = 10;

// 步骤枚举：与 library.js STAGE_ORDER / PASS_MODE_LABELS 同源（此处独立声明避免循环 import；
// tests/guidance.test.mjs 断言两份常量一致，防止漂移）。
export const STEP_STAGES = Object.freeze(['建立概念', '建立问题', '理解方法', '看评价与反例', '核查近期竞争']);
export const STEP_REQUIRED_VALUES = Object.freeze(['必读', '选读']);
export const STEP_PASS_MODES = Object.freeze(['map', 'core', 'deep']);

// origin.sourceType 封闭枚举与中文标签（R1 同一词表；R4 三种来源语义严格区分）。
export const PROPOSAL_SOURCE_TYPES = Object.freeze(['self', 'advisor', 'ai']);
export const MAP_ORIGIN_TYPES = Object.freeze(['content', 'advisor', 'ai', 'self']);
export const ORIGIN_SOURCE_LABELS = Object.freeze({ self: '本人陈述', advisor: '导师转述', ai: 'AI建议' });

export const MAP_MEANING_VOCAB = Object.freeze(['variant-of', 'conflicts', 'depends-on', 'inspires', 'addresses']);

// R1 核查层：覆盖层新增边的 evidence 允许名单＝009 文档「R7 审查执行记录」（2026-09-23）
// 结论为「保留可用」的站内条目；「保留收窄／待复核」（tosem2025-acceptance、swe-bench）与未登记条目不得成边。
export const R7_USABLE_2026_09_23 = Object.freeze([
  'mat-cross-harness-map',
  'mat-read-empirical',
  'beyond-frameworks',
  'memgpt',
  'handoff-tax',
  'handoff-debt',
  'cross-harness-collab',
  'step-collab-1',
  'step-collab-2',
  'step-collab-3',
  'step-collab-4',
  'step-collab-5',
]);

export const EXAMPLE_BANNER_TEXT = '示例 · 非真实指导';

// 字段白名单标签（UI meta 行与预览页共用；R4 纯文本口径）。
export const FIELD_LABELS = Object.freeze({
  purpose: '为什么读',
  readWhen: '什么时候读',
  check: '读到什么程度',
  stage: '阶段',
  required: '必读/选读',
  passMode: '读法',
  'learner.gist': '讲什么',
  'learner.value': '对当前路线的价值',
  'learner.intent': '带着什么目的',
  questions: '自查问题（追加）',
  openQuestions: '可以追问的问题（追加）',
  label: '标签',
  summary: '概述',
  refs: '可走到的内容',
  meaning: '关系语义',
  evidence: '证据条目',
  routeId: '当前关注方向',
  note: '附注',
});

const TARGET_TYPE_LABELS = Object.freeze({
  'route-step': '路线步骤',
  paper: '论文卡',
  material: '站内材料',
  direction: '方向',
  'map-node': '地图节点',
  'map-edge': '地图关系',
  'home-focus': '首页焦点',
});

const PROP_ID = /^prop-[a-z0-9.-]{1,58}$/;
const STEP_OV_ID = /^step-ov-[a-z0-9][a-z0-9.-]{1,40}$/;
const MAP_NODE_ID = /^map-[a-z0-9][a-z0-9.-]{1,47}$/;
const MAP_EDGE_ID = /^map-edge-[a-z0-9][a-z0-9.-]{1,42}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// canonicalSerialize 分隔符（R3）：对象成员 U+001E、数组元素 U+001F（用码位构造，避免源码内嵌控制字符）。
const ch = (c) => String.fromCharCode(c);
export const SEP_MEMBER = ch(0x1e);
export const SEP_ELEMENT = ch(0x1f);

// ---------- 基础判定 ----------

const isStr = (v) => typeof v === 'string';
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isArr = Array.isArray;
const cloneJson = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

function isStrictDate(s) {
  if (!isStr(s) || !DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function isSafeEnum(value, allowed) {
  return isStr(value) && allowed.includes(value);
}

// 硬禁止面（R3）：URL/HTML/脚本片段与控制字符一律拒绝；换行（\n，及参与规范化的 \r）允许。
const CONTROL_CLASS = `[${ch(0)}-${ch(8)}${ch(11)}${ch(12)}${ch(14)}-${ch(31)}${ch(127)}]`;
const FORBIDDEN_TEXT = new RegExp(`(<[a-zA-Z/!][^>]*>|https?://|ftp://|javascript:|data:|www\\.|${CONTROL_CLASS})`, 'i');

function textProblem(s) {
  return FORBIDDEN_TEXT.test(s) ? '内容含链接、HTML/脚本片段或控制字符，按边界拒绝' : null;
}

function checkGuidanceString(value, { max, field, nonEmpty = true }) {
  if (!isStr(value)) return `${field} 必须是字符串`;
  if (nonEmpty && value.trim() === '') return `${field} 不能为空`;
  if (value.length > max) return `${field} 超出长度上限 ${max}（当前 ${value.length}）`;
  const tp = textProblem(value);
  if (tp) return `${field} ${tp}`;
  return null;
}

function checkIdToken(value, { max, field, site }) {
  if (!isStr(value) || value === '' || value.length > max) return `${field} 必须是 ≤${max} 字符的站内 id`;
  const tp = textProblem(value);
  if (tp) return `${field} ${tp}`;
  if (site && !site.has(value)) return `${field} 无法解析为站内条目：${value}`;
  return null;
}

// ---------- canonicalSerialize（R3 基线快照唯一序列化） ----------

// 字符串＝原文（不 trim，换行统一 \n）；枚举＝值原文。
export function canonicalString(value) {
  return String(value ?? '').replace(/\r\n?/g, '\n');
}

// 字符串数组＝逐元素以分隔符连接；对象＝白名单字段声明序 key=value、成员分隔（未设字段不输出）。
function canonicalValue(value, order) {
  if (value === undefined || value === null) return '';
  if (isArr(value)) return value.map((el) => canonicalString(el)).join(SEP_ELEMENT);
  if (isObj(value)) {
    const out = [];
    for (const key of order) {
      const v = getPath(value, key);
      if (v === undefined || v === null || v === '') continue;
      out.push(`${key}=${isArr(v) ? v.map((el) => canonicalString(el)).join(SEP_ELEMENT) : canonicalString(v)}`);
    }
    return out.join(SEP_MEMBER);
  }
  return canonicalString(value);
}
// 对象成员的白名单字段声明序（R3 固定序，非字典序）。
const STEP_CANON_ORDER = Object.freeze(['kind', 'paperId', 'materialId', 'stage', 'required', 'passMode', 'purpose', 'readWhen', 'check']);
const NODE_CANON_ORDER = Object.freeze(['side', 'label', 'summary', 'refs', 'source.originType', 'source.note', 'source.asOf']);
const EDGE_CANON_ORDER = Object.freeze(['from', 'to', 'meaning', 'evidence', 'source.originType', 'source.note', 'source.asOf']);
const HOME_FOCUS_CANON_ORDER = Object.freeze(['routeId', 'note']);
const CANON_ORDERS = Object.freeze({ 'route-step': STEP_CANON_ORDER, 'map-node': NODE_CANON_ORDER, 'map-edge': EDGE_CANON_ORDER, 'home-focus': HOME_FOCUS_CANON_ORDER });

// ---------- targetRef 与路径 ----------

// targetRef ＝ type＋id＋field（insert/remove 按该 id 计，field 为空段）。
export function targetRef(target) {
  return `${target.type}:${target.id}:${target.field ?? ''}`;
}

function parseRef(ref) {
  const i = ref.indexOf(':');
  const j = ref.indexOf(':', i + 1);
  return { type: ref.slice(0, i), id: ref.slice(i + 1, j), field: ref.slice(j + 1) };
}

// B1 修复轮：路径工具一律拒绝原型链键——即使存储/导入档构造出 '__proto__'/'constructor' 字段，
// 物化写入也不可能污染原型（normalizeOverlay 已在入口按白名单拒绝，这里是第二道防线）。
const UNSAFE_KEY = /^(?:__proto__|constructor|prototype)$/;

function getPath(obj, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null || UNSAFE_KEY.test(k) ? undefined : o[k]), obj);
}

function setPath(obj, dotted, value) {
  const keys = dotted.split('.');
  if (keys.some((k) => UNSAFE_KEY.test(k))) return; // 拒绝原型链路径写入
  const last = keys.pop();
  let cursor = obj;
  for (const k of keys) {
    if (!isObj(cursor[k])) cursor[k] = {};
    cursor = cursor[k];
  }
  if (UNSAFE_KEY.test(last)) return;
  cursor[last] = value;
}

// ---------- 基线访问（guidance 不 import library.js，避免循环；按 LIBRARY 数据形状自实现） ----------

export function activeDirectionIds(lib) {
  return (lib?.directions ?? []).filter((d) => d?.status !== 'deferred').map((d) => d.id);
}

// 地图 refs/evidence 允许的站内 id 域（R1）：paper / material / direction / tech-route / step-*。
function mapSiteRefIds(lib) {
  const ids = new Set();
  for (const p of lib?.papers ?? []) ids.add(p.id);
  for (const m of lib?.materials ?? []) ids.add(m.id);
  for (const d of lib?.directions ?? []) {
    ids.add(d.id);
    for (const step of [...(d.startRoute ?? []), ...(d.archiveRoute ?? [])]) if (step?.id) ids.add(step.id);
  }
  for (const t of lib?.technicalRoutes ?? []) ids.add(t.id);
  return ids;
}

// 全 id 域（insert 撞 id 检查用：新增对象不得与任何既有 id 同名）。
function allSiteIds(lib) {
  const ids = mapSiteRefIds(lib);
  for (const n of lib?.map?.nodes ?? []) ids.add(n.id);
  for (const e of lib?.map?.edges ?? []) ids.add(e.id);
  return ids;
}

function getStepRaw(lib, stepId) {
  for (const d of lib?.directions ?? []) {
    for (const track of ['start', 'archive']) {
      const route = track === 'start' ? d.startRoute : d.archiveRoute;
      if (!Array.isArray(route)) continue;
      const step = route.find((s) => s?.id === stepId);
      if (step) return { step, direction: d, track, route };
    }
  }
  return null;
}

function getMapItem(lib, type, id) {
  const list = type === 'map-node' ? lib?.map?.nodes : lib?.map?.edges;
  return (list ?? []).find((x) => x?.id === id) ?? null;
}
// ---------- computeEffective：生效值唯一入口（R5 single overlay source） ----------

const EFFECTIVE_FLAG = '__rwEffectiveView';

// 「无生效变更」＝entries 与 tombstones 都为空（条目删完时 tombstones 仍在，
// 不能把覆盖层当 null 丢掉，否则被删 id 可复活、expectedBase 产生歧义（R5））。
export function isOverlayEmpty(overlay) {
  if (!overlay) return true;
  return Object.keys(overlay.entries ?? {}).length === 0 && Object.keys(overlay.tombstones ?? {}).length === 0;
}

export function computeEffective(base, overlay = null) {
  if (base && base[EFFECTIVE_FLAG] === true) {
    // 防止第二处缓存副本被再叠加：生效视图只能由基线＋覆盖层一次性算出。
    throw new Error('computeEffective 不接受已生效的视图（R5 单入口）');
  }
  if (isOverlayEmpty(overlay)) {
    return { base, overlay: overlay ?? null, lib: base, map: base?.map ?? { nodes: [], edges: [] }, homeFocus: null };
  }
  const lib = cloneJson(base);
  applyOverlayEntries(lib, overlay);
  Object.defineProperty(lib, EFFECTIVE_FLAG, { value: true, enumerable: false });
  return { base, overlay, lib, map: lib.map ?? { nodes: [], edges: [] }, homeFocus: overlay.homeFocus ?? null };
}

// 把 overlay.entries 物化进基线克隆 lib。两遍：第一遍 insert（建立对象与位置），
// 第二遍 set/append（可命中本覆盖层此前插入的自有对象）。Object.entries 顺序＝写入顺序，后写覆盖先写。
function applyOverlayEntries(lib, overlay) {
  lib.map = lib.map ?? { nodes: [], edges: [] };
  const entries = overlay?.entries ?? {};
  for (const [ref, entry] of Object.entries(entries)) {
    if (entry?.op !== 'insert') continue;
    const { type, id } = parseRef(ref);
    if (type === 'route-step') {
      materializeRouteInsert(lib, id, entry);
    } else if (type === 'map-node') {
      if (!lib.map.nodes.some((n) => n.id === id)) {
        lib.map.nodes.push({ id, ...cloneJson(entry.value), ...(entry.example === true ? { example: true } : {}) });
      }
    } else if (type === 'map-edge') {
      if (!lib.map.edges.some((e) => e.id === id)) {
        lib.map.edges.push({ id, ...cloneJson(entry.value), ...(entry.example === true ? { example: true } : {}) });
      }
    }
  }
  for (const [ref, entry] of Object.entries(entries)) {
    if (entry?.op === 'insert') continue; // 已在第一遍物化
    const { type, id, field } = parseRef(ref);
    if (type === 'home-focus') continue; // 首页焦点是视图（homeFocusFromEntries），不写基线对象
    if (type === 'route-step') {
      const found = getStepRaw(lib, id);
      if (found) found.step[field] = cloneJson(entry.value);
    } else if (type === 'paper') {
      const item = (lib.papers ?? []).find((p) => p.id === id);
      if (item) applyCardChange(item, field, entry);
    } else if (type === 'material') {
      const item = (lib.materials ?? []).find((m) => m.id === id);
      if (item) applyCardChange(item, field, entry);
    } else if (type === 'direction') {
      const item = (lib.directions ?? []).find((d) => d.id === id);
      if (item && field === 'openQuestions') item.openQuestions = [...(item.openQuestions ?? []), ...cloneJson(entry.value)];
    } else if (type === 'map-node' || type === 'map-edge') {
      applyMapSet(lib, type, id, { [field]: entry.value });
    }
  }
}

// 覆盖层插入的路线步骤：anchor＝{routeId, track?, afterStepId?}（缺省该 track 末尾）。
// 锚点在生效态已被异常存储破坏（找不到）时保守放弃物化，不猜位置（校验 ③ 保证正常路径可解析）。
function materializeRouteInsert(lib, id, entry) {
  const value = entry.value ?? {};
  const anchor = value.anchor ?? {};
  const direction = (lib.directions ?? []).find((d) => d.id === anchor.routeId);
  if (!direction) return null;
  const track = anchor.track === 'archive' ? 'archive' : 'start';
  const routeKey = track === 'start' ? 'startRoute' : 'archiveRoute';
  if (!Array.isArray(direction[routeKey])) direction[routeKey] = [];
  const step = {
    id,
    kind: value.kind,
    ...(value.kind === 'paper' ? { paperId: value.paperId } : { materialId: value.materialId }),
    ...(value.stage !== undefined ? { stage: value.stage } : {}),
    ...(value.required !== undefined ? { required: value.required } : {}),
    ...(value.passMode !== undefined ? { passMode: value.passMode } : {}),
    purpose: value.purpose,
    readWhen: value.readWhen,
    ...(value.check !== undefined ? { check: value.check } : {}),
    ...(entry.example === true ? { example: true } : {}),
  };
  if (anchor.afterStepId) {
    const idx = direction[routeKey].findIndex((s) => s?.id === anchor.afterStepId);
    if (idx === -1) return null;
    direction[routeKey].splice(idx + 1, 0, step);
  } else {
    direction[routeKey].push(step);
  }
  return step;
}

function applyCardChange(item, field, entry) {
  if (entry.op === 'append') {
    item[field] = [...(Array.isArray(item[field]) ? item[field] : []), ...cloneJson(entry.value)];
  } else {
    setPath(item, field, cloneJson(entry.value));
  }
}

function applyMapSet(lib, type, id, patch) {
  const item = getMapItem(lib, type, id);
  if (!item) return;
  for (const [k, v] of Object.entries(patch ?? {})) {
    if (k === 'id') continue;
    item[k] = cloneJson(v);
  }
}
// ---------- 首页焦点视图：由 entries 派生（entries 是唯一权威；视图随 normalize 重算） ----------

function latestHomeFocusEntry(overlay, field) {
  let best = null;
  for (const [ref, entry] of Object.entries(overlay?.entries ?? {})) {
    const { type, id, field: f } = parseRef(ref);
    if (type !== 'home-focus' || id !== 'home' || f !== field) continue;
    if (!best || String(entry.appliedAt) >= String(best.entry.appliedAt)) best = { ref, entry };
  }
  return best;
}

function homeFocusFromEntries(overlay) {
  const route = latestHomeFocusEntry(overlay, 'routeId');
  const note = latestHomeFocusEntry(overlay, 'note');
  if (!route && !note) return null;
  const driver = route ?? note;
  return {
    routeId: route?.entry.value ?? null,
    note: note?.entry.value ?? null,
    origin: cloneJson(driver.entry.origin),
    proposalId: driver.entry.proposalId,
    appliedAt: driver.entry.appliedAt,
    example: driver.entry.example === true,
  };
}

// ---------- 目标当前生效值与 canonicalSerialize（R3 ④、复制规范基线共用） ----------

function effectiveFieldValue(base, overlay, target) {
  const eff = computeEffective(base, overlay);
  const lib = eff.lib;
  switch (target.type) {
    case 'route-step': {
      const found = getStepRaw(lib, target.id);
      if (!found) return null;
      return target.field ? found.step[target.field] ?? '' : found.step;
    }
    case 'paper': {
      const item = (lib.papers ?? []).find((p) => p.id === target.id);
      if (!item) return null;
      return item[target.field] ?? (target.field.includes('.') ? getPath(item, target.field) ?? '' : '');
    }
    case 'material': {
      const item = (lib.materials ?? []).find((m) => m.id === target.id);
      if (!item) return null;
      return item[target.field] ?? (target.field.includes('.') ? getPath(item, target.field) ?? '' : '');
    }
    case 'direction':
      if (target.field === 'openQuestions') {
        const item = (lib.directions ?? []).find((d) => d.id === target.id);
        return item ? item.openQuestions ?? [] : null;
      }
      return null;
    case 'map-node':
    case 'map-edge': {
      const item = getMapItem(lib, target.type, target.id);
      if (!item) return null;
      return target.field ? item[target.field] ?? '' : item;
    }
    case 'home-focus': {
      // 未设置＝合法空基线（expectedBase ''），不是「目标不可解析」；home-focus 永远可寻址。
      if (!eff.homeFocus) return target.field ? '' : {};
      return target.field ? eff.homeFocus[target.field] ?? '' : { routeId: eff.homeFocus.routeId, note: eff.homeFocus.note };
    }
    default:
      return null;
  }
}

// 「复制规范基线」唯一序列化（R3）：字符串/枚举/数组/对象；未设＝空串。≤600 UTF-16 码元。
export function canonicalBaseline(base, overlay, target) {
  const value = effectiveFieldValue(base, overlay, target);
  if (value === null) return null; // 目标不可解析
  return canonicalValue(value, CANON_ORDERS[target.type] ?? []);
}

// ---------- 覆盖层查询与 R4 meta ----------

export function overlayEntry(overlay, ref) {
  return overlay?.entries?.[ref] ?? null;
}

export function targetLabel(base, overlay, target, field) {
  const type = TARGET_TYPE_LABELS[target?.type] ?? target?.type ?? '?';
  let name = target?.id ?? '';
  try {
    const eff = computeEffective(base, overlay);
    if (target.type === 'paper' || target.type === 'material') {
      const list = target.type === 'paper' ? eff.lib?.papers : eff.lib?.materials;
      const item = (list ?? []).find((x) => x.id === target.id);
      if (item) name = item.displayTitle || item.title || item.id;
    } else if (target.type === 'direction') {
      const item = (eff.lib?.directions ?? []).find((x) => x.id === target.id);
      if (item) name = item.title;
    } else if (target.type === 'map-node' || target.type === 'map-edge') {
      const item = getMapItem(eff.lib ?? base, target.type, target.id);
      if (item) name = target.type === 'map-node' ? item.label ?? item.id : String(item.meaning ?? item.id).slice(0, 24);
    } else if (target.type === 'home-focus') name = '首页';
  } catch { /* 标签尽力而为，不影响判定 */ }
  const f = field ? FIELD_LABELS[field] ?? field : '整体';
  return `${type} ${name}${f ? ` · ${f}` : ''}`;
}

// R4 纯文本 meta：`导学调整 · AI建议 2026-09-23（本人确认）`；示例条目追加示例字样。
export function adjustLabel(entry) {
  if (!entry?.origin) return null;
  const label = ORIGIN_SOURCE_LABELS[entry.origin.sourceType] ?? entry.origin.sourceType;
  const asOf = entry.origin.asOf ?? '';
  const example = entry.example === true ? ` · ${EXAMPLE_BANNER_TEXT}` : '';
  return `导学调整 · ${label} ${asOf}（本人确认）${example}`;
}

// 撤销按钮可用性（R5）：存在 undoSlot 且 history 末条不是 undo/reset 即可用——
// 「应用」与「导入替换」都可撤销（R8-C：导入替换后撤销可用且 undoSlot＝本机替换前快照）。
export function canUndo(overlay) {
  if (!overlay?.undoSlot) return false;
  const h = overlay.history ?? [];
  if (h.length === 0) return false;
  const lastKind = h[h.length - 1].kind;
  return lastKind !== 'undo' && lastKind !== 'reset';
}
// ---------- 字段白名单（R3 唯一权威表；未列出字段一律拒绝） ----------

function allowedFields(type, op) {
  if (type === 'route-step') return op === 'set' ? ['purpose', 'readWhen', 'check', 'stage', 'required', 'passMode'] : [];
  if (type === 'paper' || type === 'material') {
    if (op === 'set') return ['learner.gist', 'learner.value', 'learner.intent'];
    if (op === 'append') return ['questions'];
    return [];
  }
  if (type === 'direction') return op === 'append' ? ['openQuestions'] : [];
  if (type === 'map-node') return op === 'set' ? ['label', 'summary', 'refs'] : [];
  if (type === 'map-edge') return op === 'set' ? ['meaning', 'evidence'] : [];
  if (type === 'home-focus') return op === 'set' ? ['routeId', 'note'] : [];
  return [];
}

const INSERT_TYPES = ['route-step', 'map-node', 'map-edge'];
const REMOVE_TYPES = ['route-step', 'map-node', 'map-edge'];
const KNOWN_TYPES = ['route-step', 'paper', 'material', 'direction', 'map-node', 'map-edge', 'home-focus'];

function checkStepFieldEnum(field, value) {
  if (field === 'stage' && !isSafeEnum(value, STEP_STAGES)) return `stage 必须是 STAGE_ORDER 五值之一：${value}`;
  if (field === 'required' && !isSafeEnum(value, STEP_REQUIRED_VALUES)) return `required 必须是 必读|选读：${value}`;
  if (field === 'passMode' && !isSafeEnum(value, STEP_PASS_MODES)) return `passMode 必须是 map|core|deep：${value}`;
  return null;
}

function checkLabelString(value, field) {
  // label＝≤40 字名词性标签、不得混入句读（009 A13 同规则，覆盖层一并收紧）。
  if (!isStr(value) || value.trim() === '' || value.length > 40 || /[。！？;；]/.test(value)) {
    return `${field} 需为 ≤40 字名词性标签（不得混入句子标点）`;
  }
  return textProblem(value) ? `${field} 内容含链接、HTML/脚本片段或控制字符，按边界拒绝` : null;
}

function checkSiteIdArray(value, { field, site, max = 12 }) {
  if (!isArr(value) || value.length === 0 || value.length > max) return `${field} 必须是 1–${max} 个站内 id`;
  if (new Set(value).size !== value.length) return `${field} 含重复条目`;
  for (const id of value) {
    const err = checkIdToken(id, { max: 64, field, site });
    if (err) return err;
  }
  return null;
}

function parseMeaningVocab(meaning) {
  if (!isStr(meaning)) return null;
  const match = meaning.match(new RegExp(`^(${MAP_MEANING_VOCAB.join('|')})(?=$|[（(：:\\s])`, 'i'));
  return match ? match[1].toLowerCase() : null;
}

// 值结构校验（②）：返回 error 字符串或 null；解析性校验在 ③。
function checkValueShape(change, at) {
  const { op, target } = change;
  const { type, field } = target;
  if (op === 'remove') {
    return change.value !== undefined ? `${at}.value：remove 不接受 value` : null;
  }
  if (op === 'insert') {
    if (!isObj(change.value)) return `${at}.value：insert 需要对象`;
    if (type === 'route-step') {
      const keys = Object.keys(change.value);
      const allowed = ['kind', 'paperId', 'materialId', 'stage', 'required', 'passMode', 'purpose', 'readWhen', 'check', 'anchor'];
      for (const k of keys) if (!allowed.includes(k)) return `${at}.value 含白名单外键 ${k}`;
      const v = change.value;
      if (!['paper', 'article'].includes(v.kind)) return `${at}.value.kind 必须是 paper|article（步骤 insert 不支持 unit/external）`;
      const fk = [v.paperId, v.materialId].filter((x) => x !== undefined);
      if (fk.length !== 1) return `${at}.value 必须恰好给 paperId 或 materialId 之一`;
      if (v.kind === 'paper' && v.materialId !== undefined) return `${at}.value kind=paper 不得带 materialId`;
      if (v.kind === 'article' && v.paperId !== undefined) return `${at}.value kind=article 不得带 paperId`;
      for (const [key, val] of Object.entries(v)) {
        if (val === undefined || key === 'kind' || key === 'paperId' || key === 'materialId' || key === 'anchor') continue;
        const e = ['stage', 'required', 'passMode'].includes(key) ? checkStepFieldEnum(key, val) : checkGuidanceString(val, { max: 500, field: key });
        if (e) return `${at}.value ${e}`;
      }
      if (checkGuidanceString(v.purpose, { max: 500, field: 'purpose' })) return `${at}.value purpose 需为非空 ≤500 字符串`;
      if (checkGuidanceString(v.readWhen, { max: 500, field: 'readWhen' })) return `${at}.value readWhen 需为非空 ≤500 字符串`;
      const anchor = v.anchor;
      if (!isObj(anchor)) return `${at}.value.anchor 必须给出（routeId / afterStepId 至少其一；定位插入位置）`;
      const akeys = Object.keys(anchor);
      for (const k of akeys) if (!['routeId', 'track', 'afterStepId'].includes(k)) return `${at}.value.anchor 含白名单外键 ${k}`;
      if (anchor.routeId !== undefined && !isStr(anchor.routeId)) return `${at}.value.anchor.routeId 必须是字符串`;
      if (anchor.track !== undefined && !['start', 'archive'].includes(anchor.track)) return `${at}.value.anchor.track 必须是 start|archive`;
      if (anchor.afterStepId !== undefined && !isStr(anchor.afterStepId)) return `${at}.value.anchor.afterStepId 必须是字符串`;
      if (!anchor.routeId && !anchor.afterStepId) return `${at}.value.anchor 需要 routeId（末尾追加）或 afterStepId（某现有步骤之后）`;
      if (!anchor.routeId && anchor.afterStepId) return `${at}.value.anchor.afterStepId 需同时给出 routeId`;
      return null;
    }
    if (type === 'map-node') {
      const allowed = ['side', 'label', 'summary', 'refs', 'source'];
      for (const k of Object.keys(change.value)) if (!allowed.includes(k)) return `${at}.value 含白名单外键 ${k}`;
      const v = change.value;
      for (const k of allowed) if (v[k] === undefined) return `${at}.value 缺少 ${k}`;
      if (!['problem', 'method'].includes(v.side)) return `${at}.value.side 必须是 problem|method`;
      const e = checkLabelString(v.label, 'label') || checkGuidanceString(v.summary, { max: 300, field: 'summary' });
      if (e) return `${at}.value ${e}`;
      if (!isArr(v.refs) || v.refs.length === 0) return `${at}.value.refs 必须是非空数组`;
      return checkMapSource(v.source, `${at}.value.source`);
    }
    if (type === 'map-edge') {
      const allowed = ['from', 'to', 'meaning', 'evidence', 'source'];
      for (const k of Object.keys(change.value)) if (!allowed.includes(k)) return `${at}.value 含白名单外键 ${k}`;
      const v = change.value;
      for (const k of allowed) if (v[k] === undefined) return `${at}.value 缺少 ${k}`;
      if (checkIdToken(v.from, { max: 64, field: 'from' })) return `${at}.value from 非法`;
      if (checkIdToken(v.to, { max: 64, field: 'to' })) return `${at}.value to 非法`;
      if (checkGuidanceString(v.meaning, { max: 500, field: 'meaning' })) return `${at}.value meaning 需为非空 ≤500 字符串`;
      if (!isArr(v.evidence) || v.evidence.length === 0) return `${at}.value.evidence 必须是非空数组`;
      return checkMapSource(v.source, `${at}.value.source`);
    }
    return `${at}：该目标类型不支持 insert`;
  }
  // set / append
  if (change.value === undefined) return `${at}.value 缺少`;
  if (op === 'append') {
    if (type === 'paper' || type === 'material') {
      if (field !== 'questions') return `${at}：append 仅支持 questions`;
      return checkGuidanceString(change.value, { max: 500, field: 'questions' }) ? `${at}.value 需为非空 ≤500 字符串（每次 ≤1 条）` : null;
    }
    if (type === 'direction') {
      if (field !== 'openQuestions') return `${at}：append 仅支持 openQuestions`;
      return checkGuidanceString(change.value, { max: 200, field: 'openQuestions' }) ? `${at}.value 需为非空 ≤200 字符串（每次 ≤1 条）` : null;
    }
    return `${at}：该目标类型不支持 append`;
  }
  return checkSetShape(change, at);
}

function checkMapSource(source, at) {
  if (!isObj(source)) return `${at} 必须是对象`;
  for (const k of Object.keys(source)) if (!['originType', 'note', 'asOf'].includes(k)) return `${at} 含白名单外键 ${k}`;
  if (!isSafeEnum(source.originType, MAP_ORIGIN_TYPES)) return `${at}.originType 必须是封闭枚举 content|advisor|ai|self`;
  if (checkGuidanceString(source.note, { max: 200, field: `${at}.note` })) return `${at}.note 需为非空 ≤200 字符串`;
  if (!isStrictDate(source.asOf)) return `${at}.asOf 必须是 YYYY-MM-DD`;
  return null;
}

function checkSetShape(change, at) {
  const { type, field } = change.target;
  const v = change.value;
  if (type === 'route-step') {
    if (['stage', 'required', 'passMode'].includes(field)) {
      const e = checkStepFieldEnum(field, v);
      if (e) return `${at}.value ${e}`;
      return null;
    }
    return checkGuidanceString(v, { max: 500, field }) ? `${at}.value ${field} 需为非空 ≤500 字符串` : null;
  }
  if (type === 'paper' || type === 'material') {
    if (['learner.gist', 'learner.value', 'learner.intent'].includes(field)) {
      return checkGuidanceString(v, { max: 500, field }) ? `${at}.value 需为非空 ≤500 字符串` : null;
    }
    return null; // 未知 field 已在 ② 白名单拒绝
  }
  if (type === 'map-node') {
    if (field === 'label') return checkLabelString(v, 'label') ? `${at}.value label 需为 ≤40 字名词性标签` : null;
    if (field === 'summary') return checkGuidanceString(v, { max: 300, field: 'summary' }) ? `${at}.value 需为非空 ≤300 字符串` : null;
    if (field === 'refs') {
      if (!isArr(v) || v.length === 0) return `${at}.value refs 必须是非空数组`;
      return null; // 元素解析在 ③
    }
    return null;
  }
  if (type === 'map-edge') {
    if (field === 'meaning') return checkGuidanceString(v, { max: 500, field: 'meaning' }) ? `${at}.value 需为非空 ≤500 字符串` : null;
    if (field === 'evidence') {
      if (!isArr(v) || v.length === 0) return `${at}.value evidence 必须是非空数组`;
      return null;
    }
    return null;
  }
  if (type === 'home-focus') {
    if (field === 'routeId') return checkGuidanceString(v, { max: 64, field: 'routeId' }) ? `${at}.value 需为非空字符串 id` : null;
    if (field === 'note') return checkGuidanceString(v, { max: 200, field: 'note' }) ? `${at}.value 需为非空 ≤200 字符串` : null;
    return null;
  }
  return null;
}
// ---------- validateProposal：①–④ 顺序校验（R3 定死边界；①–③ 任一失败不出预览） ----------

const NOT_APPLIED_MESSAGE = '尚未形成可应用调整：本提案未通过校验，网站没有任何内容被更改。';

function rejected(errors, extraMessage) {
  return { status: 'reject', message: NOT_APPLIED_MESSAGE, firstError: errors[0] ?? '未知原因', errors, ...(extraMessage ? { note: extraMessage } : {}) };
}

function checkOrigin(origin, errors) {
  if (!isObj(origin)) return errors.push('origin 必须是对象'), false;
  for (const k of Object.keys(origin)) if (!['sourceType', 'label', 'asOf', 'evidenceNote'].includes(k)) errors.push(`origin 含白名单外键 ${k}`);
  let bad = false;
  if (!isSafeEnum(origin.sourceType, PROPOSAL_SOURCE_TYPES)) { bad = true; errors.push(`origin.sourceType 只能是 self|advisor|ai：${origin.sourceType}`); }
  if (checkGuidanceString(origin.label, { max: 80, field: 'origin.label' })) { bad = true; errors.push('origin.label 需为非空 ≤80 字来源简述'); }
  if (!isStrictDate(origin.asOf)) { bad = true; errors.push('origin.asOf 必须是 YYYY-MM-DD（来源信息获得日期）'); }
  if (checkGuidanceString(origin.evidenceNote, { max: 300, field: 'origin.evidenceNote' })) { bad = true; errors.push('origin.evidenceNote 证据与边界必填：非空 ≤300 字'); }
  return !bad;
}

// ①＋②（结构与独立性；③④ 见 validateProposal 包装）。
function validateProposalStructural(rawText) {
  // ① JSON 解析：截断、多对象、BOM 均拒绝。
  if (!isStr(rawText) || rawText.trim() === '') return rejected(['提案文本为空（粘贴或导入后没有内容）。']);
  if (rawText.charCodeAt(0) === 0xfeff) return rejected(['文档以 BOM 开头：请先去掉 BOM 再粘贴/导入。']);
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    return rejected([`JSON 解析失败（截断、多对象拼接或非 JSON）：${e.message}`]);
  }
  const errors = [];
  // ② schema、上限、白名单与枚举、提案内独立性。
  if (!isObj(data)) errors.push('提案必须是 JSON 对象');
  if (!errors.length) {
    for (const k of Object.keys(data)) if (!['kind', 'schemaVersion', 'id', 'createdAt', 'example', 'origin', 'changes'].includes(k)) errors.push(`顶层含白名单外字段 ${k}`);
    if (data.kind !== PROPOSAL_KIND) errors.push(`kind 必须是固定字面量 ${PROPOSAL_KIND}：${data.kind}`);
    if (data.schemaVersion !== PROPOSAL_SCHEMA_VERSION) errors.push(`schemaVersion 必须为 ${PROPOSAL_SCHEMA_VERSION}：${data.schemaVersion}`);
    if (!isStr(data.id) || !PROP_ID.test(data.id)) errors.push(`id 必须匹配 ^prop-[a-z0-9.-]{1,58}$：${data.id}`);
    if (typeof data.example !== 'boolean') errors.push('example 必须是布尔值（示例提案必须显式标 true）');
    if (data.example === true && isStr(data.id) && !/(^|[-.])example([-.]|$)/.test(data.id)) errors.push('example:true 时 id 必须含 example 段（如 prop-example-…）');
    if (!isStrictDate(data.createdAt)) errors.push('createdAt 必须是 YYYY-MM-DD');
    checkOrigin(data.origin, errors);
  }
  const changes = errors.length ? null : (isArr(data.changes) ? data.changes : (errors.push('changes 必须是数组'), null));
  if (changes && (changes.length < 1 || changes.length > CHANGES_MAX)) errors.push(`changes 必须含 1–${CHANGES_MAX} 条`);
  const seenRefs = new Set();
  const insertIds = new Set();
  const removeIds = new Set();
  const parsedChanges = [];
  if (changes) {
    changes.forEach((change, i) => {
      const at = `changes[${i}]`;
      if (!isObj(change)) return errors.push(`${at} 必须是对象`);
      for (const k of Object.keys(change)) if (!['op', 'target', 'expectedBase', 'value', 'reason'].includes(k)) errors.push(`${at} 含白名单外键 ${k}`);
      const { op, target } = change;
      if (!['set', 'append', 'insert', 'remove'].includes(op)) { errors.push(`${at}.op 只能是 set|append|insert|remove：${op}`); return; }
      if (!isObj(target)) return errors.push(`${at}.target 必须是对象`);
      const tkeys = Object.keys(target);
      const needField = op === 'set' || op === 'append';
      const wantKeys = needField ? ['type', 'id', 'field'] : ['type', 'id'];
      for (const k of tkeys) if (!wantKeys.includes(k)) errors.push(`${at}.target 含不支持的键 ${k}（home-focus 不接受 stepId 等指针字段；insert/remove 不带 field）`);
      for (const k of wantKeys) if (target[k] === undefined) errors.push(`${at}.target 缺少 ${k}`);
      if (!KNOWN_TYPES.includes(target.type)) return errors.push(`${at}.target.type 不在白名单：${target.type}`);
      if (!isStr(target.id) || target.id === '' || target.id.length > 64) return errors.push(`${at}.target.id 必须是非空短字符串`);
      if (textProblem(target.id)) return errors.push(`${at}.target.id 含链接/HTML/控制字符`);
      if (target.id.includes(':')) return errors.push(`${at}.target.id 含冒号，无法寻址`);
      if (needField && (!isStr(target.field) || target.field === '')) return errors.push(`${at}.target.field 必须是非空字符串`);
      if (needField && (textProblem(target.field) || target.field.includes('<') || /__proto__|constructor|prototype/i.test(target.field))) {
        return errors.push(`${at}.target.field 含非法字符或计算键`);
      }
      if (needField && !allowedFields(target.type, op).includes(target.field)) {
        errors.push(`${at}：${target.type}.${target.field} 不在允许 ${op} 的白名单内（事实字段与未列字段一律拒绝）`);
      }
      if (!needField && op === 'insert' && !INSERT_TYPES.includes(target.type)) errors.push(`${at}：${target.type} 不支持 insert`);
      if (!needField && op === 'remove' && !REMOVE_TYPES.includes(target.type)) errors.push(`${at}：${target.type} 不支持 remove`);
      if (checkGuidanceString(change.reason, { max: 200, field: 'reason' })) errors.push(`${at}.reason 必填：非空 ≤200 字`);
      const hasEB = change.expectedBase !== undefined;
      if (['set', 'append', 'remove'].includes(op)) {
        if (!hasEB) errors.push(`${at}.expectedBase 必填（旧版依据＝应用前生效值的规范序列化）`);
        else if (!isStr(change.expectedBase) || change.expectedBase.length > EXPECTED_BASE_MAX) errors.push(`${at}.expectedBase 必须是 ≤${EXPECTED_BASE_MAX} UTF-16 码元的字符串`);
      } else if (hasEB) {
        errors.push(`${at}.expectedBase：${op} 不接受 expectedBase`);
      }
      const vErr = checkValueShape(change, at);
      if (vErr) errors.push(vErr);
      // 提案内独立性：同一 targetRef 至多一次（R3 复核阻断 1）。
      const ref = targetRef({ type: target.type, id: target.id, field: needField ? target.field : '' });
      if (seenRefs.has(ref)) errors.push(`${at}：targetRef 重复（${ref}），条目之间必须有独立性`);
      seenRefs.add(ref);
      if (op === 'insert') insertIds.add(`${target.type}:${target.id}`);
      if (op === 'remove') removeIds.add(`${target.type}:${target.id}`);
      parsedChanges.push({ index: i, change, ref });
    });
  }
  if (errors.length) return rejected(errors);
  // 独立性细则：anchor / from / to 命中本提案 insert/remove 的目标 ⇒ 结构性非法（整案拒绝）。
  for (const { index, change } of parsedChanges) {
    const at = `changes[${index}]`;
    if (change.op === 'insert' && change.target.type === 'route-step') {
      const anchor = change.value.anchor ?? {};
      const aKey = `route-step:${anchor.afterStepId}`;
      if (anchor.afterStepId && insertIds.has(aKey)) errors.push(`${at}：anchor 引用本提案另一条目将新建的步骤`);
      if (anchor.afterStepId && removeIds.has(aKey)) errors.push(`${at}：anchor 同时是本提案某 remove 的目标`);
    }
    if (change.op === 'insert' && change.target.type === 'map-edge') {
      for (const end of ['from', 'to']) {
        const eKey = `map-node:${change.value[end]}`;
        if (insertIds.has(eKey)) errors.push(`${at}：${end} 引用本提案另一条目将新建的节点`);
        if (removeIds.has(eKey)) errors.push(`${at}：${end} 是本提案某 remove 的目标`);
      }
    }
  }
  if (errors.length) return rejected(errors);
  return { structural: true, data, parsedChanges };
}
// ③ 目标可解析（对应用前生效态）＋总额上限复校；④ 逐条 stale-base 标记（永不整案拒绝）。
export function validateProposal(rawText, base, overlay = null) {
  const s = validateProposalStructural(rawText);
  if (s.status === 'reject') return s;
  const { data, parsedChanges } = s;
  const eff = computeEffective(base, overlay);
  const lib = eff.lib ?? base;
  const errors = [];
  const site = mapSiteRefIds(lib);
  const ids = allSiteIds(lib);
  const tomb = overlay?.tombstones ?? {};
  let insertNodes = 0;
  let insertEdges = 0;
  let removeNodes = 0;
  let removeEdges = 0;
  let removeSteps = 0;
  const items = [];

  for (const { index, change, ref } of parsedChanges) {
    const at = `changes[${index}]`;
    const { op, target } = change;
    const pushErr = (msg) => errors.push(`${at}：${msg}`);
    if (op === 'insert') {
      if (target.type === 'route-step') {
        if (!STEP_OV_ID.test(target.id)) pushErr(`覆盖层步骤 id 必须形如 step-ov-*：${target.id}`);
        else if (ids.has(target.id) || getStepRaw(lib, target.id)) pushErr(`insert 的 id 与站内条目冲突：${target.id}`);
        else if (tomb[target.id] !== undefined) pushErr(`insert 的 id 命中 tombstones（释放后不复用）：${target.id}`);
        const v = change.value;
        if (v.kind === 'paper' && !(lib.papers ?? []).some((p) => p.id === v.paperId)) pushErr(`paperId 不存在于站内库：${v.paperId}`);
        if (v.kind === 'article' && !(lib.materials ?? []).some((m) => m.id === v.materialId)) pushErr(`materialId 不存在于站内库：${v.materialId}`);
        const anchor = v.anchor;
        const direction = (lib.directions ?? []).find((d) => d.id === anchor.routeId);
        if (!direction) pushErr(`anchor.routeId 无法解析：${anchor.routeId}`);
        else if (anchor.afterStepId) {
          const loc = getStepRaw(lib, anchor.afterStepId);
          if (!loc) pushErr(`anchor.afterStepId 在应用前生效态不存在：${anchor.afterStepId}`);
          else if (loc.direction.id !== direction.id) pushErr('anchor.afterStepId 不属于 anchor.routeId 的方向');
          else if (loc.track !== (anchor.track ?? 'start')) pushErr(`anchor.afterStepId 不在 track=${anchor.track ?? 'start'}`);
        }
        // 步骤 insert 不影响地图总额；insertNodes/insertEdges 只在地图分支计数。
      } else if (target.type === 'map-node') {
        insertNodes += 1;
        if (!MAP_NODE_ID.test(target.id) || target.id.startsWith('map-edge-')) pushErr(`节点 id 不符合命名：${target.id}`);
        else if (ids.has(target.id)) pushErr(`insert 的 id 与站内条目冲突：${target.id}`);
        else if (tomb[target.id] !== undefined) pushErr(`insert 的 id 命中 tombstones：${target.id}`);
        const v = change.value;
        const refsErr = checkSiteIdArray(v.refs, { field: 'refs', site });
        if (refsErr) pushErr(refsErr);
        if (['advisor', 'ai'].includes(v.source?.originType) && v.side !== 'problem') pushErr('advisor/ai 节点只允许 problem 侧（R1 来源限制）');
      } else if (target.type === 'map-edge') {
        insertEdges += 1;
        if (!MAP_EDGE_ID.test(target.id)) pushErr(`边 id 须形如 map-edge-*：${target.id}`);
        else if (ids.has(target.id)) pushErr(`insert 的 id 与站内条目冲突：${target.id}`);
        else if (tomb[target.id] !== undefined) pushErr(`insert 的 id 命中 tombstones：${target.id}`);
        const v = change.value;
        const from = getMapItem(lib, 'map-node', v.from);
        const to = getMapItem(lib, 'map-node', v.to);
        if (!from) pushErr(`from 无法解析为生效态节点：${v.from}`);
        if (!to) pushErr(`to 无法解析为生效态节点：${v.to}`);
        if (from && to && from.id === to.id) pushErr('自环');
        const vocab = parseMeaningVocab(v.meaning);
        if (!vocab) pushErr('meaning 必须以固定词汇开头（addresses|variant-of|conflicts|depends-on|inspires）');
        if (vocab === 'addresses' && from && to && !(from.side === 'method' && to.side === 'problem')) pushErr('addresses 必须方法→问题');
        const evErr = checkSiteIdArray(v.evidence, { field: 'evidence', site });
        if (evErr) pushErr(evErr);
        else {
          for (const ev of v.evidence) {
            if (!R7_USABLE_2026_09_23.includes(ev)) pushErr(`evidence 未命中 R7「保留可用」条目：${ev}`);
          }
        }
        const methodToMethod = from && to && from.side === 'method' && to.side === 'method';
        if ((vocab === 'addresses' || methodToMethod) && !['content', 'self'].includes(v.source?.originType)) {
          pushErr('addresses／方法间边的来源不得是 advisor/ai（R1 来源限制）');
        }
        if (v.source?.note && !/非(论文)?引用/.test(v.source.note)) pushErr('边来源须注明编辑排定、非（论文）引用（PF-07）');
      }
    } else if (op === 'remove') {
      if (target.type === 'route-step') {
        const insertRef = `${target.type}:${target.id}:`;
        if (!STEP_OV_ID.test(target.id) || !overlay?.entries?.[insertRef]) pushErr(`remove 仅限覆盖层自有步骤：${target.id}`);
        else {
          removeSteps += 1;
          // 其它覆盖层插入步骤以它为锚点时不可删（物化确定性）。
          for (const [r, e] of Object.entries(overlay.entries)) {
            if (e?.op === 'insert' && parseRef(r).type === 'route-step' && e.value?.anchor?.afterStepId === target.id) {
              pushErr(`该步骤仍被覆盖层插入项（${parseRef(r).id}）作为锚点，不能删除`);
            }
          }
        }
      } else {
        const owned = target.type === 'map-node'
          ? (overlay?.map?.nodes ?? []).some((n) => n.id === target.id)
          : (overlay?.map?.edges ?? []).some((e) => e.id === target.id);
        if (!owned) pushErr(`基线地图内容只可 set，不可删 id；remove 仅限覆盖层自有对象：${target.id}`);
        else if (target.type === 'map-node') {
          removeNodes += 1;
          for (const e of overlay?.map?.edges ?? []) {
            if ((e.from === target.id || e.to === target.id) && !parsedChanges.some((pc) => pc.change.op === 'remove' && pc.change.target.type === 'map-edge' && pc.change.target.id === e.id)) {
              pushErr(`节点仍被覆盖层边 ${e.id} 连接，须先同案删除该边`);
            }
          }
        } else removeEdges += 1;
      }
    } else if (op === 'set' || op === 'append') {
      const value = effectiveFieldValue(base, overlay, target);
      if (value === null) pushErr(`目标在应用前生效态不存在：${target.type} ${target.id}`);
      if (op === 'set' && target.type === 'home-focus') {
        if (target.id !== 'home') pushErr('home-focus 目标 id 固定为 home');
        if (target.field === 'routeId' && !activeDirectionIds(lib).includes(change.value)) {
          pushErr(`routeId 必须解析为生效态 status=active 的方向：${change.value}`);
        }
      }
      if (op === 'set' && (target.type === 'map-node' || target.type === 'map-edge')) {
        const item = getMapItem(lib, target.type, target.id);
        if (!item) pushErr('地图目标不存在');
        else if (target.field === 'refs' || target.field === 'evidence') {
          const err = checkSiteIdArray(change.value, { field: target.field, site });
          if (err) pushErr(err);
          if (target.field === 'evidence') {
            for (const ev of change.value ?? []) {
              if (!R7_USABLE_2026_09_23.includes(ev)) pushErr(`evidence 未命中 R7「保留可用」条目：${ev}`);
            }
          }
        } else if (target.field === 'meaning') {
          // B3 修复轮：set meaning 与 insert 同规则——固定词汇开头＋端点侧别＋来源限制（改语义不得造出违例边）。
          const vocab = parseMeaningVocab(change.value);
          if (!vocab) pushErr('meaning 必须以固定词汇开头');
          else {
            const from = getMapItem(lib, 'map-node', item.from);
            const to = getMapItem(lib, 'map-node', item.to);
            if (!from || !to) pushErr('当前边端点在生效态不可解析');
            else {
              if (vocab === 'addresses' && !(from.side === 'method' && to.side === 'problem')) pushErr('改为 addresses 后端点侧别必须为方法→问题');
              const m2m = from.side === 'method' && to.side === 'method';
              if ((vocab === 'addresses' || m2m) && !['content', 'self'].includes(item.source?.originType)) pushErr('改为 addresses／方法间关系后，该边来源为 advisor/ai，违反 R1 来源限制');
            }
          }
        } else if (target.field === 'label' && checkLabelString(change.value, 'label')) {
          pushErr('label 需为 ≤40 字名词性标签');
        } else if (item[target.field] === undefined && !['refs', 'evidence'].includes(target.field)) {
          pushErr(`字段在当前生效值中不存在：${target.field}`);
        }
      }
      if (op === 'append' && (target.type === 'paper' || target.type === 'material')) {
        // questions 字段必须已存在（数组）；entry 卡缺 questions 时拒绝 append。
        const item = target.type === 'paper' ? (lib.papers ?? []).find((p) => p.id === target.id) : (lib.materials ?? []).find((m) => m.id === target.id);
        if (item && !Array.isArray(item.questions)) pushErr('questions 字段不是数组，无法 append');
      }
      if (op === 'append') {
        // C1 复核修复轮：累计 append ≤ APPEND_CUMULATIVE_MAX 在提案校验（③）阶段判定——
        // 到限后的第 51 条整案拒绝、不进预览，也永不进入写盘路径（存储与写前自检为第二道防线）。
        const prevEntry = overlay?.entries?.[ref];
        const prior = prevEntry?.op === 'append' && isArr(prevEntry.value) ? prevEntry.value.length : 0;
        if (prior + 1 > APPEND_CUMULATIVE_MAX) pushErr(`该目标的导学追加已到累计上限 ${APPEND_CUMULATIVE_MAX} 条（已生效 ${prior} 条）：整案拒绝；如需继续请先撤销/重置或走 A 包内容工作`);
      }
    }
    // ④ stale-base：仅冲突标记，永不拒绝。
    let stale = false;
    let currentBase = null;
    if (['set', 'append', 'remove'].includes(op)) {
      currentBase = canonicalBaseline(base, overlay, { type: target.type, id: target.id, field: op === 'remove' ? '' : target.field });
      stale = currentBase !== null && currentBase !== change.expectedBase;
    }
    items.push({
      index,
      ref,
      op,
      target: cloneJson(target),
      reason: change.reason,
      status: stale ? 'stale' : 'ok',
      baseCurrent: currentBase, // 三格对照之「当前生效值」（remove 时为将删对象序列化）
      proposalOld: op === 'insert' ? null : change.expectedBase ?? null,
      newValue: cloneJson(change.value),
    });
  }

  // ③ 续：总额与 tombstones 复校（按全案采纳计算；子集在确认时复校）。
  const nodesAfter = (lib.map?.nodes?.length ?? 0) + insertNodes - removeNodes;
  const edgesAfter = (lib.map?.edges?.length ?? 0) + insertEdges - removeEdges;
  if (nodesAfter > MAP_LIMITS.nodes) errors.push(`地图节点生效总额 ${nodesAfter} 将超上限 ${MAP_LIMITS.nodes}（基线＋覆盖层含示例；越限整案拒绝）`);
  if (edgesAfter > MAP_LIMITS.edges) errors.push(`地图边生效总额 ${edgesAfter} 将超上限 ${MAP_LIMITS.edges}`);
  const tombAfter = Object.keys(tomb).length + removeSteps + removeNodes + removeEdges;
  if (tombAfter > TOMBSTONE_LIMIT) errors.push(`tombstones 将达 ${tombAfter}，超上限 ${TOMBSTONE_LIMIT}：请先导出备份并重置导学覆盖层，或走 A 包内容工作`);
  if (errors.length) return rejected(errors);
  return { status: 'preview', proposal: data, items };
}
// ---------- 覆盖层存储（R5）：新键、整份 JSON 一次写入、损坏/不可用明确文案、不静默清空 ----------

export function emptyOverlay(contentVersionLabel = null) {
  return {
    version: OVERLAY_VERSION,
    seq: 0,
    base: { contentVersionLabel },
    entries: {},
    history: [],
    homeFocus: null,
    map: { nodes: [], edges: [] },
    tombstones: {},
  };
}

function validOriginObject(origin) {
  return (
    isObj(origin)
    && Object.keys(origin).every((k) => ['sourceType', 'label', 'asOf', 'evidenceNote'].includes(k))
    && isSafeEnum(origin.sourceType, PROPOSAL_SOURCE_TYPES)
    && isStr(origin.label) && origin.label.length <= 80
    && isStr(origin.asOf)
    && isStr(origin.evidenceNote) && origin.evidenceNote.length <= 300
  );
}

// ---------- B1 修复轮：存储/导入档的 entries 逐条内容校验（与提案同一白名单） ----------
// 覆盖层 entries 是生效值的唯一权威副本；导入档或手工构造的本机档不得绕开提案侧的
// 白名单/枚举/上限/文本禁面/证据名单/总额/目标可解析。任何一条不合 ⇒ 整档按 corrupt
// 处理（明确提示＋保留坏档原文供导出自查；不猜测修复、不静默清空、不部分采纳）。

const APPEND_CUMULATIVE_MAX = 50; // append 累计条数防御上限（每条提案 ≤1，跨提案累积）

function storedEntryProblem(type, id, field, entry, hasBase) {
  const { op } = entry;
  if (!isStr(id) || id === '' || id.length > 64 || id.includes(':') || textProblem(id)) return '目标 id 非法';
  if (op === 'insert') {
    if (field !== '') return 'insert 条目不得带 field';
    if (!INSERT_TYPES.includes(type)) return '该类型不支持 insert';
    if (type === 'route-step' && !STEP_OV_ID.test(id)) return '覆盖层步骤 id 须形如 step-ov-*';
    if (type === 'map-node' && (!MAP_NODE_ID.test(id) || id.startsWith('map-edge-'))) return '节点 id 命名违例';
    if (type === 'map-edge' && !MAP_EDGE_ID.test(id)) return '边 id 命名违例';
    const shapeErr = checkValueShape({ op: 'insert', target: { type, id }, value: entry.value }, 'entry');
    if (shapeErr) return shapeErr;
    if (type === 'map-node' && ['advisor', 'ai'].includes(entry.value.source?.originType) && entry.value.side !== 'problem') return 'advisor/ai 节点只允许 problem 侧';
    if (type === 'map-edge') {
      for (const ev of entry.value.evidence ?? []) if (!R7_USABLE_2026_09_23.includes(ev)) return '边 evidence 未命中 R7 保留可用名单';
    }
    return null;
  }
  if (op === 'set') {
    if (type === 'home-focus' && id !== 'home') return 'home-focus 条目 id 固定为 home';
    if (!isStr(field) || field === '' || !allowedFields(type, 'set').includes(field)) return 'field 不在白名单';
    const shapeErr = checkValueShape({ op: 'set', target: { type, id, field }, value: entry.value }, 'entry');
    if (shapeErr) return shapeErr;
    if (field === 'refs' || field === 'evidence') {
      if (new Set(entry.value).size !== entry.value.length) return 'refs/evidence 含重复条目';
      for (const el of entry.value) if (!isStr(el) || el === '' || el.length > 64 || textProblem(el)) return 'refs/evidence 元素非法';
      if (field === 'evidence') for (const el of entry.value) if (!R7_USABLE_2026_09_23.includes(el)) return '边 evidence 未命中 R7 保留可用名单';
    }
    if (type === 'map-edge' && field === 'meaning' && !parseMeaningVocab(entry.value)) return 'meaning 必须以固定词汇开头';
    return null;
  }
  // append：存储态为累计数组（应用时＝基线数组＋累计追加）
  if (type === 'home-focus' || (type !== 'paper' && type !== 'material' && type !== 'direction')) return '该类型不支持 append';
  if (!isStr(field) || field === '' || !allowedFields(type, 'append').includes(field)) return 'field 不在白名单';
  if (!isArr(entry.value) || entry.value.length === 0 || entry.value.length > APPEND_CUMULATIVE_MAX) return 'append 累计值须为 1–50 条数组';
  for (const el of entry.value) {
    const err = checkGuidanceString(el, { max: type === 'direction' ? 200 : 500, field });
    if (err) return err;
  }
  void hasBase;
  return null;
}

// 有基线时追加「对基线可解析性」校验（导入档不得指向不存在/非法目标，总额受 R1 上限）。
function overlayEntriesCoherent(base, entries) {
  const scratch = cloneJson(base);
  applyOverlayEntries(scratch, { entries });
  const nodesAfter = scratch.map?.nodes?.length ?? 0;
  const edgesAfter = scratch.map?.edges?.length ?? 0;
  if (nodesAfter > MAP_LIMITS.nodes || edgesAfter > MAP_LIMITS.edges) return false;
  const baseIds = allSiteIds(base);
  const site = mapSiteRefIds(scratch);
  const active = new Set(activeDirectionIds(scratch));
  for (const [ref, entry] of Object.entries(entries)) {
    const { type, id, field } = parseRef(ref);
    if (entry.op === 'insert') {
      // B1：insert 撞基线 id（applyOverlayEntries 对撞名会静默跳过物化）⇒ 整档按坏档处理。
      if (baseIds.has(id)) return false;
      if (type === 'route-step') {
        const found = getStepRaw(scratch, id);
        if (!found) return false;
        if (entry.value.kind === 'paper' && !(scratch.papers ?? []).some((p) => p.id === entry.value.paperId)) return false;
        if (entry.value.kind === 'article' && !(scratch.materials ?? []).some((m) => m.id === entry.value.materialId)) return false;
        for (const r of [entry.value.anchor?.routeId]) if (!scratch.directions.some((d) => d.id === r)) return false;
      } else {
        const item = getMapItem(scratch, type, id);
        if (!item) return false;
        if (type === 'map-edge') {
          const from = getMapItem(scratch, 'map-node', item.from);
          const to = getMapItem(scratch, 'map-node', item.to);
          if (!from || !to || from.id === to.id) return false;
          const vocab = parseMeaningVocab(item.meaning);
          if (!vocab) return false;
          if (vocab === 'addresses' && !(from.side === 'method' && to.side === 'problem')) return false;
          const m2m = from.side === 'method' && to.side === 'method';
          if ((vocab === 'addresses' || m2m) && !['content', 'self'].includes(item.source?.originType)) return false;
        }
        for (const r of item.refs ?? []) if (!site.has(r)) return false;
        for (const ev of item.evidence ?? []) if (!site.has(ev)) return false;
      }
      continue;
    }
    if (type === 'route-step' && !getStepRaw(scratch, id)) return false;
    if (type === 'paper' && !(scratch.papers ?? []).some((p) => p.id === id)) return false;
    if (type === 'material' && !(scratch.materials ?? []).some((m) => m.id === id)) return false;
    if (type === 'direction' && !(scratch.directions ?? []).some((d) => d.id === id)) return false;
    if (type === 'map-node' || type === 'map-edge') {
      const item = getMapItem(scratch, type, id);
      if (!item) return false;
      if (field === 'refs' || field === 'evidence') {
        for (const r of entry.value) if (!site.has(r)) return false;
      }
      if (type === 'map-edge' && field === 'meaning') {
        const from = getMapItem(scratch, 'map-node', item.from);
        const to = getMapItem(scratch, 'map-node', item.to);
        const vocab = parseMeaningVocab(entry.value);
        if (!vocab || !from || !to) return false;
        if (vocab === 'addresses' && !(from.side === 'method' && to.side === 'problem')) return false;
        const m2m = from.side === 'method' && to.side === 'method';
        if ((vocab === 'addresses' || m2m) && !['content', 'self'].includes(item.source?.originType)) return false;
      }
    }
    if (type === 'home-focus' && field === 'routeId' && !active.has(entry.value)) return false;
  }
  return true;
}

// 结构或内容不可辨认返回 null（按损坏处理；未知字段拒绝、不猜测修复、不静默清空；R5）。
// B1：传入 base 时同时校验目标可解析/证据可解析/总额上限（导入档与本机档同一门槛）。
// homeFocus 与 map 视图始终由 entries 重算（entries 是唯一权威，磁盘视图仅是持久化副本）。
export function normalizeOverlay(raw, base = null) {
  if (!isObj(raw)) return null;
  for (const k of Object.keys(raw)) {
    if (!['version', 'seq', 'base', 'entries', 'history', 'homeFocus', 'map', 'tombstones', 'undoSlot'].includes(k)) return null;
  }
  if (raw.version !== OVERLAY_VERSION) return null;
  if (!Number.isInteger(raw.seq) || raw.seq < 0) return null;
  if (!isObj(raw.base) || (raw.base.contentVersionLabel !== null && typeof raw.base.contentVersionLabel !== 'string')) return null;
  if (Object.keys(raw.base).some((k) => k !== 'contentVersionLabel')) return null;
  if (!isObj(raw.entries)) return null;
  const entries = {};
  for (const [ref, entry] of Object.entries(raw.entries)) {
    if (!isStr(ref) || ref.split(':').length !== 3) return null;
    const { type, id: entryId, field: entryField } = parseRef(ref);
    if (!KNOWN_TYPES.includes(type)) return null;
    if (!isObj(entry)) return null;
    for (const k of Object.keys(entry)) if (!['value', 'op', 'origin', 'proposalId', 'appliedAt', 'example'].includes(k)) return null;
    if (!['set', 'append', 'insert'].includes(entry.op)) return null;
    if (entry.op === 'append' && !isArr(entry.value)) return null;
    if (entry.op !== 'append' && entry.value === undefined) return null;
    if (!validOriginObject(entry.origin)) return null;
    if (!isStr(entry.proposalId) || !isStr(entry.appliedAt) || entry.appliedAt.length < 8) return null;
    if (typeof entry.example !== 'boolean') return null;
    // B1：与提案同门槛的内容校验（白名单 field/枚举/上限/文本禁面/证据名单/id 形态）。
    if (storedEntryProblem(type, entryId, entryField, entry, base != null)) return null;
    entries[ref] = cloneJson(entry);
  }
  // B1：有基线时再校验目标可解析、refs/evidence 可解析、home-focus 生效、总额上限。
  if (base != null && Object.keys(entries).length > 0 && !overlayEntriesCoherent(base, entries)) return null;
  if (!Array.isArray(raw.history) || raw.history.length > HISTORY_LIMIT) return null;
  const history = [];
  for (const h of raw.history) {
    if (!isObj(h)) return null;
    for (const k of Object.keys(h)) {
      if (!['seq', 'kind', 'proposalId', 'origin', 'appliedAt', 'summary', 'acceptedCount', 'rejectedCount', 'example'].includes(k)) return null;
    }
    if (!Number.isInteger(h.seq) || h.seq < 0) return null;
    if (!['apply', 'undo', 'import', 'reset'].includes(h.kind)) return null;
    if (h.proposalId !== null && h.proposalId !== undefined && !isStr(h.proposalId)) return null;
    if (h.origin !== undefined && h.origin !== null && !isObj(h.origin)) return null;
    if (!isStr(h.appliedAt) || !isStr(h.summary)) return null;
    if (h.acceptedCount !== undefined && !Number.isInteger(h.acceptedCount)) return null;
    if (h.rejectedCount !== undefined && !Number.isInteger(h.rejectedCount)) return null;
    if (typeof h.example !== 'boolean') return null;
    history.push(cloneJson(h));
  }
  if (!isObj(raw.tombstones)) return null;
  const tombstones = {};
  const tkeys = Object.keys(raw.tombstones);
  if (tkeys.length > TOMBSTONE_LIMIT) return null;
  for (const id of tkeys) {
    if (!isStr(raw.tombstones[id])) return null;
    // tombstones 只对覆盖层自有 id 有意义（基线步骤/基线地图 id 本就不可删）——出现其它 ⇒ 坏档。
    if (!/^(?:step-ov-|map-)/.test(id)) return null;
    tombstones[id] = raw.tombstones[id];
  }
  // B1：entries 与 tombstones 互斥一致——同名复活（insert 撞 tombstone）或
  // 只留下对已封存 id 的 set/append 条目（无 insert 宿主），都是坏档而非「可用覆盖层」。
  for (const [ref, entry] of Object.entries(entries)) {
    const { type, id } = parseRef(ref);
    if (type !== 'route-step' && type !== 'map-node' && type !== 'map-edge') continue;
    const hasInsert = isObj(entries[`${type}:${id}:`]) && entries[`${type}:${id}:`].op === 'insert';
    if (entry.op === 'insert' && tombstones[id] !== undefined) return null;
    if (!hasInsert && tombstones[id] !== undefined) return null;
  }
  let undoSlot;
  if (raw.undoSlot !== undefined) {
    if (raw.undoSlot === null || !isObj(raw.undoSlot)) return null;
    for (const k of Object.keys(raw.undoSlot)) if (!['overlayBefore', 'proposalId', 'origin', 'example'].includes(k)) return null;
    if (!overlayBeforeOk(raw.undoSlot.overlayBefore, base)) return null;
    undoSlot = cloneJson(raw.undoSlot);
  }
  const overlay = {
    version: OVERLAY_VERSION,
    seq: raw.seq,
    base: cloneJson(raw.base),
    entries,
    history,
    homeFocus: null,
    map: { nodes: [], edges: [] },
    tombstones,
    ...(undoSlot !== undefined ? { undoSlot } : {}),
  };
  recomputeOverlayViews(overlay);
  return overlay;
}

// overlayBefore 允许 null（首次 apply 前的空态）；对象则走同一校验但不递归其 undoSlot。
// C2 复核修复轮：快照校验必须带 base——撤销槽里若被塞入指向不存在/非法目标的条目，
// 结构层看不出来，undo 一旦恢复就会写出坏档；载入时即整档按 corrupt 拒绝（undo 前不可用）。
function overlayBeforeOk(raw, base = null) {
  if (raw === null || raw === undefined) return true;
  if (!isObj(raw)) return false;
  const copy = cloneJson(raw);
  delete copy.undoSlot;
  return normalizeOverlay(copy, base) !== null;
}
// 覆盖层自身视图（map 自有对象与 homeFocus）：由 entries 派生，normalize 与 apply 后统一重算。
export function recomputeOverlayViews(overlay) {
  const nodes = [];
  const edges = [];
  for (const [ref, entry] of Object.entries(overlay.entries ?? {})) {
    if (entry?.op !== 'insert') continue;
    const { type, id } = parseRef(ref);
    if (type === 'map-node') nodes.push({ id, ...cloneJson(entry.value), ...(entry.example === true ? { example: true } : {}) });
    else if (type === 'map-edge') edges.push({ id, ...cloneJson(entry.value), ...(entry.example === true ? { example: true } : {}) });
  }
  overlay.map = { nodes, edges };
  overlay.homeFocus = homeFocusFromEntries(overlay);
}

function lastAppliedAt(overlay) {
  const h = overlay?.history ?? [];
  return h.length > 0 ? String(h[h.length - 1].appliedAt) : '';
}

// 读取：empty / ok / corrupt（存在但无法辨认，保留坏档原文）/ unavailable（存储抛错）。
// B1：传入 base 时按「白名单＋可解析性＋上限」完整校验，不合法整档按 corrupt（保留原文）。
export function loadOverlay(storage, base = null) {
  if (!storage || typeof storage.getItem !== 'function') return { kind: 'unavailable', overlay: null, raw: null };
  let raw;
  try {
    raw = storage.getItem(GUIDANCE_KEY);
  } catch {
    return { kind: 'unavailable', overlay: null, raw: null };
  }
  if (raw === null || raw === undefined) return { kind: 'empty', overlay: null, raw: null };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: 'corrupt', overlay: null, raw: String(raw) };
  }
  const overlay = normalizeOverlay(parsed, base);
  if (!overlay) return { kind: 'corrupt', overlay: null, raw: String(raw) };
  return { kind: 'ok', overlay, raw };
}

// 渲染侧唯一取入口（B 包接缝在 library.js 调它）：仅有效变更时返回覆盖层，否则 null＝基线。
export function currentOverlay(storage, base = null) {
  const loaded = loadOverlay(storage, base);
  if (loaded.kind !== 'ok' || isOverlayEmpty(loaded.overlay)) return null;
  return loaded.overlay;
}

// Web Locks 可用时串行写（口径同 notes.js；整份 JSON 一次写入，成功或保持原状）；不可用退化为直接写。
async function withGuidanceLock(navigatorLike, fn) {
  if (navigatorLike?.locks?.request) {
    try {
      return await navigatorLike.locks.request(GUIDANCE_LOCK, fn);
    } catch {
      return { ok: false, reason: 'lock-failed', message: '写入锁获取失败；导学覆盖层未修改。' };
    }
  }
  return fn();
}

export function writeOverlay(storage, overlay, base = null) {
  // C1 复核修复轮：候选档必须先经 normalizeOverlay(候选, base) 完整自检、再碰 setItem——
  // 此前「先写后验」在验证失败时已把旧状态覆盖成不可辨认的档，破坏 R5「完整成功或保持原状」。
  // 候选不合 ⇒ 零写入直接失败；写入后再回读校验（带 base，且逐字节等于写入内容）。
  // （导出仅供 tests/guidance.test.mjs 直接驱动失败路径；页面只经 apply/undo/import/reset 包装调用。）
  let text;
  try {
    const candidate = normalizeOverlay(overlay, base);
    if (!candidate) return { ok: false, reason: 'write-precheck-failed', message: '待写覆盖层未通过写前完整自检：未执行任何写入，旧状态保持不变。' };
    text = JSON.stringify(candidate);
  } catch {
    return { ok: false, reason: 'write-precheck-failed', message: '待写覆盖层序列化／自检异常：未执行任何写入，旧状态保持不变。' };
  }
  try {
    storage.setItem(GUIDANCE_KEY, text);
    const back = loadOverlay(storage, base);
    if (back.kind !== 'ok' || back.raw !== text) return { ok: false, reason: 'write-verify-failed', message: '写入后回读校验未通过：存储当前不可信，请按页面提示导出自查或重置；旧状态不保证完好。' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'storage-write-failed', message: '浏览器存储写入失败（可能已满或被禁用）；导学覆盖层保持旧状态。' };
  }
}

// 构建应用后的覆盖层（纯函数，供 apply 与测试复用）。accepted: {targetRef: true}。
export function buildNextOverlay(current, proposal, accepted, previewTime, contentVersionLabel) {
  const next = current ? cloneJson(current) : emptyOverlay(contentVersionLabel ?? current?.base?.contentVersionLabel ?? null);
  next.entries = next.entries ?? {};
  next.tombstones = next.tombstones ?? {};
  const appliedAt = new Date(previewTime).toISOString();
  const origin = cloneJson(proposal.origin);
  const example = proposal.example === true;
  let acceptedCount = 0;
  let rejectedCount = 0;
  for (const change of proposal.changes) {
    const needField = change.op === 'set' || change.op === 'append';
    const ref = targetRef({ type: change.target.type, id: change.target.id, field: needField ? change.target.field : '' });
    if (!accepted[ref]) {
      rejectedCount += 1;
      continue;
    }
    acceptedCount += 1;
    const { type, id } = change.target;
    if (change.op === 'set') {
      next.entries[ref] = { op: 'set', value: cloneJson(change.value), origin: cloneJson(origin), proposalId: proposal.id, appliedAt, example };
    } else if (change.op === 'append') {
      const prev = next.entries[ref];
      const list = prev && prev.op === 'append' && isArr(prev.value) ? prev.value : [];
      next.entries[ref] = { op: 'append', value: [...list, cloneJson(change.value)], origin: cloneJson(origin), proposalId: proposal.id, appliedAt, example };
    } else if (change.op === 'insert') {
      next.entries[ref] = { op: 'insert', value: cloneJson(change.value), origin: cloneJson(origin), proposalId: proposal.id, appliedAt, example };
    } else if (change.op === 'remove') {
      const prefix = `${type}:${id}:`;
      for (const r of Object.keys(next.entries)) if (r.startsWith(prefix)) delete next.entries[r];
      next.tombstones[id] = appliedAt;
    }
  }
  next.seq = (current?.seq ?? 0) + 1;
  next.history = [...(current?.history ?? []), {
    seq: next.seq,
    kind: 'apply',
    proposalId: proposal.id,
    origin: cloneJson(origin),
    appliedAt,
    summary: `应用提案 ${proposal.id}（采纳 ${acceptedCount} 条／放弃 ${rejectedCount} 条）`,
    acceptedCount,
    rejectedCount,
    example,
  }].slice(-HISTORY_LIMIT);
  let overlayBefore = current ? cloneJson(current) : null;
  if (overlayBefore) delete overlayBefore.undoSlot; // 快照只存一份，不递归携带旧撤销槽
  next.undoSlot = { overlayBefore, proposalId: proposal.id, origin: cloneJson(origin), example };
  recomputeOverlayViews(next);
  return next;
}
// ---------- ⑤ 确认瞬间重跑 ①–④ 后原子写入（R3/R5）；撤销、重置 ----------

// opts: { storage, navigatorLike, base, proposalText, accepted, previewSnapshot, contentVersionLabel }
// accepted: {targetRef:true}；previewSnapshot: {targetRef: 预览时「当前生效值」序列化}（竞态检测）。
export async function applyProposal(opts, { now = () => Date.now() } = {}) {
  const { storage, navigatorLike, base, proposalText, accepted, previewSnapshot, contentVersionLabel } = opts;
  if (!isObj(accepted) || !isObj(previewSnapshot)) {
    return { ok: false, reason: 'bad-request', message: '缺少采纳选择或预览快照；未写入。' };
  }
  return withGuidanceLock(navigatorLike, async () => {
    const loaded = loadOverlay(storage, base);
    if (loaded.kind === 'unavailable') return { ok: false, reason: 'storage-unavailable', message: '浏览器存储不可用，导学调整无法保存；原记录未受影响。' };
    if (loaded.kind === 'corrupt') return { ok: false, reason: 'storage-corrupt', message: '导学覆盖层存储已损坏：请先在「导学调整」页导出坏档自查，再重置覆盖层。本次未写入。' };
    const current = loaded.overlay;
    // 重跑 ①–④（对当前生效态，防双标签页竞态）。
    const v = validateProposal(proposalText, base, current);
    if (v.status === 'reject') {
      return { ok: false, reason: 'revalidate-failed', message: `${NOT_APPLIED_MESSAGE}（确认时校验：${v.firstError}）` };
    }
    const byRef = Object.fromEntries(v.items.map((it) => [it.ref, it]));
    const acceptedRefs = Object.keys(accepted).filter((r) => accepted[r]);
    if (acceptedRefs.length === 0) return { ok: false, reason: 'nothing-accepted', message: '没有任何一条被显式采纳；未写入。' };
    for (const ref of acceptedRefs) {
      const it = byRef[ref];
      if (!it) return { ok: false, reason: 'unknown-ref', message: `确认项无法定位（${ref}）；请重新预览。` };
      // 竞态检测：预览到确认之间该目标生效值有变化 ⇒ 重新预览，不静默应用。
      const snapshot = ref in previewSnapshot ? previewSnapshot[ref] : '';
      const fresh = it.op === 'insert' ? '' : (it.baseCurrent ?? '');
      if (snapshot !== fresh) {
        return { ok: false, reason: 'preview-stale', message: '生效状态在预览后已变化（可能另一标签页有动作），未写入；请重新粘贴/预览该提案。' };
      }
    }
    // 子集复校：地图总额与 tombstones（任意采纳子集都不许越限）。
    const eff = computeEffective(base, current);
    let insN = 0;
    let insE = 0;
    let remN = 0;
    let remE = 0;
    let remS = 0;
    for (const ref of acceptedRefs) {
      const it = byRef[ref];
      const { type } = it.target;
      if (it.op === 'insert' && type === 'map-node') insN += 1;
      if (it.op === 'insert' && type === 'map-edge') insE += 1;
      if (it.op === 'remove' && type === 'map-node') remN += 1;
      if (it.op === 'remove' && type === 'map-edge') remE += 1;
      if (it.op === 'remove' && type === 'route-step') remS += 1;
    }
    const nodesAfter = (eff.map.nodes?.length ?? 0) + insN - remN;
    const edgesAfter = (eff.map.edges?.length ?? 0) + insE - remE;
    if (nodesAfter > MAP_LIMITS.nodes || edgesAfter > MAP_LIMITS.edges) {
      return { ok: false, reason: 'map-limit', message: `按当前采纳子集地图总额将越限（节点 ${nodesAfter}/${MAP_LIMITS.nodes}，边 ${edgesAfter}/${MAP_LIMITS.edges}）；请调整采纳项。未写入。` };
    }
    const tombAfter = Object.keys(current?.tombstones ?? {}).length + remS + remN + remE;
    if (tombAfter > TOMBSTONE_LIMIT) {
      return { ok: false, reason: 'tombstone-limit', message: `tombstones 将超上限 ${TOMBSTONE_LIMIT}：请先导出备份并重置导学覆盖层。未写入。` };
    }
    const next = buildNextOverlay(current, v.proposal, accepted, now(), contentVersionLabel ?? base?.contentVersion ?? null);
    // 物化自检：覆盖层生效值必须能被 computeEffective 无异常物化（不留坏态）。
    try {
      computeEffective(base, next);
    } catch (e) {
      return { ok: false, reason: 'materialize-failed', message: `生效物化自检失败：${e.message}；未写入。` };
    }
    const w = writeOverlay(storage, next, base);
    if (!w.ok) return w;
    return { ok: true, overlay: next };
  });
}

// 撤销最近一次导学调整＝恢复 undoSlot.overlayBefore 完整快照（多字段一次全回）＋前向写入 seq+1；
// 只回指导覆盖层，绝不触碰 v3 笔记；history 只追加不回删。
export async function undoLastApply({ storage, navigatorLike, base = null }, { now = () => Date.now() } = {}) {
  return withGuidanceLock(navigatorLike, async () => {
    const loaded = loadOverlay(storage, base);
    if (loaded.kind === 'unavailable') return { ok: false, reason: 'storage-unavailable', message: '浏览器存储不可用，无法撤销。' };
    if (loaded.kind === 'corrupt') return { ok: false, reason: 'storage-corrupt', message: '导学覆盖层存储已损坏：先导出坏档再重置；撤销未执行。' };
    const current = loaded.overlay;
    if (!canUndo(current)) {
      return { ok: false, reason: 'no-undo', message: '只能撤销最近一次导学调整（且其后没有再次撤销/重置/导入）。连续回退请走「重置导学覆盖层」。' };
    }
    const slot = current.undoSlot;
    const restored = slot.overlayBefore ? cloneJson(slot.overlayBefore) : emptyOverlay(current.base?.contentVersionLabel ?? null);
    delete restored.undoSlot;
    restored.seq = current.seq + 1; // seq 单调：撤销是新的前向写入，不回退
    const appliedAt = new Date(now()).toISOString();
    restored.history = [...(current.history ?? []), {
      seq: restored.seq,
      kind: 'undo',
      proposalId: slot.proposalId ?? null,
      origin: slot.origin ? cloneJson(slot.origin) : null,
      appliedAt,
      summary: `撤销最近一次导学调整（提案 ${slot.proposalId ?? '—'}；仅恢复指导覆盖层，本人笔记不受影响）`,
      example: slot.example === true,
    }].slice(-HISTORY_LIMIT);
    recomputeOverlayViews(restored);
    const w = writeOverlay(storage, restored, base);
    if (!w.ok) return w;
    return { ok: true, overlay: restored };
  });
}

// 重置导学覆盖层：清空 entries/map/homeFocus/undoSlot/tombstones（R5：reset 后不可再撤销，
// 导出档是唯一找回途径；先导出 JSON 再确认清空由 UI 两步执行）。
export async function resetOverlay({ storage, navigatorLike, base = null }, { now = () => Date.now() } = {}) {
  return withGuidanceLock(navigatorLike, async () => {
    const loaded = loadOverlay(storage, base);
    if (loaded.kind === 'unavailable') return { ok: false, reason: 'storage-unavailable', message: '浏览器存储不可用，无法重置。' };
    if (loaded.kind === 'corrupt') {
      // 坏档必须保留：重置前先原样导出坏档（UI 强制两步），此处仅显式拒绝普通重置。
      return { ok: false, reason: 'storage-corrupt-needs-backup', message: '存储已损坏：请先点「导出坏档原文」保存，再确认重置。本次未清空。' };
    }
    const current = loaded.overlay;
    const appliedAt = new Date(now()).toISOString();
    const next = emptyOverlay(current?.base?.contentVersionLabel ?? null);
    next.seq = (current?.seq ?? 0) + 1;
    next.history = [...(current?.history ?? []), {
      seq: next.seq,
      kind: 'reset',
      proposalId: null,
      origin: null,
      appliedAt,
      summary: '重置导学覆盖层（tombstones 与撤销槽同时清空；旧提案此后按 stale-base 进预览）',
      example: false,
    }].slice(-HISTORY_LIMIT);
    const w = writeOverlay(storage, next, base);
    if (!w.ok) return w;
    return { ok: true, overlay: next };
  });
}

// 强制重置（坏档场景的显式第二击：用户已导出坏档原文后确认）。
export async function resetCorruptOverlay({ storage, navigatorLike, base = null }, { now = () => Date.now() } = {}) {
  return withGuidanceLock(navigatorLike, async () => {
    const loaded = loadOverlay(storage, base);
    if (loaded.kind !== 'corrupt') return { ok: false, reason: 'not-corrupt', message: '当前存储不是坏档；无需强制重置。' };
    const appliedAt = new Date(now()).toISOString();
    const next = emptyOverlay(null);
    next.seq = 1;
    next.history = [{ seq: 1, kind: 'reset', proposalId: null, origin: null, appliedAt, summary: '存储损坏后重置（坏档已由本人导出原文自查）', example: false }];
    const w = writeOverlay(storage, next, base);
    if (!w.ok) return w;
    return { ok: true, overlay: next };
  });
}
// ---------- 备份导出 / 导入（R5：浏览器内文件往返；导入不默认覆盖、undoSlot 本机专用） ----------

// 导出＝覆盖层其余字段，不含 undoSlot（本机专用）。
export function exportOverlayText(overlay) {
  if (!overlay) return null;
  const copy = cloneJson(overlay);
  delete copy.undoSlot;
  return JSON.stringify(copy, null, 2);
}

// 导入解析：未知字段拒绝（含 undoSlot）；B1：传入 base 时按覆盖层完整门槛（白名单＋可解析性＋上限）校验。
// 返回 {status:'ok', overlay} 或 {status:'reject', message}。
export function parseImportedOverlay(rawText, base = null) {
  if (!isStr(rawText) || rawText.trim() === '') return { status: 'reject', message: '导入文件为空。' };
  if (rawText.charCodeAt(0) === 0xfeff) return { status: 'reject', message: '导入文件以 BOM 开头：请先去掉 BOM。' };
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    return { status: 'reject', message: `导入文件 JSON 解析失败：${e.message}` };
  }
  if (isObj(data) && data.undoSlot !== undefined) {
    return { status: 'reject', message: '导入档包含 undoSlot（本机专用字段）：按未知字段拒绝，未导入。' };
  }
  const overlay = normalizeOverlay(data, base);
  if (!overlay) return { status: 'reject', message: '导入档未通过覆盖层完整校验（未知字段/非白名单条目/值不合法、目标或证据不可解析、超上限或版本不符）：未导入。' };
  return { status: 'ok', overlay };
}

// 生效内容摘要（变更检测用，非加密安全）：entries＋tombstones 稳定序列化 + FNV-1a。
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

export function effectiveHash(overlay) {
  const text = stableStringify({ entries: overlay?.entries ?? {}, tombstones: overlay?.tombstones ?? {} });
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function displayForValue(value) {
  if (isArr(value)) return value.map((el) => canonicalString(el)).join('；');
  if (isObj(value)) return Object.entries(value).map(([k, v]) => `${k}=${isArr(v) ? v.join('；') : canonicalString(v)}`).join(' · ');
  return canonicalString(value);
}

// import 三路比较（R5）：seq＋末条 appliedAt＋生效内容 hash；全等⇒提示与本机一致、不写入。
// 否则逐 targetRef 出差异，「保持本机」或「替换」都是显式动作，不默认覆盖。
export function compareImport(base, localOverlay, incomingOverlay) {
  const localSeq = localOverlay?.seq ?? 0;
  const incomingSeq = incomingOverlay?.seq ?? 0;
  const localAt = lastAppliedAt(localOverlay);
  const incomingAt = lastAppliedAt(incomingOverlay);
  const localHash = effectiveHash(localOverlay);
  const incomingHash = effectiveHash(incomingOverlay);
  const identical = localSeq === incomingSeq && localAt === incomingAt && localHash === incomingHash;
  const diff = [];
  const refs = new Set([...Object.keys(localOverlay?.entries ?? {}), ...Object.keys(incomingOverlay?.entries ?? {})]);
  for (const ref of [...refs].sort()) {
    const l = localOverlay?.entries?.[ref];
    const r = incomingOverlay?.entries?.[ref];
    const ls = l ? displayForValue(l.value) : null;
    const rs = r ? displayForValue(r.value) : null;
    if (ls === rs && Boolean(l) === Boolean(r)) continue;
    const { type: tType, id: tId, field: tField } = parseRef(ref);
    diff.push({
      ref,
      label: targetLabel(base, localOverlay, { type: tType, id: tId }, tField || ''),
      local: ls,
      incoming: rs,
      kind: !l ? 'incoming-only' : !r ? 'local-only' : 'differ',
    });
  }
  return { identical, local: { seq: localSeq, lastAppliedAt: localAt, hash: localHash }, incoming: { seq: incomingSeq, lastAppliedAt: incomingAt, hash: incomingHash }, diff };
}

// 导入替换（显式动作）：以导入档重建覆盖层；seq 在本机原值上 +1（不采外来 seq）；
// undoSlot＝本机替换前的完整覆盖层快照（替换后仍可撤销本次）；记 kind:'import' history。
export async function importReplaceOverlay({ storage, navigatorLike, incoming, base = null }, { now = () => Date.now() } = {}) {
  return withGuidanceLock(navigatorLike, async () => {
    // B1：替换前对导入档再走一遍完整校验（即使调用方已 parse 过，也不信任陈旧引用）。
    const incomingChecked = normalizeOverlay({ ...cloneJson(incoming), undoSlot: undefined }, base);
    if (!incomingChecked) return { ok: false, reason: 'import-invalid', message: '导入档未通过导学覆盖层完整校验：替换未执行。' };
    const loaded = loadOverlay(storage, base);
    if (loaded.kind === 'unavailable') return { ok: false, reason: 'storage-unavailable', message: '浏览器存储不可用，导入未执行。' };
    if (loaded.kind === 'corrupt') return { ok: false, reason: 'storage-corrupt', message: '导学覆盖层存储已损坏：先导出坏档再重置，之后才能导入。导入未执行。' };
    const local = loaded.overlay;
    const appliedAt = new Date(now()).toISOString();
    const next = incomingChecked;
    delete next.undoSlot;
    next.seq = (local?.seq ?? 0) + 1;
    next.history = [...(local?.history ?? []), {
      seq: next.seq,
      kind: 'import',
      proposalId: null,
      origin: null,
      appliedAt,
      summary: `导入替换完成（外来 seq ${incoming.seq} 的内容以本机 seq ${next.seq} 落地；可撤销本次替换）`,
      example: false,
    }].slice(-HISTORY_LIMIT);
    let overlayBefore = local ? cloneJson(local) : null;
    if (overlayBefore) delete overlayBefore.undoSlot;
    next.undoSlot = { overlayBefore, proposalId: null, origin: null, example: false };
    recomputeOverlayViews(next);
    const w = writeOverlay(storage, next, base);
    if (!w.ok) return w;
    return { ok: true, overlay: next };
  });
}

// 提案文件导入同理（R5）：读文本→validateProposal→预览；以 expectedBase 为准，不比版本串。
export function readProposalFileText(fileLike) {
  // fileLike：浏览器 File（有 text()）或测试桩；仅取文本，不做任何解析旁路。
  if (fileLike && typeof fileLike.text === 'function') return fileLike.text();
  return Promise.reject(new Error('无法读取所选文件'));
}
