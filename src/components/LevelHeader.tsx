import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { LEVEL_NAMES, getActForLevel } from '../constants';

interface LevelHeaderProps {
  level: number;
  icon: LucideIcon;
  rightSlot?: React.ReactNode;
  compact?: boolean;
}

const ACT_THEMES: Record<1 | 2 | 3, { iconClass: string; iconBoxClass: string; kickerClass: string }> = {
  1: {
    iconClass: 'text-cyan-300/90',
    iconBoxClass: 'bg-cyan-500/[0.07] border-cyan-400/[0.12]',
    kickerClass: 'text-cyan-300/90',
  },
  2: {
    iconClass: 'text-cyan-300/90',
    iconBoxClass: 'bg-cyan-500/[0.07] border-cyan-400/[0.12]',
    kickerClass: 'text-cyan-300/90',
  },
  3: {
    iconClass: 'text-emerald-300/90',
    iconBoxClass: 'bg-emerald-500/[0.08] border-emerald-400/[0.14]',
    kickerClass: 'text-emerald-300/90',
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
        iconClass: 'text-emerald-300',
        iconBoxClass: 'bg-emerald-500/[0.09] border-emerald-400/[0.16]',
        kickerClass: 'text-emerald-300',
      }
    : ACT_THEMES[act?.id ?? 2];

  const title = LEVEL_NAMES[level] || `Mission ${level}`;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-0.5 ${
        compact ? 'mb-2.5 sm:mb-3' : 'mb-3 sm:mb-3.5'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 ${theme.iconBoxClass}`}
        >
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.iconClass}`} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.16em]">
            <span className={`font-bold ${theme.kickerClass}`}>
              Niveau {level}
            </span>
            {act && (
              <>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="text-slate-400 font-normal normal-case tracking-normal">
                  {isFinalLab ? `${act.label} — Final` : `${act.label} — ${act.title}`}
                </span>
              </>
            )}
          </div>
          <h2
            className={`font-sans font-bold text-white tracking-tight leading-snug ${
              compact ? 'text-lg sm:text-xl md:text-2xl' : 'text-xl sm:text-2xl'
            }`}
          >
            {title}
          </h2>
        </div>
      </div>

      {rightSlot && (
        <div className="flex items-center gap-2 shrink-0">
          {rightSlot}
        </div>
      )}
    </div>
  );
}
