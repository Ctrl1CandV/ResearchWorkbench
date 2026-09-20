// tests/discovery.test.mjs —— 每日发现服务测试（Crossref 固定契约）。
// 覆盖：固定查询/过滤/select 参数与 User-Agent（无 mailto）、15 分钟缓存（fetchedAt 保留、
// cached=true）、超时 12s、2MiB 超限、上游 429、无效 JSON、零结果、filteredCount、
// DOI 去重、published 原精度、摘要 JATS 清洗、每日 5 次尝试限额、上游间隔、并发合并。
// 全部使用注入的 fetchImpl/clock，不访问真实网络。

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TOPICS,
  TIMEOUT_MS,
  MAX_BODY_BYTES,
  MAX_ROWS,
  CACHE_TTL_MS,
  UPSTREAM_MIN_INTERVAL_MS,
  DAILY_ATTEMPT_LIMIT,
  USER_AGENT,
  DiscoveryError,
  utcWindow,
  cleanAbstract,
  cleanText,
  formatPublished,
  isValidDateParts,
  parseStrictIsoUtcMs,
  matchTopic,
  TOPIC_FILTER_GROUPS,
  createDiscoveryService,
} from '../discovery.mjs';

const T0 = Date.parse('2026-09-14T08:00:00.000Z'); // 周一 08:00 UTC

// 跨主题相关哨兵：同时满足 agent/rag/peft 的两组词边界规则（仅用于结构类测试）。
const SENTINEL_TITLE = 'Sentinel LoRA Low-Rank Adaptation and Retrieval-Augmented Generation for Language Model Tool Use';
const SENTINEL_ABSTRACT =
  '<jats:p>Parameter-efficient fine-tuning of language models; RAG and retrieval augmented generation; agents learn tool calling and tool use.</jats:p>';

function createClock(start = T0) {
  let current = start;
  return {
    now: () => current,
    advance(ms) {
      current += ms;
    },
    set(ms) {
      current = ms;
    },
  };
}

function okResponse(payload) {
  const body = JSON.stringify(payload);
  return {
    ok: true,
    status: 200,
    body: ReadableStream.from([new TextEncoder().encode(body)]),
  };
}

function crossrefPayload(items) {
  return { status: 'ok', 'message-type': 'work-list', message: { items } };
}

function baseItem(overrides = {}) {
  return {
    DOI: '10.5555/sentinel-0001',
    title: [SENTINEL_TITLE],
    author: [{ given: 'Ada', family: 'Sentinel' }],
    abstract: SENTINEL_ABSTRACT,
    created: { 'date-time': '2026-09-12T10:00:00.000Z', 'date-parts': [[2026, 9, 12]] },
    published: { 'date-parts': [[2026, 8, 9]] },
    'container-title': ['Journal of Sentinel Studies'],
    ...overrides,
  };
}

async function expectDiscoveryError(promise, { status, code }) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof DiscoveryError, '应抛出 DiscoveryError');
    if (status !== undefined) assert.equal(error.status, status);
    if (code !== undefined) assert.equal(error.code, code);
    assert.ok(error.message.length > 0);
    return true;
  });
}

// ---------- 纯函数 ----------

test('utcWindow：最近 7 个 UTC 日（今日-6 到今日）', () => {
  assert.deepEqual(utcWindow(T0), { from: '2026-09-08', until: '2026-09-14' });
  assert.deepEqual(utcWindow(Date.parse('2026-01-01T00:00:00.000Z')), { from: '2025-12-26', until: '2026-01-01' });
});

test('cleanAbstract：先解码实体再剥标签；缺失/空白返回 null', () => {
  assert.equal(cleanAbstract('<jats:p>Hello <jats:italic>world</jats:italic></jats:p>'), 'Hello world');
  assert.equal(cleanAbstract('A &amp; B &amp; C'), 'A & B & C', '实体解码');
  assert.equal(cleanAbstract('Line1\n                  Line2'), 'Line1 Line2', '折叠空白便于阅读');
  assert.equal(cleanAbstract(undefined), null);
  assert.equal(cleanAbstract(42), null);
  assert.equal(cleanAbstract('<jats:p>   </jats:p>'), null, '清洗后为空返回 null');
});

test('实体解码顺序：先解码再剥标签，编码标签解码后不再以 <i> 等文本显示', () => {
  assert.equal(cleanAbstract('Encoded tags &lt;i&gt;emphasis&lt;/i&gt; here'), 'Encoded tags emphasis here');
  assert.equal(cleanText('&amp;lt;script&amp;gt;'), null, '双重编码纯标签被完全清除');
  const decoded = cleanAbstract('<jats:p>A &amp; B with &lt;b&gt;bold&lt;/b&gt;</jats:p>');
  assert.equal(decoded, 'A & B with bold');
  assert.ok(!decoded.includes('<'), '结果不含角括号');
});

