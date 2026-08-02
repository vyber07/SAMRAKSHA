import React from 'react';
import { LucideIcon, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  variant?: 'field' | 'outlined' | 'glass';
  selectSize?: 'sm' | 'md' | 'lg';
  leftIcon?: LucideIcon | React.ReactNode;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options = [],
      placeholder,
      variant = 'field',
      selectSize = 'md',
      leftIcon: LeftIcon,
      containerClassName,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

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

    const variantClasses = {
      field:
        'select-dropdown bg-slate-100/80 text-[#1C1B1F] border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#004B87] focus:ring-2 focus:ring-[#004B87]/20 dark:bg-[#1E1E1E]/80 dark:text-[#E6E1E5] dark:border-white/10 dark:hover:border-white/20 dark:focus:bg-[#1E1E1E] dark:focus:border-[#A8CAFF] dark:focus:ring-[#A8CAFF]/20',
      outlined:
        'select-dropdown bg-transparent text-[#1C1B1F] border border-slate-300 hover:border-slate-400 focus:border-[#004B87] focus:ring-2 focus:ring-[#004B87]/20 dark:bg-transparent dark:text-[#E6E1E5] dark:border-white/20 dark:hover:border-white/30 dark:focus:border-[#A8CAFF] dark:focus:ring-[#A8CAFF]/20',
      glass:
        'select-dropdown bg-white/40 backdrop-blur-md text-[#1C1B1F] border border-white/60 hover:bg-white/60 focus:bg-white/80 focus:border-[#004B87] focus:ring-2 focus:ring-[#004B87]/20 dark:bg-white/5 dark:backdrop-blur-md dark:text-[#E6E1E5] dark:border-white/10 dark:hover:bg-white/10 dark:focus:bg-white/15 dark:focus:border-[#A8CAFF]',
    };

    const sizeClasses = {
      sm: 'h-8 text-xs pl-2.5 pr-8 rounded-lg',
      md: 'h-10 text-sm pl-3 pr-9 rounded-xl',
      lg: 'h-12 text-base pl-4 pr-11 rounded-2xl',
    };

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-montserrat font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {LeftIcon && (
            <div className="absolute left-3 pointer-events-none flex items-center justify-center">
              {renderIcon(LeftIcon, iconSizeMap[selectSize])}
            </div>
          )}

          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full appearance-none font-inter transition-all duration-200 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
              variantClasses[variant],
              sizeClasses[selectSize],
              LeftIcon && (selectSize === 'sm' ? 'pl-8' : selectSize === 'lg' ? 'pl-11' : 'pl-9'),
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400/20',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-slate-400 dark:bg-[#1E1E1E]">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-white text-[#1C1B1F] dark:bg-[#1E1E1E] dark:text-[#E6E1E5]"
              >
                {opt.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3 pointer-events-none flex items-center justify-center text-slate-400 dark:text-slate-500">
            <ChevronDown className={iconSizeMap[selectSize]} />
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

Select.displayName = 'Select';
