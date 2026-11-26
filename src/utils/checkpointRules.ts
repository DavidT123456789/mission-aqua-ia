import {
  MAX_LIVES,
  MID_ACT_TWO_HEAL_LEVEL,
  getActForLevel,
  type ActCheckpoint,
} from '../constants';

export type LifeRestoreKind = 'none' | 'plus_one' | 'full';

export interface LevelTransitionLifeRecovery {
  nextLives: number;
  restoreKind: LifeRestoreKind;
}

/**
 * Returns true when entering `level` opens a recoverable Act Checkpoint (Act II at N4, Act III at N11).
 */
export function isActCheckpointEntry(level: number): boolean {
  const act = getActForLevel(level);
  return Boolean(act && (act.id === 2 || act.id === 3) && level === act.startLevel);
}

/**
 * Computes life recovery when transitioning into `nextLevel`.
 * - Entering Act II (N4) or Act III (N11): restores lives to 3/3 (aligns checkpoint entry with checkpoint resume, removing suicide-reset exploits).
 * - Entering N8 (mid-Act II): grants a single +1 life recovery if below max.
 * - All other levels (including N3 and N12): no automatic heal.
 */
export function getLevelTransitionLifeRecovery(
  nextLevel: number,
  currentLives: number
): LevelTransitionLifeRecovery {
  const clamped = Math.max(0, Math.min(MAX_LIVES, Math.floor(currentLives)));

  if (isActCheckpointEntry(nextLevel)) {
    return {
      nextLives: MAX_LIVES,
      restoreKind: clamped < MAX_LIVES ? 'full' : 'none',
    };
  }

  if (nextLevel === MID_ACT_TWO_HEAL_LEVEL) {
    const nextLives = Math.min(MAX_LIVES, clamped + 1);
    return {
      nextLives,
      restoreKind: nextLives > clamped ? 'plus_one' : 'none',
    };
  }

  return {
    nextLives: clamped,
    restoreKind: 'none',
  };
}

export interface ActCheckpointResumeState {
  level: number;
  score: number;
  baseNetworkWater: number;
  elapsedSeconds: number;
  lives: number;
  secondChanceUsed: boolean;
}

/**
 * Builds the restored state when resuming from an Act Checkpoint after permanent Game Over.
 * Lives are restored to 3/3, while `secondChanceUsed` remains `true` (unique joker per run)
 * so students stay incentivized to write answers in their notebook rather than brute-forcing.
 */
export function resolveActCheckpointResume(
  checkpoint: ActCheckpoint,
  secondChanceUsed = true
): ActCheckpointResumeState {
  return {
    level: checkpoint.level,
    score: checkpoint.score,
    baseNetworkWater: checkpoint.baseNetworkWater,
    elapsedSeconds: checkpoint.elapsedSeconds,
    lives: MAX_LIVES,
    secondChanceUsed: Boolean(secondChanceUsed),
  };
}
