import { motion } from 'motion/react';
import { TimerOff, RotateCcw, HeartCrack, Home, Layers, Star, ShieldAlert, AlertTriangle } from 'lucide-react';
import {
  LEVEL_NAMES,
  LOCKOUT_MIN_TIME_REMAINING_SECONDS,
  LOCKOUT_RESTORE_LIVES,
  LOCKOUT_TIME_PENALTY_SECONDS,
} from '../constants';
import ActionButton from '../components/ActionButton';

interface GameOverProps {
  onRetry: (name: string) => void;
  onResumeLevel?: () => void;
  onGoHome: () => void;
  nickname: string;
  level: number;
  score: number;
  timeLeft: number;
  secondChanceUsed?: boolean;
  reason?: 'time' | 'lives';
  key?: string;
}

function formatPenaltyClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return s === 0 ? `${m} min` : `${m}m${s.toString().padStart(2, '0')}s`;
}

export default function GameOver({
  onRetry,
  onResumeLevel,
  onGoHome,
  nickname,
  level,
  score,
  timeLeft,
  secondChanceUsed = false,
  reason = 'time',
}: GameOverProps) {
  const rawName = nickname.trim();
  const displayAgent = rawName
    ? /^agent\b/i.test(rawName)
      ? rawName
      : `Agent ${rawName}`
    : 'Agent Anonyme';
  const levelName = LEVEL_NAMES[level] || `Mission ${level}`;
  const canUseSecondChance = reason === 'lives' && !secondChanceUsed && Boolean(onResumeLevel);

  const nextTimeLeft =
    timeLeft <= LOCKOUT_MIN_TIME_REMAINING_SECONDS
      ? timeLeft
      : Math.max(LOCKOUT_MIN_TIME_REMAINING_SECONDS, timeLeft - LOCKOUT_TIME_PENALTY_SECONDS);
  const actualTimePenalty = Math.max(0, timeLeft - nextTimeLeft);

  const penaltyParts = [
    actualTimePenalty > 0 ? `-${formatPenaltyClock(actualTimePenalty)}` : null,
    `${LOCKOUT_RESTORE_LIVES}/3 vies`,
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="relative overflow-hidden sm:bg-slate-900/90 border-transparent sm:border-red-500/30 sm:border p-5 sm:p-8 sm:rounded-2xl max-w-[540px] w-full mx-auto text-center backdrop-blur-xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.6)]"
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-red-500/15 to-red-950/50 border border-red-500/30 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_24px_rgba(239,68,68,0.18)]">
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
        <h1 className="font-mono text-2xl sm:text-[28px] font-bold text-white mb-3 uppercase tracking-[0.14em] leading-tight">
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

        {/* Narrative & Warning */}
        {canUseSecondChance ? (
          <div className="w-full mb-5 space-y-3 font-sans">
            <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed">
              <span className="text-white font-semibold">{displayAgent}</span> n'a plus de vies. NAÏA peut forcer le pare-feu d'HYDRA et relancer le niveau {level}{' '}
              <span className="inline-flex items-center font-mono text-xs text-slate-200 bg-white/[0.06] border border-white/10 rounded-md px-2 py-0.5 whitespace-nowrap">
                {penaltyParts.join(' · ')}
              </span>
            </p>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/[0.08] border border-amber-400/20 px-3.5 py-2 text-xs sm:text-[13px] text-amber-200/95">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Faites plus attention la prochaine fois, c'est votre dernière chance.</span>
            </div>
          </div>
        ) : (
          <p className="text-slate-300 text-sm sm:text-[15px] mb-5 font-sans leading-relaxed">
            {reason === 'lives'
              ? `${displayAgent} a épuisé ses vies et sa seconde chance. Le pare-feu d'HYDRA a définitivement fermé la session.`
              : `Le chronomètre est arrivé à zéro, ${displayAgent}. HYDRA a maintenu son pompage d'eau sur le réseau de la ville.`}
          </p>
        )}

        {/* Stats Grid — aligned to full card width */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
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
              {score}{' '}
              <span className="text-sm font-semibold text-yellow-400/80">pts</span>
            </span>
            <span className="text-xs text-slate-400 truncate max-w-full">{displayAgent}</span>
          </div>
        </div>

        {/* Actions */}
        {canUseSecondChance && onResumeLevel ? (
          <div className="w-full pt-5 border-t border-white/[0.07] flex flex-col gap-2.5">
            <ActionButton
              variant="primary"
              size="md"
              fullWidth
              onClick={onResumeLevel}
              className="whitespace-nowrap"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>REPRENDRE AU NIVEAU {level}</span>
            </ActionButton>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <ActionButton
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => onRetry(nickname)}
                className="whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Recommencer (Niv. 1)</span>
              </ActionButton>
              <ActionButton
                variant="ghost"
                size="sm"
                fullWidth
                onClick={onGoHome}
                className="whitespace-nowrap"
              >
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span>Retour à l'accueil</span>
              </ActionButton>
            </div>
          </div>
        ) : (
          <div className="w-full pt-5 border-t border-white/[0.07] flex flex-col gap-2.5">
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
            <ActionButton
              variant="ghost"
              size="sm"
              fullWidth
              onClick={onGoHome}
              className="whitespace-nowrap"
            >
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span>Retour à l'accueil</span>
            </ActionButton>
          </div>
        )}
      </div>
    </motion.div>
  );
}
