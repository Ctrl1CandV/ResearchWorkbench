// server.mjs —— 仅本机服务：静态只读 + 每日发现同源 API。
// 契约来源：docs/DESIGN-002.md「状态和安全」「每日发现固定契约」、
// docs/plans/PLAN-003-reading-library.md「实施设计」（阅读工作台静态白名单）、
// docs/LEGACY-AUDIT-005.md（旧版退役：app/domain/content/legacy 四文件已删除）。
// - 只绑定 127.0.0.1；端口默认 4173，可用 PORT 环境变量覆盖；端口冲突明确报错，
//   不结束占用端口的进程。
// 静态部分：
// - 原始 URL 精确匹配固定白名单（/、/index.html、/styles.css、/library.js、
//   /library-content.js、/notes.js）；其他路径（含 query、大小写、编码、遍历）404；
//   畸形百分号编码 400；不做路径解码拼接、不做目录列表。
// - 固定资源读取前拒绝符号链接，并核验 realpath 仍在 public 内。
// - CSP 保持 default-src 'self' / connect-src 'self'：页面无内联脚本与内联样式，
//   外链为普通导航不受 CSP 限制，无需放宽。
// API 部分（每日发现）：
// - 仅 GET /api/discover?topic=agent|rag|peft；Host 校验同样适用；无 CORS 头；
//   额外参数/重复参数/编码变体一律 400；真实上游行为由 discovery.mjs 提供，
//   可注入发现服务以便隔离测试。
// 通用：
// - Host 仅允许 127.0.0.1:<实际端口>，否则 403；仅 GET/HEAD（API 仅 GET）。
// - 安全响应头：CSP self（connect-src 'self' 以允许同源 API）、nosniff、no-store、
//   Referrer-Policy no-referrer。
// - 不接收任何写入数据；错误响应不回显请求路径；服务密钥/个人记录无访问接口。

import http from 'node:http';
import path from 'node:path';
import { promises as fsp } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createDiscoveryService, DiscoveryError, TOPICS } from './discovery.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_PORT = 4173;
export const BIND_HOST = '127.0.0.1';
export const DISCOVERY_PATH = '/api/discover';

const ROUTE_MAP = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/styles.css', 'styles.css'],
  ['/library.js', 'library.js'],
  ['/library-content.js', 'library-content.js'],
  ['/notes.js', 'notes.js'],
]);

const CONTENT_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
]);

// % 后未跟两个十六进制位视为畸形。
const MALFORMED_PERCENT = /%(?![0-9A-Fa-f]{2})/;

const SECURITY_HEADERS = {
  'content-security-policy': "default-src 'self'; connect-src 'self'",
  'x-content-type-options': 'nosniff',
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer',
};

// 端口解析：默认 4173；PORT 必须是 1-65535 的纯十进制整数字符串
//（不接受空白、符号、小数等 Number() 会静默转换的写法），否则启动即失败。
export function resolvePortConfig(env = process.env) {
  const raw = env.PORT;
  if (raw === undefined || raw === '') return DEFAULT_PORT;
  if (typeof raw !== 'string' || !/^[0-9]+$/.test(raw)) {
    throw new Error(`PORT 环境变量必须是 1-65535 的整数字符串，当前为：${JSON.stringify(raw)}`);
  }
  const port = Number(raw);
  if (port < 1 || port > 65535) {
    throw new Error(`PORT 环境变量必须是 1-65535 的整数字符串，当前为：${JSON.stringify(raw)}`);
  }
  return port;
}

function isPercentDecodable(rawUrl) {
  try {
    decodeURIComponent(rawUrl);
    return true;
  } catch {
    return false;
  }
}

// mapFsStatus 把文件系统错误映射为 HTTP 状态（缺失 404、权限 403、其他 500）。
function mapFsStatus(error) {
  const code = error?.code;
  if (code === 'ENOENT' || code === 'ENOTDIR' || code === 'EISDIR') return 404;
  if (code === 'EACCES' || code === 'EPERM') return 403;
  return 500;
}

function statusText(status) {
  if (status === 400) return 'Bad Request';
  if (status === 403) return 'Forbidden';
  if (status === 404) return 'Not Found';
  if (status === 405) return 'Method Not Allowed';
  if (status === 502) return 'Bad Gateway';
  if (status === 503) return 'Service Unavailable';
  if (status === 504) return 'Gateway Timeout';
  return 'Internal Server Error';
}

