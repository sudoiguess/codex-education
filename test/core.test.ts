import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grade, schedule } from '../src/core.ts';

test('comparison normalizes Unicode, case and edges, but preserves meaning-bearing punctuation', () => {
  assert.equal(grade('  CAFE\u0301 ', 'café'), true);
  assert.equal(grade('meiosis', 'mitosis'), false);
  assert.equal(grade('x!', 'x'), false);
});
test('review ladder, reset, cap and UTC day arithmetic are deterministic', () => {
  const now = new Date('2026-11-05T12:00:00Z');
  for (const [streak, days] of [[0,1],[1,3],[2,7],[3,14],[4,30],[10,30]]) {
    const next = schedule(true, streak, now);
    assert.equal(next.streak, streak + 1);
    assert.equal(Date.parse(next.dueAt) - now.getTime(), days * 86400000);
  }
  assert.deepEqual(schedule(false, 8, now), { streak: 0, dueAt: '2026-11-06T12:00:00.000Z' });
});
