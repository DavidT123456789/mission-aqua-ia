import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, Clock, Pause, Play, Plus, Star, Heart, FastForward, Rewind, Menu, X, Volume2, VolumeX, BookOpen, Layers, ChevronDown, ChevronUp, Eye, EyeOff, FileText } from 'lucide-react';
import {
  LEVEL_NAMES,
  MISSION_DURATION_SECONDS,
  HEART_COST_POINTS,
  MISTAKE_SCORE_PENALTY,
  TIME_BONUS_COST_POINTS,
  TIME_BONUS_SECONDS,
  TERM_DISCOVERY_POINTS,
  getActForLevel,
} from '../constants';

interface HUDProps {
  level: number;
  timeLeft: number;
  lives: number;
  waterSaved: number;
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
  prevLevelDev: () => void;
  skipLevelDev: () => void;
  buyHeart: () => void;
  buyTime: () => void;
  onTogglePause: () => void;
  onGoHome: () => void;
  onToggleMute: () => void;
  setIsDevMode?: (dev: boolean) => void;
  onOpenTeacherKit?: () => void;
}

export default function HUD({
  level, timeLeft, lives, waterSaved, score, isDevMode, devAnswers, isPaused, isTransitionPending = false, isMuted,
  discoveredCount, totalTerms,
  setShowGlossary, setLevel, prevLevelDev, skipLevelDev, buyHeart, buyTime, onTogglePause, onGoHome, onToggleMute, setIsDevMode, onOpenTeacherKit
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const completedCount = Math.max(0, Math.min(13, level - 1));
  const isInnovationLab = level === 13;
  const currentAct = getActForLevel(level);

  const isActiveMissionHud = level > 0 && level < 14 && timeLeft > 0 && lives > 0;

  return (
    <>
    <header className="fixed top-0 left-0 right-0 p-3 md:p-4 bg-slate-950/80 backdrop-blur-md z-50">
      {/* 13-Step Progress Bar as Bottom Border */}
      {level > 0 && level < 14 ? (
        <div
          className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-950 px-0.5 flex items-center gap-0.5 sm:gap-1 z-[60]"
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
                className={`h-full flex-1 rounded-full transition-all duration-300 cursor-help ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : isCurrent
                    ? 'bg-cyan-400'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              />
            );
          })}

          {/* Segment Hover Tooltip (no future level spoilers, tracks hovered segment) */}
          {hoveredStep !== null && (() => {
            const stepPct = ((hoveredStep - 0.5) / 13) * 100;
            const stepAct = getActForLevel(hoveredStep);
            return (
              <div
                style={{ left: `${stepPct}%`, transform: `translateX(-${stepPct}%)` }}
                className="absolute top-full mt-2 w-max max-w-[calc(100vw-1rem)] bg-slate-900 text-[10px] md:text-xs text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal text-center flex items-center gap-2 transition-[left,transform] duration-150 ease-out"
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
            );
          })()}
        </div>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10" />
      )}

      <div className={`max-w-7xl mx-auto relative z-[70] ${
        isActiveMissionHud
          ? 'flex flex-wrap justify-between items-center gap-2 lg:gap-3 xl:grid xl:grid-cols-[1fr_auto_1fr]'
          : 'flex flex-wrap justify-between items-center gap-2 lg:gap-3'
      }`}>
        
        {/* Left: Branding, Level Context & Dev Badge */}
        <div className="flex items-center gap-2 lg:gap-2.5 xl:justify-self-start">
          <button
            type="button"
            className="flex items-center gap-2 group/logo cursor-pointer relative bg-transparent border-0 p-0 rounded"
            onClick={onGoHome}
            aria-label="Retour à l'accueil"
          >
            <span className={`font-bold tracking-[0.15em] lg:tracking-[0.25em] uppercase text-sm lg:text-base bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent hover:brightness-125 transition-all ${isActiveMissionHud ? 'hidden sm:inline' : 'inline'}`}>
              AQUA-IA
            </span>
            {/* Custom tooltip for Logo */}
            <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-0 md:translate-x-0 md:mt-3.5 opacity-0 invisible translate-y-1 group-hover/logo:opacity-100 group-hover/logo:visible group-hover/logo:translate-y-0 transition-all duration-150 w-max bg-slate-900 text-[10px] md:text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal text-center">
              Retour à l'accueil
              <div className="hidden md:block absolute bottom-full left-6 border-4 border-transparent border-b-slate-700"></div>
              <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-6 border-4 border-transparent border-b-slate-900"></div>
            </div>
          </button>

          {level > 0 && level < 14 && (
            <div className="hidden md:block relative group/level">
              <div
                className="flex items-center gap-1.5 h-8 text-xs font-bold font-mono bg-slate-900/40 px-2.5 rounded-full border border-white/10 transition-colors hover:border-white/25 cursor-help"
                aria-label={`Niveau ${level} sur 13`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400/80" />
                {currentAct && (
                  <span className="text-[10px] text-cyan-300/90 uppercase tracking-wider">{currentAct.label} ·</span>
                )}
                <span className="text-slate-200 tabular-nums">{level}/13</span>
              </div>
              <div className="absolute top-full left-0 mt-2 opacity-0 invisible translate-y-1 group-hover/level:opacity-100 group-hover/level:visible group-hover/level:translate-y-0 transition-all duration-150 w-max bg-slate-900 text-xs text-slate-200 px-3 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                <div className="flex flex-col gap-0.5 text-left">
                  {currentAct && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                      {currentAct.label} : {currentAct.title}
                    </span>
                  )}
                  <span className="font-bold text-emerald-400">Niveau {level}/13 : {LEVEL_NAMES[level] || 'Laboratoire'}</span>
                  <span className="text-[10px] text-slate-400">{completedCount}/13 complétés</span>
                </div>
                <div className="absolute bottom-full left-6 border-4 border-transparent border-b-slate-700"></div>
                <div className="absolute bottom-[calc(100%-1px)] left-6 border-4 border-transparent border-b-slate-900"></div>
              </div>
            </div>
          )}

          {isDevMode && (
            <div className="relative group/dev cursor-pointer flex items-center">
              <span 
                className="text-indigo-500 text-[10px] md:text-xs font-black animate-pulse hover:text-red-500 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (setIsDevMode) setIsDevMode(false);
                }}
              >
                [PROF]
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
        {/* Center: Main Stats (Always visible) */}
        {isActiveMissionHud && (
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 xl:justify-self-center">
            {/* Lives */}
            <div className="flex items-center gap-1" aria-label={`${lives} vies restantes`}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="relative w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={lives === 1 && !isInnovationLab && i < lives ? {
                      scale: [1, 1.2, 1],
                      opacity: 1
                    } : {
                      scale: i < lives ? 1 : 0.5,
                      opacity: i < lives ? 1 : 0.3,
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
                    <Heart className={`w-full h-full ${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-600'}`} />
                  </motion.div>
                </div>
              ))}
              {lives < 3 && !isInnovationLab && (
                <div className="relative group ml-1 flex items-center">
                  <button 
                    onClick={buyHeart}
                    disabled={score < HEART_COST_POINTS}
                    className={`inline-flex items-center justify-center gap-0.5 h-7 md:h-8 px-2 md:px-2.5 rounded-full transition-colors ${
                      score >= HEART_COST_POINTS 
                        ? 'bg-red-900/50 text-red-200 border border-red-500/50 hover:bg-red-800/60 cursor-pointer' 
                        : 'bg-slate-800/80 text-slate-400/75 border border-slate-700 cursor-not-allowed'
                    }`}
                    aria-label={`Acheter une vie (${HEART_COST_POINTS} pts)`}
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span className="hidden sm:inline text-[10px] md:text-[11px] font-mono font-bold tabular-nums">{HEART_COST_POINTS}</span>
                  </button>
                  {/* Tooltip */}
                  <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150 w-max max-w-[90vw] bg-slate-900 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span>Acheter une vie :</span>
                      <span className={score >= HEART_COST_POINTS ? "text-yellow-400 font-bold" : "text-red-400 font-bold"}>{HEART_COST_POINTS} pts</span>
                    </div>
                    <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                    <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1.5">
              <div className="relative group/timer">
                <div
                  className={`flex items-center gap-1.5 md:gap-2 h-7 md:h-8 px-2.5 md:px-3 rounded-full border transition-all duration-500 cursor-help ${
                    isInnovationLab || isPaused
                      ? 'border-cyan-500/40 text-cyan-300 bg-cyan-950/20'
                      : timeLeft < 300
                      ? 'border-red-500 text-red-500 bg-red-950/20'
                      : 'border-emerald-500/30 text-emerald-400 bg-emerald-950/10'
                  }`}
                  aria-label={isInnovationLab || isPaused ? `Chrono en pause : ${formatTime(timeLeft)}` : `Temps restant : ${formatTime(timeLeft)}`}
                >
                  {isInnovationLab || isPaused ? (
                    <Pause className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400" />
                  ) : (
                    <Clock className={`w-3.5 h-3.5 md:w-4 md:h-4 ${timeLeft < 300 ? 'text-red-400' : 'text-emerald-400'}`} />
                  )}
                  <span className="font-bold font-mono text-xs md:text-sm tabular-nums">{formatTime(timeLeft)}</span>
                  {(isInnovationLab || isPaused) && (
                    <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider text-cyan-400/90">
                      PAUSE
                    </span>
                  )}
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
                  ) : (
                    <>
                      Temps restant :<br />Résolvez les missions avant 00:00
                    </>
                  )}
                  <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                  <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                </div>
              </div>
              
              {!isInnovationLab && (
                <>
                  <div className="relative group/pause flex items-center">
                    <button
                      type="button"
                      onClick={onTogglePause}
                      disabled={isTransitionPending}
                      className={`inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full transition-all ${
                        isTransitionPending
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          : isPaused
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 hover:bg-cyan-500/30 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)] cursor-pointer'
                          : 'bg-slate-900/70 text-cyan-300 border border-cyan-500/35 hover:bg-cyan-950/70 hover:border-cyan-400/60 hover:shadow-[0_0_10px_rgba(34,211,238,0.25)] cursor-pointer'
                      }`}
                      aria-label={isPaused ? "Reprendre le chrono" : "Mettre le chrono en pause"}
                    >
                      {isPaused ? (
                        <Play className="w-3 h-3 fill-current" />
                      ) : (
                        <Pause className="w-3 h-3 fill-current" />
                      )}
                    </button>
                    {/* Tooltip for Pause */}
                    <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 opacity-0 invisible translate-y-1 group-hover/pause:opacity-100 group-hover/pause:visible group-hover/pause:translate-y-0 transition-all duration-150 w-max max-w-[90vw] bg-slate-900 text-[10px] md:text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                      <span>{isPaused ? "Reprendre la mission" : "Mettre en pause (point classe)"}</span>
                      <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                      <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                    </div>
                  </div>

                  {timeLeft <= MISSION_DURATION_SECONDS - TIME_BONUS_SECONDS && (
                    <div className="relative group/buytime flex items-center">
                      <button 
                        onClick={buyTime}
                        disabled={score < TIME_BONUS_COST_POINTS}
                        className={`inline-flex items-center justify-center gap-0.5 h-7 md:h-8 px-2 md:px-2.5 rounded-full transition-all ${
                          score >= TIME_BONUS_COST_POINTS
                            ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-800/50 cursor-pointer' 
                            : 'bg-slate-800/70 text-slate-400/75 border border-slate-700/80 cursor-not-allowed'
                        }`}
                        aria-label="Acheter du temps"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                        <span className="hidden md:inline text-[11px] font-mono font-bold">{TIME_BONUS_SECONDS / 60}m</span>
                      </button>
                      {/* Tooltip for buying time */}
                      <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 opacity-0 invisible translate-y-1 group-hover/buytime:opacity-100 group-hover/buytime:visible group-hover/buytime:translate-y-0 transition-all duration-150 w-max max-w-[90vw] bg-slate-900 text-[11px] md:text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                        <div className="flex items-center gap-1.5 justify-center">
                          <span>Ajouter {TIME_BONUS_SECONDS / 60} min :</span>
                          <span className={score >= TIME_BONUS_COST_POINTS ? "text-yellow-400 font-bold" : "text-red-400 font-bold"}>{TIME_BONUS_COST_POINTS} pts</span>
                        </div>
                        <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                        <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Score */}
            <div className="relative group/score">
              <div
                className="flex items-center gap-1.5 bg-slate-900/40 h-7 md:h-8 px-2.5 md:px-3 rounded-full border border-yellow-500/30 cursor-help relative"
                aria-label={`Score : ${score}`}
              >
                <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400" />
                <motion.span
                  key={score}
                  initial={{ scale: 1.2, color: score < prevScoreRef.current ? '#ef4444' : '#ffffff' }}
                  animate={{ scale: 1, color: '#facc15' }}
                  transition={{ duration: 0.25 }}
                  className="font-bold font-mono text-yellow-400 text-xs md:text-sm tabular-nums inline-block"
                >
                  {score}
                </motion.span>
                
                <AnimatePresence>
                  {scoreDiffs.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 0, scale: 0.5, x: '-50%' }}
                      animate={{ opacity: 1, y: item.diff > 0 ? -25 : 25, scale: 1.2, x: '-50%' }}
                      exit={{ opacity: 0, y: item.diff > 0 ? -35 : 35, scale: 0.8, x: '-50%' }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`absolute left-1/2 font-black text-sm md:text-base drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] pointer-events-none z-[60] ${item.diff > 0 ? 'text-emerald-400' : 'text-red-500'}`}
                    >
                      {item.diff > 0 ? `+${item.diff}` : item.diff}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {/* Tooltip for Score */}
              <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 opacity-0 invisible translate-y-1 group-hover/score:opacity-100 group-hover/score:visible group-hover/score:translate-y-0 transition-all duration-150 w-max max-w-[90vw] bg-slate-900 text-xs text-slate-200 px-3 py-2 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                <div className="flex flex-col gap-1 text-center md:text-left">
                  <span className="font-bold text-yellow-500">Score de Mission</span>
                  <span>Missions, glossaire (+{TERM_DISCOVERY_POINTS} pts/terme) et erreurs (-{MISTAKE_SCORE_PENALTY} pts).</span>
                  <span className="text-[10px] text-slate-400 border-t border-slate-800 mt-1 pt-1 italic whitespace-normal md:whitespace-nowrap">Visez le score maximum à chaque niveau !</span>
                </div>
                <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
              </div>
            </div>

            {/* Mobile Level Pill (Always visible on mobile) */}
            <div
              className="md:hidden flex items-center gap-1 bg-slate-900/60 px-2 py-1 rounded-full border border-emerald-500/30 text-[11px] font-bold text-emerald-400"
              aria-label={`Niveau ${level} sur 13`}
            >
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>{level}/13</span>
            </div>

            {/* Mobile Mute Button */}
            <button
              type="button"
              onClick={onToggleMute}
              className={`md:hidden p-1.5 rounded-full border transition-colors ${
                isMuted
                  ? 'bg-red-950/40 border-red-500/40 text-red-400'
                  : 'bg-slate-900/50 border-emerald-500/30 text-emerald-400'
              }`}
              aria-label={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-emerald-400 p-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        )}

        {/* Right: Water Gauge & Utility Actions */}
        <div className="flex items-center gap-1.5 lg:gap-2 xl:justify-self-end">
          {level > 0 && level < 14 && (
            <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
              {/* Water Gauge */}
              <div className="relative group/water">
                <motion.div 
                  key={waterSaved}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1.5 lg:gap-2 bg-slate-900/40 h-8 px-2.5 lg:px-3 rounded-full border border-cyan-500/25 cursor-help" 
                  aria-label={`Eau sauvée : ${waterSaved}%`}
                >
                  <Droplets className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-cyan-400 shrink-0" />
                  <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider text-cyan-300/80">
                    Eau
                  </span>
                  <div className="w-14 lg:w-20 xl:w-24 h-2.5 bg-slate-800/70 rounded-full overflow-hidden relative border border-cyan-900/50">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500"
                      initial={{ width: '0%' }}
                      animate={{ width: `${waterSaved}%` }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                    {/* Liquid shine effect (GPU transform) */}
                    <motion.div
                      className="absolute top-0 left-0 h-full w-8 bg-white/20 skew-x-12 blur-sm will-change-transform"
                      animate={{ x: ['-120%', '380%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <span className="font-bold font-mono text-xs text-white drop-shadow-md tabular-nums">{waterSaved}%</span>
                </motion.div>
                {/* Tooltip for Water Gauge */}
                <div className="absolute top-full right-0 mt-2 opacity-0 invisible translate-y-1 group-hover/water:opacity-100 group-hover/water:visible group-hover/water:translate-y-0 transition-all duration-150 w-64 bg-slate-900 text-xs text-slate-200 px-3 py-2 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-cyan-400">Taux de Préservation</span>
                    <span>Stabilisation du réseau (86 %), complétée par votre brevet Innovation Lab (+12 % max) et les 2 défis bonus (+2 %).</span>
                  </div>
                  <div className="absolute bottom-full right-6 border-4 border-transparent border-b-slate-700"></div>
                  <div className="absolute bottom-[calc(100%-1px)] right-6 border-4 border-transparent border-b-slate-900"></div>
                </div>
              </div>

              <div className="w-px h-5 bg-white/10 mx-0.5" aria-hidden="true" />
              
              <div className="relative group">
                <button 
                  onClick={() => { setShowGlossary(true); }}
                  className="relative flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 h-8 px-2.5 lg:px-3.5 rounded-full border border-emerald-400/45 text-xs font-bold transition-all hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer"
                  aria-label={`Ouvrir le glossaire (${discoveredCount} sur ${totalTerms} termes découverts)`}
                >
                  <BookOpen className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
                  <span className="hidden lg:inline">GLOSSAIRE</span>
                  <span className="font-mono text-[11px] tabular-nums text-emerald-200/90 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-full leading-none">
                    {discoveredCount}/{totalTerms}
                  </span>

                  <AnimatePresence>
                    {glossaryPlusOnes.map(id => (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                        animate={{ opacity: 1, y: -25, scale: 1.2 }}
                        exit={{ opacity: 0, y: -35, scale: 0.8 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 text-emerald-400 font-black text-lg drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] pointer-events-none z-50"
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
                className="relative flex items-center gap-1.5 bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400 px-2.5 lg:px-3 py-1 rounded-full border border-emerald-500/30 text-xs font-bold transition-all hover:shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                aria-label={`Ouvrir le glossaire (${discoveredCount} sur ${totalTerms} termes découverts)`}
              >
                <BookOpen className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
                <span className="hidden sm:inline">GLOSSAIRE</span>
                <span className="font-mono text-[11px] tabular-nums text-emerald-200/90 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-full leading-none">
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
          <div className={`relative group/mute ${(level > 0 && level < 14 && timeLeft > 0 && lives > 0) ? 'hidden md:block' : 'block'}`}>
            <button
              type="button"
              onClick={onToggleMute}
              className={`flex items-center justify-center gap-1.5 h-8 ${level === 0 ? 'px-3' : 'w-8'} rounded-full border transition-all cursor-pointer ${
                isMuted
                  ? 'bg-red-950/40 border-red-500/40 text-red-400 hover:bg-red-900/50 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                  : 'bg-slate-900/50 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/30 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              }`}
              aria-label={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 shrink-0" /> : <Volume2 className="w-4 h-4 shrink-0" />}
              {level === 0 && (
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
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
      <AnimatePresence>
        {isMobileMenuOpen && level > 0 && level < 14 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden mt-3 pt-3 border-t border-emerald-900/50 flex flex-col gap-3"
          >
            {/* Water Gauge Mobile */}
            <div className="bg-slate-900/50 px-3 py-2 rounded-lg border border-cyan-500/30 w-full overflow-hidden">
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-500/80">Eau Préservée</span>
                </div>
                <span className="font-bold font-mono text-xs text-white">{waterSaved}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative border border-cyan-900/50">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500"
                  initial={{ width: '15%' }}
                  animate={{ width: `${waterSaved}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => { setShowGlossary(true); setIsMobileMenuOpen(false); }}
                className="relative flex-1 flex items-center justify-center gap-2 bg-emerald-900/30 text-emerald-400 px-3 py-2 rounded-lg border border-emerald-500/30 text-xs font-bold transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>GLOSSAIRE</span>
                <span className="font-mono text-[11px] tabular-nums text-emerald-200/90 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-full leading-none">
                  {discoveredCount}/{totalTerms}
                </span>
                
                <AnimatePresence>
                  {glossaryPlusOnes.map(id => (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: 0, scale: 0.5 }}
                      animate={{ opacity: 1, y: -25, scale: 1.2 }}
                      exit={{ opacity: 0, y: -35, scale: 0.8 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute top-0 left-1/2 -translate-x-1/2 text-emerald-400 font-black text-lg drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] pointer-events-none z-50"
                    >
                      +1
                    </motion.div>
                  ))}
                </AnimatePresence>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold bg-slate-900/60 px-3 py-2 rounded-lg border border-emerald-500/30 w-full">
              <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-400">
                {currentAct ? `${currentAct.label} · ` : ''}Niveau {level}/13 : <span className="text-slate-200 font-normal">{LEVEL_NAMES[level]}</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>

      {/* Dev Controls Floating Card (outside <header> so backdrop-blur doesn't trap position:fixed) */}
      {isDevMode && (
        <div className="fixed right-3 bottom-3 z-[55] flex flex-col items-end gap-2 font-sans">
          {isProfCollapsed ? (
            <button
              type="button"
              onClick={() => setIsProfCollapsed(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 backdrop-blur border border-indigo-500/50 text-indigo-300 hover:text-white text-[11px] font-black tracking-wider uppercase shadow-md hover:shadow-[0_0_14px_rgba(99,102,241,0.3)] transition-all"
              title="Déplier le menu enseignant"
            >
              <span>MENU ENSEIGNANT</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              {/* Answer Card (Hidden by default to prevent spoilers on classroom projector) */}
              {devAnswers?.[level] && showDevAnswer && (
                <div className="p-2.5 bg-slate-900/95 backdrop-blur border border-indigo-500/40 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.15)] flex flex-col gap-1.5 w-52 text-center">
                  <div className="text-[11px] uppercase font-black text-indigo-300 tracking-wider">Réponse Attendue</div>
                  <div className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/40 py-1.5 px-2 rounded border border-emerald-500/30 whitespace-pre-line leading-normal">
                    {devAnswers[level]}
                  </div>
                </div>
              )}

              {/* Main Card: Menu Enseignant */}
              <div className="p-2.5 bg-slate-900/95 backdrop-blur border border-indigo-500/40 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.2)] flex flex-col gap-2 w-52">
                <div className="flex justify-between items-center border-b border-indigo-500/20 pb-1">
                  <span className="text-[11px] uppercase font-black tracking-widest text-indigo-300">MENU ENSEIGNANT</span>
                  <button
                    type="button"
                    onClick={() => setIsProfCollapsed(true)}
                    className="text-indigo-300/80 hover:text-white p-0.5 rounded transition-colors"
                    title="Réduire le menu enseignant"
                    aria-label="Réduire le menu enseignant"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <select 
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className="bg-indigo-950/60 text-indigo-200 text-[11px] font-semibold px-2 h-8 rounded-lg border border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer w-full"
                  title="Sauter vers un niveau"
                  aria-label="Sélectionner un niveau"
                >
                  {[...Array(15)].map((_, i) => (
                    <option key={i} value={i} className="bg-slate-900 text-slate-100">
                      {i === 0 ? 'Intro' : i === 14 ? 'Fin' : `${i}. ${LEVEL_NAMES[i] || `Niveau ${i}`}`}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button 
                    onClick={prevLevelDev}
                    disabled={level <= 0}
                    className={`flex items-center justify-center w-8 h-8 rounded-full border transition-colors shrink-0 ${
                      level <= 0
                        ? 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
                        : 'bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border-indigo-500/40'
                    }`}
                    title="Niveau précédent"
                    aria-label="Niveau précédent"
                  >
                    <Rewind className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={skipLevelDev}
                    disabled={level >= 14}
                    className={`flex items-center justify-center flex-1 gap-1.5 h-8 rounded-full border text-xs font-bold transition-all ${
                      level >= 14
                        ? 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
                        : 'bg-indigo-900/70 hover:bg-indigo-800/70 text-indigo-200 border-indigo-500/50 hover:brightness-110'
                    }`}
                    title="Passer le niveau"
                    aria-label="Passer le niveau"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>SKIP</span>
                  </button>
                </div>

                {devAnswers?.[level] && (
                  <button
                    type="button"
                    onClick={() => setShowDevAnswer((prev) => !prev)}
                    className={`flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-colors ${
                      showDevAnswer
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                        : 'bg-slate-950/70 border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/60'
                    }`}
                    aria-expanded={showDevAnswer}
                  >
                    {showDevAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showDevAnswer ? 'Masquer la réponse' : 'Voir la réponse'}</span>
                  </button>
                )}

                {onOpenTeacherKit && (
                  <button
                    type="button"
                    onClick={onOpenTeacherKit}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-lg border border-indigo-500/25 bg-slate-950/50 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-200 text-[11px] font-semibold transition-colors"
                    title="Ouvrir la fiche pédagogique (déroulé, programmes, débat)"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Kit Enseignant</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
