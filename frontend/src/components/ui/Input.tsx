import React from 'react';
import { LucideIcon, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type InputVariant = 'field' | 'outlined' | 'glass';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: InputVariant;
  inputSize?: InputSize;
  leftIcon?: LucideIcon | React.ReactNode;
  rightIcon?: LucideIcon | React.ReactNode;
  isMonospace?: boolean;
  onClear?: () => void;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      variant = 'field',
      inputSize = 'md',
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      isMonospace = false,
      onClear,
      containerClassName,
      className,
      id,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const renderIcon = (icon: LucideIcon | React.ReactNode, iconSizeClass: string) => {
      if (!icon) return null;
      if (typeof icon === 'function' || (typeof icon === 'object' && 'render' in (icon as object))) {
        const IconComponent = icon as LucideIcon;
        return <IconComponent className={cn(iconSizeClass, 'text-slate-400 dark:text-slate-500 shrink-0')} />;
      }
      return <span className="text-slate-400 dark:text-slate-500 shrink-0">{icon}</span>;
    };

    const iconSizeMap = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    const variantClasses: Record<InputVariant, string> = {
      field:
        'input-field bg-slate-100/80 text-[#1C1B1F] border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#004B87] focus:ring-2 focus:ring-[#004B87]/20 dark:bg-[#1E1E1E]/80 dark:text-[#E6E1E5] dark:border-white/10 dark:hover:border-white/20 dark:focus:bg-[#1E1E1E] dark:focus:border-[#A8CAFF] dark:focus:ring-[#A8CAFF]/20',
      outlined:
        'input-outlined bg-transparent text-[#1C1B1F] border border-slate-300 hover:border-slate-400 focus:border-[#004B87] focus:ring-2 focus:ring-[#004B87]/20 dark:bg-transparent dark:text-[#E6E1E5] dark:border-white/20 dark:hover:border-white/30 dark:focus:border-[#A8CAFF] dark:focus:ring-[#A8CAFF]/20',
      glass:
        'input-glass bg-white/40 backdrop-blur-md text-[#1C1B1F] border border-white/60 hover:bg-white/60 focus:bg-white/80 focus:border-[#004B87] focus:ring-2 focus:ring-[#004B87]/20 dark:bg-white/5 dark:backdrop-blur-md dark:text-[#E6E1E5] dark:border-white/10 dark:hover:bg-white/10 dark:focus:bg-white/15 dark:focus:border-[#A8CAFF]',
    };

    const sizeClasses: Record<InputSize, string> = {
      sm: 'h-8 text-xs px-2.5 rounded-lg',
      md: 'h-10 text-sm px-3 rounded-xl',
      lg: 'h-12 text-base px-4 rounded-2xl',
    };

    const hasValue = value !== undefined && value !== null && String(value).length > 0;

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-montserrat font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {LeftIcon && (
            <div className="absolute left-3 pointer-events-none flex items-center justify-center">
              {renderIcon(LeftIcon, iconSizeMap[inputSize])}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            value={value}
            disabled={disabled}
            className={cn(
              'w-full transition-all duration-200 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed',
              variantClasses[variant],
              sizeClasses[inputSize],
              isMonospace && 'font-mono tracking-wider',
              !isMonospace && 'font-inter',
              LeftIcon && (inputSize === 'sm' ? 'pl-8' : inputSize === 'lg' ? 'pl-11' : 'pl-9'),
              (RightIcon || onClear) && (inputSize === 'sm' ? 'pr-8' : inputSize === 'lg' ? 'pr-11' : 'pr-9'),
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400/20',
              className
            )}
            {...props}
          />

          <div className="absolute right-3 flex items-center gap-1.5">
            {onClear && hasValue && !disabled && (
              <button
                type="button"
                onClick={onClear}
                aria-label="Clear input"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-full"
              >
                <X className={iconSizeMap[inputSize]} />
              </button>
            )}
            {RightIcon && renderIcon(RightIcon, iconSizeMap[inputSize])}
          </div>
        </div>

        {error ? (
          <span className="text-xs font-inter text-red-500 dark:text-red-400">{error}</span>
        ) : helperText ? (
          <span className="text-xs font-inter text-slate-500 dark:text-slate-400">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
