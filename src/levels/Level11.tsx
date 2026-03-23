import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, CheckCircle2, RotateCcw } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
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
  'aube': "Matinée (évite maladies)",
};

export default function Level11({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [activeWord, setActiveWord] = useState<{ id: number, word: string } | null>(null);
  const [activeBlank, setActiveBlank] = useState<number | null>(null);
  const [showError, setShowError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [moisture, setMoisture] = useState(20);

  // Initialisation paresseuse pour éviter de mélanger l'array à chaque re-render
  const [blanks, setBlanks] = useState(THE_BLANKS);
  const [words, setWords] = useState(getInitialWords);

  useEffect(() => {
    // Simulate moisture changes based on code state
    if (blanks.every(b => b.val !== '')) {
      const isCorrect = blanks.every(b => b.val === b.ans);
      setMoisture(isCorrect ? 65 : 10);
    } else {
      setMoisture(20);
    }
  }, [blanks]);

  const handleBlankClick = (id: number) => {
    const blank = blanks.find(b => b.id === id);
    if (!blank) return;
    
    soundManager.playClick();
    if (activeWord) {
      // Un mot est "en main", on le place ici
      if (blank.val !== '') {
        // Si la case était déjà pleine, on libère l'ancien mot
        setWords(prev => prev.map(w => w.word === blank.val ? { ...w, used: false } : w));
      }
      setBlanks(prev => prev.map(b => b.id === id ? { ...b, val: activeWord.word } : b));
      setWords(prev => prev.map(w => w.id === activeWord.id ? { ...w, used: true } : w));
      setActiveWord(null);
    } else {
      if (blank.val !== '') {
        // Si on clique sur un mot déjà placé sans rien avoir en main, on le retire
        setWords(prev => prev.map(w => w.word === blank.val ? { ...w, used: false } : w));
        setBlanks(prev => prev.map(b => b.id === id ? { ...b, val: '' } : b));
        setActiveBlank(null);
      } else {
        // On cible un espace vide
        setActiveBlank(activeBlank === id ? null : id);
      }
    }
    
    setShowError(false);
  };

  const handleWordClick = (wordObj: { id: number, word: string, used: boolean }) => {
    if (wordObj.used) return;
    
    soundManager.playClick();
    if (activeBlank) {
      // Un espace est ciblé, on insère le mot dedans
      const targetBlank = blanks.find(b => b.id === activeBlank);
      if (targetBlank && targetBlank.val !== '') {
        setWords(prev => prev.map(w => w.word === targetBlank.val ? { ...w, used: false } : w));
      }
      setBlanks(prev => prev.map(b => b.id === activeBlank ? { ...b, val: wordObj.word } : b));
      setWords(prev => prev.map(w => w.id === wordObj.id ? { ...w, used: true } : w));
      setActiveBlank(null);
    } else {
      // Basculer la sélection : si on clique sur le mot déjà pris, on le repose
      if (activeWord?.id === wordObj.id) {
        setActiveWord(null);
      } else {
        setActiveWord({ id: wordObj.id, word: wordObj.word });
      }
    }
  };

  const resetCode = () => {
    setBlanks(THE_BLANKS);
    setWords(getInitialWords());
    setActiveWord(null);
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

  const renderBlankSlot = (id: number) => {
    const blank = blanks.find(b => b.id === id);
    const isFilled = blank?.val !== '';
    const isTargeted = activeBlank === id;
    const isReadyToReceive = (activeWord !== null && !isFilled) || isTargeted;

    return (
      <motion.button
        layout
        key={`slot-${id}`}
        onClick={() => handleBlankClick(id)}
        className={`inline-flex items-center justify-center min-w-[80px] h-7 px-2 mx-1 rounded transition-colors focus:outline-none ${
          isTargeted
            ? 'bg-emerald-900/50 border-2 border-emerald-400 z-10'
            : isFilled
            ? 'bg-cyan-900/30 border border-cyan-500/50 text-cyan-300 cursor-pointer hover:bg-cyan-900/50'
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
      </motion.button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900 border-transparent sm:border-cyan-500/20 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-xl max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      {isDevMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50">
          Dev Réponses : 1:capteur, 2:previsions, 3:seuil, 4:or, 5:False, 6:eau, 7:True, 8:aube
        </div>
      )}
      <div className="flex items-center gap-3 mb-3 border-b border-cyan-900/50 pb-3">
        <Cpu className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 11 : L'Algorithme d'Arrosage
        </h2>
      </div>

      <div className="mb-3">
        <NaiaDialogue message={
          <>
            <span className="text-red-400 font-bold block mb-2 uppercase tracking-widest text-xs">⚠️ Alerte : Interfaces simplifiées verrouillées</span>
            Agent, le pare-feu d'HYDRA a neutralisé nos raccourcis visuels. Vous devez maintenant interagir directement avec le <strong>code source du noyau</strong> ! L'agriculture consomme <strong>70% de l'eau douce mondiale</strong>. Déployons notre algorithme Python pour stopper l'hémorragie. Mon code est <strong>incomplet</strong>. Reconstruisez-le avec précision !
          </>
        } />
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
                <span>L'<TechTerm term="IA" /> reçoit des informations grâce à des <strong>capteurs</strong> dans le sol et aux <strong>previsions</strong> météo.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 shrink-0">2</span>
                <span>Elle analyse : <em>« SI l'humidité dépasse le <strong>seuil</strong> de la plante (ex: 30%) <strong>OU</strong> (opérateur <strong>'or'</strong>) s'il va pleuvoir → on n'arrose pas (<strong>False</strong>). »</em></span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 shrink-0">3</span>
                <span>Seulement quand c'est nécessaire, l'<TechTerm term="IA" /> calcule le besoin en <strong>eau</strong> et active l'arrosage (<strong>True</strong>), de préférence à l'<strong>aube</strong> (moins d'évaporation, empêche les maladies).</span>
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

        <div className="text-center mb-4 p-3 bg-emerald-950/30 border border-cyan-500/20 rounded-lg text-sm">
          👆 <strong>Mission :</strong> Complétez le code ci-dessous. Vous pouvez soit <strong>prendre une étiquette</strong> puis cliquer sur un espace, soit <strong>sélectionner un espace</strong> <span className="inline-block w-8 h-4 border border-dashed border-emerald-500 mx-1"></span> puis choisir une étiquette.
        </div>

        {/* Code Editor */}
        <div className="bg-[#080c14] border border-slate-800 rounded-xl font-mono text-sm md:text-base">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#0a1020] border-b border-slate-800">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-2 text-slate-500 text-xs">aqua_farm.py</span>
          </div>
          
          <div className="p-4 md:p-6 overflow-x-auto pt-10">
            <div className="min-w-[500px]">
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
        <div className="flex flex-wrap justify-center gap-3 p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
          <AnimatePresence>
            {words.map((w, i) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                key={`${w.word}-${i}`} 
                className="group/word relative flex items-center justify-center"
              >
                <motion.button
                  whileHover={w.used ? {} : { scale: 1.05 }}
                  whileTap={w.used ? {} : { scale: 0.95 }}
                  animate={{ 
                    scale: w.used ? 0.9 : activeWord?.id === w.id ? 1.1 : 1, 
                    opacity: w.used ? 0.35 : 1 
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => handleWordClick(w)}
                  disabled={w.used}
                  className={`px-4 py-2 rounded-full font-mono text-sm transition-colors focus:outline-none ${
                    w.used 
                      ? 'bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed' 
                      : activeWord?.id === w.id
                      ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-400 z-10'
                      : activeBlank
                      ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/50 cursor-pointer'
                      : 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/50'
                  }`}
                >
                  {w.word}
                </motion.button>
                {!w.used && (
                  <div className="absolute bottom-full mb-2 w-48 px-3 py-2 bg-slate-900 text-slate-200 text-xs leading-relaxed rounded-lg border border-slate-700 opacity-0 group-hover/word:opacity-100 transition-opacity pointer-events-none z-50 text-center font-sans shadow-xl not-italic font-normal tracking-normal">
                    {wordDescriptions[w.word]}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-700"></div>
                    <div className="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
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
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
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
              className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 rounded-xl"
            >
              <div className="text-center p-8 bg-emerald-950/90 border border-emerald-500 rounded-2xl max-w-md">
                <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">ALGORITHME DÉPLOYÉ</h3>
                <p className="text-emerald-200 mb-4">L'irrigation intelligente est active. Économie estimée : 30 à 50% d'eau !</p>
                <div className="bg-emerald-900/40 p-3 rounded text-sm text-left text-emerald-100 mb-4">
                  <strong>📚 À retenir :</strong> L'opérateur <strong>OR</strong> permet de combiner plusieurs conditions. Arroser à l'<strong>aube</strong> empêche la stagnation d'eau sur les feuilles !
                </div>
                <p className="text-sm text-slate-400 mt-4">Passage au niveau suivant</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

}
