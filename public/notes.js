// public/notes.js —— 本人阅读记录（v3）。PLAN-005 阶段1。
// 契约：
// - 只读写 localStorage 键 'research-workbench:v3'；绝不读取或写入 v1/v2（旧版记录保持原样，
//   旧页面在退役前仍可见）；不做任何数据迁移。
// - 状态是本人手动标记（未读/在读/已读），打开论文或外链不改变任何状态；
//   页面不得据此显示进度百分比、连续天数或“自动已读”。
// - 显式保存：编辑只改草稿，点“保存”才写入；Web Locks 可用时串行写；
//   存储不可用/数据损坏都有明确文案，不静默失败。
// - 待读清单是本人添加的条目，一律标注“本人添加、未核查”，不混入公开内容库。
// - 导出 Markdown 是唯一的备份手段（换浏览器/清数据即丢失）；导出只含本人记录，不含私人路径。

export const V3_KEY = 'research-workbench:v3';
export const V3_VERSION = 3;

export const V3_STATUS = Object.freeze(['unread', 'reading', 'done']);
export const V3_STATUS_LABELS = Object.freeze({
  unread: '未读',
  reading: '在读',
  done: '已读',
});

export function emptyV3() {
  return { version: V3_VERSION, papers: {}, readingList: [] };
}

function isStr(v) {
  return typeof v === 'string';
}

// 规范化一条论文记录；非法字段丢弃，整体非法返回 null。
function normalizePaperRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const status = V3_STATUS.includes(raw.status) ? raw.status : 'unread';
  return {
    status,
    question: isStr(raw.question) ? raw.question : '',
    note: isStr(raw.note) ? raw.note : '',
    updatedAt: isStr(raw.updatedAt) ? raw.updatedAt : null,
  };
}

function normalizeReadingItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!isStr(raw.id) || raw.id.trim() === '') return null;
  if (!isStr(raw.title) || raw.title.trim() === '') return null;
  return {
    id: raw.id,
    title: raw.title,
    url: isStr(raw.url) ? raw.url : '',
    note: isStr(raw.note) ? raw.note : '',
    addedAt: isStr(raw.addedAt) ? raw.addedAt : null,
  };
}

// 规范化整份状态；结构不可辨认返回 null（按损坏处理，不用猜测修复）。
export function normalizeV3(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (raw.version !== V3_VERSION) return null;
  const state = emptyV3();
  if (raw.papers != null) {
    if (typeof raw.papers !== 'object' || Array.isArray(raw.papers)) return null;
    for (const [paperId, rec] of Object.entries(raw.papers)) {
      const normalized = normalizePaperRecord(rec);
      if (normalized) state.papers[paperId] = normalized;
    }
  }
  if (raw.readingList != null) {
    if (!Array.isArray(raw.readingList)) return null;
    for (const item of raw.readingList) {
      const normalized = normalizeReadingItem(item);
      if (normalized) state.readingList.push(normalized);
    }
  }
  return state;
}

// 读取：unavailable（存储抛错）/ corrupt（存在但无法辨认）/ empty（没有记录）/ ok。
export function loadV3(storage) {
  let raw;
  try {
    raw = storage.getItem(V3_KEY);
  } catch {
    return { kind: 'unavailable', state: null };
  }
  if (raw === null || raw === undefined) return { kind: 'empty', state: emptyV3() };
  try {
    const parsed = JSON.parse(raw);
    const state = normalizeV3(parsed);
    if (!state) return { kind: 'corrupt', state: null };
    return { kind: 'ok', state };
  } catch {
    return { kind: 'corrupt', state: null };
  }
}

// 写入：只写 V3_KEY。失败返回明确原因，不静默。
export function saveV3(storage, state) {
  const normalized = normalizeV3(state);
  if (!normalized) return { ok: false, reason: '状态数据未通过自检，未写入。' };
  try {
    storage.setItem(V3_KEY, JSON.stringify(normalized));
    return { ok: true };
  } catch {
    return { ok: false, reason: '浏览器存储写入失败（可能已满或被禁用）；修改未保存。' };
  }
}

// Web Locks 可用时串行写（多标签页不交错）；不可用退化为直接写。
export function saveV3WithLock(navigatorLike, storage, state) {
  const run = () => Promise.resolve(saveV3(storage, state));
  if (navigatorLike?.locks?.request) {
    return navigatorLike.locks.request('research-workbench-v3-write', run).catch(() => ({
      ok: false,
      reason: '写入锁获取失败；修改未保存。',
    }));
  }
  return run();
}

