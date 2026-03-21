import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, AlertTriangle, CheckCircle2, Droplets } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import { soundManager } from '../utils/soundManager';

export default function Level2({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [activeValves, setActiveValves] = useState<number[]>([]);
  const targetFlow = 150;
  
  const valves = [
    { id: 1, flow: 50 },
    { id: 2, flow: 75 },
    { id: 3, flow: 100 },
    { id: 4, flow: 25 },
    { id: 5, flow: 10 },
  ];

  const currentFlow = activeValves.reduce((acc, id) => {
    const valve = valves.find(v => v.id === id);
    return acc + (valve ? valve.flow : 0);
  }, 0);

  const [hasScored, setHasScored] = useState(false);

  const toggleValve = (id: number) => {
    setActiveValves(prev => {
      const next = prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id];
      return next;
    });
  };

  const prevFlowRef = useRef(currentFlow);

  useEffect(() => {
    if (currentFlow === targetFlow && !hasScored) {
      setHasScored(true);
      soundManager.playSuccess();
      onScoreUpdate(100, 30);
    } else if (currentFlow > targetFlow && prevFlowRef.current <= targetFlow) {
      onMistake?.();
    }
    prevFlowRef.current = currentFlow;
  }, [currentFlow, targetFlow, hasScored, onScoreUpdate, onMistake]);

  const isSuccess = currentFlow === targetFlow;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="bg-slate-900 border border-emerald-500/30 p-4 md:p-6 rounded-xl shadow-2xl max-w-4xl mx-auto font-mono relative"
    >
      {isDevMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50">
          Dev Réponses : 50 + 75 + 25 (1, 2, 4)
        </div>
      )}
      <div className="flex items-center gap-3 mb-3 border-b border-emerald-900/50 pb-3">
        <Settings className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 2 : Refroidissement
        </h2>
      </div>

      <div className="mb-3">
        <NaiaDialogue 
          message={
            <>
              Excellent travail. Maintenant que nous connaissons le coût, nous devons optimiser. Les <TechTerm term="Serveur">serveurs</TechTerm> d'HYDRA surchauffent. Actuellement, toutes les vannes d'eau sont ouvertes au maximum, gaspillant des millions de litres. Ajustez les vannes pour atteindre exactement le débit requis.
            </>
          }
          emotion="alert"
        />
      </div>

      <div className="space-y-4 text-slate-300">
        <div className="bg-red-950/30 border border-red-500/50 p-4 rounded-lg flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
          <div>
            <h3 className="text-red-400 font-bold uppercase mb-2">Alerte : Surconsommation d'eau</h3>
            <p className="text-sm font-sans mt-2 font-bold text-emerald-300">
              Le système requiert exactement {targetFlow} L/s pour un refroidissement optimal sans gaspillage.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 mt-5">
          {/* Valve Controls */}
          <div className="w-full lg:w-3/5 relative p-6 bg-slate-950 rounded-xl border border-slate-800">
            {/* Decorative pipes background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none flex flex-col justify-between py-8">
              <div className="w-full h-4 bg-slate-700 rounded-full"></div>
              <div className="w-full h-4 bg-slate-700 rounded-full"></div>
              <div className="w-full h-4 bg-slate-700 rounded-full"></div>
            </div>

            <p className="text-lg text-center font-bold mb-6 relative z-10">
              Sélectionnez les vannes à laisser ouvertes :
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 relative z-10">
              {valves.map((valve) => {
                const isActive = activeValves.includes(valve.id);
                return (
                  <div key={valve.id} className="flex flex-col items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleValve(valve.id)}
                      aria-label={`Vanne ${valve.id}, débit ${valve.flow} litres par seconde. ${isActive ? 'Actuellement ouverte' : 'Actuellement fermée'}`}
                      className={`relative w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center gap-1 transition-all duration-300 overflow-hidden group ${
                        isActive 
                          ? 'bg-emerald-950/50 border-emerald-400 text-emerald-300' 
                          : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-500'
                      }`}
                    >
                      {/* Flow animation inside button when open */}
                      {isActive && (
                        <motion.div 
                          className="absolute inset-0 opacity-10"
                          initial={{ y: '-100%' }}
                          animate={{ y: '100%' }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          style={{ 
                            background: 'linear-gradient(180deg, transparent, #10b981, transparent)' 
                          }}
                        />
                      )}

                      <span className={`font-black text-3xl relative z-10 ${isActive ? 'text-emerald-400 text-glow-emerald' : 'text-slate-400'}`}>{valve.flow}</span>
                      <span className="text-[10px] uppercase tracking-widest font-black relative z-10">L/s</span>
                      
                      {/* Valve handle indicator */}
                      <motion.div 
                        animate={{ rotate: isActive ? 90 : 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className={`absolute w-full h-1.5 top-1/2 -translate-y-1/2 transition-colors duration-500 ${isActive ? 'bg-emerald-500/40' : 'bg-slate-600/30'}`}
                      ></motion.div>
                    </motion.button>
                    
                    {/* Water flow animation below valve */}
                    <div className="h-20 w-8 bg-slate-900/80 rounded-b-2xl relative overflow-hidden border-x border-b border-slate-700/50 shadow-inner">
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-b from-blue-600/60 to-blue-400/40"
                            initial={{ height: 0 }}
                            animate={{ height: '100%' }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {/* Flow lines */}
                            <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(0deg,transparent,transparent_8px,rgba(255,255,255,0.5)_8px,rgba(255,255,255,0.5)_16px)]"></div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flow Meter */}
          <div className="w-full lg:w-2/5 p-8 glass rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
            {/* Water level background */}
            <motion.div 
              className={`absolute bottom-0 left-0 right-0 opacity-10 transition-colors duration-500 ${
                currentFlow > targetFlow ? 'bg-red-500' : currentFlow === targetFlow ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
              initial={{ height: '0%' }}
              animate={{ height: `${Math.min((currentFlow / targetFlow) * 100, 100)}%` }}
              transition={{ type: 'spring', stiffness: 50 }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-full ${currentFlow > targetFlow ? 'bg-red-500/20' : currentFlow === targetFlow ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
                  <Droplets className={`w-8 h-8 ${currentFlow > targetFlow ? 'text-red-500' : currentFlow === targetFlow ? 'text-emerald-400' : 'text-blue-400'}`} />
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-[0.3em] font-black">Débit Total Actuel</p>
              </div>
              
              <div className="flex flex-col items-center gap-1 mb-8">
                <motion.span 
                  key={currentFlow}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className={`text-8xl font-black font-mono tracking-tighter transition-colors duration-300 ${
                    currentFlow > targetFlow ? 'text-red-500' : currentFlow === targetFlow ? 'text-emerald-400 text-glow-emerald' : 'text-blue-400'
                  }`}
                >
                  {currentFlow}
                </motion.span>
                <div className="flex items-center gap-2">
                  <span className="text-xl text-slate-500 font-black uppercase tracking-widest">L/s</span>
                  <span className="text-slate-700 font-bold">/</span>
                  <span className="text-xl text-slate-400 font-black uppercase tracking-widest">{targetFlow}</span>
                </div>
              </div>
              
              <div className="w-full h-8 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700/50 relative p-1 shadow-inner">
                {/* Target marker */}
                <div className="absolute top-0 bottom-0 w-1 bg-emerald-400 z-20" style={{ left: '100%' }}></div>
                
                <motion.div 
                   className={`h-full relative z-10 rounded-full ${
                    currentFlow > targetFlow ? 'bg-red-500' : currentFlow === targetFlow ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((currentFlow / targetFlow) * 100, 100)}%` }}
                  transition={{ type: 'spring', stiffness: 100 }}
                />
              </div>
              
              <div className="h-12 mt-6 flex items-center justify-center">
                {currentFlow > targetFlow && (
                  <p className="text-red-400 text-sm font-bold text-center">
                    DANGER : Gaspillage d'eau détecté.<br/>Réduisez le débit.
                  </p>
                )}
                {currentFlow < targetFlow && currentFlow > 0 && (
                  <p className="text-blue-400 text-sm font-bold text-center">
                    Refroidissement insuffisant.<br/>Augmentez le débit.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center mt-5 p-6 bg-emerald-950/30 border border-emerald-500/50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl mb-4">
                <CheckCircle2 className="w-6 h-6" />
                DÉBIT OPTIMAL ATTEINT
              </div>
              <p className="text-center mb-6 text-sm">
                Le <TechTerm term="Refroidissement" /> est stabilisé. En optimisant le flux d'eau, nous avons réduit la consommation du <TechTerm term="Datacenter" /> de 40% sans impacter les performances de l'<TechTerm term="IA" />.
              </p>
              <button
                onClick={onComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                STABILISER LE SYSTÈME
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
