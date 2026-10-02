import test from 'node:test';
import assert from 'node:assert/strict';

import { LIBRARY } from '../public/library-content.js';
import { SURVEYS } from '../public/content/surveys.js';
import { applyEditorialCopy } from '../docs/plans/READING-014/prototype/editorial.mjs';

test('READING-014：28 项已复核文案迁入正式字段，未复制样稿数据', () => {
  const expectedLibrary = structuredClone(LIBRARY);
  const expectedSurveys = structuredClone(SURVEYS);
  const changes = applyEditorialCopy({ library: expectedLibrary, surveys: expectedSurveys });

  assert.equal(changes.length, 28, '应核对全部已批准改写项');
  assert.deepEqual(LIBRARY, expectedLibrary, '正式学习库应使用复核后的字段文案');
  assert.deepEqual(SURVEYS, expectedSurveys, '正式综述正文应使用复核后的字段文案');
});
