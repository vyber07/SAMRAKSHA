import React from 'react';

type AlertVariant = 'success' | 'danger' | 'warning' | 'info';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  dismissible?: boolean;
  onClose?: () => void;
}

const variantClasses: Record<AlertVariant, string> = {
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-100',
  danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-100',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-100',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-100',
};

const iconMap: Record<AlertVariant, string> = {
  success: '✓',
  danger: '⚠',
  warning: '⚡',
  info: 'ⓘ',
};

const baseClasses = 'flex items-start gap-3 p-4 rounded-md border';

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'info',
      title,
      dismissible = false,
      onClose,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

    return (
      <div ref={ref} className={combinedClasses} {...props}>
        <div className="flex-shrink-0 mt-0.5 text-lg">{iconMap[variant]}</div>
        <div className="flex-1">
          {title && <h4 className="font-medium mb-1">{title}</h4>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={onClose}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Close alert"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';
