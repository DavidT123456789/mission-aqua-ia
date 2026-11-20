import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Home, Droplets, ArrowUp, ArrowDown, RefreshCw, Wind, Server, ArrowRight, Thermometer } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import LevelHeader from '../components/LevelHeader';
import LevelShell from '../components/LevelShell';
import ActionButton from '../components/ActionButton';
import LevelSuccessCard from '../components/LevelSuccessCard';
import Collapsible from '../components/Collapsible';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

interface LoopStep {
  id: number;
  label: string;
  detail: string;
  tempBadge: string;
}

const CORRECT_LOOP_STEPS: LoopStep[] = [
  { id: 1, label: 'Échangeur côté serveurs', detail: 'L\'eau du circuit interne capte la chaleur dégagée par les baies informatiques.', tempBadge: '25 → 65 °C' },
  { id: 2, label: 'Conduite isolée haute température', detail: 'L\'eau chaude est acheminée sous terre vers les immeubles voisins sans déperdition.', tempBadge: '62 °C' },
  { id: 3, label: 'Échangeur côté logements', detail: 'La chaleur est transférée au réseau de chauffage et d\'eau chaude des habitants.', tempBadge: '62 → 28 °C' },
  { id: 4, label: 'Conduite froide en boucle fermée', detail: 'L\'eau refroidie circule vers le datacenter en conduite étanche, sans contact avec l\'air.', tempBadge: '25 °C ↺' }
];

// Ordre initial volontairement mélangé (non résolu)
const INITIAL_LOOP_ORDER: LoopStep[] = [
  CORRECT_LOOP_STEPS[2],
  CORRECT_LOOP_STEPS[0],
  CORRECT_LOOP_STEPS[3],
  CORRECT_LOOP_STEPS[1]
];

type OutletId = 'towers' | 'river' | 'district_heating';

const OUTLETS: {
  id: OutletId;
  name: string;
  icon: typeof Flame;
  principle: string;
  destination: string;
  loss: string;
  recovery: string;
}[] = [
  {
    id: 'towers',
    name: 'Aéroréfrigérants humides',
    icon: Wind,
    principle: 'Échange thermique par évaporation',
    destination: 'Dispersion de vapeur dans l\'atmosphère',
    loss: 'Évaporation continue',
    recovery: '0 % récupérée'
  },
  {
    id: 'river',
    name: 'Prélèvement fluvial ouvert',
    icon: Droplets,
    principle: 'Pompage et rejet sur cours d\'eau',
    destination: 'Évacuation d\'eau tiède en aval',
    loss: 'Réchauffement fluvial',
    recovery: '0 % récupérée'
  },
  {
    id: 'district_heating',
    name: 'Réseau de chaleur urbain',
    icon: Home,
    principle: 'Échangeur thermique en boucle fermée',
    destination: 'Chauffage des logements voisins',
    loss: 'Circuit fermé (≈ 0 %)',
    recovery: '85 % valorisée'
  }
];

