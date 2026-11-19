import { useState, useRef, useEffect, type CSSProperties, type PointerEvent } from 'react';
import { AnimatePresence } from 'motion/react';
import { Clock, ArrowRight, Leaf, AlertTriangle, LineChart, Zap, Moon, Wind, Sun, Flame, GripHorizontal } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import HydraLog from '../components/HydraLog';
import TechTerm from '../components/TechTerm';
import LevelHeader from '../components/LevelHeader';
import LevelShell from '../components/LevelShell';
import ActionButton from '../components/ActionButton';
import LevelSuccessCard from '../components/LevelSuccessCard';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

// Intensité carbone horaire (gCO2eq/kWh) sur 24h (00h à 23h)
const HOURLY_INTENSITY = [
  42, 38, 35, 36, 40, 48,   // 00h - 05h : forte production éolienne nocturne
  75, 115, 155, 165, 145, 125, // 06h - 11h : pic matinal
  88, 50, 48, 72, 135, 195,  // 12h - 17h : bref creux solaire (2h seulement sous 55g) puis reprise
  245, 260, 235, 185, 120, 65  // 18h - 23h : pointe du soir (centrales à gaz)
];

const DURATION_HOURS = 6;
const TARGET_MAX_INTENSITY = 55; // gCO2eq/kWh
const TRAINING_ENERGY_KWH = 500;

