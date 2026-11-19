import { motion } from 'motion/react';
import {
  TimerOff,
  RotateCcw,
  HeartCrack,
  Heart,
  Home,
  Layers,
  Star,
  Zap,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  LEVEL_NAMES,
  MISSION_DURATION_SECONDS,
  LOCKOUT_MIN_TIME_REMAINING_SECONDS,
  LOCKOUT_RESTORE_LIVES,
  LOCKOUT_TIME_PENALTY_SECONDS,
  ACT_CHECKPOINT_MIN_TIME_SECONDS,
  getActForLevel,
  type ActCheckpoint,
} from '../constants';
import ActionButton from '../components/ActionButton';
import { EASE_OUT_EXPO, EASE_IN_OUT } from '../utils/motion';

interface GameOverProps {
  onRetry: (name: string) => void;
  onResumeLevel?: () => void;
  onResumeAct?: () => void;
  onGoHome: () => void;
  nickname: string;
  level: number;
  score: number;
  timeLeft: number;
  secondChanceUsed?: boolean;
  actCheckpoint?: ActCheckpoint | null;
  reason?: 'time' | 'lives';
  key?: string;
}

function formatPenaltyClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return s === 0 ? `${m} min` : `${m}m${s.toString().padStart(2, '0')}s`;
}

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function GameOver({
  onRetry,
  onResumeLevel,
  onResumeAct,
  onGoHome,
  nickname,
  level,
  score,
  timeLeft,
  secondChanceUsed = false,
  actCheckpoint = null,
  reason = 'time',
}: GameOverProps) {
  const rawName = nickname.trim();
  const isAnonymous = !rawName || rawName.toLowerCase() === 'agent anonyme';
  const displayAgent = isAnonymous
    ? 'Agent'
    : /^agent\b/i.test(rawName)
    ? rawName
    : `Agent ${rawName}`;
  const levelName = LEVEL_NAMES[level] || `Mission ${level}`;
  const canUseSecondChance = reason === 'lives' && !secondChanceUsed && Boolean(onResumeLevel);
  const canResumeAct =
    !canUseSecondChance &&
    Boolean(onResumeAct) &&
    Boolean(actCheckpoint) &&
    (actCheckpoint?.actId === 2 || actCheckpoint?.actId === 3);
  const checkpointAct = canResumeAct && actCheckpoint ? getActForLevel(actCheckpoint.level) : undefined;
  const restoredActTime =
    canResumeAct && actCheckpoint
      ? Math.min(
          MISSION_DURATION_SECONDS,
          Math.max(actCheckpoint.timeLeft, ACT_CHECKPOINT_MIN_TIME_SECONDS[actCheckpoint.actId])
        )
      : 0;

  const nextTimeLeft =
    timeLeft <= LOCKOUT_MIN_TIME_REMAINING_SECONDS
      ? timeLeft
      : Math.max(LOCKOUT_MIN_TIME_REMAINING_SECONDS, timeLeft - LOCKOUT_TIME_PENALTY_SECONDS);
  const actualTimePenalty = Math.max(0, timeLeft - nextTimeLeft);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.28, ease: EASE_OUT_EXPO },
      }}
      exit={{
        opacity: 0,
        scale: 0.97,
        y: -8,
        transition: { duration: 0.16, ease: EASE_IN_OUT },
      }}
      className="relative overflow-hidden sm:bg-slate-900/90 border-transparent sm:border-red-500/30 sm:border p-5 sm:p-8 sm:rounded-2xl max-w-[520px] w-full mx-auto text-center backdrop-blur-xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.6)]"
    >
      {/* Subtle atmospheric top accents */}
      <div
        className="hidden sm:block absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-400/50 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-44 rounded-full bg-red-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Emblem */}
        <div className="mb-4">
          <div className="w-15 h-15 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-red-500/15 to-red-950/50 border border-red-500/30 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_24px_rgba(239,68,68,0.18)]">
            {reason === 'lives' ? (
              <HeartCrack className="w-8 h-8 text-red-400" strokeWidth={1.75} />
            ) : (
              <TimerOff className="w-8 h-8 text-red-400" strokeWidth={1.75} />
            )}
          </div>
        </div>

        {/* Title */}
        <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-red-400/80 mb-1">
          {canUseSecondChance
            ? 'Alerte pare-feu HYDRA'
            : reason === 'lives'
            ? 'Session verrouillée'
            : 'Temps écoulé'}
        </p>
        <h1 className="font-mono text-2xl sm:text-[28px] font-bold text-white mb-3 uppercase tracking-[0.12em] leading-tight">
          {canUseSecondChance ? (
            <>
              SECONDE <span className="text-red-400">CHANCE</span>
            </>
          ) : (
            <>
              MISSION <span className="text-red-400">INTERROMPUE</span>
            </>
          )}
        </h1>

        {/* Narrative & Conditions */}
        {canUseSecondChance ? (
          <>
            <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed max-w-[40ch] mb-5 font-sans">
              {isAnonymous ? (
                <>Vous n'avez plus de vies.</>
              ) : (
                <>
                  <span className="text-white font-semibold">{displayAgent}</span> n'a plus de vies.
                </>
              )}{' '}
              NAÏA peut forcer le système pour relancer le niveau {level}.
            </p>

            <div className="w-full flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-xl bg-slate-950/60 border border-white/[0.07] px-4 py-3 mb-6 text-xs sm:text-[13px] font-mono">
              {actualTimePenalty > 0 && (
                <>
                  <span className="inline-flex items-center gap-1.5 text-red-300">
                    <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    -{formatPenaltyClock(actualTimePenalty)}
                  </span>
                  <span className="text-slate-700 hidden sm:inline" aria-hidden="true">
                    ·
                  </span>
                </>
              )}
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <Heart className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {LOCKOUT_RESTORE_LIVES}/3 vies
              </span>
              <span className="text-slate-700 hidden sm:inline" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Dernière tentative
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="text-slate-300 text-sm sm:text-[15px] mb-5 font-sans leading-relaxed max-w-[44ch]">
              {canResumeAct && checkpointAct ? (
                reason === 'lives' ? (
                  isAnonymous ? (
                    `Vous avez épuisé vos vies et votre seconde chance. Le pare-feu d'HYDRA a fermé la session, mais NAÏA peut restaurer votre point de contrôle au début de ${checkpointAct.id === 2 ? "l'Acte II" : "l'Acte III"}.`
                  ) : (
                    `${displayAgent} a épuisé ses vies et sa seconde chance. Le pare-feu d'HYDRA a fermé la session, mais NAÏA peut restaurer votre point de contrôle au début de ${checkpointAct.id === 2 ? "l'Acte II" : "l'Acte III"}.`
                  )
                ) : isAnonymous ? (
                  `Le chronomètre est arrivé à zéro. HYDRA a maintenu son pompage d'eau, mais NAÏA peut relancer la mission depuis votre point de contrôle de ${checkpointAct.id === 2 ? "l'Acte II" : "l'Acte III"}.`
                ) : (
                  `Le chronomètre est arrivé à zéro, ${displayAgent}. HYDRA a maintenu son pompage d'eau, mais NAÏA peut relancer la mission depuis votre point de contrôle de ${checkpointAct.id === 2 ? "l'Acte II" : "l'Acte III"}.`
                )
              ) : reason === 'lives' ? (
                isAnonymous ? (
                  "Vous avez épuisé vos vies et votre seconde chance. Le pare-feu d'HYDRA a définitivement fermé la session."
                ) : (
                  `${displayAgent} a épuisé ses vies et sa seconde chance. Le pare-feu d'HYDRA a définitivement fermé la session.`
                )
              ) : isAnonymous ? (
                "Le chronomètre est arrivé à zéro. HYDRA a maintenu son pompage d'eau sur le réseau de la ville."
              ) : (
                `Le chronomètre est arrivé à zéro, ${displayAgent}. HYDRA a maintenu son pompage d'eau sur le réseau de la ville.`
              )}
            </p>

            {/* Stats Grid — shown only on final Game Over */}
            <div className={`grid grid-cols-2 gap-3 w-full ${canResumeAct ? 'mb-3.5' : 'mb-6'}`}>
              <div className="bg-slate-950/65 border border-white/[0.08] rounded-xl px-4 py-3 flex flex-col items-center gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  Niveau atteint
                </span>
                <span className="font-mono font-bold text-white text-lg sm:text-xl tabular-nums leading-tight">
                  {level}
                  <span className="text-slate-500 text-sm font-semibold">/13</span>
                </span>
                <span className="text-xs text-slate-400 truncate max-w-full">{levelName}</span>
              </div>

              <div className="bg-slate-950/65 border border-white/[0.08] rounded-xl px-4 py-3 flex flex-col items-center gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  Score cumulé
                </span>
                <span className="font-mono font-bold text-yellow-400 text-lg sm:text-xl tabular-nums leading-tight">
                  {score}
                  <span className="ml-1 text-sm font-semibold text-yellow-400/80">pts</span>
                </span>
                <span className="text-xs text-slate-400 truncate max-w-full">{displayAgent}</span>
              </div>
            </div>

            {canResumeAct && actCheckpoint && checkpointAct && (
              <div className="w-full flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-xl bg-cyan-950/35 border border-cyan-500/25 px-4 py-3 mb-6 text-xs sm:text-[13px] font-mono">
                <span className="inline-flex items-center gap-1.5 text-cyan-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {formatClock(restoredActTime)}
                </span>
                <span className="text-slate-700 hidden sm:inline" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5 text-emerald-300">
                  <Heart className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  3/3 vies
                </span>
                <span className="text-slate-700 hidden sm:inline" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5 text-yellow-300">
                  <Star className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  {actCheckpoint.score} pts
                </span>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        {canUseSecondChance && onResumeLevel ? (
          <div className="w-full flex flex-col gap-3">
            <ActionButton
              variant="primary"
              size="md"
              fullWidth
              onClick={onResumeLevel}
              className="whitespace-nowrap"
            >
              <Zap className="w-4 h-4" />
              <span>REPRENDRE AU NIVEAU {level}</span>
            </ActionButton>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-1">
              <button
                type="button"
                onClick={() => onRetry(nickname)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recommencer (Niv. 1)</span>
              </button>
              <span className="text-slate-700 hidden sm:inline" aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                onClick={onGoHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors whitespace-nowrap"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Retour à l'accueil</span>
              </button>
            </div>
          </div>
        ) : canResumeAct && onResumeAct && actCheckpoint && checkpointAct ? (
          <div className="w-full flex flex-col gap-3">
            <ActionButton
              variant="primary"
              size="md"
              fullWidth
              onClick={onResumeAct}
              className="whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                REPRENDRE À L&apos;{checkpointAct.label} (NIV. {actCheckpoint.level})
              </span>
            </ActionButton>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-1">
              <button
                type="button"
                onClick={() => onRetry(nickname)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recommencer (Niv. 1)</span>
              </button>
              <span className="text-slate-700 hidden sm:inline" aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                onClick={onGoHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors whitespace-nowrap"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Retour à l'accueil</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <ActionButton
              variant="danger"
              size="md"
              fullWidth
              onClick={() => onRetry(nickname)}
              className="whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RELANCER LA SIMULATION</span>
            </ActionButton>
            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={onGoHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors whitespace-nowrap"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Retour à l'accueil</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
