import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, Trash2, Archive, Cpu, MemoryStick, HardDrive, Recycle, RefreshCw, Microchip, Tag, Droplets } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import HydraLog from '../components/HydraLog';
import TechTerm from '../components/TechTerm';
import LevelHeader from '../components/LevelHeader';
import LevelShell from '../components/LevelShell';
import ActionButton from '../components/ActionButton';
import LevelSuccessCard from '../components/LevelSuccessCard';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

type ComponentId = 'cpu' | 'ram' | 'nvme' | 'gpu';
type ActionId = 'replace_all' | 'repair_ram' | 'refurbished';
type DisposalId = 'resale' | 'backup' | 'weee';

const HARDWARE_LOGS: {
  id: ComponentId;
  name: string;
  icon: typeof Cpu;
  metrics: { id: string; label: string; value: string }[];
  logLine: string;
}[] = [
  {
    id: 'cpu',
    name: 'Processeur (CPU)',
    icon: Cpu,
    metrics: [
      { id: 'temp', label: 'Temp.', value: '64°C (max 95°C)' },
      { id: 'load', label: 'Charge', value: '42 %' }
    ],
    logLine: '[KERNEL] Régulation thermique nominale, 0 erreur matérielle détectée.'
  },
  {
    id: 'ram',
    name: 'Mémoire Vive (RAM ECC)',
    icon: MemoryStick,
    metrics: [
      { id: 'temp', label: 'Temp.', value: '49°C (max 85°C)' },
      { id: 'parity', label: 'Parité', value: '4 820 corr./min' }
    ],
    logLine: '[EDAC] Échec critique de lecture mémoire impossible à corriger sur la barrette DIMM_B2.'
  },
  {
    id: 'nvme',
    name: 'Disque Stockage (NVMe)',
    icon: HardDrive,
    metrics: [
      { id: 'health', label: 'Santé disque', value: '96 %' },
      { id: 'latency', label: 'Latence', value: '0,4 ms' }
    ],
    logLine: '[NVME] Disque sain : 0 erreur média, 0 secteur réalloué.'
  },
  {
    id: 'gpu',
    name: 'Carte Calcul IA (GPU)',
    icon: Microchip,
    metrics: [
      { id: 'temp', label: 'Temp.', value: '84°C (max 90°C)' },
      { id: 'vram', label: 'VRAM ECC', value: '0 erreur' }
    ],
    logLine: '[GPU-MON] Calcul IA actif (94 % de charge), chauffe normale, 0 erreur VRAM.'
  }
];