export default function Level5({ onComplete, onScoreUpdate, onMistake }: { onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [startHour, setStartHour] = useState<number>(12); // Démarre en plein milieu de journée pour obliger à ajuster
  const { errorMsg, isErrorFlash: showError, triggerError, clearError } = useErrorFeedback();
  const [hasScored, setHasScored] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDraggingChart, setIsDraggingChart] = useState(false);
  const [isSlidingRange, setIsSlidingRange] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const dragGrabOffsetRef = useRef<number | null>(null);
  const isAdjusting = isDraggingChart || isSlidingRange;

  // Garantit que le relâchement de la souris en dehors de la barre du slider remet bien isSlidingRange à false
  useEffect(() => {
    if (!isSlidingRange) return;
    const stopSliding = () => setIsSlidingRange(false);
    window.addEventListener('pointerup', stopSliding);
    window.addEventListener('pointercancel', stopSliding);
    window.addEventListener('keyup', stopSliding);
    return () => {
      window.removeEventListener('pointerup', stopSliding);
      window.removeEventListener('pointercancel', stopSliding);
      window.removeEventListener('keyup', stopSliding);
    };
  }, [isSlidingRange]);

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

    // Marge tactile élargie (±1h autour de la fenêtre) pour faciliter la saisie au doigt/trackpad
    const isInsideWindow = hour >= startHour - 1 && hour <= startHour + DURATION_HOURS + 1;
    if (isInsideWindow) {
      dragGrabOffsetRef.current = Math.max(0, Math.min(DURATION_HOURS, hour - startHour));
    } else {
      dragGrabOffsetRef.current = DURATION_HOURS / 2;
      setStartHour(clampStartHour(hour - DURATION_HOURS / 2));
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingChart(true);
  };

  const handleChartPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingChart || isSuccess || dragGrabOffsetRef.current === null) return;
    const hour = getHourFromClientX(e.clientX);
    if (hour === null) return;
    setStartHour(clampStartHour(hour - dragGrabOffsetRef.current));
  };

  const handleChartPointerEnd = () => {
    setIsDraggingChart(false);
    dragGrabOffsetRef.current = null;
  };

  const windowSlice = HOURLY_INTENSITY.slice(startHour, startHour + DURATION_HOURS);
  const avgIntensity = Math.round(windowSlice.reduce((sum, v) => sum + v, 0) / DURATION_HOURS);

  // Efface le message d'erreur dès que l'utilisateur a relâché son curseur sur un créneau valide
  useEffect(() => {
    if (!isAdjusting && errorMsg && avgIntensity <= TARGET_MAX_INTENSITY) {
      clearError();
    }
  }, [isAdjusting, errorMsg, avgIntensity, clearError]);
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
  const chartPoints = [...HOURLY_INTENSITY, HOURLY_INTENSITY[0]].map((val, idx) => ({
    x: (idx / 24) * 100,
    y: 100 - (val / maxIntensity) * 100,
  }));

  // Courbe lissée (Catmull-Rom -> Bézier cubique) passant exactement par les 25 relevés horaires
  const clampY = (y: number) => Math.max(0, Math.min(100, y));
  const smoothLinePath = chartPoints.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x.toFixed(2)},${pt.y.toFixed(2)}`;
    const p0 = arr[Math.max(0, i - 2)];
    const p1 = arr[i - 1];
    const p2 = pt;
    const p3 = arr[Math.min(arr.length - 1, i + 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = clampY(p1.y + (p2.y - p0.y) / 6);
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = clampY(p2.y - (p3.y - p1.y) / 6);
    return `${acc} C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }, '');
  const smoothAreaPath = `${smoothLinePath} L 100,100 L 0,100 Z`;
  const sliderPct = `${(startHour / (24 - DURATION_HOURS)) * 100}%`;

  const handleSubmit = () => {
    if (avgIntensity <= TARGET_MAX_INTENSITY) {
      clearError();
      setIsSuccess(true);
      soundManager.playSuccess();
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(150, 49);
      }
    } else {
      const isSolarTrap = startHour >= 9 && startHour <= 14;
      triggerError(
        isSolarTrap
          ? `Le creux solaire de midi est trop court (2 h) pour un entraînement de ${DURATION_HOURS} h : la moyenne monte à ${avgIntensity} gCO₂/kWh (> ${TARGET_MAX_INTENSITY}). Visez le long creux éolien nocturne !`
          : `Ce créneau est trop carboné (${avgIntensity} gCO₂/kWh) : visez sous ${TARGET_MAX_INTENSITY} gCO₂/kWh (regardez du côté de l'éolien nocturne).`
      );
      onMistake?.();
    }
  };

  return (
    <LevelShell>
      <LevelHeader level={5} icon={Clock} />

      <div className="mb-3 space-y-2">
        <HydraLog
          status="hostile"
          message="Entraînement de 500 kWh programmé à 12h00 sans prise en compte de l'intensité carbone du réseau électrique."
        />
        <NaiaDialogue
          message={
            <>
              En attendant la bascule vers Luleå, les serveurs <TechTerm term="Cloud">cloud</TechTerm> secondaires d'HYDRA tournent encore sur le réseau électrique européen, où un entraînement de <TechTerm term="Machine Learning">machine learning</TechTerm> consomme <strong className="font-mono text-white">{TRAINING_ENERGY_KWH} kWh</strong> pendant <strong className="font-mono text-white">{DURATION_HOURS} h</strong> d'affilée. Selon l'heure, le réseau alterne entre éolien, solaire et centrales à gaz.
            </>
          }
          objective={
            <>
              Faites glisser la fenêtre temporelle sur la courbe pour garder l'intensité carbone sous <strong className="font-mono text-white">{TARGET_MAX_INTENSITY} gCO₂/kWh</strong>.
            </>
          }
          reaction={errorMsg ? { message: errorMsg, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={isSuccess ? 'happy' : 'neutral'}
        />
      </div>

      <div className="space-y-4 text-slate-300">
        {/* Visual Carbon Intensity Graph */}
        <div className="mt-3 p-5 sm:p-6 bg-slate-950 rounded-2xl border border-white/10 relative">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xs sm:text-sm font-bold uppercase text-slate-300 tracking-widest">
                Prévision d'Intensité Carbone (24h)
              </h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
              Objectif : ≤ <strong className="text-emerald-400">{TARGET_MAX_INTENSITY} gCO₂/kWh</strong>
            </span>
          </div>

          {/* Grid mix regimes aligned with the 24h timeline */}
          <div className="flex ml-7 mb-1.5 text-[10px] sm:text-[11px] text-slate-400 text-center select-none">
            <span className="w-[25%] border-r border-slate-800/80 px-1 flex items-center justify-center gap-1 truncate">
              <Moon className="w-3 h-3 text-cyan-400 shrink-0" />
              <Wind className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline truncate">Éolien nocturne</span>
            </span>
            <span className="w-[25%] border-r border-slate-800/80 px-1 flex items-center justify-center gap-1 truncate">
              <Zap className="w-3 h-3 text-amber-400/80 shrink-0" />
              <span className="hidden sm:inline truncate">Pic matinal</span>
            </span>
            <span className="w-[20.8%] border-r border-slate-800/80 px-1 flex items-center justify-center gap-1 truncate">
              <Sun className="w-3 h-3 text-yellow-400 shrink-0" />
              <span className="hidden sm:inline truncate">Creux solaire</span>
            </span>
            <span className="w-[29.2%] px-1 flex items-center justify-center gap-1 truncate">
              <Flame className="w-3 h-3 text-orange-400 shrink-0" />
              <span className="hidden sm:inline truncate">Pointe soir (gaz)</span>
            </span>
          </div>

          <div
            ref={chartRef}
            onPointerDown={handleChartPointerDown}
            onPointerMove={handleChartPointerMove}
            onPointerUp={handleChartPointerEnd}
            onPointerCancel={handleChartPointerEnd}
            className={`relative h-48 sm:h-44 border-b border-l border-slate-700 mb-2 ml-7 touch-none select-none ${
              isSuccess ? 'cursor-default' : isDraggingChart ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Subtle zone pictograms directly on the curve backdrop */}
            <div className="absolute inset-0 flex pointer-events-none z-0">
              <div className="w-[25%] h-full bg-emerald-500/[0.04] border-r border-slate-800/40 flex items-start justify-center pt-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950/60 border border-emerald-500/20 text-emerald-400/75 text-[10px]">
                  <Moon className="w-3 h-3" />
                  <Wind className="w-3 h-3" />
                </span>
              </div>
              <div className="w-[25%] h-full border-r border-slate-800/40" />
              <div className="w-[20.8%] h-full bg-yellow-500/[0.03] border-r border-slate-800/40 flex items-start justify-center pt-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-950/60 border border-yellow-500/20 text-yellow-400/75 text-[10px]">
                  <Sun className="w-3 h-3" />
                </span>
              </div>
              <div className="w-[29.2%] h-full bg-orange-500/[0.04] flex items-start justify-center pt-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-950/60 border border-orange-500/20 text-orange-400/75 text-[10px]">
                  <Flame className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Y-axis labels */}
            <div className="absolute -left-2 -translate-x-full top-0 text-[10px] text-slate-400">270</div>
            <div className="absolute -left-2 -translate-x-full top-1/2 -translate-y-1/2 text-[10px] text-slate-400">135</div>
            <div className="absolute -left-2 -translate-x-full bottom-0 text-[10px] text-slate-400">0</div>

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

            {/* Selected 6h Window Overlay with visible drag handle */}
            <div
              className={`absolute top-0 bottom-0 border-x-2 z-20 pointer-events-none flex flex-col items-center justify-center ${
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
            >
              {!isSuccess && (
                <div className={`px-2 py-1 rounded-full border text-[10px] font-mono font-bold flex items-center gap-1 shadow-md backdrop-blur-sm ${
                  showError
                    ? 'bg-red-950/90 border-red-400/70 text-red-200'
                    : isDraggingChart
                    ? 'bg-cyan-950/95 border-cyan-300 text-cyan-100 scale-105'
                    : 'bg-slate-950/90 border-cyan-400/70 text-cyan-200'
                }`}>
                  <GripHorizontal className="w-3.5 h-3.5 shrink-0" />
                  <span>6h</span>
                </div>
              )}
            </div>

            {/* The Graph Line (smooth cubic Bezier curve) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="carbonGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(34, 211, 238, 0.36)" />
                  <stop offset="100%" stopColor="rgba(34, 211, 238, 0.0)" />
                </linearGradient>
              </defs>
              <path d={smoothAreaPath} fill="url(#carbonGrad)" />
              <path
                d={smoothLinePath}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between text-[11px] text-slate-400 ml-7 mb-5">
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
              <span className="text-base font-black font-mono tabular-nums text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1 rounded-lg">
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
              onPointerDown={() => setIsSlidingRange(true)}
              onPointerUp={() => setIsSlidingRange(false)}
              onPointerCancel={() => setIsSlidingRange(false)}
              onKeyDown={(e) => {
                if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
                  setIsSlidingRange(true);
                }
              }}
              onKeyUp={() => setIsSlidingRange(false)}
              onBlur={() => setIsSlidingRange(false)}
              onChange={(e) => {
                setStartHour(Number(e.target.value));
              }}
              style={{ '--range-color': '#22d3ee', '--range-pct': sliderPct } as CSSProperties}
              className="aqua-range w-full cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-400">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
            </div>
          </div>
        </div>

        {/* Live Telemetry Cards (masked while dragging/sliding to avoid blind visual trial-and-error) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-white/10 rounded-xl p-4 flex flex-col items-center text-center">
            <span className="text-[11px] uppercase text-slate-400 tracking-wider mb-1">Intensité Moyenne</span>
            {isAdjusting ? (
              <span className="text-base font-bold text-slate-400 py-1">Mesure au relâchement…</span>
            ) : (
              <span className={`text-2xl font-black font-mono tabular-nums transition-colors ${
                isSuccess ? 'text-emerald-400' : showError ? 'text-red-400' : 'text-white'
              }`}>{avgIntensity} <span className="text-xs font-sans font-normal text-slate-400">gCO₂/kWh</span></span>
            )}
          </div>
          <div className="bg-slate-950 border border-white/10 rounded-xl p-4 flex flex-col items-center text-center">
            <span className="text-[11px] uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1">
              <Leaf className="w-3 h-3 text-emerald-400" /> Part Renouvelable
            </span>
            {isAdjusting ? (
              <span className="text-2xl font-black font-mono tabular-nums text-slate-400">-- %</span>
            ) : (
              <span className="text-2xl font-black font-mono tabular-nums text-cyan-300">{renewableShare} %</span>
            )}
          </div>
          <div className="bg-slate-950 border border-white/10 rounded-xl p-4 flex flex-col items-center text-center">
            <span className="text-[11px] uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" /> Bilan Entraînement
            </span>
            {isAdjusting ? (
              <span className="text-2xl font-black font-mono tabular-nums text-slate-400">-- <span className="text-xs font-sans font-normal text-slate-400">kg CO₂</span></span>
            ) : (
              <>
                <span className="text-2xl font-black font-mono tabular-nums text-slate-200">{totalCo2Kg} <span className="text-xs font-sans font-normal text-slate-400">kg CO₂</span></span>
                <span className="text-[11px] text-slate-400 mt-0.5 tabular-nums">pour {TRAINING_ENERGY_KWH} kWh (pic soir : {peakCo2Kg} kg)</span>
              </>
            )}
          </div>
        </div>

        {!isSuccess && (
          <div className="flex justify-center mt-4">
            <ActionButton
              onClick={handleSubmit}
              isError={showError}
            >
              {showError ? (
                <>CRÉNEAU TROP CARBONÉ ({avgIntensity} gCO₂/kWh) <AlertTriangle className="w-5 h-5" /></>
              ) : (
                <>PLANIFIER SUR CE CRÉNEAU <ArrowRight className="w-5 h-5" /></>
              )}
            </ActionButton>
          </div>
        )}

        <AnimatePresence>
          {isSuccess && (
            <LevelSuccessCard
              title={`PLANIFICATION OPTIMALE (${formatHour(startHour)} – ${formatHour(endHour)})`}
              description={
                <>
                  En décalant ces {TRAINING_ENERGY_KWH} kWh vers les heures creuses où l'éolien domine ({avgIntensity} gCO₂/kWh), cet entraînement n'émet que <strong>{totalCo2Kg} kg de CO₂</strong> contre <strong>{peakCo2Kg} kg</strong> au pic du soir, soit une empreinte divisée par {reductionFactor} sans changer le matériel : c'est le <strong>Carbon-Aware Computing</strong>.
                </>
              }
              onContinue={onComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </LevelShell>
  );
}
