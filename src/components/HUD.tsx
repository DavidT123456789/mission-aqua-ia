import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, Clock, Star, Activity, Heart, Bug, FastForward, HelpCircle, Menu, X, ChevronRight } from 'lucide-react';
import { DEV_ANSWERS } from '../constants';

interface HUDProps {
  level: number;
  timeLeft: number;
  lives: number;
  waterSaved: number;
  score: number;
  isDevMode: boolean;
  unlockedFreeHints: number[];
  unlockedPaidHints: number[];
  setShowDevModal: (show: boolean) => void;
  setShowGlossary: (show: boolean) => void;
  useHint: (type: 'free' | 'paid') => void;
  setLevel: (level: number) => void;
  prevLevelDev: () => void;
  skipLevelDev: () => void;
  buyHeart: () => void;
  buyTime: () => void;
  onGoHome: () => void;
  setIsDevMode?: (dev: boolean) => void;
}

export default function HUD({
  level, timeLeft, lives, waterSaved, score, isDevMode, unlockedFreeHints, unlockedPaidHints,
  setShowDevModal, setShowGlossary, useHint, setLevel, prevLevelDev, skipLevelDev, buyHeart, buyTime, onGoHome, setIsDevMode
}: HUDProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [glossaryPlusOnes, setGlossaryPlusOnes] = useState<number[]>([]);
  
  const [scoreDiffs, setScoreDiffs] = useState<{id: number, diff: number}[]>([]);
  const prevScoreRef = useRef(score);

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

  // Cost logic
  const freeHintCost = 10;
  const hintCost = 100;

  return (
    <header className="fixed top-0 left-0 right-0 p-3 md:p-4 bg-slate-950 z-50">
      {/* Progress Bar as Bottom Border */}
      {level > 0 && level < 14 ? (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 group/progress cursor-help">
          <motion.div 
            className="h-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-purple-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${(level / 13) * 100}%` }}
            transition={{ duration: 1 }}
          />
          {/* Tooltip for Level Progress */}
          <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-auto md:bottom-full md:left-1/2 md:-translate-x-1/2 md:mb-2 hidden group-hover/progress:block w-max max-w-[90vw] bg-slate-900 text-[10px] md:text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal text-center">
            Progression de la mission : {level}/13 niveaux complétés
            <div className="hidden md:block absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
            <div className="hidden md:block absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10" />
      )}

      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2 md:gap-4 relative z-10">
        
        {/* Left: Branding & Dev Badge */}
        <div className="flex items-center gap-2">
          <div 
            className="flex items-center gap-2 group/logo cursor-pointer relative"
            onClick={onGoHome}
            role="button"
            tabIndex={0}
          >
            <span className="font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase text-sm md:text-base bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent hidden sm:inline drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] hover:brightness-125 transition-all">
              AQUA-IA
            </span>
            {/* Custom tooltip for Logo */}
            <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 hidden group-hover/logo:block w-max bg-slate-900 text-[10px] md:text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal text-center">
              Retour à l'accueil
              <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
              <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
            </div>
          </div>

          {isDevMode && (
            <div className="relative group/dev cursor-pointer flex items-center">
              <span 
                className="text-indigo-500 text-[10px] md:text-xs font-black animate-pulse hover:text-red-500 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (setIsDevMode) setIsDevMode(false);
                }}
              >
                [ENSEIGNANT/DEV]
              </span>
              {/* Custom Tooltip */}
              <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 hidden group-hover/dev:block w-max max-w-[90vw] bg-slate-900 text-[10px] md:text-xs text-slate-200 px-2.5 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal text-center">
                Désactiver le mode enseignant / dev
                <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
              </div>
            </div>
          )}
        </div>
        {/* Center: Main Stats (Always visible) */}
        {level > 0 && level < 14 && (timeLeft > 0 && lives > 0) && (
          <div className="flex items-center gap-3 md:gap-8">
            {/* Lives */}
            <div className="flex items-center gap-1" aria-label={`${lives} vies restantes`}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="relative w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={lives === 1 && i < lives ? {
                      scale: [1, 1.2, 1],
                      opacity: 1
                    } : {
                      scale: i < lives ? 1 : 0.5,
                      opacity: i < lives ? 1 : 0.3,
                    }}
                    transition={lives === 1 && i < lives ? {
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
              {lives < 3 && (
                <div className="relative group ml-1 flex items-center">
                  <button 
                    onClick={buyHeart}
                    disabled={score < 200}
                    className={`text-xs rounded px-1.5 py-0.5 font-bold transition-colors ${
                      score >= 200 
                        ? 'bg-red-900/50 text-red-400 border border-red-500/50 hover:bg-red-800/50 cursor-pointer' 
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                    aria-label="Acheter un cœur"
                  >
                    +
                  </button>
                  {/* Tooltip */}
                  <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 hidden group-hover:block w-max max-w-[90vw] bg-slate-900 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span>Acheter une vie :</span>
                      <span className={score >= 200 ? "text-yellow-400 font-bold" : "text-red-400 font-bold"}>200 pts</span>
                    </div>
                    <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                    <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1">
              <div className="relative group/timer">
                <div className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 rounded-full border transition-all duration-500 cursor-help ${timeLeft < 300 ? 'border-red-500 text-red-500 bg-red-950/20' : 'border-emerald-500/30 text-emerald-400 bg-emerald-950/10'}`} aria-label={`Temps restant : ${formatTime(timeLeft)}`}>
                  <Clock className={`w-3 h-3 md:w-4 md:h-4 ${timeLeft < 300 ? 'text-red-400' : 'text-emerald-400'}`} />
                  <span className="font-bold font-mono text-xs md:text-lg">{formatTime(timeLeft)}</span>
                </div>
                {/* Timer Tooltip */}
                <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 hidden group-hover/timer:block w-max max-w-[90vw] bg-slate-900 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal text-center">
                  Temps restant :<br />Résolvez les missions avant 00:00
                  <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                  <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                </div>
              </div>
              
              <div className="relative group/buytime">
                <button 
                  onClick={buyTime}
                  disabled={score < 100}
                  className={`text-xs rounded px-1.5 py-0.5 font-bold transition-all ${
                    score >= 100 
                      ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-800/50 cursor-pointer' 
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                  aria-label="Acheter du temps"
                >
                  +
                </button>
                {/* Tooltip for buying time */}
                <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 hidden group-hover/buytime:block w-max max-w-[90vw] bg-slate-900 text-[10px] md:text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                  <div className="flex items-center gap-1.5 justify-center">
                    <span>Ajouter 3 min :</span>
                    <span className={score >= 100 ? "text-yellow-400 font-bold" : "text-red-400 font-bold"}>100 pts</span>
                  </div>
                  <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                  <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="relative group/score">
              <motion.div 
                key={score}
                initial={{ scale: 1.2, color: score < prevScoreRef.current ? '#ef4444' : '#fff' }}
                animate={{ scale: 1, color: '#facc15' }}
                className="flex items-center gap-1 bg-slate-900/40 px-2 md:px-3 py-1 rounded-full border border-yellow-500/30 cursor-help relative" 
                aria-label={`Score : ${score}`}
              >
                <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                <span className="font-bold font-mono text-yellow-400 text-xs md:text-base">{score}</span>
                
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
              </motion.div>
              {/* Tooltip for Score */}
              <div className="fixed top-16 left-1/2 -translate-x-1/2 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-2 hidden group-hover/score:block w-max max-w-[90vw] bg-slate-900 text-xs text-slate-200 px-3 py-2 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                <div className="flex flex-col gap-1 text-center md:text-left">
                  <span className="font-bold text-yellow-500">Score de Mission</span>
                  <span>Points accumulés via vos réponses.</span>
                  <span className="text-[10px] text-slate-400 border-t border-slate-800 mt-1 pt-1 italic whitespace-normal md:whitespace-nowrap">Visez le score maximum à chaque niveau !</span>
                </div>
                <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                <div className="hidden md:block absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
              </div>
            </div>

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

        {/* Right: Actions & Extra Stats (Desktop) */}
        <div className="hidden md:flex items-center gap-2">
          {level > 0 && level < 14 && (
            <>
              {/* Water Gauge */}
              <div className="relative group/water">
                <motion.div 
                  key={waterSaved}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 bg-slate-900/40 px-3 py-1 rounded-full border border-cyan-500/30 cursor-help" 
                  aria-label={`Eau sauvée : ${waterSaved}%`}
                >
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <div className="w-24 lg:w-32 h-3 bg-slate-800/50 rounded-full overflow-hidden relative border border-cyan-900/50">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500"
                      initial={{ width: '15%' }}
                      animate={{ width: `${waterSaved}%` }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                    {/* Liquid shine effect */}
                    <motion.div 
                      className="absolute top-0 left-0 h-full w-8 bg-white/20 skew-x-12 blur-sm"
                      animate={{ left: ['-40%', '140%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <span className="font-bold font-mono text-xs text-white drop-shadow-md">{waterSaved}%</span>
                </motion.div>
                {/* Tooltip for Water Gauge */}
                <div className="absolute top-full right-0 mt-2 hidden group-hover/water:block w-64 bg-slate-900 text-xs text-slate-200 px-3 py-2 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-cyan-400">Taux de Préservation</span>
                    <span>Pourcentage d'eau économisée grâce à vos décisions techniques et écologiques.</span>
                  </div>
                  <div className="absolute bottom-full right-6 border-4 border-transparent border-b-slate-700"></div>
                  <div className="absolute bottom-[calc(100%-1px)] right-6 border-4 border-transparent border-b-slate-900"></div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <div className="relative group">
                  <button 
                    onClick={() => useHint('free')}
                    disabled={!unlockedFreeHints.includes(level) && score < freeHintCost}
                    className={`flex items-center gap-1 px-2 py-1 rounded-l-full border-y border-l text-xs font-bold transition-all ${
                      !unlockedFreeHints.includes(level) && score < freeHintCost
                        ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-50' 
                        : 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-800/50'
                    }`}
                    aria-label="Indice"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>{unlockedFreeHints.includes(level) ? 'GRATUIT' : `-${freeHintCost}`}</span>
                    {!unlockedFreeHints.includes(level) && <Star className="w-3 h-3" />}
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block w-max bg-slate-900 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                    {unlockedFreeHints.includes(level) ? "Voir l'indice (gratuit après erreur)" : "Acheter un indice"}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                    <div className="absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                  </div>
                </div>
                <div className="relative group">
                  <button 
                    onClick={() => useHint('paid')}
                    disabled={!unlockedPaidHints.includes(level) && score < hintCost}
                    className={`flex items-center gap-1 px-2 py-1 rounded-r-full border-y border-r text-xs font-bold transition-all ${
                      !unlockedPaidHints.includes(level) && score < hintCost
                        ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' 
                        : unlockedPaidHints.includes(level)
                        ? 'bg-yellow-900/30 border-yellow-500/30 text-yellow-500 hover:bg-yellow-800/50'
                        : 'bg-yellow-900/30 border-yellow-500/30 text-yellow-500 hover:bg-yellow-800/50'
                    }`}
                    aria-label="Indice avancé"
                  >
                    <span>{unlockedPaidHints.includes(level) ? 'VOIR' : `-${hintCost}`}</span>
                    <Star className="w-3 h-3" />
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block w-max bg-slate-900 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                    {unlockedPaidHints.includes(level) ? "Voir l'indice avancé" : "Acheter un indice avancé"}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-700"></div>
                    <div className="absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <button 
                  onClick={() => { setShowGlossary(true); }}
                  className="relative flex items-center gap-2 bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 text-xs font-bold transition-all hover:scale-105"
                  aria-label="Ouvrir le glossaire"
                >
                  <Bug className="w-4 h-4" />
                  <span>GLOSSAIRE</span>

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
                <div className="absolute top-full right-0 mt-2 hidden group-hover:block w-max bg-slate-900 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                  Ouvrir le glossaire
                  <div className="absolute bottom-full right-6 border-4 border-transparent border-b-slate-700"></div>
                  <div className="absolute bottom-[calc(100%-1px)] right-6 border-4 border-transparent border-b-slate-900"></div>
                </div>
              </div>
              
              <div className="relative group">
                <div className="flex items-center gap-2 text-xs lg:text-sm font-bold bg-slate-900/50 px-3 py-1 rounded-full border border-emerald-500/30 transition-colors hover:border-emerald-500/60" aria-label={`Niveau ${level} sur 13`}>
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">{level}/13</span>
                </div>
                <div className="absolute top-full right-0 mt-2 hidden group-hover:block w-max bg-slate-900 text-xs text-slate-200 px-2 py-1.5 rounded border border-slate-700 shadow-xl z-[100] pointer-events-none font-sans not-italic font-normal tracking-normal">
                  Énigme {level}/13
                  <div className="absolute bottom-full right-6 border-4 border-transparent border-b-slate-700"></div>
                  <div className="absolute bottom-[calc(100%-1px)] right-6 border-4 border-transparent border-b-slate-900"></div>
                </div>
              </div>
            </>
          )}


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
              <div className="flex-1 flex items-center">
                <button 
                  onClick={() => { useHint('free'); setIsMobileMenuOpen(false); }}
                  disabled={!unlockedFreeHints.includes(level) && score < freeHintCost}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-l-lg border-y border-l text-xs font-bold transition-all ${
                    !unlockedFreeHints.includes(level) && score < freeHintCost
                      ? 'bg-slate-800 border-slate-700 text-slate-500 opacity-50' 
                      : 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>{unlockedFreeHints.includes(level) ? 'GRATUIT' : `-${freeHintCost}`}</span>
                  {!unlockedFreeHints.includes(level) && <Star className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => { useHint('paid'); setIsMobileMenuOpen(false); }}
                  disabled={!unlockedPaidHints.includes(level) && score < hintCost}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-r-lg border-y border-r text-xs font-bold transition-all ${
                    !unlockedPaidHints.includes(level) && score < hintCost
                      ? 'bg-slate-800 border-slate-700 text-slate-500' 
                      : 'bg-yellow-900/30 border-yellow-500/30 text-yellow-500'
                  }`}
                >
                  <span>{unlockedPaidHints.includes(level) ? 'VOIR' : `-${hintCost}`}</span>
                  <Star className="w-4 h-4" />
                </button>
              </div>
              
              <button 
                onClick={() => { setShowGlossary(true); setIsMobileMenuOpen(false); }}
                className="relative flex-1 flex items-center justify-center gap-2 bg-emerald-900/30 text-emerald-400 px-3 py-2 rounded-lg border border-emerald-500/30 text-xs font-bold transition-all"
              >
                <Bug className="w-4 h-4" />
                <span>GLOSSAIRE</span>
                
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

            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80 bg-slate-900/50 px-3 py-2 rounded-lg border border-emerald-500/30">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Progression Mission : {level}/13</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dev Controls Floating Card */}
      {isDevMode && level > 0 && level < 14 && (
        <div className="fixed right-0 md:right-8 top-20 md:top-24 z-[60] flex flex-col items-end gap-2">
          {/* Main Card: Menu Prof */}
          <div className="p-3 bg-slate-900/90 backdrop-blur border border-indigo-500/40 rounded-l-xl md:rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.2)] flex flex-col gap-2 w-40 font-sans">
            <div className="flex justify-between items-center border-b border-indigo-500/20 pb-1.5 mb-1">
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400/90">MENU PROF</span>
            </div>
            <select 
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value))}
              className="bg-indigo-950/60 text-indigo-300 text-xs font-bold px-2 h-8 rounded-lg border border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer w-full"
              title="Sauter vers un niveau"
              aria-label="Sélectionner un niveau"
            >
              {[...Array(15)].map((_, i) => (
                <option key={i} value={i} className="bg-slate-900 text-slate-100">
                  {i === 0 ? 'Intro' : i === 13 ? 'Labo (Niveau 13)' : i === 14 ? 'Fin' : `Niveau ${i}`}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button 
                onClick={prevLevelDev}
                className="flex items-center justify-center bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-400 w-8 h-8 rounded-full border border-indigo-500/40 transition-colors shrink-0"
                title="Niveau précédent"
                aria-label="Niveau précédent"
              >
                <span className="text-lg leading-none transform -translate-y-[1px]">«</span>
              </button>
              <button 
                onClick={skipLevelDev}
                className="flex items-center justify-center flex-1 gap-1.5 bg-indigo-900/70 hover:bg-indigo-800/70 text-indigo-200 h-8 rounded-full border border-indigo-500/50 text-xs font-bold transition-all hover:brightness-110"
                title="Passer le niveau"
                aria-label="Passer le niveau"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>SKIP</span>
              </button>
            </div>
          </div>

          {/* Answer Card */}
          {DEV_ANSWERS[level] && (
            <div className="p-2.5 bg-slate-900/90 backdrop-blur border border-indigo-500/40 rounded-l-xl md:rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.15)] flex flex-col gap-1 w-40 font-sans text-center">
              <div className="text-[9px] uppercase font-black text-indigo-400/80 tracking-wider">Réponse Attendue</div>
              <div className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/30 py-1.5 px-2 rounded border border-emerald-500/30 whitespace-pre-line leading-normal">
                {DEV_ANSWERS[level]}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
