import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Sparkles, Cpu, MessageSquareText, CheckCircle2, AlertTriangle, Droplets, Award, ChevronRight, LockOpen } from 'lucide-react';
import TechTerm from './TechTerm';
import { soundManager } from '../utils/soundManager';

export type BonusMissionId = 'prompt' | 'gpu_bias';

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
    id: 'prompt',
    badgeTitle: 'Maître du Prompt Sobre',
    title: 'Dossier #1 : L\'Art du Prompt Sobre',
    subtitle: (
      <>
        Savoir quand se passer d'<TechTerm term="IA Générative">IA générative</TechTerm> et rédiger un{' '}
        <TechTerm term="Prompt">prompt</TechTerm> précis du premier coup.
      </>
    ),
    icon: MessageSquareText,
    accentClass: 'text-cyan-400',
    steps: [
      {
        title: 'Cas 1/2 — Requête factuelle simple',
        prompt: 'Votre équipe a besoin d\'un chiffre officiel : « Quelle est la consommation moyenne d\'eau par habitant en France ? » Quelle méthode choisissez-vous ?',
        options: [
          {
            id: 'a',
            label: 'Demander à un grand LLM puis générer une infographie par IA',
            waterCostLabel: '~18 mL d\'eau',
            isCorrect: false,
            feedback: 'Gaspillage : générer une image et solliciter un grand modèle pour un simple chiffre multiplie la facture hydrique par 60 !'
          },
          {
            id: 'b',
            label: 'Poser une question floue à un chatbot sans préciser pays ni unité (3 relances)',
            waterCostLabel: '~9 mL d\'eau',
            isCorrect: false,
            feedback: 'Chaque relance oblige le modèle à relire tout l\'historique de la discussion. Pour un fait connu, ce n\'est pas nécessaire.'
          },
          {
            id: 'c',
            label: 'Moteur de recherche classique ou site public (Sans IA générative)',
            waterCostLabel: '~0,3 mL d\'eau',
            isCorrect: true,
            feedback: 'Exact ! Pour retrouver une information factuelle ou un site officiel, la recherche classique consomme 10 à 30 fois moins qu\'un LLM.'
          }
        ]
      },
      {
        title: 'Cas 2/2 — Synthèse municipale cadrée',
        prompt: 'Vous devez maintenant rédiger une note de 10 lignes pour la mairie à partir de 3 chiffres clés d\'HYDRA. Quel usage est le plus sobre ?',
        options: [
          {
            id: 'a',
            label: 'Conversation en 5 relances floues (« écris », « plus court », « plus formel », « ajoute les chiffres », « fais une image »)',
            waterCostLabel: '~28 mL d\'eau',
            isCorrect: false,
            feedback: '5 relances + une image superflue ! À chaque tour, l\'IA recalcule toute la conversation et gaspille eau et électricité.'
          },
          {
            id: 'b',
            label: '1 prompt structuré (Rôle + Contexte + 3 chiffres + Format 10 lignes, sans image)',
            waterCostLabel: '~2,5 mL d\'eau',
            isCorrect: true,
            feedback: 'Bravo ! Un prompt complet et cadré dès le premier envoi (one-shot) supprime les relances inutiles et divise l\'empreinte par 10.'
          },
          {
            id: 'c',
            label: 'Copier-coller 60 pages de logs bruts dans le chat et demander « résume + illustre en 4K »',
            waterCostLabel: '~22 mL d\'eau',
            isCorrect: false,
            feedback: 'Envoyer un contexte massif et demander une image décorative alourdit inutilement les calculs sur les serveurs.'
          }
        ]
      }
    ]
  },
  {
    id: 'gpu_bias',
    badgeTitle: 'Auditeur Anti-Biais & GPU',
    title: 'Dossier #2 : Coût des Puces (GPU) & Biais d\'IA',
    subtitle: (
      <>
        Éviter la fabrication inutile de <TechTerm term="GPU">GPU</TechTerm> et repérer les biais dans les données d'entraînement.
      </>
    ),
    icon: Cpu,
    accentClass: 'text-emerald-400',
    steps: [
      {
        title: 'Cas 1/2 — Arbitrage matériel & Eau ultra-pure',
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
        title: 'Cas 2/2 — Détection d\'un biais hydrique',
        prompt: 'En période de sécheresse, l\'IA d\'HYDRA réduit automatiquement la pression d\'eau dans le « Quartier Nord », estimant qu\'il en a moins besoin. Identifiez l\'origine du problème :',
        contextBox: (
          <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
              <div className="font-bold text-cyan-300 mb-1">Centre-Ville</div>
              <div className="text-slate-400">120 capteurs IoT + signalements via appli mobile → <strong className="text-emerald-400">98 % des besoins visibles</strong></div>
            </div>
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-lg p-2.5">
              <div className="font-bold text-amber-300 mb-1">Quartier Nord</div>
              <div className="text-slate-400">4 vieux capteurs + fiches papier non numérisées → <strong className="text-red-400">15 % des besoins visibles</strong></div>
            </div>
          </div>
        ),
        options: [
          {
            id: 'a',
            label: 'L\'IA est neutre par nature : il suffit de rajouter des GPU pour calculer plus vite',
            waterCostLabel: 'Biais amplifié',
            isCorrect: false,
            feedback: 'Plus de GPU sur des données biaisées ne fait qu\'accélérer une mauvaise décision (« Garbage in, garbage out »).'
          },
          {
            id: 'b',
            label: 'Biais de représentativité : rééquilibrer le jeu de données avec les relevés terrain du Quartier Nord',
            waterCostLabel: 'Distribution équitable',
            isCorrect: true,
            feedback: 'Exact ! Une IA reproduit les angles morts de ses données. Sans audit humain, les zones moins connectées sont injustement pénalisées.'
          },
          {
            id: 'c',
            label: 'Débrancher les capteurs du Centre-Ville pour obtenir le même taux de panne partout',
            waterCostLabel: 'Réseau dégradé',
            isCorrect: false,
            feedback: 'Supprimer des capteurs utiles ferait perdre le suivi des fuites : il faut compléter et rééquilibrer les données manquantes.'
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
  const [stepValidated, setStepValidated] = useState(false);

  const activeMission = BONUS_MISSIONS.find(m => m.id === activeMissionId) || null;
  const currentStep = activeMission ? activeMission.steps[stepIndex] : null;
  const selectedOption = currentStep?.options.find(o => o.id === selectedOptionId) || null;

  const openMission = (id: BonusMissionId) => {
    soundManager.playClick();
    setActiveMissionId(id);
    setStepIndex(0);
    setSelectedOptionId(null);
    setStepValidated(false);
  };

  const handleSelectOption = (opt: BonusOption) => {
    setSelectedOptionId(opt.id);
    if (opt.isCorrect) {
      soundManager.playSuccess();
      setStepValidated(true);
    } else {
      soundManager.playError();
      setStepValidated(false);
    }
  };

  const handleNextStep = () => {
    if (!activeMission) return;
    soundManager.playClick();
    if (stepIndex + 1 < activeMission.steps.length) {
      setStepIndex(stepIndex + 1);
      setSelectedOptionId(null);
      setStepValidated(false);
    } else {
      onCompleteMission(activeMission.id);
      setActiveMissionId(null);
      setStepIndex(0);
      setSelectedOptionId(null);
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
            Chronomètre arrêté ! Relevez ces mini-défis rapides pour débloquer les badges d'agent élite sur votre dossier.
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
                    'Lancer le défi →'
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Challenge Panel */}
      <AnimatePresence mode="wait">
        {activeMission && currentStep && (
          <motion.div
            key={`${activeMission.id}-${stepIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-slate-900/90 border border-cyan-500/30 rounded-xl space-y-3 font-sans"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                {currentStep.title}
              </span>
              <button
                type="button"
                onClick={() => setActiveMissionId(null)}
                className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700"
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
                    className={`w-full p-3 rounded-lg border text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      showGood
                        ? 'bg-emerald-950/50 border-emerald-400 text-emerald-100'
                        : showBad
                        ? 'bg-red-950/40 border-red-400 text-red-100'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-600 text-slate-200'
                    }`}
                  >
                    <span className="text-xs sm:text-sm leading-snug">{opt.label}</span>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 self-start sm:self-center flex items-center gap-1 ${
                      showGood
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : showBad
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-slate-900 text-cyan-300 border border-slate-700'
                    }`}>
                      <Droplets className="w-3 h-3" />
                      {opt.waterCostLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedOption && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
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
              </motion.div>
            )}

            {stepValidated && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all"
                >
                  {stepIndex + 1 < activeMission.steps.length ? 'CAS SUIVANT' : 'DÉBLOQUER LE BADGE'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
