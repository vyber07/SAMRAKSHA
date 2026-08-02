import React, { useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ToggleSize = 'sm' | 'md' | 'lg';

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  size?: ToggleSize;
  disabled?: boolean;
  labelPosition?: 'left' | 'right';
  iconOn?: React.ReactNode;
  iconOff?: React.ReactNode;
  className?: string;
  id?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  size = 'md',
  disabled = false,
  labelPosition = 'right',
  iconOn,
  iconOff,
  className,
  id: propId,
  ...props
}) => {
  const generatedId = useId();
  const inputId = propId || `toggle-input-${generatedId}`;

  const trackClasses = clsx(
    'relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer select-none',
    disabled && 'opacity-50 cursor-not-allowed',
    checked ? 'bg-[#004B87] dark:bg-[#003D73]' : 'bg-slate-300 dark:bg-slate-700',
    size === 'sm' && 'w-8 h-4.5',
    size === 'md' && 'w-11 h-6',
    size === 'lg' && 'w-14 h-7.5'
  );

  const thumbClasses = clsx(
    'inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center text-slate-600',
    size === 'sm' && clsx('w-3.5 h-3.5 ml-0.5', checked ? 'translate-x-3.5' : 'translate-x-0'),
    size === 'md' && clsx('w-5 h-5 ml-0.5', checked ? 'translate-x-5' : 'translate-x-0'),
    size === 'lg' && clsx('w-6.5 h-6.5 ml-0.5', checked ? 'translate-x-6.5' : 'translate-x-0')
  );

  return (
    <label htmlFor={inputId} className={twMerge(clsx('inline-flex items-center gap-3', disabled ? 'cursor-not-allowed' : 'cursor-pointer', className))}>
      {label && labelPosition === 'left' && (
        <div className="text-right">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</span>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      )}

      <div className={trackClasses}>
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
          {...props}
        />
        <span className={thumbClasses}>
          {checked ? iconOn : iconOff}
        </span>
      </div>

      {label && labelPosition === 'right' && (
        <div>
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</span>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      )}
    </label>
  );
};
