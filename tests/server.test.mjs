// tests/server.test.mjs —— HTTP 边界测试（研究导航 v2）。
// 覆盖：静态白名单/遍历/方法、Host 校验、符号链接拒绝、安全响应头（CSP self）、
// 端口冲突、端口配置、/api/discover 参数白名单/方法/错误映射/无 CORS。
// 服务器使用临时目录中的合成哨兵文件与 port 0（隔离端口），发现服务使用注入的假实现，
// 不读取真实 private/，不访问真实网络。

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { promises as fsp } from 'node:fs';

import { startServer, createAppServer, resolvePortConfig, parseDiscoverRequest, DEFAULT_PORT, BIND_HOST, DISCOVERY_PATH } from '../server.mjs';
import { DiscoveryError } from '../discovery.mjs';

const SENTINELS = {
  'index.html': '<!doctype html>sentinel-index',
  'styles.css': '/* sentinel-css */',
  'library.js': '// sentinel-library',
  'library-content.js': '// sentinel-library-content',
  'content/directions.js': '// sentinel-content-directions',
  'content/papers-routes.js': '// sentinel-content-papers-routes',
  'content/papers-supplements.js': '// sentinel-content-papers-supplements',
  'content/papers-foundations.js': '// sentinel-content-papers-foundations',
  'content/papers-collab.js': '// sentinel-content-papers-collab',
  'content/materials.js': '// sentinel-content-materials',
  'content/technical-routes.js': '// sentinel-content-technical-routes',
  'learning/multiagent-lab.md': '# sentinel lab',
  'content/briefs.js': '// sentinel-content-briefs',
  'notes.js': '// sentinel-notes',
  'guidance.js': '// sentinel-guidance',
};

const testRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'rw-server-test-'));
let base; // { server, port, rootDir, close }

// 可编程假发现服务：记录 topic，按脚本返回结果或错误。
function createFakeDiscovery(script = {}) {
  const calls = [];
  return {
    calls,
    discover(topic) {
      calls.push(topic);
      const behavior = script[topic] ?? { ok: true, payload: { topic, count: 0, items: [], fetchedAt: '2026-09-14T08:00:00.000Z' } };
      if (behavior.ok) return Promise.resolve(behavior.payload);
      return Promise.reject(
        new DiscoveryError({ status: behavior.status, code: behavior.code, message: behavior.message ?? 'sentinel discovery failure' }),
      );
    },
  };
}

test.before(async () => {
  await fsp.mkdir(path.join(testRoot, 'content'), { recursive: true });
  await fsp.mkdir(path.join(testRoot, 'learning'), { recursive: true });
  for (const [name, content] of Object.entries(SENTINELS)) {
    await fsp.writeFile(path.join(testRoot, name), content, 'utf8');
  }
  base = await startServer({ port: 0, rootDir: testRoot, discovery: createFakeDiscovery() });
});

test.after(async () => {
  if (base) await base.close();
  await fsp.rm(testRoot, { recursive: true, force: true }).catch(() => {});
});

function request(pathname, { method = 'GET', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: BIND_HOST,
        port: base.port,
        path: pathname,
        method,
        headers: { host: `${BIND_HOST}:${base.port}`, ...headers },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          }),
        );
      },
    );
    req.on('error', reject);
    req.end();
  });
}

// —— 静态白名单 ——

test('GET / 返回 index 哨兵，内容类型 text/html', async () => {
  const res = await request('/');
  assert.equal(res.status, 200);
  assert.equal(res.body.toString('utf8'), SENTINELS['index.html']);
  assert.ok(res.headers['content-type'].startsWith('text/html'));
});

