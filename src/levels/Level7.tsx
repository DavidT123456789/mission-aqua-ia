import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Server, CheckCircle2, AlertTriangle, Wrench, Trash2, Cpu, MemoryStick, HardDrive, Recycle, Terminal, Zap } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import HydraLog from '../components/HydraLog';
import TechTerm from '../components/TechTerm';
import { soundManager } from '../utils/soundManager';

type ComponentId = 'cpu' | 'ram' | 'nvme' | 'gpu';
type ActionId = 'replace_all' | 'repair_ram' | 'refurbished';
type DisposalId = 'trash' | 'weee';

const HARDWARE_LOGS: {
  id: ComponentId;
  name: React.ReactNode;
  icon: typeof Cpu;
  metrics: { id: string; label: React.ReactNode; value: string }[];
  logLine: string;
  logPlain: string;
}[] = [
  {
    id: 'cpu',
    name: <>Processeur (<TechTerm term="CPU">CPU</TechTerm>)</>,
    icon: Cpu,
    metrics: [
      { id: 'temp', label: 'Temp.', value: '64°C (max 95°C)' },
      { id: 'load', label: 'Charge', value: '42%' }
    ],
    logLine: '[KERNEL] CPU0-15: thermal throttling nominal, 0 machine-check exception.',
    logPlain: 'Traduction : régulation thermique normale, aucune erreur matérielle.'
  },
  {
    id: 'ram',
    name: <>Mémoire Vive (<TechTerm term="RAM">RAM</TechTerm> ECC)</>,
    icon: MemoryStick,
    metrics: [
      { id: 'temp', label: 'Temp.', value: '49°C (max 85°C)' },
      { id: 'parity', label: 'Parité', value: '4 820 corr./min' }
    ],
    logLine: '[EDAC] MC0: uncorrectable page read failure on DIMM_B2 (addr 0x7FF4A0).',
    logPlain: 'Traduction : échec critique de lecture mémoire impossible à corriger sur la barrette B2.'
  },
  {
    id: 'nvme',
    name: 'Disque Stockage (NVMe)',
    icon: HardDrive,
    metrics: [
      { id: 'health', label: 'Santé disque', value: '96%' },
      { id: 'latency', label: <TechTerm term="Latence" />, value: '0.4 ms' }
    ],
    logLine: '[NVME] nvme0n1: 0 media errors, 0 reallocated sectors.',
    logPlain: 'Traduction : aucune erreur disque ni secteur défectueux détecté.'
  },
  {
    id: 'gpu',
    name: <>Carte Calcul IA (<TechTerm term="GPU">GPU</TechTerm>)</>,
    icon: Zap,
    metrics: [
      { id: 'temp', label: 'Temp.', value: '58°C (max 90°C)' },
      { id: 'vram', label: 'VRAM ECC', value: '0 erreur' }
    ],
    logLine: '[GPU-MON] GPU0: compute cores nominal, 0 uncorrected VRAM error.',
    logPlain: 'Traduction : processeur graphique sain, aucune erreur de calcul ni mémoire vidéo.'
  }
];

