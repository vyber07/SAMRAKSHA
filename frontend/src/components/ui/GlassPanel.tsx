import React, { useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type GlassPanelVariant = 'default' | 'subtle' | 'opaque';
export type GlassPanelPadding = 'none' | 'sm' | 'md' | 'lg';

export interface GlassPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: GlassPanelVariant;
  padding?: GlassPanelPadding;
  className?: string;
  as?: React.ElementType;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  title,
  subtitle,
  headerActions,
  footer,
  variant = 'default',
  padding = 'md',
  className,
  as: Component = 'section',
  ...props
}) => {
  const generatedId = useId();
  const titleId = title ? `glass-panel-title-${generatedId}` : undefined;

  const classes = twMerge(
    clsx(
      'glass-panel rounded-3xl border border-white/30 dark:border-white/15 shadow-xl flex flex-col overflow-hidden',
      variant === 'default' && 'bg-white/80 dark:bg-[#1E1E1E]/85 backdrop-blur-xl',
      variant === 'subtle' && 'bg-white/40 dark:bg-[#1E1E1E]/40 backdrop-blur-md border-white/20 dark:border-white/10',
      variant === 'opaque' && 'bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-2xl',
      className
    )
  );

  const paddingClasses = clsx(
    padding === 'none' && 'p-0',
    padding === 'sm' && 'p-3 sm:p-4',
    padding === 'md' && 'p-4 sm:p-6',
    padding === 'lg' && 'p-6 sm:p-8'
  );

  return (
    <Component className={classes} aria-labelledby={titleId} {...props}>
      {(title || subtitle || headerActions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <div>
            {title && (
              <h3 id={titleId} className="font-montserrat font-bold text-lg text-slate-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 font-inter mt-0.5">{subtitle}</p>}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}
      <div className={clsx('flex-1', paddingClasses)}>{children}</div>
      {footer && (
        <div className="px-6 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
          {footer}
        </div>
      )}
    </Component>
  );
};
