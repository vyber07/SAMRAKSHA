import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'alert' | 'success' | 'glass' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: LucideIcon | React.ReactNode;
  rightIcon?: LucideIcon | React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const renderIcon = (icon: LucideIcon | React.ReactNode, iconSizeClass: string) => {
      if (!icon) return null;
      if (typeof icon === 'function' || (typeof icon === 'object' && 'render' in (icon as object))) {
        const IconComponent = icon as LucideIcon;
        return <IconComponent className={cn(iconSizeClass, 'shrink-0')} />;
      }
      return <span className="shrink-0">{icon}</span>;
    };

    const iconSizeMap = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'btn-primary bg-[#004B87] text-white hover:bg-[#003966] active:bg-[#002B4D] dark:bg-[#A8CAFF] dark:text-[#001D36] dark:hover:bg-[#C2DCFF] shadow-md shadow-[#004B87]/20 dark:shadow-none focus-visible:ring-[#004B87] dark:focus-visible:ring-[#A8CAFF] relative overflow-hidden',
      secondary:
        'btn-secondary bg-[#006B5E] text-white hover:bg-[#005449] active:bg-[#003D35] dark:bg-[#80F7EB] dark:text-[#003730] dark:hover:bg-[#A0FAF0] shadow-sm focus-visible:ring-[#006B5E]',
      alert:
        'btn-alert bg-[#C62828] text-white hover:bg-[#B71C1C] active:bg-[#8E0000] dark:bg-[#EF5350] dark:text-[#410002] dark:hover:bg-[#FF867C] shadow-md shadow-[#C62828]/25 focus-visible:ring-[#C62828]',
      success:
        'btn-success bg-[#2E7D32] text-white hover:bg-[#1B5E20] active:bg-[#0D3B10] dark:bg-[#81C784] dark:text-[#0C3B0E] dark:hover:bg-[#A5D6A7] shadow-sm focus-visible:ring-[#2E7D32]',
      glass:
        'btn-glass bg-white/60 text-[#1C1B1F] border border-white/40 backdrop-blur-md hover:bg-white/80 active:bg-white dark:bg-white/10 dark:text-[#E6E1E5] dark:border-white/15 dark:hover:bg-white/20 shadow-sm focus-visible:ring-white/50',
      text:
        'btn-text bg-transparent text-[#004B87] hover:bg-[#004B87]/10 active:bg-[#004B87]/20 dark:text-[#A8CAFF] dark:hover:bg-[#A8CAFF]/10 focus-visible:ring-[#004B87]',
    };

    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-10 px-4 text-sm rounded-xl gap-2',
      lg: 'h-12 px-6 text-base rounded-2xl gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          'inline-flex items-center justify-center font-montserrat font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#121212] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className={cn('animate-spin shrink-0', iconSizeMap[size])} />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {LeftIcon && renderIcon(LeftIcon, iconSizeMap[size])}
            {children && <span>{children}</span>}
            {RightIcon && renderIcon(RightIcon, iconSizeMap[size])}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
