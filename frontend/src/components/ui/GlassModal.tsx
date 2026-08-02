import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type GlassModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: GlassModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
}) => {
  const generatedId = useId();
  const titleId = `modal-title-${generatedId}`;
  const subtitleId = `modal-subtitle-${generatedId}`;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const sizeClasses = clsx(
    size === 'sm' && 'max-w-md',
    size === 'md' && 'max-w-lg',
    size === 'lg' && 'max-w-2xl',
    size === 'xl' && 'max-w-4xl',
    size === 'full' && 'max-w-7xl h-[90vh]'
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
      onClick={() => closeOnOverlayClick && onClose()}
      role="presentation"
    >
      <div
        className={twMerge(
          clsx(
            'glass-modal relative w-full rounded-3xl bg-white/90 dark:bg-[#1E1E1E]/95 backdrop-blur-2xl border border-white/40 dark:border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200',
            sizeClasses,
            className
          )
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={subtitle ? subtitleId : undefined}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
            <div>
              {title && (
                <h2 id={titleId} className="font-montserrat font-bold text-xl text-slate-900 dark:text-white">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p id={subtitleId} className="text-xs text-slate-500 dark:text-slate-400 font-inter mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Content */}
        <div className="overflow-y-auto p-6 flex-1 text-slate-800 dark:text-slate-200">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
