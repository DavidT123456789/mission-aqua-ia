import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, Gauge, Server, ArrowRight } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import LevelHeader from '../components/LevelHeader';
import LevelShell from '../components/LevelShell';
import MissionWorkspace from '../components/MissionWorkspace';
import ActionButton from '../components/ActionButton';
import LevelSuccessCard from '../components/LevelSuccessCard';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

const VALVES = [
  { id: 1, flow: 65, pipeClass: 'w-5 sm:w-7', flangeClass: 'w-7 sm:w-9' },
  { id: 2, flow: 45, pipeClass: 'w-4 sm:w-5', flangeClass: 'w-6 sm:w-7' },
  { id: 3, flow: 75, pipeClass: 'w-6 sm:w-8', flangeClass: 'w-8 sm:w-10' },
  { id: 4, flow: 25, pipeClass: 'w-3 sm:w-4', flangeClass: 'w-5 sm:w-6' },
  { id: 5, flow: 15, pipeClass: 'w-2.5 sm:w-3', flangeClass: 'w-4 sm:w-5' },
];

const TARGET_FLOW = 135;
const MAX_FLOW = VALVES.reduce((acc, v) => acc + v.flow, 0); // 225 L/s
const TARGET_PERCENT = (TARGET_FLOW / MAX_FLOW) * 100; // 60%

const FLUID_STREAM_X =
  'repeating-linear-gradient(90deg, transparent 0px, rgba(165,243,252,0.08) 12px, rgba(165,243,252,0.48) 26px, rgba(255,255,255,0.72) 32px, rgba(165,243,252,0.22) 37px, transparent 42px, transparent 48px)';
const FLUID_STREAM_Y =
  'repeating-linear-gradient(180deg, transparent 0px, rgba(165,243,252,0.1) 8px, rgba(165,243,252,0.5) 18px, rgba(255,255,255,0.78) 22px, rgba(165,243,252,0.2) 26px, transparent 30px, transparent 32px)';