test('白名单十六个路径均可访问且内容类型正确（含 content/ 八个模块与教材；009-C 新增 /guidance.js 精确一行）', async () => {
  const cases = [
    ['/', 'text/html', SENTINELS['index.html']],
    ['/index.html', 'text/html', SENTINELS['index.html']],
    ['/styles.css', 'text/css', SENTINELS['styles.css']],
    ['/library.js', 'text/javascript', SENTINELS['library.js']],
    ['/library-content.js', 'text/javascript', SENTINELS['library-content.js']],
    ['/content/directions.js', 'text/javascript', SENTINELS['content/directions.js']],
    ['/content/papers-routes.js', 'text/javascript', SENTINELS['content/papers-routes.js']],
    ['/content/papers-supplements.js', 'text/javascript', SENTINELS['content/papers-supplements.js']],
    ['/content/papers-foundations.js', 'text/javascript', SENTINELS['content/papers-foundations.js']],
    ['/content/papers-collab.js', 'text/javascript', SENTINELS['content/papers-collab.js']],
    ['/content/materials.js', 'text/javascript', SENTINELS['content/materials.js']],
    ['/content/technical-routes.js', 'text/javascript', SENTINELS['content/technical-routes.js']],
    ['/learning/multiagent-lab.md', 'text/plain', SENTINELS['learning/multiagent-lab.md']],
    ['/content/briefs.js', 'text/javascript', SENTINELS['content/briefs.js']],
    ['/notes.js', 'text/javascript', SENTINELS['notes.js']],
    ['/guidance.js', 'text/javascript', SENTINELS['guidance.js']],
  ];
  for (const [pathname, typePrefix, sentinel] of cases) {
    const res = await request(pathname);
    assert.equal(res.status, 200, pathname);
    assert.ok(res.headers['content-type'].startsWith(typePrefix), `${pathname} content-type`);
    assert.equal(res.body.toString('utf8'), sentinel, `${pathname} 哨兵内容`);
  }
});

test('旧版退役路径（app/domain/content/legacy）一律 404', async () => {
  for (const pathname of ['/app.js', '/domain.js', '/content.js', '/legacy.html']) {
    const res = await request(pathname);
    assert.equal(res.status, 404, pathname);
  }
});

test('query、大小写、多余斜杠、点段等非精确匹配一律 404', async () => {
  for (const pathname of [
    '/index.html?x=1',
    '/?x=1',
    '/INDEX.HTML',
    '/Index.html',
    '//index.html',
    '/./index.html',
    '/index.html/',
    '/index.html..',
    '/index%2Ehtml',
    '/nonexistent',
    '/index.html%20',
  ]) {
    const res = await request(pathname);
    assert.equal(res.status, 404, pathname);
  }
});

test('目录遍历与敏感路径一律 404，不暴露任何文件', async () => {
  for (const pathname of [
    '/../package.json',
    '/..%2fpackage.json',
    '/%2e%2e%2fpackage.json',
    '/%2e%2e/package.json',
    '/....//package.json',
    '/docs/SPEC.md',
    '/private/anything',
    '/.git/config',
    '/server.mjs',
    '/package.json',
    '/discovery.mjs',
    '/api/discover/x',
    '/API/discover?topic=agent',
  ]) {
    const res = await request(pathname);
    assert.equal(res.status, 404, pathname);
    assert.ok(!res.body.toString('utf8').includes('PORT'), '错误体不回显内部信息');
  }
});

test('畸形百分号编码返回 400', async () => {
  for (const pathname of ['/%zz', '/%', '/index.html%', '/%E0%80', '/%2']) {
    const res = await request(pathname);
    assert.equal(res.status, 400, pathname);
  }
});

test('白名单文件缺失时返回 404，服务不崩溃', async () => {
  const target = path.join(testRoot, 'notes.js');
  const backup = path.join(testRoot, 'notes.js.sentinel-bak');
  await fsp.rename(target, backup);
  try {
    const res = await request('/notes.js');
    assert.equal(res.status, 404);
  } finally {
    await fsp.rename(backup, target);
  }
  const restored = await request('/notes.js');
  assert.equal(restored.status, 200, '恢复后可访问');
});

test('符号链接资源被拒绝，不读取链接目标内容', async (t) => {
  const outsidePath = path.join(path.dirname(testRoot), `rw-secret-${process.pid}.css`);
  await fsp.writeFile(outsidePath, 'TOP-SECRET-SYMLINK-TARGET', 'utf8');
  const linkPath = path.join(testRoot, 'styles.css');
  const backup = path.join(testRoot, 'styles.css.sentinel-bak');
  await fsp.rename(linkPath, backup);
  let linkCreated = false;
  try {
    try {
      await fsp.symlink(outsidePath, linkPath, 'file');
      linkCreated = true;
    } catch (error) {
      const code = error?.code ?? '';
      const skippable = ['EPERM', 'EACCES', 'ENOTSUP', 'ENOSYS'].includes(code);
      if (!skippable) throw error;
      t.skip(
        `本环境创建符号链接被拒（${code || error.message}）：真实符号链接拒绝路径未验证，` +
          '需在具有符号链接权限的隔离环境补测；不承诺浏览器验收能覆盖该项',
      );
      return;
    }
    const res = await request('/styles.css');
    assert.equal(res.status, 404, '符号链接拒绝');
    assert.ok(!res.body.toString('utf8').includes('TOP-SECRET'), '不泄漏链接目标内容');
  } finally {
    if (linkCreated) await fsp.unlink(linkPath).catch(() => {});
    await fsp.rename(backup, linkPath).catch(() => {});
    await fsp.unlink(outsidePath).catch(() => {});
  }
});

