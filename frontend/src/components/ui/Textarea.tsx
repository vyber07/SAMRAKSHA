import React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: 'field' | 'outlined' | 'glass';
  showCount?: boolean;
  maxLength?: number;
  isMonospace?: boolean;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      variant = 'glass',
      showCount = false,
      maxLength,
      isMonospace = false,
      containerClassName,
      className,
      id,
      value,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    const variantClasses = {
      field:
        'bg-slate-100/80 text-[#1C1B1F] border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#004B87] focus:ring-2 focus:ring-[#004B87]/20 dark:bg-[#1E1E1E]/80 dark:text-[#E6E1E5] dark:border-white/10 dark:hover:border-white/20 dark:focus:bg-[#1E1E1E] dark:focus:border-[#A8CAFF] dark:focus:ring-[#A8CAFF]/20',
      outlined:
        'bg-transparent text-[#1C1B1F] border border-slate-300 hover:border-slate-400 focus:border-[#004B87] focus:ring-2 focus:ring-[#004B87]/20 dark:bg-transparent dark:text-[#E6E1E5] dark:border-white/20 dark:hover:border-white/30 dark:focus:border-[#A8CAFF] dark:focus:ring-[#A8CAFF]/20',
      glass:
        'textarea-glass bg-white/40 backdrop-blur-md text-[#1C1B1F] border border-white/60 hover:bg-white/60 focus:bg-white/80 focus:border-[#004B87] focus:ring-2 focus:ring-[#004B87]/20 dark:bg-white/5 dark:backdrop-blur-md dark:text-[#E6E1E5] dark:border-white/10 dark:hover:bg-white/10 dark:focus:bg-white/15 dark:focus:border-[#A8CAFF]',
    };

    const currentLength = value !== undefined && value !== null ? String(value).length : 0;

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-montserrat font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative w-full">
          <textarea
            id={textareaId}
            ref={ref}
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            disabled={disabled}
            className={cn(
              'w-full min-h-[100px] p-3 text-sm rounded-xl transition-all duration-200 outline-none resize-y placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed',
              variantClasses[variant],
              isMonospace ? 'font-mono tracking-wider' : 'font-inter',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400/20',
              className
            )}
            {...props}
          />
        </div>

        <div className="flex items-center justify-between">
          {error ? (
            <span className="text-xs font-inter text-red-500 dark:text-red-400">{error}</span>
          ) : helperText ? (
            <span className="text-xs font-inter text-slate-500 dark:text-slate-400">{helperText}</span>
          ) : <span />}

          {showCount && maxLength !== undefined && (
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
