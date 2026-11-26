import { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ChevronRight,
  Star,
  ArrowUpRight,
  Heart,
  Clock,
  CheckCircle2,
  ShieldCheck,
  BookmarkCheck,
  FastForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import NaiaDialogue, { NaiaAvatar } from './NaiaDialogue';
import ActionButton from './ActionButton';
import { getLevelIcon } from './levelIcons';
import { LEVEL_NAMES, MAX_LIVES, MISSION_DURATION_MINUTES, MISSION_DURATION_SECONDS, getActForLevel } from '../constants';
import type { LifeRestoreKind } from '../utils/checkpointRules';
import { soundManager } from '../utils/soundManager';
import { EASE_OUT_EXPO, EASE_IN_OUT, SPRING_SNAPPY } from '../utils/motion';

const FACT_REVEAL_START_DELAY_MS = 320;
const ATTACH_TO_PREV = new Set([':', ';', '!', '?', '»', '%']);

function tokenizeFrenchWords(text: string): string[] {
  const raw = text.trim().split(/\s+/);
  const tokens: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const part = raw[i];
    if (tokens.length > 0 && (ATTACH_TO_PREV.has(part) || tokens[tokens.length - 1] === '«')) {
      tokens[tokens.length - 1] = `${tokens[tokens.length - 1]}\u00A0${part}`;
    } else {
      tokens.push(part);
    }
  }
  return tokens;
}

