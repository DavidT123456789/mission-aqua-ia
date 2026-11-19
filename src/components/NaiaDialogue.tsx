import React, { useState, useEffect, useMemo, useId, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FastForward, Lightbulb, Target, ChevronDown, AlertCircle, X, AudioLines, Square, Star } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { soundManager } from '../utils/soundManager';
import {
  HINTS,
  FREE_HINT_COST_POINTS,
} from '../constants';
import { useNaiaHints } from './NaiaContext';
import HydraLog, { type HydraLogData } from './HydraLog';
import Collapsible from './Collapsible';
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

function formatSpeechText(raw: string): string {
  return raw
    .replace(/NAÏA/g, 'Naïa')
    .replace(/gCO₂\/kWh/gi, 'grammes de CO2 par kilowattheure')
    .replace(/CO₂/g, 'CO2')
    .replace(/L\/MWh/g, 'litres par mégawattheure')
    .replace(/L\/min/g, 'litres par minute')
    .replace(/L\/s/g, 'litres par seconde')
    .replace(/\b(\d+)\s*mL\b/g, '$1 millilitres')
    .replace(/\b(\d+)\s*ms\b/g, '$1 millisecondes')
    .replace(/\b(\d+)\s*kWh\b/g, '$1 kilowattheures')
    .replace(/\b(\d+)\s*MW\b/g, '$1 mégawatts')
    .replace(/\b(\d+)\s*To\b/g, '$1 téraoctets')
    .replace(/°C/g, ' degrés Celsius')
    .replace(/\bPUE\b/g, 'P U E')
    .replace(/\bDEEE\b/g, 'D 3 E')
    .replace(/\bLLM\b/g, 'L L M')
    .replace(/\bGPU\b/g, 'G P U')
    .replace(/\bCPU\b/g, 'C P U')
    .replace(/\bIoT\b/g, 'I o T')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickFrenchVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  return (
    voices.find((v) => v.lang.toLowerCase() === 'fr-fr' && v.localService) ||
    voices.find((v) => v.lang.toLowerCase() === 'fr-fr') ||
    voices.find((v) => v.lang.toLowerCase().startsWith('fr')) ||
    null
  );
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
  const [visibleCount, setVisibleCount] = useState(0);

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
    dotClass: string;
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
    dotClass: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]',
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
    dotClass: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]',
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
    dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]',
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
    dotClass: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.85)]',
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
                    className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${pal.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${pal.dotClass}`} aria-hidden="true" />
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
                        <span>Lecture en cours · Cliquer pour arrêter</span>
                      </>
                    ) : (
                      <>
                        <AudioLines className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Cliquez sur Naïa pour écouter</span>
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
}

export default function NaiaDialogue({
  message,
  emotion = 'neutral',
  objective,
  objectiveChips,
  hydra,
  reaction,
  onDismissReaction,
  hideHintButton = false
}: NaiaDialogueProps) {
  const hintCtx = useNaiaHints();
  const rootRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const contentKey = useMemo(() => extractNodeText(message), [message]);
  const objectiveText = useMemo(() => (objective ? extractNodeText(objective) : ''), [objective]);
  const reactionKey = useMemo(() => (reaction ? extractNodeText(reaction.message) : ''), [reaction]);

  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const canCollapse = Boolean(objective);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const checkVoices = () => {
      setSpeechAvailable(Boolean(pickFrenchVoice()));
    };
    checkVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', checkVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', checkVoices);
    };
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    stopSpeech();
    return () => stopSpeech();
  }, [contentKey, stopSpeech]);

  useEffect(() => {
    const handleExternalStop = () => stopSpeech();
    window.addEventListener('naiaStopSpeech', handleExternalStop);
    return () => window.removeEventListener('naiaStopSpeech', handleExternalStop);
  }, [stopSpeech]);

  const handleToggleSpeech = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    const fullRaw = [contentKey, objectiveText ? `Objectif : ${objectiveText}` : '']
      .filter(Boolean)
      .join('. ');
    const spoken = formatSpeechText(fullRaw);
    if (!spoken) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spoken);
    const frVoice = pickFrenchVoice();
    if (frVoice) {
      utterance.voice = frVoice;
      utterance.lang = frVoice.lang;
    } else {
      utterance.lang = 'fr-FR';
    }
    utterance.rate = 0.98;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setSkipRequested(true);
    setIsTyping(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

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

  const [skipRequested, setSkipRequested] = useState(() => Boolean(prefersReducedMotion));
  const [isTyping, setIsTyping] = useState(() => !prefersReducedMotion);

  // Re-expand automatically when a new phase/step dialogue arrives so students never miss new instructions
  useEffect(() => {
    setIsCollapsed(false);
    setSkipRequested(Boolean(prefersReducedMotion));
    setIsTyping(!prefersReducedMotion);
  }, [contentKey, prefersReducedMotion]);

  // If objective disappears (e.g. level completed), ensure full dialogue is shown
  useEffect(() => {
    if (!canCollapse && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [canCollapse, isCollapsed]);

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

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSkipRequested(true);
    setIsTyping(false);
    setIsCollapsed((prev) => !prev);
  };

  const levelHint = hintCtx ? HINTS[hintCtx.level] ?? null : null;
  const canShowHintControl = Boolean(hintCtx && levelHint && !hideHintButton);
  const isHintOpen = Boolean(hintCtx?.isHintOpen && canShowHintControl);
  const hasFreeHint = Boolean(hintCtx && hintCtx.unlockedFreeHints.includes(hintCtx.level));

  const effectiveEmotion: NaiaEmotion = isHintOpen
    ? 'thinking'
    : reaction?.emotion ?? emotion;

  const handleToggleHint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hintCtx) return;
    hintCtx.setIsHintOpen(!isHintOpen);
  };

  const bubbleBorderClass =
    effectiveEmotion === 'alert'
      ? 'border-amber-400/30'
      : effectiveEmotion === 'happy'
      ? 'border-emerald-400/25'
      : effectiveEmotion === 'thinking'
      ? 'border-indigo-400/30'
      : 'border-white/[0.09]';

  const renderControls = (compactMode: boolean) => (
    <div className="flex items-center gap-1.5 shrink-0">
      <AnimatePresence initial={false}>
        {!compactMode && isTyping && (
          <motion.button
            key="skip-btn"
            type="button"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.16, ease: EASE_OUT_EXPO } }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
            onClick={handleSkip}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-[11px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Passer l'animation du texte"
          >
            <span>Passer</span>
            <FastForward className="w-2.5 h-2.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {canShowHintControl && hintCtx && (
        <button
          type="button"
          onClick={handleToggleHint}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-medium transition-colors cursor-pointer ${
            isHintOpen
              ? 'bg-emerald-400/15 border-emerald-400/40 text-emerald-200'
              : hasFreeHint
              ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-200 hover:bg-emerald-400/15'
              : 'bg-white/[0.04] border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/[0.09] hover:border-white/20'
          }`}
          aria-expanded={isHintOpen}
          aria-label={isHintOpen ? "Masquer l'indice de NAÏA" : "Afficher l'indice de NAÏA"}
        >
          <Lightbulb className={`w-3 h-3 ${isHintOpen || hasFreeHint ? 'text-emerald-300' : 'text-amber-300/80'}`} />
          <span>Indice</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ease-out ${
              isHintOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {canCollapse && (
        <button
          type="button"
          onClick={handleToggleCollapse}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Afficher le briefing complet de NAÏA' : 'Réduire le briefing (garder uniquement l’objectif)'}
          title={isCollapsed ? 'Déplier le briefing complet' : 'Mode focus : réduire le contexte'}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-medium transition-colors cursor-pointer ${
            compactMode
              ? 'bg-white/[0.08] border-white/15 text-slate-200 hover:text-white hover:bg-white/[0.12]'
              : 'bg-white/[0.04] border-white/[0.1] text-slate-400 hover:text-white hover:bg-white/[0.09] hover:border-white/20'
          }`}
        >
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ease-out ${
              compactMode ? '' : 'rotate-180'
            }`}
          />
          {compactMode ? (
            <span>Briefing</span>
          ) : (
            <span className="hidden sm:inline">Réduire</span>
          )}
        </button>
      )}
    </div>
  );

  const isExpanded = !isCollapsed || !objective;
  const hasInlineControls = Boolean(!objective && (isTyping || canShowHintControl));

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
      className="w-full font-sans scroll-mt-20"
    >
      <div
        className={`relative rounded-2xl bg-slate-950/60 backdrop-blur-xl border ${bubbleBorderClass} shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden transition-colors duration-300`}
      >
        {/* Smoothly Collapsible Full Briefing Body (HYDRA + NAÏA message) */}
        <Collapsible isOpen={isExpanded}>
          {hydra && (
            <HydraLog
              integrated
              status={hydra.status}
              label={hydra.label}
              message={hydra.message}
            />
          )}

          <div
            onClick={() => {
              if (isTyping) {
                setSkipRequested(true);
                setIsTyping(false);
              }
            }}
            className={`px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center gap-3 sm:gap-3.5 ${
              isTyping ? 'cursor-pointer' : ''
            }`}
          >
            <div className="shrink-0">
              <NaiaAvatar
                emotion={effectiveEmotion}
                size="md"
                isSpeaking={isSpeaking}
                onToggleSpeech={speechAvailable ? handleToggleSpeech : undefined}
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
              {/* Main Dialogue Copy — aligned directly opposite Naïa's avatar */}
              <div className="text-[13px] sm:text-sm leading-relaxed text-slate-100/95 font-normal min-w-0 flex-1">
                <div key={contentKey}>
                  <TypewriterNode
                    content={message}
                    contentKey={contentKey}
                    skipRequested={skipRequested}
                    onTypingStateChange={handleTypingStateChange}
                  />
                </div>
              </div>

              {hasInlineControls && (
                <div className="self-end sm:self-center shrink-0">
                  {renderControls(false)}
                </div>
              )}
            </div>
          </div>
        </Collapsible>

        {/* Persistent Objective Strip (permanently hosts action controls on the right + mini-avatar in Focus mode) */}
        {objective && (
          <div
            className={`px-3.5 py-2 sm:px-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 transition-colors duration-200 ${
              isExpanded
                ? 'bg-white/[0.025] border-t border-white/[0.06]'
                : 'bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <AnimatePresence initial={false}>
                {!isExpanded && (
                  <motion.div
                    key="compact-avatar"
                    initial={{ opacity: 0, scale: 0.75, x: -4 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: 0,
                      transition: { duration: 0.22, ease: EASE_OUT_EXPO },
                    }}
                    exit={{ opacity: 0, scale: 0.75, x: -4, transition: { duration: 0.14 } }}
                    className="shrink-0"
                  >
                    <NaiaAvatar
                      emotion={effectiveEmotion}
                      size="xs"
                      isSpeaking={isSpeaking}
                      onToggleSpeech={speechAvailable ? handleToggleSpeech : undefined}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
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
            </div>

            <div className="ml-auto shrink-0">
              {renderControls(!isExpanded)}
            </div>
          </div>
        )}

        {/* Live Reaction Banner (always visible, even in Focus mode) */}
        <Collapsible
          isOpen={Boolean(reaction)}
          role="status"
          aria-live="polite"
        >
          {reaction && (
            <div className="border-t border-amber-500/30 bg-amber-950/50 px-3.5 py-2 sm:px-4 flex items-start gap-2 text-xs sm:text-[13px] text-amber-100 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="flex-1 leading-relaxed">{reaction.message}</span>
              {onDismissReaction && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismissReaction();
                  }}
                  aria-label="Fermer le message d'erreur"
                  className="shrink-0 p-0.5 rounded-md text-amber-300/75 hover:text-amber-100 hover:bg-amber-500/20 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </Collapsible>

        {/* Inline Non-Blocking Single Hint Strip (always accessible, even in Focus mode) */}
        <Collapsible
          isOpen={Boolean(isHintOpen && levelHint && hintCtx)}
          onClick={(e) => e.stopPropagation()}
        >
          {levelHint && hintCtx && (
            <div className="border-t border-emerald-500/25 bg-emerald-950/35 px-3.5 py-2.5 sm:px-4 text-xs sm:text-[13px]">
              <AnimatePresence mode="wait" initial={false}>
                {hasFreeHint ? (
                  <motion.div
                    key="hint-unlocked"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: EASE_OUT_EXPO } }}
                    exit={{ opacity: 0, y: -3, transition: { duration: 0.12 } }}
                    className="flex items-start gap-2 text-slate-100"
                  >
                    <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400 mr-2">
                        Indice :
                      </span>
                      <span>{levelHint}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        hintCtx.setIsHintOpen(false);
                      }}
                      aria-label="Masquer l'indice"
                      className="shrink-0 p-0.5 rounded-md text-emerald-300/75 hover:text-emerald-100 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="hint-locked"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.16 } }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <span className="text-slate-200 flex items-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>Indice de NAÏA (offert automatiquement après une erreur)</span>
                    </span>
                    <button
                      type="button"
                      disabled={hintCtx.score < FREE_HINT_COST_POINTS}
                      onClick={() => hintCtx.useHint()}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-mono text-xs font-bold transition-colors ${
                        hintCtx.score >= FREE_HINT_COST_POINTS
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span>Débloquer (-{FREE_HINT_COST_POINTS}</span>
                      <Star className="w-3 h-3 fill-current shrink-0" />
                      <span>)</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </Collapsible>
      </div>
    </motion.div>
  );
}
