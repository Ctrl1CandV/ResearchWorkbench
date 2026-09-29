import { SURVEYS } from '../public/content/surveys.js';
import { validateTopicMap } from '../public/survey-graph.js';

const errors = [];
const articleIds = new Set();
const fail = (articleId, message) => errors.push(`${articleId}: ${message}`);

if (SURVEYS.schemaVersion !== 1) errors.push('SURVEYS: unsupported schemaVersion');
if (!Array.isArray(SURVEYS.articles)) errors.push('SURVEYS: articles must be an array');

for (const article of SURVEYS.articles ?? []) {
  for (const error of validateTopicMap(article)) fail(article.id, error);
  if (!article.id || articleIds.has(article.id)) fail(article.id ?? '(missing id)', 'missing or duplicate article id');
  articleIds.add(article.id);
  if (!['candidate', 'partial', 'complete'].includes(article.state)) fail(article.id, `invalid state: ${article.state}`);

  const units = new Map();
  for (const unit of article.units ?? []) {
    if (!unit.id || units.has(unit.id)) fail(article.id, `missing or duplicate unit id: ${unit.id ?? '(missing)'}`);
    units.set(unit.id, unit);
    if (!Array.isArray(unit.blocks) || unit.blocks.length === 0) fail(article.id, `${unit.id}: no reading blocks`);
    const headingIds = new Set();
    for (const [index, block] of (unit.blocks ?? []).entries()) {
      if (block.type === 'heading') {
        if (block.role !== 'section-heading') fail(article.id, `${unit.id}: heading must use section-heading role at block ${index}`);
        if (!block.id?.trim() || headingIds.has(block.id)) fail(article.id, `${unit.id}: missing or duplicate heading id at block ${index}`);
        if (block.id) headingIds.add(block.id);
        if (!block.text?.trim()) fail(article.id, `${unit.id}: empty heading at block ${index}`);
        continue;
      }
      if (!['paragraph', 'comparison'].includes(block.type)) fail(article.id, `${unit.id}: unsupported block type at ${index}`);
      if (!['source-explanation', 'teaching-example', 'editorial-connection', 'update'].includes(block.role)) fail(article.id, `${unit.id}: unsupported provenance role at ${index}`);
      if (block.role === 'source-explanation' && !block.source) fail(article.id, `${unit.id}: source explanation lacks a locator at block ${index}`);
      if (block.type === 'paragraph' && !block.text?.trim()) fail(article.id, `${unit.id}: empty paragraph at ${index}`);
      if (block.type === 'comparison' && (!block.headers?.length || block.rows?.some((row) => row.length !== block.headers.length))) fail(article.id, `${unit.id}: malformed comparison at block ${index}`);
    }
    if (unit.graph) {
      const graphIds = new Set();
      const addGraphId = (id) => {
        if (!id?.trim() || graphIds.has(id)) fail(article.id, `${unit.id}: missing or duplicate graph node id: ${id ?? '(missing)'}`);
        if (id) graphIds.add(id);
      };
      if (!unit.graph.title?.trim() || !unit.graph.intro?.trim()) fail(article.id, `${unit.id}: graph requires a title and introduction`);
      if (!unit.graph.root?.label?.trim() || !unit.graph.root?.detail?.trim()) fail(article.id, `${unit.id}: graph root requires a label and explanation`);
      addGraphId(unit.graph.root?.id);
      if (unit.graph.root?.targetHeadingId && !headingIds.has(unit.graph.root.targetHeadingId)) fail(article.id, `${unit.id}: graph root points to unknown heading ${unit.graph.root.targetHeadingId}`);
      if (!Array.isArray(unit.graph.axes) || unit.graph.axes.length < 1) fail(article.id, `${unit.id}: graph requires at least one axis`);
      for (const axis of unit.graph.axes ?? []) {
        addGraphId(axis.id);
        if (!axis.label?.trim() || !axis.detail?.trim()) fail(article.id, `${unit.id}: graph axis ${axis.id ?? '(missing)'} requires a label and explanation`);
        if (axis.targetHeadingId && !headingIds.has(axis.targetHeadingId)) fail(article.id, `${unit.id}: graph axis ${axis.id} points to unknown heading ${axis.targetHeadingId}`);
        for (const child of axis.children ?? []) {
          addGraphId(child.id);
          if (!child.title?.trim() || !child.detail?.trim()) fail(article.id, `${unit.id}: graph child ${child.id ?? '(missing)'} requires a title and explanation`);
          if (child.targetHeadingId && !headingIds.has(child.targetHeadingId)) fail(article.id, `${unit.id}: graph child ${child.id} points to unknown heading ${child.targetHeadingId}`);
        }
      }
    }
    for (const sectionId of unit.sourceSectionIds ?? []) {
      if (!(article.outline ?? []).some((section) => section.id === sectionId)) fail(article.id, `${unit.id}: unknown source section ${sectionId}`);
    }
  }

  const sections = new Map();
  for (const section of article.outline ?? []) {
    if (!section.id || sections.has(section.id)) fail(article.id, `missing or duplicate outline id: ${section.id ?? '(missing)'}`);
    sections.set(section.id, section);
    if (!['taught', 'reference-only', 'missing'].includes(section.disposition)) fail(article.id, `${section.id}: invalid disposition`);
    if (section.disposition !== 'taught' && !section.reason && section.disposition !== 'missing') fail(article.id, `${section.id}: non-taught section requires a reason`);
    for (const unitId of section.unitIds ?? []) if (!units.has(unitId)) fail(article.id, `${section.id}: unknown unit ${unitId}`);
    if (section.disposition === 'taught' && !(section.unitIds ?? []).length) fail(article.id, `${section.id}: taught section is not mapped to a unit`);
  }

  for (const relation of article.unitRelations ?? []) {
    if (!units.has(relation.from) || !units.has(relation.to)) fail(article.id, `relation points to unknown unit: ${relation.from} → ${relation.to}`);
    if (!relation.reason?.trim()) fail(article.id, `relation has no explanation: ${relation.from} → ${relation.to}`);
    if (relation.origin === 'author' && !relation.source) fail(article.id, `author relation has no source locator: ${relation.from} → ${relation.to}`);
  }

  for (const path of article.readingPaths ?? []) {
    if (!path.steps?.length) fail(article.id, `${path.id}: reading path has no steps`);
    for (const step of path.steps ?? []) if (!units.has(step.unitId)) fail(article.id, `${path.id}: unknown unit ${step.unitId}`);
  }

  if (article.state === 'complete') {
    const missingSections = (article.outline ?? []).filter((section) => section.disposition === 'missing');
    if (missingSections.length) fail(article.id, 'complete state cannot contain missing sections');
    if (article.coverage?.notYetTaught?.length) fail(article.id, 'complete state cannot contain untaught sections');
    if (article.coverage?.unresolved?.length) fail(article.id, 'complete state cannot contain unresolved source issues');
    const visualChecks = article.coverage?.visualFiguresAndTables ?? [];
    if (!visualChecks.length || visualChecks.some((entry) => !/checked|核对完成|视觉核对完成/i.test(entry))) fail(article.id, 'complete state requires an inventory of visually checked figures/tables');
  }
}

for (const relation of SURVEYS.relations ?? []) {
  const from = SURVEYS.articles.find((article) => article.id === relation.fromSurveyId);
  const to = SURVEYS.articles.find((article) => article.id === relation.toSurveyId);
  if (!from || !to) errors.push(`SURVEYS: relation has unknown endpoint ${relation.fromSurveyId} → ${relation.toSurveyId}`);
  if (!relation.reason?.trim()) errors.push(`SURVEYS: relation has no reason ${relation.fromSurveyId} → ${relation.toSurveyId}`);
  for (const unitId of relation.fromUnitIds ?? []) if (!from?.units?.some((unit) => unit.id === unitId)) errors.push(`SURVEYS: relation has unknown source-side unit ${unitId}`);
  for (const unitId of relation.toUnitIds ?? []) if (!to?.units?.some((unit) => unit.id === unitId)) errors.push(`SURVEYS: relation has unknown target-side unit ${unitId}`);
}

if (errors.length) {
  console.error(`Survey content validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Survey content structure is internally consistent (${SURVEYS.articles.length} article records).`);
}
