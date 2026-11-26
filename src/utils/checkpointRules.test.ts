import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isActCheckpointEntry,
  getLevelTransitionLifeRecovery,
  resolveActCheckpointResume,
} from './checkpointRules';
import { MAX_LIVES, HEART_COST_POINTS, type ActCheckpoint } from '../constants';

test('Act checkpoint entries are strictly Level 4 (Act II) and Level 11 (Act III)', () => {
  for (let lvl = 1; lvl <= 14; lvl++) {
    const expected = lvl === 4 || lvl === 11;
    assert.equal(
      isActCheckpointEntry(lvl),
      expected,
      `Level ${lvl} checkpoint entry should be ${expected}`
    );
  }
});

test('Entering Act II (N4) or Act III (N11) restores lives to 3/3 only when below max', () => {
  assert.deepEqual(getLevelTransitionLifeRecovery(4, 1), {
    nextLives: MAX_LIVES,
    restoreKind: 'full',
  });
  assert.deepEqual(getLevelTransitionLifeRecovery(4, 2), {
    nextLives: MAX_LIVES,
    restoreKind: 'full',
  });
  assert.deepEqual(getLevelTransitionLifeRecovery(4, 3), {
    nextLives: MAX_LIVES,
    restoreKind: 'none',
  });
  assert.deepEqual(getLevelTransitionLifeRecovery(11, 1), {
    nextLives: MAX_LIVES,
    restoreKind: 'full',
  });
  assert.deepEqual(getLevelTransitionLifeRecovery(11, 3), {
    nextLives: MAX_LIVES,
    restoreKind: 'none',
  });
});

test('Mid-Act II (N8) grants a single +1 life recovery when below 3/3', () => {
  assert.deepEqual(getLevelTransitionLifeRecovery(8, 1), {
    nextLives: 2,
    restoreKind: 'plus_one',
  });
  assert.deepEqual(getLevelTransitionLifeRecovery(8, 2), {
    nextLives: 3,
    restoreKind: 'plus_one',
  });
  assert.deepEqual(getLevelTransitionLifeRecovery(8, 3), {
    nextLives: 3,
    restoreKind: 'none',
  });
});

test('No automatic heal occurs on N2, N3, N5, N6, N7, N9, N10, N12, N13', () => {
  for (const lvl of [2, 3, 5, 6, 7, 9, 10, 12, 13]) {
    assert.deepEqual(
      getLevelTransitionLifeRecovery(lvl, 1),
      { nextLives: 1, restoreKind: 'none' },
      `Level ${lvl} must not auto-heal`
    );
  }
});

test('Resuming from Act Checkpoint restores 3/3 lives without resetting a spent second chance', () => {
  const checkpoint: ActCheckpoint = {
    actId: 2,
    level: 4,
    score: 350,
    baseNetworkWater: 16,
    elapsedSeconds: 420,
  };

  const resumed = resolveActCheckpointResume(checkpoint, true);
  assert.deepEqual(resumed, {
    level: 4,
    score: 350,
    baseNetworkWater: 16,
    elapsedSeconds: 420,
    lives: MAX_LIVES,
    secondChanceUsed: true,
  });
});

test('Anti-exploit invariant: entering N4/N11 with spent second chance matches checkpoint resume state', () => {
  for (const actEntry of [4, 11] as const) {
    const entryRecovery = getLevelTransitionLifeRecovery(actEntry, 1);
    const checkpoint: ActCheckpoint = {
      actId: actEntry === 4 ? 2 : 3,
      level: actEntry,
      score: 500,
      baseNetworkWater: actEntry === 4 ? 16 : 71,
      elapsedSeconds: 600,
    };
    const resumed = resolveActCheckpointResume(checkpoint, true);
    assert.equal(entryRecovery.nextLives, resumed.lives);
    assert.equal(resumed.secondChanceUsed, true);
  }
});

test('Heart purchase cost is tightened to 150 points', () => {
  assert.equal(HEART_COST_POINTS, 150);
});
