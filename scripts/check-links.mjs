// scripts/check-links.mjs —— 内容包外链可达性检查（PLAN-005 阶段5）。
// 用途：外链会随上游站点重构悄悄失效（GitHub 目录改名、文档站改结构），本脚本把
// library-content.js 里的全部外链轮询一遍并出报告。手动触发（npm run check-links），
// 不接定时任务；零第三方依赖。
// 纪律：并发 ≤2、单条 12s 超时、HEAD 不被允许时回退 GET；只报告，不修改任何文件。

import { LIBRARY } from '../public/library-content.js';

const TIMEOUT_MS = 12000;
const CONCURRENCY = 2;

function collectLinks() {
  const links = new Map(); // url -> Set<出处>
  const add = (url, at) => {
    if (typeof url !== 'string' || !url.startsWith('https://')) return;
    if (!links.has(url)) links.set(url, new Set());
    links.get(url).add(at);
  };
  for (const paper of LIBRARY.papers) add(paper.url, `papers/${paper.id}`);
  for (const direction of LIBRARY.directions) {
    for (const source of direction.sources ?? []) add(source.url, `directions/${direction.id}`);
  }
  for (const route of LIBRARY.technicalRoutes) {
    for (const resource of route.resources ?? []) add(resource.url, `technicalRoutes/${route.id}/${resource.id}`);
  }
  for (const brief of LIBRARY.briefs) {
    for (const item of brief.items) add(item.source, `briefs/${brief.id}`);
  }
  for (const source of LIBRARY.meta?.ccfNote?.sources ?? []) add(source.url, 'meta/ccfNote');
  return links;
}

async function checkOne(url) {
  const attempt = async (method) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'ResearchWorkbench-LinkCheck/0.1 (manual run)' },
      });
      return res.status;
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    let status = await attempt('HEAD');
    if (status === 405 || status === 501) status = await attempt('GET');
    return { status };
  } catch (error) {
    return { error: error?.name === 'AbortError' ? 'timeout' : String(error?.cause?.code ?? error?.message ?? error) };
  }
}

const links = collectLinks();
console.log(`共 ${links.size} 个唯一外链，并发 ${CONCURRENCY}，单条超时 ${TIMEOUT_MS / 1000}s。\n`);

const entries = [...links.entries()];
const results = [];
let cursor = 0;
async function worker() {
  while (cursor < entries.length) {
    const i = cursor;
    cursor += 1;
    const [url, ats] = entries[i];
    const outcome = await checkOne(url);
    results.push({ url, ats: [...ats], ...outcome });
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

let bad = 0;
for (const r of results) {
  const ok = r.status !== undefined && r.status < 400;
  if (!ok) bad += 1;
  const mark = ok ? 'OK ' : 'BAD';
  const detail = r.status !== undefined ? `HTTP ${r.status}` : `错误 ${r.error}`;
  console.log(`${mark} ${detail}  ${r.url}\n     出处：${r.ats.join('；')}`);
}
console.log(`\n完成：${results.length - bad}/${results.length} 可达，${bad} 条需要人工复核（BAD 不等于一定失效：部分站点拒绝 HEAD/限流，请在浏览器里人工确认后再改内容）。`);
process.exitCode = bad > 0 ? 1 : 0;
