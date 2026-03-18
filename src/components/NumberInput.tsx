import { Plus, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import { soundManager } from '../utils/soundManager';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export default function NumberInput({ value, onChange, min = 0, max = 9999, step = 1, unit }: NumberInputProps) {
  const increment = () => {
    if (value + step <= max) {
      soundManager.playClick();
      onChange(value + step);
    }
  };

  const decrement = () => {
    if (value - step >= min) {
      soundManager.playClick();
      onChange(value - step);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center bg-slate-900/80 border-2 border-emerald-500/30 rounded-2xl p-2 shadow-[0_0_20px_rgba(16,185,129,0.1)] group hover:border-emerald-500/50 transition-all">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-90"
          aria-label="Diminuer"
        >
          <Minus className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center px-8 min-w-[120px]">
          <motion.span 
            key={value}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold text-emerald-100 tabular-nums"
          >
            {value}
          </motion.span>
          {unit && <span className="text-xs text-emerald-500/60 font-bold uppercase tracking-widest">{unit}</span>}
        </div>

        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-90"
          aria-label="Augmenter"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Decorative elements */}
        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-emerald-500 rounded-tl-sm opacity-50" />
        <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-emerald-500 rounded-tr-sm opacity-50" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-emerald-500 rounded-bl-sm opacity-50" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-emerald-500 rounded-br-sm opacity-50" />
      </div>
    </div>
  );
}
