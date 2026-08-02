import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'glass' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  dot?: boolean;
  pulseDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  dot = false,
  pulseDot = false,
  className,
  ...props
}) => {
  const classes = twMerge(
    clsx(
      'inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors border select-none',
      // Sizes
      size === 'sm' && 'text-[10px] px-2 py-0.5',
      size === 'md' && 'text-xs px-2.5 py-0.5',
      size === 'lg' && 'text-xs px-3 py-1',
      // Variants
      variant === 'primary' && 'bg-[#004B87]/10 dark:bg-[#A8CAFF]/15 text-[#004B87] dark:text-[#A8CAFF] border-[#004B87]/20 dark:border-[#A8CAFF]/30',
      variant === 'secondary' && 'bg-[#006B5E]/10 dark:bg-[#80F7EB]/15 text-[#006B5E] dark:text-[#80F7EB] border-[#006B5E]/20 dark:border-[#80F7EB]/30',
      variant === 'success' && 'bg-[#2E7D32]/10 dark:bg-[#81C784]/15 text-[#2E7D32] dark:text-[#81C784] border-[#2E7D32]/20 dark:border-[#81C784]/30',
      variant === 'warning' && 'bg-[#F57C00]/10 dark:bg-[#FFB74D]/15 text-[#D97300] dark:text-[#FFB74D] border-[#F57C00]/20 dark:border-[#FFB74D]/30',
      variant === 'error' && 'bg-[#C62828]/10 dark:bg-[#EF5350]/15 text-[#C62828] dark:text-[#EF5350] border-[#C62828]/20 dark:border-[#EF5350]/30',
      variant === 'info' && 'bg-[#0288D1]/10 dark:bg-[#64B5F6]/15 text-[#0288D1] dark:text-[#64B5F6] border-[#0288D1]/20 dark:border-[#64B5F6]/30',
      variant === 'glass' && 'bg-white/40 dark:bg-white/10 text-slate-800 dark:text-slate-200 border-white/30 dark:border-white/15 backdrop-blur-sm',
      variant === 'neutral' && 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      className
    )
  );

  const dotClasses = clsx(
    'w-1.5 h-1.5 rounded-full',
    variant === 'primary' && 'bg-[#004B87] dark:bg-[#A8CAFF]',
    variant === 'secondary' && 'bg-[#006B5E] dark:bg-[#80F7EB]',
    variant === 'success' && 'bg-[#2E7D32] dark:bg-[#81C784]',
    variant === 'warning' && 'bg-[#F57C00] dark:bg-[#FFB74D]',
    variant === 'error' && 'bg-[#C62828] dark:bg-[#EF5350]',
    variant === 'info' && 'bg-[#0288D1] dark:bg-[#64B5F6]',
    (variant === 'glass' || variant === 'neutral') && 'bg-slate-500'
  );

  return (
    <span className={classes} {...props}>
      {(dot || pulseDot) && (
        <span className="relative flex h-1.5 w-1.5">
          {pulseDot && <span className={clsx('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', dotClasses)} />}
          <span className={clsx('relative inline-flex h-1.5 w-1.5 rounded-full', dotClasses)} />
        </span>
      )}
      {icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{icon}</span>}
      {children}
    </span>
  );
};
