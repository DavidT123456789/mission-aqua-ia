import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, CheckCircle2, Home, ArrowRight, Droplets } from 'lucide-react';
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
      color: 'text-red-500',
      bg: 'bg-red-950/30',
      border: 'border-red-500/50'
    },
    {
      id: 'river',
      name: 'Rejet dans la Rivière',
      desc: 'Rejeter l\'eau chaude directement dans l\'écosystème local.',
      waterWaste: 'Moyen (Impact Faune)',
      energyRecovery: '0%',
      color: 'text-yellow-500',
      bg: 'bg-yellow-950/30',
      border: 'border-yellow-500/50'
    },
    {
      id: 'district_heating',
      name: 'Réseau de Chaleur Urbain',
      desc: 'Rediriger l\'eau chaude pour chauffer les habitations de la ville voisine.',
      waterWaste: 'Nul (Circuit fermé)',
      energyRecovery: '85%',
      color: 'text-emerald-500',
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-500/50'
    }
  ];

  const handleSelect = (id: string) => {
    setSelectedPath(id);
    setShowError(false);
  };

  const checkAnswer = () => {
    if (selectedPath === 'district_heating') {
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

  const isSuccess = selectedPath === 'district_heating';

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="bg-slate-900 border border-emerald-500/30 p-4 md:p-6 rounded-xl shadow-2xl max-w-4xl mx-auto font-mono relative"
    >
      {isDevMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50">
          Dev Answer: Réseau de Chaleur Urbain (district_heating)
        </div>
      )}
      <div className="flex items-center gap-3 mb-4 border-b border-emerald-900/50 pb-3">
        <Flame className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 9 : Valorisation Thermique
        </h2>
      </div>

      <div className="mb-5">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
          {paths.map((path) => {
            const isSelected = selectedPath === path.id;
            return (
              <button
                key={path.id}
                onClick={() => handleSelect(path.id)}
                className={`relative flex flex-col p-6 rounded-xl border-2 text-left transition-all duration-300 ${
                  isSelected 
                    ? `${path.bg} ${path.border} scale-105 z-10` 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                }`}
              >
                <h3 className={`font-bold text-lg mb-3 ${isSelected ? 'text-white' : 'text-slate-300'}`}>{path.name}</h3>
                <p className="text-sm text-slate-400 mb-6 flex-grow">{path.desc}</p>
                
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

        {/* Visual representation */}
        <div className="mt-5 p-6 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center gap-4 md:gap-5">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-slate-800 rounded-lg border border-slate-600 flex items-center justify-center">
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
            <span className="text-xs text-slate-400">Data Center</span>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              {selectedPath && (
                <motion.div 
                  className={`h-full ${selectedPath === 'district_heating' ? 'bg-emerald-500' : selectedPath === 'river' ? 'bg-yellow-500' : 'bg-red-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1 }}
                />
              )}
            </div>
            <ArrowRight className={`absolute text-slate-600 w-6 h-6 ${selectedPath ? 'opacity-0' : 'opacity-100'}`} />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className={`w-16 h-16 rounded-lg border flex items-center justify-center transition-colors ${
              selectedPath === 'district_heating' ? 'bg-emerald-900/50 border-emerald-500' :
              selectedPath === 'river' ? 'bg-yellow-900/50 border-yellow-500' :
              selectedPath === 'towers' ? 'bg-red-900/50 border-red-500' :
              'bg-slate-800 border-slate-600'
            }`}>
              {selectedPath === 'district_heating' ? <Home className="w-8 h-8 text-emerald-400" /> :
               selectedPath === 'river' ? <Droplets className="w-8 h-8 text-yellow-400" /> :
               <Flame className="w-8 h-8 text-slate-500" />}
            </div>
            <span className="text-xs text-slate-400">
              {selectedPath === 'district_heating' ? 'Ville' : selectedPath === 'river' ? 'Rivière' : 'Atmosphère'}
            </span>
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
