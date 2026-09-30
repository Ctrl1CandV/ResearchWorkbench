// SURVEY-013: 综述书架与候选记录。候选未读时明确展示来源状态，不生成空壳阅读图。
import { SURVEYS } from './content/surveys.js';
import { renderArticleGraph, rememberSurveyUnit } from './survey-graph.js';

const node = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null) el.textContent = String(text);
  return el;
};
const link = (href, label, className) => {
  const el = node('a', className, label);
  el.href = href;
  return el;
};
const hash = (id) => `#/survey/${encodeURIComponent(id)}`;
const unitHash = (articleId, unitId) => `${hash(articleId)}/unit/${encodeURIComponent(unitId)}`;

function renderReadingBlock(block, root) {
  let element;
  if (block.type === 'heading') {
    element = node(block.level === 3 ? 'h3' : 'h2', 'survey-reading-heading', block.text);
    element.id = block.id;
    element.tabIndex = -1;
  } else if (block.type === 'comparison') {
    element = node('div', 'survey-comparison-wrap');
    const table = node('table', 'survey-comparison');
    if (block.caption) table.append(node('caption', null, block.caption));
    const head = node('thead');
    const headerRow = node('tr');
    for (const heading of block.headers ?? []) {
      const cell = node('th', null, heading);
      cell.scope = 'col';
      headerRow.append(cell);
    }
    head.append(headerRow);
    table.append(head);
    const body = node('tbody');
    for (const row of block.rows ?? []) {
      const tr = node('tr');
      for (const cell of row) tr.append(node('td', null, cell));
      body.append(tr);
    }
    table.append(body);
    element.append(table);
  } else {
    element = node('p', `survey-reading-paragraph survey-role-${block.role}`, block.text);
  }
  root.append(element);
  if (block.source) {
    const label = block.role === 'teaching-example' ? '例子说明'
      : block.role === 'editorial-connection' ? '阅读联系' : '原文位置';
    const citation = node('details', 'survey-source-citation');
    citation.append(node('summary', null, block.role === 'source-explanation' ? `${label} · ${block.source.split('；')[0]}` : label));
    citation.append(node('span', null, block.source));
    root.append(citation);
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function renderConceptMap(graph, root) {
  const section = node('section', 'survey-concept-map');
  section.append(node('h2', null, graph.title));
  section.append(node('p', 'survey-concept-map-intro', graph.intro));
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1000 370');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', graph.title);
  const title = document.createElementNS(SVG_NS, 'title'); title.textContent = graph.title;
  svg.append(title);
  const detail = node('div', 'survey-concept-detail');
  detail.setAttribute('aria-live', 'polite');

  let selectedAxis = graph.axes[0]?.id ?? null;
  let selectedChild = null;
  const path = (d) => {
    const line = document.createElementNS(SVG_NS, 'path');
    line.setAttribute('d', d); line.setAttribute('class', 'survey-concept-edge');
    svg.append(line);
  };
  const drawNode = ({ id, label, lines = [], x, y, width = 200, height = 62, selected, kind }, onSelect) => {
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', `survey-concept-node survey-concept-node-${kind}${selected ? ' is-selected' : ''}`);
    group.setAttribute('role', 'button'); group.setAttribute('tabindex', '0');
    group.setAttribute('aria-label', label); group.setAttribute('aria-pressed', String(Boolean(selected)));
    group.dataset.nodeId = id;
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y); rect.setAttribute('width', width); rect.setAttribute('height', height); rect.setAttribute('rx', kind === 'root' ? 22 : 12);
    group.append(rect);
    const text = document.createElementNS(SVG_NS, 'text');
    const labelLines = lines.length ? lines : [label];
    const lineHeight = 17;
    const firstY = y + height / 2 - ((labelLines.length - 1) * lineHeight) / 2 + 5;
    for (const [index, value] of labelLines.entries()) {
      const span = document.createElementNS(SVG_NS, 'tspan');
      span.setAttribute('x', x + width / 2); span.setAttribute('y', firstY + index * lineHeight); span.textContent = value;
      text.append(span);
    }
    group.append(text);
    const activate = () => {
      onSelect();
      draw();
      requestAnimationFrame(() => svg.querySelector(`[data-node-id="${id}"]`)?.focus());
    };
    group.addEventListener('click', activate);
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
    });
    svg.append(group);
  };
  const describe = () => {
    const axis = graph.axes.find((item) => item.id === selectedAxis);
    const child = axis?.children?.find((item) => item.id === selectedChild);
    detail.replaceChildren();
    detail.append(node('p', 'survey-concept-detail-kicker', child ? axis.label : axis?.label ?? graph.root.label));
    detail.append(node('h3', null, child?.title ?? axis?.title ?? graph.root.label));
    detail.append(node('p', null, child?.detail ?? axis?.detail ?? graph.root.detail));
    if (child?.example) detail.append(node('p', 'survey-concept-example', child.example));
    if (child?.source || axis?.source || graph.root.source) {
      detail.append(node('p', 'survey-source-locator', `原文位置：${child?.source ?? axis?.source ?? graph.root.source}`));
    }
    const targetHeadingId = child?.targetHeadingId ?? axis?.targetHeadingId ?? graph.root.targetHeadingId;
    if (targetHeadingId) {
      const jump = node('button', 'survey-concept-jump', '跳到正文详解');
      jump.type = 'button';
      jump.addEventListener('click', () => {
        const heading = document.getElementById(targetHeadingId);
        heading?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        heading?.focus({ preventScroll: true });
      });
      detail.append(jump);
    }
    if (axis?.children?.length) {
      const choices = node('div', 'survey-concept-choices');
      choices.setAttribute('aria-label', `${axis.label}下位概念`);
      for (const item of axis.children) {
        const button = node('button', `survey-concept-choice${item.id === selectedChild ? ' is-selected' : ''}`, item.title);
        button.type = 'button';
        button.dataset.nodeId = item.id;
        button.setAttribute('aria-pressed', String(item.id === selectedChild));
        button.addEventListener('click', () => {
          selectedChild = item.id;
          draw();
          requestAnimationFrame(() => detail.querySelector(`[data-node-id="${item.id}"]`)?.focus());
        });
        choices.append(button);
      }
      detail.append(choices);
    }
  };
  const draw = () => {
    svg.replaceChildren(title);
    const rootX = 400; const rootY = 18; const rootW = 200; const rootH = 62;
    const axisY = 150; const axisH = 62;
    const axisW = Math.min(240, (920 - (graph.axes.length - 1) * 24) / graph.axes.length);
    const axisGap = graph.axes.length > 1 ? 24 : 0;
    const axisStart = (1000 - (graph.axes.length * axisW + (graph.axes.length - 1) * axisGap)) / 2;
    const axisXs = graph.axes.map((_, index) => axisStart + index * (axisW + axisGap));
    const rootCenter = rootX + rootW / 2;
    const axisCenters = axisXs.map((x) => x + axisW / 2);
    const trunkY = 112;
    path(`M ${rootCenter} ${rootY + rootH} V ${trunkY}`);
    if (axisCenters.length > 1) path(`M ${axisCenters[0]} ${trunkY} H ${axisCenters.at(-1)}`);
    for (const center of axisCenters) path(`M ${center} ${trunkY} V ${axisY}`);
    drawNode({ ...graph.root, x: rootX, y: rootY, width: rootW, height: rootH, kind: 'root', selected: !selectedAxis }, () => { selectedAxis = null; selectedChild = null; });
    graph.axes.forEach((axis, index) => drawNode({ id: axis.id, label: axis.label, lines: axis.nodeLines, x: axisXs[index], y: axisY, width: axisW, height: axisH, kind: 'axis', selected: axis.id === selectedAxis }, () => { selectedAxis = axis.id; selectedChild = null; }));
    const active = graph.axes.find((axis) => axis.id === selectedAxis);
    if (active?.children?.length) {
      const childY = 280; const gap = 18;
      const childW = Math.min(220, (920 - (active.children.length - 1) * gap) / active.children.length);
      const total = active.children.length * childW + (active.children.length - 1) * gap;
      const firstX = (1000 - total) / 2; const activeX = axisXs[graph.axes.findIndex((axis) => axis.id === active.id)];
      const midY = 244; const axisCenter = activeX + axisW / 2;
      path(`M ${axisCenter} ${axisY + axisH} V ${midY} H ${firstX + childW / 2}`);
      path(`M ${axisCenter} ${midY} H ${firstX + total - childW / 2}`);
      active.children.forEach((child, index) => {
        const x = firstX + index * (childW + gap);
        path(`M ${x + childW / 2} ${midY} V ${childY}`);
        drawNode({ id: child.id, label: child.shortLabel ?? child.title, lines: child.nodeLines, x, y: childY, width: childW, height: 62, kind: 'child', selected: child.id === selectedChild }, () => { selectedChild = child.id; });
      });
    }
    svg.setAttribute('viewBox', `0 0 1000 ${active?.children?.length ? 365 : 240}`);
    describe();
  };
  const canvas = node('div', 'survey-concept-canvas');
  canvas.append(svg);
  section.append(canvas, detail);
  root.append(section);
  draw();
}

