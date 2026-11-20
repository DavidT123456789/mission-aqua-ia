import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Filter, Trash2, Scale, ShieldAlert } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import LevelHeader from '../components/LevelHeader';
import LevelShell from '../components/LevelShell';
import ActionButton from '../components/ActionButton';
import LevelSuccessCard from '../components/LevelSuccessCard';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';
import { STEP_PANEL_MOTION } from '../utils/motion';

type BiasOptionId = 'more_gpu' | 'rebalance_data' | 'copy_average';

const BIAS_OPTIONS: { id: BiasOptionId; label: string; tag: string; isCorrect: boolean; errorFeedback?: string }[] = [
  {
    id: 'more_gpu',
    label: "L'IA est neutre par nature : il suffit de rajouter des GPU pour calculer plus vite",
    tag: 'Biais amplifié',
    isCorrect: false,
    errorFeedback: "Plus de GPU sur des données biaisées ne fait qu'accélérer une décision injuste (« Garbage in, garbage out »)."
  },
  {
    id: 'rebalance_data',
    label: "Biais de représentativité : numériser et intégrer les relevés terrain du Quartier Nord",
    tag: 'Distribution équitable',
    isCorrect: true
  },
  {
    id: 'copy_average',
    label: "Appliquer la moyenne de consommation du Centre-Ville au Quartier Nord pour combler le manque",
    tag: 'Fausse équité',
    isCorrect: false,
    errorFeedback: "Piège classique ! Copier la moyenne du Centre-Ville masque les besoins réels du Quartier Nord (habitat, réseaux plus anciens). Il faut collecter les vraies données terrain !"
  }
];

const MAX_STORAGE_TB = 75;