test('formatPublished：按原精度展示，缺失返回 null（不用 created 替代）', () => {
  assert.deepEqual(formatPublished({ 'date-parts': [[2026]] }), { text: '2026', precision: 'year' });
  assert.deepEqual(formatPublished({ 'date-parts': [[2026, 8]] }), { text: '2026-08', precision: 'year-month' });
  assert.deepEqual(formatPublished({ 'date-parts': [[2026, 8, 9]] }), { text: '2026-08-09', precision: 'year-month-day' });
  assert.equal(formatPublished(undefined), null);
  assert.equal(formatPublished({ 'date-parts': [[]] }), null);
  assert.equal(formatPublished({ 'date-parts': [['x']] }), null);
});

test('formatPublished/isValidDateParts：严格日历——2月30、13月、0日非法，闰年2月29合法', () => {
  assert.equal(formatPublished({ 'date-parts': [[2026, 2, 30]] }), null, '2月30非法');
  assert.equal(formatPublished({ 'date-parts': [[2026, 13, 1]] }), null, '13月非法');
  assert.equal(formatPublished({ 'date-parts': [[2026, 0, 5]] }), null, '0月非法');
  assert.equal(formatPublished({ 'date-parts': [[2026, 4, 31]] }), null, '4月31非法');
  assert.deepEqual(formatPublished({ 'date-parts': [[2028, 2, 29]] }), { text: '2028-02-29', precision: 'year-month-day' }, '闰年合法');
  assert.deepEqual(formatPublished({ 'date-parts': [[2026, 2, 28]] }), { text: '2026-02-28', precision: 'year-month-day' });
  assert.equal(isValidDateParts([2026, 2, 29]), false, '平年无2月29');
  assert.equal(isValidDateParts([2028, 2, 29]), true);
  assert.equal(isValidDateParts([2026]), true);
  assert.equal(isValidDateParts([2026, 9]), true);
  assert.equal(isValidDateParts([]), false);
  assert.equal(isValidDateParts([2026.5, 1, 1]), false);
});

test('parseStrictIsoUtcMs：拒绝日历归一化与非法时间，接受规范 ISO UTC', () => {
  assert.equal(parseStrictIsoUtcMs('2026-09-12T10:00:00.000Z'), Date.parse('2026-09-12T10:00:00.000Z'));
  assert.equal(parseStrictIsoUtcMs('2026-09-12T10:00:00Z'), Date.parse('2026-09-12T10:00:00.000Z'));
  assert.equal(parseStrictIsoUtcMs('2026-02-30T10:00:00.000Z'), null, '2月30被 Date.parse 归一化，必须拒绝');
  assert.equal(parseStrictIsoUtcMs('2026-02-29T10:00:00.000Z'), null, '平年2月29拒绝');
  assert.equal(parseStrictIsoUtcMs('2028-02-29T10:00:00.000Z'), Date.parse('2028-02-29T10:00:00.000Z'), '闰年接受');
  assert.equal(parseStrictIsoUtcMs('2026-09-31T10:00:00.000Z'), null, '9月31拒绝');
  assert.equal(parseStrictIsoUtcMs('2026-09-10T24:00:00.000Z'), null, '24时拒绝');
  assert.equal(parseStrictIsoUtcMs('2026-09-10T10:60:00.000Z'), null, '60分拒绝');
  assert.equal(parseStrictIsoUtcMs('2026-09-10T10:00:60.000Z'), null, '60秒拒绝');
  assert.equal(parseStrictIsoUtcMs('2026-09-10T10:00:00+08:00'), null, '非 UTC 偏移拒绝');
  assert.equal(parseStrictIsoUtcMs('2026-09-10'), null);
  assert.equal(parseStrictIsoUtcMs(undefined), null);
  assert.equal(parseStrictIsoUtcMs(42), null);
});

// ---------- 服务行为（注入 fetch/clock） ----------

test('固定契约：请求 URL 仅含固定参数，query/filter/sort/order/rows/select 与契约一致', async () => {
  const clock = createClock();
  const calls = [];
  const service = createDiscoveryService({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return okResponse(crossrefPayload([]));
    },
    now: clock.now,
  });
  await service.discover('agent');
  assert.equal(calls.length, 1);
  const { url, init } = calls[0];
  assert.ok(url.startsWith('https://api.crossref.org/works?'), '上游为 Crossref REST');
  const parsed = new URL(url);
  assert.deepEqual(
    [...parsed.searchParams.keys()],
    ['query', 'filter', 'sort', 'order', 'rows', 'select'],
    '仅固定参数，无其他字段',
  );
  assert.equal(parsed.searchParams.get('query'), 'language model tool use');
  assert.equal(parsed.searchParams.get('filter'), 'from-created-date:2026-09-08,until-created-date:2026-09-14');
  assert.equal(parsed.searchParams.get('sort'), 'created');
  assert.equal(parsed.searchParams.get('order'), 'desc');
  assert.equal(parsed.searchParams.get('rows'), String(MAX_ROWS));
  assert.equal(
    parsed.searchParams.get('select'),
    'DOI,title,author,abstract,created,published,container-title',
  );
  assert.equal(init.headers['user-agent'], USER_AGENT, '固定 User-Agent');
  assert.ok(!init.headers['user-agent'].includes('mailto'), '不伪造联系邮箱');
  assert.equal(init.headers.accept, 'application/json');
  assert.equal(Object.keys(init.headers).length, 2, '请求头仅 UA 与 Accept，不含密钥');
  assert.ok(!url.includes('profile') && !url.includes('note'), '请求不含画像/笔记');
});

