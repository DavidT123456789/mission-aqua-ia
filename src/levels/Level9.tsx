import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, CheckCircle2, Filter, Trash2 } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

export default function Level9({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [datasets, setDatasets] = useState([
    { id: 1, text: 'Traces GPS & pubs des applis météo', size: 45, relevant: false, kept: true },
    { id: 2, text: 'Données climatiques historiques (1995-2020)', size: 35, relevant: true, kept: true },
    { id: 3, text: 'Vidéos HD non compressées de rivières', size: 80, relevant: false, kept: true },
    { id: 4, text: <>Séries numériques de débits (<TechTerm term="Hydrologie">hydrologie</TechTerm>)</>, size: 15, relevant: true, kept: true },
    { id: 5, text: 'Doublons d\'archives météo (1995-2020)', size: 35, relevant: false, kept: true },
    { id: 6, text: <><TechTerm term="Topographie">Topographie</TechTerm> des sols</>, size: 20, relevant: true, kept: true },
  ]);

  const { errorMsg, isErrorFlash, triggerError, clearError } = useErrorFeedback();
  const [hasScored, setHasScored] = useState(false);

  const isSuccess = hasScored;

  const toggleDataset = (id: number) => {
    if (isSuccess) return;
    soundManager.playClick();
    setDatasets(datasets.map(d => d.id === id ? { ...d, kept: !d.kept } : d));
    clearError();
  };

  const checkAnswer = () => {
    const isCorrect = datasets.every(d => d.kept === d.relevant);
    if (isCorrect) {
      soundManager.playSuccess();
      clearError();
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(200, 76);
      }
    } else {
      const deletedUseful = datasets.some(d => d.relevant && !d.kept);
      const keptDuplicate = datasets.find(d => d.id === 5)?.kept;
      const keptVideo = datasets.find(d => d.id === 3)?.kept;

      if (deletedUseful) {
        triggerError("Attention : vous avez supprimé des données scientifiques indispensables !");
      } else if (keptDuplicate) {
        triggerError("Doublons détectés : les archives 1995-2020 sont déjà présentes en données propres !");
      } else if (keptVideo) {
        triggerError("Format trop lourd : les vidéos HD de rivières (80 To) sont inutiles quand on a les séries numériques de débits !");
      } else {
        triggerError("Données hors-sujet conservées : les traces publicitaires polluent l'entraînement.");
      }
      onMistake?.();
    }
  };

  const totalDataKept = datasets.filter(d => d.kept).reduce((acc, curr) => acc + curr.size, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-2xl max-w-4xl mx-auto relative flex flex-col backdrop-blur-xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)]"
    >
      
      <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
        <Filter className="w-7 h-7 text-emerald-400 shrink-0" />
        <h2 className="font-mono text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 9 : Hygiène des Données
        </h2>
      </div>

      <div className="mb-3">
        <NaiaDialogue 
          message={
            <>
              L'infrastructure d'HYDRA est assainie ! Nous devons maintenant l'entraîner à <strong className="text-white">prédire les sécheresses</strong>. Au-delà des <TechTerm term="Mème">mèmes</TechTerm>, les bases brutes cachent doublons, vidéos lourdes et traces publicitaires.
            </>
          }
          objective="Filtrez le jeu de données ci-dessous pour ne conserver que les données scientifiques utiles."
          reaction={errorMsg ? { message: errorMsg, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={isSuccess ? 'happy' : 'neutral'}
        />
      </div>

      <div className="space-y-4 text-slate-300">
        <div className="flex justify-between items-end mb-4">
          <p className="text-sm">Sélectionnez les jeux de données à <strong className="text-red-400">supprimer</strong> de l'entraînement :</p>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Volume total à traiter</span>
            <span className={`text-2xl font-bold ${isSuccess ? 'text-emerald-400' : 'text-cyan-300'}`}>{totalDataKept} To</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              role="button"
              tabIndex={isSuccess ? -1 : 0}
              aria-pressed={!dataset.kept}
              aria-disabled={isSuccess}
              onClick={() => !isSuccess && toggleDataset(dataset.id)}
              onKeyDown={(e) => {
                if (!isSuccess && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  toggleDataset(dataset.id);
                }
              }}
              className={`p-4 rounded-lg border-2 flex justify-between items-center gap-2 transition-all text-left focus:outline-none focus:ring-2 focus:ring-emerald-400/70 ${
                !dataset.kept 
                  ? 'bg-red-950/20 border-red-500/30 opacity-60' 
                  : 'bg-slate-800 border-slate-600 hover:border-emerald-500/50'
              } ${isSuccess ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <Database className={`w-5 h-5 shrink-0 ${!dataset.kept ? 'text-red-500' : 'text-blue-400'}`} />
                <span className={`text-sm ${!dataset.kept ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {dataset.text} <span className="text-slate-400 font-medium">({dataset.size} To)</span>
                </span>
              </div>
              {!dataset.kept ? (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-400 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" /> Supprimé
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase text-emerald-400/80 shrink-0">
                  Conservé
                </span>
              )}
            </div>
          ))}
        </div>

        {!isSuccess && (
          <div className="flex justify-center mt-5">
            <button
              onClick={checkAnswer}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                isErrorFlash
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]'
              }`}
            >
              LANCER L'ENTRAÎNEMENT
            </button>
          </div>
        )}

        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center mt-5 p-6 bg-emerald-950/30 border border-emerald-500/50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl mb-4">
                 <CheckCircle2 className="w-6 h-6" />
                 DONNÉES OPTIMISÉES
              </div>
              <p className="text-center mb-6 text-sm">
                En supprimant 160 To de données inutiles (passant de 230 To à 70 To), l'entraînement prendra 70% de temps en moins. La qualité des données (Data Quality) est souvent plus importante que la quantité pour obtenir une <TechTerm term="IA" /> performante et écologique.
              </p>
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