// —— Host 校验 ——

test('Host 正确时通过', async () => {
  const res = await request('/');
  assert.equal(res.status, 200);
});

test('Host 非白名单时 403（静态与 API 均适用）', async () => {
  for (const pathname of ['/', '/api/discover?topic=agent']) {
    for (const host of [
      `localhost:${base.port}`,
      `127.0.0.1:1`,
      `127.0.0.1:${base.port}.`,
      'evil.example:4173',
      `[::1]:${base.port}`,
    ]) {
      const res = await request(pathname, { headers: { host } });
      assert.equal(res.status, 403, `${pathname} ${host}`);
    }
  }
});

// —— 方法 ——

test('POST/PUT/DELETE 静态路径返回 405 并带 Allow: GET, HEAD', async () => {
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
    const res = await request('/domain.js', { method });
    assert.equal(res.status, 405, method);
    assert.equal(res.headers.allow, 'GET, HEAD', method);
  }
  // 009-C：新增模块只扩精确路径，不新增任何写接口（POST /guidance.js 同样 405）。
  for (const method of ['POST', 'PUT', 'DELETE']) {
    const res = await request('/guidance.js', { method });
    assert.equal(res.status, 405, `guidance.js ${method}`);
    assert.equal(res.headers.allow, 'GET, HEAD', `guidance.js ${method} Allow`);
  }
});

test('API 仅接受 GET：HEAD/POST 返回 405（POST 不触发上游查询）', async () => {
  const fake = createFakeDiscovery();
  const { close, port } = await startServer({ port: 0, rootDir: testRoot, discovery: fake });
  try {
    const call = (method) =>
      new Promise((resolve, reject) => {
        const req = http.request(
          { host: BIND_HOST, port, path: '/api/discover?topic=agent', method, headers: { host: `${BIND_HOST}:${port}` } },
          (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
          },
        );
        req.on('error', reject);
        req.end();
      });
    const head = await call('HEAD');
    assert.equal(head.status, 405);
    assert.equal(head.headers.allow, 'GET');
    const post = await call('POST');
    assert.equal(post.status, 405);
    assert.equal(fake.calls.length, 0, '非 GET 不触发发现服务');
  } finally {
    await close();
  }
});

test('Host 非法优先于方法检查：POST 携带恶意 Host 返回 403', async () => {
  const res = await request('/domain.js', { method: 'POST', headers: { host: 'evil.example:1' } });
  assert.equal(res.status, 403);
});

test('HEAD 返回与 GET 相同头但无响应体', async () => {
  const head = await request('/', { method: 'HEAD' });
  const get = await request('/');
  assert.equal(head.status, 200);
  assert.equal(head.body.length, 0, 'HEAD 无响应体');
  assert.equal(head.headers['content-type'], get.headers['content-type']);
  assert.equal(head.headers['content-length'], get.headers['content-length']);
  assert.equal(head.headers['content-security-policy'], get.headers['content-security-policy']);
});

// —— 安全响应头 ——

test('200 与错误响应均携带安全头（CSP connect-src self 允许同源 API）', async () => {
  for (const res of [
    await request('/'),
    await request('/missing-place'),
    await request('/%zz'),
    await request('/', { headers: { host: 'evil.example:1' } }),
    await request('/', { method: 'POST' }),
    await request('/api/discover?topic=evil'),
  ]) {
    assert.equal(
      res.headers['content-security-policy'],
      "default-src 'self'; connect-src 'self'",
      `CSP（状态 ${res.status}）`,
    );
    assert.equal(res.headers['x-content-type-options'], 'nosniff', `nosniff（状态 ${res.status}）`);
    assert.equal(res.headers['cache-control'], 'no-store', `no-store（状态 ${res.status}）`);
    assert.equal(res.headers['referrer-policy'], 'no-referrer', `no-referrer（状态 ${res.status}）`);
  }
});

// —— 每日发现 API ——

