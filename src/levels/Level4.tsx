import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Map, Snowflake, Sun, Building2, Wind, Fan, Droplets, Gauge, AlertTriangle } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import HydraLog from '../components/HydraLog';
import TechTerm from '../components/TechTerm';
import LevelHeader from '../components/LevelHeader';
import LevelShell from '../components/LevelShell';
import ActionButton from '../components/ActionButton';
import LevelSuccessCard from '../components/LevelSuccessCard';
import { soundManager } from '../utils/soundManager';
import { useErrorFeedback } from '../utils/useErrorFeedback';

type CoolingMode = 'evaporative' | 'chiller' | 'free_cooling';

interface CoolingMetrics {
  waterPerMWh: number | null;
  pue: number | null;
  inoperableReason?: string;
}

interface SiteOption {
  id: 'paris' | 'ouarzazate' | 'ushuai' | 'lulea';
  name: string;
  region: string;
  icon: typeof Sun;
  avgTemp: number; // °C
  byCooling: Record<CoolingMode, CoolingMetrics>;
  latency: number; // ms
  energyMix: string;
  coordinates: { top: string; left: string };
  labelPosition: 'top' | 'bottom';
}

const SITES: SiteOption[] = [
  {
    id: 'paris',
    name: 'Paris-Nord',
    region: 'Métropole',
    icon: Building2,
    avgTemp: 13,
    byCooling: {
      evaporative: { waterPerMWh: 680, pue: 1.34 },
      chiller: { waterPerMWh: 120, pue: 1.48 },
      free_cooling: { waterPerMWh: 180, pue: 1.28 }
    },
    latency: 4,
    energyMix: 'Nucléaire',
    coordinates: { top: '25%', left: '46%' },
    labelPosition: 'top'
  },
  {
    id: 'ouarzazate',
    name: 'Ouarzazate',
    region: 'Désert chaud',
    icon: Sun,
    avgTemp: 32,
    byCooling: {
      evaporative: { waterPerMWh: 1850, pue: 1.62 },
      chiller: { waterPerMWh: 260, pue: 1.78 },
      free_cooling: { waterPerMWh: null, pue: null, inoperableReason: 'Inopérant (32°C)' }
    },
    latency: 34,
    energyMix: 'Solaire',
    coordinates: { top: '52%', left: '43%' },
    labelPosition: 'bottom'
  },
  {
    id: 'ushuai',
    name: 'Ushuaïa',
    region: 'Subantarctique',
    icon: Wind,
    avgTemp: 1,
    byCooling: {
      evaporative: { waterPerMWh: 390, pue: 1.13 },
      chiller: { waterPerMWh: 50, pue: 1.30 },
      free_cooling: { waterPerMWh: 35, pue: 1.06 }
    },
    latency: 195,
    energyMix: 'Éolien',
    coordinates: { top: '83%', left: '29%' },
    labelPosition: 'top'
  },
  {
    id: 'lulea',
    name: 'Luleå',
    region: 'Subarctique',
    icon: Snowflake,
    avgTemp: 2,
    byCooling: {
      evaporative: { waterPerMWh: 420, pue: 1.14 },
      chiller: { waterPerMWh: 55, pue: 1.32 },
      free_cooling: { waterPerMWh: 45, pue: 1.08 }
    },
    latency: 28,
    energyMix: 'Hydroélectrique',
    coordinates: { top: '18%', left: '62%' },
    labelPosition: 'bottom'
  }
];

const COOLING_MODES: { id: CoolingMode; label: string; detail: string }[] = [
  { id: 'evaporative', label: 'Tours évaporatives', detail: 'Pulvérisation d\'eau douce pour dissiper la chaleur (très gourmand en eau)' },
  { id: 'chiller', label: 'Climatisation mécanique', detail: 'Compresseurs frigorifiques en boucle fermée (dégrade le PUE électrique)' },
  { id: 'free_cooling', label: 'Free Cooling (Air extérieur)', detail: 'Ventilation directe sans évaporation (efficace uniquement en climat froid < 5°C)' }
];

