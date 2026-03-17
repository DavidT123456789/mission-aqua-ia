import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, CheckCircle2, RotateCcw } from 'lucide-react';
import Hint from '../components/Hint';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';

export default function Level4({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [activeBlank, setActiveBlank] = useState<number | null>(null);
  const [showError, setShowError] = useState(false);
  const [success, setSuccess] = useState(false);

  const initialBlanks = [
    { id: 1, ans: 'capteur', val: '' },
    { id: 2, ans: 'prévisions', val: '' },
    { id: 3, ans: 'STOP', val: '' },
    { id: 4, ans: 'pluie', val: '' },
    { id: 5, ans: 'STOP', val: '' },
    { id: 6, ans: 'eau', val: '' },
    { id: 7, ans: 'ACTIVER', val: '' },
    { id: 8, ans: 'nuit', val: '' },
  ];

  // Shuffle function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const initialWords = shuffleArray([
    'capteur', 'prévisions', 'STOP', 'pluie', 'STOP', 'eau', 'ACTIVER', 'nuit'
  ]).map((word, index) => ({ id: index, word, used: false }));

  const [blanks, setBlanks] = useState(initialBlanks);
  const [words, setWords] = useState(initialWords);

  const handleBlankClick = (id: number) => {
    setActiveBlank(id);
  };

  const handleWordClick = (wordObj: { id: number, word: string, used: boolean }) => {
    if (!activeBlank || wordObj.used) return;

    setBlanks(prev => prev.map(b => {
      if (b.id === activeBlank) {
        // If blank already had a value, free up that word
        if (b.val !== '') {
          setWords(wPrev => wPrev.map(w => w.word === b.val && w.used ? { ...w, used: false } : w));
        }
        return { ...b, val: wordObj.word };
      }
      return b;
    }));

    setWords(prev => prev.map(w => w.id === wordObj.id ? { ...w, used: true } : w));
    setActiveBlank(null);
    setShowError(false);
  };

  const resetCode = () => {
    setBlanks(initialBlanks);
    setWords(initialWords);
    setActiveBlank(null);
    setShowError(false);
  };

  const [hasScored, setHasScored] = useState(false);

  const checkAnswers = () => {
    const isCorrect = blanks.every(b => b.val === b.ans);
    
    if (isCorrect) {
      setSuccess(true);
      if (onScoreUpdate && !hasScored) {
        setHasScored(true);
        onScoreUpdate(250, 65);
      }
      setTimeout(() => {
        onComplete();
      }, 4000);
    } else {
      setShowError(true);
      onMistake?.();
      setTimeout(() => setShowError(false), 2000);
    }
  };

  const allFilled = blanks.every(b => b.val !== '');

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="bg-slate-900 border border-emerald-500/30 p-6 md:p-8 rounded-xl shadow-2xl max-w-4xl mx-auto font-mono relative"
    >
      {isDevMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50">
          Dev Answer: 1:capteur, 2:prévisions, 3:STOP, 4:pluie, 5:STOP, 6:eau, 7:ACTIVER, 8:nuit
        </div>
      )}
      <div className="flex items-center gap-3 mb-6 border-b border-emerald-900/50 pb-4">
        <Cpu className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 4 : L'Algorithme d'Arrosage
        </h2>
      </div>

      <div className="space-y-6 text-slate-300">
        <NaiaDialogue message={
          <>
            L'agriculture consomme <strong>70% de l'eau douce mondiale</strong>. Je peux réduire ça de moitié grâce à un arrosage intelligent... mais mon algorithme est <strong>incomplet</strong> ! Aidez-moi à le réparer.
          </>
        } />

        <div className="bg-slate-950/50 border border-cyan-500/20 p-5 rounded-xl mb-6">
          <h3 className="text-cyan-400 font-bold uppercase mb-3 flex items-center gap-2">
            <span className="bg-cyan-900/50 p-1 rounded">🧠</span> Comment fonctionne l'algorithme ?
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 shrink-0">1</span>
              <span>L'<TechTerm term="IA" /> reçoit des informations grâce à des <strong>capteurs</strong> dans le sol et aux <strong>prévisions</strong> météo.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 shrink-0">2</span>
              <span>Elle analyse : <em>« SI le sol est humide → pas besoin d'arroser. SI il va pleuvoir → la nature s'en charge. »</em></span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 shrink-0">3</span>
              <span>Seulement quand c'est nécessaire, l'<TechTerm term="IA" /> active l'arrosage, de préférence la <strong>nuit</strong> (moins d'évaporation).</span>
            </li>
          </ul>
        </div>

        <div className="text-center mb-4 p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg text-sm">
          👆 <strong>Mission :</strong> Complétez le code ci-dessous. Cliquez sur un espace vide <span className="inline-block w-8 h-4 border border-dashed border-emerald-500 mx-1"></span> puis choisissez le bon mot.
        </div>

        {/* Code Editor */}
        <div className="bg-[#080c14] border border-slate-800 rounded-xl shadow-inner font-mono text-sm md:text-base">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#0a1020] border-b border-slate-800">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-2 text-slate-500 text-xs">aqua_farm.py</span>
          </div>
          
          <div className="p-4 md:p-6 overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="text-slate-500 italic mb-2"># 🌱 Programme AQUA-FARM</div>
              <div className="mb-2"><span className="text-pink-500 font-bold">def</span> <span className="text-emerald-400">decider_arrosage</span>():</div>
              
              <div className="pl-6 mb-2 text-slate-500 italic"># Étape 1 : Lire les données</div>
              <div className="pl-6 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="text-blue-300 mr-2">humidite</span> = lire_
                <BlankSlot id={1} />
                (<span className="text-yellow-300">"humidité"</span>)
              </div>
              <div className="pl-6 mb-4 flex items-center flex-wrap gap-y-2">
                <span className="text-blue-300 mr-2">meteo</span> = lire_
                <BlankSlot id={2} />
                (<span className="text-yellow-300">"pluie_demain"</span>)
              </div>

              <div className="pl-6 mb-2 text-slate-500 italic"># Étape 2 : Décider</div>
              <div className="pl-6 mb-1">
                <span className="text-pink-500 font-bold">if</span> <span className="text-blue-300">humidite</span> {'>'} <span className="text-purple-400">60%</span>: <span className="text-slate-500 italic"># Sol encore mouillé ?</span>
              </div>
              <div className="pl-12 mb-2 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">arrosage =</span> <BlankSlot id={3} />
              </div>

              <div className="pl-6 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="text-pink-500 font-bold mr-2">elif</span> <span className="text-blue-300 mr-2">meteo</span> == <span className="text-yellow-300">"</span><BlankSlot id={4} /><span className="text-yellow-300">"</span>: <span className="text-slate-500 italic ml-2"># Pluie prévue ?</span>
              </div>
              <div className="pl-12 mb-2 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">arrosage =</span> <BlankSlot id={5} />
              </div>

              <div className="pl-6 mb-1">
                <span className="text-pink-500 font-bold">else</span>: <span className="text-slate-500 italic"># Sol sec + pas de pluie</span>
              </div>
              <div className="pl-12 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">besoin = calcul_</span><BlankSlot id={6} />(plante)
              </div>
              <div className="pl-12 mb-1 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">arrosage =</span> <BlankSlot id={7} />
              </div>
              <div className="pl-12 mb-2 flex items-center flex-wrap gap-y-2">
                <span className="mr-2">heure =</span> <span className="text-yellow-300">"</span><BlankSlot id={8} /><span className="text-yellow-300">"</span> <span className="text-slate-500 italic ml-2"># Moins d'évaporation !</span>
              </div>
            </div>
          </div>
        </div>

        {/* Word Bank */}
        <div className="flex flex-wrap justify-center gap-3 p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
          {words.map((w, i) => (
            <button
              key={`${w.word}-${i}`}
              onClick={() => handleWordClick(w)}
              disabled={w.used}
              className={`px-4 py-2 rounded-full font-mono text-sm transition-all ${
                w.used 
                  ? 'bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed' 
                  : 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-800/50 hover:scale-105 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
              }`}
            >
              {w.word}
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={resetCode}
            className="px-4 py-3 rounded-lg font-bold transition-all bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> RESET
          </button>
          <button
            onClick={checkAnswers}
            disabled={!allFilled || success}
            className={`px-8 py-3 rounded-lg font-bold transition-all ${
              !allFilled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : showError
                ? 'bg-red-600 text-white animate-shake'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            }`}
          >
            {showError ? 'ERREUR DE SYNTAXE' : 'COMPILER LE CODE'}
          </button>
        </div>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm rounded-xl"
            >
              <div className="text-center p-8 bg-emerald-950/80 border border-emerald-500 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.3)] max-w-md">
                <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">ALGORITHME DÉPLOYÉ</h3>
                <p className="text-emerald-200 mb-4">L'irrigation intelligente est active. Économie estimée : 30 à 50% d'eau !</p>
                <div className="bg-emerald-900/40 p-3 rounded text-sm text-left text-emerald-100 mb-4">
                  <strong>📚 À retenir :</strong> Un <TechTerm term="Algorithme" /> est une suite d'instructions logiques (SI... SINON...). Arroser la nuit réduit l'évaporation de 30%.
                </div>
                <p className="text-sm text-slate-400 mt-4 animate-pulse">Passage au niveau suivant...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Hint hintText="Un seul datacenter peut consommer autant d'eau qu'une ville de 10 000 habitants en une seule journée pour ses besoins de refroidissement." delaySeconds={30} />
      </div>
    </motion.div>
  );

  function BlankSlot({ id }: { id: number }) {
    const blank = blanks.find(b => b.id === id);
    const isActive = activeBlank === id;
    const isFilled = blank?.val !== '';

    return (
      <button
        onClick={() => handleBlankClick(id)}
        className={`inline-flex items-center justify-center min-w-[80px] h-7 px-2 mx-1 rounded transition-all ${
          isActive 
            ? 'bg-emerald-900/50 border-2 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' 
            : isFilled
            ? 'bg-cyan-900/30 border border-cyan-500/50 text-cyan-300'
            : 'bg-slate-800/50 border border-dashed border-slate-500 hover:border-emerald-500/50 hover:bg-slate-800'
        } ${showError && !isFilled ? 'border-red-500 bg-red-900/20' : ''}`}
      >
        {blank?.val || <span className="opacity-0">...</span>}
      </button>
    );
  }
}
