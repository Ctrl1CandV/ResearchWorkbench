// discovery.mjs —— 每日发现：Crossref 近期登记查询服务。
// 契约来源：docs/CONTENT-002.md「每日发现固定契约」、docs/DESIGN-002.md「每日发现」。
// - 仅允许三个固定公开主题，query 固定，无用户自由文本，不接受任意 URL；
// - 最近 7 个 UTC 日登记（from-created-date = 今日-6 天，until-created-date = 今日），
//   sort=created&order=desc&rows=20&select=DOI,title,author,abstract,created,published,container-title；
// - 真实拉取：超时 12s、响应 2MiB 上限、429/无效 JSON/非法结构/网络失败均为明确错误，无种子回退；
// - 缓存 15 分钟（保留原 fetchedAt，cached=true）；同主题并发合并（含排队中请求）；
//   服务级共享队列保证全局上游开始间隔至少 3 秒（跨主题同样适用）；
// - 每主题每天最多 5 次真实尝试（成功或失败均计入）：在实际开始上游时刻按当前 UTC 日
//   原子计数与限额判断，超限返回每日限额错误（不计次、不访问上游）；
// - created.date-time 必须通过严格日历+时间校验（拒绝 2 月 30 等归一化）且在窗口内，
//   缺失/非法丢弃并计入 filteredCount；DOI 与 title 必需，DOI 去重；abstract 缺失为 null
//   不编造；published 仅按原精度展示并同样做日历校验，非法显示未知，不用 created 替代；
// - 上游响应必须是 { message: { items: [...] } } 结构，非法结构按错误处理且不写缓存；
// - 不注入服务密钥、不转发个人内容；请求头 User-Agent 固定，不伪造联系邮箱。
// 注：每日尝试计数保存在本服务进程内存中；服务重启后计数归零（本地单用户服务的实现边界）。

const UPSTREAM_BASE = 'https://api.crossref.org/works';
const SELECT_FIELDS = 'DOI,title,author,abstract,created,published,container-title';

export const TOPICS = Object.freeze({
  agent: Object.freeze({ id: 'agent', query: 'language model tool use' }),
  rag: Object.freeze({ id: 'rag', query: 'retrieval augmented generation' }),
  peft: Object.freeze({ id: 'peft', query: 'parameter efficient fine tuning' }),
});

export const TIMEOUT_MS = 12000;
export const MAX_BODY_BYTES = 2 * 1024 * 1024;
export const MAX_ROWS = 20;
export const CACHE_TTL_MS = 15 * 60 * 1000;
export const UPSTREAM_MIN_INTERVAL_MS = 3000;
export const DAILY_ATTEMPT_LIMIT = 5;
export const USER_AGENT = 'ResearchWorkbench/0.2 (local research reader)';

