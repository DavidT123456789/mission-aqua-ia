import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'motion/react';
import { GraduationCap, BookOpen, X, Lock, Pause, Play, Home, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import HUD from './components/HUD';
import TransitionScreen from './components/TransitionScreen';
import { NaiaHintContext } from './components/NaiaContext';
import { soundManager } from './utils/soundManager';
import {
  FACTS,
  HINTS,
  LEVEL_NAMES,
  MISSION_DURATION_SECONDS,
  HEART_COST_POINTS,
  MISTAKE_SCORE_PENALTY,
  FREE_HINT_COST_POINTS,
  PAID_HINT_COST_POINTS,
  TIME_BONUS_COST_POINTS,
  TIME_BONUS_SECONDS,
  TERM_DISCOVERY_POINTS,
  LOCKOUT_MIN_TIME_REMAINING_SECONDS,
  LOCKOUT_RESTORE_LIVES,
  LOCKOUT_TIME_PENALTY_SECONDS,
  type Evaluation,
} from './constants';
import Intro from './levels/Intro';
import { TERMS_DICTIONARY } from './components/TechTerm';
import type { BonusMissionId } from './components/BonusMissions';

const LEVEL_LOADERS = {
  1: () => import('./levels/Level1'),
  2: () => import('./levels/Level2'),
  3: () => import('./levels/Level3'),
  4: () => import('./levels/Level4'),
  5: () => import('./levels/Level5'),
  6: () => import('./levels/Level6'),
  7: () => import('./levels/Level7'),
  8: () => import('./levels/Level8'),
  9: () => import('./levels/Level9'),
  10: () => import('./levels/Level10'),
  11: () => import('./levels/Level11'),
  12: () => import('./levels/Level12'),
  13: () => import('./levels/Level13'),
  14: () => import('./levels/Outro'),
} as const;

const Level1 = lazy(LEVEL_LOADERS[1]);
const Level2 = lazy(LEVEL_LOADERS[2]);
const Level3 = lazy(LEVEL_LOADERS[3]);
const Level4 = lazy(LEVEL_LOADERS[4]);
const Level5 = lazy(LEVEL_LOADERS[5]);
const Level6 = lazy(LEVEL_LOADERS[6]);
const Level7 = lazy(LEVEL_LOADERS[7]);
const Level8 = lazy(LEVEL_LOADERS[8]);
const Level9 = lazy(LEVEL_LOADERS[9]);
const Level10 = lazy(LEVEL_LOADERS[10]);
const Level11 = lazy(LEVEL_LOADERS[11]);
const Level12 = lazy(LEVEL_LOADERS[12]);
const Level13 = lazy(LEVEL_LOADERS[13]);
const Outro = lazy(LEVEL_LOADERS[14]);
const GameOver = lazy(() => import('./levels/GameOver'));
const TeacherKitModal = lazy(() => import('./components/TeacherKitModal'));

function preloadLevel(target: number) {
  const loader = LEVEL_LOADERS[target as keyof typeof LEVEL_LOADERS];
  if (loader) {
    loader().catch(() => {});
  }
}

function LevelLoadingFallback() {
  return (
    <div className="sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border px-4 sm:px-6 py-12 sm:rounded-2xl max-w-4xl mx-auto flex flex-col items-center justify-center gap-3 backdrop-blur-xl">
      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      <span className="font-mono text-xs uppercase tracking-widest text-slate-400">
        Chargement du module...
      </span>
    </div>
  );
}

const FINAL_IMAGE_STORAGE_KEY = 'hydrosave_final_image';
let finalImageSaveGeneration = 0;

// Courbe lissée de stabilisation du réseau hydrique (N1 = diagnostic pur à 0 %, puis paliers réguliers ~7–8 % jusqu'à 86 %)
const NETWORK_WATER_BY_LEVEL: Record<number, number> = {
  1: 0,
  2: 8,
  3: 16,
  4: 24,
  5: 32,
  6: 40,
  7: 48,
  8: 56,
  9: 64,
  10: 71,
  11: 79,
  12: 86,
  13: 86,
};

function saveFinalImageSafely(imgUrl: string | null) {
  const currentGeneration = ++finalImageSaveGeneration;
  if (!imgUrl) {
    localStorage.removeItem(FINAL_IMAGE_STORAGE_KEY);
    return;
  }
  try {
    localStorage.setItem(FINAL_IMAGE_STORAGE_KEY, imgUrl);
  } catch {
    // Si l'image Base64 dépasse le quota localStorage, compresser en JPEG sur un canvas hors écran
    if (!imgUrl.startsWith('data:image/')) return;
    const img = new Image();
    img.onload = () => {
      if (currentGeneration !== finalImageSaveGeneration) return;
      try {
        const maxDim = 720;
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        if (currentGeneration !== finalImageSaveGeneration) return;
        localStorage.setItem(FINAL_IMAGE_STORAGE_KEY, compressed);
      } catch {
        // Ignore si le stockage reste saturé ; l'évaluation texte reste sauvegardée
      }
    };
    img.src = imgUrl;
  }
}

export default function App() {
  const prefersReducedMotion = useReducedMotion();
  const [level, setLevel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MISSION_DURATION_SECONDS); // 40 minutes
  const [extraTimeBought, setExtraTimeBought] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [baseNetworkWater, setBaseNetworkWater] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [secondChanceUsed, setSecondChanceUsed] = useState(false);
  const [levelAttemptKey, setLevelAttemptKey] = useState(0);
  const [devWaterBonus, setDevWaterBonus] = useState(false);
  const [lives, setLives] = useState(3);
  const [nickname, setNickname] = useState('');
  
  // Glossary State
  const [showGlossary, setShowGlossary] = useState(false);
  const [discoveredTerms, setDiscoveredTerms] = useState<string[]>([]);

  // Persistence & Sound State
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('hydrosave_muted') === 'true');
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [savedGameInfo, setSavedGameInfo] = useState<{ level: number; score: number; timeLeft: number; nickname?: string; isLockedOut?: boolean } | null>(null);

  // Bonus Data for Final Certificate
  const [finalEvaluation, setFinalEvaluation] = useState<Evaluation | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [finalLabWaterMl, setFinalLabWaterMl] = useState<number | null>(null);
  const [completedBonus, setCompletedBonus] = useState<BonusMissionId[]>([]);
  const [leaderboardRecorded, setLeaderboardRecorded] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{name: string, score: number}[]>([]);

  const waterSaved = useMemo(() => {
    if (baseNetworkWater <= 0) return 0;
    const labBonus = finalEvaluation
      ? Math.round((finalEvaluation.score / 100) * 12)
      : devWaterBonus
      ? 12
      : 0;
    const missionBonus = completedBonus.length; // +1 % par défi bonus validé (max +2 %)
    return Math.min(100, Math.max(0, baseNetworkWater + labBonus + missionBonus));
  }, [baseNetworkWater, finalEvaluation, devWaterBonus, completedBonus.length]);

  // Hint State (le niveau 1 est débloqué gratuitement pour éviter un démarrage bloqué à 0 pt)
  const [showHint, setShowHint] = useState(false);
  const [unlockedFreeHints, setUnlockedFreeHints] = useState<number[]>([1]);
  const [unlockedPaidHints, setUnlockedPaidHints] = useState<number[]>([]);

  useEffect(() => {
    setShowHint(false);
    setShowHomeConfirm(false);
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
  const [lastLifeRestored, setLastLifeRestored] = useState(false);
  const [levelBonusScore, setLevelBonusScore] = useState(0);
  const isTransitionPendingRef = useRef(false);
  const successFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successFlashTimerRef.current) clearTimeout(successFlashTimerRef.current);
    };
  }, []);

  const triggerCelebration = useCallback((particleCount = 100) => {
    if (successFlashTimerRef.current) clearTimeout(successFlashTimerRef.current);
    setIsSuccessFlash(true);
    successFlashTimerRef.current = setTimeout(() => {
      setIsSuccessFlash(false);
      successFlashTimerRef.current = null;
    }, 800);

    confetti({
      particleCount,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#06b6d4', '#8b5cf6'],
      disableForReducedMotion: true,
    });
  }, []);

  useEffect(() => {
    soundManager.setMuted(isMuted);
    localStorage.setItem('hydrosave_muted', isMuted.toString());
    if (isMuted) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      window.dispatchEvent(new CustomEvent('naiaStopSpeech'));
    }
  }, [isMuted]);

  useEffect(() => {
    if (isPaused) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      window.dispatchEvent(new CustomEvent('naiaStopSpeech'));
    }
  }, [isPaused]);

  // Préchargement silencieux du prochain niveau (et du niveau sauvegardé) pour éviter tout flash réseau
  useEffect(() => {
    if (level === 0) {
      preloadLevel(1);
      if (savedGameInfo?.level && savedGameInfo.level > 0 && savedGameInfo.level <= 14) {
        preloadLevel(savedGameInfo.level);
      }
    } else if (level >= 1 && level < 14) {
      preloadLevel(level + 1);
    }
  }, [level, savedGameInfo?.level]);

  useEffect(() => {
    if (pendingLevel !== null) {
      preloadLevel(pendingLevel);
    }
  }, [pendingLevel]);

  useEffect(() => {
    if (level === 0) {
      document.title = "Mission Aqua-IA";
    } else if (level === 14) {
      document.title = "Mission Aqua-IA : Mission Réussie !";
    } else {
      document.title = `Mission Aqua-IA · Niveau ${level}/13 : ${LEVEL_NAMES[level] || `Mission ${level}`}`;
    }
  }, [level]);

  // Global UI Sounds (hover désactivé pour éviter les bips parasites en salle informatique)
  useEffect(() => {
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
    document.addEventListener('click', handleClick);
    
    return () => {
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
        const isValidInProgress =
          typeof parsed?.level === 'number' &&
          parsed.level > 0 &&
          parsed.level < 14 &&
          ((parsed.lives ?? 3) > 0 || !parsed.secondChanceUsed) &&
          (parsed.timeLeft ?? 1) > 0;
        const isValidFinalDossier = parsed?.level === 14;

        if (isValidInProgress || isValidFinalDossier) {
          setHasSavedGame(true);
          setSavedGameInfo({
            level: parsed.level,
            score: parsed.score ?? 0,
            timeLeft: parsed.timeLeft ?? MISSION_DURATION_SECONDS,
            nickname: parsed.nickname || '',
            isLockedOut: parsed.level < 14 && (parsed.lives ?? 3) <= 0 && !parsed.secondChanceUsed,
          });
        } else {
          localStorage.removeItem('hydrosave_progress');
          localStorage.removeItem(FINAL_IMAGE_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem('hydrosave_progress');
        localStorage.removeItem(FINAL_IMAGE_STORAGE_KEY);
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
    baseNetworkWater,
    mistakeCount,
    secondChanceUsed,
    devWaterBonus,
    lives,
    timeLeft,
    extraTimeBought,
    nickname,
    discoveredTerms,
    unlockedFreeHints,
    unlockedPaidHints,
    finalEvaluation,
    finalLabWaterMl,
    completedBonus,
    leaderboardRecorded,
  });

  useEffect(() => {
    timeLeftRef.current = timeLeft;
    progressSnapshotRef.current = {
      level,
      score,
      waterSaved,
      baseNetworkWater,
      mistakeCount,
      secondChanceUsed,
      devWaterBonus,
      lives,
      timeLeft,
      extraTimeBought,
      nickname,
      discoveredTerms,
      unlockedFreeHints,
      unlockedPaidHints,
      finalEvaluation,
      finalLabWaterMl,
      completedBonus,
      leaderboardRecorded,
    };
  }, [
    level,
    score,
    waterSaved,
    baseNetworkWater,
    mistakeCount,
    secondChanceUsed,
    devWaterBonus,
    lives,
    timeLeft,
    extraTimeBought,
    nickname,
    discoveredTerms,
    unlockedFreeHints,
    unlockedPaidHints,
    finalEvaluation,
    finalLabWaterMl,
    completedBonus,
    leaderboardRecorded,
  ]);

  const persistProgress = useCallback(() => {
    const snap = progressSnapshotRef.current;
    if (snap.level <= 0 || snap.level > 14) return false;
    if (snap.level < 14 && (snap.timeLeft <= 0 || (snap.lives <= 0 && snap.secondChanceUsed))) {
      localStorage.removeItem('hydrosave_progress');
      saveFinalImageSafely(null);
      return false;
    }
    try {
      localStorage.setItem('hydrosave_progress', JSON.stringify(snap));
    } catch {
      return false;
    }
    return true;
  }, []);

  const isPermanentGameOver = timeLeft <= 0 || (lives <= 0 && secondChanceUsed);

  useEffect(() => {
    if (level <= 0 || level > 14) return;
    if (level < 14 && isPermanentGameOver) {
      localStorage.removeItem('hydrosave_progress');
      saveFinalImageSafely(null);
      setHasSavedGame(false);
      setSavedGameInfo(null);
      return;
    }
    if (persistProgress()) {
      setHasSavedGame(true);
      setSavedGameInfo({
        level,
        score,
        timeLeft: timeLeftRef.current,
        nickname,
        isLockedOut: level < 14 && lives <= 0 && !secondChanceUsed,
      });
    }
  }, [
    level,
    score,
    waterSaved,
    baseNetworkWater,
    mistakeCount,
    secondChanceUsed,
    devWaterBonus,
    lives,
    isPermanentGameOver,
    extraTimeBought,
    nickname,
    discoveredTerms,
    unlockedFreeHints,
    unlockedPaidHints,
    finalEvaluation,
    finalLabWaterMl,
    completedBonus,
    leaderboardRecorded,
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

    if (leaderboardRecordedRef.current || leaderboardRecorded) return;
    leaderboardRecordedRef.current = true;
    setLeaderboardRecorded(true);

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
  }, [level, nickname, score, leaderboardRecorded]);

  const clearSave = () => {
    localStorage.removeItem('hydrosave_progress');
    localStorage.removeItem('hydrosave_lab_draft');
    saveFinalImageSafely(null);
    setHasSavedGame(false);
    setSavedGameInfo(null);
    setDiscoveredTerms([]);
    discoveredTermsRef.current = [];
    window.dispatchEvent(new CustomEvent('resetDiscoveredTerms'));
  };

  const loadGame = () => {
    const saved = localStorage.getItem('hydrosave_progress');
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      if (typeof state?.level !== 'number' || state.level <= 0 || state.level > 14) {
        clearSave();
        return;
      }
      isTransitionPendingRef.current = false;
      setLevel(state.level);
      setScore(state.score ?? 0);
      setBaseNetworkWater(
        typeof state.baseNetworkWater === 'number'
          ? Math.min(86, state.baseNetworkWater)
          : Math.min(86, state.waterSaved ?? 0)
      );
      setMistakeCount(state.mistakeCount ?? 0);
      setSecondChanceUsed(Boolean(state.secondChanceUsed));
      setLevelAttemptKey((k) => k + 1);
      setLastLifeRestored(false);
      setDevWaterBonus(Boolean(state.devWaterBonus));
      const loadedLives = typeof state.lives === 'number' ? Math.max(0, Math.min(3, state.lives)) : 3;
      setLives(loadedLives);
      setTimeLeft(state.timeLeft ?? MISSION_DURATION_SECONDS);
      setExtraTimeBought(state.extraTimeBought || 0);
      setNickname(state.nickname || '');
      const loadedTerms = (Array.isArray(state.discoveredTerms) ? state.discoveredTerms : []).filter(
        (t: unknown): t is string => typeof t === 'string' && t in TERMS_DICTIONARY
      );
      setDiscoveredTerms(loadedTerms);
      discoveredTermsRef.current = loadedTerms;
      const loadedFreeHints: number[] = Array.isArray(state.unlockedFreeHints) ? state.unlockedFreeHints : [];
      setUnlockedFreeHints(loadedFreeHints.includes(1) ? loadedFreeHints : [1, ...loadedFreeHints]);
      setUnlockedPaidHints(state.unlockedPaidHints || []);
      setFinalEvaluation(state.finalEvaluation ?? null);
      setFinalLabWaterMl(typeof state.finalLabWaterMl === 'number' ? state.finalLabWaterMl : null);
      setCompletedBonus(Array.isArray(state.completedBonus) ? state.completedBonus : []);
      const wasRecorded = Boolean(state.leaderboardRecorded || state.level === 14);
      leaderboardRecordedRef.current = wasRecorded;
      setLeaderboardRecorded(wasRecorded);
      try {
        setFinalImageUrl(localStorage.getItem(FINAL_IMAGE_STORAGE_KEY));
      } catch {
        setFinalImageUrl(null);
      }
      setIsPaused(false);
      setIsActive(state.level < 14 && loadedLives > 0);
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
        setScore(s => s + TERM_DISCOVERY_POINTS);
        setLevelBonusScore(prev => prev + TERM_DISCOVERY_POINTS);
        window.dispatchEvent(new CustomEvent('glossaryPlusOne'));
      }
      soundManager.playDiscover();
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
  const [showTeacherKit, setShowTeacherKit] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const [devError, setDevError] = useState<string | null>(null);
  const [isDevLoading, setIsDevLoading] = useState(false);
  const footerClickTimesRef = useRef<number[]>([]);

  const handleFooterCreditClick = () => {
    const now = Date.now();
    const recent = footerClickTimesRef.current.filter((t) => now - t < 1000);
    recent.push(now);
    footerClickTimesRef.current = recent;
    if (recent.length >= 2) {
      footerClickTimesRef.current = [];
      setShowDevModal(true);
    }
  };

  useEffect(() => {
    const handleTeacherShortcut = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowDevModal(true);
      }
    };
    window.addEventListener('keydown', handleTeacherShortcut);
    return () => window.removeEventListener('keydown', handleTeacherShortcut);
  }, []);

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
    if (!isActive || isPaused || showHomeConfirm || showTeacherKit || isTransitioning || pendingLevel !== null || !hasTimeLeft || !hasLives || level === 13) {
      return;
    }
    const interval = setInterval(() => {
      if (timeLeftRef.current <= 1) {
        setTimeLeft(0);
        setIsActive(false);
        soundManager.playGameOver();
      } else {
        if (timeLeftRef.current === 301) {
          soundManager.playTimeWarning();
        }
        setTimeLeft((time) => (time <= 1 ? 0 : time - 1));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, isPaused, showHomeConfirm, showTeacherKit, isTransitioning, pendingLevel, hasTimeLeft, hasLives, level]);

  // Close modals on Escape key
  useEffect(() => {
    if (!showHint && !showGlossary && !showDevModal && !showTeacherKit && !showHomeConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowHint(false);
        setShowGlossary(false);
        setShowDevModal(false);
        setShowTeacherKit(false);
        setShowHomeConfirm(false);
        setDevError(null);
        setDevPassword('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHint, showGlossary, showDevModal, showTeacherKit, showHomeConfirm]);

  const startGame = (name: string) => {
    isTransitionPendingRef.current = false;
    setIsTransitioning(false);
    setPendingLevel(null);
    setIsPaused(false);

    // Vérifier si une partie précédente était sauvegardée avant de nettoyer le stockage
    const hadSavedGame = Boolean(localStorage.getItem('hydrosave_progress'));

    // Effacer immédiatement toute ancienne sauvegarde pour éviter qu'un niveau ne lise un état obsolète
    localStorage.removeItem('hydrosave_progress');
    localStorage.removeItem('hydrosave_lab_draft');
    saveFinalImageSafely(null);
    setHasSavedGame(false);
    setSavedGameInfo(null);

    // Conserver les points des termes découverts sur l'Intro uniquement lors d'un premier départ (pas sur Replay / Nouvelle Partie)
    const keepIntroDiscoveries = level === 0 && !hadSavedGame;
    const validIntroTerms = discoveredTerms.filter(t => t in TERMS_DICTIONARY);
    const initialScore = keepIntroDiscoveries ? validIntroTerms.length * TERM_DISCOVERY_POINTS : 0;
    if (!keepIntroDiscoveries) {
      setDiscoveredTerms([]);
      discoveredTermsRef.current = [];
      window.dispatchEvent(new CustomEvent('resetDiscoveredTerms'));
    }

    setNickname(name);
    setIsActive(true);
    setIsPaused(false);
    setLevel(1);
    setScore(initialScore);
    setBaseNetworkWater(0);
    setMistakeCount(0);
    setSecondChanceUsed(false);
    setLevelAttemptKey((k) => k + 1);
    setLastLifeRestored(false);
    setDevWaterBonus(false);
    setLives(3);
    setTimeLeft(MISSION_DURATION_SECONDS);
    setExtraTimeBought(0);
    leaderboardRecordedRef.current = false;
    setLeaderboardRecorded(false);
    setUnlockedFreeHints([1]);
    setUnlockedPaidHints([]);
    setLevelBonusScore(0);
    setFinalEvaluation(null);
    setFinalImageUrl(null);
    setFinalLabWaterMl(null);
    setCompletedBonus([]);
    soundManager.playStart();
  };

  const resumeFromLockout = useCallback(() => {
    if (level <= 0 || level >= 13 || timeLeft <= 0 || secondChanceUsed) return;
    setSecondChanceUsed(true);
    setTimeLeft((t) => {
      if (t <= LOCKOUT_MIN_TIME_REMAINING_SECONDS) return t;
      return Math.max(LOCKOUT_MIN_TIME_REMAINING_SECONDS, t - LOCKOUT_TIME_PENALTY_SECONDS);
    });
    setLives(LOCKOUT_RESTORE_LIVES);
    setLevelAttemptKey((k) => k + 1);
    setLevelBonusScore(0);
    setShowHint(false);
    setIsPaused(false);
    setIsActive(true);
    soundManager.playStart();
  }, [level, timeLeft, secondChanceUsed]);

  const nextLevel = () => {
    if (isTransitionPendingRef.current || isTransitioning) return;
    isTransitionPendingRef.current = true;
    setIsPaused(false);

    const next = level + 1;
    if (next === 14) {
      soundManager.playVictory();
      triggerCelebration(140);
      isTransitionPendingRef.current = false;
      setLastLifeRestored(false);
      setLevel(next);
      return;
    }

    // Life regeneration every 3 levels
    const willRestoreLife = next % 3 === 0 && lives < 3;
    setLastLifeRestored(willRestoreLife);
    if (next % 3 === 0) {
      setLives(prev => Math.min(3, prev + 1));
    }

    setPendingLevel(next);
    setLastTimeRemaining(timeLeft);
    setIsTransitioning(true);
  };

  const handleTransitionComplete = () => {
    isTransitionPendingRef.current = false;
    setIsTransitioning(false);
    setLastLifeRestored(false);
    setLevelBonusScore(0);
    if (pendingLevel !== null) {
      setLevel(pendingLevel);
      setPendingLevel(null);
    }
  };

  const handleScoreUpdate = (points: number, water: number, celebrate = true) => {
    setScore((s) => Math.max(0, s + points));
    if (water > 0) {
      const targetWater = NETWORK_WATER_BY_LEVEL[level] ?? Math.min(86, Math.round((water / 94) * 86));
      setBaseNetworkWater((prev) => Math.max(prev, targetWater));
    }
    setLastPointsGained(points + levelBonusScore);
    if (celebrate && (points > 0 || water > 0)) {
      triggerCelebration(100);
    }
  };

  const handleMistake = () => {
    if (lives <= 1) {
      soundManager.playGameOver();
    } else {
      soundManager.playError();
    }
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500); // Shake for 500ms
    setMistakeCount((c) => c + 1);
    setScore((s) => Math.max(0, s - MISTAKE_SCORE_PENALTY));
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
        soundManager.playBadgeUnlock();
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

  const restoreIfGameOverDev = () => {
    if (lives <= 0) setLives(3);
    if (timeLeft <= 0) setTimeLeft(MISSION_DURATION_SECONDS);
  };

  const prevLevelDev = () => {
    restoreIfGameOverDev();
    setLevel((l) => Math.max(0, l - 1));
  };

  const jumpToLevelDev = (targetLevel: number) => {
    restoreIfGameOverDev();
    if (targetLevel <= 2) {
      setBaseNetworkWater(0);
    } else if (targetLevel >= 13) {
      setBaseNetworkWater((prev) => Math.max(prev, 86));
      if (targetLevel === 14 && !finalEvaluation) {
        setDevWaterBonus(true);
      }
    } else {
      const targetWater = NETWORK_WATER_BY_LEVEL[targetLevel - 1] ?? 0;
      setBaseNetworkWater((prev) => Math.max(prev, targetWater));
    }
    if (targetLevel > 0 && targetLevel < 14) {
      setIsActive(true);
    }
    setLevel(targetLevel);
  };

  const skipLevelDev = () => {
    if (level >= 14) return;
    restoreIfGameOverDev();
    if (level === 0) {
      setIsActive(true);
      setLevel(1);
      return;
    }
    if (level === 13) {
      setDevWaterBonus(true);
    }
    handleScoreUpdate(200, NETWORK_WATER_BY_LEVEL[level] ?? 0, false);
    nextLevel();
  };

  const useHint = useCallback((type: 'free' | 'paid') => {
    if (type === 'free') {
      if (unlockedFreeHints.includes(level)) {
        setShowHint(true); // Already unlocked (after mistake or purchase), free to review
      } else {
        if (score >= FREE_HINT_COST_POINTS) {
          setScore(s => Math.max(0, s - FREE_HINT_COST_POINTS));
          setUnlockedFreeHints(prev => [...prev, level]);
          setShowHint(true);
          soundManager.playHintUnlock();
        }
      }
    } else {
      if (!HINTS[level]?.paid) return;
      if (!unlockedPaidHints.includes(level)) {
        if (score >= PAID_HINT_COST_POINTS) {
          setScore(s => Math.max(0, s - PAID_HINT_COST_POINTS));
          setUnlockedPaidHints(prev => [...prev, level]);
          setShowHint(true);
          soundManager.playHintUnlock();
        }
      } else {
        setShowHint(true); // Already unlocked, just show it
      }
    }
  }, [level, score, unlockedFreeHints, unlockedPaidHints]);

  const buyHeart = useCallback(() => {
    if (level > 0 && level < 13 && score >= HEART_COST_POINTS && lives > 0 && lives < 3) {
      setScore(s => s - HEART_COST_POINTS);
      setLives(l => Math.min(3, l + 1));
      soundManager.playHeartRestore();
    }
  }, [level, score, lives]);

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
          discoveredCount={discoveredTerms.filter(t => t in TERMS_DICTIONARY).length}
          totalTerms={Object.keys(TERMS_DICTIONARY).length}
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
          onOpenTeacherKit={() => setShowTeacherKit(true)}
          setShowGlossary={setShowGlossary}
          setLevel={jumpToLevelDev}
          prevLevelDev={prevLevelDev}
          skipLevelDev={skipLevelDev}
          buyHeart={buyHeart}
          buyTime={() => {
            if (level !== 13 && score >= TIME_BONUS_COST_POINTS && timeLeft < MISSION_DURATION_SECONDS) {
              setScore(s => s - TIME_BONUS_COST_POINTS);
              setTimeLeft(t => t + TIME_BONUS_SECONDS);
              setExtraTimeBought(e => e + TIME_BONUS_SECONDS);
              soundManager.playTimeBoost();
            }
          }}
          onGoHome={() => {
            if (isTransitionPending) return;
            if (level > 0 && level < 14 && timeLeft > 0 && lives > 0) {
              setShowHomeConfirm(true);
              return;
            }
            isTransitionPendingRef.current = false;
            if (persistProgress()) {
              setHasSavedGame(true);
              setSavedGameInfo({
                level,
                score,
                timeLeft: timeLeftRef.current,
                nickname,
                isLockedOut: level < 14 && lives <= 0 && !secondChanceUsed,
              });
            }
            setIsTransitioning(false);
            setPendingLevel(null);
            setIsActive(false);
            setIsPaused(false);
            if (lives <= 0 || timeLeft <= 0) {
              setLives(3);
              setTimeLeft(MISSION_DURATION_SECONDS);
            }
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
                    {discoveredTerms.filter(t => t in TERMS_DICTIONARY).length}/{Object.keys(TERMS_DICTIONARY).length}
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
                        {isDiscovered
                          ? item.definition
                          : level < 14
                          ? `Lisez ce terme dans la simulation pour débloquer sa définition (+${TERM_DISCOVERY_POINTS} pts).`
                          : 'Découvrez ce terme dans la simulation pour débloquer sa définition.'}
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
                  <GraduationCap className="w-5 h-5" />
                  MODE ENSEIGNANT
                </div>
                <button onClick={() => { setShowDevModal(false); setDevError(null); setDevPassword(''); }} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {isDevMode ? (
                <div className="space-y-2.5">
                  <p className="text-slate-300 text-sm mb-4">
                    Le mode enseignant est actuellement activé. Vous pouvez consulter les réponses attendues et naviguer librement entre les niveaux.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDevModal(false);
                      setShowTeacherKit(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-950/70 hover:bg-indigo-900/70 text-indigo-200 font-bold py-2 rounded-lg transition-colors border border-indigo-500/40 text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ouvrir le Kit Enseignant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDevMode(false);
                      setShowDevModal(false);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-lg transition-colors border border-slate-600 text-sm"
                  >
                    DÉSACTIVER LE MODE ENSEIGNANT
                  </button>
                </div>
              ) : (
                <div>
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
                  <div className="mt-4 pt-3.5 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDevModal(false);
                        setDevError(null);
                        setDevPassword('');
                        setShowTeacherKit(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-slate-950/70 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-200 border border-white/10 hover:border-indigo-500/40 font-semibold py-2 px-3 rounded-lg text-xs transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Kit Enseignant (déroulé, programmes, débat)</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teacher Kit Modal (lazy-loaded, sans corrigés) */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {showTeacherKit && (
            <TeacherKitModal onClose={() => setShowTeacherKit(false)} />
          )}
        </AnimatePresence>
      </Suspense>

      {/* Home Navigation Confirmation Modal */}
      <AnimatePresence>
        {showHomeConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHomeConfirm(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-confirm-title"
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.65)]"
            >
              <div className="flex justify-between items-center mb-3">
                <div id="home-confirm-title" className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Home className="w-5 h-5" />
                  RETOURNER À L'ACCUEIL ?
                </div>
                <button
                  type="button"
                  onClick={() => setShowHomeConfirm(false)}
                  className="text-slate-400 hover:text-white"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-5">
                Votre progression globale (niveau {level}/13, score et chrono) est sauvegardée et pourra être reprise depuis l'accueil. En revanche, les actions non validées du niveau en cours seront réinitialisées.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-2.5">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setShowHomeConfirm(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors border border-slate-700"
                >
                  Rester sur la mission
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHomeConfirm(false);
                    isTransitionPendingRef.current = false;
                    if (persistProgress()) {
                      setHasSavedGame(true);
                      setSavedGameInfo({ level, score, timeLeft: timeLeftRef.current, nickname });
                    }
                    setIsTransitioning(false);
                    setPendingLevel(null);
                    setIsActive(false);
                    setIsPaused(false);
                    setLevel(0);
                  }}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors"
                >
                  Aller à l'accueil
                </button>
              </div>
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
                  Niveau {level}/13 : {LEVEL_NAMES[level]}
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
            lifeRestored={lastLifeRestored}
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
        <Suspense fallback={<LevelLoadingFallback />}>
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
          {level > 0 && (timeLeft === 0 || lives === 0) && level !== 14 ? (
            <GameOver
              key="gameover"
              reason={timeLeft === 0 ? 'time' : 'lives'}
              onRetry={startGame}
              onResumeLevel={timeLeft > 0 && !secondChanceUsed ? resumeFromLockout : undefined}
              onGoHome={() => {
                if (persistProgress()) {
                  setHasSavedGame(true);
                  setSavedGameInfo({
                    level,
                    score,
                    timeLeft: timeLeftRef.current,
                    nickname,
                    isLockedOut: level < 14 && lives <= 0 && !secondChanceUsed,
                  });
                }
                setIsActive(false);
                setIsPaused(false);
                setLives(3);
                setTimeLeft(MISSION_DURATION_SECONDS);
                setLevel(0);
              }}
              nickname={nickname}
              level={level}
              score={score}
              timeLeft={timeLeft}
              secondChanceUsed={secondChanceUsed}
            />
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
            <Level1 key={`level1-${levelAttemptKey}`} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 2 ? (
            <Level2 key={`level2-${levelAttemptKey}`} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 3 ? (
            <Level3 key={`level3-${levelAttemptKey}`} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 4 ? (
            <Level4 key={`level4-${levelAttemptKey}`} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 5 ? (
            <Level5 key={`level5-${levelAttemptKey}`} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 6 ? (
            <Level6 key={`level6-${levelAttemptKey}`} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 7 ? (
            <Level7 key={`level7-${levelAttemptKey}`} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 8 ? (
            <Level8 key={`level8-${levelAttemptKey}`} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 9 ? (
            <Level9 key={`level9-${levelAttemptKey}`} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 10 ? (
            <Level10 key={`level10-${levelAttemptKey}`} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 11 ? (
            <Level11 key={`level11-${levelAttemptKey}`} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 12 ? (
            <Level12 key={`level12-${levelAttemptKey}`} onComplete={nextLevel} onScoreUpdate={handleScoreUpdate} onMistake={handleMistake} />
          ) : level === 13 ? (
            <Level13 
              key="level13" 
              onComplete={nextLevel} 
              onScoreUpdate={handleScoreUpdate} 
              nickname={nickname}
              onFinalize={(evalData, imgUrl, labWaterMl) => {
                setFinalEvaluation(evalData);
                setFinalImageUrl(imgUrl);
                setFinalLabWaterMl(typeof labWaterMl === 'number' ? labWaterMl : null);
                if (!evalData) {
                  setDevWaterBonus(false);
                }
                saveFinalImageSafely(imgUrl);
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
              mistakeCount={mistakeCount}
              onRestart={startGame} 
              nickname={nickname}
              evaluation={finalEvaluation}
              imageUrl={finalImageUrl}
              labWaterMl={finalLabWaterMl}
              leaderboard={leaderboard}
              completedBonus={completedBonus}
              onCompleteBonus={(id) => setCompletedBonus((prev) => (prev.includes(id) ? prev : [...prev, id]))}
            />
          ) : null}
        </AnimatePresence>
        </Suspense>
      </motion.main>

      {/* Background moved to the top for z-index layering */}

      <footer inert={isPauseOverlayVisible} className="w-full max-w-4xl mx-auto flex justify-center relative z-20 pt-2">
        <span
          onClick={handleFooterCreditClick}
          className="text-[11px] font-sans text-slate-500/75 px-3 py-1.5 rounded-md cursor-default select-none"
        >
          Réalisé par la constellation Echo
        </span>
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

