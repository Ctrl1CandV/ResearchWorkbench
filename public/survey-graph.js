// Whole-article navigation. The map holds references, never a second copy of the body.
const SVG = 'http://www.w3.org/2000/svg';
const el = (tag, cls, text) => {
  const element = document.createElement(tag);
  if (cls) element.className = cls;
  if (text != null) element.textContent = text;
  return element;
};
const svgEl = (tag, attrs = {}, text) => {
  const element = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  if (text != null) element.textContent = text;
  return element;
};
const button = (label, action, cls = '') => {
  const result = el('button', cls, label);
  result.type = 'button'; result.addEventListener('click', action);
  return result;
};
export const surveyUnitUrl = (articleId, unitId) => `#/survey/${encodeURIComponent(articleId)}/unit/${encodeURIComponent(unitId)}`;

export function validateTopicMap(article) {
  const errors = [];
  if (!article.topicMap) {
    if (article.units?.length) errors.push('readable article requires a whole-article map');
    return errors;
  }
  if (article.state === 'candidate') errors.push('candidate cannot publish a reading map');
  const units = new Set((article.units ?? []).map((unit) => unit.id));
  const groups = new Set(); const mapped = new Set();
  if (!article.topicMap.title?.trim() || !article.topicMap.intro?.trim()) errors.push('map requires title and introduction');
  for (const group of article.topicMap.groups ?? []) {
    if (!group.id || groups.has(group.id)) errors.push('missing or duplicate map group');
    groups.add(group.id);
    if (!group.label?.trim() || !group.items?.length) errors.push(`empty group ${group.id}`);
    for (const item of group.items ?? []) {
      if (!units.has(item.unitId)) errors.push(`unknown map unit ${item.unitId}`);
      if (mapped.has(item.unitId)) errors.push(`duplicate map unit ${item.unitId}`);
      if (!item.label?.trim() || !item.section?.trim()) errors.push(`unlabelled map unit ${item.unitId}`);
      mapped.add(item.unitId);
    }
  }
  for (const id of units) if (!mapped.has(id)) errors.push(`unreachable map unit ${id}`);
  for (const edge of article.topicMap.relations ?? []) {
    if (!mapped.has(edge.from) || !mapped.has(edge.to)) errors.push('unknown relation endpoint');
    if (!edge.label?.trim() || !edge.reason?.trim()) errors.push('relation requires label and reason');
    if (!['author', 'editorial'].includes(edge.origin)) errors.push('relation requires provenance');
    if (edge.origin === 'author' && !edge.source?.trim()) errors.push('author relation requires source');
  }
  return errors;
}

export function articleGraphModel(article, collapsed = []) {
  const groups = article.topicMap?.groups ?? [];
  const nodes = groups.flatMap((group, column) => group.items.map((item, row) => ({
    ...item, groupId: group.id, column, row, unit: article.units.find((unit) => unit.id === item.unitId),
    visible: !collapsed.includes(group.id), x: column * 306 + 34, y: row * 108 + 190, width: 244, height: 84,
  })));
  const steps = article.readingPaths?.[0]?.steps ?? [];
  const reading = steps.slice(1).map((step, i) => ({
    from: steps[i].unitId, to: step.unitId, label: '建议接着读', origin: 'editorial', kind: 'reading', reason: step.reason,
  }));
  return {
    groups, nodes, relations: (article.topicMap?.relations ?? []).map((edge) => ({ ...edge, kind: 'relation' })), reading,
    width: groups.length * 306 + 6,
    height: Math.max(1, ...groups.map((group) => collapsed.includes(group.id) ? 0 : group.items.length)) * 108 + 205,
  };
}

