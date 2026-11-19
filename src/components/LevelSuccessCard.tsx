import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, type LucideIcon } from 'lucide-react';
import ActionButton from './ActionButton';

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center bg-emerald-950/35 border border-emerald-500/45 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
        compact ? 'p-5' : 'mt-5 p-5 sm:p-6'
      } ${className}`.trim()}
    >
      <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-lg sm:text-xl mb-3 text-center text-balance">
        <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />
        <span>{title}</span>
      </div>

      <p className={`text-center text-sm text-emerald-100/90 leading-relaxed max-w-2xl text-balance ${extra ? 'mb-4' : 'mb-5'}`}>
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
