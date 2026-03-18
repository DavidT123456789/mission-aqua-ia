import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ArrowRight, Leaf, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';

export default function Level6({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [showError, setShowError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Simulate a moving time indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime((prev) => (prev + 1) % 24);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const blocks = [
    { 
      id: 1, 
      time: '00:00 - 06:00', 
      desc: 'Demande faible, forte production éolienne.', 
      carbon: 'Faible',
      intensity: 45, // gCO2eq/kWh
      color: 'text-emerald-500',
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-500/50',
      fill: 'bg-emerald-500',
      start: 0,
      end: 6
    },
    { 
      id: 2, 
      time: '06:00 - 12:00', 
      desc: 'Demande en hausse, mix énergétique moyen.', 
      carbon: 'Moyen',
      intensity: 120,
      color: 'text-yellow-500',
      bg: 'bg-yellow-950/30',
      border: 'border-yellow-500/50',
      fill: 'bg-yellow-500',
      start: 6,
      end: 12
    },
    { 
      id: 3, 
      time: '12:00 - 18:00', 
      desc: 'Pic de consommation, centrales à gaz actives.', 
      carbon: 'Élevé',
      intensity: 250,
      color: 'text-red-500',
      bg: 'bg-red-950/30',
      border: 'border-red-500/50',
      fill: 'bg-red-500',
      start: 12,
      end: 18
    },
    { 
      id: 4, 
      time: '18:00 - 24:00', 
      desc: 'Baisse de la demande, solaire inactif.', 
      carbon: 'Moyen',
      intensity: 150,
      color: 'text-orange-500',
      bg: 'bg-orange-950/30',
      border: 'border-orange-500/50',
      fill: 'bg-orange-500',
      start: 18,
      end: 24
    },
  ];

  const [hasScored, setHasScored] = useState(false);

  const handleSubmit = () => {
    if (selectedBlock === 1) {
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(150, 0); // No water saved directly here, but good for carbon
      }
    } else {
      setShowError(true);
      onMistake?.();
      setTimeout(() => setShowError(false), 2000);
    }
  };

  const isSuccess = selectedBlock === 1;

  // Generate points for the carbon intensity graph
  const graphPoints = blocks.map(b => `${(b.start / 24) * 100},${100 - (b.intensity / 250) * 100} ${(b.end / 24) * 100},${100 - (b.intensity / 250) * 100}`).join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="bg-slate-900 border border-emerald-500/30 p-4 md:p-6 rounded-xl shadow-2xl shadow-emerald-900/20 max-w-4xl mx-auto font-mono relative"
    >
      {isDevMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50">
          Dev Answer: 00:00 - 06:00 (1)
        </div>
      )}
      <div className="flex items-center gap-3 mb-4 border-b border-emerald-900/50 pb-3">
        <Clock className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 6 : Optimisation Temporelle
        </h2>
      </div>

      <div className="mb-5">
        <NaiaDialogue 
          message={
            <>
              L'entraînement de notre nouveau modèle d'<TechTerm term="IA" /> nécessite 6 heures de calcul intensif continu. Planifiez cet entraînement au moment où l'intensité carbone du réseau électrique est la plus faible pour minimiser nos émissions.
            </>
          }
          emotion="neutral"
        />
      </div>

      <div className="space-y-4 text-slate-300">
        {/* Visual Carbon Intensity Graph */}
        <div className="mt-5 p-6 bg-slate-950 rounded-xl border border-slate-800 relative">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-slate-400" />
            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest">Prévision d'Intensité Carbone (24h)</h3>
          </div>
          
          <div className="relative h-32 w-full border-b border-l border-slate-700 mb-6">
            {/* Y-axis labels */}
            <div className="absolute -left-8 top-0 text-[10px] text-slate-500">Max</div>
            <div className="absolute -left-8 bottom-0 text-[10px] text-slate-500">Min</div>
            
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="w-full border-t border-slate-800/50 h-0"></div>
              <div className="w-full border-t border-slate-800/50 h-0"></div>
              <div className="w-full border-t border-slate-800/50 h-0"></div>
            </div>

            {/* The Graph Line */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <polyline
                points={`0,${100 - (blocks[0].intensity/250)*100} ${graphPoints}`}
                fill="none"
                stroke="rgba(16, 185, 129, 0.5)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {/* Fill under the graph */}
              <polygon
                points={`0,100 0,${100 - (blocks[0].intensity/250)*100} ${graphPoints} 100,100`}
                fill="url(#gradient)"
                opacity="0.2"
              />
              <defs>
                <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 1)" />
                  <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
                </linearGradient>
              </defs>
            </svg>

            {/* Current Time Indicator */}
            <motion.div 
              className="absolute top-0 bottom-0 w-px bg-blue-500 z-10"
              animate={{ left: `${(currentTime / 24) * 100}%` }}
              transition={{ type: 'tween', ease: 'linear', duration: 1 }}
            >
              <div className="absolute -top-2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400"></div>
            </motion.div>

            {/* Selected Block Highlight on Graph */}
            {selectedBlock && (
              <div 
                className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/50 z-0"
                style={{
                  left: `${(blocks.find(b => b.id === selectedBlock)!.start / 24) * 100}%`,
                  width: `${((blocks.find(b => b.id === selectedBlock)!.end - blocks.find(b => b.id === selectedBlock)!.start) / 24) * 100}%`
                }}
              ></div>
            )}
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between text-[10px] text-slate-500 px-1">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {blocks.map((block) => {
            const isSelected = selectedBlock === block.id;
            const widthPercent = (block.intensity / 250) * 100;

            return (
              <button 
                key={block.id}
                onClick={() => { setSelectedBlock(block.id); setShowError(false); }}
                className={`relative flex flex-col p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                  isSelected 
                    ? `bg-slate-800 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] scale-[1.02] z-10` 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="font-mono font-bold text-lg flex items-center gap-2">
                    <Clock className={`w-5 h-5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className={isSelected ? 'text-emerald-400' : 'text-slate-300'}>{block.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Leaf className={`w-4 h-4 ${block.color}`} />
                    <span className={`text-xs font-bold uppercase ${block.color}`}>
                      {block.carbon}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-400 mb-4 h-8">{block.desc}</p>
                
                <div className="w-full mt-auto">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 uppercase">Intensité</span>
                    <span className={`font-bold ${block.color}`}>{block.intensity} gCO₂/kWh</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${block.fill}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{ duration: 1, delay: block.id * 0.1 }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {!isSuccess && (
          <div className="flex justify-center mt-5">
            <button
              onClick={handleSubmit}
              disabled={selectedBlock === null}
              className={`px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                selectedBlock === null 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : showError 
                  ? 'bg-red-600 text-white animate-shake' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              {showError ? (
                <>INTENSITÉ CARBONE TROP ÉLEVÉE <AlertTriangle className="w-5 h-5" /></>
              ) : (
                <>LANCER L'ENTRAÎNEMENT <ArrowRight className="w-5 h-5" /></>
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
                PLANIFICATION OPTIMALE
              </div>
              <p className="text-center mb-6 text-sm">
                En déplaçant les charges de calcul non urgentes (comme l'entraînement d'un modèle) vers les heures où l'énergie est la plus décarbonée (souvent la nuit avec l'éolien), on peut réduire l'empreinte carbone de l'<TechTerm term="IA" /> de manière significative sans changer le matériel. C'est ce qu'on appelle le "Carbon-Aware Computing".
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