test('三个主题的固定 query 与 SPEC.md 每日发现固定契约一致', async () => {
  assert.equal(TOPICS.agent.query, 'language model tool use');
  assert.equal(TOPICS.rag.query, 'retrieval augmented generation');
  assert.equal(TOPICS.peft.query, 'parameter efficient fine tuning');
  for (const topic of ['rag', 'peft']) {
    const clock = createClock();
    const calls = [];
    const service = createDiscoveryService({
      fetchImpl: async (url) => {
        calls.push(url);
        return okResponse(crossrefPayload([]));
      },
      now: clock.now,
    });
    await service.discover(topic);
    assert.equal(new URL(calls[0]).searchParams.get('query'), TOPICS[topic].query, `${topic} 固定查询`);
  }
});

test('缓存：15 分钟内第二次读取 cached=true 且不访问上游；TTL 过期后重新查询', async () => {
  const clock = createClock();
  let calls = 0;
  const service = createDiscoveryService({
    fetchImpl: async () => {
      calls += 1;
      return okResponse(crossrefPayload([baseItem()]));
    },
    now: clock.now,
  });
  const first = await service.discover('rag');
  assert.equal(first.cached, false);
  assert.equal(first.fetchedAt, '2026-09-14T08:00:00.000Z');
  assert.equal(calls, 1);

  clock.advance(CACHE_TTL_MS - 1000);
  const second = await service.discover('rag');
  assert.equal(second.cached, true, '15 分钟内命中缓存');
  assert.equal(second.fetchedAt, first.fetchedAt, '缓存保留原 fetchedAt');
  assert.equal(calls, 1, '缓存命中不访问上游');

  clock.advance(2000); // 超过 TTL
  await service.discover('rag');
  assert.equal(calls, 2, '过期后重新查询');
});

test('超时：上游 12 秒内未响应返回 504 upstream-timeout（注入短超时验证，默认常量为 12000）', async () => {
  const clock = createClock();
  const service = createDiscoveryService({
    fetchImpl: (url, init) =>
      new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('The operation was aborted')));
      }),
    now: clock.now,
    timeoutMs: 20,
  });
  const promise = service.discover('agent');
  const assertion = expectDiscoveryError(promise, { status: 504, code: 'upstream-timeout' }); // 先挂上拒绝处理器
  await new Promise((resolve) => setTimeout(resolve, 60)); // 等待真实计时器触发 abort
  await assertion;
});

test('超时常量：产品路径固定 12 秒，不接受测试注入以外的方式静默变更', () => {
  assert.equal(TIMEOUT_MS, 12000);
});

test('2MiB 超限：响应体超过上限返回 502 upstream-too-large，不解析内容', async () => {
  const clock = createClock();
  const big = new Uint8Array(MAX_BODY_BYTES + 1); // 哨兵零填充
  const service = createDiscoveryService({
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      body: ReadableStream.from([big]),
    }),
    now: clock.now,
  });
  await expectDiscoveryError(service.discover('agent'), { status: 502, code: 'upstream-too-large' });
});

test('上游 429：返回明确错误，无种子回退', async () => {
  const clock = createClock();
  const service = createDiscoveryService({
    fetchImpl: async () => ({ ok: false, status: 429, body: null }),
    now: clock.now,
  });
  await expectDiscoveryError(service.discover('agent'), { status: 502, code: 'upstream-rate-limited' });
});

test('上游其他状态与无效 JSON：均返回明确错误', async () => {
  const clock = createClock();
  let mode = 'status';
  const service = createDiscoveryService({
    fetchImpl: async () => {
      if (mode === 'status') return { ok: false, status: 500, body: null };
      return { ok: true, status: 200, body: ReadableStream.from([new TextEncoder().encode('not-json{{{')]) };
    },
    now: clock.now,
  });
  await expectDiscoveryError(service.discover('agent'), { status: 502, code: 'upstream-status' });
  clock.advance(CACHE_TTL_MS + 1000);
  mode = 'json';
  await expectDiscoveryError(service.discover('agent'), { status: 502, code: 'upstream-invalid-json' });
});

test('网络失败：返回 502 upstream-network', async () => {
  const clock = createClock();
  const service = createDiscoveryService({
    fetchImpl: async () => {
      throw new Error('ECONNREFUSED sentinel');
    },
    now: clock.now,
  });
  await expectDiscoveryError(service.discover('rag'), { status: 502, code: 'upstream-network' });
});

