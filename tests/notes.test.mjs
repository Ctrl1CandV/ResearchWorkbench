// tests/notes.test.mjs —— v3 本人记录（public/notes.js）契约测试。
// 关键点：只读写 research-workbench:v3；v1/v2 旧键绝不被触碰；损坏/不可用有明确返回；
// 导出只含本人记录；状态是手动标记，不存在“自动已读”。

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  V3_KEY,
  addReadingItem,
  emptyV3,
  exportMarkdown,
  getPaperRecord,
  loadV3,
  normalizeV3,
  paperRecordDirty,
  removeReadingItem,
  saveV3,
  saveV3WithLock,
  setPaperNote,
  setPaperStatus,
} from '../public/notes.js';
import { LIBRARY } from '../public/library-content.js';

function recordingStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  const calls = [];
  return {
    calls,
    getItem(key) {
      calls.push(['getItem', key]);
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      calls.push(['setItem', key]);
      data.set(key, value);
    },
    removeItem(key) {
      calls.push(['removeItem', key]);
      data.delete(key);
    },
  };
}

const FIXED_NOW = '2026-09-15T12:00:00.000Z';
const now = () => FIXED_NOW;

test('只读写 v3 键：v1/v2 旧键绝不被访问', () => {
  const storage = recordingStorage({
    'research-workbench:v1': '{"legacy":1}',
    'research-workbench:v2': '{"profile":{}}',
  });
  loadV3(storage);
  saveV3(storage, emptyV3());
  const touched = new Set(storage.calls.map(([, key]) => key));
  assert.deepEqual([...touched], [V3_KEY]);
});

test('loadV3：空/正常/损坏/不可用四种返回', () => {
  assert.equal(loadV3(recordingStorage()).kind, 'empty');
  const good = recordingStorage({ [V3_KEY]: JSON.stringify(emptyV3()) });
  assert.equal(loadV3(good).kind, 'ok');
  assert.equal(loadV3(recordingStorage({ [V3_KEY]: '{bad json' })).kind, 'corrupt');
  assert.equal(loadV3(recordingStorage({ [V3_KEY]: '{"version":2}' })).kind, 'corrupt');
  const broken = {
    getItem() {
      throw new Error('denied');
    },
  };
  assert.equal(loadV3(broken).kind, 'unavailable');
});

test('normalizeV3：非法记录被丢弃，未知状态回退 unread', () => {
  const state = normalizeV3({
    version: 3,
    papers: {
      a: { status: 'done', question: 'q', note: 'n', updatedAt: 'x', extra: 'drop' },
      b: { status: 'archived' },
      c: 'garbage',
    },
    readingList: [{ id: 'r1', title: 't', url: 'https://x.com', note: '', addedAt: null }, { title: 'no id' }],
  });
  assert.equal(state.papers.a.status, 'done');
  assert.equal(state.papers.a.extra, undefined);
  assert.equal(state.papers.b.status, 'unread');
  assert.equal(state.papers.c, undefined);
  assert.equal(state.readingList.length, 1);
  assert.equal(normalizeV3(null), null);
  assert.equal(normalizeV3([]), null);
});

test('状态与笔记更新：不可变返回、updatedAt 注入、状态白名单', () => {
  let state = emptyV3();
  state = setPaperStatus(state, 'p1', 'reading', now);
  assert.equal(getPaperRecord(state, 'p1').status, 'reading');
  assert.equal(getPaperRecord(state, 'p1').updatedAt, FIXED_NOW);
  state = setPaperNote(state, 'p1', { question: '它解决了什么？', note: '先读 §3' }, now);
  assert.equal(getPaperRecord(state, 'p1').question, '它解决了什么？');
  const unchanged = setPaperStatus(state, 'p1', 'archived', now);
  assert.equal(getPaperRecord(unchanged, 'p1').status, 'reading', '非法状态必须被忽略');
  // 打开论文不等于已读：默认状态是 unread，且不存在自动迁移
  assert.equal(getPaperRecord(emptyV3(), 'p9'), null);
});

test('脏检查：与已存记录逐项比较', () => {
  const saved = { status: 'reading', question: 'q', note: 'n' };
  assert.equal(paperRecordDirty(saved, { status: 'reading', question: 'q', note: 'n' }), false);
  assert.equal(paperRecordDirty(saved, { status: 'done', question: 'q', note: 'n' }), true);
  assert.equal(paperRecordDirty(saved, { status: 'reading', question: 'q2', note: 'n' }), true);
  assert.equal(paperRecordDirty(null, { status: 'unread', question: '', note: '' }), false);
  assert.equal(paperRecordDirty(null, { status: 'reading', question: '', note: '' }), true);
});

test('待读清单：标题必填、链接必须 https、删除按 id', () => {
  const state = emptyV3();
  assert.ok(addReadingItem(state, { title: '  ', url: '', note: '' }).error);
  assert.ok(addReadingItem(state, { title: 'x', url: 'http://insecure.com', note: '' }).error);
  const ok = addReadingItem(state, { title: ' 经典论文 ', url: 'https://arxiv.org/abs/1', note: '导师推荐' }, { now, idgen: () => 'r1' });
  assert.equal(ok.error, undefined);
  assert.equal(ok.item.title, '经典论文');
  assert.equal(ok.state.readingList.length, 1);
  const after = removeReadingItem(ok.state, 'r1');
  assert.equal(after.readingList.length, 0);
});

test('导出 Markdown：只含有内容的记录与待读清单，标题从内容库解析', () => {
  let state = emptyV3();
  state = setPaperStatus(state, 'astute-rag', 'done', now);
  state = setPaperNote(state, 'astute-rag', { question: '合并机制可靠吗？', note: '' }, now);
  state = setPaperStatus(state, 'compass', 'unread', now); // 无实质内容，不导出
  const added = addReadingItem(state, { title: '外部论文', url: 'https://arxiv.org/abs/9', note: '' }, { now, idgen: () => 'r1' });
  const md = exportMarkdown(added.state, LIBRARY, now);
  assert.match(md, /Astute RAG/);
  assert.match(md, /状态：已读（本人标记）/);
  assert.match(md, /合并机制可靠吗？/);
  assert.ok(!md.includes('compass'), '空记录不导出');
  assert.match(md, /\[外部论文\]\(https:\/\/arxiv.org\/abs\/9\)/);
  assert.match(md, /本人添加、未核查/);
  assert.ok(!md.includes('D:\\'), '导出不得包含私人路径');
});

test('saveV3WithLock：无锁环境直接写；有锁环境走锁；写失败有明确原因', async () => {
  const storage = recordingStorage();
  const direct = await saveV3WithLock(undefined, storage, emptyV3());
  assert.equal(direct.ok, true);
  let lockUsed = false;
  const nav = { locks: { request: async (_name, fn) => ((lockUsed = true), fn()) } };
  const locked = await saveV3WithLock(nav, storage, emptyV3());
  assert.equal(locked.ok, true);
  assert.equal(lockUsed, true);
  const failing = { setItem() { throw new Error('full'); }, getItem: () => null };
  const failed = await saveV3WithLock(undefined, failing, emptyV3());
  assert.equal(failed.ok, false);
  assert.match(failed.reason, /写入失败/);
});