function respondError(req, res, status, extraHeaders = {}) {
  const body = Buffer.from(`${status} ${statusText(status)}\n`, 'utf8');
  res.writeHead(status, {
    'content-type': 'text/plain; charset=utf-8',
    'content-length': String(body.length),
    ...SECURITY_HEADERS,
    ...extraHeaders,
  });
  // HEAD 无响应体。
  if (req.method === 'HEAD') {
    res.end();
  } else {
    res.end(body);
  }
}

function respondJson(req, res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
    ...SECURITY_HEADERS,
  });
  if (req.method === 'HEAD') {
    res.end();
  } else {
    res.end(body);
  }
}

// 解析 /api/discover 查询：仅接受单一 topic 参数且值在白名单内；
// 缺参、多参、重复参数、编码变体（%xx、+）一律 400，不触发任何上游查询。
export function parseDiscoverRequest(rawUrl) {
  const rest = rawUrl.slice(DISCOVERY_PATH.length);
  if (rest !== '' && !rest.startsWith('?')) {
    return { ok: false, status: 404, code: 'not-found', message: '未知路径' };
  }
  const query = rest.startsWith('?') ? rest.slice(1) : '';
  if (query === '') {
    return { ok: false, status: 400, code: 'invalid-param', message: '缺少 topic 参数；仅支持 topic=agent|rag|peft，且不接受其他参数' };
  }
  const pairs = query.split('&');
  if (pairs.length !== 1) {
    return { ok: false, status: 400, code: 'invalid-param', message: '仅接受单一 topic 参数，不接受额外参数' };
  }
  const eq = pairs[0].indexOf('=');
  const key = eq === -1 ? pairs[0] : pairs[0].slice(0, eq);
  const value = eq === -1 ? '' : pairs[0].slice(eq + 1);
  if (key !== 'topic' || value === '') {
    return { ok: false, status: 400, code: 'invalid-param', message: '仅接受 topic=agent|rag|peft，不接受其他参数' };
  }
  if (/%|\+/.test(value)) {
    return { ok: false, status: 400, code: 'invalid-param', message: 'topic 不接受编码或加号变体；仅支持 agent|rag|peft' };
  }
  if (!Object.hasOwn(TOPICS, value)) {
    return { ok: false, status: 400, code: 'invalid-topic', message: `未知主题：仅支持 ${Object.keys(TOPICS).join('|')}` };
  }
  return { ok: true, topic: value };
}

function respondFile(req, res, filePath, rootRealPath) {
  return fsp
    .lstat(filePath)
    .then((stat) => {
      if (stat.isSymbolicLink()) return { status: 404 };
      return fsp.realpath(filePath).then((real) => {
        const rel = path.relative(rootRealPath, real);
        if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
          return { status: 404 };
        }
        return fsp.readFile(filePath).then((body) => ({ status: 200, body }));
      });
    })
    .catch((error) => ({ status: mapFsStatus(error) }));
}

// 每日发现 API：仅 GET；真实查询由发现服务执行；失败映射为 JSON 错误（不回显请求路径）。
async function handleDiscoverApi(req, res, rawUrl, ctx) {
  if (req.method !== 'GET') {
    return respondError(req, res, 405, { allow: 'GET' });
  }
  const parsed = parseDiscoverRequest(rawUrl);
  if (!parsed.ok) {
    if (parsed.status === 404) return respondError(req, res, 404);
    return respondJson(req, res, parsed.status, { error: { code: parsed.code, message: parsed.message } });
  }
  try {
    const payload = await ctx.discovery.discover(parsed.topic);
    return respondJson(req, res, 200, payload);
  } catch (error) {
    if (error instanceof DiscoveryError) {
      return respondJson(req, res, error.status, {
        error: { code: error.code, message: error.message },
      });
    }
    console.error('每日发现查询异常：', error);
    return respondJson(req, res, 500, {
      error: { code: 'discover-failed', message: '每日发现查询失败（服务内部错误）；未获取到数据，不会用种子冒充结果。' },
    });
  }
}

function createHandler(ctx) {
  return function handler(req, res) {
    handleRequest(req, res, ctx).catch((error) => {
      console.error('请求处理异常：', error);
      if (!res.headersSent) {
        respondError(req, res, 500);
      } else {
        res.destroy();
      }
    });
  };
}