test('结果转换：DOI/title 必需、created 窗口校验计入 filteredCount、DOI 去重、相关条目带 matchedTerms', async () => {
  const clock = createClock();
  const items = [
    baseItem(),
    baseItem({ DOI: '10.5555/sentinel-0001', title: ['Duplicate DOI'] }), // 去重
    baseItem({ DOI: '10.5555/no-created', created: undefined }), // created 缺失
    baseItem({ DOI: '10.5555/bad-created', created: { 'date-time': 'not-a-date' } }), // created 非法
    baseItem({ DOI: '10.5555/old', created: { 'date-time': '2026-08-01T00:00:00.000Z' } }), // 窗口外
    baseItem({ DOI: '10.5555/no-title', title: [] }), // title 缺失
    baseItem({ DOI: '10.5555/in-window-2', title: ['Second language model paper about tool use by agents'] }),
  ];
  const service = createDiscoveryService({
    fetchImpl: async () => okResponse(crossrefPayload(items)),
    now: clock.now,
  });
  const result = await service.discover('agent');
  assert.equal(result.count, 2, '保留两条合法记录');
  assert.equal(result.filteredCount, 5, '丢弃与去重计入 filteredCount');
  assert.equal(result.topicFilteredCount, 0, '相关哨兵不经主题过滤');
  assert.equal(result.items[0].doi, '10.5555/sentinel-0001');
  assert.equal(result.items[0].title, SENTINEL_TITLE);
  assert.equal(result.items[0].created, '2026-09-12T10:00:00.000Z');
  assert.equal(result.items[0].published.text, '2026-08-09', 'published 原精度');
  assert.ok(result.items[0].abstract.includes('Parameter-efficient fine-tuning'));
  assert.ok(result.items[0].matchedTerms.includes('language model'), 'matchedTerms 报告命中词');
  assert.equal(result.items[0].authors, 'Ada Sentinel');
  assert.equal(result.items[0].containerTitle, 'Journal of Sentinel Studies');
  assert.equal(result.windowStart, '2026-09-08');
  assert.equal(result.windowEnd, '2026-09-14');
  assert.ok(result.registrationNote.includes('近期登记不等于近期发表'));
});

test('零结果：items 为空是合法结果并照常缓存，不报错也不回退种子', async () => {
  const clock = createClock();
  let calls = 0;
  const service = createDiscoveryService({
    fetchImpl: async () => {
      calls += 1;
      return okResponse(crossrefPayload([]));
    },
    now: clock.now,
  });
  const result = await service.discover('peft');
  assert.equal(result.count, 0);
  assert.equal(result.items.length, 0);
  assert.equal(result.cached, false);
  clock.advance(1000);
  const again = await service.discover('peft');
  assert.equal(again.cached, true, '零结果同样进入 15 分钟缓存');
  assert.equal(calls, 1);
});

test('摘要缺失：abstract 为 null，不编造补全', async () => {
  const clock = createClock();
  const service = createDiscoveryService({
    fetchImpl: async () => okResponse(crossrefPayload([baseItem({ abstract: undefined })])),
    now: clock.now,
  });
  const result = await service.discover('agent');
  assert.equal(result.items[0].abstract, null);
});

test('rows 上限：即使上游返回更多条目也最多保留 20 条（默认哨兵主题相关）', async () => {
  const clock = createClock();
  const many = [];
  for (let i = 0; i < 30; i += 1) {
    many.push(baseItem({ DOI: `10.5555/item-${i}` }));
  }
  const service = createDiscoveryService({
    fetchImpl: async () => okResponse(crossrefPayload(many)),
    now: clock.now,
  });
  const result = await service.discover('rag');
  assert.ok(result.items.length <= MAX_ROWS);
  assert.equal(result.items.length, 20);
});

test('每日限额：每主题最多 5 次真实尝试（失败也计入），超限 503 且不访问上游', async () => {
  const clock = createClock();
  let calls = 0;
  const service = createDiscoveryService({
    fetchImpl: async () => {
      calls += 1;
      throw new Error('sentinel network failure'); // 每次都失败，但计入尝试
    },
    now: clock.now,
  });
  for (let i = 0; i < DAILY_ATTEMPT_LIMIT; i += 1) {
    clock.advance(CACHE_TTL_MS + 1000); // 让缓存过期，迫使每次都真实尝试
    await expectDiscoveryError(service.discover('agent'), { status: 502, code: 'upstream-network' });
  }
  assert.equal(calls, DAILY_ATTEMPT_LIMIT);
  clock.advance(CACHE_TTL_MS + 1000);
  await expectDiscoveryError(service.discover('agent'), { status: 503, code: 'daily-limit' });
  assert.equal(calls, DAILY_ATTEMPT_LIMIT, '限额后不再访问上游');
});

test('每日限额按主题独立计数，且按 UTC 日切换重置', async () => {
  const clock = createClock();
  let calls = 0;
  const service = createDiscoveryService({
    fetchImpl: async () => {
      calls += 1;
      return okResponse(crossrefPayload([]));
    },
    now: clock.now,
  });
  for (let i = 0; i < DAILY_ATTEMPT_LIMIT; i += 1) {
    clock.advance(CACHE_TTL_MS + 1000);
    await service.discover('agent');
  }
  clock.advance(CACHE_TTL_MS + 1000);
  await expectDiscoveryError(service.discover('agent'), { status: 503, code: 'daily-limit' });
  const rag = await service.discover('rag'); // 另一主题不受 agent 计数影响
  assert.equal(rag.topic, 'rag');
  // 次日（UTC）重置：agent 可再次查询。
  clock.set(Date.parse('2026-09-15T00:30:00.000Z'));
  const nextDay = await service.discover('agent');
  assert.equal(nextDay.cached, false);
  assert.equal(nextDay.windowStart, '2026-09-09', '窗口随日期滚动');
});

