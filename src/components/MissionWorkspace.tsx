import React from 'react';
import { Target } from 'lucide-react';
import HydraLog, { type HydraLogData } from './HydraLog';

interface MissionWorkspaceProps {
  children: React.ReactNode;
  hydra?: HydraLogData | null;
  objective?: React.ReactNode;
  objectiveChips?: React.ReactNode;
  compact?: boolean;
  className?: string;
  bodyClassName?: string;
}

/**
 * Structured technical workstation card for an active level exercise.
 * Visually separates the machine/task context (HYDRA telemetry, persistent objective,
 * and interactive controls) from NAÏA's floating companion dialogue above it.
 */
export default function MissionWorkspace({
  children,
  hydra,
  objective,
  objectiveChips,
  compact = false,
  className = '',
  bodyClassName = '',
}: MissionWorkspaceProps) {
  const hasMissionHeader = Boolean(hydra || objective);

  return (
    <section
      aria-label="Poste de travail de la mission"
      className={`w-full bg-slate-900/90 border border-white/[0.1] rounded-2xl sm:rounded-3xl backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_28px_64px_rgba(0,0,0,0.58)] overflow-hidden ${className}`.trim()}
    >
      {hasMissionHeader && (
        <div className="bg-slate-950/55 border-b border-white/[0.07]">
          {hydra && (
            <HydraLog
              integrated
              status={hydra.status}
              label={hydra.label}
              message={hydra.message}
            />
          )}

          {objective && (
            <div
              className={`${
                compact ? 'px-3.5 py-2.5 sm:px-6 sm:py-2.5' : 'px-3.5 py-2.5 sm:px-6 sm:py-3'
              } flex flex-wrap items-center gap-x-3 gap-y-2 ${
                hydra ? 'border-t border-white/[0.06]' : ''
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1 text-xs sm:text-[13.5px] text-slate-100 font-medium leading-snug">
                <Target
                  className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
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
      )}

      <div
        className={`${
          compact
            ? 'px-3.5 py-3.5 sm:px-6 sm:py-4'
            : 'px-3.5 py-4 sm:px-6 sm:py-5'
        } ${bodyClassName}`.trim()}
      >
        {children}
      </div>
    </section>
  );
}