async function handleRequest(req, res, ctx) {
  // 1) Host 校验优先：仅允许 127.0.0.1:<实际端口>（静态与 API 同样适用）。
  const expectedHost = `${BIND_HOST}:${ctx.port}`;
  if (String(req.headers.host ?? '').toLowerCase() !== expectedHost) {
    return respondError(req, res, 403);
  }

  // 2) 每日发现 API 路由（精确前缀；方法与参数在内部校验）。
  if (req.url === DISCOVERY_PATH || req.url?.startsWith(`${DISCOVERY_PATH}?`)) {
    return handleDiscoverApi(req, res, req.url, ctx);
  }

  // 3) 方法白名单：仅 GET/HEAD；本服务不接收写入数据。
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return respondError(req, res, 405, { allow: 'GET, HEAD' });
  }

  // 4) 原始 URL 精确匹配白名单；不做解码、不做归一化。
  const rawUrl = req.url ?? '';
  const mapped = ROUTE_MAP.get(rawUrl);
  if (mapped === undefined) {
    if (rawUrl.includes('%') && (MALFORMED_PERCENT.test(rawUrl) || !isPercentDecodable(rawUrl))) {
      return respondError(req, res, 400);
    }
    return respondError(req, res, 404);
  }

  // 5) 固定资源：读取前拒绝符号链接，并核验 realpath 仍在 public 内。
  const filePath = path.join(ctx.rootRealPath, mapped);
  const outcome = await respondFile(req, res, filePath, ctx.rootRealPath);
  if (outcome.status !== 200) {
    return respondError(req, res, outcome.status);
  }
  const type =
    CONTENT_TYPES.get(path.extname(filePath).toLowerCase()) ?? 'application/octet-stream';
  res.writeHead(200, {
    'content-type': type,
    'content-length': String(outcome.body.length),
    ...SECURITY_HEADERS,
  });
  if (req.method === 'HEAD') {
    res.end();
  } else {
    res.end(outcome.body);
  }
}

export function createAppServer({ rootRealPath, port, discovery } = {}) {
  if (!rootRealPath) {
    throw new TypeError('createAppServer 需要rootRealPath（public 目录的 realpath）');
  }
  if (discovery !== undefined && typeof discovery?.discover !== 'function') {
    throw new TypeError('discovery 必须是具有 discover(topic) 的服务');
  }
  const ctx = {
    rootRealPath,
    port: port ?? 0,
    discovery: discovery ?? createDiscoveryService(),
  };
  const server = http.createServer(createHandler(ctx));
  // 暴露 ctx 供 startServer 更新实际端口（处理器闭包持有同一引用）。
  server.ctx = ctx;
  return server;
}

// 启动服务：解析 public 真实路径、绑定 127.0.0.1。
// 端口冲突（EADDRINUSE）时以明确错误拒绝，不结束占用端口的进程。
export async function startServer({ port = DEFAULT_PORT, rootDir, discovery } = {}) {
  const publicDir = path.resolve(rootDir ?? path.join(__dirname, 'public'));
  let rootRealPath;
  try {
    rootRealPath = await fsp.realpath(publicDir);
  } catch (error) {
    throw new Error(`静态目录不可用：${publicDir}`, { cause: error });
  }
  const server = createAppServer({ rootRealPath, port, discovery });
  await new Promise((resolve, reject) => {
    const onError = (error) => {
      if (error?.code === 'EADDRINUSE') {
        const friendly = new Error(
          `端口 ${port} 已被占用（${BIND_HOST}）：可能有另一个实例正在运行。` +
            '本服务不会结束占用端口的进程，请改用 PORT 环境变量选择其他端口。',
          { cause: error },
        );
        reject(friendly);
      } else {
        reject(error);
      }
    };
    server.once('error', onError);
    server.listen(port, BIND_HOST, () => {
      server.removeListener('error', onError);
      resolve();
    });
  });
  const actualPort = server.address().port;
  // Host 校验使用实际监听端口（port=0 时由系统分配）；更新闭包持有的同一 ctx。
  server.ctx.port = actualPort;
  return {
    server,
    port: actualPort,
    rootDir: rootRealPath,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  try {
    const requestedPort = resolvePortConfig(process.env);
    const { port, close } = await startServer({ port: requestedPort });
    console.log(`研究导航工作台服务已启动：http://${BIND_HOST}:${port}/`);
    console.log('仅绑定本机回环地址；每日发现仅在你点击按钮时访问 Crossref；按 Ctrl+C 停止。');
    process.on('SIGINT', () => {
      close().then(() => process.exit(0));
    });
  } catch (error) {
    console.error(`启动失败：${error.message}`);
    process.exitCode = 1;
  }
}