export class DiscoveryError extends Error {
  constructor({ status, code, message, cause } = {}) {
    super(message ?? '发现查询失败');
    this.name = 'DiscoveryError';
    this.status = status ?? 500;
    this.code = code ?? 'discover-failed';
    if (cause !== undefined) this.cause = cause;
  }
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function utcDateString(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

// 最近 7 个 UTC 日窗口：from = 今日（UTC）-6 天，until = 今日（UTC）。
export function utcWindow(nowMs) {
  const until = utcDateString(nowMs);
  const from = utcDateString(nowMs - 6 * 24 * 60 * 60 * 1000);
  return { from, until };
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year, month) {
  const table = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return table[month - 1];
}

// 严格日历校验的日期部分：用于 published.date-parts。
export function isValidDateParts(parts) {
  if (!Array.isArray(parts) || parts.length < 1) return false;
  const [y, m, d] = parts;
  if (!Number.isInteger(y) || y < 1) return false;
  if (parts.length < 2) return true; // 仅年
  if (!Number.isInteger(m) || m < 1 || m > 12) return false;
  if (parts.length < 3) return true; // 年-月
  if (!Number.isInteger(d) || d < 1 || d > daysInMonth(y, m)) return false;
  return true;
}

// 严格 ISO UTC 时间戳：拒绝 Date.parse 的日历归一化（如 2 月 30 日、24 时等）。
// 接受 YYYY-MM-DDTHH:MM:SS[.mmm]Z；返回毫秒数或 null。
const ISO_DATETIME_UTC = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?Z$/;

export function parseStrictIsoUtcMs(value) {
  if (typeof value !== 'string') return null;
  const match = ISO_DATETIME_UTC.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  if (hour > 23 || minute > 59 || second > 59) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

// 文本清洗：先解码 HTML 实体再剥离 JATS/HTML 标签（循环至稳定，防 &lt;i&gt; 等编码标签
// 解码后以文本形式显示），折叠空白；仅用于展示文本与主题相关性判定，
// 客户端仍以 textContent 渲染，不执行 HTML。
function decodeEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&(?:apos|#39);/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

export function cleanText(raw) {
  if (typeof raw !== 'string') return null;
  let text = raw;
  let previous = null;
  for (let round = 0; round < 3 && text !== previous; round += 1) {
    previous = text;
    text = decodeEntities(text).replace(/<[^>]*>/g, ' ');
  }
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : null;
}

// 摘要清洗：同 cleanText；空/缺失返回 null，不编造补全。
export function cleanAbstract(raw) {
  return cleanText(raw);
}

// 主题相关性后置过滤（最小契约修订）：Crossref query+sort=created 为广泛 OR 匹配，
// 必须对返回的 ≤20 条候选按「标题+清洗摘要」做主题判定后才可交付。
// 每主题两组关键词（AND），词边界、大小写不敏感；短语形式天然排除 medical model、裸 use 等误检。
export const TOPIC_FILTER_GROUPS = Object.freeze({
  agent: Object.freeze([
    Object.freeze([
      ['language model', /\blanguage models?\b/i],
      ['LLM', /\bLLMs?\b/i],
    ]),
    Object.freeze([
      ['agent', /\bagents?\b/i],
      ['tool calling', /\btool[- ]calling\b/i],
      ['tool use', /\btool[- ]use\b/i],
      ['tool learning', /\btool[- ]learning\b/i],
    ]),
  ]),
  rag: Object.freeze([
    Object.freeze([
      ['retrieval augmented', /\bretrieval[- ]augmented\b/i],
      ['RAG', /\bRAG\b/i],
    ]),
    Object.freeze([
      ['language model', /\blanguage models?\b/i],
      ['generation', /\bgeneration\b/i],
    ]),
  ]),
  peft: Object.freeze([
    Object.freeze([
      ['parameter efficient', /\bparameter[- ]efficient\b/i],
      ['low-rank adaptation', /\blow[- ]rank adaptations?\b/i],
      ['LoRA', /\bLoRA\b/i],
    ]),
    Object.freeze([
      ['model', /\bmodels?\b/i],
      ['fine tuning', /\bfine[- ]tunings?\b/i],
    ]),
  ]),
});

// 判定文本是否主题相关：每组至少命中一个词即该组通过，两组都通过才相关。
// 返回 { ok, terms }：terms 为命中词标签（按规则顺序去重）。
export function matchTopic(text, topic) {
  const groups = TOPIC_FILTER_GROUPS[topic];
  if (!groups) return { ok: false, terms: [] };
  const terms = [];
  for (const group of groups) {
    let groupHit = false;
    for (const [label, regex] of group) {
      if (regex.test(text)) {
        groupHit = true;
        if (!terms.includes(label)) terms.push(label);
      }
    }
    if (!groupHit) return { ok: false, terms };
  }
  return { ok: true, terms };
}

// published 仅按原精度展示：年 / 年-月 / 年-月-日；缺失或非法返回 null，不用 created 替代。
export function formatPublished(published) {
  const parts = published && Array.isArray(published['date-parts']) ? published['date-parts'][0] : null;
  if (!parts || !isValidDateParts(parts)) return null;
  const [y, m, d] = parts;
  if (parts.length < 2) return { text: `${y}`, precision: 'year' };
  if (parts.length < 3) return { text: `${y}-${pad2(m)}`, precision: 'year-month' };
  return { text: `${y}-${pad2(m)}-${pad2(d)}`, precision: 'year-month-day' };
}

function pickFirstString(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string' && item.trim().length > 0) return item.trim();
    }
    return null;
  }
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  return null;
}

function formatAuthors(author) {
  if (!Array.isArray(author)) return null;
  const names = [];
  for (const entry of author) {
    if (!entry || typeof entry !== 'object') continue;
    if (typeof entry.name === 'string' && entry.name.trim()) {
      names.push(entry.name.trim());
      continue;
    }
    const family = typeof entry.family === 'string' ? entry.family.trim() : '';
    const given = typeof entry.given === 'string' ? entry.given.trim() : '';
    const full = [given, family].filter(Boolean).join(' ');
    if (full) names.push(full);
  }
  return names.length > 0 ? names.join(', ') : null;
}

function transform(def, data, { from, until, fetchedAt }) {
  const rawItems = data.message.items;
  // 仅 Crossref 返回的前 20 条候选参与后续过滤；第 21 条起不收、不计入任何过滤数。
  const candidates = rawItems.slice(0, MAX_ROWS);
  const items = [];
  const seenDois = new Set();
  let filteredCount = 0;
  let topicFilteredCount = 0;
  for (const item of candidates) {
    const doi = typeof item?.DOI === 'string' ? item.DOI.trim() : '';
    const title = pickFirstString(item?.title);
    if (!doi || !title) {
      filteredCount += 1;
      continue;
    }
    const doiKey = doi.toLowerCase();
    if (seenDois.has(doiKey)) {
      filteredCount += 1; // DOI 去重
      continue;
    }
    const createdMs = parseStrictIsoUtcMs(item?.created?.['date-time']);
    if (createdMs === null) {
      filteredCount += 1; // created 缺失/非法（含日历归一化拒绝）
      continue;
    }
    const createdIso = new Date(createdMs).toISOString();
    const createdDate = createdIso.slice(0, 10);
    if (createdDate < from || createdDate > until) {
      filteredCount += 1; // created 不在窗口
      continue;
    }
    seenDois.add(doiKey);
    const cleanTitle = cleanText(title) ?? title;
    const cleanAbstractText = cleanAbstract(item.abstract);
    const relevance = matchTopic(`${cleanTitle} ${cleanAbstractText ?? ''}`, def.id);
    if (!relevance.ok) {
      topicFilteredCount += 1; // 主题无关：query+sort 为广泛 OR 匹配的后置筛选
      continue;
    }
    items.push({
      doi,
      title: cleanTitle,
      authors: formatAuthors(item.author),
      containerTitle: cleanText(pickFirstString(item['container-title'])),
      created: createdIso,
      published: formatPublished(item.published),
      abstract: cleanAbstractText,
      matchedTerms: relevance.terms,
    });
  }
  return {
    topic: def.id,
    query: def.query,
    source: 'Crossref REST (api.crossref.org/works)',
    fetchedAt,
    windowStart: from,
    windowEnd: until,
    registrationNote: '按最近 7 个 UTC 日在 Crossref 登记（收录）的记录筛选；近期登记不等于近期发表。',
    topicFilterNote:
      '以上结果是在 Crossref 返回的前 20 条近期登记候选内按主题相关性（标题+摘要）后置筛选的，不是穷尽检索；0 条不代表该方向没有相关研究。',
    count: items.length,
    filteredCount,
    topicFilteredCount,
    items,
  };
}

async function readBodyWithCap(response, controller) {
  const tooLargeError = () =>
    new DiscoveryError({
      status: 502,
      code: 'upstream-too-large',
      message: `Crossref 响应超过 ${Math.floor(MAX_BODY_BYTES / (1024 * 1024))}MiB 上限，已中止读取；今日已计入一次真实尝试。`,
    });
  const timeoutError = (cause) =>
    new DiscoveryError({
      status: 504,
      code: 'upstream-timeout',
      message: `Crossref 响应停滞，已按超时中止读取。今日已计入一次真实尝试；未获取到数据，不会用种子冒充结果。`,
      cause,
    });
  const networkError = (cause) =>
    new DiscoveryError({
      status: 502,
      code: 'upstream-network',
      message: '读取 Crossref 响应失败；今日已计入一次真实尝试，未获取到数据。',
      cause,
    });
  if (!response.body) {
    let buf;
    try {
      buf = await response.arrayBuffer();
    } catch (error) {
      throw controller.signal.aborted ? timeoutError(error) : networkError(error);
    }
    if (buf.byteLength > MAX_BODY_BYTES) {
      controller.abort();
      throw tooLargeError();
    }
    return Buffer.from(buf);
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    let read;
    try {
      read = await reader.read();
    } catch (error) {
      // 计时器触发的 abort（响应头之后正文停滞）按超时处理；体积超限走独立分支。
      throw controller.signal.aborted ? timeoutError(error) : networkError(error);
    }
    if (read.done) break;
    total += read.value.byteLength;
    if (total > MAX_BODY_BYTES) {
      controller.abort();
      throw tooLargeError();
    }
    chunks.push(Buffer.from(read.value));
  }
  return Buffer.concat(chunks);
}

// 创建发现服务。fetchImpl/now/delayImpl/timeoutMs 可注入以便测试超时、缓存、限额与节流
//（timeoutMs 默认固定 TIMEOUT_MS=12000，产品路径不可配置）。
export function createDiscoveryService({ fetchImpl, now, delayImpl, timeoutMs } = {}) {
  const fetchFn = typeof fetchImpl === 'function' ? fetchImpl : globalThis.fetch;
  if (typeof fetchFn !== 'function') {
    throw new TypeError('createDiscoveryService 需要 fetchImpl 或全局 fetch');
  }
  const nowMs = typeof now === 'function' ? now : () => Date.now();
  const delay = typeof delayImpl === 'function' ? delayImpl : (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const timeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : TIMEOUT_MS;

  // 服务级共享状态：全局上次上游开始时刻 + 串行队列（跨主题同样保证 ≥3s 间隔）。
  let globalLastUpstreamAt = 0;
  let queueTail = Promise.resolve();
  // 每主题状态：缓存、在途请求（同步登记，含排队中）、每日尝试计数。
  const states = new Map();
  function topicState(topic) {
    let ts = states.get(topic);
    if (!ts) {
      ts = { cache: null, inflight: null, attempts: new Map() };
      states.set(topic, ts);
    }
    return ts;
  }

  async function performFetch(def, ts) {
    const request = buildUrl(def, nowMs());
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('timeout')), timeout);
    try {
      let response;
      try {
        response = await fetchFn(request.url, {
          headers: { 'user-agent': USER_AGENT, accept: 'application/json' },
          signal: controller.signal,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          throw new DiscoveryError({
            status: 504,
            code: 'upstream-timeout',
            message: `Crossref 查询超时（${timeout / 1000} 秒）。今日已计入一次真实尝试；未获取到数据，不会用旧缓存或种子冒充今日结果。`,
            cause: error,
          });
        }
        throw new DiscoveryError({
          status: 502,
          code: 'upstream-network',
          message: '无法连接 Crossref（网络错误）。今日已计入一次真实尝试；未获取到数据，不会用种子冒充结果。',
          cause: error,
        });
      }
      if (response.status === 429) {
        throw new DiscoveryError({
          status: 502,
          code: 'upstream-rate-limited',
          message: 'Crossref 返回 429（上游限流）。今日已计入一次真实尝试；请稍后再试，不会用种子冒充结果。',
        });
      }
      if (!response.ok) {
        throw new DiscoveryError({
          status: 502,
          code: 'upstream-status',
          message: `Crossref 返回 HTTP ${response.status}。今日已计入一次真实尝试；不会用种子冒充结果。`,
        });
      }
      const body = await readBodyWithCap(response, controller);
      let data;
      try {
        data = JSON.parse(new TextDecoder('utf-8').decode(body));
      } catch (error) {
        throw new DiscoveryError({
          status: 502,
          code: 'upstream-invalid-json',
          message: 'Crossref 响应不是合法 JSON。今日已计入一次真实尝试；不会用种子冒充结果。',
          cause: error,
        });
      }
      // 结构验证：必须形如 { message: { items: [...] } }；非法结构不缓存、不当作空结果。
      if (
        typeof data !== 'object' ||
        data === null ||
        Array.isArray(data) ||
        typeof data.message !== 'object' ||
        data.message === null ||
        !Array.isArray(data.message.items)
      ) {
        throw new DiscoveryError({
          status: 502,
          code: 'upstream-invalid-structure',
          message: 'Crossref 响应结构非法（缺少 message.items 数组）。今日已计入一次真实尝试；不会用种子冒充结果。',
        });
      }
      const payload = transform(def, data, {
        from: request.from,
        until: request.until,
        fetchedAt: new Date(nowMs()).toISOString(),
      });
      ts.cache = { atMs: nowMs(), payload };
      return { ...payload, cached: false };
    } finally {
      clearTimeout(timer);
    }
  }

  function buildUrl(def, atMs) {
    const { from, until } = utcWindow(atMs);
    const params = new URLSearchParams({
      query: def.query,
      filter: `from-created-date:${from},until-created-date:${until}`,
      sort: 'created',
      order: 'desc',
      rows: String(MAX_ROWS),
      select: SELECT_FIELDS,
    });
    return { url: `${UPSTREAM_BASE}?${params.toString()}`, from, until };
  }

  // 入队一次真实上游段：全局串行，先补足与上次上游开始的 3 秒间隔，
  // 到达实际开始点时按当前 UTC 日原子计数并做限额判断（超限 503，不计次）。
  function enqueueFetch(def, ts) {
    const run = async () => {
      if (globalLastUpstreamAt > 0) {
        const elapsed = nowMs() - globalLastUpstreamAt;
        if (elapsed < UPSTREAM_MIN_INTERVAL_MS) {
          await delay(UPSTREAM_MIN_INTERVAL_MS - elapsed);
        }
      }
      const startMs = nowMs();
      const day = utcDateString(startMs);
      const used = ts.attempts.get(day) ?? 0;
      if (used >= DAILY_ATTEMPT_LIMIT) {
        throw new DiscoveryError({
          status: 503,
          code: 'daily-limit',
          message: `主题 ${def.id} 今日（UTC ${day}）真实查询尝试已达上限（${used}/${DAILY_ATTEMPT_LIMIT}，成功或失败均计入）；且无 15 分钟内的有效缓存。请稍后再试或明日再查。`,
        });
      }
      ts.attempts.set(day, used + 1);
      globalLastUpstreamAt = startMs;
      return performFetch(def, ts);
    };
    const result = queueTail.then(run, run);
    queueTail = result.then(
      () => {},
      () => {},
    );
    return result;
  }

  // 查询一个主题。命中 15 分钟缓存直接返回（cached=true，不计尝试、不访问上游）；
  // 否则同步登记在途 Promise（排队中同样可被同主题合并），再进入全局队列。
  async function discover(topic) {
    const def = TOPICS[topic];
    if (!def) {
      throw new DiscoveryError({
        status: 400,
        code: 'invalid-topic',
        message: `未知主题：仅支持 ${Object.keys(TOPICS).join('|')}`,
      });
    }
    const ts = topicState(topic);
    const t = nowMs();
    if (ts.cache && t - ts.cache.atMs < CACHE_TTL_MS) {
      return { ...ts.cache.payload, cached: true };
    }
    if (ts.inflight) {
      return ts.inflight; // 同主题并发合并：共用同一次真实查询（含排队中的）。
    }
    const promise = enqueueFetch(def, ts);
    ts.inflight = promise;
    try {
      return await promise;
    } finally {
      if (ts.inflight === promise) ts.inflight = null;
    }
  }

  return { discover };
}