test('并发合并：同主题并发请求只触发一次上游查询', async () => {
  const clock = createClock();
  let calls = 0;
  const service = createDiscoveryService({
    fetchImpl: async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return okResponse(crossrefPayload([baseItem()]));
    },
    now: clock.now,
  });
  const [a, b] = await Promise.all([service.discover('agent'), service.discover('agent')]);
  assert.equal(calls, 1, '同主题仅一次真实查询');
  assert.equal(a.fetchedAt, b.fetchedAt);
  assert.equal(a.cached, false);
  assert.equal(b.cached, false);
});

test('不同主题并发：各自独立查询，计数互不影响（全局队列 3 秒间隔由注入时钟消化）', async () => {
  const clock = createClock();
  const waits = [];
  const calls = [];
  const service = createDiscoveryService({
    fetchImpl: async (url) => {
      calls.push(url);
      return okResponse(crossrefPayload([]));
    },
    now: clock.now,
    delayImpl: async (ms) => {
      waits.push(ms);
      clock.advance(ms);
    },
  });
  await Promise.all([service.discover('agent'), service.discover('rag'), service.discover('peft')]);
  assert.equal(calls.length, 3);
  assert.equal(waits.length, 2, '后两个主题各等待一次全局间隔');
  const queries = calls.map((u) => new URL(u).searchParams.get('query'));
  assert.deepEqual(new Set(queries), new Set(['language model tool use', 'retrieval augmented generation', 'parameter efficient fine tuning']));
});

test('上游间隔：同一主题在上次真实查询 3 秒内再次查询时等待补足间隔', async () => {
  const clock = createClock();
  const waits = [];
  let fail = true;
  const service = createDiscoveryService({
    fetchImpl: async () => {
      if (fail) throw new Error('sentinel first failure'); // 失败不写缓存，便于在 3 秒内再次尝试
      return okResponse(crossrefPayload([]));
    },
    now: clock.now,
    delayImpl: async (ms) => {
      waits.push(ms);
      clock.advance(ms);
    },
  });
  await expectDiscoveryError(service.discover('agent'), { status: 502, code: 'upstream-network' }); // T0 尝试失败
  fail = false;
  clock.advance(1000); // 仅过了 1 秒（< 3 秒间隔），且无缓存
  const result = await service.discover('agent');
  assert.equal(result.cached, false);
  assert.equal(waits.length, 1, '触发一次节流等待');
  assert.ok(Math.abs(waits[0] - (UPSTREAM_MIN_INTERVAL_MS - 1000)) <= 5, `等待补足间隔，实际 ${waits[0]}ms`);
});

test('主题白名单：未知主题返回 400 invalid-topic，不发请求', async () => {
  const clock = createClock();
  let called = false;
  const service = createDiscoveryService({
    fetchImpl: async () => {
      called = true;
      return okResponse(crossrefPayload([]));
    },
    now: clock.now,
  });
  await expectDiscoveryError(service.discover('nlp'), { status: 400, code: 'invalid-topic' });
  await expectDiscoveryError(service.discover(''), { status: 400, code: 'invalid-topic' });
  assert.equal(called, false, '未知主题不触发任何网络请求');
});

// ---------- 审查修复批：全局节流 / 排队合并 / 限额原子计数 / 结构验证 / 正文停滞 ----------

test('结构验证：上游缺 message.items 数组按 502 invalid-structure，不写缓存', async () => {
  const clock = createClock();
  let calls = 0;
  let mode = 'empty-object';
  const service = createDiscoveryService({
    fetchImpl: async () => {
      calls += 1;
      if (mode === 'empty-object') return okResponse({});
      if (mode === 'no-items') return okResponse({ message: {} });
      if (mode === 'items-not-array') return okResponse({ message: { items: 'x' } });
      return okResponse(crossrefPayload([baseItem()]));
    },
    now: clock.now,
  });
  for (const m of ['empty-object', 'no-items', 'items-not-array']) {
    mode = m;
    clock.advance(CACHE_TTL_MS + 1000);
    await expectDiscoveryError(service.discover('agent'), { status: 502, code: 'upstream-invalid-structure' });
  }
  assert.equal(calls, 3, '非法结构均真实尝试');
  mode = 'valid';
  clock.advance(CACHE_TTL_MS + 1000);
  const ok = await service.discover('agent');
  assert.equal(ok.count, 1, '合法数组才可产出结果');
  clock.advance(1000); // TTL 内
  const again = await service.discover('agent');
  assert.equal(again.cached, true, '仅合法结构写缓存（此处验证正向缓存）');
  assert.equal(calls, 4, '非法结构期间缓存从未命中');
});

