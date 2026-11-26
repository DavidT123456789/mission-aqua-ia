import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Play, RotateCcw, Trash2, Trophy } from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import Collapsible from '../components/Collapsible';
import Briefing from './Briefing';
import { LEVEL_NAMES, MISSION_DURATION_MINUTES } from '../constants';
import { EASE_OUT_EXPO, EASE_IN_OUT } from '../utils/motion';

let hasPlayedAppIntro = false;

export default function Intro({ onStart, hasSavedGame, savedGameInfo, onLoadGame, onClearSave, isMuted, onToggleMute, onBriefingOpenChange }: { 
  onStart: (name: string) => void; 
  hasSavedGame?: boolean;
  savedGameInfo?: {
    level: number;
    score: number;
    elapsedSeconds: number;
    nickname?: string;
    isLockedOut?: boolean;
    isActCheckpointOver?: boolean;
    actCheckpointLabel?: string;
    actCheckpointLevel?: number;
    actCheckpointScore?: number;
  } | null;
  onLoadGame?: () => void;
  onClearSave?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onBriefingOpenChange?: (open: boolean) => void;
  key?: string 
}) {
  const prefersReducedMotion = useReducedMotion();
  const [isInitialLaunch] = useState(() => !hasPlayedAppIntro);
  const [name, setName] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [showNewGameForm, setShowNewGameForm] = useState(false);
  const [briefingAgentName, setBriefingAgentName] = useState<string | null>(null);

  useEffect(() => {
    hasPlayedAppIntro = true;
  }, []);

  useEffect(() => {
    onBriefingOpenChange?.(briefingAgentName !== null);
    return () => onBriefingOpenChange?.(false);
  }, [briefingAgentName, onBriefingOpenChange]);

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
    setBriefingAgentName(name.trim() || 'Agent Anonyme');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence mode="wait">
      {briefingAgentName !== null ? (
        <Briefing
          key="briefing"
          agentName={briefingAgentName}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          onBack={() => setBriefingAgentName(null)}
          onLaunch={() => onStart(briefingAgentName)}
        />
      ) : (
        <motion.div
          key="welcome"
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : isInitialLaunch
              ? { opacity: 0, scale: 0.97, y: 20 }
              : { opacity: 0, scale: 0.985, y: 10 }
          }
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
              duration: prefersReducedMotion ? 0.2 : isInitialLaunch ? 0.56 : 0.3,
              ease: EASE_OUT_EXPO,
            },
          }}
          exit={{ opacity: 0, y: -12, transition: { duration: 0.16, ease: EASE_IN_OUT } }}
          className="relative sm:overflow-hidden sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border p-4 sm:p-8 sm:rounded-2xl max-w-2xl mx-auto backdrop-blur-xl font-sans sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)]"
        >
          {/* Subtle top luminous hairline & atmospheric sheen */}
          <motion.div
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{
              duration: isInitialLaunch ? 0.72 : 0.36,
              delay: isInitialLaunch ? 0.1 : 0.04,
              ease: EASE_OUT_EXPO,
            }}
            className="hidden sm:block absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/55 to-transparent origin-center pointer-events-none"
          />
          <motion.div
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: isInitialLaunch ? 0.85 : 0.35,
              delay: isInitialLaunch ? 0.08 : 0.02,
              ease: 'easeOut',
            }}
            className="hidden sm:block absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.09),transparent_70%)] pointer-events-none"
          />

          <div className="relative z-10 flex flex-col items-center space-y-6">
            {/* Centered Header with Staggered Editorial Reveal */}
            <div className="text-center space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                <motion.span
                  initial={
                    prefersReducedMotion
                      ? false
                      : {
                          opacity: 0,
                          y: isInitialLaunch ? 8 : 4,
                          filter: isInitialLaunch ? 'blur(4px)' : 'blur(0px)',
                        }
                  }
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{
                    duration: isInitialLaunch ? 0.48 : 0.24,
                    delay: isInitialLaunch ? 0.14 : 0.04,
                    ease: EASE_OUT_EXPO,
                  }}
                  className="block font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em] text-cyan-400 mb-1"
                >
                  MISSION
                </motion.span>
                <motion.span
                  initial={
                    prefersReducedMotion
                      ? false
                      : {
                          opacity: 0,
                          y: isInitialLaunch ? 12 : 6,
                          filter: isInitialLaunch ? 'blur(6px)' : 'blur(0px)',
                        }
                  }
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{
                    duration: isInitialLaunch ? 0.54 : 0.26,
                    delay: isInitialLaunch ? 0.22 : 0.07,
                    ease: EASE_OUT_EXPO,
                  }}
                  className="inline-block"
                >
                  AQUA <span className="text-emerald-400">IA</span>
                </motion.span>
              </h1>
              <motion.p
                initial={prefersReducedMotion ? false : { opacity: 0, y: isInitialLaunch ? 8 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: isInitialLaunch ? 0.46 : 0.24,
                  delay: isInitialLaunch ? 0.31 : 0.1,
                  ease: EASE_OUT_EXPO,
                }}
                className="text-xs sm:text-sm text-slate-400"
              >
                Escape game · <span className="font-mono text-slate-300">13 niveaux</span> ·{' '}
                <span
                  className="font-mono text-slate-300"
                  title="Objectif indicatif de 40 min (prolongation libre sans blocage), puis Innovation Lab en temps libre"
                >
                  Objectif {MISSION_DURATION_MINUTES} min
                </span>
              </motion.p>
            </div>

            {/* NAÏA Character Intro Bubble */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: isInitialLaunch ? 12 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: isInitialLaunch ? 0.5 : 0.26,
                delay: isInitialLaunch ? 0.37 : 0.12,
                ease: EASE_OUT_EXPO,
              }}
              className="w-full"
            >
              <NaiaDialogue
                hideHintButton
                emotion="neutral"
                typingDelayMs={isInitialLaunch && !prefersReducedMotion ? 420 : 0}
                message={
                  <>
                    Agent, situation critique. Le réseau central{' '}
                    <strong className="text-rose-300 font-mono">HYDRA</strong> assèche les réserves d'eau de la ville pour refroidir ses serveurs : infiltrez ses systèmes et coupez la surchauffe avant la pénurie. On compte sur vous !
                  </>
                }
              />
            </motion.div>

        {/* Action Section */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: isInitialLaunch ? 12 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: isInitialLaunch ? 0.5 : 0.26,
            delay: isInitialLaunch ? 0.48 : 0.16,
            ease: EASE_OUT_EXPO,
          }}
          className="w-full space-y-3.5"
        >
          {hasSavedGame ? (
            <>
              {/* Priority Resume Card */}
              <div className="w-full rounded-xl bg-cyan-950/35 border border-cyan-500/25 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="min-w-0 text-center sm:text-left space-y-0.5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">
                    {isFinished
                      ? 'Dossier final prêt'
                      : savedGameInfo?.isActCheckpointOver
                      ? 'Point de contrôle disponible'
                      : savedGameInfo?.isLockedOut
                      ? 'Seconde chance disponible'
                      : savedAgentLabel}
                  </div>
                  {savedGameInfo && (
                    <div className="text-sm font-semibold text-white truncate">
                      {isFinished
                        ? `${savedGameInfo.nickname ? `${savedGameInfo.nickname} · ` : ''}${savedGameInfo.score} pts`
                        : savedGameInfo.isActCheckpointOver && savedGameInfo.actCheckpointLevel
                        ? `${savedGameInfo.actCheckpointLabel ? `${savedGameInfo.actCheckpointLabel} · ` : ''}Niveau ${savedGameInfo.actCheckpointLevel}/13 : ${LEVEL_NAMES[savedGameInfo.actCheckpointLevel] || `Mission ${savedGameInfo.actCheckpointLevel}`}`
                        : `Niveau ${savedGameInfo.level}/13 : ${LEVEL_NAMES[savedGameInfo.level] || `Mission ${savedGameInfo.level}`}`}
                    </div>
                  )}
                  {savedGameInfo && (
                    <div className="font-mono text-[11px] text-slate-400">
                      {isFinished
                        ? 'Brevet final & attestation A4 prêts'
                        : savedGameInfo.isActCheckpointOver
                        ? `${savedGameInfo.actCheckpointScore ?? savedGameInfo.score} pts · Reprise au début de l'acte`
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

              {/* Secondary actions & smoothly collapsible New Game form */}
              <Collapsible isOpen={showNewGameForm} innerClassName="pt-1">
                <form onSubmit={handleSubmit} className="space-y-2.5">
                  <div className="flex items-center justify-between px-0.5">
                    <label htmlFor="agent-name" className="text-slate-400 font-mono text-[10px] uppercase tracking-[0.2em]">
                      Nouvelle mission · Identification
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
                </form>
              </Collapsible>

              <Collapsible isOpen={!showNewGameForm}>
                <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 px-1 text-xs">
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

                  <AnimatePresence mode="wait" initial={false}>
                    {confirmClear ? (
                      <motion.div
                        key="confirm-clear"
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0, transition: { duration: 0.16, ease: EASE_OUT_EXPO } }}
                        exit={{ opacity: 0, x: 6, transition: { duration: 0.12 } }}
                        className="flex items-center gap-2"
                      >
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
                      </motion.div>
                    ) : (
                      <motion.button
                        key="trigger-clear"
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.16 } }}
                        exit={{ opacity: 0, transition: { duration: 0.12 } }}
                        onClick={() => setConfirmClear(true)}
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Effacer la sauvegarde
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </Collapsible>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="agent-name" className="sr-only">
                Pseudo de l'agent
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  id="agent-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre pseudo d'agent"
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
        </motion.div>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
