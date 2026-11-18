import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Search, AlertCircle, CheckCircle2, Waves, Wrench, Droplets, ShieldCheck } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

export default function Level3({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [failedSensors, setFailedSensors] = useState<string[]>([]);
  const { errorMsg, isErrorFlash, triggerError, clearError } = useErrorFeedback();

  // Repair phases: 'idle' | 'detecting' | 'repairing' | 'done'
  const [repairPhase, setRepairPhase] = useState<'idle' | 'detecting' | 'repairing' | 'done'>('idle');
  const [repairProgress, setRepairProgress] = useState(0);
  const [hasScored, setHasScored] = useState(false);

  // Stable refs to avoid useEffect re-triggering on every App render
  const onScoreUpdateRef = useRef(onScoreUpdate);
  onScoreUpdateRef.current = onScoreUpdate;
  const hasScoredRef = useRef(hasScored);
  hasScoredRef.current = hasScored;
  const detectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (detectTimerRef.current) clearTimeout(detectTimerRef.current);
    };
  }, []);

  // Repair progress animation
  useEffect(() => {
    if (repairPhase !== 'repairing') return;
    setRepairProgress(0);
    const duration = 2500; // 2.5 seconds total
    const steps = 50;
    const stepTime = duration / steps;
    let current = 0;

    const interval = setInterval(() => {
      current++;
      setRepairProgress(Math.min((current / steps) * 100, 100));
      if (current >= steps) {
        clearInterval(interval);
        setRepairPhase('done');
        soundManager.playSuccess();
        if (!hasScoredRef.current) {
          setHasScored(true);
          onScoreUpdateRef.current(150, 35);
        }
      }
    }, stepTime);
    return () => clearInterval(interval);
  }, [repairPhase]);

  const sensors = [
    { id: 'A', pressure: 4.4, nightFlow: 5, status: 'Normal', location: 'Quartier Nord', note: 'Consommation domestique minimale', pos: { top: '20%', left: '30%' } },
    { id: 'B', pressure: 4.3, nightFlow: 26, status: 'Faux positif', location: 'Centre-Ville', note: 'Nettoyage voirie & hôpital programmés', pos: { top: '40%', left: '50%' } },
    { id: 'C', pressure: 3.7, nightFlow: 46, status: 'Anomalie', location: 'Zone Industrielle', note: 'Usines fermées la nuit', pos: { top: '70%', left: '70%' } },
    { id: 'D', pressure: 4.5, nightFlow: 4, status: 'Normal', location: 'Quartier Sud', note: 'Quartier résidentiel (nuit)', pos: { top: '80%', left: '30%' } },
    { id: 'E', pressure: 4.2, nightFlow: 6, status: 'Normal', location: 'Banlieue Est', note: 'Commerces & bureaux fermés', pos: { top: '30%', left: '80%' } },
  ];

  const handleSelect = (id: string) => {
    if (repairPhase !== 'idle') return;
    if (id !== 'C' && failedSensors.includes(id)) return;
    soundManager.playClick();
    setSelectedSensor(id);
    if (id === 'C') {
      clearError();
      setRepairPhase('detecting');
      // After detection phase, start repair
      detectTimerRef.current = setTimeout(() => {
        setRepairPhase('repairing');
      }, 1200);
    } else {
      setFailedSensors(prev => (prev.includes(id) ? prev : [...prev, id]));
      triggerError(
        id === 'B'
          ? "Faux positif ! Le débit nocturne est modéré (26 L/min pour le nettoyage programmé), mais la pression reste normale (4,3 bar) : ce n'est pas une fuite."
          : "Erreur d'analyse. Ce secteur présente une pression et un débit nocturne normaux."
      );
      onMistake?.();
    }
  };

  const isSuccess = repairPhase === 'done';
  const isActive = repairPhase === 'detecting' || repairPhase === 'repairing';

  // Repair status label helper
  const getRepairStatusText = () => {
    if (repairPhase === 'detecting') return 'Analyse de la fuite...';
    if (repairPhase === 'repairing') return 'Fermeture des vannes de secteur...';
    if (repairPhase === 'done') return 'Fuite isolée avec succès !';
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-2xl max-w-4xl mx-auto relative flex flex-col backdrop-blur-xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)]"
    >
      
      <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
        <Activity className="w-7 h-7 text-emerald-400 shrink-0" />
        <h2 className="font-mono text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 3 : Détection de Fuites
        </h2>
      </div>

      <div className="mb-4">
        <NaiaDialogue 
          message={
            <>
              Le refroidissement d'HYDRA est stabilisé, mais les réserves continuent de baisser : une fuite souterraine aggrave la pénurie ! Heureusement, l'<TechTerm term="IA" /> croise la pression et le débit la nuit (03h00) pour éviter les faux positifs.
            </>
          }
          objective="Repérez et cliquez sur le capteur qui cumule une baisse de pression ET un débit nocturne anormalement élevé."
          reaction={errorMsg ? { message: errorMsg, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={isSuccess ? 'happy' : 'neutral'}
        />
      </div>

      <div className="space-y-4 text-slate-300">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Interactive Radar Map */}
          <div className="w-full lg:w-1/2 flex flex-col gap-0">
            <div className="relative bg-slate-950 rounded-xl border border-slate-800 min-h-[350px] overflow-hidden">
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
              
              {/* Radar Sweep Line — CSS/Motion animation without component re-renders */}
              {!isSuccess && (
                <motion.div
                  className="absolute left-0 right-0 h-14 z-10 pointer-events-none"
                  initial={{ top: '-14%' }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
                >
                  <div
                    className="w-full h-full transition-colors duration-500"
                    style={{
                      background: isActive
                        ? 'linear-gradient(to bottom, transparent, rgba(245, 158, 11, 0.10))'
                        : 'linear-gradient(to bottom, transparent, rgba(16, 185, 129, 0.12))'
                    }}
                  />
                  <div
                    className="w-full h-0.5 transition-colors duration-500"
                    style={{
                      backgroundColor: isActive ? 'rgba(245, 158, 11, 0.55)' : 'rgba(16, 185, 129, 0.45)',
                      boxShadow: isActive ? '0 0 12px rgba(245, 158, 11, 0.6)' : '0 0 10px rgba(16,185,129,0.5)'
                    }}
                  />
                </motion.div>
              )}

              {/* Repair glow overlay on map during active repair */}
              <AnimatePresence>
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-5 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 70% 70%, rgba(245, 158, 11, 0.08) 0%, transparent 60%)'
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Success glow overlay */}
              <AnimatePresence>
                {isSuccess && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-5 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 70% 70%, rgba(16, 185, 129, 0.12) 0%, transparent 60%)'
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Network Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <line x1="30%" y1="20%" x2="50%" y2="40%" className="stroke-slate-700" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="50%" y1="40%" x2="30%" y2="80%" className="stroke-slate-700" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="50%" y1="40%" x2="80%" y2="30%" className="stroke-slate-700" strokeWidth="2" strokeDasharray="4 4" />
                
                {/* Animated pipe to anomaly sensor */}
                <line 
                  x1="50%" y1="40%" x2="70%" y2="70%" 
                  className={
                    isSuccess 
                      ? "stroke-emerald-500" 
                      : isActive 
                        ? "stroke-amber-500" 
                        : "stroke-slate-700"
                  } 
                  strokeWidth={isSuccess || isActive ? "3" : "2"} 
                  strokeDasharray={isSuccess ? "none" : isActive ? "8 4" : "4 4"}
                  style={isActive ? { 
                    filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))',
                    animation: 'pipeFlow 1s linear infinite'
                  } : isSuccess ? {
                    filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))'
                  } : {}}
                />
              </svg>

              {/* Water droplets escaping during repair animation */}
              <AnimatePresence>
                {repairPhase === 'detecting' && (
                  <>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={`drop-${i}`}
                        initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
                        animate={{ 
                          opacity: [0, 0.7, 0], 
                          y: [0, 20 + i * 8, 40 + i * 6],
                          x: [0, (i % 2 === 0 ? 1 : -1) * (5 + i * 3)],
                          scale: [0, 1, 0.5]
                        }}
                        transition={{ 
                          duration: 1.2, 
                          delay: i * 0.2, 
                          repeat: Infinity,
                          ease: 'easeOut'
                        }}
                        className="absolute z-30 pointer-events-none"
                        style={{ top: '68%', left: '69%' }}
                      >
                        <Droplets className="w-3 h-3 text-blue-400" />
                      </motion.div>
                    ))}
                  </>
                )}
              </AnimatePresence>

              {/* Sensors on Map */}
              {sensors.map((sensor) => {
                const isSelected = selectedSensor === sensor.id;
                const isAnomaly = sensor.id === 'C';
                const isFailed = failedSensors.includes(sensor.id);
                const isLastFailed = isFailed && isSelected;
                
                return (
                  <div
                    key={`map-${sensor.id}`}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                    style={{ top: sensor.pos.top, left: sensor.pos.left }}
                  >
                    {/* Expanding rings for anomaly during repair */}
                    {isAnomaly && isActive && (
                      <>
                        <motion.div
                          className="absolute inset-[-8px] rounded-full border-2 border-amber-500/40 pointer-events-none"
                          animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                        />
                        <motion.div
                          className="absolute inset-[-4px] rounded-full border border-amber-400/30 pointer-events-none"
                          animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                        />
                      </>
                    )}

                    {/* Success pulse rings */}
                    {isAnomaly && isSuccess && (
                      <motion.div
                        className="absolute inset-[-6px] rounded-full border-2 border-emerald-400/30 pointer-events-none"
                        animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                      />
                    )}

                    {/* Pulse effect for anomaly when selected */}
                    {isSelected && isAnomaly && !isActive && (
                      <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                    )}
                    <button
                      onClick={() => handleSelect(sensor.id)}
                      disabled={repairPhase !== 'idle' || isFailed}
                      aria-label={isFailed ? `Capteur ${sensor.id} (${sensor.location}) — déjà écarté` : `Sélectionner le capteur ${sensor.id} (${sensor.location})`}
                      className="relative group"
                    >
                      <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                        isAnomaly && isActive
                          ? 'bg-amber-900 border-amber-400 scale-125'
                          : isSelected && isAnomaly
                            ? 'bg-emerald-900 border-emerald-400 scale-125'
                            : isFailed
                              ? `bg-red-950/75 border-red-500/50 opacity-60 ${isLastFailed && isErrorFlash ? 'animate-shake' : ''}`
                              : isAnomaly && isSuccess
                                ? 'bg-emerald-900 border-emerald-400 scale-125'
                                : 'bg-slate-800 border-blue-500/50 hover:border-blue-400 hover:shadow-[0_0_14px_rgba(96,165,250,0.3)]'
                      }`}>
                        {/* Wrench icon during repair */}
                        {isAnomaly && isActive ? (
                          <motion.div
                            animate={{ rotate: [0, -20, 20, -20, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                          >
                            <Wrench className="w-4 h-4 text-amber-400" />
                          </motion.div>
                        ) : isAnomaly && isSuccess ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <span className={`font-bold text-sm ${
                            isSelected && isAnomaly ? 'text-emerald-400' : isFailed ? 'text-red-400' : 'text-blue-400'
                          }`}>
                            {sensor.id}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Inline Repair Progress Bar — replaces the old modal */}
            <AnimatePresence>
              {(isActive || isSuccess) && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className={`rounded-xl border p-4 transition-colors duration-500 ${
                    isSuccess 
                      ? 'bg-emerald-950/40 border-emerald-500/50' 
                      : 'bg-amber-950/30 border-amber-500/40'
                  }`}>
                    {/* Status header */}
                    <div className="flex items-center gap-3 mb-3">
                      {isSuccess ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        </motion.div>
                      ) : repairPhase === 'detecting' ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Search className="w-5 h-5 text-amber-400" />
                        </motion.div>
                      ) : (
                        <motion.div
                          animate={{ rotate: [0, -15, 15, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        >
                          <Wrench className="w-5 h-5 text-amber-400" />
                        </motion.div>
                      )}
                      <span className={`text-sm font-bold uppercase tracking-wider ${
                        isSuccess ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {getRepairStatusText()}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                      <motion.div
                        className={`h-full rounded-full ${
                          isSuccess ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        initial={{ width: '0%' }}
                        animate={{ 
                          width: repairPhase === 'detecting' ? '30%' 
                            : isSuccess ? '100%' 
                            : `${Math.max(30, repairProgress)}%` 
                        }}
                        transition={{ duration: repairPhase === 'detecting' ? 1.2 : 0.1 }}
                        style={!isSuccess ? {
                          boxShadow: '0 0 10px rgba(245, 158, 11, 0.5), 0 0 20px rgba(245, 158, 11, 0.2)'
                        } : {
                          boxShadow: '0 0 10px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.2)'
                        }}
                      />
                    </div>

                    {/* Step indicators */}
                    <div className="flex justify-between text-xs mt-2">
                      {[
                        { label: 'Détection', active: repairPhase === 'detecting', done: repairPhase === 'repairing' || isSuccess },
                        { label: 'Isolation', active: repairPhase === 'repairing' && repairProgress < 50, done: (repairPhase === 'repairing' && repairProgress >= 50) || isSuccess },
                        { label: 'Fermeture', active: repairPhase === 'repairing' && repairProgress >= 50, done: isSuccess },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            step.done 
                              ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' 
                              : step.active 
                                ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)] animate-pulse' 
                                : 'bg-slate-700'
                          }`} />
                          <span className={`transition-colors duration-300 ${
                            step.done ? 'text-emerald-400' : step.active ? 'text-amber-400' : 'text-slate-600'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                const isFailed = failedSensors.includes(sensor.id);
                const isLastFailed = isFailed && isSelected;
                const pressurePercent = (sensor.pressure / 5) * 100;

                return (
                  <button
                    key={sensor.id}
                    onClick={() => handleSelect(sensor.id)}
                    disabled={repairPhase !== 'idle' || isFailed}
                    className={`relative p-3 rounded-lg border-2 flex flex-col items-start transition-all duration-300 ${
                      isAnomaly && isActive
                        ? 'bg-amber-900/30 border-amber-500/60 scale-[1.02]'
                        : isSelected && isAnomaly
                          ? 'bg-emerald-900/40 border-emerald-500 scale-[1.02]'
                          : isFailed
                            ? `bg-red-950/25 border-red-500/45 opacity-65 ${isLastFailed && isErrorFlash ? 'animate-shake' : ''}`
                            : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex justify-between w-full mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          isAnomaly && isActive 
                            ? 'bg-amber-500 text-slate-900' 
                            : isSelected && isAnomaly 
                              ? 'bg-emerald-500 text-slate-900' 
                              : isFailed
                                ? 'bg-red-950 text-red-300 border border-red-500/40'
                                : 'bg-slate-800 text-slate-300'
                        }`}>
                          {sensor.id}
                        </div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">{sensor.location}</span>
                      </div>
                      {isFailed && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-400 shrink-0">
                          <AlertCircle className="w-3.5 h-3.5" /> Écarté
                        </span>
                      )}
                      {isAnomaly && isActive && (
                        <motion.div animate={{ rotate: [0, -15, 15, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>
                          <Wrench className="w-4 h-4 text-amber-500" />
                        </motion.div>
                      )}
                      {isSelected && isAnomaly && !isActive && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 uppercase">Pression • <span className="normal-case text-slate-400">{sensor.note}</span></span>
                        <span className={`font-bold ${
                          isFailed ? 'text-red-200' : 
                          isAnomaly && isActive ? 'text-amber-300' :
                          isSelected && isAnomaly ? 'text-white drop-shadow-md' : 'text-slate-300'
                        }`}>{sensor.pressure} bar</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${
                            isFailed ? 'bg-red-500/75' : 
                            isAnomaly && isActive ? 'bg-amber-500' :
                            isSelected && isAnomaly ? 'bg-emerald-500' : 
                            'bg-blue-600'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pressurePercent}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="flex justify-between text-xs pt-0.5">
                        <span className="text-slate-500 uppercase">Débit nocturne (03h00)</span>
                        <span className="font-bold text-cyan-300">{sensor.nightFlow} L/min</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${
                            isFailed ? 'bg-red-500/75' :
                            isAnomaly && isActive ? 'bg-amber-500' :
                            isSelected && isAnomaly ? 'bg-emerald-500' :
                            'bg-cyan-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((sensor.nightFlow / 50) * 100, 100)}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Water leak animation for the anomaly if selected */}
                    {isAnomaly && (isActive || (isSelected && !isSuccess)) && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isActive ? [0.5, 0.2, 0.5] : 1 }}
                        transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
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

        {/* Success panel — inline, no modal */}
        <AnimatePresence>
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
                L'<TechTerm term="IA" /> a croisé la chute de pression (3,7 bar) avec le débit nocturne anormal (46 L/min alors que les usines sont fermées). Les équipes d'intervention sont en route !
              </p>
              <button
                onClick={onComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-all hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]"
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
