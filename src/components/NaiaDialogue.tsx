import React, { useState, useEffect, useMemo, useId, useRef } from 'react';
import { FastForward, Lightbulb, Sparkles, Target, ChevronUp, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../utils/soundManager';
import { HINTS } from '../constants';
import { useNaiaHints } from './NaiaContext';

export type NaiaEmotion = 'neutral' | 'alert' | 'happy' | 'thinking';

function extractNodeText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractNodeText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node) && node.props?.children) {
    return extractNodeText(node.props.children);
  }
  return '';
}

function TypewriterNode({
  content,
  contentKey,
  skipRequested,
  onTypingStateChange
}: {
  content: React.ReactNode;
  contentKey: string;
  skipRequested: boolean;
  onTypingStateChange?: (isTyping: boolean) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(0);

  const getLen = (node: any): number => {
    if (typeof node === 'string' || typeof node === 'number') return String(node).length;
    if (Array.isArray(node)) return node.reduce((acc, n) => acc + getLen(n), 0);
    if (React.isValidElement(node)) {
      // @ts-ignore
      if (node.props && node.props.children) return getLen(node.props.children);
      return 1;
    }
    return 0;
  };

  const totalLength = useMemo(() => getLen(content), [contentKey]);

  useEffect(() => {
    if (skipRequested) {
      setVisibleCount(totalLength);
      onTypingStateChange?.(false);
      return;
    }
  }, [skipRequested, totalLength, onTypingStateChange]);

  useEffect(() => {
    if (skipRequested) {
      setVisibleCount(totalLength);
      onTypingStateChange?.(false);
      return;
    }

    setVisibleCount(0);
    onTypingStateChange?.(totalLength > 0);
    let current = 0;
    const interval = setInterval(() => {
      current += 4;
      if (current >= totalLength) {
        setVisibleCount(totalLength);
        onTypingStateChange?.(false);
        clearInterval(interval);
      } else {
        setVisibleCount(current);
        if (current % 8 === 0) {
          soundManager.playTyping();
        }
      }
    }, 12);
    return () => clearInterval(interval);
  }, [contentKey, totalLength, skipRequested, onTypingStateChange]);

  const renderProgressive = (node: any, counter: { val: number }): React.ReactNode => {
    if (counter.val >= visibleCount) {
      if (typeof node === 'string' || typeof node === 'number') {
        const text = String(node);
        counter.val += text.length;
        return <span className="opacity-0">{text}</span>;
      }
      if (Array.isArray(node)) {
        return node.map((n, i) => <React.Fragment key={i}>{renderProgressive(n, counter)}</React.Fragment>);
      }
      if (React.isValidElement(node)) {
        // @ts-ignore
        if (node.props && node.props.children) {
          if (node.type === React.Fragment) {
            // @ts-ignore
            return <React.Fragment>{renderProgressive(node.props.children, counter)}</React.Fragment>;
          }
          // @ts-ignore
          return React.cloneElement(node, { ...node.props, className: `${node.props.className || ''} opacity-0`.trim(), children: renderProgressive(node.props.children, counter) });
        }
        counter.val += 1;
        return <span className="opacity-0">{node}</span>;
      }
      return null;
    }

    if (typeof node === 'string' || typeof node === 'number') {
      const text = String(node);
      if (counter.val + text.length <= visibleCount) {
        counter.val += text.length;
        return text;
      } else {
        const diff = visibleCount - counter.val;
        counter.val += text.length;
        return (
          <>
            {text.slice(0, diff)}
            <span className="opacity-0">{text.slice(diff)}</span>
          </>
        );
      }
    }

    if (Array.isArray(node)) {
      return node.map((n, i) => <React.Fragment key={i}>{renderProgressive(n, counter)}</React.Fragment>);
    }

    if (React.isValidElement(node)) {
      // @ts-ignore
      if (node.props && node.props.children) {
        // @ts-ignore
        return React.cloneElement(node, { ...node.props, children: renderProgressive(node.props.children, counter) });
      }
      counter.val += 1;
      return node;
    }

    return node;
  };

  const counter = { val: 0 };
  return <span className="inline">{renderProgressive(content, counter)}</span>;
}

const AVATAR_PALETTE: Record<NaiaEmotion, { glow: string; stroke: string; eye: string; antenna: string; badge: string; label?: string }> = {
  neutral: {
    glow: 'bg-cyan-500/20',
    stroke: '#22d3ee',
    eye: '#67e8f9',
    antenna: '#22d3ee',
    badge: 'text-cyan-300 bg-cyan-950/60 border-cyan-500/30'
  },
  alert: {
    glow: 'bg-amber-500/25',
    stroke: '#f59e0b',
    eye: '#fbbf24',
    antenna: '#ef4444',
    badge: 'text-amber-300 bg-amber-950/60 border-amber-500/35',
    label: 'Alerte'
  },
  happy: {
    glow: 'bg-emerald-500/25',
    stroke: '#10b981',
    eye: '#34d399',
    antenna: '#34d399',
    badge: 'text-emerald-300 bg-emerald-950/60 border-emerald-500/35',
    label: 'Synchronisée'
  },
  thinking: {
    glow: 'bg-indigo-500/25',
    stroke: '#818cf8',
    eye: '#a5b4fc',
    antenna: '#c084fc',
    badge: 'text-indigo-300 bg-indigo-950/60 border-indigo-500/35',
    label: 'Analyse'
  }
};

/**
 * Expressive SVG droplet-bot mascot representing NAÏA.
 */
export function NaiaAvatar({ emotion = 'neutral', size = 'md' }: { emotion?: NaiaEmotion; size?: 'sm' | 'md' }) {
  const gradId = useId();
  const pal = AVATAR_PALETTE[emotion];
  const dims = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12 sm:w-14 sm:h-14';

  return (
    <motion.div
      animate={{ y: [0, -2.5, 0] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${dims} shrink-0 flex items-center justify-center select-none`}
      aria-hidden="true"
    >
      <div className={`absolute inset-1 rounded-full blur-md transition-colors duration-300 ${pal.glow}`} />
      <svg viewBox="0 0 64 64" className="w-full h-full relative z-10 drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Antenna */}
        <line x1="32" y1="10" x2="32" y2="4" stroke={pal.stroke} strokeWidth="2" strokeLinecap="round" />
        <motion.circle
          cx="32"
          cy="4"
          r="2.6"
          fill={pal.antenna}
          animate={emotion === 'alert' ? { opacity: [1, 0.25, 1], scale: [1, 1.3, 1] } : { opacity: [0.75, 1, 0.75] }}
          transition={{ duration: emotion === 'alert' ? 0.9 : 2.4, repeat: Infinity }}
        />

        {/* Cyber Water-Drop Silhouette */}
        <path
          d="M32 9 C32 9 50 25 50 38.5 C50 48.7 41.9 56 32 56 C22.1 56 14 48.7 14 38.5 C14 25 32 9 32 9 Z"
          fill={`url(#${gradId})`}
          stroke={pal.stroke}
          strokeWidth="2.2"
        />

        {/* Specular Water Highlight */}
        <path
          d="M25 19 C22 23 19.5 28 19 33"
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Dark Visor */}
        <rect x="19" y="29" width="26" height="16" rx="7.5" fill="#020617" stroke="rgba(148,163,184,0.25)" strokeWidth="1" />

        {/* Expressive Eyes & Mouth */}
        {emotion === 'happy' ? (
          <>
            <path d="M23.5 36.5 Q26.5 32.5 29.5 36.5" fill="none" stroke={pal.eye} strokeWidth="2.4" strokeLinecap="round" />
            <path d="M34.5 36.5 Q37.5 32.5 40.5 36.5" fill="none" stroke={pal.eye} strokeWidth="2.4" strokeLinecap="round" />
            <path d="M28.5 40.5 Q32 43.2 35.5 40.5" fill="none" stroke={pal.eye} strokeWidth="1.8" strokeLinecap="round" />
          </>
        ) : emotion === 'alert' ? (
          <>
            <path d="M23 33.5 L29 35.5" stroke={pal.eye} strokeWidth="2" strokeLinecap="round" />
            <path d="M41 33.5 L35 35.5" stroke={pal.eye} strokeWidth="2" strokeLinecap="round" />
            <circle cx="26.5" cy="37.5" r="2.1" fill={pal.eye} />
            <circle cx="37.5" cy="37.5" r="2.1" fill={pal.eye} />
            <line x1="29" y1="41.8" x2="35" y2="41.8" stroke={pal.eye} strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
          </>
        ) : emotion === 'thinking' ? (
          <>
            <circle cx="26.5" cy="36.5" r="2.4" fill={pal.eye} />
            <ellipse cx="37.5" cy="35.5" rx="2.4" ry="1.6" fill={pal.eye} />
            <circle cx="34.5" cy="41.5" r="1.2" fill={pal.eye} opacity="0.85" />
          </>
        ) : (
          <>
            <motion.ellipse
              cx="26.5"
              cy="36.5"
              rx="2.3"
              ry="2.8"
              fill={pal.eye}
              animate={{ scaleY: [1, 1, 0.12, 1] }}
              transition={{ duration: 4.5, times: [0, 0.92, 0.96, 1], repeat: Infinity }}
              style={{ transformOrigin: '26.5px 36.5px' }}
            />
            <motion.ellipse
              cx="37.5"
              cy="36.5"
              rx="2.3"
              ry="2.8"
              fill={pal.eye}
              animate={{ scaleY: [1, 1, 0.12, 1] }}
              transition={{ duration: 4.5, times: [0, 0.92, 0.96, 1], repeat: Infinity }}
              style={{ transformOrigin: '37.5px 36.5px' }}
            />
            <path d="M29 41 Q32 42.6 35 41" fill="none" stroke={pal.eye} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          </>
        )}
      </svg>
    </motion.div>
  );
}

interface NaiaDialogueProps {
  message: React.ReactNode;
  emotion?: NaiaEmotion;
  objective?: React.ReactNode;
  reaction?: { message: React.ReactNode; emotion?: NaiaEmotion } | null;
  onDismissReaction?: () => void;
  hideHintButton?: boolean;
}

export default function NaiaDialogue({
  message,
  emotion = 'neutral',
  objective,
  reaction,
  onDismissReaction,
  hideHintButton = false
}: NaiaDialogueProps) {
  const hintCtx = useNaiaHints();
  const rootRef = useRef<HTMLDivElement>(null);

  const contentKey = useMemo(() => extractNodeText(message), [message]);
  const reactionKey = useMemo(() => (reaction ? extractNodeText(reaction.message) : ''), [reaction]);

  useEffect(() => {
    if (!reactionKey) return;
    const rafId = requestAnimationFrame(() => {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const headerBottom = document.querySelector('header')?.getBoundingClientRect().bottom ?? 64;
      if (rect.top < headerBottom || rect.bottom > window.innerHeight) {
        const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'nearest' });
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [reactionKey]);

  const [skipRequested, setSkipRequested] = useState(false);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setSkipRequested(false);
    setIsTyping(true);
  }, [contentKey]);

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSkipRequested(true);
    setIsTyping(false);
  };

  const levelHint = hintCtx && hintCtx.level >= 1 && hintCtx.level <= 13 ? HINTS[hintCtx.level] : null;
  const canShowHintControl = Boolean(hintCtx && levelHint && !hideHintButton);
  const isHintOpen = Boolean(hintCtx?.isHintOpen && canShowHintControl);
  const hasFreeHint = Boolean(hintCtx && hintCtx.unlockedFreeHints.includes(hintCtx.level));
  const hasPaidHint = Boolean(hintCtx && hintCtx.unlockedPaidHints.includes(hintCtx.level));

  const effectiveEmotion: NaiaEmotion = isHintOpen
    ? 'thinking'
    : reaction?.emotion ?? emotion;

  const pal = AVATAR_PALETTE[effectiveEmotion];

  const handleToggleHint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hintCtx) return;
    hintCtx.setIsHintOpen(!isHintOpen);
  };

  // Seamless solid bubble background prevents double-opacity seam on the SVG tail
  const bubbleBorderClass =
    effectiveEmotion === 'alert'
      ? 'border-amber-500/35'
      : effectiveEmotion === 'happy'
      ? 'border-emerald-500/35'
      : effectiveEmotion === 'thinking'
      ? 'border-indigo-400/35'
      : 'border-cyan-500/25';

  const tailStrokeColor =
    effectiveEmotion === 'alert'
      ? 'rgba(245, 158, 11, 0.35)'
      : effectiveEmotion === 'happy'
      ? 'rgba(16, 185, 129, 0.35)'
      : effectiveEmotion === 'thinking'
      ? 'rgba(129, 140, 248, 0.35)'
      : 'rgba(6, 182, 212, 0.25)';

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
      className="flex items-start gap-3 sm:gap-4 w-full font-sans scroll-mt-20"
    >
      {/* Left: Expressive NAÏA Character */}
      <div className="pt-0.5 shrink-0">
        <NaiaAvatar emotion={effectiveEmotion} />
      </div>

      {/* Right: Speech Bubble */}
      <div
        onClick={() => {
          if (isTyping) {
            setSkipRequested(true);
            setIsTyping(false);
          }
        }}
        className={`relative flex-1 rounded-2xl bg-[#111c30] border ${bubbleBorderClass} px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-[0_8px_24px_rgba(2,6,23,0.45)] transition-colors duration-300 ${
          isTyping ? 'cursor-pointer' : ''
        }`}
      >
        {/* Seamless Speech Bubble Tail */}
        <svg
          viewBox="0 0 10 16"
          className="absolute -left-[9px] top-4 w-[10px] h-4 pointer-events-none"
          aria-hidden="true"
        >
          <path d="M10 0 L0 8 L10 16 Z" fill="#111c30" />
          <path d="M10 0.5 L0.8 8 L10 15.5" fill="none" stroke={tailStrokeColor} strokeWidth="1.2" />
        </svg>

        {/* Compact Header */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
              NAÏA
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
              Assistante tactique
            </span>
            {pal.label && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${pal.badge}`}>
                {pal.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isTyping && (
              <button
                type="button"
                onClick={handleSkip}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-[10px] font-semibold uppercase tracking-wider text-slate-300 hover:text-white hover:shadow-[0_0_10px_rgba(148,163,184,0.2)] transition-all"
                aria-label="Passer l'animation du texte"
              >
                <span>Passer</span>
                <FastForward className="w-2.5 h-2.5" />
              </button>
            )}

            {canShowHintControl && hintCtx && (
              <button
                type="button"
                onClick={handleToggleHint}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold transition-all ${
                  isHintOpen
                    ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-200 hover:shadow-[0_0_12px_rgba(129,140,248,0.25)]'
                    : hasFreeHint
                    ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300 hover:bg-emerald-500/25 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'bg-slate-900/80 border-amber-500/30 text-amber-300 hover:bg-amber-950/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                }`}
                aria-expanded={isHintOpen}
                aria-label={isHintOpen ? "Masquer les indices de NAÏA" : "Afficher les indices de NAÏA"}
              >
                {isHintOpen ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Masquer</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-3 h-3" />
                    <span>Indice</span>
                    {hasFreeHint && (
                      <span className="font-mono text-[10px] opacity-85">
                        · Libre
                      </span>
                    )}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Main Dialogue Copy (crisp font-sans, non-italic) */}
        <div className="text-[13px] sm:text-sm leading-relaxed text-slate-100/95 font-normal">
          <div key={contentKey}>
            <TypewriterNode
              content={message}
              contentKey={contentKey}
              skipRequested={skipRequested}
              onTypingStateChange={setIsTyping}
            />
          </div>
        </div>

        {/* Optional Concise Objective Line */}
        {objective && (
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-start gap-2 text-xs sm:text-[13px] text-cyan-200 font-medium leading-snug">
            <Target className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>{objective}</span>
          </div>
        )}

        {/* Live Reaction Banner (e.g. error feedback spoken by NAÏA) */}
        <AnimatePresence>
          {reaction && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2.5 rounded-xl bg-amber-950/55 border border-amber-500/40 px-3 py-2 flex items-start gap-2 text-xs sm:text-[13px] text-amber-100 font-medium"
            >
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                <span className="leading-relaxed">{reaction.message}</span>
                {reaction.emotion === 'alert' && canShowHintControl && hasFreeHint && !isHintOpen && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      hintCtx?.setIsHintOpen(true);
                    }}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-[11px] font-semibold text-emerald-200 transition-colors cursor-pointer"
                  >
                    <Lightbulb className="w-3 h-3" />
                    <span>Voir l'indice</span>
                  </button>
                )}
              </div>
              {onDismissReaction && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismissReaction();
                  }}
                  aria-label="Fermer le message d'erreur"
                  className="shrink-0 p-0.5 rounded-md text-amber-300/75 hover:text-amber-100 hover:bg-amber-500/20 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline Non-Blocking Hint Drawer */}
        <AnimatePresence>
          {isHintOpen && levelHint && hintCtx && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mt-2.5 pt-2.5 border-t border-indigo-400/20 space-y-2 text-xs sm:text-[13px]">
                {hasFreeHint ? (
                  <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-2.5 text-slate-200 leading-relaxed">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                      Indice de NAÏA
                    </span>
                    {levelHint.free}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/70 border border-slate-700/80 p-2.5">
                    <span className="text-slate-300">
                      {levelHint.noMistakeUnlock ? 'Conseil de NAÏA' : 'Indice de NAÏA (offert après une erreur)'}
                    </span>
                    <button
                      type="button"
                      disabled={hintCtx.score < 10}
                      onClick={() => hintCtx.useHint('free')}
                      className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-colors ${
                        hintCtx.score >= 10
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Débloquer (-10 ★)
                    </button>
                  </div>
                )}

                {Boolean(levelHint.paid) && (hasFreeHint || hasPaidHint) && (
                  hasPaidHint ? (
                    <div className="rounded-xl bg-amber-950/35 border border-amber-500/30 p-2.5 text-slate-200 leading-relaxed">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                        Coup de pouce avancé
                      </span>
                      {levelHint.paid}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/70 border border-slate-700/80 p-2">
                      <span className="text-slate-400 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Besoin de la piste précise ?
                      </span>
                      <button
                        type="button"
                        disabled={hintCtx.score < 100}
                        onClick={() => hintCtx.useHint('paid')}
                        className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-colors ${
                          hintCtx.score >= 100
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Indice avancé (-100 ★)
                      </button>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
