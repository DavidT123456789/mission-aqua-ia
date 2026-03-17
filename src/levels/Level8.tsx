import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Server, CheckCircle2, AlertTriangle, Wrench, Trash2, Cpu, MemoryStick, HardDrive } from 'lucide-react';
import Hint from '../components/Hint';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';

export default function Level8({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [hasScored, setHasScored] = useState(false);

  const actions = [
    {
      id: 'replace_all',
      name: 'Remplacer le serveur',
      icon: Trash2,
      desc: 'Jeter l\'ancien serveur et en acheter un neuf de dernière génération.',
      waterCost: '1200 L',
      color: 'text-red-500',
      bg: 'bg-red-950/30',
      border: 'border-red-500/50'
    },
    {
      id: 'repair_ram',
      name: 'Réparer (Changer la RAM)',
      icon: Wrench,
      desc: 'Identifier le composant défectueux (RAM) et le remplacer uniquement.',
      waterCost: '15 L',
      color: 'text-emerald-500',
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-500/50'
    },
    {
      id: 'ignore',
      name: 'Ignorer la panne',
      icon: AlertTriangle,
      desc: 'Laisser le serveur tourner au ralenti avec des erreurs.',
      waterCost: '0 L',
      color: 'text-yellow-500',
      bg: 'bg-yellow-950/30',
      border: 'border-yellow-500/50'
    }
  ];

  const handleSelect = (id: string) => {
    setSelectedAction(id);
    setShowError(false);
  };

  const checkAnswer = () => {
    if (selectedAction === 'repair_ram') {
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(150, 50);
      }
    } else {
      setShowError(true);
      onMistake?.();
      setTimeout(() => setShowError(false), 2000);
    }
  };

  const isSuccess = selectedAction === 'repair_ram';

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="bg-slate-900 border border-emerald-500/30 p-6 md:p-8 rounded-xl shadow-2xl max-w-4xl mx-auto font-mono relative"
    >
      {isDevMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50">
          Dev Answer: Réparer (repair_ram)
        </div>
      )}
      <div className="flex items-center gap-3 mb-6 border-b border-emerald-900/50 pb-4">
        <Server className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 8 : Cycle de Vie du Matériel
        </h2>
      </div>

      <div className="mb-8">
        <NaiaDialogue 
          message={
            <>
              Agent, un de nos <TechTerm term="Serveur">serveurs</TechTerm> d'entraînement <TechTerm term="IA" /> vient de tomber en panne. La fabrication d'un serveur neuf nécessite d'énormes quantités d'eau pure pour nettoyer les puces électroniques. Quelle est la meilleure approche pour notre infrastructure ?
            </>
          }
          emotion="alert"
        />
      </div>

      <div className="space-y-6 text-slate-300">
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          {/* Server Visualization */}
          <div className="w-full lg:w-1/2 relative bg-slate-950 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-xs space-y-4">
              <div className="h-12 bg-slate-800 rounded border border-slate-700 flex items-center px-4 gap-4">
                <Cpu className="w-6 h-6 text-emerald-500" />
                <div className="flex-1 h-2 bg-emerald-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-3/4"></div>
                </div>
                <span className="text-xs text-emerald-500">OK</span>
              </div>
              <div className="h-12 bg-red-900/20 rounded border border-red-500/50 flex items-center px-4 gap-4 animate-pulse">
                <MemoryStick className="w-6 h-6 text-red-500" />
                <div className="flex-1 h-2 bg-red-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 w-1/4"></div>
                </div>
                <span className="text-xs text-red-500 font-bold">ERR</span>
              </div>
              <div className="h-12 bg-slate-800 rounded border border-slate-700 flex items-center px-4 gap-4">
                <HardDrive className="w-6 h-6 text-emerald-500" />
                <div className="flex-1 h-2 bg-emerald-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-full"></div>
                </div>
                <span className="text-xs text-emerald-500">OK</span>
              </div>
            </div>
            <p className="mt-6 text-sm text-slate-400 text-center">
              Diagnostic : Défaillance du module mémoire (RAM). Le reste du système est fonctionnel.
            </p>
          </div>

          {/* Actions */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            {actions.map((action) => {
              const Icon = action.icon;
              const isSelected = selectedAction === action.id;
              return (
                <button
                  key={action.id}
                  onClick={() => handleSelect(action.id)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 flex items-center gap-4 ${
                    isSelected 
                      ? `${action.bg} ${action.border} shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-[1.02]` 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className={`p-3 rounded-full ${isSelected ? 'bg-slate-900' : 'bg-slate-900/50'}`}>
                    <Icon className={`w-6 h-6 ${isSelected ? action.color : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{action.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{action.desc}</p>
                    <div className="mt-2 text-xs font-bold text-blue-400">
                      Coût en eau (fabrication) : {action.waterCost}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {!isSuccess && (
          <div className="flex justify-center mt-8">
            <button
              onClick={checkAnswer}
              disabled={!selectedAction}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                !selectedAction
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : showError
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105'
              }`}
            >
              {showError ? 'MAUVAISE DÉCISION' : 'EXÉCUTER L\'ACTION'}
            </button>
          </div>
        )}

        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center mt-8 p-6 bg-emerald-950/30 border border-emerald-500/50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl mb-4">
                 <CheckCircle2 className="w-6 h-6" />
                 RÉPARATION EFFECTUÉE
              </div>
              <p className="text-center mb-6 text-sm">
                L'économie circulaire est essentielle. La fabrication des composants électroniques (puces, processeurs) nécessite d'énormes quantités d'eau ultra-pure. En réparant au lieu de remplacer, nous économisons des milliers de litres d'eau virtuelle.
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

        <Hint 
          hintText="La Data Hygiene permet de réduire les calculs inutiles en supprimant les données redondantes avant qu'elles ne soient traitées." 
          delaySeconds={30} 
        />
      </div>
    </motion.div>
  );
}
