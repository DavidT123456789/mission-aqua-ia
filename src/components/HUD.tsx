import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Pause, Play, Plus, Star, Heart, FastForward, Rewind, Menu, X, Volume2, VolumeX, BookOpen, Layers, ChevronDown, ChevronUp, Eye, EyeOff, FileText, Home } from 'lucide-react';
import {
  LEVEL_NAMES,
  MISSION_DURATION_MINUTES,
  MISSION_DURATION_SECONDS,
  HEART_COST_POINTS,
  MISTAKE_SCORE_PENALTY,
  TERM_DISCOVERY_POINTS,
  getActForLevel,
} from '../constants';
import Collapsible from './Collapsible';
import TeacherLevelSelect from './TeacherLevelSelect';
import { EASE_OUT_EXPO, EASE_IN_OUT } from '../utils/motion';

interface HUDProps {
  level: number;
  elapsedSeconds: number;
  lives: number;
  score: number;
  isDevMode: boolean;
  devAnswers?: Record<number, string> | null;
  isPaused: boolean;
  isTransitionPending?: boolean;
  isMuted: boolean;
  discoveredCount: number;
  totalTerms: number;
  setShowGlossary: (show: boolean) => void;
  setLevel: (level: number) => void;
  onPreloadLevel?: (targetLevel: number) => void;
  onPreviewInterlude?: (targetLevel: 4 | 11) => void;
  prevLevelDev: () => void;
  skipLevelDev: () => void;
  buyHeart: () => void;
  onTogglePause: () => void;
  onGoHome: () => void;
  onToggleMute: () => void;
  setIsDevMode?: (dev: boolean) => void;
  onOpenTeacherKit?: () => void;
  hideHeader?: boolean;
}

