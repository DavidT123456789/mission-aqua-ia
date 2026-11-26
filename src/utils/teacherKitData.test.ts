import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_NAMES, MISSION_ACTS } from '../constants';
import { DEV_ANSWERS } from '../../shared/devAnswers';
import {
  SESSION_PLANS,
  QUICK_ESSENTIALS,
  CLASSROOM_GUIDES,
  TECHNO_CURRICULUM_ROWS,
  INTERDISCIPLINARY_BRIDGES,
  DEBATE_PROMPTS,
  resolveLevelRef,
  escapeHtml,
  buildPrintableHtml,
  type LevelRefCode,
} from './teacherKitData';

test('resolveLevelRef resolves every N1..N13, B1, B2, and ALL accurately', () => {
  for (let i = 1; i <= 13; i++) {
    const code = `N${i}` as LevelRefCode;
    const resolved = resolveLevelRef(code);
    assert.equal(resolved.shortLabel, code);
    assert.ok(resolved.title.includes(LEVEL_NAMES[i]), `Missing level name for ${code}`);
    const act = MISSION_ACTS.find((a) => i >= a.startLevel && i <= a.endLevel);
    assert.ok(act, `Act should exist for level ${i}`);
    assert.ok(resolved.context.includes(act.label), `Context for ${code} should include ${act.label}`);
  }

  const b1 = resolveLevelRef('B1');
  assert.equal(b1.shortLabel, 'Bonus 1');
  assert.ok(b1.title.includes('GPU'));

  const b2 = resolveLevelRef('B2');
  assert.equal(b2.shortLabel, 'Bonus 2');
  assert.ok(b2.title.includes('rebond'));

  const all = resolveLevelRef('ALL');
  assert.equal(all.shortLabel, 'N1–N13');
});

test('all 13 levels and both bonus missions are covered across Technologie Cycle 4 + Pix rows', () => {
  assert.equal(TECHNO_CURRICULUM_ROWS.length, 4);
  const covered = new Set<LevelRefCode>();
  for (const row of TECHNO_CURRICULUM_ROWS) {
    assert.ok(row.summary.length > 10 && row.summary.length <= 95, `Summary for ${row.title} should stay crisp`);
    assert.ok(row.details.length >= 2, `${row.title} should include detailed bullets`);
    for (const ref of row.levelRefs) {
      covered.add(ref);
    }
  }

  for (let i = 1; i <= 13; i++) {
    const code = `N${i}` as LevelRefCode;
    assert.ok(covered.has(code), `Level ${code} should be covered in Technologie Cycle 4 rows`);
  }
  assert.ok(covered.has('B1'), 'Bonus 1 should be mapped');
  assert.ok(covered.has('B2'), 'Bonus 2 should be mapped');

  assert.equal(INTERDISCIPLINARY_BRIDGES.length, 4);
  for (const bridge of INTERDISCIPLINARY_BRIDGES) {
    assert.ok(bridge.levelRefs.length >= 1);
    for (const ref of bridge.levelRefs) {
      assert.ok(resolveLevelRef(ref).title.length > 0);
    }
  }
});

test('debate prompts stay coherent with 1h/2h formats and valid level references', () => {
  assert.equal(DEBATE_PROMPTS.length, 4);
  const oneHourReady = DEBATE_PROMPTS.filter((p) => p.timing.startsWith('Dès 1 h'));
  assert.ok(oneHourReady.length >= 2, 'At least 2 prompts must be usable in 1-hour format');

  for (const prompt of DEBATE_PROMPTS) {
    assert.ok(prompt.levelRefs.length >= 1);
    assert.ok(prompt.keyPoints.length >= 2);
    for (const ref of prompt.levelRefs) {
      const resolved = resolveLevelRef(ref);
      assert.ok(resolved.title.length > 0);
    }
  }
});

test('session plans and essentials stay concise and synchronized', () => {
  assert.equal(SESSION_PLANS.two_sessions.recommended, true);
  assert.equal(SESSION_PLANS.two_sessions.steps.length, 2);
  assert.equal(SESSION_PLANS.one_session.steps.length, 3);
  assert.equal(QUICK_ESSENTIALS.length, 4);
  assert.equal(CLASSROOM_GUIDES.length, 3);
});

test('escapeHtml escapes HTML special characters', () => {
  assert.equal(escapeHtml('<script>"a & b"</script>'), '&lt;script&gt;&quot;a &amp; b&quot;&lt;/script&gt;');
});

test('buildPrintableHtml renders complete sheet without leaking puzzle answers', () => {
  const html = buildPrintableHtml();
  assert.ok(html.includes('Mission Aqua IA · Kit enseignant'));
  assert.ok(html.includes('2 séances (2 × 55 min · Recommandé)'));
  assert.ok(html.includes('1 séance (55 min · Express)'));
  assert.ok(html.includes('NAÏA'));
  assert.ok(!html.includes('NAIA '), 'Spelling should consistently use NAÏA');

  // Verify no exact puzzle answer strings leak into the teacher kit printout
  const sensitiveAnswers = [
    DEV_ANSWERS[1],
    DEV_ANSWERS[2],
    DEV_ANSWERS[3],
    DEV_ANSWERS[4],
    DEV_ANSWERS[5],
    DEV_ANSWERS[6],
    DEV_ANSWERS[7],
    DEV_ANSWERS[11],
    DEV_ANSWERS[12],
  ];
  for (const answer of sensitiveAnswers) {
    const firstLine = answer.split('\n')[0];
    assert.ok(!html.includes(firstLine), `Printable teacher kit must not leak answer: ${firstLine}`);
  }
});
