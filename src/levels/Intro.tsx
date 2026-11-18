import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Play, RotateCcw, Trash2, Clock, Layers, Cpu } from 'lucide-react';
import TechTerm from '../components/TechTerm';
import NaiaDialogue from '../components/NaiaDialogue';
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
      className="sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border p-4 sm:p-7 sm:rounded-2xl max-w-2xl mx-auto backdrop-blur-xl font-sans sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)]"
    >
      <div className="flex flex-col items-center space-y-5">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-950/60 rounded-2xl border border-emerald-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <ShieldAlert className="w-7 h-7 text-emerald-400" />
          </div>
          <div className="text-left">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400/90">
              Cellule d'urgence HYDROSAVE
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              MISSION <span className="text-emerald-400">AQUA-IA</span>
            </h1>
          </div>
        </div>

        {/* NAÏA Character Intro Bubble */}
        <NaiaDialogue
          hideHintButton
          emotion="neutral"
          message={
            <>
              Salut Agent ! Moi, c'est <strong className="text-cyan-300">NAÏA</strong>, votre petite <TechTerm term="IA" /> tactique sobre. Le réseau central <strong className="text-red-400 font-mono">HYDRA</strong> pompe toute l'eau potable de la ville pour refroidir ses immenses <TechTerm term="Serveur">serveurs</TechTerm> !
            </>
          }
          objective="Infiltrez ses 13 systèmes, stoppez le gaspillage et reprogrammez HYDRA en mode Symbiose."
        />

        {/* Quick Mission Overview Pills */}
        <div className="grid grid-cols-3 gap-2.5 w-full text-center">
          <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl px-3 py-2.5 flex flex-col items-center gap-0.5">
            <Layers className="w-4 h-4 text-cyan-400 mb-0.5" />
            <span className="font-mono text-xs sm:text-sm font-bold text-white">13 Niveaux</span>
            <span className="text-[11px] text-slate-400">Défis techniques</span>
          </div>
          <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl px-3 py-2.5 flex flex-col items-center gap-0.5">
            <Clock className="w-4 h-4 text-emerald-400 mb-0.5" />
            <span className="font-mono text-xs sm:text-sm font-bold text-white">{MISSION_DURATION_MINUTES} Minutes</span>
            <span className="text-[11px] text-slate-400">Contre la montre</span>
          </div>
          <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl px-3 py-2.5 flex flex-col items-center gap-0.5">
            <Cpu className="w-4 h-4 text-cyan-300 mb-0.5" />
            <span className="font-mono text-xs sm:text-sm font-bold text-white">Innovation Lab</span>
            <span className="text-[11px] text-slate-400">Brevet final IA</span>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onStart(name || 'Agent Anonyme');
          }}
          className="w-full space-y-4"
        >
          <div className="space-y-2">
            <label htmlFor="agent-name" className="block text-slate-400 font-mono text-[11px] uppercase tracking-[0.2em] text-center">
              Identification de l'agent
            </label>
            <input
              id="agent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entrez votre pseudo"
              className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-3 text-white text-center font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20 transition-all"
              maxLength={20}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            {hasSavedGame && (
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={onLoadGame}
                  className="flex flex-col items-center justify-center gap-0.5 bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_18px_rgba(6,182,212,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]"
                >
                  <span className="flex items-center gap-2 text-base">
                    <RotateCcw className="w-4 h-4" />
                    REPRENDRE LA MISSION
                  </span>
                  {savedGameInfo && (
                    <span className="text-[11px] font-mono font-normal text-cyan-100/90">
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
              className={`flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-bold text-base transition-all ${
                hasSavedGame 
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 hover:shadow-[0_0_14px_rgba(16,185,129,0.2)]' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_18px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]'
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
