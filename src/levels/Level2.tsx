import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, CheckCircle2, Droplets, Gauge, Server, ArrowRight } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import HydraLog from '../components/HydraLog';
import TechTerm from '../components/TechTerm';
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

export default function Level2({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  // Toutes les vannes démarrent ouvertes, conformément au briefing de NAÏA
  const [activeValves, setActiveValves] = useState<number[]>(() => VALVES.map(v => v.id));
  const [measuredFlow, setMeasuredFlow] = useState<number | null>(null);
  const { isErrorFlash: showError, triggerError, clearError } = useErrorFeedback();
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
      triggerError('PRESSION INCORRECTE');
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
  const manifoldDuration = currentFlow > 0 ? Math.min(4.5, Math.max(0.32, 75 / currentFlow)) : 0;
  const manifoldStripeOpacity = 0.2 + (currentFlow / MAX_FLOW) * 0.45;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-2xl max-w-4xl mx-auto relative flex flex-col backdrop-blur-xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)]"
    >
      <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
        <Settings className="w-7 h-7 text-emerald-400 shrink-0" />
        <h2 className="font-mono text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 2 : Refroidissement
        </h2>
      </div>

      <div className="mb-4 space-y-2">
        <HydraLog status="hostile" message="Charge maximale détectée. Ouverture forcée de toutes les vannes à 100 %." />
        <NaiaDialogue
          message={
            <>
              HYDRA tourne en surrégime et a ouvert toutes les vannes de ses <TechTerm term="Serveur">serveurs</TechTerm> au maximum ! Le débitmètre reste hors-ligne tant que la conduite n'est pas testée.
            </>
          }
          objective={
            <>
              Calculez et fermez les vannes en trop pour obtenir exactement <strong className="font-mono text-white">{TARGET_FLOW} L/s</strong> avant de valider <span className="text-amber-300">(erreur = -1 vie)</span>.
            </>
          }
          emotion={isSuccess ? 'happy' : 'alert'}
        />
      </div>

      <div className="space-y-4 text-slate-300">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Valve Manifold Controls */}
          <div className="w-full lg:w-3/5 relative p-4 sm:p-6 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
            <p className="text-sm sm:text-lg text-center font-bold mb-4 relative z-10">
              Fermez les vannes en trop pour totaliser {TARGET_FLOW} L/s :
            </p>

            {/* Connected Hydraulic Manifold */}
            <div className="relative z-10 flex flex-col">
              {/* Top Supply Manifold */}
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-cyan-400/80 font-bold flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  Arrivée eau froide
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Max circuit : {MAX_FLOW} L/s
                </span>
              </div>
              <div className="h-6 w-full bg-slate-900 border border-slate-700/80 rounded-full relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-700/60 via-blue-600/50 to-cyan-700/60" />
                {currentFlow > 0 && (
                  <motion.div
                    key={`top-flow-${currentFlow}`}
                    className="absolute inset-y-0 -left-6 right-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_12px,rgba(165,243,252,0.7)_12px,rgba(165,243,252,0.7)_24px)]"
                    style={{ opacity: manifoldStripeOpacity }}
                    animate={{ x: [0, 24] }}
                    transition={{
                      duration: manifoldDuration,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                )}
              </div>

              {/* 5 Parallel Branches */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-3 px-1 sm:px-3">
                {VALVES.map((valve) => {
                  const isActive = activeValves.includes(valve.id);
                  const isPressurized = measuredFlow !== null;
                  const baseDuration = Math.max(0.45, 1.35 - valve.flow / 85);
                  const flowDuration = isPressurized ? baseDuration * 0.7 : baseDuration * 1.25;

                  return (
                    <div key={valve.id} className="flex flex-col items-center">
                      {/* Top Junction Flange */}
                      <div className={`h-1.5 ${valve.flangeClass} bg-slate-700 border border-slate-600 rounded-sm -mt-px z-10`} />

                      {/* Upstream Pipe (Supply -> Valve) */}
                      <div className={`h-5 sm:h-6 ${valve.pipeClass} bg-slate-900 border-x border-slate-700/80 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-600/55 to-blue-600/45" />
                        {isActive && (
                          <motion.div
                            className={`absolute inset-x-0 -top-3 bottom-0 ${isPressurized ? 'opacity-55' : 'opacity-30'} bg-[repeating-linear-gradient(180deg,transparent,transparent_6px,rgba(165,243,252,0.75)_6px,rgba(165,243,252,0.75)_12px)]`}
                            animate={{ y: [0, 12] }}
                            transition={{ duration: flowDuration, repeat: Infinity, ease: 'linear' }}
                          />
                        )}
                      </div>

                      {/* Valve Control */}
                      <button
                        type="button"
                        disabled={isSuccess}
                        onClick={() => toggleValve(valve.id)}
                        aria-label={`Vanne ${valve.id}, débit ${valve.flow} litres par seconde. ${isActive ? 'Actuellement ouverte' : 'Actuellement fermée'}`}
                        className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-full border-[3px] sm:border-4 flex flex-col items-center justify-center transition-all duration-300 overflow-hidden group z-10 -my-1 ${
                          isActive
                            ? 'bg-cyan-950/85 border-cyan-400 text-cyan-200 hover:shadow-[0_0_16px_rgba(34,211,238,0.28)]'
                            : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500 hover:shadow-[0_0_12px_rgba(148,163,184,0.2)]'
                        } ${isSuccess ? 'cursor-default opacity-85 hover:shadow-none' : ''}`}
                      >
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 opacity-15"
                            initial={{ y: '-100%' }}
                            animate={{ y: '100%' }}
                            transition={{ duration: flowDuration, repeat: Infinity, ease: 'linear' }}
                            style={{
                              background: 'linear-gradient(180deg, transparent, #22d3ee, transparent)'
                            }}
                          />
                        )}

                        {/* Edge gate lugs: top/bottom (flow open) vs left/right (flow blocked) */}
                        <motion.div
                          animate={{ rotate: isActive ? 90 : 0 }}
                          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                          className="absolute inset-0 pointer-events-none"
                        >
                          <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 sm:w-2.5 h-1.5 rounded-r-full transition-colors duration-300 ${
                            isActive ? 'bg-cyan-400/70' : 'bg-red-500/80'
                          }`} />
                          <span className={`absolute right-0 top-1/2 -translate-y-1/2 w-2 sm:w-2.5 h-1.5 rounded-l-full transition-colors duration-300 ${
                            isActive ? 'bg-cyan-400/70' : 'bg-red-500/80'
                          }`} />
                        </motion.div>

                        <span className={`font-black text-base sm:text-2xl leading-none relative z-10 ${isActive ? 'text-cyan-200' : 'text-slate-400'}`}>
                          {valve.flow}
                        </span>
                        <span className="text-[7px] sm:text-[9px] uppercase tracking-wider font-bold relative z-10 text-slate-400">
                          L/s
                        </span>
                        <span className={`mt-0.5 px-1.5 py-px rounded text-[7px] sm:text-[8px] font-black uppercase tracking-wider relative z-10 ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}>
                          {isActive ? 'OUV' : 'FER'}
                        </span>
                      </button>

                      {/* Downstream Pipe (Valve -> Collector) */}
                      <div className={`h-16 sm:h-24 ${valve.pipeClass} bg-slate-900/90 border-x border-slate-700/80 relative overflow-hidden shadow-inner`}>
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              className={`w-full h-full relative overflow-hidden bg-gradient-to-b ${
                                meterState === 'over'
                                  ? 'from-red-500/70 to-red-600/60'
                                  : meterState === 'ok'
                                  ? 'from-emerald-400/70 to-emerald-600/60'
                                  : isPressurized
                                  ? 'from-cyan-400/70 to-blue-500/65'
                                  : 'from-cyan-500/45 to-blue-600/40'
                              }`}
                              initial={{ scaleY: 0, originY: 0 }}
                              animate={{ scaleY: 1 }}
                              exit={{ scaleY: 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              <motion.div
                                className={`absolute inset-x-0 -top-3 bottom-0 ${isPressurized ? 'opacity-65' : 'opacity-35'} bg-[repeating-linear-gradient(180deg,transparent,transparent_6px,rgba(255,255,255,0.7)_6px,rgba(255,255,255,0.7)_12px)]`}
                                animate={{ y: [0, 12] }}
                                transition={{ duration: flowDuration, repeat: Infinity, ease: 'linear' }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Bottom Junction Flange */}
                      <div className={`h-1.5 ${valve.flangeClass} bg-slate-700 border border-slate-600 rounded-sm -mb-px z-10`} />
                    </div>
                  );
                })}
              </div>

              {/* Bottom Collector Manifold -> Servers */}
              <div className="h-6 w-full bg-slate-900 border border-slate-700/80 rounded-full relative overflow-hidden shadow-inner">
                {currentFlow > 0 && (
                  <div
                    className={`absolute inset-0 transition-colors duration-300 ${
                      meterState === 'over'
                        ? 'bg-gradient-to-r from-red-600/55 to-red-500/70'
                        : meterState === 'ok'
                        ? 'bg-gradient-to-r from-emerald-600/55 to-emerald-400/70'
                        : meterState === 'under'
                        ? 'bg-gradient-to-r from-blue-700/50 to-blue-500/60'
                        : 'bg-gradient-to-r from-cyan-700/45 to-blue-600/50'
                    }`}
                  >
                    <motion.div
                      key={`bottom-flow-${currentFlow}`}
                      className="absolute inset-y-0 -left-6 right-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_12px,rgba(255,255,255,0.7)_12px,rgba(255,255,255,0.7)_24px)]"
                      style={{ opacity: manifoldStripeOpacity }}
                      animate={{ x: [0, 24] }}
                      transition={{
                        duration: manifoldDuration,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 mt-2 px-1">
                <span className="text-[10px] font-mono text-slate-500">
                  {measuredFlow === null ? 'Capteur hors-ligne — testez le circuit' : 'Circuit testé sous pression'}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                  <Server className={`w-3.5 h-3.5 ${
                    meterState === 'ok' ? 'text-emerald-400' : meterState === 'over' ? 'text-red-400' : 'text-cyan-400'
                  }`} />
                  Vers refroidissement serveurs HYDRA
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </span>
              </div>
            </div>
          </div>

          {/* Flow Meter */}
          <div className="w-full lg:w-2/5 p-6 sm:p-8 glass rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
            <motion.div
              className={`absolute bottom-0 left-0 right-0 opacity-10 transition-colors duration-500 ${
                meterState === 'over' ? 'bg-red-500' : meterState === 'ok' ? 'bg-emerald-500' : meterState === 'under' ? 'bg-blue-500' : 'bg-slate-500'
              }`}
              initial={{ height: '0%' }}
              animate={{ height: measuredFlow !== null ? `${Math.min((measuredFlow / MAX_FLOW) * 100, 100)}%` : '0%' }}
              transition={{ type: 'spring', stiffness: 50 }}
            />

            <div className="relative z-10 w-full">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className={`p-3 rounded-full ${
                  meterState === 'over' ? 'bg-red-500/20' : meterState === 'ok' ? 'bg-emerald-500/20' : meterState === 'under' ? 'bg-blue-500/20' : 'bg-slate-800/80'
                }`}>
                  {measuredFlow === null ? (
                    <Gauge className="w-8 h-8 text-slate-400" />
                  ) : (
                    <Droplets className={`w-8 h-8 ${
                      meterState === 'over' ? 'text-red-500' : meterState === 'ok' ? 'text-emerald-400' : 'text-blue-400'
                    }`} />
                  )}
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-[0.2em] font-black">
                  {measuredFlow === null ? 'Mesure en attente' : 'Débit Mesuré'}
                </p>
              </div>

              <div className="flex flex-col items-center gap-1 mb-6">
                <motion.span
                  key={measuredFlow ?? 'pending'}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  className={`text-7xl sm:text-8xl font-black font-mono tracking-tighter transition-colors duration-300 ${
                    meterState === 'over' ? 'text-red-500' : meterState === 'ok' ? 'text-emerald-400 text-glow-emerald' : meterState === 'under' ? 'text-blue-400' : 'text-slate-500'
                  }`}
                >
                  {measuredFlow === null ? '---' : measuredFlow}
                </motion.span>
                <div className="flex items-center gap-2">
                  <span className="text-xl text-slate-500 font-black uppercase tracking-widest">L/s</span>
                  <span className="text-slate-700 font-bold">/</span>
                  <span className="text-xl text-emerald-400/90 font-black uppercase tracking-widest">{TARGET_FLOW}</span>
                </div>
              </div>

              {/* Calibrated Flow Gauge (0 -> 225 L/s, target marker at 135 L/s = 60%) */}
              <div className="w-full relative pt-5">
                <div
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  style={{ left: `${TARGET_PERCENT}%` }}
                >
                  <span className="text-[10px] font-black text-emerald-400 leading-none">
                    Cible {TARGET_FLOW}
                  </span>
                </div>

                <div className="w-full h-8 bg-slate-900/80 rounded-full border border-slate-700/50 relative p-1 shadow-inner">
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    <motion.div
                      className={`h-full rounded-full ${
                        meterState === 'over' ? 'bg-red-500' : meterState === 'ok' ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: measuredFlow !== null ? `${Math.min((measuredFlow / MAX_FLOW) * 100, 100)}%` : '0%' }}
                      transition={{ type: 'spring', stiffness: 100 }}
                    />
                  </div>
                  <div
                    className="absolute -top-1 -bottom-1 w-1 bg-emerald-400 rounded-full z-20 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    style={{ left: `${TARGET_PERCENT}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5 px-1">
                  <span>0 L/s</span>
                  <span>{MAX_FLOW} L/s</span>
                </div>
              </div>

              <div className="h-14 mt-4 flex items-center justify-center">
                {measuredFlow === null && (
                  <p className="text-slate-400 text-xs sm:text-sm text-center">
                    {activeValves.length} vanne(s) ouverte(s).<br/>
                    Calculez le débit puis testez la mise sous pression.
                  </p>
                )}
                {meterState === 'over' && measuredFlow !== null && (
                  <p className="text-red-400 text-sm font-bold text-center">
                    Surpression : {measuredFlow} L/s (+{measuredFlow - TARGET_FLOW} L/s en excès).<br/>
                    Refermez des vannes !
                  </p>
                )}
                {meterState === 'under' && measuredFlow !== null && (
                  <p className="text-blue-400 text-sm font-bold text-center">
                    Débit insuffisant : {measuredFlow} L/s (-{TARGET_FLOW - measuredFlow} L/s).<br/>
                    Ouvrez davantage de débit !
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isSuccess && (
          <div className="flex flex-col items-center gap-2 mt-5">
            <button
              onClick={handleValidate}
              disabled={activeValves.length === 0 || activeValves.length === VALVES.length}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                activeValves.length === 0 || activeValves.length === VALVES.length
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : showError
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]'
              }`}
            >
              {activeValves.length === VALVES.length
                ? 'FERMEZ D\'ABORD DES VANNES'
                : showError
                ? 'PRESSION INCORRECTE'
                : 'METTRE SOUS PRESSION (VALIDER)'}
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
                DÉBIT OPTIMAL ATTEINT ({TARGET_FLOW} L/s)
              </div>
              <p className="text-center mb-6 text-sm">
                Le <TechTerm term="Refroidissement" /> est stabilisé. En optimisant le flux d'eau, nous avons réduit la consommation du <TechTerm term="Datacenter" /> de 40% sans impacter les performances de l'<TechTerm term="IA" />.
              </p>
              <button
                onClick={onComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-all hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]"
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