export function getPaperRecord(state, paperId) {
  return state?.papers?.[paperId] ?? null;
}

// 以下更新函数都返回新对象（不原地修改），便于做脏检查与重渲染。
export function setPaperStatus(state, paperId, status, now = () => new Date().toISOString()) {
  if (!V3_STATUS.includes(status)) return state;
  const next = { ...state, papers: { ...state.papers } };
  const prev = next.papers[paperId] ?? { status: 'unread', question: '', note: '', updatedAt: null };
  next.papers[paperId] = { ...prev, status, updatedAt: now() };
  return next;
}

export function setPaperNote(state, paperId, { question, note }, now = () => new Date().toISOString()) {
  const next = { ...state, papers: { ...state.papers } };
  const prev = next.papers[paperId] ?? { status: 'unread', question: '', note: '', updatedAt: null };
  next.papers[paperId] = {
    ...prev,
    question: typeof question === 'string' ? question : prev.question,
    note: typeof note === 'string' ? note : prev.note,
    updatedAt: now(),
  };
  return next;
}

export function paperRecordDirty(savedRecord, draft) {
  const saved = savedRecord ?? { status: 'unread', question: '', note: '' };
  return (
    saved.status !== draft.status ||
    (saved.question ?? '') !== (draft.question ?? '') ||
    (saved.note ?? '') !== (draft.note ?? '')
  );
}

// 待读清单：标题必填；链接可空，非空必须 https。
export function addReadingItem(state, { title, url, note }, { now = () => new Date().toISOString(), idgen } = {}) {
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  if (cleanTitle === '') return { error: '标题不能为空。' };
  const cleanUrl = typeof url === 'string' ? url.trim() : '';
  if (cleanUrl !== '' && !/^https:\/\/[^/?#]+/i.test(cleanUrl)) {
    return { error: '链接必须是 https（也可以留空）。' };
  }
  const id =
    typeof idgen === 'function'
      ? idgen()
      : `r${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  const item = {
    id,
    title: cleanTitle,
    url: cleanUrl,
    note: typeof note === 'string' ? note.trim() : '',
    addedAt: now(),
  };
  return { state: { ...state, readingList: [...state.readingList, item] }, item };
}

export function removeReadingItem(state, itemId) {
  return { ...state, readingList: state.readingList.filter((item) => item.id !== itemId) };
}

// Markdown 导出：只含本人记录。论文标题从内容库解析（解析不到就只写 id）。
export function exportMarkdown(state, lib, now = () => new Date().toISOString()) {
  const lines = [];
  lines.push('# 我的阅读记录（ResearchWorkbench v3 导出）');
  lines.push('');
  lines.push(`- 导出时间：${now()}`);
  lines.push('- 说明：状态与笔记是本人手动标记与书写，不代表任何自动统计；待读清单为本人添加、未核查的条目。');
  lines.push('');
  lines.push('## 论文状态与笔记');
  const entries = Object.entries(state.papers).filter(
    ([, rec]) => rec.status !== 'unread' || rec.question.trim() !== '' || rec.note.trim() !== '',
  );
  if (entries.length === 0) lines.push('', '（暂无）');
  for (const [paperId, rec] of entries) {
    const paper = lib?.papers?.find((p) => p.id === paperId);
    const title = paper ? paper.displayTitle || paper.title : paperId;
    lines.push('', `### ${title}`);
    lines.push(`- 状态：${V3_STATUS_LABELS[rec.status] ?? rec.status}（本人标记）`);
    if (rec.updatedAt) lines.push(`- 更新时间：${rec.updatedAt}`);
    if (rec.question.trim() !== '') lines.push(`- 我的问题：${rec.question.trim()}`);
    if (rec.note.trim() !== '') lines.push(`- 我的笔记：${rec.note.trim()}`);
  }
  lines.push('', '## 待读清单（本人添加、未核查）');
  if (state.readingList.length === 0) lines.push('', '（暂无）');
  for (const item of state.readingList) {
    const head = item.url ? `[${item.title}](${item.url})` : item.title;
    const tail = [item.note || null, item.addedAt ? `添加于 ${item.addedAt.slice(0, 10)}` : null]
      .filter(Boolean)
      .join('；');
    lines.push(`- ${head}${tail ? ` —— ${tail}` : ''}`);
  }
  lines.push('');
  return lines.join('\n');
}
