import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Zap, GitFork, Cpu, ListChecks, Target } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import HydraLog from '../components/HydraLog';
import TechTerm from '../components/TechTerm';
import LevelHeader from '../components/LevelHeader';
import LevelShell from '../components/LevelShell';
import ActionButton from '../components/ActionButton';
import LevelSuccessCard from '../components/LevelSuccessCard';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

type ArchId = 'heuristic' | 'specialized' | 'llm';

interface TaskFlow {
  id: 'alerts' | 'tickets' | 'legal' | 'blacklist';
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
    icon: ListChecks,
    whPerReq: 0.001,
    strength: 'Exactitude sur motifs connus, coût quasi nul'
  },
  specialized: {
    id: 'specialized',
    label: 'Modèle Spécialisé (1B)',
    shortLabel: 'Modèle Spécialisé',
    icon: Cpu,
    whPerReq: 0.05,
    strength: 'Classification & tri ciblé à 98,5 % de précision'
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
    id: 'alerts',
    title: '1. Alertes sur seuils de pression des capteurs',
    volumeLabel: '4 000 000 req/jour',
    volumePerDay: 4_000_000,
    requirement: 'Déclencher une alerte dès que la pression descend sous 3,8 bar.',
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
  },
  {
    id: 'blacklist',
    title: '4. Filtrage d\'URLs malveillantes connues',
    volumeLabel: '10 000 000 req/jour',
    volumePerDay: 10_000_000,
    requirement: 'Vérification exacte par mots-clés et liste noire fixe.',
    expected: 'heuristic'
  }
];

const QUALITY_MATRIX: Record<TaskFlow['id'], Record<ArchId, number>> = {
  alerts: { heuristic: 100, specialized: 98, llm: 97 },
  tickets: { heuristic: 52, specialized: 98, llm: 99 },
  legal: { heuristic: 18, specialized: 58, llm: 97 },
  blacklist: { heuristic: 100, specialized: 97, llm: 96 }
};

const TARGET_MIN_QUALITY = 95;

export default function Level6({ onComplete, onScoreUpdate, onMistake }: { onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [assignments, setAssignments] = useState<Partial<Record<TaskFlow['id'], ArchId>>>({});
  const [measured, setMeasured] = useState<{ dailyKwh: number; avgQuality: number } | null>(null);
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
    setMeasured(null);
    clearError();
  };

  const checkAnswer = () => {
    if (!allAssigned) return;

    setMeasured({ dailyKwh, avgQuality });
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
    if (dailyKwh > 50) {
      triggerError("Surcharge énergétique : vous utilisez une architecture surdimensionnée sur un flux massif (une même architecture sobre peut servir plusieurs fois).");
    } else {
      triggerError("Qualité insuffisante : un outil trop simple échoue à comprendre ou synthétiser ces données.");
    }
    onMistake?.();
  };

  return (
    <LevelShell>
      <LevelHeader level={6} icon={GitFork} />

      <div className="mb-3 space-y-2">
        <HydraLog
          status="hostile"
          message="Routage par défaut actif : 100 % des requêtes dirigées vers le LLM 175B (36 255 kWh/jour)."
        />
        <NaiaDialogue
          message={
            <>
              HYDRA envoie encore toutes ses requêtes vers un énorme <TechTerm term="LLM" />, même pour de simples filtres ! La télémétrie se met à jour lorsque vous testez le déploiement.
            </>
          }
          objective={
            <>
              Associez chacun des 4 flux à l'architecture adaptée (une même architecture peut servir plusieurs fois) pour rester sous <strong className="font-mono text-white">50 kWh/jour</strong> avec au moins <strong className="font-mono text-white">{TARGET_MIN_QUALITY} % de qualité</strong>.
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

        {/* Telemetry Gauges (measured on deployment test to prevent blind click trial-and-error) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Consommation mesurée
              </span>
              <span className={`text-base sm:text-lg font-black font-mono tabular-nums ${
                isSuccess
                  ? 'text-emerald-400'
                  : measured === null
                  ? 'text-slate-500'
                  : measured.dailyKwh > 50
                  ? 'text-red-400'
                  : 'text-cyan-300'
              }`}>
                {measured === null
                  ? '--- kWh/j'
                  : `${measured.dailyKwh.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kWh/j`}
                <span className="text-[11px] font-sans font-normal text-slate-400 ml-1.5">(max 50)</span>
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full border border-slate-800 relative">
              <div className="w-full h-full rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isSuccess
                      ? 'bg-emerald-500'
                      : measured === null
                      ? 'bg-slate-700'
                      : measured.dailyKwh > 50
                      ? 'bg-red-500'
                      : 'bg-cyan-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: measured !== null ? `${Math.min((measured.dailyKwh / 100) * 100, 100)}%` : '0%' }}
                  transition={{ duration: 0.35 }}
                />
              </div>
              <div
                className="absolute -top-0.5 -bottom-0.5 w-0.5 -translate-x-1/2 bg-amber-400 z-10"
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
              <span className={`text-base sm:text-lg font-black font-mono tabular-nums ${
                isSuccess
                  ? 'text-emerald-400'
                  : measured === null
                  ? 'text-slate-500'
                  : measured.avgQuality < TARGET_MIN_QUALITY
                  ? 'text-red-400'
                  : 'text-cyan-300'
              }`}>
                {measured === null ? '-- %' : `${measured.avgQuality} %`}
                <span className="text-[11px] font-sans font-normal text-slate-400 ml-1.5">(min {TARGET_MIN_QUALITY} %)</span>
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full border border-slate-800 relative">
              <div className="w-full h-full rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isSuccess
                      ? 'bg-emerald-500'
                      : measured === null
                      ? 'bg-slate-700'
                      : measured.avgQuality < TARGET_MIN_QUALITY
                      ? 'bg-red-500'
                      : 'bg-cyan-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: measured !== null ? `${measured.avgQuality}%` : '0%' }}
                  transition={{ duration: 0.35 }}
                />
              </div>
              <div
                className="absolute -top-0.5 -bottom-0.5 w-0.5 -translate-x-1/2 bg-amber-400 z-10"
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
                        className={`px-2.5 py-2 rounded-lg border text-[11px] font-bold transition-all active:scale-[0.98] ${
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
            <ActionButton
              onClick={checkAnswer}
              disabled={!allAssigned}
              isError={isErrorFlash}
            >
              DÉPLOYER LE ROUTAGE
            </ActionButton>
          </div>
        )}

        <AnimatePresence>
          {isSuccess && (
            <LevelSuccessCard
              title="ROUTAGE SOBRE ACTIVÉ (44 kWh/jour)"
              description={
                <>
                  C'est la <strong>Sobriété Algorithmique</strong> (Green AI) : sans <TechTerm term="IA" /> quand des règles suffisent, un petit modèle spécialisé pour trier efficacement, et le grand <TechTerm term="LLM" /> réservé aux rares analyses complexes !
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