test('正文停滞：响应头到达后正文无数据，超时 abort 映射 504 upstream-timeout', async () => {
  const clock = createClock();
  const service = createDiscoveryService({
    fetchImpl: (url, init) => ({
      ok: true,
      status: 200,
      body: new ReadableStream({
        start(controller) {
          init.signal.addEventListener('abort', () => controller.error(new Error('aborted by timeout')), { once: true });
        },
        pull() {
          // 不产生任何数据，模拟正文停滞。
        },
      }),
    }),
    now: clock.now,
    timeoutMs: 30,
  });
  const promise = service.discover('agent');
  const assertion = expectDiscoveryError(promise, { status: 504, code: 'upstream-timeout' });
  await new Promise((resolve) => setTimeout(resolve, 80));
  await assertion;
});

test('全局节流：跨主题并发请求的实际上游开始间隔至少 3 秒', async () => {
  const clock = createClock();
  const waits = [];
  const order = [];
  const service = createDiscoveryService({
    fetchImpl: async (url) => {
      order.push(new URL(url).searchParams.get('query'));
      return okResponse(crossrefPayload([]));
    },
    now: clock.now,
    delayImpl: async (ms) => {
      waits.push(ms);
      clock.advance(ms);
    },
  });
  await Promise.all([service.discover('agent'), service.discover('rag')]);
  assert.equal(order.length, 2);
  assert.equal(waits.length, 1, '第二个主题在全局队列中等待一次');
  assert.equal(waits[0], UPSTREAM_MIN_INTERVAL_MS, '补足完整 3 秒间隔');
  await expectDiscoveryError(service.discover('nlp'), { status: 400, code: 'invalid-topic' });
});

test('排队合并：失败后同主题 6 个并发请求只触发一次上游查询（排队中 inflight 先登记）', async () => {
  const clock = createClock();
  const waits = [];
  let calls = 0;
  let fail = true;
  const service = createDiscoveryService({
    fetchImpl: async () => {
      calls += 1;
      if (fail) throw new Error('sentinel failure');
      return okResponse(crossrefPayload([]));
    },
    now: clock.now,
    delayImpl: async (ms) => {
      waits.push(ms);
      clock.advance(ms);
    },
  });
  await expectDiscoveryError(service.discover('agent'), { status: 502, code: 'upstream-network' });
  fail = false;
  clock.advance(10); // 无缓存；随后 6 个并发应全部合并到同一次排队查询（含全局 3s 等待，由注入时钟消化）
  const results = await Promise.allSettled([
    service.discover('agent'),
    service.discover('agent'),
    service.discover('agent'),
    service.discover('agent'),
    service.discover('agent'),
    service.discover('agent'),
  ]);
  assert.equal(calls, 2, '并发波次只触发一次真实查询');
  assert.equal(waits.length, 1, '波次在全局队列中等待一次 3 秒间隔');
  for (const outcome of results) {
    assert.equal(outcome.status, 'fulfilled');
    assert.equal(outcome.value.cached, false);
    assert.equal(outcome.value.fetchedAt, results[0].value.fetchedAt);
  }
});

test('限额边界：第 5 次真实尝试可用，第 6 次在实际开始点被拒（503，不计次）', async () => {
  const clock = createClock();
  let calls = 0;
  let fail = true;
  const service = createDiscoveryService({
    fetchImpl: async () => {
      calls += 1;
      if (fail) throw new Error('sentinel failure');
      return okResponse(crossrefPayload([]));
    },
    now: clock.now,
  });
  for (let i = 0; i < DAILY_ATTEMPT_LIMIT - 1; i += 1) {
    clock.advance(3100); // 失败不写缓存；同时满足全局 3 秒间隔
    await expectDiscoveryError(service.discover('agent'), { status: 502, code: 'upstream-network' });
  }
  fail = false;
  clock.advance(3100);
  const fifth = await service.discover('agent');
  assert.equal(fifth.cached, false, '第 5 次尝试成功');
  assert.equal(calls, DAILY_ATTEMPT_LIMIT);
  clock.advance(CACHE_TTL_MS + 1000);
  await expectDiscoveryError(service.discover('agent'), { status: 503, code: 'daily-limit' });
  assert.equal(calls, DAILY_ATTEMPT_LIMIT, '第 6 次不触发上游');
});

test('排队跨日：等待间隔期间跨过 UTC 日界，计数按实际开始日（次日可查）', async () => {
  const clock = createClock();
  const waits = [];
  let calls = 0;
  let fail = true;
  const service = createDiscoveryService({
    fetchImpl: async () => {
      calls += 1;
      if (fail) throw new Error('sentinel failure');
      return okResponse(crossrefPayload([]));
    },
    now: clock.now,
    delayImpl: async (ms) => {
      waits.push(ms);
      clock.advance(ms);
    },
  });
  // 今日（2026-09-14）用满 5 次。
  for (let i = 0; i < DAILY_ATTEMPT_LIMIT; i += 1) {
    clock.advance(CACHE_TTL_MS + 5000);
    await expectDiscoveryError(service.discover('agent'), { status: 502, code: 'upstream-network' });
  }
  // 23:59:58 发起另一主题真实查询，设置全局上次上游时刻。
  clock.set(Date.parse('2026-09-14T23:59:58.000Z'));
  fail = false;
  const rag = await service.discover('rag');
  assert.equal(rag.cached, false);
  // agent 已达今日上限，但排队等待 3 秒跨过日界；实际开始日为 2026-09-15，应放行。
  const nextDay = await service.discover('agent');
  assert.equal(nextDay.cached, false);
  assert.equal(nextDay.windowStart, '2026-09-09', '窗口按实际开始日滚动');
  assert.ok(waits.includes(UPSTREAM_MIN_INTERVAL_MS), '经历一次跨日界的 3 秒等待');
  assert.equal(calls, DAILY_ATTEMPT_LIMIT + 2);
});

