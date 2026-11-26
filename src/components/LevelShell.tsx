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
      className={`w-full ${wide ? 'max-w-5xl' : 'max-w-4xl'} ${
        compact ? 'py-1.5 sm:py-2.5' : 'py-2 sm:py-3.5'
      } mx-auto relative flex flex-col ${className}`.trim()}
    >
      {children}
    </motion.div>
  );
}
