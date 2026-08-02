import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type AlertVariant = 'error' | 'warning' | 'success' | 'info';

export interface AlertCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: AlertVariant;
  title?: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  action?: React.ReactNode;
  pulsing?: boolean;
  timestamp?: string;
  className?: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  variant = 'error',
  title,
  children,
  icon,
  onClose,
  action,
  pulsing = false,
  timestamp,
  className,
  ...props
}) => {
  const defaultIcon = {
    error: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />,
  }[variant];

  const classes = twMerge(
    clsx(
      'alert-card rounded-2xl border p-4 shadow-sm backdrop-blur-md flex items-start gap-3.5 transition-all duration-200',
      variant === 'error' && 'alert-error bg-red-500/10 dark:bg-red-900/30 border-red-500/30 text-red-900 dark:text-red-200',
      variant === 'warning' && 'alert-warning bg-amber-500/10 dark:bg-amber-900/30 border-amber-500/30 text-amber-900 dark:text-amber-200',
      variant === 'success' && 'alert-success bg-emerald-500/10 dark:bg-emerald-900/30 border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
      variant === 'info' && 'alert-info bg-sky-500/10 dark:bg-sky-900/30 border-sky-500/30 text-sky-900 dark:text-sky-200',
      pulsing && 'pulse-alert animate-[pulse-alert_2s_infinite]',
      className
    )
  );

  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';

  return (
    <div className={classes} role={role} {...props}>
      {icon !== undefined ? icon : defaultIcon}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          {title && <h4 className="font-montserrat font-semibold text-sm leading-tight">{title}</h4>}
          {timestamp && <span className="text-[10px] opacity-70 font-mono shrink-0">{timestamp}</span>}
        </div>
        {children && <div className="text-xs font-inter mt-1 leading-relaxed opacity-90">{children}</div>}
        {action && <div className="mt-2.5 flex items-center gap-2">{action}</div>}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-opacity shrink-0"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
