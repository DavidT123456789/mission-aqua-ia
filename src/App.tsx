import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bug, BookOpen, X, HelpCircle, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import HUD from './components/HUD';
import TransitionScreen from './components/TransitionScreen';
import { soundManager } from './utils/soundManager';
import { HINTS, FACTS, LEVEL_NAMES, MISSION_DURATION_SECONDS } from './constants';
import Intro from './levels/Intro';
import Level1 from './levels/Level1';
import Level2 from './levels/Level2';
import Level3 from './levels/Level3';
import Level4 from './levels/Level4';
import Level5 from './levels/Level5';
import Level6 from './levels/Level6';
import Level7 from './levels/Level7';
import Level8 from './levels/Level8';
import Level9 from './levels/Level9';
import Level10 from './levels/Level10';
import Level11 from './levels/Level11';
import Level12 from './levels/Level12';
import Level13 from './levels/Level13';
import Outro from './levels/Outro';
import GameOver from './levels/GameOver';
import { TERMS_DICTIONARY } from './components/TechTerm';

export default function App() {
  const [level, setLevel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MISSION_DURATION_SECONDS); // 40 minutes
  const [extraTimeBought, setExtraTimeBought] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [score, setScore] = useState(0);
  const [waterSaved, setWaterSaved] = useState(0);
  const [lives, setLives] = useState(3);
  const [nickname, setNickname] = useState('');
  
  // Glossary State
  const [showGlossary, setShowGlossary] = useState(false);
  const [discoveredTerms, setDiscoveredTerms] = useState<string[]>([]);

  // Persistence & Sound State
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('hydrosave_muted') === 'true');
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [savedGameInfo, setSavedGameInfo] = useState<{ level: number; score: number; timeLeft: number } | null>(null);

  // Bonus Data for Final Certificate
  const [finalEvaluation, setFinalEvaluation] = useState<any>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<{name: string, score: number}[]>([]);

  // Hint State
  const [showHint, setShowHint] = useState(false);
  const [unlockedFreeHints, setUnlockedFreeHints] = useState<number[]>([]);
  const [unlockedPaidHints, setUnlockedPaidHints] = useState<number[]>([]);

  const [isShaking, setIsShaking] = useState(false);
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<number | null>(null);
  const [lastPointsGained, setLastPointsGained] = useState(0);
  const [lastTimeRemaining, setLastTimeRemaining] = useState(0);
  const [levelBonusScore, setLevelBonusScore] = useState(0);
  const isTransitionPendingRef = useRef(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    soundManager.setMuted(isMuted);
    localStorage.setItem('hydrosave_muted', isMuted.toString());
  }, [isMuted]);

  useEffect(() => {
    if (level === 0) {
      document.title = "Aqua IA - Mission Infiltration";
    } else if (level === 14) {
      document.title = "Aqua IA - Mission Réussie !";
    } else {
      document.title = `Aqua IA - Niveau ${level}/13 : ${LEVEL_NAMES[level] || `Mission ${level}`}`;
    }
  }, [level]);

  // Global UI Sounds
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('button');
      if (btn && !btn.disabled && !btn.dataset.hovered) {
        btn.dataset.hovered = 'true';
        soundManager.playHover();
        btn.addEventListener('mouseleave', () => { delete btn.dataset.hovered; }, { once: true });
      }
    };
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('button');
      if (btn && !btn.disabled) {
        soundManager.playClick();
      }
    };
    
    const initAudio = () => {
       soundManager.init();
       document.removeEventListener('click', initAudio);
       document.removeEventListener('keydown', initAudio);
    };
    
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Sound Utility (Removed, now using soundManager globally)

  // Persistence Logic
  useEffect(() => {
    const saved = localStorage.getItem('hydrosave_progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed?.level === 'number' &&
          parsed.level > 0 &&
          parsed.level < 14 &&
          (parsed.lives ?? 3) > 0 &&
          (parsed.timeLeft ?? 1) > 0
        ) {
          setHasSavedGame(true);
          setSavedGameInfo({
            level: parsed.level,
            score: parsed.score ?? 0,
            timeLeft: parsed.timeLeft ?? MISSION_DURATION_SECONDS,
          });
        } else {
          localStorage.removeItem('hydrosave_progress');
        }
      } catch {
        localStorage.removeItem('hydrosave_progress');
      }
    }
    
    const savedLeaderboard = localStorage.getItem('hydrosave_leaderboard');
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    }
  }, []);

  useEffect(() => {
    if (level > 0 && level < 14) {
      if (lives <= 0 || timeLeft <= 0) {
        localStorage.removeItem('hydrosave_progress');
        setHasSavedGame(false);
        setSavedGameInfo(null);
        return;
      }
      const state = {
        level,
        score,
        waterSaved,
        lives,
        timeLeft,
        extraTimeBought,
        nickname,
        discoveredTerms,
        unlockedFreeHints,
        unlockedPaidHints
      };
      localStorage.setItem('hydrosave_progress', JSON.stringify(state));
      setHasSavedGame(true);
      setSavedGameInfo({ level, score, timeLeft });
    }
  }, [level, score, waterSaved, lives, timeLeft, extraTimeBought, nickname, discoveredTerms, unlockedFreeHints, unlockedPaidHints]);

  const leaderboardRecordedRef = useRef(false);

  useEffect(() => {
    if (level < 14) {
      leaderboardRecordedRef.current = false;
      return;
    }

    setIsActive(false); // Arrête le timer
    setHasSavedGame(false);
    setSavedGameInfo(null);
    localStorage.removeItem('hydrosave_progress');

    if (leaderboardRecordedRef.current) return;
    leaderboardRecordedRef.current = true;

    // Ajout du score au leaderboard de façon résiliente avec garantie d'utilisation des données les plus à jour (sans stale closure)
    setLeaderboard((prevBoard) => {
      const newEntry = { name: nickname || 'Agent Anonyme', score };
      
      // On évite les doublons stricts (même nom, même score) pour prévenir les soucis en mode dev (Strict Mode de React)
      // et éviter d'inonder le leaderboard avec la même performance
      const isDuplicate = prevBoard.some(entry => entry.score === newEntry.score && entry.name === newEntry.name);
      
      let updated;
      if (isDuplicate) {
         updated = prevBoard;
      } else {
         updated = [...prevBoard, newEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5); // Limite au Top 5
      }
      
      localStorage.setItem('hydrosave_leaderboard', JSON.stringify(updated));
      return updated;
    });
  }, [level, nickname, score]);

  const loadGame = () => {
    const saved = localStorage.getItem('hydrosave_progress');
    if (saved) {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      isTransitionPendingRef.current = false;
      const state = JSON.parse(saved);
      setLevel(state.level);
      setScore(state.score);
      setWaterSaved(state.waterSaved);
      setLives(state.lives);
      setTimeLeft(state.timeLeft);
      setExtraTimeBought(state.extraTimeBought || 0);
      setNickname(state.nickname);
      const loadedTerms = state.discoveredTerms || [];
      setDiscoveredTerms(loadedTerms);
      discoveredTermsRef.current = loadedTerms;
      setUnlockedFreeHints(state.unlockedFreeHints || []);
      setUnlockedPaidHints(state.unlockedPaidHints || []);
      setIsActive(true);
      soundManager.playStart();
    }
  };

  const clearSave = () => {
    localStorage.removeItem('hydrosave_progress');
    setHasSavedGame(false);
    setSavedGameInfo(null);
  };

  const discoveredTermsRef = useRef<string[]>([]);
  const levelRef = useRef(level);
  useEffect(() => {
    // Keep ref in sync for the event listener to check without side-effects in updaters
    discoveredTermsRef.current = discoveredTerms;
  }, [discoveredTerms]);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    const handleDiscovery = (e: any) => {
      const term = e.detail;
      
      // Check ref synchronously to prevent double-processing during rapid events or Strict Mode
      if (discoveredTermsRef.current.includes(term)) return;
      
      // Immediately track it to prevent multiple executions for the same event
      discoveredTermsRef.current = [...discoveredTermsRef.current, term];

      setDiscoveredTerms(prev => {
        if (prev.includes(term)) return prev;
        return [...prev, term];
      });

      // Figer les gains de points sur l'écran de fin (level 14) pour ne pas fausser le score/classement
      if (levelRef.current < 14) {
        setScore(s => s + 10);
        setLevelBonusScore(prev => prev + 10);
        window.dispatchEvent(new CustomEvent('glossaryPlusOne'));
      }
      soundManager.playSuccess();
    };
    window.addEventListener('discoverTerm', handleDiscovery);
    return () => window.removeEventListener('discoverTerm', handleDiscovery);
  }, []);

  // Developer Mode State
  const [isDevMode, setIsDevMode] = useState(() => {
    const saved = localStorage.getItem('hydrosave_devmode');
    return saved === 'true';
  });
  const [showDevModal, setShowDevModal] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const [devError, setDevError] = useState(false);

  useEffect(() => {
    localStorage.setItem('hydrosave_devmode', isDevMode.toString());
  }, [isDevMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0 && lives > 0 && level !== 13) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsActive(false);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, lives, level]);

  // Close modals on Escape key
  useEffect(() => {
    if (!showHint && !showGlossary && !showDevModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowHint(false);
        setShowGlossary(false);
        setShowDevModal(false);
        setDevError(false);
        setDevPassword('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHint, showGlossary, showDevModal]);

  const startGame = (name: string) => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    isTransitionPendingRef.current = false;
    setIsTransitioning(false);
    setPendingLevel(null);

    // Effacer immédiatement toute ancienne sauvegarde pour éviter qu'un niveau ne lise un état obsolète
    localStorage.removeItem('hydrosave_progress');
    setHasSavedGame(false);

    // Conserver les points des termes déjà découverts sur l'Intro, mais réinitialiser lors d'un Replay complet
    const startingFromIntro = level === 0;
    const initialScore = startingFromIntro ? discoveredTerms.length * 10 : 0;
    if (!startingFromIntro) {
      setDiscoveredTerms([]);
      discoveredTermsRef.current = [];
      window.dispatchEvent(new CustomEvent('resetDiscoveredTerms'));
    }

    setNickname(name);
    setIsActive(true);
    setLevel(1);
    setScore(initialScore);
    setWaterSaved(0);
    setLives(3);
    setTimeLeft(MISSION_DURATION_SECONDS);
    setExtraTimeBought(0);
    leaderboardRecordedRef.current = false;
    setUnlockedFreeHints([]);
    setUnlockedPaidHints([]);
    setLevelBonusScore(0);
    setFinalEvaluation(null);
    setFinalImageUrl(null);
    soundManager.playStart();
  };

  const nextLevel = () => {
    if (isTransitionPendingRef.current || isTransitioning) return;
    isTransitionPendingRef.current = true;

    soundManager.playSuccess();
    setIsSuccessFlash(true);
    setTimeout(() => setIsSuccessFlash(false), 800);

    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#06b6d4', '#8b5cf6']
    });

    const next = level + 1;
    if (next === 14) {
      isTransitionPendingRef.current = false;
      setLevel(next);
      return;
    }

    // Life regeneration every 3 levels
    if (next % 3 === 0) {
      setLives(prev => Math.min(3, prev + 1));
    }

    setPendingLevel(next);
    setLastTimeRemaining(timeLeft);
    transitionTimerRef.current = setTimeout(() => {
      setIsTransitioning(true);
      transitionTimerRef.current = null;
    }, 1500);
  };

  const handleTransitionComplete = () => {
    isTransitionPendingRef.current = false;
    setIsTransitioning(false);
    setLevelBonusScore(0);
    if (pendingLevel !== null) {
      setLevel(pendingLevel);
      setPendingLevel(null);
    }
  };

  const handleScoreUpdate = (points: number, water: number) => {
    setScore((s) => Math.max(0, s + points));
    setWaterSaved((prev) => Math.max(prev, water));
    setLastPointsGained(points + levelBonusScore);
  };

  const handleMistake = () => {
    soundManager.playError();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500); // Shake for 500ms
    setLives((l) => {
      const newLives = Math.max(0, l - 1);
      if (newLives === 0) {
        setIsActive(false);
      }
      return newLives;
    });
    // Unlock free hint when a mistake is made
    if (!unlockedFreeHints.includes(level)) {
      setUnlockedFreeHints(prev => [...prev, level]);
    }
  };

  const handleDevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (devPassword === 'dev123') {
      setIsDevMode(true);
      setShowDevModal(false);
      setDevPassword('');
      setDevError(false);
      soundManager.playSuccess();
    } else {
      setDevError(true);
      soundManager.playError();
    }
  };

  const prevLevelDev = () => {
    setLevel((l) => Math.max(0, l - 1));
  };

  const skipLevelDev = () => {
    if (level >= 14) return;
    if (level === 0) {
      setLevel(1);
      return;
    }
    const devWaterByLevel: Record<number, number> = { 1: 0, 2: 28, 3: 35, 4: 42, 5: 49, 6: 56, 7: 63, 8: 70, 9: 76, 10: 82, 11: 88, 12: 94, 13: 100 };
    handleScoreUpdate(200, devWaterByLevel[level] ?? 50);
    nextLevel();
  };

  const useHint = (type: 'free' | 'paid') => {
    if (type === 'free') {
      if (unlockedFreeHints.includes(level)) {
        setShowHint(true); // Already unlocked (after mistake or purchase), free to review
      } else {
        const cost = 10;
        if (score >= cost) {
          setScore(s => Math.max(0, s - cost));
          setUnlockedFreeHints(prev => [...prev, level]);
          setShowHint(true);
        }
      }
    } else {
      if (!unlockedPaidHints.includes(level)) {
        const cost = 100;
        if (score >= cost) {
          setScore(s => Math.max(0, s - cost));
          setUnlockedPaidHints(prev => [...prev, level]);
          setShowHint(true);
        }
      } else {
        setShowHint(true); // Already unlocked, just show it
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-emerald-400 font-mono flex flex-col items-center p-4 pb-2 overflow-hidden relative">
      {/* Decorative background elements */}
      <Background />
      {/* Success Flash Overlay */}
      <AnimatePresence>
        {isSuccessFlash && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.2, 1.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed inset-0 z-[120] bg-emerald-400 pointer-events-none flex items-center justify-center"
          >
            <div className="w-full h-full bg-[radial-gradient(circle,white_0%,transparent_70%)] opacity-50"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <HUD
        level={level}
        timeLeft={timeLeft}
        lives={lives}
        waterSaved={waterSaved}
        score={score}
        isDevMode={isDevMode}
        isMuted={isMuted}
        setIsDevMode={setIsDevMode}
        unlockedFreeHints={unlockedFreeHints}
        unlockedPaidHints={unlockedPaidHints}
        setShowDevModal={setShowDevModal}
        setShowGlossary={setShowGlossary}
        useHint={useHint}
        setLevel={setLevel}
        prevLevelDev={prevLevelDev}
        skipLevelDev={skipLevelDev}
        buyHeart={() => {
          if (level !== 13 && score >= 200 && lives < 3) {
            setScore(s => s - 200);
            setLives(l => l + 1);
            soundManager.playSuccess();
          }
        }}
        buyTime={() => {
          if (level !== 13 && score >= 100 && timeLeft < MISSION_DURATION_SECONDS) {
            setScore(s => s - 100);
            setTimeLeft(t => t + 180); // Add 3 minutes
            setExtraTimeBought(e => e + 180);
            soundManager.playSuccess();
          }
        }}
        onGoHome={() => {
          if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
          }
          isTransitionPendingRef.current = false;
          setIsTransitioning(false);
          setPendingLevel(null);
          setIsActive(false);
          setLevel(0);
        }}
        onToggleMute={() => setIsMuted(m => !m)}
      />

      {/* Hint Modal */}
      <AnimatePresence>
        {showHint && (
          <div
            onClick={() => setShowHint(false)}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-yellow-500/50 p-6 rounded-2xl max-w-md w-full"
            >
              <div className="flex items-center gap-3 text-yellow-500 mb-4">
                <HelpCircle className="w-8 h-8" />
                <h2 className="text-xl font-bold uppercase tracking-widest">Aide de NAÏA</h2>
              </div>
              
              {unlockedFreeHints.includes(level) && (
                <div className="mb-4">
                  <h3 className="text-emerald-400 text-sm font-bold uppercase mb-1">Indice :</h3>
                  <p className="text-slate-300 leading-relaxed">
                    {HINTS[level]?.free || "Analysez bien la situation, agent. La réponse est sous vos yeux."}
                  </p>
                </div>
              )}

              {unlockedPaidHints.includes(level) && (
                <div className="mb-4">
                  <h3 className="text-yellow-400 text-sm font-bold uppercase mb-1">Indice Avancé :</h3>
                  <p className="text-slate-300 leading-relaxed">
                    {HINTS[level]?.paid || "Pas d'indice avancé pour ce niveau."}
                  </p>
                </div>
              )}

              <button 
                onClick={() => setShowHint(false)}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded-xl font-bold transition-all mt-4"
              >
                COMPRIS
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Glossary Modal */}
      <AnimatePresence>
        {showGlossary && (
          <div
            onClick={() => setShowGlossary(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-3xl w-full max-h-[82vh] overflow-y-auto shadow-[0_0_50px_rgba(16,185,129,0.2)]"
            >
              <div className="flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur px-5 py-4 z-20 border-b border-emerald-900/50">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-emerald-400 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                    GLOSSAIRE TECHNIQUE
                  </h2>
                  <span className="text-xs font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {discoveredTerms.length}/{Object.keys(TERMS_DICTIONARY).length}
                  </span>
                </div>
                <button onClick={() => setShowGlossary(false)} className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-slate-800 rounded-full">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-3 p-5">
                {Object.entries(TERMS_DICTIONARY).map(([term, item]) => {
                  const isDiscovered = discoveredTerms.includes(term) || isDevMode;
                  return (
                    <div key={term} className={`border p-3.5 rounded-xl transition-all ${
                      isDiscovered 
                        ? 'bg-slate-950/50 border-emerald-500/30' 
                        : 'bg-slate-900/20 border-slate-800 opacity-50 grayscale'
                    }`}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`text-sm font-bold ${isDiscovered ? 'text-emerald-400' : 'text-slate-600'}`}>
                          {isDiscovered ? item.title : '???'} ({term})
                        </h3>
                        {!isDiscovered && <Lock className="w-3 h-3 text-slate-700 shrink-0 mt-1" />}
                      </div>
                      <p className={`text-xs sm:text-sm leading-relaxed ${isDiscovered ? 'text-slate-300' : 'text-slate-700 italic'}`}>
                        {isDiscovered ? item.definition : 'Découvrez ce terme dans la simulation pour débloquer sa définition.'}
                      </p>
                    </div>
                  );
                })}
              </div>
              
              <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur px-5 py-3.5 border-t border-emerald-900/50 z-20">
                <button 
                  onClick={() => setShowGlossary(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  RETOUR À LA MISSION
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Progress Bar (Top edge under header) */}
      {/* Dev Mode Modal */}
      <AnimatePresence>
        {showDevModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowDevModal(false); setDevError(false); setDevPassword(''); }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-indigo-500/50 rounded-xl p-6 max-w-sm w-full shadow-[0_0_30px_rgba(99,102,241,0.25)]"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <Bug className="w-5 h-5" />
                  MODE ENSEIGNANT / DEV
                </div>
                <button onClick={() => { setShowDevModal(false); setDevError(false); setDevPassword(''); }} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {isDevMode ? (
                <div>
                  <p className="text-slate-300 text-sm mb-6">
                    Le mode enseignant / développeur est actuellement activé. Vous pouvez voir les réponses et passer les niveaux.
                  </p>
                  <button
                    onClick={() => {
                      setIsDevMode(false);
                      setShowDevModal(false);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-lg transition-colors border border-slate-600"
                  >
                    DÉSACTIVER LE MODE ENSEIGNANT / DEV
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDevSubmit}>
                  <input
                    type="password"
                    value={devPassword}
                    onChange={(e) => setDevPassword(e.target.value)}
                    placeholder="Mot de passe..."
                    className={`w-full bg-slate-950 border ${devError ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 mb-4`}
                    autoFocus
                  />
                  {devError && <p className="text-red-500 text-xs mb-4">Mot de passe incorrect.</p>}
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors"
                  >
                    ACTIVER
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <AnimatePresence>
        {isTransitioning && pendingLevel !== null && (
          <TransitionScreen 
            key="transition" 
            level={pendingLevel} 
            fact={FACTS[pendingLevel]}
            score={score}
            pointsGained={lastPointsGained}
            timeRemaining={lastTimeRemaining}
            onTransitionComplete={handleTransitionComplete} 
          />
        )}
      </AnimatePresence>

      <motion.main 
        className="w-full pt-14 md:pt-16 pb-2 my-auto relative"
        animate={isShaking ? { 
          x: [-10, 10, -10, 10, 0], 
          filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(-90deg)", "hue-rotate(0deg)"],
          transition: { duration: 0.4 } 
        } : {}}
      >
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
          {(timeLeft === 0 || lives === 0) && level !== 14 ? (
            <GameOver key="gameover" reason={lives === 0 ? 'lives' : 'time'} onRetry={startGame} nickname={nickname} />
          ) : level === 0 ? (
            <Intro 
              key="intro" 
              onStart={startGame} 
              hasSavedGame={hasSavedGame} 
              savedGameInfo={savedGameInfo}
              onLoadGame={loadGame} 
              onClearSave={clearSave} 
            />
          ) : level === 1 ? (
            <Level1 key="level1" isDevMode={isDevMode} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 2 ? (
            <Level2 key="level2" isDevMode={isDevMode} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 3 ? (
            <Level3 key="level3" isDevMode={isDevMode} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 4 ? (
            <Level4 key="level4" isDevMode={isDevMode} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 5 ? (
            <Level5 key="level5" isDevMode={isDevMode} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 6 ? (
            <Level6 key="level6" isDevMode={isDevMode} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 7 ? (
            <Level7 key="level7" isDevMode={isDevMode} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 8 ? (
            <Level8 key="level8" isDevMode={isDevMode} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 9 ? (
            <Level9 key="level9" isDevMode={isDevMode} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 10 ? (
            <Level10 key="level10" isDevMode={isDevMode} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 11 ? (
            <Level11 key="level11" isDevMode={isDevMode} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 12 ? (
            <Level12 key="level12" isDevMode={isDevMode} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 13 ? (
            <Level13 
              key="level13" 
              onComplete={nextLevel} 
              onScoreUpdate={handleScoreUpdate} 
              nickname={nickname}
              onFinalize={(evalData, imgUrl) => {
                setFinalEvaluation(evalData);
                setFinalImageUrl(imgUrl);
              }}
              isDevMode={isDevMode}
            />
          ) : level === 14 ? (
            <Outro 
              key="outro" 
              timeLeft={timeLeft} 
              extraTimeBought={extraTimeBought}
              score={score} 
              waterSaved={waterSaved}
              onRestart={startGame} 
              nickname={nickname}
              evaluation={finalEvaluation}
              imageUrl={finalImageUrl}
              leaderboard={leaderboard}
            />
          ) : null}
        </AnimatePresence>
      </motion.main>

      {/* Background moved to the top for z-index layering */}

      <footer className="w-full max-w-4xl mx-auto flex justify-center relative z-20 pt-2">
        <button 
          onClick={() => setShowDevModal(true)}
          className="text-[10px] sm:text-xs font-sans text-emerald-500/35 hover:text-emerald-500/70 transition-colors duration-300 bg-transparent border-none px-3 py-1.5 focus:outline-none cursor-default"
          aria-label="Mode Enseignant / Développeur"
        >
          Réalisé par la constellation Echo
        </button>
      </footer>
    </div>
  );
}

// Optimized Background Component
const Background = React.memo(() => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-950">
      {/* Subtle Vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,6,23,0.8)_100%)]" />
      
      {/* Dynamic Water Particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-cyan-500/10 blur-[1px]"
          initial={{ 
            width: Math.random() * 4 + 2, 
            height: Math.random() * 4 + 2,
            x: Math.random() * 100 + '%',
            y: '110%',
            opacity: Math.random() * 0.3 + 0.1
          }}
          animate={{ 
            y: '-10%',
            x: (Math.random() * 100 + (Math.sin(i) * 5)) + '%',
          }}
          transition={{ 
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 20,
            ease: "linear"
          }}
        />
      ))}

      {/* Subtle digital scanning lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(13,148,136,0.03)_1px,transparent_1px)] bg-[length:100%_4px] pointer-events-none" />
    </div>
  );
});

