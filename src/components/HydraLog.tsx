import { ShieldAlert, Terminal, Cpu } from 'lucide-react';

type HydraStatus = 'hostile' | 'warning' | 'synced';

const STATUS_STYLES: Record<HydraStatus, { container: string; tag: string; icon: typeof ShieldAlert; label: string }> = {
  hostile: {
    container: 'bg-red-950/35 border-red-500/40 text-red-200',
    tag: 'text-red-400',
    icon: ShieldAlert,
    label: 'HYDRA // ALERTE'
  },
  warning: {
    container: 'bg-amber-950/35 border-amber-500/40 text-amber-200',
    tag: 'text-amber-400',
    icon: Terminal,
    label: 'HYDRA // SYSTÈME'
  },
  synced: {
    container: 'bg-emerald-950/35 border-emerald-500/40 text-emerald-200',
    tag: 'text-emerald-400',
    icon: Cpu,
    label: 'HYDRA // NOYAU'
  }
};

/**
 * Displays a compact one-line system status log emitted by HYDRA.
 */
export default function HydraLog({ message, status = 'warning', label }: { message: string; status?: HydraStatus; label?: string }) {
  const style = STATUS_STYLES[status];
  const Icon = style.icon;

  return (
    <div className={`w-full rounded-lg border px-3 py-2 flex flex-wrap sm:flex-nowrap items-center gap-x-2.5 gap-y-1 text-xs font-mono ${style.container}`}>
      <div className="flex items-center gap-2 shrink-0">
        <Icon className={`w-4 h-4 shrink-0 ${style.tag}`} />
        <span className={`font-bold uppercase tracking-wider ${style.tag}`}>
          [{label || style.label}]
        </span>
      </div>
      <span className="opacity-90">{message}</span>
    </div>
  );
}
