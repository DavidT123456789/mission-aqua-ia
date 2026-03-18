import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Play, RotateCcw, Trash2 } from 'lucide-react';
import TechTerm from '../components/TechTerm';

export default function Intro({ onStart, hasSavedGame, onLoadGame, onClearSave }: { 
  onStart: (name: string) => void; 
  hasSavedGame?: boolean;
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
      className="bg-slate-900/90 border border-emerald-500/20 p-8 rounded-xl shadow-2xl max-w-2xl mx-auto backdrop-blur-xl"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-emerald-950/50 rounded-full border border-emerald-500/50">
          <ShieldAlert className="w-16 h-16 text-emerald-400" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          MISSION <span className="text-emerald-400">AQUA-IA</span>
        </h1>
        
        <div className="space-y-4 text-slate-300 text-lg leading-relaxed text-left font-sans">
          <p>
            Bienvenue, agent. La ville fait face à une crise sans précédent.
          </p>
          <p>
            Notre <TechTerm term="IA">intelligence artificielle</TechTerm> centrale, <strong className="text-red-400 font-mono">HYDRA</strong>, consomme toute notre réserve d'eau potable pour refroidir ses immenses <TechTerm term="Serveur">serveurs</TechTerm> de calcul.
          </p>
          <p>
            Votre mission : infiltrer le système en 7 étapes, stopper l'hémorragie, et reprogrammer HYDRA pour qu'elle nous aide à économiser l'eau et l'énergie au lieu de les gaspiller.
          </p>
          
          <div className="mt-5 p-6 bg-slate-950/50 rounded-xl border border-emerald-500/20 space-y-4">
            <label className="block text-emerald-400 font-mono text-sm uppercase tracking-widest text-center">
              IDENTIFICATION DE L'AGENT
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entrez votre pseudo"
              className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg px-4 py-3 text-white text-center focus:outline-none focus:border-emerald-500 transition-colors"
              maxLength={20}
            />
          </div>

          <p className="text-emerald-400 font-mono font-bold text-center mt-6">
            Vous avez 30 minutes. Bonne chance.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          {hasSavedGame && (
            <div className="flex flex-col gap-2">
              <button
                onClick={onLoadGame}
                className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                <RotateCcw className="w-6 h-6" />
                REPRENDRE LA MISSION
              </button>
              <button
                onClick={onClearSave}
                className="flex items-center justify-center gap-1 text-red-500 hover:text-red-400 text-xs uppercase font-bold transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Effacer la sauvegarde
              </button>
            </div>
          )}
          
          <button
            onClick={() => onStart(name || 'Agent Anonyme')}
            className={`flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-xl transition-all hover:scale-105 active:scale-95 ${
              hasSavedGame 
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            }`}
          >
            <Play className="w-6 h-6 fill-current" />
            {hasSavedGame ? 'NOUVELLE PARTIE' : 'DÉMARRER LA MISSION'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
