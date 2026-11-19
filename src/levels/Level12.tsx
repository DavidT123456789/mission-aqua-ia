import { useState, type CSSProperties } from 'react';
import { AnimatePresence } from 'motion/react';
import { Globe, Droplets, CloudSun, Landmark, Megaphone, Zap, AlertTriangle, Minus, Plus } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import HydraLog from '../components/HydraLog';
import LevelHeader from '../components/LevelHeader';
import LevelShell from '../components/LevelShell';
import ActionButton from '../components/ActionButton';
import LevelSuccessCard from '../components/LevelSuccessCard';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

const WATER_BUDGET_MAX = 100;
const POWER_BUDGET_MAX_MW = 108;

const POWER_FACTOR = {
  climate: 1.2,
  water: 0.8,
  citizen: 1.5,
  ads: 2.5,
} as const;

export default function Level12({ onComplete, onScoreUpdate, onMistake }: { onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [allocations, setAllocations] = useState({
    climate: 25,
    water: 25,
    citizen: 25,
    ads: 25
  });

  const { errorMsg: feedbackError, isErrorFlash: showErrorAnim, triggerError: showFeedbackError, clearError } = useErrorFeedback();
  const [hasScored, setHasScored] = useState(false);

  const totalWaterUsed = allocations.climate + allocations.water + allocations.citizen + allocations.ads;
  const totalPowerMw = Math.round(
    (allocations.climate * POWER_FACTOR.climate +
      allocations.water * POWER_FACTOR.water +
      allocations.citizen * POWER_FACTOR.citizen +
      allocations.ads * POWER_FACTOR.ads) * 10
  ) / 10;

  const isOverWater = totalWaterUsed > WATER_BUDGET_MAX;
  const isOverPower = totalPowerMw > POWER_BUDGET_MAX_MW;
  const isOverLimit = isOverWater || isOverPower;

  const handleSliderChange = (category: keyof typeof allocations, value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setAllocations(prev => ({ ...prev, [category]: clamped }));
    clearError();
  };

  const stepAllocation = (category: keyof typeof allocations, delta: number) => {
    if (isSuccess) return;
    soundManager.playClick();
    handleSliderChange(category, allocations[category] + delta);
  };

  const triggerError = (msg: string) => {
    showFeedbackError(msg);
    onMistake?.();
  };

  const checkAnswer = () => {
    if (isOverWater) {
      triggerError(`BUDGET EAU DÉPASSÉ (${totalWaterUsed} / ${WATER_BUDGET_MAX} U) : les réserves locales s'épuisent !`);
      return;
    }

    if (isOverPower) {
      triggerError(`SURCHARGE ÉLECTRIQUE (${totalPowerMw} / ${POWER_BUDGET_MAX_MW} MW) : les usages gourmands en MW font disjoncter le réseau !`);
      return;
    }

    if (allocations.citizen < 10) {
      triggerError("RUPTURE DE SERVICE PUBLIC : les écoles, mairies et plateformes citoyennes ont besoin d'au moins 10 U.");
      return;
    }

    if (allocations.citizen > 15) {
      triggerError("SURCONSOMMATION NUMÉRIQUE : limitez les services citoyens & culture à 15 U max (pas de streaming 4K superflu).");
      return;
    }

    if (allocations.ads > 5) {
      triggerError("GASPILLAGE PUBLICITAIRE : le ciblage publicitaire (2,5 MW/U) doit être bridé à 5 U maximum.");
      return;
    }

    if (allocations.climate < 35 || allocations.water < 40) {
      triggerError("SEUILS VITAUX NON ATTEINTS : garantissez au moins 35 U pour le Climat et 40 U pour les Réseaux d'eau.");
      return;
    }

    if (allocations.climate + allocations.water < 85) {
      triggerError("IMPACT PLANÉTAIRE INSUFFISANT : Climat + Réseaux d'eau doivent cumuler au moins 85 U pour stabiliser le territoire.");
      return;
    }

    clearError();
    soundManager.playSuccess();
    if (!hasScored) {
      setHasScored(true);
      onScoreUpdate(250, 94);
    }
  };

  const isSuccess = hasScored;

  return (
    <LevelShell>
      <LevelHeader level={12} icon={Globe} />

      <div className="mb-4 space-y-2">
        <HydraLog status="synced" label="HYDRA // RÉPARTITEUR" message="Module AQUA-FARM intégré. Répartiteur maître ouvert pour l'arbitrage Eau / Énergie / Utilité." />
        <NaiaDialogue
          message={
            <>
              Tout est prêt pour calibrer le répartiteur maître d'HYDRA ! Mais attention : chaque unité allouée consomme aussi de l'électricité (en <strong className="text-white">MW</strong>) et vous ne pouvez pas couper les services publics des habitants.
            </>
          }
          objective={
            <>
              Respectez le double plafond (<strong className="font-mono text-white">≤ {WATER_BUDGET_MAX} U</strong> et <strong className="font-mono text-white">≤ {POWER_BUDGET_MAX_MW} MW</strong>), maintenez les services citoyens (<strong className="font-mono text-white">10–15 U</strong>) et consacrez <strong className="font-mono text-white">≥ 85 U</strong> à Climat + Réseaux.
            </>
          }
          reaction={feedbackError ? { message: feedbackError, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={isSuccess ? 'happy' : 'neutral'}
        />
      </div>

      <div className="space-y-5 text-slate-300">
        {/* Double jauge Eau + Puissance Électrique */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 space-y-2.5">
            <div className="flex justify-between text-xs sm:text-sm font-bold">
              <span className="text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="w-4 h-4 shrink-0" /> Budget Eau (Refroidissement)
              </span>
              <span className={`font-mono tabular-nums ${isOverWater ? 'text-red-500' : 'text-emerald-400'}`}>
                {totalWaterUsed} / {WATER_BUDGET_MAX} U
              </span>
            </div>
            <div className={`h-3.5 bg-slate-900 rounded-full overflow-hidden border flex ${isOverWater ? 'border-red-500' : 'border-slate-700'}`}>
              {[
                { key: 'climate', value: allocations.climate, color: 'bg-emerald-500', label: 'Climat' },
                { key: 'water', value: allocations.water, color: 'bg-blue-500', label: 'Réseaux' },
                { key: 'citizen', value: allocations.citizen, color: 'bg-purple-500', label: 'Citoyens' },
                { key: 'ads', value: allocations.ads, color: 'bg-yellow-500', label: 'Pub' }
              ].map(seg => {
                const scaleDenom = Math.max(totalWaterUsed, WATER_BUDGET_MAX);
                const pct = (seg.value / scaleDenom) * 100;
                if (seg.value === 0) return null;
                return (
                  <div
                    key={seg.key}
                    className={`h-full ${isOverWater ? 'bg-red-500/80' : seg.color} transition-all duration-200 border-r border-slate-950/50 last:border-r-0`}
                    style={{ width: `${pct}%` }}
                    title={`${seg.label} : ${seg.value} U`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2.5 text-[11px] font-mono tabular-nums text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Climat ({allocations.climate} U)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Réseaux ({allocations.water} U)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Citoyens ({allocations.citizen} U)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Pub ({allocations.ads} U)</span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 space-y-2.5">
            <div className="flex justify-between text-xs sm:text-sm font-bold">
              <span className="text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 shrink-0" /> Charge Électrique Réseau
              </span>
              <span className={`font-mono tabular-nums ${isOverPower ? 'text-red-500' : 'text-emerald-400'}`}>
                {totalPowerMw.toFixed(1).replace('.', ',')} / {POWER_BUDGET_MAX_MW} MW
              </span>
            </div>
            <div className={`h-3.5 bg-slate-900 rounded-full overflow-hidden border relative ${isOverPower ? 'border-red-500' : 'border-slate-700'}`}>
              <div
                className={`h-full transition-all duration-200 ${isOverPower ? 'bg-red-500' : 'bg-amber-400'}`}
                style={{ width: `${Math.min(100, (totalPowerMw / 160) * 100)}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-emerald-400 z-10"
                style={{ left: `${(POWER_BUDGET_MAX_MW / 160) * 100}%` }}
                title={`Plafond : ${POWER_BUDGET_MAX_MW} MW`}
              />
            </div>
            <div className="flex flex-wrap justify-between gap-2 text-[11px] font-mono tabular-nums text-slate-400">
              <span>Climat + Réseaux : <strong className={allocations.climate + allocations.water >= 85 ? 'text-emerald-400' : 'text-amber-300'}>{allocations.climate + allocations.water} / 85 U min</strong></span>
              {isOverLimit && (
                <span className="text-red-400 font-bold uppercase inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> Plafond dépassé
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Secteurs à allouer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            {
              key: 'climate' as const,
              label: 'Modélisation Climatique',
              icon: CloudSun,
              borderClass: 'border-emerald-900/40',
              titleClass: 'text-emerald-400',
              valueClass: 'text-emerald-300',
              rangeHex: '#10b981',
              zoneClass: 'bg-emerald-500/45',
              zoneStart: 35,
              zoneWidth: 65,
              targetLabel: <>Min requis : <strong className="text-slate-200">35 U</strong></>,
              powerLabel: <span className="font-mono text-slate-400">1,2 MW / U</span>,
            },
            {
              key: 'water' as const,
              label: 'Gestion des Réseaux d\'Eau',
              icon: Droplets,
              borderClass: 'border-blue-900/40',
              titleClass: 'text-blue-400',
              valueClass: 'text-blue-300',
              rangeHex: '#3b82f6',
              zoneClass: 'bg-blue-500/45',
              zoneStart: 40,
              zoneWidth: 60,
              targetLabel: <>Min requis : <strong className="text-slate-200">40 U</strong></>,
              powerLabel: <span className="font-mono text-slate-400">0,8 MW / U</span>,
            },
            {
              key: 'citizen' as const,
              label: 'Services Citoyens & Culture',
              icon: Landmark,
              borderClass: 'border-purple-900/40',
              titleClass: 'text-purple-400',
              valueClass: 'text-purple-300',
              rangeHex: '#a855f7',
              zoneClass: 'bg-purple-500/55',
              zoneStart: 10,
              zoneWidth: 5,
              targetLabel: <>Cible service public : <strong className="text-slate-200">10 à 15 U</strong></>,
              powerLabel: <span className="font-mono text-slate-400">1,5 MW / U</span>,
            },
            {
              key: 'ads' as const,
              label: 'Ciblage Pub & Génération 4K',
              icon: Megaphone,
              borderClass: 'border-yellow-900/40',
              titleClass: 'text-yellow-500',
              valueClass: 'text-yellow-300',
              rangeHex: '#eab308',
              zoneClass: 'bg-yellow-500/55',
              zoneStart: 0,
              zoneWidth: 5,
              targetLabel: <>Max toléré : <strong className="text-slate-200">≤ 5 U</strong></>,
              powerLabel: <span className="font-mono text-amber-400">2,5 MW / U (énergivore)</span>,
            },
          ]).map((sector) => {
            const Icon = sector.icon;
            const val = allocations[sector.key];
            return (
              <div key={sector.key} className={`bg-slate-950 p-4 rounded-xl border ${sector.borderClass}`}>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className={`flex items-center gap-2 ${sector.titleClass}`}>
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="font-bold text-sm">{sector.label}</span>
                  </div>
                  <span className={`text-xs font-mono tabular-nums ${sector.valueClass} font-bold shrink-0`}>
                    {val} U · {(val * POWER_FACTOR[sector.key]).toFixed(1).replace('.', ',')} MW
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isSuccess || val <= 0}
                    onClick={() => stepAllocation(sector.key, -5)}
                    aria-label={`Réduire ${sector.label} de 5 unités`}
                    className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 active:scale-95 text-slate-200 flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={val}
                      disabled={isSuccess}
                      aria-label={sector.label}
                      onChange={(e) => handleSliderChange(sector.key, Number(e.target.value))}
                      style={{ '--range-color': sector.rangeHex, '--range-pct': `${val}%` } as CSSProperties}
                      className="aqua-range w-full relative z-10 cursor-pointer"
                    />
                    {/* Repère visuel discret de la zone cible sur l'échelle 0–100 (aligné sur la course du curseur) */}
                    <div className="mx-2 relative h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80" aria-hidden="true">
                      <div
                        className={`absolute top-0 bottom-0 rounded-full ${sector.zoneClass}`}
                        style={{ left: `${sector.zoneStart}%`, width: `${sector.zoneWidth}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSuccess || val >= 100}
                    onClick={() => stepAllocation(sector.key, 5)}
                    aria-label={`Augmenter ${sector.label} de 5 unités`}
                    className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 active:scale-95 text-slate-200 flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                  <span>{sector.targetLabel}</span>
                  {sector.powerLabel}
                </div>
              </div>
            );
          })}
        </div>

        {!isSuccess && (
          <div className="flex justify-center mt-5">
            <ActionButton
              onClick={checkAnswer}
              disabled={totalWaterUsed === 0}
              isError={showErrorAnim}
            >
              VERROUILLER LA NOUVELLE MATRICE
            </ActionButton>
          </div>
        )}

        <AnimatePresence>
          {isSuccess && (
            <LevelSuccessCard
              title="ÉQUILIBRE RESTAURÉ : RÉPARTITEUR VERROUILLÉ"
              description={`Vous avez réussi un arbitrage réaliste (${totalWaterUsed} U d'eau, ${totalPowerMw} MW) : couper les calculs publicitaires énergivores permet de préserver les services citoyens essentiels tout en finançant massivement le climat et la gestion de l'eau ! Dernière étape : concevoir votre propre éco-innovation.`}
              buttonLabel="ENTRER DANS L'INNOVATION LAB (NIVEAU FINAL)"
              onContinue={onComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </LevelShell>
  );
}