export default function Level4({ onComplete, onScoreUpdate, onMistake }: { onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [selectedSite, setSelectedSite] = useState<SiteOption['id'] | null>(null);
  const [selectedCooling, setSelectedCooling] = useState<CoolingMode>('evaporative');
  const { errorMsg, isErrorFlash, triggerError, clearError } = useErrorFeedback();
  const [hasScored, setHasScored] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectSite = (id: SiteOption['id']) => {
    if (isSuccess) return;
    setSelectedSite(id);
    clearError();
  };

  const selectCooling = (id: CoolingMode) => {
    if (isSuccess) return;
    setSelectedCooling(id);
    clearError();
  };

  const checkAnswer = () => {
    if (!selectedSite || !selectedCooling) return;

    if (selectedSite === 'lulea' && selectedCooling === 'free_cooling') {
      setIsSuccess(true);
      clearError();
      soundManager.playSuccess();
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(150, 42);
      }
      return;
    }

    let feedback = "Ce couple site + refroidissement ne respecte pas nos 3 seuils stricts (Eau < 100 L/MWh, PUE < 1.15, Latence ≤ 40 ms). Testez les 3 systèmes pour comparer !";
    if (selectedSite === 'ushuai') {
      feedback = "Ushuaïa est très sobre (1°C), mais sa latence réseau (195 ms) dépasse largement la limite de 40 ms du cahier des charges !";
    } else if (selectedSite === 'lulea' && selectedCooling === 'evaporative') {
      feedback = "À Luleå, les tours évaporatives consomment encore 420 L/MWh (> 100 L/MWh). Testez les autres systèmes pour comparer l'Eau et le PUE !";
    } else if (selectedSite === 'lulea' && selectedCooling === 'chiller') {
      feedback = "À Luleå, la climatisation mécanique économise l'eau (55 L/MWh), mais fait grimper le PUE à 1.32 (> 1.15). Profitez plutôt des 2°C extérieurs !";
    } else if (selectedSite === 'ouarzazate' && selectedCooling === 'free_cooling') {
      feedback = "Le Free Cooling est inopérant à Ouarzazate (32°C en moyenne) : l'air extérieur est trop chaud pour refroidir les serveurs sans système actif.";
    } else if (selectedSite === 'paris' && selectedCooling === 'free_cooling') {
      feedback = "À Paris-Nord (13°C), le Free Cooling nécessite un appoint une grande partie de l'année : l'Eau (180 L/MWh) et le PUE (1.28) restent hors seuils.";
    }

    triggerError(feedback);
    onMistake?.();
  };

  return (
    <LevelShell compact wide>
      <LevelHeader level={4} icon={Map} compact />

      <div className="mb-3 space-y-2">
        <HydraLog
          status="hostile"
          message="Plan d'extension : implantation prioritaire pré-sélectionnée en désert chaud (foncier faible coût, tours évaporatives)."
        />
        <NaiaDialogue
          message={
            <>
              HYDRA construit un nouveau <TechTerm term="Datacenter">data center</TechTerm> d'entraînement (<TechTerm term="Latence">latence</TechTerm> depuis l'Europe tolérée jusqu'à 40 ms). Testez les systèmes de <TechTerm term="Refroidissement" /> pour simuler l'eau et le <TechTerm term="PUE" /> des 4 sites.
            </>
          }
          objective="Sélectionnez le site et le refroidissement qui respectent les 3 seuils du cahier des charges."
          reaction={errorMsg ? { message: errorMsg, emotion: 'alert' } : null}
          onDismissReaction={clearError}
          emotion={isSuccess ? 'happy' : 'neutral'}
        />
      </div>

      <div className="space-y-2.5 text-slate-300">
        {/* Cahier des charges */}
        <div className="bg-slate-950/80 border border-cyan-500/30 px-3.5 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-cyan-400 uppercase tracking-wider">Cahier des charges :</span>
            {selectedCooling ? (
              <span className="text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
                Simulation : {COOLING_MODES.find(m => m.id === selectedCooling)?.label}
              </span>
            ) : (
              <span className="text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
                Choisissez un refroidissement ci-dessous
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold tabular-nums">Eau &lt; 100 L/MWh</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold tabular-nums">
              <TechTerm term="PUE" /> &lt; 1,15
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold tabular-nums">
              <TechTerm term="Latence" /> ≤ 40 ms
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Interactive Map Area with Explicit Climate Bands */}
          <div className="w-full lg:w-2/5 relative bg-slate-950 rounded-2xl border border-white/10 min-h-[225px] flex items-center justify-center overflow-hidden">
            {/* Explicit Climate Bands */}
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute inset-x-0 top-0 bg-gradient-to-b from-cyan-500/15 to-transparent border-b border-dashed border-cyan-500/20 flex items-start justify-start px-2 pt-1"
                style={{ height: '24%' }}
              >
                <span className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-bold">Zone Subarctique (&lt; 5°C)</span>
              </div>
              <div
                className="absolute inset-x-0 bg-gradient-to-r from-amber-500/5 via-amber-500/12 to-amber-500/5 border-y border-dashed border-amber-500/20 flex items-center justify-end px-2"
                style={{ top: '44%', height: '22%' }}
              >
                <span className="text-[10px] uppercase tracking-wider text-amber-300/75 font-bold">Zone Chaude / Équateur</span>
              </div>
              <div
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cyan-500/15 to-transparent border-t border-dashed border-cyan-500/20 flex items-end justify-end px-2 pb-1"
                style={{ height: '24%' }}
              >
                <span className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-bold">Zone Subantarctique (&lt; 5°C)</span>
              </div>
            </div>

            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-map" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-map)" />
              </svg>
            </div>

            {/* Stylized World Map Silhouette */}
            <svg
              viewBox="0 0 100 60"
              preserveAspectRatio="xMidYMid slice"
              className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
            >
              {/* North & South America */}
              <path d="M10,12 L28,10 L32,18 L24,27 L20,29 L22,33 L33,38 L31,52 L28,55 L24,52 L21,42 L15,28 L8,18 Z" fill="#1e293b" stroke="#475569" strokeWidth="0.4" />
              {/* Europe & Africa */}
              <path d="M43,9 L59,7 L61,18 L55,23 L57,29 L62,36 L55,50 L48,50 L46,35 L42,27 L44,18 Z" fill="#1e293b" stroke="#475569" strokeWidth="0.4" />
              {/* Asia & Oceania */}
              <path d="M59,10 L86,11 L91,23 L82,32 L76,34 L73,27 L64,25 L59,18 Z" fill="#1e293b" stroke="#475569" strokeWidth="0.4" />
              <path d="M78,41 L89,40 L91,49 L80,50 Z" fill="#1e293b" stroke="#475569" strokeWidth="0.4" />
            </svg>

            {SITES.map((loc) => {
              const isSelected = selectedSite === loc.id;
              const Icon = loc.icon;
              const isLabelTop = loc.labelPosition === 'top';
              return (
                <button
                  key={`marker-${loc.id}`}
                  type="button"
                  disabled={isSuccess}
                  onClick={() => selectSite(loc.id)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 group ${isSelected ? 'z-30' : 'z-10 hover:z-20'}`}
                  style={{ top: loc.coordinates.top, left: loc.coordinates.left }}
                >
                  <div className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
                    isSelected
                      ? 'bg-cyan-950/95 border-cyan-400 border-2 scale-115 hover:shadow-[0_0_16px_rgba(34,211,238,0.35)]'
                      : 'bg-slate-900/95 border border-slate-700 hover:border-slate-400 hover:shadow-[0_0_12px_rgba(148,163,184,0.25)]'
                  }`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  </div>
                  <span
                    className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950/95 border shadow-sm ${
                      isLabelTop ? 'bottom-full mb-1' : 'top-full mt-1'
                    } ${
                      isSelected ? 'border-cyan-400 text-cyan-300' : 'border-slate-800 text-slate-300'
                    }`}
                  >
                    {loc.name} ({loc.avgTemp}°C)
                  </span>
                </button>
              );
            })}
          </div>

          {/* 2x2 Comparison Cards */}
          <div className="w-full lg:w-3/5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SITES.map((loc) => {
              const Icon = loc.icon;
              const isSelected = selectedSite === loc.id;
              const metrics = selectedCooling ? loc.byCooling[selectedCooling] : null;
              const isInoperable = Boolean(metrics?.inoperableReason);

              return (
                <button
                  key={loc.id}
                  type="button"
                  disabled={isSuccess}
                  onClick={() => selectSite(loc.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between active:scale-[0.985] ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-400'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white truncate">{loc.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{loc.region} • {loc.energyMix}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                      {loc.avgTemp}°C
                    </span>
                  </div>

                  {isInoperable ? (
                    <div className="grid grid-cols-3 gap-1.5 text-center pt-2 border-t border-slate-800/80 text-[11px]">
                      <div className="col-span-2 bg-red-950/40 border border-red-500/30 rounded p-1.5 flex items-center justify-center gap-1 text-red-300 font-bold text-[11px]">
                        <AlertTriangle className="w-3 h-3 shrink-0 text-red-400" />
                        <span>{metrics?.inoperableReason}</span>
                      </div>
                      <div className="bg-slate-900/70 rounded p-1.5">
                        <div className="text-[11px] text-slate-400 uppercase">Latence</div>
                        <div className="font-bold text-slate-100">{loc.latency} ms</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 text-center pt-2 border-t border-slate-800/80 text-[11px]">
                      <div className="bg-slate-900/70 rounded p-1.5">
                        <div className="text-[11px] text-slate-400 uppercase flex items-center justify-center gap-0.5">
                          <Droplets className="w-2.5 h-2.5 text-cyan-400" /> Eau
                        </div>
                        <div className={`font-bold font-mono tabular-nums whitespace-nowrap ${metrics ? 'text-slate-100' : 'text-slate-500'}`}>
                          {metrics?.waterPerMWh !== null && metrics ? (
                            <>
                              {metrics.waterPerMWh} <span className="text-[10px] font-normal text-slate-400">L/MWh</span>
                            </>
                          ) : (
                            '—'
                          )}
                        </div>
                      </div>
                      <div className="bg-slate-900/70 rounded p-1.5">
                        <div className="text-[11px] text-slate-400 uppercase flex items-center justify-center gap-0.5">
                          <Gauge className="w-2.5 h-2.5 text-cyan-400" /> PUE
                        </div>
                        <div className={`font-bold font-mono tabular-nums ${metrics ? 'text-slate-100' : 'text-slate-500'}`}>
                          {metrics?.pue !== null && metrics ? metrics.pue.toFixed(2).replace('.', ',') : '—'}
                        </div>
                      </div>
                      <div className="bg-slate-900/70 rounded p-1.5">
                        <div className="text-[11px] text-slate-400 uppercase">Latence</div>
                        <div className="font-bold font-mono tabular-nums text-slate-100">{loc.latency} ms</div>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cooling System Selection */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            <div className="flex items-center gap-2">
              <Fan className="w-4 h-4 text-cyan-400" />
              <span>Système de refroidissement à déployer sur le site :</span>
            </div>
            <span className="text-[11px] font-normal text-slate-400 normal-case hidden sm:inline">
              Cliquez pour simuler l'impact sur l'Eau et le PUE
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {COOLING_MODES.map((mode) => {
              const isSelected = selectedCooling === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  disabled={isSuccess}
                  onClick={() => selectCooling(mode.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all active:scale-[0.985] ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-400 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-bold text-xs">{mode.label}</span>
                    {mode.id === 'evaporative' && (
                      <span className="text-[11px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/35 text-amber-300 shrink-0">
                        Actuel HYDRA
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-snug">{mode.detail}</div>
                </button>
              );
            })}
          </div>
        </div>

        {!isSuccess && (
          <div className="flex justify-center">
            <ActionButton
              onClick={checkAnswer}
              disabled={!selectedSite || !selectedCooling}
              isError={isErrorFlash}
              size="md"
            >
              VALIDER L'IMPLANTATION
            </ActionButton>
          </div>
        )}

        <AnimatePresence>
          {isSuccess && (
            <LevelSuccessCard
              title="IMPLANTATION OPTIMALE VALIDÉE"
              description={
                <>
                  À Luleå (climat froid à 2°C et latence de 28 ms ≤ 40 ms), le Free Cooling utilise directement l'air extérieur pour refroidir les <TechTerm term="Serveur">serveurs</TechTerm> presque toute l'année. Combiné à l'hydroélectricité, le PUE tombe à 1,08 avec 97 % d'eau en moins par rapport au désert !
                </>
              }
              buttonLabel="CONTINUER LE DÉPLOIEMENT"
              onContinue={onComplete}
              compact
              className="mt-4"
            />
          )}
        </AnimatePresence>
      </div>
    </LevelShell>
  );
}