function buildFactRevealSchedule(text: string) {
  const tokens = tokenizeFrenchWords(text);
  let cursorSec = FACT_REVEAL_START_DELAY_MS / 1000;
  const items = tokens.map((word) => {
    const delay = cursorSec;
    const cleanLen = word.replace(/[^a-zA-ZÀ-ÿ0-9]/g, '').length;
    // Rythme organique : mots courts enchaînés naturellement, mots longs plus posés
    let stepMs = 52 + Math.min(cleanLen, 10) * 11;
    // Micro-respiration naturelle sur la ponctuation
    if (/[.!?…][»")]?$/.test(word)) {
      stepMs += 260;
    } else if (/[,;:][»")]?$/.test(word)) {
      stepMs += 140;
    }
    cursorSec += stepMs / 1000;
    return { word, delay };
  });
  const totalMs = Math.round((cursorSec + 0.24) * 1000);
  return { items, totalMs };
}

/**
 * Emplacements prêts pour de futures vidéos d'interlude d'acte plein écran (16:9).
 * Les illustrations locales servent automatiquement de décor (et de `poster` vidéo).
 * Pour activer une vidéo, déposez le fichier dans `public/` et renseignez `videoUrl`, ex. `'/acte-2.mp4'`.
 */
export const ACT_INTERLUDE_MEDIA: Record<2 | 3, { videoUrl: string | null; imageUrl: string }> = {
  2: { videoUrl: null, imageUrl: '/chapters/acte-2.jpg' },
  3: { videoUrl: null, imageUrl: '/chapters/acte-3.jpg' },
};

interface ActInterludeConfig {
  statusPill: string;
  rangeLabel: string;
  naiaMessage: string;
  ctaLabel: string;
}

const ACT_INTERLUDES: Record<2 | 3, ActInterludeConfig> = {
  2: {
    statusPill: 'Réseau stabilisé · 16 %',
    rangeLabel: 'Niveaux 4 à 10',
    naiaMessage:
      "L'urgence immédiate est contenue : vannes régulées et fuite souterraine localisée. Mais HYDRA continue d'absorber eau et électricité à l'échelle de ses datacenters. Dans cet acte, nous allons repenser son architecture, ses modèles et imposer des règles durables.",
    ctaLabel: "ENTRER DANS L'ACTE II",
  },
  3: {
    statusPill: 'Charte ratifiée · 71 % stabilisé',
    rangeLabel: 'Niveaux 11 à 13 · Labo en temps libre',
    naiaMessage:
      "La charte municipale est ratifiée : HYDRA est désormais encadrée et 71 % du réseau est stabilisé. Dernière étape : faire basculer l'IA en mode Symbiose pour piloter l'eau intelligemment, équilibrer la ville et concevoir votre propre solution.",
    ctaLabel: "ENTRER DANS L'ACTE III",
  },
};

interface TransitionScreenProps {
  level: number;
  fact?: string;
  onTransitionComplete: () => void;
  score: number;
  pointsGained: number;
  elapsedSeconds: number;
  lifeRestoreKind?: LifeRestoreKind;
  isMuted?: boolean;
  onToggleMute?: () => void;
  skipReadDelay?: boolean;
  key?: string;
}

export default function TransitionScreen({
  level,
  fact,
  onTransitionComplete,
  score,
  pointsGained,
  elapsedSeconds,
  lifeRestoreKind = 'none',
  isMuted = false,
  onToggleMute,
  skipReadDelay = false,
}: TransitionScreenProps) {
  const [displayScore, setDisplayScore] = useState(score - pointsGained);
  const [videoFailed, setVideoFailed] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const currentAct = getActForLevel(level);
  const isActInterlude = Boolean(
    currentAct && level === currentAct.startLevel && (currentAct.id === 2 || currentAct.id === 3)
  );
  const actId = isActInterlude ? (currentAct!.id as 2 | 3) : null;
  const actConfig = actId ? ACT_INTERLUDES[actId] : null;
  const actMedia = actId ? ACT_INTERLUDE_MEDIA[actId] : null;
  const showActVideo = Boolean(actMedia?.videoUrl) && !videoFailed;
  const LevelIcon = getLevelIcon(level);
  const stageTwoDelay = prefersReducedMotion ? 0 : 0.48;
  const factSchedule = useMemo(
    () => (fact ? buildFactRevealSchedule(fact) : { items: [], totalMs: 0 }),
    [fact]
  );
  const shouldRevealFact = Boolean(
    !isActInterlude && factSchedule.items.length > 0 && !prefersReducedMotion && !skipReadDelay
  );
  const [isContinueReady, setIsContinueReady] = useState(() => !shouldRevealFact);

  useEffect(() => {
    if (!shouldRevealFact) {
      setIsContinueReady(true);
      return;
    }

    setIsContinueReady(false);
    const doneTimer = setTimeout(() => {
      setIsContinueReady(true);
    }, factSchedule.totalMs);

    return () => clearTimeout(doneTimer);
  }, [shouldRevealFact, factSchedule.totalMs, level]);

  const isRevealingFact = shouldRevealFact && !isContinueReady;

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  useEffect(() => {
    if (lifeRestoreKind === 'none') return;
    const timer = setTimeout(() => {
      soundManager.playHeartRestore();
    }, 350);
    return () => clearTimeout(timer);
  }, [lifeRestoreKind]);

  useEffect(() => {
    if (pointsGained <= 0) {
      setDisplayScore(score);
      return;
    }

    const duration = 900;
    const start = score - pointsGained;
    const end = score;
    const startTime = performance.now();
    let rafId = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.floor(start + (end - start) * easedProgress));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [score, pointsGained]);

  const remainingSeconds = MISSION_DURATION_SECONDS - Math.max(0, Math.floor(elapsedSeconds));
  const isOvertime = remainingSeconds < 0;
  const absClockSeconds = Math.abs(remainingSeconds);
  const formattedTime = `${isOvertime ? '+' : ''}${Math.floor(absClockSeconds / 60).toString().padStart(2, '0')}:${(absClockSeconds % 60).toString().padStart(2, '0')}`;

  // Full-Bleed 2-Stage Cinematic Chapter Interlude (Acte II before N4, Acte III before N11)
  if (isActInterlude && currentAct && actConfig && actMedia) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.28, ease: EASE_OUT_EXPO } }}
        exit={{ opacity: 0, transition: { duration: 0.22, ease: EASE_IN_OUT } }}
        className="fixed inset-0 z-[120] bg-slate-950 overflow-y-auto font-sans"
      >
        {/* Full-Bleed Edge-to-Edge Backdrop */}
        <div className="fixed inset-0 pointer-events-none select-none overflow-hidden">
          {showActVideo ? (
            <video
              src={actMedia.videoUrl ?? undefined}
              poster={actMedia.imageUrl}
              autoPlay
              playsInline
              controls
              onError={() => setVideoFailed(true)}
              className="w-full h-full object-cover bg-black pointer-events-auto"
            >
              Votre navigateur ne supporte pas la lecture vidéo intégrée.
            </video>
          ) : (
            <motion.img
              src={actMedia.imageUrl}
              alt={currentAct.title}
              initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.95, ease: EASE_OUT_EXPO }}
              className="w-full h-full object-cover object-center"
            />
          )}

          {/* Top subtle vignette */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950/85 via-slate-950/40 to-transparent" />

          {/* Stage 2 Bottom Scrim */}
          <motion.div
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: stageTwoDelay, ease: EASE_OUT_EXPO }}
            className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent"
          />
        </div>

        {/* Foreground Diegetic Layer */}
        <div className="relative z-10 min-h-full flex flex-col justify-between px-4 sm:px-8 pt-4 sm:pt-6 pb-4 sm:pb-5 max-w-7xl w-full mx-auto">
          {/* Top Diegetic HUD Strip */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="flex flex-wrap items-start justify-between gap-3"
          >
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-400">
                <span>{currentAct.label}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300/80 font-normal tracking-wider normal-case">{actConfig.rangeLabel}</span>
                <span className="text-slate-500">·</span>
                <span className="inline-flex items-center gap-1 text-cyan-300/90 font-semibold tracking-wider normal-case">
                  <BookmarkCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  Point de contrôle
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
                {currentAct.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-h-8 font-mono text-[11px] sm:text-xs bg-slate-950/65 backdrop-blur-md border border-white/10 rounded-full px-3.5 py-1 shadow-lg">
                <span className="inline-flex items-center gap-1.5 text-emerald-300 font-bold">
                  {actId === 3 ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {actConfig.statusPill}
                </span>
                <span className="w-px h-3.5 bg-white/15" aria-hidden="true" />
                <span className="inline-flex items-center gap-1 text-white font-bold tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  {displayScore}
                  {pointsGained > 0 && <span className="text-emerald-400 ml-0.5">(+{pointsGained})</span>}
                </span>
                <span className="w-px h-3.5 bg-white/15" aria-hidden="true" />
                <span className={`inline-flex items-center gap-1 font-bold tabular-nums ${isOvertime ? 'text-amber-300' : remainingSeconds < 300 ? 'text-rose-400' : 'text-cyan-300'}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {formattedTime}
                </span>
                {lifeRestoreKind !== 'none' && (
                  <>
                    <span className="w-px h-3.5 bg-white/15" aria-hidden="true" />
                    <span className="inline-flex items-center gap-1 text-rose-300 font-bold">
                      <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                      {lifeRestoreKind === 'full' ? `Vies rétablies · ${MAX_LIVES}/${MAX_LIVES}` : '+1 vie'}
                    </span>
                  </>
                )}
                {showActVideo && (
                  <>
                    <span className="w-px h-3.5 bg-white/15" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={onTransitionComplete}
                      className="inline-flex items-center gap-1 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      <span>Passer</span>
                      <FastForward className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>

              {onToggleMute && (
                <button
                  type="button"
                  onClick={onToggleMute}
                  aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                  title={isMuted ? 'Activer le son' : 'Couper le son'}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md border transition-all shadow-lg cursor-pointer shrink-0 ${
                    isMuted
                      ? 'bg-red-950/65 border-red-400/45 text-red-300 hover:bg-red-900/70 hover:shadow-[0_0_12px_rgba(239,68,68,0.28)]'
                      : 'bg-slate-950/65 border-cyan-400/30 text-cyan-300 hover:bg-cyan-950/60 hover:border-cyan-400/60 hover:shadow-[0_0_12px_rgba(34,211,238,0.28)]'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </motion.div>

          {/* Unobstructed Center Breathing Room */}
          <div className="flex-1 min-h-[160px] sm:min-h-[220px]" aria-hidden="true" />

          {/* Stage 2: Bottom Cinematic Dialogue Dock */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.46, delay: stageTwoDelay, ease: EASE_OUT_EXPO }}
            className="space-y-2.5 max-w-4xl w-full mx-auto"
          >
            <NaiaDialogue
              hideHintButton
              emotion="happy"
              message={actConfig.naiaMessage}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              {fact ? (
                <p className="text-xs text-slate-200/90 leading-relaxed max-w-2xl px-3.5 py-2 rounded-xl bg-slate-950/60 backdrop-blur-md border border-white/10 shadow-lg">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400 mr-2">
                    Le saviez-vous ?
                  </span>
                  {fact}
                </p>
              ) : (
                <span className="text-xs font-mono text-slate-300 px-3.5 py-2 rounded-xl bg-slate-950/60 backdrop-blur-md border border-white/10 shadow-lg">
                  Chrono en pause · Niveau {level}/13 prêt
                </span>
              )}

              <button
                type="button"
                onClick={onTransitionComplete}
                className="shrink-0 w-full md:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-black text-sm sm:text-[15px] tracking-wide bg-gradient-to-r from-emerald-400/85 via-teal-400/85 to-cyan-400/85 hover:from-emerald-400/95 hover:via-teal-400/95 hover:to-cyan-400/95 text-slate-950 border border-cyan-200/35 hover:border-cyan-200/45 transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_8px_22px_rgba(6,182,212,0.15)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_8px_24px_rgba(20,184,166,0.26)] active:scale-[0.985] cursor-pointer"
              >
                <span>{actConfig.ctaLabel}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Crisp Intra-Act Transition with gentle reading-pace cue on the CTA when a fact memo is shown
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.24, ease: 'easeOut' } }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE_IN_OUT } }}
      className="fixed inset-0 z-[120] bg-slate-950/96 backdrop-blur-xl overflow-y-auto flex items-center justify-center p-4 font-sans"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.955, y: 16 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { duration: 0.34, ease: EASE_OUT_EXPO },
        }}
        exit={{
          opacity: 0,
          scale: 0.97,
          y: -8,
          transition: { duration: 0.18, ease: EASE_IN_OUT },
        }}
        className="max-w-xl w-full sm:bg-slate-900/95 border-transparent sm:border-white/10 sm:border p-5 sm:p-7 sm:rounded-3xl backdrop-blur-2xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)] relative overflow-hidden flex flex-col items-center gap-4 sm:gap-5 my-auto"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent" />

        {/* Compact Header */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04, ease: EASE_OUT_EXPO }}
          className="flex flex-col items-center text-center gap-2.5"
        >
          <motion.div
            initial={prefersReducedMotion ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...SPRING_SNAPPY, delay: 0.06 }}
            className="p-3 bg-slate-950/85 border border-emerald-500/30 rounded-2xl shadow-lg"
          >
            <LevelIcon className="w-7 h-7 text-emerald-400" />
          </motion.div>

          <div className="space-y-1">
            {currentAct && (
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/85">
                {currentAct.label} · {currentAct.title}
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Niveau <span className="text-cyan-300">{level}</span>
              <span className="text-base sm:text-lg text-slate-500 font-semibold ml-1.5">/ 13</span>
            </h2>
            {LEVEL_NAMES[level] && (
              <p className="text-xs sm:text-sm font-medium text-slate-300">
                {LEVEL_NAMES[level]}
              </p>
            )}
          </div>

          {lifeRestoreKind !== 'none' && (
            <motion.div
              initial={prefersReducedMotion ? false : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...SPRING_SNAPPY, delay: 0.16 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-400/45 text-rose-200 text-xs font-mono font-bold"
            >
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />
              <span>
                {lifeRestoreKind === 'full'
                  ? `Vies rétablies (${MAX_LIVES}/${MAX_LIVES}) · Niveau ${level}`
                  : `+1 vie restaurée · Palier niveau ${level}`}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Clean Stats Row */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-2 gap-3 w-full"
        >
          <div className="bg-slate-950/65 border border-white/10 p-3.5 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold mb-1">
              Score total
            </span>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-mono font-black text-white tabular-nums">{displayScore}</span>
            </div>
            {pointsGained > 0 && (
              <div className="mt-1 inline-flex items-center gap-0.5 text-emerald-400 font-mono font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ArrowUpRight className="w-3 h-3" />
                <span>+{pointsGained} pts</span>
              </div>
            )}
          </div>

          <div className="bg-slate-950/65 border border-white/10 p-3.5 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold mb-1">
              {isOvertime ? 'Prolongation' : `Objectif ${MISSION_DURATION_MINUTES} min`}
            </span>
            <span className={`text-2xl font-mono font-black tabular-nums ${isOvertime ? 'text-amber-300' : remainingSeconds < 300 ? 'text-rose-400' : 'text-cyan-400'}`}>
              {formattedTime}
            </span>
            <span className="mt-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              {level === 13 ? 'Lab en temps libre' : 'Chrono en pause'}
            </span>
          </div>
        </motion.div>

        {/* NAÏA Fact Memo (progressive word-by-word reveal draws attention directly to the text) */}
        {fact && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, delay: 0.14, ease: EASE_OUT_EXPO }}
            className={`w-full p-4 bg-slate-950/60 border rounded-2xl text-left transition-all duration-500 ${
              isRevealingFact
                ? 'border-emerald-400/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(16,185,129,0.12)]'
                : 'border-emerald-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
            }`}
          >
            <div className="flex items-start gap-3">
              <NaiaAvatar emotion="happy" size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 text-[10px] font-mono font-bold rounded uppercase tracking-wider">
                    Le saviez-vous ?
                  </span>
                </div>
                <p className="text-slate-100 text-xs sm:text-sm leading-relaxed" aria-label={fact}>
                  {shouldRevealFact
                    ? factSchedule.items.map((item, idx) => (
                        <span key={`${level}-${idx}`}>
                          <motion.span
                            aria-hidden="true"
                            initial={{ opacity: 0, y: 3, filter: 'blur(2px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{
                              duration: 0.38,
                              delay: item.delay,
                              ease: EASE_OUT_EXPO,
                            }}
                            className="inline-block"
                          >
                            {item.word}
                          </motion.span>
                          {idx < factSchedule.items.length - 1 ? ' ' : ''}
                        </span>
                      ))
                    : fact}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Continue CTA — stays discreet while the memo reveals, unlocks once all text is displayed */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.18, ease: EASE_OUT_EXPO }}
          className="w-full"
        >
          <ActionButton
            variant="primary"
            size="md"
            fullWidth
            disabled={!isContinueReady}
            onClick={onTransitionComplete}
            className="transition-all duration-300"
          >
            <span>CONTINUER · NIVEAU {level}</span>
            <ChevronRight className="w-4 h-4" />
          </ActionButton>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