let surveyTocObserver = null;

function markCurrent(buttons, id) {
  for (const button of buttons) {
    const on = button.dataset.target === id;
    button.classList.toggle('is-current', on);
    if (on) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  }
}

function revealInScroller(scroller, button) {
  const box = scroller.getBoundingClientRect();
  const item = button.getBoundingClientRect();
  if (item.top < box.top) scroller.scrollTop -= box.top - item.top;
  else if (item.bottom > box.bottom) scroller.scrollTop += item.bottom - box.bottom;
}

function bindSurveyToc(toc, headings) {
  surveyTocObserver?.disconnect();
  surveyTocObserver = null;
  const buttons = [...toc.querySelectorAll('button[data-target]')];
  if (!buttons.length || typeof IntersectionObserver !== 'function') return;
  const targets = headings.map((heading) => document.getElementById(heading.id)).filter(Boolean);
  if (!targets.length) return;
  const pick = () => {
    const visible = targets.filter((target) => target.dataset.surveyVisible === '1');
    const above = [...targets].reverse().find((target) => target.getBoundingClientRect().top < 96);
    const current = visible[0] ?? above ?? targets[0];
    if (!current || current.id === toc.dataset.current) return;
    toc.dataset.current = current.id;
    markCurrent(buttons, current.id);
    const button = buttons.find((item) => item.dataset.target === current.id);
    if (button) revealInScroller(toc, button);
  };
  surveyTocObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) entry.target.dataset.surveyVisible = entry.isIntersecting ? '1' : '0';
    pick();
  }, { rootMargin: '0px 0px -68% 0px', threshold: 0 });
  for (const target of targets) surveyTocObserver.observe(target);
  pick();
}

