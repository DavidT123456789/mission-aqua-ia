import {
  Calculator,
  Gauge,
  Radar,
  Map,
  Clock,
  GitFork,
  Wrench,
  Flame,
  Filter,
  Scale,
  Code2,
  Globe,
  Sparkles,
  Cpu,
  type LucideIcon,
} from 'lucide-react';

export const LEVEL_ICONS: Record<number, LucideIcon> = {
  1: Calculator,
  2: Gauge,
  3: Radar,
  4: Map,
  5: Clock,
  6: GitFork,
  7: Wrench,
  8: Flame,
  9: Filter,
  10: Scale,
  11: Code2,
  12: Globe,
  13: Sparkles,
};

export function getLevelIcon(level: number): LucideIcon {
  return LEVEL_ICONS[level] ?? Cpu;
}
