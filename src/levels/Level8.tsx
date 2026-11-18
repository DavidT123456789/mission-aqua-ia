import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, CheckCircle2, Home, Droplets, ArrowUp, ArrowDown, RefreshCw, Wind, Server, ArrowRight } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

interface LoopStep {
  id: number;
  label: string;
  detail: string;
}

const CORRECT_LOOP_STEPS: LoopStep[] = [
  { id: 1, label: 'Captage thermique', detail: 'L\'eau du circuit absorbe la chaleur dégagée par les serveurs via un échangeur interne.' },
  { id: 2, label: 'Acheminement isolé', detail: 'L\'eau circule dans des conduites souterraines isolées en direction du quartier.' },
  { id: 3, label: 'Transfert aux logements', detail: 'Un second échangeur transmet la chaleur au chauffage et à l\'eau chaude des habitants.' },
  { id: 4, label: 'Retour en boucle fermée', detail: 'Après avoir cédé ses calories, l\'eau repart par une conduite dédiée sans contact avec l\'air.' }
];

// Ordre initial volontairement mélangé (non résolu)
const INITIAL_LOOP_ORDER: LoopStep[] = [
  CORRECT_LOOP_STEPS[2],
  CORRECT_LOOP_STEPS[0],
  CORRECT_LOOP_STEPS[3],
  CORRECT_LOOP_STEPS[1]
];

type OutletId = 'towers' | 'river' | 'district_heating';

const OUTLETS: { id: OutletId; name: string; icon: typeof Flame; loss: string; recovery: string }[] = [
  { id: 'towers', name: 'Tours d\'évaporation', icon: Wind, loss: 'Évaporation continue', recovery: '0% récupérée' },
  { id: 'river', name: 'Rejet en rivière', icon: Droplets, loss: 'Réchauffement fluvial', recovery: '0% récupérée' },
  { id: 'district_heating', name: 'Réseau de chaleur urbain', icon: Home, loss: 'Circuit fermé (≈ 0%)', recovery: '85% valorisée' }
];

