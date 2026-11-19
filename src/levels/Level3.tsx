import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radar, Search, AlertCircle, CheckCircle2, Wrench, Droplets, ShieldCheck } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import LevelHeader from '../components/LevelHeader';
import LevelShell from '../components/LevelShell';
import ActionButton from '../components/ActionButton';
import LevelSuccessCard from '../components/LevelSuccessCard';
import Collapsible from '../components/Collapsible';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';
import { EASE_OUT_EXPO } from '../utils/motion';

export default function Level3({ onComplete, onScoreUpdate, onMistake }: { onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [scannedSensors, setScannedSensors] = useState<string[]>([]);
  const [failedSensors, setFailedSensors] = useState<string[]>([]);
  const [lastFailedSensor, setLastFailedSensor] = useState<string | null>(null);
  const { errorMsg, isErrorFlash, triggerError, clearError } = useErrorFeedback();

  // Repair phases: 'idle' | 'detecting' | 'repairing' | 'done'
  const [repairPhase, setRepairPhase] = useState<'idle' | 'detecting' | 'repairing' | 'done'>('idle');
  const [repairSubStage, setRepairSubStage] = useState<'isolating' | 'closing'>('isolating');
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

  // Smooth milestone timers for repair phase (bar itself is GPU-animated by Motion)
  useEffect(() => {
    if (repairPhase !== 'repairing') return;
    setRepairSubStage('isolating');
    const midTimer = setTimeout(() => {
      setRepairSubStage('closing');
    }, 750);
    const doneTimer = setTimeout(() => {
      setRepairPhase('done');
      soundManager.playSuccess();
      if (!hasScoredRef.current) {
        setHasScored(true);
        onScoreUpdateRef.current(150, 35);
      }
    }, 1450);
    return () => {
      clearTimeout(midTimer);
      clearTimeout(doneTimer);
    };
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
    if (failedSensors.includes(id)) return;
    soundManager.playClick();
    setScannedSensors(prev => (prev.includes(id) ? prev : [...prev, id]));
    setSelectedSensor(id);
    setLastFailedSensor(null);
    clearError();
  };

  const handleConfirm = () => {
    if (repairPhase !== 'idle' || !selectedSensor) return;
    if (failedSensors.includes(selectedSensor)) return;

    if (selectedSensor === 'C') {
      setLastFailedSensor(null);
      clearError();
      setRepairPhase('detecting');
      // After detection phase, start repair
      detectTimerRef.current = setTimeout(() => {
        setRepairPhase('repairing');
      }, 750);
    } else {
      const wrongId = selectedSensor;
      setFailedSensors(prev => (prev.includes(wrongId) ? prev : [...prev, wrongId]));
      setLastFailedSensor(wrongId);
      setSelectedSensor(null);
      triggerError(
        wrongId === 'B'
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
    <LevelShell wide>
      
      <LevelHeader level={3} icon={Radar} />

      <div className="mb-3.5">
        <NaiaDialogue
          hydra={{
            status: 'hostile',
            message: "Chute de pression détectée sur le réseau municipal. Pompage compensatoire maintenu pour sécuriser les serveurs.",
          }}
          message={
            <>
              Le refroidissement d'HYDRA est stabilisé, mais les réserves continuent de baisser : une fuite souterraine aggrave la pénurie ! Heureusement, l'<TechTerm term="IA" /> croise la pression et le débit la nuit (03h00) pour éviter les faux positifs.
            </>
          }
          objective="Scannez les capteurs sur la carte radar pour révéler leur télémétrie, puis isolez celui qui cumule une baisse de pression ET un débit nocturne anormalement élevé."
          reaction={errorMsg ? { message: errorMsg, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={isSuccess ? 'happy' : 'neutral'}
        />
      </div>

      <div className="space-y-4 text-slate-300">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Interactive Radar Map */}
          <div className="w-full lg:w-1/2 flex flex-col gap-0">
            <div className="relative bg-slate-950 rounded-2xl border border-white/10 min-h-[350px] overflow-hidden">
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
              
              {/* Radar Sweep Line — GPU translateY animation without layout reflow */}
              {!isSuccess && (
                <motion.div
                  className="absolute inset-0 z-10 pointer-events-none will-change-transform"
                  initial={{ y: '-16%' }}
                  animate={{ y: '100%' }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
                >
                  <div
                    className="w-full h-14 transition-colors duration-500"
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

              {/* Radar scan progress badge */}
              <div className="absolute top-3 left-3 z-30 pointer-events-none flex items-center gap-2 bg-slate-950/85 border border-cyan-500/30 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                <Radar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                  Relevés : {scannedSensors.length} / {sensors.length}
                </span>
              </div>
              {scannedSensors.length < sensors.length && repairPhase === 'idle' && (
                <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-none flex justify-center">
                  <span className="text-[10px] font-mono text-slate-300 bg-slate-950/85 border border-slate-700/80 px-2.5 py-1 rounded-full">
                    Cliquez sur un capteur de la carte pour lancer le scan
                  </span>
                </div>
              )}

              {/* Sensors on Map */}
              {sensors.map((sensor) => {
                const isSelected = selectedSensor === sensor.id;
                const isScanned = scannedSensors.includes(sensor.id);
                const isAnomaly = sensor.id === 'C';
                const isFailed = failedSensors.includes(sensor.id);
                const isLastFailed = isFailed && lastFailedSensor === sensor.id;
                
                return (
                  <div
                    key={`map-${sensor.id}`}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                    style={{ top: sensor.pos.top, left: sensor.pos.left }}
                  >
                    {/* Subtle sonar cue for unscanned sensors */}
                    {!isScanned && repairPhase === 'idle' && (
                      <motion.div
                        className="absolute inset-[-5px] rounded-full border border-cyan-400/45 pointer-events-none"
                        animate={{ scale: [1, 1.55], opacity: [0.55, 0] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                      />
                    )}

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

                    <button
                      onClick={() => handleSelect(sensor.id)}
                      disabled={repairPhase !== 'idle' || isFailed}
                      aria-pressed={isSelected}
                      aria-label={
                        isFailed
                          ? `Capteur ${sensor.id} (${sensor.location}), déjà écarté`
                          : isScanned
                            ? `Sélectionner le capteur ${sensor.id} (${sensor.location}), déjà scanné`
                            : `Scanner le capteur ${sensor.id} (${sensor.location})`
                      }
                      className="relative group"
                    >
                      <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                        isAnomaly && isActive
                          ? 'bg-amber-900 border-amber-400 scale-125'
                          : isAnomaly && isSuccess
                            ? 'bg-emerald-900 border-emerald-400 scale-125'
                            : isFailed
                              ? `bg-red-950/75 border-red-500/50 opacity-60 ${isLastFailed && isErrorFlash ? 'animate-shake' : ''}`
                              : isSelected
                                ? 'bg-cyan-950 border-cyan-400 scale-115 shadow-[0_0_16px_rgba(34,211,238,0.4)]'
                                : isScanned
                                  ? 'bg-slate-800 border-emerald-400/70 hover:border-cyan-400 hover:shadow-[0_0_14px_rgba(34,211,238,0.3)]'
                                  : 'bg-slate-900 border-blue-500/50 hover:border-cyan-400 hover:shadow-[0_0_14px_rgba(96,165,250,0.35)]'
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
                            isFailed ? 'text-red-400' : isSelected ? 'text-cyan-300' : isScanned ? 'text-emerald-300' : 'text-blue-400'
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

            {/* Inline Repair Progress Bar — smooth collapsible drawer */}
            <Collapsible isOpen={isActive || isSuccess} innerClassName="pt-3">
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
                      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    >
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </motion.div>
                  ) : repairPhase === 'detecting' ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                    >
                      <Search className="w-5 h-5 text-amber-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={{ rotate: [0, -15, 15, 0] }}
                      transition={{ duration: 0.55, repeat: Infinity }}
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
                      width: repairPhase === 'detecting' ? '32%' : '100%'
                    }}
                    transition={{
                      duration: repairPhase === 'detecting' ? 0.75 : repairPhase === 'repairing' ? 1.45 : 0.25,
                      ease: EASE_OUT_EXPO
                    }}
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
                    { label: 'Isolation', active: repairPhase === 'repairing' && repairSubStage === 'isolating', done: (repairPhase === 'repairing' && repairSubStage === 'closing') || isSuccess },
                    { label: 'Fermeture', active: repairPhase === 'repairing' && repairSubStage === 'closing', done: isSuccess },
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
            </Collapsible>
          </div>

          {/* Sensor Data List */}
          <div className="w-full lg:w-1/2 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Relevés télémétriques (03h00)
              </p>
              <span className="text-[11px] font-mono text-slate-400">
                {scannedSensors.length}/{sensors.length} scannés
              </span>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/75 overflow-hidden divide-y divide-white/[0.06]">
              {/* Compact Column Header */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 bg-slate-900/80 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                <span>Capteur · Secteur</span>
                <span className="w-16 text-right">Pression</span>
                <span className="w-20 text-right">Débit 03h</span>
              </div>

              {sensors.map((sensor) => {
                const isSelected = selectedSensor === sensor.id;
                const isScanned = scannedSensors.includes(sensor.id) || isSuccess;
                const isAnomaly = sensor.id === 'C';
                const isFailed = failedSensors.includes(sensor.id);
                const isLastFailed = isFailed && lastFailedSensor === sensor.id;

                return (
                  <button
                    key={sensor.id}
                    type="button"
                    onClick={() => handleSelect(sensor.id)}
                    disabled={repairPhase !== 'idle' || isFailed}
                    aria-pressed={isSelected}
                    className={`w-full text-left px-3 py-2.5 transition-all cursor-pointer ${
                      isAnomaly && isActive
                        ? 'bg-amber-900/30 border-l-2 border-l-amber-400'
                        : isAnomaly && isSuccess
                          ? 'bg-emerald-900/35 border-l-2 border-l-emerald-400'
                          : isFailed
                            ? `bg-red-950/20 opacity-60 cursor-not-allowed ${isLastFailed && isErrorFlash ? 'animate-shake' : ''}`
                            : isSelected
                              ? 'bg-cyan-950/45 border-l-2 border-l-cyan-400'
                              : 'hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isAnomaly && isActive
                            ? 'bg-amber-500 text-slate-900'
                            : isAnomaly && isSuccess
                              ? 'bg-emerald-500 text-slate-900'
                              : isFailed
                                ? 'bg-red-950 text-red-300 border border-red-500/40'
                                : isSelected
                                  ? 'bg-cyan-400 text-slate-950'
                                  : isScanned
                                    ? 'bg-slate-800 text-emerald-300'
                                    : 'bg-slate-900 text-slate-500 border border-slate-700'
                        }`}>
                          {sensor.id}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-[13px] font-semibold text-white truncate">
                              {sensor.location}
                            </span>
                            {isFailed && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase text-red-400 shrink-0">
                                <AlertCircle className="w-3 h-3" /> Écarté
                              </span>
                            )}
                            {isAnomaly && isActive && (
                              <motion.div animate={{ rotate: [0, -15, 15, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>
                                <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              </motion.div>
                            )}
                            {isAnomaly && isSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {isScanned ? sensor.note : 'Cliquer pour lancer le scan'}
                          </div>
                        </div>
                      </div>

                      {!isScanned ? (
                        <div className="col-span-2 flex justify-end">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-cyan-400/90 bg-cyan-950/40 border border-cyan-500/25 px-2 py-0.5 rounded-full">
                            <Radar className="w-3 h-3" /> Scanner
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className={`w-16 text-right font-mono text-xs sm:text-[13px] font-bold tabular-nums ${
                            isFailed
                              ? 'text-red-300'
                              : isAnomaly && isActive
                                ? 'text-amber-300'
                                : isAnomaly && isSuccess
                                  ? 'text-emerald-300'
                                  : isSelected
                                    ? 'text-white'
                                    : 'text-slate-200'
                          }`}>
                            {sensor.pressure.toFixed(1).replace('.', ',')} bar
                          </span>
                          <span className={`w-20 text-right font-mono text-xs sm:text-[13px] font-bold tabular-nums ${
                            isFailed
                              ? 'text-red-300/80'
                              : isAnomaly && isSuccess
                                ? 'text-emerald-300'
                                : 'text-cyan-300'
                          }`}>
                            {sensor.nightFlow} L/min
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Confirm selected sensor button */}
        {repairPhase === 'idle' && (
          <div className="flex justify-center pt-1">
            <ActionButton
              onClick={handleConfirm}
              disabled={!selectedSensor}
              isError={isErrorFlash}
            >
              <Wrench className="w-5 h-5" />
              {isErrorFlash
                ? 'FAUSSE PISTE : RÉANALYSEZ'
                : selectedSensor
                ? `ISOLER LA FUITE (CAPTEUR ${selectedSensor})`
                : 'SÉLECTIONNEZ UN CAPTEUR'}
            </ActionButton>
          </div>
        )}

        {/* Success panel — inline, no modal */}
        <AnimatePresence>
          {isSuccess && (
            <LevelSuccessCard
              title="FUITE ISOLÉE AVEC SUCCÈS"
              description={
                <>
                  L'<TechTerm term="IA" /> a croisé la chute de pression (3,7 bar) avec le débit nocturne anormal (46 L/min alors que les usines sont fermées). Les équipes d'intervention sont en route !
                </>
              }
              buttonLabel="PASSER À L'ÉTAPE SUIVANTE"
              onContinue={onComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </LevelShell>
  );
}
