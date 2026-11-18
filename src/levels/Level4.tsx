import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, CheckCircle2, Snowflake, Sun, Building2, Compass, Wind, Droplets, Gauge, AlertTriangle } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';
import { soundManager } from '../utils/soundManager';

type CoolingMode = 'evaporative' | 'chiller' | 'free_cooling';

interface CoolingMetrics {
  waterPerMWh: number | null;
  pue: number | null;
  inoperableReason?: string;
}

interface SiteOption {
  id: 'paris' | 'phoenix' | 'ushuai' | 'lulea';
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
    coordinates: { top: '29%', left: '44%' },
    labelPosition: 'bottom'
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    region: 'Désert chaud',
    icon: Sun,
    avgTemp: 32,
    byCooling: {
      evaporative: { waterPerMWh: 1850, pue: 1.62 },
      chiller: { waterPerMWh: 260, pue: 1.78 },
      free_cooling: { waterPerMWh: null, pue: null, inoperableReason: 'Inopérant (32°C)' }
    },
    latency: 12,
    energyMix: 'Solaire',
    coordinates: { top: '48%', left: '19%' },
    labelPosition: 'bottom'
  },
  {
    id: 'ushuai',
    name: 'Ushuaïa',
    region: 'Subantarctique',
    icon: Compass,
    avgTemp: 1,
    byCooling: {
      evaporative: { waterPerMWh: 390, pue: 1.13 },
      chiller: { waterPerMWh: 50, pue: 1.30 },
      free_cooling: { waterPerMWh: 35, pue: 1.06 }
    },
    latency: 95,
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
    coordinates: { top: '17%', left: '61%' },
    labelPosition: 'top'
  }
];

const COOLING_MODES: { id: CoolingMode; label: string; detail: string }[] = [
  { id: 'evaporative', label: 'Tours évaporatives', detail: 'Pulvérisation d\'eau douce pour dissiper la chaleur (très gourmand en eau)' },
  { id: 'chiller', label: 'Climatisation mécanique', detail: 'Compresseurs frigorifiques en boucle fermée (dégrade le PUE électrique)' },
  { id: 'free_cooling', label: 'Free Cooling (Air extérieur)', detail: 'Ventilation directe sans évaporation (efficace uniquement en climat froid < 5°C)' }
];

