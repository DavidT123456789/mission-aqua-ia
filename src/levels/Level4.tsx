import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, MapPin, CheckCircle2, Snowflake, Sun, Building2, Trees, Globe2 } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import TechTerm from '../components/TechTerm';

export default function Level4({ isDevMode, onComplete, onScoreUpdate, onMistake }: { isDevMode?: boolean; onComplete: () => void; onScoreUpdate: (points: number, water: number) => void; onMistake?: () => void; key?: string }) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const locations = [
    {
      id: 'desert',
      name: 'Désert Chaud',
      icon: Sun,
      desc: 'Énergie solaire abondante, mais refroidissement très coûteux en eau.',
      color: 'text-yellow-500',
      bg: 'bg-yellow-950/30',
      border: 'border-yellow-500/50',
      coordinates: { top: '60%', left: '45%' }
    },
    {
      id: 'tropical',
      name: 'Zone Tropicale',
      icon: Trees,
      desc: 'Humidité élevée, nécessite une déshumidification constante.',
      color: 'text-green-500',
      bg: 'bg-green-950/30',
      border: 'border-green-500/50',
      coordinates: { top: '50%', left: '75%' }
    },
    {
      id: 'arctic',
      name: 'Cercle Arctique',
      icon: Snowflake,
      desc: 'Refroidissement naturel par l\'air extérieur (Free Cooling).',
      color: 'text-blue-400',
      bg: 'bg-blue-950/30',
      border: 'border-blue-400/50',
      coordinates: { top: '20%', left: '50%' }
    },
    {
      id: 'urban',
      name: 'Mégalopole',
      icon: Building2,
      desc: 'Proche des utilisateurs, mais espace limité et chaleur urbaine.',
      color: 'text-purple-500',
      bg: 'bg-purple-950/30',
      border: 'border-purple-500/50',
      coordinates: { top: '40%', left: '25%' }
    }
  ];

  const handleSelect = (id: string) => {
    setSelectedLocation(id);
    setShowError(false);
  };

  const [hasScored, setHasScored] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const checkAnswer = () => {
    if (selectedLocation === 'arctic') {
      setIsSuccess(true);
      if (!hasScored) {
        setHasScored(true);
        onScoreUpdate(150, 60);
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
      className="sm:bg-slate-900 border-transparent sm:border-cyan-500/20 sm:border px-0 sm:px-6 py-4 sm:py-6 sm:rounded-xl max-w-4xl mx-auto font-mono relative flex flex-col"
    >
      {isDevMode && (
        <div className="absolute top-2 right-2 bg-purple-900/80 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/50 z-50">
          Dev Réponses : Cercle Arctique (arctic)
        </div>
      )}
      <div className="flex items-center gap-3 mb-3 border-b border-cyan-900/50 pb-3">
        <Map className="w-8 h-8 text-emerald-400" />
        <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
          Niveau 4 : Stratégie d'Implantation
        </h2>
      </div>

      <div className="mb-3">
        <NaiaDialogue 
          message={
            <>
              HYDRA s'apprête à construire un nouveau <TechTerm term="Datacenter">data center</TechTerm>. Le <TechTerm term="Refroidissement" /> représente une part massive de sa consommation énergétique et hydrique. Infiltrez son processus de décision et forcez-la à choisir l'emplacement avec le meilleur impact environnemental, en particulier sur l'eau.
            </>
          }
          emotion="neutral"
        />
      </div>

      <div className="space-y-4 text-slate-300">
        <div className="flex flex-col lg:flex-row gap-5 mt-5">
          {/* Interactive Map Area */}
          <div className="w-full lg:w-3/5 relative bg-slate-950 rounded-xl border border-slate-800 min-h-[400px] flex items-center justify-center">
            {/* Stylized Map Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-map" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-map)" />
              </svg>
            </div>
            
            <Globe2 className="absolute w-full h-full text-slate-800 opacity-30 p-4" />

            {/* Location Markers on Map */}
            {locations.map((loc) => {
              const isSelected = selectedLocation === loc.id;
              const Icon = loc.icon;
              return (
                <button
                  key={`marker-${loc.id}`}
                  onClick={() => handleSelect(loc.id)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                  style={{ top: loc.coordinates.top, left: loc.coordinates.left }}
                >
                  <div className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${
                    isSelected ? `${loc.bg} ${loc.border} border-2 scale-125 z-20 shadow-[0_0_20px_rgba(16,185,129,0.4)]` : 'bg-slate-900 border border-slate-700 hover:scale-110 z-10'
                  }`}>
                    <Icon className={`w-7 h-7 ${isSelected ? loc.color : 'text-slate-500 group-hover:text-slate-300'}`} />
                    
                    {/* Radar ping effect for selected */}
                    {isSelected && (
                      <span className="absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-20"></span>
                    )}
                  </div>
                  
                  {/* Tooltip on hover */}
                  {!isSelected && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 shadow-xl font-sans not-italic font-normal tracking-normal">
                      {loc.name}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-700"></div>
                      <div className="absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-900"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Location Details List */}
          <div className="w-full lg:w-2/5 flex flex-col gap-4">
            {locations.map((loc) => {
              const Icon = loc.icon;
              const isSelected = selectedLocation === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => handleSelect(loc.id)}
                  className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 flex items-center gap-4 ${
                    isSelected 
                      ? `${loc.bg} ${loc.border} scale-[1.02]` 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className={`p-3 rounded-full ${isSelected ? 'bg-slate-900' : 'bg-slate-900/50'}`}>
                    <Icon className={`w-8 h-8 ${isSelected ? loc.color : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-slate-300'}`}>{loc.name}</span>
                      {isSelected && <MapPin className="w-5 h-5 text-white" />}
                    </div>
                    <p className="text-sm text-slate-400 leading-tight">{loc.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {!isSuccess && (
          <div className="flex justify-center mt-5">
            <button
              onClick={checkAnswer}
              disabled={!selectedLocation}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                !selectedLocation
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : showError
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105'
              }`}
            >
              {showError ? 'MAUVAIS EMPLACEMENT' : 'VALIDER L\'EMPLACEMENT'}
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
                EXCELLENT CHOIX
              </div>
              <p className="text-center mb-6 text-sm">
                Le "Free Cooling" dans les régions froides permet d'utiliser l'air extérieur pour refroidir les <TechTerm term="Serveur">serveurs</TechTerm> presque toute l'année, réduisant drastiquement la consommation d'énergie et d'eau par rapport aux climatisations classiques.
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
