import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { LEVEL_NAMES, getActForLevel } from '../constants';

interface LevelHeaderProps {
  level: number;
  icon: LucideIcon;
  rightSlot?: React.ReactNode;
  compact?: boolean;
}

const ACT_THEMES: Record<1 | 2 | 3, { iconClass: string; badgeClass: string }> = {
  1: {
    iconClass: 'text-amber-400',
    badgeClass: 'bg-amber-950/60 border-amber-500/35 text-amber-300',
  },
  2: {
    iconClass: 'text-cyan-400',
    badgeClass: 'bg-cyan-950/60 border-cyan-500/35 text-cyan-300',
  },
  3: {
    iconClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-950/60 border-emerald-500/35 text-emerald-300',
  },
};

export default function LevelHeader({
  level,
  icon: Icon,
  rightSlot,
  compact = false,
}: LevelHeaderProps) {
  const act = getActForLevel(level);
  const isFinalLab = level === 13;
  const theme = isFinalLab
    ? {
        iconClass: 'text-yellow-400',
        badgeClass: 'bg-yellow-950/60 border-yellow-500/40 text-yellow-300',
      }
    : ACT_THEMES[act?.id ?? 2];

  const title = LEVEL_NAMES[level] || `Mission ${level}`;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b border-white/10 ${
        compact ? 'mb-2.5 pb-2.5' : 'mb-3 pb-3'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 ${theme.iconClass}`} aria-hidden="true" />
        <h2
          className={`font-mono font-bold text-white uppercase tracking-widest leading-tight ${
            compact ? 'text-lg md:text-2xl' : 'text-lg sm:text-xl md:text-2xl'
          }`}
        >
          Niveau {level} : {title}
        </h2>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {act && (
          <span
            className={`hidden sm:inline-flex items-center font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.badgeClass}`}
          >
            {isFinalLab ? `${act.label} · Final` : `${act.label} · ${act.title}`}
          </span>
        )}
        {rightSlot}
      </div>
    </div>
  );
}
