import React from 'react';
import { motion } from 'motion/react';
import { EASE_OUT_EXPO, EASE_IN_OUT } from '../utils/motion';

interface LevelShellProps {
  children: React.ReactNode;
  compact?: boolean;
  wide?: boolean;
  className?: string;
}

export default function LevelShell({ children, compact = false, wide = false, className = '' }: LevelShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.992 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.32, ease: EASE_OUT_EXPO },
      }}
      exit={{
        opacity: 0,
        y: -10,
        scale: 0.992,
        transition: { duration: 0.16, ease: EASE_IN_OUT },
      }}
      className={`sm:bg-slate-900/90 border-transparent sm:border-white/10 sm:border px-0 sm:px-7 ${
        compact ? 'py-2.5 sm:py-4' : 'py-4 sm:py-6'
      } sm:rounded-3xl ${wide ? 'max-w-5xl' : 'max-w-4xl'} mx-auto relative flex flex-col backdrop-blur-xl sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_28px_64px_rgba(0,0,0,0.6)] ${className}`.trim()}
    >
      {children}
    </motion.div>
  );
}
