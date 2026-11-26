import { ShieldAlert, Terminal, Cpu } from 'lucide-react';

export type HydraStatus = 'hostile' | 'warning' | 'synced';

export interface HydraLogData {
  message: string;
  status?: HydraStatus;
  label?: string;
}

export const HYDRA_STATUS_STYLES: Record<
  HydraStatus,
  {
    container: string;
    integrated: string;
    dot: string;
    tag: string;
    icon: typeof ShieldAlert;
    label: string;
  }
> = {
  hostile: {
    container: 'bg-slate-950/60 border border-white/[0.08] border-l-2 border-l-rose-400/75 text-slate-300',
    integrated: 'bg-white/[0.02] border-b border-white/[0.06] text-slate-300',
    dot: 'bg-rose-400/90',
    tag: 'text-rose-300/90',
    icon: ShieldAlert,
    label: 'HYDRA · Alerte'
  },
  warning: {
    container: 'bg-slate-950/60 border border-white/[0.08] border-l-2 border-l-amber-400/70 text-slate-300',
    integrated: 'bg-white/[0.02] border-b border-white/[0.06] text-slate-300',
    dot: 'bg-amber-400/85',
    tag: 'text-amber-300/85',
    icon: Terminal,
    label: 'HYDRA · Système'
  },
  synced: {
    container: 'bg-slate-950/60 border border-white/[0.08] border-l-2 border-l-emerald-400/70 text-slate-300',
    integrated: 'bg-white/[0.02] border-b border-white/[0.06] text-slate-300',
    dot: 'bg-emerald-400/85',
    tag: 'text-emerald-300/85',
    icon: Cpu,
    label: 'HYDRA · Noyau'
  }
};

export function normalizeHydraLabel(label: string | undefined, fallback: string): string {
  const raw = (label ?? '').trim();
  if (!raw) return fallback;
  return raw.replace(/\s*\/\/\s*/g, ' · ');
}

/**
 * Displays a compact intercepted machine log emitted by HYDRA.
 * When `integrated` is true, renders as a sleek top telemetry strip inside MissionWorkspace.
 */
export default function HydraLog({
  message,
  status = 'warning',
  label,
  integrated = false,
}: HydraLogData & { integrated?: boolean }) {
  const style = HYDRA_STATUS_STYLES[status];
  const StatusIcon = style.icon;
  const displayLabel = normalizeHydraLabel(label, style.label);

  return (
    <div
      className={`w-full flex flex-wrap sm:flex-nowrap items-center gap-x-2.5 gap-y-0.5 text-[11px] ${
        integrated
          ? `px-3.5 py-2 sm:px-6 ${style.integrated}`
          : `rounded-xl px-3.5 py-2 sm:text-xs ${style.container}`
      }`}
    >
      <div className="flex items-center gap-1.5 shrink-0 font-mono">
        <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${style.tag}`} aria-hidden="true" />
        <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${style.tag}`}>
          {displayLabel}
        </span>
      </div>
      <span className="text-slate-300/85 leading-snug font-sans">{message}</span>
    </div>
  );
}