test('API 成功请求返回 JSON 载荷且无 CORS 头', async () => {
  // 独立实例：替换 base 的假服务不可行，直接新建。
  const payload = { topic: 'agent', count: 1, items: [{ doi: '10.5555/x', title: 'Sentinel' }], cached: false };
  const fake = createFakeDiscovery({ agent: { ok: true, payload } });
  const { close, port } = await startServer({ port: 0, rootDir: testRoot, discovery: fake });
  try {
    const res = await new Promise((resolve, reject) => {
      const req = http.request(
        { host: BIND_HOST, port, path: '/api/discover?topic=agent', headers: { host: `${BIND_HOST}:${port}` } },
        (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
        },
      );
      req.on('error', reject);
      req.end();
    });
    assert.equal(res.status, 200);
    assert.ok(res.headers['content-type'].startsWith('application/json'));
    assert.equal(res.headers['access-control-allow-origin'], undefined, '无 CORS 头');
    assert.deepEqual(JSON.parse(res.body.toString('utf8')), payload);
  } finally {
    await close();
  }
});

test('API 参数白名单：缺参/多参/重复/编码变体/未知主题均 400 且不触发服务；合法主题正向对照 200', async () => {
  const fake = createFakeDiscovery({ agent: { ok: true, payload: { topic: 'agent', count: 0, items: [], cached: false } } });
  const { close, port } = await startServer({ port: 0, rootDir: testRoot, discovery: fake });
  const get = (p) =>
    new Promise((resolve, reject) => {
      const req = http.request(
        // 正向对照与全部非法用例都指向本测试新建的隔离实例（而非全局 base 实例）。
        { host: BIND_HOST, port, path: p, headers: { host: `${BIND_HOST}:${port}` } },
        (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
        },
      );
      req.on('error', reject);
      req.end();
    });
  try {
    const cases = [
      '/api/discover',
      '/api/discover?',
      '/api/discover?topic=',
      '/api/discover?topic=nlp',
      '/api/discover?topic=Agent',
      '/api/discover?topic=agent&x=1',
      '/api/discover?x=1&topic=agent',
      '/api/discover?topic=agent&topic=rag',
      '/api/discover?topic=ag%65nt',
      '/api/discover?topic=age%20nt',
      '/api/discover?topic=agent+',
      '/api/discover?filter=title',
      '/api/discover?=agent',
    ];
    for (const pathname of cases) {
      const res = await get(pathname);
      assert.equal(res.status, 400, pathname);
      assert.ok(res.headers['content-type'].startsWith('application/json'), `${pathname} JSON 错误`);
      const body = JSON.parse(res.body.toString('utf8'));
      assert.ok(body.error.code === 'invalid-param' || body.error.code === 'invalid-topic', `${pathname} 错误码`);
      assert.ok(body.error.message.length > 0);
    }
    assert.equal(fake.calls.length, 0, '参数非法时不触发发现服务');
    // 合法正向对照：同一隔离实例上合法主题返回 200 且确实调用了注入的发现服务。
    const good = await get('/api/discover?topic=agent');
    assert.equal(good.status, 200, '合法 topic 正向对照');
    assert.deepEqual(JSON.parse(good.body.toString('utf8')), { topic: 'agent', count: 0, items: [], cached: false });
    assert.deepEqual(fake.calls, ['agent'], '正向对照证明服务被真实调用');
  } finally {
    await close();
  }
});

test('API 错误映射：发现服务的 DiscoveryError 状态与码透传为 JSON', async () => {
  const fake = createFakeDiscovery({
    agent: { ok: false, status: 503, code: 'daily-limit', message: '今日尝试已达上限哨兵' },
    rag: { ok: false, status: 504, code: 'upstream-timeout', message: '超时哨兵' },
    peft: { ok: false, status: 502, code: 'upstream-rate-limited', message: '429 哨兵' },
  });
  const { close, port } = await startServer({ port: 0, rootDir: testRoot, discovery: fake });
  try {
    const get = (p) =>
      new Promise((resolve, reject) => {
        const req = http.request(
          { host: BIND_HOST, port, path: p, headers: { host: `${BIND_HOST}:${port}` } },
          (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
          },
        );
        req.on('error', reject);
        req.end();
      });
    const a = await get('/api/discover?topic=agent');
    assert.equal(a.status, 503);
    assert.equal(JSON.parse(a.body.toString('utf8')).error.code, 'daily-limit');
    const b = await get('/api/discover?topic=rag');
    assert.equal(b.status, 504);
    assert.equal(JSON.parse(b.body.toString('utf8')).error.code, 'upstream-timeout');
    const c = await get('/api/discover?topic=peft');
    assert.equal(c.status, 502);
    assert.equal(JSON.parse(c.body.toString('utf8')).error.code, 'upstream-rate-limited');
  } finally {
    await close();
  }
});

