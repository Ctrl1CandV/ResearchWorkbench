// SURVEY-013: 综述书架与候选记录。候选未读时明确展示来源状态，不生成空壳阅读图。
import { SURVEYS } from './content/surveys.js';
import { activeReadingPathForUnit, renderArticleGraph, rememberSurveyUnit, surveyMapState, wrapSurveyText } from './survey-graph.js';

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
let surveyReaderSize = 'standard';
let surveyReaderCleanup = null;

export function cleanupSurveyReader() {
  surveyTocObserver?.disconnect();
  surveyTocObserver = null;
  if (typeof surveyReaderCleanup === 'function') surveyReaderCleanup();
  surveyReaderCleanup = null;
  surveyReaderSize = 'standard';
}

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
  const page = node('div', 'survey-unit-page');
  page.dataset.readerSize = surveyReaderSize;
  root.append(page);
  const hero = node('header', 'survey-reader-hero');
  hero.append(
    link(hash(article.id), '← 返回整篇脉络图', 'survey-back'),
    node('p', 'survey-eyebrow', `${article.year} · ${unit.sourceSections.join(' / ')}`),
    node('h1', 'survey-unit-title', unit.title),
    node('p', 'survey-unit-lead', unit.lead),
  );
  page.append(hero);
  if (unit.graph) renderConceptMap(unit.graph, page);
  const headings = (unit.blocks ?? []).filter((block) => block.type === 'heading');
  const layout = node('div', 'survey-reader-layout');
  const rail = node('aside', 'survey-reader-rail');
  const tools = node('details', 'survey-reader-tools');
  const hasOutline = headings.length > 0;
  tools.append(node('summary', 'survey-reader-tools-summary', hasOutline ? '目录与阅读设置' : '阅读设置'));
  let toc = null;
  if (hasOutline) {
    toc = node('nav', 'survey-reader-toc');
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
        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        try { target.focus({ preventScroll: true }); } catch { /* 标题不可聚焦时仍保留滚动 */ }
        if (window.matchMedia?.('(max-width: 1100px)').matches) tools.open = false;
      });
      toc.append(item);
    }
    tools.append(toc);
  }
  const settings = node('section', 'survey-reader-settings');
  settings.append(node('p', 'survey-reader-settings-label', '阅读设置'));
  const sizeGroup = node('div', 'survey-reader-size-group');
  sizeGroup.setAttribute('role', 'group');
  sizeGroup.setAttribute('aria-label', '正文大小');
  for (const [size, label] of [['standard', '标准字号'], ['large', '放大字号']]) {
    const button = node('button', 'survey-reader-size', label);
    button.type = 'button';
    button.dataset.readerSize = size;
    button.setAttribute('aria-pressed', String(surveyReaderSize === size));
    button.addEventListener('click', () => {
      const position = captureSurveyReaderPosition(page);
      surveyReaderSize = size;
      page.dataset.readerSize = size;
      for (const option of sizeGroup.querySelectorAll('.survey-reader-size')) {
        option.setAttribute('aria-pressed', String(option.dataset.readerSize === size));
      }
      restoreSurveyReaderPosition(position);
    });
    sizeGroup.append(button);
  }
  settings.append(sizeGroup);
  const focusButton = node('button', 'survey-reader-focus-button', '专注阅读');
  focusButton.type = 'button';
  settings.append(focusButton);
  const compactTools = window.matchMedia?.('(max-width: 1100px)');
  tools.open = !(compactTools?.matches ?? false);
  tools.append(settings);
  rail.append(tools);
  const body = node('article', 'survey-reading-body');
  body.setAttribute('aria-label', '综述单元正文');
  const intent = renderReadingIntent(unit);
  if (intent) body.append(intent);
  for (const block of unit.blocks ?? []) renderReadingBlock(block, body);
  if (hasOutline) {
    layout.classList.add('has-outline');
    layout.append(rail, body);
  } else {
    rail.classList.add('is-inline');
    page.append(rail);
    layout.append(body);
  }
  const exitButton = node('button', 'survey-reader-focus-exit', '退出专注阅读');
  exitButton.type = 'button';
  page.append(layout, exitButton);
  if (hasOutline) bindSurveyToc(toc, headings);
  const setFocused = (focused, returnFocus = false) => {
    const position = captureSurveyReaderPosition(page);
    page.classList.toggle('is-reading-focus', focused);
    if (focused) exitButton.focus({ preventScroll: true });
    else if (returnFocus) {
      const compact = Boolean(window.matchMedia?.('(max-width: 1100px)').matches);
      (compact && !tools.open ? tools.querySelector('summary') : focusButton).focus({ preventScroll: true });
    }
    restoreSurveyReaderPosition(position);
  };
  focusButton.addEventListener('click', () => setFocused(true));
  exitButton.addEventListener('click', () => setFocused(false, true));
  const onKeydown = (event) => {
    if (event.key === 'Escape' && page.classList.contains('is-reading-focus')) {
      event.preventDefault();
      setFocused(false, true);
    }
  };
  window.addEventListener('keydown', onKeydown);
  const onToolsBreakpointChange = (event) => {
    // At desktop widths the summary is hidden, so the details must stay open
    // to keep the outline and reader settings reachable.
    if (!event.matches) tools.open = true;
  };
  if (compactTools?.addEventListener) compactTools.addEventListener('change', onToolsBreakpointChange);
  else compactTools?.addListener?.(onToolsBreakpointChange);
  surveyReaderCleanup = () => {
    window.removeEventListener('keydown', onKeydown);
    if (compactTools?.removeEventListener) compactTools.removeEventListener('change', onToolsBreakpointChange);
    else compactTools?.removeListener?.(onToolsBreakpointChange);
    page.classList.remove('is-reading-focus');
  };
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
  page.append(navigation);
}

