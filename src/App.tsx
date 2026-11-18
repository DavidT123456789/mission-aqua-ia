import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'motion/react';
import { Bug, BookOpen, X, Lock, Pause, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import HUD from './components/HUD';
import TransitionScreen from './components/TransitionScreen';
import { NaiaHintContext } from './components/NaiaContext';
import { soundManager } from './utils/soundManager';
import { FACTS, HINTS, LEVEL_NAMES, MISSION_DURATION_SECONDS, type Evaluation } from './constants';
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
  const prefersReducedMotion = useReducedMotion();
  const [level, setLevel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MISSION_DURATION_SECONDS); // 40 minutes
  const [extraTimeBought, setExtraTimeBought] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
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
  const [finalEvaluation, setFinalEvaluation] = useState<Evaluation | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<{name: string, score: number}[]>([]);

  // Hint State
  const [showHint, setShowHint] = useState(false);
  const [unlockedFreeHints, setUnlockedFreeHints] = useState<number[]>([]);
  const [unlockedPaidHints, setUnlockedPaidHints] = useState<number[]>([]);

  useEffect(() => {
    setShowHint(false);
    if (level <= 0 || level >= 13) {
      setIsPaused(false);
    }
  }, [level]);

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
      try {
        const parsedBoard = JSON.parse(savedLeaderboard);
        if (Array.isArray(parsedBoard)) {
          setLeaderboard(parsedBoard);
        }
      } catch {
        localStorage.removeItem('hydrosave_leaderboard');
      }
    }
  }, []);

  const timeLeftRef = useRef(timeLeft);

  const progressSnapshotRef = useRef({
    level,
    score,
    waterSaved,
    lives,
    timeLeft,
    extraTimeBought,
    nickname,
    discoveredTerms,
    unlockedFreeHints,
    unlockedPaidHints,
  });

  useEffect(() => {
    timeLeftRef.current = timeLeft;
    progressSnapshotRef.current = {
      level,
      score,
      waterSaved,
      lives,
      timeLeft,
      extraTimeBought,
      nickname,
      discoveredTerms,
      unlockedFreeHints,
      unlockedPaidHints,
    };
  }, [
    level,
    score,
    waterSaved,
    lives,
    timeLeft,
    extraTimeBought,
    nickname,
    discoveredTerms,
    unlockedFreeHints,
    unlockedPaidHints,
  ]);

  const persistProgress = useCallback(() => {
    const snap = progressSnapshotRef.current;
    if (snap.level <= 0 || snap.level >= 14) return false;
    if (snap.lives <= 0 || snap.timeLeft <= 0) {
      localStorage.removeItem('hydrosave_progress');
      return false;
    }
    localStorage.setItem('hydrosave_progress', JSON.stringify(snap));
    return true;
  }, []);

  const isGameLost = lives <= 0 || timeLeft <= 0;

  useEffect(() => {
    if (level <= 0 || level >= 14) return;
    if (isGameLost) {
      localStorage.removeItem('hydrosave_progress');
      setHasSavedGame(false);
      setSavedGameInfo(null);
      return;
    }
    if (persistProgress()) {
      setHasSavedGame(true);
      setSavedGameInfo({ level, score, timeLeft: timeLeftRef.current });
    }
  }, [
    level,
    score,
    waterSaved,
    lives,
    isGameLost,
    extraTimeBought,
    nickname,
    discoveredTerms,
    unlockedFreeHints,
    unlockedPaidHints,
    isPaused,
    persistProgress,
  ]);

  useEffect(() => {
    const flushSave = () => {
      persistProgress();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistProgress();
      }
    };
    window.addEventListener('pagehide', flushSave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flushSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [persistProgress]);

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

  const clearSave = () => {
    localStorage.removeItem('hydrosave_progress');
    setHasSavedGame(false);
    setSavedGameInfo(null);
  };

  const loadGame = () => {
    const saved = localStorage.getItem('hydrosave_progress');
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      if (typeof state?.level !== 'number' || state.level <= 0 || state.level >= 14) {
        clearSave();
        return;
      }
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      isTransitionPendingRef.current = false;
      setLevel(state.level);
      setScore(state.score ?? 0);
      setWaterSaved(state.waterSaved ?? 0);
      setLives(state.lives ?? 3);
      setTimeLeft(state.timeLeft ?? MISSION_DURATION_SECONDS);
      setExtraTimeBought(state.extraTimeBought || 0);
      setNickname(state.nickname || '');
      const loadedTerms = state.discoveredTerms || [];
      setDiscoveredTerms(loadedTerms);
      discoveredTermsRef.current = loadedTerms;
      setUnlockedFreeHints(state.unlockedFreeHints || []);
      setUnlockedPaidHints(state.unlockedPaidHints || []);
      setIsPaused(false);
      setIsActive(true);
      soundManager.playStart();
    } catch {
      clearSave();
    }
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
    const handleDiscovery = (e: Event) => {
      const term = (e as CustomEvent<string>).detail;
      if (!term) return;
      
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

  // Developer Mode State (verified server-side via /api/dev-auth)
  const [devAnswers, setDevAnswers] = useState<Record<number, string> | null>(null);
  const isDevMode = devAnswers !== null;
  const setIsDevMode = useCallback((enabled: boolean) => {
    if (!enabled) setDevAnswers(null);
  }, []);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const [devError, setDevError] = useState<string | null>(null);
  const [isDevLoading, setIsDevLoading] = useState(false);

  const isTransitionPending = pendingLevel !== null || isTransitioning;
  const isPauseOverlayVisible = isPaused && level > 0 && level < 13 && timeLeft > 0 && lives > 0 && !isTransitionPending;

  useEffect(() => {
    localStorage.removeItem('hydrosave_devmode');
    localStorage.removeItem('hydrosave_devanswers');
  }, []);

  useEffect(() => {
    if (!isPauseOverlayVisible) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isPauseOverlayVisible]);

  const hasTimeLeft = timeLeft > 0;
  const hasLives = lives > 0;

  useEffect(() => {
    if (!isActive || isPaused || isTransitioning || pendingLevel !== null || !hasTimeLeft || !hasLives || level === 13) {
      return;
    }
    const interval = setInterval(() => {
      if (timeLeftRef.current <= 1) {
        setTimeLeft(0);
        setIsActive(false);
      } else {
        setTimeLeft((time) => (time <= 1 ? 0 : time - 1));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, isPaused, isTransitioning, pendingLevel, hasTimeLeft, hasLives, level]);

  // Close modals on Escape key
  useEffect(() => {
    if (!showHint && !showGlossary && !showDevModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowHint(false);
        setShowGlossary(false);
        setShowDevModal(false);
        setDevError(null);
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
    setIsPaused(false);

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
    setIsPaused(false);
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
    setIsPaused(false);

    soundManager.playSuccess();
    setIsSuccessFlash(true);
    setTimeout(() => setIsSuccessFlash(false), 800);

    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#06b6d4', '#8b5cf6'],
      disableForReducedMotion: true
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

  const handleDevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devPassword.trim() || isDevLoading) return;
    setIsDevLoading(true);
    setDevError(null);
    try {
      const res = await fetch('/api/dev-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: devPassword })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401) {
          setDevError('Mot de passe incorrect.');
        } else if (res.status === 503) {
          setDevError(data?.error || 'Mode enseignant non configuré sur le serveur.');
        } else {
          setDevError("Service d'authentification indisponible.");
        }
        soundManager.playError();
        return;
      }
      if (data?.answers && typeof data.answers === 'object') {
        setDevAnswers(data.answers);
        setShowDevModal(false);
        setDevPassword('');
        setDevError(null);
        soundManager.playSuccess();
      } else {
        setDevError("Réponse invalide du serveur d'authentification.");
        soundManager.playError();
      }
    } catch {
      setDevError("Serveur d'authentification inaccessible.");
      soundManager.playError();
    } finally {
      setIsDevLoading(false);
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

  const useHint = useCallback((type: 'free' | 'paid') => {
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
      if (!HINTS[level]?.paid) return;
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
  }, [level, score, unlockedFreeHints, unlockedPaidHints]);

  const naiaHintContextValue = useMemo(() => ({
    level,
    score,
    unlockedFreeHints,
    unlockedPaidHints,
    isHintOpen: showHint,
    setIsHintOpen: setShowHint,
    useHint
  }), [level, score, unlockedFreeHints, unlockedPaidHints, showHint, useHint]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <MotionConfig reducedMotion="user">
    <NaiaHintContext.Provider value={naiaHintContextValue}>
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col items-center p-4 pb-2 overflow-hidden relative">
      {/* Decorative background elements */}
      <Background />
      {/* Success Flash Overlay */}
      <AnimatePresence>
        {isSuccessFlash && !prefersReducedMotion && (
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

      <div inert={isPauseOverlayVisible}>
        <HUD
          level={level}
          timeLeft={timeLeft}
          lives={lives}
          waterSaved={waterSaved}
          score={score}
          isDevMode={isDevMode}
          devAnswers={devAnswers}
          isPaused={isPaused}
          isTransitionPending={isTransitionPending}
          isMuted={isMuted}
          onTogglePause={() => {
            if (isTransitionPending || level <= 0 || level >= 13) return;
            setIsPaused((prev) => {
              const next = !prev;
              if (next) {
                setShowHint(false);
                setShowGlossary(false);
              }
              return next;
            });
          }}
          setIsDevMode={setIsDevMode}
          setShowDevModal={setShowDevModal}
          setShowGlossary={setShowGlossary}
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
            if (persistProgress()) {
              setHasSavedGame(true);
              setSavedGameInfo({ level, score, timeLeft: timeLeftRef.current });
            }
            setIsTransitioning(false);
            setPendingLevel(null);
            setIsActive(false);
            setIsPaused(false);
            setLevel(0);
          }}
          onToggleMute={() => setIsMuted(m => !m)}
        />
      </div>

      {/* Glossary Modal */}
      <AnimatePresence>
        {showGlossary && (
          <div
            onClick={() => setShowGlossary(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl max-w-3xl w-full max-h-[82vh] overflow-y-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.65)]"
            >
              <div className="flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur px-5 py-4 z-20 border-b border-white/10">
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
              
              <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur px-5 py-3.5 border-t border-white/10 z-20">
                <button 
                  onClick={() => setShowGlossary(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-sm transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_18px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]"
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
            onClick={() => { setShowDevModal(false); setDevError(null); setDevPassword(''); }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.65)]"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <Bug className="w-5 h-5" />
                  MODE ENSEIGNANT / DEV
                </div>
                <button onClick={() => { setShowDevModal(false); setDevError(null); setDevPassword(''); }} className="text-slate-500 hover:text-white">
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
                    onChange={(e) => {
                      setDevPassword(e.target.value);
                      if (devError) setDevError(null);
                    }}
                    placeholder="Mot de passe..."
                    className={`w-full bg-slate-950 border ${devError ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 mb-4`}
                    autoFocus
                  />
                  {devError && <p className="text-red-500 text-xs mb-4">{devError}</p>}
                  <button
                    type="submit"
                    disabled={isDevLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-colors"
                  >
                    {isDevLoading ? 'VÉRIFICATION...' : 'ACTIVER'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Overlay (masks current level while teacher addresses the class) */}
      <AnimatePresence>
        {isPauseOverlayVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-modal-title"
            className="fixed inset-0 z-[115] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 15, opacity: 0 }}
              className="bg-slate-900/95 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.65)] flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center">
                <Pause className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="space-y-1.5">
                <h2 id="pause-modal-title" className="text-2xl sm:text-3xl font-black text-white uppercase tracking-widest">
                  Mission en Pause
                </h2>
                <p className="text-xs sm:text-sm font-bold text-cyan-400 uppercase tracking-wider">
                  Niveau {level}/13 — {LEVEL_NAMES[level]}
                </p>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Le chronomètre est suspendu (<span className="font-mono font-bold text-cyan-300">{formatTime(timeLeft)}</span>). Écoutez les consignes de votre enseignant avant de reprendre la mission.
              </p>
              <button
                type="button"
                autoFocus
                onClick={() => setIsPaused(false)}
                className="w-full mt-2 flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black py-3.5 px-6 rounded-xl uppercase tracking-widest text-xs sm:text-sm transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Reprendre la Mission</span>
              </button>
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
        inert={isPauseOverlayVisible}
        className="w-full pt-14 md:pt-16 pb-2 my-auto relative"
        animate={isShaking && !prefersReducedMotion ? {
          x: [-5, 5, -3, 3, 0],
          transition: { duration: 0.3 }
        } : { x: 0 }}
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

      <footer inert={isPauseOverlayVisible} className="w-full max-w-4xl mx-auto flex justify-center relative z-20 pt-2">
        <button 
          onClick={() => setShowDevModal(true)}
          className="text-[11px] font-sans text-slate-500/75 hover:text-emerald-400/80 transition-colors duration-300 bg-transparent border-none px-3 py-1.5 rounded-md cursor-default"
          aria-label="Mode Enseignant / Développeur"
        >
          Réalisé par la constellation Echo
        </button>
      </footer>
    </div>
    </NaiaHintContext.Provider>
    </MotionConfig>
  );
}

const BACKGROUND_PARTICLES = Array.from({ length: 15 }, (_, i) => {
  const seed = (i * 37 + 13) % 100;
  const size = 2 + ((i * 7) % 4);
  return {
    id: i,
    size,
    startX: `${seed}%`,
    endX: `${(seed + Math.sin(i) * 5 + 100) % 100}%`,
    opacity: 0.1 + ((i * 3) % 3) * 0.08,
    duration: 12 + (i % 10),
    delay: (i * 1.4) % 18
  };
});

// Optimized Background Component
const Background = React.memo(() => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-950">
      {/* Subtle atmospheric top glow + depth vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.06),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,6,23,0.8)_100%)]" />
      
      {/* Dynamic Water Particles */}
      {BACKGROUND_PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-cyan-500/10 blur-[1px]"
          initial={{ 
            width: p.size, 
            height: p.size,
            x: p.startX,
            y: '110%',
            opacity: p.opacity
          }}
          animate={{ 
            y: '-10%',
            x: p.endX,
          }}
          transition={{ 
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
        />
      ))}

      {/* Subtle digital scanning lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(13,148,136,0.03)_1px,transparent_1px)] bg-[length:100%_4px] pointer-events-none" />
    </div>
  );
});

