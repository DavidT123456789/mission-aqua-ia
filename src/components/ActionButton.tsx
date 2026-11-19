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
    ? 'bg-rose-600 text-white border border-rose-400/40 animate-shake'
    : disabled
    ? 'bg-white/[0.04] text-slate-500 border border-white/[0.06] cursor-not-allowed'
    : variant === 'danger'
    ? 'bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white border border-rose-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_18px_rgba(244,63,94,0.2)] active:scale-[0.985]'
    : variant === 'secondary'
    ? 'bg-white/[0.06] hover:bg-white/[0.11] text-slate-200 hover:text-white border border-white/10 hover:border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] active:scale-[0.985]'
    : variant === 'ghost'
    ? 'bg-slate-950/40 hover:bg-white/[0.07] text-slate-300 hover:text-white border border-white/[0.08] hover:border-white/15 active:scale-[0.985]'
    : 'bg-gradient-to-r from-emerald-400/85 via-teal-400/85 to-cyan-400/85 hover:from-emerald-400/95 hover:via-teal-400/95 hover:to-cyan-400/95 text-slate-950 font-extrabold border border-cyan-200/35 hover:border-cyan-200/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_6px_20px_rgba(6,182,212,0.12)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_8px_22px_rgba(20,184,166,0.24)] active:scale-[0.985]';

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