export default function Level8({ onComplete, onScoreUpdate, onMistake }: { onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
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
      soundManager.playStep();
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
    <LevelShell>
      <LevelHeader
        level={8}
        icon={Flame}
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
                ? "Dissipation thermique urbaine à 65 °C : rejet direct par évaporation actif en attente de raccordement."
                : "Raccordement au réseau de chaleur urbain détecté. Validation de l'ordre du circuit fermé requise.",
          }}
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
          hintStep={phase}
        />
      </div>

      <div className="space-y-4 text-slate-300">
        {/* Step 1: Outlet choice (de-boxed cleanly to reduce nested borders) */}
        <div className={`transition-opacity ${phase === 2 ? 'opacity-85' : ''}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2.5 px-0.5">
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
                  } ${phase === 2 ? 'cursor-default' : 'active:scale-[0.985]'}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isSelected ? (phase === 2 ? 'text-emerald-400' : 'text-cyan-400') : 'text-slate-400'}`} />
                    <span className="font-bold text-sm text-white">{outlet.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    {phase === 2 ? (
                      <>
                        <div>Eau : <span className="text-slate-200">{outlet.loss}</span></div>
                        <div>Énergie : <span className="text-slate-200">{outlet.recovery}</span></div>
                      </>
                    ) : (
                      <>
                        <div>Principe : <span className="text-slate-200">{outlet.principle}</span></div>
                        <div>Sortie : <span className="text-slate-200">{outlet.destination}</span></div>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Sortable closed loop sequence (revealed smoothly once Step 1 is validated) */}
        <Collapsible isOpen={phase === 2}>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  2. Remettez dans l'ordre les 4 étapes du cycle fermé :
                </h3>
              </div>

              {/* Schéma synoptique de la boucle fermée (lieux et températures révélés une fois l'ordre validé) */}
              <div className="mb-4 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 text-center">
                  {isSuccess
                    ? 'Boucle validée : 65 °C (Serveurs) → 62 °C (Aller) → 28 °C (Logements) → 25 °C (Retour fermé)'
                    : 'Aperçu de votre séquence (reconstituez le cycle thermique en circuit fermé)'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                  {steps.map((s, idx) => {
                    const revealedSlotLabels = ['1. Datacenter', '2. Conduite Aller', '3. Quartier', '4. Conduite Retour'];
                    return (
                      <div key={`schema-${s.id}`} className="flex items-center gap-1.5">
                        <div className={`flex-1 px-2.5 py-2 rounded-lg border text-center transition-colors ${
                          isSuccess
                            ? idx < 2
                              ? 'bg-orange-950/35 border-orange-500/45 text-orange-200'
                              : idx === 2
                                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                                : 'bg-cyan-950/35 border-cyan-500/45 text-cyan-200'
                            : 'bg-slate-950 border-slate-700 text-slate-300'
                        }`}>
                          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                            {isSuccess && idx === 0 && <Server className="w-3 h-3 text-orange-400" />}
                            {isSuccess && idx === 2 && <Home className="w-3 h-3 text-emerald-400" />}
                            <span>{isSuccess ? revealedSlotLabels[idx] : `Étape ${idx + 1}`}</span>
                          </div>
                          <div className="text-[11px] font-bold truncate">{s.label}</div>
                          {isSuccess && (
                            <div className={`mt-1 inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              idx < 2 ? 'bg-orange-500/15 text-orange-300' : idx === 2 ? 'bg-amber-500/15 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'
                            }`}>
                              <Thermometer className="w-2.5 h-2.5" />
                              {s.tempBadge}
                            </div>
                          )}
                        </div>
                        {idx < steps.length - 1 && (
                          <ArrowRight className={`hidden sm:block w-3.5 h-3.5 shrink-0 ${isSuccess ? (idx === 0 ? 'text-orange-400' : idx === 1 ? 'text-amber-400' : 'text-cyan-400') : 'text-slate-600'}`} />
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
            </div>
        </Collapsible>

        {!isSuccess && (
          <div className="flex justify-center mt-4">
            <ActionButton
              onClick={phase === 1 ? validateOutlet : checkAnswer}
              disabled={phase === 1 && !selectedOutlet}
              isError={isErrorFlash}
            >
              {phase === 1 ? 'VALIDER LE RACCORDEMENT' : 'ACTIVER LA BOUCLE THERMIQUE'}
            </ActionButton>
          </div>
        )}

        <AnimatePresence>
          {isSuccess && (
            <LevelSuccessCard
              title="RÉSEAU DE CHALEUR RACCORDÉ"
              description={
                <>
                  Parfait ! En raccordant le <TechTerm term="Datacenter">datacenter</TechTerm> au réseau de chaleur urbain en boucle fermée, l'eau chaude chauffe les habitations puis revient refroidie sans aucune évaporation. Zéro gaspillage d'eau et 85 % de chaleur valorisée !
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
