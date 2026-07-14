import React from 'react';

type CardElevation = 'sm' | 'md' | 'lg' | 'xl';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: CardElevation;
  noPadding?: boolean;
}

const elevationClasses: Record<CardElevation, string> = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ elevation = 'md', noPadding = false, className = '', children, ...props }, ref) => {
    const combinedClasses = `
      bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700
      ${elevationClasses[elevation]}
      ${!noPadding ? 'p-6' : ''}
      ${className}
    `.trim();

    return (
      <div ref={ref} className={combinedClasses} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <div className="pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-700 flex items-start justify-between">
    <div>
      {title && <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>}
      {subtitle && <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

CardHeader.displayName = 'CardHeader';

export const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-4">{children}</div>
);

CardContent.displayName = 'CardContent';

export const CardFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700 flex gap-3 justify-end">
    {children}
  </div>
);

CardFooter.displayName = 'CardFooter';
