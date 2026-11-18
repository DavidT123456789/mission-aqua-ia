import { ShieldAlert, Terminal, Cpu } from 'lucide-react';

type HydraStatus = 'hostile' | 'warning' | 'synced';

const STATUS_STYLES: Record<HydraStatus, { container: string; dot: string; tag: string; icon: typeof ShieldAlert; label: string }> = {
  hostile: {
    container: 'bg-slate-950/75 border-y border-r border-white/10 border-l-2 border-l-red-500 text-red-200/90',
    dot: 'bg-red-500 animate-pulse',
    tag: 'text-red-400',
    icon: ShieldAlert,
    label: 'HYDRA // ALERTE'
  },
  warning: {
    container: 'bg-slate-950/75 border-y border-r border-white/10 border-l-2 border-l-amber-400 text-amber-100/90',
    dot: 'bg-amber-400 animate-pulse',
    tag: 'text-amber-400',
    icon: Terminal,
    label: 'HYDRA // SYSTÈME'
  },
  synced: {
    container: 'bg-slate-950/75 border-y border-r border-white/10 border-l-2 border-l-emerald-400 text-emerald-100/90',
    dot: 'bg-emerald-400',
    tag: 'text-emerald-400',
    icon: Cpu,
    label: 'HYDRA // NOYAU'
  }
};

/**
 * Displays a compact intercepted machine log emitted by HYDRA.
 */
export default function HydraLog({ message, status = 'warning', label }: { message: string; status?: HydraStatus; label?: string }) {
  const style = STATUS_STYLES[status];
  const Icon = style.icon;

  return (
    <div className={`w-full rounded-r-lg px-3 py-1.5 flex flex-wrap sm:flex-nowrap items-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs font-mono ${style.container}`}>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden="true" />
        <Icon className={`w-3.5 h-3.5 shrink-0 ${style.tag}`} />
        <span className={`font-bold uppercase tracking-wider ${style.tag}`}>
          [{label || style.label}]
        </span>
      </div>
      <span className="opacity-85 leading-snug">{message}</span>
    </div>
  );
}
