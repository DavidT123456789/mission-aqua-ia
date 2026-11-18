import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Play, RotateCcw, Trash2 } from 'lucide-react';
import TechTerm from '../components/TechTerm';
import { LEVEL_NAMES, MISSION_DURATION_MINUTES } from '../constants';

export default function Intro({ onStart, hasSavedGame, savedGameInfo, onLoadGame, onClearSave }: { 
  onStart: (name: string) => void; 
  hasSavedGame?: boolean;
  savedGameInfo?: { level: number; score: number; timeLeft: number } | null;
  onLoadGame?: () => void;
  onClearSave?: () => void;
  key?: string 
}) {
  const [name, setName] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="sm:bg-slate-900/90 border-transparent sm:border-cyan-500/20 p-4 sm:p-6 sm:rounded-xl max-w-2xl mx-auto backdrop-blur-xl"
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="p-3 bg-emerald-950/50 rounded-full border border-emerald-500/50">
          <ShieldAlert className="w-10 h-10 text-emerald-400" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
          MISSION <span className="text-emerald-400">AQUA-IA</span>
        </h1>
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onStart(name || 'Agent Anonyme');
          }}
          className="w-full space-y-3"
        >
          <div className="space-y-2.5 text-slate-300 text-sm sm:text-base leading-relaxed text-left font-sans">
            <p>
              Bienvenue dans la cellule d'urgence <strong className="text-cyan-400 font-mono">HYDROSAVE</strong>, agent. La ville fait face à une crise sans précédent.
            </p>
            <p>
              Le réseau d'<TechTerm term="IA">intelligence artificielle</TechTerm> central, <strong className="text-red-400 font-mono">HYDRA</strong>, tourne sans limite et pompe toute notre réserve d'eau potable pour refroidir ses immenses <TechTerm term="Serveur">serveurs</TechTerm> de calcul.
            </p>
            <p>
              Votre mission : infiltrer ses 13 niveaux de sécurité, stopper le gaspillage matériel et logiciel, et reprogrammer HYDRA dans l'Innovation Lab pour qu'elle protège nos ressources au lieu de les épuiser.
            </p>
            <p>
              Pour vous guider, vous serez assisté par <strong className="text-purple-400 font-mono">NAÏA</strong>, notre petite <TechTerm term="IA" /> tactique sobre et spécialisée.
            </p>
            
            <div className="mt-3 p-4 bg-slate-950/50 rounded-xl border border-cyan-500/20 space-y-2.5">
              <label htmlFor="agent-name" className="block text-cyan-400 font-mono text-xs sm:text-sm uppercase tracking-widest text-center">
                IDENTIFICATION DE L'AGENT
              </label>
              <input
                id="agent-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Entrez votre pseudo"
                className="w-full bg-slate-900 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-white text-center focus:outline-none focus:border-cyan-500 transition-colors"
                maxLength={20}
              />
            </div>

            <p className="text-emerald-400 font-mono font-bold text-center text-sm sm:text-base pt-1">
              Vous avez {MISSION_DURATION_MINUTES} minutes. Bonne chance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-1">
            {hasSavedGame && (
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={onLoadGame}
                  className="flex flex-col items-center justify-center gap-0.5 bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  <span className="flex items-center gap-2 text-base sm:text-lg">
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                    REPRENDRE LA MISSION
                  </span>
                  {savedGameInfo && (
                    <span className="text-xs font-mono font-normal text-cyan-100/90">
                      Niveau {savedGameInfo.level}/13 — {LEVEL_NAMES[savedGameInfo.level] || `Mission ${savedGameInfo.level}`} ({savedGameInfo.score} pts)
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClearSave}
                  className="flex items-center justify-center gap-1 text-red-500 hover:text-red-400 text-xs uppercase font-bold transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Effacer la sauvegarde
                </button>
              </div>
            )}
            
            <button
              type="submit"
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-base sm:text-lg transition-all hover:scale-105 active:scale-95 ${
                hasSavedGame 
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              {hasSavedGame ? 'NOUVELLE PARTIE' : 'DÉMARRER LA MISSION'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
