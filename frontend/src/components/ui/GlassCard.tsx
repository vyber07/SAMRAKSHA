import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type GlassCardVariant = 'flat' | 'raised' | 'elevated';
export type GlassCardBorderAccent = 'none' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type GlassCardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: GlassCardVariant;
  borderAccent?: GlassCardBorderAccent;
  hoverable?: boolean;
  clickable?: boolean;
  padding?: GlassCardPadding;
  className?: string;
  as?: React.ElementType;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'raised',
  borderAccent = 'none',
  hoverable = false,
  clickable = false,
  padding = 'md',
  className,
  as: Component = 'div',
  onClick,
  onKeyDown,
  ...props
}) => {
  const isInteractive = clickable || !!onClick;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
    onKeyDown?.(e);
  };

  const classes = twMerge(
    clsx(
      'glass-card rounded-2xl border transition-all duration-200',
      // Variant
      variant === 'flat' && 'bg-white/50 dark:bg-[#1E1E1E]/50 border-white/10 dark:border-white/5 shadow-none backdrop-blur-sm',
      variant === 'raised' && 'bg-white/75 dark:bg-[#1E1E1E]/75 border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/30 backdrop-blur-md',
      variant === 'elevated' && 'bg-white/90 dark:bg-[#1E1E1E]/90 border-white/30 dark:border-white/20 shadow-xl backdrop-blur-lg',
      // Padding
      padding === 'none' && 'p-0',
      padding === 'sm' && 'p-3 sm:p-4',
      padding === 'md' && 'p-4 sm:p-6',
      padding === 'lg' && 'p-6 sm:p-8',
      // Border Accent
      borderAccent === 'primary' && 'border-l-4 border-l-[#004B87] dark:border-l-[#A8CAFF]',
      borderAccent === 'success' && 'border-l-4 border-l-[#2E7D32] dark:border-l-[#81C784]',
      borderAccent === 'warning' && 'border-l-4 border-l-[#F57C00] dark:border-l-[#FFB74D]',
      borderAccent === 'error' && 'border-l-4 border-l-[#C62828] dark:border-l-[#EF5350]',
      borderAccent === 'info' && 'border-l-4 border-l-[#0288D1] dark:border-l-[#64B5F6]',
      // Hoverable / Interactive
      (hoverable || isInteractive) && 'hover:-translate-y-0.5 hover:shadow-xl hover:border-white/40 dark:hover:border-white/25',
      isInteractive && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#004B87] dark:focus:ring-[#A8CAFF]',
      className
    )
  );

  return (
    <Component
      className={classes}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
      {...props}
    >
      {children}
    </Component>
  );
};
