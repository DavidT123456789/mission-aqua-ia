import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, CheckCircle2, Filter, Trash2 } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';

export default function Level10({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [datasets, setDatasets] = useState([
    { id: 1, name: 'Images de chats (10 To)', relevant: false, kept: true },
    { id: 2, name: 'Données climatiques (2 To)', relevant: true, kept: true },
    { id: 3, name: 'Historique des mèmes (50 To)', relevant: false, kept: true },
    { id: 4, name: 'Relevés hydrologiques (1 To)', relevant: true, kept: true },
    { id: 5, name: 'Vidéos virales 2010s (100 To)', relevant: false, kept: true },
    { id: 6, name: 'Topographie des sols (3 To)', relevant: true, kept: true },
  ]);

  const [showError, setShowError] = useState(false);
  const [hasScored, setHasScored] = useState(false);

  const toggleDataset = (id: number) => {
    setDatasets(datasets.map(d => d.id === id ? { ...d, kept: !d.kept } : d));
    setShowError(false);
  };

  const checkAnswer = () => {
    const isCorrect = datasets.every(d => d.kept === d.relevant);
    if (isCorrect) {
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(200, 40);
      }
    } else {
      setShowError(true);
      onMistake?.();
      setTimeout(() => setShowError(false), 2000);
    }
  };

  const isSuccess = datasets.every(d => d.kept === d.relevant) && hasScored;
  const totalDataKept = datasets.filter(d => d.kept).reduce((acc, curr) => {
    const size = parseInt(curr.name.match(/\((\d+) To\)/)?.[1] || '0');
    return acc + size;
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900 border-transparent sm:border-emerald-500/30 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-xl sm:shadow-2xl max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      {isDevMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50">
          Dev Réponses : Keep only relevant datasets (Données climatiques, Relevés hydrologiques, Topographie des sols)
        </div>
      )}
      <div className="flex items-center gap-3 mb-3 border-b border-emerald-900/50 pb-3">
        <Filter className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 10 : Hygiène des Données
        </h2>
      </div>

      <div className="mb-3">
        <NaiaDialogue 
          message={
            <>
              Pour prédire les sécheresses, je dois être ré-entraînée. Actuellement, on me nourrit avec TOUTES les données d'internet. Plus il y a de données, plus l'entraînement est long, et plus il consomme d'eau et d'électricité. Filtrez mon jeu de données pour ne garder que l'essentiel.
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
            <span className={`text-2xl font-bold ${totalDataKept > 10 ? 'text-red-400' : 'text-emerald-400'}`}>{totalDataKept} To</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {datasets.map((dataset) => (
            <button
              key={dataset.id}
              onClick={() => toggleDataset(dataset.id)}
              className={`p-4 rounded-lg border-2 flex justify-between items-center transition-all ${
                !dataset.kept 
                  ? 'bg-red-950/20 border-red-500/30 opacity-50' 
                  : 'bg-slate-800 border-slate-600 hover:border-emerald-500/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Database className={`w-5 h-5 ${!dataset.kept ? 'text-red-500' : 'text-blue-400'}`} />
                <span className={`text-sm ${!dataset.kept ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {dataset.name}
                </span>
              </div>
              {!dataset.kept && <Trash2 className="w-4 h-4 text-red-500" />}
            </button>
          ))}
        </div>

        {!isSuccess && (
          <div className="flex justify-center mt-5">
            <button
              onClick={checkAnswer}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                showError
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105'
              }`}
            >
              {showError ? 'DONNÉES INUTILES DÉTECTÉES' : 'LANCER L\'ENTRAÎNEMENT'}
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
                En supprimant 160 To de données inutiles, l'entraînement prendra 95% de temps en moins. La qualité des données (Data Quality) est souvent plus importante que la quantité pour obtenir une <TechTerm term="IA" /> performante et écologique.
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
