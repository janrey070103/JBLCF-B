import { useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ToastCtx } from './toastContext.js';

// Toast system. Per spec: Yellow is used for highlight/alert states. We expose
// four tones — 'info'/'alert' both render on Yellow (alert is the spec-mandated
// highlight), success/error use the desaturated semantic colors.
//
// Usage from any controller/view:
//   const toast = useToast();
//   toast.alert('Student marked late');  // Yellow
//   toast.success('Saved');
//   toast.error('QR not recognized');

const TONES = {
  info: 'bg-secondary text-primary-800 border-secondary-600',
  alert: 'bg-secondary-400 text-primary-900 border-secondary-700',
  success: 'bg-success-light text-success border-success/30',
  error: 'bg-error-light text-error border-error/30',
};

const ICONS = {
  info: 'M12 9v4m0 4h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z',
  alert: 'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  success: 'M20 6 9 17l-5-5',
  error: 'M18 6 6 18M6 6l12 12',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (tone, message, duration = 3500) => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, tone, message }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      info: (m, d) => push('info', m, d),
      alert: (m, d) => push('alert', m, d),
      success: (m, d) => push('success', m, d),
      error: (m, d) => push('error', m, d),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          aria-atomic="true"
          className="fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pointer-events-none md:bottom-4 md:right-4 md:left-auto md:items-end"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={['pointer-events-auto flex items-start gap-3 w-full max-w-sm px-4 py-3 border rounded-container shadow-elevated', TONES[t.tone]].join(' ')}
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mt-0.5 shrink-0"
              >
                <path d={ICONS[t.tone]} />
              </svg>
              <p className="flex-1 text-sm font-medium">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="opacity-70 hover:opacity-100"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}
