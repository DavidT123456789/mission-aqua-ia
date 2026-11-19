import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code2, BrainCircuit, BookOpen, CheckCircle2, RotateCcw, CloudRain, Sun, Play, Loader2, XCircle, Droplets, ChevronDown } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import LevelHeader from '../components/LevelHeader';
import LevelShell from '../components/LevelShell';
import ActionButton from '../components/ActionButton';
import LevelSuccessCard from '../components/LevelSuccessCard';
import Collapsible from '../components/Collapsible';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

// --- Constantes et utilitaires extraits hors du composant pour éviter de recréer les références à chaque rendu ---
const THE_BLANKS = [
  { id: 1, ans: 'capteur', val: '' },
  { id: 2, ans: 'previsions', val: '' },
  { id: 3, ans: 'seuil', val: '' },
  { id: 4, ans: 'or', val: '' },
  { id: 5, ans: 'False', val: '' },
  { id: 6, ans: 'eau', val: '' },
  { id: 7, ans: 'True', val: '' },
  { id: 8, ans: 'aube', val: '' },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const getInitialWords = () => shuffleArray([
  'capteur', 'previsions', 'seuil', 'or', 'False', 'eau', 'True', 'aube'
]).map((word, index) => ({ id: index, word, used: false }));

const wordDescriptions: Record<string, string> = {
  'capteur': "Mesure l'humidité du sol",
  'previsions': "Météo à venir",
  'seuil': "Fixe la limite d'humidité",
  'or': "Opérateur logique 'OU'",
  'False': "Faux (Inactif)",
  'eau': "Ressource à calculer",
  'True': "Vrai (Actif)",
  'aube': "Début de journée (lever du soleil)",
};

type TestStatus = 'idle' | 'pending' | 'running' | 'pass' | 'fail' | 'skipped';

interface TestBenchState {
  case1: TestStatus;
  case2: TestStatus;
  message: string | null;
}

export default function Level11({ onComplete, onScoreUpdate, onMistake }: { onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [activeWord, setActiveWord] = useState<{ id: number, word: string } | null>(null);
  const [activeBlank, setActiveBlank] = useState<number | null>(null);
  const [draggedWord, setDraggedWord] = useState<{ id: number, word: string, fromBlankId?: number } | null>(null);
  const [dragOverBlank, setDragOverBlank] = useState<number | null>(null);
  const { errorMsg, isErrorFlash: showError, triggerError, clearError } = useErrorFeedback(2200);
  const [success, setSuccess] = useState(false);
  const [showFrenchHelp, setShowFrenchHelp] = useState(false);
  const [showAlgoGuide, setShowAlgoGuide] = useState(false);
  const [moisture, setMoisture] = useState(20);
  const [isTesting, setIsTesting] = useState(false);
  const [testBench, setTestBench] = useState<TestBenchState>({
    case1: 'idle',
    case2: 'idle',
    message: null,
  });
  const testTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Initialisation paresseuse pour éviter de mélanger l'array à chaque re-render
  const [blanks, setBlanks] = useState(THE_BLANKS);
  const [words, setWords] = useState(getInitialWords);

  const clearTestTimers = () => {
    testTimersRef.current.forEach(clearTimeout);
    testTimersRef.current = [];
  };

  useEffect(() => {
    return () => clearTestTimers();
  }, []);

  const assignWordToBlank = (wordObj: { id: number; word: string }, blankId: number) => {
    const targetBlank = blanks.find(b => b.id === blankId);
    if (!targetBlank) return;

    if (targetBlank.val !== '') {
      // Libérer l'ancien mot déjà placé dans cette case
      setWords(prev => prev.map(w => w.word === targetBlank.val ? { ...w, used: false } : w));
    }
    setBlanks(prev => prev.map(b => b.id === blankId ? { ...b, val: wordObj.word } : b));
    setWords(prev => prev.map(w => w.id === wordObj.id ? { ...w, used: true } : w));
    clearError();
    setTestBench({ case1: 'idle', case2: 'idle', message: null });
  };

  const handleBlankClick = (id: number) => {
    if (isTesting || success) return;
    const blank = blanks.find(b => b.id === id);
    if (!blank) return;

    soundManager.playClick();
    if (activeWord) {
      assignWordToBlank(activeWord, id);
      setActiveWord(null);
    } else if (blank.val !== '') {
      setWords(prev => prev.map(w => w.word === blank.val ? { ...w, used: false } : w));
      setBlanks(prev => prev.map(b => b.id === id ? { ...b, val: '' } : b));
      setActiveBlank(null);
      clearError();
      setTestBench({ case1: 'idle', case2: 'idle', message: null });
    } else {
      setActiveBlank(activeBlank === id ? null : id);
    }
  };

  const handleWordClick = (wordObj: { id: number, word: string, used: boolean }) => {
    if (wordObj.used || isTesting || success) return;

    soundManager.playClick();
    if (activeBlank) {
      assignWordToBlank(wordObj, activeBlank);
      setActiveBlank(null);
    } else {
      if (activeWord?.id === wordObj.id) {
        setActiveWord(null);
      } else {
        setActiveWord({ id: wordObj.id, word: wordObj.word });
      }
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, wordObj: { id: number; word: string; used: boolean }) => {
    if (wordObj.used || isTesting || success) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: wordObj.id, word: wordObj.word }));
    setDraggedWord({ id: wordObj.id, word: wordObj.word });
    setActiveWord(null);
    setActiveBlank(null);
  };

  const handleDragEnd = () => {
    setDraggedWord(null);
    setDragOverBlank(null);
  };

  const handleBlankDragStart = (e: React.DragEvent<HTMLButtonElement>, blankId: number, val: string) => {
    if (!val || isTesting || success) {
      e.preventDefault();
      return;
    }
    const wordEntry = words.find(w => w.word === val);
    if (!wordEntry) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: wordEntry.id, word: wordEntry.word, fromBlankId: blankId }));
    setDraggedWord({ id: wordEntry.id, word: wordEntry.word, fromBlankId: blankId });
    setActiveWord(null);
    setActiveBlank(null);
  };

  const handleDropOnBlank = (e: React.DragEvent<HTMLButtonElement>, blankId: number) => {
    e.preventDefault();
    setDragOverBlank(null);
    if (isTesting || success) return;

    let dropped = draggedWord;
    if (!dropped) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) dropped = JSON.parse(raw);
      } catch {
        dropped = null;
      }
    }
    setDraggedWord(null);
    if (!dropped) return;

    // Déplacement ou échange d'un mot déjà placé dans un autre trou
    if (dropped.fromBlankId !== undefined) {
      if (dropped.fromBlankId === blankId) return;
      const sourceBlank = blanks.find(b => b.id === dropped!.fromBlankId);
      const targetBlank = blanks.find(b => b.id === blankId);
      if (!sourceBlank || !targetBlank) return;

      soundManager.playClick();
      setBlanks(prev =>
        prev.map(b => {
          if (b.id === blankId) return { ...b, val: sourceBlank.val };
          if (b.id === dropped!.fromBlankId) return { ...b, val: targetBlank.val };
          return b;
        })
      );
      clearError();
      setTestBench({ case1: 'idle', case2: 'idle', message: null });
      return;
    }

    const bankEntry = words.find(w => w.id === dropped!.id && !w.used);
    if (!bankEntry) return;

    soundManager.playClick();
    assignWordToBlank(bankEntry, blankId);
  };

  const resetCode = () => {
    clearTestTimers();
    setIsTesting(false);
    setBlanks(THE_BLANKS);
    setWords(getInitialWords());
    setActiveWord(null);
    setActiveBlank(null);
    setDraggedWord(null);
    setDragOverBlank(null);
    clearError();
    setTestBench({ case1: 'idle', case2: 'idle', message: null });
    setMoisture(20);
  };

  const [hasScored, setHasScored] = useState(false);

  const checkAnswers = () => {
    if (isTesting || success) return;
    clearTestTimers();

    const case1Matches = blanks.slice(0, 5).filter(b => b.val === b.ans).length;
    const case2Matches = blanks.slice(5, 8).filter(b => b.val === b.ans).length;
    const isCase1Correct = case1Matches === 5;
    const isCase2Correct = case2Matches === 3;

    setIsTesting(true);
    clearError();
    setActiveWord(null);
    setActiveBlank(null);
    setMoisture(45);
    setTestBench({
      case1: 'running',
      case2: 'pending',
      message: 'Simulation Cas 1 : Pluie annoncée (humidité 45 %)...',
    });

    const t1 = setTimeout(() => {
      if (!isCase1Correct) {
        const msg = `Échec Cas 1 (${case1Matches}/5 trous justes dans la lecture et le bloc if) : avec de la pluie annoncée, la pompe doit rester coupée (vérifiez la condition if et arrosage = False).`;
        setIsTesting(false);
        setShowFrenchHelp(true);
        triggerError(msg);
        setTestBench({
          case1: 'fail',
          case2: 'skipped',
          message: msg,
        });
        onMistake?.();
        const tErr = setTimeout(() => {
          setMoisture(20);
        }, 2200);
        testTimersRef.current.push(tErr);
        return;
      }

      // Cas 1 validé -> passage au Cas 2 (Sol sec 18 % + Soleil)
      setMoisture(18);
      setTestBench({
        case1: 'pass',
        case2: 'running',
        message: 'Cas 1 validé (0 L gaspillé). Simulation Cas 2 : Sol sec 18 % + Soleil...',
      });

      const t2 = setTimeout(() => {
        setIsTesting(false);
        if (!isCase2Correct) {
          const msg = `Échec Cas 2 (${case2Matches}/3 trous justes dans le bloc else) : sur sol sec sans pluie, il faut calculer le besoin en eau, activer arrosage = True et arroser à l'aube.`;
          setMoisture(10);
          setShowFrenchHelp(true);
          triggerError(msg);
          setTestBench({
            case1: 'pass',
            case2: 'fail',
            message: msg,
          });
          onMistake?.();
          const tErr2 = setTimeout(() => {
            setMoisture(20);
          }, 2200);
          testTimersRef.current.push(tErr2);
          return;
        }

        setMoisture(65);
        setTestBench({
          case1: 'pass',
          case2: 'pass',
          message: 'Tous les tests météo sont validés !',
        });
        setSuccess(true);
        soundManager.playSuccess();
        if (onScoreUpdate && !hasScored) {
          setHasScored(true);
          onScoreUpdate(250, 88);
        }
      }, 800);

      testTimersRef.current.push(t2);
    }, 700);

    testTimersRef.current.push(t1);
  };

  const allFilled = blanks.every(b => b.val !== '');

  const renderBlankSlot = (id: number) => {
    const blank = blanks.find(b => b.id === id);
    const isFilled = blank?.val !== '';
    const isTargeted = activeBlank === id;
    const isDragTarget = dragOverBlank === id;
    const isReadyToReceive = (activeWord !== null && !isFilled) || isTargeted || isDragTarget;

    return (
      <button
        key={`slot-${id}`}
        type="button"
        disabled={isTesting || success}
        draggable={Boolean(isFilled && !isTesting && !success)}
        onDragStart={(e) => handleBlankDragStart(e, id, blank?.val || '')}
        onDragEnd={handleDragEnd}
        onClick={() => handleBlankClick(id)}
        onDragOver={(e) => {
          if (isTesting || success) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (dragOverBlank !== id) setDragOverBlank(id);
        }}
        onDragLeave={() => {
          if (dragOverBlank === id) setDragOverBlank(null);
        }}
        onDrop={(e) => handleDropOnBlank(e, id)}
        className={`inline-flex items-center justify-center min-w-[80px] h-7 px-2 mx-1 rounded transition-all focus:outline-none ${
          isDragTarget
            ? 'bg-cyan-900/50 border-2 border-cyan-400 scale-105 z-10'
            : isTargeted
            ? 'bg-emerald-900/50 border-2 border-emerald-400 z-10'
            : isFilled
            ? 'bg-cyan-900/30 border border-cyan-500/50 text-cyan-300 cursor-grab active:cursor-grabbing hover:bg-cyan-900/50'
            : isReadyToReceive
            ? 'bg-emerald-900/20 border-2 border-dashed border-emerald-500/50'
            : 'bg-slate-800/50 border border-dashed border-slate-500 hover:border-emerald-500/50 hover:bg-slate-800 cursor-pointer'
        } ${showError && !isFilled ? 'border-red-500 bg-red-900/20' : ''}`}
      >
        <AnimatePresence mode="popLayout">
          {isFilled ? (
            <motion.span
              key={blank.val}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {blank.val}
            </motion.span>
          ) : (
            <span key={`empty-${id}`} className="opacity-0">...</span>
          )}
        </AnimatePresence>
      </button>
    );
  };

  return (
    <LevelShell>
      
      <LevelHeader level={11} icon={Code2} />

      <div className="mb-3">
        <NaiaDialogue
          hydra={{
            status: 'warning',
            label: 'HYDRA // CONTRÔLE CHARTE',
            message: "Module externe AQUA-FARM détecté. Conformément à la Charte municipale, vérification manuelle du code requise avant déploiement.",
          }}
          message={
            success ? (
              <>
                Audit validé ! Le script <code className="font-mono text-emerald-300 bg-slate-900 px-1.5 py-0.5 rounded">aqua_farm.py</code> passe les tests météo et est désormais actif en mode Symbiose.
              </>
            ) : (
              <>
                HYDRA est désormais sobre et encadrée par notre Charte : passons à l'offensive pour économiser l'eau ailleurs ! L'agriculture consomme <strong className="text-white">70 % de l'eau douce mondiale</strong>, mais la Charte impose de vérifier le code source de <code className="font-mono text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded">aqua_farm.py</code> avant son déploiement.
              </>
            )
          }
          objective={success ? undefined : "Complétez les 8 trous du code Python par glisser-déposer ou clic puis lancez la simulation."}
          reaction={errorMsg ? { message: errorMsg, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={success ? 'happy' : 'neutral'}
        />
      </div>

      <div className="space-y-3.5 text-slate-300">

        {/* Collapsible Algorithm Guide (collapsed by default to keep editor + word bank above the fold) */}
        <div className="bg-slate-950/50 border border-cyan-500/20 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAlgoGuide((v) => !v)}
            aria-expanded={showAlgoGuide}
            className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-slate-900/50 transition-colors cursor-pointer"
          >
            <div className="text-cyan-400 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Fonctionnement de l'<TechTerm term="Algorithme">algorithme</TechTerm> (3 étapes)</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-250 ease-out ${showAlgoGuide ? 'rotate-180' : ''}`} />
          </button>
          <Collapsible isOpen={showAlgoGuide}>
            <ul className="px-4 pb-4 space-y-2 text-xs sm:text-sm border-t border-white/[0.06] pt-3">
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 text-xs font-bold shrink-0">1</span>
                <span>L'<TechTerm term="IA" /> récupère deux informations sur la parcelle : l'humidité actuelle du sol et le bulletin météorologique à venir.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 text-xs font-bold shrink-0">2</span>
                <span>Elle vérifie deux conditions : si la terre dépasse déjà la limite tolérée par la plante, ou si la pluie est annoncée, l'irrigation reste coupée.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 text-xs font-bold shrink-0">3</span>
                <span>Uniquement si nécessaire, le système évalue la quantité à apporter et déclenche l'arrosage tôt le matin pour éviter l'évaporation et les maladies.</span>
              </li>
            </ul>
          </Collapsible>
        </div>

        {/* Word Bank (placed directly above the editor so tokens & slots stay visible together) */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
            <AnimatePresence>
              {words.map((w, i) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={`${w.word}-${i}`} 
                  className="group/word relative flex items-center justify-center"
                >
                  <div
                    draggable={!w.used && !success && !isTesting}
                    onDragStart={(e) => handleDragStart(e, w)}
                    onDragEnd={handleDragEnd}
                    className={!w.used && !success && !isTesting ? 'cursor-grab active:cursor-grabbing' : ''}
                  >
                    <motion.button
                      type="button"
                      animate={{ 
                        scale: w.used ? 0.9 : activeWord?.id === w.id ? 1.05 : 1, 
                        opacity: w.used ? 0.35 : 1 
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={() => handleWordClick(w)}
                      disabled={w.used || success || isTesting}
                      className={`px-3.5 py-1.5 rounded-full font-mono text-xs sm:text-sm transition-all focus:outline-none ${
                        w.used 
                          ? 'bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed' 
                          : activeWord?.id === w.id
                          ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-400 z-10'
                          : activeBlank
                          ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/50 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer'
                          : 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 hover:shadow-[0_0_12px_rgba(6,182,212,0.25)] cursor-grab active:cursor-grabbing'
                      }`}
                    >
                      {w.word}
                    </motion.button>
                  </div>
                  {!w.used && (
                    <div className="hidden md:block absolute bottom-full mb-2 w-48 px-3 py-2 bg-slate-900 text-slate-200 text-xs leading-relaxed rounded-lg border border-slate-700 opacity-0 group-hover/word:opacity-100 transition-opacity pointer-events-none z-50 text-center font-sans shadow-xl not-italic font-normal tracking-normal">
                      {wordDescriptions[w.word]}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-700"></div>
                      <div className="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="text-center text-xs text-slate-400 font-sans pt-2 border-t border-slate-800/80 min-h-[24px] flex items-center justify-center">
            {activeWord ? (
              <span>
                <strong className="text-emerald-400 font-mono">{activeWord.word}</strong> : {wordDescriptions[activeWord.word]}
              </span>
            ) : (
              <span>Glissez ou touchez une étiquette puis cliquez sur un emplacement du code.</span>
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div className="bg-[#080c14] border border-slate-800 rounded-xl font-mono text-sm md:text-base">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#0a1020] border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-slate-400 text-xs">aqua_farm.py</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <div className="text-[11px] font-sans text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span><strong className="font-mono text-pink-400">if</strong> = Si</span>
                <span><strong className="font-mono text-pink-400">else</strong> = Sinon</span>
                <span><strong className="font-mono text-orange-300">plante.x</strong> = propriété de la plante</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setShowFrenchHelp((v) => !v);
                }}
                aria-pressed={showFrenchHelp}
                className={`inline-flex items-center gap-1.5 text-xs font-sans font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  showFrenchHelp
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    : 'bg-amber-950/40 border-amber-400/60 text-amber-200 hover:bg-amber-950/70 hover:border-amber-300'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>{showFrenchHelp ? 'Aide Scratch → Python active' : 'Activer aide Scratch → Python'}</span>
              </button>
            </div>
          </div>
          
          <div className="p-3 sm:p-6 overflow-x-auto pt-6 sm:pt-10">
            <div className="text-xs sm:text-sm md:text-base">
              <div className="text-slate-400 italic mb-2"># Programme AQUA-FARM</div>
              <div className="mb-2">
                <span className="text-pink-500 font-bold">def</span> <span className="text-emerald-400">decider_arrosage</span>(<span className="text-orange-300">plante</span>):
                {showFrenchHelp && <span className="ml-2 text-[11px] font-sans text-cyan-300/80 italic">← définir le bloc « décider_arrosage »</span>}
              </div>
              
              <div className="pl-6 mb-2 text-slate-400 italic"># Étape 1 : Lire les données</div>
              <div className="pl-6 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="text-blue-300 mr-2">humidite</span> = lire_
                {renderBlankSlot(1)}
                (<span className="text-yellow-300">"humidité"</span>)
              </div>
              <div className="pl-6 mb-4 flex items-center flex-wrap gap-y-2">
                <span className="text-blue-300 mr-2">meteo</span> = lire_
                {renderBlankSlot(2)}
                (<span className="text-yellow-300">"pluie_demain"</span>)
              </div>

              <div className="pl-6 mb-2 text-slate-400 italic"># Étape 2 : Décider</div>
              <div className="pl-6 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="text-pink-500 font-bold mr-2">if</span> <span className="text-blue-300 mr-2">humidite</span> {'>'} <span className="text-orange-300">plante</span>.
                {renderBlankSlot(3)} {renderBlankSlot(4)} <span className="text-blue-300 mx-2">meteo</span> == <span className="text-yellow-300">"pluie"</span>: <span className="text-slate-400 italic ml-2"># Pas besoin d'eau</span>
                {showFrenchHelp && <span className="ml-2 text-[11px] font-sans text-cyan-300/80 italic">(Si humidité &gt; limite … météo est « pluie »)</span>}
              </div>
              <div className="pl-12 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">arrosage =</span> {renderBlankSlot(5)}
              </div>
              <div className="pl-12 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">besoin = 0</span>
              </div>
              <div className="pl-12 mb-2 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">heure =</span> <span className="text-yellow-300">None</span>
                {showFrenchHelp && <span className="ml-2 text-[11px] font-sans text-cyan-300/80 italic">← aucune heure (arrosage coupé)</span>}
              </div>

              <div className="pl-6 mb-1">
                <span className="text-pink-500 font-bold">else</span>: <span className="text-slate-400 italic"># Sol sec + pas de pluie</span>
                {showFrenchHelp && <span className="ml-2 text-[11px] font-sans text-cyan-300/80 italic">(Sinon)</span>}
              </div>
              <div className="pl-12 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">besoin = calcul_</span>{renderBlankSlot(6)}(<span className="text-orange-300">plante</span>)
              </div>
              <div className="pl-12 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">arrosage =</span> {renderBlankSlot(7)}
              </div>
              <div className="pl-12 mb-4 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">heure =</span> <span className="text-yellow-300">"</span>{renderBlankSlot(8)}<span className="text-yellow-300">"</span> <span className="text-slate-400 italic ml-2"># Évite les maladies !</span>
              </div>
              
              <div className="pl-6 mb-2 flex items-center flex-wrap gap-y-2">
                <span className="text-pink-500 font-bold mr-2">return</span> {'{'} <span className="text-yellow-300">"arrosage"</span>: arrosage, <span className="text-yellow-300">"besoin"</span>: besoin, <span className="text-yellow-300">"heure"</span>: heure {'}'}
                {showFrenchHelp && <span className="ml-2 text-[11px] font-sans text-cyan-300/80 italic">← renvoyer la décision finale</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Animated Weather Test Bench + Live Soil Moisture Gauge */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Play className="w-3.5 h-3.5" /> Banc de test météo (Exécution pas à pas)
            </span>
            <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5">
              <Droplets className={`w-3.5 h-3.5 shrink-0 ${moisture < 30 ? 'text-red-400' : 'text-emerald-400'}`} />
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-sans">Humidité sol</span>
              <div className="w-24 sm:w-28 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${moisture < 30 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  animate={{ width: `${moisture}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className={`font-mono font-bold tabular-nums text-xs min-w-[34px] text-right ${moisture < 30 ? 'text-red-300' : 'text-emerald-300'}`}>
                {moisture} %
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: 'Cas 1 : Pluie annoncée (45 %)',
                expect: 'Attendu : arrosage = False (0 L)',
                status: testBench.case1,
                icon: CloudRain,
              },
              {
                title: 'Cas 2 : Sol sec (18 %) + Soleil',
                expect: 'Attendu : arrosage = True à l\'aube',
                status: testBench.case2,
                icon: Sun,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              const statusStyle =
                item.status === 'pass'
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                  : item.status === 'fail'
                  ? 'bg-red-950/40 border-red-500/60 text-red-300'
                  : item.status === 'running'
                  ? 'bg-amber-950/30 border-amber-400/60 text-amber-200'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400';
              return (
                <div key={idx} className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${statusStyle}`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-5 h-5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{item.title}</div>
                      <div className="text-[11px] opacity-80 font-sans truncate">{item.expect}</div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {item.status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-amber-400" />}
                    {item.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {item.status === 'fail' && <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                </div>
              );
            })}
          </div>

          {testBench.message && testBench.case1 !== 'fail' && testBench.case2 !== 'fail' && (
            <div className={`text-xs font-sans font-semibold px-3 py-2 rounded-lg border ${
              testBench.case1 === 'pass' && testBench.case2 === 'pass'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}>
              {testBench.message}
            </div>
          )}
        </div>

        {!success && (
          <div className="flex justify-center gap-3 mt-6">
            <ActionButton
              variant="secondary"
              size="md"
              onClick={resetCode}
              disabled={isTesting}
            >
              <RotateCcw className="w-4 h-4" /> RESET
            </ActionButton>
            <ActionButton
              onClick={checkAnswers}
              disabled={!allFilled || success || isTesting}
              isError={showError}
              size="md"
            >
              {isTesting ? 'EXÉCUTION DES TESTS...' : showError ? 'ERREUR LOGIQUE' : 'TESTER LE CODE'}
            </ActionButton>
          </div>
        )}

        <AnimatePresence>
          {success && (
            <LevelSuccessCard
              title="ALGORITHME DÉPLOYÉ"
              description="L'irrigation intelligente est active. Économie estimée : 30 à 50 % d'eau !"
              extra={
                <div className="bg-emerald-900/30 border border-emerald-500/20 p-3 rounded-lg text-xs sm:text-sm text-left text-emerald-100 mb-5 max-w-xl flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>À retenir :</strong> L'opérateur <strong>OR</strong> permet de combiner plusieurs conditions. Arroser à l'<strong>aube</strong> empêche la stagnation d'eau sur les feuilles !
                  </span>
                </div>
              }
              onContinue={onComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </LevelShell>
  );

}