test('API 服务异常兜底：非 DiscoveryError 返回 500 JSON，不泄漏内部信息', async () => {
  const broken = {
    discover() {
      throw new Error('internal sentinel secret detail');
    },
  };
  const { close, port } = await startServer({ port: 0, rootDir: testRoot, discovery: broken });
  try {
    const res = await new Promise((resolve, reject) => {
      const req = http.request(
        { host: BIND_HOST, port, path: '/api/discover?topic=agent', headers: { host: `${BIND_HOST}:${port}` } },
        (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
        },
      );
      req.on('error', reject);
      req.end();
    });
    assert.equal(res.status, 500);
    const body = JSON.parse(res.body.toString('utf8'));
    assert.equal(body.error.code, 'discover-failed');
    assert.ok(!res.body.toString('utf8').includes('sentinel secret'), '不泄漏内部错误细节');
  } finally {
    await close();
  }
});

// —— parseDiscoverRequest 单元 ——

test('parseDiscoverRequest：纯函数级白名单判定', () => {
  assert.deepEqual(parseDiscoverRequest('/api/discover?topic=agent'), { ok: true, topic: 'agent' });
  assert.deepEqual(parseDiscoverRequest('/api/discover?topic=rag'), { ok: true, topic: 'rag' });
  assert.deepEqual(parseDiscoverRequest('/api/discover?topic=peft'), { ok: true, topic: 'peft' });
  assert.equal(parseDiscoverRequest('/api/discover').ok, false);
  assert.equal(parseDiscoverRequest('/api/discover?topic=agent&b=1').ok, false);
  assert.equal(parseDiscoverRequest('/api/discoverx?topic=agent').ok, false);
  assert.equal(DISCOVERY_PATH, '/api/discover');
});

// —— 端口 ——

test('端口冲突明确报错，且不影响已运行实例', async () => {
  await assert.rejects(
    () => startServer({ port: base.port, rootDir: testRoot }),
    (error) => {
      assert.match(error.message, /已被占用/);
      assert.equal(error.cause?.code, 'EADDRINUSE');
      return true;
    },
  );
  const stillUp = await request('/');
  assert.equal(stillUp.status, 200, '原实例不受影响');
});

test('resolvePortConfig：默认 4173，合法 PORT 生效，非法 PORT 拒绝', () => {
  assert.equal(DEFAULT_PORT, 4173);
  assert.equal(resolvePortConfig({}), 4173);
  assert.equal(resolvePortConfig({ PORT: '' }), 4173);
  assert.equal(resolvePortConfig({ PORT: '8080' }), 8080);
  assert.equal(resolvePortConfig({ PORT: '65535' }), 65535);
  for (const bad of ['0', '-1', 'abc', '65536', '4173.5', ' 4173 ']) {
    assert.throws(() => resolvePortConfig({ PORT: bad }), (error) => {
      assert.match(error.message, /PORT/);
      return true;
    }, `应拒绝 PORT=${JSON.stringify(bad)}`);
  }
});

test('startServer 默认使用项目 public 目录并成功提供内容；未注入 discovery 时创建默认服务', async () => {
  // 读取的是项目交付的 public/library-content.js（公开内容包，非私人资料）。
  const { port, close, server } = await startServer({ port: 0 });
  try {
    assert.equal(typeof server.ctx.discovery.discover, 'function', '默认发现服务可用');
    const body = await new Promise((resolve, reject) => {
      http
        .get({ host: BIND_HOST, port, path: '/library-content.js', headers: { host: `${BIND_HOST}:${port}` } }, (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString('utf8') }));
        })
        .on('error', reject);
    });
    assert.equal(body.status, 200);
    assert.ok(body.text.includes('LIBRARY-CONTENT'), '默认 rootDir 指向项目 public（内容包聚合器）');
    // 拆分（REWORK-007）后论文数据在 content/ 模块中：聚合器与数据模块都应可从默认 rootDir 取到
    assert.ok(body.text.includes('./content/papers-routes.js'), '聚合器引用拆分模块');
    const dataBody = await new Promise((resolve, reject) => {
      http
        .get({ host: BIND_HOST, port, path: '/content/papers-routes.js', headers: { host: `${BIND_HOST}:${port}` } }, (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString('utf8') }));
        })
        .on('error', reject);
    });
    assert.equal(dataBody.status, 200);
    assert.ok(dataBody.text.includes('arxiv.org'), '拆分数据模块可由默认 rootDir 提供');
  } finally {
    await close();
  }
});

test('createAppServer：非法 discovery 形状构造即失败', () => {
  assert.throws(() => createAppServer({ rootRealPath: testRoot, discovery: { discover: 1 } }), TypeError);
  assert.throws(() => createAppServer({}), TypeError);
});
