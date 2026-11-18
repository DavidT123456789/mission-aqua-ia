import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, CheckCircle2, Zap, Scale, Cpu, Database, Target } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

type ArchId = 'heuristic' | 'specialized' | 'llm';

interface TaskFlow {
  id: 'blacklist' | 'tickets' | 'legal';
  title: string;
  volumeLabel: string;
  volumePerDay: number;
  requirement: string;
  expected: ArchId;
}

const ARCHITECTURES: Record<ArchId, {
  id: ArchId;
  label: string;
  shortLabel: string;
  icon: typeof Cpu;
  whPerReq: number;
  strength: string;
}> = {
  heuristic: {
    id: 'heuristic',
    label: 'Règles Heuristiques (Sans IA)',
    shortLabel: 'Sans IA (Règles)',
    icon: Database,
    whPerReq: 0.001,
    strength: 'Exactitude sur motifs connus, coût quasi nul'
  },
  specialized: {
    id: 'specialized',
    label: 'Modèle Spécialisé (1B)',
    shortLabel: 'Modèle Spécialisé',
    icon: Cpu,
    whPerReq: 0.05,
    strength: 'Classification & tri ciblé à 98,5% de précision'
  },
  llm: {
    id: 'llm',
    label: 'LLM Généraliste (175B)',
    shortLabel: 'LLM Généraliste',
    icon: BrainCircuit,
    whPerReq: 2.5,
    strength: 'Raisonnement complexe & synthèse multilingue'
  }
};

const TASKS: TaskFlow[] = [
  {
    id: 'blacklist',
    title: '1. Filtrage d\'URLs malveillantes connues',
    volumeLabel: '10 000 000 req/jour',
    volumePerDay: 10_000_000,
    requirement: 'Vérification exacte par mots-clés et liste noire fixe.',
    expected: 'heuristic'
  },
  {
    id: 'tickets',
    title: '2. Catégorisation des demandes citoyennes',
    volumeLabel: '500 000 req/jour',
    volumePerDay: 500_000,
    requirement: 'Comprendre des phrases courtes et trier vers 8 services.',
    expected: 'specialized'
  },
  {
    id: 'legal',
    title: '3. Synthèse de rapports environnementaux complexes',
    volumeLabel: '2 000 req/jour',
    volumePerDay: 2_000,
    requirement: 'Analyser des documents de 80 pages et rédiger un résumé.',
    expected: 'llm'
  }
];

const QUALITY_MATRIX: Record<TaskFlow['id'], Record<ArchId, number>> = {
  blacklist: { heuristic: 100, specialized: 97, llm: 96 },
  tickets: { heuristic: 52, specialized: 98, llm: 99 },
  legal: { heuristic: 18, specialized: 58, llm: 97 }
};

const TARGET_MIN_QUALITY = 95;

