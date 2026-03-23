import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, CheckCircle2, Home, ArrowRight, Droplets, Leaf } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';

export default function Level9({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [hasScored, setHasScored] = useState(false);

  const paths = [
    {
      id: 'towers',
      name: 'Tours de Refroidissement',
      desc: 'Évaporer l\'eau chaude dans l\'atmosphère pour refroidir le système.',
      waterWaste: 'Élevé',
      energyRecovery: '0%',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/30',
      border: 'border-cyan-500/50'
    },
    {
      id: 'river',
      name: 'Rejet dans la Rivière',
      desc: 'Rejeter l\'eau chaude directement dans l\'écosystème local.',
      waterWaste: 'Moyen (Impact Faune)',
      energyRecovery: '0%',
      color: 'text-blue-400',
      bg: 'bg-blue-950/30',
      border: 'border-blue-500/50'
    },
    {
      id: 'greenhouse',
      name: 'Serres Agricoles',
      desc: 'Fournir la chaleur pour la culture maraîchère locale sous serre.',
      waterWaste: 'Faible',
      energyRecovery: '40%',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-500/50'
    },
    {
      id: 'district_heating',
      name: 'Réseau de Chaleur Urbain',
      desc: 'Rediriger l\'eau chaude pour chauffer les habitations de la ville voisine.',
      waterWaste: 'Nul (Circuit fermé)',
      energyRecovery: '85%',
      color: 'text-orange-400',
      bg: 'bg-orange-950/30',
      border: 'border-orange-500/50'
    }
  ];

  const handleSelect = (id: string) => {
    setSelectedPath(id);
    setShowError(false);
  };

  const [isSuccess, setIsSuccess] = useState(false);

  const checkAnswer = () => {
    if (selectedPath === 'district_heating') {
      setIsSuccess(true);
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(200, 80);
      }
    } else {
      setShowError(true);
      onMistake?.();
      setTimeout(() => setShowError(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900 border-transparent sm:border-emerald-500/30 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-xl sm:shadow-2xl max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      {isDevMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50">
          Dev Réponses : Réseau de Chaleur Urbain (district_heating)
        </div>
      )}
      <div className="flex items-center gap-3 mb-3 border-b border-emerald-900/50 pb-3">
        <Flame className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 9 : Valorisation Thermique
        </h2>
      </div>

      <div className="mb-3">
        <NaiaDialogue 
          message={
            <>
              Nos <TechTerm term="Serveur">serveurs</TechTerm> génèrent une quantité massive de chaleur. Actuellement, nous utilisons de l'eau pour les refroidir, puis nous évaporons cette eau chaude. C'est un double gaspillage : d'eau et d'énergie. Comment pouvons-nous transformer ce problème en solution ?
            </>
          }
          emotion="neutral"
        />
      </div>

      <div className="space-y-4 text-slate-300">
        <div className="flex flex-col lg:flex-row gap-5 mt-5">
          {/* Left: Choice cards */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            {paths.map((path) => {
              const isSelected = selectedPath === path.id;
              return (
                <button
                  key={path.id}
                  onClick={() => handleSelect(path.id)}
                  className={`relative flex flex-col p-5 rounded-xl border-2 text-left transition-all duration-300 ${
                    isSelected 
                      ? `${path.bg} ${path.border} scale-[1.02] z-10` 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <h3 className={`font-bold text-lg mb-2 ${isSelected ? 'text-white' : 'text-slate-300'}`}>{path.name}</h3>
                  <p className="text-sm text-slate-400 mb-4 flex-grow">{path.desc}</p>
                  
                  <div className="space-y-2 w-full">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Perte d'eau</span>
                      <span className={`font-bold ${path.color}`}>{path.waterWaste}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Récupération Énergie</span>
                      <span className={`font-bold ${path.color}`}>{path.energyRecovery}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Pipeline visual */}
          <div className="w-full lg:w-1/2 p-6 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 bg-slate-800 rounded-lg border border-slate-600 flex items-center justify-center">
                <Flame className="w-10 h-10 text-orange-500" />
              </div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Data Center</span>
            </div>
            
            <div className="w-full flex flex-col items-center justify-center relative gap-1">
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                {selectedPath && (
                  <motion.div 
                    className={`h-full ${selectedPath === 'district_heating' ? 'bg-orange-500' : selectedPath === 'greenhouse' ? 'bg-emerald-500' : selectedPath === 'river' ? 'bg-blue-500' : 'bg-cyan-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1 }}
                  />
                )}
              </div>
              <ArrowRight className={`text-slate-600 w-5 h-5 rotate-90 ${selectedPath ? 'opacity-0' : 'opacity-100'} transition-opacity`} />
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className={`w-20 h-20 rounded-lg border flex items-center justify-center transition-colors ${
                selectedPath === 'district_heating' ? 'bg-orange-900/50 border-orange-500' :
                selectedPath === 'greenhouse' ? 'bg-emerald-900/50 border-emerald-500' :
                selectedPath === 'river' ? 'bg-blue-900/50 border-blue-500' :
                selectedPath === 'towers' ? 'bg-cyan-900/50 border-cyan-500' :
                'bg-slate-800 border-slate-600'
              }`}>
                {selectedPath === 'district_heating' ? <Home className="w-10 h-10 text-orange-400" /> :
                 selectedPath === 'greenhouse' ? <Leaf className="w-10 h-10 text-emerald-400" /> :
                 selectedPath === 'river' ? <Droplets className="w-10 h-10 text-blue-400" /> :
                 <Flame className="w-10 h-10 text-cyan-400" />}
              </div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                {selectedPath === 'district_heating' ? 'Ville' : selectedPath === 'greenhouse' ? 'Serres' : selectedPath === 'river' ? 'Rivière' : 'Atmosphère'}
              </span>
            </div>
          </div>
        </div>

        {!isSuccess && (
          <div className="flex justify-center mt-5">
            <button
              onClick={checkAnswer}
              disabled={!selectedPath}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                !selectedPath
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : showError
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105'
              }`}
            >
              {showError ? 'MAUVAIS CHOIX' : 'ROUTER LA CHALEUR'}
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
                Parfait. En connectant le <TechTerm term="Datacenter">data center</TechTerm> au réseau de chaleur urbain, l'eau chaude circule en circuit fermé. Elle chauffe les maisons, se refroidit, puis revient au data center. Zéro évaporation, zéro gaspillage, et une facture de chauffage réduite pour les habitants !
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
