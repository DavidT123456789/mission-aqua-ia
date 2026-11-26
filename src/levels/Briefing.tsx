import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Play,
  Droplets,
  Cpu,
  Clock,
  Heart,
  FastForward,
  Volume2,
  VolumeX,
  Save,
} from 'lucide-react';
import NaiaDialogue from '../components/NaiaDialogue';
import { MISSION_ACTS, MISSION_DURATION_MINUTES } from '../constants';
import { EASE_OUT_EXPO, EASE_IN_OUT } from '../utils/motion';

/**
 * Emplacement prêt pour une future vidéo d'introduction plein écran (16:9).
 * Pour l'activer, déposez par ex. `briefing.mp4` dans `public/` puis renseignez :
 *   export const BRIEFING_VIDEO_URL: string | null = '/briefing.mp4';
 */
export const BRIEFING_VIDEO_URL: string | null = null;
export const BRIEFING_IMAGE_URL = '/chapters/acte-1.jpg';

interface BriefingProps {
  agentName: string;
  onBack: () => void;
  onLaunch: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  videoUrl?: string | null;
  imageUrl?: string;
}

export default function Briefing({
  agentName,
  onBack,
  onLaunch,
  isMuted = false,
  onToggleMute,
  videoUrl = BRIEFING_VIDEO_URL,
  imageUrl = BRIEFING_IMAGE_URL,
}: BriefingProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const trimmedName = agentName.trim();
  const displayAgent =
    !trimmedName || trimmedName.toLowerCase() === 'agent anonyme'
      ? 'Agent'
      : /^agent\b/i.test(trimmedName)
      ? trimmedName
      : `Agent ${trimmedName}`;

  const showVideo = Boolean(videoUrl) && !videoFailed;
  const stageTwoDelay = prefersReducedMotion ? 0 : 0.45;
  const firstAct = MISSION_ACTS[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.28, ease: EASE_OUT_EXPO } }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE_IN_OUT } }}
      className="fixed inset-0 z-[52] bg-slate-950 overflow-y-auto font-sans"
    >
      {/* Full-Bleed Edge-to-Edge Backdrop (Illustration or Video) */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden">
        {showVideo ? (
          <video
            src={videoUrl ?? undefined}
            poster={imageUrl}
            autoPlay
            playsInline
            controls
            onError={() => setVideoFailed(true)}
            className="w-full h-full object-cover bg-black pointer-events-auto"
          >
            Votre navigateur ne supporte pas la lecture vidéo intégrée.
          </video>
        ) : (
          <motion.img
            src={imageUrl}
            alt="Poste de contrôle du réseau hydrique urbain"
            initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.95, ease: EASE_OUT_EXPO }}
            className="w-full h-full object-cover object-[center_42%]"
          />
        )}

        {/* Top subtle vignette for crisp HUD contrast */}
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-slate-950/90 via-slate-950/45 to-transparent" />

        {/* Stage 2 Bottom Scrim: gently darkens the lower zone without veiling the hologram */}
        <motion.div
          initial={{ opacity: 0.45 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: stageTwoDelay, ease: EASE_OUT_EXPO }}
          className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent"
        />
      </div>

      {/* Foreground Diegetic Layer: Full-Width Top Bar + Open Center + Centered Briefing Console */}
      <div className="relative z-10 min-h-full flex flex-col justify-between px-4 sm:px-8 pt-4 sm:pt-6 pb-4 sm:pb-5 max-w-7xl w-full mx-auto">
        {/* Top Diegetic Header */}
        <motion.header
          initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          className="space-y-3.5 sm:space-y-4"
        >
          {/* Row 1: Single-line Utility Rail (Back left | Telemetry + Audio right) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-slate-950/60 hover:bg-slate-900/85 backdrop-blur-md border border-white/10 hover:border-white/25 text-xs font-mono text-slate-300 hover:text-white transition-all shadow-lg cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Modifier le pseudo</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              {/* Slim Telemetry Readout */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-h-8 font-mono text-[11px] sm:text-xs bg-slate-950/65 backdrop-blur-md border border-white/10 rounded-full px-3.5 py-1 shadow-lg">
                <span className="inline-flex items-center gap-1.5 text-rose-300 font-bold tabular-nums">
                  <Cpu className="w-3.5 h-3.5 text-rose-400" />
                  HYDRA 94 °C
                </span>
                <span className="w-px h-3.5 bg-white/15" aria-hidden="true" />
                <span className="inline-flex items-center gap-1.5 text-amber-300 font-bold tabular-nums">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  Eau 32 %
                </span>
                {showVideo && (
                  <>
                    <span className="w-px h-3.5 bg-white/15" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={onLaunch}
                      className="inline-flex items-center gap-1 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      <span>Passer</span>
                      <FastForward className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>

              {/* Integrated Audio Toggle (aligned on the same h-8 baseline, cyan-harmonized) */}
              {onToggleMute && (
                <button
                  type="button"
                  onClick={onToggleMute}
                  aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                  title={isMuted ? 'Activer le son' : 'Couper le son'}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md border transition-all shadow-lg cursor-pointer shrink-0 ${
                    isMuted
                      ? 'bg-red-950/65 border-red-400/45 text-red-300 hover:bg-red-900/70 hover:shadow-[0_0_12px_rgba(239,68,68,0.28)]'
                      : 'bg-slate-950/65 border-cyan-400/30 text-cyan-300 hover:bg-cyan-950/60 hover:border-cyan-400/60 hover:shadow-[0_0_12px_rgba(34,211,238,0.28)]'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Narrative Chapter Title + Act Metadata */}
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">
              <span>{firstAct.label}</span>
              <span className="text-slate-500" aria-hidden="true">·</span>
              <span className="text-slate-300/85 font-normal tracking-wider normal-case">
                Niveaux {firstAct.startLevel} à {firstAct.endLevel}
              </span>
              <span className="text-slate-500" aria-hidden="true">·</span>
              <span className="text-cyan-200/90 font-semibold tracking-wider normal-case">
                Briefing
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
              {firstAct.title}
            </h1>
          </div>
        </motion.header>

        {/* Breathing Room — keeps the panoramic scene and hologram table unobstructed */}
        <div className="flex-1 min-h-[160px] sm:min-h-[220px]" aria-hidden="true" />

        {/* Stage 2: Centered Bottom Briefing Console + Action Row */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.46, delay: stageTwoDelay, ease: EASE_OUT_EXPO }}
          className="space-y-2.5 max-w-4xl w-full mx-auto"
        >
          <NaiaDialogue
            hideHintButton
            emotion="neutral"
            message={
              <>
                Merci d'être là, <strong className="text-cyan-300">{displayAgent}</strong>. La surchauffe d'
                <strong className="text-rose-300 font-mono">HYDRA</strong> s'aggrave : des fuites sur le réseau et des calculs superflus vident déjà les réserves potables. Vous avez{' '}
                <strong className="text-white">{MISSION_DURATION_MINUTES} minutes</strong> et 3 actes pour couper l'hémorragie et rendre son IA sobre. Notez vos réponses dans votre cahier : chaque erreur coûte une vie !
              </>
            }
          />

          {/* Compact Single-Row Action Bar: Readable Mission Rules Pill + Primary Sci-Fi CTA */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="inline-flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 px-3.5 py-2 rounded-xl bg-slate-950/60 backdrop-blur-md border border-white/10 text-xs font-mono text-slate-200/90 shadow-lg">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Objectif {MISSION_DURATION_MINUTES} min</span>
              </span>
              <span className="w-px h-3 bg-white/15" aria-hidden="true" />
              <span className="inline-flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>3 vies</span>
              </span>
              <span className="w-px h-3 bg-white/15" aria-hidden="true" />
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Save className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Sauvegarde auto</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onLaunch}
              className="shrink-0 w-full md:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-black text-sm sm:text-[15px] tracking-wide bg-gradient-to-r from-emerald-400/85 via-teal-400/85 to-cyan-400/85 hover:from-emerald-400/95 hover:via-teal-400/95 hover:to-cyan-400/95 text-slate-950 border border-cyan-200/35 hover:border-cyan-200/45 transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_8px_22px_rgba(6,182,212,0.15)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_8px_24px_rgba(20,184,166,0.26)] active:scale-[0.985] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>LANCER L'INFILTRATION</span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