export default function Level6({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [assignments, setAssignments] = useState<Partial<Record<TaskFlow['id'], ArchId>>>({});
  const { errorMsg, isErrorFlash, triggerError, clearError } = useErrorFeedback();
  const [hasScored, setHasScored] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const assignedTasks = TASKS.filter(t => Boolean(assignments[t.id]));
  const allAssigned = assignedTasks.length === TASKS.length;

  const dailyKwh = TASKS.reduce((sum, task) => {
    const arch = assignments[task.id];
    if (!arch) return sum;
    return sum + (task.volumePerDay * ARCHITECTURES[arch].whPerReq) / 1000;
  }, 0);

  const avgQuality = assignedTasks.length > 0
    ? Math.round(
        assignedTasks.reduce((sum, task) => {
          const arch = assignments[task.id]!;
          return sum + QUALITY_MATRIX[task.id][arch];
        }, 0) / assignedTasks.length
      )
    : 0;

  const handleAssign = (taskId: TaskFlow['id'], archId: ArchId) => {
    if (isSuccess) return;
    soundManager.playClick();
    setAssignments(prev => ({ ...prev, [taskId]: archId }));
    clearError();
  };

  const checkAnswer = () => {
    if (!allAssigned) return;

    const isAllCorrect = TASKS.every(t => assignments[t.id] === t.expected);
    if (isAllCorrect) {
      setIsSuccess(true);
      clearError();
      soundManager.playSuccess();
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(200, 56);
      }
      return;
    }

    // Feedback ciblé selon le type d'erreur
    if (assignments.blacklist !== 'heuristic' || assignments.tickets === 'llm') {
      triggerError("Surcharge énergétique : vous utilisez une architecture surdimensionnée sur un flux massif.");
    } else {
      triggerError("Qualité insuffisante : un outil trop simple échoue à comprendre ou synthétiser ces données.");
    }
    onMistake?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-2xl max-w-4xl mx-auto relative flex flex-col backdrop-blur-xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)]"
    >
      <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
        <Scale className="w-7 h-7 text-emerald-400 shrink-0" />
        <h2 className="font-mono text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 6 : Sobriété Algorithmique
        </h2>
      </div>

      <div className="mb-3">
        <NaiaDialogue
          message={
            <>
              HYDRA envoie encore toutes ses requêtes vers un énorme <TechTerm term="LLM" />, même pour de simples filtres !
            </>
          }
          objective={
            <>
              Associez chacun des 3 flux à l'architecture la plus adaptée pour rester sous <strong className="font-mono text-white">50 kWh/jour</strong> avec au moins <strong className="font-mono text-white">{TARGET_MIN_QUALITY} % de qualité</strong>.
            </>
          }
          reaction={errorMsg ? { message: errorMsg, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={isSuccess ? 'happy' : 'neutral'}
        />
      </div>

      <div className="space-y-4 text-slate-300">
        {/* Reference Architectures */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.values(ARCHITECTURES)).map((arch) => {
            const Icon = arch.icon;
            return (
              <div key={arch.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{arch.label}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">{arch.strength}</div>
                <div className="mt-auto pt-1.5 text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {arch.whPerReq} Wh / requête
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Energy & Quality Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Consommation estimée
              </span>
              <span className={`text-base sm:text-lg font-black ${
                isSuccess
                  ? 'text-emerald-400'
                  : assignedTasks.length === 0
                  ? 'text-slate-400'
                  : dailyKwh > 50
                  ? 'text-red-400'
                  : 'text-cyan-300'
              }`}>
                {dailyKwh.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kWh/j
                <span className="text-[11px] font-normal text-slate-500 ml-1.5">(max 50)</span>
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full border border-slate-800 relative">
              <div className="w-full h-full rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isSuccess
                      ? 'bg-emerald-500'
                      : dailyKwh > 50
                      ? 'bg-red-500'
                      : dailyKwh > 0
                      ? 'bg-cyan-500'
                      : 'bg-slate-700'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((dailyKwh / 100) * 100, 100)}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
              <div
                className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-amber-400 z-10"
                style={{ left: '50%' }}
                title="Plafond : 50 kWh/jour"
              />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" /> Précision / Qualité
              </span>
              <span className={`text-base sm:text-lg font-black ${
                isSuccess
                  ? 'text-emerald-400'
                  : assignedTasks.length === 0
                  ? 'text-slate-400'
                  : avgQuality < TARGET_MIN_QUALITY
                  ? 'text-red-400'
                  : 'text-cyan-300'
              }`}>
                {assignedTasks.length === 0 ? '--' : `${avgQuality} %`}
                <span className="text-[11px] font-normal text-slate-500 ml-1.5">(min {TARGET_MIN_QUALITY} %)</span>
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full border border-slate-800 relative">
              <div className="w-full h-full rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isSuccess
                      ? 'bg-emerald-500'
                      : assignedTasks.length === 0
                      ? 'bg-slate-700'
                      : avgQuality < TARGET_MIN_QUALITY
                      ? 'bg-red-500'
                      : 'bg-cyan-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${avgQuality}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
              <div
                className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-amber-400 z-10"
                style={{ left: `${TARGET_MIN_QUALITY}%` }}
                title={`Seuil minimum : ${TARGET_MIN_QUALITY} %`}
              />
            </div>
          </div>
        </div>

        {/* Routing Tasks */}
        <div className="space-y-3">
          {TASKS.map((task) => {
            const selected = assignments[task.id];
            return (
              <div
                key={task.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-white">{task.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-cyan-300 font-bold">
                      {task.volumeLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{task.requirement}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 shrink-0">
                  {(['heuristic', 'specialized', 'llm'] as ArchId[]).map((archId) => {
                    const arch = ARCHITECTURES[archId];
                    const isPicked = selected === archId;
                    return (
                      <button
                        key={archId}
                        type="button"
                        disabled={isSuccess}
                        onClick={() => handleAssign(task.id, archId)}
                        className={`px-2.5 py-2 rounded-lg border text-[11px] font-bold transition-all ${
                          isPicked
                            ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                        }`}
                      >
                        {arch.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {!isSuccess && (
          <div className="flex justify-center mt-4">
            <button
              onClick={checkAnswer}
              disabled={!allAssigned}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center gap-2 ${
                !allAssigned
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : isErrorFlash
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]'
              }`}
            >
              DÉPLOYER LE ROUTAGE
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
                ROUTAGE SOBRE ACTIVÉ (40 kWh/jour)
              </div>
              <p className="text-center mb-6 text-sm">
                C'est la <strong>Sobriété Algorithmique</strong> (Green AI) : sans <TechTerm term="IA" /> quand des règles suffisent, un petit modèle spécialisé pour trier efficacement, et le grand <TechTerm term="LLM" /> réservé aux rares analyses complexes !
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
