import React, { useState, useEffect, useMemo, useId, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FastForward, Lightbulb, Target, X, AudioLines, Square } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { soundManager } from '../utils/soundManager';
import { naiaSpeech, pickNaiaVoice } from '../utils/naiaSpeech';
import { getLevelHint } from '../constants';
import { useNaiaHints } from './NaiaContext';
import HydraLog, { type HydraLogData } from './HydraLog';
import { EASE_OUT_EXPO, EASE_IN_OUT } from '../utils/motion';

export type NaiaEmotion = 'neutral' | 'alert' | 'happy' | 'thinking';

function extractNodeText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractNodeText).join('');
  if (React.isValidElement<{ children?: React.ReactNode; term?: string }>(node)) {
    if (node.props?.children) return extractNodeText(node.props.children);
    if (typeof node.props?.term === 'string') return node.props.term;
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
  const prefersReducedMotion = useReducedMotion();

  const getLen = (node: React.ReactNode): number => {
    if (typeof node === 'string' || typeof node === 'number') return String(node).length;
    if (Array.isArray(node)) return node.reduce((acc, n) => acc + getLen(n), 0);
    if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
      if (node.props && node.props.children) return getLen(node.props.children);
      return 1;
    }
    return 0;
  };

  const totalLength = useMemo(() => getLen(content), [contentKey]);
  const shouldSkip = skipRequested || Boolean(prefersReducedMotion);
  const [visibleCount, setVisibleCount] = useState(() => (shouldSkip ? totalLength : 0));

  useEffect(() => {
    if (shouldSkip) {
      setVisibleCount(totalLength);
      onTypingStateChange?.(false);
      return;
    }
  }, [shouldSkip, totalLength, onTypingStateChange]);

  useEffect(() => {
    if (shouldSkip) {
      setVisibleCount(totalLength);
      onTypingStateChange?.(false);
      return;
    }

    setVisibleCount(0);
    onTypingStateChange?.(totalLength > 0);
    if (totalLength === 0) return;

    const charsPerSecond = 175;
    let rafId = 0;
    let startTime: number | null = null;
    let lastCount = 0;
    let lastSoundBucket = 0;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsedSec = (now - startTime) / 1000;
      const nextCount = Math.min(totalLength, Math.floor(elapsedSec * charsPerSecond));

      if (nextCount > lastCount) {
        lastCount = nextCount;
        setVisibleCount(nextCount);
        const soundBucket = Math.floor(nextCount / 16);
        if (soundBucket > lastSoundBucket && nextCount < totalLength) {
          lastSoundBucket = soundBucket;
          soundManager.playTyping();
        }
      }

      if (nextCount >= totalLength) {
        setVisibleCount(totalLength);
        onTypingStateChange?.(false);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [contentKey, totalLength, shouldSkip, onTypingStateChange]);

  const renderProgressive = (node: React.ReactNode, counter: { val: number }): React.ReactNode => {
    if (counter.val >= visibleCount) {
      if (typeof node === 'string' || typeof node === 'number') {
        const text = String(node);
        counter.val += text.length;
        return <span className="opacity-0">{text}</span>;
      }
      if (Array.isArray(node)) {
        return node.map((n, i) => <React.Fragment key={i}>{renderProgressive(n, counter)}</React.Fragment>);
      }
      if (React.isValidElement<{ children?: React.ReactNode; className?: string }>(node)) {
        if (node.props && node.props.children) {
          if (node.type === React.Fragment) {
            return <React.Fragment>{renderProgressive(node.props.children, counter)}</React.Fragment>;
          }
          return React.cloneElement(node, { ...node.props, className: `${node.props.className || ''} opacity-0 pointer-events-none`.trim(), children: renderProgressive(node.props.children, counter) });
        }
        counter.val += 1;
        return <span className="opacity-0 pointer-events-none">{node}</span>;
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

    if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
      if (node.props && node.props.children) {
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

const AVATAR_PALETTE: Record<
  NaiaEmotion,
  {
    glow: string;
    dropShadow: string;
    stroke: string;
    eye: string;
    antenna: string;
    badge: string;
    tooltipBorder: string;
    statusLabel: string;
    statusNote: string;
  }
> = {
  neutral: {
    glow: 'bg-cyan-400/30',
    dropShadow: 'drop-shadow-[0_4px_12px_rgba(34,211,238,0.28)]',
    stroke: '#22d3ee',
    eye: '#67e8f9',
    antenna: '#22d3ee',
    badge: 'text-cyan-300 bg-cyan-950/70 border-cyan-500/35',
    tooltipBorder: 'border-cyan-500/35',
    statusLabel: 'En ligne',
    statusNote: "Votre alliée IA : elle vous guide pour empêcher HYDRA de gaspiller l'eau de la ville.",
  },
  alert: {
    glow: 'bg-amber-400/35',
    dropShadow: 'drop-shadow-[0_4px_12px_rgba(245,158,11,0.32)]',
    stroke: '#f59e0b',
    eye: '#fbbf24',
    antenna: '#ef4444',
    badge: 'text-amber-300 bg-amber-950/70 border-amber-500/40',
    tooltipBorder: 'border-amber-500/40',
    statusLabel: 'Attention',
    statusNote: 'Une erreur a été détectée : lisez son message pour corriger le tir.',
  },
  happy: {
    glow: 'bg-emerald-400/30',
    dropShadow: 'drop-shadow-[0_4px_12px_rgba(16,185,129,0.3)]',
    stroke: '#10b981',
    eye: '#34d399',
    antenna: '#34d399',
    badge: 'text-emerald-300 bg-emerald-950/70 border-emerald-500/40',
    tooltipBorder: 'border-emerald-500/40',
    statusLabel: 'Bravo !',
    statusNote: "Étape réussie ! Les réserves d'eau sont protégées sur ce secteur.",
  },
  thinking: {
    glow: 'bg-indigo-400/30',
    dropShadow: 'drop-shadow-[0_4px_12px_rgba(129,140,248,0.3)]',
    stroke: '#818cf8',
    eye: '#a5b4fc',
    antenna: '#c084fc',
    badge: 'text-indigo-300 bg-indigo-950/70 border-indigo-500/40',
    tooltipBorder: 'border-indigo-500/40',
    statusLabel: 'Indice',
    statusNote: "Elle vous partage une piste pour vous aider à résoudre l'énigme.",
  },
};

/**
 * Expressive SVG droplet-bot mascot representing NAÏA, with hover micro-interaction,
 * click-to-speak voice synthesis trigger, and an identity + live status tooltip rendered via portal.
 */
export function NaiaAvatar({
  emotion = 'neutral',
  size = 'md',
  isSpeaking = false,
  onToggleSpeech,
}: {
  emotion?: NaiaEmotion;
  size?: 'xs' | 'sm' | 'md';
  isSpeaking?: boolean;
  onToggleSpeech?: (e: React.MouseEvent | React.KeyboardEvent) => void;
}) {
  const gradId = useId();
  const prefersReducedMotion = useReducedMotion();
  const pal = AVATAR_PALETTE[emotion];
  const dims =
    size === 'xs'
      ? 'w-6 h-8'
      : size === 'sm'
      ? 'w-8 h-11'
      : 'w-9 h-12 sm:w-10 sm:h-13';

  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isOpen = isHovered || isPinned;
  const isActive = isOpen || isSpeaking;

  const avatarRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, arrowLeft: 128, placeBelow: false });

  const updatePosition = useCallback(() => {
    if (!avatarRef.current) return;
    const rect = avatarRef.current.getBoundingClientRect();
    const tooltipWidth = 256; // w-64 = 16rem = 256px
    const halfTooltip = tooltipWidth / 2;

    let targetLeft = rect.left + rect.width / 2;
    let arrowLeft = halfTooltip;

    if (targetLeft + halfTooltip > window.innerWidth - 16) {
      const diff = targetLeft + halfTooltip - (window.innerWidth - 16);
      targetLeft -= diff;
      arrowLeft += diff;
    } else if (targetLeft - halfTooltip < 16) {
      const diff = 16 - (targetLeft - halfTooltip);
      targetLeft += diff;
      arrowLeft -= diff;
    }

    const placeBelow = rect.top < 155;

    setTooltipPos({
      top: (placeBelow ? rect.bottom : rect.top) + window.scrollY,
      left: targetLeft,
      arrowLeft: Math.max(18, Math.min(tooltipWidth - 18, arrowLeft)),
      placeBelow,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isPinned) return;
    const handleOutside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (avatarRef.current?.contains(target) || tooltipRef.current?.contains(target)) return;
      setIsPinned(false);
      setIsHovered(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPinned(false);
        setIsHovered(false);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPinned]);

  const handleActivate = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (onToggleSpeech) {
      onToggleSpeech(e);
      return;
    }
    setIsPinned((prev) => {
      const next = !prev;
      if (!next) setIsHovered(false);
      return next;
    });
  };

  return (
    <div
      ref={avatarRef}
      tabIndex={0}
      role="button"
      aria-expanded={isOpen}
      aria-pressed={onToggleSpeech ? isSpeaking : undefined}
      aria-label={
        onToggleSpeech
          ? isSpeaking
            ? 'NAÏA — Arrêter la lecture vocale'
            : 'NAÏA — Cliquer pour écouter le message'
          : `NAÏA — Votre alliée IA (${pal.statusLabel})`
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleActivate(e);
        }
      }}
      className={`relative ${dims} shrink-0 flex items-center justify-center select-none cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60`}
    >
      <motion.div
        animate={
          prefersReducedMotion
            ? { scale: isActive ? 1.05 : 1 }
            : isOpen
            ? { y: -3, scale: 1.1, rotate: [0, -6, 5, -2, 0] }
            : isSpeaking
            ? { y: [0, -3, 0], scale: [1, 1.05, 1], rotate: 0 }
            : { y: [0, -2.5, 0], scale: 1, rotate: 0 }
        }
        transition={
          isOpen
            ? { duration: 0.42, ease: EASE_OUT_EXPO }
            : isSpeaking
            ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }
        }
        className="w-full h-full relative flex items-center justify-center"
      >
        <div
          className={`absolute inset-x-0.5 inset-y-1.5 rounded-full blur-md transition-all duration-300 pointer-events-none ${pal.glow} ${
            isActive ? 'scale-125 opacity-100' : 'scale-100 opacity-85'
          }`}
        />
        <svg
          viewBox="10 0 44 59"
          className={`w-full h-full relative z-10 overflow-visible transition-[filter] duration-300 ${pal.dropShadow}`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* Antenna */}
          <line x1="32" y1="10" x2="32" y2="4" stroke={pal.stroke} strokeWidth="2" strokeLinecap="round" />
          {isActive && !prefersReducedMotion && (
            <motion.circle
              cx="32"
              cy="4"
              r="2.6"
              fill="none"
              stroke={pal.antenna}
              strokeWidth="1.2"
              initial={{ r: 2.6, opacity: 0.85 }}
              animate={{ r: 8.5, opacity: 0 }}
              transition={{ duration: isSpeaking ? 0.75 : 1, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
          <motion.circle
            cx="32"
            cy="4"
            r="2.6"
            fill={pal.antenna}
            animate={
              isActive || emotion === 'alert'
                ? { opacity: [1, 0.3, 1], scale: [1, 1.35, 1] }
                : { opacity: [0.75, 1, 0.75] }
            }
            transition={{ duration: isActive || emotion === 'alert' ? 0.85 : 2.4, repeat: Infinity }}
          />

          {/* Cyber Water-Drop Silhouette */}
          <path
            d="M32 9 C32 9 50 25 50 38.5 C50 48.7 41.9 56 32 56 C22.1 56 14 48.7 14 38.5 C14 25 32 9 32 9 Z"
            fill={`url(#${gradId})`}
            stroke={pal.stroke}
            strokeWidth={isActive ? '2.5' : '2.2'}
          />

          {/* Specular Water Highlight */}
          <path
            d="M25 19 C22 23 19.5 28 19 33"
            fill="none"
            stroke={isActive ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.22)'}
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Dark Visor */}
          <rect
            x="19"
            y="29"
            width="26"
            height="16"
            rx="7.5"
            fill="#020617"
            stroke={isActive ? 'rgba(103,232,249,0.45)' : 'rgba(148,163,184,0.25)'}
            strokeWidth="1"
          />

          {/* Subtle glowing cheek blushes on hover or while speaking */}
          {isActive && (
            <>
              <ellipse cx="22.8" cy="39.8" rx="1.7" ry="1" fill={pal.eye} opacity="0.38" />
              <ellipse cx="41.2" cy="39.8" rx="1.7" ry="1" fill={pal.eye} opacity="0.38" />
            </>
          )}

          {/* Expressive Eyes & Mouth */}
          {isSpeaking ? (
            <>
              <path d="M23.5 36.2 Q26.5 32.5 29.5 36.2" fill="none" stroke={pal.eye} strokeWidth="2.3" strokeLinecap="round" />
              <path d="M34.5 36.2 Q37.5 32.5 40.5 36.2" fill="none" stroke={pal.eye} strokeWidth="2.3" strokeLinecap="round" />
              <motion.ellipse
                cx="32"
                cy="41.3"
                rx="2.6"
                ry="1.7"
                fill={pal.eye}
                animate={prefersReducedMotion ? { scaleY: 1 } : { scaleY: [0.35, 1.15, 0.45, 0.95, 0.35] }}
                transition={{ duration: 0.45, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '32px 41.3px' }}
              />
            </>
          ) : isOpen && (emotion === 'neutral' || emotion === 'happy') ? (
            <>
              {/* Playful wink & cheerful smile on hover */}
              <path d="M23.5 36.5 Q26.5 32.3 29.5 36.5" fill="none" stroke={pal.eye} strokeWidth="2.4" strokeLinecap="round" />
              <path d="M34.5 35.8 Q37.5 33 40.5 36.2" fill="none" stroke={pal.eye} strokeWidth="2.4" strokeLinecap="round" />
              <path d="M28 40.3 Q32 43.5 36 40.3" fill="none" stroke={pal.eye} strokeWidth="1.9" strokeLinecap="round" />
            </>
          ) : emotion === 'happy' ? (
            <>
              <path d="M23.5 36.5 Q26.5 32.5 29.5 36.5" fill="none" stroke={pal.eye} strokeWidth="2.4" strokeLinecap="round" />
              <path d="M34.5 36.5 Q37.5 32.5 40.5 36.5" fill="none" stroke={pal.eye} strokeWidth="2.4" strokeLinecap="round" />
              <path d="M28.5 40.5 Q32 43.2 35.5 40.5" fill="none" stroke={pal.eye} strokeWidth="1.8" strokeLinecap="round" />
            </>
          ) : emotion === 'alert' ? (
            <>
              <path d="M23 33.5 L29 35.5" stroke={pal.eye} strokeWidth="2" strokeLinecap="round" />
              <path d="M41 33.5 L35 35.5" stroke={pal.eye} strokeWidth="2" strokeLinecap="round" />
              <circle cx="26.5" cy="37.5" r={isOpen ? '2.4' : '2.1'} fill={pal.eye} />
              <circle cx="37.5" cy="37.5" r={isOpen ? '2.4' : '2.1'} fill={pal.eye} />
              <line x1="29" y1="41.8" x2="35" y2="41.8" stroke={pal.eye} strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
            </>
          ) : emotion === 'thinking' ? (
            <>
              <circle cx="26.5" cy="36.5" r="2.4" fill={pal.eye} />
              <ellipse cx="37.5" cy="35.5" rx="2.4" ry={isOpen ? '2.1' : '1.6'} fill={pal.eye} />
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

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={tooltipRef}
                role="tooltip"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: tooltipPos.placeBelow ? tooltipPos.top + 8 : tooltipPos.top - 8,
                  left: tooltipPos.left,
                  zIndex: 999999,
                  pointerEvents: isPinned ? 'auto' : 'none',
                }}
                initial={{
                  opacity: 0,
                  y: tooltipPos.placeBelow ? '-6px' : 'calc(-100% + 6px)',
                  x: '-50%',
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  y: tooltipPos.placeBelow ? '0%' : '-100%',
                  x: '-50%',
                  scale: 1,
                  transition: { duration: 0.18, ease: EASE_OUT_EXPO },
                }}
                exit={{
                  opacity: 0,
                  y: tooltipPos.placeBelow ? '-4px' : 'calc(-100% + 4px)',
                  x: '-50%',
                  scale: 0.96,
                  transition: { duration: 0.12, ease: EASE_IN_OUT },
                }}
                className={`w-64 p-3 bg-slate-900/95 backdrop-blur-xl border ${pal.tooltipBorder} rounded-xl shadow-2xl text-left font-sans normal-case tracking-normal`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    NAÏA
                  </span>
                  <span
                    className={`inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${pal.badge}`}
                  >
                    {pal.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-200/90 leading-snug font-normal">
                  {pal.statusNote}
                </p>

                {onToggleSpeech && (
                  <div className="mt-2 pt-1.5 border-t border-white/[0.08] flex items-center gap-1.5 text-[11px] font-medium text-cyan-300">
                    {isSpeaking ? (
                      <>
                        <Square className="w-2.5 h-2.5 fill-current text-cyan-300 shrink-0" />
                        <span>Lecture en cours · Cliquez pour arrêter</span>
                      </>
                    ) : (
                      <>
                        <AudioLines className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Cliquez sur NAÏA pour écouter</span>
                      </>
                    )}
                  </div>
                )}

                {tooltipPos.placeBelow ? (
                  <>
                    <span
                      className="absolute bottom-full border-[7px] border-transparent border-b-slate-700/80 -translate-x-1/2"
                      style={{ left: `${tooltipPos.arrowLeft}px` }}
                    />
                    <span
                      className="absolute bottom-[calc(100%-1px)] border-[7px] border-transparent border-b-slate-900 -translate-x-1/2"
                      style={{ left: `${tooltipPos.arrowLeft}px` }}
                    />
                  </>
                ) : (
                  <>
                    <span
                      className="absolute top-full border-[7px] border-transparent border-t-slate-700/80 -translate-x-1/2"
                      style={{ left: `${tooltipPos.arrowLeft}px` }}
                    />
                    <span
                      className="absolute top-[calc(100%-1px)] border-[7px] border-transparent border-t-slate-900 -translate-x-1/2"
                      style={{ left: `${tooltipPos.arrowLeft}px` }}
                    />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

interface NaiaDialogueProps {
  message: React.ReactNode;
  emotion?: NaiaEmotion;
  objective?: React.ReactNode;
  objectiveChips?: React.ReactNode;
  hydra?: HydraLogData | null;
  reaction?: { message: React.ReactNode; emotion?: NaiaEmotion } | null;
  onDismissReaction?: () => void;
  hideHintButton?: boolean;
  hintStep?: number;
}

export default function NaiaDialogue({
  message,
  emotion = 'neutral',
  objective,
  objectiveChips,
  hydra,
  reaction,
  onDismissReaction,
  hideHintButton = false,
  hintStep
}: NaiaDialogueProps) {
  const hintCtx = useNaiaHints();
  const rootRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const contentKey = useMemo(() => extractNodeText(message), [message]);
  const objectiveText = useMemo(() => (objective ? extractNodeText(objective) : ''), [objective]);
  const reactionKey = useMemo(() => (reaction ? extractNodeText(reaction.message) : ''), [reaction]);

  const tabPillId = useId();
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [preferBriefing, setPreferBriefing] = useState(false);
  const [hasSeenReaction, setHasSeenReaction] = useState(false);

  const [skipRequested, setSkipRequested] = useState(() => Boolean(prefersReducedMotion));
  const [isTyping, setIsTyping] = useState(() => !prefersReducedMotion);

  const setIsHintOpen = hintCtx?.setIsHintOpen;

  const levelHint = hintCtx ? getLevelHint(hintCtx.level, hintStep) : null;
  const canShowHintControl = Boolean(hintCtx && levelHint && !hideHintButton && emotion !== 'happy');
  const isHintOpen = Boolean(hintCtx?.isHintOpen && canShowHintControl);
  // Progressive help cue: stay calm before the 1st mistake on the current step,
  // then highlight the Indice tab after a mistake to invite consultation.
  const showHintAvailableCue = hasSeenReaction;

  const activeChannel: 'hint' | 'reaction' | 'briefing' = isHintOpen
    ? 'hint'
    : reaction && !preferBriefing
    ? 'reaction'
    : 'briefing';

  const effectiveEmotion: NaiaEmotion =
    emotion === 'happy'
      ? 'happy'
      : activeChannel === 'hint'
      ? 'thinking'
      : activeChannel === 'reaction'
      ? reaction?.emotion ?? 'alert'
      : emotion;

  useEffect(() => {
    setHasSeenReaction(false);
  }, [hintCtx?.level, hintStep]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const checkVoices = () => {
      setSpeechAvailable(Boolean(pickNaiaVoice()));
    };
    checkVoices();
    // Some Chromium builds populate getVoices() asynchronously right after mount
    const retryTimer = setTimeout(checkVoices, 250);
    window.speechSynthesis.addEventListener?.('voiceschanged', checkVoices);
    return () => {
      clearTimeout(retryTimer);
      window.speechSynthesis.removeEventListener?.('voiceschanged', checkVoices);
    };
  }, []);

  const stopSpeech = useCallback(() => {
    naiaSpeech.stop(false);
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    stopSpeech();
    return () => stopSpeech();
  }, [activeChannel, contentKey, reactionKey, levelHint, stopSpeech]);

  useEffect(() => {
    const handleExternalStop = () => setIsSpeaking(false);
    window.addEventListener('naiaStopSpeech', handleExternalStop);
    return () => window.removeEventListener('naiaStopSpeech', handleExternalStop);
  }, []);

  const handleToggleSpeech = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    let blocks: string[] = [];
    if (activeChannel === 'reaction' && reactionKey) {
      blocks = [reactionKey];
    } else if (activeChannel === 'hint' && levelHint) {
      blocks = [`Indice : ${levelHint}`];
    } else {
      blocks = [contentKey, objectiveText ? `Objectif : ${objectiveText}` : ''].filter(Boolean);
    }

    if (!blocks.length) return;

    setSkipRequested(true);
    setIsTyping(false);

    naiaSpeech.speak({
      blocks,
      emotion: effectiveEmotion,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  // When a new reaction arrives, NAÏA immediately interrupts in her dialogue bubble and scrolls into view if needed
  useEffect(() => {
    if (!reactionKey) {
      setPreferBriefing(false);
      return;
    }
    setHasSeenReaction(true);
    setPreferBriefing(false);
    setIsHintOpen?.(false);
    setSkipRequested(true);
    setIsTyping(false);

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
  }, [reactionKey, setIsHintOpen]);

  // Stop typewriter when switching to Hint channel
  useEffect(() => {
    if (isHintOpen) {
      setSkipRequested(true);
      setIsTyping(false);
    }
  }, [isHintOpen]);

  // Reset typewriter when a new phase/step dialogue arrives
  useEffect(() => {
    setPreferBriefing(false);
    setSkipRequested(Boolean(prefersReducedMotion));
    setIsTyping(!prefersReducedMotion);
  }, [contentKey, prefersReducedMotion]);

  useEffect(() => {
    if (emotion === 'happy') {
      setIsHintOpen?.(false);
      setPreferBriefing(false);
    }
  }, [emotion, setIsHintOpen]);

  useEffect(() => {
    if (hintStep !== undefined) {
      setIsHintOpen?.(false);
    }
  }, [hintStep, setIsHintOpen]);

  const handleTypingStateChange = useCallback((typing: boolean) => {
    setIsTyping(typing);
    if (!typing) {
      setSkipRequested(true);
    }
  }, []);

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSkipRequested(true);
    setIsTyping(false);
  };

  const handleSelectBriefing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHintOpen?.(false);
    setPreferBriefing(true);
  };

  const handleSelectReaction = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHintOpen?.(false);
    setPreferBriefing(false);
  };

  const handleSelectHint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hintCtx) return;
    setSkipRequested(true);
    setIsTyping(false);
    hintCtx.setIsHintOpen(true);
  };

  const moodStyles: Record<
    NaiaEmotion,
    {
      bubbleSurface: string;
      tag: string;
      text: string;
    }
  > = {
    neutral: {
      bubbleSurface:
        'bg-gradient-to-br from-cyan-950/60 via-slate-900/75 to-slate-950/80 border-cyan-400/25 shadow-[inset_0_1px_0_rgba(103,232,249,0.12),0_10px_28px_rgba(0,0,0,0.28)]',
      tag: 'text-cyan-300',
      text: 'text-slate-100/95',
    },
    alert: {
      bubbleSurface:
        'bg-gradient-to-br from-amber-950/70 via-slate-900/80 to-slate-950/85 border-amber-400/40 shadow-[inset_0_1px_0_rgba(251,191,36,0.14),0_10px_28px_rgba(0,0,0,0.32)]',
      tag: 'text-amber-300',
      text: 'text-amber-50',
    },
    thinking: {
      bubbleSurface:
        'bg-gradient-to-br from-indigo-950/70 via-slate-900/80 to-slate-950/85 border-indigo-400/40 shadow-[inset_0_1px_0_rgba(129,140,248,0.14),0_10px_28px_rgba(0,0,0,0.3)]',
      tag: 'text-indigo-300',
      text: 'text-indigo-50/95',
    },
    happy: {
      bubbleSurface:
        'bg-gradient-to-br from-emerald-950/60 via-slate-900/75 to-slate-950/80 border-emerald-400/35 shadow-[inset_0_1px_0_rgba(52,211,153,0.14),0_10px_28px_rgba(0,0,0,0.28)]',
      tag: 'text-emerald-300',
      text: 'text-slate-100',
    },
  };

  const currentMood = moodStyles[effectiveEmotion];
  const hasSegmentedControl = Boolean(canShowHintControl || reaction);

  const speakerLabel = hasSegmentedControl
    ? 'NAÏA'
    : emotion === 'happy'
    ? objective
      ? 'NAÏA · Validé'
      : 'NAÏA'
    : emotion === 'alert'
    ? 'NAÏA · Alerte'
    : 'NAÏA';

  const speechMotionKey =
    activeChannel === 'reaction'
      ? `reaction-${reactionKey}`
      : activeChannel === 'hint'
      ? `hint-${hintStep ?? 0}`
      : `briefing-${contentKey}`;

  const pillSpring = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 460, damping: 34 };

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
      className="w-full font-sans scroll-mt-20"
    >
      <div className="flex items-start gap-2.5 sm:gap-3.5">
        {/* Expressive NAÏA Avatar positioned cleanly outside her speech bubble */}
        <motion.div
          key={activeChannel}
          initial={prefersReducedMotion ? false : { scale: 0.94 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
          className="shrink-0 pt-1"
        >
          <NaiaAvatar
            emotion={effectiveEmotion}
            size="md"
            isSpeaking={isSpeaking}
            onToggleSpeech={speechAvailable ? handleToggleSpeech : undefined}
          />
        </motion.div>

        {/* Conversational Companion Speech Bubble */}
        <div
          className={`flex-1 min-w-0 relative rounded-2xl rounded-tl-md backdrop-blur-xl border overflow-hidden transition-colors duration-300 ${currentMood.bubbleSurface}`}
        >
          {hydra && (
            <HydraLog
              integrated
              status={hydra.status}
              label={hydra.label}
              message={hydra.message}
            />
          )}

          {/* Single-Tier Living Speech Row */}
          <div
            onClick={() => {
              if (activeChannel === 'briefing' && isTyping) {
                setSkipRequested(true);
                setIsTyping(false);
              }
            }}
            className={`px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-col gap-1.5 ${
              activeChannel === 'briefing' && isTyping ? 'cursor-pointer' : ''
            }`}
          >
            {/* Speaker Identity + Unified Segmented Channel Control */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center font-mono">
                <span className={`text-[10px] font-bold uppercase tracking-[0.16em] transition-colors duration-300 ${currentMood.tag}`}>
                  {speakerLabel}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <AnimatePresence initial={false}>
                  {activeChannel === 'briefing' && isTyping && (
                    <motion.button
                      key="skip-btn"
                      type="button"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1, transition: { duration: 0.16, ease: EASE_OUT_EXPO } }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
                      onClick={handleSkip}
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-[11px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      aria-label="Passer l'animation du texte"
                    >
                      <span>Passer</span>
                      <FastForward className="w-2.5 h-2.5" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {hasSegmentedControl && (
                  <div
                    role="tablist"
                    aria-label="Canaux de dialogue de NAÏA"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center p-0.5 rounded-full bg-slate-950/75 border border-white/[0.09] gap-0.5"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeChannel === 'briefing'}
                      onClick={handleSelectBriefing}
                      className={`relative px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        activeChannel === 'briefing'
                          ? emotion === 'alert'
                            ? 'text-amber-100'
                            : 'text-cyan-100'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {activeChannel === 'briefing' && (
                        <motion.span
                          layoutId={tabPillId}
                          transition={pillSpring}
                          className={`absolute inset-0 rounded-full border ${
                            emotion === 'alert'
                              ? 'bg-amber-400/15 border-amber-400/35'
                              : 'bg-cyan-400/15 border-cyan-400/35'
                          }`}
                        />
                      )}
                      <span className="relative z-10">Briefing</span>
                    </button>

                    {reaction && (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeChannel === 'reaction'}
                        onClick={handleSelectReaction}
                        className={`relative inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          activeChannel === 'reaction'
                            ? 'text-amber-100'
                            : 'text-amber-300/80 hover:text-amber-200'
                        }`}
                      >
                        {activeChannel === 'reaction' && (
                          <motion.span
                            layoutId={tabPillId}
                            transition={pillSpring}
                            className="absolute inset-0 rounded-full bg-amber-400/20 border border-amber-400/45"
                          />
                        )}
                        <span className="relative z-10">Correction</span>
                      </button>
                    )}

                    {canShowHintControl && hintCtx && (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeChannel === 'hint'}
                        title={
                          showHintAvailableCue
                            ? 'Indice disponible pour cette étape'
                            : "Afficher l'indice de NAÏA"
                        }
                        onClick={handleSelectHint}
                        className={`relative inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          activeChannel === 'hint'
                            ? 'text-indigo-100'
                            : showHintAvailableCue
                            ? 'bg-emerald-500/15 ring-1 ring-inset ring-emerald-400/35 text-emerald-200 hover:bg-emerald-500/25 hover:text-emerald-100'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {activeChannel === 'hint' && (
                          <motion.span
                            layoutId={tabPillId}
                            transition={pillSpring}
                            className="absolute inset-0 rounded-full bg-indigo-400/20 border border-indigo-400/45"
                          />
                        )}
                        <Lightbulb
                          className={`relative z-10 w-3 h-3 shrink-0 ${
                            activeChannel === 'hint'
                              ? 'text-indigo-300'
                              : showHintAvailableCue
                              ? 'text-emerald-300 fill-emerald-400/25'
                              : 'text-slate-400'
                          }`}
                        />
                        <span className="relative z-10">Indice</span>
                      </button>
                    )}
                  </div>
                )}

                {activeChannel === 'reaction' && onDismissReaction && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismissReaction();
                    }}
                    aria-label="Fermer la correction"
                    className="p-0.5 rounded-full text-amber-300/75 hover:text-amber-100 hover:bg-amber-500/20 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Single Living Speech Slot (Briefing / Correction / Hint) */}
            <div
              className={`text-[13px] sm:text-sm leading-relaxed font-normal min-w-0 ${
                hasSegmentedControl ? 'sm:min-h-[2.4rem]' : ''
              } ${currentMood.text}`}
              role={activeChannel === 'reaction' ? 'status' : undefined}
              aria-live={activeChannel === 'reaction' ? 'polite' : undefined}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={speechMotionKey}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.16, ease: EASE_OUT_EXPO } }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: -3, transition: { duration: 0.1 } }}
                >
                  {activeChannel === 'reaction' && reaction ? (
                    <span>{reaction.message}</span>
                  ) : activeChannel === 'hint' && levelHint && hintCtx ? (
                    <span>{levelHint}</span>
                  ) : (
                    <TypewriterNode
                      content={message}
                      contentKey={contentKey}
                      skipRequested={skipRequested}
                      onTypingStateChange={handleTypingStateChange}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Legacy Objective Strip (only rendered if a caller still passes objective directly to NaiaDialogue) */}
          {objective && (
            <div className="px-3.5 py-2 sm:px-4 bg-white/[0.025] border-t border-white/[0.06] flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <div className="flex items-start gap-2 min-w-0 text-xs sm:text-[13px] text-slate-100 font-medium leading-snug">
                <Target className="w-3.5 h-3.5 text-cyan-400/90 shrink-0 mt-0.5" />
                <span>{objective}</span>
              </div>
              {objectiveChips && (
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {objectiveChips}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