export default function Level8({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [phase, setPhase] = useState<1 | 2>(1);
  const [steps, setSteps] = useState<LoopStep[]>(INITIAL_LOOP_ORDER);
  const [selectedOutlet, setSelectedOutlet] = useState<OutletId | null>(null);
  const { errorMsg, isErrorFlash, triggerError, clearError } = useErrorFeedback();
  const [hasScored, setHasScored] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const moveStep = (index: number, direction: -1 | 1) => {
    if (isSuccess) return;
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    soundManager.playClick();
    setSteps(prev => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    clearError();
  };

  const validateOutlet = () => {
    if (!selectedOutlet) return;
    if (selectedOutlet === 'district_heating') {
      soundManager.playSuccess();
      clearError();
      setPhase(2);
    } else {
      triggerError("Ce raccordement gaspille de l'eau ou rejette la chaleur sans la valoriser.");
      onMistake?.();
    }
  };

  const checkAnswer = () => {
    const isOrderCorrect = steps.every((s, idx) => s.id === idx + 1);

    if (isOrderCorrect) {
      setIsSuccess(true);
      clearError();
      soundManager.playSuccess();
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(200, 70);
      }
      return;
    }

    triggerError("L'ordre des 4 étapes du cycle fermé n'est pas logique. Suivez le trajet de l'eau !");
    onMistake?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-2xl max-w-4xl mx-auto relative flex flex-col backdrop-blur-xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)]"
    >
      <div className="flex items-center justify-between gap-3 mb-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <Flame className="w-7 h-7 text-emerald-400 shrink-0" />
          <h2 className="font-mono text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
            Niveau 8 : Valorisation Thermique
          </h2>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-slate-950 border border-cyan-500/30 text-cyan-300 shrink-0">
          Étape {phase} / 2
        </span>
      </div>

      <div className="mb-3">
        <NaiaDialogue
          message={
            phase === 1 ? (
              <>
                Les entraînements lourds sont délocalisés à Luleå, mais les <TechTerm term="Serveur">serveurs</TechTerm> locaux restés en ville dissipent encore une chaleur immense.
              </>
            ) : (
              <>
                Excellent choix ! Le réseau de chaleur urbain fonctionne en circuit fermé sans évaporation d'eau.
              </>
            )
          }
          objective={
            phase === 1
              ? "Choisissez d'abord le bon raccordement de sortie pour supprimer l'évaporation sur place."
              : 'Ordonnez maintenant les 4 étapes de cette boucle thermique grâce aux flèches.'
          }
          reaction={errorMsg ? { message: errorMsg, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={isSuccess ? 'happy' : 'neutral'}
        />
      </div>

      <div className="space-y-5 text-slate-300">
        {/* Step 1: Outlet choice */}
        <div className={`bg-slate-950/70 border rounded-xl p-4 transition-opacity ${phase === 2 ? 'border-emerald-500/40 opacity-85' : 'border-slate-800'}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
            1. Choisissez le raccordement du circuit :
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {OUTLETS.map((outlet) => {
              const Icon = outlet.icon;
              const isSelected = selectedOutlet === outlet.id;
              return (
                <button
                  key={outlet.id}
                  type="button"
                  disabled={phase === 2 || isSuccess}
                  onClick={() => { soundManager.playClick(); setSelectedOutlet(outlet.id); clearError(); }}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col gap-2 ${
                    isSelected
                      ? phase === 2
                        ? 'bg-emerald-950/30 border-emerald-400'
                        : 'bg-cyan-950/30 border-cyan-400'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'
                  } ${phase === 2 ? 'cursor-default' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isSelected ? (phase === 2 ? 'text-emerald-400' : 'text-cyan-400') : 'text-slate-400'}`} />
                    <span className="font-bold text-sm text-white">{outlet.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <div>Eau : <span className="text-slate-200">{outlet.loss}</span></div>
                    <div>Énergie : <span className="text-slate-200">{outlet.recovery}</span></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Sortable closed loop sequence (revealed once Step 1 is validated) */}
        <AnimatePresence>
          {phase === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  2. Remettez dans l'ordre les 4 étapes du cycle fermé :
                </h3>
              </div>

              {/* Schéma synoptique de la boucle fermée */}
              <div className="mb-4 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 text-center">
                  Schéma de la boucle : Datacenter → Conduite Aller → Logements → Conduite Retour
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                  {steps.map((s, idx) => {
                    const slotLabels = ['1. Datacenter', '2. Conduite Aller', '3. Quartier', '4. Conduite Retour'];
                    return (
                      <div key={`schema-${s.id}`} className="flex items-center gap-1.5">
                        <div className={`flex-1 px-2.5 py-2 rounded-lg border text-center transition-colors ${
                          isSuccess
                            ? idx < 2
                              ? 'bg-orange-950/30 border-orange-500/40 text-orange-200'
                              : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                            : 'bg-slate-950 border-slate-700 text-slate-300'
                        }`}>
                          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                            {idx === 0 && <Server className="w-3 h-3 text-orange-400" />}
                            {idx === 2 && <Home className="w-3 h-3 text-emerald-400" />}
                            <span>{slotLabels[idx]}</span>
                          </div>
                          <div className="text-[11px] font-bold truncate">{s.label}</div>
                        </div>
                        {idx < steps.length - 1 && (
                          <ArrowRight className="hidden sm:block w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                {steps.map((stepItem, index) => (
                  <motion.div
                    layout
                    key={stepItem.id}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-bold text-sm text-white">{stepItem.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{stepItem.detail}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0 || isSuccess}
                        onClick={() => moveStep(index, -1)}
                        aria-label={`Monter l'étape ${stepItem.label}`}
                        className={`p-2 rounded-lg border transition-colors ${
                          index === 0 || isSuccess
                            ? 'bg-slate-950 border-slate-800 text-slate-700 cursor-not-allowed'
                            : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-cyan-900/50 hover:border-cyan-400'
                        }`}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === steps.length - 1 || isSuccess}
                        onClick={() => moveStep(index, 1)}
                        aria-label={`Descendre l'étape ${stepItem.label}`}
                        className={`p-2 rounded-lg border transition-colors ${
                          index === steps.length - 1 || isSuccess
                            ? 'bg-slate-950 border-slate-800 text-slate-700 cursor-not-allowed'
                            : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-cyan-900/50 hover:border-cyan-400'
                        }`}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isSuccess && (
          <div className="flex justify-center mt-4">
            <button
              onClick={phase === 1 ? validateOutlet : checkAnswer}
              disabled={phase === 1 && !selectedOutlet}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                phase === 1 && !selectedOutlet
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : isErrorFlash
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]'
              }`}
            >
              {phase === 1 ? 'VALIDER LE RACCORDEMENT' : 'ACTIVER LA BOUCLE THERMIQUE'}
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
                SYMBIOSE URBAINE ÉTABLIE
              </div>
              <p className="text-center mb-6 text-sm">
                Parfait ! En raccordant le <TechTerm term="Datacenter">data center</TechTerm> au réseau de chaleur urbain en boucle fermée, l'eau chaude chauffe les habitations puis revient refroidie sans aucune évaporation. Zéro gaspillage d'eau et 85% de chaleur valorisée !
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
