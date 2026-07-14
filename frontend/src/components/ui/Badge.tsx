import React from 'react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'neutral';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  removable?: boolean;
  onRemove?: () => void;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border border-green-200 dark:border-green-800',
  danger: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border border-red-200 dark:border-red-800',
  warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 border border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border border-blue-200 dark:border-blue-800',
  primary: 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 border border-primary-200 dark:border-primary-800',
  neutral: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700',
};

const baseClasses = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors';

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'primary',
      removable = false,
      onRemove,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

    return (
      <span ref={ref} className={combinedClasses} {...props}>
        {children}
        {removable && (
          <button
            onClick={onRemove}
            className="ml-1 hover:opacity-70 focus:outline-none"
            aria-label="Remove badge"
          >
            ✕
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