function renderReadingIntent(unit) {
  const actions = unit.readingActions ?? [];
  if (!actions.length) return null;
  const section = node('section', 'survey-reading-intent');
  section.append(node('h2', null, '带着这个问题读'));
  const list = node('ul');
  for (const item of actions) {
    const row = node('li');
    row.append(node('span', 'survey-intent-action', item.action));
    row.append(node('span', 'survey-intent-where', item.locator));
    row.append(node('span', 'survey-intent-why', item.reason));
    list.append(row);
  }
  section.append(list);
  return section;
}

function renderUnitJump(href, kicker, title, direction) {
  const anchor = link(href, '', `survey-unit-jump is-${direction}`);
  anchor.append(node('span', 'survey-unit-kicker', kicker), node('span', 'survey-unit-name', title));
  return anchor;
}

function renderUnit(article, unit, root) {
  rememberSurveyUnit(article, unit.id);
  root.append(link(hash(article.id), '← 返回整篇脉络图', 'survey-back'));
  root.append(node('p', 'survey-eyebrow', `${article.year} · ${unit.sourceSections.join(' / ')}`));
  root.append(node('h1', null, unit.title));
  root.append(node('p', 'survey-unit-lead', unit.lead));
  if (unit.graph) renderConceptMap(unit.graph, root);
  const headings = (unit.blocks ?? []).filter((block) => block.type === 'heading');
  const layout = node('div', 'survey-reader-layout');
  const toc = node('nav', 'survey-reader-toc');
  toc.setAttribute('aria-label', '本阅读单元目录');
  toc.append(node('h2', null, '本节脉络'));
  for (const heading of headings) {
    const item = node('button', null, heading.text);
    item.type = 'button';
    item.dataset.target = heading.id;
    item.addEventListener('click', () => {
      const target = document.getElementById(heading.id);
      if (!target) return;
      markCurrent([...toc.querySelectorAll('button[data-target]')], heading.id);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try { target.focus({ preventScroll: true }); } catch { /* 标题不可聚焦时仍保留滚动 */ }
    });
    toc.append(item);
  }
  const body = node('article', 'survey-reading-body');
  const intent = renderReadingIntent(unit);
  if (intent) body.append(intent);
  for (const block of unit.blocks ?? []) renderReadingBlock(block, body);
  layout.append(toc, body);
  root.append(layout);
  bindSurveyToc(toc, headings);
  const navigation = node('nav', 'survey-unit-nav');
  navigation.setAttribute('aria-label', '本篇其他阅读单元');
  const orderedIds = [...new Set([...(article.readingPaths?.[0]?.steps ?? []).map((step) => step.unitId), ...article.units.map((entry) => entry.id)])];
  const index = orderedIds.indexOf(unit.id);
  if (index >= 0) navigation.append(node('p', 'survey-unit-progress', `第 ${index + 1} / ${orderedIds.length} 部分`));
  const previous = article.units.find((entry) => entry.id === orderedIds[index - 1]);
  const next = article.units.find((entry) => entry.id === orderedIds[index + 1]);
  const links = node('div', 'survey-unit-next-links');
  if (previous) links.append(renderUnitJump(unitHash(article.id, previous.id), '上一部分', previous.title, 'prev'));
  if (next) links.append(renderUnitJump(unitHash(article.id, next.id), '下一部分', next.title, 'next'));
  navigation.append(links);
  navigation.append(link(hash(article.id), '回到图中选择其他内容', 'survey-back'));
  root.append(navigation);
}