export default function Level7({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedComponent, setSelectedComponent] = useState<ComponentId | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionId | null>(null);
  const [selectedDisposal, setSelectedDisposal] = useState<DisposalId | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasScored, setHasScored] = useState(false);

  const triggerError = (msg: string) => {
    setFeedback(msg);
    onMistake?.();
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleValidateStep1 = () => {
    if (!selectedComponent) return;
    if (selectedComponent === 'ram') {
      soundManager.playSuccess();
      setFeedback(null);
      setStep(2);
    } else if (selectedComponent === 'cpu') {
      triggerError("Le processeur est à 64°C (largement sous la limite de 95°C) et n'a aucune erreur.");
    } else if (selectedComponent === 'gpu') {
      triggerError("Le GPU est à 58°C avec 0 erreur VRAM : inutile de le remplacer, sa gravure coûte énormément d'eau ultra-pure !");
    } else {
      triggerError("Le disque NVMe affiche 96% de santé disque et 0 secteur réalloué : il est sain.");
    }
  };

  const handleValidateStep2 = () => {
    if (!selectedAction) return;
    if (selectedAction === 'repair_ram') {
      soundManager.playSuccess();
      setFeedback(null);
      setStep(3);
    } else if (selectedAction === 'replace_all') {
      triggerError("Gaspillage critique (1 200 L d'eau) : le processeur et le stockage fonctionnent encore !");
    } else {
      triggerError("Mieux que le neuf, mais changer tout le serveur (180 L) reste superflu pour une seule barrette défaillante.");
    }
  };

  const handleValidateStep3 = () => {
    if (!selectedDisposal) return;
    if (selectedDisposal === 'weee') {
      soundManager.playSuccess();
      setFeedback(null);
      setStep(4);
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(150, 63);
      }
    } else {
      triggerError("Attention ! Les cartes électroniques incinérées ou enfouies libèrent des métaux lourds dans les nappes d'eau.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900 border-transparent sm:border-cyan-500/20 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-xl max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      <div className="flex items-center justify-between gap-3 mb-3 border-b border-cyan-900/50 pb-3">
        <div className="flex items-center gap-3">
          <Server className="w-8 h-8 text-emerald-400" />
          <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
            Niveau 7 : Cycle de Vie du Matériel
          </h2>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-950 border border-cyan-500/30 text-cyan-300 shrink-0">
          Étape {Math.min(step, 3)} / 3
        </span>
      </div>

      <div className="mb-4 space-y-2.5">
        {step === 1 && (
          <HydraLog status="warning" message="Erreur matérielle sur nœud local. Commande automatique d'un serveur neuf initiée..." />
        )}
        <NaiaDialogue
          message={
            step === 1 ? (
              <>
                Un des <TechTerm term="Serveur">serveurs</TechTerm> locaux d'HYDRA remonte des plantages critiques. Par défaut, son protocole commande une machine neuve (1 200 L d'<TechTerm term="Eau virtuelle">eau virtuelle</TechTerm> pour graver les puces et <TechTerm term="GPU">GPU</TechTerm> !). Analysez d'abord les journaux système pour isoler le composant en panne.
              </>
            ) : step === 2 ? (
              <>
                Bien vu : seule la barrette mémoire (<TechTerm term="RAM">RAM</TechTerm>) génère des erreurs critiques. Choisissez maintenant l'intervention la plus sobre en eau et en matières premières.
              </>
            ) : (
              <>
                La barrette est remplacée et le serveur redémarre ! Dernière décision : que faire de l'ancien module défectueux pour boucler le cycle de vie (<TechTerm term="DEEE">DEEE</TechTerm>) ?
              </>
            )
          }
          emotion={step === 1 ? 'alert' : 'neutral'}
        />
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-3 gap-2 mb-5 text-[11px]">
        {[
          { num: 1, label: '1. Diagnostic Logs' },
          { num: 2, label: '2. Intervention' },
          { num: 3, label: '3. Fin de vie DEEE' }
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
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Inspectez les journaux ci-dessous et sélectionnez le composant défaillant :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {HARDWARE_LOGS.map((comp) => {
                const Icon = comp.icon;
                const isSelected = selectedComponent === comp.id;
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => { soundManager.playClick(); setSelectedComponent(comp.id); setFeedback(null); }}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-400'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span className="font-bold text-white text-sm">{comp.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {comp.metrics.map(m => (
                          <span key={m.id} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {m.label} : <strong className="text-white">{m.value}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-2 rounded border border-slate-800/80 space-y-1">
                      <div>{comp.logLine}</div>
                      <div className="font-sans text-[11px] text-cyan-300/90 italic">({comp.logPlain})</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={handleValidateStep1}
                disabled={!selectedComponent}
                className={`px-8 py-3.5 rounded-lg font-bold transition-all ${
                  !selectedComponent
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105'
                }`}
              >
                CONFIRMER LE DIAGNOSTIC
              </button>
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
                  desc: 'Remplacer toute la machine par le dernier modèle.',
                  water: '1 200 L d\'eau virtuelle'
                },
                {
                  id: 'repair_ram' as ActionId,
                  name: 'Remplacer la RAM',
                  icon: Wrench,
                  desc: 'Changer uniquement la barrette DIMM_B2 défectueuse.',
                  water: '15 L d\'eau virtuelle'
                },
                {
                  id: 'refurbished' as ActionId,
                  name: 'Serveur reconditionné',
                  icon: Recycle,
                  desc: 'Changer tout le serveur par un modèle d\'occasion.',
                  water: '180 L d\'eau virtuelle'
                }
              ].map((act) => {
                const Icon = act.icon;
                const isSelected = selectedAction === act.id;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => { soundManager.playClick(); setSelectedAction(act.id); setFeedback(null); }}
                    className={`p-5 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-3 ${
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
                    <div className="text-xs font-bold text-cyan-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                      {act.water}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={handleValidateStep2}
                disabled={!selectedAction}
                className={`px-8 py-3.5 rounded-lg font-bold transition-all ${
                  !selectedAction
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105'
                }`}
              >
                EXÉCUTER L'INTERVENTION
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: 'trash' as DisposalId,
                  name: 'Déchets classiques',
                  icon: Trash2,
                  desc: 'Jeter la barrette RAM hors service avec les ordures courantes pour gagner du temps.'
                },
                {
                  id: 'weee' as DisposalId,
                  name: 'Filière de recyclage DEEE',
                  icon: Recycle,
                  desc: 'Envoyer le composant vers une filière spécialisée pour extraire l\'or, le cuivre et les métaux critiques.'
                }
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedDisposal === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { soundManager.playClick(); setSelectedDisposal(opt.id); setFeedback(null); }}
                    className={`p-5 rounded-xl border-2 text-left transition-all flex items-start gap-4 ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-400'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="p-3 rounded-full bg-slate-900 shrink-0">
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm mb-1">{opt.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={handleValidateStep3}
                disabled={!selectedDisposal}
                className={`px-8 py-3.5 rounded-lg font-bold transition-all ${
                  !selectedDisposal
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105'
                }`}
              >
                CLÔTURER LE TICKET
              </button>
            </div>
          </motion.div>
        )}

        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg text-red-300 text-xs font-bold flex items-center justify-center gap-2 text-center"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{feedback}</span>
          </motion.div>
        )}

        <AnimatePresence>
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center mt-5 p-6 bg-emerald-950/30 border border-emerald-500/50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl mb-4">
                <CheckCircle2 className="w-6 h-6" />
                MAINTENANCE CIRCULAIRE VALIDÉE
              </div>
              <p className="text-center mb-6 text-sm">
                Plus de 70 % de l'empreinte écologique d'un matériel informatique provient de sa fabrication (dont l'eau ultra-pure nécessaire à la gravure des puces et <TechTerm term="GPU">GPU</TechTerm>). En ciblant la panne réelle et en recyclant la pièce via les <TechTerm term="DEEE">DEEE</TechTerm>, vous avez économisé 1 185 litres d'<TechTerm term="Eau virtuelle">eau virtuelle</TechTerm> !
              </p>
              <button
                onClick={onComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-[0_0_20px_rgba(16,185,129,0.4)]"
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
