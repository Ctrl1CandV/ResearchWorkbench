// SURVEY-013: 综述书架与候选记录。候选未读时明确展示来源状态，不生成空壳阅读图。
import { SURVEYS } from './content/surveys.js';
import { activeReadingPathForUnit, renderArticleGraph, rememberSurveyUnit, surveyMapState } from './survey-graph.js';

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

function renderUnitJump(article, href, kicker, title, direction, nextUnitId, readingPathId = null) {
  const anchor = link(href, '', `survey-unit-jump is-${direction}`);
  anchor.append(node('span', 'survey-unit-kicker', kicker), node('span', 'survey-unit-name', title));
  anchor.addEventListener('click', () => rememberSurveyUnit(article, nextUnitId, readingPathId));
  return anchor;
}

function renderUnit(article, unit, root) {
  const mapState = surveyMapState(article);
  const readingPath = activeReadingPathForUnit(article, mapState, unit.id);
  rememberSurveyUnit(article, unit.id, readingPath?.id ?? null);
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
  const orderedIds = readingPath
    ? readingPath.steps.map((step) => step.unitId)
    : article.units.map((entry) => entry.id);
  const index = orderedIds.indexOf(unit.id);
  if (index >= 0) navigation.append(node('p', 'survey-unit-progress', readingPath
    ? `建议读序：${readingPath.title} · 第 ${index + 1} / ${orderedIds.length} 节`
    : `本篇第 ${index + 1} / ${orderedIds.length} 个阅读单元`));
  const previous = article.units.find((entry) => entry.id === orderedIds[index - 1]);
  const next = article.units.find((entry) => entry.id === orderedIds[index + 1]);
  const links = node('div', 'survey-unit-next-links');
  if (previous) links.append(renderUnitJump(article, unitHash(article.id, previous.id), '上一部分', previous.title, 'prev', previous.id, readingPath?.id ?? null));
  if (next) links.append(renderUnitJump(article, unitHash(article.id, next.id), readingPath ? '读序下一节' : '下一部分', next.title, 'next', next.id, readingPath?.id ?? null));
  if (readingPath && !next) links.append(node('p', 'survey-path-finished', '这条建议读序已到最后一节；你可以回到结构图继续选择其他内容。'));
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
  root.append(node('h1', 'survey-shelf-title', '综述之间如何衔接'));
  root.append(node('p', 'survey-shelf-intro', '先按当前问题选一篇，再沿文章内部的章节关系继续阅读。点击图中的综述，查看它讲什么，以及和其他文章有什么联系。'));

  const layout = node('div', 'survey-shelf-layout');
  const graph = node('section', 'survey-cross-map');
  graph.append(node('h2', null, 'Agent 综述阅读全景'));
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 1000 460');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', '三篇 Agent 综述及其互补关系');
  const svgNode = (tag, attrs = {}, text = '') => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
    if (text) element.textContent = text;
    return element;
  };
  const positions = {
    'survey-llm-agents-arxiv-2023': { x: 36, y: 34, width: 320, height: 126, bend: -46 },
    'survey-autonomous-agents-fcs-2024': { x: 36, y: 300, width: 320, height: 126, bend: 46 },
    'survey-agent-evaluation-2026': { x: 644, y: 167, width: 320, height: 146, bend: 0 },
  };
  const selectedKey = 'research-workbench:survey-shelf:selected';
  let selectedId;
  try { selectedId = sessionStorage.getItem(selectedKey); } catch { /* Selection is optional view state. */ }
  if (!SURVEYS.articles.some((article) => article.id === selectedId)) selectedId = SURVEYS.articles[0]?.id;
  const edgeLayer = svgNode('g', { class: 'survey-cross-edges', 'aria-hidden': 'true' });
  for (const relation of SURVEYS.relations ?? []) {
    const from = positions[relation.fromSurveyId];
    const to = positions[relation.toSurveyId];
    if (!from || !to) continue;
    let pathData;
    let labelX;
    let labelY;
    if (from.x === to.x) {
      const startY = from.y < to.y ? from.y + from.height : to.y + to.height;
      const endY = from.y < to.y ? to.y : from.y;
      pathData = `M ${from.x + from.width / 2} ${startY} C ${from.x + from.width / 2 + 68} ${startY + 18}, ${from.x + from.width / 2 + 68} ${endY - 18}, ${from.x + from.width / 2} ${endY}`;
      labelX = from.x + from.width / 2;
      labelY = (startY + endY) / 2 + 5;
    } else {
      const left = from.x < to.x ? from : to;
      const right = from.x < to.x ? to : from;
      const startY = left.y + left.height / 2;
      const endY = right.y + right.height / 2;
      const offset = (from.y < to.y ? -1 : 1) * Math.max(30, Math.abs(endY - startY) * 0.44);
      pathData = `M ${left.x + left.width} ${startY} C ${left.x + left.width + 112} ${startY + offset}, ${right.x - 112} ${endY + offset}, ${right.x} ${endY}`;
      labelX = (left.x + left.width + right.x) / 2;
      labelY = (startY + endY) / 2 + offset * 0.52;
    }
    edgeLayer.append(svgNode('path', { d: pathData, class: 'survey-cross-edge-line' }));
    edgeLayer.append(svgNode('text', { x: labelX, y: labelY, class: 'survey-cross-edge-label' }, relation.displayLabel ?? '内容互补'));
  }
  svg.append(edgeLayer);

  const selectedDetails = node('aside', 'survey-cross-selection');
  const relationDetails = node('details', 'survey-relation-list');
  relationDetails.append(node('summary', null, '按文字浏览文章关系'));
  for (const relation of SURVEYS.relations ?? []) {
    const from = SURVEYS.articles.find((article) => article.id === relation.fromSurveyId);
    const to = SURVEYS.articles.find((article) => article.id === relation.toSurveyId);
    if (!from || !to) continue;
    const item = node('section', 'survey-relation-item');
    item.append(node('h3', null, `${from.year} ${from.displayTitle} · ${relation.displayLabel ?? '内容互补'} · ${to.year} ${to.displayTitle}`));
    item.append(node('p', null, relation.reason));
    const sources = node('p', 'survey-relation-evidence');
    for (const [article, ids, prefix] of [[from, relation.fromUnitIds ?? [], '前一端'], [to, relation.toUnitIds ?? [], '后一端']]) {
      for (const unitId of ids) {
        const unit = article.units?.find((entry) => entry.id === unitId);
        if (unit) {
          const evidenceLink = link(unitHash(article.id, unit.id), `${prefix}：${unit.title}`, 'survey-evidence-link');
          evidenceLink.addEventListener('click', () => rememberSurveyUnit(article, unit.id, null));
          sources.append(evidenceLink);
        }
      }
    }
    if (sources.childNodes.length) item.append(sources);
    relationDetails.append(item);
  }

  const renderSelection = () => {
    for (const button of svg.querySelectorAll('[data-survey-id]')) {
      const active = button.dataset.surveyId === selectedId;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    }
    selectedDetails.replaceChildren();
    const article = SURVEYS.articles.find((item) => item.id === selectedId);
    if (!article) return;
    selectedDetails.append(node('p', 'survey-selected-meta', `${article.year} · ${article.state === 'candidate' ? '待制作' : '部分内容已整理'}`));
    selectedDetails.append(node('h2', null, article.displayTitle));
    selectedDetails.append(node('p', 'survey-selected-summary', article.shelfLead ?? article.brief));
    selectedDetails.append(link(hash(article.id), '打开文章脉络与阅读卡 →', 'survey-selected-action'));
    const related = (SURVEYS.relations ?? []).filter((relation) => [relation.fromSurveyId, relation.toSurveyId].includes(article.id));
    if (related.length) {
      const relatedSection = node('div', 'survey-selected-relations');
      relatedSection.append(node('h3', null, '与其他综述的联系'));
      for (const relation of related) {
        const otherId = relation.fromSurveyId === article.id ? relation.toSurveyId : relation.fromSurveyId;
        const other = SURVEYS.articles.find((item) => item.id === otherId);
        if (!other) continue;
        const detail = node('details', 'survey-selected-relation');
        detail.append(node('summary', null, `${relation.displayLabel ?? '内容互补'} · ${other.year} ${other.displayTitle}`));
        detail.append(node('p', null, relation.reason));
        const sources = node('p', 'survey-relation-evidence');
        const leftArticle = SURVEYS.articles.find((item) => item.id === relation.fromSurveyId);
        const rightArticle = SURVEYS.articles.find((item) => item.id === relation.toSurveyId);
        for (const [sourceArticle, ids, prefix] of [[leftArticle, relation.fromUnitIds ?? [], '一端'], [rightArticle, relation.toUnitIds ?? [], '另一端']]) {
          for (const unitId of ids) {
            const unit = sourceArticle?.units?.find((entry) => entry.id === unitId);
            if (unit) {
              const evidenceLink = link(unitHash(sourceArticle.id, unit.id), `${prefix}章节：${unit.title}`, 'survey-evidence-link');
              evidenceLink.addEventListener('click', () => rememberSurveyUnit(sourceArticle, unit.id, null));
              sources.append(evidenceLink);
            }
          }
        }
        if (sources.childNodes.length) detail.append(sources);
        relatedSection.append(detail);
      }
      selectedDetails.append(relatedSection);
    }
  };

  for (const article of SURVEYS.articles) {
    const position = positions[article.id];
    if (!position) continue;
    const group = svgNode('g', {
      class: 'survey-cross-node', role: 'button', tabindex: 0,
      'aria-label': `${article.year} · ${article.state === 'candidate' ? '待制作' : '部分内容已整理'} · ${article.displayTitle}`,
      'aria-pressed': article.id === selectedId,
      'data-survey-id': article.id,
    });
    group.dataset.surveyId = article.id;
    group.append(svgNode('rect', { x: position.x, y: position.y, width: position.width, height: position.height, rx: 10 }));
    group.append(svgNode('text', { x: position.x + 20, y: position.y + 25, class: 'survey-cross-node-meta' },
      `${article.year} · ${article.state === 'candidate' ? '待制作' : '部分内容已整理'}`));
    const titleLines = Array.from(article.displayTitle).reduce((lines, character) => {
      if (!lines.length || Array.from(lines[lines.length - 1]).length >= 16) lines.push('');
      lines[lines.length - 1] += character;
      return lines;
    }, []);
    const title = svgNode('text', { x: position.x + 20, y: position.y + 59, class: 'survey-cross-node-title' });
    titleLines.slice(0, 2).forEach((line, index) => title.append(svgNode('tspan', { x: position.x + 20, dy: index === 0 ? 0 : 23 }, line)));
    group.append(title);
    const select = () => {
      selectedId = article.id;
      try { sessionStorage.setItem(selectedKey, selectedId); } catch { /* Selection is optional view state. */ }
      renderSelection();
    };
    group.addEventListener('click', select);
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); }
    });
    svg.append(group);
  }
  const canvas = node('div', 'survey-cross-canvas');
  canvas.append(svg);
  graph.append(canvas, node('p', 'survey-cross-legend', '虚线表示内容互补，不代表引用关系或必读先修。选择综述后，可查看关系依据及两端章节。'));
  const preview = node('div', 'survey-cross-preview-column');
  preview.append(selectedDetails, relationDetails);
  layout.append(graph, preview);
  root.append(layout);
  renderSelection();

  const background = node('p', 'survey-shelf-background');
  background.append(document.createTextNode('需要回顾 Agent 的基础发展时，'));
  background.append(link('#/map', '查看知识脉络图'));
  root.append(background);

  const request = node('details', 'survey-request-note');
  request.append(node('summary', null, '为其他主题生成综述阅读任务'));
  request.append(node('p', null, '填写领域、关键词或指定文章后，页面会生成一份可交给 Agent 的制作任务。此处不会自动检索或调用模型。'));
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
}