function renderArticlePath(article, path) {
  const section = node('section', 'survey-map-path');
  section.append(node('h3', null, path.title));
  section.append(node('p', 'survey-map-purpose', path.purpose));
  const map = node('div', 'survey-path-map');
  for (const [index, step] of (path.steps ?? []).entries()) {
    const unit = article.units.find((entry) => entry.id === step.unitId);
    if (!unit) continue;
    const item = node('article', 'survey-path-node');
    item.append(node('span', 'survey-path-dot', String(index + 1).padStart(2, '0')));
    item.append(link(unitHash(article.id, unit.id), unit.title, 'survey-path-link'));
    item.append(node('p', null, step.reason));
    item.append(node('span', 'survey-path-action', step.action));
    map.append(item);
    const nextStep = path.steps[index + 1];
    if (nextStep) {
      const relation = article.unitRelations?.find((edge) => edge.from === step.unitId && edge.to === nextStep.unitId);
      const connector = node('div', `survey-path-connector${path.origin === 'editorial' ? ' is-editorial' : ''}`);
      connector.append(node('span', null, relation?.reason ?? '按当前学习目标继续阅读'));
      map.append(connector);
    }
  }
  section.append(map);
  return section;
}

function renderShelf(root) {
  root.append(node('p', 'survey-eyebrow', '研究阅读工作台 · 综述阅读'));
  root.append(node('h1', 'survey-shelf-title', '从一篇综述开始建立领域地图'));
  root.append(node('p', 'survey-shelf-intro', '从你已有的三篇综述开始。选择一篇，查看文章结构、建议读法和章节讲解；可读范围会在文章页说明。'));
  const list = node('div', 'survey-shelf');
  for (const article of SURVEYS.articles) {
    const card = node('article', 'survey-shelf-card');
    card.append(node('p', 'survey-eyebrow', article.stateLabel));
    card.append(link(hash(article.id), article.displayTitle, 'survey-shelf-card-title'));
    card.append(node('p', 'survey-shelf-meta', `${article.venue} · ${article.year}`));
    card.append(node('p', 'survey-shelf-summary', article.shelfLead ?? article.brief));
    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;
      const selected = window.getSelection?.();
      if (selected && String(selected).length > 0) return;
      card.querySelector('a')?.click();
    });
    list.append(card);
  }
  root.append(list);
  if (SURVEYS.relations?.length) {
    const graph = node('section', 'survey-library-relations');
    graph.append(node('h2', null, '综述之间的关系'));
    graph.append(node('p', null, '文章是一级节点。连线依据和两端原文位置都可展开回查；没有证据的候选保持为孤立节点。'));
    const relationList = node('div', 'survey-cross-graph');
    const connectedIds = new Set();
    for (const relation of SURVEYS.relations) {
      const from = SURVEYS.articles.find((article) => article.id === relation.fromSurveyId);
      const to = SURVEYS.articles.find((article) => article.id === relation.toSurveyId);
      if (!from || !to) continue;
      connectedIds.add(from.id); connectedIds.add(to.id);
      const item = node('article', 'survey-library-relation');
      const endpoints = node('div', 'survey-cross-edge');
      const fromNode = node('div', 'survey-cross-node');
      fromNode.append(node('span', 'survey-cross-node-type', `${from.year} · ${from.stateLabel}`), link(hash(from.id), from.displayTitle));
      const toNode = node('div', 'survey-cross-node');
      toNode.append(node('span', 'survey-cross-node-type', `${to.year} · ${to.stateLabel}`), link(hash(to.id), to.displayTitle));
      const edge = node('div', 'survey-cross-edge-label');
      edge.append(node('span', null, relation.kind === 'complements' ? '内容互补' : relation.kind));
      edge.setAttribute('aria-label', `关系：${relation.kind}`);
      endpoints.append(fromNode, edge, toNode);
      item.append(endpoints);
      const explanation = node('details', 'survey-cross-evidence');
      explanation.append(node('summary', null, '为什么有关联？查看两端依据'));
      explanation.append(node('p', null, relation.reason));
      const evidenceLinks = node('p', 'survey-relation-evidence');
      for (const unitId of relation.fromUnitIds ?? []) {
        const unit = from.units?.find((entry) => entry.id === unitId);
        if (unit) evidenceLinks.append(link(unitHash(from.id, unit.id), `来源端：${unit.title}`), node('span', null, ' · '));
      }
      for (const unitId of relation.toUnitIds ?? []) {
        const unit = to.units?.find((entry) => entry.id === unitId);
        if (unit) evidenceLinks.append(link(unitHash(to.id, unit.id), `补充端：${unit.title}`), node('span', null, ' · '));
      }
      if (evidenceLinks.childNodes.length) explanation.append(evidenceLinks);
      item.append(explanation);
      relationList.append(item);
    }
    graph.append(relationList);
    const isolates = SURVEYS.articles.filter((article) => !connectedIds.has(article.id));
    if (isolates.length) {
      const isolated = node('div', 'survey-cross-isolates');
      isolated.append(node('h3', null, '暂时独立的综述'));
      for (const article of isolates) {
        const item = node('article', 'survey-cross-node survey-isolated-node');
        item.append(node('span', 'survey-cross-node-type', `${article.year} · ${article.stateLabel}`), link(hash(article.id), article.displayTitle));
        isolated.append(item);
      }
      graph.append(isolated);
    }
    root.append(graph);
  }
  const request = node('section', 'survey-request-form-section');
  request.append(node('h2', null, '发起一份综述阅读任务'));
  request.append(node('p', null, '网站目前不直接联网检索或调用模型。填写领域、关键词或指定文章后，可复制一份有范围约束的制作任务交给 Agent。'));
  const form = node('form', 'survey-request-form');
  const modeLabel = node('label', 'survey-request-label', '输入类型');
  const mode = node('select');
  mode.name = 'mode';
  for (const [value, label] of [['topic', '领域'], ['keywords', '关键词'], ['paper', '指定文章']]) {
    const option = node('option', null, label); option.value = value; mode.append(option);
  }
  modeLabel.append(mode);
  const valueLabel = node('label', 'survey-request-label', '你想了解什么');
  const value = node('input'); value.required = true; value.maxLength = 500; value.placeholder = '例如：跨 harness 的异构 Agent 协作';
  valueLabel.append(value);
  const submit = node('button', 'survey-request-submit', '生成并复制 Agent 任务'); submit.type = 'submit';
  const result = node('div', 'survey-request-result'); result.setAttribute('aria-live', 'polite');
  form.append(modeLabel, valueLabel, submit, result);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const modeLabelText = mode.options[mode.selectedIndex]?.textContent ?? '领域';
    const prompt = `请为我的研究阅读工作台制作一份综述阅读包。\n输入类型：${modeLabelText}\n输入内容：${value.value.trim()}\n\n要求：先确认文章身份与固定版本，再核对全文、关键图表和附录；提供少量有理由的选文，不把引用量或顶刊身份单独当成质量保证。按原文结构制作章节覆盖清单、内部关系与建议读序。阅读卡只作入口，正文要保留连贯解释、分类依据、比较、例子、条件和限制，不统一压缩字数。逐条给出准确章节/页码/图表定位；区分作者原意、编辑联系和自编例子；无法核对的内容标明缺口。不要把被综述引用的研究冒充为已独立阅读。生成前先确认我的本地来源/主题约束；不要复制、上传私人 PDF 或改写个人阅读记录。`;
    result.replaceChildren(node('p', null, '任务文本已生成。'));
    const textarea = node('textarea', 'survey-request-output'); textarea.readOnly = true; textarea.value = prompt; textarea.rows = 10;
    result.append(textarea);
    try {
      await navigator.clipboard.writeText(prompt);
      result.prepend(node('p', 'survey-request-status', '已复制到剪贴板；没有启动自动检索或模型调用。'));
    } catch {
      result.prepend(node('p', 'survey-request-status', '浏览器未允许自动复制，请手动复制下方任务文本。'));
      textarea.focus(); textarea.select();
    }
  });
  request.append(form);
  root.append(request);
  const note = node('section', 'survey-request-note');
  note.append(node('h2', null, '来源与状态说明'));
  note.append(node('p', null, '三篇 PDF 均保留在本机原目录，项目不复制或托管全文。为补充解析，曾将三篇已发表/公开预印本 PDF 提交 MinerU 云端解析指定页；该接口接收完整 PDF，所选页范围限制的是解析输出，并非上传范围。未提交私人或未发表材料。三篇阅读稿均因关键图表的视觉核验未完成而保持 partial。'));
  note.append(link('#/map', '查看背景知识地图', 'survey-background-link'));
  root.append(note);
}

