import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Sparkles, Cpu, TrendingUp, CheckCircle2, AlertTriangle, Droplets, Award, ChevronRight, LockOpen } from 'lucide-react';
import TechTerm from './TechTerm';
import ActionButton from './ActionButton';
import Collapsible from './Collapsible';
import { soundManager } from '../utils/soundManager';
import { EASE_OUT_EXPO, STEP_PANEL_MOTION } from '../utils/motion';

export type BonusMissionId = 'gpu_cost' | 'rebound';

interface BonusOption {
  id: string;
  label: string;
  waterCostLabel: string;
  isCorrect: boolean;
  feedback: string;
}

interface BonusStep {
  title: string;
  prompt: React.ReactNode;
  contextBox?: React.ReactNode;
  options: BonusOption[];
}

interface BonusMissionDef {
  id: BonusMissionId;
  badgeTitle: string;
  title: string;
  subtitle: React.ReactNode;
  icon: typeof Cpu;
  accentClass: string;
  steps: BonusStep[];
}

const BONUS_MISSIONS: BonusMissionDef[] = [
  {
    id: 'gpu_cost',
    badgeTitle: 'Architecte Matériel & GPU',
    title: 'Dossier #1 : Coût des Puces (GPU) & Eau Ultra-Pure',
    subtitle: (
      <>
        Éviter la fabrication inutile de <TechTerm term="GPU">GPU</TechTerm> et économiser l'<TechTerm term="Eau virtuelle">eau virtuelle</TechTerm> des usines.
      </>
    ),
    icon: Cpu,
    accentClass: 'text-emerald-400',
    steps: [
      {
        title: 'Cas 1/2 : Arbitrage matériel & Eau ultra-pure',
        prompt: 'La ville veut surveiller 50 capteurs de débit d\'eau pour détecter les fuites. Quel déploiement matériel validez-vous ?',
        contextBox: (
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-300">
            Rappel usine : graver un serveur neuf équipé de <TechTerm term="GPU">GPU</TechTerm> d'IA nécessite environ{' '}
            <strong className="text-cyan-300">1 200 L d'eau ultra-pure</strong> (rinçage des plaquettes de silicium).
          </div>
        ),
        options: [
          {
            id: 'a',
            label: 'Commander 4 serveurs neufs avec GPU d\'entraînement dernier cri',
            waterCostLabel: '4 800 L d\'eau virtuelle',
            isCorrect: false,
            feedback: 'Surdimensionné ! Acheter des GPU neufs pour lire 50 capteurs gaspille des milliers de litres d\'eau ultra-pure en usine.'
          },
          {
            id: 'b',
            label: 'Réutiliser les CPU des serveurs municipaux existants avec un petit modèle statistique',
            waterCostLabel: '0 L de fabrication neuve',
            isCorrect: true,
            feedback: 'Parfait ! Prolonger la vie du matériel existant et éviter l\'achat de GPU superflus économise énormément d\'eau virtuelle.'
          },
          {
            id: 'c',
            label: 'Louer des GPU dédiés 24h/24 pour faire analyser chaque capteur par un LLM géant',
            waterCostLabel: '1 900 L éq./an',
            isCorrect: false,
            feedback: 'Faire tourner un LLM sur GPU en continu pour surveiller 50 valeurs numériques est un gouffre énergétique.'
          }
        ]
      },
      {
        title: 'Cas 2/2 : Mutualisation & Taux d\'utilisation',
        prompt: 'Le lycée et la mairie veulent chacun un modèle d\'IA pour optimiser le chauffage de leurs bâtiments 2 heures par jour. Comment déployer ?',
        options: [
          {
            id: 'a',
            label: 'Installer un serveur GPU dédié dans chaque bâtiment (utilisé à 8 % du temps)',
            waterCostLabel: '2× eau de fabrication',
            isCorrect: false,
            feedback: 'Gaspillage matériel : un serveur sous-exploité coûte presque autant d\'eau à fabriquer qu\'un serveur bien mutualisé.'
          },
          {
            id: 'b',
            label: 'Mutualiser un petit serveur partagé existant pour planifier leurs créneaux à tour de rôle',
            waterCostLabel: 'Sobriété maximale',
            isCorrect: true,
            feedback: 'Exact ! Mutualiser les équipements existants augmente leur taux d\'utilisation réel et évite de fabriquer de nouvelles puces.'
          },
          {
            id: 'c',
            label: 'Renouveler tous les ordinateurs du lycée tous les 2 ans pour suivre les dernières puces',
            waterCostLabel: 'Impact × 3',
            isCorrect: false,
            feedback: 'Remplacer trop vite du matériel fonctionnel multiplie la consommation d\'eau ultra-pure et de métaux rares.'
          }
        ]
      }
    ]
  },
  {
    id: 'rebound',
    badgeTitle: 'Veilleur Anti-Rebond',
    title: 'Dossier #2 : L\'Effet Rebond (Paradoxe de Jevons)',
    subtitle: (
      <>
        Comprendre pourquoi rendre une <TechTerm term="IA">IA</TechTerm> plus rapide ou moins chère peut paradoxalement augmenter la consommation totale d'eau.
      </>
    ),
    icon: TrendingUp,
    accentClass: 'text-cyan-400',
    steps: [
      {
        title: 'Cas 1/2 : Diagnostic de l\'effet rebond',
        prompt: 'Grâce à une nouvelle puce, générer une image IA consomme 5 fois moins d\'eau qu\'avant (2,4 mL au lieu de 12 mL). Pourtant, la facture d\'eau du datacenter double en 6 mois ! Pourquoi ?',
        contextBox: (
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-300">
            Relevé mensuel : coût unitaire divisé par <strong className="text-emerald-400">5</strong>, mais nombre de requêtes multiplié par{' '}
            <strong className="text-amber-300">10</strong> (génération automatique sur chaque page web et e-mail).
          </div>
        ),
        options: [
          {
            id: 'a',
            label: 'Les chiffres sont faux : optimiser l\'efficacité réduit toujours la consommation totale',
            waterCostLabel: 'Erreur d\'analyse',
            isCorrect: false,
            feedback: 'Attention : l\'efficacité unitaire ne suffit pas si les usages explosent en volume !'
          },
          {
            id: 'b',
            label: 'Effet rebond : comme c\'est plus rapide et moins cher, on l\'utilise 10 fois plus (2,4 × 10 > 12 × 1)',
            waterCostLabel: 'Consommation × 2',
            isCorrect: true,
            feedback: 'Exact ! C\'est le paradoxe de Jevons : quand une ressource devient plus efficace, sa facilité d\'usage déclenche souvent une explosion du volume total.'
          },
          {
            id: 'c',
            label: 'C\'est uniquement dû à la météo : l\'eau des serveurs s\'évapore plus vite quand le modèle est petit',
            waterCostLabel: 'Hors sujet',
            isCorrect: false,
            feedback: 'Non, le phénomène vient directement de la hausse massive du nombre d\'appels (× 10).'
          }
        ]
      },
      {
        title: 'Cas 2/2 : Bloquer l\'effet rebond sur HYDRA',
        prompt: 'Quelle règle technique empêche l\'effet rebond sur les nouveaux services municipaux d\'HYDRA ?',
        options: [
          {
            id: 'a',
            label: 'Activer l\'IA générative par défaut sur tous les formulaires pour « rentabiliser » l\'optimisation',
            waterCostLabel: 'Rebond maximal',
            isCorrect: false,
            feedback: 'Imposer l\'IA là où personne n\'en a besoin déclenche précisément un effet rebond massif.'
          },
          {
            id: 'b',
            label: 'Coupler l\'optimisation à des plafonds de volume (quotas), un déclenchement sur demande et des alertes de dérive',
            waterCostLabel: 'Impact maîtrisé',
            isCorrect: true,
            feedback: 'Bravo ! Sans sobriété dans les usages et sans plafonds globaux, les gains techniques sont vite annulés par la croissance du volume.'
          },
          {
            id: 'c',
            label: 'Cacher la consommation d\'eau aux utilisateurs pour qu\'ils utilisent le service sans crainte',
            waterCostLabel: 'Opacité totale',
            isCorrect: false,
            feedback: 'La transparence et la mesure en continu sont au contraire indispensables pour éviter les dérives.'
          }
        ]
      }
    ]
  }
];

