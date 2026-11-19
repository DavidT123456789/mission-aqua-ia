import React from 'react';
import { motion } from 'motion/react';

interface LevelShellProps {
  children: React.ReactNode;
  compact?: boolean;
  wide?: boolean;
  className?: string;
}

export default function LevelShell({ children, compact = false, wide = false, className = '' }: LevelShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border px-0 sm:px-6 ${
        compact ? 'py-2.5 sm:py-4' : 'py-4 sm:py-6'
      } sm:rounded-2xl ${wide ? 'max-w-5xl' : 'max-w-4xl'} mx-auto relative flex flex-col backdrop-blur-xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_rgba(0,0,0,0.55)] ${className}`.trim()}
    >
      {children}
    </motion.div>
  );
}