export default function HUD({
  level, elapsedSeconds, lives, score, isDevMode, devAnswers, isPaused, isTransitionPending = false, isMuted,
  discoveredCount, totalTerms,
  setShowGlossary, setLevel, onPreloadLevel, onPreviewInterlude, prevLevelDev, skipLevelDev, buyHeart, onTogglePause, onGoHome, onToggleMute, setIsDevMode, onOpenTeacherKit, hideHeader = false
}: HUDProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfCollapsed, setIsProfCollapsed] = useState(false);
  const [showDevAnswer, setShowDevAnswer] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [glossaryPlusOnes, setGlossaryPlusOnes] = useState<number[]>([]);
  
  const [scoreDiffs, setScoreDiffs] = useState<{id: number, diff: number}[]>([]);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    setShowDevAnswer(false);
  }, [level]);

  useEffect(() => {
    if (isPaused) {
      setIsMobileMenuOpen(false);
    }
  }, [isPaused]);

  useEffect(() => {
    if (score !== prevScoreRef.current) {
      const diff = score - prevScoreRef.current;
      if (diff !== 0) {
        const id = Date.now();
        setScoreDiffs(prev => [...prev, { id, diff }]);
        setTimeout(() => {
          setScoreDiffs(prev => prev.filter(item => item.id !== id));
        }, 1500);
      }
      prevScoreRef.current = score;
    }
  }, [score]);

  useEffect(() => {
    const handleGlossaryPlusOne = () => {
      const id = Date.now();
      setGlossaryPlusOnes(prev => [...prev, id]);
      setTimeout(() => {
        setGlossaryPlusOnes(prev => prev.filter(p => p !== id));
      }, 2000);
    };
    window.addEventListener('glossaryPlusOne', handleGlossaryPlusOne);
    return () => window.removeEventListener('glossaryPlusOne', handleGlossaryPlusOne);
  }, []);

  const remainingSeconds = MISSION_DURATION_SECONDS - Math.max(0, Math.floor(elapsedSeconds));
  const isOvertime = remainingSeconds < 0;
  const formatClock = (seconds: number) => {
    const abs = Math.abs(seconds);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    const base = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return seconds < 0 ? `+${base}` : base;
  };
  const formattedClock = formatClock(remainingSeconds);

  const completedCount = Math.max(0, Math.min(13, level - 1));
  const isInnovationLab = level === 13;
  const currentAct = getActForLevel(level);

  const isActiveMissionHud = level > 0 && level < 14 && lives > 0;

  return (
    <>
    {!hideHeader && (
    <header className={`fixed top-0 left-0 right-0 px-3 py-2.5 md:px-4 md:py-3 z-50 ${
      level === 0 ? 'bg-transparent' : 'bg-slate-950/70 backdrop-blur-xl border-b border-white/[0.06]'
    }`}>
      {/* 13-Step Progress Bar as Ultra-Fine Bottom Edge */}
      {level > 0 && level < 14 ? (
        <div
          className="absolute bottom-0 left-0 right-0 h-2.5 flex items-end px-0.5 gap-0.5 sm:gap-1 z-[60]"
          aria-label={`Progression : niveau ${level} sur 13 (${completedCount} complétés)`}
        >
          {Array.from({ length: 13 }, (_, idx) => {
            const step = idx + 1;
            const isCompleted = step < level;
            const isCurrent = step === level;
            return (
              <div
                key={step}
                onMouseEnter={() => setHoveredStep(step)}
                onMouseLeave={() => setHoveredStep(null)}
                className="h-full flex-1 flex items-end cursor-help group/step"
              >
                <div
                  className={`w-full h-[2.5px] rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-400/75 group-hover/step:bg-emerald-300'
                      : isCurrent
                      ? 'bg-cyan-300/95'
                      : 'bg-white/[0.08] group-hover/step:bg-white/25'
                  }`}
                />
              </div>
            );
          })}

          {/* Segment Hover Tooltip (no future level spoilers, tracks hovered segment) */}
          <AnimatePresence>
            {hoveredStep !== null && (() => {
              const stepPct = ((hoveredStep - 0.5) / 13) * 100;
              const stepAct = getActForLevel(hoveredStep);
              return (
                <motion.div
                  key="step-tooltip"
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.16, ease: EASE_OUT_EXPO },
                  }}
                  exit={{
                    opacity: 0,
                    y: -3,
                    scale: 0.97,
                    transition: { duration: 0.12, ease: EASE_IN_OUT },
                  }}
                  style={{ left: `${stepPct}%`, marginLeft: 0 }}
                  className="absolute top-full mt-2 w-max max-w-[calc(100vw-1rem)] z-[100] pointer-events-none transition-[left] duration-150 ease-out"
                >
                  <div
                    style={{ transform: `translateX(-${stepPct}%)` }}
                    className="relative bg-slate-900/95 backdrop-blur-md text-[10px] md:text-xs text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 shadow-xl font-sans not-italic font-normal tracking-normal text-center flex items-center gap-2 transition-transform duration-150 ease-out"
                  >
                    {stepAct && (
                      <span className="text-[10px] font-mono font-bold uppercase text-cyan-300/90">
                        {stepAct.label}
                      </span>
                    )}
                    <span className={`font-bold ${
                      hoveredStep < level ? 'text-emerald-400' : hoveredStep === level ? 'text-cyan-400' : 'text-slate-400'
                    }`}>
                      Niveau {hoveredStep}/13
                    </span>
                    {hoveredStep <= level && (
                      <span className="text-slate-300">{LEVEL_NAMES[hoveredStep]}</span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                      hoveredStep < level
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                        : hoveredStep === level
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {hoveredStep < level ? 'Validé' : hoveredStep === level ? 'En cours' : 'Verrouillé'}
                    </span>
                    <div
                      style={{ left: `clamp(12px, ${stepPct}%, calc(100% - 12px))` }}
                      className="hidden md:block absolute bottom-full -translate-x-1/2 border-4 border-transparent border-b-slate-700"
                    />
                    <div
                      style={{ left: `clamp(12px, ${stepPct}%, calc(100% - 12px))` }}
                      className="hidden md:block absolute bottom-[calc(100%-1px)] -translate-x-1/2 border-4 border-transparent border-b-slate-900"
                    />
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      ) : level > 0 ? (
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10" />
      ) : null}

      <div className={`max-w-7xl mx-auto relative z-[70] ${
        isActiveMissionHud
          ? 'flex flex-wrap justify-between items-center gap-2 lg:gap-3 xl:grid xl:grid-cols-[1fr_auto_1fr]'
          : 'flex flex-wrap justify-between items-center gap-2 lg:gap-3'
      }`}>
        
        {/* Left: Branding, Level Context & Dev Badge */}
        <div className="flex items-center gap-2 lg:gap-2.5 xl:justify-self-start">
          {level > 0 && (
            <button
              type="button"
              className="flex items-center gap-2 group/logo cursor-pointer relative bg-transparent border-0 p-0 rounded"
              onClick={onGoHome}
              aria-label="Retour à l'accueil"
            >
              <span className={`font-bold tracking-[0.16em] uppercase text-xs lg:text-[13px] text-slate-100/90 group-hover/logo:text-white transition-colors whitespace-nowrap ${isActiveMissionHud ? 'hidden sm:inline' : 'inline'}`}>
                <span className={isActiveMissionHud ? 'hidden xl:inline text-cyan-400/90' : 'text-cyan-400/90'}>MISSION </span>AQUA IA
              </span>
              {/* Custom tooltip for Logo */}
              <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-0 md:translate-x-0 md:mt-3.5 opacity-0 invisible translate-y-1 group-hover/logo:opacity-100 group-hover/logo:visible group-hover/logo:translate-y-0 transition-all duration-150 w-max bg-slate-900 text-[10px] md:text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal text-center">
                Retour à l'accueil
                <div className="hidden md:block absolute bottom-full left-6 border-4 border-transparent border-b-slate-700"></div>
                <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-6 border-4 border-transparent border-b-slate-900"></div>
              </div>
            </button>
          )}

          {level > 0 && level < 14 && (
            <div className="hidden md:flex items-center gap-2.5 relative group/level">
              <span className="w-px h-3.5 bg-white/15 shrink-0" aria-hidden="true" />
              <div
                className="flex items-center h-8 text-xs font-mono cursor-help select-none transition-colors"
                aria-label={`Niveau ${level} sur 13`}
              >
                <span className="text-slate-100 font-semibold tabular-nums group-hover/level:text-white transition-colors">{level}</span>
                <span className="text-slate-500 font-normal tabular-nums">/13</span>
              </div>
              <div className="absolute top-full left-2.5 mt-2 opacity-0 invisible translate-y-1 group-hover/level:opacity-100 group-hover/level:visible group-hover/level:translate-y-0 transition-all duration-150 w-max bg-slate-900 text-xs text-slate-200 px-3 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                <div className="flex flex-col gap-0.5 text-left">
                  {currentAct && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                      {currentAct.label} · {currentAct.title}
                    </span>
                  )}
                  <span className="font-semibold text-white">Niveau {level}/13 : {LEVEL_NAMES[level] || 'Laboratoire'}</span>
                  <span className="text-[10px] text-slate-400">{completedCount}/13 complétés</span>
                </div>
                <div className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-700"></div>
                <div className="absolute bottom-[calc(100%-1px)] left-4 border-4 border-transparent border-b-slate-900"></div>
              </div>
            </div>
          )}

          {isDevMode && (
            <div className="relative group/dev cursor-pointer flex items-center">
              <span 
                className="font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-slate-400 hover:border-rose-400/40 hover:text-rose-300 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (setIsDevMode) setIsDevMode(false);
                }}
              >
                PROF
              </span>
              {/* Custom Tooltip */}
              <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-3.5 opacity-0 invisible translate-y-1 group-hover/dev:opacity-100 group-hover/dev:visible group-hover/dev:translate-y-0 transition-all duration-150 w-max max-w-[90vw] bg-slate-900 text-[10px] md:text-xs text-slate-200 px-2.5 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal text-center">
                Désactiver le mode enseignant
                <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
              </div>
            </div>
          )}
        </div>
        {/* Center: Unified Diegetic Status Pill (matches Interlude HUD) */}
        {isActiveMissionHud && (
          <div className="flex items-center gap-2 xl:justify-self-center">
            <div className="flex items-center gap-2 sm:gap-2.5 h-8 px-3 rounded-full bg-slate-950/65 backdrop-blur-md border border-white/10 shadow-lg">
              {/* Lives */}
              <div className="flex items-center gap-1" aria-label={`${lives} vies restantes`}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="relative w-3.5 h-3.5 md:w-4 md:h-4 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 1 }}
                      animate={lives === 1 && !isInnovationLab && i < lives ? {
                        scale: [1, 1.2, 1],
                        opacity: 1
                      } : {
                        scale: i < lives ? 1 : 0.65,
                        opacity: i < lives ? 1 : 0.25,
                      }}
                      transition={lives === 1 && !isInnovationLab && i < lives ? {
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "easeInOut"
                      } : { 
                        duration: 0.3,
                        repeat: 0,
                        ease: "easeInOut"
                      }}
                    >
                      <Heart className={`w-full h-full ${i < lives ? 'text-rose-400 fill-rose-400' : 'text-slate-600'}`} />
                    </motion.div>
                  </div>
                ))}
                {lives < 3 && !isInnovationLab && (
                  <div className="relative group ml-0.5 flex items-center">
                    <button 
                      onClick={buyHeart}
                      disabled={score < HEART_COST_POINTS}
                      className={`inline-flex items-center justify-center gap-0.5 h-6 px-1.5 rounded-full transition-colors ${
                        score >= HEART_COST_POINTS 
                          ? 'bg-rose-500/15 text-rose-200 border border-rose-400/35 hover:bg-rose-500/25 cursor-pointer' 
                          : 'bg-white/[0.04] text-slate-500 border border-white/[0.08] cursor-not-allowed'
                      }`}
                      aria-label={`Acheter une vie (${HEART_COST_POINTS} pts)`}
                    >
                      <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
                      <span className="hidden sm:inline text-[10px] font-mono font-semibold tabular-nums">{HEART_COST_POINTS}</span>
                    </button>
                    {/* Tooltip */}
                    <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150 w-max max-w-[90vw] bg-slate-900 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                      <div className="flex items-center gap-1.5 justify-center">
                        <span>Acheter une vie :</span>
                        <span className={score >= HEART_COST_POINTS ? "text-amber-300 font-bold" : "text-rose-400 font-bold"}>{HEART_COST_POINTS} pts</span>
                      </div>
                      <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                      <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                    </div>
                  </div>
                )}
              </div>

              <span className="w-px h-3.5 bg-white/12" aria-hidden="true" />

              {/* Timer + Integrated Pause */}
              <div className="flex items-center gap-1.5">
                <div className="relative group/timer">
                  <div
                    className={`flex items-center gap-1.5 transition-colors duration-300 cursor-help ${
                      isInnovationLab || isPaused
                        ? 'text-cyan-300'
                        : isOvertime
                        ? 'text-amber-300'
                        : remainingSeconds < 300
                        ? 'text-rose-400'
                        : 'text-slate-100'
                    }`}
                    aria-label={
                      isInnovationLab || isPaused
                        ? `Chrono en pause : ${formattedClock}`
                        : isOvertime
                        ? `Prolongation : ${formattedClock}`
                        : `Temps restant sur l'objectif ${MISSION_DURATION_MINUTES} min : ${formattedClock}`
                    }
                  >
                    {isInnovationLab || isPaused ? (
                      <Pause className="w-3.5 h-3.5 text-cyan-300" />
                    ) : (
                      <Clock className={`w-3.5 h-3.5 ${isOvertime ? 'text-amber-300' : remainingSeconds < 300 ? 'text-rose-400' : 'text-cyan-300/85'}`} />
                    )}
                    <span className="font-semibold font-mono text-xs md:text-[13px] tabular-nums">{formattedClock}</span>
                    {(isInnovationLab || isPaused) ? (
                      <span className="hidden sm:inline text-[10px] font-mono font-semibold uppercase tracking-wider text-cyan-300/85">
                        Pause
                      </span>
                    ) : isOvertime ? (
                      <span className="hidden sm:inline text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-300/85">
                        Prol.
                      </span>
                    ) : null}
                  </div>
                  {/* Timer Tooltip */}
                  <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 opacity-0 invisible translate-y-1 group-hover/timer:opacity-100 group-hover/timer:visible group-hover/timer:translate-y-0 transition-all duration-150 w-max max-w-[90vw] bg-slate-900 text-xs text-slate-200 px-2.5 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal text-center">
                    {isInnovationLab ? (
                      <>
                        Chrono en pause :<br />Prenez le temps de concevoir votre brevet
                      </>
                    ) : isPaused ? (
                      <>
                        Chrono en pause :<br />Cliquez sur Reprendre pour continuer la mission
                      </>
                    ) : isOvertime ? (
                      <>
                        Prolongation ({formattedClock}) :<br />La mission continue librement sans blocage
                      </>
                    ) : (
                      <>
                        Objectif {MISSION_DURATION_MINUTES} min :<br />Passage en prolongation libre après 00:00
                      </>
                    )}
                    <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                    <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                  </div>
                </div>
                
                {!isInnovationLab && (
                  <div className="relative group/pause flex items-center">
                    <button
                      type="button"
                      onClick={onTogglePause}
                      disabled={isTransitionPending}
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                        isTransitionPending
                          ? 'text-slate-600 cursor-not-allowed'
                          : isPaused
                          ? 'bg-cyan-400/20 text-cyan-200 hover:bg-cyan-400/30 cursor-pointer'
                          : 'bg-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.14] cursor-pointer'
                      }`}
                      aria-label={isPaused ? "Reprendre le chrono" : "Mettre le chrono en pause"}
                    >
                      {isPaused ? (
                        <Play className="w-2.5 h-2.5 fill-current" />
                      ) : (
                        <Pause className="w-2.5 h-2.5 fill-current" />
                      )}
                    </button>
                    {/* Tooltip for Pause */}
                    <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 opacity-0 invisible translate-y-1 group-hover/pause:opacity-100 group-hover/pause:visible group-hover/pause:translate-y-0 transition-all duration-150 w-max max-w-[90vw] bg-slate-900 text-[10px] md:text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                      <span>{isPaused ? "Reprendre la mission" : "Mettre en pause (point classe)"}</span>
                      <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                      <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                    </div>
                  </div>
                )}
              </div>

              <span className="w-px h-3.5 bg-white/12" aria-hidden="true" />

              {/* Score */}
              <div className="relative group/score">
                <div
                  className="flex items-center gap-1 cursor-help relative"
                  aria-label={`Score : ${score}`}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-300/90 text-amber-300/90" />
                  <motion.span
                    key={score}
                    initial={{ scale: 1.18, color: score < prevScoreRef.current ? '#fb7185' : '#6ee7b7' }}
                    animate={{ scale: 1, color: '#f8fafc' }}
                    transition={{ duration: 0.28 }}
                    className="font-semibold font-mono text-white text-xs md:text-[13px] tabular-nums inline-block"
                  >
                    {score}
                  </motion.span>
                  
                  <AnimatePresence>
                    {scoreDiffs.map(item => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 0, scale: 0.5, x: '-50%' }}
                        animate={{ opacity: 1, y: item.diff > 0 ? -25 : 25, scale: 1.15, x: '-50%' }}
                        exit={{ opacity: 0, y: item.diff > 0 ? -35 : 35, scale: 0.85, x: '-50%' }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`absolute left-1/2 font-bold font-mono text-sm drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] pointer-events-none z-[60] ${item.diff > 0 ? 'text-emerald-300' : 'text-rose-400'}`}
                      >
                        {item.diff > 0 ? `+${item.diff}` : item.diff}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {/* Tooltip for Score */}
                <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 opacity-0 invisible translate-y-1 group-hover/score:opacity-100 group-hover/score:visible group-hover/score:translate-y-0 transition-all duration-150 w-max max-w-[90vw] bg-slate-900 text-xs text-slate-200 px-3 py-2 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                  <div className="flex flex-col gap-1 text-center md:text-left">
                    <span className="font-bold text-amber-300">Score de Mission</span>
                    <span>Missions, glossaire (+{TERM_DISCOVERY_POINTS} pts/terme) et erreurs (-{MISTAKE_SCORE_PENALTY} pts).</span>
                    <span className="text-[10px] text-slate-400 border-t border-slate-800 mt-1 pt-1 italic whitespace-normal md:whitespace-nowrap">Chaque niveau validé sans erreur maximise votre rang final.</span>
                  </div>
                  <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                  <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                </div>
              </div>
            </div>

            {/* Mobile Level Pill (Always visible on mobile) */}
            <div
              className="md:hidden flex items-center gap-1 bg-slate-950/65 px-2.5 h-8 rounded-full border border-white/10 text-[11px] font-mono font-semibold text-slate-200"
              aria-label={`Niveau ${level} sur 13`}
            >
              <span>{level}/13</span>
            </div>

            {/* Mobile Mute Button */}
            <button
              type="button"
              onClick={onToggleMute}
              className={`md:hidden w-8 h-8 flex items-center justify-center rounded-full border transition-colors ${
                isMuted
                  ? 'bg-rose-950/60 border-rose-400/35 text-rose-300'
                  : 'bg-slate-950/65 border-white/10 text-slate-300'
              }`}
              aria-label={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              type="button"
              className="md:hidden text-slate-200 w-8 h-8 flex items-center justify-center rounded-full bg-slate-950/65 border border-white/10 hover:bg-white/10 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isMobileMenuOpen ? (
                  <motion.span
                    key="menu-close"
                    initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.16, ease: EASE_OUT_EXPO } }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.8, transition: { duration: 0.12 } }}
                    className="inline-flex"
                  >
                    <X className="w-4 h-4" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu-open"
                    initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.16, ease: EASE_OUT_EXPO } }}
                    exit={{ opacity: 0, rotate: -90, scale: 0.8, transition: { duration: 0.12 } }}
                    className="inline-flex"
                  >
                    <Menu className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        )}

        {/* Right: Utility Actions */}
        <div className="flex items-center gap-1.5 lg:gap-2 xl:justify-self-end">
          {level > 0 && level < 14 && (
            <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
              <div className="relative group">
                <button 
                  onClick={() => { setShowGlossary(true); }}
                  className="relative flex items-center gap-1.5 bg-slate-950/65 hover:bg-white/[0.09] backdrop-blur-md text-slate-200 hover:text-white h-8 px-3 rounded-full border border-white/10 hover:border-white/20 text-xs font-medium transition-colors shadow-lg cursor-pointer"
                  aria-label={`Ouvrir le glossaire (${discoveredCount} sur ${totalTerms} termes découverts)`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-300/85 shrink-0" />
                  <span className="hidden lg:inline">Glossaire</span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-400">
                    {discoveredCount}/{totalTerms}
                  </span>

                  <AnimatePresence>
                    {glossaryPlusOnes.map(id => (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                        animate={{ opacity: 1, y: -25, scale: 1.15 }}
                        exit={{ opacity: 0, y: -35, scale: 0.85 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 text-emerald-300 font-bold font-mono text-base drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] pointer-events-none z-50"
                      >
                        +1
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </button>
                <div className="absolute top-full right-0 mt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150 w-max bg-slate-900 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                  Ouvrir le glossaire
                  <div className="absolute bottom-full right-6 border-4 border-transparent border-b-slate-700"></div>
                  <div className="absolute bottom-[calc(100%-1px)] right-6 border-4 border-transparent border-b-slate-900"></div>
                </div>
              </div>
            </div>
          )}

          {level === 14 && (
            <div className="relative group">
              <button
                onClick={() => setShowGlossary(true)}
                className="relative flex items-center gap-1.5 bg-slate-950/65 hover:bg-white/[0.09] backdrop-blur-md text-slate-200 hover:text-white h-8 px-3 rounded-full border border-white/10 hover:border-white/20 text-xs font-medium transition-colors shadow-lg cursor-pointer"
                aria-label={`Ouvrir le glossaire (${discoveredCount} sur ${totalTerms} termes découverts)`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-300/85 shrink-0" />
                <span className="hidden sm:inline">Glossaire</span>
                <span className="font-mono text-[11px] tabular-nums text-slate-400">
                  {discoveredCount}/{totalTerms}
                </span>
              </button>
              <div className="hidden md:block opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150 absolute top-full right-0 mt-2 w-max bg-slate-900 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                Ouvrir le glossaire
                <div className="absolute bottom-full right-6 border-4 border-transparent border-b-slate-700"></div>
                <div className="absolute bottom-[calc(100%-1px)] right-6 border-4 border-transparent border-b-slate-900"></div>
              </div>
            </div>
          )}

          {/* Mute Toggle (Always visible on desktop, and visible on mobile when outside active levels) */}
          <div className={`relative group/mute ${(level > 0 && level < 14 && lives > 0) ? 'hidden md:block' : 'block'}`}>
            <button
              type="button"
              onClick={onToggleMute}
              className={`flex items-center justify-center gap-1.5 h-8 ${level === 0 ? 'px-3' : 'w-8'} rounded-full backdrop-blur-md border transition-colors shadow-lg cursor-pointer ${
                isMuted
                  ? 'bg-rose-950/60 border-rose-400/35 text-rose-300 hover:bg-rose-900/60'
                  : 'bg-slate-950/65 border-white/10 text-slate-300 hover:text-white hover:border-white/25 hover:bg-white/[0.08]'
              }`}
              aria-label={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 shrink-0" /> : <Volume2 className="w-4 h-4 shrink-0" />}
              {level === 0 && (
                <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                  {isMuted ? 'Muet' : 'Son'}
                </span>
              )}
            </button>
            <div className="hidden md:block opacity-0 invisible translate-y-1 group-hover/mute:opacity-100 group-hover/mute:visible group-hover/mute:translate-y-0 transition-all duration-150 absolute top-full right-0 mt-2 w-max bg-slate-900 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
              {isMuted ? "Activer le son" : "Couper le son"}
              <div className="absolute bottom-full right-3 border-4 border-transparent border-b-slate-700"></div>
              <div className="absolute bottom-[calc(100%-1px)] right-3 border-4 border-transparent border-b-slate-900"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Expanded Menu */}
      <Collapsible
        isOpen={isMobileMenuOpen && level > 0 && level < 14}
        className="md:hidden"
        innerClassName="mt-3 pt-3 border-t border-white/[0.08] flex flex-col gap-2.5"
      >
        <div className="flex gap-2">
          <button 
            onClick={() => { setShowGlossary(true); setIsMobileMenuOpen(false); }}
            className="relative flex-1 flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 px-3 py-2 rounded-xl border border-white/10 text-xs font-medium transition-colors"
          >
            <BookOpen className="w-4 h-4 text-emerald-300/85" />
            <span>Glossaire</span>
            <span className="font-mono text-[11px] tabular-nums text-slate-400">
              {discoveredCount}/{totalTerms}
            </span>
            
            <AnimatePresence>
              {glossaryPlusOnes.map(id => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                  animate={{ opacity: 1, y: -25, scale: 1.15 }}
                  exit={{ opacity: 0, y: -35, scale: 0.85 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 text-emerald-300 font-bold font-mono text-base drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] pointer-events-none z-50"
                >
                  +1
                </motion.div>
              ))}
            </AnimatePresence>
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-medium bg-slate-950/65 px-3 py-2 rounded-xl border border-white/10 w-full">
          <Layers className="w-3.5 h-3.5 text-cyan-300/85 shrink-0" />
          <span className="text-slate-300">
            {currentAct ? `${currentAct.label} · ` : ''}Niveau {level}/13 : <span className="text-white">{LEVEL_NAMES[level]}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => { setIsMobileMenuOpen(false); onGoHome(); }}
          className="flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white px-3 py-2 rounded-xl border border-white/10 text-xs font-medium transition-colors w-full"
        >
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <span>Retour à l'accueil</span>
        </button>
      </Collapsible>
    </header>
    )}

      {/* Dev Controls Floating Card (outside <header> so backdrop-blur doesn't trap position:fixed) */}
      <AnimatePresence>
      {isDevMode && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.24, ease: EASE_OUT_EXPO } }}
          exit={{ opacity: 0, y: 12, scale: 0.95, transition: { duration: 0.16, ease: EASE_IN_OUT } }}
          className="fixed right-3 bottom-3 z-[55] flex flex-col items-end gap-2 font-sans"
        >
          <AnimatePresence mode="wait" initial={false}>
          {isProfCollapsed ? (
            <motion.button
              key="prof-collapsed"
              type="button"
              initial={{ opacity: 0, scale: 0.9, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT_EXPO } }}
              exit={{ opacity: 0, scale: 0.92, y: 4, transition: { duration: 0.13, ease: EASE_IN_OUT } }}
              onClick={() => setIsProfCollapsed(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-white/15 text-slate-300 hover:text-white hover:border-white/30 text-[11px] font-semibold tracking-wider uppercase shadow-lg transition-colors origin-bottom-right"
              title="Déplier le menu enseignant"
            >
              <span>MENU ENSEIGNANT</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </motion.button>
          ) : (
            <motion.div
              key="prof-expanded"
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT_EXPO } }}
              exit={{ opacity: 0, scale: 0.94, y: 8, transition: { duration: 0.15, ease: EASE_IN_OUT } }}
              className="flex flex-col items-end gap-2 origin-bottom-right"
            >
              {/* Answer Card (Hidden by default to prevent spoilers on classroom projector) */}
              <AnimatePresence>
                {devAnswers?.[level] && showDevAnswer && (
                  <motion.div
                    key={`dev-answer-${level}`}
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: EASE_OUT_EXPO } }}
                    exit={{ opacity: 0, y: 6, scale: 0.96, transition: { duration: 0.14, ease: EASE_IN_OUT } }}
                    className="p-3 bg-slate-900/95 backdrop-blur border border-indigo-500/40 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.15)] flex flex-col gap-1.5 w-64 text-center"
                  >
                    <div className="text-xs uppercase font-black text-indigo-300 tracking-wider">Réponse Attendue</div>
                    <div className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/40 py-2 px-2.5 rounded border border-emerald-500/30 whitespace-pre-line leading-normal">
                      {devAnswers[level]}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Card: Menu Enseignant */}
              <div className="p-3 bg-slate-900/95 backdrop-blur border border-indigo-500/40 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.2)] flex flex-col gap-2.5 w-64">
                <div className="flex justify-between items-center border-b border-indigo-500/20 pb-1.5">
                  <span className="text-xs uppercase font-black tracking-widest text-indigo-300">MENU ENSEIGNANT</span>
                  <button
                    type="button"
                    onClick={() => setIsProfCollapsed(true)}
                    className="text-indigo-300/80 hover:text-white p-0.5 rounded transition-colors"
                    title="Réduire le menu enseignant"
                    aria-label="Réduire le menu enseignant"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <TeacherLevelSelect
                  level={level}
                  onSelectLevel={setLevel}
                  onPreviewInterlude={onPreviewInterlude}
                  onHoverLevel={onPreloadLevel}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={prevLevelDev}
                    disabled={level <= 0}
                    className={`flex items-center justify-center w-9 h-9 rounded-full border transition-colors shrink-0 ${
                      level <= 0
                        ? 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
                        : 'bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border-indigo-500/40'
                    }`}
                    title="Niveau précédent"
                    aria-label="Niveau précédent"
                  >
                    <Rewind className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={skipLevelDev}
                    disabled={level >= 14}
                    className={`flex items-center justify-center flex-1 gap-1.5 h-9 rounded-full border text-xs font-bold transition-all ${
                      level >= 14
                        ? 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
                        : 'bg-indigo-900/70 hover:bg-indigo-800/70 text-indigo-200 border-indigo-500/50 hover:brightness-110'
                    }`}
                    title="Passer le niveau"
                    aria-label="Passer le niveau"
                  >
                    <FastForward className="w-4 h-4" />
                    <span>SKIP</span>
                  </button>
                </div>

                {devAnswers?.[level] && (
                  <button
                    type="button"
                    onClick={() => setShowDevAnswer((prev) => !prev)}
                    className={`flex items-center justify-center gap-1.5 w-full py-2 px-2.5 rounded-lg border text-xs font-bold transition-colors ${
                      showDevAnswer
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                        : 'bg-slate-950/70 border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/60'
                    }`}
                    aria-expanded={showDevAnswer}
                  >
                    {showDevAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showDevAnswer ? 'Masquer la réponse' : 'Voir la réponse'}</span>
                  </button>
                )}

                {onOpenTeacherKit && (
                  <button
                    type="button"
                    onClick={onOpenTeacherKit}
                    className="flex items-center justify-center gap-1.5 w-full py-2 px-2.5 rounded-lg border border-indigo-500/25 bg-slate-950/50 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-200 text-xs font-semibold transition-colors"
                    title="Ouvrir la fiche pédagogique (déroulé, programmes, débat)"
                  >
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Kit Enseignant</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
