import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'motion/react';
import { GraduationCap, BookOpen, X, Lock, Pause, Play, Home, FileText, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import HUD from './components/HUD';
import TransitionScreen from './components/TransitionScreen';
import { NaiaHintContext } from './components/NaiaContext';
import { soundManager } from './utils/soundManager';
import { EASE_OUT_EXPO, MODAL_BACKDROP_MOTION, MODAL_PANEL_MOTION } from './utils/motion';
import {
  FACTS,
  LEVEL_NAMES,
  MISSION_DURATION_MINUTES,
  MISSION_DURATION_SECONDS,
  HEART_COST_POINTS,
  MISTAKE_SCORE_PENALTY,
  TERM_DISCOVERY_POINTS,
  LOCKOUT_RESTORE_LIVES,
  getActForLevel,
  type ActCheckpoint,
  type Evaluation,
} from './constants';
import {
  getLevelTransitionLifeRecovery,
  isActCheckpointEntry,
  resolveActCheckpointResume,
  type LifeRestoreKind,
} from './utils/checkpointRules';
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
const preloadGameOver = () => import('./levels/GameOver');
const GameOver = lazy(preloadGameOver);
const TeacherKitModal = lazy(() => import('./components/TeacherKitModal'));

function preloadLevel(target: number) {
  const loader = LEVEL_LOADERS[target as keyof typeof LEVEL_LOADERS];
  if (loader) {
    loader().catch(() => {});
  }
}

function LevelLoadingFallback() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 250);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border px-4 sm:px-6 py-12 sm:rounded-3xl max-w-4xl mx-auto flex flex-col items-center justify-center gap-3 backdrop-blur-xl"
    >
      <div className="w-7 h-7 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      <span className="font-mono text-xs uppercase tracking-widest text-slate-400">
        Chargement…
      </span>
    </motion.div>
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

interface SavedGameInfo {
  level: number;
  score: number;
  elapsedSeconds: number;
  nickname?: string;
  isLockedOut?: boolean;
  isActCheckpointOver?: boolean;
  actCheckpointLabel?: string;
  actCheckpointLevel?: number;
  actCheckpointScore?: number;
}

function resolveLegacyElapsedSeconds(raw: {
  elapsedSeconds?: unknown;
  timeLeft?: unknown;
  extraTimeBought?: unknown;
}): number {
  if (typeof raw.elapsedSeconds === 'number' && Number.isFinite(raw.elapsedSeconds)) {
    return Math.max(0, Math.floor(raw.elapsedSeconds));
  }
  if (typeof raw.timeLeft === 'number' && Number.isFinite(raw.timeLeft)) {
    const extra = typeof raw.extraTimeBought === 'number' && Number.isFinite(raw.extraTimeBought)
      ? Math.max(0, raw.extraTimeBought)
      : 0;
    return Math.max(0, Math.floor(MISSION_DURATION_SECONDS + extra - raw.timeLeft));
  }
  return 0;
}

function parseActCheckpoint(raw: unknown): ActCheckpoint | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<ActCheckpoint> & { timeLeft?: unknown; extraTimeBought?: unknown };
  if (candidate.actId !== 1 && candidate.actId !== 2 && candidate.actId !== 3) return null;
  if (typeof candidate.level !== 'number' || candidate.level < 1 || candidate.level > 13) return null;
  return {
    actId: candidate.actId,
    level: candidate.level,
    score: typeof candidate.score === 'number' ? Math.max(0, candidate.score) : 0,
    baseNetworkWater:
      typeof candidate.baseNetworkWater === 'number'
        ? Math.max(0, Math.min(86, candidate.baseNetworkWater))
        : NETWORK_WATER_BY_LEVEL[candidate.level - 1] ?? 0,
    elapsedSeconds: resolveLegacyElapsedSeconds(candidate),
  };
}

