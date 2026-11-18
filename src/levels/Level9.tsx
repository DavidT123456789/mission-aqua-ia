import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, CheckCircle2, Filter, Trash2 } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import { soundManager } from '../utils/soundManager';

export default function Level9({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [datasets, setDatasets] = useState([
    { id: 1, text: 'Traces GPS & pubs des applis météo', size: 45, relevant: false, kept: true },
    { id: 2, text: 'Données climatiques historiques (1995-2020)', size: 35, relevant: true, kept: true },
    { id: 3, text: 'Vidéos HD non compressées de rivières', size: 80, relevant: false, kept: true },
    { id: 4, text: <>Séries numériques de débits (<TechTerm term="Hydrologie">hydrologie</TechTerm>)</>, size: 15, relevant: true, kept: true },
    { id: 5, text: 'Doublons d\'archives météo (1995-2020)', size: 35, relevant: false, kept: true },
    { id: 6, text: <><TechTerm term="Topographie">Topographie</TechTerm> des sols</>, size: 20, relevant: true, kept: true },
  ]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasScored, setHasScored] = useState(false);

  const isSuccess = hasScored;

  const toggleDataset = (id: number) => {
    if (isSuccess) return;
    soundManager.playClick();
    setDatasets(datasets.map(d => d.id === id ? { ...d, kept: !d.kept } : d));
    setErrorMsg(null);
  };

  const checkAnswer = () => {
    const isCorrect = datasets.every(d => d.kept === d.relevant);
    if (isCorrect) {
      soundManager.playSuccess();
      setErrorMsg(null);
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(200, 76);
      }
    } else {
      const deletedUseful = datasets.some(d => d.relevant && !d.kept);
      const keptDuplicate = datasets.find(d => d.id === 5)?.kept;
      const keptVideo = datasets.find(d => d.id === 3)?.kept;

      if (deletedUseful) {
        setErrorMsg("Attention : vous avez supprimé des données scientifiques indispensables !");
      } else if (keptDuplicate) {
        setErrorMsg("Doublons détectés : les archives 1995-2020 sont déjà présentes en données propres !");
      } else if (keptVideo) {
        setErrorMsg("Format trop lourd : les vidéos HD de rivières (80 To) sont inutiles quand on a les séries numériques de débits !");
      } else {
        setErrorMsg("Données hors-sujet conservées : les traces publicitaires polluent l'entraînement.");
      }
      onMistake?.();
      setTimeout(() => setErrorMsg(null), 3500);
    }
  };

  const totalDataKept = datasets.filter(d => d.kept).reduce((acc, curr) => acc + curr.size, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900 border-transparent sm:border-cyan-500/20 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-xl max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      
      <div className="flex items-center gap-3 mb-3 border-b border-cyan-900/50 pb-3">
        <Filter className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 9 : Hygiène des Données
        </h2>
      </div>

      <div className="mb-3">
        <NaiaDialogue 
          message={
            <>
              L'infrastructure d'HYDRA est assainie ! Nous devons maintenant l'entraîner à <strong>prédire les sécheresses</strong>. Au-delà des <TechTerm term="Mème">mèmes</TechTerm> ou vidéos virales évidentes, les bases brutes cachent de vrais pièges (doublons, vidéos non compressées, traces publicitaires) qui gaspillent eau et électricité. <strong>Filtrez son jeu de données</strong> pour ne garder que l'essentiel.
            </>
          }
          emotion="alert"
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
            <button
              key={dataset.id}
              type="button"
              disabled={isSuccess}
              onClick={() => toggleDataset(dataset.id)}
              className={`p-4 rounded-lg border-2 flex justify-between items-center gap-2 transition-all text-left ${
                !dataset.kept 
                  ? 'bg-red-950/20 border-red-500/30 opacity-60' 
                  : 'bg-slate-800 border-slate-600 hover:border-emerald-500/50'
              } ${isSuccess ? 'cursor-default' : ''}`}
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
            </button>
          ))}
        </div>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg text-red-300 text-xs font-bold text-center"
          >
            {errorMsg}
          </motion.div>
        )}

        {!isSuccess && (
          <div className="flex justify-center mt-5">
            <button
              onClick={checkAnswer}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                errorMsg
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105'
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-colors"
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