test('created 严格日历：2月30/平年2月29/24时被丢弃并计入 filteredCount（Date.parse 归一化陷阱）', async () => {
  const clock = createClock(Date.parse('2026-03-06T08:00:00.000Z')); // 窗口 2026-02-28 ~ 2026-03-06
  const service = createDiscoveryService({
    fetchImpl: async () =>
      okResponse(
        crossrefPayload([
          baseItem({ DOI: '10.5555/feb30', created: { 'date-time': '2026-02-30T10:00:00.000Z' } }), // 归一化会落入窗口，必须拒绝
          baseItem({ DOI: '10.5555/feb29', created: { 'date-time': '2026-02-29T10:00:00.000Z' } }), // 平年
          baseItem({ DOI: '10.5555/hour24', created: { 'date-time': '2026-03-01T24:00:00.000Z' } }),
          baseItem({ DOI: '10.5555/leap-ok', created: { 'date-time': '2026-02-28T12:00:00.000Z' } }),
        ]),
      ),
    now: clock.now,
  });
  const result = await service.discover('agent');
  assert.equal(result.count, 1, '仅合法日历日期保留');
  assert.equal(result.items[0].doi, '10.5555/leap-ok');
  assert.equal(result.filteredCount, 3, '非法日历全部丢弃并计数');
});

test('published 严格日历：2月30 显示未知，不借 created 替代；闰年合法', async () => {
  const clock = createClock();
  const service = createDiscoveryService({
    fetchImpl: async () =>
      okResponse(
        crossrefPayload([
          baseItem({ DOI: '10.5555/bad-pub', published: { 'date-parts': [[2026, 2, 30]] } }),
          baseItem({ DOI: '10.5555/leap-pub', published: { 'date-parts': [[2028, 2, 29]] } }),
        ]),
      ),
    now: clock.now,
  });
  const result = await service.discover('agent');
  const bad = result.items.find((i) => i.doi === '10.5555/bad-pub');
  const leap = result.items.find((i) => i.doi === '10.5555/leap-pub');
  assert.equal(bad.published, null, '非法 published 为未知');
  assert.ok(bad.created, 'created 不被用作替代');
  assert.deepEqual(leap.published, { text: '2028-02-29', precision: 'year-month-day' });
});

// ---------- 主题相关性后置过滤（最小契约修订）：正向合成 + 误检排除 + 计数 ----------

test('matchTopic：三主题正向合成命中，两组必须同时命中（AND）', () => {
  // agent：需 (language model|LLM) 且 (agent|tool calling|tool use|tool learning)
  assert.equal(matchTopic('Tool learning with large language models', 'agent').ok, true);
  assert.equal(matchTopic('LLM agents for tool calling', 'agent').ok, true);
  assert.equal(matchTopic('language model', 'agent').ok, false, '缺第二组不相关');
  assert.equal(matchTopic('agents and tool use in industry', 'agent').ok, false, '缺第一组不相关');
  // rag：需 (retrieval augmented|retrieval-augmented|RAG) 且 (language model|generation)
  assert.equal(matchTopic('Retrieval-augmented generation for knowledge-intensive tasks', 'rag').ok, true);
  assert.equal(matchTopic('RAG improves language model answers', 'rag').ok, true);
  assert.equal(matchTopic('retrieval augmented expansion', 'rag').ok, false, 'generation 未命中');
  assert.equal(matchTopic('Image generation with diffusion', 'rag').ok, false, '缺检索组');
  // peft：需 (parameter efficient|parameter-efficient|low-rank adaptation|LoRA) 且 (model|fine tuning|fine-tuning)
  assert.equal(matchTopic('LoRA: low-rank adaptation fine-tuning of models', 'peft').ok, true);
  assert.equal(matchTopic('Parameter-efficient fine-tuning of large models', 'peft').ok, true);
  assert.equal(matchTopic('low-rank adaptation', 'peft').ok, false, '缺第二组');
  assert.equal(matchTopic('parameter efficiency in power grids', 'peft').ok, false, 'parameter efficiency 不等于 parameter efficient');
});

test('matchTopic：误检排除（medical model/裸 use）与词边界', () => {
  assert.equal(matchTopic('A medical model of dairy rats with use in clinics', 'agent').ok, false, 'medical model 不是 language model，裸 use 不是 tool use');
  assert.equal(matchTopic('Agricultural model system use of bioinputs on tomatoes', 'agent').ok, false);
  assert.equal(matchTopic('Floralora flower study with models', 'peft').ok, false, 'LoRA 词边界：lora 内嵌不命中');
  assert.equal(matchTopic('The lora technique', 'peft').ok, false, '小写 lora 不按 LoRA 缩写计（词边界+缩写形态）');
  const hit = matchTopic('LLM agents for tool calling', 'agent');
  assert.deepEqual(hit.terms, ['LLM', 'agent', 'tool calling'], 'terms 按规则顺序去重');
  assert.ok(!matchTopic('A medical model', 'agent').terms.includes('language model'));
});