function renderCandidate(article, root) {
  root.append(link('#/surveys', '← 返回综述书架', 'survey-back'));
  root.append(node('p', 'survey-eyebrow', `${article.year} · ${article.state === 'candidate' ? '正文待制作' : '可读讲解 · 部分图表待核对'}`));
  root.append(node('h1', null, article.displayTitle));
  root.append(node('p', 'survey-article-title-en', article.title));
  root.append(node('p', 'survey-byline', article.venue));
  const sourceIdentity = node('details', 'survey-source-identity');
  sourceIdentity.append(node('summary', null, '来源文件与版本核对'));
  sourceIdentity.append(node('p', null, article.authors));
  sourceIdentity.append(node('p', 'survey-source-file', `本机来源文件：${article.localFileName}（保留在原目录，未复制到项目）${article.edition ? ` · 固定版本：${article.edition.versionIdentity} · PDF ${article.edition.pdfPages} 页 · SHA-256 ${article.edition.sha256.slice(0, 12)}…` : ''}`));
  root.append(sourceIdentity);

  const summary = node('section', 'survey-overview-copy');
  summary.append(node('p', null, article.brief));
  const orientation = node('details', 'survey-orientation');
  orientation.append(node('summary', null, '这篇适合怎样读，以及哪些内容尚未核对'));
  orientation.append(node('h3', null, '覆盖范围'), node('p', null, article.scope));
  orientation.append(node('h3', null, '与当前方向的关系'), node('p', null, article.relevance));
  orientation.append(node('h3', null, '范围与限制'), node('p', null, article.limits));
  summary.append(orientation);
  root.append(summary);
  renderArticleGraph(article, root);

  const outline = node('section', 'survey-coverage');
  outline.append(node('h2', null, '论文结构与覆盖状态'));
  outline.append(node('p', 'survey-coverage-status', article.state === 'complete'
    ? '下列正文与必要附录均有对应阅读单元；参考文献按索引处理。来源核查状态与个人阅读进度分开记录。'
    : article.state === 'candidate'
      ? '当前只登记了来源与目录线索，尚未开始正文讲解；章节条目不表示已读。'
      : '章节按原文顺序列出。已制作单元可以进入阅读；缺项及原文核查限制在此明确标注。'));
  const outlineDetails = node('details', 'survey-outline-details');
  outlineDetails.id = 'survey-text-navigation';
  const outlineSummary = node('summary', null, `查看作者目录与章节覆盖（${article.outline?.length ?? article.outlinePreview?.length ?? 0} 项）`);
  outlineDetails.append(outlineSummary);
  const list = node('ul', 'survey-outline-list');
  for (const section of article.outline ?? []) {
    const item = node('li', `survey-outline-item survey-disposition-${section.disposition}`);
    const heading = node('div', 'survey-outline-heading');
    heading.append(node('span', 'survey-outline-title', section.title));
    heading.append(node('span', 'survey-outline-state', section.disposition === 'taught' ? '已整理' : section.disposition === 'reference-only' ? '索引' : '待补'));
    item.append(heading, node('p', 'survey-outline-locator', section.locator ?? ''));
    if (section.reason) item.append(node('p', 'survey-outline-reason', section.reason));
    for (const unitId of section.unitIds ?? []) {
      const unit = article.units?.find((entry) => entry.id === unitId);
      if (unit) item.append(link(unitHash(article.id, unit.id), `阅读：${unit.title}`));
    }
    list.append(item);
  }
  outlineDetails.append(list);
  for (const note of article.coverage?.visualFiguresAndTables ?? []) {
    outlineDetails.append(node('p', 'survey-outline-note', note));
  }
  for (const note of article.coverage?.unresolved ?? []) {
    outlineDetails.append(node('p', 'survey-outline-note survey-outline-warning', note));
  }
  outline.append(outlineDetails);
  root.append(outline);

  if (article.units?.length) {
    const partial = node('details', 'survey-partial-reading');
    partial.append(node('summary', null, '建议读法与全部单元（文字导航）'));
    for (const path of article.readingPaths ?? []) partial.append(renderArticlePath(article, path));
    const routedUnits = new Set((article.readingPaths ?? []).flatMap((path) => (path.steps ?? []).map((step) => step.unitId)));
    const supplementalUnits = (article.units ?? []).filter((unit) => !routedUnits.has(unit.id));
    if (supplementalUnits.length) {
      const appendix = node('details', 'survey-supplemental-units');
      appendix.append(node('summary', null, `其他章节单元（${supplementalUnits.length} 个）`));
      const list = node('ul');
      for (const unit of supplementalUnits) {
        const item = node('li');
        item.append(link(unitHash(article.id, unit.id), unit.title));
        item.append(node('p', null, unit.lead));
        list.append(item);
      }
      appendix.append(list);
      partial.append(appendix);
    }
    const supportingRelations = (article.unitRelations ?? []);
    if (supportingRelations.length) {
      const relations = node('details', 'survey-relations');
      relations.append(node('summary', null, `原有读序依据（${supportingRelations.length} 条）`));
      relations.append(node('p', 'survey-relations-intro', '章节在原文中的先后与编辑建议读序分别记录；下列关系带有来源类型和理由。'));
      const relationList = node('ul');
      for (const relation of supportingRelations) {
        const from = article.units.find((unit) => unit.id === relation.from);
        const to = article.units.find((unit) => unit.id === relation.to);
        if (!from || !to) continue;
        const item = node('li', `survey-relation survey-relation-${relation.origin}`);
        const endpoints = node('div', 'survey-relation-endpoints');
        endpoints.append(link(unitHash(article.id, from.id), from.title));
        endpoints.append(node('span', 'survey-relation-kind', ` ${relation.kind} → `));
        endpoints.append(link(unitHash(article.id, to.id), to.title));
        item.append(endpoints);
        item.append(node('p', null, `${relation.reason}${relation.origin === 'editorial' ? '（编辑关系）' : `（作者关系；${relation.source}）`}`));
        relationList.append(item);
      }
      relations.append(relationList);
      partial.append(relations);
    }
    root.append(partial);
  }

  const next = node('details', 'survey-request-note');
  next.append(node('summary', null, '查看整理范围与图表缺口'));
  next.append(node('p', null, `当前已制作讲解：${article.coverage?.taughtSections?.join('、') || '尚无'}。未讲解：${article.coverage?.notYetTaught?.join('、') || '无' }。`));
  next.append(node('p', null, article.coverage?.visualFiguresAndTables?.join('；') || '关键图表已逐项核对。'));
  root.append(next);
}

export function renderSurveys(root, route = {}) {
  root.classList.add('survey-view');
  if (route.view === 'surveys') {
    renderShelf(root);
    return;
  }
  const article = SURVEYS.articles.find((item) => item.id === route.id);
  if (!article) {
    root.append(link('#/surveys', '← 返回综述书架', 'survey-back'));
    root.append(node('h1', null, '没有找到这篇综述'));
    root.append(node('p', null, '链接中的文章不存在；现有来源记录未被改写。'));
    return;
  }
  if (route.unitId) {
    const unit = article.units?.find((entry) => entry.id === route.unitId);
    if (unit) renderUnit(article, unit, root);
    else {
      root.append(link(hash(article.id), '← 返回综述信息', 'survey-back'));
      root.append(node('h1', null, '没有找到这个阅读单元'));
      root.append(node('p', null, '此单元不存在或尚未制作；文章级来源覆盖状态不受此链接影响。'));
    }
    return;
  }
  renderCandidate(article, root);
}

export { SURVEYS };
