import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Droplets, Clock, Star, Activity, Heart, Bug, X, FastForward, HelpCircle, Volume2, VolumeX, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import HUD from './components/HUD';
import TransitionScreen from './components/TransitionScreen';
import { soundManager } from './utils/soundManager';
import { HINTS, FACTS } from './constants';
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
import BonusLevel from './levels/BonusLevel';
import Outro from './levels/Outro';
import GameOver from './levels/GameOver';
import TechTerm from './components/TechTerm';

export default function App() {
  const [level, setLevel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isActive, setIsActive] = useState(false);
  const [score, setScore] = useState(0);
  const [waterSaved, setWaterSaved] = useState(15);
  const [lives, setLives] = useState(3);
  const [nickname, setNickname] = useState('');
  
  // Glossary State
  const [showGlossary, setShowGlossary] = useState(false);
  const [discoveredTerms, setDiscoveredTerms] = useState<string[]>([]);

  // Persistence & Sound State
  const [isMuted, setIsMuted] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);

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

  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted]);

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
      setHasSavedGame(true);
    }
    
    const savedLeaderboard = localStorage.getItem('hydrosave_leaderboard');
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    }
  }, []);

  useEffect(() => {
    if (level > 0 && level < 14) {
      const state = {
        level,
        score,
        waterSaved,
        lives,
        timeLeft,
        nickname,
        discoveredTerms,
        unlockedFreeHints,
        unlockedPaidHints
      };
      localStorage.setItem('hydrosave_progress', JSON.stringify(state));
    }
  }, [level, score, waterSaved, lives, timeLeft, nickname, discoveredTerms, unlockedFreeHints, unlockedPaidHints]);

  useEffect(() => {
    if (level === 14) {
      setIsActive(false); // Arrête le timer
      setHasSavedGame(false);
      localStorage.removeItem('hydrosave_progress');

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
    }
  }, [level, nickname, score]);

  const loadGame = () => {
    const saved = localStorage.getItem('hydrosave_progress');
    if (saved) {
      const state = JSON.parse(saved);
      setLevel(state.level);
      setScore(state.score);
      setWaterSaved(state.waterSaved);
      setLives(state.lives);
      setTimeLeft(state.timeLeft);
      setNickname(state.nickname);
      setDiscoveredTerms(state.discoveredTerms || []);
      setUnlockedFreeHints(state.unlockedFreeHints || []);
      setUnlockedPaidHints(state.unlockedPaidHints || []);
      setIsActive(true);
      soundManager.playStart();
    }
  };

  const clearSave = () => {
    localStorage.removeItem('hydrosave_progress');
    setHasSavedGame(false);
  };

  const discoveredTermsRef = useRef<string[]>([]);
  useEffect(() => {
    // Keep ref in sync for the event listener to check without side-effects in updaters
    discoveredTermsRef.current = discoveredTerms;
  }, [discoveredTerms]);

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

      setScore(s => s + 10);
      setLevelBonusScore(prev => prev + 10);
      soundManager.playSuccess();
      window.dispatchEvent(new CustomEvent('glossaryPlusOne'));
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

  const startGame = (name: string) => {
    setNickname(name);
    setIsActive(true);
    setLevel(1);
    setScore(0);
    setWaterSaved(15);
    setLives(3);
    setTimeLeft(1800);
    setUnlockedFreeHints([]);
    setUnlockedPaidHints([]);
    setLevelBonusScore(0);
    setFinalEvaluation(null);
    setFinalImageUrl(null);
    soundManager.playStart();
  };

  const nextLevel = () => {
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

    setLevel((l) => {
      const next = l + 1;
      if (next === 14) {
        // L'enregistrement du leaderboard se fera via un useEffect plus robuste
        return next;
      }

      // Life regeneration every 3 levels
      if (next % 3 === 0) {
        setLives(prev => Math.min(3, prev + 1));
      }

      setPendingLevel(next);
      setLastTimeRemaining(timeLeft);
      // Delay transition to let confetti be seen
      setTimeout(() => {
        setIsTransitioning(true);
      }, 1500);
      return l; // Keep current level until transition finishes
    });
  };

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
    setLevelBonusScore(0);
    if (pendingLevel !== null) {
      setLevel(pendingLevel);
      setPendingLevel(null);
    }
  };

  const handleScoreUpdate = (points: number, water: number) => {
    setScore((s) => s + points);
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
    setLevel((l) => Math.max(1, l - 1));
  };

  const skipLevelDev = () => {
    handleScoreUpdate(200, 50); // Give some default points
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
    <div className="min-h-screen bg-slate-950 text-emerald-400 font-mono flex flex-col items-center justify-center p-4 overflow-hidden relative">
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
          if (score >= 200 && lives < 3) {
            setScore(s => s - 200);
            setLives(l => l + 1);
            soundManager.playSuccess();
          }
        }}
        buyTime={() => {
          if (score >= 100) {
            setScore(s => s - 100);
            setTimeLeft(t => t + 180); // Add 3 minutes
            soundManager.playSuccess();
          }
        }}
        onGoHome={() => {
          setIsActive(false);
          setLevel(0);
        }}
      />

      {/* Hint Modal */}
      <AnimatePresence>
        {showHint && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-[0_0_50px_rgba(16,185,129,0.2)]"
            >
              <div className="flex justify-between items-center sticky top-0 bg-slate-900/95 px-6 py-5 z-20 border-b border-emerald-900/50">
                <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                  <Bug className="w-6 h-6" />
                  GLOSSAIRE TECHNIQUE
                </h2>
                <button onClick={() => setShowGlossary(false)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid gap-4 p-6">
                {[
                  { term: 'IA', title: 'Intelligence Artificielle', def: 'Programmes informatiques capables de simuler des traits de l\'intelligence humaine.' },
                  { term: 'LLM', title: 'Large Language Model', def: 'Modèle de langage géant (comme GPT) capable de comprendre et générer du texte.' },
                  { term: 'Datacenter', title: 'Centre de Données', def: 'Bâtiment rempli de serveurs informatiques. Ils chauffent énormément.' },
                  { term: 'GPU', title: 'Processeur Graphique', def: 'Puce ultra-puissante utilisée pour entraîner les IA, très gourmande en énergie.' },
                  { term: 'Refroidissement', title: 'Refroidissement liquide', def: 'Utilisation d\'eau pour absorber la chaleur des serveurs. L\'eau s\'évapore ensuite.' },
                  { term: 'Cloud', title: 'Le Nuage', def: 'Ensemble des serveurs distants accessibles par Internet. Ce n\'est pas immatériel.' },
                  { term: 'Algorithme', title: 'Algorithme', def: 'Suite d\'instructions précises données à un ordinateur pour accomplir une tâche.' },
                  { term: 'Machine Learning', title: 'Apprentissage Automatique', def: 'Technique d\'IA où l\'ordinateur apprend à partir de données.' },
                  { term: 'Prompt', title: 'Prompt', def: 'Instruction ou texte envoyé à une IA pour obtenir une réponse ou une image.' },
                  { term: 'IA Générative', title: 'IA Générative', def: 'IA capable de créer du contenu original (texte, image, son) à partir de données existantes.' },
                  { term: 'Serveur', title: 'Serveur', def: 'Ordinateur puissant qui fournit des services ou des données à d\'autres ordinateurs.' },
                ].map((item) => {
                  const isDiscovered = discoveredTerms.includes(item.term) || isDevMode;
                  return (
                    <div key={item.term} className={`border p-4 rounded-xl transition-all ${
                      isDiscovered 
                        ? 'bg-slate-950/50 border-emerald-500/30' 
                        : 'bg-slate-900/20 border-slate-800 opacity-50 grayscale'
                    }`}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-bold ${isDiscovered ? 'text-emerald-400' : 'text-slate-600'}`}>
                          {isDiscovered ? item.title : '???'} ({item.term})
                        </h3>
                        {!isDiscovered && <Lock className="w-3 h-3 text-slate-700" />}
                      </div>
                      <p className={`text-sm leading-relaxed ${isDiscovered ? 'text-slate-300' : 'text-slate-700 italic'}`}>
                        {isDiscovered ? item.def : 'Découvrez ce terme dans la simulation pour débloquer sa définition.'}
                      </p>
                    </div>
                  );
                })}
              </div>
              
              <div className="p-6 pt-0">
                <button 
                  onClick={() => setShowGlossary(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-purple-500/50 rounded-xl p-6 max-w-sm w-full shadow-[0_0_30px_rgba(168,85,247,0.2)]"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <Bug className="w-5 h-5" />
                  MODE DÉVELOPPEUR
                </div>
                <button onClick={() => { setShowDevModal(false); setDevError(false); setDevPassword(''); }} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {isDevMode ? (
                <div>
                  <p className="text-slate-300 text-sm mb-6">
                    Le mode développeur est actuellement activé. Vous pouvez voir les réponses et passer les niveaux.
                  </p>
                  <button
                    onClick={() => {
                      setIsDevMode(false);
                      setShowDevModal(false);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-lg transition-colors border border-slate-600"
                  >
                    DÉSACTIVER LE MODE DEV
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDevSubmit}>
                  <input
                    type="password"
                    value={devPassword}
                    onChange={(e) => setDevPassword(e.target.value)}
                    placeholder="Mot de passe..."
                    className={`w-full bg-slate-950 border ${devError ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 mb-4`}
                    autoFocus
                  />
                  {devError && <p className="text-red-500 text-xs mb-4">Mot de passe incorrect.</p>}
                  <button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors"
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
        className="w-full mt-16 md:mt-20 pb-16 relative"
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
            <BonusLevel 
              key="bonus" 
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

      <button 
        onClick={() => setShowDevModal(true)}
        className="fixed bottom-2 left-4 z-[60] text-[10px] sm:text-xs font-sans text-emerald-500/30 hover:text-emerald-500/60 transition-all duration-500 bg-transparent border-none p-2 focus:outline-none cursor-default group"
        aria-label="Mode Développeur"
      >
        <span className="group-hover:translate-x-1 inline-block transition-transform duration-500">
          Réalisé par David Trafial
        </span>
      </button>
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

