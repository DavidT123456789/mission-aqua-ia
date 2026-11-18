import { useState, useRef, type PointerEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ArrowRight, Leaf, CheckCircle2, AlertTriangle, Activity, Zap } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import { soundManager } from '../utils/soundManager';

// Intensité carbone horaire (gCO2eq/kWh) sur 24h (00h à 23h)
const HOURLY_INTENSITY = [
  42, 38, 35, 36, 40, 48,   // 00h - 05h : forte production éolienne nocturne
  75, 115, 155, 165, 145, 125, // 06h - 11h : pic matinal
  110, 95, 92, 105, 140, 195,  // 12h - 17h : creux solaire puis reprise
  245, 260, 235, 185, 120, 65  // 18h - 23h : pointe du soir (centrales à gaz)
];

const DURATION_HOURS = 6;
const TARGET_MAX_INTENSITY = 55; // gCO2eq/kWh
const TRAINING_ENERGY_KWH = 500;

export default function Level5({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [startHour, setStartHour] = useState<number>(12); // Démarre en plein milieu de journée pour obliger à ajuster
  const [showError, setShowError] = useState(false);
  const [hasScored, setHasScored] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDraggingChart, setIsDraggingChart] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const dragGrabOffsetRef = useRef<number | null>(null);

  const getHourFromClientX = (clientX: number): number | null => {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return null;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * 24;
  };

  const clampStartHour = (rawHour: number) => Math.max(0, Math.min(24 - DURATION_HOURS, Math.round(rawHour)));

  const handleChartPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (isSuccess) return;
    const hour = getHourFromClientX(e.clientX);
    if (hour === null) return;

    const isInsideWindow = hour >= startHour && hour <= startHour + DURATION_HOURS;
    if (isInsideWindow) {
      dragGrabOffsetRef.current = hour - startHour;
    } else {
      dragGrabOffsetRef.current = DURATION_HOURS / 2;
      setStartHour(clampStartHour(hour - DURATION_HOURS / 2));
      setShowError(false);
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingChart(true);
  };

  const handleChartPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingChart || isSuccess || dragGrabOffsetRef.current === null) return;
    const hour = getHourFromClientX(e.clientX);
    if (hour === null) return;
    setStartHour(clampStartHour(hour - dragGrabOffsetRef.current));
    setShowError(false);
  };

  const handleChartPointerEnd = () => {
    setIsDraggingChart(false);
    dragGrabOffsetRef.current = null;
  };

  const windowSlice = HOURLY_INTENSITY.slice(startHour, startHour + DURATION_HOURS);
  const avgIntensity = Math.round(windowSlice.reduce((sum, v) => sum + v, 0) / DURATION_HOURS);
  const totalCo2Kg = Math.round((avgIntensity * TRAINING_ENERGY_KWH) / 1000);
  const peakAvgIntensity = Math.max(
    ...Array.from({ length: 24 - DURATION_HOURS + 1 }, (_, i) =>
      Math.round(HOURLY_INTENSITY.slice(i, i + DURATION_HOURS).reduce((sum, v) => sum + v, 0) / DURATION_HOURS)
    )
  );
  const peakCo2Kg = Math.round((peakAvgIntensity * TRAINING_ENERGY_KWH) / 1000);
  const reductionFactor = Math.max(1, Math.round(peakCo2Kg / Math.max(1, totalCo2Kg)));
  const renewableShare = Math.max(15, Math.min(95, Math.round(100 - (avgIntensity / 280) * 100)));

  const formatHour = (h: number) => `${h.toString().padStart(2, '0')}:00`;
  const endHour = startHour + DURATION_HOURS;

  const maxIntensity = 270;
  // 25 points (00:00 -> 24:00) pour aligner exactement la courbe sur les 24h et la fenêtre 6h
  const chartPoints = [...HOURLY_INTENSITY, HOURLY_INTENSITY[0]];
  const polylinePoints = chartPoints.map((val, idx) => {
    const x = (idx / 24) * 100;
    const y = 100 - (val / maxIntensity) * 100;
    return `${x},${y}`;
  }).join(' ');

  const polygonPoints = `0,100 ${polylinePoints} 100,100`;

  const handleSubmit = () => {
    if (avgIntensity <= TARGET_MAX_INTENSITY) {
      setIsSuccess(true);
      soundManager.playSuccess();
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(150, 49);
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
      className="sm:bg-slate-900 border-transparent sm:border-cyan-500/20 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-xl sm:shadow-emerald-900/20 max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      <div className="flex items-center gap-3 mb-3 border-b border-cyan-900/50 pb-3">
        <Clock className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 5 : Optimisation Temporelle
        </h2>
      </div>

      <div className="mb-3">
        <NaiaDialogue
          message={
            <>
              Même sur un site bien refroidi, entraîner ce modèle d'<TechTerm term="IA" /> consomme <strong>{TRAINING_ENERGY_KWH} kWh</strong> pendant <strong>{DURATION_HOURS} heures consécutives</strong>. Selon l'heure, le réseau électrique fournit une énergie bas-carbone ou doit démarrer des centrales fossiles : faites glisser la fenêtre temporelle sur la courbe pour maintenir l'intensité carbone moyenne sous <strong>{TARGET_MAX_INTENSITY} gCO₂/kWh</strong>.
            </>
          }
          emotion="neutral"
        />
      </div>

      <div className="space-y-4 text-slate-300">
        {/* Visual Carbon Intensity Graph */}
        <div className="mt-3 p-5 sm:p-6 bg-slate-950 rounded-xl border border-slate-800 relative">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xs sm:text-sm font-bold uppercase text-slate-300 tracking-widest">
                Prévision d'Intensité Carbone (24h)
              </h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
              Objectif : ≤ <strong className="text-emerald-400">{TARGET_MAX_INTENSITY} gCO₂/kWh</strong>
            </span>
          </div>

          {/* Grid mix regimes aligned with the 24h timeline */}
          <div className="hidden sm:flex ml-7 mb-1.5 text-[10px] text-slate-500 text-center select-none">
            <span className="w-[25%] border-r border-slate-800/80 px-1 truncate">Éolien nocturne</span>
            <span className="w-[25%] border-r border-slate-800/80 px-1 truncate">Pic matinal</span>
            <span className="w-[20.8%] border-r border-slate-800/80 px-1 truncate">Creux solaire</span>
            <span className="w-[29.2%] px-1 truncate">Pointe soir (gaz)</span>
          </div>

          <div
            ref={chartRef}
            onPointerDown={handleChartPointerDown}
            onPointerMove={handleChartPointerMove}
            onPointerUp={handleChartPointerEnd}
            onPointerCancel={handleChartPointerEnd}
            className={`relative h-44 border-b border-l border-slate-700 mb-2 ml-7 touch-none select-none ${
              isSuccess ? 'cursor-default' : isDraggingChart ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Y-axis labels */}
            <div className="absolute -left-2 -translate-x-full top-0 text-[10px] text-slate-500">270</div>
            <div className="absolute -left-2 -translate-x-full top-1/2 -translate-y-1/2 text-[10px] text-slate-500">135</div>
            <div className="absolute -left-2 -translate-x-full bottom-0 text-[10px] text-slate-500">0</div>

            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="w-full border-t border-slate-800/60 h-0"></div>
              <div className="w-full border-t border-slate-800/60 h-0"></div>
              <div className="w-full border-t border-slate-800/60 h-0"></div>
            </div>

            {/* Target threshold line */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-emerald-500/60 pointer-events-none z-10"
              style={{ bottom: `${(TARGET_MAX_INTENSITY / maxIntensity) * 100}%` }}
            >
              <span className="absolute right-16 top-1 text-[10px] text-emerald-400 font-bold bg-slate-950/90 px-1.5 py-0.5 rounded">
                Seuil {TARGET_MAX_INTENSITY}g
              </span>
            </div>

            {/* Selected 6h Window Overlay */}
            <div
              className={`absolute top-0 bottom-0 border-x-2 z-10 pointer-events-none ${
                isDraggingChart ? '' : 'transition-all duration-150'
              } ${
                isSuccess
                  ? 'bg-emerald-500/20 border-emerald-400'
                  : showError
                  ? 'bg-red-500/20 border-red-400'
                  : 'bg-cyan-500/15 border-cyan-400'
              }`}
              style={{
                left: `${(startHour / 24) * 100}%`,
                width: `${(DURATION_HOURS / 24) * 100}%`
              }}
            />

            {/* The Graph Line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="carbonGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(34, 211, 238, 0.4)" />
                  <stop offset="100%" stopColor="rgba(34, 211, 238, 0.0)" />
                </linearGradient>
              </defs>
              <polygon points={polygonPoints} fill="url(#carbonGrad)" />
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between text-[10px] text-slate-500 ml-7 mb-5">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>

          {/* Interactive Slider */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <label htmlFor="schedule-slider" className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Décaler le créneau de 6 heures (départ) :
              </label>
              <span className="text-base font-black text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1 rounded-lg">
                {formatHour(startHour)} → {formatHour(endHour)}
              </span>
            </div>
            <input
              id="schedule-slider"
              type="range"
              min={0}
              max={18}
              step={1}
              disabled={isSuccess}
              value={startHour}
              onChange={(e) => {
                setStartHour(Number(e.target.value));
                setShowError(false);
              }}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
            </div>
          </div>
        </div>

        {/* Live Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center text-center">
            <span className="text-[10px] uppercase text-slate-500 tracking-wider mb-1">Intensité Moyenne</span>
            <span className={`text-2xl font-black transition-colors ${
              isSuccess ? 'text-emerald-400' : showError ? 'text-red-400' : 'text-white'
            }`}>{avgIntensity} <span className="text-xs font-normal text-slate-400">gCO₂/kWh</span></span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center text-center">
            <span className="text-[10px] uppercase text-slate-500 tracking-wider mb-1 flex items-center gap-1">
              <Leaf className="w-3 h-3 text-emerald-400" /> Part Renouvelable
            </span>
            <span className="text-2xl font-black text-cyan-300">{renewableShare}%</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center text-center">
            <span className="text-[10px] uppercase text-slate-500 tracking-wider mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" /> Bilan Entraînement
            </span>
            <span className="text-2xl font-black text-slate-200">{totalCo2Kg} <span className="text-xs font-normal text-slate-400">kg CO₂</span></span>
            <span className="text-[10px] text-slate-500 mt-0.5">pour {TRAINING_ENERGY_KWH} kWh (pic soir : {peakCo2Kg} kg)</span>
          </div>
        </div>

        {!isSuccess && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleSubmit}
              className={`px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                showError
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105'
              }`}
            >
              {showError ? (
                <>CRÉNEAU TROP CARBONÉ ({avgIntensity} gCO₂/kWh) <AlertTriangle className="w-5 h-5" /></>
              ) : (
                <>PLANIFIER SUR CE CRÉNEAU <ArrowRight className="w-5 h-5" /></>
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
                PLANIFICATION OPTIMALE ({formatHour(startHour)} – {formatHour(endHour)})
              </div>
              <p className="text-center mb-6 text-sm">
                En décalant ces {TRAINING_ENERGY_KWH} kWh vers les heures creuses où l'éolien domine ({avgIntensity} gCO₂/kWh), cet entraînement n'émet que <strong>{totalCo2Kg} kg de CO₂</strong> contre <strong>{peakCo2Kg} kg</strong> au pic du soir — une empreinte divisée par {reductionFactor} sans changer le matériel : c'est le <strong>Carbon-Aware Computing</strong>.
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
