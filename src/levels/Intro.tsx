import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Trash2, Clock, Layers, Cpu, Trophy } from 'lucide-react';
import TechTerm from '../components/TechTerm';
import NaiaDialogue from '../components/NaiaDialogue';
import { LEVEL_NAMES, MISSION_DURATION_MINUTES } from '../constants';

export default function Intro({ onStart, hasSavedGame, savedGameInfo, onLoadGame, onClearSave }: { 
  onStart: (name: string) => void; 
  hasSavedGame?: boolean;
  savedGameInfo?: { level: number; score: number; timeLeft: number; nickname?: string; isLockedOut?: boolean } | null;
  onLoadGame?: () => void;
  onClearSave?: () => void;
  key?: string 
}) {
  const [name, setName] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [showNewGameForm, setShowNewGameForm] = useState(false);

  useEffect(() => {
    if (!confirmClear) return;
    const timer = setTimeout(() => setConfirmClear(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmClear]);

  useEffect(() => {
    if (!hasSavedGame) {
      setConfirmClear(false);
      setShowNewGameForm(false);
    }
  }, [hasSavedGame]);

  const isFinished = savedGameInfo?.level === 14;
  const savedAgentLabel = savedGameInfo?.nickname
    ? savedGameInfo.nickname.toLowerCase().startsWith('agent')
      ? savedGameInfo.nickname
      : `Agent ${savedGameInfo.nickname}`
    : 'Partie en cours';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onStart(name.trim() || 'Agent Anonyme');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border p-4 sm:p-8 sm:rounded-2xl max-w-2xl mx-auto backdrop-blur-xl font-sans sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)]"
    >
      <div className="flex flex-col items-center space-y-6">
        {/* Centered Header (NAÏA serves as the sole visual emblem below) */}
        <div className="text-center space-y-1">
          <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-cyan-400/90">
            Cellule d'urgence HYDROSAVE
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            MISSION <span className="text-emerald-400">AQUA-IA</span>
          </h1>
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

        {/* Compact Mission Specs Strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-[13px] text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-mono font-semibold text-white">13 niveaux</span>
          </span>
          <span className="hidden sm:block w-px h-3.5 bg-white/10" aria-hidden="true" />
          <span
            className="inline-flex items-center gap-1.5"
            title="40 min pour les niveaux 1 à 12, puis Innovation Lab en temps libre (prévoir 55 à 75 min au total)"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono font-semibold text-white">{MISSION_DURATION_MINUTES} min chrono</span>
          </span>
          <span className="hidden sm:block w-px h-3.5 bg-white/10" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span className="font-mono font-semibold text-white">Innovation Lab</span>
          </span>
        </div>

        {/* Action Section */}
        <div className="w-full pt-5 border-t border-white/[0.07] space-y-3.5">
          {hasSavedGame ? (
            <>
              {/* Priority Resume Card */}
              <div className="w-full rounded-xl bg-cyan-950/35 border border-cyan-500/25 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="min-w-0 text-center sm:text-left space-y-0.5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">
                    {isFinished
                      ? 'Dossier final prêt'
                      : savedGameInfo?.isLockedOut
                      ? 'Seconde chance disponible'
                      : savedAgentLabel}
                  </div>
                  {savedGameInfo && (
                    <div className="text-sm font-semibold text-white truncate">
                      {isFinished
                        ? `${savedGameInfo.nickname ? `${savedGameInfo.nickname} · ` : ''}${savedGameInfo.score} pts`
                        : `Niveau ${savedGameInfo.level}/13 — ${LEVEL_NAMES[savedGameInfo.level] || `Mission ${savedGameInfo.level}`}`}
                    </div>
                  )}
                  {savedGameInfo && (
                    <div className="font-mono text-[11px] text-slate-400">
                      {isFinished
                        ? 'Brevet final & attestation A4 prêts'
                        : `${savedGameInfo.score} pts · Progression sauvegardée`}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onLoadGame}
                  className="shrink-0 inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_18px_rgba(6,182,212,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]"
                >
                  {isFinished ? (
                    <>
                      <Trophy className="w-4 h-4 text-yellow-300" />
                      REVOIR MON DOSSIER
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      REPRENDRE
                    </>
                  )}
                </button>
              </div>

              {/* Secondary actions or collapsible New Game form */}
              <AnimatePresence mode="wait" initial={false}>
                {showNewGameForm ? (
                  <motion.form
                    key="new-game-form"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                    onSubmit={handleSubmit}
                    className="space-y-2.5 pt-1"
                  >
                    <div className="flex items-center justify-between px-0.5">
                      <label htmlFor="agent-name" className="text-slate-400 font-mono text-[10px] uppercase tracking-[0.2em]">
                        Nouvelle mission — Identification
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNewGameForm(false)}
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        id="agent-name"
                        type="text"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Entrez votre pseudo"
                        className="flex-1 bg-slate-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-white text-center sm:text-left font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                        maxLength={20}
                      />
                      <button
                        type="submit"
                        className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_18px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        DÉMARRER
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="secondary-actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.14 }}
                    className="flex flex-wrap items-center justify-center sm:justify-between gap-3 px-1 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmClear(false);
                        setShowNewGameForm(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Commencer une nouvelle partie
                    </button>

                    {confirmClear ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmClear(false);
                            onClearSave?.();
                          }}
                          className="inline-flex items-center gap-1 bg-red-600/90 hover:bg-red-500 text-white px-2.5 py-1 rounded-md font-semibold transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Confirmer
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClear(false)}
                          className="text-slate-400 hover:text-white px-1.5 py-1 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmClear(true)}
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Effacer la sauvegarde
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <label htmlFor="agent-name" className="block text-slate-400 font-mono text-[10px] uppercase tracking-[0.22em] text-center sm:text-left">
                Identification de l'agent
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  id="agent-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Entrez votre pseudo"
                  className="flex-1 bg-slate-950/80 border border-white/15 rounded-xl px-4 py-3 text-white text-center sm:text-left font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  maxLength={20}
                />
                <button
                  type="submit"
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm sm:text-base bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_18px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  DÉMARRER LA MISSION
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Quiet Pedagogical / Autosave Footnote */}
        <p className="text-[11px] text-slate-500 text-center leading-relaxed -mt-2">
          Progression sauvegardée automatiquement · Parcours complet ~55–75 min (Lab &amp; bonus inclus)
        </p>
      </div>
    </motion.div>
  );
}
