import { useEffect } from 'react';
import { createPortal } from 'react-dom';

// Accessible modal. Renders into document.body via portal, traps Escape to close,
// locks body scroll while open. Mobile-first: full-width on small screens,
// capped + centered on md and up.
export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxW = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size] ?? 'max-w-lg';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-primary-900/40 backdrop-blur-sm"
      />
      <div
        className={[
          'relative w-full bg-white shadow-elevated rounded-container',
          'rounded-b-none md:rounded-container',
          maxW,
        ].join(' ')}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-primary-100">
          <h2 className="text-lg font-semibold text-primary">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-primary-400 hover:text-primary p-1 rounded-nested focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <footer className="flex flex-col-reverse md:flex-row md:justify-end gap-2 px-6 py-4 border-t border-primary-100">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