function buildSavedGameInfo(data: {
  level: number;
  score: number;
  elapsedSeconds: number;
  lives: number;
  secondChanceUsed: boolean;
  nickname?: string;
  actCheckpoint?: ActCheckpoint | null;
}): SavedGameInfo {
  const isPermanentFail = data.level < 14 && data.lives <= 0 && data.secondChanceUsed;
  const currentAct = getActForLevel(data.level);
  const isActCheckpointOver = Boolean(isPermanentFail && currentAct && currentAct.id > 1);
  const cp =
    data.actCheckpoint && currentAct && data.actCheckpoint.actId === currentAct.id
      ? data.actCheckpoint
      : null;

  return {
    level: data.level,
    score: data.score,
    elapsedSeconds: data.elapsedSeconds,
    nickname: data.nickname || '',
    isLockedOut: data.level < 14 && data.lives <= 0 && !data.secondChanceUsed,
    isActCheckpointOver,
    actCheckpointLabel: isActCheckpointOver ? currentAct?.label : undefined,
    actCheckpointLevel: isActCheckpointOver ? cp?.level ?? currentAct?.startLevel : undefined,
    actCheckpointScore: isActCheckpointOver ? cp?.score ?? data.score : undefined,
  };
}

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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showOvertimeNotice, setShowOvertimeNotice] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [baseNetworkWater, setBaseNetworkWater] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [secondChanceUsed, setSecondChanceUsed] = useState(false);
  const [actCheckpoint, setActCheckpoint] = useState<ActCheckpoint | null>(null);
  const [levelAttemptKey, setLevelAttemptKey] = useState(0);
  const [devWaterBonus, setDevWaterBonus] = useState(false);
  const [lives, setLives] = useState(3);
  const [nickname, setNickname] = useState('');
  
  // Glossary State
  const [showGlossary, setShowGlossary] = useState(false);
  const [discoveredTerms, setDiscoveredTerms] = useState<string[]>([]);

  // Persistence & Sound State
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('hydrosave_muted') === 'true');
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [savedGameInfo, setSavedGameInfo] = useState<SavedGameInfo | null>(null);

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

  // Hint State (indices méthodologiques toujours gratuits et accessibles dans NAÏA)
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(false);
    setShowHomeConfirm(false);
    if (level !== 0) {
      setIsBriefingOpen(false);
    }
    if (level <= 0 || level >= 13) {
      setIsPaused(false);
    }
  }, [level]);

  const [isShaking, setIsShaking] = useState(false);
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<number | null>(null);
  const [lastPointsGained, setLastPointsGained] = useState(0);
  const [lastElapsedSnapshot, setLastElapsedSnapshot] = useState(0);
  const [lastLifeRestoreKind, setLastLifeRestoreKind] = useState<LifeRestoreKind>('none');
  const [levelBonusScore, setLevelBonusScore] = useState(0);
  const isTransitionPendingRef = useRef(false);
  const successFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overtimeNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successFlashTimerRef.current) clearTimeout(successFlashTimerRef.current);
      if (overtimeNoticeTimerRef.current) clearTimeout(overtimeNoticeTimerRef.current);
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

  // Préchargement silencieux des prochains niveaux (et de GameOver) pour des transitions instantanées sans flash
  useEffect(() => {
    if (level === 0) {
      preloadLevel(1);
      preloadLevel(2);
      if (savedGameInfo?.level && savedGameInfo.level > 0 && savedGameInfo.level <= 14) {
        preloadLevel(savedGameInfo.level);
        preloadLevel(savedGameInfo.level + 1);
      }
      if (
        savedGameInfo?.actCheckpointLevel &&
        savedGameInfo.actCheckpointLevel > 0 &&
        savedGameInfo.actCheckpointLevel <= 14
      ) {
        preloadLevel(savedGameInfo.actCheckpointLevel);
      }
    } else if (level >= 1 && level < 14) {
      preloadLevel(level + 1);
      preloadLevel(level + 2);
      preloadGameOver().catch(() => {});
    }
  }, [level, savedGameInfo?.level, savedGameInfo?.actCheckpointLevel]);

  useEffect(() => {
    if (pendingLevel !== null) {
      preloadLevel(pendingLevel);
    }
  }, [pendingLevel]);

  useEffect(() => {
    if (level === 0) {
      document.title = "Dernière Source";
    } else if (level === 14) {
      document.title = "Dernière Source : Mission Réussie !";
    } else {
      document.title = `Dernière Source · Niveau ${level}/13 : ${LEVEL_NAMES[level] || `Mission ${level}`}`;
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
        const parsedLives = typeof parsed?.lives === 'number' ? parsed.lives : 3;
        const parsedElapsedSeconds = resolveLegacyElapsedSeconds(parsed ?? {});
        const parsedSecondChanceUsed = Boolean(parsed?.secondChanceUsed);
        const parsedCheckpoint = parseActCheckpoint(parsed?.actCheckpoint);
        const isPermanentFail = parsedLives <= 0 && parsedSecondChanceUsed;
        const hasRecoverableActCheckpoint =
          typeof parsed?.level === 'number' &&
          parsed.level >= 4 &&
          parsed.level < 14 &&
          isPermanentFail;
        const isValidInProgress =
          typeof parsed?.level === 'number' &&
          parsed.level > 0 &&
          parsed.level < 14 &&
          (!isPermanentFail || hasRecoverableActCheckpoint);
        const isValidFinalDossier = parsed?.level === 14;

        if (isValidInProgress || isValidFinalDossier) {
          setHasSavedGame(true);
          setSavedGameInfo(
            buildSavedGameInfo({
              level: parsed.level,
              score: parsed.score ?? 0,
              elapsedSeconds: parsedElapsedSeconds,
              lives: parsedLives,
              secondChanceUsed: parsedSecondChanceUsed,
              nickname: parsed.nickname || '',
              actCheckpoint: parsedCheckpoint,
            })
          );
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

  const elapsedSecondsRef = useRef(elapsedSeconds);

  const progressSnapshotRef = useRef({
    level,
    score,
    waterSaved,
    baseNetworkWater,
    mistakeCount,
    secondChanceUsed,
    actCheckpoint,
    devWaterBonus,
    lives,
    elapsedSeconds,
    nickname,
    discoveredTerms,
    finalEvaluation,
    finalLabWaterMl,
    completedBonus,
    leaderboardRecorded,
  });

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
    progressSnapshotRef.current = {
      level,
      score,
      waterSaved,
      baseNetworkWater,
      mistakeCount,
      secondChanceUsed,
      actCheckpoint,
      devWaterBonus,
      lives,
      elapsedSeconds,
      nickname,
      discoveredTerms,
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
    actCheckpoint,
    devWaterBonus,
    lives,
    elapsedSeconds,
    nickname,
    discoveredTerms,
    finalEvaluation,
    finalLabWaterMl,
    completedBonus,
    leaderboardRecorded,
  ]);

  const persistProgress = useCallback(() => {
    const snap = progressSnapshotRef.current;
    if (snap.level <= 0 || snap.level > 14) return false;
    const snapPermanentFail = snap.lives <= 0 && snap.secondChanceUsed;
    if (snap.level < 4 && snapPermanentFail) {
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

  const isPermanentGameOver = lives <= 0 && secondChanceUsed;

  useEffect(() => {
    if (level <= 0 || level > 14) return;
    if (level < 4 && isPermanentGameOver) {
      localStorage.removeItem('hydrosave_progress');
      saveFinalImageSafely(null);
      setHasSavedGame(false);
      setSavedGameInfo(null);
      return;
    }
    if (persistProgress()) {
      setHasSavedGame(true);
      setSavedGameInfo(
        buildSavedGameInfo({
          level,
          score,
          elapsedSeconds: elapsedSecondsRef.current,
          lives,
          secondChanceUsed,
          nickname,
          actCheckpoint,
        })
      );
    }
  }, [
    level,
    score,
    waterSaved,
    baseNetworkWater,
    mistakeCount,
    secondChanceUsed,
    actCheckpoint,
    devWaterBonus,
    lives,
    isPermanentGameOver,
    nickname,
    discoveredTerms,
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
    setActCheckpoint(null);
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
      setMistakeCount(state.mistakeCount ?? 0);
      setLevelAttemptKey((k) => k + 1);
      setLastLifeRestoreKind('none');
      setDevWaterBonus(Boolean(state.devWaterBonus));
      setNickname(state.nickname || '');
      const loadedTerms = (Array.isArray(state.discoveredTerms) ? state.discoveredTerms : []).filter(
        (t: unknown): t is string => typeof t === 'string' && t in TERMS_DICTIONARY
      );
      setDiscoveredTerms(loadedTerms);
      discoveredTermsRef.current = loadedTerms;
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

      const loadedLives = typeof state.lives === 'number' ? Math.max(0, Math.min(3, state.lives)) : 3;
      const loadedElapsedSeconds = resolveLegacyElapsedSeconds(state);
      const loadedSecondChanceUsed = Boolean(state.secondChanceUsed);
      const loadedCheckpoint = parseActCheckpoint(state.actCheckpoint);
      const loadedPermanentFail = state.level < 14 && loadedLives <= 0 && loadedSecondChanceUsed;
      const loadedAct = getActForLevel(state.level);
      setShowOvertimeNotice(false);

      // Si la sauvegarde provient d'un Game Over en Acte II ou III, restaurer directement le point de contrôle d'acte
      if (loadedPermanentFail && loadedAct && loadedAct.id > 1) {
        const cp: ActCheckpoint =
          loadedCheckpoint && loadedCheckpoint.actId === loadedAct.id
            ? loadedCheckpoint
            : {
                actId: loadedAct.id,
                level: loadedAct.startLevel,
                score: state.score ?? 0,
                baseNetworkWater: NETWORK_WATER_BY_LEVEL[loadedAct.startLevel - 1] ?? 0,
                elapsedSeconds: loadedElapsedSeconds,
              };

        const resumed = resolveActCheckpointResume(cp, loadedSecondChanceUsed);
        setLevel(resumed.level);
        setScore(resumed.score);
        setBaseNetworkWater(resumed.baseNetworkWater);
        setLives(resumed.lives);
        setElapsedSeconds(resumed.elapsedSeconds);
        setSecondChanceUsed(resumed.secondChanceUsed);
        setLevelBonusScore(0);
        setActCheckpoint(cp);
        setIsActive(true);
      } else {
        setLevel(state.level);
        setScore(state.score ?? 0);
        setBaseNetworkWater(
          typeof state.baseNetworkWater === 'number'
            ? Math.min(86, state.baseNetworkWater)
            : Math.min(86, state.waterSaved ?? 0)
        );
        setSecondChanceUsed(loadedSecondChanceUsed);
        setActCheckpoint(loadedCheckpoint);
        setLives(loadedLives);
        setElapsedSeconds(loadedElapsedSeconds);
        setIsActive(state.level < 14 && loadedLives > 0);
      }
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
  const isPauseOverlayVisible = isPaused && level > 0 && level < 13 && lives > 0 && !isTransitionPending;

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

  const hasLives = lives > 0;

  useEffect(() => {
    if (!isActive || isPaused || showHomeConfirm || showTeacherKit || isTransitioning || pendingLevel !== null || !hasLives || level <= 0 || level >= 13) {
      return;
    }
    const interval = setInterval(() => {
      const nextElapsed = elapsedSecondsRef.current + 1;
      if (nextElapsed === MISSION_DURATION_SECONDS - 300) {
        soundManager.playTimeWarning();
      } else if (nextElapsed === MISSION_DURATION_SECONDS) {
        soundManager.playTimeWarning();
        setShowOvertimeNotice(true);
        if (overtimeNoticeTimerRef.current) clearTimeout(overtimeNoticeTimerRef.current);
        overtimeNoticeTimerRef.current = setTimeout(() => {
          setShowOvertimeNotice(false);
          overtimeNoticeTimerRef.current = null;
        }, 9000);
      }
      setElapsedSeconds(nextElapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, isPaused, showHomeConfirm, showTeacherKit, isTransitioning, pendingLevel, hasLives, level]);

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
    setActCheckpoint(null);
    setLevelAttemptKey((k) => k + 1);
    setLastLifeRestoreKind('none');
    setDevWaterBonus(false);
    setLives(3);
    setElapsedSeconds(0);
    setShowOvertimeNotice(false);
    leaderboardRecordedRef.current = false;
    setLeaderboardRecorded(false);
    setLevelBonusScore(0);
    setFinalEvaluation(null);
    setFinalImageUrl(null);
    setFinalLabWaterMl(null);
    setCompletedBonus([]);
    soundManager.playStart();
  };

  const resumeFromLockout = useCallback(() => {
    if (level <= 0 || level >= 13 || secondChanceUsed) return;
    setSecondChanceUsed(true);
    setLives(LOCKOUT_RESTORE_LIVES);
    setLevelAttemptKey((k) => k + 1);
    setLevelBonusScore(0);
    setShowHint(false);
    setIsPaused(false);
    setIsActive(true);
    soundManager.playStart();
  }, [level, secondChanceUsed]);

  const effectiveActCheckpoint = useMemo<ActCheckpoint | null>(() => {
    const currentAct = getActForLevel(level);
    if (!currentAct || currentAct.id === 1) return null;
    if (actCheckpoint && actCheckpoint.actId === currentAct.id) {
      return actCheckpoint;
    }
    const startLevel = currentAct.startLevel;
    return {
      actId: currentAct.id,
      level: startLevel,
      score,
      baseNetworkWater: NETWORK_WATER_BY_LEVEL[startLevel - 1] ?? 0,
      elapsedSeconds,
    };
  }, [level, actCheckpoint, score, elapsedSeconds]);

  const resumeFromActCheckpoint = useCallback(() => {
    if (!effectiveActCheckpoint) return;

    const resumed = resolveActCheckpointResume(effectiveActCheckpoint, secondChanceUsed);
    isTransitionPendingRef.current = false;
    setIsTransitioning(false);
    setPendingLevel(null);
    setLevel(resumed.level);
    setScore(resumed.score);
    setBaseNetworkWater(resumed.baseNetworkWater);
    setElapsedSeconds(resumed.elapsedSeconds);
    setShowOvertimeNotice(false);
    setLives(resumed.lives);
    setSecondChanceUsed(resumed.secondChanceUsed);
    setLevelBonusScore(0);
    setLastLifeRestoreKind('none');
    setShowHint(false);
    setIsPaused(false);
    setLevelAttemptKey((k) => k + 1);
    setActCheckpoint(effectiveActCheckpoint);
    setIsActive(true);
    soundManager.playStart();
  }, [effectiveActCheckpoint, secondChanceUsed]);

  const nextLevel = () => {
    if (isTransitionPendingRef.current || isTransitioning) return;
    isTransitionPendingRef.current = true;
    setIsPaused(false);

    const next = level + 1;
    if (next === 14) {
      soundManager.playVictory();
      triggerCelebration(140);
      isTransitionPendingRef.current = false;
      setLastLifeRestoreKind('none');
      setLevel(next);
      return;
    }

    // Restauration synchronisée : 3/3 aux checkpoints d'acte (N4, N11) et +1 vie unique à mi-Acte II (N8)
    const { nextLives, restoreKind } = getLevelTransitionLifeRecovery(next, lives);
    setLastLifeRestoreKind(restoreKind);
    if (nextLives !== lives) {
      setLives(nextLives);
    }

    setPendingLevel(next);
    setLastElapsedSnapshot(elapsedSeconds);
    setIsTransitioning(true);
  };

  const handleTransitionComplete = () => {
    isTransitionPendingRef.current = false;
    setIsTransitioning(false);
    setLastLifeRestoreKind('none');
    setLevelBonusScore(0);
    if (pendingLevel !== null) {
      const enteredAct = getActForLevel(pendingLevel);
      if (enteredAct && isActCheckpointEntry(pendingLevel)) {
        setActCheckpoint({
          actId: enteredAct.id,
          level: pendingLevel,
          score,
          baseNetworkWater,
          elapsedSeconds: elapsedSecondsRef.current,
        });
      }
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
  };

  const jumpToLevelDev = (targetLevel: number) => {
    restoreIfGameOverDev();
    setIsPaused(false);
    if (targetLevel <= 2) {
      setBaseNetworkWater(0);
      setDevWaterBonus(false);
    } else if (targetLevel >= 13) {
      setBaseNetworkWater(86);
      if (targetLevel === 14 && !finalEvaluation) {
        setDevWaterBonus(true);
      } else if (targetLevel === 13) {
        setDevWaterBonus(false);
      }
    } else {
      const targetWater = NETWORK_WATER_BY_LEVEL[targetLevel - 1] ?? 0;
      setBaseNetworkWater(targetWater);
      setDevWaterBonus(false);
    }
    const targetAct = getActForLevel(targetLevel);
    if (!targetAct || targetAct.id === 1) {
      setActCheckpoint(null);
    } else if (actCheckpoint?.actId !== targetAct.id) {
      const startLevel = targetAct.startLevel;
      setActCheckpoint({
        actId: targetAct.id,
        level: startLevel,
        score,
        baseNetworkWater: NETWORK_WATER_BY_LEVEL[startLevel - 1] ?? 0,
        elapsedSeconds: elapsedSecondsRef.current,
      });
    }
    if (targetLevel > 0 && targetLevel < 14) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
    setLevel(targetLevel);
  };

  const prevLevelDev = () => {
    jumpToLevelDev(Math.max(0, level - 1));
  };

  const previewInterludeDev = (targetLevel: 4 | 11) => {
    restoreIfGameOverDev();
    const targetWater = NETWORK_WATER_BY_LEVEL[targetLevel - 1] ?? 0;
    setBaseNetworkWater(targetWater);
    setDevWaterBonus(false);
    setIsActive(true);
    setIsPaused(false);
    setLastPointsGained(0);
    setLastElapsedSnapshot(elapsedSecondsRef.current);
    setLastLifeRestoreKind('none');
    isTransitionPendingRef.current = true;
    setPendingLevel(targetLevel);
    setIsTransitioning(true);
  };

  const skipLevelDev = () => {
    if (level >= 14) return;
    restoreIfGameOverDev();
    setIsPaused(false);
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

  const buyHeart = useCallback(() => {
    if (level > 0 && level < 13 && score >= HEART_COST_POINTS && lives > 0 && lives < 3) {
      setScore(s => s - HEART_COST_POINTS);
      setLives(l => Math.min(3, l + 1));
      soundManager.playHeartRestore();
    }
  }, [level, score, lives]);

  const naiaHintContextValue = useMemo(() => ({
    level,
    isHintOpen: showHint,
    setIsHintOpen: setShowHint,
  }), [level, showHint]);

  const formatMissionClock = (elapsed: number) => {
    const remaining = MISSION_DURATION_SECONDS - Math.max(0, Math.floor(elapsed));
    const abs = Math.abs(remaining);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    const base = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return remaining < 0 ? `+${base}` : base;
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
          elapsedSeconds={elapsedSeconds}
          lives={lives}
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
          onPreloadLevel={preloadLevel}
          onPreviewInterlude={previewInterludeDev}
          prevLevelDev={prevLevelDev}
          skipLevelDev={skipLevelDev}
          buyHeart={buyHeart}
          onGoHome={() => {
            if (isTransitionPending) return;
            if (level > 0 && level < 14 && lives > 0) {
              setShowHomeConfirm(true);
              return;
            }
            isTransitionPendingRef.current = false;
            if (persistProgress()) {
              setHasSavedGame(true);
              setSavedGameInfo(
                buildSavedGameInfo({
                  level,
                  score,
                  elapsedSeconds: elapsedSecondsRef.current,
                  lives,
                  secondChanceUsed,
                  nickname,
                  actCheckpoint,
                })
              );
            }
            setIsTransitioning(false);
            setPendingLevel(null);
            setIsActive(false);
            setIsPaused(false);
            setShowOvertimeNotice(false);
            if (lives <= 0) {
              setLives(3);
            }
            setLevel(0);
          }}
          onToggleMute={() => setIsMuted(m => !m)}
          hideHeader={level === 0 && isBriefingOpen}
        />
      </div>

      {/* Non-blocking Overtime Banner when crossing the 40-minute target */}
      <AnimatePresence>
        {showOvertimeNotice && level > 0 && level < 13 && lives > 0 && !isTransitionPending && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            role="status"
            aria-live="polite"
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[65] w-[calc(100%-2rem)] max-w-xl"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-amber-400/40 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.55)] text-xs sm:text-sm text-slate-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <Clock className="w-4 h-4 text-amber-300 shrink-0" />
                <p className="leading-snug">
                  <strong className="text-amber-300 font-semibold">Objectif {MISSION_DURATION_MINUTES} min dépassé :</strong>{' '}
                  protocole de secours activé, vous pouvez terminer la mission librement en prolongation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOvertimeNotice(false)}
                aria-label="Fermer la notification"
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glossary Modal */}
      <AnimatePresence>
        {showGlossary && (
          <motion.div
            {...MODAL_BACKDROP_MOTION}
            onClick={() => setShowGlossary(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
          >
            <motion.div 
              {...MODAL_PANEL_MOTION}
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
                          ? `Survolez ou cliquez sur ce terme dans la mission (2,5 s) pour débloquer sa définition (+${TERM_DISCOVERY_POINTS} pts).`
                          : 'Survolez ou cliquez sur ce terme dans la mission pour débloquer sa définition.'}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar (Top edge under header) */}
      {/* Dev Mode Modal */}
      <AnimatePresence>
        {showDevModal && (
          <motion.div
            {...MODAL_BACKDROP_MOTION}
            onClick={() => { setShowDevModal(false); setDevError(null); setDevPassword(''); }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
          >
            <motion.div
              {...MODAL_PANEL_MOTION}
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
            <TeacherKitModal key="teacher-kit-modal" onClose={() => setShowTeacherKit(false)} />
          )}
        </AnimatePresence>
      </Suspense>

      {/* Home Navigation Confirmation Modal */}
      <AnimatePresence>
        {showHomeConfirm && (
          <motion.div
            {...MODAL_BACKDROP_MOTION}
            onClick={() => setShowHomeConfirm(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-confirm-title"
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
          >
            <motion.div
              {...MODAL_PANEL_MOTION}
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
                      setSavedGameInfo(
                        buildSavedGameInfo({
                          level,
                          score,
                          elapsedSeconds: elapsedSecondsRef.current,
                          lives,
                          secondChanceUsed,
                          nickname,
                          actCheckpoint,
                        })
                      );
                    }
                    setIsTransitioning(false);
                    setPendingLevel(null);
                    setIsActive(false);
                    setIsPaused(false);
                    setShowOvertimeNotice(false);
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
            {...MODAL_BACKDROP_MOTION}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-modal-title"
            className="fixed inset-0 z-[115] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              {...MODAL_PANEL_MOTION}
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
                Le chronomètre est suspendu (<span className="font-mono font-bold text-cyan-300">{formatMissionClock(elapsedSeconds)}</span>). Écoutez les consignes de votre enseignant avant de reprendre la mission.
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
            elapsedSeconds={lastElapsedSnapshot}
            lifeRestoreKind={lastLifeRestoreKind}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(m => !m)}
            skipReadDelay={isDevMode}
            onTransitionComplete={handleTransitionComplete} 
          />
        )}
      </AnimatePresence>

      <motion.main 
        inert={isPauseOverlayVisible}
        className={`w-full relative ${
          level > 0 && level < 14 && lives > 0
            ? 'flex-1 pt-16 md:pt-[76px] pb-6'
            : 'pt-14 md:pt-16 pb-2 my-auto'
        }`}
        animate={isShaking && !prefersReducedMotion ? {
          x: [-5, 5, -3, 3, 0],
          transition: { duration: 0.3 }
        } : { x: 0 }}
      >
        <Suspense fallback={<LevelLoadingFallback />}>
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
          {isTransitioning ? null : level > 0 && lives === 0 && level !== 14 ? (
            <GameOver
              key="gameover"
              onRetry={startGame}
              onResumeLevel={!secondChanceUsed ? resumeFromLockout : undefined}
              onResumeAct={effectiveActCheckpoint ? resumeFromActCheckpoint : undefined}
              actCheckpoint={effectiveActCheckpoint}
              onGoHome={() => {
                if (persistProgress()) {
                  setHasSavedGame(true);
                  setSavedGameInfo(
                    buildSavedGameInfo({
                      level,
                      score,
                      elapsedSeconds: elapsedSecondsRef.current,
                      lives,
                      secondChanceUsed,
                      nickname,
                      actCheckpoint,
                    })
                  );
                }
                setIsActive(false);
                setIsPaused(false);
                setShowOvertimeNotice(false);
                setLives(3);
                setLevel(0);
              }}
              nickname={nickname}
              level={level}
              score={score}
              elapsedSeconds={elapsedSeconds}
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
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(m => !m)}
              onBriefingOpenChange={setIsBriefingOpen}
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
              elapsedSeconds={elapsedSeconds} 
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

      <motion.footer
        inert={isPauseOverlayVisible}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.52, ease: EASE_OUT_EXPO }}
        className="w-full max-w-4xl mx-auto flex justify-center relative z-20 pt-2"
      >
        <span
          onClick={handleFooterCreditClick}
          className="text-[11px] font-sans text-slate-500/75 px-3 py-1.5 rounded-md cursor-default select-none"
        >
          Réalisé par la constellation Echo
        </span>
      </motion.footer>
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

// Optimized Atmospheric Background Component
const Background = React.memo(() => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-950">
      {/* Subtle atmospheric top glow + depth vignette with soft launch bloom */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.95, ease: EASE_OUT_EXPO }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.08),transparent_62%)] origin-top"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,6,23,0.8)_100%)]" />

      {/* Subtle floating ambient particles */}
      {BACKGROUND_PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-cyan-500/10 blur-[1px]"
          initial={{
            width: p.size,
            height: p.size,
            x: p.startX,
            y: '110%',
            opacity: p.opacity,
          }}
          animate={{
            y: '-10%',
            x: p.endX,
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
});