export default function Level2({ onComplete, onScoreUpdate, onMistake }: { onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  // Toutes les vannes démarrent ouvertes, conformément au briefing de NAÏA
  const [activeValves, setActiveValves] = useState<number[]>(() => VALVES.map(v => v.id));
  const [measuredFlow, setMeasuredFlow] = useState<number | null>(null);
  const { errorMsg, isErrorFlash: showError, triggerError, clearError } = useErrorFeedback();
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasScored, setHasScored] = useState(false);

  const currentFlow = activeValves.reduce((acc, id) => {
    const valve = VALVES.find(v => v.id === id);
    return acc + (valve ? valve.flow : 0);
  }, 0);

  const toggleValve = (id: number) => {
    if (isSuccess) return;
    soundManager.playClick();
    clearError();
    setMeasuredFlow(null);
    setActiveValves(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleValidate = () => {
    setMeasuredFlow(currentFlow);
    if (currentFlow === TARGET_FLOW) {
      setIsSuccess(true);
      clearError();
      soundManager.playSuccess();
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(100, 28);
      }
    } else {
      triggerError(
        currentFlow > TARGET_FLOW
          ? `Surpression (${currentFlow} L/s) : fermez encore ${currentFlow - TARGET_FLOW} L/s pour atteindre exactement ${TARGET_FLOW} L/s.`
          : `Débit insuffisant (${currentFlow} L/s) : il manque ${TARGET_FLOW - currentFlow} L/s pour refroidir les serveurs.`
      );
      onMistake?.();
    }
  };

  const meterState =
    measuredFlow === null
      ? 'idle'
      : measuredFlow > TARGET_FLOW
      ? 'over'
      : measuredFlow === TARGET_FLOW
      ? 'ok'
      : 'under';

  // Par conservation du débit (Q = v × S), à section égale entre le collecteur haut et bas,
  // la vitesse globale en entrée et en sortie est identique et proportionnelle à currentFlow.
  const manifoldDuration = currentFlow > 0 ? Math.min(4.8, Math.max(0.55, 135 / currentFlow)) : 0;
  const manifoldStreamOpacity = 0.25 + (currentFlow / MAX_FLOW) * 0.5;
  const openCount = activeValves.length;
  const openValvesLabel =
    openCount === 0
      ? 'Aucune vanne ouverte.'
      : openCount === 1
      ? '1 vanne ouverte.'
      : `${openCount} vannes ouvertes.`;

  return (
    <LevelShell wide>
      <LevelHeader level={2} icon={Gauge} />

      <div className="mb-3.5 sm:mb-4">
        <NaiaDialogue
          message={
            <>
              HYDRA tourne en surrégime et a ouvert toutes les vannes de ses <TechTerm term="Serveur">serveurs</TechTerm> au maximum ! Le débitmètre reste hors-ligne tant que la conduite n'est pas testée.
            </>
          }
          reaction={errorMsg ? { message: errorMsg, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={isSuccess ? 'happy' : 'neutral'}
        />
      </div>

      <MissionWorkspace
        hydra={{
          status: 'hostile',
          message: "Charge maximale détectée. Ouverture forcée de toutes les vannes à 100 %.",
        }}
        objective={
          <>
            Calculez et fermez les vannes en trop pour obtenir exactement <strong className="font-mono text-white">{TARGET_FLOW} L/s</strong> avant de tester la conduite.
          </>
        }
      >
      <div className="space-y-4 text-slate-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Valve Manifold Controls */}
          <div className="lg:col-span-7 relative p-5 sm:p-6 bg-slate-950/90 rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_32px_rgba(0,0,0,0.35)] flex flex-col justify-between gap-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Circuit de refroidissement
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-300 tabular-nums">
                Cible : {TARGET_FLOW} L/s
              </span>
            </div>

            {/* Connected Hydraulic Manifold */}
            <div className="relative z-10 flex flex-col">
              {/* Top Supply Manifold */}
              <div className="flex items-center justify-between gap-2 px-1 mb-1.5">
                <span className="text-[11px] uppercase tracking-[0.14em] text-cyan-400/90 font-bold flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  Arrivée eau froide
                </span>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  Max circuit : {MAX_FLOW} L/s
                </span>
              </div>

              <div className="h-6 w-full bg-slate-900 border border-slate-700/80 rounded-full relative overflow-hidden shadow-[inset_0_2px_6px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-800/70 via-blue-600/60 to-cyan-800/70" />
                {currentFlow > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 w-[calc(100%+48px)] animate-fluid-x will-change-transform transition-opacity duration-300"
                    style={{
                      backgroundImage: FLUID_STREAM_X,
                      opacity: manifoldStreamOpacity,
                      animationDuration: `${manifoldDuration.toFixed(2)}s`,
                    }}
                  />
                )}
                {/* Cylindrical pipe specular sheen */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.05)_30%,transparent_55%,rgba(2,6,23,0.48)_100%)]" />
              </div>

              {/* 5 Parallel Branches */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-3 px-1 sm:px-2">
                {VALVES.map((valve) => {
                  const isActive = activeValves.includes(valve.id);
                  const isPressurized = measuredFlow !== null;
                  const baseDuration = Math.max(0.65, 1.85 - valve.flow / 75);
                  const flowDuration = isPressurized ? baseDuration * 0.72 : baseDuration * 1.15;

                  return (
                    <div key={valve.id} className="flex flex-col items-center">
                      {/* Top Junction Flange */}
                      <div className={`h-1.5 ${valve.flangeClass} bg-gradient-to-b from-slate-500 via-slate-600 to-slate-800 border border-slate-500/70 rounded-sm -mt-px z-10 shadow-sm`} />

                      {/* Upstream Pipe (Supply -> Valve) */}
                      <div className={`h-5 sm:h-6 ${valve.pipeClass} bg-slate-900 border-x border-slate-700/80 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-700/65 to-blue-700/55" />
                        {isActive && (
                          <div
                            className={`absolute inset-x-0 top-0 h-[calc(100%+32px)] animate-fluid-y will-change-transform transition-opacity duration-300 ${
                              isPressurized ? 'opacity-80' : 'opacity-45'
                            }`}
                            style={{
                              backgroundImage: FLUID_STREAM_Y,
                              animationDuration: `${flowDuration.toFixed(2)}s`,
                            }}
                          />
                        )}
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(2,6,23,0.42)_0%,rgba(255,255,255,0.16)_32%,transparent_58%,rgba(2,6,23,0.42)_100%)]" />
                      </div>

                      {/* Valve Control */}
                      <button
                        type="button"
                        disabled={isSuccess}
                        onClick={() => toggleValve(valve.id)}
                        aria-pressed={isActive}
                        aria-label={`Vanne ${valve.id}, débit ${valve.flow} litres par seconde. ${isActive ? 'Actuellement ouverte' : 'Actuellement fermée'}`}
                        className={`relative w-14 h-14 sm:w-[82px] sm:h-[82px] rounded-full border-[3px] flex flex-col items-center justify-center transition-all duration-200 overflow-hidden group z-10 -my-1 ${
                          isActive
                            ? 'bg-gradient-to-b from-cyan-950/95 to-slate-950 border-cyan-400 text-cyan-100 shadow-[inset_0_2px_6px_rgba(34,211,238,0.16),inset_0_-4px_8px_rgba(2,6,23,0.6),0_0_16px_rgba(34,211,238,0.14)] hover:border-cyan-300 hover:shadow-[inset_0_2px_6px_rgba(34,211,238,0.22),0_0_20px_rgba(34,211,238,0.3)]'
                            : 'bg-gradient-to-b from-slate-800/90 to-slate-950 border-slate-700 text-slate-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),inset_0_-4px_8px_rgba(2,6,23,0.6)] hover:border-slate-500 hover:shadow-[0_0_14px_rgba(148,163,184,0.18)]'
                        } ${isSuccess ? 'cursor-default opacity-85 hover:shadow-none' : 'hover:scale-[1.03] active:scale-95'}`}
                      >
                        {/* Subtle inner ring */}
                        <span
                          aria-hidden="true"
                          className={`absolute inset-[3px] rounded-full border pointer-events-none transition-colors duration-200 ${
                            isActive ? 'border-cyan-300/20' : 'border-white/[0.04]'
                          }`}
                        />

                        {/* Peripheral gate lugs: top/bottom (flow open) vs left/right (flow blocked) */}
                        <motion.div
                          animate={{ rotate: isActive ? 90 : 0 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                          className="absolute inset-0 pointer-events-none"
                        >
                          <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-2.5 sm:h-3 rounded-r-full transition-colors duration-200 ${
                            isActive ? 'bg-cyan-400/80' : 'bg-red-500/85'
                          }`} />
                          <span className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-2.5 sm:h-3 rounded-l-full transition-colors duration-200 ${
                            isActive ? 'bg-cyan-400/80' : 'bg-red-500/85'
                          }`} />
                        </motion.div>

                        <span className={`font-black font-mono tabular-nums text-[15px] sm:text-[22px] leading-none relative z-10 transition-colors duration-200 ${
                          isActive ? 'text-cyan-100' : 'text-slate-400'
                        }`}>
                          {valve.flow}
                        </span>
                        <span className={`text-[9px] sm:text-[10px] font-bold tracking-wider leading-none mt-0.5 relative z-10 ${
                          isActive ? 'text-cyan-300/80' : 'text-slate-500'
                        }`}>
                          L/s
                        </span>
                        <span className={`mt-1 px-1.5 py-[2px] rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider leading-none relative z-10 transition-colors duration-200 ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/35'
                            : 'bg-red-500/15 text-red-400 border border-red-500/35'
                        }`}>
                          {isActive ? 'OUV' : 'FER'}
                        </span>
                      </button>

                      {/* Downstream Pipe (Valve -> Collector) */}
                      <div className={`h-16 sm:h-24 ${valve.pipeClass} bg-slate-900/95 border-x border-slate-700/80 relative overflow-hidden shadow-[inset_0_2px_6px_rgba(0,0,0,0.65)]`}>
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              className={`w-full h-full relative overflow-hidden bg-gradient-to-b transition-colors duration-300 ${
                                meterState === 'over'
                                  ? 'from-red-500/80 to-red-700/70'
                                  : meterState === 'ok'
                                  ? 'from-emerald-400/80 to-emerald-600/70'
                                  : isPressurized
                                  ? 'from-cyan-400/80 to-blue-600/75'
                                  : 'from-cyan-600/55 to-blue-700/50'
                              }`}
                              initial={{ scaleY: 0, originY: 0 }}
                              animate={{ scaleY: 1 }}
                              exit={{ scaleY: 0 }}
                              transition={{ duration: 0.22, ease: 'easeOut' }}
                            >
                              <div
                                className={`absolute inset-x-0 top-0 h-[calc(100%+32px)] animate-fluid-y will-change-transform transition-opacity duration-300 ${
                                  isPressurized ? 'opacity-85' : 'opacity-50'
                                }`}
                                style={{
                                  backgroundImage: FLUID_STREAM_Y,
                                  animationDuration: `${flowDuration.toFixed(2)}s`,
                                }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(2,6,23,0.42)_0%,rgba(255,255,255,0.16)_32%,transparent_58%,rgba(2,6,23,0.42)_100%)]" />
                      </div>

                      {/* Bottom Junction Flange */}
                      <div className={`h-1.5 ${valve.flangeClass} bg-gradient-to-b from-slate-500 via-slate-600 to-slate-800 border border-slate-500/70 rounded-sm -mb-px z-10 shadow-sm`} />
                    </div>
                  );
                })}
              </div>

              {/* Bottom Collector Manifold -> Servers */}
              <div className="h-6 w-full bg-slate-900 border border-slate-700/80 rounded-full relative overflow-hidden shadow-[inset_0_2px_6px_rgba(0,0,0,0.65)]">
                {currentFlow > 0 && (
                  <div
                    className={`absolute inset-0 transition-colors duration-300 ${
                      meterState === 'over'
                        ? 'bg-gradient-to-r from-red-700/70 via-red-500/80 to-red-600/75'
                        : meterState === 'ok'
                        ? 'bg-gradient-to-r from-emerald-700/70 via-emerald-500/80 to-emerald-400/75'
                        : meterState === 'under'
                        ? 'bg-gradient-to-r from-blue-800/65 via-blue-600/70 to-blue-500/75'
                        : 'bg-gradient-to-r from-cyan-800/60 via-blue-700/60 to-cyan-700/65'
                    }`}
                  >
                    <div
                      className="absolute inset-y-0 left-0 w-[calc(100%+48px)] animate-fluid-x will-change-transform transition-opacity duration-300"
                      style={{
                        backgroundImage: FLUID_STREAM_X,
                        opacity: manifoldStreamOpacity,
                        animationDuration: `${manifoldDuration.toFixed(2)}s`,
                      }}
                    />
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.05)_30%,transparent_55%,rgba(2,6,23,0.48)_100%)]" />
              </div>
            </div>

            {/* Clean Single-Line Manifold Footer */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 pt-3 border-t border-white/[0.06] text-[11px]">
              <span className="font-mono text-slate-400 flex items-center gap-2 whitespace-nowrap">
                <span
                  aria-hidden="true"
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    meterState === 'ok'
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                      : meterState === 'over'
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                      : meterState === 'under'
                      ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.7)]'
                      : 'bg-slate-600'
                  }`}
                />
                {measuredFlow === null ? 'Capteur hors-ligne' : 'Circuit sous pression'}
              </span>
              <span className="uppercase tracking-[0.14em] text-slate-400 font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Server className={`w-3.5 h-3.5 shrink-0 ${
                  meterState === 'ok' ? 'text-emerald-400' : meterState === 'over' ? 'text-red-400' : 'text-cyan-400'
                }`} />
                <span>Vers serveurs HYDRA</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              </span>
            </div>
          </div>

          {/* Flow Meter */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-900/75 rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_32px_rgba(0,0,0,0.35)] flex flex-col justify-between relative overflow-hidden">
            <motion.div
              className={`absolute bottom-0 left-0 right-0 opacity-10 transition-colors duration-500 pointer-events-none ${
                meterState === 'over' ? 'bg-red-500' : meterState === 'ok' ? 'bg-emerald-500' : meterState === 'under' ? 'bg-blue-500' : 'bg-slate-500'
              }`}
              initial={{ height: '0%' }}
              animate={{ height: measuredFlow !== null ? `${Math.min((measuredFlow / MAX_FLOW) * 100, 100)}%` : '0%' }}
              transition={{ type: 'spring', stiffness: 55, damping: 16 }}
            />

            {/* Meter Header */}
            <div className="relative z-10 flex items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  meterState === 'over'
                    ? 'bg-red-500/15 border-red-500/35'
                    : meterState === 'ok'
                    ? 'bg-emerald-500/15 border-emerald-500/35'
                    : meterState === 'under'
                    ? 'bg-blue-500/15 border-blue-500/35'
                    : 'bg-slate-800/80 border-white/10'
                }`}>
                  {measuredFlow === null ? (
                    <Gauge className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Droplets className={`w-4 h-4 ${
                      meterState === 'over' ? 'text-red-400' : meterState === 'ok' ? 'text-emerald-400' : 'text-blue-400'
                    }`} />
                  )}
                </div>
                <p className="text-[11px] font-mono text-slate-300 uppercase tracking-[0.16em] font-bold">
                  {measuredFlow === null ? 'Mesure en attente' : 'Débit mesuré'}
                </p>
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors duration-300 ${
                measuredFlow === null
                  ? 'bg-slate-950/70 border-white/10 text-slate-400'
                  : meterState === 'ok'
                  ? 'bg-emerald-950/60 border-emerald-500/35 text-emerald-300'
                  : meterState === 'over'
                  ? 'bg-red-950/60 border-red-500/35 text-red-300'
                  : 'bg-blue-950/60 border-blue-500/35 text-blue-300'
              }`}>
                {measuredFlow === null ? 'Hors-ligne' : 'En ligne'}
              </span>
            </div>

            {/* Digital Readout */}
            <div className="relative z-10 flex flex-col items-center justify-center my-5 py-4 px-4 rounded-xl bg-slate-950/65 border border-white/[0.07] shadow-[inset_0_2px_10px_rgba(0,0,0,0.45)]">
              <div className="h-16 sm:h-[74px] flex items-center justify-center">
                <motion.span
                  key={measuredFlow ?? 'pending'}
                  initial={{ scale: 1.08, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.22 }}
                  className={`font-mono tabular-nums leading-none transition-colors duration-300 ${
                    measuredFlow === null
                      ? 'text-5xl sm:text-6xl font-bold tracking-[0.16em] text-slate-600/85'
                      : `text-6xl sm:text-7xl font-black tracking-tight ${
                          meterState === 'over'
                            ? 'text-red-500'
                            : meterState === 'ok'
                            ? 'text-emerald-400 text-glow-emerald'
                            : 'text-blue-400'
                        }`
                  }`}
                >
                  {measuredFlow === null ? '---' : measuredFlow}
                </motion.span>
              </div>
              <span className="mt-2 text-xs font-mono font-bold uppercase tracking-[0.2em] text-slate-400">
                Litres / seconde (L/s)
              </span>
            </div>

            {/* Calibrated Flow Gauge (0 -> 225 L/s, target marker at 135 L/s = 60%) */}
            <div className="relative z-10 w-full">
              {/* Label wrapper shares exact inner horizontal inset (px-1) with track */}
              <div className="relative h-5 mx-1">
                <div
                  className="absolute bottom-1 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  style={{ left: `${TARGET_PERCENT}%` }}
                >
                  <span className="text-[11px] font-mono font-bold text-emerald-400 leading-none whitespace-nowrap tabular-nums">
                    Cible {TARGET_FLOW}
                  </span>
                </div>
              </div>

              <div className="w-full h-7 bg-slate-950/90 rounded-full border border-white/10 p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.55)]">
                <div className="relative w-full h-full">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        meterState === 'over' ? 'bg-gradient-to-r from-red-600 to-red-400' : meterState === 'ok' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: measuredFlow !== null ? `${Math.min((measuredFlow / MAX_FLOW) * 100, 100)}%` : '0%' }}
                      transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                    />
                  </div>
                  {/* Pixel-aligned target marker on same inner coordinate space */}
                  <div
                    className="absolute -top-1.5 -bottom-1.5 w-[3px] -translate-x-1/2 bg-emerald-400 rounded-full z-20 shadow-[0_0_8px_rgba(52,211,153,0.85)]"
                    style={{ left: `${TARGET_PERCENT}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-400 tabular-nums mt-1.5 px-1">
                <span>0 L/s</span>
                <span>{MAX_FLOW} L/s</span>
              </div>
            </div>

            {/* Meter Telemetry Readout Footer (non-redundant with NAÏA dialogue banner) */}
            <div className="relative z-10 min-h-[44px] mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-slate-400">
                État circuit : <strong className="text-slate-200">{openValvesLabel.replace(/\.$/, '')}</strong>
              </span>
              {measuredFlow === null ? (
                <span className="text-slate-500">Écart cible : ---</span>
              ) : meterState === 'over' ? (
                <span className="text-red-400 font-bold tabular-nums">
                  Écart cible : +{measuredFlow - TARGET_FLOW} L/s
                </span>
              ) : meterState === 'under' ? (
                <span className="text-blue-400 font-bold tabular-nums">
                  Écart cible : −{TARGET_FLOW - measuredFlow} L/s
                </span>
              ) : (
                <span className="text-emerald-400 font-bold tabular-nums">
                  Écart cible : 0 L/s (Optimal)
                </span>
              )}
            </div>
          </div>
        </div>

        {!isSuccess && (
          <div className="flex flex-col items-center gap-2 mt-5">
            <ActionButton
              onClick={handleValidate}
              disabled={activeValves.length === 0 || activeValves.length === VALVES.length}
              isError={showError}
            >
              {activeValves.length === VALVES.length
                ? 'FERMEZ D\'ABORD DES VANNES'
                : showError
                ? 'PRESSION INCORRECTE'
                : 'METTRE SOUS PRESSION (VALIDER)'}
            </ActionButton>
          </div>
        )}

        <AnimatePresence>
          {isSuccess && (
            <LevelSuccessCard
              title="DÉBIT OPTIMAL ATTEINT"
              description={
                <>
                  Le <TechTerm term="Refroidissement" /> est stabilisé : passer de <strong className="font-mono text-white">{MAX_FLOW} L/s</strong> à <strong className="font-mono text-emerald-300">{TARGET_FLOW} L/s</strong> économise <strong className="font-mono text-emerald-300">{MAX_FLOW - TARGET_FLOW} L/s (-40 %)</strong> d'eau sur le <TechTerm term="Datacenter" /> sans impacter les performances de l'<TechTerm term="IA" />.
                </>
              }
              onContinue={onComplete}
            />
          )}
        </AnimatePresence>
      </div>
      </MissionWorkspace>
    </LevelShell>
  );
}
