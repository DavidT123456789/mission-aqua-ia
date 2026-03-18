import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Search, AlertCircle, CheckCircle2, Waves, Map as MapIcon } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';

export default function Level3({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [scanLine, setScanLine] = useState(0);

  // Radar scan effect
  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const sensors = [
    { id: 'A', pressure: 4.5, status: 'Normal', location: 'Quartier Nord', pos: { top: '20%', left: '30%' } },
    { id: 'B', pressure: 4.6, status: 'Normal', location: 'Centre-Ville', pos: { top: '40%', left: '50%' } },
    { id: 'C', pressure: 2.1, status: 'Anomalie', location: 'Zone Industrielle', pos: { top: '70%', left: '70%' } },
    { id: 'D', pressure: 4.5, status: 'Normal', location: 'Quartier Sud', pos: { top: '80%', left: '30%' } },
    { id: 'E', pressure: 4.4, status: 'Normal', location: 'Banlieue Est', pos: { top: '30%', left: '80%' } },
  ];

  const [isRepairing, setIsRepairing] = useState(false);
  const [hasScored, setHasScored] = useState(false);

  const handleSelect = (id: string) => {
    setSelectedSensor(id);
    if (id === 'C') {
      setError(false);
      setIsRepairing(true);
      setTimeout(() => {
        setIsRepairing(false);
        if (!hasScored) {
          setHasScored(true);
          onScoreUpdate(150, 40);
        }
      }, 1500);
    } else {
      setError(true);
      onMistake?.();
      setTimeout(() => setError(false), 1500);
    }
  };

  const isSuccess = selectedSensor === 'C' && !isRepairing;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="bg-slate-900 border border-emerald-500/30 p-4 md:p-6 rounded-xl shadow-2xl max-w-4xl mx-auto font-mono relative"
    >
      {isDevMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50">
          Dev Answer: C
        </div>
      )}
      <div className="flex items-center gap-3 mb-4 border-b border-emerald-900/50 pb-3">
        <Activity className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 3 : Détection de Fuites
        </h2>
      </div>

      <div className="mb-5">
        <NaiaDialogue 
          message={
            <>
              Le refroidissement est stabilisé, mais mes capteurs indiquent une perte de pression dans le réseau principal. Une fuite est probable. L'<TechTerm term="IA" /> peut analyser des milliers de points de données instantanément. Utilisez le radar pour identifier le capteur qui signale une anomalie.
            </>
          }
          emotion="neutral"
        />
      </div>

      <div className="space-y-4 text-slate-300">
        <div className="bg-blue-950/30 border border-blue-500/50 p-4 rounded-lg flex items-start gap-4">
          <Search className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
          <div>
            <h3 className="text-blue-400 font-bold uppercase mb-2">Analyse du réseau municipal</h3>
            <p className="text-sm font-sans mt-2 font-bold text-emerald-300">
              Entraînez l'<TechTerm term="IA" /> à détecter les anomalies. Une fuite se traduit par une chute anormale de pression dans les canalisations.
              <span className="block mt-2 text-blue-300">Cliquez sur le capteur présentant une anomalie pour l'isoler.</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mt-5">
          {/* Interactive Radar Map */}
          <div className="w-full lg:w-1/2 relative bg-slate-950 rounded-xl border border-slate-800 min-h-[350px]">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            
            {/* Radar Sweep Line */}
            <div 
              className="absolute left-0 right-0 h-0.5 bg-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.5)] z-10 pointer-events-none"
              style={{ top: `${scanLine}%` }}
            />
            <div 
              className="absolute left-0 right-0 bg-gradient-to-b from-transparent to-emerald-500/10 z-10 pointer-events-none"
              style={{ top: `${Math.max(0, scanLine - 20)}%`, height: `${Math.min(20, scanLine)}%` }}
            />

            {/* Network Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <line x1="30%" y1="20%" x2="50%" y2="40%" className="stroke-slate-700" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="50%" y1="40%" x2="30%" y2="80%" className="stroke-slate-700" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="50%" y1="40%" x2="80%" y2="30%" className="stroke-slate-700" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="50%" y1="40%" x2="70%" y2="70%" className={isSuccess ? "stroke-emerald-500" : "stroke-slate-700"} strokeWidth={isSuccess ? "3" : "2"} strokeDasharray={isSuccess ? "none" : "4 4"} />
            </svg>

            {/* Sensors on Map */}
            {sensors.map((sensor) => {
              const isSelected = selectedSensor === sensor.id;
              const isAnomaly = sensor.id === 'C';
              
              return (
                <div
                  key={`map-${sensor.id}`}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{ top: sensor.pos.top, left: sensor.pos.left }}
                >
                  {/* Pulse effect for anomaly when selected */}
                  {isSelected && isAnomaly && (
                    <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                  )}
                  <button
                    onClick={() => handleSelect(sensor.id)}
                    disabled={isSuccess}
                    className="relative group"
                  >
                    <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                      isSelected
                        ? isAnomaly
                          ? 'bg-emerald-900 border-emerald-400 scale-125 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                          : 'bg-red-900 border-red-500 animate-shake'
                        : isAnomaly && isSuccess
                          ? 'bg-emerald-900 border-emerald-400 scale-125 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                          : 'bg-slate-800 border-blue-500/50 hover:border-blue-400 hover:scale-110'
                    }`}>
                      <span className={`font-bold text-sm ${isSelected && isAnomaly ? 'text-emerald-400' : isSelected ? 'text-red-400' : 'text-blue-400'}`}>
                        {sensor.id}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Sensor Data List */}
          <div className="w-full lg:w-1/2 flex flex-col gap-3">
            <p className="text-lg font-bold mb-2">
              Données Télémétriques :
            </p>
            <div className="grid grid-cols-1 gap-3">
              {sensors.map((sensor) => {
                const isSelected = selectedSensor === sensor.id;
                const isAnomaly = sensor.id === 'C';
                const pressurePercent = (sensor.pressure / 5) * 100;

                return (
                  <button
                    key={sensor.id}
                    onClick={() => handleSelect(sensor.id)}
                    disabled={isSuccess}
                    className={`relative p-3 rounded-lg border-2 flex flex-col items-start transition-all duration-300 ${
                      isSelected
                        ? isAnomaly
                          ? 'bg-emerald-900/40 border-emerald-500 scale-[1.02]'
                          : 'bg-red-900/40 border-red-500 animate-shake'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex justify-between w-full mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSelected && isAnomaly ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {sensor.id}
                        </div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">{sensor.location}</span>
                      </div>
                      {isSelected && !isAnomaly && <AlertCircle className="w-4 h-4 text-red-500" />}
                      {isSelected && isAnomaly && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    
                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 uppercase">Pression</span>
                        <span className={`font-bold ${
                          isSelected && !isAnomaly ? 'text-white' : 
                          isSelected && isAnomaly ? 'text-white drop-shadow-md' : 'text-slate-300'
                        }`}>{sensor.pressure} bar</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${
                            isSelected && !isAnomaly ? 'bg-red-500' : 
                            isSelected && isAnomaly ? 'bg-emerald-500' : 
                            sensor.pressure < 3 ? 'bg-blue-400' : 'bg-blue-600'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pressurePercent}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Water leak animation for the anomaly if selected */}
                    {isSelected && isAnomaly && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400/30"
                      >
                        <Waves className="w-12 h-12" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center mt-4 font-bold"
          >
            Erreur d'analyse. Ce capteur indique une pression normale.
          </motion.p>
        )}

        <AnimatePresence>
          {isRepairing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
            >
              <div className="text-center p-8 bg-slate-900 border border-emerald-500 rounded-2xl">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-white">Réparation en cours...</h3>
                <p className="text-slate-400">Isolément de la fuite et colmatage du réseau.</p>
              </div>
            </motion.div>
          )}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center mt-5 p-6 bg-emerald-950/30 border border-emerald-500/50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl mb-4">
                <CheckCircle2 className="w-6 h-6" />
                FUITE ISOLÉE AVEC SUCCÈS
              </div>
              <p className="text-center mb-6 text-sm">
                L'<TechTerm term="IA" /> a identifié la chute de pression anormale dans la Zone Industrielle. Les équipes d'intervention sont en route. L'<TechTerm term="IA" /> peut analyser des milliers de capteurs en temps réel pour prévenir le gaspillage.
              </p>
              <button
                onClick={onComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                PASSER À L'ÉTAPE SUIVANTE
              </button>
            </motion.div>
          )}
        </AnimatePresence>

              </div>
    </motion.div>
  );
}