test('TOPIC_FILTER_GROUPS：三主题各两组规则存在且为正则', () => {
  for (const topic of ['agent', 'rag', 'peft']) {
    assert.equal(TOPIC_FILTER_GROUPS[topic].length, 2, `${topic} 两组 AND 规则`);
    for (const group of TOPIC_FILTER_GROUPS[topic]) {
      assert.ok(group.length >= 2, `${topic} 每组至少两个候选词`);
      for (const [, regex] of group) assert.ok(regex instanceof RegExp);
    }
  }
});

test('主题后置过滤：无关候选计入 topicFilteredCount 不进结果；相关条目带 matchedTerms 与说明', async () => {
  const clock = createClock();
  const service = createDiscoveryService({
    fetchImpl: async () =>
      okResponse(
        crossrefPayload([
          baseItem(), // 相关（哨兵）
          baseItem({
            DOI: '10.5555/obstetric',
            title: ['Tomato bioinputs and dairy rats: a medical model system use'],
            abstract: 'Agricultural model with use of bioinputs on crops.',
          }), // agent 主题无关
          baseItem({ DOI: '10.5555/rag-only', title: ['RAG survey'], abstract: 'Retrieval augmented generation' }), // 缺 language model 组 → agent 主题无关
        ]),
      ),
    now: clock.now,
  });
  const result = await service.discover('agent');
  assert.equal(result.count, 1, '仅相关哨兵保留');
  assert.equal(result.topicFilteredCount, 2, '无关候选单独计数');
  assert.equal(result.filteredCount, 0, '结构过滤与主题过滤分列');
  assert.equal(result.items[0].doi, '10.5555/sentinel-0001');
  assert.ok(Array.isArray(result.items[0].matchedTerms) && result.items[0].matchedTerms.length >= 2);
  assert.ok(result.topicFilterNote.includes('不是穷尽检索'), '说明为候选内筛选非穷尽');
  assert.ok(result.topicFilterNote.includes('0 条不代表该方向没有相关研究'));
});

test('主题后置过滤：全部候选无关时返回零条合法结果并照常缓存', async () => {
  const clock = createClock();
  let calls = 0;
  const service = createDiscoveryService({
    fetchImpl: async () => {
      calls += 1;
      return okResponse(
        crossrefPayload([
          baseItem({ DOI: '10.5555/med-1', title: ['A medical model of rats'], abstract: 'clinic use' }),
          baseItem({ DOI: '10.5555/med-2', title: ['Another agricultural model use study'], abstract: 'crops' }),
        ]),
      );
    },
    now: clock.now,
  });
  const result = await service.discover('agent');
  assert.equal(result.count, 0);
  assert.equal(result.topicFilteredCount, 2);
  assert.equal(result.cached, false);
  clock.advance(1000); // TTL 内
  const again = await service.discover('agent');
  assert.equal(again.cached, true, '零相关同样进入 15 分钟缓存');
  assert.equal(calls, 1);
});

test('候选截断：仅前 20 条候选参与过滤——前 20 无关、第 21 条相关也不收不计', async () => {
  const clock = createClock();
  const items = [];
  for (let i = 0; i < MAX_ROWS; i += 1) {
    items.push(baseItem({ DOI: `10.5555/med-${i}`, title: ['A medical model of rats'], abstract: 'clinic use' }));
  }
  items.push(baseItem({ DOI: '10.5555/relevant-21' })); // 第 21 条：相关，但不在 20 候选内
  const service = createDiscoveryService({
    fetchImpl: async () => okResponse(crossrefPayload(items)),
    now: clock.now,
  });
  const result = await service.discover('agent');
  assert.equal(result.count, 0, '候选外条目不收');
  assert.equal(result.topicFilteredCount, 20, '仅前 20 条计入主题过滤数');
  assert.equal(result.filteredCount, 0);
});

test('实体解码顺序（集成）：摘要含编码标签 <i> 不再以文本显示，且相关性判定用清洗后文本', async () => {
  const clock = createClock();
  const service = createDiscoveryService({
    fetchImpl: async () =>
      okResponse(
        crossrefPayload([
          baseItem({
            abstract:
              '<jats:p>Text with &lt;i&gt;emphasis&lt;/i&gt; and &amp;lt;script&amp;gt; markers; language model agents for tool use.</jats:p>',
          }),
        ]),
      ),
    now: clock.now,
  });
  const result = await service.discover('agent');
  assert.equal(result.count, 1, '清洗后文本仍可判定主题相关');
  const abstractText = result.items[0].abstract;
  assert.ok(abstractText.includes('emphasis'));
  assert.ok(!abstractText.includes('<'), '解码后的编码标签被剥离，不以 <i> 形式显示');
  assert.ok(!abstractText.includes('&lt;'));
});
