import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Droplets, Clock, Star, Activity, Heart, Bug, X, FastForward, HelpCircle, Volume2, VolumeX } from 'lucide-react';
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
  const [hintsUsed, setHintsUsed] = useState<number[]>([]);

  const HINTS: Record<number, string> = {
    1: "Divise la consommation totale (500 ml) par le nombre d'images (100) pour trouver la consommation d'une seule image.",
    2: "Cherche une combinaison de 3 vannes qui fait exactement 150 L/s. Par exemple : 50 + 75 + ... ?",
    3: "Observe les jauges de pression. Une pression normale est de 4.5 bar. La fuite se trouve là où la pression est anormalement basse.",
    4: "Lisez le code ligne par ligne. Ligne 10: si c'est mouillé, on fait 'STOP'. Ligne 17: sinon on fait 'ACTIVER'.",
    5: "Le 'Free Cooling' utilise l'air froid extérieur. Cherchez la zone où la température est la plus basse sur la carte.",
    6: "Regardez les barres d'intensité carbone. Plus la barre est courte, moins l'énergie pollue. Choisissez le créneau le plus 'vert'.",
    7: "Comparez le ratio Précision / Coût. Un modèle 100x plus gourmand pour seulement 1% de gain n'est pas sobre.",
    8: "Vérifiez les branchements. Chaque serveur doit être relié à une source d'énergie et à un circuit de refroidissement.",
    9: "L'IA peut prédire les pics de chaleur. Anticipez en augmentant le refroidissement AVANT que la température ne monte trop.",
    10: "Le recyclage de l'eau nécessite plusieurs étapes : filtration, décontamination, puis réinjection.",
    11: "Optimisez le placement des serveurs. Les plus puissants doivent être proches des arrivées d'air frais.",
    12: "La sécurité est primordiale. Vérifiez les protocoles d'accès et les pare-feu numériques.",
  };

  // Sound Utility
  const playSound = (type: 'success' | 'error' | 'click' | 'start') => {
    if (isMuted) return;
    const sounds = {
      success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
      error: 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3',
      click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      start: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.4;
    audio.play().catch(() => {}); // Ignore autoplay blocks
  };

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
        hintsUsed
      };
      localStorage.setItem('hydrosave_progress', JSON.stringify(state));
    }
  }, [level, score, waterSaved, lives, timeLeft, nickname, discoveredTerms, hintsUsed]);

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
      setHintsUsed(state.hintsUsed || []);
      setIsActive(true);
      playSound('start');
    }
  };

  const clearSave = () => {
    localStorage.removeItem('hydrosave_progress');
    setHasSavedGame(false);
  };

  useEffect(() => {
    const handleDiscovery = (e: any) => {
      const term = e.detail;
      setDiscoveredTerms(prev => prev.includes(term) ? prev : [...prev, term]);
    };
    window.addEventListener('discoverTerm', handleDiscovery);
    return () => window.removeEventListener('discoverTerm', handleDiscovery);
  }, []);

  // Developer Mode State
  const [isDevMode, setIsDevMode] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const [devError, setDevError] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0 && lives > 0) {
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
  }, [isActive, timeLeft, lives]);

  const startGame = (name: string) => {
    setNickname(name);
    setIsActive(true);
    setLevel(1);
    setScore(0);
    setWaterSaved(15);
    setLives(3);
    setTimeLeft(1800);
    setHintsUsed([]);
    setFinalEvaluation(null);
    setFinalImageUrl(null);
    playSound('start');
  };

  const nextLevel = () => {
    playSound('success');
    setLevel((l) => {
      const next = l + 1;
      if (next === 14) {
        setIsActive(false); // Stop timer on win
        // Update Leaderboard
        const newEntry = { name: nickname || 'Agent Anonyme', score };
        const updatedLeaderboard = [...leaderboard, newEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        setLeaderboard(updatedLeaderboard);
        localStorage.setItem('hydrosave_leaderboard', JSON.stringify(updatedLeaderboard));
        localStorage.removeItem('hydrosave_progress');
        setHasSavedGame(false);
      }
      return next;
    });
  };

  const handleScoreUpdate = (points: number, water: number) => {
    setScore((s) => s + points);
    setWaterSaved(water);
  };

  const handleMistake = () => {
    playSound('error');
    setLives((l) => {
      const newLives = Math.max(0, l - 1);
      if (newLives === 0) {
        setIsActive(false);
      }
      return newLives;
    });
  };

  const handleDevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (devPassword === 'dev123') {
      setIsDevMode(true);
      setShowDevModal(false);
      setDevPassword('');
      setDevError(false);
      playSound('success');
    } else {
      setDevError(true);
      playSound('error');
    }
  };

  const prevLevelDev = () => {
    setLevel((l) => Math.max(1, l - 1));
  };

  const skipLevelDev = () => {
    handleScoreUpdate(200, 50); // Give some default points
    nextLevel();
  };

  const useHint = () => {
    if (hintsUsed.includes(level)) return;
    setScore(s => Math.max(0, s - 50));
    setHintsUsed(prev => [...prev, level]);
    setShowHint(true);
    playSound('click');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-emerald-400 font-mono flex flex-col items-center justify-center p-4">
      {/* Header / HUD */}
      <header className="fixed top-0 left-0 right-0 p-3 md:p-4 border-b border-emerald-900/50 bg-slate-950/90 backdrop-blur-md z-50 flex flex-wrap justify-between items-center gap-2 md:gap-4 shadow-[0_5px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowDevModal(true); playSound('click'); }} className="focus:outline-none group">
            <Terminal className={`w-5 h-5 md:w-6 md:h-6 ${isDevMode ? 'text-purple-500' : 'text-emerald-400 group-hover:text-emerald-300'}`} />
          </button>
          <button onClick={() => setIsMuted(!isMuted)} className="focus:outline-none text-emerald-400 hover:text-emerald-300 transition-colors">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <span className="font-bold tracking-widest uppercase text-sm md:text-base bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent hidden sm:inline">
            AQUA-IA {isDevMode && <span className="text-purple-500 text-xs ml-1">[DEV]</span>}
          </span>
        </div>
        
        {level > 0 && level < 14 && (timeLeft > 0 && lives > 0) && (
          <div className="flex items-center gap-4 md:gap-8">
            {/* Lives */}
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 1 }}
                  animate={{ scale: i < lives ? 1 : 0.5, opacity: i < lives ? 1 : 0.3 }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-600'}`} />
                </motion.div>
              ))}
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${timeLeft < 300 ? 'border-red-500 text-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-emerald-500/30 text-emerald-400'}`}>
              <Clock className="w-4 h-4" />
              <span className="font-bold font-mono text-sm md:text-lg">{formatTime(timeLeft)}</span>
            </div>

            {/* Water Gauge */}
            <div className="hidden md:flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-cyan-500/30">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <div className="w-24 md:w-32 h-3 bg-slate-800 rounded-full overflow-hidden relative border border-cyan-900/50">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500"
                  initial={{ width: '15%' }}
                  animate={{ width: `${waterSaved}%` }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </div>
              <span className="font-bold font-mono text-xs text-white drop-shadow-md">{waterSaved}%</span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-1 bg-slate-900/50 px-3 py-1 rounded-full border border-yellow-500/30">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="font-bold font-mono text-yellow-400 text-sm md:text-base">{score}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {level > 0 && level < 13 && (
            <button 
              onClick={useHint}
              disabled={hintsUsed.includes(level)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold transition-all hover:scale-105 ${
                hintsUsed.includes(level) 
                  ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-yellow-900/30 border-yellow-500/30 text-yellow-500 hover:bg-yellow-800/50'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">INDICE (-50)</span>
            </button>
          )}
          {level > 0 && level < 14 && (
            <button 
              onClick={() => { setShowGlossary(true); playSound('click'); }}
              className="flex items-center gap-2 bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 text-xs font-bold transition-all hover:scale-105"
            >
              <Bug className="w-4 h-4" />
              <span className="hidden sm:inline">GLOSSAIRE</span>
            </button>
          )}
          {isDevMode && level > 0 && level < 14 && (
            <div className="flex items-center gap-1 mr-2">
              <select 
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value))}
                className="bg-purple-900/50 text-purple-400 text-xs font-bold px-2 h-8 rounded-lg border border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors cursor-pointer"
                title="Sauter vers un niveau (Dev Mode)"
              >
                {[...Array(15)].map((_, i) => (
                  <option key={i} value={i} className="bg-slate-900">
                    {i === 0 ? 'Intro' : i === 13 ? 'Bonus' : i === 14 ? 'Fin' : `Niveau ${i}`}
                  </option>
                ))}
              </select>
              <button 
                onClick={prevLevelDev}
                className="flex items-center justify-center bg-purple-900/50 hover:bg-purple-800/50 text-purple-400 w-8 h-8 rounded-full border border-purple-500/50 transition-colors"
                title="Niveau précédent (Dev Mode)"
              >
                <span className="text-lg leading-none transform -translate-y-[1px]">«</span>
              </button>
              <button 
                onClick={skipLevelDev}
                className="flex items-center gap-1 bg-purple-900/50 hover:bg-purple-800/50 text-purple-400 px-3 h-8 rounded-full border border-purple-500/50 text-xs font-bold transition-colors"
                title="Passer le niveau (Dev Mode)"
              >
                <FastForward className="w-4 h-4" />
                <span className="hidden sm:inline">SKIP</span>
              </button>
            </div>
          )}
          {level > 0 && level < 14 && (
            <div className="flex items-center gap-2 text-xs md:text-sm font-bold opacity-80 bg-slate-900/50 px-3 py-1 rounded-full border border-emerald-500/30">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">NIVEAU</span> {level}/13
            </div>
          )}
        </div>
      </header>

      {/* Hint Modal */}
      <AnimatePresence>
        {showHint && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-yellow-500/50 p-6 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(234,179,8,0.2)]"
            >
              <div className="flex items-center gap-3 text-yellow-500 mb-4">
                <HelpCircle className="w-8 h-8" />
                <h2 className="text-xl font-bold uppercase tracking-widest">Aide de NAÏA</h2>
              </div>
              <p className="text-slate-300 leading-relaxed mb-6">
                {HINTS[level] || "Analysez bien la situation, agent. La réponse est sous vos yeux."}
              </p>
              <button 
                onClick={() => { setShowHint(false); playSound('click'); }}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded-xl font-bold transition-all"
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-emerald-500/50 p-6 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-[0_0_50px_rgba(16,185,129,0.2)]"
            >
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-900 py-2 z-10 border-b border-emerald-900/50">
                <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                  <Bug className="w-6 h-6" />
                  GLOSSAIRE TECHNIQUE
                </h2>
                <button onClick={() => setShowGlossary(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid gap-4">
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
              
              <button 
                onClick={() => setShowGlossary(false)}
                className="w-full mt-8 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all"
              >
                RETOUR À LA MISSION
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Progress Bar (Top edge under header) */}
      {level > 0 && level < 14 && (
        <div className="fixed top-[60px] md:top-[72px] left-0 right-0 h-1 bg-slate-900 z-40">
          <motion.div 
            className="h-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-purple-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${(level / 13) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      )}

      {/* Dev Mode Modal */}
      <AnimatePresence>
        {showDevModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
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
      <main className="w-full max-w-4xl mt-16 md:mt-20 pb-16 relative z-10">
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
            />
          ) : level === 14 ? (
            <Outro 
              key="outro" 
              timeLeft={timeLeft} 
              score={score} 
              onRestart={startGame} 
              nickname={nickname}
              evaluation={finalEvaluation}
              imageUrl={finalImageUrl}
              leaderboard={leaderboard}
            />
          ) : null}
        </AnimatePresence>
      </main>

      {/* Decorative background elements (Ocean / Waves) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <svg className="absolute bottom-0 left-0 w-full h-[30vh] opacity-10" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <motion.path 
            fill="#10b981" 
            d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,218.7C672,213,768,171,864,165.3C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L0,320Z"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          />
        </svg>
        <svg className="absolute bottom-0 left-0 w-full h-[40vh] opacity-5" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <motion.path 
            fill="#06b6d4" 
            d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,224,576,234.7C672,245,768,245,864,224C960,203,1056,160,1152,154.7C1248,149,1344,181,1392,197.3L1440,213L1440,320L0,320Z"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          />
        </svg>
      </div>

      <div className="fixed bottom-2 left-4 z-50 text-[10px] sm:text-xs font-sans text-emerald-500/40 hover:text-emerald-400 transition-colors opacity-80 pointer-events-none">
        Développé par David Trafial
      </div>
    </div>
  );
}