export default function Level7({ onComplete, onScoreUpdate, onMistake }: { onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedComponent, setSelectedComponent] = useState<ComponentId | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionId | null>(null);
  const [selectedDisposal, setSelectedDisposal] = useState<DisposalId | null>(null);
  const { errorMsg: feedback, isErrorFlash, triggerError: showErrorMsg, clearError } = useErrorFeedback();
  const [hasScored, setHasScored] = useState(false);

  const triggerError = (msg: string) => {
    showErrorMsg(msg);
    onMistake?.();
  };

  const handleValidateStep1 = () => {
    if (!selectedComponent) return;
    if (selectedComponent === 'ram') {
      soundManager.playStep();
      clearError();
      setStep(2);
    } else if (selectedComponent === 'cpu') {
      triggerError("Le processeur est à 64°C (largement sous la limite de 95°C) et n'a aucune erreur.");
    } else if (selectedComponent === 'gpu') {
      triggerError("Faux positif ! Le GPU chauffe (84°C, sous la limite de 90°C) à cause d'un entraînement IA en cours, mais affiche 0 erreur VRAM : il fonctionne.");
    } else {
      triggerError("Le disque NVMe affiche 96% de santé disque et 0 secteur réalloué : il est sain.");
    }
  };

  const handleValidateStep2 = () => {
    if (!selectedAction) return;
    if (selectedAction === 'repair_ram') {
      soundManager.playStep();
      clearError();
      setStep(3);
    } else if (selectedAction === 'replace_all') {
      triggerError("Gaspillage critique (1 200 L d'eau) : le processeur, le GPU et le stockage fonctionnent encore !");
    } else {
      triggerError("Mieux que le neuf, mais remplacer tout le serveur (180 L) reste superflu pour une seule barrette défaillante (15 L).");
    }
  };

  const handleValidateStep3 = () => {
    if (!selectedDisposal) return;
    if (selectedDisposal === 'weee') {
      soundManager.playSuccess();
      clearError();
      setStep(4);
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(200, 63);
      }
    } else if (selectedDisposal === 'backup') {
      triggerError("Piège courant (l'effet tiroir) ! Stocker une barrette HS « en réserve » immobilise ses métaux critiques et oblige à en extraire de nouveaux.");
    } else {
      triggerError("Fausse bonne idée ! Revendre un composant en erreur critique (EDAC) sans test ni réparation ne fait que déplacer la panne et le déchet ailleurs.");
    }
  };

  return (
    <LevelShell compact>
      <LevelHeader level={7} icon={Wrench} compact />

      <div className="mb-3 space-y-2">
        {step === 1 && (
          <HydraLog status="warning" message="Erreur matérielle sur nœud local. Commande automatique d'un serveur neuf initiée..." />
        )}
        <NaiaDialogue
          message={
            step === 1 ? (
              <>
                Un des <TechTerm term="Serveur">serveurs</TechTerm> locaux d'HYDRA plante. Par défaut, elle veut commander une machine neuve — soit <strong className="text-white">1 200 L</strong> d'<TechTerm term="Eau virtuelle">eau virtuelle</TechTerm> pour graver les puces (<TechTerm term="CPU">CPU</TechTerm> et <TechTerm term="GPU">GPU</TechTerm>) !
              </>
            ) : step === 2 ? (
              <>
                Bien vu : seule la barrette mémoire (<TechTerm term="RAM">RAM</TechTerm>) génère des erreurs critiques.
              </>
            ) : step === 3 ? (
              <>
                La barrette est remplacée (<strong className="text-white">15 L</strong> d'<TechTerm term="Eau virtuelle">eau virtuelle</TechTerm> contre <strong className="text-white">1 200 L</strong> pour un serveur neuf) et la machine redémarre ! Que faire maintenant de l'ancien module défectueux ?
              </>
            ) : (
              <>
                Parfait ! En ciblant uniquement la barrette défaillante et en la recyclant via la filière <TechTerm term="DEEE">DEEE</TechTerm>, vous évitez le gaspillage d'un serveur neuf.
              </>
            )
          }
          objective={
            step === 1
              ? 'Inspectez les 4 journaux système et sélectionnez le composant réellement en panne.'
              : step === 2
              ? 'Choisissez l’intervention la plus sobre en eau et en matières premières.'
              : step === 3
              ? 'Sélectionnez la filière adaptée pour ce composant électronique hors service.'
              : undefined
          }
          reaction={feedback ? { message: feedback, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={step === 4 ? 'happy' : 'neutral'}
        />
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-[11px] font-mono">
        {[
          { num: 1, label: '1. Diagnostic Logs' },
          { num: 2, label: '2. Intervention' },
          { num: 3, label: '3. Fin de vie' }
        ].map(s => (
          <div
            key={s.num}
            className={`px-3 py-2 rounded-lg border text-center font-bold transition-colors ${
              step > s.num
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                : step === s.num
                ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-600'
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      <div className="space-y-4 text-slate-300">
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {HARDWARE_LOGS.map((comp) => {
                const Icon = comp.icon;
                const isSelected = selectedComponent === comp.id;
                return (
                  <div
                    key={comp.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => { soundManager.playClick(); setSelectedComponent(comp.id); clearError(); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        soundManager.playClick();
                        setSelectedComponent(comp.id);
                        clearError();
                      }
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col gap-2 cursor-pointer active:scale-[0.985] focus:outline-none focus:ring-2 focus:ring-cyan-400/70 ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-400'
                        : 'bg-slate-950/90 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span className="font-bold text-white text-sm">{comp.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                        {comp.metrics.map(m => (
                          <span key={m.id} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {m.label} : <strong className="text-white">{m.value}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs font-mono text-slate-300 bg-slate-900/90 px-2.5 py-2 rounded-lg border border-slate-800/80 leading-snug">
                      {comp.logLine}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center pt-1">
              <ActionButton
                onClick={handleValidateStep1}
                disabled={!selectedComponent}
                isError={isErrorFlash}
                size="md"
              >
                CONFIRMER LE DIAGNOSTIC
              </ActionButton>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'replace_all' as ActionId,
                  name: 'Serveur neuf complet',
                  icon: Trash2,
                  desc: 'Remplacer toute la machine (CPU, GPU, RAM, disque) par un modèle neuf.'
                },
                {
                  id: 'repair_ram' as ActionId,
                  name: 'Remplacer la RAM',
                  icon: Wrench,
                  desc: 'Changer uniquement la barrette DIMM_B2 défectueuse et conserver le reste.'
                },
                {
                  id: 'refurbished' as ActionId,
                  name: 'Serveur reconditionné',
                  icon: RefreshCw,
                  desc: 'Remplacer l\'intégralité du serveur par une machine d\'occasion.'
                }
              ].map((act) => {
                const Icon = act.icon;
                const isSelected = selectedAction === act.id;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => { soundManager.playClick(); setSelectedAction(act.id); clearError(); }}
                    className={`p-5 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-3 active:scale-[0.985] ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-400 scale-[1.02]'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="p-3 rounded-full bg-slate-900">
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    </div>
                    <h3 className="font-bold text-white text-sm">{act.name}</h3>
                    <p className="text-xs text-slate-400 flex-1">{act.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center pt-2">
              <ActionButton
                onClick={handleValidateStep2}
                disabled={!selectedAction}
                isError={isErrorFlash}
                size="md"
              >
                EXÉCUTER L'INTERVENTION
              </ActionButton>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            {/* Comparatif visuel d'eau virtuelle économisée */}
            <div className="bg-slate-950/85 border border-emerald-500/30 rounded-xl p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 shrink-0" />
                  Eau virtuelle économisée grâce à la réparation ciblée
                </span>
                <span className="font-mono font-black text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                  -1 185 L (-98,8 %)
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center gap-2.5">
                  <span className="w-28 text-slate-400 shrink-0">Serveur neuf</span>
                  <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full w-full bg-red-500/75 rounded-full" />
                  </div>
                  <span className="w-16 text-right text-red-300 font-bold shrink-0">1 200 L</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-28 text-emerald-300 shrink-0">Barrette RAM</span>
                  <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full w-[2%] min-w-[6px] bg-emerald-400 rounded-full" />
                  </div>
                  <span className="w-16 text-right text-emerald-300 font-bold shrink-0">15 L</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'backup' as DisposalId,
                  name: 'Stocker en réserve « au cas où »',
                  icon: Archive,
                  desc: 'Ranger la barrette défectueuse dans une armoire technique au cas où elle pourrait encore servir un jour.'
                },
                {
                  id: 'resale' as DisposalId,
                  name: 'Revente en lot non testé',
                  icon: Tag,
                  desc: 'Revendre le module tel quel sur un site d\'occasion pour éviter de le mettre au rebut.'
                },
                {
                  id: 'weee' as DisposalId,
                  name: 'Filière de recyclage DEEE',
                  icon: Recycle,
                  desc: 'Envoyer le composant défectueux vers une filière spécialisée pour dépolluer et extraire or, cuivre et métaux critiques.'
                }
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedDisposal === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { soundManager.playClick(); setSelectedDisposal(opt.id); clearError(); }}
                    className={`p-5 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-3 active:scale-[0.985] ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-400 scale-[1.02]'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="p-3 rounded-full bg-slate-900">
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    </div>
                    <h3 className="font-bold text-white text-sm">{opt.name}</h3>
                    <p className="text-xs text-slate-400 flex-1 leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center pt-2">
              <ActionButton
                onClick={handleValidateStep3}
                disabled={!selectedDisposal}
                isError={isErrorFlash}
                size="md"
              >
                CLÔTURER LE TICKET
              </ActionButton>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {step === 4 && (
            <LevelSuccessCard
              title="MAINTENANCE CIRCULAIRE VALIDÉE"
              description={
                <>
                  Plus de 70 % de l'empreinte écologique d'un matériel informatique provient de sa fabrication (dont l'eau ultra-pure nécessaire à la gravure des puces et <TechTerm term="GPU">GPU</TechTerm>). En ciblant la panne réelle et en recyclant la pièce via les <TechTerm term="DEEE">DEEE</TechTerm>, vous avez économisé 1 185 litres d'<TechTerm term="Eau virtuelle">eau virtuelle</TechTerm> !
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