interface BonusMissionsProps {
  completedMissions: BonusMissionId[];
  onCompleteMission: (id: BonusMissionId) => void;
}

export default function BonusMissions({ completedMissions, onCompleteMission }: BonusMissionsProps) {
  const [activeMissionId, setActiveMissionId] = useState<BonusMissionId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [revealedOptionIds, setRevealedOptionIds] = useState<string[]>([]);
  const [stepValidated, setStepValidated] = useState(false);

  const activeMission = BONUS_MISSIONS.find(m => m.id === activeMissionId) || null;
  const currentStep = activeMission ? activeMission.steps[stepIndex] : null;
  const selectedOption = currentStep?.options.find(o => o.id === selectedOptionId) || null;

  const openMission = (id: BonusMissionId) => {
    soundManager.playClick();
    setActiveMissionId(id);
    setStepIndex(0);
    setSelectedOptionId(null);
    setRevealedOptionIds([]);
    setStepValidated(false);
  };

  const handleSelectOption = (opt: BonusOption) => {
    setSelectedOptionId(opt.id);
    setRevealedOptionIds(prev => (prev.includes(opt.id) ? prev : [...prev, opt.id]));
    if (opt.isCorrect) {
      soundManager.playStep();
      setStepValidated(true);
    } else {
      soundManager.playError();
      setStepValidated(false);
    }
  };

  const handleNextStep = () => {
    if (!activeMission) return;
    if (stepIndex + 1 < activeMission.steps.length) {
      soundManager.playClick();
      setStepIndex(stepIndex + 1);
      setSelectedOptionId(null);
      setRevealedOptionIds([]);
      setStepValidated(false);
    } else {
      soundManager.playBadgeUnlock();
      onCompleteMission(activeMission.id);
      setActiveMissionId(null);
      setStepIndex(0);
      setSelectedOptionId(null);
      setRevealedOptionIds([]);
      setStepValidated(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 mb-5 text-left bg-slate-950/75 border border-cyan-500/30 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-widest flex items-center gap-2">
            <LockOpen className="w-4 h-4 text-emerald-400" />
            Dossiers Classifiés (Défis Bonus)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Chronomètre arrêté ! Relevez ces mini-défis rapides pour débloquer les badges d'agent élite (+1 % d'eau sauvée chacun) sur votre dossier.
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
          {completedMissions.length} / {BONUS_MISSIONS.length} validés
        </span>
      </div>

      {/* Mission selector cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        {BONUS_MISSIONS.map((mission) => {
          const Icon = mission.icon;
          const isDone = completedMissions.includes(mission.id);
          const isOpen = activeMissionId === mission.id;
          return (
            <button
              key={mission.id}
              type="button"
              onClick={() => openMission(mission.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                isDone
                  ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-400'
                  : isOpen
                  ? 'bg-cyan-950/40 border-cyan-400'
                  : 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 shrink-0 ${mission.accentClass}`} />
                  <span className="font-bold text-xs sm:text-sm text-white">{mission.title}</span>
                </div>
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">{mission.subtitle}</p>
              <div className="mt-auto pt-1 flex items-center justify-between text-[11px] font-mono">
                <span className={isDone ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-cyan-400'}>
                  {isDone ? (
                    <>
                      <Award className="w-3.5 h-3.5" /> {mission.badgeTitle}
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      Lancer le défi
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Challenge Panel */}
      <Collapsible isOpen={Boolean(activeMission && currentStep)} innerClassName="mt-4">
        <AnimatePresence mode="wait" initial={false}>
          {activeMission && currentStep && (
            <motion.div
              key={`${activeMission.id}-${stepIndex}`}
              {...STEP_PANEL_MOTION}
              className="p-4 bg-slate-900/90 border border-cyan-500/30 rounded-xl space-y-3 font-sans"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  {currentStep.title}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveMissionId(null)}
                  className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition-colors"
                >
                  Fermer
                </button>
              </div>

              <p className="text-sm text-slate-100 leading-relaxed font-medium">{currentStep.prompt}</p>

              {currentStep.contextBox}

              <div className="space-y-2">
                {currentStep.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  const showGood = isSelected && opt.isCorrect;
                  const showBad = isSelected && !opt.isCorrect;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 active:scale-[0.99] ${
                        showGood
                          ? 'bg-emerald-950/50 border-emerald-400 text-emerald-100'
                          : showBad
                          ? 'bg-red-950/40 border-red-400 text-red-100'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-600 text-slate-200'
                      }`}
                    >
                      <span className="text-xs sm:text-sm leading-snug">{opt.label}</span>
                      {(stepValidated || revealedOptionIds.includes(opt.id)) && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1, transition: { duration: 0.18, ease: EASE_OUT_EXPO } }}
                          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 self-start sm:self-center flex items-center gap-1 ${
                            opt.isCorrect
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          <Droplets className="w-3 h-3" />
                          {opt.waterCostLabel}
                        </motion.span>
                      )}
                    </button>
                  );
                })}
              </div>

              <Collapsible isOpen={Boolean(selectedOption)}>
                {selectedOption && (
                  <div
                    className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2 ${
                      selectedOption.isCorrect
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-red-950/40 border-red-500/40 text-red-200'
                    }`}
                  >
                    {selectedOption.isCorrect ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <span>{selectedOption.feedback}</span>
                  </div>
                )}
              </Collapsible>

              <Collapsible isOpen={stepValidated} innerClassName="flex justify-end pt-1">
                <ActionButton
                  onClick={handleNextStep}
                  size="md"
                  className="text-xs sm:text-sm font-mono"
                >
                  {stepIndex + 1 < activeMission.steps.length ? 'CAS SUIVANT' : 'DÉBLOQUER LE BADGE'}
                  <ChevronRight className="w-4 h-4" />
                </ActionButton>
              </Collapsible>
            </motion.div>
          )}
        </AnimatePresence>
      </Collapsible>
    </div>
  );
}