function captureSurveyReaderPosition(page) {
  const readingLine = window.innerHeight * 0.4;
  const anchor = [...page.querySelectorAll(
    '.survey-reading-body > *, .survey-unit-title, .survey-unit-lead, .survey-concept-map',
  )]
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ rect }) => rect.bottom > 0 && rect.top < window.innerHeight * 0.8)
    .sort((a, b) => {
      const distance = ({ top, bottom }) => top > readingLine ? top - readingLine : bottom < readingLine ? readingLine - bottom : 0;
      return distance(a.rect) - distance(b.rect);
    })[0];
  return anchor
    ? { element: anchor.element, top: anchor.rect.top, scrollY: window.scrollY }
    : { scrollY: window.scrollY };
}

function restoreSurveyReaderPosition(position) {
  if (!position) return;
  if (position.element?.isConnected) {
    window.scrollBy(0, position.element.getBoundingClientRect().top - position.top);
  } else {
    window.scrollTo({ top: position.scrollY, behavior: 'auto' });
  }
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

const shelfUiState = {
  selectedId: null,
  query: '',
  relationByArticle: new Map(),
  relationQueryByArticle: new Map(),
  task: { expanded: false, mode: 'topic', value: '', generated: null, nextGenerationId: 0, copiedId: null, clipboardNotice: '', pendingCopyIds: new Set() },
};

const surveyStatusLabel = (article) => article.state === 'candidate' ? '正文待制作'
  : article.state === 'partial' ? '部分内容已整理' : article.stateLabel ?? '状态待核';

const surveyTaskPrompt = (mode, text) => {
  const modeLabel = { topic: '领域', keywords: '关键词', paper: '指定文章' }[mode] ?? '领域';
  return `请为我的研究阅读工作台制作一份综述阅读包。\n输入类型：${modeLabel}\n输入内容：${text}\n\n要求：先确认文章身份与固定版本，再核对全文、关键图表和附录；提供少量有理由的选文，不把引用量或顶刊身份单独当成质量保证。按原文结构制作章节覆盖清单、内部关系与建议读序。阅读卡只作入口，正文要保留连贯解释、分类依据、比较、例子、条件和限制，不统一压缩字数。逐条给出准确章节/页码/图表定位；区分作者原意、编辑联系和自编例子；无法核对的内容标明缺口。不要把被综述引用的研究冒充为已独立阅读。生成前先确认我的本地来源/主题约束；不要复制、上传私人 PDF 或改写个人阅读记录。`;
};

function renderShelf(root) {
  const articles = Array.isArray(SURVEYS.articles) ? SURVEYS.articles : [];
  const relations = Array.isArray(SURVEYS.relations) ? SURVEYS.relations : [];
  const selectedKey = 'research-workbench:survey-shelf:selected';
  const page = node('div', 'survey-shelf-page');
  page.append(node('h1', 'survey-shelf-title', '综述之间如何衔接'));
  page.append(node('p', 'survey-shelf-intro', '先选择一篇综述，了解它覆盖的范围；再按需查看它与某一篇文章之间的具体联系。文中的章节链接指向当前已整理的阅读内容。'));

  const layout = node('div', 'survey-shelf-layout');
  const catalog = node('section', 'survey-shelf-catalog');
  catalog.append(node('h2', 'survey-shelf-section-title', '选择综述'));
  const searchLabel = node('label', 'survey-shelf-search-label', '搜索综述');
  const search = node('input', 'survey-shelf-search');
  search.type = 'search'; search.maxLength = 200; search.placeholder = '输入题名、年份或主题词';
  search.setAttribute('aria-label', '搜索综述');
  search.value = shelfUiState.query;
  searchLabel.append(search);
  const count = node('p', 'survey-shelf-count'); count.setAttribute('aria-live', 'polite');
  const articleList = node('div', 'survey-shelf-list');
  catalog.append(searchLabel, count, articleList);

  const detail = node('section', 'survey-shelf-detail');
  detail.setAttribute('aria-label', '所选综述与关系');
  const selectedAnnouncement = node('p', 'survey-shelf-announcement');
  selectedAnnouncement.setAttribute('aria-live', 'polite');
  const articleContent = node('div', 'survey-shelf-article-content');
  const relationContent = node('div', 'survey-shelf-relations');
  detail.append(selectedAnnouncement, articleContent, relationContent);
  layout.append(catalog, detail);
  page.append(layout);

  const background = node('p', 'survey-shelf-background');
  background.append(document.createTextNode('需要回顾 Agent 的基础发展时，'));
  background.append(link('#/map', '查看知识脉络图'));
  page.append(background);

  const task = shelfUiState.task;
  const request = node('details', 'survey-request-note'); request.open = task.expanded;
  request.append(node('summary', null, '想了解其他领域？生成综述阅读任务'));
  request.append(node('p', 'survey-request-intro', '按领域、关键词或指定文章准备一份可交给 Agent 的制作任务；需要你自行复制并执行。此处不会自动检索或调用模型。'));
  const form = node('form', 'survey-request-form');
  const modeGroup = node('fieldset', 'survey-request-modes');
  modeGroup.append(node('legend', null, '输入方式'));
  const modes = [['topic', '领域'], ['keywords', '关键词'], ['paper', '指定文章']];
  for (const [modeValue, labelText] of modes) {
    const label = node('label', 'survey-request-mode');
    const radio = node('input'); radio.type = 'radio'; radio.name = 'survey-request-mode'; radio.value = modeValue; radio.checked = task.mode === modeValue;
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      task.mode = modeValue;
      input.placeholder = modeValue === 'keywords' ? '例如：长期记忆、工具调用、评测'
        : modeValue === 'paper' ? '输入文章题名、DOI 或公开链接' : '例如：多模态 Agent';
      renderTaskPreview();
    });
    label.append(radio, document.createTextNode(labelText)); modeGroup.append(label);
  }

  const inputLabel = node('label', 'survey-request-label', '你想了解什么');
  const input = node('input', 'survey-request-input'); input.type = 'text'; input.required = true; input.maxLength = 500;
  input.placeholder = task.mode === 'keywords' ? '例如：长期记忆、工具调用、评测'
    : task.mode === 'paper' ? '输入文章题名、DOI 或公开链接' : '例如：多模态 Agent';
  input.value = task.value;
  inputLabel.append(input);
  const inputMeta = node('div', 'survey-request-input-meta');
  const validation = node('span', 'survey-request-validation');
  const length = node('span', 'survey-request-length', `${task.value.length} / 500`);
  inputMeta.append(validation, length);
  input.addEventListener('input', () => {
    task.value = input.value;
    length.textContent = `${task.value.length} / 500`;
    validation.textContent = '';
    renderTaskPreview();
  });

  const generate = node('button', 'survey-request-generate', '生成任务预览'); generate.type = 'submit';
  const result = node('div', 'survey-request-result');
  const clipboardStatus = node('p', 'survey-request-clipboard-status'); clipboardStatus.setAttribute('aria-live', 'polite');
  form.append(modeGroup, inputLabel, inputMeta, generate, clipboardStatus, result);
  request.addEventListener('toggle', () => { task.expanded = request.open; });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const cleanValue = String(input.value ?? '').trim();
    if (!cleanValue) {
      validation.textContent = '请先填写领域、关键词或文章题名。';
      input.focus();
      return;
    }
    task.value = input.value;
    const id = ++task.nextGenerationId;
    task.generated = { id, mode: task.mode, value: cleanValue, text: surveyTaskPrompt(task.mode, cleanValue) };
    task.copiedId = null;
    task.clipboardNotice = '';
    clipboardStatus.textContent = '';
    renderTaskPreview();
  });
  request.append(form);
  page.append(request);
  root.append(page);

  function renderArticleList() {
    articleList.replaceChildren();
    const query = shelfUiState.query.trim().toLocaleLowerCase();
    const filtered = articles.filter((article) => [article.displayTitle, article.title, article.shelfLead, article.brief, article.scope, article.year, article.id]
      .filter(Boolean).join(' ').toLocaleLowerCase().includes(query));
    count.textContent = query ? `匹配 ${filtered.length} / 共 ${articles.length} 篇` : `共 ${articles.length} 篇`;
    if (query && !filtered.some((article) => article.id === shelfUiState.selectedId)) {
      const note = node('p', 'survey-shelf-filter-note');
      note.append(node('span', null, '当前选中的综述不在搜索结果中。'));
      const clear = node('button', 'survey-shelf-clear-search', '清除搜索并定位到当前选择'); clear.type = 'button';
      clear.addEventListener('click', () => {
        search.value = ''; shelfUiState.query = ''; renderArticleList();
        const selected = Array.from(articleList.childNodes).find((item) => item.dataset?.surveyId === shelfUiState.selectedId);
        selected?.scrollIntoView?.({ block: 'nearest' });
        selected?.focus?.();
      });
      note.append(clear); articleList.append(note);
    }
    for (const article of filtered) {
      const title = article.displayTitle ?? article.title ?? '题名待补';
      const choice = node('button', 'survey-shelf-choice'); choice.type = 'button';
      choice.dataset.surveyId = article.id;
      choice.setAttribute('aria-pressed', String(article.id === shelfUiState.selectedId));
      choice.append(node('span', 'survey-shelf-choice-meta', `${article.year ?? '年份待核'} · ${surveyStatusLabel(article)}`));
      choice.append(node('strong', 'survey-shelf-choice-title', title));
      choice.append(node('span', 'survey-shelf-choice-summary', article.shelfLead ?? article.brief ?? '简介待补。'));
      choice.addEventListener('click', () => chooseArticle(article.id));
      articleList.append(choice);
    }
    if (filtered.length === 0) articleList.append(node('p', 'survey-shelf-empty', '没有找到匹配的综述。请更换关键词或清除搜索。'));
  }

  function renderArticleDetails() {
    articleContent.replaceChildren(); relationContent.replaceChildren();
    const article = articles.find((item) => item.id === shelfUiState.selectedId);
    if (!article) {
      articleContent.append(node('p', 'survey-shelf-empty', '当前还没有可展示的综述。'));
      selectedAnnouncement.textContent = '';
      return;
    }
    const title = article.displayTitle ?? article.title ?? '题名待补';
    selectedAnnouncement.textContent = `已选择：${title}`;
    articleContent.append(node('p', 'survey-selected-meta', `${article.year ?? '年份待核'} · ${surveyStatusLabel(article)}`));
    articleContent.append(node('h2', 'survey-selected-title', title));
    articleContent.append(node('p', 'survey-selected-summary', article.shelfLead ?? article.brief ?? '简介待补。'));
    if (article.scope) {
      articleContent.append(node('p', 'survey-selected-scope-label', '内容范围'));
      articleContent.append(node('p', 'survey-selected-scope', article.scope));
    }
    const isCandidate = article.state === 'candidate' || !article.units?.length;
    articleContent.append(link(hash(article.id), isCandidate ? '查看来源与待制作说明 →' : '进入这篇综述 →', 'survey-selected-action'));

    const validRelations = relations.filter((relation) => {
      const ids = [relation.fromSurveyId, relation.toSurveyId];
      return ids.includes(article.id) && ids[0] !== ids[1] && ids.every((id) => articles.some((item) => item.id === id));
    });
    const neighbors = [];
    const seen = new Set();
    for (const relation of validRelations) {
      const otherId = relation.fromSurveyId === article.id ? relation.toSurveyId : relation.fromSurveyId;
      if (!seen.has(otherId)) { seen.add(otherId); neighbors.push(articles.find((item) => item.id === otherId)); }
    }
    const relationSection = node('section', 'survey-selected-relations');
    relationSection.append(node('h3', 'survey-shelf-section-title', '与其他综述的联系'));
    if (!neighbors.length) {
      relationSection.append(node('p', 'survey-shelf-empty', '尚未整理与其他综述的联系；这不表示领域内不存在相关工作。'));
      relationContent.append(relationSection);
      return;
    }
    const neighborLabel = node('label', 'survey-relation-select-label', `关联综述 · 共 ${neighbors.length} 篇`);
    const neighborSelect = node('select', 'survey-relation-select'); neighborSelect.setAttribute('aria-label', '选择关联综述');
    let relationQuery = shelfUiState.relationQueryByArticle.get(article.id) ?? '';
    let visibleNeighbors = neighbors;
    if (neighbors.length > 8) {
      const relationSearchLabel = node('label', 'survey-relation-search-label', '搜索关联综述');
      const relationSearch = node('input', 'survey-relation-search'); relationSearch.type = 'search';
      relationSearch.placeholder = '输入关联综述题名'; relationSearch.value = relationQuery;
      relationSearch.setAttribute('aria-label', '搜索关联综述');
      relationSearchLabel.append(relationSearch);
      relationSection.append(relationSearchLabel);
      relationSearch.addEventListener('input', () => {
        relationQuery = relationSearch.value;
        shelfUiState.relationQueryByArticle.set(article.id, relationQuery);
        renderArticleDetails();
        const nextSearch = relationContent.querySelector?.('.survey-relation-search');
        if (nextSearch) { nextSearch.focus(); nextSearch.value = relationQuery; }
      });
    }
    const normalizedRelationQuery = relationQuery.trim().toLocaleLowerCase();
    if (normalizedRelationQuery) {
      visibleNeighbors = neighbors.filter((neighbor) => {
        const labels = validRelations.filter((relation) => [relation.fromSurveyId, relation.toSurveyId].includes(neighbor.id)).map((relation) => relation.displayLabel);
        return [neighbor.displayTitle, neighbor.title, neighbor.year, ...labels].filter(Boolean).join(' ').toLocaleLowerCase().includes(normalizedRelationQuery);
      });
    }
    const rememberedId = shelfUiState.relationByArticle.get(article.id);
    const selectedNeighborId = visibleNeighbors.some((item) => item.id === rememberedId) ? rememberedId : visibleNeighbors[0]?.id ?? null;
    if (selectedNeighborId) shelfUiState.relationByArticle.set(article.id, selectedNeighborId);
    for (const neighbor of visibleNeighbors) {
      const option = node('option', null, `${neighbor.year ?? '年份待核'} · ${neighbor.displayTitle ?? neighbor.title ?? '题名待补'}`);
      option.value = neighbor.id; option.selected = neighbor.id === selectedNeighborId; neighborSelect.append(option);
    }
    if (neighbors.length > 8 && normalizedRelationQuery) {
      relationSection.append(node('p', 'survey-relation-match-count', `匹配 ${visibleNeighbors.length} / ${neighbors.length} 篇`));
    }
    neighborSelect.disabled = visibleNeighbors.length === 0;
    neighborLabel.append(neighborSelect);
    relationSection.append(neighborLabel);
    const pairDetail = node('div', 'survey-relation-pair');

    function renderPair(neighborId) {
      pairDetail.replaceChildren();
      const neighbor = articles.find((item) => item.id === neighborId);
      if (!neighbor) return;
      pairDetail.append(node('h4', 'survey-relation-pair-title', neighbor.displayTitle ?? neighbor.title ?? '题名待补'));
      const pairRelations = validRelations.filter((relation) =>
        [relation.fromSurveyId, relation.toSurveyId].includes(neighbor.id));
      for (const relation of pairRelations) {
        const edge = node('article', 'survey-relation-card');
        edge.append(node('p', 'survey-relation-kind', `${relation.displayLabel ?? '内容关系'} · ${relation.origin === 'editorial' ? '编辑整理的联系' : relation.origin === 'citation' ? '依据原文引用' : '关系性质未标明'}`));
        edge.append(node('p', 'survey-relation-reason', relation.reason ?? '关系说明待补。'));
        const from = articles.find((item) => item.id === relation.fromSurveyId);
        const to = articles.find((item) => item.id === relation.toSurveyId);
        const currentIsFrom = relation.fromSurveyId === article.id;
        const currentUnitIds = currentIsFrom ? relation.fromUnitIds ?? [] : relation.toUnitIds ?? [];
        const neighborUnitIds = currentIsFrom ? relation.toUnitIds ?? [] : relation.fromUnitIds ?? [];
        const sides = node('div', 'survey-relation-sides');
        for (const [sideArticle, ids, labelText] of [[article, currentUnitIds, '当前综述'], [neighbor, neighborUnitIds, '关联综述']]) {
          const side = node('section', 'survey-relation-side');
          side.append(node('h5', null, `${labelText} · ${sideArticle.displayTitle ?? sideArticle.title ?? '题名待补'}`));
          const units = (ids ?? []).map((id) => sideArticle.units?.find((unit) => unit.id === id)).filter(Boolean);
          if (!units.length) side.append(node('p', 'survey-relation-no-unit', ids?.length ? '章节编号未能解析，暂不提供链接。' : '章节入口尚未整理。'));
          for (const unit of units) {
            const unitLink = link(unitHash(sideArticle.id, unit.id), unit.title, 'survey-evidence-link');
            unitLink.addEventListener('click', () => rememberSurveyUnit(sideArticle, unit.id, null));
            side.append(unitLink);
          }
          sides.append(side);
        }
        edge.append(sides);
        edge.append(link(hash(neighbor.id), '打开关联综述', 'survey-relation-open'));
        const switchButton = node('button', 'survey-relation-switch', '切换到这篇'); switchButton.type = 'button';
        switchButton.addEventListener('click', () => chooseArticle(neighbor.id, { reveal: true }));
        edge.append(switchButton);
        pairDetail.append(edge);
      }
    }

    neighborSelect.value = selectedNeighborId;
    neighborSelect.addEventListener('change', () => {
      shelfUiState.relationByArticle.set(article.id, neighborSelect.value);
      renderPair(neighborSelect.value);
    });
    if (selectedNeighborId) renderPair(selectedNeighborId);
    else pairDetail.append(node('p', 'survey-shelf-empty', '没有匹配的关联综述。'));
    relationSection.append(pairDetail);
    relationContent.append(relationSection);
  }

  function chooseArticle(id, { reveal = false } = {}) {
    if (!articles.some((item) => item.id === id)) return;
    shelfUiState.selectedId = id;
    try { sessionStorage.setItem(selectedKey, id); } catch { /* Only a convenience selection; storage is optional. */ }
    const clearedQuery = reveal && Boolean(shelfUiState.query);
    if (clearedQuery) { shelfUiState.query = ''; search.value = ''; }
    renderArticleList();
    renderArticleDetails();
    if (reveal) {
      const selectedButton = Array.from(articleList.childNodes).find((item) => item.dataset?.surveyId === id);
      selectedButton?.scrollIntoView?.({ block: 'nearest' });
      selectedButton?.focus?.();
      if (clearedQuery) selectedAnnouncement.textContent = `已切换到：${articles.find((item) => item.id === id)?.displayTitle ?? id}；已清除综述搜索。`;
    }
  }

  search.addEventListener('input', () => { shelfUiState.query = search.value; renderArticleList(); });
  if (!articles.some((item) => item.id === shelfUiState.selectedId)) {
    let restoredId = null;
    try { restoredId = sessionStorage.getItem(selectedKey); } catch { /* Optional view state. */ }
    shelfUiState.selectedId = articles.some((item) => item.id === restoredId) ? restoredId : articles[0]?.id ?? null;
  }
  renderArticleList(); renderArticleDetails();

  function renderTaskPreview() {
    result.replaceChildren();
    const generated = task.generated;
    if (!generated) { clipboardStatus.textContent = task.clipboardNotice; return; }
    const isCurrent = generated.mode === task.mode && generated.value === String(input.value ?? '').trim();
    const status = node('p', 'survey-request-status', isCurrent
      ? task.copiedId === generated.id ? `第 ${generated.id} 版任务已复制；可重新生成新的预览。` : '任务已生成，尚未复制。'
      : '输入已修改，请重新生成当前预览后再复制。');
    result.append(node('h3', 'survey-request-preview-title', '任务预览'), status);
    const textarea = node('textarea', 'survey-request-output'); textarea.readOnly = true; textarea.value = generated.text; textarea.rows = 8;
    result.append(textarea);
    const actions = node('div', 'survey-request-result-actions');
    const pending = task.pendingCopyIds.has(generated.id);
    const copy = node('button', 'survey-request-copy', pending ? '正在复制…' : task.copiedId === generated.id ? '已复制' : '复制任务');
    copy.type = 'button'; copy.disabled = !isCurrent || pending || task.copiedId === generated.id;
    copy.addEventListener('click', async () => {
      if (!isCurrent || task.copiedId === generated.id || task.pendingCopyIds.has(generated.id)) return;
      const snapshot = { id: generated.id, text: generated.text };
      task.pendingCopyIds.add(snapshot.id);
      copy.disabled = true; copy.textContent = '正在复制…';
      let copied = false;
      try {
        if (typeof navigator === 'undefined' || typeof navigator.clipboard?.writeText !== 'function') throw new Error('clipboard unavailable');
        await navigator.clipboard.writeText(snapshot.text);
        const latestId = task.generated?.id;
        const stillCurrent = latestId === snapshot.id
          && task.mode === generated.mode
          && String(input.value ?? '').trim() === generated.value;
        copied = true;
        if (stillCurrent) task.copiedId = snapshot.id;
        task.clipboardNotice = stillCurrent
          ? '已复制当前任务文本，请在 Agent 中自行执行。'
          : latestId === snapshot.id
            ? `第 ${snapshot.id} 版已复制；当前输入已修改，预览仍需重新生成。`
            : `上一版任务（第 ${snapshot.id} 版）已复制；当前预览为第 ${latestId ?? '—'} 版，剪贴板内容仍是上一版。`;
        if (stillCurrent) status.textContent = task.clipboardNotice;
      } catch {
        const latestId = task.generated?.id;
        const stillCurrent = latestId === snapshot.id
          && task.mode === generated.mode
          && String(input.value ?? '').trim() === generated.value;
        task.clipboardNotice = stillCurrent
          ? '未能自动复制，可选择下方任务文本手动复制。'
          : `上一版任务（第 ${snapshot.id} 版）未能自动复制；当前预览未改变，请使用当前预览，或重新生成原内容后复制。`;
        if (stillCurrent) { textarea.focus(); textarea.select(); }
      }
      task.pendingCopyIds.delete(snapshot.id);
      clipboardStatus.textContent = task.clipboardNotice;
      const stillShown = task.generated?.id === snapshot.id
        && task.mode === generated.mode
        && String(input.value ?? '').trim() === generated.value;
      if (stillShown) {
        copy.disabled = copied || !stillCurrentSnapshot();
        copy.textContent = copied ? '已复制' : '重试复制';
        if (!copied) status.textContent = task.clipboardNotice;
      }
    });
    const selectText = node('button', 'survey-request-select-text', '选择文本手动复制'); selectText.type = 'button';
    selectText.addEventListener('click', () => { textarea.focus(); textarea.select(); });
    actions.append(copy, selectText); result.append(actions);
    clipboardStatus.textContent = task.clipboardNotice;
  }

  function stillCurrentSnapshot() {
    const generated = task.generated;
    return Boolean(generated && generated.mode === task.mode && generated.value === String(input.value ?? '').trim());
  }

  input.addEventListener('input', renderTaskPreview);
  renderTaskPreview();
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