export function normalizeMapState(article, saved = {}) {
  const groups = article.topicMap.groups;
  const ids = new Set(article.units.map((unit) => unit.id));
  return {
    selected: ids.has(saved.selected) ? saved.selected : article.readingPaths?.[0]?.steps[0]?.unitId ?? article.units[0].id,
    collapsed: Array.isArray(saved.collapsed) ? saved.collapsed.filter((id) => groups.some((g) => g.id === id)) : groups.filter((g) => g.collapsed).map((g) => g.id),
    zoom: Number.isFinite(saved.zoom) ? Math.max(0.65, Math.min(1.8, saved.zoom)) : 1,
    relations: saved.relations !== false, reading: saved.reading === true,
    scrollLeft: Number.isFinite(saved.scrollLeft) ? Math.max(0, saved.scrollLeft) : 0,
    scrollTop: Number.isFinite(saved.scrollTop) ? Math.max(0, saved.scrollTop) : 0,
  };
}

export function rememberSurveyUnit(article, unitId) {
  if (!article.topicMap) return;
  try {
    const key = `survey-map-v1:${article.id}`;
    const raw = JSON.parse(sessionStorage.getItem(key) || '{}');
    const state = normalizeMapState(article, raw && typeof raw === 'object' ? raw : {});
    state.selected = unitId;
    const parent = article.topicMap.groups.find((group) => group.items.some((item) => item.unitId === unitId));
    state.collapsed = state.collapsed.filter((id) => id !== parent?.id);
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch { /* Navigation still works if session storage is unavailable. */ }
}

export function renderArticleGraph(article, root) {
  if (!article.topicMap || !article.units?.length) return;
  const storageKey = `survey-map-v1:${article.id}`;
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}'); } catch { /* Storage is optional. */ }
  let state = normalizeMapState(article, saved && typeof saved === 'object' ? saved : {});
  const persist = () => { try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* No reading progress is stored. */ } };
  const section = el('section', 'survey-atlas'); section.id = 'survey-atlas';
  section.append(el('h2', null, '整篇脉络图'), el('p', 'survey-atlas-intro', article.topicMap.intro));
  const toolbar = el('div', 'survey-atlas-toolbar'); toolbar.setAttribute('aria-label', '脉络图控制');
  const viewport = el('div', 'survey-atlas-viewport');
  viewport.tabIndex = 0; viewport.setAttribute('role', 'region'); viewport.setAttribute('aria-label', '整篇脉络画布，可拖动或用方向键平移');
  const svg = svgEl('svg', { role: 'group', 'aria-label': article.topicMap.title });
  const details = el('div', 'survey-atlas-detail');
  const status = el('p', 'survey-atlas-status'); status.setAttribute('role', 'status');
  const searchLabel = el('label', 'survey-atlas-search');
  searchLabel.append(el('span', null, '找内容'));
  const search = el('input'); search.type = 'search'; search.placeholder = '如：记忆、工具、评测';
  searchLabel.append(search);
  const searchResults = el('div', 'survey-atlas-search-results');
  let model;
  const locate = (id, moveFocus = false) => {
    const group = article.topicMap.groups.find((g) => g.items.some((item) => item.unitId === id));
    if (!group) return;
    state.selected = id; state.collapsed = state.collapsed.filter((g) => g !== group.id);
    persist(); draw();
    const target = Array.from(svg.querySelectorAll('[data-unit-id]')).find((item) => item.dataset.unitId === id);
    if (target) {
      const rect = target.getBoundingClientRect(); const outer = viewport.getBoundingClientRect();
      viewport.scrollLeft += rect.left - outer.left - (outer.width - rect.width) / 2;
      viewport.scrollTop += rect.top - outer.top - (outer.height - rect.height) / 2;
      if (moveFocus) target.focus({ preventScroll: true });
    }
  };
  const toggle = (label, key) => {
    const wrapper = el('label', 'survey-atlas-toggle');
    const input = el('input'); input.type = 'checkbox'; input.checked = state[key];
    input.addEventListener('change', () => { state[key] = input.checked; persist(); draw(); });
    wrapper.append(input, el('span', null, label)); return wrapper;
  };
  const zoomLabel = el('output', 'survey-atlas-zoom'); zoomLabel.setAttribute('aria-label', '图谱缩放比例');
  const changeZoom = (delta) => { state.zoom = Math.max(.65, Math.min(1.8, state.zoom + delta)); persist(); draw(); };
  const fit = button('恢复全图', () => {
    state.zoom = 1; state.collapsed = article.topicMap.groups.filter((g) => g.collapsed).map((g) => g.id);
    // Keep the selected item visible after returning from a supplemental chapter.
    const selectedGroup = article.topicMap.groups.find((g) => g.items.some((n) => n.unitId === state.selected));
    state.collapsed = state.collapsed.filter((id) => id !== selectedGroup?.id);
    viewport.scrollTo(0, 0); state.scrollLeft = 0; state.scrollTop = 0; persist(); draw();
  });
  toolbar.append(searchLabel, button('文字目录', () => {
    const navigation = document.getElementById('survey-text-navigation');
    if (navigation) { navigation.open = true; navigation.scrollIntoView({ block: 'start' }); navigation.querySelector('summary')?.focus(); }
  }), button('展开全部', () => { state.collapsed = []; persist(); draw(); }), fit,
    button('−', () => changeZoom(-.15), 'survey-zoom-out'), zoomLabel, button('+', () => changeZoom(.15), 'survey-zoom-in'));
  toolbar.querySelector('.survey-zoom-out').setAttribute('aria-label', '缩小脉络图');
  toolbar.querySelector('.survey-zoom-in').setAttribute('aria-label', '放大脉络图');
  const layers = el('div', 'survey-atlas-layers');
  layers.append(el('span', 'survey-atlas-legend', '实线：主题包含'), toggle('虚线：选中节点的联系', 'relations'), toggle('点线：建议读序', 'reading'));
  viewport.append(svg);
  section.append(toolbar, searchResults, layers, viewport, status, details);
  root.append(section);
  const anchor = (id, label) => { const a = el('a', null, label); a.href = surveyUnitUrl(article.id, id); return a; };
  const relatedEdges = () => [ ...(state.relations ? model.relations : []), ...(state.reading ? model.reading : []) ]
    .filter((edge) => edge.from === state.selected || edge.to === state.selected);
  const select = (id) => { state.selected = id; persist(); draw(); svg.querySelector(`[data-unit-id="${id}"]`)?.focus({ preventScroll: true }); };
  const draw = () => {
    model = articleGraphModel(article, state.collapsed);
    svg.replaceChildren(svgEl('title', {}, article.topicMap.title));
    svg.setAttribute('viewBox', `0 0 ${model.width} ${model.height}`);
    svg.style.width = `${state.zoom * 100}%`;
    svg.style.minWidth = `${Math.min(900, model.width) * state.zoom}px`;
    zoomLabel.value = `${Math.round(state.zoom * 100)}%`;
    const defs = svgEl('defs');
    for (const kind of ['relation', 'reading']) {
      const marker = svgEl('marker', { id: `survey-arrow-${kind}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' });
      marker.append(svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: `survey-atlas-arrow-${kind}` })); defs.append(marker);
    }
    svg.append(defs);
    const center = model.width / 2;
    svg.append(svgEl('rect', { x: center - 150, y: 15, width: 300, height: 42, rx: 6, class: 'survey-atlas-root' }),
      svgEl('text', { x: center, y: 42, 'text-anchor': 'middle', class: 'survey-atlas-root-text' }, article.topicMap.title));
    const edges = relatedEdges();
    const neighbors = new Set(edges.flatMap((edge) => [edge.from, edge.to]));
    model.groups.forEach((group, column) => {
      const x = column * 306 + 34;
      const closed = state.collapsed.includes(group.id);
      svg.append(svgEl('path', { d: `M ${center} 57 V 77 H ${x + 122} V 98`, class: 'survey-atlas-contains' }));
      const heading = svgEl('g', { class: 'survey-atlas-group', role: 'button', tabindex: 0, 'aria-label': `${closed ? '展开' : '收起'}${group.label}`, 'aria-expanded': !closed, 'data-group-id': group.id });
      heading.append(svgEl('rect', { x, y: 98, width: 244, height: 65, rx: 6 }),
        svgEl('text', { x: x + 16, y: 124, class: 'survey-atlas-group-title' }, group.label),
        svgEl('text', { x: x + 16, y: 147, class: 'survey-atlas-group-subtitle' }, `${group.subtitle} · ${group.items.length} 节`),
        svgEl('text', { x: x + 220, y: 124, 'text-anchor': 'middle' }, closed ? '+' : '−'));
      const activate = () => {
        state.collapsed = closed ? state.collapsed.filter((id) => id !== group.id) : [...state.collapsed, group.id];
        persist(); draw(); svg.querySelector(`[data-group-id="${group.id}"]`)?.focus();
      };
      heading.addEventListener('click', activate);
      heading.addEventListener('keydown', (event) => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); activate(); } });
      svg.append(heading);
      if (!closed) for (const item of model.nodes.filter((n) => n.groupId === group.id)) {
        svg.append(svgEl('path', { d: `M ${x + 8} 163 H ${x - 16} V ${item.y + 42} H ${x}`, class: 'survey-atlas-contains' }));
      }
    });
    const paths = svgEl('g', { class: 'survey-atlas-relationships' });
    const badges = svgEl('g');
    edges.forEach((edge, index) => {
      const from = model.nodes.find((n) => n.unitId === edge.from && n.visible);
      const to = model.nodes.find((n) => n.unitId === edge.to && n.visible);
      if (!from || !to) return;
      // Route through gutters, never through another chapter's text.
      const sx = from.x + from.width, sy = from.y + 42, tx = to.x + to.width, ty = to.y + 42;
      const laneA = sx + 12 + index * 4, laneB = tx + 12 + index * 4, top = 174 + index * 3;
      const d = from.column === to.column ? `M ${sx} ${sy} H ${laneA} V ${ty} H ${tx}`
        : `M ${sx} ${sy} H ${laneA} V ${top} H ${laneB} V ${ty} H ${tx}`;
      const path = svgEl('path', { d, class: `survey-atlas-edge survey-atlas-edge-${edge.kind}`, 'marker-end': `url(#survey-arrow-${edge.kind})` });
      path.append(svgEl('title', {}, `${edge.label}：${edge.reason}`)); paths.append(path);
      const badge = svgEl('g', { class: `survey-atlas-edge-badge survey-atlas-edge-badge-${edge.kind}`, role: 'button', tabindex: 0, 'aria-label': `关系 ${index + 1}：${edge.label}，查看依据` });
      const outgoingIndex = edges.slice(0, index).filter((item) => item.from === edge.from).length;
      const bx = laneA, by = sy - 30 + outgoingIndex * 22;
      badge.append(svgEl('circle', { cx: bx, cy: by, r: 9 }), svgEl('text', { x: bx, y: by + 4, 'text-anchor': 'middle' }, index + 1));
      const showReason = () => {
        const row = details.querySelector(`[data-edge-index="${index}"]`);
        row?.scrollIntoView({ block: 'nearest' }); row?.focus({ preventScroll: true });
      };
      badge.addEventListener('click', showReason);
      badge.addEventListener('keydown', (event) => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); showReason(); } });
      badges.append(badge);
    });
    svg.append(paths);
    for (const item of model.nodes.filter((n) => n.visible)) {
      const selected = item.unitId === state.selected;
      const group = svgEl('g', { class: `survey-atlas-node${selected ? ' is-selected' : ''}${neighbors.has(item.unitId) ? ' is-related' : ''}`,
        role: 'button', tabindex: 0, 'aria-label': `${item.section} ${item.label}，查看内容与联系`, 'aria-pressed': selected, 'data-unit-id': item.unitId });
      group.append(svgEl('rect', { x: item.x, y: item.y, width: item.width, height: item.height, rx: 7 }),
        svgEl('text', { x: item.x + 15, y: item.y + 22, class: 'survey-atlas-section' }, item.section));
      const chars = Array.from(item.label);
      for (let i = 0; i < chars.length; i += 15) group.append(svgEl('text', { x: item.x + 15, y: item.y + 45 + i / 15 * 21, class: 'survey-atlas-node-title' }, chars.slice(i, i + 15).join('')));
      group.addEventListener('click', () => select(item.unitId));
      group.addEventListener('keydown', (event) => {
        if (['Enter', ' '].includes(event.key)) { event.preventDefault(); select(item.unitId); }
      });
      svg.append(group);
      const read = svgEl('a', { href: surveyUnitUrl(article.id, item.unitId), 'aria-label': `阅读${item.label}`, class: 'survey-atlas-read' });
      read.append(svgEl('text', { x: item.x + item.width - 14, y: item.y + 22, 'text-anchor': 'end' }, '阅读 ↗'));
      read.addEventListener('click', () => { state.selected = item.unitId; persist(); }); svg.append(read);
    }
    svg.append(badges);
    const current = model.nodes.find((n) => n.unitId === state.selected);
    details.replaceChildren();
    if (current) {
      const intro = el('div', 'survey-atlas-preview');
      intro.append(el('p', 'survey-atlas-selected-label', `当前选中 · ${current.section}`), el('h3', null, current.unit.title), el('p', null, current.unit.lead), anchor(current.unitId, '进入本节阅读'));
      const related = el('div', 'survey-atlas-neighbors'); related.append(el('h3', null, '与其他部分的联系'));
      if (!edges.length) related.append(el('p', null, '当前图层没有此节点的连接。可打开章节联系或建议读序，也可按作者目录阅读。'));
      for (const [index, edge] of edges.entries()) {
        const otherId = edge.from === current.unitId ? edge.to : edge.from;
        const other = model.nodes.find((n) => n.unitId === otherId);
        const row = el('div', `survey-atlas-reason survey-atlas-reason-${edge.kind}`);
        row.dataset.edgeIndex = index; row.tabIndex = -1;
        row.append(button(`${index + 1}. ${edge.from === current.unitId ? '→' : '←'} ${edge.label} · ${other.label}`, () => locate(otherId, true)),
          el('p', null, edge.reason), el('small', null, edge.kind === 'reading' ? '编辑建议读序，不是先修要求' : `${edge.origin === 'author' ? '原文关系' : '编辑解释'}${edge.source ? ` · ${edge.source}` : ''}`));
        related.append(row);
      }
      details.append(intro, related);
      status.textContent = `${model.nodes.filter((n) => n.visible).length} / ${model.nodes.length} 个阅读单元可见。选中：${current.label}。拖动空白平移；点“阅读”进入正文。`;
    }
  };
  search.addEventListener('input', () => {
    searchResults.replaceChildren(); const term = search.value.trim().toLocaleLowerCase();
    if (!term) return;
    const matches = model.nodes.filter((item) => `${item.label} ${item.unit.title} ${item.unit.lead} ${item.section}`.toLocaleLowerCase().includes(term));
    searchResults.append(el('span', null, matches.length ? `找到 ${matches.length} 节` : '没有匹配内容，请尝试更短的关键词。'));
    for (const item of matches) searchResults.append(button(`${item.section} ${item.label}`, () => locate(item.unitId, true)));
    status.textContent = `找到 ${matches.length} 个匹配单元。`;
  });
  // Pointer drag is scoped to blank canvas; text/buttons retain their normal behavior.
  let drag;
  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('[role="button"], a')) return;
    drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!drag) return;
    viewport.scrollLeft = drag.left - event.clientX + drag.x; viewport.scrollTop = drag.top - event.clientY + drag.y;
  });
  const stopDrag = () => { drag = null; };
  viewport.addEventListener('pointerup', stopDrag); viewport.addEventListener('pointercancel', stopDrag);
  viewport.addEventListener('keydown', (event) => {
    if (event.target !== viewport) return;
    const directions = { ArrowLeft: [-70, 0], ArrowRight: [70, 0], ArrowUp: [0, -70], ArrowDown: [0, 70] };
    if (directions[event.key]) { event.preventDefault(); viewport.scrollBy(...directions[event.key]); }
  });
  viewport.addEventListener('scroll', () => { state.scrollLeft = viewport.scrollLeft; state.scrollTop = viewport.scrollTop; persist(); }, { passive: true });
  draw(); viewport.scrollTo(state.scrollLeft, state.scrollTop);
}