export default function Level9({ onComplete, onScoreUpdate, onMistake }: { onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [phase, setPhase] = useState<1 | 2>(1);
  const [datasets, setDatasets] = useState([
    { id: 1, text: 'Relevés pluviométriques d\'Australie (1995-2020)', size: 45, relevant: false, kept: true },
    { id: 2, text: 'Données climatiques du bassin local (1995-2020)', size: 35, relevant: true, kept: true },
    { id: 3, text: 'Vidéos 4K en continu des cours d\'eau', size: 80, relevant: false, kept: true },
    { id: 4, text: <>Séries numériques de débits (<TechTerm term="Hydrologie">hydrologie</TechTerm>)</>, size: 15, relevant: true, kept: true },
    { id: 5, text: 'Copie brute de sauvegarde météo (1995-2020)', size: 35, relevant: false, kept: true },
    { id: 6, text: <><TechTerm term="Topographie">Topographie</TechTerm> et perméabilité des sols</>, size: 20, relevant: true, kept: true },
  ]);
  const [selectedBiasOption, setSelectedBiasOption] = useState<BiasOptionId | null>(null);
  const [revealedBiasIds, setRevealedBiasIds] = useState<BiasOptionId[]>([]);

  const { errorMsg, isErrorFlash, triggerError, clearError } = useErrorFeedback();
  const [hasScored, setHasScored] = useState(false);

  const isSuccess = hasScored;

  const toggleDataset = (id: number) => {
    if (isSuccess || phase !== 1) return;
    soundManager.playClick();
    setDatasets(datasets.map(d => d.id === id ? { ...d, kept: !d.kept } : d));
    clearError();
  };

  const totalDataKept = datasets.filter(d => d.kept).reduce((acc, curr) => acc + curr.size, 0);
  const isOverCap = totalDataKept > MAX_STORAGE_TB;

  const checkPhase1 = () => {
    const isCorrect = datasets.every(d => d.kept === d.relevant);
    if (isCorrect) {
      soundManager.playStep();
      clearError();
      setPhase(2);
      return;
    }

    const deletedUseful = datasets.some(d => d.relevant && !d.kept);
    const keptAustralia = datasets.find(d => d.id === 1)?.kept;
    const keptDuplicate = datasets.find(d => d.id === 5)?.kept;
    const keptVideo = datasets.find(d => d.id === 3)?.kept;

    if (deletedUseful) {
      triggerError("Attention : vous avez supprimé des données scientifiques locales indispensables !");
    } else if (isOverCap) {
      if (keptVideo) {
        triggerError(`Plafond dépassé (${totalDataKept} To > ${MAX_STORAGE_TB} To) : les vidéos 4K des cours d'eau (80 To) sont inutiles face aux séries numériques !`);
      } else if (keptDuplicate) {
        triggerError(`Plafond dépassé (${totalDataKept} To > ${MAX_STORAGE_TB} To) : la copie brute de sauvegarde (1995-2020) fait doublon avec les données climatiques du bassin !`);
      } else {
        triggerError(`Plafond dépassé (${totalDataKept} To > ${MAX_STORAGE_TB} To) : les relevés d'Australie (45 To) sont hors de notre bassin local !`);
      }
    } else if (keptAustralia) {
      triggerError("Piège géographique : ces relevés d'Australie sont propres mais inutiles pour modéliser notre bassin local !");
    } else if (keptDuplicate) {
      triggerError("Redondance détectée : la copie brute 1995-2020 fait doublon avec les données climatiques du bassin déjà conservées !");
    } else {
      triggerError("Format trop lourd : les vidéos 4K en continu (80 To) sont inutiles quand on a les séries numériques de débits !");
    }
    onMistake?.();
  };

  const checkPhase2 = () => {
    if (!selectedBiasOption) return;
    const chosen = BIAS_OPTIONS.find(o => o.id === selectedBiasOption);
    if (!chosen) return;

    setRevealedBiasIds(prev => (prev.includes(chosen.id) ? prev : [...prev, chosen.id]));

    if (chosen.isCorrect) {
      soundManager.playSuccess();
      clearError();
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(200, 76);
      }
    } else {
      triggerError(chosen.errorFeedback || "Ce diagnostic ne corrige pas le biais dans les données.");
      onMistake?.();
    }
  };

  return (
    <LevelShell>
      <LevelHeader
        level={9}
        icon={Filter}
        rightSlot={
          <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-slate-950 border border-cyan-500/30 text-cyan-300 shrink-0">
            Étape {phase} / 2
          </span>
        }
      />

      <div className="mb-3">
        <NaiaDialogue
          hydra={{
            status: 'warning',
            message:
              phase === 1
                ? "Indexation automatique de 230 To d'archives brutes en cours pour l'entraînement..."
                : "Pré-test sécheresse : baisse automatique de pression programmée sur le secteur Quartier Nord.",
          }}
          message={
            phase === 1 ? (
              <>
                L'infrastructure d'HYDRA est assainie ! Nous devons maintenant l'entraîner à <strong className="text-white">prédire les sécheresses locales</strong>. Mais les bases brutes cachent copies non filtrées, vidéos lourdes et relevés hors zone.
              </>
            ) : (
              <>
                Le volume est trié (70 To propres), mais lors du pré-test en mode sécheresse, HYDRA coupe automatiquement la pression d'eau dans le <strong className="text-amber-300">Quartier Nord</strong>, estimant qu'il n'en a presque pas besoin !
              </>
            )
          }
          objective={
            phase === 1
              ? `Supprimez les jeux superflus ou hors zone pour passer sous ${MAX_STORAGE_TB} To en gardant les données scientifiques locales.`
              : (
                <>
                  Comparez les sources ci-dessous et corrigez ce <TechTerm term="Biais">biais</TechTerm> avant l'entraînement.
                </>
              )
          }
          reaction={errorMsg ? { message: errorMsg, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={isSuccess ? 'happy' : phase === 2 ? 'alert' : 'neutral'}
          hintStep={phase}
        />
      </div>

      <div className="space-y-4 text-slate-300">
        <AnimatePresence mode="wait" initial={false}>
        {phase === 1 && (
          <motion.div key="l9-phase-1" {...STEP_PANEL_MOTION} className="space-y-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <p className="text-xs sm:text-sm">
                  Cliquez sur les jeux de données à <strong className="text-red-400">supprimer</strong> de l'entraînement :
                </p>
                <div className="text-right font-mono tabular-nums">
                  <span className={`text-lg sm:text-xl font-black ${isOverCap ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {totalDataKept} To
                  </span>
                  <span className="text-xs text-slate-400 ml-1">/ {MAX_STORAGE_TB} To max</span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                <div
                  className={`h-full transition-all duration-300 ${isOverCap ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (totalDataKept / 230) * 100)}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-cyan-400"
                  style={{ left: `${(MAX_STORAGE_TB / 230) * 100}%` }}
                  title={`Plafond : ${MAX_STORAGE_TB} To`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={!dataset.kept}
                  onClick={() => toggleDataset(dataset.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleDataset(dataset.id);
                    }
                  }}
                  className={`p-3.5 rounded-xl border-2 flex justify-between items-center gap-2 transition-all text-left cursor-pointer active:scale-[0.985] focus:outline-none focus:ring-2 focus:ring-emerald-400/70 ${
                    !dataset.kept
                      ? 'bg-red-950/20 border-red-500/30 opacity-60'
                      : 'bg-slate-800 border-slate-600 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Database className={`w-5 h-5 shrink-0 ${!dataset.kept ? 'text-red-500' : 'text-blue-400'}`} />
                    <span className={`text-xs sm:text-sm ${!dataset.kept ? 'line-through text-slate-500' : 'text-slate-200'}`}>
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

            <div className="flex justify-center mt-4">
              <ActionButton
                onClick={checkPhase1}
                isError={isErrorFlash}
              >
                VÉRIFIER LE JEU DE DONNÉES
              </ActionButton>
            </div>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div
            key="l9-phase-2"
            {...STEP_PANEL_MOTION}
            className="space-y-4"
          >
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Audit de représentativité des capteurs municipaux
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-3">
                  <div className="font-bold text-cyan-300 mb-1">Centre-Ville</div>
                  <div className="text-slate-300">
                    120 capteurs IoT + signalements via appli mobile → <strong className="text-emerald-400">98 % des besoins visibles</strong>
                  </div>
                </div>
                <div className="bg-slate-900/80 border border-amber-500/40 rounded-lg p-3">
                  <div className="font-bold text-amber-300 mb-1">Quartier Nord</div>
                  <div className="text-slate-300">
                    4 vieux capteurs + fiches papier non numérisées → <strong className="text-red-400">15 % des besoins visibles</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {BIAS_OPTIONS.map((opt) => {
                const isSelected = selectedBiasOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isSuccess}
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedBiasOption(opt.id);
                      clearError();
                    }}
                    className={`w-full p-3.5 rounded-xl border-2 text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 active:scale-[0.99] ${
                      isSelected
                        ? isSuccess && opt.isCorrect
                          ? 'bg-emerald-950/40 border-emerald-400 text-emerald-100'
                          : 'bg-cyan-950/40 border-cyan-400 text-white'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-medium">{opt.label}</span>
                    {(isSuccess || revealedBiasIds.includes(opt.id)) && (
                      <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full shrink-0 self-start sm:self-center flex items-center gap-1 border ${
                        opt.isCorrect
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-red-500/15 border-red-500/35 text-red-300'
                      }`}>
                        <Scale className="w-3 h-3" /> {opt.tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {!isSuccess && (
              <div className="flex justify-center mt-4">
                <ActionButton
                  onClick={checkPhase2}
                  disabled={!selectedBiasOption}
                  isError={isErrorFlash}
                >
                  LANCER L'ENTRAÎNEMENT ÉQUITABLE
                </ActionButton>
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
          {isSuccess && (
            <LevelSuccessCard
              title="DONNÉES OPTIMISÉES & ÉQUILIBRÉES"
              description={
                <>
                  En supprimant 160 To superflus ou hors zone (de 230 To à 70 To) ET en corrigeant ce <TechTerm term="Biais">biais</TechTerm> avec les relevés du Quartier Nord, vous obtenez une <TechTerm term="IA" /> à la fois sobre et juste : la qualité et la représentativité des données priment toujours sur le volume brut !
                </>
              }
              onContinue={onComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </LevelShell>
  );
}
