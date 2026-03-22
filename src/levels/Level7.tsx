import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, CheckCircle2, AlertTriangle, Zap, Scale, Cpu, Database } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';

export default function Level7({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const models = [
    {
      id: 'llm',
      name: <><TechTerm term="LLM" /> Généraliste (175B Paramètres)</>,
      icon: BrainCircuit,
      desc: 'Modèle massif capable de tout faire. Précision parfaite mais extrêmement lourd.',
      accuracy: '99.9%',
      energy: '500 Wh / requête',
      color: 'text-red-500',
      bg: 'bg-red-950/30',
      border: 'border-red-500/50',
      barWidth: 'w-full',
      barColor: 'bg-red-500'
    },
    {
      id: 'specialized',
      name: 'Modèle Spécialisé (1B Paramètres)',
      icon: Cpu,
      desc: 'Modèle entraîné spécifiquement pour cette tâche. Excellent compromis.',
      accuracy: '98.5%',
      energy: '5 Wh / requête',
      color: 'text-emerald-500',
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-500/50',
      barWidth: 'w-1/4',
      barColor: 'bg-emerald-500'
    },
    {
      id: 'heuristic',
      name: <>{'Règles Heuristiques (Sans '}<TechTerm term="IA" />{')'}</>,
      icon: Database,
      desc: 'Filtres classiques basés sur des mots-clés. Très rapide mais moins précis.',
      accuracy: '85.0%',
      energy: '0.1 Wh / requête',
      color: 'text-blue-400',
      bg: 'bg-blue-950/30',
      border: 'border-blue-400/50',
      barWidth: 'w-2',
      barColor: 'bg-blue-400'
    }
  ];

  const handleSelect = (id: string) => {
    setSelectedModel(id);
    setShowError(false);
  };

  const [hasScored, setHasScored] = useState(false);

  const checkAnswer = () => {
    if (selectedModel === 'specialized') {
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(200, 0); // High score for final level
      }
    } else {
      setShowError(true);
      onMistake?.();
      setTimeout(() => setShowError(false), 2000);
    }
  };

  const isSuccess = selectedModel === 'specialized';

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900 border-transparent sm:border-emerald-500/30 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-xl sm:shadow-2xl max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      {isDevMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50">
          Dev Réponses : Modèle Spécialisé (specialized)
        </div>
      )}
      <div className="flex items-center gap-3 mb-3 border-b border-emerald-900/50 pb-3">
        <Scale className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 7 : Sobriété Algorithmique
        </h2>
      </div>

      <div className="mb-3">
        <NaiaDialogue 
          message={
            <>
              Dernière étape, Agent. La ville reçoit 10 millions d'emails par jour. Nous devons déployer un système pour filtrer le spam. Utiliser le plus gros modèle d'<TechTerm term="IA" /> consommerait autant d'électricité qu'un quartier entier ! Choisissez l'architecture logicielle offrant le meilleur ratio entre précision et coût environnemental pour cette tâche spécifique.
            </>
          }
          emotion="neutral"
        />
      </div>

      <div className="space-y-4 text-slate-300">
        <div className="bg-emerald-950/30 border border-emerald-500/50 p-4 rounded-lg">
          <h3 className="text-emerald-400 font-bold uppercase mb-2">Mission : Filtrage de Spam</h3>
          <p className="text-sm font-sans mt-2 font-bold text-emerald-300">
            Choisissez l'architecture logicielle offrant le meilleur ratio entre précision et coût environnemental pour cette tâche spécifique.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-5">
          {models.map((model) => {
            const isSelected = selectedModel === model.id;
            const Icon = model.icon;
            
            return (
              <button
                key={model.id}
                onClick={() => handleSelect(model.id)}
                className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 ${
                  isSelected 
                    ? `${model.bg} ${model.border} scale-[1.02] z-10` 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className={`p-4 rounded-full shrink-0 ${isSelected ? 'bg-slate-900' : 'bg-slate-900/50'}`}>
                  <Icon className={`w-8 h-8 ${isSelected ? model.color : 'text-slate-500'}`} />
                </div>
                
                <div className="flex-1 w-full">
                  <h4 className={`font-bold text-lg mb-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {model.name}
                  </h4>
                  <p className="text-sm text-slate-400 mb-4">{model.desc}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 uppercase text-xs block mb-1">Précision</span>
                      <span className="font-bold text-white">{model.accuracy}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 uppercase text-xs block mb-1">Coût Énergétique</span>
                      <div className="flex items-center gap-2">
                        <Zap className={`w-4 h-4 ${model.color}`} />
                        <span className={`font-bold ${model.color}`}>{model.energy}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Visual Energy Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-slate-500 uppercase mb-1">
                      <span>Empreinte Carbone Relative</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${model.barColor} ${model.barWidth} transition-all duration-1000`}></div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {!isSuccess && (
          <div className="flex justify-center mt-5">
            <button
              onClick={checkAnswer}
              disabled={!selectedModel}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center gap-2 ${
                !selectedModel
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : showError
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105'
              }`}
            >
              {showError ? (
                <>MAUVAIS COMPROMIS <AlertTriangle className="w-5 h-5" /></>
              ) : (
                <>DÉPLOYER LE MODÈLE</>
              )}
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
                SOBRIÉTÉ ATTEINTE
              </div>
              <p className="text-center mb-6 text-sm">
                C'est le principe de la "Sobriété Algorithmique" (Green AI). Il ne faut pas utiliser un marteau-pilon pour écraser une mouche. Un modèle spécialisé, beaucoup plus petit, offre une précision presque identique pour une fraction minuscule du coût énergétique d'un <TechTerm term="LLM" /> géant.
              </p>
              <button
                onClick={onComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                TERMINER LA MISSION
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
