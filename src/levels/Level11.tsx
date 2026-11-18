import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, CheckCircle2, RotateCcw, CloudRain, Sun, Play, Loader2, XCircle } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import HydraLog from '../components/HydraLog';
import TechTerm from '../components/TechTerm';
import { soundManager } from '../utils/soundManager';

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

export default function Level11({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [activeWord, setActiveWord] = useState<{ id: number, word: string } | null>(null);
  const [activeBlank, setActiveBlank] = useState<number | null>(null);
  const [draggedWord, setDraggedWord] = useState<{ id: number, word: string, fromBlankId?: number } | null>(null);
  const [dragOverBlank, setDragOverBlank] = useState<number | null>(null);
  const [showError, setShowError] = useState(false);
  const [success, setSuccess] = useState(false);
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
    setShowError(false);
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
      setShowError(false);
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
      setShowError(false);
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
    setShowError(false);
    setTestBench({ case1: 'idle', case2: 'idle', message: null });
    setMoisture(20);
  };

  const [hasScored, setHasScored] = useState(false);

  const checkAnswers = () => {
    if (isTesting || success) return;
    clearTestTimers();

    const isCase1Correct = blanks.slice(0, 5).every(b => b.val === b.ans);
    const isCase2Correct = blanks.slice(5, 8).every(b => b.val === b.ans);

    setIsTesting(true);
    setShowError(false);
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
        setIsTesting(false);
        setShowError(true);
        setTestBench({
          case1: 'fail',
          case2: 'skipped',
          message: 'Échec Cas 1 : avec de la pluie annoncée, la pompe doit rester coupée (vérifiez la condition if et arrosage = False).',
        });
        onMistake?.();
        const tErr = setTimeout(() => {
          setShowError(false);
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
          setMoisture(10);
          setShowError(true);
          setTestBench({
            case1: 'pass',
            case2: 'fail',
            message: 'Échec Cas 2 : sur sol sec sans pluie, il faut calculer le besoin en eau, activer arrosage = True et arroser à l\'aube.',
          });
          onMistake?.();
          const tErr2 = setTimeout(() => {
            setShowError(false);
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
      }, 1050);

      testTimersRef.current.push(t2);
    }, 950);

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
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-2xl max-w-4xl mx-auto relative flex flex-col backdrop-blur-xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)]"
    >
      
      <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
        <Cpu className="w-7 h-7 text-emerald-400 shrink-0" />
        <h2 className="font-mono text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 11 : L'Algorithme d'Arrosage
        </h2>
      </div>

      <div className="mb-3 space-y-2">
        <HydraLog status="hostile" label="HYDRA // PARE-FEU" message="Déploiement automatique rejeté. Pare-feu actif : interfaces graphiques verrouillées." />
        <NaiaDialogue
          message={
            success ? (
              <>
                Bravo Agent ! Le script <code className="font-mono text-emerald-300 bg-slate-900 px-1.5 py-0.5 rounded">aqua_farm.py</code> a passé les tests météo et est déployé malgré le pare-feu d'HYDRA.
              </>
            ) : (
              <>
                Le pare-feu d'HYDRA bloque nos raccourcis visuels ! L'agriculture consomme <strong className="text-white">70 % de l'eau douce mondiale</strong> : vous devez compléter directement le script Python <code className="font-mono text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded">aqua_farm.py</code> pour forcer l'intégration du module d'irrigation intelligente.
              </>
            )
          }
          objective={success ? undefined : "Complétez les 8 trous du code Python par glisser-déposer ou clic puis lancez la simulation."}
          emotion={success ? 'happy' : 'alert'}
        />
      </div>

      <div className="space-y-4 text-slate-300">

        <div className="bg-slate-950/50 border border-cyan-500/20 p-5 rounded-xl mb-6 shadow-[0_0_15px_rgba(6,182,212,0.1)] flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h3 className="text-cyan-400 font-bold uppercase mb-3 flex items-center gap-2">
              <span className="bg-cyan-900/50 p-1 rounded">🧠</span> Comment fonctionne l'algorithme ?
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 shrink-0">1</span>
                <span>L'<TechTerm term="IA" /> récupère deux informations sur la parcelle : l'humidité actuelle du sol et le bulletin météorologique à venir.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 shrink-0">2</span>
                <span>Elle vérifie deux conditions : si la terre dépasse déjà la limite tolérée par la plante, ou si la pluie est annoncée, l'irrigation reste coupée.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 shrink-0">3</span>
                <span>Uniquement si nécessaire, le système évalue la quantité à apporter et déclenche l'arrosage tôt le matin pour éviter l'évaporation et les maladies.</span>
              </li>
            </ul>
          </div>
          
          <div className="w-full md:w-48 flex flex-col items-center justify-center bg-slate-900/50 rounded-lg p-4 border border-slate-800">
            <span className="text-xs text-slate-400 uppercase mb-2">Humidité du sol</span>
            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden mb-2">
              <motion.div 
                className={`h-full ${moisture < 30 ? 'bg-red-500' : 'bg-emerald-500'}`}
                animate={{ width: `${moisture}%` }}
              />
            </div>
            <span className="font-bold text-xl text-white">{moisture}%</span>
          </div>
        </div>

        {/* Code Editor */}
        <div className="bg-[#080c14] border border-slate-800 rounded-xl font-mono text-sm md:text-base">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#0a1020] border-b border-slate-800">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-2 text-slate-500 text-xs">aqua_farm.py</span>
          </div>
          
          <div className="p-3 sm:p-6 overflow-x-auto pt-6 sm:pt-10">
            <div className="text-xs sm:text-sm md:text-base">
              <div className="text-slate-500 italic mb-2"># 🌱 Programme AQUA-FARM</div>
              <div className="mb-2"><span className="text-pink-500 font-bold">def</span> <span className="text-emerald-400">decider_arrosage</span>(<span className="text-orange-300">plante</span>):</div>
              
              <div className="pl-6 mb-2 text-slate-500 italic"># Étape 1 : Lire les données</div>
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

              <div className="pl-6 mb-2 text-slate-500 italic"># Étape 2 : Décider</div>
              <div className="pl-6 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="text-pink-500 font-bold mr-2">if</span> <span className="text-blue-300 mr-2">humidite</span> {'>'} <span className="text-orange-300">plante</span>.
                {renderBlankSlot(3)} {renderBlankSlot(4)} <span className="text-blue-300 mx-2">meteo</span> == <span className="text-yellow-300">"pluie"</span>: <span className="text-slate-500 italic ml-2"># Pas besoin d'eau</span>
              </div>
              <div className="pl-12 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">arrosage =</span> {renderBlankSlot(5)}
              </div>
              <div className="pl-12 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">besoin = 0</span>
              </div>
              <div className="pl-12 mb-2 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">heure =</span> <span className="text-yellow-300">None</span>
              </div>

              <div className="pl-6 mb-1">
                <span className="text-pink-500 font-bold">else</span>: <span className="text-slate-500 italic"># Sol sec + pas de pluie</span>
              </div>
              <div className="pl-12 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">besoin = calcul_</span>{renderBlankSlot(6)}(<span className="text-orange-300">plante</span>)
              </div>
              <div className="pl-12 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">arrosage =</span> {renderBlankSlot(7)}
              </div>
              <div className="pl-12 mb-4 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">heure =</span> <span className="text-yellow-300">"</span>{renderBlankSlot(8)}<span className="text-yellow-300">"</span> <span className="text-slate-500 italic ml-2"># Évite les maladies !</span>
              </div>
              
              <div className="pl-6 mb-2 flex items-center flex-wrap gap-y-2">
                <span className="text-pink-500 font-bold mr-2">return</span> {'{'} <span className="text-yellow-300">"arrosage"</span>: arrosage, <span className="text-yellow-300">"besoin"</span>: besoin, <span className="text-yellow-300">"heure"</span>: heure {'}'}
              </div>
            </div>
          </div>
        </div>

        {/* Word Bank */}
        <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
          <div className="flex flex-wrap justify-center gap-3">
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
                      className={`px-4 py-2 rounded-full font-mono text-sm transition-all focus:outline-none ${
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

          {/* Mobile-friendly hint bar for the selected word */}
          <div className="text-center text-xs text-slate-400 font-sans pt-2 border-t border-slate-800/80 min-h-[28px] flex items-center justify-center">
            {activeWord ? (
              <span>
                <strong className="text-emerald-400 font-mono">{activeWord.word}</strong> : {wordDescriptions[activeWord.word]}
              </span>
            ) : (
              <span className="text-slate-500">Glissez ou touchez une étiquette pour voir son rôle et la placer dans le code.</span>
            )}
          </div>
        </div>

        {/* Animated Weather Test Bench */}
        <AnimatePresence>
          {testBench.case1 !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Play className="w-3.5 h-3.5" /> Banc de test météo (Exécution pas à pas)
                </span>
                {isTesting && (
                  <span className="text-[11px] text-amber-400 flex items-center gap-1.5 font-sans">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Exécution...
                  </span>
                )}
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
                      : 'bg-slate-900/50 border-slate-800 text-slate-500';
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

              {testBench.message && (
                <div className={`text-xs font-sans font-semibold px-3 py-2 rounded-lg border ${
                  testBench.case1 === 'fail' || testBench.case2 === 'fail'
                    ? 'bg-red-950/40 border-red-500/40 text-red-300'
                    : testBench.case1 === 'pass' && testBench.case2 === 'pass'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  {testBench.message}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!success && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={resetCode}
              disabled={isTesting}
              className={`px-4 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                isTesting
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <RotateCcw className="w-4 h-4" /> RESET
            </button>
            <button
              onClick={checkAnswers}
              disabled={!allFilled || success || isTesting}
              className={`px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                !allFilled || isTesting
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : showError
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]'
              }`}
            >
              {isTesting ? 'EXÉCUTION DES TESTS...' : showError ? 'ERREUR LOGIQUE' : 'TESTER LE CODE'}
            </button>
          </div>
        )}

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center mt-5 p-6 bg-emerald-950/30 border border-emerald-500/50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl mb-3">
                <CheckCircle2 className="w-7 h-7" />
                ALGORITHME DÉPLOYÉ
              </div>
              <p className="text-emerald-200 mb-4 text-center text-sm">L'irrigation intelligente est active. Économie estimée : 30 à 50% d'eau !</p>
              <div className="bg-emerald-900/30 border border-emerald-500/20 p-3 rounded text-xs sm:text-sm text-left text-emerald-100 mb-6 max-w-xl">
                <strong>📚 À retenir :</strong> L'opérateur <strong>OR</strong> permet de combiner plusieurs conditions. Arroser à l'<strong>aube</strong> empêche la stagnation d'eau sur les feuilles !
              </div>
              <button
                onClick={onComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-all hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]"
              >
                PASSER AU NIVEAU SUIVANT
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

}
