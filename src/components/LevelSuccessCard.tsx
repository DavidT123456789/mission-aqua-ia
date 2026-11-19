import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, type LucideIcon } from 'lucide-react';
import ActionButton from './ActionButton';
import { EASE_OUT_EXPO, EASE_IN_OUT, SPRING_SNAPPY } from '../utils/motion';

interface LevelSuccessCardProps {
  title: React.ReactNode;
  description: React.ReactNode;
  onContinue: () => void;
  buttonLabel?: string;
  icon?: LucideIcon;
  extra?: React.ReactNode;
  compact?: boolean;
  fullWidthButton?: boolean;
  className?: string;
}

export default function LevelSuccessCard({
  title,
  description,
  onContinue,
  buttonLabel = 'PASSER AU NIVEAU SUIVANT',
  icon: Icon = CheckCircle2,
  extra,
  compact = false,
  fullWidthButton = false,
  className = '',
}: LevelSuccessCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.3, ease: EASE_OUT_EXPO },
      }}
      exit={{
        opacity: 0,
        y: 8,
        scale: 0.985,
        transition: { duration: 0.16, ease: EASE_IN_OUT },
      }}
      className={`relative overflow-hidden flex flex-col items-center bg-slate-950/60 backdrop-blur-md border border-emerald-400/25 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${
        compact ? 'mt-4 p-5' : 'mt-5 p-5 sm:p-6'
      } ${className}`.trim()}
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" aria-hidden="true" />
      <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-base sm:text-lg mb-2 text-center text-balance tracking-tight">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...SPRING_SNAPPY, delay: 0.06 }}
          className="inline-flex shrink-0"
          aria-hidden="true"
        >
          <Icon className="w-5 h-5 text-emerald-400" />
        </motion.span>
        <span>{title}</span>
      </div>

      <p className={`text-center text-sm text-slate-200/90 leading-relaxed max-w-2xl text-balance ${extra ? 'mb-4' : 'mb-5'}`}>
        {description}
      </p>

      {extra}

      <ActionButton
        onClick={onContinue}
        size="md"
        fullWidth={fullWidthButton}
      >
        {buttonLabel}
      </ActionButton>
    </motion.div>
  );
}
