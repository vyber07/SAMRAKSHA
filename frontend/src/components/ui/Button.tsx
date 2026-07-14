import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus:ring-primary-100',
  secondary: 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-neutral-600 focus:ring-neutral-100',
  danger: 'bg-danger text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-100',
  ghost: 'text-primary-500 border border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 focus:ring-primary-100',
  link: 'text-primary-500 underline-offset-4 hover:underline dark:text-primary-400 focus:ring-primary-100',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-8 px-2 text-xs rounded',
  sm: 'h-9 px-3 text-sm rounded-md',
  md: 'h-10 px-4 text-base rounded-md',
  lg: 'h-11 px-6 text-base rounded-md',
  xl: 'h-12 px-8 text-lg rounded-md',
};

const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap ring-offset-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-neutral-950';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      disabled = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedClasses}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {isLoading ? loadingText || children : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
