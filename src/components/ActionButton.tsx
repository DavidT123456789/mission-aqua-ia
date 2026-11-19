import React from 'react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isError?: boolean;
  fullWidth?: boolean;
}

export default function ActionButton({
  variant = 'primary',
  size = 'lg',
  isError = false,
  fullWidth = false,
  disabled,
  type = 'button',
  className = '',
  children,
  ...props
}: ActionButtonProps) {
  const sizeClasses =
    size === 'sm'
      ? 'px-4 py-2.5 text-xs sm:text-sm font-semibold'
      : size === 'md'
      ? 'px-6 py-3 text-sm sm:text-[15px] font-bold tracking-wide'
      : 'px-8 py-3.5 text-base sm:text-lg font-bold tracking-wide';

  const stateClasses = isError
    ? 'bg-red-600 text-white border border-red-400/40 animate-shake'
    : disabled
    ? 'bg-slate-800/80 text-slate-500 border border-white/5 cursor-not-allowed'
    : variant === 'danger'
    ? 'bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white border border-red-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_14px_rgba(239,68,68,0.22)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_0_20px_rgba(239,68,68,0.38)] active:scale-[0.985]'
    : variant === 'secondary'
    ? 'bg-slate-800/85 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-white/10 hover:border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] active:scale-[0.985]'
    : variant === 'ghost'
    ? 'bg-slate-950/50 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-white/[0.08] hover:border-white/15 active:scale-[0.985]'
    : 'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white border border-emerald-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_14px_rgba(16,185,129,0.22)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_0_20px_rgba(16,185,129,0.38)] active:scale-[0.985]';

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-sans leading-tight transition-all duration-150 [&_svg]:shrink-0 ${sizeClasses} ${
        fullWidth ? 'w-full' : ''
      } ${stateClasses} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