function renderCandidate(article, root) {
  root.append(link('#/surveys', '← 返回综述书架', 'survey-back'));
  root.append(node('p', 'survey-eyebrow', `${article.year} · ${article.state === 'candidate' ? '正文待制作' : '可读讲解 · 部分图表待核对'}`));
  root.append(node('h1', null, article.displayTitle));
  root.append(node('p', 'survey-article-title-en', article.title));
  root.append(node('p', 'survey-byline', article.venue));
  const sourceIdentity = node('details', 'survey-source-identity');
  sourceIdentity.append(node('summary', null, '原文版本信息'));
  sourceIdentity.append(node('p', null, article.authors));
  sourceIdentity.append(node('p', 'survey-source-file', `本机来源文件：${article.localFileName}（保留在原目录，未复制到项目）${article.edition ? ` · 固定版本：${article.edition.versionIdentity} · PDF ${article.edition.pdfPages} 页 · SHA-256 ${article.edition.sha256.slice(0, 12)}…` : ''}`));
  root.append(sourceIdentity);

  const summary = node('section', 'survey-overview-copy');
  summary.append(node('p', 'survey-article-lead', article.brief));
  const orientation = node('details', 'survey-orientation');
  orientation.append(node('summary', null, '阅读价值与范围'));
  orientation.append(node('h3', null, '与当前方向的关系'), node('p', null, article.relevance));
  orientation.append(node('h3', null, '覆盖主题'), node('p', null, article.scope));
  orientation.append(node('h3', null, '适用范围与局限'), node('p', null, article.limits));
  summary.append(orientation);
  root.append(summary);
  renderArticleGraph(article, root);

  const outlineDetails = node('details', 'survey-outline-details');
  outlineDetails.id = 'survey-text-navigation';
  const readSections = article.coverage?.readSections ?? [];
  const taughtSections = article.coverage?.taughtSections ?? [];
  const notYetTaught = article.coverage?.notYetTaught ?? [];
  const outlineSummary = node('summary', null, article.state === 'candidate'
    ? `查看作者目录（${article.outline?.length ?? article.outlinePreview?.length ?? 0} 项）`
    : `已核读 ${readSections.length} 项 · 站内已讲解 ${taughtSections.length} 项 · 尚未讲解 ${notYetTaught.length} 项 · 查看原文目录与覆盖范围`);
  outlineDetails.append(outlineSummary);
  if (article.state !== 'candidate' && article.coverage) {
    const coverage = node('div', 'survey-coverage-summary');
    for (const [className, label, entries] of [
      ['survey-coverage-read', '已核读范围', readSections],
      ['survey-coverage-taught', '站内已讲解', taughtSections],
      ['survey-coverage-not-yet', '尚未讲解', notYetTaught],
    ]) {
      const group = node('section', `survey-coverage-group ${className}`);
      group.append(node('h3', null, label));
      const items = node('ul', 'survey-coverage-list');
      for (const entry of entries) items.append(node('li', null, entry));
      if (!entries.length) items.append(node('li', 'survey-coverage-empty', '当前没有列项。'));
      group.append(items);
      coverage.append(group);
    }
    outlineDetails.append(coverage);
  }
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
      if (unit) {
        const unitLink = link(unitHash(article.id, unit.id), `阅读：${unit.title}`);
        unitLink.addEventListener('click', () => rememberSurveyUnit(article, unit.id, null));
        item.append(unitLink);
      }
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
  summary.append(outlineDetails);
  root.append(summary);
  root.append(sourceIdentity);
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
