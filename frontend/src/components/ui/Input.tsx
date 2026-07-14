import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, required, className = '', ...props }, ref) => {
    const inputClasses = `
      w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md
      bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100
      placeholder-neutral-400 dark:placeholder-neutral-600
      focus:ring-4 focus:ring-primary-100 focus:border-primary-500 focus:outline-none
      disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50
      transition-colors duration-200
      ${error ? 'border-danger focus:border-danger focus:ring-red-100' : ''}
      ${icon ? 'pl-10' : ''}
      ${className}
    `.trim();

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={inputClasses}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-neutral-500 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