export default function Level4({ isDevMode: _isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [selectedSite, setSelectedSite] = useState<SiteOption['id'] | null>(null);
  const [selectedCooling, setSelectedCooling] = useState<CoolingMode | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasScored, setHasScored] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const activeSiteObj = SITES.find(s => s.id === selectedSite);

  const selectSite = (id: SiteOption['id']) => {
    if (isSuccess) return;
    setSelectedSite(id);
    setErrorMsg(null);
  };

  const selectCooling = (id: CoolingMode) => {
    if (isSuccess) return;
    setSelectedCooling(id);
    setErrorMsg(null);
  };

  const checkAnswer = () => {
    if (!selectedSite || !selectedCooling) return;

    if (selectedSite === 'lulea' && selectedCooling === 'free_cooling') {
      setIsSuccess(true);
      setErrorMsg(null);
      soundManager.playSuccess();
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(150, 42);
      }
      return;
    }

    let feedback = "Ce couple site + refroidissement ne respecte pas nos 3 seuils stricts (Eau < 100 L/MWh, PUE < 1.15, Latence ≤ 40 ms). Testez les 3 systèmes pour comparer !";
    if (selectedSite === 'ushuai') {
      feedback = "Ushuaïa est très sobre (1°C), mais sa latence réseau (95 ms) dépasse la limite de 40 ms du cahier des charges !";
    } else if (selectedSite === 'lulea' && selectedCooling === 'evaporative') {
      feedback = "À Luleå, les tours évaporatives consomment encore 420 L/MWh (> 100 L/MWh). Testez les autres systèmes pour comparer l'Eau et le PUE !";
    } else if (selectedSite === 'lulea' && selectedCooling === 'chiller') {
      feedback = "À Luleå, la climatisation mécanique économise l'eau (55 L/MWh), mais fait grimper le PUE à 1.32 (> 1.15). Profitez plutôt des 2°C extérieurs !";
    } else if (selectedSite === 'phoenix' && selectedCooling === 'free_cooling') {
      feedback = "Le Free Cooling est inopérant à Phoenix (32°C en moyenne) : l'air extérieur est trop chaud pour refroidir les serveurs sans système actif.";
    } else if (selectedSite === 'paris' && selectedCooling === 'free_cooling') {
      feedback = "À Paris-Nord (13°C), le Free Cooling nécessite un appoint une grande partie de l'année : l'Eau (180 L/MWh) et le PUE (1.28) restent hors seuils.";
    }

    setErrorMsg(feedback);
    onMistake?.();
    setTimeout(() => setErrorMsg(null), 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="sm:bg-slate-900 border-transparent sm:border-cyan-500/20 sm:border px-0 sm:px-6 py-2.5 sm:py-4 sm:rounded-xl max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      <div className="flex items-center gap-3 mb-2 border-b border-cyan-900/50 pb-2">
        <Map className="w-7 h-7 text-emerald-400" />
        <h2 className="text-lg md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 4 : Stratégie d'Implantation
        </h2>
      </div>

      <div className="mb-2">
        <NaiaDialogue
          message={
            <>
              HYDRA construit un nouveau <TechTerm term="Datacenter">data center</TechTerm> d'entraînement (<TechTerm term="Latence">latence</TechTerm> tolérée jusqu'à 40 ms). Testez les systèmes de <TechTerm term="Refroidissement" /> ci-dessous pour simuler l'eau et le <TechTerm term="PUE" /> des 4 sites, puis sélectionnez la combinaison respectant nos 3 seuils stricts.
            </>
          }
          emotion="neutral"
        />
      </div>

      <div className="space-y-2.5 text-slate-300">
        {/* Cahier des charges */}
        <div className="bg-slate-950/80 border border-cyan-500/30 px-3.5 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-cyan-400 uppercase tracking-wider">Cahier des charges :</span>
            {selectedCooling ? (
              <span className="text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
                Simulation : {COOLING_MODES.find(m => m.id === selectedCooling)?.label}
              </span>
            ) : (
              <span className="text-[10px] text-amber-300/90 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
                Choisissez un refroidissement ci-dessous
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold">Eau &lt; 100 L/MWh</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold">
              <TechTerm term="PUE" /> &lt; 1.15
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold">
              <TechTerm term="Latence" /> ≤ 40 ms
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3.5">
          {/* Interactive Map Area with Explicit Climate Bands */}
          <div className="w-full lg:w-2/5 relative bg-slate-950 rounded-xl border border-slate-800 min-h-[205px] flex items-center justify-center overflow-hidden">
            {/* Explicit Climate Bands */}
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute inset-x-0 top-0 bg-gradient-to-b from-cyan-500/15 to-transparent border-b border-dashed border-cyan-500/20 flex items-start justify-start px-2 pt-1"
                style={{ height: '24%' }}
              >
                <span className="text-[8px] uppercase tracking-widest text-cyan-300/75 font-bold">Zone Subarctique (&lt; 5°C)</span>
              </div>
              <div
                className="absolute inset-x-0 bg-gradient-to-r from-amber-500/5 via-amber-500/12 to-amber-500/5 border-y border-dashed border-amber-500/20 flex items-center justify-end px-2"
                style={{ top: '44%', height: '22%' }}
              >
                <span className="text-[8px] uppercase tracking-widest text-amber-300/65 font-bold">Zone Chaude / Équateur</span>
              </div>
              <div
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cyan-500/15 to-transparent border-t border-dashed border-cyan-500/20 flex items-end justify-end px-2 pb-1"
                style={{ height: '24%' }}
              >
                <span className="text-[8px] uppercase tracking-widest text-cyan-300/75 font-bold">Zone Subantarctique (&lt; 5°C)</span>
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
              preserveAspectRatio="none"
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
                      ? 'bg-cyan-950/95 border-cyan-400 border-2 scale-115 shadow-[0_0_18px_rgba(34,211,238,0.5)]'
                      : 'bg-slate-900/95 border border-slate-700 hover:border-slate-400 hover:scale-105'
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
                  className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white truncate">{loc.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{loc.region} • {loc.energyMix}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                      {loc.avgTemp}°C
                    </span>
                  </div>

                  {isInoperable ? (
                    <div className="grid grid-cols-3 gap-1.5 text-center pt-2 border-t border-slate-800/80 text-[11px]">
                      <div className="col-span-2 bg-red-950/40 border border-red-500/30 rounded p-1.5 flex items-center justify-center gap-1 text-red-300 font-bold text-[10px]">
                        <AlertTriangle className="w-3 h-3 shrink-0 text-red-400" />
                        <span>{metrics?.inoperableReason}</span>
                      </div>
                      <div className="bg-slate-900/70 rounded p-1.5">
                        <div className="text-[9px] text-slate-400 uppercase">Latence</div>
                        <div className="font-bold text-slate-100">{loc.latency} ms</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 text-center pt-2 border-t border-slate-800/80 text-[11px]">
                      <div className="bg-slate-900/70 rounded p-1.5">
                        <div className="text-[9px] text-slate-400 uppercase flex items-center justify-center gap-0.5">
                          <Droplets className="w-2.5 h-2.5 text-cyan-400" /> Eau
                        </div>
                        <div className={`font-bold whitespace-nowrap ${metrics ? 'text-slate-100' : 'text-slate-500'}`}>
                          {metrics?.waterPerMWh !== null && metrics ? (
                            <>
                              {metrics.waterPerMWh} <span className="text-[9px] font-normal text-slate-400">L/MWh</span>
                            </>
                          ) : (
                            '—'
                          )}
                        </div>
                      </div>
                      <div className="bg-slate-900/70 rounded p-1.5">
                        <div className="text-[9px] text-slate-400 uppercase flex items-center justify-center gap-0.5">
                          <Gauge className="w-2.5 h-2.5 text-cyan-400" /> PUE
                        </div>
                        <div className={`font-bold ${metrics ? 'text-slate-100' : 'text-slate-500'}`}>
                          {metrics?.pue !== null && metrics ? metrics.pue.toFixed(2) : '—'}
                        </div>
                      </div>
                      <div className="bg-slate-900/70 rounded p-1.5">
                        <div className="text-[9px] text-slate-400 uppercase">Latence</div>
                        <div className="font-bold text-slate-100">{loc.latency} ms</div>
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
              <Wind className="w-4 h-4 text-cyan-400" />
              <span>Système de refroidissement à déployer sur le site :</span>
            </div>
            <span className="text-[10px] font-normal text-slate-400 normal-case hidden sm:inline">
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
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="font-bold text-xs mb-0.5">{mode.label}</div>
                  <div className="text-[10px] text-slate-400 leading-snug">{mode.detail}</div>
                </button>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 bg-red-950/40 border border-red-500/50 rounded-lg text-red-300 text-xs font-bold flex items-center justify-center gap-2 text-center"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {!isSuccess && (
          <div className="flex justify-center">
            <button
              onClick={checkAnswer}
              disabled={!selectedSite || !selectedCooling}
              className={`px-7 py-2.5 rounded-lg font-bold text-base transition-all ${
                !selectedSite || !selectedCooling
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : errorMsg
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105'
              }`}
            >
              VALIDER L'IMPLANTATION
            </button>
          </div>
        )}

        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center mt-4 p-5 bg-emerald-950/30 border border-emerald-500/50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl mb-3">
                <CheckCircle2 className="w-6 h-6" />
                IMPLANTATION OPTIMALE VALIDÉE
              </div>
              <p className="text-center mb-5 text-sm">
                À Luleå (climat froid à 2°C et latence de 28 ms ≤ 40 ms), le Free Cooling utilise directement l'air extérieur pour refroidir les <TechTerm term="Serveur">serveurs</TechTerm> presque toute l'année. Combiné à l'hydroélectricité, le PUE tombe à 1.08 avec 97% d'eau en moins par rapport au désert !
              </p>
              <button
                onClick={onComplete}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                CONTINUER LE DÉPLOIEMENT
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
